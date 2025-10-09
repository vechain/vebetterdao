import { useQuery } from "@tanstack/react-query"

import { buildQueryString } from "../../utils/buildQueryString"

import { SubmissionsResponse } from "@/app/api/app/creator/submission/route"

export const creatorSubmissionQueryKey = (walletAddress: string) => ["FETCH_CREATOR_SUBMISSION", walletAddress]
/**
 * Fetches the creator submissions for a specific wallet address
 * @param walletAddress The wallet address of the creator
 * @returns The creator submissions
 */
export const useCreatorSubmission = (walletAddress: string) => {
  const queryString = buildQueryString({ walletAddress: walletAddress.toLowerCase() })
  return useQuery({
    queryKey: creatorSubmissionQueryKey(walletAddress),
    queryFn: async () => {
      const response = await fetch(`/api/app/creator/submission?${queryString}`, {
        method: "GET",
      })
      if (!response.ok) throw new Error(response.statusText)
      return (await response.json()) as SubmissionsResponse
    },
    staleTime: 1000 * 60,
    enabled: !!walletAddress,
  })
}
