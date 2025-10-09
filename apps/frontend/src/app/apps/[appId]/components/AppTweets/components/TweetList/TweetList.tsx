import { Center, Spinner, VStack } from "@chakra-ui/react"
import { Dispatch, SetStateAction, useCallback, useMemo, useState } from "react"
import InfiniteScroll from "react-infinite-scroll-component"

import { useCurrentAppMetadata } from "../../../../hooks/useCurrentAppMetadata"

import { TweetCard } from "./components/TweetCard"

import { useTweets } from "@/api/twitter/hooks/useTweets"

type Props = {
  editMode: boolean
  tweets: string[]
  setTweets: Dispatch<SetStateAction<string[]>>
}
const STEP = 10
export const TweetList = ({ editMode, tweets, setTweets }: Props) => {
  const { appMetadata, appMetadataLoading } = useCurrentAppMetadata()
  const [visibleTweetCursor, setVisibleTweetCursor] = useState(STEP)
  const visibleTweetIds = useMemo(() => tweets.slice(0, visibleTweetCursor), [tweets, visibleTweetCursor])
  const visibleTweets = useTweets(visibleTweetIds)
  const loadData = useCallback(() => {
    setVisibleTweetCursor(prev => prev + STEP)
  }, [])
  if (!appMetadata) {
    return null
  }
  if (appMetadataLoading) {
    return <Spinner size="md" alignSelf={"center"} />
  }
  return (
    <InfiniteScroll
      dataLength={tweets.length}
      next={loadData}
      hasMore={visibleTweets.length < tweets.length}
      loader={
        <Center>
          <Spinner size="md" mt={4} alignSelf="center" />
        </Center>
      }>
      <VStack alignItems="stretch" py={3} gap={4}>
        {visibleTweets?.map((tweetQuery, index) => (
          <TweetCard
            key={`tweet-card-${tweetQuery.data?.id_str ?? index}`}
            tweetQuery={tweetQuery}
            editMode={editMode}
            index={index}
            setTweets={setTweets}
            tweets={tweets}
          />
        ))}
      </VStack>
    </InfiniteScroll>
  )
}
