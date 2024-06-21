import { useTweets } from "@/api/twitter/hooks/useTweets"
import { useCurrentAppMetadata } from "@/app/apps/[appId]/hooks"
import { Spinner, VStack } from "@chakra-ui/react"
import { useCallback, useMemo, useState } from "react"
import InfiniteScroll from "react-infinite-scroll-component"
import { TweetCard } from "./components/TweetCard"

type Props = {
  editMode: boolean
  tweetsToRemove: string[]
  removeTweet: (tweet: string) => void
}

const STEP = 10

export const TweetList = ({ editMode, tweetsToRemove, removeTweet }: Props) => {
  const { appMetadata, appMetadataLoading } = useCurrentAppMetadata()

  const metadataTweets = useMemo(() => appMetadata?.tweets?.filter(Boolean) ?? [], [appMetadata?.tweets])
  const filteredMetadataTweets = useMemo(
    () => metadataTweets.filter(tweet => !tweetsToRemove.includes(tweet)),
    [metadataTweets, tweetsToRemove],
  )

  const [visibleTweetIds, setVisibleTweetIds] = useState<string[]>(metadataTweets?.slice(0, STEP))

  const filteredTweetId = useMemo(() => {
    return visibleTweetIds.filter(tweet => !tweetsToRemove.includes(tweet)).filter(Boolean) as string[]
  }, [tweetsToRemove, visibleTweetIds])

  const visibleTweets = useTweets(filteredTweetId)

  const loadData = useCallback(() => {
    setVisibleTweetIds(prev => [
      ...prev,
      ...(metadataTweets?.slice(visibleTweets.length, visibleTweets.length + STEP) ?? []),
    ])
  }, [metadataTweets, visibleTweets.length])

  if (!appMetadata) {
    return null
  }

  if (appMetadataLoading) {
    return <Spinner size="md" alignSelf={"center"} />
  }
  return (
    <InfiniteScroll
      dataLength={filteredMetadataTweets.length}
      next={loadData}
      hasMore={visibleTweets.length < filteredMetadataTweets.length}
      loader={<Spinner size="md" alignSelf={"center"} />}>
      <VStack alignItems="stretch" p={3}>
        {visibleTweets?.map((tweetQuery, index) => (
          <TweetCard key={index} tweetQuery={tweetQuery} editMode={editMode} removeTweet={removeTweet} />
        ))}
      </VStack>
    </InfiniteScroll>
  )
}
