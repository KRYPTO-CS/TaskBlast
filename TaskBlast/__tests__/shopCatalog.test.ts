import {
  DEFAULT_SHOP_CATALOG,
  getShopIconSource,
} from "../app/services/shopCatalog";

describe("shopCatalog", () => {
  it("contains expected baseline entries", () => {
    expect(DEFAULT_SHOP_CATALOG.length).toBeGreaterThanOrEqual(10);
    expect(DEFAULT_SHOP_CATALOG.some((item) => item.category === "Body")).toBe(
      true,
    );
    expect(
      DEFAULT_SHOP_CATALOG.some((item) => item.category === "Wings"),
    ).toBe(true);
    expect(
      DEFAULT_SHOP_CATALOG.some((item) => item.category === "Topper"),
    ).toBe(true);
  });

  it("returns mapped icon for known keys", () => {
    const known = getShopIconSource("ship-body-red");
    expect(known).toBeTruthy();
  });

  it("falls back to blue body icon for unknown keys", () => {
    const unknown = getShopIconSource("not-a-real-icon-key");
    const fallback = getShopIconSource("ship-body-blue");

    expect(unknown).toBe(fallback);
  });
});
