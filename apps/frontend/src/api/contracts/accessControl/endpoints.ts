import { getConfig } from "@repo/config"
import Contract from "@repo/contracts/artifacts/contracts/B3TR.sol/B3TR.json"
const abi = Contract.abi

const B3TR_CONTRACT = getConfig().b3trContractAddress

/**
 *  Get b3tr token value for the minter role from the contract, whhich can be used to query for role
 * @param thor  The thor instance
 * @returns  {Promise<string>}  The value of the minter role
 */
export const getMinterRoleValue = async (thor: Connex.Thor): Promise<string> => {
  const functionAbi = abi.find(e => e.name === "MINTER_ROLE")
  if (!functionAbi) return Promise.reject(new Error("Function abi not found for MINTER_ROLE"))
  const res = await thor.account(B3TR_CONTRACT).method(functionAbi).call()

  if (res.vmError) return Promise.reject(new Error(res.vmError))

  return res.decoded[0]
}

/**
 *  Check if the address has a specified role in the contract
 * @param thor  The thor instance
 * @param address  The address to check the role for. If not provided, will return an error (for better react-query DX)
 * @param role  The role to check for. If not provided, will return an error (for better react-query DX)
 * @returns {Promise<boolean>} Whether the address has the role
 */
export const getUserHasRole = async (thor: Connex.Thor, role?: string, address?: string): Promise<boolean> => {
  if (!address) return Promise.reject(new Error("Address not provided"))
  if (!role) return Promise.reject(new Error("Role not provided"))
  const functionAbi = abi.find(e => e.name === "hasRole")
  if (!functionAbi) return Promise.reject(new Error("Function abi not found for hasRole"))
  const res = await thor.account(B3TR_CONTRACT).method(functionAbi).call(role, address)

  if (res.vmError) return Promise.reject(new Error(res.vmError))

  return res.decoded[0]
}
