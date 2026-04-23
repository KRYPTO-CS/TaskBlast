import React, { useEffect, useRef } from "react";
import { ActivityIndicator, View } from "react-native";
import { useRouter } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../server/firebase";
import { useAdmin } from "./context/AdminContext";
import { useActiveProfile } from "./context/ActiveProfileContext";
import { normalizeAdminEmail } from "./services/adminService";
import { Text } from "../TTS";

export default function Index() {
  const router = useRouter();
  const hasNavigatedRef = useRef(false);
  const { checkEligibility, clearAdminSession } = useAdmin();
  const { refreshProfile } = useActiveProfile();

  useEffect(() => {
    let isCancelled = false;

    const resolveInitialUser = async () => {
      if (typeof (auth as any).authStateReady === "function") {
        await (auth as any).authStateReady();
        return auth.currentUser;
      }

      return await new Promise<typeof auth.currentUser>((resolve) => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
          unsubscribe();
          resolve(user);
        });
      });
    };

    const bootstrap = async () => {
      try {
        const user = await resolveInitialUser();
        if (isCancelled || hasNavigatedRef.current) {
          return;
        }

        if (!user || !user.emailVerified) {
          if (user) {
            await clearAdminSession();
          }
          if (isCancelled) {
            return;
          }
          hasNavigatedRef.current = true;
          router.replace("/pages/Login");
          return;
        }

        const normalizedEmail = normalizeAdminEmail(user.email ?? "");
        const eligibleForAdmin = await checkEligibility(normalizedEmail);
        if (!eligibleForAdmin) {
          await clearAdminSession();
        }

        await refreshProfile();

        if (isCancelled) {
          return;
        }

        hasNavigatedRef.current = true;
        router.replace("/pages/HomeScreen");
      } catch (error) {
        console.error("Failed to restore app session", error);
        if (isCancelled) {
          return;
        }
        hasNavigatedRef.current = true;
        router.replace("/pages/Login");
      }
    };

    bootstrap();

    return () => {
      isCancelled = true;
    };
  }, [checkEligibility, clearAdminSession, refreshProfile, router]);

  return (
    <View className="flex-1 items-center justify-center bg-slate-950 px-6">
      <ActivityIndicator size="large" color="#a855f7" />
      <Text className="mt-4 text-center text-base text-white font-orbitron">
        Restoring your session...
      </Text>
    </View>
  );
}
