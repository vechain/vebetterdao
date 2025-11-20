import { Heading, HStack, VStack } from "@chakra-ui/react"

import { GrantDetail } from "@/app/grants/types"
import { ProposalDetail } from "@/app/proposals/types"

import { GrantsProposalStatusBadge } from "../../../../../components/Proposal/Grants/GrantsProposalStatusBadge"
import { AddressWithProfilePicture } from "../../../../components/AddressWithProfilePicture/AddressWithProfilePicture"

type ProposalOverviewHeaderProps = {
  proposal: ProposalDetail | GrantDetail
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
          // TODO: fix this state
          state={proposal?.state || 0}
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
        {proposal?.metadata?.title || "-"}
      </Heading>
    </VStack>
  )
}
