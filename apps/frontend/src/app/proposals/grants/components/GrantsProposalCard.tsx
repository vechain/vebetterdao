import { HStack, VStack, Heading, Text, Card, Icon, Divider, Center } from "@chakra-ui/react"
import { B3TRIcon } from "@/components/Icons/B3TRIcon"
import { UilLink, UilClock } from "@iconscout/react-unicons"
import { GrantsProposalStatusBadge } from "@/components/Proposal/Grants"
import { FaXTwitter } from "react-icons/fa6"
import { AiOutlineDiscord } from "react-icons/ai"
import { useRouter } from "next/navigation"
import { PiTelegramLogo } from "react-icons/pi"
import { ProposalEnriched } from "@/hooks/proposals/grants/types"
import { ProposalState } from "@/api"
import { humanAddress } from "@repo/utils/FormattingUtils"

type GrantsProposalCardProps = {
  proposal: ProposalEnriched
}

export const GrantsProposalCard = ({ proposal }: GrantsProposalCardProps) => {
  const router = useRouter()
  const isSupportOrVotingPhase = proposal.state === ProposalState.Pending || proposal.state === ProposalState.Active

  const goToProposal = () => {
    router.push(`/proposals/${proposal.id}`)
  }
  return (
    <Card w="full" p={{ base: 5, md: 10 }} cursor="pointer" onClick={goToProposal}>
      <VStack w="full" gap={2} alignItems="flex-start">
        {/* Title */}
        <Heading size="md" noOfLines={2}>
          {proposal.title}
        </Heading>

        {/* B3TR and dApp Grant */}
        <HStack w="full" fontSize={{ base: "14px", md: "16px" }}>
          <B3TRIcon boxSize={{ base: "14px", md: "16px" }} />
          <Text>{proposal.b3tr}</Text>
          <Text>
            {"•"} {proposal.dAppGrant}
          </Text>
        </HStack>
        <HStack w="full" align="stretch">
          <Text fontSize={{ base: "14px", md: "16px" }}>{humanAddress(proposal.proposer.addressOrDomain, 4, 4)}</Text>
          <Center height="20px">
            <Divider orientation="vertical" />
          </Center>
          <HStack fontSize={{ base: "14px", md: "16px" }}>
            <Icon as={UilLink} />
            <Icon as={FaXTwitter} />
            <Icon as={AiOutlineDiscord} />
            <Icon as={PiTelegramLogo} />
          </HStack>
          {isSupportOrVotingPhase && (
            <>
              <Center height="20px">
                <Divider orientation="vertical" />
              </Center>
              <HStack fontSize={{ base: "14px", md: "16px" }}>
                <Icon as={UilClock} />
                <Text>{proposal?.phases?.[proposal.state as keyof typeof proposal.phases]?.startAt}</Text>
              </HStack>
            </>
          )}
        </HStack>
        <Divider w="full" h={1} />
        {/* Footer */}
        <HStack w="full" pt={5} justify="space-between" align="center">
          <GrantsProposalStatusBadge state={proposal.state} />
          {/* <HStack>
            {proposal.communityInteractions[proposal.state as keyof typeof proposal.communityInteractions]?.map(
              interaction => (
                <HStack key={interaction.percentage} fontSize={{ base: "14px", md: "16px" }} gap={1}>
                  {interaction.icon}
                  <Text>{`${interaction.percentage}%`}</Text>
                </HStack>
              ),
            )}
          </HStack> */}
        </HStack>
      </VStack>
    </Card>
  )
}
