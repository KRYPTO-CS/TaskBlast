import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ImageBackground,
  ScrollView,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Text } from "../../TTS";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAdmin } from "../context/AdminContext";
import {
  seedShopCatalog,
  updateShopItemCost,
  updateUserRocks,
} from "../services/adminService";
import { collection, getDocs } from "firebase/firestore";
import { firestore } from "../../server/firebase";
import { useTranslation } from "react-i18next";
import { DEFAULT_SHOP_CATALOG } from "../services/shopCatalog";

type ShopItemOption = {
  id: string;
  label: string;
  defaultCost: number;
};

export default function AdminDashboard() {
  const router = useRouter();
  const { isAdminVerified, adminEmail } = useAdmin();
  const { t } = useTranslation();

  const [userEmail, setUserEmail] = useState("");
  const [rocksDelta, setRocksDelta] = useState("");
  const [shopItemId, setShopItemId] = useState("");
  const [shopCost, setShopCost] = useState("");
  const [shopPickerOpen, setShopPickerOpen] = useState(false);
  const [shopItemOptions, setShopItemOptions] = useState<ShopItemOption[]>(
    DEFAULT_SHOP_CATALOG.map((item) => ({
      id: item.id,
      label: t(item.nameKey),
      defaultCost: item.price,
    })),
  );
  const [submitting, setSubmitting] = useState<"rocks" | "shop" | null>(null);
  const [catalogLoading, setCatalogLoading] = useState(false);

  const starBackground = require("../../assets/backgrounds/starsAnimated.gif");

  useEffect(() => {
    const loadShopItems = async () => {
      setCatalogLoading(true);

      try {
        const snapshot = await getDocs(collection(firestore, "shopItems"));
        const options = snapshot.docs
          .map((docSnap) => {
            const data = docSnap.data() as {
              id?: string;
              nameKey?: string;
              price?: number;
              cost?: number;
              category?: string;
              index?: number;
              active?: boolean;
            };

            if (data.active === false) {
              return null;
            }

            return {
              id: String(data.id || docSnap.id),
              label: t(String(data.nameKey || "Shop.title")),
              defaultCost: Number(
                data.price !== undefined ? data.price : data.cost || 0,
              ),
              category: String(data.category || ""),
              index: Number(data.index ?? 0),
            };
          })
          .filter(
            (
              option,
            ): option is ShopItemOption & { category: string; index: number } =>
              Boolean(option),
          )
          .sort((a, b) => {
            if (a.category !== b.category) {
              return a.category === "Body" ? -1 : 1;
            }
            return a.index - b.index;
          })
          .map(({ id, label, defaultCost }) => ({ id, label, defaultCost }));

        if (options.length > 0) {
          setShopItemOptions(options);
        }
      } catch (error) {
        console.warn("Failed to load shop catalog for admin dashboard", error);
      } finally {
        setCatalogLoading(false);
      }
    };

    loadShopItems();
  }, [t]);

  const guardAdmin = () => {
    if (isAdminVerified) {
      return true;
    }

    Alert.alert(
      "Admin Access Required",
      "Please verify your admin PIN before using admin controls.",
    );
    router.back();
    return false;
  };

  const handleUpdateRocks = async () => {
    if (!guardAdmin()) return;
    const normalizedEmail = userEmail.trim().toLowerCase();
    if (!normalizedEmail || !rocksDelta.trim()) {
      Alert.alert("Missing fields", "User email and rock amount are required.");
      return;
    }

    if (!normalizedEmail.includes("@")) {
      Alert.alert("Invalid email", "Please enter a valid user email.");
      return;
    }

    const parsedAmount = Number(rocksDelta);
    if (!Number.isFinite(parsedAmount)) {
      Alert.alert("Invalid amount", "Rock amount must be numeric.");
      return;
    }

    try {
      setSubmitting("rocks");
      await updateUserRocks({ userEmail: normalizedEmail }, parsedAmount);
      Alert.alert("Success", "User rocks updated.");
      setRocksDelta("");
    } catch (error: any) {
      Alert.alert("Update failed", error?.message || "Could not update rocks.");
    } finally {
      setSubmitting(null);
    }
  };

  const handleUpdateShopCost = async () => {
    if (!guardAdmin()) return;
    if (!shopItemId.trim() || !shopCost.trim()) {
      Alert.alert("Missing fields", "Item ID and cost are required.");
      return;
    }

    const parsedCost = Number(shopCost);
    if (!Number.isFinite(parsedCost) || parsedCost < 0) {
      Alert.alert("Invalid cost", "Cost must be a non-negative number.");
      return;
    }

    try {
      setSubmitting("shop");
      await updateShopItemCost(shopItemId.trim(), parsedCost);
      Alert.alert("Success", "Shop item cost updated.");
      setShopCost("");
    } catch (error: any) {
      Alert.alert(
        "Update failed",
        error?.message || "Could not update shop item cost.",
      );
    } finally {
      setSubmitting(null);
    }
  };

  const handleSeedShopCatalog = async () => {
    if (!guardAdmin()) return;

    try {
      setSubmitting("shop");
      const result = await seedShopCatalog(false);
      Alert.alert(
        "Catalog Seeded",
        `Created: ${result.createdCount || 0}, Updated: ${result.updatedCount || 0}`,
      );

      const snapshot = await getDocs(collection(firestore, "shopItems"));
      const options = snapshot.docs
        .map((docSnap) => {
          const data = docSnap.data() as {
            id?: string;
            nameKey?: string;
            price?: number;
            cost?: number;
            category?: string;
            index?: number;
            active?: boolean;
          };

          if (data.active === false) {
            return null;
          }

          return {
            id: String(data.id || docSnap.id),
            label: t(String(data.nameKey || "Shop.title")),
            defaultCost: Number(
              data.price !== undefined ? data.price : data.cost || 0,
            ),
            category: String(data.category || ""),
            index: Number(data.index ?? 0),
          };
        })
        .filter(
          (
            option,
          ): option is ShopItemOption & { category: string; index: number } =>
            Boolean(option),
        )
        .sort((a, b) => {
          if (a.category !== b.category) {
            return a.category === "Body" ? -1 : 1;
          }
          return a.index - b.index;
        })
        .map(({ id, label, defaultCost }) => ({ id, label, defaultCost }));

      if (options.length > 0) {
        setShopItemOptions(options);
      }
    } catch (error: any) {
      Alert.alert(
        "Seed failed",
        error?.message || "Could not seed shop catalog.",
      );
    } finally {
      setSubmitting(null);
    }
  };

  const selectedShopItem = shopItemOptions.find(
    (item) => item.id === shopItemId,
  );

  return (
    <View className="flex-1">
      <ImageBackground
        source={starBackground}
        className="absolute inset-0 w-full h-full"
        resizeMode="cover"
      />

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 20 }}>
        <View className="mt-12 mb-4 flex-row items-center justify-between">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-11 h-11 rounded-full bg-white/20 items-center justify-center"
          >
            <Ionicons name="arrow-back" size={22} color="white" />
          </TouchableOpacity>
          <Text className="font-orbitron-bold text-white text-xl">
            Admin Dashboard
          </Text>
          <View className="w-11 h-11" />
        </View>

        <View className="bg-black/60 rounded-2xl p-4 mb-4 border border-white/15">
          <Text className="font-orbitron text-white/80 text-xs">
            Signed in as
          </Text>
          <Text className="font-orbitron-semibold text-white mt-1">
            {adminEmail || "Unverified Admin"}
          </Text>
        </View>

        <View className="bg-black/60 rounded-2xl p-4 mb-4 border border-white/15">
          <Text className="font-orbitron-bold text-white text-lg mb-3">
            Adjust User Rocks
          </Text>
          <TextInput
            value={userEmail}
            onChangeText={setUserEmail}
            placeholder="User email"
            placeholderTextColor="rgba(255,255,255,0.4)"
            className="bg-white/10 text-white rounded-xl p-3 mb-3"
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TextInput
            value={rocksDelta}
            onChangeText={setRocksDelta}
            placeholder="Amount (+/-)"
            placeholderTextColor="rgba(255,255,255,0.4)"
            className="bg-white/10 text-white rounded-xl p-3 mb-3"
            keyboardType="numeric"
          />
          <TouchableOpacity
            onPress={handleUpdateRocks}
            disabled={submitting !== null}
            className="bg-blue-600 rounded-xl p-3"
          >
            {submitting === "rocks" ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="font-orbitron-semibold text-white text-center">
                Update Rocks
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <View className="bg-black/60 rounded-2xl p-4 mb-4 border border-white/15">
          <Text className="font-orbitron-bold text-white text-lg mb-3">
            Edit Shop Item Cost
          </Text>
          <TouchableOpacity
            onPress={handleSeedShopCatalog}
            disabled={submitting !== null}
            className="bg-emerald-600 rounded-xl p-3 mb-3"
          >
            <Text className="font-orbitron-semibold text-white text-center">
              Seed Default Shop Catalog
            </Text>
          </TouchableOpacity>

          {catalogLoading && (
            <Text className="font-orbitron text-white/70 text-xs mb-2">
              Loading shop catalog...
            </Text>
          )}

          <TouchableOpacity
            onPress={() => setShopPickerOpen((open) => !open)}
            className="bg-white/10 rounded-xl p-3 mb-2 flex-row items-center justify-between"
          >
            <Text className="font-orbitron text-white">
              {selectedShopItem
                ? `${selectedShopItem.label} (${selectedShopItem.id})`
                : "Select shop item"}
            </Text>
            <Ionicons
              name={shopPickerOpen ? "chevron-up" : "chevron-down"}
              size={18}
              color="white"
            />
          </TouchableOpacity>

          {shopPickerOpen && (
            <View className="rounded-xl overflow-hidden border border-white/15 mb-3 bg-black/40">
              {shopItemOptions.map((item, index) => {
                const isSelected = item.id === shopItemId;
                return (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => {
                      setShopItemId(item.id);
                      setShopPickerOpen(false);
                      if (!shopCost.trim()) {
                        setShopCost(String(item.defaultCost));
                      }
                    }}
                    className="px-3 py-3"
                    style={{
                      backgroundColor: isSelected
                        ? "rgba(34, 211, 238, 0.25)"
                        : "transparent",
                      borderTopWidth: index === 0 ? 0 : 1,
                      borderTopColor: "rgba(255,255,255,0.1)",
                    }}
                  >
                    <Text className="font-orbitron text-white text-sm">
                      {item.label} ({item.id}) - default {item.defaultCost}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          <TextInput
            value={shopCost}
            onChangeText={setShopCost}
            placeholder="New cost"
            placeholderTextColor="rgba(255,255,255,0.4)"
            className="bg-white/10 text-white rounded-xl p-3 mb-3"
            keyboardType="numeric"
          />
          <TouchableOpacity
            onPress={handleUpdateShopCost}
            disabled={submitting !== null || !shopItemId.trim()}
            className="bg-cyan-600 rounded-xl p-3"
          >
            {submitting === "shop" ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="font-orbitron-semibold text-white text-center">
                Save Shop Cost
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
