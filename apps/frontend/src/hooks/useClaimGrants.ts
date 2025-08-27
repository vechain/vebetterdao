import { useCallback } from "react"
import { getConfig } from "@repo/config"
import { GrantsManager__factory } from "@vechain/vebetterdao-contracts"
import { buildClause } from "@/utils/buildClause"

import { useBuildTransaction } from "./useBuildTransaction"

const grantsManagerAddress = getConfig().grantsManagerContractAddress
const GrantsManagerInterface = GrantsManager__factory.createInterface()

type Props = { proposalId: string; milestoneIndex: number; onSuccess?: () => void }

/**
 * Hook to claim a Milestone
 * @param proposalId  the proposal id to claim
 * @param milestoneIndex  the milestone index to claim
 * @param onSuccess  the callback to call after the grant is claimed
 * @returns the claim transaction
 */
export const useClaimGrants = ({ proposalId, milestoneIndex, onSuccess }: Props) => {
  const clauseBuilder = useCallback(() => {
    return [
      buildClause({
        to: grantsManagerAddress,
        contractInterface: GrantsManagerInterface,
        method: "claimMilestone",
        args: [proposalId, milestoneIndex],
        comment: `Claiming Milestone ${milestoneIndex} for Proposal ${proposalId}`,
      }),
    ]
  }, [proposalId, milestoneIndex])

  // TODO : Think about the key to refetch ( the state of the grant for sure)

  return useBuildTransaction({
    clauseBuilder,
    onSuccess,
  })
}
