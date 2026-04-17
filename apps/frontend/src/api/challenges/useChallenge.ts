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
  thresholdMode: ContractValue,
  status: ContractValue,
  settlementMode: ContractValue,
  creator: string,
  stakeAmount: ContractValue,
  startRound: ContractValue,
  endRound: ContractValue,
  duration: ContractValue,
  threshold: ContractValue,
  allApps: boolean,
  totalPrize: ContractValue,
  participantCount: ContractValue,
  invitedCount: ContractValue,
  declinedCount: ContractValue,
  selectedAppsCount: ContractValue,
  bestScore: ContractValue,
  bestCount: ContractValue,
  qualifiedCount: ContractValue,
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
  viewerStatus,
  isInvitationEligible,
}: {
  challenge: RawContractChallengeTuple
  participants: unknown
  invited: unknown
  declined: unknown
  selectedApps: unknown
  viewerStatus?: bigint | number | string
  isInvitationEligible?: boolean
}): ChallengeDetailResolverInput => ({
  challengeId: toNumber(challenge[0]),
  createdAt: 0,
  kind: toNumber(challenge[1]) as ChallengeDetailResolverInput["kind"],
  visibility: toNumber(challenge[2]) as ChallengeDetailResolverInput["visibility"],
  thresholdMode: toNumber(challenge[3]) as ChallengeDetailResolverInput["thresholdMode"],
  status: toNumber(challenge[4]) as ChallengeDetailResolverInput["status"],
  settlementMode: toNumber(challenge[5]) as ChallengeDetailResolverInput["settlementMode"],
  creator: challenge[6],
  title: challenge[22],
  description: challenge[23],
  imageURI: challenge[24],
  metadataURI: challenge[25],
  stakeAmount: formatTokenAmount(challenge[7]),
  totalPrize: formatTokenAmount(challenge[13]),
  startRound: toNumber(challenge[8]),
  endRound: toNumber(challenge[9]),
  duration: toNumber(challenge[10]),
  threshold: toBigInt(challenge[11]).toString(),
  allApps: challenge[12],
  participantCount: toNumber(challenge[14]),
  invitedCount: toNumber(challenge[15]),
  declinedCount: toNumber(challenge[16]),
  selectedAppsCount: toNumber(challenge[17]),
  bestScore: toBigInt(challenge[18]).toString(),
  bestCount: toNumber(challenge[19]),
  qualifiedCount: toNumber(challenge[20]),
  payoutsClaimed: toNumber(challenge[21]),
  participants: normalizeStringArray(participants),
  invited: normalizeStringArray(invited),
  declined: normalizeStringArray(declined),
  selectedApps: normalizeStringArray(selectedApps),
  viewerStatus:
    viewerStatus !== undefined
      ? (toNumber(unwrapValue(viewerStatus) as ContractValue) as ChallengeDetailResolverInput["viewerStatus"])
      : ParticipantStatus.None,
  isInvitationEligible: Boolean(unwrapValue(isInvitationEligible)),
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

export const useChallenge = (challengeId: string, viewerAddress?: string) => {
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

      const [rawChallenge, participants, invited, declined, selectedApps, rawViewerStatus, rawInvitationEligible] =
        await Promise.all([
          contract.read.getChallenge!(BigInt(parsedChallengeId)),
          contract.read.getChallengeParticipants!(BigInt(parsedChallengeId)),
          contract.read.getChallengeInvited!(BigInt(parsedChallengeId)),
          contract.read.getChallengeDeclined!(BigInt(parsedChallengeId)),
          contract.read.getChallengeSelectedApps!(BigInt(parsedChallengeId)),
          viewerAddress
            ? contract.read.getParticipantStatus!(BigInt(parsedChallengeId), viewerAddress as `0x${string}`)
            : Promise.resolve(undefined),
          viewerAddress
            ? contract.read.isInvitationEligible!(BigInt(parsedChallengeId), viewerAddress as `0x${string}`)
            : Promise.resolve(undefined),
        ])

      return mapContractChallengeDetail({
        challenge: unwrapValue(rawChallenge) as RawContractChallengeTuple,
        participants,
        invited,
        declined,
        selectedApps,
        viewerStatus: rawViewerStatus as bigint | number | string | undefined,
        isInvitationEligible: rawInvitationEligible as boolean | undefined,
      })
    },
    enabled:
      !!thor && isValidChallengeId && currentRoundId !== undefined && contractAddress.toLowerCase() !== ZERO_ADDRESS,
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

  const isChallengeMissing = baseChallengeQuery.data === null && !baseChallengeQuery.isLoading
  const isLoading =
    !isChallengeMissing &&
    (isCurrentRoundLoading ||
      isMaxParticipantsLoading ||
      baseChallengeQuery.isLoading ||
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
