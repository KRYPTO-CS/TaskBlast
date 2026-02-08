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
import { getFirestore, collection, query, where, getDocs, doc, updateDoc, onSnapshot } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import PlanetModal from "./PlanetModal";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const IMG_SIDE = 200;

const ITEM_WIDTH = IMG_SIDE;
const ITEM_MARGIN = 128;
const SNAP_INTERVAL = ITEM_WIDTH + (ITEM_MARGIN);

const SCREEN_OFFSET = (SCREEN_WIDTH - ITEM_WIDTH) / 2;

// TODO: move this to the DB eventually
const PLANET_IMAGES: { [key: number]: any } = {
    1: require("../../assets/images/sprites/planets/1.gif"),
    2: require("../../assets/images/sprites/planets/2.png"),
    3: require("../../assets/images/sprites/planets/3.png"),
    4: require("../../assets/images/sprites/planets/4.png"),
    5: require("../../assets/images/sprites/planets/5.png"),
    6: require("../../assets/images/sprites/planets/6.png"),
    7: require("../../assets/images/sprites/planets/7.png"),
    8: require("../../assets/images/sprites/planets/8.png"),
    9: require("../../assets/images/sprites/planets/9.png"),
};

// Define the props for the PlanetScrollList component
/*
    planetID: number - The unique identifier for each planet (e.g., 1 for Mercury, 2 for Venus, etc.)
    isLocked: boolean - Indicates whether the planet is locked or unlocked based on the user's progress
    onPress: (id: number) => void - A callback function that gets called when a planet is pressed, passing the planetID as an argument
*/
interface PlanetScrollListProps {
    planetID: number;
    islocked: boolean;
    isSelected?: boolean;
    onPress: (id: number) => void;
}

// actual planet component that will be rendered in the scroll list
const Planet = ({planetID, islocked, onPress}: PlanetScrollListProps) => {
    return (
        <TouchableOpacity
            onPress={() => onPress(planetID)}
            activeOpacity={0.7}
            style={{ paddingRight: ITEM_MARGIN }}
        >
            <Image
                // include islocked in the key so the Image is recreated when lock state changes
                key={`planet-${planetID}-${islocked}`}
                testID={`planet-${planetID}-image`}
                source={PLANET_IMAGES[planetID]}
                style={{
                    width: IMG_SIDE,
                    height: IMG_SIDE,
                    // no tint if unlocked
                    tintColor: islocked ? 'black' : undefined,
                }}
            />
        </TouchableOpacity>
    );
};

// Main component that renders the horizontal scroll list of planets
export default function PlanetScrollList() {
    const [planets] = useState<number[]>([1, 2, 3, 4, 5, 6, 7, 8, 9]);

    const auth = getAuth();
    const db = getFirestore();

    // create test state
    // TODO: add DB logic to determine which planets are locked/unlocked based on user progress
    const [currentProgress, setCurrentProgress] = useState<number>(1);

    // modal state for planet details
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedPlanet, setSelectedPlanet] = useState<number | null>(1);
    const [activePlanet, setActivePlanet] = useState<number>(planets[0]);

    const handlePlanetPress = (id: number) => {
        setSelectedPlanet(id);
        setModalVisible(true);
        console.log("Planet pressed: ", id);
    };

    useEffect(() => {
        if (!auth.currentUser) throw new Error("No authenticated user");
        const user = doc(db, 'users', auth.currentUser?.uid);
        // trigger a change in currentProgress when user's progress updates in Firestore using snapshot

        const unsubscribe = onSnapshot(user, (snap) => {
            if (snap.exists()) {
                const data = snap.data();
                if (data.currPlanet != null) {
                    setCurrentProgress(data.currPlanet);
                }
            }
            else {
                return;
            }
        });
        return () => unsubscribe();

    }, []);

    const handleScrollEnd = (e: any) => {
        const x = e.nativeEvent.contentOffset.x;
        const index = Math.round(x / SNAP_INTERVAL);
        const id = planets[index] ?? planets[0];
        if (id !== activePlanet) {
            setActivePlanet(id);
            // update selectedPlanet without opening modal
            setSelectedPlanet(id);
            console.log('Active planet changed to', id);
        }
    };

    return(
        <SafeAreaView className="flex-1">
            <ScrollView 
            className="flex-1 space-x-20" 
            horizontal={true} 
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={{ alignItems: 'center', paddingHorizontal: SCREEN_OFFSET }}
            snapToInterval={SNAP_INTERVAL}
            decelerationRate="fast"
            onMomentumScrollEnd={handleScrollEnd}
            onScrollEndDrag={handleScrollEnd}
            >
                {planets.map((id) => (
                        <Planet 
                            key={id} 
                            planetID={id} 
                            islocked={id > currentProgress} 
                            isSelected={id === activePlanet}
                            onPress={handlePlanetPress} />
                        ))}
            </ScrollView>
            <PlanetModal visible={modalVisible} onClose={() => setModalVisible(false)} planetId={selectedPlanet ?? undefined} isLocked={selectedPlanet != null && selectedPlanet > currentProgress} />
        </SafeAreaView>
    );
}
