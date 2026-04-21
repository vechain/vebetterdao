import { useMemo } from "react"

import { mapIndexerChallengeDetail, usePublicChallengeDetail, useUserChallengeStateDetail } from "./indexerChallenges"
import { ChallengeDetail } from "./types"

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

  const publicChallengeQuery = usePublicChallengeDetail(parsedChallengeId, {
    enabled: isValidChallengeId,
    pollWhileMissing,
  })
  const userChallengeStateQuery = useUserChallengeStateDetail(parsedChallengeId, viewerAddress, isValidChallengeId)

  const challenge = useMemo<ChallengeDetail | null | undefined>(() => {
    if (publicChallengeQuery.data === null) {
      return null
    }

    if (!publicChallengeQuery.data) {
      return undefined
    }

    return mapIndexerChallengeDetail(
      publicChallengeQuery.data,
      viewerAddress,
      userChallengeStateQuery.data ?? undefined,
    )
  }, [publicChallengeQuery.data, userChallengeStateQuery.data, viewerAddress])

  const isChallengeMissing = publicChallengeQuery.data === null && !publicChallengeQuery.isLoading && !pollWhileMissing
  const isLoading =
    !isChallengeMissing &&
    (publicChallengeQuery.isLoading ||
      (pollWhileMissing && publicChallengeQuery.data === null) ||
      (!!viewerAddress && userChallengeStateQuery.isLoading))

  return {
    data: challenge,
    isLoading,
    isError: publicChallengeQuery.isError || userChallengeStateQuery.isError,
    error: publicChallengeQuery.error ?? userChallengeStateQuery.error ?? null,
  }
}
