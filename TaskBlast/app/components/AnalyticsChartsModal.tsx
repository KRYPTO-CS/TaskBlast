import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  PanResponder,
  Platform,
  StyleSheet,
  View,
  TouchableOpacity,
  ImageBackground,
  ScrollView,
  Modal,
  useWindowDimensions,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Text } from "../../TTS";
import { Ionicons } from "@expo/vector-icons";
import { WebView } from "react-native-webview";
import { useColorPalette } from "../styles/colorBlindThemes";
import { useTranslation } from "react-i18next";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useAccessibility } from "../context/AccessibilityContext";

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
const EXPAND_HINT_KEY = "analyticsChartsExpandHintSeen";
const EXPAND_TOUCH_TARGET = 44;
const INLINE_CHART_HEIGHT = 280;

type ChartMode = "standard" | "cumulative";

interface ChartDescriptor {
  id: "rocks" | "work" | "play";
  labels: string[];
  values: number[];
  title: string;
  yAxisLabel: string;
  emptyKey: string;
  mode: ChartMode;
}

interface ChartHtmlParams {
  labels: string[];
  values: number[];
  chartColor: string;
  chartBorder: string;
  chartFill: string;
  title: string;
  yAxisLabel: string;
  xAxisLabel: string;
  mode: ChartMode;
  expanded?: boolean;
}

const INLINE_PREVIEW_POINTS = 5;

const toCumulativeValues = (values: number[]) => {
  let runningTotal = 0;
  return values.map((value) => {
    runningTotal += value;
    return runningTotal;
  });
};

const getRecentSeries = (
  labels: string[],
  values: number[],
  maxPoints: number,
) => {
  const pairCount = Math.min(labels.length, values.length);

  if (pairCount === 0) {
    return { labels: [], values: [] };
  }

  const alignedLabels = labels.slice(labels.length - pairCount);
  const alignedValues = values.slice(values.length - pairCount);
  const startIndex = Math.max(0, pairCount - maxPoints);

  return {
    labels: alignedLabels.slice(startIndex),
    values: alignedValues.slice(startIndex),
  };
};

