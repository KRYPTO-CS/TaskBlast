// This is a state storage for our audio settings. For future sound settings
// haven't yet implemented the button click noise, but for now the music part should work.

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface AudioSettingsContextValue {
  musicEnabled: boolean;
  soundEnabled: boolean;
  setMusicEnabled: (value: boolean) => void;
  setSoundEnabled: (value: boolean) => void;
  toggleMusic: () => void;
  toggleSound: () => void;
}

const AudioSettingsContext = createContext<AudioSettingsContextValue | undefined>(undefined);

export const AudioSettingsProvider = ({ children }: { children: ReactNode }) => {
  const [musicEnabled, setMusicEnabled] = useState<boolean>(true);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Load persisted settings once
  useEffect(() => {
    (async () => {
      try {
        const [m, s] = await Promise.all([
          AsyncStorage.getItem("musicEnabled"),
          AsyncStorage.getItem("soundEnabled"),
        ]);
        if (m === "true") setMusicEnabled(true);
        else if (m === "false") setMusicEnabled(false);
        if (s === "true") setSoundEnabled(true);
        else if (s === "false") setSoundEnabled(false);
      } catch (e) {
        console.warn("Failed to load audio settings", e);
      }
    })();
  }, []);

  // Persist changes
  useEffect(() => {
    AsyncStorage.setItem("musicEnabled", musicEnabled ? "true" : "false").catch((e) => {
      console.warn("Failed to persist musicEnabled", e);
    });
  }, [musicEnabled]);

  useEffect(() => {
    AsyncStorage.setItem("soundEnabled", soundEnabled ? "true" : "false").catch((e) => {
      console.warn("Failed to persist soundEnabled", e);
    });
  }, [soundEnabled]);

  const toggleMusic = () => setMusicEnabled((prev) => !prev);
  const toggleSound = () => setSoundEnabled((prev) => !prev);

  return (
    <AudioSettingsContext.Provider
      value={{ musicEnabled, soundEnabled, setMusicEnabled, setSoundEnabled, toggleMusic, toggleSound }}
    >
      {children}
    </AudioSettingsContext.Provider>
  );
};

export const useAudioSettings = (): AudioSettingsContextValue => {
  const ctx = useContext(AudioSettingsContext);
  if (!ctx) throw new Error("useAudioSettings must be used within an AudioSettingsProvider");
  return ctx;
};
