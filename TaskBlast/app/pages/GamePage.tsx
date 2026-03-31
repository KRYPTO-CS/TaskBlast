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
import { useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, getDoc, runTransaction } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";
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

type GodotSkinsPayload = {
  type: "skins";
  data1: string;
  data2: string;
  data3: string;
  data4: string;
  data5: string;
  bodyId: number;
  wingsId: number;
  gameId: number;
  planetId: number;
  colorBlindMode: number;
};

const COLOR_BLIND_MODE_MAP: Record<string, number> = {
  none: 0,
  deuteranopia: 1,
  protanopia: 2,
  tritanopia: 3,
};

const normalizeInt = (
  value: unknown,
  fallback: number,
  min?: number,
  max?: number,
): number => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  let result = Math.floor(parsed);
  if (typeof min === "number") {
    result = Math.max(min, result);
  }
  if (typeof max === "number") {
    result = Math.min(max, result);
  }
  return result;
};

const buildGodotSkinsPayload = ({
  bodyId,
  wingsId,
  gameId,
  planetId,
  colorBlindMode,
}: {
  bodyId: number;
  wingsId: number;
  gameId: number;
  planetId: number;
  colorBlindMode: string;
}): GodotSkinsPayload => {
  const safeBodyId = normalizeInt(bodyId, 0, 0);
  const safeWingsId = normalizeInt(wingsId, 1, 0);
  const safeGameId = normalizeInt(gameId, 0, 0);
  // SpaceShooter JSB multiplier mapping currently expects slots 1-9.
  const safePlanetId = normalizeInt(planetId, 1, 1, 9);
  const colorBlindModeValue = normalizeInt(
    COLOR_BLIND_MODE_MAP[colorBlindMode] ?? 0,
    0,
    0,
    3,
  );

  return {
    type: "skins",
    // Legacy positional contract used by JSB callback parsing.
    data1: String(safeBodyId),
    data2: String(safeWingsId),
    data3: String(safeGameId),
    data4: String(safePlanetId),
    data5: String(colorBlindModeValue),
    // Named aliases for future compatibility and diagnostics.
    bodyId: safeBodyId,
    wingsId: safeWingsId,
    gameId: safeGameId,
    planetId: safePlanetId,
    colorBlindMode: colorBlindModeValue,
  };
};

