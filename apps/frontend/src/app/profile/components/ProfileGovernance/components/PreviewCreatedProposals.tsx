import { HStack, VStack, Heading, Card, Button } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import { FiArrowUpRight } from "react-icons/fi"

import { ProposalEnriched, GrantProposalEnriched } from "@/hooks/proposals/grants/types"
import { VoteType } from "@/types/voting"

import { ProposalBox } from "./ProposalBox"

type Props = {
  firstProposals?: ProposalEnriched[] | GrantProposalEnriched[]
  isMoreProposals?: boolean
  isCreatedProposals?: boolean
  onSeeAllProposals?: () => void
  voteTypes?: Record<string, VoteType>
}
export const PreviewCreatedProposals = ({
  firstProposals,
  isCreatedProposals,
  isMoreProposals,
  onSeeAllProposals,
  voteTypes,
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
            <Button variant="ghost" size="sm" onClick={onSeeAllProposals} fontWeight="semibold">
              {t("See All")}
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
              voteType={voteTypes?.[proposal.id]}
            />
          ))}
        </VStack>
      </Card.Body>
    </Card.Root>
  )
}
