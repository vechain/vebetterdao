"use client"
import { getConfig } from "@repo/config"
import { GrantsManager__factory } from "@vechain/vebetterdao-contracts"

import { getGrantProposalMetadataQueryKey } from "./useStandardOrGrantProposalDetails"

import { useBuildTransaction } from "@/hooks/useBuildTransaction"
import { buildClause } from "@/utils/buildClause"

const grantsManagerContractAddress = getConfig().grantsManagerContractAddress
const grantsManagerInterface = GrantsManager__factory.createInterface()

export const useUpdateGrantMilestoneMetadata = (proposalId: string) => {
  return useBuildTransaction<string>({
    clauseBuilder: milestonesIpfsCID => [
      buildClause({
        contractInterface: grantsManagerInterface,
        to: grantsManagerContractAddress,
        method: "updateMilestoneMetadataURI",
        args: [proposalId, milestonesIpfsCID],
        comment: `Update milestone metadata for proposal ${proposalId} with milestone ipfs url ${milestonesIpfsCID}`,
      }),
    ],
    refetchQueryKeys: [getGrantProposalMetadataQueryKey(proposalId)],
  })
}
