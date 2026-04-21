import { getConfig } from "@repo/config"
import { useQuery } from "@tanstack/react-query"
import { B3TRChallenges__factory } from "@vechain/vebetterdao-contracts/typechain-types"
import { useThor } from "@vechain/vechain-kit"
import { formatEther } from "ethers"
import { useMemo } from "react"

import { useCurrentAllocationsRoundId } from "@/api/contracts/xAllocations/hooks/useCurrentAllocationsRoundId"

import {
  resolveChallengeDetail,
  needsChallengeParticipantActions,
  type ChallengeDetailResolverInput,
} from "./resolveChallengeDetail"
import { ChallengeDetail, ParticipantStatus } from "./types"
import { useChallengeClaimState } from "./useChallengeClaimState"
import { useMaxParticipants } from "./useMaxParticipants"

const abi = B3TRChallenges__factory.abi as any
const contractAddress = getConfig().challengesContractAddress as `0x${string}`
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000"

type ContractValue = bigint | number | string

type RawContractChallengeTuple = [
  challengeId: ContractValue,
  kind: ContractValue,
  visibility: ContractValue,
  challengeType: ContractValue,
  status: ContractValue,
  settlementMode: ContractValue,
  creator: string,
  stakeAmount: ContractValue,
  startRound: ContractValue,
  endRound: ContractValue,
  duration: ContractValue,
  threshold: ContractValue,
  numWinners: ContractValue,
  winnersClaimed: ContractValue,
  prizePerWinner: ContractValue,
  allApps: boolean,
  totalPrize: ContractValue,
  participantCount: ContractValue,
  invitedCount: ContractValue,
  declinedCount: ContractValue,
  selectedAppsCount: ContractValue,
  winnersCount: ContractValue,
  bestScore: ContractValue,
  bestCount: ContractValue,
  payoutsClaimed: ContractValue,
  title: string,
  description: string,
  imageURI: string,
  metadataURI: string,
]

const toBigInt = (value: ContractValue) => BigInt(value)

const toNumber = (value: ContractValue) => Number(value)

const unwrapValue = (value: unknown): unknown => {
  if (Array.isArray(value) && value.length === 1) {
    return unwrapValue(value[0])
  }

  return value
}

const formatTokenAmount = (value: ContractValue) =>
  formatEther(toBigInt(value))
    .replace(/\.0$/, "")
    .replace(/(\.\d*?[1-9])0+$/, "$1")

const normalizeStringArray = (value: unknown) => {
  const arrayResult = Array.isArray(value) && value.length === 1 && Array.isArray(value[0]) ? value[0] : value
  return Array.isArray(arrayResult) ? arrayResult.map(item => String(item)) : []
}

