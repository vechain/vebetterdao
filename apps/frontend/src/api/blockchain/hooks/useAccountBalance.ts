import { FormattingUtils } from "@repo/utils"
import { useQuery } from "@tanstack/react-query"
import { useConnex } from "@vechain/dapp-kit-react"
import { ethers } from "ethers"

export const getAccountBalance = async (thor: Connex.Thor, address?: string) => {
  if (!address) throw new Error("Address is required")
  const account = await thor.account(address).get()

  const originalBalance = account.balance
  const scaled = FormattingUtils.scaleNumberDown(originalBalance, 18, 18)
  const formatted = scaled === "0" ? "0" : FormattingUtils.humanNumber(scaled)

  const originalEnergy = account.energy
  const energyScaled = FormattingUtils.scaleNumberDown(originalEnergy, 18, 18)
  const energyFormatted = energyScaled === "0" ? "0" : FormattingUtils.humanNumber(energyScaled)

  return {
    balance: {
      original: originalBalance,
      scaled,
      formatted,
    },
    energy: {
      original: originalEnergy,
      scaled: energyScaled,
      formatted: energyFormatted,
    },
  }
}
export const getAccountBalanceQueryKey = (address?: string) => ["ACCOUNT_BALANCE", address]

/**
 *  Get the account balance for the given address
 * @param address  The address of the account to get the balance for
 * @returns  The account balance
 */
export const useAccountBalance = (address?: string) => {
  const { thor } = useConnex()
  return useQuery({
    queryKey: getAccountBalanceQueryKey(address),
    queryFn: () => getAccountBalance(thor, address),
    enabled: !!address,
    refetchInterval: 10000,
  })
}
