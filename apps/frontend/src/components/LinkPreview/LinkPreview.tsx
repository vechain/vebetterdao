"use client"

import { Box, HStack, Icon, Image, Link, Skeleton, Text, VStack } from "@chakra-ui/react"
import { useMemo } from "react"
import { LuExternalLink } from "react-icons/lu"
import { TweetSkeleton } from "react-tweet"

import { useTweet } from "@/api/twitter/hooks/useTweets"
import { ThemedTweet } from "@/app/apps/[appId]/components/AppTweets/components/ThemedTweet"
import { useOgMetadata } from "@/hooks/useOgMetadata"

type Props = {
  url: string
}

const TWEET_URL_REGEX = /^https:\/\/(twitter|x)\.com\/.*\/status\/(\d+)/
const extractTweetId = (url: string): string | null => url.match(TWEET_URL_REGEX)?.[2] ?? null

export const LinkPreview = ({ url }: Props) => {
  const tweetId = useMemo(() => extractTweetId(url), [url])

  if (tweetId) return <TweetPreview tweetId={tweetId} url={url} />
  return <OgPreview url={url} />
}

const TweetPreview = ({ tweetId, url }: { tweetId: string; url: string }) => {
  const { data: tweet, isLoading, error } = useTweet(tweetId)

  if (isLoading) return <TweetSkeleton />
  if (error || !tweet) return <FallbackLink url={url} />

  return <ThemedTweet tweet={tweet} />
}

const OgPreview = ({ url }: { url: string }) => {
  const { data: og, isLoading, error } = useOgMetadata(url)

  if (isLoading) {
    return (
      <Box p={3} borderRadius="lg" border="sm" borderColor="border.secondary">
        <VStack gap={2} align="stretch">
          <Skeleton h="4" w="60%" />
          <Skeleton h="3" w="80%" />
        </VStack>
      </Box>
    )
  }

  if (error || (!og?.title && !og?.description)) return <FallbackLink url={url} />

  return (
    <Link href={url} target="_blank" rel="noopener noreferrer" _hover={{ textDecoration: "none" }} display="block">
      <Box
        borderRadius="lg"
        border="sm"
        borderColor="border.secondary"
        overflow="hidden"
        transition="background-color 0.2s"
        _hover={{ bg: "card.hover" }}>
        {og?.image && <Image src={og.image} alt={og.title ?? ""} w="full" maxH="200px" objectFit="cover" />}
        <VStack align="start" gap={1} p={3}>
          {og?.siteName && (
            <Text textStyle="xs" color="text.subtle">
              {og.siteName}
            </Text>
          )}
          {og?.title && (
            <Text textStyle="sm" fontWeight="semibold" lineClamp={2}>
              {og.title}
            </Text>
          )}
          {og?.description && (
            <Text textStyle="xs" color="text.subtle" lineClamp={2}>
              {og.description}
            </Text>
          )}
        </VStack>
      </Box>
    </Link>
  )
}

const FallbackLink = ({ url }: { url: string }) => (
  <Link href={url} target="_blank" rel="noopener noreferrer" variant="underline" maxW="full" display="block">
    <HStack gap={1} minW={0}>
      <Text textStyle="sm" truncate>
        {url}
      </Text>
      <Icon flexShrink={0}>
        <LuExternalLink />
      </Icon>
    </HStack>
  </Link>
)
