import { APIGatewayProxyResult, Context } from "aws-lambda"
import { SecretsManagerClient } from "@aws-sdk/client-secrets-manager"

import { getData } from "../helpers"
import { notify } from "../helpers/slack/notificationHelper"
import { slackIds } from "../helpers/slack/slackIds"
import { logger } from "../helpers/logger"

const DISCOURSE_BASE_URL = "https://vechain.discourse.group"
interface SlackConfig {
  channelId: string
  messagePrefix: string
}

interface DiscoursePost {
  id: number
  name: string
  username: string
  avatar_template: string
  created_at: string
  like_count: number
  blurb: string
  post_number: number
  topic_id: number
}

interface DiscourseTopic {
  fancy_title: string
  id: number
  title: string
  slug: string
  posts_count: number
  reply_count: number
  highest_post_number: number
  created_at: string
  last_posted_at: string
  bumped: boolean
  bumped_at: string
  archetype: string
  unseen: boolean
  pinned: boolean
  unpinned: string | null
  visible: boolean
  closed: boolean
  archived: boolean
  bookmarked: boolean | null
  liked: boolean | null
  tags: string[]
  tags_descriptions: Record<string, string>
  category_id: number
  has_accepted_answer: boolean
}

interface DiscourseSearchResponse {
  posts: DiscoursePost[]
  topics: DiscourseTopic[]
  users: unknown[]
  categories: unknown[]
  tags: unknown[]
  groups: unknown[]
  grouped_search_result: {
    more_posts: unknown
    more_users: unknown
    more_categories: unknown
    term: string
    search_log_id: number
    more_full_page_results: unknown
    can_create_topic: boolean
    error: string | null
    extra: Record<string, unknown>
    post_ids: number[]
    user_ids: number[]
    category_ids: number[]
    tag_ids: number[]
    group_ids: number[]
  }
}

const getSlackConfig = (): SlackConfig => {
  return {
    channelId: slackIds.b3trLambda,
    messagePrefix: "[DISCOURSE] ",
  }
}

const { channelId: SLACK_CHANNEL_ID, messagePrefix: SLACK_MESSAGE_PREFIX } = getSlackConfig()

const client = new SecretsManagerClient({
  region: "eu-west-1",
})

/**
 * Calculates the date 5 days ago in YYYY-MM-DD format
 */
const getDateFiveDaysAgo = (): string => {
  const date = new Date()
  date.setDate(date.getDate() - 5)
  return date.toISOString().split("T")[0]
}

/**
 * Builds the Discourse search URL for VeBetterDAO posts from a given date onwards.
 */
const buildDiscourseSearchUrl = (fromDate: string): string => {
  const url = new URL("search.json", DISCOURSE_BASE_URL)
  url.searchParams.set("q", `category:vebetterdao after:${fromDate} order:latest_topic`)
  return url.toString()
}

/**
 * Fetches Discourse posts from the VeBetterDAO category from the past 5 days.
 */
const fetchDiscoursePosts = async (): Promise<DiscourseSearchResponse> => {
  const fromDate = getDateFiveDaysAgo()
  const url = buildDiscourseSearchUrl(fromDate)

  logger.info("Fetching Discourse posts", { url, fromDate })

  const data = (await getData(url)) as DiscourseSearchResponse
  return data
}

/**
 * Formats and posts Discourse topics to Slack
 */
const postTopicsToSlack = async (topics: DiscourseTopic[]): Promise<void> => {
  if (topics.length === 0) {
    logger.info("No Discourse topics found to post")
    return
  }

  const header = `${SLACK_MESSAGE_PREFIX}latest discourse posts for vebetterdao`
  const messages = topics.map(topic => {
    const link = new URL(`t/${topic.id}`, DISCOURSE_BASE_URL).toString()
    return `${topic.title}\n${link}`
  })

  const fullMessage = `${header}\n\n${messages.join("\n\n")}`

  await notify({
    level: "info",
    message: fullMessage,
    data: { topicCount: topics.length },
    slack: {
      client,
      channelId: SLACK_CHANNEL_ID,
      messagePrefix: "",
    },
  })
}

/**
 * AWS Lambda handler function that fetches Discourse posts from the past 5 days
 * and posts them to Slack.
 *
 * @param {any} event - The incoming event from EventBridge scheduler or API Gateway.
 * @param {Context} context - The execution context of the Lambda function.
 * @returns {Promise<APIGatewayProxyResult>} - The result of the HTTP response.
 */
export const handler = async (event: any, context: Context): Promise<APIGatewayProxyResult> => {
  console.log(`Event: ${JSON.stringify(event, null, 2)}`)
  console.log(`Context: ${JSON.stringify(context, null, 2)}`)
  // eslint-disable-next-line turbo/no-undeclared-env-vars
  console.log(`Environment: ${process.env.LAMBDA_ENV}`)

  try {
    // Fetch Discourse posts
    const discourseData = await fetchDiscoursePosts()

    // Log the response
    console.log("Discourse posts fetched:", JSON.stringify(discourseData, null, 2))
    logger.info("Discourse posts fetched", {
      postCount: discourseData.posts.length,
      topicCount: discourseData.topics.length,
    })

    // Post topics to Slack
    await postTopicsToSlack(discourseData.topics)

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        postCount: discourseData.posts.length,
        topicCount: discourseData.topics.length,
      }),
    }
  } catch (error) {
    logger.error("Error fetching Discourse posts", error)
    console.error("Error fetching Discourse posts:", error)

    await notify({
      level: "error",
      message: `Error fetching Discourse posts: ${error instanceof Error ? error.message : String(error)}`,
      slack: {
        client,
        channelId: SLACK_CHANNEL_ID,
        messagePrefix: SLACK_MESSAGE_PREFIX,
      },
    })

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: error instanceof Error ? error.message : String(error),
      }),
    }
  }
}
