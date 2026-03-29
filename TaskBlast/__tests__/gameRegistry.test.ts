import {
  GAME_DEFINITIONS,
  getGameDefinition,
  getRocksReward,
} from "../app/services/gameRegistry";

describe("gameRegistry", () => {
  it("contains 2048 as a playable game", () => {
    const game2048 = GAME_DEFINITIONS.find((game) => game.id === 3);

    expect(game2048).toBeTruthy();
    expect(game2048?.name).toBe("2048");
    expect(game2048?.url).toBe("https://vinbi07.github.io/2048Blast/");
  });

  it("contains MatchBlast as a playable game", () => {
    const matchBlast = GAME_DEFINITIONS.find((game) => game.id === 4);

    expect(matchBlast).toBeTruthy();
    expect(matchBlast?.name).toBe("MatchBlast");
    expect(matchBlast?.url).toBe("https://vinbi07.github.io/MatchBlast/");
  });

  it("returns default game for unknown id", () => {
    const unknown = getGameDefinition(999);

    expect(unknown.id).toBe(0);
  });

  it("uses raw score reward for existing games", () => {
    expect(getRocksReward(0, 1250, 1024)).toBe(1250);
    expect(getRocksReward(1, 89, 512)).toBe(89);
    expect(getRocksReward(4, 340, 0)).toBe(340);
  });

  it("uses hybrid tile and score reward for 2048", () => {
    expect(getRocksReward(3, 0, 64)).toBe(0);
    expect(getRocksReward(3, 100, 128)).toBe(6);
    expect(getRocksReward(3, 778, 256)).toBe(17);
    expect(getRocksReward(3, 950, 512)).toBe(29);
    expect(getRocksReward(3, 1400, 1024)).toBe(54);
    expect(getRocksReward(3, 2100, 2048)).toBe(101);
    expect(getRocksReward(3, 9999, 4096)).toBe(120);
    expect(getRocksReward(3, 9999, 8192)).toBe(120);
  });

  it("never awards negative rocks", () => {
    expect(getRocksReward(0, -1, 0)).toBe(0);
    expect(getRocksReward(3, 0, -2048)).toBe(0);
  });
});
