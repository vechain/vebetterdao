import { HStack, VStack, Heading, Card, Button } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import { FiArrowUpRight } from "react-icons/fi"

import { GrantDetail } from "@/app/grants/types"
import { ProposalDetail } from "@/app/proposals/types"

import { ProposalBox } from "./ProposalBox"

type Props = {
  firstProposals?: (ProposalDetail | GrantDetail)[]
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
            <Button variant="ghost" size="sm" onClick={onSeeAllProposals} fontWeight="semibold">
              {t("See All")}
              <FiArrowUpRight size={16} />
            </Button>
          )}
        </HStack>
        <VStack w={"full"} gap={4}>
          {firstProposals?.map(proposal => (
            <ProposalBox
              key={proposal.proposalId.toString()}
              proposalId={proposal.proposalId}
              metadata={proposal.metadata}
              state={proposal.state}
              depositReached={proposal.depositReached}
            />
          ))}
        </VStack>
      </Card.Body>
    </Card.Root>
  )
}
