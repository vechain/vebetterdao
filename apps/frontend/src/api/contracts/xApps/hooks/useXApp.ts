import { useMemo } from "react"
import { useUnendorsedApps } from "./useUnendorsedApps"
import { useXApps } from "./useXApps"

/**
 *  Hook to get a specific xApp using useXApps
 * @param appId  the xApp id
 * @returns  the xApp with the given id
 */
export const useXApp = (appId: string) => {
  const { data: xApps, ...props } = useXApps()
  const { data: unendorsedApps, ...unendorsedProps } = useUnendorsedApps()

  const allApps = useMemo(() => [...(xApps ?? []), ...(unendorsedApps ?? [])], [xApps, unendorsedApps])
  const app = allApps.find(xa => xa.id === appId)

  const isLoading = props.isLoading || unendorsedProps.isLoading
  const isError = props.isError || unendorsedProps.isError
  const error = props.error || unendorsedProps.error

  return {
    data: app,
    ...props,
    isLoading,
    isError,
    error,
  }
}
