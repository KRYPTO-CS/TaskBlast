import React from "react";
import { Text, TouchableOpacity } from "react-native";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

jest.unmock("../app/context/AudioContext");

import { AudioProvider, useAudio } from "../app/context/AudioContext";

function Probe() {
  const audio = useAudio();

  return (
    <>
      <Text testID="sound">{audio.soundEnabled ? "on" : "off"}</Text>
      <Text testID="music">{audio.musicEnabled ? "on" : "off"}</Text>
      <Text testID="loading">{audio.isLoading ? "yes" : "no"}</Text>
      <TouchableOpacity
        testID="toggle-sound"
        onPress={() => {
          void audio.setSoundEnabled(false);
        }}
      />
      <TouchableOpacity
        testID="toggle-music"
        onPress={() => {
          void audio.setMusicEnabled(false);
        }}
      />
    </>
  );
}

describe("AudioContext", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
  });

  it("throws when useAudio is used outside provider", () => {
    function BadConsumer() {
      useAudio();
      return null;
    }

    expect(() => render(<BadConsumer />)).toThrow(
      "useAudio must be used within an AudioProvider",
    );
  });

  it("loads persisted settings from storage", async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
      JSON.stringify({ soundEnabled: false, musicEnabled: false }),
    );

    const { getByTestId } = render(
      <AudioProvider>
        <Probe />
      </AudioProvider>,
    );

    await waitFor(() => {
      expect(getByTestId("sound").props.children).toBe("off");
      expect(getByTestId("music").props.children).toBe("off");
      expect(getByTestId("loading").props.children).toBe("no");
    });
  });

  it("persists sound setting updates", async () => {
    const { getByTestId } = render(
      <AudioProvider>
        <Probe />
      </AudioProvider>,
    );

    await waitFor(() => {
      expect(getByTestId("loading").props.children).toBe("no");
    });

    fireEvent.press(getByTestId("toggle-sound"));

    await waitFor(() => {
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        "@taskblast_audio_settings",
        JSON.stringify({ soundEnabled: false, musicEnabled: true }),
      );
    });
  });

  it("persists music setting updates", async () => {
    const { getByTestId } = render(
      <AudioProvider>
        <Probe />
      </AudioProvider>,
    );

    await waitFor(() => {
      expect(getByTestId("loading").props.children).toBe("no");
    });

    fireEvent.press(getByTestId("toggle-music"));

    await waitFor(() => {
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        "@taskblast_audio_settings",
        JSON.stringify({ soundEnabled: true, musicEnabled: false }),
      );
    });
  });
});