const buildChartHtml = ({
  labels,
  values,
  chartColor,
  chartBorder,
  chartFill,
  title,
  yAxisLabel,
  xAxisLabel,
  mode,
  expanded = false,
}: ChartHtmlParams) =>
  `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
  <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;600;700&display=swap" rel="stylesheet" />
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <style>
    html, body { margin: 0; padding: 0; width: 100%; height: 100%; }
    body { background: transparent; font-family: 'Orbitron', sans-serif; color: #fff; }
    .wrap {
      position: relative;
      padding: ${expanded ? "10px" : "8px"};
      border: 3px solid ${chartBorder};
      border-radius: ${expanded ? "28px" : "22px"};
      height: 100%;
      box-sizing: border-box;
      background: rgba(2, 6, 23, 0.34);
      overflow: hidden;
    }
    .scroll-x {
      width: 100%;
      height: 100%;
      overflow-x: ${expanded ? "auto" : "hidden"};
      overflow-y: hidden;
      -webkit-overflow-scrolling: touch;
      scrollbar-width: thin;
      scrollbar-color: rgba(148, 163, 184, 0.7) transparent;
    }
    .scroll-x::-webkit-scrollbar { height: 6px; }
    .scroll-x::-webkit-scrollbar-thumb { border-radius: 99px; background: rgba(148, 163, 184, 0.7); }
    .inner { height: 100%; min-width: 100%; }
    canvas { width: 100% !important; height: 100% !important; }
  </style>
 </head>
 <body>
  <div class="wrap">
    <div class="scroll-x">
      <div id="inner" class="inner">
        <canvas id="c"></canvas>
      </div>
    </div>
  </div>
  <script>
    const labels = ${JSON.stringify(labels)};
    const values = ${JSON.stringify(mode === "cumulative" ? toCumulativeValues(values) : values)};
    const chartTitle = ${JSON.stringify(title)};
    const yAxisLabel = ${JSON.stringify(yAxisLabel)};
    const xAxisLabel = ${JSON.stringify(xAxisLabel)};
    const isExpanded = ${JSON.stringify(expanded)};
    const viewportWidth = Math.max(window.innerWidth || 320, 320);
    const dpr = Math.max(window.devicePixelRatio || 1, 1);
    const pointCount = labels.length;
    const denseData = pointCount > 8;
    const perPoint = isExpanded ? 82 : 64;
    const allowHorizontalScroll = isExpanded && denseData;
    const minChartWidth = allowHorizontalScroll
      ? Math.max(viewportWidth - 72, pointCount * perPoint)
      : Math.max(viewportWidth - 48, 260);

    const titleFontSize = Math.max(19, Math.min(27, Math.round((viewportWidth / 16.6) / Math.sqrt(dpr))));
    const axisFontSize = Math.max(15, Math.min(19, Math.round((viewportWidth / 22) / Math.sqrt(dpr))));
    const tickFontSize = Math.max(14, Math.min(17, Math.round((viewportWidth / 26) / Math.sqrt(dpr))));
    const tooltipFont = Math.max(13, Math.min(16, tickFontSize + 1));
    const maxTicksLimit = denseData
      ? Math.max(4, Math.min(isExpanded ? 10 : 7, Math.floor(viewportWidth / (isExpanded ? 68 : 78))))
      : Math.min(pointCount || 1, isExpanded ? 10 : 8);
    const xTickRotation = isExpanded ? (pointCount > 9 ? 34 : 0) : 30;

    const abbreviateLabel = (rawLabel) => {
      if (typeof rawLabel !== 'string') return rawLabel;
      if (rawLabel.length <= 9) return rawLabel;
      const compactDate = rawLabel.replace(/(\d{1,2})[\/-](\d{1,2})[\/-](\d{2,4})/, '$1/$2');
      if (compactDate.length <= 9) return compactDate;
      return compactDate.slice(0, 8) + '...';
    };

    const inner = document.getElementById('inner');
    inner.style.width = minChartWidth + 'px';

    const ctx = document.getElementById('c').getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 0, isExpanded ? 440 : 280);
    gradient.addColorStop(0, '${chartFill}');
    gradient.addColorStop(1, 'rgba(0,0,0,0.0)');

    Chart.defaults.font.family = 'Orbitron';
    Chart.defaults.font.size = tickFontSize;
    Chart.defaults.color = '#f8fafc';

    new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            data: values,
            borderColor: '${chartColor}',
            backgroundColor: gradient,
            borderWidth: isExpanded ? 5 : 4,
            tension: 0.33,
            pointRadius: isExpanded ? 4.8 : 3.8,
            pointHoverRadius: isExpanded ? 8 : 6,
            fill: true
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        normalized: true,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        plugins: {
          legend: { display: false },
          title: {
            display: true,
            text: chartTitle,
            color: '#ffffff',
            font: { family: 'Orbitron', size: titleFontSize, weight: '700' },
            padding: { top: isExpanded ? 8 : 6, bottom: isExpanded ? 10 : 24 },
          },
          tooltip: {
            titleFont: { family: 'Orbitron', size: tooltipFont, weight: '700' },
            bodyFont: { family: 'Orbitron', size: tooltipFont - 1, weight: '600' },
            bodyColor: '#ffffff',
            titleColor: '#ffffff',
            displayColors: false,
            callbacks: {
              title: (items) => items[0]?.label || '',
            },
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            border: {
              color: 'rgba(248, 250, 252, 0.75)',
              width: 1.4,
            },
            grid: {
              color: 'rgba(248, 250, 252, 0.20)',
            },
            ticks: {
              color: '#f8fafc',
              font: { family: 'Orbitron', size: tickFontSize, weight: '700' },
              padding: isExpanded ? 10 : 9,
              maxTicksLimit: Math.max(4, Math.min(7, maxTicksLimit)),
            },
            title: {
              display: true,
              text: yAxisLabel,
              color: '#ffffff',
              font: { family: 'Orbitron', size: axisFontSize, weight: '700' },
              padding: { top: 0, bottom: isExpanded ? 12 : 10 },
            },
            afterFit: (scale) => {
              scale.width += isExpanded ? 24 : 18;
            },
          },
          x: {
            border: {
              color: 'rgba(248, 250, 252, 0.75)',
              width: 1.4,
            },
            grid: {
              display: false,
            },
            ticks: {
              color: '#f8fafc',
              font: { family: 'Orbitron', size: tickFontSize, weight: '700' },
              maxRotation: xTickRotation,
              minRotation: xTickRotation,
              autoSkip: true,
              maxTicksLimit,
              padding: isExpanded ? 10 : 8,
              callback: (value) => abbreviateLabel(labels[value] ?? value),
            },
            title: {
              display: true,
              text: xAxisLabel,
              color: '#ffffff',
              font: { family: 'Orbitron', size: axisFontSize, weight: '700' },
            },
          },
        }
      }
    });
  </script>
 </body>
</html>
`.trim();

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
  const { reduceMotion, textScale } = useAccessibility();
  const { t } = useTranslation();
  const [expandedChart, setExpandedChart] = useState<ChartDescriptor | null>(
    null,
  );
  const [showExpandHint, setShowExpandHint] = useState(false);
  const [isExpandedLoading, setIsExpandedLoading] = useState(true);

  const panelOffsetY = useSharedValue(0);
  const panelOpacity = useSharedValue(1);
  const dragY = useSharedValue(0);

  const chartDescriptors = useMemo<ChartDescriptor[]>(
    () => [
      {
        id: "rocks",
        labels: statsLabels,
        values: statsValues,
        title: t("AnalyticsChartsModal.charts.totalRocks.title"),
        yAxisLabel: t("AnalyticsChartsModal.charts.totalRocks.yAxis"),
        emptyKey: "AnalyticsChartsModal.empty.noRockStats",
        mode: "standard",
      },
      {
        id: "work",
        labels: workLabels,
        values: workTimes,
        title: t("AnalyticsChartsModal.charts.workTime.title"),
        yAxisLabel: t("AnalyticsChartsModal.charts.workTime.yAxis"),
        emptyKey: "AnalyticsChartsModal.empty.noWorkSessions",
        mode: "cumulative",
      },
      {
        id: "play",
        labels: playLabels,
        values: playTimes,
        title: t("AnalyticsChartsModal.charts.playTime.title"),
        yAxisLabel: t("AnalyticsChartsModal.charts.playTime.yAxis"),
        emptyKey: "AnalyticsChartsModal.empty.noPlaySessions",
        mode: "cumulative",
      },
    ],
    [playLabels, playTimes, statsLabels, statsValues, t, workLabels, workTimes],
  );

  const closeExpanded = useCallback(async () => {
    setExpandedChart(null);
    setIsExpandedLoading(true);
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      // Haptics are optional on unsupported devices.
    }
  }, []);

  const hideHint = useCallback(async () => {
    setShowExpandHint(false);
    try {
      await AsyncStorage.setItem(EXPAND_HINT_KEY, "true");
    } catch {
      // Ignore storage write failures for non-critical UX hints.
    }
  }, []);

  const openExpanded = useCallback(
    async (chart: ChartDescriptor) => {
      setExpandedChart(chart);
      setIsExpandedLoading(true);
      if (showExpandHint) {
        await hideHint();
      }
      try {
        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success,
        );
      } catch {
        // Haptics are optional on unsupported devices.
      }
    },
    [hideHint, showExpandHint],
  );

  useEffect(() => {
    let isMounted = true;

    const loadHintState = async () => {
      if (!visible) {
        if (isMounted) {
          setShowExpandHint(false);
        }
        return;
      }

      try {
        const hasSeenHint = await AsyncStorage.getItem(EXPAND_HINT_KEY);
        if (isMounted) {
          setShowExpandHint(!hasSeenHint);
        }
      } catch {
        if (isMounted) {
          setShowExpandHint(true);
        }
      }
    };

    loadHintState();
    return () => {
      isMounted = false;
    };
  }, [visible]);

  useEffect(() => {
    if (!showExpandHint) {
      return;
    }

    const timer = setTimeout(() => {
      hideHint();
    }, 5000);

    return () => clearTimeout(timer);
  }, [hideHint, showExpandHint]);

  useEffect(() => {
    const isExpandedOpen = Boolean(expandedChart);
    const duration = reduceMotion ? 80 : 220;

    panelOpacity.value = withTiming(isExpandedOpen ? 1 : 0, {
      duration,
      easing: Easing.out(Easing.cubic),
    });

    panelOffsetY.value = withTiming(isExpandedOpen ? 0 : 24, {
      duration,
      easing: Easing.out(Easing.cubic),
    });
  }, [expandedChart, panelOffsetY, panelOpacity, reduceMotion]);

  const animatedBackdropStyle = useAnimatedStyle(() => ({
    opacity: panelOpacity.value * 0.82,
  }));

  const animatedPanelStyle = useAnimatedStyle(() => ({
    opacity: panelOpacity.value,
    transform: [
      { translateY: panelOffsetY.value + dragY.value },
      { scale: 0.98 + panelOpacity.value * 0.02 },
    ],
  }));

  const closeExpandedFromGesture = useCallback(() => {
    closeExpanded();
  }, [closeExpanded]);

  const swipeDownResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) => {
          const verticalPriority =
            Math.abs(gestureState.dy) > Math.abs(gestureState.dx) * 1.15;
          return verticalPriority && gestureState.dy > 8;
        },
        onPanResponderMove: (_, gestureState) => {
          if (gestureState.dy > 0) {
            dragY.value = gestureState.dy;
          }
        },
        onPanResponderRelease: (_, gestureState) => {
          const shouldDismiss =
            gestureState.dy > 140 ||
            (gestureState.dy > 60 && gestureState.vy > 0.9);

          if (shouldDismiss) {
            closeExpandedFromGesture();
          }

          dragY.value = withTiming(0, { duration: 150 });
        },
        onPanResponderTerminate: () => {
          dragY.value = withTiming(0, { duration: 150 });
        },
      }),
    [closeExpandedFromGesture, dragY],
  );

  const xAxisLabel = t("AnalyticsChartsModal.charts.common.date");
  const closeExpandedLabel = t("AnalyticsChartsModal.actions.closeExpanded", {
    defaultValue: t("Tasks.close", { defaultValue: "Close" }),
  });
  const closeHintFallback = `${closeExpandedLabel} (X)`;
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const expandedChartHeight = Math.max(
    Platform.OS === "ios" ? 360 : 320,
    Math.min(
      Math.floor(screenHeight * (Platform.OS === "ios" ? 0.78 : 0.72)),
      Platform.OS === "ios" ? 700 : 560,
    ),
  );
  const closeMainModal = useCallback(() => {
    if (expandedChart) {
      closeExpanded();
      return;
    }
    onClose();
  }, [closeExpanded, expandedChart, onClose]);

  const renderChartCard = (
    chart: ChartDescriptor,
    marginBottom: number,
    showHintForCard: boolean,
  ) => {
    const previewSeries = getRecentSeries(
      chart.labels,
      chart.values,
      INLINE_PREVIEW_POINTS,
    );
    const hasData = previewSeries.values.length > 0;

    return (
      <View
        key={chart.id}
        style={{
          height: INLINE_CHART_HEIGHT,
          borderRadius: 16,
          overflow: "hidden",
          marginBottom,
          position: "relative",
        }}
      >
        {hasData ? (
          <>
            <WebView
              testID={`inline-chart-webview-${chart.id}`}
              originWhitelist={["*"]}
              pointerEvents="none"
              javaScriptEnabled={true}
              domStorageEnabled={false}
              startInLoadingState={false}
              overScrollMode={Platform.OS === "android" ? "never" : undefined}
              source={{
                html: buildChartHtml({
                  labels: previewSeries.labels,
                  values: previewSeries.values,
                  chartColor: palette.statsAccent,
                  chartBorder: palette.statsChartBorder,
                  chartFill: palette.statsChartFill,
                  title: chart.title,
                  yAxisLabel: chart.yAxisLabel,
                  xAxisLabel,
                  mode: chart.mode,
                }),
              }}
              scrollEnabled={false}
              bounces={false}
              showsVerticalScrollIndicator={false}
              showsHorizontalScrollIndicator={false}
              style={{ backgroundColor: "transparent" }}
              onError={(syntheticEvent) => {
                // Handle WebView errors silently on both platforms
                console.warn(
                  "Chart WebView error:",
                  syntheticEvent.nativeEvent,
                );
              }}
            />
            {Platform.OS === "ios" ? (
              <TouchableOpacity
                testID={`expand-chart-overlay-${chart.id}`}
                accessibilityRole="button"
                accessibilityLabel={t("AnalyticsChartsModal.actions.expand", {
                  defaultValue: "Expand chart",
                })}
                onPress={() => openExpanded(chart)}
                activeOpacity={1}
                style={{
                  ...StyleSheet.absoluteFillObject,
                  zIndex: 2,
                }}
              />
            ) : null}
            <TouchableOpacity
              testID={`expand-chart-${chart.id}`}
              accessibilityRole="button"
              accessibilityLabel={t("AnalyticsChartsModal.actions.expand", {
                defaultValue: "Expand chart",
              })}
              onPress={() => openExpanded(chart)}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              style={{
                position: "absolute",
                bottom: 8,
                right: 8,
                width: EXPAND_TOUCH_TARGET,
                height: EXPAND_TOUCH_TARGET,
                borderRadius: 22,
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: "rgba(2, 6, 23, 0.78)",
                borderColor: "rgba(248, 250, 252, 0.72)",
                borderWidth: 1,
                zIndex: 3,
              }}
            >
              <Ionicons name="expand" size={22} color="#ffffff" />
            </TouchableOpacity>

            {showHintForCard && (
              <View
                style={{
                  position: "absolute",
                  top: 56,
                  right: 8,
                  maxWidth: Math.min(screenWidth * 0.62, 210),
                  paddingHorizontal: 10,
                  paddingVertical: 8,
                  borderRadius: 10,
                  backgroundColor: "rgba(15, 23, 42, 0.9)",
                  borderWidth: 1,
                  borderColor: palette.secondaryLightBorder,
                }}
              >
                <Text
                  className="font-orbitron-semibold text-white"
                  style={{ fontSize: 12 * textScale }}
                >
                  {t("AnalyticsChartsModal.hints.expand", {
                    defaultValue: "Tap to focus this chart",
                  })}
                </Text>
              </View>
            )}
          </>
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
              {t(chart.emptyKey)}
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={closeMainModal}
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
          contentContainerStyle={{ paddingBottom: 56 }}
          scrollEnabled={!expandedChart}
        >
          <View className="flex-row justify-between items-center mb-6">
            <Text
              className="font-orbitron-semibold text-xl text-white"
              style={{
                textShadowColor: palette.statsAccentGlow,
                textShadowOffset: { width: 0, height: 0 },
                textShadowRadius: 10,
              }}
            >
              {t("AnalyticsChartsModal.title")}
            </Text>
            <TouchableOpacity
              testID="close-analytics-modal"
              accessibilityRole="button"
              accessibilityLabel={t("AnalyticsChartsModal.actions.close", {
                defaultValue: "Close charts",
              })}
              onPress={closeMainModal}
              className="w-10 h-10 bg-white/10 rounded-full items-center justify-center"
              style={{
                borderWidth: 1,
                borderColor: palette.secondaryLightBorder,
              }}
            >
              <Ionicons name="close" size={20} color="white" />
            </TouchableOpacity>
          </View>

          {chartDescriptors.map((chart, index) =>
            renderChartCard(
              chart,
              index === chartDescriptors.length - 1 ? 40 : 20,
              index === 0 && showExpandHint,
            ),
          )}
        </ScrollView>

        {expandedChart ? (
          <View
            style={{
              ...StyleSheet.absoluteFillObject,
              justifyContent: "center",
            }}
            testID="expanded-chart-overlay"
          >
          <Animated.View
            style={[
              {
                ...StyleSheet.absoluteFillObject,
                backgroundColor: "#020617",
              },
              animatedBackdropStyle,
            ]}
          />

          <SafeAreaView
            edges={["top", "bottom"]}
            style={{ flex: 1, justifyContent: "center", paddingHorizontal: 12 }}
          >
            <Animated.View
              {...swipeDownResponder.panHandlers}
              style={[
                {
                  maxHeight: Math.floor(screenHeight * 0.94),
                  backgroundColor: "rgba(15, 23, 42, 0.97)",
                  borderRadius: 24,
                  borderWidth: 1,
                  borderColor: palette.secondaryLightBorder,
                  paddingHorizontal: 12,
                  paddingTop: 12,
                  paddingBottom: 10,
                  shadowColor: "#000",
                  shadowOpacity: 0.35,
                  shadowRadius: 20,
                  elevation: 12,
                },
                animatedPanelStyle,
              ]}
            >
              <View className="flex-row items-center justify-between mb-3">
                <Text
                  className="font-orbitron-semibold text-white"
                  style={{ fontSize: 18 * textScale, flex: 1, paddingRight: 8 }}
                >
                  {expandedChart?.title ?? ""}
                </Text>

                <TouchableOpacity
                  testID="close-expanded-chart"
                  accessibilityRole="button"
                  accessibilityLabel={t(
                    "AnalyticsChartsModal.actions.closeExpanded",
                    { defaultValue: "Close expanded chart" },
                  )}
                  onPress={closeExpanded}
                  style={{
                    width: EXPAND_TOUCH_TARGET,
                    height: EXPAND_TOUCH_TARGET,
                    borderRadius: 22,
                    justifyContent: "center",
                    alignItems: "center",
                    backgroundColor: "rgba(30, 41, 59, 0.94)",
                    borderWidth: 1,
                    borderColor: palette.secondaryLightBorder,
                  }}
                >
                  <Ionicons name="close" size={24} color="#ffffff" />
                </TouchableOpacity>
              </View>

              <View
                style={{
                  height: expandedChartHeight,
                  borderRadius: 18,
                  overflow: "hidden",
                  backgroundColor: "rgba(2, 6, 23, 0.25)",
                }}
              >
                {expandedChart ? (
                  <>
                    <WebView
                      key={`expanded-chart-${expandedChart.id}-${Math.floor(screenWidth)}x${Math.floor(screenHeight)}`}
                      testID="expanded-chart-webview"
                      originWhitelist={["*"]}
                      javaScriptEnabled={true}
                      domStorageEnabled={false}
                      startInLoadingState={true}
                      overScrollMode={
                        Platform.OS === "android" ? "always" : undefined
                      }
                      source={{
                        html: buildChartHtml({
                          labels: expandedChart.labels,
                          values: expandedChart.values,
                          chartColor: palette.statsAccent,
                          chartBorder: palette.statsChartBorder,
                          chartFill: palette.statsChartFill,
                          title: expandedChart.title,
                          yAxisLabel: expandedChart.yAxisLabel,
                          xAxisLabel,
                          mode: expandedChart.mode,
                          expanded: true,
                        }),
                      }}
                      nestedScrollEnabled={Platform.OS === "ios"}
                      scrollEnabled
                      bounces={Platform.OS === "ios"}
                      showsVerticalScrollIndicator={false}
                      showsHorizontalScrollIndicator={true}
                      onLoadEnd={() => setIsExpandedLoading(false)}
                      onError={(syntheticEvent) => {
                        // Handle WebView errors on both platforms
                        console.warn(
                          "Expanded chart WebView error:",
                          syntheticEvent.nativeEvent,
                        );
                        setIsExpandedLoading(false);
                      }}
                      style={{ flex: 1, backgroundColor: "transparent" }}
                    />

                    {isExpandedLoading && (
                      <View
                        style={{
                          position: "absolute",
                          inset: 0,
                          justifyContent: "center",
                          alignItems: "center",
                          backgroundColor: "rgba(2, 6, 23, 0.4)",
                        }}
                      >
                        <ActivityIndicator
                          size={Platform.OS === "ios" ? "small" : "large"}
                          color="#ffffff"
                        />
                      </View>
                    )}
                  </>
                ) : null}
              </View>

              <Text
                className="font-orbitron text-white mt-3 text-center"
                style={{
                  fontSize: 12 * textScale,
                  opacity: 0.86,
                }}
              >
                {t("AnalyticsChartsModal.hints.swipeDown", {
                  defaultValue: closeHintFallback,
                })}
              </Text>
            </Animated.View>
          </SafeAreaView>
          </View>
        ) : null}
      </View>
    </Modal>
  );
}
