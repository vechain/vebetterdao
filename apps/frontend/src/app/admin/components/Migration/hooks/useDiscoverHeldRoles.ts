import { useMemo } from "react"

import { useHasRoles } from "../../../../../api/contracts/account/hooks/useHasRoles"
import { CONTRACT_LIST } from "../../../../../constants/contractList"

export type HeldRole = {
  contractName: string
  contractAddress: string
  role: string
}

export type DiscoveryResult = {
  isLoading: boolean
  heldRoles: HeldRole[]
}

const ACCESS_CONTROLLED_CONTRACTS = CONTRACT_LIST.filter(c => c.roles.length > 0)

/**
 * Discovers every AccessControl role held by `address` across all VeBetterDAO
 * contracts in CONTRACT_LIST. Each contract is queried with a single multicall
 * via useHasRoles.
 */
export const useDiscoverHeldRoles = (address?: string): DiscoveryResult => {
  const queries = ACCESS_CONTROLLED_CONTRACTS.map(contract =>
    // Hook order is stable: CONTRACT_LIST has a fixed length at module load.
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useHasRoles(contract.roles, contract.contractAddress, address ?? ""),
  )

  return useMemo(() => {
    if (!address) return { isLoading: false, heldRoles: [] }
    const isLoading = queries.some(q => q.isLoading || q.isFetching)
    const heldRoles: HeldRole[] = []

    ACCESS_CONTROLLED_CONTRACTS.forEach((contract, idx) => {
      const result = queries[idx]?.data
      if (!result) return
      contract.roles.forEach((role, roleIdx) => {
        if (result[roleIdx]) {
          heldRoles.push({
            contractName: contract.name,
            contractAddress: contract.contractAddress,
            role,
          })
        }
      })
    })

    return { isLoading, heldRoles }
    // queries are stable across renders only when address/CONTRACT_LIST don't change,
    // but their internal data does — depend on each query's data + loading state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, ...queries.map(q => q.data), ...queries.map(q => q.isLoading), ...queries.map(q => q.isFetching)])
}