export default function GamePage() {
  const [loading, setLoading] = useState(true);
  const [isWebViewLoaded, setIsWebViewLoaded] = useState(false);
  const [isPlanetConfigLoaded, setIsPlanetConfigLoaded] = useState(false);
  const [isEquippedConfigLoaded, setIsEquippedConfigLoaded] = useState(false);
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
  const pendingSendTimeoutsRef = useRef<Array<ReturnType<typeof setTimeout>>>(
    [],
  );
  const sendMessageToGodotRef = useRef<(reason?: string) => void>(() => {});
  const scheduleConfigSendRef = useRef<
    (reason: string, delayMs: number) => void
  >(() => {});

  useEffect(() => {
    const loadActivePlanetId = async () => {
      try {
        const storedActivePlanetId = await AsyncStorage.getItem(
          ACTIVE_PLANET_STORAGE_KEY,
        );
        const parsed = normalizeInt(storedActivePlanetId, 1, 1, 9);
        if (storedActivePlanetId !== null) {
          setActivePlanetId(parsed);
        }
      } catch (err) {
        console.warn("Failed to load active planet id", err);
      } finally {
        setIsPlanetConfigLoaded(true);
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

      pendingSendTimeoutsRef.current.forEach((timeoutId) => {
        clearTimeout(timeoutId);
      });
      pendingSendTimeoutsRef.current = [];
    };
  }, []);

  const saveRocksToDatabase = async (score: number, highestTile: number) => {
    try {
      const result = await awardGameRewards({
        gameId,
        score,
        highestTile,
        playTimeMinutes: playTime,
        activePlanetId,
      });
      console.log(`Game rewards applied: +${result.awardedRocks ?? 0} rocks`);
      if (result.rewardDebug) {
        console.log("Reward debug:", result.rewardDebug);
      }
      // Write date metadata client-side (not protected fields, no cheat value)
      if (result.success) {
        try {
          const user = getAuth().currentUser;
          if (user) {
            const nowDate = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" });
            const db = getFirestore();
            const activeChild = await AsyncStorage.getItem("activeChildProfile");
            let profileRef;
            if (activeChild) {
              const { collection, query, where, getDocs } = await import("firebase/firestore");
              const childrenRef = collection(db, "users", user.uid, "children");
              const childSnap = await getDocs(query(childrenRef, where("username", "==", activeChild)));
              if (!childSnap.empty) profileRef = childSnap.docs[0].ref;
            } else {
              profileRef = doc(db, "users", user.uid);
            }
            if (profileRef) {
              await runTransaction(db, async (tx) => {
                const snap = await tx.get(profileRef!);
                const d = snap.exists() ? snap.data() : {};
                const rocksDateArr = Array.isArray(d.allTimeRocksDateArr) ? [...d.allTimeRocksDateArr] : [];
                const playDateArr = Array.isArray(d.playTimeDateArr) ? [...d.playTimeDateArr] : [];
                rocksDateArr.push(nowDate);
                playDateArr.push(nowDate);
                tx.set(profileRef!, { allTimeRocksDateArr: rocksDateArr, playTimeDateArr: playDateArr }, { merge: true });
              });
            }
          }
        } catch (dateErr) {
          console.warn("Failed to write date metadata", dateErr);
        }
      }
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
      } finally {
        setIsEquippedConfigLoaded(true);
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
              // For Asteroid Blaster and Space Swerve, always use the latest score as absolute value.
              // For other games, accumulate score deltas unless explicitly marked as absolute.
              const isSpaceShooterVariant = gameId === 0 || gameId === 1;
              const isAbsoluteScoreUpdate =
                isSpaceShooterVariant ||
                payload.scoreMode === "absolute" ||
                payload.isDelta === false;

              let nextScore: number;
              if (isAbsoluteScoreUpdate) {
                nextScore = Math.max(0, safeIncomingScore);
              } else {
                const prevScoreStr = await AsyncStorage.getItem(
                  GAME_SCORE_STORAGE_KEY,
                );
                const prevScore = prevScoreStr
                  ? Math.max(0, Math.floor(Number(prevScoreStr) || 0))
                  : 0;
                nextScore = Math.max(0, prevScore + safeIncomingScore);
              }

              await AsyncStorage.setItem(
                GAME_SCORE_STORAGE_KEY,
                String(nextScore),
              );
              console.log(
                "Persisted score:",
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
          sendMessageToGodotRef.current("godot-handshake");

          if (isSpaceSwerve) {
            if (skinSyncIntervalRef.current) {
              clearInterval(skinSyncIntervalRef.current);
              skinSyncIntervalRef.current = null;
            }
            skinSyncCountRef.current = 0;

            // Keep syncing briefly while the game scene fully initializes.
            skinSyncIntervalRef.current = setInterval(() => {
              skinSyncCountRef.current += 1;
              sendMessageToGodotRef.current(
                `godot-sync-${skinSyncCountRef.current}`,
              );
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
          scheduleConfigSendRef.current("godot-handshake-retry-1", 600);
          scheduleConfigSendRef.current("godot-handshake-retry-2", 1800);
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
    [isSpaceSwerve],
  );

  const sendMessageToGodot = useCallback(
    (reason = "manual") => {
      const isBridgeReady =
        isWebViewLoaded &&
        isPlanetConfigLoaded &&
        isEquippedConfigLoaded &&
        godotReadyRef.current;

      if (!isBridgeReady || !webviewRef.current) {
        console.log("Skipping skins send; bridge not ready yet.");
        console.log("Send reason:", reason);
        return;
      }

      const payload = buildGodotSkinsPayload({
        bodyId: equipped[0],
        wingsId: equipped[1],
        gameId,
        planetId: activePlanetId,
        colorBlindMode,
      });

      console.log("Sending skins message to Godot.");
      console.log("Send reason:", reason);
      console.log("Current equipped values:", equipped);
      console.log("Game ID:", gameId);
      console.log("Active planet ID:", activePlanetId);
      console.log("Colorblind mode:", colorBlindMode, "->", payload.data5);

      const payloadString = JSON.stringify(payload);

      // Path 1: standard RN WebView -> page message channel.
      webviewRef.current.postMessage(payloadString);

      // Path 2: direct fallback for pages that do not receive message events consistently.
      const escapedPayload = JSON.stringify(payloadString);
      webviewRef.current.injectJavaScript(
        `(() => {
          try {
            const raw = ${escapedPayload};
            const msg = JSON.parse(raw);
            if (typeof window.sendToGodot === "function") {
              window.sendToGodot(msg.type, msg.data1, msg.data2, msg.data3, msg.data4, msg.data5);
            }
            const enableCbCompatibility = ${isSpaceSwerve ? "true" : "false"};
            if (enableCbCompatibility && typeof window.cb === "function") {
              window.cb(msg.type, msg.data1, msg.data2, msg.data3, msg.data4, msg.data5);
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
    },
    [
      equipped,
      gameId,
      activePlanetId,
      colorBlindMode,
      isSpaceSwerve,
      isWebViewLoaded,
      isPlanetConfigLoaded,
      isEquippedConfigLoaded,
    ],
  );

  const scheduleConfigSend = useCallback(
    (reason: string, delayMs: number) => {
      const timeoutId = setTimeout(() => {
        sendMessageToGodot(reason);
      }, delayMs);
      pendingSendTimeoutsRef.current.push(timeoutId);
    },
    [sendMessageToGodot],
  );

  useEffect(() => {
    sendMessageToGodotRef.current = sendMessageToGodot;
  }, [sendMessageToGodot]);

  useEffect(() => {
    scheduleConfigSendRef.current = scheduleConfigSend;
  }, [scheduleConfigSend]);

  useEffect(() => {
    if (!loading && godotReadyRef.current) {
      sendMessageToGodot("config-updated");
    }
  }, [
    loading,
    isWebViewLoaded,
    isPlanetConfigLoaded,
    isEquippedConfigLoaded,
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
              setIsWebViewLoaded(true);
              setLoading(false);
              // Try once after the page is loaded in case handshake arrives late.
              scheduleConfigSend("webview-load-end", 250);
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
