import React, { useRef, useEffect } from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  TouchableOpacityProps,
  ViewStyle,
  TextStyle,
  Animated,
  Pressable,
} from "react-native";
import { useAudioPlayer } from "expo-audio";
import { buttons, buttonText } from "../styles/global";

type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "success"
  | "error"
  | "warning"
  | "info";
type ButtonSize = "small" | "medium" | "large";

interface MainButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  customStyle?: ViewStyle;
  textStyle?: TextStyle;
  playSoundOnPress?: boolean; // Option to enable/disable sound
  testID?: string;
}

export default function MainButton({
  title,
  variant = "primary",
  size = "medium",
  customStyle,
  textStyle,
  playSoundOnPress = true, // Default to true
  ...props
}: MainButtonProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const translateYAnim = useRef(new Animated.Value(0)).current;
  const borderOpacity = useRef(new Animated.Value(1)).current;

  // Audio player setup - you'll need to add a sound file to your assets
  const player = useAudioPlayer(
    require("../../assets/music/button-click.mp3") // Update this path to your sound file
  );

  const getButtonStyle = (): ViewStyle => {
    const baseStyle = buttons[variant];
    const sizeStyle = size !== "medium" ? buttons[size] : {};
    return { ...baseStyle, ...sizeStyle, ...customStyle };
  };

  const getTextStyle = (): TextStyle => {
    const baseTextStyle = buttonText[variant];
    const sizeTextStyle = size !== "medium" ? buttonText[size] : {};
    return { ...baseTextStyle, ...sizeTextStyle, ...textStyle };
  };

  const getBorderRadius = () => {
    const buttonStyle = getButtonStyle();
    return typeof buttonStyle.borderRadius === "number"
      ? buttonStyle.borderRadius
      : 8; // default fallback
  };

  // Get darker shade of button color for 3D effect
  const getDarkerColor = () => {
    const colorMap: { [key in ButtonVariant]: string } = {
      primary: "#437B00", // Darker blue
      secondary: "#4d4d4d", // Darker gray
      outline: "#3a7bc8", // Darker blue
      ghost: "#3a7bc8", // Darker blue
      success: "#25a25a", // Darker green
      error: "#c0392b", // Darker red
      warning: "#d68910", // Darker orange
      info: "#2563eb", // Darker blue
    };
    return colorMap[variant];
  };

  const handlePressIn = () => {
    // Play sound if enabled
    if (playSoundOnPress && player) {
      player.seekTo(0); // Reset to beginning
      player.play(); // Play the sound
    }

    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 0.98,
        useNativeDriver: true,
        speed: 50,
        bounciness: 0,
      }),
      Animated.spring(translateYAnim, {
        toValue: 6, // INCREASED: Button moves down more to cover the dark layer
        useNativeDriver: true,
        speed: 50,
        bounciness: 0,
      }),
      Animated.timing(borderOpacity, {
        toValue: 0, // CHANGED: Layer stays slightly visible (was 0)
        duration: 50,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        speed: 50,
        bounciness: 4,
      }),
      Animated.spring(translateYAnim, {
        toValue: 0,
        useNativeDriver: true,
        speed: 50,
        bounciness: 4,
      }),
      Animated.timing(borderOpacity, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const borderRadius = getBorderRadius();

  return (
    <Pressable
      testID={props.testID}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      android_ripple={{ color: "transparent" }} // Disable Android ripple
      style={[
        customStyle,
        { backgroundColor: "transparent" }, // Force transparent background
      ]}
      {...props}
    >
      <Animated.View style={styles.buttonContainer}>
        {/* 3D Bottom Layer (darker shade) */}
        <Animated.View
          style={[
            styles.bottomLayer,
            getButtonStyle(),
            {
              opacity: borderOpacity,
              backgroundColor: getDarkerColor(),
              borderRadius: borderRadius,
              width: "100%", // Ensure it matches button width
            },
          ]}
        />

        {/* Main Button */}
        <Animated.View
          style={[
            getButtonStyle(),
            {
              transform: [{ scale: scaleAnim }, { translateY: translateYAnim }],
              width: "100%", // Ensure button fills container
            },
          ]}
        >
          <Text style={getTextStyle()}>{title}</Text>
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  buttonContainer: {
    position: "relative",
    backgroundColor: "transparent", // Ensure no background
    overflow: "visible", // Allow 3D layer to show
  },
  bottomLayer: {
    position: "absolute",
    top: 0, // CHANGED: Starts at same position as button
    left: 0,
    right: 0,
    bottom: -6, // Extended below for 3D depth (6px depth)
  },
});
