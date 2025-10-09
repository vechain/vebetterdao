import { compareAddresses } from "@repo/utils/AddressUtils"
import { useWallet } from "@vechain/vechain-kit"
import { useMemo } from "react"

import { useCurrentAppModerators } from "./useCurrentAppModerators"
import { useCurrentAppAdmin } from "./useCurrentAppAdmin"

/*
 * This hook is used to determine the current role of the user in the app.
 * It checks if the user is the admin or a moderator of the app.
 */
export const useCurrentAppRole = () => {
  const { account } = useWallet()
  const { moderators, isLoading: isModeratorLoading } = useCurrentAppModerators()
  const { admin, isLoading: isAdminLoading } = useCurrentAppAdmin()
  const isAdmin = useMemo(() => {
    if (compareAddresses(account?.address || "", admin)) return true
    return false
  }, [account, admin])
  const isModerator = useMemo(() => {
    if (moderators?.find(moderator => compareAddresses(account?.address || "", moderator))) return true
    return false
  }, [account, moderators])
  const isAdminOrModerator = isAdmin || isModerator
  return {
    isAdmin,
    isModerator,
    isAdminOrModerator,
    isLoading: isModeratorLoading || isAdminLoading,
  }
}
