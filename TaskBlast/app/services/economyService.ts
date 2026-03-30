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
