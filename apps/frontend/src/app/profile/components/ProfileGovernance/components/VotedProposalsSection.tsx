import { compareAddresses } from "@repo/utils/AddressUtils"
import { useWallet } from "@vechain/vechain-kit"
import { useMemo } from "react"

import { useUserProposalsVoteEvents } from "../../../../../api/contracts/governance/hooks/useUserProposalsVoteEvents"
import { useUserVotedProposals } from "../../../../../api/contracts/governance/hooks/useUserVotedProposals"

import { EmptyVotedProposals } from "./EmptyVotedProposals"
import { PreviewCreatedProposals } from "./PreviewCreatedProposals"

type Props = {
  address: string
  onSeeAll: () => void
  onExploreGovernance: () => void
  previewSize?: number
}

export const VotedProposalsSection = ({ address, onSeeAll, onExploreGovernance, previewSize = 3 }: Props) => {
  const { account } = useWallet()
  const isConnectedUser = compareAddresses(address, account?.address ?? "")

  const { data: votedProposals } = useUserProposalsVoteEvents(address)

  const votedProposalsIds = useMemo(() => votedProposals?.map(proposal => proposal.proposalId), [votedProposals])

  const votedProposalsWithDescription = useUserVotedProposals(votedProposalsIds)

  const firstProposals = useMemo(
    () => votedProposalsWithDescription?.slice(0, previewSize),
    [votedProposalsWithDescription, previewSize],
  )

  const isMoreProposals = useMemo(() => {
    if (!votedProposals) return false
    return votedProposals.length > previewSize
  }, [votedProposals, previewSize])

  const hasProposals = firstProposals && firstProposals.length > 0

  if (!hasProposals) {
    return (
      <EmptyVotedProposals address={address} isConnectedUser={isConnectedUser} onExploreClick={onExploreGovernance} />
    )
  }

  return (
    <PreviewCreatedProposals
      firstProposals={firstProposals}
      isMoreProposals={isMoreProposals}
      onSeeAllProposals={onSeeAll}
    />
  )
}
