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
      }
    },
    interpolation: {
      escapeValue: false, 
    },
  });

export default i18n;
