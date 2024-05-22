import { FormattingUtils } from "@repo/utils"
import { useQuery } from "@tanstack/react-query"
import { useConnex } from "@vechain/dapp-kit-react"

export type TokenBalance = {
  original: string
  scaled: string
  formatted: string
}

/**
 *  Get the vet balance of an address from the contract
 * @param thor  The thor instance
 * @param address  The address to get the balance of. If not provided, will return an error (for better react-query DX)
 * @param scaleDecimals  The decimals of the token. Defaults to 18
 * @returns Balance of the token in the form of {@link TokenBalance} (original, scaled down and formatted)
 */
export const getVetBalance = async (
  thor: Connex.Thor,
  address?: string,
  scaleDecimals: number = 18,
): Promise<TokenBalance> => {
  if (!address) return Promise.reject(new Error("Address not provided"))
  const account = await thor.account(address).get()

  if (!account) return Promise.reject(new Error("Something went wrong fetching the account"))

  const original = account.balance
  const scaled = FormattingUtils.scaleNumberDown(original, scaleDecimals, scaleDecimals)
  const formatted = scaled === "0" ? "0" : FormattingUtils.humanNumber(scaled)

  return {
    original,
    scaled,
    formatted,
  }
}

export const getVetBalanceQueryKey = (address?: string) => ["balance", "vet", address]
export const useVetBalance = (address?: string) => {
  const { thor } = useConnex()

  return useQuery({
    queryKey: getVetBalanceQueryKey(address),
    queryFn: () => getVetBalance(thor, address, 18),
    enabled: !!address,
  })
}
