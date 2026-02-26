"use client"

import { Box } from "@chakra-ui/react"
import { useMemo } from "react"
import {
  type TwitterComponents,
  TweetHeader,
  TweetBody,
  TweetMedia,
  TweetInfo,
  QuotedTweet,
  enrichTweet,
} from "react-tweet"
import type { Tweet } from "react-tweet/api"

import "./tweetStyle.css"

type Props = {
  tweet: Tweet
  components?: TwitterComponents
}

export const ThemedTweet = ({ tweet: t, components }: Props) => {
  const tweet = useMemo(() => enrichTweet(t), [t])

  return (
    <Box
      className="themed-tweet"
      w="full"
      overflow="hidden"
      bg="card.default"
      border="sm"
      borderColor="border.secondary"
      rounded="xl"
      color="text.default"
      transition="background-color 0.2s"
      _hover={{ bg: "card.hover" }}>
      <Box px={4} py={3}>
        <TweetHeader tweet={tweet} components={components} />
        <TweetBody tweet={tweet} />
        {tweet.mediaDetails?.length ? <TweetMedia tweet={tweet} components={components} /> : null}
        {tweet.quoted_tweet && <QuotedTweet tweet={tweet.quoted_tweet} components={components} />}

        <Box mt={4}>
          <TweetInfo tweet={tweet} />
        </Box>
      </Box>
    </Box>
  )
}
