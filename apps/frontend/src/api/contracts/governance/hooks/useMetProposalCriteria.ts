import { useGMRequiredByProposalType } from "@/api/contracts/governance/hooks/useGMRequiredByProposalType"
import { ProposalType } from "@/types"
import { useMemo } from "react"
import { useGetUserGMs } from "../../galaxyMember"
import { useWallet } from "@vechain/vechain-kit"

/**
 * Hook to get the GM level required by proposal type
 * @param proposalType - The type of proposal to get the GM required for. If not provided, the standard proposal GM required is returned.
 * @returns the GM level required for the proposal type
 */
export const useMetProposalCriteria = (proposalType: ProposalType = ProposalType.STANDARD) => {
  const { account } = useWallet()
  const { data: gmRequired } = useGMRequiredByProposalType(proposalType)

  const { data: userGMs } = useGetUserGMs(account?.address)
  const hasMoonNft = useMemo(() => {
    return userGMs?.some(gm => Number(gm.tokenLevel) >= (gmRequired ?? 2))
  }, [userGMs, gmRequired])

  return hasMoonNft ?? false
}
