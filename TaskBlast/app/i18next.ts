import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Restore persisted language before the app finishes hydrating
AsyncStorage.getItem("@taskblast_accessibility_settings")
  .then((json) => {
    if (json) {
      const saved = JSON.parse(json);
      if (saved?.language && saved.language !== i18n.language) {
        i18n.changeLanguage(saved.language);
      }
    }
  })
  .catch(() => {/* silently ignore */});

i18n
  .use(initReactI18next)
  .init({
   
    lng: "es",
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
      },
      pi: {
        translation: require("./locales/pi/translation.json"),
      }
    },
    interpolation: {
      escapeValue: false, 
    },
  });

export default i18n;
