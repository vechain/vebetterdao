import { useXApps } from "./useXApps"

/**
 *  Hook to get a specific xApp using useXApps
 * @param appId  the xApp id
 * @returns  the xApp with the given id
 */
export const useXApp = (appId: string) => {
  const { data: xApps, ...props } = useXApps()

  return {
    data: xApps?.find(xa => xa.id === appId),
    ...props,
  }
}
