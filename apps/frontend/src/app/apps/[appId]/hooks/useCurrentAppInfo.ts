"use client"
import { useParams } from "next/navigation"

import { isNewApp, AllApps } from "../../../../api/contracts/xApps/getXApps"
import { useXApp } from "../../../../api/contracts/xApps/hooks/useXApp"
/**
 * Hook that fetches the app id from the URL and returns the app info
 *
 * @returns the app info
 */
export const useCurrentAppInfo = () => {
  const { appId } = useParams<{ appId: string }>()
  const { data: app, isLoading: isAppInfoLoading, error: appInfoError } = useXApp(appId ?? "")
  return {
    app: { ...app, isNew: isNewApp(app) } as AllApps,
    isAppInfoLoading,
    appInfoError,
  }
}
