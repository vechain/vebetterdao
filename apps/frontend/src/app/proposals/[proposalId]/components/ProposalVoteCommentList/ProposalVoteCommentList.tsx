import { ProposalVoteEvent, useCurrentProposal } from "@/api"
import { Card, CardBody, Heading, Spinner, Text, VStack } from "@chakra-ui/react"
import { t } from "i18next"
import { ProposalVoteComment } from "./components/ProposalVoteComment"
import InfiniteScroll from "react-infinite-scroll-component"
import { useCallback, useState } from "react"

export const ProposalVoteCommentList = () => {
  const { proposal } = useCurrentProposal()

  const [visibleComments, setVisibleComments] = useState<ProposalVoteEvent[]>([])

  const loadData = useCallback(() => {
    setVisibleComments(prev => [
      ...prev,
      ...(proposal.votesWithComment?.slice(visibleComments.length, visibleComments.length + 10) ?? []),
    ])
  }, [proposal.votesWithComment, visibleComments.length])

  if (!proposal.votesWithComment?.length) return null
  return (
    <Card variant="baseWithBorder">
      <CardBody>
        <VStack alignItems="stretch" gap={4}>
          <Heading fontWeight={700} fontSize="24px">
            {t("Proposal Comments")}
          </Heading>
          <Text color="#7E7E7E">{t("Users who have made a comment along with their vote")}</Text>
          <InfiniteScroll
            dataLength={proposal.votesWithComment?.length}
            next={loadData}
            hasMore={visibleComments.length < proposal.votesWithComment.length}
            loader={<Spinner size="md" alignSelf={"center"} />}>
            <VStack alignItems="stretch">
              {visibleComments?.map(vote => <ProposalVoteComment key={vote.account} vote={vote} />)}
            </VStack>
          </InfiniteScroll>
        </VStack>
      </CardBody>
    </Card>
  )
}
