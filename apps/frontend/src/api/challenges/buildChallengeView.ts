import { ThorClient } from "@vechain/sdk-network"
import { B3TRChallenges__factory } from "@vechain/vebetterdao-contracts/typechain-types"
import { executeMultipleClausesCall } from "@vechain/vechain-kit"
import { formatEther } from "ethers"

import { ViewerClaimState } from "./claimState"
import { resolveChallengeDetail, ChallengeDetailResolverInput } from "./resolveChallengeDetail"
import {
  ChallengeKind,
  ChallengeStatus,
  ChallengeType,
  ChallengeView,
  ChallengeVisibility,
  ParticipantStatus,
  SettlementMode,
} from "./types"

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

/**
 * Maps the contract's ChallengeView struct + per-viewer flags into the
 * frontend `ChallengeView` model, running all derived flags through
 * `resolveChallengeDetail` for consistency with detail-page logic.
 */
const toResolverInput = ({
  raw,
  createdAt,
  viewer,
  viewerParticipantStatus,
  isInvitationEligible,
  isSplitWinWinner,
  claimed,
  maxParticipants,
}: {
  raw: RawChallengeView
  createdAt: number
  viewer?: string
  viewerParticipantStatus: ParticipantStatus
  isInvitationEligible: boolean
  isSplitWinWinner: boolean
  claimed: ViewerClaimState | null
  maxParticipants: number
}): ChallengeDetailResolverInput => {
  const id = Number(raw.challengeId)
  const hasViewer = !!viewer
  const lowerViewer = viewer?.toLowerCase() ?? ""

  // Minimal array encoding of the viewer's relation — consumed by
  // includesAddress() inside resolveChallengeDetail.
  const participants = hasViewer && viewerParticipantStatus === ParticipantStatus.Joined ? [lowerViewer] : []
  const invited = hasViewer && viewerParticipantStatus === ParticipantStatus.Invited ? [lowerViewer] : []
  const declined = hasViewer && viewerParticipantStatus === ParticipantStatus.Declined ? [lowerViewer] : []
  const eligibleInvitees = hasViewer && isInvitationEligible ? [lowerViewer] : []
  const winners = hasViewer && isSplitWinWinner ? [lowerViewer] : []

  const claimedBy = hasViewer && claimed?.payoutClaimed.has(id) ? [lowerViewer] : []
  const claimedByMerged = hasViewer && claimed?.splitWinClaimed.has(id) ? [...claimedBy, lowerViewer] : claimedBy
  const refundedBy = hasViewer && claimed?.refundClaimed.has(id) ? [lowerViewer] : []
  const creatorRefunded = hasViewer && raw.creator.toLowerCase() === lowerViewer && !!claimed?.creatorRefunded.has(id)

  return {
    challengeId: id,
    createdAt,
    kind: raw.kind as ChallengeKind,
    visibility: raw.visibility as ChallengeVisibility,
    challengeType: raw.challengeType as ChallengeType,
    status: raw.status as ChallengeStatus,
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
    selectedApps: [],
    winners,
    eligibleInvitees,
    claimedBy: claimedByMerged,
    refundedBy,
    creatorRefunded,
  }
}

interface BuildChallengeViewsParams {
  thor: ThorClient
  contractAddress: string
  challengeIds: number[]
  viewer?: string
  currentRound: number
  createdAtById?: Map<number, number>
  claimed: ViewerClaimState | null
  maxParticipants: number
}

/**
 * Builds `ChallengeView[]` for a list of challenge ids via a single batched
 * multicall: `getChallenge` + `getChallengeStatus` + optional per-viewer calls.
 */
export const buildChallengeViews = async ({
  thor,
  contractAddress,
  challengeIds,
  viewer,
  currentRound,
  createdAtById,
  claimed,
  maxParticipants,
}: BuildChallengeViewsParams): Promise<ChallengeView[]> => {
  if (challengeIds.length === 0) return []

  const address = contractAddress as `0x${string}`
  const hasViewer = !!viewer

  const calls = challengeIds.flatMap(id => {
    const idBig = BigInt(id)
    const base = [
      { abi, address, functionName: "getChallenge" as const, args: [idBig] as const },
      { abi, address, functionName: "getChallengeStatus" as const, args: [idBig] as const },
    ]
    if (!hasViewer) return base
    const viewerAddr = viewer as `0x${string}`
    return [
      ...base,
      { abi, address, functionName: "getParticipantStatus" as const, args: [idBig, viewerAddr] as const },
      { abi, address, functionName: "isInvitationEligible" as const, args: [idBig, viewerAddr] as const },
      { abi, address, functionName: "isSplitWinWinner" as const, args: [idBig, viewerAddr] as const },
      { abi, address, functionName: "getParticipantActions" as const, args: [idBig, viewerAddr] as const },
    ]
  })

  const results = (await executeMultipleClausesCall({ thor, calls })) as unknown[]

  const callsPerId = hasViewer ? 6 : 2
  const views: ChallengeView[] = []
  for (let i = 0; i < challengeIds.length; i++) {
    const id = challengeIds[i] as number
    const base = i * callsPerId
    const raw = results[base] as RawChallengeView
    const computedStatus = Number(results[base + 1] as number | bigint) as ChallengeStatus
    const viewerParticipantStatus = hasViewer
      ? (Number(results[base + 2] as number | bigint) as ParticipantStatus)
      : ParticipantStatus.None
    const isInvitationEligible = hasViewer ? Boolean(results[base + 3]) : false
    const isSplitWinWinner = hasViewer ? Boolean(results[base + 4]) : false
    const participantActions = hasViewer ? BigInt(results[base + 5] as bigint | number | string) : 0n

    const merged: RawChallengeView = { ...raw, status: computedStatus }
    const createdAt = createdAtById?.get(id) ?? 0

    const input = toResolverInput({
      raw: merged,
      createdAt,
      viewer,
      viewerParticipantStatus,
      isInvitationEligible,
      isSplitWinWinner,
      claimed,
      maxParticipants,
    })

    const detail = resolveChallengeDetail({
      challenge: input,
      viewerAddress: viewer,
      currentRound,
      participantActions,
    })

    // ChallengeView is a subset of ChallengeDetail; the Card list uses the lighter shape.
    const {
      participants: _p,
      invited: _i,
      declined: _d,
      selectedApps: _s,
      winners: _w,
      viewerActions: _va,
      ...view
    } = detail
    views.push(view)
  }

  return views
}
