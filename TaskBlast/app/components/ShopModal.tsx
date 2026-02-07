import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, getDoc, updateDoc, increment } from "firebase/firestore";

interface ShopModalProps {
  visible: boolean;
  onClose: () => void;
  onRocksChange?: () => void;
}

type ShopPage = {
  id: number;
  name: string;
  iconPath: any;
};

type ShopItem = {
  id: string;
  name: string;
  iconPath: any;
  price: number;
  category: "Body" | "Wings";
};

const shopPages: ShopPage[] = [
  { id: 0, name: "Body", iconPath: require("../../assets/images/shop_icons/ShipBodyIconBlue.png") },
  { id: 1, name: "Wings", iconPath: require("../../assets/images/shop_icons/ShipWingIconRed.png") },
];

const shopItems: ShopItem[] = [
  { id: "body-0", name: "Blue Body", iconPath: require("../../assets/images/shop_icons/ShipBodyIconBlue.png"), price: 500, category: "Body" },
  { id: "body-1", name: "Red Body", iconPath: require("../../assets/images/shop_icons/ShipBodyIconRed.png"), price: 500, category: "Body" },
  { id: "body-2", name: "Green Body", iconPath: require("../../assets/images/shop_icons/ShipBodyIconGreen.png"), price: 500, category: "Body" },
  { id: "wing-0", name: "Blue Wings", iconPath: require("../../assets/images/shop_icons/ShipWingIconBlue.png"), price: 500, category: "Wings" },
  { id: "wing-1", name: "Red Wings", iconPath: require("../../assets/images/shop_icons/ShipWingIconRed.png"), price: 500, category: "Wings" },
  { id: "wing-2", name: "Green Wings", iconPath: require("../../assets/images/shop_icons/ShipWingIconGreen.png"), price: 500, category: "Wings" },
];

