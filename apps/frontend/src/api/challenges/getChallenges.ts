import { getConfig } from "@repo/config"
import { compareAddresses } from "@repo/utils/AddressUtils"
import { B3TRChallenges__factory } from "@vechain/vebetterdao-contracts/typechain-types"
import { decodeEventLog, ThorClient, executeMultipleClausesCall } from "@vechain/vechain-kit"
import { ethers } from "ethers"

import {
  ChallengeKind,
  ChallengeDetail,
  SettlementMode,
  ChallengeStatus,
  ChallengeTab,
  ChallengeView,
  ChallengeVisibility,
  ParticipantStatus,
} from "./types"

const contractAbi = B3TRChallenges__factory.abi
const abi = contractAbi as any
const ZERO_ADDR = "0x0000000000000000000000000000000000000000"
const challengeCreatedEventName = "ChallengeCreated" as const
const payoutClaimedEventName = "ChallengePayoutClaimed" as const
const refundClaimedEventName = "ChallengeRefundClaimed" as const

const getAddress = () => getConfig().challengesContractAddress as `0x${string}`

async function fetchChallengeIdsByEvent(
  thor: ThorClient,
  address: `0x${string}`,
  viewerAddress: string,
  eventName: string,
): Promise<Set<number>> {
  const eventAbi = thor.contracts.load(address, abi).getEventAbi(eventName)
  const topics = eventAbi.encodeFilterTopicsNoNull({ account: viewerAddress })
  const logs = await thor.logs.filterEventLogs({
    criteriaSet: [
      {
        criteria: {
          address,
          topic0: topics[0] ?? undefined,
          topic1: topics[1] ?? undefined,
          topic2: topics[2] ?? undefined,
        },
        eventAbi,
      },
    ],
    options: { limit: 1000 },
  })

  const ids = new Set<number>()
  for (const log of logs) {
    const event = decodeEventLog(log, contractAbi)
    if (event.decodedData.eventName === eventName && "challengeId" in event.decodedData.args) {
      ids.add(Number(event.decodedData.args.challengeId))
    }
  }

  return ids
}

async function fetchChallengeCreationTimestamps(
  thor: ThorClient,
  address: `0x${string}`,
  limit: number,
  challengeId?: number,
): Promise<Map<number, number>> {
  const eventAbi = thor.contracts.load(address, abi).getEventAbi(challengeCreatedEventName)
  const topics = eventAbi.encodeFilterTopicsNoNull(challengeId ? { challengeId: BigInt(challengeId) } : {})
  const logs = await thor.logs.filterEventLogs({
    criteriaSet: [
      {
        criteria: {
          address,
          topic0: topics[0] ?? undefined,
          topic1: topics[1] ?? undefined,
          topic2: topics[2] ?? undefined,
          topic3: topics[3] ?? undefined,
        },
        eventAbi,
      },
    ],
    options: { limit },
  })

  const creationTimestamps = new Map<number, number>()
  for (const log of logs) {
    const event = decodeEventLog(log, contractAbi)
    if (event.decodedData.eventName === challengeCreatedEventName) {
      creationTimestamps.set(Number(event.decodedData.args.challengeId), log.meta.blockTimestamp)
    }
  }

  return creationTimestamps
}

