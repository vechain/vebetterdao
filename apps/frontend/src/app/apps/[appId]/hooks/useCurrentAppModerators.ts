import { useAppModerators } from "@/api"
import { useParams } from "next/navigation"

/**
 * Custom hook to fetch the current app moderators.
 * @returns An object containing moderators data, loading state, and error state.
 */
export const useCurrentAppModerators = () => {
  const { appId } = useParams<{ appId: string }>()
  const { data: moderators, isLoading, error } = useAppModerators(appId)

  return {
    moderators: moderators || [],
    isLoading,
    error,
  }
}
