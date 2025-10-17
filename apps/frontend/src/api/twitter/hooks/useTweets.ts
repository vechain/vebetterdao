import { useQueries, useQuery } from "@tanstack/react-query"
import { type Tweet } from "react-tweet/api"

const TWITTER_API_URL = "https://react-tweet.vercel.app"
export async function getTweet(tweetId?: string): Promise<Tweet> {
  if (!tweetId) return Promise.reject("No tweet id provided")
  const res = await fetch(`${TWITTER_API_URL}/api/tweet/${tweetId}`)
  const data = (await res.json()) as { data: Tweet }
  return data.data
}
export const getTweetQueryKey = (tweetId?: string) => ["tweet", tweetId]
/**
 *  Fetches tweet data for each tweet id in the array of tweet ids using react-query
 * @param tweetIds  Array of tweet ids
 * @returns  Array of tweet data for each tweet id
 */
export const useTweets = (tweetIds: string[]) =>
  useQueries({
    queries: tweetIds.map(tweetId => ({
      queryKey: getTweetQueryKey(tweetId),
      queryFn: () => getTweet(tweetId),
      enabled: !!tweetId,
    })),
  })
/**
 *  Fetches tweet data for a single tweet id using react-query
 * @param tweetId  Tweet id
 * @returns  Tweet data
 */
export const useTweet = (tweetId?: string) =>
  useQuery({
    queryKey: getTweetQueryKey(tweetId),
    queryFn: () => getTweet(tweetId),
    enabled: !!tweetId,
    staleTime: Infinity,
  })
