import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ImageBackground,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { WebView } from "react-native-webview";
import MainButton from "../components/MainButton";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, getDoc, updateDoc, increment } from "firebase/firestore";
import { set } from "firebase/database";

export default function ProfileScreen() {
  const router = useRouter();
  const starBackground = require("../../assets/backgrounds/starsAnimated.gif");

  // Example data - replace with actual user data
  const [userName] = useState("Space Explorer");
  const [userTraits] = useState([
    "Focused",
    "Persistent",
    "Creative",
    "Goal-Oriented",
  ]);
  const [userAwards] = useState([
    "🏆 First Mission",
    "⭐ 10 Tasks Complete",
    "🚀 Speed Runner",
    "💎 Rock Collector",
  ]);

  const handleLogout = () => {
    // Add logout logic here
    console.log("Logging out...");
    router.push("/pages/Login");
  };

  // chart js params
  const [statsValues, setStatsValues] = useState<number[]>([]);
  const [statsLabels, setStatsLabels] = useState<string[]>([]);
  const [workTimes, setWorkTimes] = useState<number[]>([]);
  const [workLabels, setWorkLabels] = useState<string[]>([]);
  const [playTimes, setPlayTimes] = useState<number[]>([]);
  const [playLabels, setPlayLabels] = useState<string[]>([]);
  const [totalRocksAllTime, setTotalRocksAllTime] = useState<number>(0);
  const [currentRocks, setCurrentRocks] = useState<number>(0);

  const loadAllTimeRocks = useCallback(async () => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) return;

      const db = getFirestore();
      const userDoc = await getDoc(doc(db, "users", user.uid));

      if (userDoc.exists()) {
        const userData = userDoc.data();

        const arr: number[] = userData.allTimeRocksArr || [];
        const wtArr: number[] = userData.workTimeMinutesArr || [];
        const ptArr: number[] = userData.playTimeMinutesArr || [];

        const totalAllTime = Number(userData.allTimeRocks ?? 0);
        setTotalRocksAllTime(Number.isNaN(totalAllTime) ? 0 : totalAllTime);
        setCurrentRocks(
          Number.isNaN(userData.rocks) ? 0 : Math.max(0, Math.floor(userData.rocks))
        );

        // labels will just be ["1", "2", "3", "4"]
        setStatsLabels(arr.map((_, i) => `#${i + 1}`));
        setWorkLabels(wtArr.map((_, i) => `#${i + 1}`));
        setPlayLabels(ptArr.map((_, i) => `#${i + 1}`));

        // raw values
        setStatsValues(arr);
        setWorkTimes(wtArr);
        setPlayTimes(ptArr);
      }
    } catch (err) {
      console.warn("Failed to load rocks from database", err);
    }
  }, []);

  useEffect(() => {
    loadAllTimeRocks();
  }, []);

  // need to use html string for webview

