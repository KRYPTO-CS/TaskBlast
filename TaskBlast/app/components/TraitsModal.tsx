import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  updateUserProfile,
  type UserProfile,
} from "../../server/userProfileUtils";
import { auth } from "../../server/firebase";

interface TraitsModalProps {
  visible: boolean;
  onClose: () => void;
  userProfile: UserProfile;
  onTraitsUpdate: (updatedProfile: UserProfile) => void;
}

const AVAILABLE_TRAITS = [
  "ADHD",
  "Aspergers",
  "Autism",
  "Developmental Language Disorder",
  "Disability Confident",
  "Dyscalculia",
  "Dysgraphia",
  "Dyslexia",
  "Dyspraxia",
  "Hyperlexia",
  "Irlen Syndrome",
  "OCD",
  "Synthesia",
  "Tourette's Syndrome",
];

export default function TraitsModal({
  visible,
  onClose,
  userProfile,
  onTraitsUpdate,
}: TraitsModalProps) {
  const [selectedTraits, setSelectedTraits] = useState<string[]>(
    userProfile.traits || []
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  // Update local state when userProfile prop changes
  useEffect(() => {
    setSelectedTraits(userProfile.traits || []);
  }, [userProfile]);

  const toggleTrait = (trait: string) => {
    setSelectedTraits((prev) => {
      if (prev.includes(trait)) {
        return prev.filter((t) => t !== trait);
      } else {
        return [...prev, trait];
      }
    });
  };

  const handleSave = async () => {
    setError("");
    setIsSaving(true);

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        setError("You must be logged in to update traits");
        setIsSaving(false);
        return;
      }

      // Update profile in Firestore
      await updateUserProfile(currentUser.uid, {
        traits: selectedTraits,
      });

      // Update local state
      const updatedProfile = {
        ...userProfile,
        traits: selectedTraits,
      };
      onTraitsUpdate(updatedProfile);

      // Close modal
      onClose();
    } catch (error) {
      console.error("Error updating traits:", error);
      setError("Failed to update traits. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset to original traits
    setSelectedTraits(userProfile.traits || []);
    setError("");
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleCancel}
    >
      <View className="flex-1 justify-end bg-black/70">
        <View
          className="rounded-t-3xl p-6"
          style={{
            backgroundColor: "rgba(17, 24, 39, 0.98)",
            borderTopWidth: 2,
            borderTopColor: "rgba(59, 130, 246, 0.5)",
            maxHeight: "85%",
          }}
        >
          {/* Header */}
          <View className="flex-row justify-between items-center mb-6">
            <Text
              className="font-orbitron-semibold text-2xl text-white"
              style={{
                textShadowColor: "rgba(59, 130, 246, 0.8)",
                textShadowOffset: { width: 0, height: 0 },
                textShadowRadius: 15,
              }}
            >
              Select Traits
            </Text>
            <TouchableOpacity
              onPress={handleCancel}
              className="w-10 h-10 rounded-full items-center justify-center"
              style={{
                backgroundColor: "rgba(239, 68, 68, 0.2)",
                borderWidth: 1,
                borderColor: "rgba(239, 68, 68, 0.5)",
              }}
            >
              <Ionicons name="close" size={24} color="#ef4444" />
            </TouchableOpacity>
          </View>

          {/* Error Message */}
          {error ? (
            <View
              className="mb-4 p-3 rounded-xl"
              style={{
                backgroundColor: "rgba(239, 68, 68, 0.1)",
                borderWidth: 1,
                borderColor: "rgba(239, 68, 68, 0.3)",
              }}
            >
              <Text className="text-red-400 text-sm text-center">{error}</Text>
            </View>
          ) : null}

          {/* Traits List */}
          <ScrollView
            className="mb-6"
            showsVerticalScrollIndicator={false}
            style={{ maxHeight: 400 }}
          >
            <View className="gap-3">
              {AVAILABLE_TRAITS.map((trait, index) => {
                const isSelected = selectedTraits.includes(trait);
                return (
                  <TouchableOpacity
                    key={index}
                    onPress={() => toggleTrait(trait)}
                    className="flex-row items-center justify-between p-4 rounded-xl"
                    style={{
                      backgroundColor: isSelected
                        ? "rgba(59, 130, 246, 0.3)"
                        : "rgba(30, 58, 138, 0.2)",
                      borderWidth: 2,
                      borderColor: isSelected
                        ? "rgba(96, 165, 250, 0.6)"
                        : "rgba(59, 130, 246, 0.3)",
                      shadowColor: isSelected ? "#3b82f6" : "transparent",
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: isSelected ? 0.4 : 0,
                      shadowRadius: 8,
                    }}
                  >
                    <Text
                      className="font-orbitron-semibold text-white text-base flex-1"
                      style={{
                        textShadowColor: isSelected
                          ? "rgba(59, 130, 246, 0.6)"
                          : "transparent",
                        textShadowOffset: { width: 0, height: 0 },
                        textShadowRadius: 8,
                      }}
                    >
                      {trait}
                    </Text>
                    {isSelected && (
                      <View
                        className="w-8 h-8 rounded-full items-center justify-center"
                        style={{
                          backgroundColor: "rgba(59, 130, 246, 0.5)",
                        }}
                      >
                        <Ionicons name="checkmark" size={20} color="white" />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={handleCancel}
              disabled={isSaving}
              className="flex-1 py-4 rounded-xl items-center justify-center"
              style={{
                backgroundColor: "rgba(107, 114, 128, 0.3)",
                borderWidth: 2,
                borderColor: "rgba(156, 163, 175, 0.5)",
              }}
            >
              <Text className="font-orbitron-semibold text-white text-base">
                Cancel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSave}
              disabled={isSaving}
              className="flex-1 py-4 rounded-xl items-center justify-center"
              style={{
                backgroundColor: isSaving
                  ? "rgba(59, 130, 246, 0.2)"
                  : "rgba(59, 130, 246, 0.5)",
                borderWidth: 2,
                borderColor: "rgba(96, 165, 250, 0.7)",
                shadowColor: "#3b82f6",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.5,
                shadowRadius: 10,
              }}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text className="font-orbitron-semibold text-white text-base">
                  Save Traits
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
