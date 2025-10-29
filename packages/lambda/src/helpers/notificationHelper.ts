import { SecretsManagerClient } from "@aws-sdk/client-secrets-manager"
import { logger } from "./logger"
import { publishMessage } from "./slack"

export interface NotificationOptions {
  level: "success" | "info" | "warn" | "error"
  message: string
  data?: Record<string, unknown>
  slack?: {
    client: SecretsManagerClient
    channelId: string
    messagePrefix: string
  }
}

const SLACK_EMOJIS = {
  success: ":white_check_mark:",
  info: ":information_source:",
  warn: ":warning:",
  error: ":alert:",
} as const

/**
 * Centralized notification helper that logs and optionally sends Slack messages
 * Reduces duplication between logging and Slack notifications
 */
export const notify = async (options: NotificationOptions): Promise<void> => {
  const { level, message, data, slack } = options

  // Log to structured logger (success and info both use logger.info)
  switch (level) {
    case "success":
    case "info":
      logger.info(message, data)
      break
    case "warn":
      logger.warn(message, data)
      break
    case "error":
      logger.error(message, undefined, data)
      break
  }

  // Optionally send to Slack
  if (slack) {
    const emoji = SLACK_EMOJIS[level]
    const slackMessage = `${slack.messagePrefix}${emoji} ${message}. Check logs for more details.`
    await publishMessage(slack.client, slack.channelId, slackMessage)
  }
}
