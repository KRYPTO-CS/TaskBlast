import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  SafeAreaViewBase,
  ScrollView,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import {
  SafeAreaView,
  SafeAreaProvider,
  SafeAreaInsetsContext,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { updateProfilePicture } from "../../server/storageUtils";
import {
  updateUserProfile,
  type UserProfile,
} from "../../server/userProfileUtils";
import { auth } from "../../server/firebase";
import { getFirestore, collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore";

// Define the props for the PlanetScrollList component
/*
    planetID: number - The unique identifier for each planet (e.g., 1 for Mercury, 2 for Venus, etc.)
    isLocked: boolean - Indicates whether the planet is locked or unlocked based on the user's progress
    onPress: (id: number) => void - A callback function that gets called when a planet is pressed, passing the planetID as an argument
*/
interface PlanetScrollListProps {
    planetID: number;
    islocked: boolean;
    onPress: (id: number) => void;
}

const Planet = ({planetID, islocked, onPress}: PlanetScrollListProps) => {
    return (

        <TouchableOpacity
            onPress={() => onPress(planetID)}
        >
            <Image
                testID={`planet-${planetID}-image`}
                source={require("../../assets/images/sprites/planet.png")}
                style={{ width: 128, height: 128, ...(islocked && { tintColor: 'black' }) }}
            />
        </TouchableOpacity>
    );
};

export default function PlanetScrollList() {
    const [planets] = useState<number[]>([1, 2, 3, 4, 5, 6, 7, 8, 9]);

    // create test state
    // TODO: add DB logic to determine which planets are locked/unlocked based on user progress
    const [currentProgress] = useState(1);

    //testing
    const handlePlanetPress = (id: number) => {
        console.log("Current Progress: ", id);
    }

    return(
        <SafeAreaView className="flex-1">
            <ScrollView className="flex-1 space-x-20" horizontal={true} showsHorizontalScrollIndicator={false} contentContainerStyle={{ alignItems: 'center', paddingHorizontal: 0 }}>
            <View style={{ width: 64 }} /> {/* Spacer at the start */}
                {planets.map((id) => (
                        <Planet 
                        key={id} 
                        planetID={id} 
                        islocked={id > currentProgress} 
                        onPress={handlePlanetPress} />
                        ))}
            </ScrollView>
        </SafeAreaView>
    );
}