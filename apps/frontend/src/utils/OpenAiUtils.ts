import OpenAI, { ClientOptions } from "openai"

/**
 * Parameters for the OpenAIHelper class.
 */
export type OpenAIHelperParams = {
  prompt: string
  maxTokens?: number
  images?: string[]
  model?: string
}

/**
 * Helper class for interacting with the OpenAI API.
 */
export class OpenAIHelper {
  private openai: OpenAI

  /**
   * Constructs a new instance of the OpenAIHelper class.
   * @param options The client options for the OpenAI API.
   * @throws Error if apiKey is not provided in the options.
   */
  constructor(options: ClientOptions) {
    if (!options.apiKey) {
      throw new Error("apiKey is required")
    }
    this.openai = new OpenAI(options)
  }

  /**
   * Sends a chat-based prompt to the OpenAI API and retrieves the response.
   * @param params The parameters for the chat prompt.
   * @returns The response from the OpenAI API.
   */
  public askChatGPT = async ({ prompt, maxTokens, images, model = "gpt-4o" }: OpenAIHelperParams) => {
    const response = await this.openai.chat.completions.create({
      model,
      max_tokens: maxTokens,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: prompt,
            },
            ...(images?.map((image: string) => ({
              type: "image_url" as any,
              image_url: {
                url: image,
              },
            })) || []),
          ],
        },
      ],
      response_format: {
        type: "json_object",
      },
    })
    const data = JSON.parse(response.choices[0]?.message.content || "{}")
    return { ...response, data }
  }
}
