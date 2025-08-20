import { DEFAULT_ADMIN_ROLE, hasRoleQueryKey } from "@/api/contracts/account"
import { AccessControl__factory } from "@vechain-kit/vebetterdao-contracts/typechain-types"
import { ethers } from "ethers"
import { useCallback, useMemo } from "react"
import { EnhancedClause } from "@vechain/vechain-kit"
import { useBuildTransaction } from "./useBuildTransaction"
type Props = {
  contractAddress: string
  walletAddress: string
  role: string
  onSuccess?: () => void
  invalidateCache?: boolean
}

const accessControlInterface = AccessControl__factory.createInterface()

/**
 * Hook to grant or revoke roles to a wallet address
 * @param contractAddress address of the contract
 * @param walletAddress address to be granted or revoked
 * @param role role to be granted or revoked
 * @param onSuccess callback function to be called after a successful transaction
 */
export const useAccessControl = ({ contractAddress, walletAddress, role, onSuccess }: Props) => {
  const bytes32Role = useMemo(
    () => (role === "DEFAULT_ADMIN_ROLE" ? DEFAULT_ADMIN_ROLE : ethers.solidityPackedKeccak256(["string"], [role])),
    [role],
  )

  const buildGrantClause = useCallback(() => {
    return [
      {
        to: contractAddress,
        value: 0,
        data: accessControlInterface.encodeFunctionData("grantRole", [bytes32Role, walletAddress]),
        comment: `Granting ${role} role to ${walletAddress}`,
        abi: JSON.parse(JSON.stringify(accessControlInterface.getFunction("grantRole"))),
      },
    ] as EnhancedClause[]
  }, [contractAddress, walletAddress, bytes32Role, role])

  const buildRevokeClause = useCallback(() => {
    return [
      {
        to: contractAddress,
        value: 0,
        data: accessControlInterface.encodeFunctionData("revokeRole", [bytes32Role, walletAddress]),
        comment: `Revoking ${role} role from ${walletAddress}`,
        abi: JSON.parse(JSON.stringify(accessControlInterface.getFunction("revokeRole"))),
      },
    ] as EnhancedClause[]
  }, [contractAddress, walletAddress, bytes32Role, role])

  const buildRenounceClause = useCallback(() => {
    return [
      {
        to: contractAddress,
        value: 0,
        data: accessControlInterface.encodeFunctionData("renounceRole", [bytes32Role, walletAddress]),
        comment: `Renouncing ${role} role from ${walletAddress}`,
        abi: JSON.parse(JSON.stringify(accessControlInterface.getFunction("renounceRole"))),
      },
    ] as EnhancedClause[]
  }, [contractAddress, walletAddress, bytes32Role, role])

  const refetchQueryKeys = useMemo(() => {
    return [hasRoleQueryKey(role, contractAddress, walletAddress)]
  }, [role, contractAddress, walletAddress])

  return {
    grantRole: useBuildTransaction({
      clauseBuilder: buildGrantClause,
      refetchQueryKeys,
      onSuccess,
    }),
    revokeRole: useBuildTransaction({
      clauseBuilder: buildRevokeClause,
      refetchQueryKeys,
      onSuccess,
    }),
    renounceRole: useBuildTransaction({
      clauseBuilder: buildRenounceClause,
      refetchQueryKeys,
      onSuccess,
    }),
  }
}
