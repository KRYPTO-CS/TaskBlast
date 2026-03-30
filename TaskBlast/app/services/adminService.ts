import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { auth } from "../../server/firebase";
import { httpsCallable } from "firebase/functions";
import { firestore, functions } from "../../server/firebase";

export interface VerifyAdminResponse {
  verified: boolean;
  role?: string;
  sessionExpiresAt?: number;
  message?: string;
  attemptsRemaining?: number;
  lockoutUntil?: number;
}

export interface AdminActionResponse {
  success: boolean;
  message?: string;
}

export interface UpdateUserRocksResponse extends AdminActionResponse {
  newRocks?: number;
}

export interface UpdateShopItemCostResponse extends AdminActionResponse {
  itemId?: string;
  cost?: number;
}

export interface SeedShopCatalogResponse extends AdminActionResponse {
  createdCount?: number;
  updatedCount?: number;
}

export interface AdminAuthDebugResponse {
  hasAuth: boolean;
  uid: string | null;
  tokenEmail: string | null;
  resolvedEmail: string | null;
  resolveError: string | null;
}

const ADMIN_ACTION_LOG_COLLECTION = "adminActions";

export const normalizeAdminEmail = (email: string): string =>
  email.trim().toLowerCase();

export const checkAdminEligibility = async (email: string): Promise<boolean> => {
  const normalizedEmail = normalizeAdminEmail(email);
  if (!normalizedEmail) {
    return false;
  }

  const adminDocRef = doc(firestore, "admins", normalizedEmail);
  const adminDoc = await getDoc(adminDocRef);
  return adminDoc.exists();
};

export const verifyAdmin = async (
  email: string,
  pin: string,
): Promise<VerifyAdminResponse> => {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error("You must be signed in before admin PIN verification.");
  }

  // Ensure the callable carries a fresh ID token.
  await currentUser.getIdToken(true);

  const callable = httpsCallable<
    { email: string; pin: string },
    VerifyAdminResponse
  >(functions, "verifyAdmin");

  try {
    const debugCallable = httpsCallable<Record<string, never>, AdminAuthDebugResponse>(
      functions,
      "debugAuthIdentity",
    );
    const debugResult = await debugCallable({});
    console.log("Admin auth debug:", debugResult.data);
  } catch (debugError) {
    console.warn("Admin auth debug callable failed", debugError);
  }

  const payload = {
    email: normalizeAdminEmail(email),
    pin,
  };

  try {
    const result = await callable(payload);
    return result.data;
  } catch (error: any) {
    const code = String(error?.code || "").toLowerCase();
    if (code.includes("unauthenticated")) {
      await currentUser.getIdToken(true);
      const retryResult = await callable(payload);
      return retryResult.data;
    }

    throw error;
  }
};

export const updateUserRocks = async (
  payload: { userId?: string; userEmail?: string },
  amount: number,
): Promise<UpdateUserRocksResponse> => {
  const callable = httpsCallable<
    { userId?: string; userEmail?: string; amount: number },
    UpdateUserRocksResponse
  >(functions, "updateUserRocks");

  const result = await callable({ ...payload, amount });
  return result.data;
};

export const updateShopItemCost = async (
  itemId: string,
  newCost: number,
): Promise<UpdateShopItemCostResponse> => {
  const callable = httpsCallable<
    { itemId: string; newCost: number },
    UpdateShopItemCostResponse
  >(functions, "updateShopItemCost");

  const result = await callable({ itemId, newCost });
  return result.data;
};

export const seedShopCatalog = async (
  force = false,
): Promise<SeedShopCatalogResponse> => {
  const callable = httpsCallable<
    { force: boolean },
    SeedShopCatalogResponse
  >(functions, "seedShopCatalog");

  const result = await callable({ force });
  return result.data;
};

export const disableAdminSession = async (): Promise<AdminActionResponse> => {
  const callable = httpsCallable<Record<string, never>, AdminActionResponse>(
    functions,
    "disableAdminSession",
  );

  const result = await callable({});
  return result.data;
};

export const skipSession = async (
  targetUserId: string,
  reason: string,
): Promise<AdminActionResponse> => {
  const callable = httpsCallable<
    { targetUserId: string; reason: string },
    AdminActionResponse
  >(functions, "skipSession");

  const result = await callable({ targetUserId, reason });
  return result.data;
};

export const logAdminActionClient = async (
  actorEmail: string,
  actionType: string,
  targetId: string,
) => {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const actionDocRef = doc(firestore, ADMIN_ACTION_LOG_COLLECTION, id);

  await setDoc(actionDocRef, {
    actorEmail: normalizeAdminEmail(actorEmail),
    actionType,
    targetId,
    source: "client",
    createdAt: serverTimestamp(),
  });
};
