import React, { useEffect, useState } from "react";
import { View, Text, Modal, TouchableOpacity, ActivityIndicator, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getAuth } from "firebase/auth";
import {
  getFirestore,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  getDoc,
  getDocs,
  setDoc,
  increment,
  where,
  query,
} from "firebase/firestore";

// TODO: move this to the DB eventually
const PLANET_IMAGES: { [key: number]: any } = {
    1: require("../../assets/images/sprites/planets/1.png"),
    2: require("../../assets/images/sprites/planets/2.png"),
    3: require("../../assets/images/sprites/planets/3.png"),
    4: require("../../assets/images/sprites/planets/4.png"),
    5: require("../../assets/images/sprites/planets/5.png"),
    6: require("../../assets/images/sprites/planets/6.png"),
    7: require("../../assets/images/sprites/planets/7.png"),
    8: require("../../assets/images/sprites/planets/8.png"),
    9: require("../../assets/images/sprites/planets/9.png"),
};

interface PlanetModalProps {
	visible: boolean;
	onClose: () => void;
	planetId?: number;
	isLocked?: boolean;
    selectedPlanet?: number | null;
    currentProgress?: number;
}

interface PlanetData {
	name?: string;
	description?: string;
	[key: string]: any;
}

export default function PlanetModal({ visible, onClose, planetId, isLocked, selectedPlanet }: PlanetModalProps) {
	const auth = getAuth();
	const db = getFirestore();

	const [planet, setPlanet] = useState<PlanetData | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const getPlanetDocRef = (id: number) => {
		// Planets are stored as top-level documents under `planets/{id}`
		return doc(db, "planets", id.toString());
	};

	const getPlanetImage = (id?: number) => {
		return PLANET_IMAGES[id ?? 1];
	};

	useEffect(() => {
		let mounted = true;
		const loadPlanet = async () => {
			if (!visible) return;
			if (planetId == null) return;
			setLoading(true);
			setError(null);
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
			onRequestClose={onClose}
			testID="planet-modal"
		>
			<View className="flex-1 justify-center items-center bg-black/70">
				<View
					className="w-11/12 max-w-md rounded-3xl p-6"
					style={{
						backgroundColor: "rgba(15, 23, 42, 0.95)",
						borderWidth: 2,
						borderColor: "rgba(139, 92, 246, 0.5)",
					}}
				>
					{/* Header with close button */}
					<View className="flex-row justify-between items-center mb-4">
						<Text
							className="font-orbitron-semibold text-white text-2xl"
							style={{
								textShadowColor: "rgba(139, 92, 246, 0.8)",
								textShadowOffset: { width: 0, height: 0 },
								textShadowRadius: 15,
							}}
						>{isLocked ? "Planet Not Unlocked" : loading ? "Loading..." : planet?.name ?? ""}</Text>

						<TouchableOpacity
							testID="close-planet-modal"
							onPress={onClose}
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

					{/* Option to buy locked planet ?? Planet Image and Description */}
					<View style={{ minHeight: 120 }}>
						{loading && (
							<View className="items-center justify-center">
								<ActivityIndicator size="small" color="#a855f7" />
							</View>
						)}
						{error && (
							<Text className="text-red-400 text-sm mt-2 font-orbitron-semibold">{error}</Text>
						)}
						{isLocked && planet ? (
							<View className="items-center justify-center">
								<Image source={getPlanetImage(planetId ?? 1)} style={{ width: 160, height: 160, tintColor: 'black' }} resizeMode="contain" />
								<Text className="text-white text-base mt-2 font-orbitron-semibold">
									{planet.description}
								</Text>
                            </View>
						) : (
							!loading && !error && planet &&  (
								<View className="items-center justify-center" style={{ gap: 15 }}>
									<Image source={getPlanetImage(planetId ?? 1)} 
									style={{ width: 160, height: 160 }}
									resizeMode="contain" />
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
