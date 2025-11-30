import { useAudioPlayer } from "expo-audio";
import { useCallback } from "react";
import { useAudio } from "../context/AudioContext";

/**
 * Hook for playing sound effects with global sound settings
 * Returns a function to play the button click sound effect
 */
export function useSound() {
  const { soundEnabled } = useAudio();
  const buttonClickPlayer = useAudioPlayer(
    require("../../assets/music/button-click.mp3")
  );

  const playButtonClick = useCallback(() => {
    if (soundEnabled && buttonClickPlayer) {
      try {
        // Reset to start and play
        buttonClickPlayer.seekTo(0);
        buttonClickPlayer.play();
      } catch (error) {
        console.warn("Failed to play button click sound:", error);
      }
    }
  }, [soundEnabled, buttonClickPlayer]);

  return {
    playButtonClick,
    soundEnabled,
  };
}
