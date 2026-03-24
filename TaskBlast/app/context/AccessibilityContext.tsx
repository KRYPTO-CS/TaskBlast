import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import i18n from "../i18next";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ColorBlindMode =
  | "none"
  | "deuteranopia"
  | "protanopia"
  | "tritanopia";
export type TextSize = "small" | "medium" | "large";

export interface AccessibilitySettings {
  language: string;
  colorBlindMode: ColorBlindMode;
  textSize: TextSize;
  highContrast: boolean;
  reduceMotion: boolean;
  ttsEnabled: boolean;
}

interface AccessibilityContextType extends AccessibilitySettings {
  setLanguage: (lang: string) => Promise<void>;
  setColorBlindMode: (mode: ColorBlindMode) => Promise<void>;
  setTextSize: (size: TextSize) => Promise<void>;
  setHighContrast: (enabled: boolean) => Promise<void>;
  setReduceMotion: (enabled: boolean) => Promise<void>;
  setTtsEnabled: (enabled: boolean) => Promise<void>;
  /** Scale multiplier for text: small=0.85, medium=1.0, large=1.2 */
  textScale: number;
  isLoading: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STORAGE_KEY = "@taskblast_accessibility_settings";

const TEXT_SCALE_MAP: Record<TextSize, number> = {
  small: 0.85,
  medium: 1.0,
  large: 1.2,
};

const DEFAULT_SETTINGS: AccessibilitySettings = {
  language: "en",
  colorBlindMode: "none",
  textSize: "medium",
  highContrast: false,
  reduceMotion: false,
  ttsEnabled: false,
};

// ─── Context ──────────────────────────────────────────────────────────────────

const AccessibilityContext = createContext<
  AccessibilityContextType | undefined
>(undefined);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] =
    useState<AccessibilitySettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  // Load persisted settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const json = await AsyncStorage.getItem(STORAGE_KEY);
      if (json) {
        const saved: AccessibilitySettings = {
          ...DEFAULT_SETTINGS,
          ...JSON.parse(json),
        };
        setSettings(saved);
        // Restore language in i18n so it survives app restarts
        if (saved.language && saved.language !== i18n.language) {
          await i18n.changeLanguage(saved.language);
        }
      }
    } catch (error) {
      console.error("Failed to load accessibility settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const persist = async (next: AccessibilitySettings) => {
    setSettings(next);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const setLanguage = async (lang: string) => {
    await i18n.changeLanguage(lang);
    await persist({ ...settings, language: lang });
  };

  const setColorBlindMode = async (mode: ColorBlindMode) => {
    await persist({ ...settings, colorBlindMode: mode });
  };

  const setTextSize = async (size: TextSize) => {
    await persist({ ...settings, textSize: size });
  };

  const setHighContrast = async (enabled: boolean) => {
    await persist({ ...settings, highContrast: enabled });
  };

  const setReduceMotion = async (enabled: boolean) => {
    await persist({ ...settings, reduceMotion: enabled });
  };

  const setTtsEnabled = async (enabled: boolean) => {
    await persist({ ...settings, ttsEnabled: enabled });
  };

  return (
    <AccessibilityContext.Provider
      value={{
        ...settings,
        setLanguage,
        setColorBlindMode,
        setTextSize,
        setHighContrast,
        setReduceMotion,
        setTtsEnabled,
        textScale: TEXT_SCALE_MAP[settings.textSize],
        isLoading,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (context === undefined) {
    throw new Error(
      "useAccessibility must be used within an AccessibilityProvider",
    );
  }
  return context;
}
