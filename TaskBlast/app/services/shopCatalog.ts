export type ShopCategory = "Body" | "Wings" | "Topper";

export interface ShopCatalogItem {
  id: string;
  category: ShopCategory;
  index: number;
  nameKey: string;
  iconKey: string;
  price: number;
  active?: boolean;
}

export const DEFAULT_SHOP_CATALOG: ShopCatalogItem[] = [
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
    id: "topper-0",
    category: "Topper",
    index: 0,
    nameKey: "Shop.dTopper",
    iconKey: "ship-topper-default",
    price: 0,
    active: true,
  },
  {
    id: "topper-1",
    category: "Topper",
    index: 1,
    nameKey: "Shop.bTopper",
    iconKey: "ship-topper-blue_fire",
    price: 2000,
    active: true,
  },
  {
    id: "topper-2",
    category: "Topper",
    index: 2,
    nameKey: "Shop.aTopper",
    iconKey: "ship-topper-artemis",
    price: 15000,
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

export const getShopIconSource = (iconKey: string) => {
  switch (iconKey) {
    case "ship-body-blue":
      return require("../../assets/images/shop_icons/ShipBodyIconBlue.png");
    case "ship-body-red":
      return require("../../assets/images/shop_icons/ShipBodyIconRed.png");
    case "ship-body-green":
      return require("../../assets/images/shop_icons/ShipBodyIconGreen.png");
    case "ship-body-yellow":
      return require("../../assets/images/shop_icons/ShipBodyIconYellow.png");
    case "ship-wing-blue":
      return require("../../assets/images/shop_icons/ShipWingIconBlue.png");
    case "ship-wing-red":
      return require("../../assets/images/shop_icons/ShipWingIconRed.png");
    case "ship-wing-green":
      return require("../../assets/images/shop_icons/ShipWingIconGreen.png");
    case "ship-wing-yellow":
      return require("../../assets/images/shop_icons/ShipWingIconYellow.png");
    case "ship-topper-default":
      return require("../../assets/images/shop_icons/ShipTopperIconDefault.png");
    case "ship-topper-blue_fire":
      return require("../../assets/images/shop_icons/ShipTopperIconBlue.png");
    case "ship-topper-artemis":
      return require("../../assets/images/shop_icons/ShipTopperIconArtemis.png");
    default:
      return require("../../assets/images/shop_icons/ShipBodyIconBlue.png");
  }
};
