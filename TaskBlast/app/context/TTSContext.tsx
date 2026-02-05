import React, { createContext, useContext, useState, ReactNode } from 'react';
import * as Speech from 'expo-speech';

interface TTSSettings {
  rate: number;
  pitch: number;
  language: string;
}

interface TTSContextType {
  ttsEnabled: boolean;
  setTtsEnabled: React.Dispatch<React.SetStateAction<boolean>>;
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
  const [ttsEnabled, setTtsEnabled] = useState<boolean>(true); // Default to TTS enabled
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [settings, setSettings] = useState<TTSSettings>({
    rate: 1.0,
    pitch: 1.0,
    language: 'en-US',
  });

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
        setTtsEnabled,
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
    throw new Error('useTTS must be used within a TTSProvider');
  }
  return context;
};