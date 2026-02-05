// _utility/SpeakableText.tsx
import React, { ReactNode } from 'react';
import { Text, TextProps, StyleProp, TextStyle } from 'react-native';
import { useTTS } from '../context/TTSContext';

interface SpeakableTextProps extends TextProps {
  children: ReactNode;
  className?: string;
  style?: StyleProp<TextStyle>;
}

export function SpeakableText({ children, style, className, ...props }: SpeakableTextProps) {
  const { ttsEnabled, speak } = useTTS();

  const handlePress = (): void => {
    const text =
      typeof children === 'string'
        ? children
        : React.Children.toArray(children).join(' ');

    speak(text);
  };

  return (
    <Text
      onPress={ttsEnabled ? handlePress : undefined}
      style={style}
      className={className}
      {...props}
    >
      {children}
    </Text>
  );
}