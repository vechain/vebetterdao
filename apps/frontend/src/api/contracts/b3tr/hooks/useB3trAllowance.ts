import { FormattingUtils } from "@repo/utils"
import { useQuery } from "@tanstack/react-query"
import { useConnex } from "@vechain/dapp-kit-react"
import { getConfig } from "@repo/config"
import { useB3trTokenDetails } from "./useB3trTokenDetails"
import { B3trContractJson } from "@repo/contracts"
import { TokenBalance } from "./useB3trBalance"
const b3trAbi = B3trContractJson.abi

const B3TR_CONTRACT = getConfig().b3trContractAddress

/**
 * Get the b3tr token allowance of an address from the contract
 *
 * @param thor  The thor instance
 * @param owner The owner of the tokens
 * @param spender The address that is allowed to spend the tokens
 * @param scaleDecimals  The decimals of the token. Defaults to 18
 * @returns Balance of the token in the form of {@link TokenBalance} (original, scaled down and formatted)
 */
export const getB3trAllowance = async (
  thor: Connex.Thor,
  owner?: string,
  spender?: string,
  scaleDecimals: number = 18,
): Promise<TokenBalance> => {
  if (!spender) return Promise.reject(new Error("Spender address not provided"))
  if (!owner) return Promise.reject(new Error("Owner address not provided"))

  const functionAbi = b3trAbi.find(e => e.name === "allowance")
  if (!functionAbi) return Promise.reject(new Error("Function abi not found for allowance"))
  const res = await thor.account(B3TR_CONTRACT).method(functionAbi).call(owner, spender)

  if (res.vmError) return Promise.reject(new Error(res.vmError))

  const original = res.decoded[0]
  const scaled = FormattingUtils.scaleNumberDown(original, scaleDecimals)
  const formatted = scaled === "0" ? "0" : FormattingUtils.humanNumber(scaled)

  return {
    original,
    scaled,
    formatted,
  }
}

export const getB3TrAllowanceQueryKey = (owner?: string, spender?: string) => ["alowance", "b3tr", owner, spender]

export const useB3trAllowance = (owner?: string, spender?: string) => {
  const { thor } = useConnex()
  const { data: tokenDetails } = useB3trTokenDetails()

  return useQuery({
    queryKey: getB3TrAllowanceQueryKey(owner, spender),
    queryFn: () => getB3trAllowance(thor, owner, spender, tokenDetails?.decimals),
    enabled: !!owner && !!spender && !!tokenDetails?.decimals,
  })
}
