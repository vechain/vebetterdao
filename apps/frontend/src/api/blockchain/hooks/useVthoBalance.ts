import { FormattingUtils } from "@repo/utils"
import { useQuery } from "@tanstack/react-query"
import { useConnex } from "@vechain/dapp-kit-react"
import { B3trContractJson } from "@repo/contracts"
import { TokenBalance } from "@/api/contracts"
const b3trAbi = B3trContractJson.abi
const VTHO_CONTRACT = "0x0000000000000000000000000000456e65726779"

/**
 *  Get the vtho balance of an address
 * @param thor  The thor instance
 * @param address  The address to get the balance of. If not provided, will return an error (for better react-query DX)
 * @param scaleDecimals  The decimals of the token. Defaults to 18
 * @returns Balance of the token in the form of {@link TokenBalance} (original, scaled down and formatted)
 */
export const getVthoBalance = async (
  thor: Connex.Thor,
  address?: string,
  scaleDecimals: number = 18,
): Promise<TokenBalance> => {
  if (!address) return Promise.reject(new Error("Address not provided"))
  const functionAbi = b3trAbi.find(e => e.name === "balanceOf")
  if (!functionAbi) return Promise.reject(new Error("Function abi not found for balanceOf"))
  const res = await thor.account(VTHO_CONTRACT).method(functionAbi).call(address)

  if (res.vmError) return Promise.reject(new Error(res.vmError))

  const original = res.decoded[0]
  const scaled = FormattingUtils.scaleNumberDown(original, scaleDecimals, scaleDecimals)
  const formatted = scaled === "0" ? "0" : FormattingUtils.humanNumber(scaled)

  return {
    original,
    scaled,
    formatted,
  }
}

export const getVthoBalanceQueryKey = (address?: string) => ["balance", "vtho", address]
export const useVthoBalance = (address?: string) => {
  const { thor } = useConnex()

  return useQuery({
    queryKey: getVthoBalanceQueryKey(address),
    queryFn: () => getVthoBalance(thor, address, 18),
    enabled: !!address,
  })
}