//------------------------------------------- Total Rocks Chart -------------------------------------------

  const totalRocksChart = (labels: string[], values: number[]) => `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8" />

      <!-- Orbitron font -->
      <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700&display=swap" rel="stylesheet">

      <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>

      <style>
        body {
          margin: 0;
          padding: 0;
          background: transparent;
          font-family: 'Orbitron', sans-serif;
          color: white;
        }

        /* Outer container with border + glow */
        .chart-wrapper {
          margin-top: 1.5%;
          padding: 2%;
          border: 4px solid rgba(85, 247, 104, 0.5);
          border-radius: 50px;
          height: 100%;
          width: 100%;
          box-sizing: border-box;
        }

        canvas {
          width: 100% !important;
          height: 100% !important;
          filter: drop-shadow(0 0 8px rgba(85, 99, 247, 0.35));
        }
      </style>
    </head>

    <body>
      <div class="chart-wrapper">
        <canvas id="chart"></canvas>
      </div>

      <script>
        const ctx = document.getElementById('chart').getContext('2d');

        // Gradient fill under the line (green theme)
        const gradient = ctx.createLinearGradient(0, 0, 0, 300);
        gradient.addColorStop(0, 'rgba(59, 246, 112, 0.35)');
        gradient.addColorStop(1, 'rgba(59, 246, 112, 0.05)');

        new Chart(ctx, {
          type: 'line',
          data: {
            labels: ${JSON.stringify(labels)},
            datasets: [{
              label: '',
              data: ${JSON.stringify(values)},
              borderColor: 'rgba(59, 246, 112, 1)',
              backgroundColor: gradient,
              borderWidth: 4,
              tension: 0.35,
              pointRadius: 6,
              pointHoverRadius: 9,
              pointBackgroundColor: 'rgba(59, 246, 112, 1)',
              pointBorderColor: '#ffffff',
              fill: true
            }]
          },

          options: {
            responsive: true,
            maintainAspectRatio: false,

            layout: {
              padding: { top: 10, bottom: 10, left: 5, right: 5 }
            },

            plugins: {
              legend: { display: false },

              title: {
                display: true,
                text: 'Total Rocks Over Time',
                color: '#ffffff',
                font: { size: 36, weight: '700', family: 'Orbitron' },
                padding: { top: 8, bottom: 18 }
              },

              tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.75)',
                borderColor: 'rgba(59, 246, 112, 0.9)',
                borderWidth: 1,
                padding: 12,
                titleColor: '#fff',
                bodyColor: '#fff',
                titleFont: { family: 'Orbitron', size: 16 },
                bodyFont: { family: 'Orbitron', size: 14 },
                callbacks: {
                  label: (ctx) => "Rocks: " + ctx.parsed.y
                }
              }
            },

            scales: {
              y: {
                beginAtZero: true,
                ticks: {
                  color: '#e5e7eb',
                  font: { size: 16, family: 'Orbitron' }
                },
                grid: { color: 'rgba(255,255,255,0.1)' },
                title: {
                  display: true,
                  text: 'Rocks',
                  color: '#ffffff',
                  font: { size: 24, weight: '600', family: 'Orbitron' }
                }
              },

              x: {
                ticks: {
                  color: '#e5e7eb',
                  font: { size: 16, family: 'Orbitron' }
                },
                grid: { color: 'rgba(255,255,255,0.05)' },
                title: {
                  display: true,
                  text: 'Attempts',
                  color: '#ffffff',
                  font: { size: 24, weight: '600', family: 'Orbitron' }
                }
              }
            }
          }
        });
      </script>
    </body>
  </html>`;