const mapContractChallengeDetail = ({
  challenge,
  participants,
  invited,
  declined,
  selectedApps,
  winners,
  viewerStatus,
  isInvitationEligible,
  isSplitWinWinner,
}: {
  challenge: RawContractChallengeTuple
  participants: unknown
  invited: unknown
  declined: unknown
  selectedApps: unknown
  winners: unknown
  viewerStatus?: bigint | number | string
  isInvitationEligible?: boolean
  isSplitWinWinner?: boolean
}): ChallengeDetailResolverInput => ({
  challengeId: toNumber(challenge[0]),
  createdAt: 0,
  kind: toNumber(challenge[1]) as ChallengeDetailResolverInput["kind"],
  visibility: toNumber(challenge[2]) as ChallengeDetailResolverInput["visibility"],
  challengeType: toNumber(challenge[3]) as ChallengeDetailResolverInput["challengeType"],
  status: toNumber(challenge[4]) as ChallengeDetailResolverInput["status"],
  settlementMode: toNumber(challenge[5]) as ChallengeDetailResolverInput["settlementMode"],
  creator: challenge[6],
  title: challenge[25],
  description: challenge[26],
  imageURI: challenge[27],
  metadataURI: challenge[28],
  stakeAmount: formatTokenAmount(challenge[7]),
  totalPrize: formatTokenAmount(challenge[16]),
  startRound: toNumber(challenge[8]),
  endRound: toNumber(challenge[9]),
  duration: toNumber(challenge[10]),
  threshold: toBigInt(challenge[11]).toString(),
  numWinners: toNumber(challenge[12]),
  winnersClaimed: toNumber(challenge[13]),
  prizePerWinner: formatTokenAmount(challenge[14]),
  allApps: challenge[15],
  participantCount: toNumber(challenge[17]),
  invitedCount: toNumber(challenge[18]),
  declinedCount: toNumber(challenge[19]),
  selectedAppsCount: toNumber(challenge[20]),
  winnersCount: toNumber(challenge[21]),
  bestScore: toBigInt(challenge[22]).toString(),
  bestCount: toNumber(challenge[23]),
  payoutsClaimed: toNumber(challenge[24]),
  participants: normalizeStringArray(participants),
  invited: normalizeStringArray(invited),
  declined: normalizeStringArray(declined),
  selectedApps: normalizeStringArray(selectedApps),
  winners: normalizeStringArray(winners),
  viewerStatus:
    viewerStatus !== undefined
      ? (toNumber(unwrapValue(viewerStatus) as ContractValue) as ChallengeDetailResolverInput["viewerStatus"])
      : ParticipantStatus.None,
  isInvitationEligible: Boolean(unwrapValue(isInvitationEligible)),
  isSplitWinWinner: Boolean(unwrapValue(isSplitWinWinner)),
})

export const getChallengeQueryKey = (challengeId: string, viewerAddress?: string) => [
  "challenges",
  "detail",
  challengeId,
  viewerAddress ?? "guest",
]

const getChallengeBaseQueryKey = (challengeId: string, viewerAddress?: string, currentRoundId?: string) => [
  "challenges",
  "detail",
  "base",
  challengeId,
  viewerAddress ?? "guest",
  currentRoundId ?? "unknown",
]

const getViewerChallengeActionsQueryKey = (challengeId: number, viewerAddress?: string) => [
  "challenges",
  "detail",
  "participant-actions",
  challengeId,
  viewerAddress ?? "guest",
]

interface UseChallengeOptions {
  pollWhileMissing?: boolean
}

