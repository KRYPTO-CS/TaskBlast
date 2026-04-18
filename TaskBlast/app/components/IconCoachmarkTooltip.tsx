import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Text } from "../../TTS";
import { Ionicons } from "@expo/vector-icons";
import { TooltipRenderProps } from "@edwardloopez/react-native-coachmark";

export default function IconCoachmarkTooltip({
  theme,
  title,
  description,
  index,
  count,
  isFirst,
  isLast,
  onNext,
  onBack,
  onSkip,
}: TooltipRenderProps) {
  return (
    <View
      style={[
        styles.container,
        {
          maxWidth: theme.tooltip.maxWidth,
          backgroundColor: theme.tooltip.bg,
          borderRadius: theme.tooltip.radius,
          padding: theme.tooltip.padding,
        },
      ]}
    >
      {!!title && (
        <Text style={[styles.title, { color: theme.tooltip.fg }]}>{title}</Text>
      )}
      {!!description && (
        <Text style={[styles.description, { color: theme.tooltip.fg }]}>
          {description}
        </Text>
      )}

      <View style={styles.progressRow}>
        {Array(count)
          .fill(0)
          .map((_, i) => (
            <View
              key={i}
              style={[
                styles.progressDot,
                {
                  backgroundColor:
                    i === index
                      ? theme.tooltip.buttonPrimaryBg
                      : theme.tooltip.buttonSecondaryBg,
                  opacity: i === index ? 1 : 0.3,
                },
              ]}
            />
          ))}
      </View>

      <View style={styles.actionsRow}>
        {!isFirst && (
          <Pressable
            onPress={onBack}
            style={[
              styles.iconButton,
              { backgroundColor: theme.tooltip.buttonSecondaryBg },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <Ionicons name="arrow-back" size={18} color="#fff" />
          </Pressable>
        )}

        {!isLast && (
          <Pressable
            onPress={onSkip}
            style={[
              styles.iconButton,
              { backgroundColor: theme.tooltip.buttonSecondaryBg },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Skip"
          >
            <Ionicons name="close" size={18} color="#fff" />
          </Pressable>
        )}

        <Pressable
          onPress={onNext}
          style={[
            styles.iconButton,
            { backgroundColor: theme.tooltip.buttonPrimaryBg },
          ]}
          accessibilityRole="button"
          accessibilityLabel={isLast ? "Done" : "Next"}
        >
          <Ionicons
            name={isLast ? "checkmark" : "arrow-forward"}
            size={18}
            color="#fff"
          />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 6,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  progressRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    marginBottom: 12,
  },
  progressDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
  },
  iconButton: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
});
