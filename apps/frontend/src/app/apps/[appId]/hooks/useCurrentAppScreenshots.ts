import { useXAppScreenshots } from "@/api/contracts/xApps/hooks/useXAppScreenshots"
import { useParams } from "next/navigation"

/**
 * Custom hook that retrieves the screenshots of the current app.
 * It uses the `useXAppScreenshots` hook to get the current app's screenshots.
 *
 * @returns An object containing the screenshots, loading state, and error state.
 */
export const useCurrentAppScreenshots = () => {
  const { appId } = useParams<{ appId: string }>()

  return useXAppScreenshots(appId)
}
