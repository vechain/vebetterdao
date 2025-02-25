import { useXApps } from "./useXApps"

/**
 *  Hook to get a specific xApp using useXApps
 * @param appId  the xApp id
 * @returns  the xApp with the given id
 */
export const useXApp = (appId: string) => {
  const { data: xApps, ...props } = useXApps()

  const app = xApps?.allApps.find(xa => xa.id === appId)

  return {
    data: app,
    ...props,
  }
}
