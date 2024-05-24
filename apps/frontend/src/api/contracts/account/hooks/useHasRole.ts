import { useQuery } from "@tanstack/react-query"
import { useConnex } from "@vechain/dapp-kit-react"
import { ethers } from "ethers"
import { AccessControl__factory } from "@repo/contracts/typechain-types"

// Roles
export const DEFAULT_ADMIN_ROLE = "0x0000000000000000000000000000000000000000000000000000000000000000"
export const MINTER_ROLE = ethers.solidityPackedKeccak256(["string"], ["MINTER_ROLE"])
export const UPGRADER_ROLE = ethers.solidityPackedKeccak256(["string"], ["UPGRADER_ROLE"])
export const PAUSER_ROLE = ethers.solidityPackedKeccak256(["string"], ["PAUSER_ROLE"])
export const GOVERNANCE_ROLE = ethers.solidityPackedKeccak256(["string"], ["GOVERNANCE_ROLE"])
export const VOTE_REGISTRAR_ROLE = ethers.solidityPackedKeccak256(["string"], ["VOTE_REGISTRAR_ROLE"])
export const PROPOSAL_EXECUTOR_ROLE = ethers.solidityPackedKeccak256(["string"], ["PROPOSAL_EXECUTOR_ROLE"])
export const GOVERNOR_FUNCTIONS_SETTINGS_ROLE = ethers.solidityPackedKeccak256(
  ["string"],
  ["GOVERNOR_FUNCTIONS_SETTINGS_ROLE"],
)
export const CONTRACTS_ADDRESS_MANAGER_ROLE = ethers.solidityPackedKeccak256(
  ["string"],
  ["CONTRACTS_ADDRESS_MANAGER_ROLE"],
)
export const Proposer = ethers.solidityPackedKeccak256(["string"], ["Proposer"])
export const Executor = ethers.solidityPackedKeccak256(["string"], ["Executor"])
export const ROUND_STARTER_ROLE = ethers.solidityPackedKeccak256(["string"], ["ROUND_STARTER_ROLE"])

/**
 *  Function to check if the user has a specific role in AccessControl
 * @param thor  the thor instance
 * @param role  the role to check (will be converted to bytes32)
 * @param contractAddress  the contract address
 * @param address  the address to check the role for
 * @returns  true if the user has the role, false otherwise
 */
export const getHasRole = async (thor: Connex.Thor, role: string, contractAddress: string, address?: string) => {
  const bytes32Role =
    role === "DEFAULT_ADMIN_ROLE" ? DEFAULT_ADMIN_ROLE : ethers.solidityPackedKeccak256(["string"], [role])
  const fragment = AccessControl__factory.createInterface().getFunction("hasRole").format("json")
  const res = await thor.account(contractAddress).method(JSON.parse(fragment)).call(bytes32Role, address)

  if (res.reverted) throw new Error(res.revertReason)

  return res.decoded[0]
}

export const hasRoleQueryKey = (role: string, contractAddress: string, address?: string) => [
  "hasRole",
  contractAddress,
  address,
  role,
]

/**
 *  Hook to check if the user has a specific role
 * @param role  the role to check (will be converted to bytes32)
 * @param contractAddress  the contract address
 * @param address  the address to check the role for
 * @returns  true if the user has the role, false otherwise
 */
export const useHasRole = (role: string, contractAddress: string, address?: string) => {
  const { thor } = useConnex()
  return useQuery({
    queryKey: hasRoleQueryKey(role, contractAddress, address),
    queryFn: () => !!address && getHasRole(thor, role, contractAddress, address),
    enabled: !!address,
  })
}
