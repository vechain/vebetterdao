import { DEFAULT_ADMIN_ROLE, hasRoleQueryKey } from "@/api/contracts/account"
import { AccessControl__factory } from "@repo/contracts/typechain-types"
import { useQueryClient } from "@tanstack/react-query"
import { ethers } from "ethers"
import { useCallback, useMemo } from "react"
import { useWallet, useSendTransaction, UseSendTransactionReturnValue, EnhancedClause } from "@vechain/vechain-kit"
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
 * @param invalidateCache boolean to determine if cache should be invalidated after a successful transaction
 */
export const useAccessControl = ({
  contractAddress,
  walletAddress,
  role,
  onSuccess,
  invalidateCache = true,
}: Props) => {
  const { account } = useWallet()
  const queryClient = useQueryClient()

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

  const performCacheInvalidation = useCallback(async () => {
    if (invalidateCache) {
      await queryClient.cancelQueries({
        queryKey: hasRoleQueryKey(role, contractAddress, walletAddress),
      })
      await queryClient.refetchQueries({
        queryKey: hasRoleQueryKey(role, contractAddress, walletAddress),
      })
    }
  }, [invalidateCache, queryClient, role, contractAddress, walletAddress])

  const handleOnSuccess = useCallback(async () => {
    await performCacheInvalidation()
    onSuccess?.()
  }, [performCacheInvalidation, onSuccess])

  const grantRole: UseSendTransactionReturnValue = useSendTransaction({
    signerAccountAddress: account?.address ?? "",
    onTxConfirmed: handleOnSuccess,
  })

  const revokeRole: UseSendTransactionReturnValue = useSendTransaction({
    signerAccountAddress: account?.address ?? "",
    onTxConfirmed: handleOnSuccess,
  })

  const renounceRole: UseSendTransactionReturnValue = useSendTransaction({
    signerAccountAddress: account?.address ?? "",
    onTxConfirmed: handleOnSuccess,
  })

  const onMutateGrantRole = useCallback(async () => {
    const clauses = buildGrantClause()
    return grantRole.sendTransaction(clauses)
  }, [buildGrantClause, grantRole])

  const onMutateRevokeRole = useCallback(async () => {
    const clauses = buildRevokeClause()
    return revokeRole.sendTransaction(clauses)
  }, [buildRevokeClause, revokeRole])

  const onMutateRenounceRole = useCallback(async () => {
    const clauses = buildRenounceClause()
    return renounceRole.sendTransaction(clauses)
  }, [buildRenounceClause, renounceRole])

  return {
    grantRole: { ...grantRole, sendTransaction: onMutateGrantRole },
    revokeRole: { ...revokeRole, sendTransaction: onMutateRevokeRole },
    renounceRole: { ...renounceRole, sendTransaction: onMutateRenounceRole },
  }
}
