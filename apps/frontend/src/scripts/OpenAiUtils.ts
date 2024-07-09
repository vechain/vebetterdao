import OpenAI from "openai"
import { ChatCompletion } from "openai/resources/index"

export class OpenAIHelper {
  private openai: OpenAI

  constructor(private _openai?: OpenAI) {
    if (_openai) {
      this.openai = _openai
    } else {
      this.openai = this.createOpenAIInstance()
    }
  }
  //TODO: Add OpenAI API key
  private createOpenAIInstance = () =>
    new OpenAI({
      apiKey: "",
      dangerouslyAllowBrowser: true,
    })

  public askChatGPT = async ({ prompt }: { prompt: string; maxTokens?: number }) =>
    this.openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: prompt,
            },
          ],
        },
      ],
    })

  public askChatGPTAboutImage = async ({
    base64Image,
    maxTokens = 350,
    prompt,
  }: {
    base64Image: string
    prompt: string
    maxTokens?: number
  }) =>
    this.openai.chat.completions.create({
      model: "gpt-4-vision-preview",
      max_tokens: maxTokens,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: prompt,
            },
            {
              type: "image_url",
              image_url: {
                url: base64Image,
              },
            },
          ],
        },
      ],
    })

  public getResponseJSONString = (response: ChatCompletion) => response.choices[0]?.message.content || "{}"

  private cleanChatGPTJSONString = (jsonString: string) => jsonString.replace("```json", "").replace("```", "")

  public parseChatGPTJSONString = <Response>(jsonString?: string | null): Response | undefined => {
    if (!jsonString) {
      return
    }
    const content = this.cleanChatGPTJSONString(jsonString)
    if (content) {
      try {
        const parsed = JSON.parse(content)
        return parsed
      } catch (e) {
        console.error("Failing parsing Chat GPT response:", e)
      }
    }
  }
}
