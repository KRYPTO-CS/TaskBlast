import React, { useState, useEffect } from "react";
import {
  View,
  Modal,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
} from "react-native";
import { Text } from "../../TTS";
import { Ionicons } from "@expo/vector-icons";
import { getAuth } from "firebase/auth";
import {
  collection,
  getFirestore,
  doc,
  updateDoc,
  getDoc,
  getDocs,
} from "firebase/firestore";
import { useColorPalette } from "../styles/colorBlindThemes";
import { useTranslation } from "react-i18next";
import { purchaseShopItem } from "../services/economyService";
import {
  DEFAULT_SHOP_CATALOG,
  getShopIconSource,
  ShopCategory,
} from "../services/shopCatalog";

interface ShopModalProps {
  visible: boolean;
  onClose: () => void;
  onRocksChange?: () => void;
}

type ShopPage = {
  id: number;
  name: string;
  nameKey: string;
  iconPath: any;
};

type ShopItem = {
  id: string;
  index: number;
  nameKey: string;
  iconPath: any;
  price: number;
  category: ShopCategory;
};

const shopPages: ShopPage[] = [
  {
    id: 0,
    name: "Body",
    nameKey: "Shop.body",
    iconPath: require("../../assets/images/shop_icons/ShipBodyIconBlue.png"),
  },
  {
    id: 1,
    name: "Wings",
    nameKey: "Shop.wings",
    iconPath: require("../../assets/images/shop_icons/ShipWingIconRed.png"),
  },
];

const fallbackShopItems: ShopItem[] = DEFAULT_SHOP_CATALOG.map((item) => ({
  id: item.id,
  index: item.index,
  nameKey: item.nameKey,
  iconPath: getShopIconSource(item.iconKey),
  price: item.price,
  category: item.category,
}));

