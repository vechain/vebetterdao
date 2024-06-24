import { IconButton, VStack } from "@chakra-ui/react"
import { UseQueryResult } from "@tanstack/react-query"
import { EmbeddedTweet, TweetSkeleton } from "react-tweet"
import { Tweet } from "react-tweet/api"
import { motion } from "framer-motion"
import { UilTrash } from "@iconscout/react-unicons"

type Props = {
  tweetQuery: UseQueryResult<Tweet, Error>
  editMode: boolean
  removeTweet: (tweet: string) => void
}

export const TweetCard = ({ tweetQuery, editMode, removeTweet }: Props) => {
  const { data: tweet, isLoading: isTweetLoading, error: tweetError } = tweetQuery

  const animation = editMode
    ? {
        transition: {
          duration: 0.2,
          repeat: Infinity,
          delay: Math.random() * 0.2,
        },
        animate: {
          rotate: [0, 0.1, -0.1, 0],
        },
      }
    : {}
  if (tweetError) {
    return null
  }
  return (
    <motion.div {...animation}>
      <VStack align="stretch">
        {tweet && !isTweetLoading ? <EmbeddedTweet key={tweet.id_str} tweet={tweet} /> : <TweetSkeleton />}
        {!isTweetLoading && (
          <IconButton
            rounded="full"
            color="#D23F63"
            bgColor="#FCEEF1"
            _hover={{ bgColor: "#FCEEF1DD" }}
            aria-label="Delete screenshot"
            icon={<UilTrash size="24px" />}
            position="absolute"
            top={"-10px"}
            right={"-10px"}
            colorScheme="red"
            onClick={() => tweet?.id_str && removeTweet(tweet.id_str)}
          />
        )}
      </VStack>
    </motion.div>
  )
}