function parseChallengeView(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  raw: any,
  viewerAddress: string | undefined,
  viewerStatus: number,
  viewerEligible: boolean,
  viewerActions: bigint,
  currentRound: number,
  createdAt = 0,
  hasClaimed = false,
  hasRefunded = false,
): ChallengeView & { canFinalize: boolean } {
  const challengeId = Number(raw.challengeId ?? raw[0])
  const kind = Number(raw.kind ?? raw[1]) as ChallengeView["kind"]
  const visibility = Number(raw.visibility ?? raw[2]) as ChallengeView["visibility"]
  const thresholdMode = Number(raw.thresholdMode ?? raw[3]) as ChallengeView["thresholdMode"]
  const status = Number(raw.status ?? raw[4]) as ChallengeView["status"]
  const settlementMode = Number(raw.settlementMode ?? raw[5]) as ChallengeView["settlementMode"]
  const creator = String(raw.creator ?? raw[6])
  const stakeAmount = ethers.formatEther(BigInt(raw.stakeAmount ?? raw[7]))
  const startRound = Number(raw.startRound ?? raw[8])
  const endRound = Number(raw.endRound ?? raw[9])
  const duration = Number(raw.duration ?? raw[10])
  const thresholdValue = BigInt(raw.threshold ?? raw[11])
  const threshold = thresholdValue.toString()
  const allApps = Boolean(raw.allApps ?? raw[12])
  const totalPrize = ethers.formatEther(BigInt(raw.totalPrize ?? raw[13]))
  const participantCount = Number(raw.participantCount ?? raw[14])
  const invitedCount = Number(raw.invitedCount ?? raw[15])
  const declinedCount = Number(raw.declinedCount ?? raw[16])
  const selectedAppsCount = Number(raw.selectedAppsCount ?? raw[17])
  const bestScore = BigInt(raw.bestScore ?? raw[19] ?? 0)

  const isCreator = !!viewerAddress && compareAddresses(creator, viewerAddress)
  const isJoined = viewerStatus === ParticipantStatus.Joined
  const isInvited = viewerStatus === ParticipantStatus.Invited || viewerEligible
  const isPending = status === ChallengeStatus.Pending
  const isInvitationPending = isPending && isInvited && !isJoined

  const canJoinPublic = isPending && visibility === ChallengeVisibility.Public && !isJoined && !isCreator
  const canAcceptInvite = isInvitationPending
  const canAddInvites =
    isPending && visibility === ChallengeVisibility.Private && isCreator && currentRound < startRound
  const canClaim =
    !hasClaimed &&
    status === ChallengeStatus.Finalized &&
    (settlementMode === SettlementMode.CreatorRefund
      ? isCreator
      : isJoined &&
        (settlementMode === SettlementMode.QualifiedSplit
          ? viewerActions >= thresholdValue
          : viewerActions === bestScore))
  const canRefund =
    !hasRefunded &&
    (status === ChallengeStatus.Cancelled || status === ChallengeStatus.Invalid) &&
    (kind === ChallengeKind.Stake ? isJoined : isCreator)

  return {
    challengeId,
    createdAt,
    kind,
    visibility,
    thresholdMode,
    status,
    settlementMode,
    creator,
    stakeAmount,
    totalPrize,
    startRound,
    endRound,
    duration,
    threshold,
    allApps,
    participantCount,
    invitedCount,
    declinedCount,
    selectedAppsCount,
    viewerStatus: viewerStatus as ChallengeView["viewerStatus"],
    isCreator,
    isJoined,
    isInvitationPending,
    canJoin: canJoinPublic && !canAcceptInvite,
    canLeave: isPending && isJoined && !isCreator,
    canAccept: canAcceptInvite,
    canDecline: isInvitationPending && viewerStatus !== ParticipantStatus.Declined,
    canCancel: isPending && isCreator,
    canAddInvites,
    canClaim,
    canRefund,
    canFinalize: status === ChallengeStatus.Active && endRound < currentRound,
  }
}

export function filterByTab(challenges: ChallengeView[], tab: ChallengeTab): ChallengeView[] {
  switch (tab) {
    case "mine":
      return challenges.filter(c => c.isCreator || c.isJoined)
    case "invited":
      return challenges.filter(c => c.isInvitationPending)
    case "public":
      return challenges.filter(c => c.visibility === ChallengeVisibility.Public && c.status === ChallengeStatus.Pending)
    default:
      return challenges
  }
}

