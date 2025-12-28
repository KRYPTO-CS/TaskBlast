import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface AudioSettings {
  soundEnabled: boolean;
  musicEnabled: boolean;
}

interface AudioContextType {
  soundEnabled: boolean;
  musicEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => Promise<void>;
  setMusicEnabled: (enabled: boolean) => Promise<void>;
  isLoading: boolean;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

const AUDIO_SETTINGS_KEY = "@taskblast_audio_settings";

export function AudioProvider({ children }: { children: ReactNode }) {
  const [soundEnabled, setSoundEnabledState] = useState(true);
  const [musicEnabled, setMusicEnabledState] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  // Load settings from AsyncStorage on mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const settingsJson = await AsyncStorage.getItem(AUDIO_SETTINGS_KEY);
      if (settingsJson) {
        const settings: AudioSettings = JSON.parse(settingsJson);
        setSoundEnabledState(settings.soundEnabled);
        setMusicEnabledState(settings.musicEnabled);
      }
    } catch (error) {
      console.error("Failed to load audio settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const setSoundEnabled = async (enabled: boolean) => {
    try {
      setSoundEnabledState(enabled);
      const settings: AudioSettings = {
        soundEnabled: enabled,
        musicEnabled,
      };
      await AsyncStorage.setItem(AUDIO_SETTINGS_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error("Failed to save sound setting:", error);
    }
  };

  const setMusicEnabled = async (enabled: boolean) => {
    try {
      setMusicEnabledState(enabled);
      const settings: AudioSettings = {
        soundEnabled,
        musicEnabled: enabled,
      };
      await AsyncStorage.setItem(AUDIO_SETTINGS_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error("Failed to save music setting:", error);
    }
  };

  return (
    <AudioContext.Provider
      value={{
        soundEnabled,
        musicEnabled,
        setSoundEnabled,
        setMusicEnabled,
        isLoading,
      }}
    >
      {children}
    </AudioContext.Provider>
  );
}

export function useAudio() {
  const context = useContext(AudioContext);
  if (context === undefined) {
    throw new Error("useAudio must be used within an AudioProvider");
  }
  return context;
}
