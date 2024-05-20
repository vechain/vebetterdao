import { ProposalState, useCurrentProposal } from "@/api"
import { Arm } from "@/components/Icons/Arm"
import { HStack, Text, VStack } from "@chakra-ui/react"
import { useMemo } from "react"

export const ProposalOverviewCommunitySupport = () => {
  const { proposal } = useCurrentProposal()

  const arcIconColor = useMemo(() => {
    if (proposal.state === ProposalState.DepositNotMet) {
      return "#D23F63"
    }
    if (proposal.state === ProposalState.Pending) {
      return proposal.isDepositReached ? "#6DCB09" : "#F29B32"
    }
  }, [proposal])

  switch (proposal.state) {
    case ProposalState.DepositNotMet:
    case ProposalState.Pending:
      return (
        <VStack alignItems={"stretch"}>
          <Text fontWeight={"400"} color="#6A6A6A">
            Community support
          </Text>
          <HStack>
            <Arm color={arcIconColor} />
            <Text color="#252525">{Math.floor(proposal.communityDepositPercentage)}%</Text>
          </HStack>
        </VStack>
      )
  }
}