export default function ShopModal({ visible, onClose, onRocksChange }: ShopModalProps) {
  const [selectedPage, setSelectedPage] = useState(0);
  const [rocks, setRocks] = useState<number>(0);
  const [unlockedItems, setUnlockedItems] = useState<{
    body: boolean[];
    wings: boolean[];
  }>({
    body: [true, false, false],
    wings: [false, true, false],
  });
  const [equipped, setEquipped] = useState<number[]>([0, 1]);
  const [confirmPurchase, setConfirmPurchase] = useState<{
    item: ShopItem | null;
    index: number;
  }>({ item: null, index: -1 });

  const currentCategory = shopPages[selectedPage].name as "Body" | "Wings";
  const filteredItems = shopItems.filter(item => item.category === currentCategory);

  useEffect(() => {
    const checkAndCreateShopItems = async () => {
      if (!visible) return;

      try {
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) return;

        const db = getFirestore();
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const userData = userDoc.data();
          
          // Load rocks balance
          const rocksValue = userData.rocks || 0;
          setRocks(isNaN(rocksValue) ? 0 : Math.max(0, Math.floor(rocksValue)));
          
          let needsUpdate = false;
          const updates: any = {};
          
          // Check if shopItems exist, if not create them
          if (!userData.shopItems) {
            updates.shopItems = {
              body: [true, false, false],
              wings: [false, true, false],
            };
            setUnlockedItems(updates.shopItems);
            needsUpdate = true;
            console.log("Created shopItems for user");
          } else {
            setUnlockedItems(userData.shopItems);
          }
          
          // Check if equipped array exists, if not create it
          if (!userData.equipped) {
            updates.equipped = [0, 1];
            setEquipped([0, 1]);
            needsUpdate = true;
            console.log("Created equipped array for user");
          } else {
            setEquipped(userData.equipped);
          }
          
          // Update Firebase if needed
          if (needsUpdate) {
            await updateDoc(userDocRef, updates);
          }
        }
      } catch (error) {
        console.error("Error checking/creating shopItems:", error);
      }
    };

    checkAndCreateShopItems();
  }, [visible]);

  const handleEquip = async (item: ShopItem, index: number) => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) return;

      const db = getFirestore();
      const userDocRef = doc(db, "users", user.uid);

      const categoryIndex = item.category === "Body" ? 0 : 1;
      const newEquipped = [...equipped];
      newEquipped[categoryIndex] = index;

      // Update Firebase
      await updateDoc(userDocRef, {
        equipped: newEquipped,
      });

      // Update local state
      setEquipped(newEquipped);
    } catch (error) {
      console.error("Error equipping item:", error);
    }
  };

  const handlePurchase = async (item: ShopItem, index: number) => {
    const categoryKey = item.category.toLowerCase() as "body" | "wings";
    const isUnlocked = unlockedItems[categoryKey][index];

    if (isUnlocked) {
      // Already owned, equip it
      await handleEquip(item, index);
      return;
    }

    if (rocks < item.price) {
      Alert.alert("Not Enough Crystals", `You need ${item.price} crystals but only have ${rocks}.`);
      return;
    }

    // Show confirmation modal
    setConfirmPurchase({ item, index });
  };

  const confirmPurchaseItem = async () => {
    const { item, index } = confirmPurchase;
    if (!item) return;

    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) return;

      const db = getFirestore();
      const userDocRef = doc(db, "users", user.uid);

      const categoryKey = item.category.toLowerCase() as "body" | "wings";

      // Create updated shopItems
      const newUnlockedItems = { ...unlockedItems };
      newUnlockedItems[categoryKey] = [...newUnlockedItems[categoryKey]];
      newUnlockedItems[categoryKey][index] = true;

      // Update Firebase
      await updateDoc(userDocRef, {
        shopItems: newUnlockedItems,
        rocks: increment(-item.price),
      });

      // Update local state
      setUnlockedItems(newUnlockedItems);
      setRocks(rocks - item.price);

      // Notify parent component to refresh rocks
      if (onRocksChange) {
        onRocksChange();
      }

      // Close confirmation modal
      setConfirmPurchase({ item: null, index: -1 });
    } catch (error) {
      console.error("Error purchasing item:", error);
      Alert.alert("Purchase Failed", "There was an error processing your purchase.");
      setConfirmPurchase({ item: null, index: -1 });
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-center items-center bg-black/50">
        <View className="bg-[#1a1f3a] w-11/12 h-4/5 rounded-3xl border-2 border-purple-500/30 shadow-2xl">
          {/* Header */}
          <View className="p-5 border-b-2 border-purple-500/30">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-white font-orbitron-bold text-2xl">
                Shop
              </Text>
              <TouchableOpacity
                onPress={onClose}
                className="bg-purple-600 rounded-full p-2"
              >
                <Ionicons name="close" size={24} color="white" />
              </TouchableOpacity>
            </View>

            {/* Page Selector */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="flex-row"
              contentContainerStyle={{ gap: 8 }}
            >
              {shopPages.map((page) => (
                <TouchableOpacity
                  key={page.id}
                  onPress={() => setSelectedPage(page.id)}
                  className={`px-4 py-3 rounded-xl flex-row items-center gap-2 ${
                    selectedPage === page.id
                      ? "bg-purple-600"
                      : "bg-purple-900/50"
                  }`}
                >
                  <Image
                    source={page.iconPath}
                    style={{ width: 20, height: 20 }}
                    resizeMode="contain"
                  />
                  <Text
                    className={`font-orbitron ${
                      selectedPage === page.id
                        ? "text-white"
                        : "text-purple-300"
                    }`}
                  >
                    {page.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Content */}
          <ScrollView className="flex-1 p-5">
            <View className="flex-row flex-wrap justify-between">
              {filteredItems.map((item, index) => {
                const categoryKey = currentCategory.toLowerCase() as "body" | "wings";
                const isUnlocked = unlockedItems[categoryKey][index];
                const categoryIndex = item.category === "Body" ? 0 : 1;
                const isEquipped = equipped[categoryIndex] === index;
                
                return (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => handlePurchase(item, index)}
                    className={`w-[48%] border-2 rounded-2xl p-4 mb-4 items-center ${
                      isEquipped
                        ? "bg-yellow-900/30 border-yellow-500/40"
                        : isUnlocked
                        ? "bg-green-900/30 border-green-500/40"
                        : "bg-purple-900/30 border-purple-500/40"
                    }`}
                  >
                    {/* Name */}
                    <Text className="font-orbitron text-white text-sm mb-3 text-center">
                      {item.name}
                    </Text>
                    
                    {/* Icon */}
                    <Image
                      source={item.iconPath}
                      style={{ width: 60, height: 60 }}
                      resizeMode="contain"
                      className="mb-3"
                    />
                    
                    {/* Price or Owned/Equipped */}
                    {isEquipped ? (
                      <View className="bg-yellow-600/50 px-3 py-1.5 rounded-full">
                        <Text className="font-orbitron-bold text-white text-sm">
                          Equipped
                        </Text>
                      </View>
                    ) : isUnlocked ? (
                      <View className="bg-green-600/50 px-3 py-1.5 rounded-full">
                        <Text className="font-orbitron-bold text-white text-sm">
                          Owned
                        </Text>
                      </View>
                    ) : (
                      <View className="flex-row items-center bg-purple-600/50 px-3 py-1.5 rounded-full">
                        <Image
                          source={require("../../assets/images/sprites/crystal.png")}
                          style={{ width: 16, height: 16 }}
                          resizeMode="contain"
                        />
                        <Text className="font-orbitron-bold text-white text-sm ml-1">
                          {item.price}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </View>
      </View>

      {/* Confirmation Modal */}
      {confirmPurchase.item && (
        <View 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
          }}
        >
          <View className="bg-[#1a1f3a] w-4/5 rounded-3xl p-6 border-2 border-purple-500/40">
            <Text className="font-orbitron-bold text-white text-xl mb-4 text-center">
              Confirm Purchase
            </Text>
            
            <View className="items-center mb-4">
              <Image
                source={confirmPurchase.item.iconPath}
                style={{ width: 80, height: 80 }}
                resizeMode="contain"
                className="mb-3"
              />
              <Text className="font-orbitron text-white text-lg mb-2">
                {confirmPurchase.item.name}
              </Text>
              
              <View className="flex-row items-center bg-purple-600/50 px-4 py-2 rounded-full">
                <Image
                  source={require("../../assets/images/sprites/crystal.png")}
                  style={{ width: 20, height: 20 }}
                  resizeMode="contain"
                />
                <Text className="font-orbitron-bold text-white text-base ml-2">
                  {confirmPurchase.item.price}
                </Text>
              </View>
            </View>

            <Text className="font-orbitron text-white/80 text-sm mb-6 text-center">
              Purchase this item for {confirmPurchase.item.price} crystals?
            </Text>

            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => setConfirmPurchase({ item: null, index: -1 })}
                className="flex-1 bg-gray-600 py-3 rounded-xl"
              >
                <Text className="font-orbitron-bold text-white text-center">
                  Cancel
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={confirmPurchaseItem}
                className="flex-1 bg-purple-600 py-3 rounded-xl"
              >
                <Text className="font-orbitron-bold text-white text-center">
                  Purchase
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </Modal>
  );
}
