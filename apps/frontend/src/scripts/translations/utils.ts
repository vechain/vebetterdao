import { languages } from "../../i18n"
import { OpenAIHelper } from "../../utils/OpenAiUtils"

import { fixedWords } from "./fixedWords"
import { KeyValueObject } from "./types"

export const languagesToGenerate = languages.filter(language => language.code !== "en")
export const askChatGpt = async (prompt: string) => {
  const openaiHelper = new OpenAIHelper({
    apiKey: process.env.OPENAI_API_KEY as string,
    dangerouslyAllowBrowser: true,
  })
  const { data } = await openaiHelper.askChatGPT({
    prompt,
  })
  return data
}
// we need to split the object into batches because the OpenAI API has a limit per request
const BATCH_SIZE = 15
export const splitObjectIntoBatches = (data: KeyValueObject): KeyValueObject[] => {
  const entries = Object.entries(data)
  const batches: KeyValueObject[] = []
  for (let i = 0; i < entries.length; i += BATCH_SIZE) {
    const batchEntries = entries.slice(i, i + BATCH_SIZE)
    const batchObject: KeyValueObject = Object.fromEntries(batchEntries)
    batches.push(batchObject)
  }
  return batches
}
export const getFixedWordPrompt = (language: string) => {
  const fixedWordsForLanguage = fixedWords[language] || {}
  return Object.keys(fixedWordsForLanguage).length > 0
    ? `when translating the following words, please use the following translations (case insensitive):
${JSON.stringify(fixedWordsForLanguage, null, 2)}`
    : ""
}
