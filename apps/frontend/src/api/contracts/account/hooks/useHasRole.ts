import { getCallClauseQueryKeyWithArgs, useCallClause } from "@vechain/vechain-kit"
import { ethers } from "ethers"
import { AccessControl__factory } from "@repo/contracts/typechain-types"

const abi = AccessControl__factory.abi
const method = "hasRole" as const

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
export const DECAY_SETTINGS_MANAGER_ROLE = ethers.solidityPackedKeccak256(["string"], ["DECAY_SETTINGS_MANAGER_ROLE"])
export const Proposer = ethers.solidityPackedKeccak256(["string"], ["Proposer"])
export const Executor = ethers.solidityPackedKeccak256(["string"], ["Executor"])
export const ROUND_STARTER_ROLE = ethers.solidityPackedKeccak256(["string"], ["ROUND_STARTER_ROLE"])
export const SETTINGS_MANAGER_ROLE = ethers.solidityPackedKeccak256(["string"], ["SETTINGS_MANAGER_ROLE"])
export const SIGNALER_ROLE = ethers.solidityPackedKeccak256(["string"], ["SIGNALER_ROLE"])
export const ACTION_REGISTRAR_ROLE = ethers.solidityPackedKeccak256(["string"], ["ACTION_REGISTRAR_ROLE"])
export const WHITELISTER_ROLE = ethers.solidityPackedKeccak256(["string"], ["WHITELISTER_ROLE"])
export const ACTION_SCORE_MANAGER_ROLE = ethers.solidityPackedKeccak256(["string"], ["ACTION_SCORE_MANAGER_ROLE"])

export const getBytes32Role = (role: string) =>
  role === "DEFAULT_ADMIN_ROLE" ? DEFAULT_ADMIN_ROLE : ethers.solidityPackedKeccak256(["string"], [role])

export const hasRoleQueryKey = (role: string, contractAddress: string, address?: string) =>
  getCallClauseQueryKeyWithArgs({
    abi,
    address: contractAddress,
    method,
    args: [getBytes32Role(role) as `0x${string}`, address as `0x${string}`],
  })

/**
 *  Hook to check if the user has a specific role
 * @param role  the role to check (will be converted to bytes32)
 * @param contractAddress  the contract address
 * @param address  the address to check the role for
 * @returns  true if the user has the role, false otherwise
 */
export const useHasRole = (role: string, contractAddress: string, address?: string) => {
  return useCallClause({
    abi,
    address: contractAddress,
    method,
    args: [getBytes32Role(role) as `0x${string}`, address as `0x${string}`],
    queryOptions: {
      enabled: !!address,
      select: data => data[0],
    },
  })
}
