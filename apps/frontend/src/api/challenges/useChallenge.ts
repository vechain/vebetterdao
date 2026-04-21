import { useMemo } from "react"

import { useCurrentAllocationsRoundId } from "../contracts/xAllocations/hooks/useCurrentAllocationsRoundId"

import { mapIndexerChallengeDetail, mapRawChallengeDetail, usePublicChallengeDetail } from "./indexerChallenges"
import { needsChallengeParticipantActions } from "./resolveChallengeDetail"
import { ChallengeDetail } from "./types"
import {
  getChallengeParticipantActionRequestKey,
  useChallengeParticipantActionsBatch,
} from "./useChallengeParticipantActions"

export const getChallengeQueryKey = (challengeId: string, viewerAddress?: string) => [
  "challenges",
  "detail",
  challengeId,
  viewerAddress ?? "guest",
]

interface UseChallengeOptions {
  pollWhileMissing?: boolean
}

export const useChallenge = (challengeId: string, viewerAddress?: string, options?: UseChallengeOptions) => {
  const { pollWhileMissing = false } = options ?? {}
  const parsedChallengeId = Number(challengeId)
  const isValidChallengeId = Number.isInteger(parsedChallengeId) && parsedChallengeId > 0

  const currentRoundQuery = useCurrentAllocationsRoundId()
  const publicChallengeQuery = usePublicChallengeDetail(parsedChallengeId, {
    enabled: isValidChallengeId,
    pollWhileMissing,
  })
  const participantActionsNeeded =
    !!viewerAddress &&
    !!publicChallengeQuery.data &&
    publicChallengeQuery.data !== null &&
    needsChallengeParticipantActions(mapRawChallengeDetail(publicChallengeQuery.data), viewerAddress)
  const participantActionsQuery = useChallengeParticipantActionsBatch(
    participantActionsNeeded && viewerAddress ? [{ challengeId: parsedChallengeId, participant: viewerAddress }] : [],
  )

  const challenge = useMemo<ChallengeDetail | null | undefined>(() => {
    if (publicChallengeQuery.data === null) {
      return null
    }

    if (!publicChallengeQuery.data || currentRoundQuery.data === undefined) {
      return undefined
    }

    const participantActions =
      viewerAddress && participantActionsNeeded
        ? BigInt(
            participantActionsQuery.data?.[
              getChallengeParticipantActionRequestKey({
                challengeId: parsedChallengeId,
                participant: viewerAddress,
              })
            ] ?? "0",
          )
        : 0n

    return mapIndexerChallengeDetail(publicChallengeQuery.data, viewerAddress, {
      currentRound: Number(currentRoundQuery.data ?? 0),
      participantActions,
    })
  }, [
    currentRoundQuery.data,
    parsedChallengeId,
    participantActionsNeeded,
    participantActionsQuery.data,
    publicChallengeQuery.data,
    viewerAddress,
  ])

  const isChallengeMissing = publicChallengeQuery.data === null && !publicChallengeQuery.isLoading && !pollWhileMissing
  const isLoading =
    !isChallengeMissing &&
    (publicChallengeQuery.isLoading ||
      currentRoundQuery.isLoading ||
      participantActionsQuery.isLoading ||
      (pollWhileMissing && publicChallengeQuery.data === null) ||
      (!!viewerAddress && participantActionsNeeded && participantActionsQuery.isFetching))

  return {
    data: challenge,
    isLoading,
    isError: publicChallengeQuery.isError || currentRoundQuery.isError || participantActionsQuery.isError,
    error: publicChallengeQuery.error ?? currentRoundQuery.error ?? participantActionsQuery.error ?? null,
  }
}
