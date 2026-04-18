import React from "react";
import { View, Modal, TouchableOpacity, ScrollView } from "react-native";
import { Text } from "../../TTS";
import { Ionicons } from "@expo/vector-icons";
import { GAME_DEFINITIONS } from "../services/gameRegistry";
import { useTranslation } from "react-i18next";

interface GameSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectGame: (gameId: number) => void;
}

type GameOption = {
  id: number;
  name: string;
  iconPath?: any;
  description?: string;
  isFreeTime?: boolean;
};

const GAME_OPTIONS: GameOption[] = GAME_DEFINITIONS.map((game) => ({
  id: game.id,
  name: game.name,
  description: game.description,
  isFreeTime: game.isFreeTime,
})).sort((a, b) => {
  if (a.isFreeTime === b.isFreeTime) return 0;
  return a.isFreeTime ? 1 : -1;
});

export default function GameSelectionModal({
  visible,
  onClose,
  onSelectGame,
}: GameSelectionModalProps) {
  const { t } = useTranslation();

  const handleGameSelect = (gameId: number) => {
    onSelectGame(gameId);
    onClose();
  };

  const getGameTranslation = (game: GameOption) => {
    switch (game.id) {
      case 0:
        return {
          name: t("Games.asteroidBlaster"),
          description: t("Games.asteroidBlasterDesc"),
        };
      case 1:
        return {
          name: t("Games.spaceSwerve"),
          description: t("Games.spaceSwerveDesc"),
        };
      case 2:
        return {
          name: t("Games.freeTime"),
          description: t("Games.freeTimeDesc"),
        };
      case 3:
        return {
          name: t("Games.game2048"),
          description: t("Games.game2048Desc"),
        };
      case 4:
        return {
          name: t("Games.matchBlast"),
          description: t("Games.matchBlastDesc"),
        };
      default:
        return {
          name: game.name,
          description: game.description,
        };
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/70 justify-center items-center">
        <View
          className="w-11/12 max-w-md rounded-3xl p-6"
          style={{
            backgroundColor: "rgba(15, 23, 42, 0.95)",
            borderWidth: 2,
            borderColor: "rgba(168, 85, 247, 0.5)",
          }}
        >
          {/* Header */}
          <View className="flex-row justify-between items-center mb-4">
            <Text className="font-orbitron-bold text-white text-2xl flex-1">
              {t("Games.chooseTitle")}
            </Text>
            <TouchableOpacity
              onPress={onClose}
              className="p-2"
              testID="close-modal-button"
            >
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Game Options */}
          <ScrollView className="max-h-96" showsVerticalScrollIndicator={false}>
            <View className="gap-3">
              {GAME_OPTIONS.map((game) => {
                const localized = getGameTranslation(game);

                return (
                  <TouchableOpacity
                    key={game.id}
                    onPress={() => handleGameSelect(game.id)}
                    className="rounded-2xl p-4 border-2"
                    style={{
                      backgroundColor: game.isFreeTime
                        ? "rgba(34, 197, 94, 0.3)"
                        : "rgba(88, 28, 135, 0.3)",
                      borderColor: game.isFreeTime
                        ? "rgba(34, 197, 94, 0.5)"
                        : "rgba(168, 85, 247, 0.5)",
                    }}
                    testID={`game-option-${game.id}`}
                  >
                    <View className="flex-row items-center">
                      <View className="flex-1">
                        <Text className="font-orbitron-bold text-white text-lg mb-1">
                          {localized.name}
                        </Text>
                        {localized.description && (
                          <Text className="font-madimi text-gray-300 text-sm">
                            {localized.description}
                          </Text>
                        )}
                      </View>
                      <Ionicons
                        name={game.isFreeTime ? "hourglass" : "game-controller"}
                        size={32}
                        color={game.isFreeTime ? "#22c55e" : "#a855f7"}
                      />
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
