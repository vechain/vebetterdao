import { useCallback } from "react"
import { getConfig } from "@repo/config"
import { GrantsManager__factory } from "@vechain/vebetterdao-contracts"
import { buildClause } from "@/utils/buildClause"

import { useBuildTransaction } from "./useBuildTransaction"

const grantsManagerAddress = getConfig().grantsManagerContractAddress
const GrantsManagerInterface = GrantsManager__factory.createInterface()

type Props = { proposalId: string; onSuccess?: () => void }

/**
 * Hook to reject a Grant
 * @param proposalId  the proposal id to reject
 * @param onSuccess  the callback to call after the grant is rejected
 * @returns the reject transaction
 */
export const useRejectGrant = ({ proposalId, onSuccess }: Props) => {
  const clauseBuilder = useCallback(() => {
    return [
      buildClause({
        to: grantsManagerAddress,
        contractInterface: GrantsManagerInterface,
        method: "rejectMilestones",
        args: [proposalId],
        comment: `Rejecting Milestones for Grant ${proposalId}`,
      }),
    ]
  }, [proposalId])

  // TODO : Think about the key to refetch ( the state of the grant for sure)

  return useBuildTransaction({
    clauseBuilder,
    onSuccess,
  })
}
