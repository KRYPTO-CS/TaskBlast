import { httpsCallable } from "firebase/functions";
import { functions } from "../../server/firebase";

interface BaseResponse {
  success: boolean;
  message?: string;
}

export interface AwardGameRewardsResponse extends BaseResponse {
  awardedRocks?: number;
  newRocks?: number;
}

export interface ClaimTaskRewardResponse extends BaseResponse {
  taskId?: string;
  awardedRocks?: number;
  newRocks?: number;
}

export interface PurchaseShopItemResponse extends BaseResponse {
  itemId?: string;
  newRocks?: number;
  shopItems?: {
    body: boolean[];
    wings: boolean[];
  };
}

export interface ClaimBattlePassRewardResponse extends BaseResponse {
  level?: number;
  isGalaxyReward?: boolean;
  awardedRocks?: number;
  awardedGalaxyCrystals?: number;
  alreadyClaimed?: boolean;
  newRocks?: number;
  newGalaxyCrystals?: number;
  claimedRewardLevels?: number[];
}

export interface UnlockPlanetResponse extends BaseResponse {
  alreadyUnlocked?: boolean;
  newRocks?: number;
  currPlanet?: number;
  cost?: number;
}

export const awardGameRewards = async (payload: {
  gameId: number;
  score: number;
  highestTile: number;
  playTimeMinutes: number;
}): Promise<AwardGameRewardsResponse> => {
  const callable = httpsCallable<typeof payload, AwardGameRewardsResponse>(
    functions,
    "awardGameRewards",
  );

  const result = await callable(payload);
  return result.data;
};

export const claimTaskReward = async (payload: {
  taskId: string;
  reward: number;
  childDocId?: string | null;
}): Promise<ClaimTaskRewardResponse> => {
  const callable = httpsCallable<typeof payload, ClaimTaskRewardResponse>(
    functions,
    "claimTaskReward",
  );

  const result = await callable(payload);
  return result.data;
};

export const purchaseShopItem = async (payload: {
  itemId: string;
}): Promise<PurchaseShopItemResponse> => {
  const callable = httpsCallable<typeof payload, PurchaseShopItemResponse>(
    functions,
    "purchaseShopItem",
  );

  const result = await callable(payload);
  return result.data;
};

export const claimBattlePassReward = async (payload: {
  level: number;
  childDocId?: string | null;
}): Promise<ClaimBattlePassRewardResponse> => {
  const callable = httpsCallable<
    typeof payload,
    ClaimBattlePassRewardResponse
  >(functions, "claimBattlePassReward");

  const result = await callable(payload);
  return result.data;
};

export const unlockPlanet = async (payload: {
  planetId: number;
}): Promise<UnlockPlanetResponse> => {
  const callable = httpsCallable<typeof payload, UnlockPlanetResponse>(
    functions,
    "unlockPlanet",
  );

  const result = await callable(payload);
  return result.data;
};
