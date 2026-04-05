import React, { useState, useEffect, useRef } from "react";
import {
  Animated,
  View,
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
import { Text } from '../../TTS';
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  SafeAreaView,
  SafeAreaProvider,
  SafeAreaInsetsContext,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { getFirestore, collection, query, where, getDocs, doc, updateDoc, onSnapshot } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import PlanetModal from "./PlanetModal";
import { ACTIVE_PLANET_STORAGE_KEY } from "../services/gameRegistry";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const IMG_SIDE = 200;

const ITEM_WIDTH = IMG_SIDE;
const ITEM_MARGIN = 300;
const SNAP_INTERVAL = ITEM_WIDTH + (ITEM_MARGIN);

const SCREEN_OFFSET = (SCREEN_WIDTH - ITEM_WIDTH) / 2;

// TODO: move this to the DB eventually
const PLANET_IMAGES: { [key: number]: any } = {
    1: require("../../assets/images/sprites/planets/1.gif"),
    2: require("../../assets/images/sprites/planets/2.gif"),
    3: require("../../assets/images/sprites/planets/3.gif"),
    4: require("../../assets/images/sprites/planets/4.gif"),
    5: require("../../assets/images/sprites/planets/5.gif"),
    6: require("../../assets/images/sprites/planets/6.gif"),
    7: require("../../assets/images/sprites/planets/7.gif"),
    8: require("../../assets/images/sprites/planets/8.gif"),
    9: require("../../assets/images/sprites/planets/9.gif"),
};

// Dark versions for locked planets
const PLANET_DARK_IMAGES: { [key: number]: any } = {
    1: require("../../assets/images/sprites/planets/dark/1.png"),
    2: require("../../assets/images/sprites/planets/dark/2&3.png"),
    3: require("../../assets/images/sprites/planets/dark/2&3.png"),
    4: require("../../assets/images/sprites/planets/dark/4.png"),
    5: require("../../assets/images/sprites/planets/dark/5.png"),
    6: require("../../assets/images/sprites/planets/dark/6.png"),
    7: require("../../assets/images/sprites/planets/dark/7.png"),
    8: require("../../assets/images/sprites/planets/dark/8.png"),
    9: require("../../assets/images/sprites/planets/dark/9.png"),
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
const Planet = ({planetID, islocked, onPress, isLast}: PlanetScrollListProps & { isLast?: boolean }) => {
    const scale = useRef(new Animated.Value(1)).current;

    // make the planets jiggle a little
    useEffect(() => {
        Animated.loop(
        Animated.sequence([
            Animated.timing(scale, {
            toValue: 1.05,
            duration: 1000,
            useNativeDriver: true,
            }),
            Animated.timing(scale, {
            toValue: 1,
            duration: 1200,
            useNativeDriver: true,
            }),
        ])
        ).start();
    }, []);
    
    
    return (
        <TouchableOpacity
            onPress={() => onPress(planetID)}
            activeOpacity={0.7}
            style={{ paddingRight: isLast ? 0 : ITEM_MARGIN }}
        >
            <Animated.View style={{ width: IMG_SIDE, height: IMG_SIDE, justifyContent: 'center', alignItems: 'center', transform: [{ scale }] }}>
                <Image
                    // include islocked in the key so the image is recreated when lock state changes
                    key={`planet-${planetID}-${islocked}`}
                    testID={`planet-${planetID}-image`}
                    source={islocked ? PLANET_DARK_IMAGES[planetID] : PLANET_IMAGES[planetID]}
                    
                />
            </Animated.View>
        </TouchableOpacity>
    );
};

// Main component that renders the horizontal scroll list of planets
export default function PlanetScrollList({ onRocksChange, onActivePlanetChange }: { onRocksChange?: () => void; onActivePlanetChange?: (isLocked: boolean) => void }) {
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
        
        const setupProgressListener = async () => {
          const activeChild = await AsyncStorage.getItem("activeChildProfile");
          console.log("[PlanetScrollList] Active child profile:", activeChild);

          let userDocRef;

          if (activeChild) {
            // Listen to child's progress
            const childrenRef = collection(db, "users", auth.currentUser!.uid, "children");
            const childQuery = query(childrenRef, where("username", "==", activeChild));
            const childSnapshot = await getDocs(childQuery);

            if (!childSnapshot.empty) {
              const childDoc = childSnapshot.docs[0];
              userDocRef = childDoc.ref;
              console.log("[PlanetScrollList] Listening to child progress for:", activeChild);
            } else {
              console.warn("[PlanetScrollList] Child profile not found, using parent progress");
              userDocRef = doc(db, "users", auth.currentUser!.uid);
            }
          } else {
            userDocRef = doc(db, "users", auth.currentUser!.uid);
          }

          // Listen to progress updates
          const unsubscribe = onSnapshot(userDocRef, (snap) => {
            if (snap.exists()) {
              const data = snap.data();
              if (data.currPlanet != null) {
                setCurrentProgress(data.currPlanet);
                console.log("[PlanetScrollList] Updated current progress:", data.currPlanet);
              }
            }
          });

          return unsubscribe;
        };

        let unsubscribe: (() => void) | null = null;
        setupProgressListener().then((unsub) => {
          unsubscribe = unsub;
        });

        return () => {
          if (unsubscribe) unsubscribe();
        };
    }, []);

    const handleScrollEnd = (e: any) => {
        const x = e.nativeEvent.contentOffset.x;
        const index = Math.round(x / SNAP_INTERVAL);
        const id = planets[index] ?? planets[0];
        if (id !== activePlanet) {
            setActivePlanet(id);
            // update selectedPlanet without opening modal
            setSelectedPlanet(id);
            onActivePlanetChange?.(id > currentProgress);
            void AsyncStorage.setItem(ACTIVE_PLANET_STORAGE_KEY, String(id)).catch((err) => {
                console.warn("Failed to store active planet id", err);
            });
            console.log('Active planet changed to', id);
        }
    };

    // Calculate snap offsets for each planet to prevent over-scrolling
    const snapOffsets = planets.map((_, index) => index * SNAP_INTERVAL);

    return(
        <SafeAreaView className="flex-1">
            <ScrollView 
            className="flex-1 space-x-20" 
            horizontal={true} 
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={{ alignItems: 'center', paddingHorizontal: SCREEN_OFFSET }}
            snapToOffsets={snapOffsets}
            snapToAlignment="start"
            decelerationRate="fast"
            onMomentumScrollEnd={handleScrollEnd}
            onScrollEndDrag={handleScrollEnd}
            >
                {planets.map((id, index) => (
                        <Planet 
                            key={id} 
                            planetID={id} 
                            islocked={id > currentProgress} 
                            isSelected={id === activePlanet}
                            isLast={index === planets.length - 1}
                            onPress={handlePlanetPress} />
                        ))}
            </ScrollView>
            <PlanetModal visible={modalVisible} onClose={() => setModalVisible(false)} planetId={selectedPlanet ?? undefined} isLocked={selectedPlanet != null && selectedPlanet > currentProgress} selectedPlanet={selectedPlanet} onRocksChange={onRocksChange ?? (() => {})} currentProgress={currentProgress} onPlanetUnlock={(newProgress) => setCurrentProgress(newProgress)} />
        </SafeAreaView>
    );
}
