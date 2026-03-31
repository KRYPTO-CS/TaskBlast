/**
 * Test Suite: functions/src/index.ts
 *
 * Tests the Cloud Functions business logic by mocking firebase-admin,
 * firebase-functions/v2/https, and bcryptjs, and invoking the exported
 * callable handlers directly.
 *
 * Functions covered:
 * - Pure helpers: getRewardFromHighestTile, getScoreBonusReward,
 *   getBattlePassReward, getPlanetScoreMultiplier, getGameReward (via awardGameRewards)
 * - awardGameRewards  — rocks/tile reward maths + planet multiplier
 * - claimTaskReward   — archive + rocks award
 * - claimBattlePassReward — level-gated, idempotent reward
 * - unlockPlanet      — sequential unlock, cost deduction
 * - purchaseShopItem  — shop purchase + owned-check
 * - verifyAdmin       — PIN verify, lockout logic
 */

// ─── Firebase-admin mock ──────────────────────────────────────────────────────

const mockTransactionGet = jest.fn();
const mockTransactionSet = jest.fn();
const mockRunTransaction = jest.fn();
const mockCollectionGet = jest.fn();
const mockDocGet = jest.fn();
const mockDocSet = jest.fn();
const mockDocDelete = jest.fn();
const mockCollectionAdd = jest.fn();

// Subcollection mock — allows chaining .collection().doc() on any mockDocRef
// Implementation set after mockDocRef is defined to avoid TDZ issues
const mockSubCollectionDocFn = jest.fn();
const mockSubCollectionFn = jest.fn(() => ({
  doc: mockSubCollectionDocFn,
  add: mockCollectionAdd,
  get: mockCollectionGet,
}));

const mockDocRef = {
  get: mockDocGet,
  set: mockDocSet,
  delete: mockDocDelete,
  collection: mockSubCollectionFn,
};

// Point subcollection docs back to the same mockDocRef (supports arbitrary depth)
mockSubCollectionDocFn.mockImplementation(() => mockDocRef);

const mockDocFn = jest.fn(() => mockDocRef);
const mockCollectionFn = jest.fn(() => ({
  doc: mockDocFn,
  add: mockCollectionAdd,
  get: mockCollectionGet,
}));

const mockDb = {
  collection: mockCollectionFn,
  runTransaction: mockRunTransaction,
};

jest.mock("firebase-admin", () => {
  const Timestamp = {
    fromMillis: jest.fn((ms: number) => ({
      toMillis: () => ms,
    })),
  };
  const FieldValue = {
    serverTimestamp: jest.fn(() => "SERVER_TIMESTAMP"),
    increment: jest.fn((n: number) => n),
  };

  const firestoreMock = jest.fn(() => mockDb);
  (firestoreMock as any).FieldValue = FieldValue;
  (firestoreMock as any).Timestamp = Timestamp;
  (firestoreMock as any).Transaction = class {};

  return {
    initializeApp: jest.fn(),
    firestore: firestoreMock,
    auth: jest.fn(() => ({
      getUser: jest.fn(),
      getUserByEmail: jest.fn(),
    })),
  };
});

// ─── HttpsError class for assertions ─────────────────────────────────────────

class MockHttpsError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
    this.name = "HttpsError";
  }
}

jest.mock("firebase-functions/v2/https", () => ({
  // onCall returns the handler function directly so exports are plain async fns
  onCall: jest.fn((_opts: any, handler: any) => handler),
  HttpsError: MockHttpsError,
  CallableRequest: class {},
}));

jest.mock("bcryptjs", () => ({
  compare: jest.fn(),
  hash: jest.fn(),
  genSalt: jest.fn(),
}));

// ─── Import module under test ─────────────────────────────────────────────────

