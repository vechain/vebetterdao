import { HStack, VStack, Heading, Text, Card, Icon, Divider, Center, Stack, Hide } from "@chakra-ui/react"
import { B3TRIcon } from "@/components/Icons/B3TRIcon"
import { GrantsProposalStatusBadge } from "@/components/Proposal/Grants"
import { FaXTwitter } from "react-icons/fa6"
import { AiOutlineDiscord } from "react-icons/ai"
import { useRouter } from "next/navigation"
import { ProposalState, GrantProposalEnriched } from "@/hooks/proposals/grants/types"
import { formatTimeLeft, humanAddress, humanDomain } from "@repo/utils/FormattingUtils"
import { useTranslation } from "react-i18next"
import { AddressIcon } from "@/components/AddressIcon"
import { useVechainDomain } from "@vechain/vechain-kit"
import { LiaDiscourse } from "react-icons/lia"
import { useEstimateFutureRoundTimestamp } from "@/hooks"
import { useCurrentAllocationsRoundId } from "@/api"

type GrantsProposalCardProps = {
  proposal: GrantProposalEnriched
}

//TODO: Move to a separate common component
const AddressWithProfilePicture = ({ address }: { address: string }) => {
  const { data: vechainDomain } = useVechainDomain(address)
  const displayAddress = vechainDomain?.domain
    ? humanDomain(vechainDomain.domain, 18, 0)
    : humanAddress(address ?? "", 6, 3)
  return (
    <HStack gap={2} alignItems="center">
      <AddressIcon boxSize={4} borderRadius="full" address={address} />
      <Text>{displayAddress}</Text>
    </HStack>
  )
}

export const GrantsProposalCard = ({ proposal }: GrantsProposalCardProps) => {
  const router = useRouter()
  const { t } = useTranslation()
  const isSupportOrVotingPhase = proposal.state === ProposalState.Pending || proposal.state === ProposalState.Active
  const { data: currentRoundId } = useCurrentAllocationsRoundId()
  const supportPhaseEndsAt = useEstimateFutureRoundTimestamp({
    currentRoundId: currentRoundId ?? "",
    targetRoundId: proposal.votingRoundId,
  })
  const votingPhaseEndsAt = useEstimateFutureRoundTimestamp({
    currentRoundId: currentRoundId ?? "",
    targetRoundId: proposal.votingRoundId,
  })

  const endsAt = proposal.state === ProposalState.Pending ? supportPhaseEndsAt : votingPhaseEndsAt

  const goToProposal = () => {
    router.push(`/proposals/${proposal.id}`)
  }

  return (
    <Card w="full" p={{ base: 5, md: 7 }} cursor="pointer" onClick={goToProposal}>
      <VStack w="full" gap={4} alignItems="flex-start">
        {/* Title */}
        <Heading size="md" noOfLines={2}>
          {proposal.title}
        </Heading>

        {/* B3TR and dApp Grant */}
        <Stack direction={{ base: "column", md: "row" }} w="full" fontSize={{ base: "14px", md: "16px" }} gap={4}>
          <HStack>
            <B3TRIcon boxSize={{ base: "14px", md: "16px" }} />
            <Text>
              {proposal.grantAmount} {"B3TR"}
            </Text>
            <Hide below="md">
              <Text>
                {"•"} {proposal?.grantType} {/* TODO: Improve this and include "Grant" at the end */}
              </Text>
            </Hide>
            <Center height="20px">
              <Divider orientation="vertical" />
            </Center>
            <AddressWithProfilePicture address={proposal.proposerAddress} />
            <Center height="20px">
              <Divider orientation="vertical" />
            </Center>
          </HStack>
          <HStack fontSize={{ base: "14px", md: "20px" }} gap={"16px"}>
            <Icon as={LiaDiscourse} />
            <Icon as={FaXTwitter} />
            <Icon as={AiOutlineDiscord} />
          </HStack>
        </Stack>
        <Divider w="full" h={1} />
        {/* Footer */}
        <Stack
          w="full"
          h="full"
          justifyContent="space-between"
          alignContent="center"
          direction={{ base: "column", md: "row" }}
          gap={2}>
          <HStack w="full">
            <GrantsProposalStatusBadge state={proposal.state} />
            {isSupportOrVotingPhase && endsAt ? (
              <Text fontSize={{ base: "10px", md: "14px" }}>
                {t("End: {{endDate}}", {
                  endDate: formatTimeLeft(endsAt),
                })}
              </Text>
            ) : null}
          </HStack>
          <HStack gap={{ base: 3, md: 4 }}>
            {/* {communityInteractions[proposal.state as keyof typeof communityInteractions]?.map(interaction => (
              <HStack key={interaction.percentage} fontSize={{ base: "14px", md: "16px" }} gap={1}>
                {interaction.icon}
                <Text>{`${interaction.percentage}%`}</Text>
              </HStack>
            ))} */}
          </HStack>
        </Stack>
      </VStack>
    </Card>
  )
}
