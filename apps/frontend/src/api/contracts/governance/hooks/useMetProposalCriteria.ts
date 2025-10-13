import { useWallet } from "@vechain/vechain-kit"
import { useMemo } from "react"

import { useGetUserGMs } from "@/api/contracts/galaxyMember/hooks/useGetUserGMs"
import { useGMRequiredByProposalType } from "@/api/contracts/governance/hooks/useGMRequiredByProposalType"

import { ProposalType } from "../../../../types/proposals"

/**
 * Hook to get the GM level required by proposal type
 * @param proposalType - The type of proposal to get the GM required for. If not provided, the standard proposal GM required is returned.
 * @returns the GM level required for the proposal type
 */
export const useMetProposalCriteria = (proposalType: ProposalType = ProposalType.STANDARD) => {
  const { account } = useWallet()
  const { data: gmRequired, isLoading: isLoadingGMRequired } = useGMRequiredByProposalType(proposalType)
  const { data: userGMs, isLoading: isLoadingUserGMs } = useGetUserGMs(account?.address)
  const hasRequiredGM = useMemo(() => {
    return userGMs?.some(gm => Number(gm.tokenLevel) >= (gmRequired ?? 1))
  }, [userGMs, gmRequired])
  return { hasMetProposalCriteria: !!hasRequiredGM, isLoading: isLoadingGMRequired || isLoadingUserGMs }
}
