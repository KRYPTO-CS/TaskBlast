import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface ShopModalProps {
  visible: boolean;
  onClose: () => void;
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
  { id: "body-1", name: "Blue Body", iconPath: require("../../assets/images/shop_icons/ShipBodyIconBlue.png"), price: 100, category: "Body" },
  { id: "body-2", name: "Red Body", iconPath: require("../../assets/images/shop_icons/ShipBodyIconRed.png"), price: 150, category: "Body" },
  { id: "body-3", name: "Green Body", iconPath: require("../../assets/images/shop_icons/ShipBodyIconGreen.png"), price: 200, category: "Body" },
  { id: "wing-1", name: "Blue Wings", iconPath: require("../../assets/images/shop_icons/ShipWingIconBlue.png"), price: 100, category: "Wings" },
  { id: "wing-2", name: "Red Wings", iconPath: require("../../assets/images/shop_icons/ShipWingIconRed.png"), price: 150, category: "Wings" },
  { id: "wing-3", name: "Green Wings", iconPath: require("../../assets/images/shop_icons/ShipWingIconGreen.png"), price: 200, category: "Wings" },
];

export default function ShopModal({ visible, onClose }: ShopModalProps) {
  const [selectedPage, setSelectedPage] = useState(0);

  const currentCategory = shopPages[selectedPage].name as "Body" | "Wings";
  const filteredItems = shopItems.filter(item => item.category === currentCategory);

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
              {filteredItems.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  className="w-[48%] bg-purple-900/30 border-2 border-purple-500/40 rounded-2xl p-4 mb-4 items-center"
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
                  
                  {/* Price */}
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
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
