import { AccessControl__factory } from "@vechain/vebetterdao-contracts/typechain-types"
import { EnhancedClause } from "@vechain/vechain-kit"
import { useCallback, useMemo } from "react"

import { getBytes32Role, hasRoleQueryKey } from "../../../../../api/contracts/account/hooks/useHasRole"
import { useBuildTransaction } from "../../../../../hooks/useBuildTransaction"

import { HeldRole } from "./useDiscoverHeldRoles"

const accessControlInterface = AccessControl__factory.createInterface()
const grantFn = JSON.parse(JSON.stringify(accessControlInterface.getFunction("grantRole")))
const renounceFn = JSON.parse(JSON.stringify(accessControlInterface.getFunction("renounceRole")))

type Props = {
  from: string
  to: string
  heldRoles: HeldRole[]
  onGrantSuccess?: () => void
  onRenounceSuccess?: () => void
}

/**
 * Builds two multi-clause transactions for migrating AccessControl roles:
 *  - grantAll: grants every role in `heldRoles` to `to`
 *  - renounceAll: renounces every role in `heldRoles` from `from`
 */
export const useMigrateRoles = ({ from, to, heldRoles, onGrantSuccess, onRenounceSuccess }: Props) => {
  const buildGrantAllClauses = useCallback((): EnhancedClause[] => {
    return heldRoles.map(({ contractAddress, contractName, role }) => ({
      to: contractAddress,
      value: 0,
      data: accessControlInterface.encodeFunctionData("grantRole", [getBytes32Role(role), to]),
      comment: `Grant ${role} on ${contractName} to ${to}`,
      abi: grantFn,
    }))
  }, [heldRoles, to])

  const buildRenounceAllClauses = useCallback((): EnhancedClause[] => {
    return heldRoles.map(({ contractAddress, contractName, role }) => ({
      to: contractAddress,
      value: 0,
      data: accessControlInterface.encodeFunctionData("renounceRole", [getBytes32Role(role), from]),
      comment: `Renounce ${role} on ${contractName}`,
      abi: renounceFn,
    }))
  }, [heldRoles, from])

  const refetchQueryKeys = useMemo(() => {
    const keys = []
    for (const { contractAddress, role } of heldRoles) {
      keys.push(hasRoleQueryKey(role, contractAddress, from))
      if (to) keys.push(hasRoleQueryKey(role, contractAddress, to))
    }
    return keys
  }, [heldRoles, from, to])

  const grantAll = useBuildTransaction({
    clauseBuilder: buildGrantAllClauses,
    refetchQueryKeys,
    onSuccess: onGrantSuccess,
  })

  const renounceAll = useBuildTransaction({
    clauseBuilder: buildRenounceAllClauses,
    refetchQueryKeys,
    onSuccess: onRenounceSuccess,
  })

  return { grantAll, renounceAll }
}
