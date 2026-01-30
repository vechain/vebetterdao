import { useWallet } from "@vechain/vechain-kit"
import { useMemo } from "react"

import { useGetUserGMs } from "@/api/contracts/galaxyMember/hooks/useGetUserGMs"
import { useGMRequiredByProposalType } from "@/api/contracts/governance/hooks/useGMRequiredByProposalType"

import { ProposalType } from "../../../../types/proposals"
import { useAccountPermissions } from "../../account/hooks/useAccountPermissions"

/**
 * Hook to get the GM level required by proposal type
 * @param proposalType - The type of proposal to get the GM required for. If not provided, the standard proposal GM required is returned.
 * @returns the GM level required for the proposal type
 */
export const useMetProposalCriteria = (proposalType: ProposalType = ProposalType.STANDARD) => {
  const { account } = useWallet()
  const { data: gmRequired, isLoading: isLoadingGMRequired } = useGMRequiredByProposalType(proposalType)
  const { data: userGMs, isLoading: isLoadingUserGMs } = useGetUserGMs(account?.address)
  const { data: permissions } = useAccountPermissions(account?.address)

  const isProduction = process.env.NODE_ENV === "production"

  const hasAllowedGrantApproverPermission = useMemo(() => {
    const isGrant = proposalType === ProposalType.GRANT
    if (!isGrant || !isProduction) return true // Standard proposals and non-production are always authorized

    return permissions?.isGrantApprover ?? false
  }, [proposalType, isProduction, permissions?.isGrantApprover])

  const hasRequiredGM = useMemo(() => {
    return userGMs?.some(gm => Number(gm.tokenLevel) >= (gmRequired ?? 1))
  }, [userGMs, gmRequired])

  return {
    isGrantApprover: hasAllowedGrantApproverPermission,
    hasMetProposalCriteria: !!hasRequiredGM,
    isLoading: isLoadingGMRequired || isLoadingUserGMs,
  }
}
