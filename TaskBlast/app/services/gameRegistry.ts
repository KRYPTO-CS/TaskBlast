export type GameRewardStrategy = "raw-score" | "highest-tile";

export type GameDefinition = {
  id: number;
  name: string;
  description: string;
  url: string | null;
  rewardStrategy: GameRewardStrategy;
  rawScoreMultiplier?: number;
  isFreeTime?: boolean;
};

export const GAME_SCORE_STORAGE_KEY = "game_score";
export const GAME_HIGHEST_TILE_STORAGE_KEY = "game_highest_tile";
export const ACTIVE_PLANET_STORAGE_KEY = "active_planet_id";

export const GAME_DEFINITIONS: GameDefinition[] = [
  {
    id: 0,
    name: "Asteroid Blaster",
    description: "Blast the asteroids!",
    url: "https://krypto-cs.github.io/SpaceShooter/",
    rewardStrategy: "raw-score",
  },
  {
    id: 1,
    name: "Space Swerve",
    description: "Dodge the asteroids!",
    url: "https://krypto-cs.github.io/SpaceShooter/",
    rewardStrategy: "raw-score",
  },
  {
    id: 2,
    name: "Free Time",
    description: "Take a break YOUR way!",
    url: null,
    rewardStrategy: "raw-score",
    isFreeTime: true,
  },
  {
    id: 3,
    name: "2048",
    description: "Merge tiles. Aim for 2048!",
    url: "https://krypto-cs.github.io/2048Blast/",
    rewardStrategy: "highest-tile",
  },
  {
    id: 4,
    name: "MatchBlast",
    description: "Match pairs fast for bonus rocks!",
    url: "https://krypto-cs.github.io/MatchBlast/",
    rewardStrategy: "raw-score",
    rawScoreMultiplier: 0.1,
  },
];

const DEFAULT_GAME = GAME_DEFINITIONS[0];

export const getGameDefinition = (gameId: number): GameDefinition => {
  return GAME_DEFINITIONS.find((game) => game.id === gameId) ?? DEFAULT_GAME;
};

const getHighestTileReward = (highestTile: number): number => {
  if (highestTile >= 4096) return 120;
  if (highestTile >= 2048) return 80;
  if (highestTile >= 1024) return 40;
  if (highestTile >= 512) return 20;
  if (highestTile >= 256) return 10;
  if (highestTile >= 128) return 5;
  return 0;
};

const getScoreBonusReward = (score: number): number => {
  // Hybrid economy: add +1 rock per 100 score, capped at +40 bonus rocks.
  return Math.min(40, Math.floor(score / 100));
};

export const getRocksReward = (
  gameId: number,
  score: number,
  highestTile?: number,
): number => {
  const game = getGameDefinition(gameId);
  const safeScore = Math.max(0, Math.floor(Number(score) || 0));

  if (game.rewardStrategy === "highest-tile") {
    const safeTile = Math.max(0, Math.floor(Number(highestTile) || 0));
    const baseReward = getHighestTileReward(safeTile);
    const scoreBonus = getScoreBonusReward(safeScore);

    // Keep 2048 rewards bounded so long sessions do not inflate progression.
    return Math.min(120, baseReward + scoreBonus);
  }

  if (typeof game.rawScoreMultiplier === "number") {
    return Math.max(0, Math.floor(safeScore * game.rawScoreMultiplier));
  }

  return safeScore;
};
