import { writeFileSync } from "fs"
import en from "../../i18n/languages/en.json"
import { forEach } from "lodash"
import { translations } from "../../i18n"
import { KeyValueObject } from "./types"
import { askChatGpt, getFixedWordPrompt, languagesToGenerate, splitObjectIntoBatches } from "./utils"

const generatePrompt = (language: string, batch: KeyValueObject) => {
  return `
I'm working on internationalizing my application. 
I will send you a json object with the translations from English to ${language}.
Keep the object keys identical, some object values are empty string, please fill just them.
respond using an unique JSON object without any comments or any other descriptions.

${getFixedWordPrompt(language)}

this is the JSON object with the translations:
${JSON.stringify(batch, null, 2)}
`
}

const completeTranslations = async () => {
  languagesToGenerate.forEach(async language => {
    const languageTranslations = translations[language.code] || {}

    // fill with missing en translations
    const missingTranslations = Object.keys(en).reduce((acc, key) => {
      if (!languageTranslations[key]) {
        acc[key] = ""
      }
      return acc
    }, {} as KeyValueObject)

    if (Object.keys(missingTranslations).length === 0) {
      console.info(`Skipping: All translations for ${language.name} are already completed`)
      return
    }

    console.info(`Generating translations for ${language.name}`)
    const batches = splitObjectIntoBatches(missingTranslations)
    const translatedBatches: KeyValueObject = languageTranslations
    const promises = batches.map(async (batch, index) => {
      console.info(`Generating translations for batch ${index + 1} for language "${language.name}"`)
      return askChatGpt(generatePrompt(language.name, batch))
    })
    const results = await Promise.all(promises)
    forEach(results, result => {
      Object.assign(translatedBatches, result)
    })
    writeFileSync(`./src/i18n/languages/${language.code}.json`, JSON.stringify(translatedBatches, null, 2))

    console.info(`Translations for ${language.name} generated`)
  })
}

completeTranslations()
