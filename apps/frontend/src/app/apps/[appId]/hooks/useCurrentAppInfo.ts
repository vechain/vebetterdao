import { useXApp } from "@/api"
import { useParams } from "next/navigation"

/**
 * Hook that fetches the app id from the URL and returns the app info
 *
 * @returns the app info
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