export async function fetchAllChallenges(
  thor: ThorClient,
  currentRound: number,
  viewerAddress?: string,
): Promise<ChallengeView[]> {
  const address = getAddress()
  if (!address || address.toLowerCase() === ZERO_ADDR) return []

  const [countResult, claimedChallengeIds, refundedChallengeIds] = await Promise.all([
    executeMultipleClausesCall({
      thor,
      calls: [{ abi, address, functionName: "challengeCount", args: [] }],
    }),
    viewerAddress
      ? fetchChallengeIdsByEvent(thor, address, viewerAddress, payoutClaimedEventName)
      : Promise.resolve(new Set<number>()),
    viewerAddress
      ? fetchChallengeIdsByEvent(thor, address, viewerAddress, refundClaimedEventName)
      : Promise.resolve(new Set<number>()),
  ])
  const [count] = countResult

  const n = Number(count)
  if (n === 0) return []

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const calls: any[] = []
  for (let id = 1; id <= n; id++) {
    calls.push({ abi, address, functionName: "getChallenge", args: [BigInt(id)] })
    if (viewerAddress) {
      calls.push({ abi, address, functionName: "getParticipantStatus", args: [BigInt(id), viewerAddress] })
      calls.push({ abi, address, functionName: "isInvitationEligible", args: [BigInt(id), viewerAddress] })
      calls.push({ abi, address, functionName: "getParticipantActions", args: [BigInt(id), viewerAddress] })
    }
  }

  const [results, creationTimestamps] = await Promise.all([
    executeMultipleClausesCall({ thor, calls }),
    fetchChallengeCreationTimestamps(thor, address, n),
  ])
  const stride = viewerAddress ? 4 : 1
  const challenges: ChallengeView[] = []

  for (let i = 0; i < n; i++) {
    const raw = results[i * stride] as any
    const viewerStatus = viewerAddress ? Number(results[i * stride + 1]) : 0
    const eligible = viewerAddress ? Boolean(results[i * stride + 2]) : false
    const viewerActions = viewerAddress ? BigInt(String(results[i * stride + 3] ?? 0)) : 0n
    const challengeId = Number(raw.challengeId ?? raw[0])
    challenges.push(
      parseChallengeView(
        raw,
        viewerAddress,
        viewerStatus,
        eligible,
        viewerActions,
        currentRound,
        creationTimestamps.get(challengeId) ?? 0,
        claimedChallengeIds.has(challengeId),
        refundedChallengeIds.has(challengeId),
      ),
    )
  }

  return challenges.sort((a, b) => b.createdAt - a.createdAt || b.challengeId - a.challengeId)
}

export async function fetchChallengeDetail(
  thor: ThorClient,
  challengeId: number,
  currentRound: number,
  viewerAddress?: string,
): Promise<ChallengeDetail | null> {
  const address = getAddress()
  if (!address || address.toLowerCase() === ZERO_ADDR) return null
  const [claimedChallengeIds, refundedChallengeIds, creationTimestamps] = await Promise.all([
    viewerAddress
      ? fetchChallengeIdsByEvent(thor, address, viewerAddress, payoutClaimedEventName)
      : Promise.resolve(new Set<number>()),
    viewerAddress
      ? fetchChallengeIdsByEvent(thor, address, viewerAddress, refundClaimedEventName)
      : Promise.resolve(new Set<number>()),
    fetchChallengeCreationTimestamps(thor, address, 1, challengeId),
  ])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const calls: any[] = [
    { abi, address, functionName: "getChallenge", args: [BigInt(challengeId)] },
    { abi, address, functionName: "getChallengeParticipants", args: [BigInt(challengeId)] },
    { abi, address, functionName: "getChallengeInvited", args: [BigInt(challengeId)] },
    { abi, address, functionName: "getChallengeDeclined", args: [BigInt(challengeId)] },
    { abi, address, functionName: "getChallengeSelectedApps", args: [BigInt(challengeId)] },
  ]

  if (viewerAddress) {
    calls.push({ abi, address, functionName: "getParticipantStatus", args: [BigInt(challengeId), viewerAddress] })
    calls.push({ abi, address, functionName: "isInvitationEligible", args: [BigInt(challengeId), viewerAddress] })
    calls.push({ abi, address, functionName: "getParticipantActions", args: [BigInt(challengeId), viewerAddress] })
  }

  try {
    const results = await executeMultipleClausesCall({ thor, calls })

    const raw = results[0]
    const participants = (results[1] as string[]) ?? []
    const invited = (results[2] as string[]) ?? []
    const declined = (results[3] as string[]) ?? []
    const selectedApps = ((results[4] as string[]) ?? []).map(String)
    const viewerStatus = viewerAddress ? Number(results[5]) : 0
    const eligible = viewerAddress ? Boolean(results[6]) : false
    const viewerActions = viewerAddress ? BigInt(String(results[7] ?? 0)) : 0n

    const view = parseChallengeView(
      raw,
      viewerAddress,
      viewerStatus,
      eligible,
      viewerActions,
      currentRound,
      creationTimestamps.get(challengeId) ?? 0,
      claimedChallengeIds.has(challengeId),
      refundedChallengeIds.has(challengeId),
    )

    return {
      ...view,
      participants: [...participants],
      invited: [...invited],
      declined: [...declined],
      selectedApps: [...selectedApps],
    }
  } catch (error) {
    console.error(`[getChallengeDetail] Failed to fetch challenge ${challengeId}:`, error)
    return null
  }
}