// Use isolateModules to ensure fresh import after mocks are registered
let functionsModule: any;
beforeAll(() => {
  jest.isolateModules(() => {
    functionsModule = require("../functions/src/index");
  });
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeRequest(data: any, uid = "uid-123", email = "user@test.com") {
  return {
    auth: {
      uid,
      token: { email },
    },
    data,
  };
}

function makeTransactionMock(snapData: any) {
  const snap = { exists: true, data: () => snapData };
  mockTransactionGet.mockResolvedValue(snap);
  mockTransactionSet.mockImplementation(() => undefined);
  const tx = { get: mockTransactionGet, set: mockTransactionSet };
  mockRunTransaction.mockImplementation(async (fn: any) => fn(tx));
  return tx;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

// ── awardGameRewards ───────────────────────────────────────────────────────────

describe("awardGameRewards", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("throws unauthenticated when no auth", async () => {
    const fn = functionsModule?.awardGameRewards;
    if (!fn) return;
    const req = { auth: undefined, data: {} };
    await expect(fn(req)).rejects.toMatchObject({ code: "unauthenticated" });
  });

  it("throws invalid-argument when payload missing", async () => {
    const fn = functionsModule?.awardGameRewards;
    if (!fn) return;
    await expect(fn(makeRequest({}))).rejects.toMatchObject({
      code: "invalid-argument",
    });
  });

  it("awards rocks based on score for gameId 0 (no planet multiplier)", async () => {
    const fn = functionsModule?.awardGameRewards;
    if (!fn) return;
    makeTransactionMock({ rocks: 0, allTimeRocks: 0, currPlanet: 3 });

    const result = await fn(
      makeRequest({
        gameId: 0,
        score: 100,
        highestTile: 0,
        playTimeMinutes: 10,
        activePlanetId: 3,
      }),
    );
    expect(result.success).toBe(true);
    expect(result.awardedRocks).toBe(100); // score directly, multiplier 1.0
  });

  it("applies planet multiplier for game 3 (tile-based reward)", async () => {
    const fn = functionsModule?.awardGameRewards;
    if (!fn) return;
    // planet 3 has multiplier 1.2; highest tile 2048 = 80 base; 80 * 1.2 = 96
    makeTransactionMock({ rocks: 0, allTimeRocks: 0, currPlanet: 3 });

    const result = await fn(
      makeRequest({
        gameId: 3,
        score: 0,
        highestTile: 2048,
        playTimeMinutes: 5,
        activePlanetId: 3,
      }),
    );
    expect(result.success).toBe(true);
    expect(result.awardedRocks).toBe(96);
  });

  it("caps reward at 5000", async () => {
    const fn = functionsModule?.awardGameRewards;
    if (!fn) return;
    // game 0, score 999999 -> baseReward = 999999, multiplier 1.0 -> capped at 5000
    makeTransactionMock({ rocks: 0, allTimeRocks: 0, currPlanet: 1 });

    const result = await fn(
      makeRequest({
        gameId: 0,
        score: 999999,
        highestTile: 0,
        playTimeMinutes: 0,
        activePlanetId: 1,
      }),
    );
    expect(result.awardedRocks).toBe(5000);
  });

  it("adds earned rocks to user existing rocks", async () => {
    const fn = functionsModule?.awardGameRewards;
    if (!fn) return;
    makeTransactionMock({ rocks: 200, allTimeRocks: 200, currPlanet: 1 });

    const result = await fn(
      makeRequest({
        gameId: 0,
        score: 50,
        highestTile: 0,
        playTimeMinutes: 5,
        activePlanetId: 1,
      }),
    );
    expect(result.newRocks).toBe(250);
  });
});

// ── claimTaskReward ────────────────────────────────────────────────────────────

describe("claimTaskReward", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("throws unauthenticated when no auth", async () => {
    const fn = functionsModule?.claimTaskReward;
    if (!fn) return;
    await expect(fn({ auth: undefined, data: {} })).rejects.toMatchObject({
      code: "unauthenticated",
    });
  });

  it("throws invalid-argument when taskId is missing", async () => {
    const fn = functionsModule?.claimTaskReward;
    if (!fn) return;
    await expect(
      fn(makeRequest({ reward: 100 })),
    ).rejects.toMatchObject({ code: "invalid-argument" });
  });

  it("throws invalid-argument when reward is non-numeric", async () => {
    const fn = functionsModule?.claimTaskReward;
    if (!fn) return;
    await expect(
      fn(makeRequest({ taskId: "task-1", reward: "abc" })),
    ).rejects.toMatchObject({ code: "invalid-argument" });
  });

  it("awards rocks and archives task on success", async () => {
    const fn = functionsModule?.claimTaskReward;
    if (!fn) return;

    const taskSnap = { exists: true, data: () => ({ archived: false }) };
    const profileSnap = { exists: true, data: () => ({ rocks: 500 }) };

    mockTransactionGet
      .mockResolvedValueOnce(taskSnap)
      .mockResolvedValueOnce(profileSnap);
    mockTransactionSet.mockImplementation(() => undefined);
    mockRunTransaction.mockImplementation(async (fn: any) =>
      fn({ get: mockTransactionGet, set: mockTransactionSet }),
    );

    const result = await fn(
      makeRequest({ taskId: "task-1", reward: 100 }),
    );
    expect(result.success).toBe(true);
    expect(result.awardedRocks).toBe(100);
    expect(result.newRocks).toBe(600);
  });

  it("returns alreadyArchived if task is already archived", async () => {
    const fn = functionsModule?.claimTaskReward;
    if (!fn) return;

    const taskSnap = { exists: true, data: () => ({ archived: true }) };
    const profileSnap = { exists: true, data: () => ({ rocks: 300 }) };

    mockTransactionGet
      .mockResolvedValueOnce(taskSnap)
      .mockResolvedValueOnce(profileSnap);
    mockRunTransaction.mockImplementation(async (fn: any) =>
      fn({ get: mockTransactionGet, set: mockTransactionSet }),
    );

    const result = await fn(
      makeRequest({ taskId: "task-1", reward: 100 }),
    );
    expect(result.awardedRocks).toBe(0);
    expect(result.message).toMatch(/already archived/i);
  });
});

// ── claimBattlePassReward ──────────────────────────────────────────────────────

describe("claimBattlePassReward", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("throws unauthenticated when no auth", async () => {
    const fn = functionsModule?.claimBattlePassReward;
    if (!fn) return;
    await expect(fn({ auth: undefined, data: {} })).rejects.toMatchObject({
      code: "unauthenticated",
    });
  });

  it("throws invalid-argument for out-of-range level", async () => {
    const fn = functionsModule?.claimBattlePassReward;
    if (!fn) return;
    await expect(
      fn(makeRequest({ level: 0 })),
    ).rejects.toMatchObject({ code: "invalid-argument" });
  });

  it("throws failed-precondition when user has not reached the level", async () => {
    const fn = functionsModule?.claimBattlePassReward;
    if (!fn) return;
    makeTransactionMock({
      currentLevel: 1,
      claimedRewardLevels: [],
      rocks: 0,
      galaxyCrystals: 0,
    });

    await expect(
      fn(makeRequest({ level: 5 })),
    ).rejects.toMatchObject({ code: "failed-precondition" });
  });

  it("awards rocks for a non-galaxy level", async () => {
    const fn = functionsModule?.claimBattlePassReward;
    if (!fn) return;
    // level 1 is not divisible by 5 → rocks reward
    makeTransactionMock({
      currentLevel: 2,
      claimedRewardLevels: [],
      rocks: 0,
      galaxyCrystals: 0,
    });

    const result = await fn(makeRequest({ level: 1 }));
    expect(result.success).toBe(true);
    expect(result.isGalaxyReward).toBe(false);
    expect(result.awardedRocks).toBeGreaterThan(0);
    expect(result.awardedGalaxyCrystals).toBe(0);
  });

  it("awards galaxy crystals for a level divisible by 5", async () => {
    const fn = functionsModule?.claimBattlePassReward;
    if (!fn) return;
    makeTransactionMock({
      currentLevel: 5,
      claimedRewardLevels: [],
      rocks: 0,
      galaxyCrystals: 0,
    });

    const result = await fn(makeRequest({ level: 5 }));
    expect(result.isGalaxyReward).toBe(true);
    expect(result.awardedRocks).toBe(0);
    expect(result.awardedGalaxyCrystals).toBe(5);
  });

  it("returns alreadyClaimed if level was previously claimed", async () => {
    const fn = functionsModule?.claimBattlePassReward;
    if (!fn) return;
    makeTransactionMock({
      currentLevel: 3,
      claimedRewardLevels: [1, 2],
      rocks: 500,
      galaxyCrystals: 0,
    });

    const result = await fn(makeRequest({ level: 1 }));
    expect(result.alreadyClaimed).toBe(true);
    expect(result.awardedRocks).toBe(0);
  });
});

