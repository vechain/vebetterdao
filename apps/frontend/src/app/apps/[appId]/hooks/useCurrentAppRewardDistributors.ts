import { useAppRewardDistributors } from "@/api"
import { useParams } from "next/navigation"

/**
 * Custom hook to fetch the current app reward distributors.
 * @returns An object containing distributors data, loading state, and error state.
 */
export const useCurrentAppRewardDistributors = () => {
  const { appId } = useParams<{ appId: string }>()
  const { data: distributors, isLoading, error } = useAppRewardDistributors(appId)

  return {
    distributors: distributors || [],
    isLoading,
    error,
  }
}
