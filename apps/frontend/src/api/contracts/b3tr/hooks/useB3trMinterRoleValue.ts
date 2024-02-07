import { useQuery } from "@tanstack/react-query"
import { useConnex } from "@vechain/dapp-kit-react"
import { getConfig } from "@repo/config"
import Contract from "@repo/contracts/artifacts/contracts/B3TR.sol/B3TR.json"
const b3trAbi = Contract.abi

const B3TR_CONTRACT = getConfig().b3trContractAddress

/**
 *  Get b3tr token value for the minter role from the contract, whhich can be used to query for role
 * @param thor  The thor instance
 * @returns  {Promise<string>}  The value of the minter role
 */
export const getMinterRoleValue = async (thor: Connex.Thor): Promise<string> => {
  const functionAbi = b3trAbi.find(e => e.name === "MINTER_ROLE")
  if (!functionAbi) return Promise.reject(new Error("Function abi not found for MINTER_ROLE"))
  const res = await thor.account(B3TR_CONTRACT).method(functionAbi).call()

  if (res.vmError) return Promise.reject(new Error(res.vmError))

  return res.decoded[0]
}

const getMinterRoleValueQueryKey = () => ["minterRoleValue"]
export const useMinterRoleValue = () => {
  const { thor } = useConnex()

  return useQuery({
    queryKey: getMinterRoleValueQueryKey(),
    queryFn: () => getMinterRoleValue(thor),
  })
}
