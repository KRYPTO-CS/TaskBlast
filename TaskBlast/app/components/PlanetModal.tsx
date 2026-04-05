import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  View,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Alert,
} from "react-native";
import { Text } from "../../TTS";
import { Ionicons } from "@expo/vector-icons";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import MainButton from "./MainButton";
import { unlockPlanet } from "../services/economyService";

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

// Dark versions for locked planets; gotcha
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

interface PlanetModalProps {
  visible: boolean;
  onClose: () => void;
  planetId?: number;
  isLocked?: boolean;
  selectedPlanet?: number | null;
  currentProgress?: number;
  onRocksChange: () => void;
  onPlanetUnlock?: (newProgress: number) => void;
}

interface PlanetData {
  name?: string;
  description?: string;
  [key: string]: any;
  cost?: number;
}

export default function PlanetModal({
  visible,
  onClose,
  planetId,
  isLocked,
  selectedPlanet,
  currentProgress,
  onRocksChange,
  onPlanetUnlock,
}: PlanetModalProps) {
  const auth = getAuth();
  const db = getFirestore();

  const [planet, setPlanet] = useState<PlanetData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rocks, setRocks] = useState<number>(0);
  const [confirmUnlock, setConfirmUnlock] = useState(false);
  const [justUnlocked, setJustUnlocked] = useState(false);
  const [newRocksAfterUnlock, setNewRocksAfterUnlock] = useState<number>(0);

  // Animation values
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  const triggerUnlockAnimation = () => {
    scaleAnim.setValue(0);
    glowAnim.setValue(0);
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        tension: 80,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0.6,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  };

  const getPlanetDocRef = (id: number) => {
    return doc(db, "planets", id.toString());
  };

  // Check if the user has enough rocks and unlock the planet if so
  const handlePlanetUnlock = async () => {
    const user = auth.currentUser;
    if (!user) {
      console.log("No such user");
      return;
    }

    // Resolve child or parent doc
    let userDocRef = doc(db, "users", user.uid);
    let childDocId: string | null = null;
    const activeChild = await AsyncStorage.getItem("activeChildProfile");
    if (activeChild) {
      const childrenRef = collection(db, "users", user.uid, "children");
      const childQuery = query(childrenRef, where("username", "==", activeChild));
      const childSnapshot = await getDocs(childQuery);
      if (!childSnapshot.empty) {
        childDocId = childSnapshot.docs[0].id;
        userDocRef = childSnapshot.docs[0].ref;
      }
    }

    const userSnap = await getDoc(userDocRef);

    // compute fresh rocks value synchronously for checks
    const rocksValue = userSnap.exists() ? userSnap.data()?.rocks || 0 : 0;
    const currentRocks = isNaN(rocksValue)
      ? 0
      : Math.max(0, Math.floor(rocksValue));

    const nextPlanetId = Math.max(
      1,
      Math.floor(selectedPlanet ?? planetId ?? currentProgress ?? 1),
    );

    try {
      if (planet?.cost && currentRocks < planet.cost) {
        Alert.alert(
          "Not Enough Crystals",
          `You need ${planet.cost} crystals but only have ${currentRocks}.`,
        );
        setConfirmUnlock(false);
        return;
      }

      if (nextPlanetId > (currentProgress ?? 0) + 1) {
        Alert.alert(
          "Unlock Previous Planet First",
          `You need to unlock planet ${currentProgress} first.`,
        );
        setConfirmUnlock(false);
        return;
      }

      const result = await unlockPlanet({ planetId: nextPlanetId, childDocId });
      if (!result.success) {
        throw new Error(result.message || "Failed to unlock planet");
      }

      // update local rocks immediately so UI reflects change
      const updatedRocks =
        typeof result.newRocks === "number"
          ? Math.max(0, Math.floor(result.newRocks))
          : Math.max(0, currentRocks - (planet?.cost ?? 0));

      setRocks(updatedRocks);
      setNewRocksAfterUnlock(updatedRocks);
      setJustUnlocked(true);
      triggerUnlockAnimation();

      // update planet scroll list immediately with the new progress
      if (result.currPlanet != null) {
        onPlanetUnlock?.(result.currPlanet);
      }

      // update main page rocks/gems
      onRocksChange();

      console.log("Planet ", nextPlanetId, "unlock result for user", user.uid);
    } catch (err: any) {
      console.error("Error unlocking planet:", err);
      const errMsg = String(err?.message || "");
      if (errMsg.includes("Not enough rocks")) {
        Alert.alert(
          "Not Enough Crystals",
          `You need ${planet?.cost ?? 0} crystals but only have ${currentRocks}.`,
        );
      } else if (errMsg.includes("Unlock previous planet")) {
        Alert.alert(
          "Unlock Previous Planet First",
          `You need to unlock planet ${currentProgress} first.`,
        );
      } else {
        Alert.alert("Error", "Failed to unlock planet");
      }
    } finally {
      setConfirmUnlock(false);
    }
  };

  const handleClose = () => {
    setConfirmUnlock(false);
    setJustUnlocked(false);
    onClose();
  };

  const getPlanetImage = (id?: number) => {
    return PLANET_IMAGES[id ?? 1];
  };

  const handleConfirmUnlock = () => {
    setConfirmUnlock(true);
  };

  useEffect(() => {
    let mounted = true;
    const loadPlanet = async () => {
      if (!visible) return;
      if (planetId == null) return;
      setLoading(true);
      setError(null);
      setJustUnlocked(false);
      try {
        const planetRef = getPlanetDocRef(planetId);
        const snap = await getDoc(planetRef);
        if (!mounted) return;
        if (snap.exists()) {
          setPlanet(snap.data() as PlanetData);
        } else {
          setPlanet(null);
          setError("No planet data found");
        }
      } catch (err) {
        console.error("Error loading planet:", err);
        if (mounted) setError("Failed to load planet");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadPlanet();
    return () => {
      mounted = false;
    };
  }, [visible, planetId, isLocked, selectedPlanet]);

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={handleClose}
      testID="planet-modal"
    >
      <View className="flex-1 justify-center items-center bg-black/70">
        <View
          className="w-11/12 max-w-md rounded-3xl p-6"
          style={{
            backgroundColor: "rgba(15, 23, 42, 0.95)",
            borderWidth: 2,
            borderColor: justUnlocked
              ? "rgba(139, 246, 167, 0.7)"
              : "rgba(139, 92, 246, 0.5)",
          }}
        >
          {/* Header with close button */}
          <View className="flex-row justify-between items-center mb-4">
            <Text
              className="font-orbitron-semibold text-white text-2xl"
              style={{
                textShadowColor: justUnlocked
                  ? "rgba(74, 222, 128, 0.9)"
                  : "rgba(139, 92, 246, 0.8)",
                textShadowOffset: { width: 0, height: 0 },
                textShadowRadius: 15,
              }}
            >
              {justUnlocked
                ? "Planet Unlocked!"
                : isLocked
                  ? "Planet Not Unlocked"
                  : loading
                    ? "Loading..."
                    : (planet?.name ?? "")}
            </Text>

            <TouchableOpacity
              testID="close-planet-modal"
              onPress={handleClose}
              className="w-10 h-10 rounded-full items-center justify-center"
              style={{
                backgroundColor: "rgba(139, 92, 246, 0.3)",
                borderWidth: 1,
                borderColor: "rgba(167, 139, 250, 0.5)",
              }}
            >
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
          </View>

          {/* Option to buy locked planet / Planet Image and Description */}
          <View style={{ minHeight: 120 }}>
            {loading && (
              <View className="items-center justify-center">
                <ActivityIndicator size="small" color="#a855f7" />
              </View>
            )}
            {error && (
              <Text className="text-red-400 text-sm mt-2 font-orbitron-semibold">
                {error}
              </Text>
            )}

            {/* Success state after unlock */}
            {justUnlocked && planet ? (
              <View className="items-center justify-center" style={{ gap: 12 }}>
                <Animated.View
                  style={{
                    transform: [{ scale: scaleAnim }],
                    opacity: glowAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.5, 1],
                    }),
                  }}
                >
                  <Image source={getPlanetImage(planetId ?? 1)} />
                </Animated.View>
                <Text className="text-green-300 text-base font-orbitron-bold text-center">
                  {planet.name} is now available!
                </Text>
                <View className="flex-row items-center bg-purple-600/50 px-4 py-2 rounded-full">
                  <Image
                    source={require("../../assets/images/sprites/crystal.png")}
                    style={{ width: 20, height: 20 }}
                    resizeMode="contain"
                  />
                  <Text className="font-orbitron-bold text-white text-base ml-2">
                    {String(newRocksAfterUnlock).padStart(4, "0")} remaining
                  </Text>
                </View>
                <MainButton title="Continue" onPress={handleClose} />
              </View>
            ) : isLocked && planet ? (
              <View className="items-center justify-center">
                <Image source={PLANET_DARK_IMAGES[planetId ?? 1]} />
                <Text className="text-white text-base mt-2 font-orbitron-semibold">
                  {planet.description}
                </Text>
                <View className="flex-row space-x-4 items-center">
                  <View className="flex-row items-center bg-purple-600/50 px-4 py-2 rounded-full max-h-10">
                    <Image
                      source={require("../../assets/images/sprites/crystal.png")}
                      style={{ width: 20, height: 20 }}
                      resizeMode="contain"
                    />
                    <Text className="font-orbitron-bold text-white text-base ml-2">
                      {planet.cost ?? ""}
                    </Text>
                  </View>
                  {confirmUnlock ? (
                    <MainButton
                      title="Confirm Unlock"
                      className="py-5"
                      customStyle={{ backgroundColor: "#ffee00" }}
                      onPress={() => handlePlanetUnlock()}
                    />
                  ) : (
                    <MainButton
                      title="Unlock Planet"
                      className="py-5"
                      onPress={() => handleConfirmUnlock()}
                    />
                  )}
                </View>
              </View>
            ) : (
              !loading &&
              !error &&
              planet && (
                <View
                  className="items-center justify-center"
                  style={{ gap: 15 }}
                >
                  <Image source={getPlanetImage(planetId ?? 1)} />
                  <Text className="text-white text-base mt-2 font-orbitron-semibold">
                    {planet.description}
                  </Text>
                </View>
              )
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}
