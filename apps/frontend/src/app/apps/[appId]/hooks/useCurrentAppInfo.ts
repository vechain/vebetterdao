import { useXApp } from "@/api"
import { useParams } from "next/navigation"

/**
 * Custom hook that retrieves the screenshots of the current app.
 * It uses the `useXAppScreenshots` hook to get the current app's screenshots.
 *
 * @returns An object containing the screenshots, loading state, and error state.
 *
 */

export const useCurrentAppInfo = () => {
  const { appId } = useParams<{ appId: string }>()
  const { data: app, isLoading: isAppInfoLoading, error: appInfoError } = useXApp(appId ?? "")

  return {
    app,
    isAppInfoLoading,
    appInfoError,
  }
}
