import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";

type TranslationMap = Record<string, unknown>;

function normalizeLocale(translation: TranslationMap): TranslationMap {
  const supportScreen = translation.SupportScreen as TranslationMap | undefined;
  const faq = supportScreen?.faq as TranslationMap | undefined;
  const nestedNotificationPreferencesModal = faq?.NotificationPreferencesModal as TranslationMap | undefined;

  // Backward compatibility for locales where this block was nested under SupportScreen.faq.
  if (!translation.NotificationPreferencesModal && nestedNotificationPreferencesModal) {
    translation.NotificationPreferencesModal = nestedNotificationPreferencesModal;
  }

  return translation;
}

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
   
    lng: "en",
    fallbackLng: "en",
    resources: {
      en: 
      {
        translation: normalizeLocale(require("./locales/en/translation.json")),
      },
      es: 
      {
       translation: normalizeLocale(require("./locales/es/translation.json")),
      },
      pt:
      {
       translation: normalizeLocale(require("./locales/pt/translation.json")),
      },
      fr:
      {
       translation: normalizeLocale(require("./locales/fr/translation.json")),
      },
      de:
      {
       translation: normalizeLocale(require("./locales/de/translation.json")),
      },
      ru:
      {
       translation: normalizeLocale(require("./locales/ru/translation.json")),
      },
      zh:
      {
       translation: normalizeLocale(require("./locales/zh/translation.json")),
      },
      hi:
      {
       translation: normalizeLocale(require("./locales/hi/translation.json")),
      },
      bn:
      {
       translation: normalizeLocale(require("./locales/bn/translation.json")),
      },
      ar:
      {
       translation: normalizeLocale(require("./locales/ar/translation.json")),
      },
      pi: {
        translation: normalizeLocale(require("./locales/pi/translation.json")),
      }
    },
    interpolation: {
      escapeValue: false, 
    },
  });

export default i18n;
