import { ProposalCommentsRequest, useProposalComments } from "@/api"
import { SelectField } from "@/components"
import { Center, createListCollection, Heading, HStack, Spinner, VStack } from "@chakra-ui/react"
import { UilSortAmountDown } from "@iconscout/react-unicons"
import { t } from "i18next"
import { useState } from "react"
import InfiniteScroll from "react-infinite-scroll-component"

import { ProposalVoteComment } from "../ProposalVoteComment/ProposalVoteComment"

enum VoteType {
  FOR = "FOR",
  AGAINST = "AGAINST",
  ABSTAIN = "ABSTAIN",
  ALL = "ALL",
}

type Props = {
  proposalId?: string
}

export const ProposalVoteCommentList = ({ proposalId }: Props) => {
  const sortOptions = createListCollection({
    items: [
      { label: "Newest", value: "desc" },
      { label: "Oldest", value: "asc" },
    ],
  })
  const filterOptions = createListCollection({
    items: [
      { label: "All", value: String(VoteType.ALL) },
      { label: "For", value: String(VoteType.FOR) },
      { label: "Against", value: VoteType.AGAINST },
      { label: "Abstain", value: VoteType.ABSTAIN },
    ],
  })
  const defaultSortOption = "desc" as ProposalCommentsRequest["direction"] //DESC as default
  const [direction, setDirection] = useState<ProposalCommentsRequest["direction"]>(defaultSortOption)
  const [activeFilter, setFilter] = useState<VoteType>(VoteType.ALL)
  const { data, fetchNextPage, hasNextPage } = useProposalComments(proposalId ?? "", {
    ...(activeFilter !== VoteType.ALL && { support: activeFilter }),
    direction,
  })

  const visibleComments = data?.pages.flatMap(page => page.data)
  const commentsCount = visibleComments?.length ?? 0

  if (!commentsCount || !proposalId) return null

  return (
    <VStack alignItems="stretch" gap={4}>
      <HStack justifyContent="space-between" w="full">
        <Heading fontWeight={700} fontSize="24px" w="full">
          {t("Comments ({{amount}})", { amount: commentsCount })}
        </Heading>
        <HStack w="full" justifyContent="flex-end">
          <SelectField
            placeholder={t("Filter")}
            options={filterOptions}
            defaultValue={defaultSortOption}
            onChange={value => setFilter(value[0] as VoteType)}
          />
          <SelectField
            placeholder={t("Sort By")}
            options={sortOptions}
            leftIcon={UilSortAmountDown}
            defaultValue={defaultSortOption}
            onChange={value => setDirection(value[0] as ProposalCommentsRequest["direction"])}
          />
        </HStack>
      </HStack>

      <InfiniteScroll
        dataLength={commentsCount}
        next={fetchNextPage}
        hasMore={hasNextPage}
        loader={
          <Center p={4}>
            <Spinner size="md" mt={4} alignSelf="center" />
          </Center>
        }
        endMessage={
          <Heading size="xl" textAlign={"center"} mt={4}>
            {t("You reached the end!")}
          </Heading>
        }>
        <VStack alignItems="stretch" gap={"24px"}>
          {visibleComments?.map(vote => (
            <ProposalVoteComment key={vote.voter} vote={vote} />
          ))}
        </VStack>
      </InfiniteScroll>
    </VStack>
  )
}
