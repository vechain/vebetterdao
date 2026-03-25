import { getConfig } from "@repo/config"
import { compareAddresses } from "@repo/utils/AddressUtils"
import { B3TRChallenges__factory } from "@vechain/vebetterdao-contracts/typechain-types"
import { ThorClient, executeMultipleClausesCall } from "@vechain/vechain-kit"
import { ethers } from "ethers"

import {
  ChallengeDetail,
  ChallengeStatus,
  ChallengeTab,
  ChallengeView,
  ChallengeVisibility,
  ParticipantStatus,
} from "./types"

const abi = B3TRChallenges__factory.abi as any
const ZERO_ADDR = "0x0000000000000000000000000000000000000000"

const getAddress = () => getConfig().challengesContractAddress as `0x${string}`

function parseChallengeView(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  raw: any,
  viewerAddress: string | undefined,
  viewerStatus: number,
  viewerEligible: boolean,
  currentRound: number,
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
  const threshold = BigInt(raw.threshold ?? raw[11]).toString()
  const allApps = Boolean(raw.allApps ?? raw[12])
  const totalPrize = ethers.formatEther(BigInt(raw.totalPrize ?? raw[13]))
  const participantCount = Number(raw.participantCount ?? raw[14])
  const invitedCount = Number(raw.invitedCount ?? raw[15])
  const declinedCount = Number(raw.declinedCount ?? raw[16])
  const selectedAppsCount = Number(raw.selectedAppsCount ?? raw[17])

  const isCreator = !!viewerAddress && compareAddresses(creator, viewerAddress)
  const isJoined = viewerStatus === ParticipantStatus.Joined
  const isInvited = viewerStatus === ParticipantStatus.Invited || viewerEligible
  const isPending = status === ChallengeStatus.Pending
  const isInvitationPending = isPending && isInvited && !isJoined && viewerStatus !== ParticipantStatus.Declined

  const canJoinPublic = isPending && visibility === ChallengeVisibility.Public && !isJoined && !isCreator
  const canAcceptInvite = isInvitationPending && !isJoined

  return {
    challengeId,
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
    canClaim: status === ChallengeStatus.Finalized && isJoined,
    canRefund: (status === ChallengeStatus.Cancelled || status === ChallengeStatus.Invalid) && (isJoined || isCreator),
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

  const [count] = await executeMultipleClausesCall({
    thor,
    calls: [{ abi, address, functionName: "challengeCount", args: [] }],
  })

  const n = Number(count)
  if (n === 0) return []

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const calls: any[] = []
  for (let id = 1; id <= n; id++) {
    calls.push({ abi, address, functionName: "getChallenge", args: [BigInt(id)] })
    if (viewerAddress) {
      calls.push({ abi, address, functionName: "getParticipantStatus", args: [BigInt(id), viewerAddress] })
      calls.push({ abi, address, functionName: "isInvitationEligible", args: [BigInt(id), viewerAddress] })
    }
  }

  const results = await executeMultipleClausesCall({ thor, calls })
  const stride = viewerAddress ? 3 : 1
  const challenges: ChallengeView[] = []

  for (let i = 0; i < n; i++) {
    const raw = results[i * stride]
    const viewerStatus = viewerAddress ? Number(results[i * stride + 1]) : 0
    const eligible = viewerAddress ? Boolean(results[i * stride + 2]) : false
    challenges.push(parseChallengeView(raw, viewerAddress, viewerStatus, eligible, currentRound))
  }

  return challenges
}

export async function fetchChallengeDetail(
  thor: ThorClient,
  challengeId: number,
  currentRound: number,
  viewerAddress?: string,
): Promise<ChallengeDetail | null> {
  const address = getAddress()
  if (!address || address.toLowerCase() === ZERO_ADDR) return null

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

    const view = parseChallengeView(raw, viewerAddress, viewerStatus, eligible, currentRound)

    return {
      ...view,
      participants: [...participants],
      invited: [...invited],
      declined: [...declined],
      selectedApps: [...selectedApps],
    }
  } catch {
    return null
  }
}
