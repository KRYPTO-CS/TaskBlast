import { renderHook, act } from "@testing-library/react-native";

const mockUseAudio = jest.fn();
const mockUseAudioPlayer = jest.fn();

jest.mock("../app/context/AudioContext", () => ({
  useAudio: () => mockUseAudio(),
}));

jest.mock("expo-audio", () => ({
  useAudioPlayer: () => mockUseAudioPlayer(),
}));

import { useSound } from "../app/hooks/useSound";

describe("useSound", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("plays button click sound when enabled", () => {
    const seekTo = jest.fn();
    const play = jest.fn();

    mockUseAudio.mockReturnValue({ soundEnabled: true });
    mockUseAudioPlayer.mockReturnValue({ seekTo, play });

    const { result } = renderHook(() => useSound());

    act(() => {
      result.current.playButtonClick();
    });

    expect(seekTo).toHaveBeenCalledWith(0);
    expect(play).toHaveBeenCalled();
  });

  it("does not play sound when disabled", () => {
    const seekTo = jest.fn();
    const play = jest.fn();

    mockUseAudio.mockReturnValue({ soundEnabled: false });
    mockUseAudioPlayer.mockReturnValue({ seekTo, play });

    const { result } = renderHook(() => useSound());

    act(() => {
      result.current.playButtonClick();
    });

    expect(seekTo).not.toHaveBeenCalled();
    expect(play).not.toHaveBeenCalled();
  });

  it("does not play when player is unavailable", () => {
    mockUseAudio.mockReturnValue({ soundEnabled: true });
    mockUseAudioPlayer.mockReturnValue(null);

    const { result } = renderHook(() => useSound());

    act(() => {
      result.current.playButtonClick();
    });

    expect(result.current.soundEnabled).toBe(true);
  });

  it("swallows player errors and warns", () => {
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    const seekTo = jest.fn(() => {
      throw new Error("audio failed");
    });
    const play = jest.fn();

    mockUseAudio.mockReturnValue({ soundEnabled: true });
    mockUseAudioPlayer.mockReturnValue({ seekTo, play });

    const { result } = renderHook(() => useSound());

    act(() => {
      result.current.playButtonClick();
    });

    expect(warnSpy).toHaveBeenCalled();
    expect(play).not.toHaveBeenCalled();

    warnSpy.mockRestore();
  });
});
