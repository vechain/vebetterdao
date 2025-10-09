import { HStack, VStack, Text, Heading, Card, Button } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import { FiArrowUpRight } from "react-icons/fi"

import { ProposalBox } from "./ProposalBox"

import { ProposalEnriched, GrantProposalEnriched } from "@/hooks/proposals/grants/types"

type Props = {
  firstProposals?: ProposalEnriched[] | GrantProposalEnriched[]
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
  if (!firstProposals || firstProposals.length == 0) return null
  return (
    <Card.Root w={"full"} variant="primary">
      <Card.Body>
        <HStack w={"full"} alignItems="center" justifyContent={"space-between"} mb={{ base: 2, md: 4 }}>
          <Heading size={{ base: "lg", md: "xl" }} fontWeight={"bold"}>
            {isCreatedProposals ? t("Created Proposals") : t("Voted Proposals")}
          </Heading>
          {isMoreProposals && (
            <Button variant="ghost" size="sm" color="actions.tertiary.default" onClick={onSeeAllProposals}>
              <Text textStyle="sm" color="actions.tertiary.default" fontWeight="semibold">
                {t("See All")}
              </Text>
              <FiArrowUpRight size={16} />
            </Button>
          )}
        </HStack>
        <VStack w={"full"} gap={4}>
          {firstProposals?.map(proposal => (
            <ProposalBox
              key={proposal.id}
              proposalId={proposal.id}
              metadata={{
                title: proposal.title,
                shortDescription: proposal.description,
                markdownDescription: proposal.markdownDescription,
              }}
            />
          ))}
        </VStack>
      </Card.Body>
    </Card.Root>
  )
}
