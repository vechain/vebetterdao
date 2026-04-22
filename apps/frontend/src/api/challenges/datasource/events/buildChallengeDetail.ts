import { QueryClient } from "@tanstack/react-query"
import { ThorClient } from "@vechain/sdk-network"
import { B3TRChallenges__factory } from "@vechain/vebetterdao-contracts/typechain-types"
import { executeMultipleClausesCall } from "@vechain/vechain-kit"
import { formatEther } from "ethers"

import { resolveChallengeDetail, ChallengeDetailResolverInput } from "../../resolveChallengeDetail"
import {
  ChallengeDetail,
  ChallengeKind,
  ChallengeStatus,
  ChallengeType,
  ChallengeVisibility,
  SettlementMode,
} from "../../types"

import { fetchChallengeClaimedBy } from "./claimState"
import { fetchChallengeEvents } from "./fetchChallengeEvents"

const abi = B3TRChallenges__factory.abi

type RawChallengeView = {
  challengeId: bigint
  kind: number
  visibility: number
  challengeType: number
  status: number
  settlementMode: number
  creator: string
  stakeAmount: bigint
  startRound: bigint
  endRound: bigint
  duration: bigint
  threshold: bigint
  numWinners: bigint
  winnersClaimed: bigint
  prizePerWinner: bigint
  allApps: boolean
  totalPrize: bigint
  participantCount: bigint
  invitedCount: bigint
  declinedCount: bigint
  selectedAppsCount: bigint
  winnersCount: bigint
  bestScore: bigint
  bestCount: bigint
  payoutsClaimed: bigint
  title: string
  description: string
  imageURI: string
  metadataURI: string
}

interface BuildChallengeDetailParams {
  thor: ThorClient
  queryClient: QueryClient
  contractAddress: string
  fromBlock: number
  challengeId: number
  viewer?: string
  currentRound: number
  maxParticipants: number
}

/**
 * Fetches the full `ChallengeDetail` for a given id from on-chain state.
 * Combines: getChallenge + status + participants/invited/declined/winners/selectedApps
 * + per-viewer flags + claim events.
 */
export const buildChallengeDetail = async ({
  thor,
  queryClient,
  contractAddress,
  fromBlock,
  challengeId,
  viewer,
  currentRound,
  maxParticipants,
}: BuildChallengeDetailParams): Promise<ChallengeDetail | null> => {
  const address = contractAddress as `0x${string}`
  const idBig = BigInt(challengeId)
  const hasViewer = !!viewer

  const baseCalls = [
    { abi, address, functionName: "getChallenge" as const, args: [idBig] as const },
    { abi, address, functionName: "getChallengeStatus" as const, args: [idBig] as const },
    { abi, address, functionName: "getChallengeParticipants" as const, args: [idBig] as const },
    { abi, address, functionName: "getChallengeInvited" as const, args: [idBig] as const },
    { abi, address, functionName: "getChallengeDeclined" as const, args: [idBig] as const },
    { abi, address, functionName: "getChallengeSelectedApps" as const, args: [idBig] as const },
    { abi, address, functionName: "getChallengeWinners" as const, args: [idBig] as const },
  ]

  const viewerCalls = hasViewer
    ? [
        {
          abi,
          address,
          functionName: "getParticipantStatus" as const,
          args: [idBig, viewer as `0x${string}`] as const,
        },
        {
          abi,
          address,
          functionName: "isInvitationEligible" as const,
          args: [idBig, viewer as `0x${string}`] as const,
        },
        {
          abi,
          address,
          functionName: "isSplitWinWinner" as const,
          args: [idBig, viewer as `0x${string}`] as const,
        },
        {
          abi,
          address,
          functionName: "getParticipantActions" as const,
          args: [idBig, viewer as `0x${string}`] as const,
        },
      ]
    : []

  let results: unknown[]
  try {
    results = (await executeMultipleClausesCall({ thor, calls: [...baseCalls, ...viewerCalls] })) as unknown[]
  } catch (error) {
    // `ChallengeDoesNotExist` reverts the call — treat as missing.
    const message = error instanceof Error ? error.message : String(error)
    if (/ChallengeDoesNotExist/i.test(message) || /execution reverted/i.test(message)) {
      return null
    }
    throw error
  }

  const raw = results[0] as RawChallengeView
  const computedStatus = Number(results[1] as number | bigint) as ChallengeStatus
  const participants = ((results[2] as readonly string[]) ?? []).map(a => a)
  const invited = ((results[3] as readonly string[]) ?? []).map(a => a)
  const declined = ((results[4] as readonly string[]) ?? []).map(a => a)
  const selectedApps = ((results[5] as readonly string[]) ?? []).map(a => a)
  const winners = ((results[6] as readonly string[]) ?? []).map(a => a)

  const isInvitationEligible = hasViewer ? Boolean(results[8]) : false
  const participantActions = hasViewer ? BigInt(results[10] as bigint | number | string) : 0n

  const lowerViewer = viewer?.toLowerCase() ?? ""
  const eligibleInvitees = hasViewer && isInvitationEligible ? [lowerViewer] : []

  const { claimedBy, refundedBy, creatorRefunded } = await fetchChallengeClaimedBy({
    thor,
    queryClient,
    contractAddress,
    fromBlock,
    challengeId,
  })

  // createdAt from the ChallengeCreated event for this id (single indexed lookup).
  const createdEvents = await fetchChallengeEvents({
    thor,
    queryClient,
    contractAddress,
    fromBlock,
    eventName: "ChallengeCreated",
    filterParams: { challengeId: idBig } as never,
  })
  const createdAt = createdEvents[0]?.meta.blockTimestamp ?? 0

  const input: ChallengeDetailResolverInput = {
    challengeId,
    createdAt,
    kind: raw.kind as ChallengeKind,
    visibility: raw.visibility as ChallengeVisibility,
    challengeType: raw.challengeType as ChallengeType,
    status: computedStatus,
    settlementMode: raw.settlementMode as SettlementMode,
    creator: raw.creator,
    title: raw.title,
    description: raw.description,
    imageURI: raw.imageURI,
    metadataURI: raw.metadataURI,
    stakeAmount: formatEther(raw.stakeAmount),
    totalPrize: formatEther(raw.totalPrize),
    startRound: Number(raw.startRound),
    endRound: Number(raw.endRound),
    duration: Number(raw.duration),
    threshold: raw.threshold.toString(),
    numWinners: Number(raw.numWinners),
    winnersClaimed: Number(raw.winnersClaimed),
    prizePerWinner: formatEther(raw.prizePerWinner),
    allApps: raw.allApps,
    participantCount: Number(raw.participantCount),
    maxParticipants,
    invitedCount: Number(raw.invitedCount),
    declinedCount: Number(raw.declinedCount),
    selectedAppsCount: Number(raw.selectedAppsCount),
    winnersCount: Number(raw.winnersCount),
    bestScore: raw.bestScore.toString(),
    bestCount: Number(raw.bestCount),
    payoutsClaimed: Number(raw.payoutsClaimed),
    participants,
    invited,
    declined,
    selectedApps,
    winners,
    eligibleInvitees,
    claimedBy,
    refundedBy,
    creatorRefunded,
  }

  return resolveChallengeDetail({
    challenge: input,
    viewerAddress: viewer,
    currentRound,
    participantActions,
  })
}
