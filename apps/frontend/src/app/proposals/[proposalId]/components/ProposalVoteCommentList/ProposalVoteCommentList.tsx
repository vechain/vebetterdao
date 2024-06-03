import { useCurrentProposal } from "@/api"
import { Card, CardBody, Heading, Text, VStack } from "@chakra-ui/react"
import { t } from "i18next"
import { ProposalVoteComment } from "./components/ProposalVoteComment"

export const ProposalVoteCommentList = () => {
  const { proposal } = useCurrentProposal()

  if (!proposal.votesWithComment?.length) return null
  return (
    <Card variant="baseWithBorder">
      <CardBody>
        <VStack alignItems="stretch" gap={4}>
          <Heading fontWeight={700} fontSize="24px">
            {t("Proposal Comments")}
          </Heading>
          <Text color="#7E7E7E">{t("Users who have made a comment along with their vote")}</Text>
          <VStack alignItems="stretch">
            {proposal.votesWithComment?.map(vote => <ProposalVoteComment key={vote.account} vote={vote} />)}
          </VStack>
        </VStack>
      </CardBody>
    </Card>
  )
}
