import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ImageBackground,
  ScrollView,
  ActivityIndicator,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { signOut } from "firebase/auth";
import { auth } from "../../server/firebase";
import MainButton from "../components/MainButton";
import { WebView } from "react-native-webview";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, getDoc, collection, query, where, getDocs  } from "firebase/firestore";
import EditProfileModal from "../components/EditProfileModal";
import TraitsModal from "../components/TraitsModal";
import { updateProfilePicture } from "../../server/storageUtils";
import { useTranslation } from "react-i18next";
import {
  getUserProfile,
  updateUserProfilePicture,
  type UserProfile,
} from "../../server/userProfileUtils";

export default function ProfileScreen() {
  const router = useRouter();
  const starBackground = require("../../assets/backgrounds/starsAnimated.gif");

  const [currentProfileType, setCurrentProfileType] = useState<"parent" | "child">("parent");
  const [currentChildUsername, setCurrentChildUsername] = useState<string | null>(null);

  // User data state
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isTraitsModalVisible, setIsTraitsModalVisible] = useState(false);

  // Stats state
  const [statsValues, setStatsValues] = useState<number[]>([]);
  const [statsLabels, setStatsLabels] = useState<string[]>([]);
  const [workTimes, setWorkTimes] = useState<number[]>([]);
  const [workLabels, setWorkLabels] = useState<string[]>([]);
  const [playTimes, setPlayTimes] = useState<number[]>([]);
  const [playLabels, setPlayLabels] = useState<string[]>([]);
  const [totalRocksAllTime, setTotalRocksAllTime] = useState<number>(0);
  const [currentRocks, setCurrentRocks] = useState<number>(0);
  const {t ,i18n} = useTranslation();
  

  // Load user profile on component mount
 useEffect(() => {
  const loadUserProfile = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;
      
      const db = getFirestore();
      
      // Check if a child profile is active
      const activeChild = await AsyncStorage.getItem("activeChildProfile");
      
      let profileData = null;
      
      if (activeChild) {
        // Child is active - load from child's document
        const childrenRef = collection(db, "users", currentUser.uid, "children");
        const childQuery = query(childrenRef, where("username", "==", activeChild));
        const childSnapshot = await getDocs(childQuery);
        
        if (!childSnapshot.empty) {
          const childDoc = childSnapshot.docs[0];
          const childData = childDoc.data();
          
          // Map child data to UserProfile format
          profileData = {
            uid: currentUser.uid,
            firstName: childData.firstName || "",
            lastName: childData.lastName || "",
            displayName: childData.firstName || "Child", // Use firstName as display name for children
            email: currentUser.email || "",
            birthdate: childData.birthdate || "",
            profilePicture: childData.profilePicture,
            traits: childData.traits || [],
            awards: childData.awards || [],
          };
        }
      } else {
        // Parent is active - load from parent's document
        profileData = await getUserProfile(currentUser.uid);
      }
      
      if (profileData) {
        setUserProfile(profileData);
      } else {
        // Set default profile if none exists
        setUserProfile({
          uid: currentUser.uid,
          firstName: "Space",
          lastName: "Explorer",
          displayName: "Space",
          email: currentUser.email || "",
          traits: ["Focused", "Persistent", "Creative", "Goal-Oriented"],
          awards: [
            "🏆 First Mission",
            "⭐ 10 Tasks Complete",
            "🚀 Speed Runner",
            "💎 Rock Collector",
          ],
        });
      }
    } catch (error) {
      console.error("Error loading user profile:", error);
    } finally {
      setIsLoadingProfile(false);
    }
  };

  loadUserProfile();
  loadAllTimeStats();
}, []);

 const loadAllTimeStats = useCallback(async () => {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return;

    const db = getFirestore();
    
    // Check if a child profile is active
    const activeChild = await AsyncStorage.getItem("activeChildProfile");
    
    let userDoc;
    
    if (activeChild) {
      // Child is active - load from child's document
      const { collection, query, where, getDocs } = await import("firebase/firestore");
      const childrenRef = collection(db, "users", user.uid, "children");
      const childQuery = query(childrenRef, where("username", "==", activeChild));
      const childSnapshot = await getDocs(childQuery);
      
      if (!childSnapshot.empty) {
        const childDocData = childSnapshot.docs[0];
        userDoc = childDocData;
      } else {
        console.warn("Child profile not found");
        return;
      }
    } else {
      // Parent is active - load from parent's document
      userDoc = await getDoc(doc(db, "users", user.uid));
    }
    
    if (userDoc && userDoc.exists()) {
      const data = userDoc.data();
      const rocksArr: number[] = data.allTimeRocksArr || [];
      const wtArr: number[] = data.workTimeMinutesArr || [];
      const ptArr: number[] = data.playTimeMinutesArr || [];
      const totalAllTime = Number(data.allTimeRocks ?? 0);
      
      setTotalRocksAllTime(Number.isNaN(totalAllTime) ? 0 : totalAllTime);
      setCurrentRocks(Number.isNaN(data.rocks) ? 0 : Math.max(0, Math.floor(data.rocks)));
      setStatsLabels(rocksArr.map((_, i) => `#${i + 1}`));
      setWorkLabels(wtArr.map((_, i) => `#${i + 1}`));
      setPlayLabels(ptArr.map((_, i) => `#${i + 1}`));
      setStatsValues(rocksArr);
      setWorkTimes(wtArr);
      setPlayTimes(ptArr);
    }
  } catch (e) {
    console.warn("Failed to load stats", e);
  }
}, []);

  // Chart template helpers
  const totalRocksChart = (labels: string[], values: number[]) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;600;700&display=swap" rel="stylesheet" />
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <style>
    body { margin:0; padding:0; background:transparent; font-family:'Orbitron',sans-serif; color:#fff; }
    .wrap { padding:2%; border:4px solid rgba(85,247,104,0.5); border-radius:40px; height:100%; box-sizing:border-box; }
    canvas { width:100%!important; height:100%!important; }
  </style>
 </head>
 <body>
  <div class="wrap">
    <canvas id="c"></canvas>
  </div>
  <script>
    const labels = ${JSON.stringify(labels)};
    const values = ${JSON.stringify(values)};
    const ctx = document.getElementById('c').getContext('2d');
    const gradient = ctx.createLinearGradient(0,0,0,300);
    gradient.addColorStop(0,'rgba(59,246,112,0.35)');
    gradient.addColorStop(1,'rgba(59,246,112,0.05)');
    // Global font defaults (restore original appearance)
    Chart.defaults.font.family = 'Orbitron';
    Chart.defaults.font.size = 12;
    Chart.defaults.color = '#e5e7eb';
    new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            data: values,
            borderColor: 'rgba(59,246,112,1)',
            backgroundColor: gradient,
            borderWidth: 4,
            tension: 0.35,
            pointRadius: 5,
            fill: true
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          title: { display: true, text: 'Total Rocks Over Time', color: '#fff', font: { family:'Orbitron', size: 22, weight: '700' } },
          tooltip: { titleFont:{family:'Orbitron', size:14, weight:'600'}, bodyFont:{family:'Orbitron', size:13} }
        },
        scales: {
          y: { beginAtZero: true, ticks: { color: '#e5e7eb', font:{family:'Orbitron', size:12} }, title: { display: true, text: 'Rocks', color: '#fff', font:{family:'Orbitron', size:14, weight:'600'} } },
          x: { ticks: { color: '#e5e7eb', font:{family:'Orbitron', size:12} }, title: { display: true, text: 'Attempt #', color: '#fff', font:{family:'Orbitron', size:14, weight:'600'} } }
        }
      }
    });
  </script>
 </body>
