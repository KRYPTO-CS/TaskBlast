import * as admin from "firebase-admin";
import * as bcrypt from "bcryptjs";
import {
  CallableRequest,
  HttpsError,
  onCall,
} from "firebase-functions/v2/https";

type ShopCategory = "Body" | "Wings";

interface ShopCatalogItem {
  id: string;
  category: ShopCategory;
  index: number;
  nameKey: string;
  iconKey: string;
  price: number;
  active: boolean;
}

const DEFAULT_SHOP_CATALOG: ShopCatalogItem[] = [
  {
    id: "body-0",
    category: "Body",
    index: 0,
    nameKey: "Shop.bBody",
    iconKey: "ship-body-blue",
    price: 0,
    active: true,
  },
  {
    id: "body-1",
    category: "Body",
    index: 1,
    nameKey: "Shop.rBody",
    iconKey: "ship-body-red",
    price: 500,
    active: true,
  },
  {
    id: "body-2",
    category: "Body",
    index: 2,
    nameKey: "Shop.gBody",
    iconKey: "ship-body-green",
    price: 750,
    active: true,
  },
  {
    id: "body-3",
    category: "Body",
    index: 3,
    nameKey: "Shop.yBody",
    iconKey: "ship-body-yellow",
    price: 750,
    active: true,
  },
  {
    id: "wing-0",
    category: "Wings",
    index: 0,
    nameKey: "Shop.bWings",
    iconKey: "ship-wing-blue",
    price: 500,
    active: true,
  },
  {
    id: "wing-1",
    category: "Wings",
    index: 1,
    nameKey: "Shop.rWings",
    iconKey: "ship-wing-red",
    price: 0,
    active: true,
  },
  {
    id: "wing-2",
    category: "Wings",
    index: 2,
    nameKey: "Shop.gWings",
    iconKey: "ship-wing-green",
    price: 750,
    active: true,
  },
  {
    id: "wing-3",
    category: "Wings",
    index: 3,
    nameKey: "Shop.yWings",
    iconKey: "ship-wing-yellow",
    price: 750,
    active: true,
  },
];

const DEFAULT_SHOP_CATALOG_BY_ID = Object.fromEntries(
  DEFAULT_SHOP_CATALOG.map((item) => [item.id, item]),
) as Record<string, ShopCatalogItem>;

admin.initializeApp();

const db = admin.firestore();
const MAX_PIN_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;
const ADMIN_SESSION_MINUTES = 30;

interface AdminDoc {
  role?: string;
  pinHash: string;
  failedAttempts?: number;
  lockoutUntil?: admin.firestore.Timestamp;
}

const normalizeEmail = (email: string) => email.trim().toLowerCase();

const resolveCallerEmail = async (
  auth: CallableRequest<unknown>["auth"],
): Promise<string> => {
  if (!auth?.uid) {
    throw new HttpsError("unauthenticated", "Authentication is required.");
  }

  const tokenEmail = auth.token?.email;
  if (typeof tokenEmail === "string" && tokenEmail.trim()) {
    return normalizeEmail(tokenEmail);
  }

  const userRecord = await admin.auth().getUser(auth.uid);
  const recordEmail = userRecord.email;
  if (!recordEmail) {
    throw new HttpsError(
      "failed-precondition",
      "Authenticated account has no email address.",
    );
  }

  return normalizeEmail(recordEmail);
};

const validateCaller = (
  auth: CallableRequest<unknown>["auth"],
  email: string,
): Promise<string> => {
  const requestedEmail = normalizeEmail(email);

  return resolveCallerEmail(auth).then((callerEmail) => {
    if (callerEmail !== requestedEmail) {
      throw new HttpsError(
        "permission-denied",
        "Admin verification email does not match current user.",
      );
    }

    return callerEmail;
  });
};

const getAdminDocOrThrow = async (email: string) => {
  const adminRef = db.collection("admins").doc(email);
  const snapshot = await adminRef.get();

  if (!snapshot.exists) {
    throw new HttpsError("permission-denied", "Admin account not found.");
  }

  return { adminRef, data: snapshot.data() as AdminDoc };
};

const getActiveAdminSession = async (uid: string) => {
  const sessionRef = db.collection("adminSessions").doc(uid);
  const snapshot = await sessionRef.get();

  if (!snapshot.exists) {
    throw new HttpsError(
      "permission-denied",
      "Admin PIN verification is required.",
    );
  }

  const data = snapshot.data() as {
    email?: string;
    expiresAt?: admin.firestore.Timestamp;
  };

  const expiresAt = data?.expiresAt?.toMillis?.() ?? 0;
  if (!expiresAt || expiresAt <= Date.now()) {
    await sessionRef.delete();
    throw new HttpsError(
      "permission-denied",
      "Admin session expired. Verify your PIN again.",
    );
  }

  return data;
};