export default function ShopModal({
  visible,
  onClose,
  onRocksChange,
}: ShopModalProps) {
  const palette = useColorPalette();
  const [selectedPage, setSelectedPage] = useState(0);
  const [rocks, setRocks] = useState<number>(0);
  const [shopItems, setShopItems] = useState<ShopItem[]>(fallbackShopItems);
  const [unlockedItems, setUnlockedItems] = useState<{
    body: boolean[];
    wings: boolean[];
  }>({
    body: [true, false, false, false],
    wings: [false, true, false, false],
  });
  const [equipped, setEquipped] = useState<number[]>([0, 1]);
  const [confirmPurchase, setConfirmPurchase] = useState<{
    item: ShopItem | null;
  }>({ item: null });

  const currentCategory = shopPages[selectedPage].name as ShopCategory;
  const filteredItems = shopItems.filter(
    (item) => item.category === currentCategory,
  );
  const { t } = useTranslation();

  useEffect(() => {
    const checkAndCreateShopItems = async () => {
      if (!visible) return;

      try {
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) return;

        const db = getFirestore();

        const shopSnapshot = await getDocs(collection(db, "shopItems"));
        const catalogFromDb = shopSnapshot.docs
          .map((docSnap) => {
            const data = docSnap.data() as {
              id?: string;
              category?: string;
              index?: number;
              nameKey?: string;
              iconKey?: string;
              price?: number;
              cost?: number;
              active?: boolean;
            };

            const category =
              data.category === "Body" || data.category === "Wings"
                ? data.category
                : null;
            const index = Number(data.index);
            const price = Number(
              data.price !== undefined ? data.price : data.cost,
            );

            if (
              !category ||
              !Number.isFinite(index) ||
              !Number.isFinite(price)
            ) {
              return null;
            }

            if (data.active === false) {
              return null;
            }

            return {
              id: String(data.id || docSnap.id),
              index,
              category,
              nameKey: String(data.nameKey || "Shop.bBody"),
              iconPath: getShopIconSource(
                String(data.iconKey || "ship-body-blue"),
              ),
              price,
            } as ShopItem;
          })
          .filter((item): item is ShopItem => Boolean(item))
          .sort((a, b) => {
            if (a.category !== b.category) {
              return a.category === "Body" ? -1 : 1;
            }
            return a.index - b.index;
          });

        if (catalogFromDb.length > 0) {
          setShopItems(catalogFromDb);
        } else {
          setShopItems(fallbackShopItems);
        }

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
              body: [true, false, false, false],
              wings: [false, true, false, false],
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

  const handleEquip = async (item: ShopItem) => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) return;

      const db = getFirestore();
      const userDocRef = doc(db, "users", user.uid);

      const categoryIndex = item.category === "Body" ? 0 : 1;
      const newEquipped = [...equipped];
      newEquipped[categoryIndex] = item.index;

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

  const handlePurchase = async (item: ShopItem) => {
    const categoryKey = item.category.toLowerCase() as "body" | "wings";
    const isUnlocked = unlockedItems[categoryKey][item.index];

    if (isUnlocked) {
      // Already owned, equip it
      await handleEquip(item);
      return;
    }

    if (rocks < item.price) {
      Alert.alert(
        "Not Enough Crystals",
        `You need ${item.price} crystals but only have ${rocks}.`,
      );
      return;
    }

    // Show confirmation modal
    setConfirmPurchase({ item });
  };

  const confirmPurchaseItem = async () => {
    const { item } = confirmPurchase;
    if (!item) return;

    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) return;

      const purchaseResult = await purchaseShopItem({ itemId: item.id });

      if (!purchaseResult.success) {
        throw new Error(purchaseResult.message || "Purchase failed");
      }

      const newUnlockedItems = purchaseResult.shopItems || { ...unlockedItems };

      // Update local state
      setUnlockedItems(newUnlockedItems);
      setRocks(
        typeof purchaseResult.newRocks === "number"
          ? purchaseResult.newRocks
          : Math.max(0, rocks - item.price),
      );

      // Notify parent component to refresh rocks
      if (onRocksChange) {
        onRocksChange();
      }

      // Close confirmation modal
      setConfirmPurchase({ item: null });
    } catch (error) {
      console.error("Error purchasing item:", error);
      Alert.alert(
        "Purchase Failed",
        "There was an error processing your purchase.",
      );
      setConfirmPurchase({ item: null });
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
        <View
          className="bg-[#1a1f3a] w-11/12 h-4/5 rounded-3xl shadow-2xl"
          style={{ borderWidth: 2, borderColor: palette.modalBorder }}
        >
          {/* Header */}
          <View
            className="p-5 border-b-2"
            style={{ borderColor: palette.divider }}
          >
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-white font-orbitron-bold text-2xl">
                {t("Shop.title")}
              </Text>
              <TouchableOpacity
                onPress={onClose}
                className="rounded-full p-2"
                style={{ backgroundColor: palette.accent }}
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
                  className="px-4 py-3 rounded-xl flex-row items-center gap-2"
                  style={{
                    backgroundColor:
                      selectedPage === page.id
                        ? palette.accent
                        : palette.secondarySoft,
                    borderWidth: 1,
                    borderColor:
                      selectedPage === page.id
                        ? palette.accentActiveBorder
                        : palette.secondarySoftBorder,
                  }}
                >
                  <Image
                    source={page.iconPath}
                    style={{ width: 20, height: 20 }}
                    resizeMode="contain"
                  />
                  <Text
                    className="font-orbitron"
                    style={{
                      color:
                        selectedPage === page.id
                          ? "white"
                          : palette.sectionTextColor,
                    }}
                  >
                    {t(page.nameKey)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Content */}
          <ScrollView className="flex-1 p-5">
            <View className="flex-row flex-wrap justify-between">
              {filteredItems.map((item) => {
                const categoryKey = currentCategory.toLowerCase() as
                  | "body"
                  | "wings";
                const isUnlocked = unlockedItems[categoryKey][item.index];
                const categoryIndex = item.category === "Body" ? 0 : 1;
                const isEquipped = equipped[categoryIndex] === item.index;

                return (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => handlePurchase(item)}
                    className="w-[48%] rounded-2xl p-4 mb-4 items-center"
                    style={{
                      borderWidth: 2,
                      backgroundColor: isEquipped
                        ? palette.tertiarySoft
                        : isUnlocked
                          ? palette.rowBgPrimary
                          : palette.secondarySoft,
                      borderColor: isEquipped
                        ? palette.tertiarySoftBorder
                        : isUnlocked
                          ? palette.rowBorderPrimary
                          : palette.secondarySoftBorder,
                    }}
                  >
                    {/* Name */}
                    <Text className="font-orbitron text-white text-sm mb-3 text-center">
                      {t(item.nameKey)}
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
                      <View
                        className="px-3 py-1.5 rounded-full"
                        style={{ backgroundColor: palette.tertiary + "80" }}
                      >
                        <Text className="font-orbitron-bold text-white text-sm">
                          {t("Shop.equipped")}
                        </Text>
                      </View>
                    ) : isUnlocked ? (
                      <View
                        className="px-3 py-1.5 rounded-full"
                        style={{ backgroundColor: palette.secondary + "80" }}
                      >
                        <Text className="font-orbitron-bold text-white text-sm">
                          {t("Shop.owned")}
                        </Text>
                      </View>
                    ) : (
                      <View
                        className="flex-row items-center px-3 py-1.5 rounded-full"
                        style={{
                          backgroundColor: palette.accentSoft,
                          borderWidth: 1,
                          borderColor: palette.accentSoftBorder,
                        }}
                      >
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
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "rgba(0, 0, 0, 0.7)",
          }}
        >
          <View
            className="bg-[#1a1f3a] w-4/5 rounded-3xl p-6"
            style={{ borderWidth: 2, borderColor: palette.modalBorder }}
          >
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
                {t(confirmPurchase.item.nameKey)}
              </Text>

              <View
                className="flex-row items-center px-4 py-2 rounded-full"
                style={{
                  backgroundColor: palette.accentSoft,
                  borderWidth: 1,
                  borderColor: palette.accentSoftBorder,
                }}
              >
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
                onPress={() => setConfirmPurchase({ item: null })}
                className="flex-1 bg-gray-600 py-3 rounded-xl"
              >
                <Text className="font-orbitron-bold text-white text-center">
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={confirmPurchaseItem}
                className="flex-1 py-3 rounded-xl"
                style={{ backgroundColor: palette.accent }}
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
