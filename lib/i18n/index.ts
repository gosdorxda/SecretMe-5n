import i18n from "i18next"
import { initReactI18next } from "react-i18next"
import LanguageDetector from "i18next-browser-languagedetector"

import idTranslation from "./locales/id.json"
import enTranslation from "./locales/en.json"

// Inisialisasi i18next
i18n
  .use(LanguageDetector) // Deteksi bahasa browser
  .use(initReactI18next) // Integrasi dengan React
  .init({
    resources: {
      id: {
        translation: idTranslation,
      },
      en: {
        translation: enTranslation,
      },
    },
    fallbackLng: "id", // Bahasa default jika tidak terdeteksi
    debug: process.env.NODE_ENV === "development",
    interpolation: {
      escapeValue: false, // React sudah mengamankan dari XSS
    },
    detection: {
      order: ["localStorage", "navigator"],
      lookupLocalStorage: "i18nextLng",
      caches: ["localStorage"],
    },
  })

export default i18n
