import { useCallback, useMemo } from "react"
import { VeBetterPassport__factory } from "@vechain-kit/vebetterdao-contracts"
import { getConfig } from "@repo/config"
import { getIsBlacklistedQueryKey, getIsWhitelistedQueryKey } from "@/api"
import { buildClause } from "@/utils/buildClause"
import { useBuildTransaction } from "./useBuildTransaction"

const VeBetterPassportInterface = VeBetterPassport__factory.createInterface()

const VE_BETTER_PASSPORT_ADDRESS = getConfig().veBetterPassportContractAddress

export enum UserStatus {
  NONE = "NONE",
  WHITELIST = "WHITELIST",
  BLACKLIST = "BLACKLIST",
}

type Props = {
  address: string
  currentStatus: UserStatus
  newStatus: UserStatus
  onSuccess?: () => void
  onSuccessMessageTitle?: string
}

/**
 * Whitelist, blacklist or remove a user from blacklist or whitelist in the VeBetterPassport contract
 *
 * @param {string} props.address - the user address
 * @param {UserStatus} props.currentStatus - the current status of the user
 * @param {UserStatus} props.newStatus - the new status of the user
 * @returns the return value of the send transaction hook and the result of the transaction
 */
export const useWhitelistBlacklistUser = ({ address, currentStatus, newStatus, onSuccess }: Props) => {
  const method = useMemo(() => {
    switch (newStatus) {
      case UserStatus.WHITELIST:
        return "whitelist"
      case UserStatus.BLACKLIST:
        return "blacklist"
      case UserStatus.NONE:
        return currentStatus === UserStatus.WHITELIST ? "removeFromWhitelist" : "removeFromBlacklist"
    }
  }, [currentStatus, newStatus])

  const clauseBuilder = useCallback(() => {
    const clauses = buildClause({
      contractInterface: VeBetterPassportInterface,
      to: VE_BETTER_PASSPORT_ADDRESS,
      method,
      args: [address],
      comment: `${method} ${address}`,
    })

    return [clauses]
  }, [address, method])

  const refetchQueryKeys = useMemo(
    () => [getIsWhitelistedQueryKey(address), getIsBlacklistedQueryKey(address)],
    [address],
  )

  return useBuildTransaction({
    clauseBuilder,
    refetchQueryKeys,
    onSuccess,
  })
}