//------------------------------------------- Total Work Time Chart -------------------------------------------


  const totalWorkTimeChart = (labels: string[], values: number[]) => `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8" />

      <!-- Orbitron font -->
      <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700&display=swap" rel="stylesheet">

      <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>

      <style>
        body {
          margin: 0;
          padding: 0;
          background: transparent;
          font-family: 'Orbitron', sans-serif;
          color: white;
        }

        /* Outer container with border + glow */
        .chart-wrapper {
          margin-top: 1.5%;
          padding: 2%;
          border: 4px solid rgba(85, 247, 104, 0.5);
          border-radius: 50px;
          height: 100%;
          width: 100%;
          box-sizing: border-box;
        }

        canvas {
          width: 100% !important;
          height: 100% !important;
          filter: drop-shadow(0 0 8px rgba(85, 99, 247, 0.35));
        }
      </style>
    </head>

    <body>
      <div class="chart-wrapper">
        <canvas id="chart"></canvas>
      </div>

      <script>
        const ctx = document.getElementById('chart').getContext('2d');

        // Gradient fill under the line (green theme)
        const gradient = ctx.createLinearGradient(0, 0, 0, 300);
        gradient.addColorStop(0, 'rgba(59, 246, 112, 0.35)');
        gradient.addColorStop(1, 'rgba(59, 246, 112, 0.05)');

        // Compute cumulative values for work time graph
        const cumulative = (function(){ const raw = ${JSON.stringify(values)}; return raw.map((v,i)=> raw.slice(0,i+1).reduce((a,b)=>a+b,0)); })();

        new Chart(ctx, {
          type: 'line',
          data: {
            labels: ${JSON.stringify(labels)},
            datasets: [{
              label: '',
              data: cumulative,
              borderColor: 'rgba(59, 246, 112, 1)',
              backgroundColor: gradient,
              borderWidth: 4,
              tension: 0.35,
              pointRadius: 6,
              pointHoverRadius: 9,
              pointBackgroundColor: 'rgba(59, 246, 112, 1)',
              pointBorderColor: '#ffffff',
              fill: true
            }]
          },

          options: {
            responsive: true,
            maintainAspectRatio: false,

            layout: {
              padding: { top: 10, bottom: 10, left: 5, right: 5 }
            },

            plugins: {
              legend: { display: false },

              title: {
                display: true,
                text: 'Cumulative Work Time',
                color: '#ffffff',
                font: { size: 36, weight: '700', family: 'Orbitron' },
                padding: { top: 8, bottom: 18 }
              },

              tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.75)',
                borderColor: 'rgba(59, 246, 112, 0.9)',
                borderWidth: 1,
                padding: 12,
                titleColor: '#fff',
                bodyColor: '#fff',
                titleFont: { family: 'Orbitron', size: 16 },
                bodyFont: { family: 'Orbitron', size: 14 },
                callbacks: {
                  label: (ctx) => "Total: " + ctx.parsed.y
                }
              }
            },

            scales: {
              y: {
                beginAtZero: true,
                ticks: {
                  color: '#e5e7eb',
                  font: { size: 16, family: 'Orbitron' }
                },
                grid: { color: 'rgba(255,255,255,0.1)' },
                title: {
                  display: true,
                  text: 'Minutes',
                  color: '#ffffff',
                  font: { size: 24, weight: '600', family: 'Orbitron' }
                }
              },

              x: {
                ticks: {
                  color: '#e5e7eb',
                  font: { size: 16, family: 'Orbitron' }
                },
                grid: { color: 'rgba(255,255,255,0.05)' },
                title: {
                  display: true,
                  text: 'Cycles',
                  color: '#ffffff',
                  font: { size: 24, weight: '600', family: 'Orbitron' }
                }
              }
            }
          }
        });
      </script>
    </body>
  </html>`;


  //------------------------------------------- Total Work Time Chart -------------------------------------------


  const totalPlayTimeChart = (labels: string[], values: number[]) => `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8" />

      <!-- Orbitron font -->
      <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700&display=swap" rel="stylesheet">

      <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>

      <style>
        body {
          margin: 0;
          padding: 0;
          background: transparent;
          font-family: 'Orbitron', sans-serif;
          color: white;
        }

        /* Outer container with border + glow */
        .chart-wrapper {
          margin-top: 1.5%;
          padding: 2%;
          border: 4px solid rgba(85, 247, 104, 0.5);
          border-radius: 50px;
          height: 100%;
          width: 100%;
          box-sizing: border-box;
        }

        canvas {
          width: 100% !important;
          height: 100% !important;
          filter: drop-shadow(0 0 8px rgba(85, 99, 247, 0.35));
        }
      </style>
    </head>

    <body>
      <div class="chart-wrapper">
        <canvas id="chart"></canvas>
      </div>

      <script>
        const ctx = document.getElementById('chart').getContext('2d');

        // Gradient fill under the line (green theme)
        const gradient = ctx.createLinearGradient(0, 0, 0, 300);
        gradient.addColorStop(0, 'rgba(59, 246, 112, 0.35)');
        gradient.addColorStop(1, 'rgba(59, 246, 112, 0.05)');

        // Compute cumulative values for play time graph
        const cumulative = (function(){ const raw = ${JSON.stringify(values)}; return raw.map((v,i)=> raw.slice(0,i+1).reduce((a,b)=>a+b,0)); })();

        new Chart(ctx, {
          type: 'line',
          data: {
            labels: ${JSON.stringify(labels)},
            datasets: [{
              label: '',
              data: cumulative,
              borderColor: 'rgba(59, 246, 112, 1)',
              backgroundColor: gradient,
              borderWidth: 4,
              tension: 0.35,
              pointRadius: 6,
              pointHoverRadius: 9,
              pointBackgroundColor: 'rgba(59, 246, 112, 1)',
              pointBorderColor: '#ffffff',
              fill: true
            }]
          },

          options: {
            responsive: true,
            maintainAspectRatio: false,

            layout: {
              padding: { top: 10, bottom: 10, left: 5, right: 5 }
            },

            plugins: {
              legend: { display: false },

              title: {
                display: true,
                text: 'Cumulative Play Time',
                color: '#ffffff',
                font: { size: 36, weight: '700', family: 'Orbitron' },
                padding: { top: 8, bottom: 18 }
              },

              tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.75)',
                borderColor: 'rgba(59, 246, 112, 0.9)',
                borderWidth: 1,
                padding: 12,
                titleColor: '#fff',
                bodyColor: '#fff',
                titleFont: { family: 'Orbitron', size: 16 },
                bodyFont: { family: 'Orbitron', size: 14 },
                callbacks: {
                  label: (ctx) => "Total: " + ctx.parsed.y
                }
              }
            },

            scales: {
              y: {
                beginAtZero: true,
                ticks: {
                  color: '#e5e7eb',
                  font: { size: 16, family: 'Orbitron' }
                },
                grid: { color: 'rgba(255,255,255,0.1)' },
                title: {
                  display: true,
                  text: 'Minutes',
                  color: '#ffffff',
                  font: { size: 24, weight: '600', family: 'Orbitron' }
                }
              },

              x: {
                ticks: {
                  color: '#e5e7eb',
                  font: { size: 16, family: 'Orbitron' }
                },
                grid: { color: 'rgba(255,255,255,0.05)' },
                title: {
                  display: true,
                  text: 'Cycles',
                  color: '#ffffff',
                  font: { size: 24, weight: '600', family: 'Orbitron' }
                }
              }
            }
          }
        });
      </script>
    </body>
  </html>`;

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

          {/* User Name - Centered */}
          <Text
            className="font-orbitron-semibold text-xl text-white text-center text-3xl mt-8 mb-8"
            style={{
              textShadowColor: "rgba(147, 51, 234, 0.8)",
              textShadowOffset: { width: 0, height: 0 },
              textShadowRadius: 20,
            }}
          >
            {userName}
          </Text>

          {/* Profile Image */}
          <View className="items-center mb-6">
            <View
              className="w-32 h-32 rounded-full items-center justify-center"
              style={{
                backgroundColor: "#7c3aed",
                shadowColor: "#a855f7",
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.6,
                shadowRadius: 16,
              }}
            >
              <Ionicons name="person" size={64} color="white" />
            </View>
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
                // Add edit profile logic
                console.log("Edit profile pressed");
              }}
            >
              <Ionicons
                name="create-outline"
                size={20}
                color="white"
                style={{ marginRight: 8 }}
              />
              <Text className="font-orbitron-semibold text-xl text-white text-base">
                Edit Profile
              </Text>
            </TouchableOpacity>
          </View>

          {/* Traits Container */}
          <View className="mb-6">
            <Text
              className="font-orbitron-semibold text-xl text-white text-xl mb-4"
              style={{
                textShadowColor: "rgba(59, 130, 246, 0.6)",
                textShadowOffset: { width: 0, height: 0 },
                textShadowRadius: 10,
              }}
            >
              Traits
            </Text>
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
                {userTraits.map((trait, index) => (
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
              Awards
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
                {userAwards.map((award, index) => (
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
          <View className="mb-6">
            <Text
              className="font-orbitron-semibold text-xl text-white text-xl mb-4"
              style={{
                textShadowColor: "rgba(59, 246, 112, 0.6)",
                textShadowOffset: { width: 0, height: 0 },
                textShadowRadius: 10,
              }}
            >
              Your Stats
            </Text>

            <View
              className="p-4 rounded-2xl space-y-1"
              style={{
                backgroundColor: "rgba(30, 138, 43, 0.30)",
                borderWidth: 2,
                borderColor: "rgba(59, 246, 112, 0.35)",
                shadowColor: "#3bf670",
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.35,
                shadowRadius: 12,
              }}
            >

              {/* Total Rocks Earned */}
              <View
                className="px-4 py-2 rounded-full"
                style={{
                  backgroundColor: "rgba(59, 246, 112, 0.25)",
                  borderWidth: 1,
                  borderColor: "rgba(59, 246, 112, 0.45)",
                }}
              >
                <Text className="font-orbitron-semibold text-white">
                  Total Rocks Earned: {String(totalRocksAllTime)}
                </Text>
              </View>

              {/* Total Rocks Chart */}
              <View
                style={{
                  height: 196,       
                  borderRadius: 16,
                  overflow: "hidden",
                }}
              >
                {statsValues.length > 0 ? (
                  <WebView
                    originWhitelist={["*"]}
                    source={{ html: totalRocksChart(statsLabels, statsValues) }}
                    scrollEnabled={false}
                    scalesPageToFit={false}
                    style={{ flex: 1, backgroundColor: "transparent" }} 
                  />
                ) : (
                  <Text className="text-white">No stats yet!</Text>
                )}
              </View>

              {/* Total Rocks Spent */}
              <View
                className="px-4 py-2 rounded-full"
                style={{
                  backgroundColor: "rgba(59, 246, 112, 0.25)",
                  borderWidth: 1,
                  borderColor: "rgba(59, 246, 112, 0.45)",
                }}
              >
                <Text className="font-orbitron-semibold text-white">
                  Total Rocks Spent: {String(totalRocksAllTime - currentRocks)}
                </Text>
              </View>

              {/* Total Work Time Chart */}
              <View
                style={{
                  height: 196,       
                  borderRadius: 16,
                  overflow: "hidden",
                }}
              >
                {workTimes.length > 0 ? (
                  <WebView
                    originWhitelist={["*"]}
                    source={{ html: totalWorkTimeChart(workLabels, workTimes) }}
                    scrollEnabled={false}
                    scalesPageToFit={false}
                    style={{ flex: 1, backgroundColor: "transparent" }} 
                  />
                ) : (
                  <Text className="text-white">No stats yet!</Text>
                )}
              </View>

              {/* Average Work Cycle Length */}
              <View
                className="px-4 py-2 rounded-full"
                style={{
                  backgroundColor: "rgba(59, 246, 112, 0.25)",
                  borderWidth: 1,
                  borderColor: "rgba(59, 246, 112, 0.45)",
                }}
              >
                <Text className="font-orbitron-semibold text-white">
                  Average Work Cycle: {String(workTimes.length ? Math.round(workTimes.reduce((a,b)=>a+b,0)/workTimes.length) : 0)} min.
                </Text>
              </View>

              {/* Total Play Time Chart */}
              <View
                style={{
                  height: 196,       
                  borderRadius: 16,
                  overflow: "hidden",
                }}
              >
                {playTimes.length > 0 ? (
                  <WebView
                    originWhitelist={["*"]}
                    source={{ html: totalPlayTimeChart(playLabels, playTimes) }}
                    scrollEnabled={false}
                    scalesPageToFit={false}
                    style={{ flex: 1, backgroundColor: "transparent" }} 
                  />
                ) : (
                  <Text className="text-white">No stats yet!</Text>
                )}
              </View>


              {/* Average Play Cycle Length */}
              <View
                className="px-4 py-2 rounded-full"
                style={{
                  backgroundColor: "rgba(59, 246, 112, 0.25)",
                  borderWidth: 1,
                  borderColor: "rgba(59, 246, 112, 0.45)",
                }}
              >
                <Text className="font-orbitron-semibold text-white">
                  Average Play Cycle: {String(playTimes.length ? (Math.round(playTimes.reduce((a,b)=>a+b,0)/playTimes.length)) : 0)} min.
                </Text>
              </View>

              {/* Work to Play Ratio */}
              <View
                className="px-4 py-2 rounded-full"
                style={{
                  backgroundColor: "rgba(59, 246, 112, 0.25)",
                  borderWidth: 1,
                  borderColor: "rgba(59, 246, 112, 0.45)",
                }}
              >
                <Text className="font-orbitron-semibold text-white">
                  Work to Play Ratio: {String(playTimes.length ? Math.round(workTimes.reduce((a,b)=>a+b,0)/workTimes.length)/Math.round(playTimes.reduce((a,b)=>a+b,0)/playTimes.length) : 0)} 
                </Text>
              </View>

              {/* Total Time Spent on App */}
              <View
                className="px-4 py-2 rounded-full"
                style={{
                  backgroundColor: "rgba(59, 246, 112, 0.25)",
                  borderWidth: 1,
                  borderColor: "rgba(59, 246, 112, 0.45)",
                }}
              >
                <Text className="font-orbitron-semibold text-white">
                  {(() => {
                    const totalWork = workTimes.reduce((a,b)=>a+b,0);
                    const totalPlay = playTimes.reduce((a,b)=>a+b,0);
                    const total = totalWork + totalPlay;
                    const hours = (total / 60).toFixed(1);
                    return `Total Session Time: ${hours} hrs.`;
                  })()}
                </Text>
              </View>

            </View>
          </View>



          {/* Logout Button */}
          <View className="items-center mb-8">
            <MainButton
              title="Logout"
              variant="error"
              onPress={handleLogout}
              customStyle={{ width: "80%" }}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}