export const useChallenge = (challengeId: string, viewerAddress?: string, options?: UseChallengeOptions) => {
  const { pollWhileMissing = false } = options ?? {}
  const thor = useThor()
  const parsedChallengeId = Number(challengeId)
  const isValidChallengeId = Number.isInteger(parsedChallengeId) && parsedChallengeId > 0
  const {
    data: currentRoundId,
    isLoading: isCurrentRoundLoading,
    isError: isCurrentRoundError,
    error: currentRoundError,
  } = useCurrentAllocationsRoundId()
  const {
    data: maxParticipants,
    isLoading: isMaxParticipantsLoading,
    isError: isMaxParticipantsError,
    error: maxParticipantsError,
  } = useMaxParticipants()
  const claimState = useChallengeClaimState(parsedChallengeId, viewerAddress)

  const baseChallengeQuery = useQuery({
    queryKey: getChallengeBaseQueryKey(challengeId, viewerAddress, currentRoundId),
    queryFn: async (): Promise<ChallengeDetailResolverInput | null> => {
      const contract = thor.contracts.load(contractAddress, abi)
      const rawChallengeCount = unwrapValue(await contract.read.challengeCount!()) as ContractValue
      const totalChallenges = toBigInt(rawChallengeCount)

      if (totalChallenges < BigInt(parsedChallengeId)) {
        return null
      }

      const [
        rawChallenge,
        participants,
        invited,
        declined,
        selectedApps,
        winners,
        rawViewerStatus,
        rawInvitationEligible,
        rawIsSplitWinWinner,
      ] = await Promise.all([
        contract.read.getChallenge!(BigInt(parsedChallengeId)),
        contract.read.getChallengeParticipants!(BigInt(parsedChallengeId)),
        contract.read.getChallengeInvited!(BigInt(parsedChallengeId)),
        contract.read.getChallengeDeclined!(BigInt(parsedChallengeId)),
        contract.read.getChallengeSelectedApps!(BigInt(parsedChallengeId)),
        contract.read.getChallengeWinners!(BigInt(parsedChallengeId)),
        viewerAddress
          ? contract.read.getParticipantStatus!(BigInt(parsedChallengeId), viewerAddress as `0x${string}`)
          : Promise.resolve(undefined),
        viewerAddress
          ? contract.read.isInvitationEligible!(BigInt(parsedChallengeId), viewerAddress as `0x${string}`)
          : Promise.resolve(undefined),
        viewerAddress
          ? contract.read.isSplitWinWinner!(BigInt(parsedChallengeId), viewerAddress as `0x${string}`)
          : Promise.resolve(undefined),
      ])

      return mapContractChallengeDetail({
        challenge: unwrapValue(rawChallenge) as RawContractChallengeTuple,
        participants,
        invited,
        declined,
        selectedApps,
        winners,
        viewerStatus: rawViewerStatus as bigint | number | string | undefined,
        isInvitationEligible: rawInvitationEligible as boolean | undefined,
        isSplitWinWinner: rawIsSplitWinWinner as boolean | undefined,
      })
    },
    enabled:
      !!thor && isValidChallengeId && currentRoundId !== undefined && contractAddress.toLowerCase() !== ZERO_ADDRESS,
    refetchInterval: pollWhileMissing ? 2000 : false,
  })

  const shouldLoadViewerActions =
    !!viewerAddress &&
    !!baseChallengeQuery.data &&
    needsChallengeParticipantActions(baseChallengeQuery.data, claimState.data.hasClaimed)

  const viewerParticipantActionsQuery = useQuery({
    queryKey: getViewerChallengeActionsQueryKey(parsedChallengeId, viewerAddress),
    queryFn: async () => {
      const contract = thor.contracts.load(contractAddress, abi)
      const actions = unwrapValue(
        await contract.read.getParticipantActions!(BigInt(parsedChallengeId), viewerAddress as `0x${string}`),
      ) as ContractValue

      return toBigInt(actions)
    },
    enabled:
      !!thor &&
      !!viewerAddress &&
      isValidChallengeId &&
      shouldLoadViewerActions &&
      contractAddress.toLowerCase() !== ZERO_ADDRESS,
  })

  const challenge = useMemo<ChallengeDetail | null | undefined>(() => {
    if (baseChallengeQuery.data === null) {
      return null
    }

    if (!baseChallengeQuery.data || currentRoundId === undefined || maxParticipants === undefined) {
      return undefined
    }

    return resolveChallengeDetail({
      challenge: baseChallengeQuery.data,
      viewerAddress,
      currentRound: Number(currentRoundId),
      maxParticipants,
      hasClaimed: claimState.data.hasClaimed,
      hasRefunded: claimState.data.hasRefunded,
      participantActions: viewerParticipantActionsQuery.data,
    })
  }, [
    baseChallengeQuery.data,
    claimState.data.hasClaimed,
    claimState.data.hasRefunded,
    currentRoundId,
    maxParticipants,
    viewerAddress,
    viewerParticipantActionsQuery.data,
  ])

  const isChallengeMissing = baseChallengeQuery.data === null && !baseChallengeQuery.isLoading && !pollWhileMissing
  const isLoading =
    !isChallengeMissing &&
    (isCurrentRoundLoading ||
      isMaxParticipantsLoading ||
      baseChallengeQuery.isLoading ||
      (pollWhileMissing && baseChallengeQuery.data === null) ||
      (!!viewerAddress && claimState.isLoading) ||
      (shouldLoadViewerActions && viewerParticipantActionsQuery.isLoading))

  return {
    data: challenge,
    isLoading,
    isError:
      isCurrentRoundError ||
      isMaxParticipantsError ||
      baseChallengeQuery.isError ||
      claimState.isError ||
      viewerParticipantActionsQuery.isError,
    error:
      baseChallengeQuery.error ??
      claimState.error ??
      viewerParticipantActionsQuery.error ??
      currentRoundError ??
      maxParticipantsError,
  }
}
