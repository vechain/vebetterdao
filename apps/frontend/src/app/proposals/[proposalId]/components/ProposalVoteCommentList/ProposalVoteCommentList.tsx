import { Card, CardBody, Heading, Text, VStack } from "@chakra-ui/react"
import { t } from "i18next"

//TODO: Re-enable everything once we have indexer
export const ProposalVoteCommentList = () => {
  //   const [visibleComments, setVisibleComments] = useState<ProposalVoteEvent[]>([])

  //   const sortedComments = useMemo(
  //     () =>
  //       proposal.votesWithComment?.sort((a, b) => {
  //         return b.blockMeta.blockNumber - a.blockMeta.blockNumber
  //       }) ?? [],
  //     [proposal.votesWithComment],
  //   )

  //   const loadData = useCallback(() => {
  //     setVisibleComments(prev => [
  //       ...prev,
  //       ...(sortedComments.slice(visibleComments.length, visibleComments.length + 10) ?? []),
  //     ])
  //   }, [sortedComments, visibleComments.length])

  //   if (!sortedComments.length) return null
  return (
    <Card variant="baseWithBorder">
      <CardBody>
        <VStack alignItems="stretch" gap={4}>
          <Heading fontWeight={700} fontSize="24px">
            {t("Proposal Comments")}
          </Heading>
          <Text color="#7E7E7E">{t("Users who have made a comment along with their vote")}</Text>
          {/* <InfiniteScroll
            dataLength={visibleComments.length}
            next={loadData}
            hasMore={visibleComments.length < sortedComments.length}
            loader={<Spinner size="md" alignSelf={"center"} />}
            endMessage={
              <Heading size="md" textAlign={"center"} mt={4}>
                {t("You reached the end!")}
              </Heading>
            }>
            <VStack alignItems="stretch">
              {visibleComments?.map(vote => <ProposalVoteComment key={vote.account} vote={vote} />)}
            </VStack>
          </InfiniteScroll> */}
        </VStack>
      </CardBody>
    </Card>
  )
}
