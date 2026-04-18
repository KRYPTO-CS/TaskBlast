import React, { useEffect, useState } from "react";
import {
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
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { useTranslation } from "react-i18next";
import MainButton from "./MainButton";
import { unlockPlanet } from "../services/economyService";
import { useActiveProfile } from "../context/ActiveProfileContext";

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

const PLANET_STATS: { [key: number]: { diameter: string; distance: string } } = {
  1: { diameter: "4,879", distance: "57,900,000" },
  2: { diameter: "12,104", distance: "108,200,000" },
  3: { diameter: "12,756", distance: "149,600,000" },
  4: { diameter: "6,792", distance: "227,900,000" },
  5: { diameter: "142,984", distance: "778,600,000" },
  6: { diameter: "120,536", distance: "1,433,500,000" },
  7: { diameter: "51,118", distance: "2,872,500,000" },
  8: { diameter: "49,528", distance: "4,495,100,000" },
  9: { diameter: "2,377", distance: "5,906,400,000" },
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
  multiplier?: number;
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
  const { t } = useTranslation();
  const { childDocId, getProfileDocRef, isLoading: isProfileLoading, profileType } =
    useActiveProfile();

  const [planet, setPlanet] = useState<PlanetData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rocks, setRocks] = useState<number>(0);
  const [confirmUnlock, setConfirmUnlock] = useState(false);
  const [justUnlocked, setJustUnlocked] = useState(false);
  const [newRocksAfterUnlock, setNewRocksAfterUnlock] = useState<number>(0);

  const getPlanetDocRef = (id: number) => {
    return doc(db, "planets", id.toString());
  };

  const getPlanetName = (id?: number): string =>
    t('Planets.planet' + (id ?? 1));

  // bonus uses DB values and calculates percentage
  const getPlanetBonus = (multiplier?: number): string => {
    const m = multiplier ?? 1.0;
    const percent = Math.round((m - 1) * 100);
    return percent <= 0
      ? t('Planets.descriptionBase')
      : t('Planets.descriptionBonus', { percent });
  };

  // get the planet stats from translator
  const getPlanetStats = (id?: number): string => {
    const stats = PLANET_STATS[id ?? 1];
    if (!stats) return '';
    return t('Planets.stats', { diameter: stats.diameter, distance: stats.distance });
  };

  // Check if the user has enough rocks and unlock the planet if so
  const handlePlanetUnlock = async () => {
    const user = auth.currentUser;
    if (!user) {
      console.log("No such user");
      return;
    }
    if (isProfileLoading || (profileType === "child" && !childDocId)) {
      Alert.alert("Profile Loading", "Please wait a moment and try again.");
      return;
    }

    const userDocRef = getProfileDocRef();

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
                    : getPlanetName(planetId)}
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
                <View>
                  <Image source={getPlanetImage(planetId ?? 1)} />
                </View>
                <Text className="text-green-300 text-base font-orbitron-bold text-center">
                  {getPlanetName(planetId)} is now available!
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
                <View
                  style={{
                    marginTop: 8,
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 999,
                    backgroundColor: "rgba(139, 92, 246, 0.25)",
                    borderWidth: 1,
                    borderColor: "rgba(167, 139, 250, 0.5)",
                  }}
                >
                  <Text className="text-purple-300 text-sm font-orbitron-bold text-center">
                    {getPlanetBonus(planet.multiplier)}
                  </Text>
                </View>
                <Text className="text-slate-400 text-xs font-orbitron-semibold text-center mt-2 px-2">
                  {getPlanetStats(planetId)}
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
                      testID="confirm-unlock-button"
                      title="Confirm Unlock"
                      className="py-5"
                      customStyle={{ backgroundColor: "#ffee00" }}
                      onPress={() => handlePlanetUnlock()}
                    />
                  ) : (
                    <MainButton
                      testID="unlock-planet-button"
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
                  <View
                    style={{
                      paddingHorizontal: 16,
                      paddingVertical: 8,
                      borderRadius: 999,
                      backgroundColor: "rgba(139, 92, 246, 0.25)",
                      borderWidth: 1,
                      borderColor: "rgba(167, 139, 250, 0.5)",
                    }}
                  >
                    <Text className="text-purple-300 text-sm font-orbitron-bold text-center">
                      {getPlanetBonus(planet.multiplier)}
                    </Text>
                  </View>
                  <Text className="text-slate-400 text-xs font-orbitron-semibold text-center px-2">
                    {getPlanetStats(planetId)}
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
