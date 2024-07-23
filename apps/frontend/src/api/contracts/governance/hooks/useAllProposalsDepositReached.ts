import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useConnex } from "@vechain/dapp-kit-react"
import { getConfig } from "@repo/config"
import { B3TRGovernor__factory } from "@repo/contracts"
import { abi } from "thor-devkit"
import { getIsDepositReachedQueryKey } from "./useIsDepositReached"

const b3trGovernorInterface = B3TRGovernor__factory.createInterface()
const proposalSDepositReachedFragment = b3trGovernorInterface.getFunction("proposalDepositReached").format("json")
const proposalDepositReachedAbi = new abi.Function(JSON.parse(proposalSDepositReachedFragment))

const GOVERNANCE_CONTRACT = getConfig().b3trGovernorAddress

const getAllProposalsDepositReachedClauses = (proposalIds: string[]) => {
  const clauses: Connex.VM.Clause[] = proposalIds.map(proposalId => ({
    to: GOVERNANCE_CONTRACT,
    value: 0,
    data: proposalDepositReachedAbi.encode(proposalId),
  }))

  return clauses
}

export const getAllProposalsDepositReachedQueryKey = () => ["PROPOSALS", "ALL", "DEPOSIT_REACHED"]

export const useAllProposalsDepositReached = (proposalsIds: string[]) => {
  const { thor } = useConnex()
  const queryClient = useQueryClient()

  return useQuery({
    queryKey: getAllProposalsDepositReachedQueryKey(),
    queryFn: async () => {
      const clauses = getAllProposalsDepositReachedClauses(proposalsIds)
      const res = await thor.explain(clauses).execute()

      const depositsReached = res.map((r, index) => {
        const decoded = proposalDepositReachedAbi.decode(r.data)
        const proposalId = proposalsIds[index] as string
        const depositReached = decoded[0] as boolean

        queryClient.setQueryData(getIsDepositReachedQueryKey(proposalId), depositReached)

        return {
          proposalId,
          depositReached,
        }
      })
      return depositsReached
    },
    enabled: !!proposalsIds.length && !!thor,
  })
}
