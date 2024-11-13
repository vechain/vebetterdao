import { SecretsManagerClient } from "@aws-sdk/client-secrets-manager"
import { getSecret } from "../secret"
import { WebClient } from "@slack/web-api"

/**
 * Publishes a message to a Slack channel using the Slack API
 * @param id - The channel ID to send the message to
 * @param text - The message to send
 */
export async function publishMessage(client: SecretsManagerClient, id: string, text: string) {
  const token = await getSecret(client, "slack_app_token", "slack-app-token")

  const slackClient = new WebClient(token)

  try {
    const result = await slackClient.chat.postMessage({
      channel: id,
      text: text,
    })

    console.log(result)
  } catch (error) {
    console.error(error)
  }
}