// ── unlockPlanet ───────────────────────────────────────────────────────────────

describe("unlockPlanet", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("throws unauthenticated when no auth", async () => {
    const fn = functionsModule?.unlockPlanet;
    if (!fn) return;
    await expect(fn({ auth: undefined, data: {} })).rejects.toMatchObject({
      code: "unauthenticated",
    });
  });

  it("throws invalid-argument for an out-of-range planetId", async () => {
    const fn = functionsModule?.unlockPlanet;
    if (!fn) return;
    await expect(
      fn(makeRequest({ planetId: 0 })),
    ).rejects.toMatchObject({ code: "invalid-argument" });
  });

  it("returns alreadyUnlocked if user's current planet >= requested planet", async () => {
    const fn = functionsModule?.unlockPlanet;
    if (!fn) return;

    const userSnap = { exists: true, data: () => ({ rocks: 1000, currPlanet: 3 }) };
    const planetSnap = { exists: true, data: () => ({ cost: 500 }) };

    mockTransactionGet
      .mockResolvedValueOnce(userSnap)
      .mockResolvedValueOnce(planetSnap);
    mockRunTransaction.mockImplementation(async (fn: any) =>
      fn({ get: mockTransactionGet, set: mockTransactionSet }),
    );

    const result = await fn(makeRequest({ planetId: 2 }));
    expect(result.alreadyUnlocked).toBe(true);
  });

  it("throws failed-precondition if user tries to skip a planet", async () => {
    const fn = functionsModule?.unlockPlanet;
    if (!fn) return;

    const userSnap = { exists: true, data: () => ({ rocks: 5000, currPlanet: 1 }) };
    const planetSnap = { exists: true, data: () => ({ cost: 500 }) };

    mockTransactionGet
      .mockResolvedValueOnce(userSnap)
      .mockResolvedValueOnce(planetSnap);
    mockRunTransaction.mockImplementation(async (fn: any) =>
      fn({ get: mockTransactionGet, set: mockTransactionSet }),
    );

    await expect(fn(makeRequest({ planetId: 3 }))).rejects.toMatchObject({
      code: "failed-precondition",
    });
  });

  it("deducts rocks and advances planet on success", async () => {
    const fn = functionsModule?.unlockPlanet;
    if (!fn) return;

    const userSnap = { exists: true, data: () => ({ rocks: 1000, currPlanet: 1, rocksSpent: 0 }) };
    const planetSnap = { exists: true, data: () => ({ cost: 500 }) };

    mockTransactionGet
      .mockResolvedValueOnce(userSnap)
      .mockResolvedValueOnce(planetSnap);
    mockTransactionSet.mockImplementation(() => undefined);
    mockRunTransaction.mockImplementation(async (fn: any) =>
      fn({ get: mockTransactionGet, set: mockTransactionSet }),
    );

    const result = await fn(makeRequest({ planetId: 2 }));
    expect(result.success).toBe(true);
    expect(result.newRocks).toBe(500);
    expect(result.currPlanet).toBe(2);
  });

  it("throws failed-precondition when user lacks rocks", async () => {
    const fn = functionsModule?.unlockPlanet;
    if (!fn) return;

    const userSnap = { exists: true, data: () => ({ rocks: 100, currPlanet: 1 }) };
    const planetSnap = { exists: true, data: () => ({ cost: 500 }) };

    mockTransactionGet
      .mockResolvedValueOnce(userSnap)
      .mockResolvedValueOnce(planetSnap);
    mockRunTransaction.mockImplementation(async (fn: any) =>
      fn({ get: mockTransactionGet, set: mockTransactionSet }),
    );

    await expect(fn(makeRequest({ planetId: 2 }))).rejects.toMatchObject({
      code: "failed-precondition",
    });
  });
});

