import { Text as RNText, TextProps,  GestureResponderEvent  } from 'react-native';
import { useTTS } from './app/context/TTSContext';

export function Text({ children, onPress, ...props }: TextProps) {
  const { ttsEnabled, speak } = useTTS();

  // Only attach a press handler when TTS is active. When disabled 
  // the text to behave exactly like a normal <Text> with no touchable
  // behavior, even if a consumer passed an onPress prop (those are typically
  // only used for speaking). This matches the new requirement that turning
  // TTS off makes text non-pressable.
  const handlePress = (event: GestureResponderEvent) => {
    if (!ttsEnabled) {
      // ignore the event completely
      return;
    }

    try {
      const text = typeof children === 'string' ? children : '';
      speak(text);
    } catch (e) {
      // TTS failed, silently fall through
    }

    onPress?.(event);
  };

  return (
    <RNText onPress={ttsEnabled ? handlePress : undefined} {...props}>
      {children}
    </RNText>
  );
}