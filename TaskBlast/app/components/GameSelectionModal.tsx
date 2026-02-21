import React from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface GameSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectGame: (gameUrl: string) => void;
}

type GameOption = {
  id: string;
  name: string;
  url: string;
  iconPath?: any;
  description?: string;
};

const GAME_OPTIONS: GameOption[] = [
  {
    id: "space-shooter",
    name: "Space Shooter",
    url: "https://krypto-cs.github.io/SpaceShooter/",
    description: "Blast the asteroids!",
  },
  {
    id: "space-bird",
    name: "Space Bird",
    url: "https://krypto-cs.github.io/SpaceBird/",
    description: "Dodge the asteroids!",
  },
  // Add more games here in the future
];

export default function GameSelectionModal({
  visible,
  onClose,
  onSelectGame,
}: GameSelectionModalProps) {
  const handleGameSelect = (gameUrl: string) => {
    onSelectGame(gameUrl);
    onClose();
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
              Choose Your Game
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
          <ScrollView
            className="max-h-96"
            showsVerticalScrollIndicator={false}
          >
            <View className="gap-3">
              {GAME_OPTIONS.map((game) => (
                <TouchableOpacity
                  key={game.id}
                  onPress={() => handleGameSelect(game.url)}
                  className="rounded-2xl p-4 border-2"
                  style={{
                    backgroundColor: "rgba(88, 28, 135, 0.3)",
                    borderColor: "rgba(168, 85, 247, 0.5)",
                  }}
                  testID={`game-option-${game.id}`}
                >
                  <View className="flex-row items-center">
                    <View className="flex-1">
                      <Text className="font-orbitron-bold text-white text-lg mb-1">
                        {game.name}
                      </Text>
                      {game.description && (
                        <Text className="font-madimi text-gray-300 text-sm">
                          {game.description}
                        </Text>
                      )}
                    </View>
                    <Ionicons
                      name="game-controller"
                      size={32}
                      color="#a855f7"
                    />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
