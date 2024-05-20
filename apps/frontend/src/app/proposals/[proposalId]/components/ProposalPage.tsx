import { VStack } from "@chakra-ui/react"
import { ProposalOverview } from "./ProposalOverview"
import { ProposalCommunitySupport } from "./ProposalCommunitySupport"

export const ProposalPage = () => {
  return (
    <VStack w="full" alignItems="stretch">
      {/* <ProposalOverview /> */}
      <ProposalCommunitySupport />
    </VStack>
  )
}
