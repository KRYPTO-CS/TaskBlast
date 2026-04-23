import { Text as RNText, TextProps, GestureResponderEvent } from "react-native";
import { useTTS } from "./app/context/TTSContext";

export function Text({ children, onPress, ...props }: TextProps) {
  const { ttsEnabled, speak } = useTTS();
  const handlePress = (event: GestureResponderEvent) => {
    try {
      const text = typeof children === "string" ? children : "";
      speak(text);
    } catch (e) {
      // TTS failed, silently fall through
    }

    onPress?.(event);
  };

  return (
    <RNText
      onPress={ttsEnabled ? handlePress : undefined}
      {...props}
    >
      {children}
    </RNText>
  );
}
