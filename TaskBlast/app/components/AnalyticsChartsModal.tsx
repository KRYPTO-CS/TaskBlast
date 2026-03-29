import React from "react";
import {
  View,
  TouchableOpacity,
  ImageBackground,
  ScrollView,
  Modal,
} from "react-native";
import { Text } from "../../TTS";
import { Ionicons } from "@expo/vector-icons";
import { WebView } from "react-native-webview";
import { useColorPalette } from "../styles/colorBlindThemes";

interface AnalyticsChartsModalProps {
  visible: boolean;
  onClose: () => void;
  statsLabels: string[];
  statsValues: number[];
  workLabels: string[];
  workTimes: number[];
  playLabels: string[];
  playTimes: number[];
}

const starBackground = require("../../assets/backgrounds/starsAnimated.gif");


// moved chart HTML generation to this file to keep AnalyticsModal focused on summary stats and avoid bloat
const totalRocksChart = (
  labels: string[],
  values: number[],
  chartColor: string,
  chartBorder: string,
  chartFill: string,
) =>
  `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;600;700&display=swap" rel="stylesheet" />
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <style>
    body { margin:0; padding:0; background:transparent; font-family:'Orbitron',sans-serif; color:#fff; }
    .wrap { padding:2%; border:4px solid ${chartBorder}; border-radius:40px; height:100%; box-sizing:border-box; }
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
    gradient.addColorStop(0,'${chartFill}');
    gradient.addColorStop(1,'rgba(0,0,0,0.0)');
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
            borderColor: '${chartColor}',
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
          title: { display: true, text: 'Total Rocks Earned', color: '#fff', font: { family:'Orbitron', size: 22, weight: '700' } },
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

const cumulativeChart = (
  title: string,
  yLabel: string,
  labels: string[],
  values: number[],
  chartColor: string,
  chartBorder: string,
  chartFill: string,
) => {
  const cumulative = values.map((v, i) =>
    values.slice(0, i + 1).reduce((a, b) => a + b, 0),
  );
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;600;700&display=swap" rel="stylesheet" />
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <style>
    body { margin:0; padding:0; background:transparent; font-family:'Orbitron',sans-serif; color:#fff; }
    .wrap { padding:2%; border:4px solid ${chartBorder}; border-radius:40px; height:100%; box-sizing:border-box; }
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
    gradient.addColorStop(0,'${chartFill}');
    gradient.addColorStop(1,'rgba(0,0,0,0.0)');
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
            borderColor: '${chartColor}',
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

export default function AnalyticsChartsModal({
  visible,
  onClose,
  statsLabels,
  statsValues,
  workLabels,
  workTimes,
  playLabels,
  playTimes,
}: AnalyticsChartsModalProps) {
  const palette = useColorPalette();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex-1">
        <ImageBackground
          source={starBackground}
          className="absolute inset-0 w-full h-full"
          resizeMode="cover"
        />
        <ScrollView
          className="flex-1 p-5 pt-16"
          showsVerticalScrollIndicator={false}
        >
          {/* Modal Header */}
          <View className="flex-row justify-between items-center mb-6">
            <Text
              className="font-orbitron-semibold text-xl text-white"
              style={{
                textShadowColor: palette.statsAccentGlow,
                textShadowOffset: { width: 0, height: 0 },
                textShadowRadius: 10,
              }}
            >
              Analytics Charts
            </Text>
            <TouchableOpacity
              onPress={onClose}
              className="w-10 h-10 bg-white/10 rounded-full items-center justify-center"
              style={{
                borderWidth: 1,
                borderColor: palette.secondaryLightBorder,
              }}
            >
              <Ionicons name="close" size={20} color="white" />
            </TouchableOpacity>
          </View>

          {/* Rocks Chart */}
          <View
            style={{
              height: 220,
              borderRadius: 16,
              overflow: "hidden",
              marginBottom: 20,
            }}
          >
            {statsValues.length ? (
              <WebView
                originWhitelist={["*"]}
                source={{
                  html: totalRocksChart(
                    statsLabels,
                    statsValues,
                    palette.statsAccent,
                    palette.statsChartBorder,
                    palette.statsChartFill,
                  ),
                }}
                scrollEnabled={false}
                style={{ backgroundColor: "transparent" }}
              />
            ) : (
              <View
                className="flex-1 items-center justify-center rounded-2xl"
                style={{
                  backgroundColor: palette.statsBg,
                  borderWidth: 2,
                  borderColor: palette.statsBgBorder,
                }}
              >
                <Text className="font-orbitron-semibold text-white px-2">
                  No rock stats yet.
                </Text>
              </View>
            )}
          </View>

          {/* Work Time Chart */}
          <View
            style={{
              height: 220,
              borderRadius: 16,
              overflow: "hidden",
              marginBottom: 20,
            }}
          >
            {workTimes.length ? (
              <WebView
                originWhitelist={["*"]}
                source={{
                  html: cumulativeChart(
                    "Cumulative Work Time",
                    "Minutes",
                    workLabels,
                    workTimes,
                    palette.statsAccent,
                    palette.statsChartBorder,
                    palette.statsChartFill,
                  ),
                }}
                scrollEnabled={false}
                style={{ backgroundColor: "transparent" }}
              />
            ) : (
              <View
                className="flex-1 items-center justify-center rounded-2xl"
                style={{
                  backgroundColor: palette.statsBg,
                  borderWidth: 2,
                  borderColor: palette.statsBgBorder,
                }}
              >
                <Text className="font-orbitron-semibold text-white px-2">
                  No work sessions yet.
                </Text>
              </View>
            )}
          </View>

          {/* Play Time Chart */}
          <View
            style={{
              height: 220,
              borderRadius: 16,
              overflow: "hidden",
              marginBottom: 40,
            }}
          >
            {playTimes.length ? (
              <WebView
                originWhitelist={["*"]}
                source={{
                  html: cumulativeChart(
                    "Cumulative Play Time",
                    "Minutes",
                    playLabels,
                    playTimes,
                    palette.statsAccent,
                    palette.statsChartBorder,
                    palette.statsChartFill,
                  ),
                }}
                scrollEnabled={false}
                style={{ backgroundColor: "transparent" }}
              />
            ) : (
              <View
                className="flex-1 items-center justify-center rounded-2xl"
                style={{
                  backgroundColor: palette.statsBg,
                  borderWidth: 2,
                  borderColor: palette.statsBgBorder,
                }}
              >
                <Text className="font-orbitron-semibold text-white px-2">
                  No play sessions yet.
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}