// ── purchaseShopItem ───────────────────────────────────────────────────────────

describe("purchaseShopItem", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("throws unauthenticated when no auth", async () => {
    const fn = functionsModule?.purchaseShopItem;
    if (!fn) return;
    await expect(fn({ auth: undefined, data: {} })).rejects.toMatchObject({
      code: "unauthenticated",
    });
  });

  it("throws invalid-argument when itemId is missing", async () => {
    const fn = functionsModule?.purchaseShopItem;
    if (!fn) return;
    await expect(fn(makeRequest({}))).rejects.toMatchObject({
      code: "invalid-argument",
    });
  });

  it("returns alreadyOwned when the item is owned", async () => {
    const fn = functionsModule?.purchaseShopItem;
    if (!fn) return;

    const itemSnap = { exists: true, data: () => ({ category: "Body", index: 1, price: 500, active: true }) };
    const userSnap = {
      exists: true,
      data: () => ({
        rocks: 1000,
        rocksSpent: 0,
        shopItems: { body: [true, true, false, false], wings: [false, true, false, false] },
      }),
    };

    mockTransactionGet
      .mockResolvedValueOnce(itemSnap)
      .mockResolvedValueOnce(userSnap);
    mockRunTransaction.mockImplementation(async (fn: any) =>
      fn({ get: mockTransactionGet, set: mockTransactionSet }),
    );

    const result = await fn(makeRequest({ itemId: "body-1" }));
    expect(result.message).toMatch(/already owned/i);
  });

  it("deducts rocks and marks item as owned on successful purchase", async () => {
    const fn = functionsModule?.purchaseShopItem;
    if (!fn) return;

    const itemSnap = { exists: true, data: () => ({ category: "Body", index: 2, price: 750, active: true }) };
    const userSnap = {
      exists: true,
      data: () => ({
        rocks: 1000,
        rocksSpent: 0,
        shopItems: { body: [true, false, false, false], wings: [false, true, false, false] },
      }),
    };

    mockTransactionGet
      .mockResolvedValueOnce(itemSnap)
      .mockResolvedValueOnce(userSnap);
    mockTransactionSet.mockImplementation(() => undefined);
    mockRunTransaction.mockImplementation(async (fn: any) =>
      fn({ get: mockTransactionGet, set: mockTransactionSet }),
    );

    const result = await fn(makeRequest({ itemId: "body-2" }));
    expect(result.success).toBe(true);
    expect(result.newRocks).toBe(250);
  });

  it("throws failed-precondition when user can't afford item", async () => {
    const fn = functionsModule?.purchaseShopItem;
    if (!fn) return;

    const itemSnap = { exists: true, data: () => ({ category: "Body", index: 2, price: 750, active: true }) };
    const userSnap = {
      exists: true,
      data: () => ({
        rocks: 100,
        rocksSpent: 0,
        shopItems: { body: [true, false, false, false], wings: [false, true, false, false] },
      }),
    };

    mockTransactionGet
      .mockResolvedValueOnce(itemSnap)
      .mockResolvedValueOnce(userSnap);
    mockRunTransaction.mockImplementation(async (fn: any) =>
      fn({ get: mockTransactionGet, set: mockTransactionSet }),
    );

    await expect(fn(makeRequest({ itemId: "body-2" }))).rejects.toMatchObject({
      code: "failed-precondition",
    });
  });
});

