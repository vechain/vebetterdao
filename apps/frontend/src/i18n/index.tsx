import i18next from "i18next"

import en from "./languages/en.json"
import it from "./languages/it.json"
import fr from "./languages/fr.json"
import es from "./languages/es.json"
import zh from "./languages/zh.json"
import de from "./languages/de.json"
import ja from "./languages/ja.json"
import vi from "./languages/vi.json"
import nl from "./languages/nl.json"
import ko from "./languages/ko.json"
import sv from "./languages/sv.json"
import tw from "./languages/tw.json"
import tr from "./languages/tr.json"
import hi from "./languages/hi.json"

import { initReactI18next } from "react-i18next"

export const enLang = "en"

const translations: { [key: string]: any } = {
  en,
  it,
  fr,
  es,
  zh,
  de,
  ja,
  vi,
  nl,
  ko,
  sv,
  tw,
  tr,
  hi,
}

export const languages = [
  {
    name: "English",
    code: enLang,
    flag: "🇬🇧",
  },
  {
    name: "Japanese",
    code: "ja",
    flag: "🇯🇵",
  },
  {
    name: "Vietnamese",
    code: "vi",
    flag: "🇻🇳",
  },
  {
    name: "German",
    code: "de",
    flag: "🇩🇪",
  },
  {
    name: "Dutch",
    code: "nl",
    flag: "🇳🇱",
  },
  {
    name: "South Korean",
    code: "ko",
    flag: "🇰🇷",
  },
  {
    name: "Italian",
    code: "it",
    flag: "🇮🇹",
  },
  {
    name: "Swedish",
    code: "sv",
    flag: "🇸🇪",
  },
  {
    name: "French",
    code: "fr",
    flag: "🇫🇷",
  },
  {
    name: "Taiwanese",
    code: "tw",
    flag: "🇹🇼",
  },
  {
    name: "Spanish",
    code: "es",
    flag: "🇪🇸",
  },
  {
    name: "Turkey",
    code: "tr",
    flag: "🇹🇷",
  },
  {
    name: "Indian",
    code: "hi",
    flag: "🇮🇳",
  },
  {
    name: "Chinese",
    code: "zh",
    flag: "🇨🇳",
  },
]

i18next.use(initReactI18next).init({
  resources: languages.reduce((acc, language) => {
    acc[language.code] = {
      translation: translations[language.code] || {},
    }
    return acc
  }, {} as any),
  defaultNS: "translation",
  lng: enLang,
  debug: false,
  fallbackLng: enLang,
})
