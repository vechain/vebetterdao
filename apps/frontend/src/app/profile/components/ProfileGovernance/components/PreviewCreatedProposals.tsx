import { ProposalCreatedEvent, ProposalMetadata, useIpfsMetadatas } from "@/api"
import { toIPFSURL, validateIpfsUri } from "@/utils"
import { HStack, VStack, Text, Card, Icon } from "@chakra-ui/react"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { FiArrowUpRight } from "react-icons/fi"
import { ProposalBox } from "."

type Props = {
  firstProposals?: ProposalCreatedEvent[]
  isMoreProposals?: boolean
  isCreatedProposals?: boolean
  onSeeAllProposals?: () => void
}

export const PreviewCreatedProposals = ({
  firstProposals,
  isCreatedProposals,
  isMoreProposals,
  onSeeAllProposals,
}: Props) => {
  const { t } = useTranslation()

  const proposalsURIs = useMemo(() => {
    if (!firstProposals) return []

    return firstProposals
      .map(proposal => {
        const ipfsURL = toIPFSURL(proposal.description)

        // Add only if valid IPFS URI
        if (validateIpfsUri(ipfsURL)) return ipfsURL
      })
      .filter(uri => uri !== undefined) as string[]
  }, [firstProposals])

  const proposalsMetadata = useIpfsMetadatas<ProposalMetadata>(proposalsURIs ?? [])

  const firstProposalsWithMetadata = useMemo(() => {
    if (!firstProposals || !proposalsMetadata) return null

    return firstProposals.map((proposal, index) => {
      return {
        ...proposal,
        metadata: proposalsMetadata[index]?.data,
      }
    })
  }, [firstProposals, proposalsMetadata])

  if (!firstProposals || firstProposals.length == 0) return null

  return (
    <Card.Root w={"full"} variant="primary">
      <Card.Body>
        <HStack w={"full"} justifyContent={"space-between"} mb={{ base: 2, md: 4 }}>
          <Text textStyle={{ base: "lg", md: "xl" }} fontWeight={"bold"}>
            {isCreatedProposals ? t("Created Proposals") : t("Voted Proposals")}
          </Text>
          {isMoreProposals && (
            <HStack onClick={onSeeAllProposals}>
              <Text textStyle={{ base: "sm", md: "md" }} color="actions.tertiary.default" fontWeight="semibold">
                {t("See All")}
              </Text>
              <Icon as={FiArrowUpRight} boxSize={4} color="actions.tertiary.default" />
            </HStack>
          )}
        </HStack>
        <VStack w={"full"} gap={4}>
          {firstProposalsWithMetadata?.map(proposal => (
            <ProposalBox key={proposal.proposalId} proposalId={proposal.proposalId} metadata={proposal.metadata} />
          ))}
        </VStack>
      </Card.Body>
    </Card.Root>
  )
}
