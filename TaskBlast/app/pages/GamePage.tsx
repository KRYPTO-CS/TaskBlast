import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
  useContext,
} from "react";
import {
  ActivityIndicator,
  StyleSheet,
  View,
  Pressable,
  TouchableOpacity,
} from "react-native";
import { Text } from "../../TTS";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { AccessibilityContext } from "../context/AccessibilityContext";
import {
  ACTIVE_PLANET_STORAGE_KEY,
  GAME_HIGHEST_TILE_STORAGE_KEY,
  GAME_SCORE_STORAGE_KEY,
  getGameDefinition,
} from "../services/gameRegistry";
import { awardGameRewards } from "../services/economyService";

let WebView: any = null;
try {
  WebView = require("react-native-webview").WebView;
} catch (e) {
  WebView = null;
}

export default function GamePage() {
  const [loading, setLoading] = useState(true);
  const webviewRef = useRef<any>(null);
  const router = useRouter();
  const params = useLocalSearchParams();
  const accessibilityContext = useContext(AccessibilityContext);
  const colorBlindMode = accessibilityContext?.colorBlindMode || "none";

  const playTime = params.playTime ? parseInt(params.playTime as string) : 5;
  const taskId = params.taskId as string;
  const gameId = params.gameId ? parseInt(params.gameId as string) : 0;
  const selectedGame = getGameDefinition(gameId);
  const defaultGame = getGameDefinition(0);
  const gameUrl =
    selectedGame.url ??
    defaultGame.url ??
    "https://krypto-cs.github.io/SpaceShooter/";
  const isSpaceSwerve = gameId === 1;

  const [timeLeft, setTimeLeft] = useState(playTime * 60); // Convert minutes to seconds
  const [equipped, setEquipped] = useState<number[]>([0, 1]);
  const [activePlanetId, setActivePlanetId] = useState<number>(1);
  const tapCount = useRef(0);
  const tapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rewardsProcessedRef = useRef(false);
  const scorePersistQueueRef = useRef<Promise<void>>(Promise.resolve());
  const godotReadyRef = useRef(false);
  const skinSyncIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );
  const skinSyncCountRef = useRef(0);

  useEffect(() => {
    const loadActivePlanetId = async () => {
      try {
        const storedActivePlanetId = await AsyncStorage.getItem(
          ACTIVE_PLANET_STORAGE_KEY,
        );
        const parsed = Number(storedActivePlanetId);
        if (Number.isFinite(parsed) && parsed >= 1) {
          setActivePlanetId(Math.floor(parsed));
        }
      } catch (err) {
        console.warn("Failed to load active planet id", err);
      }
    };

    loadActivePlanetId();
  }, []);

  useEffect(() => {
    // Start each game session with a clean temporary score/tile cache.
    scorePersistQueueRef.current = scorePersistQueueRef.current
      .then(async () => {
        rewardsProcessedRef.current = false;
        await AsyncStorage.removeItem(GAME_SCORE_STORAGE_KEY);
        await AsyncStorage.removeItem(GAME_HIGHEST_TILE_STORAGE_KEY);
        console.log("Reset game score cache for new session");
      })
      .catch((err) => {
        console.warn("Failed to reset game score cache", err);
      });
  }, []);

  useEffect(() => {
    return () => {
      if (skinSyncIntervalRef.current) {
        clearInterval(skinSyncIntervalRef.current);
        skinSyncIntervalRef.current = null;
      }
    };
  }, []);

  const saveRocksToDatabase = async (score: number, highestTile: number) => {
    try {
      const result = await awardGameRewards({
        gameId,
        score,
        highestTile,
        playTimeMinutes: playTime,
      });
      console.log(`Game rewards applied: +${result.awardedRocks ?? 0} rocks`);
    } catch (err) {
      console.warn("Failed to save rocks to database", err);
    }
  };

  const processGameRewards = useCallback(async () => {
    if (rewardsProcessedRef.current) {
      return;
    }
    rewardsProcessedRef.current = true;

    // Flush queued score writes so final rewards use the latest value.
    await scorePersistQueueRef.current;

    const scoreStr = await AsyncStorage.getItem(GAME_SCORE_STORAGE_KEY);
    const highestTileStr = await AsyncStorage.getItem(
      GAME_HIGHEST_TILE_STORAGE_KEY,
    );

    const score = scoreStr ? Math.max(0, Math.floor(Number(scoreStr))) : 0;
    const highestTile = highestTileStr
      ? Math.max(0, Math.floor(Number(highestTileStr)))
      : 0;
    await saveRocksToDatabase(score, highestTile);

    await AsyncStorage.removeItem(GAME_SCORE_STORAGE_KEY);
    await AsyncStorage.removeItem(GAME_HIGHEST_TILE_STORAGE_KEY);
  }, [gameId]);

  // Load equipped items from Firebase
  useEffect(() => {
    const loadEquippedItems = async () => {
      try {
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) return;

        const db = getFirestore();
        const userRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (userData.equipped && Array.isArray(userData.equipped)) {
            setEquipped(userData.equipped);
            console.log("Equipped body ID:", String(userData.equipped[0]));
            console.log("Equipped wings ID:", String(userData.equipped[1]));
          }
        }
      } catch (err) {
        console.warn("Failed to load equipped items", err);
      }
    };

    loadEquippedItems();
  }, []);

  const handleBackPress = async () => {
    // Save score before going back
    try {
      await processGameRewards();
    } catch (err) {
      console.warn("Failed to process game score on back", err);
    }
    router.back();
  };

  // Game timer logic
  useEffect(() => {
    if (timeLeft <= 0) {
      // Get final score from AsyncStorage and save to database
      (async () => {
        try {
          await processGameRewards();
        } catch (err) {
          console.warn("Failed to process game score", err);
        }
      })();

      router.back();
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLeft, processGameRewards, router]);

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const handleTimerTap = () => {
    tapCount.current += 1;

    // Clear existing timer
    if (tapTimer.current) {
      clearTimeout(tapTimer.current);
    }

    // Check if triple tap achieved
    if (tapCount.current === 3) {
      // Admin bypass: set timer to 3 seconds
      setTimeLeft(3);
      tapCount.current = 0;
    } else {
      // Reset tap count after 500ms if not triple tapped
      tapTimer.current = setTimeout(() => {
        tapCount.current = 0;
      }, 500);
    }
  };

  const handleMessage = useCallback(
    (event: any) => {
      try {
        const payload = JSON.parse(event.nativeEvent.data);

        if (payload.type === "scoreUpdate") {
          console.log("Score from Godot:", payload);
          // Persist the score so HomeScreen can read it later. Temporary.
          const incomingScore = Number(payload.score);
          const safeIncomingScore = Number.isFinite(incomingScore)
            ? Math.floor(incomingScore)
            : 0;

          scorePersistQueueRef.current = scorePersistQueueRef.current
            .then(async () => {
              const prevScoreStr = await AsyncStorage.getItem(
                GAME_SCORE_STORAGE_KEY,
              );
              const prevScore = prevScoreStr
                ? Math.max(0, Math.floor(Number(prevScoreStr) || 0))
                : 0;

              // Accumulate score deltas from the game; only treat as absolute if explicitly marked.
              const isAbsoluteScoreUpdate =
                payload.scoreMode === "absolute" ||
                payload.isDelta === false;
              const nextScore = isAbsoluteScoreUpdate
                ? Math.max(0, safeIncomingScore)
                : Math.max(0, prevScore + safeIncomingScore);

              await AsyncStorage.setItem(
                GAME_SCORE_STORAGE_KEY,
                String(nextScore),
              );
              console.log(
                "Persisted cumulative score:",
                nextScore,
                "(mode:",
                isAbsoluteScoreUpdate ? "absolute" : "delta",
                ")",
              );

              const highestTile = Number(
                payload.highestTile ?? payload.maxTile ?? payload.bestTile ?? 0,
              );
              if (highestTile > 0) {
                await AsyncStorage.setItem(
                  GAME_HIGHEST_TILE_STORAGE_KEY,
                  String(Math.floor(highestTile)),
                );
              }
            })
            .catch((err) => {
              console.warn("Failed to persist game score", err);
            });
        } else if (payload.type === "tileUpdate") {
          (async () => {
            try {
              const tile = Number(payload.highestTile ?? payload.maxTile ?? 0);
              if (tile > 0) {
                await AsyncStorage.setItem(
                  GAME_HIGHEST_TILE_STORAGE_KEY,
                  String(Math.floor(tile)),
                );
              }
            } catch (err) {
              console.warn("Failed to persist game tile", err);
            }
          })();
        } else if (payload.type === "testMessage") {
          console.log("Godot Initialized");
          godotReadyRef.current = true;
          sendMessageToGodot("godot-handshake");

          if (isSpaceSwerve) {
            if (skinSyncIntervalRef.current) {
              clearInterval(skinSyncIntervalRef.current);
              skinSyncIntervalRef.current = null;
            }
            skinSyncCountRef.current = 0;

            // Keep syncing briefly while the game scene fully initializes.
            skinSyncIntervalRef.current = setInterval(() => {
              skinSyncCountRef.current += 1;
              sendMessageToGodot(`godot-sync-${skinSyncCountRef.current}`);
              if (
                skinSyncCountRef.current >= 8 &&
                skinSyncIntervalRef.current
              ) {
                clearInterval(skinSyncIntervalRef.current);
                skinSyncIntervalRef.current = null;
              }
            }, 1500);
          }

          // Some game scenes apply skins only after entities spawn.
          setTimeout(() => sendMessageToGodot("godot-handshake-retry-1"), 600);
          setTimeout(() => sendMessageToGodot("godot-handshake-retry-2"), 1800);
        } else if (payload.type === "ack") {
          console.log("Godot ack:", payload);
        } else if (payload.type === "ackInjected") {
          console.log("Godot injected ack:", payload);
        } else if (payload.type === "bridgeError") {
          console.warn("Godot bridge error:", payload);
        } else {
          console.log("Other message:", payload);
        }
      } catch (err) {
        console.warn("Invalid message from WebView:", event.nativeEvent.data);
      }
    },
    [equipped, gameId, colorBlindMode, activePlanetId, isSpaceSwerve],
  );

  const sendMessageToGodot = useCallback(
    (reason = "manual") => {
      // Map colorBlindMode to numeric value: none=0, deuteranopia=1, protanopia=2, tritanopia=3
      const colorBlindModeMap: Record<string, number> = {
        none: 0,
        deuteranopia: 1,
        protanopia: 2,
        tritanopia: 3,
      };
      const colorBlindModeValue = colorBlindModeMap[colorBlindMode] ?? 0;

      const bodyId = Number.isFinite(equipped[0]) ? Math.floor(equipped[0]) : 0;
      const wingsId = Number.isFinite(equipped[1])
        ? Math.floor(equipped[1])
        : 1;
      const safeGameId = Number.isFinite(gameId) ? Math.floor(gameId) : 0;
      const safePlanetId = Number.isFinite(activePlanetId)
        ? Math.floor(activePlanetId)
        : 1;

      console.log("Sending skins message to Godot.");
      console.log("Send reason:", reason);
      console.log("Current equipped values:", equipped);
      console.log("Game ID:", gameId);
      console.log("Active planet ID:", activePlanetId);
      console.log(
        "Colorblind mode:",
        colorBlindMode,
        "->",
        colorBlindModeValue,
      );

      const sendPayload = (type: string) => {
        const payload = {
          type,
          // Keep legacy positional fields as strings for strict Godot comparisons.
          data1: String(bodyId),
          data2: String(wingsId),
          data3: String(safeGameId),
          data4: String(safePlanetId),
          data5: String(colorBlindModeValue),
          // Named aliases for newer contracts.
          bodyId,
          wingsId,
          gameId: safeGameId,
          planetId: safePlanetId,
          colorBlindMode: colorBlindModeValue,
        };

        const payloadString = JSON.stringify(payload);

        // Path 1: standard RN WebView -> page message channel.
        webviewRef.current?.postMessage(payloadString);

        // Path 2: direct fallback for pages that do not receive message events consistently.
        const escapedPayload = JSON.stringify(payloadString);
        webviewRef.current?.injectJavaScript(
          `(() => {
          try {
            const raw = ${escapedPayload};
            const msg = JSON.parse(raw);
            if (typeof window.sendToGodot === "function") {
              window.sendToGodot(msg.type, msg.data1, msg.data2, msg.data3, msg.data4, msg.data5);
            }
            const enableCbCompatibility = ${isSpaceSwerve ? "true" : "false"};
            if (enableCbCompatibility && typeof window.cb === "function") {
              // Compatibility calls for different callback signatures used by Godot scenes.
              window.cb(msg.type, msg.data1, msg.data2, msg.data3, msg.data4, msg.data5);
              window.cb(msg.type, Number(msg.data1), Number(msg.data2), Number(msg.data3), Number(msg.data4), Number(msg.data5));
              window.cb(msg.type, msg.data1, msg.data2);
              window.cb(msg.type, Number(msg.data1), Number(msg.data2));
              window.cb(msg.data1, msg.data2);
              window.cb(Number(msg.data1), Number(msg.data2));
            }
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: "ackInjected", received: msg.type }));
            }
          } catch (e) {
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: "bridgeError", message: String(e) }));
            }
          }
        })(); true;`,
        );
      };

      // Both Space Swerve and Asteroid Blaster use the same stable contract.
      sendPayload("skins");
    },
    [equipped, gameId, activePlanetId, colorBlindMode],
  );

  useEffect(() => {
    if (!loading && godotReadyRef.current) {
      sendMessageToGodot("config-updated");
    }
  }, [
    loading,
    equipped,
    gameId,
    activePlanetId,
    colorBlindMode,
    sendMessageToGodot,
  ]);

  if (!WebView) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.title}>WebView not installed</Text>
          <Text style={styles.message}>
            This screen requires the `react-native-webview` package. Install it
            with your package manager and rebuild the app:
          </Text>
          <Text style={styles.command}>npm install react-native-webview</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View testID="safe-area-view" style={{ flex: 1 }}>
        <View style={styles.header} testID="game-header">
          <Pressable
            onPress={handleBackPress}
            style={styles.backButton}
            testID="back-button"
          >
            <Text style={styles.backText}>{"< Back"}</Text>
          </Pressable>
          <TouchableOpacity
            onPress={handleTimerTap}
            activeOpacity={1}
            style={styles.timerContainer}
          >
            <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
          </TouchableOpacity>
          <View style={styles.rightButton} />
        </View>
        <View style={styles.container}>
          {loading && (
            <View
              style={styles.loader}
              pointerEvents="none"
              testID="loading-indicator"
            >
              <ActivityIndicator size="large" />
            </View>
          )}
          <WebView
            ref={webviewRef}
            source={{ uri: gameUrl }}
            testID="webview"
            style={styles.webview}
            onLoadEnd={() => {
              setLoading(false);
              // Try once after the page is loaded in case handshake arrives late.
              setTimeout(() => sendMessageToGodot("webview-load-end"), 250);
            }}
            startInLoadingState
            allowsInlineMediaPlayback
            mediaPlaybackRequiresUserAction={false}
            javaScriptEnabled={true}
            onMessage={handleMessage}
            originWhitelist={["*"]}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 12,
  },
  message: {
    textAlign: "center",
    marginBottom: 12,
  },
  command: {
    fontFamily: "monospace",
    backgroundColor: "#111",
    color: "#fff",
    padding: 8,
    marginTop: 6,
    width: "100%",
  },
  webview: {
    flex: 1,
    backgroundColor: "#000",
  },
  header: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    backgroundColor: "#000",
    zIndex: 20,
  },
  backButton: {
    width: 80,
    justifyContent: "center",
  },
  backText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
  rightButton: {
    width: 80,
    justifyContent: "center",
    alignItems: "flex-end",
  },
  rightText: {
    color: "#fff",
    fontSize: 16,
  },
  timerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  timerText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
  loader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
});
