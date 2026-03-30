import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../server/firebase";
import {
  checkAdminEligibility,
  disableAdminSession as disableAdminSessionService,
  normalizeAdminEmail,
  verifyAdmin as verifyAdminService,
} from "../services/adminService";

interface AdminSessionState {
  adminEmail: string;
  role: string;
  sessionExpiresAt: number;
}

interface AdminContextType {
  adminEmail: string | null;
  role: string | null;
  isAdminEligible: boolean;
  isAdminVerified: boolean;
  sessionExpiresAt: number | null;
  isLoading: boolean;
  error: string | null;
  checkEligibility: (email: string) => Promise<boolean>;
  verifyAdminPin: (email: string, pin: string) => Promise<boolean>;
  clearAdminSession: () => Promise<void>;
}

const ADMIN_SESSION_STORAGE_KEY = "@taskblast_admin_session";

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [adminEmail, setAdminEmail] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [isAdminEligible, setIsAdminEligible] = useState(false);
  const [isAdminVerified, setIsAdminVerified] = useState(false);
  const [sessionExpiresAt, setSessionExpiresAt] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const clearAdminSession = useCallback(async () => {
    if (auth.currentUser) {
      try {
        await disableAdminSessionService();
      } catch (disableError) {
        console.warn("Failed to disable backend admin session", disableError);
      }
    }

    await AsyncStorage.removeItem(ADMIN_SESSION_STORAGE_KEY);
    setAdminEmail(null);
    setRole(null);
    setSessionExpiresAt(null);
    setIsAdminEligible(false);
    setIsAdminVerified(false);
    setError(null);
  }, []);

  const loadStoredSession = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(ADMIN_SESSION_STORAGE_KEY);
      if (!raw) {
        return;
      }

      const parsed: AdminSessionState = JSON.parse(raw);
      const now = Date.now();

      if (!parsed.sessionExpiresAt || parsed.sessionExpiresAt <= now) {
        await clearAdminSession();
        return;
      }

      setAdminEmail(parsed.adminEmail);
      setRole(parsed.role);
      setSessionExpiresAt(parsed.sessionExpiresAt);
      setIsAdminEligible(true);
      setIsAdminVerified(true);
    } catch (sessionError) {
      console.error("Failed to load admin session", sessionError);
      await clearAdminSession();
    }
  }, [clearAdminSession]);

  useEffect(() => {
    let isMounted = true;

    (async () => {
      await loadStoredSession();
      if (isMounted) {
        setIsLoading(false);
      }
    })();

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user?.email) {
        await clearAdminSession();
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [clearAdminSession, loadStoredSession]);

  const checkEligibility = useCallback(async (email: string) => {
    setError(null);
    const normalizedEmail = normalizeAdminEmail(email);

    if (!normalizedEmail) {
      setIsAdminEligible(false);
      return false;
    }

    try {
      const eligible = await checkAdminEligibility(normalizedEmail);
      setIsAdminEligible(eligible);

      if (!eligible) {
        setIsAdminVerified(false);
        setRole(null);
        setAdminEmail(null);
        setSessionExpiresAt(null);
      }

      return eligible;
    } catch (eligibilityError) {
      console.error("Failed to check admin eligibility", eligibilityError);
      setIsAdminEligible(false);
      setError("Unable to verify admin account right now.");
      return false;
    }
  }, []);

  const verifyAdminPin = useCallback(async (email: string, pin: string) => {
    setError(null);

    try {
      const result = await verifyAdminService(email, pin);
      if (!result.verified || !result.sessionExpiresAt) {
        setIsAdminVerified(false);
        setError(result.message || "Invalid admin PIN.");
        return false;
      }

      const normalizedEmail = normalizeAdminEmail(email);
      const nextRole = result.role || "admin";

      setAdminEmail(normalizedEmail);
      setRole(nextRole);
      setSessionExpiresAt(result.sessionExpiresAt);
      setIsAdminEligible(true);
      setIsAdminVerified(true);

      const payload: AdminSessionState = {
        adminEmail: normalizedEmail,
        role: nextRole,
        sessionExpiresAt: result.sessionExpiresAt,
      };
      await AsyncStorage.setItem(
        ADMIN_SESSION_STORAGE_KEY,
        JSON.stringify(payload),
      );

      return true;
    } catch (verifyError: any) {
      console.error("Failed admin PIN verification", verifyError);
      setIsAdminVerified(false);

      const errorCode = String(verifyError?.code || "").toLowerCase();
      if (errorCode.includes("unauthenticated")) {
        setError(
          "Session expired. Please sign in again before verifying admin PIN.",
        );
        return false;
      }

      setError(
        verifyError?.message || "Could not verify admin PIN. Please try again.",
      );
      return false;
    }
  }, []);

  const value = useMemo(
    () => ({
      adminEmail,
      role,
      isAdminEligible,
      isAdminVerified,
      sessionExpiresAt,
      isLoading,
      error,
      checkEligibility,
      verifyAdminPin,
      clearAdminSession,
    }),
    [
      adminEmail,
      role,
      isAdminEligible,
      isAdminVerified,
      sessionExpiresAt,
      isLoading,
      error,
      checkEligibility,
      verifyAdminPin,
      clearAdminSession,
    ],
  );

  return (
    <AdminContext.Provider value={value}>{children}</AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error("useAdmin must be used within AdminProvider");
  }
  return context;
}
