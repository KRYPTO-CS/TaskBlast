import i18n from "i18next";
import { initReactI18next } from "react-i18next";

i18n
  .use(initReactI18next)
  .init({
   
    lng: "en",
    fallbackLng: "en",
    resources: {
      en: 
      {
        translation: require("./locales/en/translation.json"),
      },
      es: 
      {
       translation: require("./locales/es/translation.json"),
      },
      pt:
      {
       translation: require("./locales/pt/translation.json"),
      },
      fr:
      {
       translation: require("./locales/fr/translation.json"),
      },
      de:
      {
       translation: require("./locales/de/translation.json"),
      },
      ru:
      {
       translation: require("./locales/ru/translation.json"),
      },
      zh:
      {
       translation: require("./locales/zh/translation.json"),
      },
      hi:
      {
       translation: require("./locales/hi/translation.json"),
      },
      bn:
      {
       translation: require("./locales/bn/translation.json"),
      },
      ar:
      {
       translation: require("./locales/ar/translation.json"),
      }
    },
    interpolation: {
      escapeValue: false, 
    },
  });

export default i18n;