const assertAdminWriteAccess = async (
  auth: CallableRequest<unknown>["auth"],
) => {
  if (!auth?.uid) {
    throw new HttpsError("unauthenticated", "Authentication is required.");
  }

  const email = await resolveCallerEmail(auth);
  await getAdminDocOrThrow(email);
  const session = await getActiveAdminSession(auth.uid);

  if (normalizeEmail(session.email || "") !== email) {
    throw new HttpsError(
      "permission-denied",
      "Admin session email does not match caller.",
    );
  }

  return { email, uid: auth.uid };
};

const writeAdminAuditLog = async (
  actorEmail: string,
  actionType: string,
  targetId: string,
  before: Record<string, unknown>,
  after: Record<string, unknown>,
) => {
  await db.collection("adminActions").add({
    actorEmail,
    actionType,
    targetId,
    before,
    after,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
};

const getRewardFromHighestTile = (highestTile: number) => {
  if (highestTile >= 4096) return 120;
  if (highestTile >= 2048) return 80;
  if (highestTile >= 1024) return 40;
  if (highestTile >= 512) return 20;
  if (highestTile >= 256) return 10;
  if (highestTile >= 128) return 5;
  return 0;
};

const getScoreBonusReward = (score: number) => {
  return Math.min(40, Math.floor(score / 100));
};

const MAX_BATTLE_PASS_LEVEL = 100;
const getBattlePassReward = (level: number) =>
  250 + 50 * Math.floor(Math.max(0, level - 1) / 5);

const getPlanetScoreMultiplier = (planetId: number) => {
  const safePlanetId = Math.max(1, Math.min(9, Math.floor(Number(planetId) || 1)));
  const multiplierByPlanet: Record<number, number> = {
    1: 1.0,
    2: 1.1,
    3: 1.2,
    4: 1.4,
    5: 1.6,
    6: 1.8,
    7: 2.0,
    8: 2.5,
    9: 3.0,
  };
  return multiplierByPlanet[safePlanetId] ?? 1.0;
};

const getGameReward = (gameId: number, score: number, highestTile: number) => {
  const safeScore = Math.max(0, Math.floor(Number(score) || 0));
  const safeTile = Math.max(0, Math.floor(Number(highestTile) || 0));

  if (gameId === 3) {
    const baseReward = getRewardFromHighestTile(safeTile);
    const scoreBonus = getScoreBonusReward(safeScore);
    return Math.min(120, baseReward + scoreBonus);
  }

  // MatchBlast awards 10% of the final score as rocks.
  if (gameId === 4) {
    return Math.floor(safeScore * 0.1);
  }

  return safeScore;
};

const getUserProfileRef = (uid: string, childDocId?: string | null) => {
  if (childDocId) {
    return db.collection("users").doc(uid).collection("children").doc(childDocId);
  }

  return db.collection("users").doc(uid);
};

const deleteDocumentTree = async (
  docRef: admin.firestore.DocumentReference,
): Promise<void> => {
  const subcollections = await docRef.listCollections();

  for (const subcollection of subcollections) {
    const snapshot = await subcollection.get();
    for (const childDoc of snapshot.docs) {
      await deleteDocumentTree(childDoc.ref);
    }
  }

  await docRef.delete();
};

export const debugAuthIdentity = onCall(
  { invoker: "public" },
  async (request: CallableRequest<unknown>) => {
    const hasAuth = !!request.auth?.uid;
    const uid = request.auth?.uid || null;
    const tokenEmailRaw = request.auth?.token?.email;
    const tokenEmail =
      typeof tokenEmailRaw === "string" ? normalizeEmail(tokenEmailRaw) : null;

    if (!hasAuth || !request.auth) {
      return {
        hasAuth: false,
        uid,
        tokenEmail,
        resolvedEmail: null,
        resolveError: "No auth context attached to callable request.",
      };
    }

    try {
      const resolvedEmail = await resolveCallerEmail(request.auth);
      return {
        hasAuth: true,
        uid,
        tokenEmail,
        resolvedEmail,
        resolveError: null,
      };
    } catch (error: any) {
      return {
        hasAuth: true,
        uid,
        tokenEmail,
        resolvedEmail: null,
        resolveError: error?.message || "Failed to resolve caller email.",
      };
    }
  },
);

export const awardGameRewards = onCall(
  { invoker: "public" },
  async (request: CallableRequest<unknown>) => {
    if (!request.auth?.uid) {
      throw new HttpsError("unauthenticated", "Authentication is required.");
    }

    const { gameId, score, highestTile, playTimeMinutes, activePlanetId, childDocId } = request.data as {
      gameId?: number;
      score?: number;
      highestTile?: number;
      playTimeMinutes?: number;
      activePlanetId?: number;
      childDocId?: string | null;
    };

    if (
      typeof gameId !== "number" ||
      typeof score !== "number" ||
      typeof highestTile !== "number" ||
      typeof playTimeMinutes !== "number"
    ) {
      throw new HttpsError("invalid-argument", "Invalid reward payload.");
    }

    const uid = request.auth.uid;
    const baseReward = getGameReward(gameId, score, highestTile);
    const safeMinutes = Math.max(0, Math.min(180, Math.floor(playTimeMinutes)));
    const userRef = getUserProfileRef(uid, childDocId);

    const result = await db.runTransaction(
      async (tx: admin.firestore.Transaction) => {
        const snap = await tx.get(userRef);
        if (!snap.exists) {
          throw new HttpsError("not-found", "User profile not found.");
        }

        const data = snap.data() || {};
        const currentRocks = Number(data.rocks || 0);
        const currentAllTimeRocks = Number(data.allTimeRocks || 0);
        const currentPlanet = Math.max(
          1,
          Math.floor(Number(data.currPlanet || 1)),
        );
        const requestedPlanet = Number.isFinite(Number(activePlanetId))
          ? Math.floor(Number(activePlanetId))
          : currentPlanet;
        // Reward scaling follows highest unlocked planet progression.
        // For Asteroid Blaster (0) and Space Swerve (1), apply no planet multiplier.
        const effectivePlanet = currentPlanet;
        const isSpaceShooterVariant = gameId === 0 || gameId === 1;
        const multiplier = isSpaceShooterVariant ? 1.0 : getPlanetScoreMultiplier(effectivePlanet);
        const safeReward = Math.max(
          0,
          Math.min(5000, Math.floor(baseReward * multiplier)),
        );
        const allTimeArr = Array.isArray(data.allTimeRocksArr)
          ? [...data.allTimeRocksArr]
          : [];
        const playArr = Array.isArray(data.playTimeMinutesArr)
          ? [...data.playTimeMinutesArr]
          : [];
        const newRocks = currentRocks + safeReward;
        const newAllTime = currentAllTimeRocks + safeReward;
        allTimeArr.push(newAllTime);
        playArr.push(safeMinutes);

        tx.set(
          userRef,
          {
            rocks: newRocks,
            allTimeRocks: newAllTime,
            allTimeRocksArr: allTimeArr,
            playTimeMinutesArr: playArr,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true },
        );

        return {
          newRocks,
          safeReward,
          multiplier,
          effectivePlanet,
          currentPlanet,
          requestedPlanet,
          requestedPlanetRaw: activePlanetId ?? null,
          baseReward,
        };
      },
    );

    return {
      success: true,
      awardedRocks: result.safeReward,
      newRocks: result.newRocks,
      rewardDebug: {
        baseReward: result.baseReward,
        multiplier: result.multiplier,
        effectivePlanet: result.effectivePlanet,
        requestedPlanet: result.requestedPlanet,
        unlockedPlanet: result.currentPlanet,
        requestedPlanetRaw: result.requestedPlanetRaw,
        appliedReward: result.safeReward,
      },
      message: `Game rewards applied (x${result.multiplier.toFixed(1)} from planet ${result.effectivePlanet}).`,
    };
  },
);

export const claimTaskReward = onCall(
  { invoker: "public" },
  async (request: CallableRequest<unknown>) => {
    if (!request.auth?.uid) {
      throw new HttpsError("unauthenticated", "Authentication is required.");
    }

    const { taskId, reward, childDocId } = request.data as {
      taskId?: string;
      reward?: number;
      childDocId?: string;
    };

    if (!taskId || typeof reward !== "number" || !Number.isFinite(reward)) {
      throw new HttpsError("invalid-argument", "taskId and reward are required.");
    }

    const uid = request.auth.uid;
    const safeReward = Math.max(0, Math.min(5000, Math.floor(reward)));
    const taskRef = childDocId
      ? db
          .collection("users")
          .doc(uid)
          .collection("children")
          .doc(childDocId)
          .collection("tasks")
          .doc(taskId)
      : db.collection("users").doc(uid).collection("tasks").doc(taskId);
    const profileRef = getUserProfileRef(uid, childDocId);

    const result = await db.runTransaction(
      async (tx: admin.firestore.Transaction) => {
        const taskSnap = await tx.get(taskRef);
        if (!taskSnap.exists) {
          throw new HttpsError("not-found", "Task not found.");
        }

        const taskData = taskSnap.data() || {};
        if (taskData.archived) {
          return {
            alreadyArchived: true,
            newRocks: Number((await tx.get(profileRef)).data()?.rocks || 0),
          };
        }

        const profileSnap = await tx.get(profileRef);
        if (!profileSnap.exists) {
          throw new HttpsError("not-found", "Profile not found.");
        }

        const currentRocks = Number(profileSnap.data()?.rocks || 0);
        const newRocks = currentRocks + safeReward;

        tx.set(
          taskRef,
          {
            archived: true,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true },
        );

        tx.set(
          profileRef,
          {
            rocks: newRocks,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true },
        );

        return { alreadyArchived: false, newRocks };
      },
    );

    return {
      success: true,
      taskId,
      awardedRocks: result.alreadyArchived ? 0 : safeReward,
      newRocks: result.newRocks,
      message: result.alreadyArchived
        ? "Task already archived."
        : "Task reward claimed.",
    };
  },
);

export const claimBattlePassReward = onCall(
  { invoker: "public" },
  async (request: CallableRequest<unknown>) => {
    if (!request.auth?.uid) {
      throw new HttpsError("unauthenticated", "Authentication is required.");
    }

    const { level, childDocId } = request.data as {
      level?: number;
      childDocId?: string | null;
    };

    const safeLevel = Number.isFinite(Number(level))
      ? Math.floor(Number(level))
      : NaN;

    if (
      !Number.isFinite(safeLevel) ||
      safeLevel < 1 ||
      safeLevel > MAX_BATTLE_PASS_LEVEL
    ) {
      throw new HttpsError("invalid-argument", "Invalid battle pass level.");
    }

    const uid = request.auth.uid;
    const profileRef = getUserProfileRef(uid, childDocId);
    const isGalaxyReward = safeLevel % 5 === 0;
    const rockReward = isGalaxyReward ? 0 : getBattlePassReward(safeLevel);
    const crystalReward = isGalaxyReward ? 5 : 0;

    const result = await db.runTransaction(
      async (tx: admin.firestore.Transaction) => {
        const snap = await tx.get(profileRef);
        if (!snap.exists) {
          throw new HttpsError("not-found", "Profile not found.");
        }

        const data = snap.data() || {};
        const liveLevel = Number.isFinite(Number(data.currentLevel))
          ? Math.max(1, Math.floor(Number(data.currentLevel)))
          : 1;
        const claimed = Array.isArray(data.claimedRewardLevels)
          ? data.claimedRewardLevels
              .map((v: unknown) => Number(v))
              .filter((v: number) => Number.isFinite(v) && v >= 1)
              .map((v: number) => Math.floor(v))
          : [];

        if (safeLevel > liveLevel) {
          throw new HttpsError(
            "failed-precondition",
            "LEVEL_NOT_REACHED",
          );
        }

        const currentRocks = Number(data.rocks || 0);
        const currentGalaxyCrystals = Number(data.galaxyCrystals || 0);

        if (claimed.includes(safeLevel)) {
          return {
            alreadyClaimed: true,
            newRocks: currentRocks,
            newGalaxyCrystals: currentGalaxyCrystals,
            claimedRewardLevels: claimed,
          };
        }

        const updatedClaimed = [...new Set([...claimed, safeLevel])].sort(
          (a, b) => a - b,
        );

        const newRocks = currentRocks + rockReward;
        const newGalaxyCrystals = currentGalaxyCrystals + crystalReward;

        tx.set(
          profileRef,
          {
            claimedRewardLevels: updatedClaimed,
            rocks: newRocks,
            galaxyCrystals: newGalaxyCrystals,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true },
        );

        return {
          alreadyClaimed: false,
          newRocks,
          newGalaxyCrystals,
          claimedRewardLevels: updatedClaimed,
        };
      },
    );

    return {
      success: true,
      level: safeLevel,
      isGalaxyReward,
      awardedRocks: result.alreadyClaimed ? 0 : rockReward,
      awardedGalaxyCrystals: result.alreadyClaimed ? 0 : crystalReward,
      alreadyClaimed: result.alreadyClaimed,
      newRocks: result.newRocks,
      newGalaxyCrystals: result.newGalaxyCrystals,
      claimedRewardLevels: result.claimedRewardLevels,
      message: result.alreadyClaimed
        ? "Reward already claimed."
        : "Battle pass reward claimed.",
    };
  },
);

export const unlockPlanet = onCall(
  { invoker: "public" },
  async (request: CallableRequest<unknown>) => {
    if (!request.auth?.uid) {
      throw new HttpsError("unauthenticated", "Authentication is required.");
    }

    const { planetId, childDocId } = request.data as { planetId?: number; childDocId?: string | null };
    const safePlanetId = Number.isFinite(Number(planetId))
      ? Math.floor(Number(planetId))
      : NaN;

    if (
      !Number.isFinite(safePlanetId) ||
      safePlanetId < 1 ||
      safePlanetId > 9
    ) {
      throw new HttpsError("invalid-argument", "Invalid planetId.");
    }

    const uid = request.auth.uid;
    const userRef = getUserProfileRef(uid, childDocId);
    const planetRef = db.collection("planets").doc(String(safePlanetId));

    const result = await db.runTransaction(
      async (tx: admin.firestore.Transaction) => {
        const userSnap = await tx.get(userRef);
        if (!userSnap.exists) {
          throw new HttpsError("not-found", "User profile not found.");
        }

        const planetSnap = await tx.get(planetRef);
        if (!planetSnap.exists) {
          throw new HttpsError("not-found", "Planet not found.");
        }

        const userData = userSnap.data() || {};
        const planetData = planetSnap.data() || {};

        const cost = Math.max(0, Math.floor(Number(planetData.cost || 0)));
        const currentRocks = Math.max(
          0,
          Math.floor(Number(userData.rocks || 0)),
        );
        const currentPlanet = Math.max(
          1,
          Math.floor(Number(userData.currPlanet || 1)),
        );

        if (safePlanetId > currentPlanet + 1) {
          throw new HttpsError(
            "failed-precondition",
            "Unlock previous planet first.",
          );
        }

        if (safePlanetId <= currentPlanet) {
          return {
            alreadyUnlocked: true,
            newRocks: currentRocks,
            currPlanet: currentPlanet,
            cost,
          };
        }

        if (currentRocks < cost) {
          throw new HttpsError(
            "failed-precondition",
            "Not enough rocks to unlock this planet.",
          );
        }

        const newRocks = currentRocks - cost;
        const currentSpent = Math.max(
          0,
          Math.floor(Number(userData.rocksSpent || 0)),
        );
        const newSpent = currentSpent + cost;

        tx.set(
          userRef,
          {
            currPlanet: safePlanetId,
            rocks: newRocks,
            rocksSpent: newSpent,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true },
        );

        return {
          alreadyUnlocked: false,
          newRocks,
          currPlanet: safePlanetId,
          cost,
        };
      },
    );

    return {
      success: true,
      alreadyUnlocked: result.alreadyUnlocked,
      newRocks: result.newRocks,
      currPlanet: result.currPlanet,
      cost: result.cost,
      message: result.alreadyUnlocked
        ? "Planet already unlocked."
        : "Planet unlocked successfully.",
    };
  },
);

export const purchaseShopItem = onCall(
  { invoker: "public" },
  async (request: CallableRequest<unknown>) => {
    if (!request.auth?.uid) {
      throw new HttpsError("unauthenticated", "Authentication is required.");
    }

    const { itemId, childDocId } = request.data as { itemId?: string; childDocId?: string | null };
    if (!itemId) {
      throw new HttpsError("invalid-argument", "Unknown shop item.");
    }

    const uid = request.auth.uid;
    const itemRef = db.collection("shopItems").doc(itemId);
    const userRef = getUserProfileRef(uid, childDocId);

    const result = await db.runTransaction(
      async (tx: admin.firestore.Transaction) => {
        const itemSnap = await tx.get(itemRef);
        const itemData = itemSnap.exists ? itemSnap.data() || {} : {};
        const seededFallback = DEFAULT_SHOP_CATALOG_BY_ID[itemId];

        const rawCategory = String(
          itemData.category ?? seededFallback?.category ?? "",
        );
        const category =
          rawCategory === "Body" || rawCategory === "Wings" || rawCategory === "Topper"
            ? rawCategory
            : null;
        const index = Number(itemData.index ?? seededFallback?.index ?? -1);
        const price = Number(itemData.price ?? itemData.cost ?? seededFallback?.price ?? NaN);
        const isActive =
          itemData.active === undefined
            ? true
            : Boolean(itemData.active);

        if (
          !category ||
          !Number.isFinite(index) ||
          index < 0 ||
          !Number.isFinite(price) ||
          price < 0 ||
          !isActive
        ) {
          throw new HttpsError("failed-precondition", "Shop item is unavailable.");
        }

        const userSnap = await tx.get(userRef);
        if (!userSnap.exists) {
          throw new HttpsError("not-found", "User profile not found.");
        }

        const userData = userSnap.data() || {};
        const currentRocks = Number(userData.rocks || 0);
        const currentSpent = Number(userData.rocksSpent || 0);
        const shopItems = userData.shopItems || {
          body: [true, false, false, false],
          wings: [false, true, false, false],
          toppers: [true, false],
        };

        const key = category === "Body" ? "body" : category === "Wings" ? "wings" : "toppers";
        const categoryArr = Array.isArray(shopItems[key]) ? [...shopItems[key]] : [];

        while (categoryArr.length <= index) {
          categoryArr.push(false);
        }

        if (categoryArr[index]) {
          return {
            alreadyOwned: true,
            newRocks: currentRocks,
            updatedShopItems: shopItems,
          };
        }

        if (currentRocks < price) {
          throw new HttpsError(
            "failed-precondition",
            "Not enough rocks for this purchase.",
          );
        }

        categoryArr[index] = true;
        const updatedShopItems = {
          ...shopItems,
          [key]: categoryArr,
        };
        const newRocks = currentRocks - price;

        tx.set(
          userRef,
          {
            shopItems: updatedShopItems,
            rocks: newRocks,
            rocksSpent: currentSpent + price,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true },
        );

        return {
          alreadyOwned: false,
          newRocks,
          updatedShopItems,
        };
      },
    );

    return {
      success: true,
      itemId,
      newRocks: result.newRocks,
      shopItems: result.updatedShopItems,
      message: result.alreadyOwned ? "Item already owned." : "Purchase complete.",
    };
  },
);

export const purchaseShopItemWithCrystals = onCall(
  { invoker: "public" },
  async (request: CallableRequest<unknown>) => {
    if (!request.auth?.uid) {
      throw new HttpsError("unauthenticated", "Authentication is required.");
    }

    const { itemId, childDocId } = request.data as { itemId?: string; childDocId?: string | null };
    if (!itemId) {
      throw new HttpsError("invalid-argument", "Unknown shop item.");
    }

    const uid = request.auth.uid;
    const itemRef = db.collection("shopItems").doc(itemId);
    const userRef = getUserProfileRef(uid, childDocId);

    const result = await db.runTransaction(
      async (tx: admin.firestore.Transaction) => {
        const itemSnap = await tx.get(itemRef);
        const itemData = itemSnap.exists ? itemSnap.data() || {} : {};
        const seededFallback = DEFAULT_SHOP_CATALOG_BY_ID[itemId];

        const rawCategory = String(
          itemData.category ?? seededFallback?.category ?? "",
        );
        const category =
          rawCategory === "Body" || rawCategory === "Wings" || rawCategory === "Topper"
            ? rawCategory
            : null;
        const index = Number(itemData.index ?? seededFallback?.index ?? -1);
        const crystalPrice = Number(itemData.crystalPrice ?? NaN);
        const isActive =
          itemData.active === undefined
            ? true
            : Boolean(itemData.active);

        if (
          !category ||
          !Number.isFinite(index) ||
          index < 0 ||
          !Number.isFinite(crystalPrice) ||
          crystalPrice < 0 ||
          !isActive
        ) {
          throw new HttpsError("failed-precondition", "Shop item is unavailable or has no crystal price set.");
        }

        const userSnap = await tx.get(userRef);
        if (!userSnap.exists) {
          throw new HttpsError("not-found", "User profile not found.");
        }

        const userData = userSnap.data() || {};
        const currentGalaxyCrystals = Number(userData.galaxyCrystals || 0);
        const shopItems = userData.shopItems || {
          body: [true, false, false, false],
          wings: [false, true, false, false],
          toppers: [true, false],
        };

        const key = category === "Body" ? "body" : category === "Wings" ? "wings" : "toppers";
        const categoryArr = Array.isArray(shopItems[key]) ? [...shopItems[key]] : [];

        while (categoryArr.length <= index) {
          categoryArr.push(false);
        }

        if (categoryArr[index]) {
          return {
            alreadyOwned: true,
            newGalaxyCrystals: currentGalaxyCrystals,
            updatedShopItems: shopItems,
          };
        }

        if (currentGalaxyCrystals < crystalPrice) {
          throw new HttpsError(
            "failed-precondition",
            "Not enough galaxy crystals for this purchase.",
          );
        }

        categoryArr[index] = true;
        const updatedShopItems = {
          ...shopItems,
          [key]: categoryArr,
        };
        const newGalaxyCrystals = currentGalaxyCrystals - crystalPrice;

        tx.set(
          userRef,
          {
            shopItems: updatedShopItems,
            galaxyCrystals: newGalaxyCrystals,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true },
        );

        return {
          alreadyOwned: false,
          newGalaxyCrystals,
          updatedShopItems,
        };
      },
    );

    return {
      success: true,
      itemId,
      newGalaxyCrystals: result.newGalaxyCrystals,
      shopItems: result.updatedShopItems,
      message: result.alreadyOwned ? "Item already owned." : "Purchase complete.",
    };
  },
);

export const deleteChildAccount = onCall(
  { invoker: "public" },
  async (request: CallableRequest<unknown>) => {
    if (!request.auth?.uid) {
      throw new HttpsError("unauthenticated", "Authentication is required.");
    }

    const { childDocId } = request.data as { childDocId?: string };
    if (!childDocId || typeof childDocId !== "string") {
      throw new HttpsError("invalid-argument", "A child account is required.");
    }

    const childRef = db
      .collection("users")
      .doc(request.auth.uid)
      .collection("children")
      .doc(childDocId);

    const childSnap = await childRef.get();
    if (!childSnap.exists) {
      throw new HttpsError("not-found", "Child account not found.");
    }

    await deleteDocumentTree(childRef);

    return {
      success: true,
      childDocId,
      message: "Child account deleted successfully.",
    };
  },
);

export const verifyAdmin = onCall(
  { invoker: "public" },
  async (request: CallableRequest<unknown>) => {
  const { email, pin } = request.data as { email?: string; pin?: string };

  if (!email || !pin) {
    throw new HttpsError(
      "invalid-argument",
      "Email and PIN are required for admin verification.",
    );
  }

  const normalizedEmail = await validateCaller(request.auth, email);
  const { adminRef, data } = await getAdminDocOrThrow(normalizedEmail);

  const lockoutUntilMillis = data.lockoutUntil?.toMillis?.() ?? 0;
  if (lockoutUntilMillis > Date.now()) {
    return {
      verified: false,
      message: "Too many failed attempts. Try again later.",
      lockoutUntil: lockoutUntilMillis,
      attemptsRemaining: 0,
    };
  }

  const pinMatches = await bcrypt.compare(pin, data.pinHash);
  if (!pinMatches) {
    const failedAttempts = (data.failedAttempts || 0) + 1;
    const attemptsRemaining = Math.max(0, MAX_PIN_ATTEMPTS - failedAttempts);

    const updatePayload: Partial<AdminDoc> = {
      failedAttempts,
    };

    if (failedAttempts >= MAX_PIN_ATTEMPTS) {
      updatePayload.failedAttempts = 0;
      updatePayload.lockoutUntil = admin.firestore.Timestamp.fromMillis(
        Date.now() + LOCKOUT_MINUTES * 60 * 1000,
      );
    }

    await adminRef.set(updatePayload, { merge: true });

    return {
      verified: false,
      message:
        failedAttempts >= MAX_PIN_ATTEMPTS
          ? "Too many failed attempts. Account temporarily locked."
          : "Invalid admin PIN.",
      attemptsRemaining,
      lockoutUntil: updatePayload.lockoutUntil?.toMillis?.(),
    };
  }

  const sessionExpiresAt = Date.now() + ADMIN_SESSION_MINUTES * 60 * 1000;

  await adminRef.set(
    {
      failedAttempts: 0,
      lockoutUntil: null,
      lastVerifiedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  await db
    .collection("adminSessions")
    .doc(request.auth!.uid)
    .set(
      {
        email: normalizedEmail,
        role: data.role || "admin",
        expiresAt: admin.firestore.Timestamp.fromMillis(sessionExpiresAt),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

  return {
    verified: true,
    role: data.role || "admin",
    sessionExpiresAt,
    message: "Admin verified.",
  };
  },
);

export const disableAdminSession = onCall(
  { invoker: "public" },
  async (request: CallableRequest<unknown>) => {
    if (!request.auth?.uid) {
      throw new HttpsError("unauthenticated", "Authentication is required.");
    }

    const uid = request.auth.uid;
    const sessionRef = db.collection("adminSessions").doc(uid);
    const existingSession = await sessionRef.get();

    if (existingSession.exists) {
      await sessionRef.delete();
    }

    let actorEmail = "unknown";
    try {
      actorEmail = await resolveCallerEmail(request.auth);
    } catch {
      // Best-effort logging when email resolution is unavailable.
    }

    await writeAdminAuditLog(
      actorEmail,
      "disable_admin_session",
      uid,
      { hadSession: existingSession.exists },
      { hadSession: false },
    );

    return {
      success: true,
      message: "Admin access disabled for this session.",
    };
  },
);

export const updateUserRocks = onCall(
  { invoker: "public" },
  async (request: CallableRequest<unknown>) => {
    const { email } = await assertAdminWriteAccess(request.auth);
    const { userId, userEmail, amount } = request.data as {
      userId?: string;
      userEmail?: string;
      amount?: number;
    };

    const providedUserId = typeof userId === "string" ? userId.trim() : "";
    const providedUserEmail =
      typeof userEmail === "string" ? normalizeEmail(userEmail) : "";

    if (
      (!providedUserId && !providedUserEmail) ||
      typeof amount !== "number" ||
      !Number.isFinite(amount)
    ) {
      throw new HttpsError(
        "invalid-argument",
        "userId or userEmail and numeric amount are required.",
      );
    }

    const parsedAmount = Math.trunc(amount);
    if (Math.abs(parsedAmount) > 100000) {
      throw new HttpsError("invalid-argument", "Amount exceeds allowed range.");
    }

    let resolvedUserId = providedUserId;
    if (!resolvedUserId && providedUserEmail) {
      try {
        const userRecord = await admin.auth().getUserByEmail(providedUserEmail);
        resolvedUserId = userRecord.uid;
      } catch {
        throw new HttpsError("not-found", "Target user was not found.");
      }
    }

    const userRef = db.collection("users").doc(resolvedUserId);

    const result = await db.runTransaction(
      async (tx: admin.firestore.Transaction) => {
        const userSnap = await tx.get(userRef);
        if (!userSnap.exists) {
          throw new HttpsError("not-found", "Target user was not found.");
        }

        const beforeData = userSnap.data() || {};
        const currentRocks = Number(beforeData.rocks || 0);
        const newRocks = currentRocks + parsedAmount;

        if (newRocks < 0) {
          throw new HttpsError(
            "failed-precondition",
            "Operation would result in negative rocks.",
          );
        }

        tx.set(
          userRef,
          {
            rocks: newRocks,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true },
        );

        return {
          beforeData,
          afterData: { rocks: newRocks },
          newRocks,
        };
      },
    );

    await writeAdminAuditLog(
      email,
      "update_user_rocks",
      resolvedUserId,
      {
        rocks: result.beforeData.rocks ?? 0,
        amount: parsedAmount,
        userEmail: providedUserEmail || null,
      },
      result.afterData,
    );

    return {
      success: true,
      newRocks: result.newRocks,
      message: "User rocks updated.",
    };
  },
);

export const seedShopCatalog = onCall(
  { invoker: "public" },
  async (request: CallableRequest<unknown>) => {
    const { email } = await assertAdminWriteAccess(request.auth);
    const { force } = request.data as { force?: boolean };

    const shouldForce = Boolean(force);
    let createdCount = 0;
    let updatedCount = 0;

    for (const item of DEFAULT_SHOP_CATALOG) {
      const itemRef = db.collection("shopItems").doc(item.id);
      const snapshot = await itemRef.get();
      const exists = snapshot.exists;

      if (exists && !shouldForce) {
        continue;
      }

      await itemRef.set(
        {
          ...item,
          cost: item.price,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedBy: email,
          ...(exists
            ? {}
            : { createdAt: admin.firestore.FieldValue.serverTimestamp() }),
        },
        { merge: true },
      );

      if (exists) {
        updatedCount += 1;
      } else {
        createdCount += 1;
      }
    }

    await writeAdminAuditLog(
      email,
      "seed_shop_catalog",
      "shopItems",
      {},
      {
        force: shouldForce,
        createdCount,
        updatedCount,
        totalSeedItems: DEFAULT_SHOP_CATALOG.length,
      },
    );

    return {
      success: true,
      createdCount,
      updatedCount,
      message: "Shop catalog seed completed.",
    };
  },
);

export const updateShopItemCost = onCall(
  { invoker: "public" },
  async (request: CallableRequest<unknown>) => {
    const { email } = await assertAdminWriteAccess(request.auth);
    const { itemId, newCost } = request.data as {
      itemId?: string;
      newCost?: number;
    };

    if (!itemId || typeof newCost !== "number" || !Number.isFinite(newCost)) {
      throw new HttpsError(
        "invalid-argument",
        "itemId and numeric newCost are required.",
      );
    }

    const cost = Math.max(0, Math.trunc(newCost));
    const itemRef = db.collection("shopItems").doc(itemId);
    const snapshot = await itemRef.get();
    const before = snapshot.exists ? snapshot.data() : {};

    await itemRef.set(
      {
        id: itemId,
        price: cost,
        cost,
        active: true,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedBy: email,
      },
      { merge: true },
    );

    await writeAdminAuditLog(
      email,
      "update_shop_item_cost",
      itemId,
      { cost: before?.cost ?? null },
      { cost },
    );

    return {
      success: true,
      itemId,
      cost,
      message: "Shop item cost updated.",
    };
  },
);

export const skipSession = onCall(
  { invoker: "public" },
  async (request: CallableRequest<unknown>) => {
    const { email } = await assertAdminWriteAccess(request.auth);
    const { targetUserId, reason } = request.data as {
      targetUserId?: string;
      reason?: string;
    };

    if (!targetUserId) {
      throw new HttpsError("invalid-argument", "targetUserId is required.");
    }

    const targetRef = db.collection("users").doc(targetUserId);
    const targetSnap = await targetRef.get();

    if (!targetSnap.exists) {
      throw new HttpsError("not-found", "Target user was not found.");
    }

    const overridePayload = {
      skipNextSession: true,
      reason: reason || "Admin override",
      by: email,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await targetRef.set(
      {
        sessionOverride: overridePayload,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    await writeAdminAuditLog(
      email,
      "skip_session",
      targetUserId,
      { sessionOverride: targetSnap.data()?.sessionOverride || null },
      { sessionOverride: { skipNextSession: true, by: email } },
    );

    return {
      success: true,
      message: "Session override has been applied.",
    };
  },
);
