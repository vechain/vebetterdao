import i18next from "i18next"

import en from "./languages/en.json"
import it from "./languages/it.json"
import { initReactI18next } from "react-i18next"

export const enLang = "en"

export const languagesSupported = [enLang]

i18next.use(initReactI18next).init({
  resources: {
    en: {
      translation: en,
    },
    it: {
      translation: it,
    },
  },
  defaultNS: "translation",
  lng: enLang,
  debug: false,
  fallbackLng: enLang,
})
