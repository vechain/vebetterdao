import { useQuery } from "@tanstack/react-query"
import { useConnex } from "@vechain/dapp-kit-react"
import { useVot3TokenDetails } from "./useVot3TokenDetails"
import { FormattingUtils } from "@repo/utils"
import { TokenBalance } from "../../b3tr"

import { getConfig } from "@repo/config"
import { Vot3ContractJson } from "@repo/contracts"
const vot3Abi = Vot3ContractJson.abi

const config = getConfig()
const VOT3_CONTRACT = config.vot3ContractAddress

/**
 *  Get the vot3 balance of an address from the contract
 * @param thor  The thor instance
 * @param address  The address to get the balance of. If not provided, will return an error (for better react-query DX)
 * @param scaleDecimals  The decimals of the token. Defaults to 18
 * @returns Balance of the token in the form of {@link TokenBalance} (original, scaled down and formatted)
 */
export const getVot3Balance = async (
  thor: Connex.Thor,
  address?: string,
  tokenDecimals: number = 18,
): Promise<TokenBalance> => {
  if (!address) return Promise.reject(new Error("Address not provided"))
  const functionAbi = vot3Abi.find(e => e.name === "balanceOf")
  if (!functionAbi) return Promise.reject(new Error("Function abi not found for balanceOf"))
  const res = await thor.account(VOT3_CONTRACT).method(functionAbi).call(address)

  if (res.vmError) return Promise.reject(new Error(res.vmError))

  const original = res.decoded[0]
  const scaled = FormattingUtils.scaleNumberDown(original, tokenDecimals)
  const formatted = scaled === "0" ? "0" : FormattingUtils.humanNumber(scaled)

  return {
    original,
    scaled,
    formatted,
  }
}

export const getVot3BalanceQueryKey = (address?: string) => ["balance", "vot3", address]
export const useVot3Balance = (address?: string) => {
  const { thor } = useConnex()
  const { data: tokenDetails } = useVot3TokenDetails()

  return useQuery({
    queryKey: getVot3BalanceQueryKey(address),
    queryFn: () => getVot3Balance(thor, address, tokenDetails?.decimals),
    enabled: !!address && !!tokenDetails?.decimals,
  })
}
