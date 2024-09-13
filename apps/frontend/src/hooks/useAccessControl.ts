import { hasRoleQueryKey } from "@/api/contracts/account"
import { AccessControl__factory } from "@repo/contracts/typechain-types"
import { useQueryClient } from "@tanstack/react-query"
import { useWallet } from "@vechain/dapp-kit-react"
import { ethers } from "ethers"
import { useCallback, useMemo } from "react"
import { EnhancedClause, useSendTransaction } from "./useSendTransaction"

type Props = {
  contractAddress: string
  walletAddress: string
  role: string
  onSuccess?: () => void
  invalidateCache?: boolean
}

const accessControlInterface = AccessControl__factory.createInterface()

/**
 * useAccessControl is a custom hook that handles granting and revoking roles in a contract.
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
    () => (role === "DEFAULT_ADMIN_ROLE" ? ethers.ZeroHash : ethers.solidityPackedKeccak256(["string"], [role])),
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

  const grantRole = useSendTransaction({
    signerAccount: account,
    onTxConfirmed: handleOnSuccess,
  })

  const revokeRole = useSendTransaction({
    signerAccount: account,
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

  return {
    grantRole: { ...grantRole, sendTransaction: onMutateGrantRole },
    revokeRole: { ...revokeRole, sendTransaction: onMutateRevokeRole },
  }
}
