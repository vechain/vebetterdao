import { useCurrentProposal } from "@/api"
import { HStack, Image, Text, VStack } from "@chakra-ui/react"
import { UilArrowUpRight } from "@iconscout/react-unicons"

export const ProposalOverviewSupport = () => {
  const { proposal } = useCurrentProposal()
  if (proposal.isDepositPending) {
    return (
      <VStack alignItems={"stretch"}>
        <Text fontWeight={"400"} color="#6A6A6A">
          Community Support
        </Text>
        <HStack>
          <Image h="20px" w="20px" src="/icons/arm.svg" />
          <Text color="#252525">N.A. %</Text>
        </HStack>
      </VStack>
    )
  }
  return (
    <VStack alignItems={"stretch"}>
      <Text fontWeight={"400"} color="#6A6A6A">
        Your Support
      </Text>
      <HStack gap={2}>
        <Image h="20px" w="20px" src="/icons/vot3-token.png" />
        <Text color="#252525" fontWeight={600}>
          {proposal.yourSupport}
        </Text>
        <Text color="#252525">V3</Text>
        <UilArrowUpRight size="20px" color="#004CFC" />
      </HStack>
    </VStack>
  )
}
