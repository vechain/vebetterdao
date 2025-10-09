import { Heading, HStack, VStack } from "@chakra-ui/react"

import { GrantsProposalStatusBadge } from "../../../../../components/Proposal/Grants/GrantsProposalStatusBadge"
import { AddressWithProfilePicture } from "../../../../components/AddressWithProfilePicture/AddressWithProfilePicture"

import { GrantProposalEnriched, ProposalEnriched } from "@/hooks/proposals/grants/types"

type ProposalOverviewHeaderProps = {
  proposal: ProposalEnriched | GrantProposalEnriched
  hasUserDeposited: boolean
  hasUserVoted: boolean
  depositReached: boolean
  proposerAddress: string
}
export const ProposalOverviewHeader = ({
  proposal,
  hasUserDeposited,
  hasUserVoted,
  depositReached,
  proposerAddress,
}: ProposalOverviewHeaderProps) => {
  return (
    <VStack align="flex-start" w="full">
      {/* Status badge and proposer info */}
      <HStack justify={"space-between"} align={"flex-start"} w="full">
        <GrantsProposalStatusBadge
          state={proposal?.state}
          hasUserSupported={hasUserDeposited}
          hasUserVoted={hasUserVoted}
          depositReached={depositReached ?? false}
        />
        <AddressWithProfilePicture address={proposerAddress} />
      </HStack>
      {/* Proposal title */}
      <Heading
        w="full"
        wordBreak="break-word"
        overflowWrap="break-word"
        size={["2xl", "4xl"]}
        py={{ base: "4", md: "10" }}>
        {proposal?.title}
      </Heading>
    </VStack>
  )
}
