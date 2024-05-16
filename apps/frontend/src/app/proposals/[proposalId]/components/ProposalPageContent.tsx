import { VStack } from "@chakra-ui/react"
import { ProposalOverview } from "./ProposalOverview"

export const ProposalPageContent = () => {
  return (
    <VStack w="full" alignItems="stretch">
      <ProposalOverview />
    </VStack>
  )
}
