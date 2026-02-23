import i18next from "i18next"
import LanguageDetector from "i18next-browser-languagedetector"
import resourcesToBackend from "i18next-resources-to-backend"
import { initReactI18next } from "react-i18next"

import dayjs from "../utils/dayjsConfig"

export const languages = [
  {
    name: "English",
    code: "en",
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
    name: "Turkish",
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
  {
    name: "Portuguese (Brazil)",
    code: "pt",
    flag: "🇧🇷",
  },
]

i18next
  .use(LanguageDetector)
  .use(resourcesToBackend((language: string) => import(`./languages/${language}.json`)))
  .use(initReactI18next)
  .init({
    load: "languageOnly",
    fallbackLng: "en",
    debug: false,
    detection: {
      // Check localStorage first, then browser language
      order: ["localStorage", "navigator"],
      // Cache user language in localStorage
      caches: ["localStorage"],
      // Lookup localStorage key
      lookupLocalStorage: "i18nextLng",
    },
  })

i18next.on("languageChanged", lng => {
  // Map 'tw' to 'zh-tw' for dayjs
  const dayjsLocale = lng === "tw" ? "zh-tw" : lng
  dayjs.locale(dayjsLocale)
})

export default i18next