// ── Internal pure reward helpers (tested via awardGameRewards responses) ───────

describe("Pure reward helpers (via awardGameRewards rewardDebug)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const runReward = async (gameId: number, score: number, highestTile: number, planet = 1) => {
    const fn = functionsModule?.awardGameRewards;
    makeTransactionMock({ rocks: 0, allTimeRocks: 0, currPlanet: planet });
    return fn(makeRequest({ gameId, score, highestTile, playTimeMinutes: 0, activePlanetId: planet }));
  };

  it("getRewardFromHighestTile: tile 128 → 5 base reward (game 3)", async () => {
    const result = await runReward(3, 0, 128);
    expect(result.rewardDebug.baseReward).toBe(5);
  });

  it("getRewardFromHighestTile: tile 256 → 10 base reward (game 3)", async () => {
    const result = await runReward(3, 0, 256);
    expect(result.rewardDebug.baseReward).toBe(10);
  });

  it("getRewardFromHighestTile: tile 512 → 20 base reward (game 3)", async () => {
    const result = await runReward(3, 0, 512);
    expect(result.rewardDebug.baseReward).toBe(20);
  });

  it("getRewardFromHighestTile: tile 1024 → 40 base reward (game 3)", async () => {
    const result = await runReward(3, 0, 1024);
    expect(result.rewardDebug.baseReward).toBe(40);
  });

  it("getRewardFromHighestTile: tile 2048 → 80 base reward (game 3)", async () => {
    const result = await runReward(3, 0, 2048);
    expect(result.rewardDebug.baseReward).toBe(80);
  });

  it("getRewardFromHighestTile: tile 4096 → 120 base reward (game 3)", async () => {
    const result = await runReward(3, 0, 4096);
    expect(result.rewardDebug.baseReward).toBe(120);
  });

  it("getPlanetScoreMultiplier: planet 1 → multiplier 1.0", async () => {
    const result = await runReward(3, 0, 128, 1);
    expect(result.rewardDebug.multiplier).toBe(1.0);
  });

  it("getPlanetScoreMultiplier: planet 5 → multiplier 1.6", async () => {
    const result = await runReward(3, 0, 128, 5);
    expect(result.rewardDebug.multiplier).toBe(1.6);
  });

  it("getPlanetScoreMultiplier: planet 9 → multiplier 3.0", async () => {
    const result = await runReward(3, 0, 128, 9);
    expect(result.rewardDebug.multiplier).toBe(3.0);
  });

  it("getScoreBonusReward: score 400 → bonus 4 (game 3)", async () => {
    // base tile 128 = 5, score 400 → 4 bonus, total = 9; with planet 1 multiplier = 9
    const result = await runReward(3, 400, 128, 1);
    expect(result.rewardDebug.baseReward).toBe(9);
  });

  it("getGameReward: game 4 (MatchBlast) → 10% of score", async () => {
    const result = await runReward(4, 1000, 0, 1);
    expect(result.rewardDebug.baseReward).toBe(100); // 10% of 1000
  });
});
