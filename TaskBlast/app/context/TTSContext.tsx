import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import * as Speech from "expo-speech";
import { useAccessibility } from "./AccessibilityContext";

// Maps the short language code from AccessibilityContext to a BCP-47 locale
// used by expo-speech. Falls back to the code itself if not listed.
const LANG_TO_LOCALE: Record<string, string> = {
  en: "en-US",
  es: "es-ES",
  pt: "pt-BR",
  fr: "fr-FR",
  de: "de-DE",
  ru: "ru-RU",
  ar: "ar-SA",
  bn: "bn-BD",
  zh: "zh-CN",
  hi: "hi-IN",
};

interface TTSSettings {
  rate: number;
  pitch: number;
  language: string;
}

interface TTSContextType {
  /** Reflects the value from AccessibilityContext (single source of truth). */
  ttsEnabled: boolean;
  settings: TTSSettings;
  setSettings: React.Dispatch<React.SetStateAction<TTSSettings>>;
  speak: (text: string) => void;
  stop: () => void;
  isSpeaking: boolean;
}

const TTSContext = createContext<TTSContextType | null>(null);

interface TTSProviderProps {
  children: ReactNode;
}

export function TTSProvider({ children }: TTSProviderProps) {
  // ttsEnabled is owned by AccessibilityContext and persisted there.
  const { ttsEnabled, language } = useAccessibility();

  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [settings, setSettings] = useState<TTSSettings>({
    rate: 1.0,
    pitch: 1.0,
    language: LANG_TO_LOCALE[language] ?? language,
  });

  // Keep speech locale in sync with the app language.
  useEffect(() => {
    setSettings((prev) => ({
      ...prev,
      language: LANG_TO_LOCALE[language] ?? language,
    }));
  }, [language]);

  // Stop any ongoing speech when TTS is disabled.
  useEffect(() => {
    if (!ttsEnabled) {
      Speech.stop();
      setIsSpeaking(false);
    }
  }, [ttsEnabled]);

  const speak = (text: string): void => {
    if (!ttsEnabled || !text) return;

    Speech.stop();

    Speech.speak(text, {
      ...settings,
      onStart: () => setIsSpeaking(true),
      onDone: () => setIsSpeaking(false),
      onStopped: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });
  };

  const stop = (): void => {
    Speech.stop();
    setIsSpeaking(false);
  };

  return (
    <TTSContext.Provider
      value={{
        ttsEnabled,
        settings,
        setSettings,
        speak,
        stop,
        isSpeaking,
      }}
    >
      {children}
    </TTSContext.Provider>
  );
}

export const useTTS = (): TTSContextType => {
  const context = useContext(TTSContext);
  if (!context) {
    throw new Error("useTTS must be used within a TTSProvider");
  }
  return context;
};
