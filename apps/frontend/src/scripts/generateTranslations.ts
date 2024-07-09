import { writeFileSync } from "fs"
import en from "../i18n/languages/en.json"
import { OpenAIHelper } from "./OpenAiUtils"
import OpenAI from "openai"
import { forEach } from "lodash"
import { languages } from "../i18n"

const languagesToGenerate = languages.filter(language => language.code !== "en")

const askChatGpt = async (prompt: string) => {
  const openaiHelper = new OpenAIHelper(
    new OpenAI({
      apiKey: process.env.OPENAI_API_KEY as string,
      dangerouslyAllowBrowser: true,
    }),
  )
  const response = await openaiHelper.askChatGPT({
    prompt,
  })
  const jsonString = openaiHelper.getResponseJSONString(response)
  return openaiHelper.parseChatGPTJSONString<{ [key: string]: string }>(jsonString)
}

interface KeyValueObject {
  [key: string]: string
}

const splitObjectIntoBatches = (data: KeyValueObject, batchSize: number = 20): KeyValueObject[] => {
  const entries = Object.entries(data)
  const batches: KeyValueObject[] = []

  for (let i = 0; i < entries.length; i += batchSize) {
    const batchEntries = entries.slice(i, i + batchSize)
    const batchObject: KeyValueObject = Object.fromEntries(batchEntries)
    batches.push(batchObject)
  }

  return batches
}

const generatePrompt = (language: string, batch: KeyValueObject) => {
  return `
I'm working on internationalizing my application. 
I will send you a json object with the translations in English.
Keep the keys as they are and translate the values to ${language}.
respond using an unique JSON object without any comments or any other descriptions.

this is the JSON object with the translations in English:
${JSON.stringify(batch, null, 2)}
`
}

const generateTranslations = async () => {
  languagesToGenerate.forEach(async language => {
    console.log(`Generating translations for ${language.name}`)
    const batches = splitObjectIntoBatches(en)
    const translations: KeyValueObject = {}
    const promises = batches.map(async batch => {
      return askChatGpt(generatePrompt(language.name, batch))
    })
    const results = await Promise.all(promises)
    forEach(results, result => {
      Object.assign(translations, result)
    })
    writeFileSync(`./src/i18n/languages/${language.code}.json`, JSON.stringify(translations, null, 2))

    console.log(`Translations for ${language.name} generated`)
  })
}

generateTranslations()
