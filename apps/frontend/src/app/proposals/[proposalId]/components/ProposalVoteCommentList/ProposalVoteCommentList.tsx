import { useProposalComments } from "@/api"
import { Card, CardBody, Center, Heading, Spinner, Text, VStack } from "@chakra-ui/react"
import { t } from "i18next"
import InfiniteScroll from "react-infinite-scroll-component"
import { ProposalVoteComment } from "./components/ProposalVoteComment"

type Props = {
  proposalId: string
}

export const ProposalVoteCommentList = ({ proposalId }: Props) => {
  const { data, fetchNextPage, hasNextPage } = useProposalComments({ proposalId })

  const visibleComments = data?.pages.map(page => page.data).flat() ?? []

  return (
    <Card variant="baseWithBorder">
      <CardBody>
        <VStack alignItems="stretch" gap={4}>
          <Heading fontWeight={700} fontSize="24px">
            {t("Proposal Comments")}
          </Heading>
          <Text color="#7E7E7E">{t("Users who have made a comment along with their vote")}</Text>
          <InfiniteScroll
            dataLength={visibleComments.length}
            next={fetchNextPage}
            hasMore={hasNextPage}
            loader={
              <Center p={4}>
                <Spinner size="md" mt={4} alignSelf="center" />
              </Center>
            }
            endMessage={
              <Heading size="md" textAlign={"center"} mt={4}>
                {t("You reached the end!")}
              </Heading>
            }>
            <VStack alignItems="stretch">
              {visibleComments?.map(vote => <ProposalVoteComment key={vote.voter} vote={vote} />)}
            </VStack>
          </InfiniteScroll>
        </VStack>
      </CardBody>
    </Card>
  )
}
