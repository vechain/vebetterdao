import { useAppCreators } from "@/api"
import { useParams } from "next/navigation"

/**
 * Custom hook to fetch the current app creators.
 * @returns An object containing creators data, loading state, and error state.
 */
export const useCurrentAppCreators = () => {
  const { appId } = useParams<{ appId: string }>()
  const { data: creators, isLoading, error } = useAppCreators(appId)

  return {
    creators: creators || [],
    isLoading,
    error,
  }
}
