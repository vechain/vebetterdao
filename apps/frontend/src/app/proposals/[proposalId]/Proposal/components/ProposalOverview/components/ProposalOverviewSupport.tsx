import { ProposalState, useCurrentProposal } from "@/api"
import { Arm } from "@/components/Icons/Arm"
import { HStack, Image, Text, VStack } from "@chakra-ui/react"
import { UilArrowUpRight } from "@iconscout/react-unicons"

export const ProposalOverviewSupport = () => {
  const { proposal } = useCurrentProposal()

  if (proposal.state === ProposalState.DepositNotMet) {
    return (
      <VStack alignItems={"stretch"}>
        <Text fontWeight={"400"} color="#6A6A6A">
          Community Support
        </Text>
        <HStack>
          <Arm />
          <Text color="#252525">N.A. %</Text>
        </HStack>
      </VStack>
    )
  }

  if (proposal.state === ProposalState.Defeated) {
    return (
      <>
        <VStack alignItems={"stretch"}>
          <Text fontWeight={"400"} color="#6A6A6A">
            Community Support
          </Text>
          <HStack>
            <Arm color="#D23F63" />
            <Text color="#252525">N.A. %</Text>
          </HStack>
        </VStack>
      </>
    )
  }

  return (
    <VStack alignItems={"stretch"}>
      <Text fontWeight={"400"} color="#6A6A6A">
        Your Support
      </Text>
      <HStack gap={2}>
        <Image h="20px" w="20px" src="/images/vot3-token.png" />
        <Text color="#252525" fontWeight={600}>
          {proposal.yourSupport}
        </Text>
        <Text color="#252525">V3</Text>
        <UilArrowUpRight size="20px" color="#004CFC" />
      </HStack>
    </VStack>
  )
}
