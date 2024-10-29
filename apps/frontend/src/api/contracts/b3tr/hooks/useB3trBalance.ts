import { FormattingUtils } from "@repo/utils"
import { useQuery } from "@tanstack/react-query"
import { useConnex } from "@vechain/dapp-kit-react"
import { getConfig } from "@repo/config"
import { B3trContractJson } from "@repo/contracts"
import { ethers } from "ethers"

const b3trAbi = B3trContractJson.abi

const B3TR_CONTRACT = getConfig().b3trContractAddress

export type TokenBalance = {
  original: string
  scaled: string
  formatted: string
}

/**
 *  Get the b3tr balance of an address from the contract
 * @param thor  The thor instance
 * @param address  The address to get the balance of. If not provided, will return an error (for better react-query DX)
 * @param scaleDecimals  The decimals of the token. Defaults to 18
 * @returns Balance of the token in the form of {@link TokenBalance} (original, scaled down and formatted)
 */
export const getB3trBalance = async (thor: Connex.Thor, address?: string): Promise<TokenBalance> => {
  if (!address) return Promise.reject(new Error("Address not provided"))
  const functionAbi = b3trAbi.find(e => e.name === "balanceOf")
  if (!functionAbi) return Promise.reject(new Error("Function abi not found for balanceOf"))
  const res = await thor.account(B3TR_CONTRACT).method(functionAbi).call(address)

  if (res.vmError) return Promise.reject(new Error(res.vmError))

  const original = res.decoded[0]
  const scaled = ethers.formatEther(original)
  const formatted = scaled === "0" ? "0" : FormattingUtils.humanNumber(scaled)

  return {
    original,
    scaled,
    formatted,
  }
}

export const getB3TrBalanceQueryKey = (address?: string) => ["balance", "b3tr", address]
export const useB3trBalance = (address?: string) => {
  const { thor } = useConnex()

  return useQuery({
    queryKey: getB3TrBalanceQueryKey(address),
    queryFn: () => getB3trBalance(thor, address),
    enabled: !!address,
  })
}
