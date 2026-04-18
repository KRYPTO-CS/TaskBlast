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
  updateDoc,
  getDoc,
  getDocs,
} from "firebase/firestore";
import { useColorPalette } from "../styles/colorBlindThemes";
import { useTranslation } from "react-i18next";
import { purchaseShopItem, purchaseShopItemWithCrystals } from "../services/economyService";
import {
  DEFAULT_SHOP_CATALOG,
  getShopIconSource,
  ShopCategory,
} from "../services/shopCatalog";
import { useActiveProfile } from "../context/ActiveProfileContext";

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
  crystalPrice?: number;
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
  {
    id: 2,
    name: "Topper",
    nameKey: "Shop.toppers",
    iconPath: require("../../assets/images/shop_icons/ShipTopperIconDefault.png"),
  },
];

const fallbackShopItems: ShopItem[] = DEFAULT_SHOP_CATALOG.map((item) => ({
  id: item.id,
  index: item.index,
  nameKey: item.nameKey,
  iconPath: getShopIconSource(item.iconKey),
  price: item.price,
  crystalPrice: item.crystalPrice,
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
  const [galaxyCrystals, setGalaxyCrystals] = useState<number>(0);
  const [shopItems, setShopItems] = useState<ShopItem[]>(fallbackShopItems);
  const [unlockedItems, setUnlockedItems] = useState<{
    body: boolean[];
    wings: boolean[];
    toppers: boolean[];
  }>({
    body: [true, false, false, false],
    wings: [false, true, false, false],
    toppers: [true, false],
  });
  const [unlockedPlanets, setUnlockedPlanets] = useState<boolean[]>([
    true, false, false, false, false, false, false, false, false,
  ]);
  const [equipped, setEquipped] = useState<number[]>([0, 1, 0]);
  const [confirmPurchase, setConfirmPurchase] = useState<{
    item: ShopItem | null;
  }>({ item: null });
  const {
    childDocId,
    getProfileDocRef,
    isLoading: isProfileLoading,
    profileType,
  } = useActiveProfile();

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
        if (!user) {
          console.log("[ShopModal] No user found");
          return;
        }

        console.log("[ShopModal] Loading shop data for user:", user.uid);
        const db = getFirestore();

        const shopSnapshot = await getDocs(collection(db, "shopItems"));
        console.log("[ShopModal] Fetched", shopSnapshot.docs.length, "shop items from database");
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
              crystalPrice?: number;
              active?: boolean;
            };

            const category =
              data.category === "Body" || data.category === "Wings" || data.category === "Topper"
                ? (data.category as ShopCategory)
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

            const crystalPrice =
              data.crystalPrice !== undefined && Number.isFinite(Number(data.crystalPrice))
                ? Number(data.crystalPrice)
                : undefined;

            return {
              id: String(data.id || docSnap.id),
              index,
              category,
              nameKey: String(data.nameKey || "Shop.bBody"),
              iconPath: getShopIconSource(
                String(data.iconKey || "ship-body-blue"),
              ),
              price,
              crystalPrice,
            } as ShopItem;
          })
          .filter((item): item is ShopItem => Boolean(item))
          .sort((a, b) => {
            const order: Record<ShopCategory, number> = { Body: 0, Wings: 1, Topper: 2 };
            if (a.category !== b.category) {
              return order[a.category] - order[b.category];
            }
            return a.index - b.index;
          });

        if (catalogFromDb.length > 0) {
          setShopItems(catalogFromDb);
          console.log("[ShopModal] Loaded", catalogFromDb.length, "shop items from database");
        } else {
          setShopItems(fallbackShopItems);
          console.log("[ShopModal] No shop items in database, using fallback catalog");
        }

        if (isProfileLoading) {
          return;
        }

        const userDocRef = getProfileDocRef();
        const userDoc = await getDoc(userDocRef);
        const userData = userDoc.exists() ? userDoc.data() : {};

        if (userData) {
          // Load rocks balance
          const rocksValue = userData.rocks || 0;
          const finalRocks = isNaN(rocksValue) ? 0 : Math.max(0, Math.floor(rocksValue));
          setRocks(finalRocks);
          console.log("[ShopModal] Loaded user rocks balance:", finalRocks);

          // Load galaxy crystals balance
          const gcValue = Number(userData.galaxyCrystals || 0);
          setGalaxyCrystals(isNaN(gcValue) ? 0 : Math.max(0, Math.floor(gcValue)));

          let needsUpdate = false;
          const updates: any = {};

          // Check if rocks field exists, if not create it
          if (userData.rocks === undefined) {
            updates.rocks = 0;
            needsUpdate = true;
            console.log("[ShopModal] Database update needed: Creating rocks field");
          }

          // Check if shopItems exist, if not create them
          const defaultShopItems = {
            body: [true, false, false, false],
            wings: [false, true, false, false],
            toppers: [true, false],
          };
          if (!userData.shopItems) {
            updates.shopItems = defaultShopItems;
            setUnlockedItems(defaultShopItems);
            needsUpdate = true;
            console.log("[ShopModal] Database update needed: Creating shopItems");
          } else {
            setUnlockedItems(userData.shopItems);
            console.log("[ShopModal] Loaded user shopItems");
          }

          // Check if unlockedPlanets exist, if not create them
          if (!userData.unlockedPlanets) {
            updates.unlockedPlanets = [
              true, false, false, false, false, false, false, false, false,
            ];
            setUnlockedPlanets(updates.unlockedPlanets);
            needsUpdate = true;
            console.log("[ShopModal] Database update needed: Creating unlockedPlanets");
          } else {
            setUnlockedPlanets(userData.unlockedPlanets);
            console.log("[ShopModal] Loaded user unlockedPlanets");
            // Merge to ensure newly-added categories (e.g. toppers) are always present
            const merged = {
              ...defaultShopItems,
              ...(userData.shopItems || {}),
            };
            if (!userData.shopItems?.toppers) {
              updates.shopItems = merged;
              needsUpdate = true;
            }
            setUnlockedItems(merged);
          }

          // Check if equipped array exists, if not create it
          const defaultEquipped = [0, 1, 0];
          if (!userData.equipped) {
            updates.equipped = defaultEquipped;
            setEquipped(defaultEquipped);
            needsUpdate = true;
            console.log("[ShopModal] Database update needed: Creating equipped array");
          } else {
            setEquipped(userData.equipped);
            console.log("[ShopModal] Loaded user equipped array:", userData.equipped);
            // Ensure the equipped array has a slot for every category
            const equippedPadded = [
              userData.equipped[0] ?? 0,
              userData.equipped[1] ?? 1,
              userData.equipped[2] ?? 0,
            ];
            if (userData.equipped.length < 3) {
              updates.equipped = equippedPadded;
              needsUpdate = true;
            }
            setEquipped(equippedPadded);
          }

          // Update Firebase if needed
          if (needsUpdate) {
            console.log("[ShopModal] Applying database updates:", Object.keys(updates));
            await updateDoc(userDocRef, updates);
            console.log("[ShopModal] Database updates completed successfully");
          } else {
            console.log("[ShopModal] No database updates needed");
          }
        }
      } catch (error) {
        console.error("Error checking/creating shopItems:", error);
      }
    };

    checkAndCreateShopItems();
  }, [visible, getProfileDocRef, isProfileLoading]);

  const handleEquip = async (item: ShopItem) => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) return;
      if (isProfileLoading || (profileType === "child" && !childDocId)) {
        Alert.alert("Profile Loading", "Please wait a moment and try again.");
        return;
      }

      const userDocRef = getProfileDocRef();

      const categoryIndex = item.category === "Body" ? 0 : item.category === "Wings" ? 1 : 2;
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
    const categoryKey = (item.category === "Topper" ? "toppers" : item.category.toLowerCase()) as "body" | "wings" | "toppers";
    const isUnlocked = unlockedItems[categoryKey][item.index];

    if (isUnlocked) {
      // Already owned, equip it
      await handleEquip(item);
      return;
    }

    if (item.crystalPrice !== undefined) {
      if (galaxyCrystals < item.crystalPrice) {
        Alert.alert(
          t("Shop.notEnoughCrystalsTitle"),
          t("Shop.notEnoughCrystalsText", {
            price: item.crystalPrice,
            rocks: galaxyCrystals,
          }),
        );
        return;
      }
    } else if (rocks < item.price) {
      Alert.alert(
        t("Shop.notEnoughCrystalsTitle"),
        t("Shop.notEnoughCrystalsText", {
          price: item.price,
          rocks,
        }),
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
      if (isProfileLoading || (profileType === "child" && !childDocId)) {
        Alert.alert("Profile Loading", "Please wait a moment and try again.");
        return;
      }

      let newUnlockedItems: typeof unlockedItems;
      let newUnlockedPlanets: boolean[];

      if (item.crystalPrice !== undefined) {
        const purchaseResult = await purchaseShopItemWithCrystals({ itemId: item.id, childDocId });

        if (!purchaseResult.success) {
          throw new Error(purchaseResult.message || "Purchase failed");
        }

        newUnlockedItems = purchaseResult.shopItems || { ...unlockedItems };
        newUnlockedPlanets = [...unlockedPlanets];
        const newGCAmount =
          typeof purchaseResult.newGalaxyCrystals === "number"
            ? purchaseResult.newGalaxyCrystals
            : Math.max(0, galaxyCrystals - item.crystalPrice);

        console.log("[ShopModal] Crystal purchase confirmed for item:", item.id, "Crystal price:", item.crystalPrice);
        setGalaxyCrystals(newGCAmount);
      } else {
        const purchaseResult = await purchaseShopItem({ itemId: item.id, childDocId });

        if (!purchaseResult.success) {
          throw new Error(purchaseResult.message || "Purchase failed");
        }

        newUnlockedItems = purchaseResult.shopItems || { ...unlockedItems };
        newUnlockedPlanets = purchaseResult.unlockedPlanets || [...unlockedPlanets];
        const newRocksAmount =
          typeof purchaseResult.newRocks === "number"
            ? purchaseResult.newRocks
            : Math.max(0, rocks - item.price);

        console.log("[ShopModal] Purchase confirmed for item:", item.id, "Price:", item.price);
        console.log("[ShopModal] Rocks before:", rocks, "Rocks after:", newRocksAmount);
        setRocks(newRocksAmount);
      }

      // Update local state
      setUnlockedItems(newUnlockedItems);
      setUnlockedPlanets(newUnlockedPlanets);

      try {
        const refreshedSnap = await getDoc(getProfileDocRef());
        if (refreshedSnap.exists()) {
          const refreshedData = refreshedSnap.data();
          const refreshedRocks = Number(refreshedData.rocks || 0);
          setRocks(
            Number.isFinite(refreshedRocks)
              ? Math.max(0, Math.floor(refreshedRocks))
              : rocks,
          );
          const refreshedGC = Number(refreshedData.galaxyCrystals || 0);
          setGalaxyCrystals(
            Number.isFinite(refreshedGC) ? Math.max(0, Math.floor(refreshedGC)) : galaxyCrystals,
          );
          if (refreshedData.shopItems) {
            setUnlockedItems(refreshedData.shopItems);
          }
        }
      } catch (refreshError) {
        console.error("[ShopModal] Error refreshing profile after purchase:", refreshError);
      }

      // Notify parent component to refresh rocks
      if (onRocksChange) {
        onRocksChange();
        console.log("[ShopModal] Notified parent component of rocks change");
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
                const categoryKey = (currentCategory === "Topper" ? "toppers" : currentCategory.toLowerCase()) as
                  | "body"
                  | "wings"
                  | "toppers";
                const isUnlocked = unlockedItems[categoryKey][item.index];
                const categoryIndex = item.category === "Body" ? 0 : item.category === "Wings" ? 1 : 2;
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
                    ) : item.crystalPrice !== undefined ? (
                      <View
                        className="flex-row items-center px-3 py-1.5 rounded-full"
                        style={{
                          backgroundColor: "#1a2a4a",
                          borderWidth: 1,
                          borderColor: "#4a90e2",
                        }}
                      >
                        <Image
                          source={require("../../assets/images/sprites/galaxyCrystal.png")}
                          style={{ width: 16, height: 16 }}
                          resizeMode="contain"
                        />
                        <Text className="font-orbitron-bold text-white text-sm ml-1">
                          {item.crystalPrice}
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
              {t("Shop.confirmPurchaseTitle")}
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

              {confirmPurchase.item.crystalPrice !== undefined ? (
                <View
                  className="flex-row items-center px-4 py-2 rounded-full"
                  style={{
                    backgroundColor: "#1a2a4a",
                    borderWidth: 1,
                    borderColor: "#4a90e2",
                  }}
                >
                  <Image
                    source={require("../../assets/images/sprites/galaxyCrystal.png")}
                    style={{ width: 20, height: 20 }}
                    resizeMode="contain"
                  />
                  <Text className="font-orbitron-bold text-white text-base ml-2">
                    {confirmPurchase.item.crystalPrice}
                  </Text>
                </View>
              ) : (
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
              )}
            </View>

            <Text className="font-orbitron text-white/80 text-sm mb-6 text-center">
              {confirmPurchase.item.crystalPrice !== undefined
                ? t("Shop.confirmPurchaseCrystalText", { price: confirmPurchase.item.crystalPrice })
                : t("Shop.confirmPurchaseText", { price: confirmPurchase.item.price })}
            </Text>

            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => setConfirmPurchase({ item: null })}
                className="flex-1 bg-gray-600 py-3 rounded-xl"
              >
                <Text className="font-orbitron-bold text-white text-center">
                  {t("Shop.cancel")}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={confirmPurchaseItem}
                className="flex-1 py-3 rounded-xl"
                style={{ backgroundColor: palette.accent }}
              >
                <Text className="font-orbitron-bold text-white text-center">
                  {t("Shop.purchase")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </Modal>
  );
}
