import { useMemo } from "react"
import { useIsBlacklisted, useIsWhitelisted } from "."
import { UserStatus } from "@/hooks"

/**
 * Hook to get the user status regarding whitelist and blacklist.
 * @param address - The user address.
 * @returns The user status based on the whitelist and blacklist.
 */
export const useUserStatus = (address: string) => {
  const { data: isBlacklisted } = useIsBlacklisted(address)
  const { data: isWhitelisted } = useIsWhitelisted(address)

  const userStatus = useMemo(() => {
    if (!isBlacklisted && !isWhitelisted) {
      return UserStatus.NONE
    }

    if (isBlacklisted) {
      return UserStatus.BLACKLIST
    }

    if (isWhitelisted) {
      return UserStatus.WHITELIST
    }

    return UserStatus.NONE
  }, [isBlacklisted, isWhitelisted])

  return userStatus
}
