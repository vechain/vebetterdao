import { writeFileSync } from "fs"
import en from "../../i18n/languages/en.json"
import { KeyValueObject } from "./types"
import { askChatGpt, getFixedWordPrompt, languagesToGenerate, splitObjectIntoBatches } from "./utils"

const generatePrompt = (language: string, batch: KeyValueObject) => {
  return `
I'm working on internationalizing my application. 
I will send you a json object with the translations in English.
Keep the keys as they are and translate the values to ${language}.
respond using an unique JSON object without any comments or any other descriptions.

${getFixedWordPrompt(language)}

this is the JSON object with the translations in English:
${JSON.stringify(batch, null, 2)}
`
}

const generateTranslations = async () => {
  languagesToGenerate.forEach(async language => {
    console.info(`Generating translations for ${language.name}`)
    const batches = splitObjectIntoBatches(en)
    const translations: KeyValueObject = {}
    const promises = batches.map(async (batch, index) => {
      console.info(`Generating translations for batch ${index + 1} for language "${language.name}"`)
      return askChatGpt(generatePrompt(language.name, batch))
    })
    const results = await Promise.all(promises)
    results.forEach(result => {
      Object.assign(translations, result)
    })
    writeFileSync(`./src/i18n/languages/${language.code}.json`, JSON.stringify(translations, null, 2))

    console.info(`Translations for ${language.name} generated`)
  })
}

generateTranslations()
