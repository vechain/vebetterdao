"use client"

import { useBuildTransaction } from "@/hooks/useBuildTransaction"
import { buildClause } from "@/utils/buildClause"
import { getConfig } from "@repo/config"
import { GrantsManager__factory } from "@vechain/vebetterdao-contracts"

const grantsManagerContractAddress = getConfig().grantsManagerContractAddress
const grantsManagerInterface = GrantsManager__factory.createInterface()

export const useUpdateGrantMilestoneMetadata = ({
  proposalId,
  milestonesIpfsCID,
}: {
  proposalId: string
  milestonesIpfsCID: string
}) => {
  return useBuildTransaction({
    clauseBuilder: () => [
      buildClause({
        contractInterface: grantsManagerInterface,
        to: grantsManagerContractAddress,
        method: "updateMilestoneMetadataURI",
        args: [proposalId, milestonesIpfsCID],
        comment: `Update milestone metadata for proposal ${proposalId}`,
      }),
    ],
    onSuccess: () => {},
    refetchQueryKeys: [],
    gasPadding: 0.15,
  })
}
