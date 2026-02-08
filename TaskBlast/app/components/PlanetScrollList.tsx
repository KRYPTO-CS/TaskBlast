import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  SafeAreaViewBase,
  Dimensions,
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

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const IMG_SIDE = 200;

const ITEM_WIDTH = IMG_SIDE;
const ITEM_MARGIN = 128;
const SNAP_INTERVAL = ITEM_WIDTH + (ITEM_MARGIN);

const SCREEN_OFFSET = (SCREEN_WIDTH - ITEM_WIDTH) / 2;


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
            activeOpacity={0.7}
            style={{    paddingRight: ITEM_MARGIN}}
        >
            <Image
                testID={`planet-${planetID}-image`}
                source={require("../../assets/images/sprites/planet.png")}
                style={{ width: IMG_SIDE, height: IMG_SIDE, ...(islocked && { tintColor: 'black' }) }}
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
            <ScrollView 
            className="flex-1 space-x-20" 
            horizontal={true} 
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={{ alignItems: 'center', paddingHorizontal: SCREEN_OFFSET }}
            snapToInterval={SNAP_INTERVAL}
            decelerationRate="fast">
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
