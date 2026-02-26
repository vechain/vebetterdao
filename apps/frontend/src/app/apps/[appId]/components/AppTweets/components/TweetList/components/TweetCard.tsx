import { HStack, VStack } from "@chakra-ui/react"
import { UilArrowDown, UilArrowUp, UilTopArrowToTop, UilTrash } from "@iconscout/react-unicons"
import { UseQueryResult } from "@tanstack/react-query"
import { Dispatch, ReactNode, SetStateAction, useCallback } from "react"
import { TweetSkeleton } from "react-tweet"
import { Tweet } from "react-tweet/api"

import { ThemedTweet } from "../../ThemedTweet"

type Props = {
  tweetQuery: UseQueryResult<Tweet, Error>
  editMode: boolean
  index: number
  tweets: string[]
  setTweets: Dispatch<SetStateAction<string[]>>
}
export const TweetCard = ({ tweetQuery, editMode, index, tweets, setTweets }: Props) => {
  const { data: tweet, isLoading: isTweetLoading, error: tweetError } = tweetQuery
  const removeTweet = useCallback(
    (tweetId: string) => {
      setTweets(prev => prev.filter(tweet => tweet !== tweetId))
    },
    [setTweets],
  )
  const moveTweetUp = useCallback(
    (tweetId: string) => {
      const tweetIndex = tweets.indexOf(tweetId)
      if (tweetIndex === -1) return
      const newTweets = [...tweets]
      const [removedTweet] = newTweets.splice(tweetIndex, 1)
      newTweets.splice(tweetIndex - 1, 0, removedTweet as string)
      setTweets(newTweets)
    },
    [setTweets, tweets],
  )
  const moveTweetDown = useCallback(
    (tweetId: string) => {
      const tweetIndex = tweets.indexOf(tweetId)
      if (tweetIndex === -1) return
      const newTweets = [...tweets]
      const [removedTweet] = newTweets.splice(tweetIndex, 1)
      newTweets.splice(tweetIndex + 1, 0, removedTweet as string)
      setTweets(newTweets)
    },
    [setTweets, tweets],
  )
  const moveTweetOnTop = useCallback(
    (tweetId: string) => {
      const newTweets = [tweetId, ...tweets.filter(tweet => tweet !== tweetId)]
      setTweets(newTweets)
    },
    [setTweets, tweets],
  )

  const EditContainer = useCallback(
    ({ children }: { children: ReactNode }) => {
      return editMode ? (
        <HStack bg="card.subtle" rounded="xl" p={4} align={"stretch"} border="sm" borderColor="border.secondary">
          <VStack py={4} px={2} gap={4}>
            {index !== 0 && (
              <>
                {index !== 1 && (
                  <UilTopArrowToTop
                    cursor="pointer"
                    size="24px"
                    color="var(--vbd-colors-icon-default)"
                    onClick={() => tweet?.id_str && moveTweetOnTop(tweet.id_str)}
                  />
                )}
                <UilArrowUp
                  cursor="pointer"
                  size="24px"
                  color="var(--vbd-colors-icon-default)"
                  onClick={() => tweet?.id_str && moveTweetUp(tweet.id_str)}
                />
              </>
            )}
            {index !== tweets.length - 1 && (
              <UilArrowDown
                cursor="pointer"
                size="24px"
                color="var(--vbd-colors-icon-default)"
                onClick={() => tweet?.id_str && moveTweetDown(tweet.id_str)}
              />
            )}
            <UilTrash
              cursor="pointer"
              size="24px"
              color="var(--vbd-colors-red-solid)"
              onClick={() => tweet?.id_str && removeTweet(tweet.id_str)}
            />
          </VStack>
          <VStack flex={1} align={"stretch"}>
            {children}
          </VStack>
        </HStack>
      ) : (
        children
      )
    },
    [editMode, index, moveTweetDown, moveTweetOnTop, moveTweetUp, removeTweet, tweet?.id_str, tweets.length],
  )

  if (tweetError) {
    return null
  }
  return (
    <EditContainer>
      <VStack align="stretch" mt={-2}>
        {tweet && !isTweetLoading ? <ThemedTweet tweet={tweet} /> : <TweetSkeleton />}
      </VStack>
    </EditContainer>
  )
}