</html>
`.trim();

  const cumulativeChart = (title: string, yLabel: string, labels: string[], values: number[]) => {
    const cumulative = values.map((v, i) => values.slice(0, i + 1).reduce((a, b) => a + b, 0));
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;600;700&display=swap" rel="stylesheet" />
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <style>
    body { margin:0; padding:0; background:transparent; font-family:'Orbitron',sans-serif; color:#fff; }
    .wrap { padding:2%; border:4px solid rgba(85,247,104,0.5); border-radius:40px; height:100%; box-sizing:border-box; }
    canvas { width:100%!important; height:100%!important; }
  </style>
</head>
<body>
  <div class="wrap">
    <canvas id="c"></canvas>
  </div>
  <script>
    const labels = ${JSON.stringify(labels)};
    const cumulative = ${JSON.stringify(cumulative)};
    const ctx = document.getElementById('c').getContext('2d');
    const gradient = ctx.createLinearGradient(0,0,0,300);
    gradient.addColorStop(0,'rgba(59,246,112,0.35)');
    gradient.addColorStop(1,'rgba(59,246,112,0.05)');
    // Global font defaults (restore original appearance)
    Chart.defaults.font.family = 'Orbitron';
    Chart.defaults.font.size = 12;
    Chart.defaults.color = '#e5e7eb';
    new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            data: cumulative,
            borderColor: 'rgba(59,246,112,1)',
            backgroundColor: gradient,
            borderWidth: 4,
            tension: 0.35,
            pointRadius: 5,
            fill: true
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          title: { display: true, text: '${title}', color: '#fff', font: { family:'Orbitron', size: 22, weight: '700' } },
          tooltip: { titleFont:{family:'Orbitron', size:14, weight:'600'}, bodyFont:{family:'Orbitron', size:13} }
        },
        scales: {
          y: { beginAtZero: true, ticks: { color: '#e5e7eb', font:{family:'Orbitron', size:12} }, title: { display: true, text: '${yLabel}', color: '#fff', font:{family:'Orbitron', size:14, weight:'600'} } },
          x: { ticks: { color: '#e5e7eb', font:{family:'Orbitron', size:12} }, title: { display: true, text: 'Cycle #', color: '#fff', font:{family:'Orbitron', size:14, weight:'600'} } }
        }
      }
    });
  </script>
</body>
</html>
`.trim();
  };

  // Load current profile on mount
  useEffect(() => {
    loadCurrentProfile();
  }, []);

  const loadCurrentProfile = async () => {
    const activeChild = await AsyncStorage.getItem("activeChildProfile");
    if (activeChild) {
      setCurrentProfileType("child");
      setCurrentChildUsername(activeChild);
    } else {
      setCurrentProfileType("parent");
      setCurrentChildUsername(null);
    }
  };

  const handleSwitchProfile = () => {
    router.push("/pages/ProfileSelection");
  };

  const handleLogout = async () => {
    try {
      // Clear active profile
      await AsyncStorage.removeItem("activeChildProfile");
      // Sign out from Firebase
      await signOut(auth);
      // Navigate to login
      router.push("/pages/Login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleProfilePicturePress = async () => {
    if (isUploadingImage || !userProfile) return;

    setIsUploadingImage(true);
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        alert("You must be logged in to update your profile picture");
        return;
      }

      const newImageUrl = await updateProfilePicture(
        userProfile.profilePicture || undefined
      );

      if (newImageUrl) {
        // Save to Firestore
        await updateUserProfilePicture(currentUser.uid, newImageUrl);

        // Update local state
        setUserProfile({
          ...userProfile,
          profilePicture: newImageUrl,
        });

        console.log("Profile picture updated successfully!");
      }
    } catch (error) {
      console.error("Error updating profile picture:", error);
      alert("Failed to update profile picture. Please try again.");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleProfileUpdate = (updatedProfile: UserProfile) => {
    setUserProfile(updatedProfile);
  };

  return (
    <View className="flex-1">
      {/* Animated stars background */}
      <ImageBackground
        source={starBackground}
        className="absolute inset-0 w-full h-full"
        resizeMode="cover"
      />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="flex-1 p-5 pt-16">
          {/* Back Button */}
          <TouchableOpacity
            className="absolute top-12 left-5 z-10 w-12 h-12 bg-white/10 rounded-full items-center justify-center"
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
            }}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>

          {/* Profile Type Badge */}
          <View className="items-center mt-2 mb-4">
            <View
              className="px-4 py-2 rounded-full"
              style={{
                backgroundColor:
                  currentProfileType === "parent"
                    ? "rgba(59, 130, 246, 0.4)"
                    : "rgba(168, 85, 247, 0.4)",
                borderWidth: 1,
                borderColor:
                  currentProfileType === "parent"
                    ? "rgba(96, 165, 250, 0.6)"
                    : "rgba(192, 132, 252, 0.6)",
              }}
            >
              <Text className="font-orbitron-semibold text-white text-xs">
                {currentProfileType === "parent"
                  ? "👤 Parent Account"
                  : `👶 ${currentChildUsername}`}
              </Text>
            </View>
          </View>

          {/* User Name - Centered */}
          <Text
            className="font-orbitron-semibold text-xl text-white text-center text-3xl mt-4 mb-8"
            style={{
              textShadowColor: "rgba(147, 51, 234, 0.8)",
              textShadowOffset: { width: 0, height: 0 },
              textShadowRadius: 20,
            }}
          >
            {userProfile?.displayName ||
              userProfile?.firstName ||
              "Space Explorer"}
          </Text>

          {/* Profile Image */}
          <View className="items-center mb-6">
            <TouchableOpacity
              className="w-32 h-32 rounded-full items-center justify-center overflow-hidden"
              style={{
                backgroundColor: "#7c3aed",
                shadowColor: "#a855f7",
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.6,
                shadowRadius: 16,
              }}
              onPress={handleProfilePicturePress}
              disabled={isUploadingImage}
            >
              {isUploadingImage ? (
                <ActivityIndicator size="large" color="white" />
              ) : userProfile?.profilePicture ? (
                <Image
                  source={{ uri: userProfile.profilePicture }}
                  className="w-full h-full"
                  resizeMode="cover"
                />
              ) : (
                <Ionicons name="person" size={64} color="white" />
              )}
            </TouchableOpacity>
          </View>

          {/* Edit Profile Button */}
          <View className="items-center mb-8">
            <TouchableOpacity
              className="flex-row items-center px-6 py-3 rounded-full"
              style={{
                backgroundColor: "rgba(139, 92, 246, 0.3)",
                borderWidth: 2,
                borderColor: "rgba(167, 139, 250, 0.5)",
                shadowColor: "#a855f7",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.4,
                shadowRadius: 8,
              }}
              onPress={() => {
                setIsEditModalVisible(true);
              }}
            >
              <Ionicons
                name="create-outline"
                size={20}
                color="white"
                style={{ marginRight: 8 }}
              />
              <Text className="font-orbitron-semibold text-xl text-white text-base">
                {t("Profile.editP")}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Traits Container */}
          <View className="mb-6">
            <View className="flex-row justify-between items-center mb-4">
              <Text
                className="font-orbitron-semibold text-xl text-white"
                style={{
                  textShadowColor: "rgba(59, 130, 246, 0.6)",
                  textShadowOffset: { width: 0, height: 0 },
                  textShadowRadius: 10,
                }}
              >
                {t("Profile.traits")}
              </Text>
              <TouchableOpacity
                onPress={() => setIsTraitsModalVisible(true)}
                className="flex-row items-center px-3 py-2 rounded-full"
                style={{
                  backgroundColor: "rgba(59, 130, 246, 0.3)",
                  borderWidth: 1,
                  borderColor: "rgba(96, 165, 250, 0.5)",
                }}
              >
                <Ionicons
                  name="add"
                  size={16}
                  color="white"
                  style={{ marginRight: 4 }}
                />
                <Text className="font-orbitron-semibold text-white text-xs">
                  Edit
                </Text>
              </TouchableOpacity>
            </View>
            <View
              className="p-4 rounded-2xl"
              style={{
                backgroundColor: "rgba(30, 58, 138, 0.3)",
                borderWidth: 2,
                borderColor: "rgba(59, 130, 246, 0.3)",
                shadowColor: "#3b82f6",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
              }}
            >
              <View className="flex-row flex-wrap gap-2">
                {userProfile?.traits?.map((trait: string, index: number) => (
                  <View
                    key={index}
                    className="px-4 py-2 rounded-full"
                    style={{
                      backgroundColor: "rgba(59, 130, 246, 0.4)",
                      borderWidth: 1,
                      borderColor: "rgba(96, 165, 250, 0.6)",
                    }}
                  >
                    <Text className="font-orbitron-semibold text-xl text-white text-sm">
                      {trait}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          {/* Awards Container */}
          <View className="mb-8">
            <Text
              className="font-orbitron-semibold text-xl text-white text-xl mb-4"
              style={{
                textShadowColor: "rgba(236, 72, 153, 0.6)",
                textShadowOffset: { width: 0, height: 0 },
                textShadowRadius: 10,
              }}
            >
              {t("Profile.awards")}
            </Text>
            <View
              className="p-4 rounded-2xl"
              style={{
                backgroundColor: "rgba(131, 24, 67, 0.3)",
                borderWidth: 2,
                borderColor: "rgba(236, 72, 153, 0.3)",
                shadowColor: "#ec4899",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
              }}
            >
              <View className="flex-row flex-wrap gap-2">
                {userProfile?.awards?.map((award: string, index: number) => (
                  <View
                    key={index}
                    className="px-4 py-2 rounded-full"
                    style={{
                      backgroundColor: "rgba(236, 72, 153, 0.4)",
                      borderWidth: 1,
                      borderColor: "rgba(244, 114, 182, 0.6)",
                    }}
                  >
                    <Text className="font-orbitron-semibold text-white text-">
                      {award}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          {/* Analytics Container */}
          <View className="mb-8">
            <Text className="font-orbitron-semibold text-xl text-white mb-4" style={{ textShadowColor: "rgba(59,246,112,0.6)", textShadowOffset:{width:0,height:0}, textShadowRadius:10 }}>{t("Profile.YourStats")}</Text>
            <View className="p-4 rounded-2xl" style={{ backgroundColor:"rgba(30,138,43,0.30)", borderWidth:2, borderColor:"rgba(59,246,112,0.35)", shadowColor:"#3bf670", shadowOffset:{width:0,height:6}, shadowOpacity:0.35, shadowRadius:12 }}>
              {/* Total Rocks */}
              <View className="px-4 py-2 rounded-full" style={{ backgroundColor:"rgba(59,246,112,0.25)", borderWidth:1, borderColor:"rgba(59,246,112,0.45)" }}>
                <Text className="font-orbitron-semibold text-white">{t("Profile.rocksEarned")}{totalRocksAllTime}</Text>
              </View>
              {/* Rocks Spent */}
              <View className="px-4 py-2 rounded-full mt-2" style={{ backgroundColor:"rgba(59,246,112,0.25)", borderWidth:1, borderColor:"rgba(59,246,112,0.45)" }}>
                <Text className="font-orbitron-semibold text-white">{t("Profile.rocksSpent")}{Math.max(0, totalRocksAllTime - currentRocks)}</Text>
              </View>
              {/* Rocks Chart */}
              <View style={{ height:200, borderRadius:16, overflow:"hidden", marginTop:16, marginBottom:16 }}>
                {statsValues.length ? (
                  <WebView originWhitelist={["*"]} source={{ html: totalRocksChart(statsLabels, statsValues) }} scrollEnabled={false} style={{ backgroundColor:"transparent" }} />
                ) : (<Text className="text-white">No rock stats yet.</Text>)}
              </View>
              {/* Work Time Chart */}
              <View style={{ height:200, borderRadius:16, overflow:"hidden", marginTop:8, marginBottom:16 }}>
                {workTimes.length ? (
                  <WebView originWhitelist={["*"]} source={{ html: cumulativeChart("Cumulative Work Time", "Minutes", workLabels, workTimes) }} scrollEnabled={false} style={{ backgroundColor:"transparent" }} />
                ) : (<Text className="text-white">No work sessions yet.</Text>)}
              </View>
              {/* Play Time Chart */}
              <View style={{ height:200, borderRadius:16, overflow:"hidden", marginTop:8, marginBottom:16 }}>
                {playTimes.length ? (
                  <WebView originWhitelist={["*"]} source={{ html: cumulativeChart("Cumulative Play Time", "Minutes", playLabels, playTimes) }} scrollEnabled={false} style={{ backgroundColor:"transparent" }} />
                ) : (<Text className="text-white">No play sessions yet.</Text>)}
              </View>
              {/* Averages */}
              <View className="flex-row flex-wrap gap-2 mt-2">
                <View className="px-3 py-2 rounded-full" style={{ backgroundColor:"rgba(59,246,112,0.25)", borderWidth:1, borderColor:"rgba(59,246,112,0.45)" }}>
                  <Text className="font-orbitron-semibold text-white text-xs"> {t("Profile.AvgWorkCycle")}{workTimes.length ? Math.round(workTimes.reduce((a,b)=>a+b,0)/workTimes.length) : 0}m</Text>
                </View>
                <View className="px-3 py-2 rounded-full" style={{ backgroundColor:"rgba(59,246,112,0.25)", borderWidth:1, borderColor:"rgba(59,246,112,0.45)" }}>
                  <Text className="font-orbitron-semibold text-white text-xs">{t("Profile.AvgPlayCycle")}{playTimes.length ? Math.round(playTimes.reduce((a,b)=>a+b,0)/playTimes.length) : 0}m</Text>
                </View>
                <View className="px-3 py-2 rounded-full" style={{ backgroundColor:"rgba(59,246,112,0.25)", borderWidth:1, borderColor:"rgba(59,246,112,0.45)" }}>
                  <Text className="font-orbitron-semibold text-white text-xs">{t("Profile.work")}{playTimes.length && workTimes.length ? ((workTimes.reduce((a,b)=>a+b,0)/workTimes.length)/(playTimes.reduce((a,b)=>a+b,0)/playTimes.length)).toFixed(2) : 0}</Text>
                </View>
                <View className="px-3 py-2 rounded-full" style={{ backgroundColor:"rgba(59,246,112,0.25)", borderWidth:1, borderColor:"rgba(59,246,112,0.45)" }}>
                  <Text className="font-orbitron-semibold text-white text-xs">{t("Profile.total")}{(() => { const t = workTimes.reduce((a,b)=>a+b,0)+playTimes.reduce((a,b)=>a+b,0); return `${(t/60).toFixed(1)}h`; })()}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Add Child Button - NEW */}
          <View className="items-center mb-4">
            <MainButton
            title={t("Profile.AddChildAccount")}
            variant="primary"
            onPress={() => router.push("/pages/CreateChildAccount")}
            customStyle={{ width: "80%" }}
            />
          </View>      

          {/* Switch Profile Button */}
          <View className="items-center mb-4">
            <MainButton
              title={t("Profile.SwitchProfile")}
              variant="secondary"
              onPress={handleSwitchProfile}
              customStyle={{ width: "80%" }}
            />
          </View>

          {/* Logout Button */}
          <View className="items-center mb-8">
            <MainButton
              title={t("Profile.Logout")}
              variant="error"
              onPress={handleLogout}
              customStyle={{ width: "80%" }}
            />
          </View>
        </View>
      </ScrollView>

      {/* Edit Profile Modal */}
      {userProfile && (
        <EditProfileModal
          visible={isEditModalVisible}
          onClose={() => setIsEditModalVisible(false)}
          userProfile={userProfile}
          onProfileUpdate={handleProfileUpdate}
        />
      )}

      {/* Traits Modal */}
      {userProfile && (
        <TraitsModal
          visible={isTraitsModalVisible}
          onClose={() => setIsTraitsModalVisible(false)}
          userProfile={userProfile}
          onTraitsUpdate={handleProfileUpdate}
        />
      )}
    </View>
  );
}