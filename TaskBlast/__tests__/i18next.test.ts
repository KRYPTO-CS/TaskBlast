import i18next from "i18next";

describe("i18next bootstrap", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it("restores persisted language when it differs from current language", async () => {
    const changeLanguage = jest.fn();
    const init = jest.fn();
    const use = jest.fn().mockReturnValue({ init });

    jest.doMock("i18next", () => ({
      __esModule: true,
      default: {
        language: "en",
        changeLanguage,
        use,
        init,
      },
    }));

    jest.doMock("react-i18next", () => ({
      initReactI18next: { type: "3rdParty", init: jest.fn() },
    }));

    jest.doMock("@react-native-async-storage/async-storage", () => ({
      __esModule: true,
      default: {
        getItem: jest
          .fn()
          .mockResolvedValue(JSON.stringify({ language: "es" })),
      },
    }));

    require("../app/i18next");
    await Promise.resolve();

    expect(changeLanguage).toHaveBeenCalledWith("es");
  });

  it("silently ignores malformed persisted language payload", async () => {
    const changeLanguage = jest.fn();
    const init = jest.fn();
    const use = jest.fn().mockReturnValue({ init });

    jest.doMock("i18next", () => ({
      __esModule: true,
      default: {
        language: "en",
        changeLanguage,
        use,
        init,
      },
    }));

    jest.doMock("react-i18next", () => ({
      initReactI18next: { type: "3rdParty", init: jest.fn() },
    }));

    jest.doMock("@react-native-async-storage/async-storage", () => ({
      __esModule: true,
      default: {
        getItem: jest.fn().mockResolvedValue("{ not-valid-json"),
      },
    }));

    require("../app/i18next");
    await Promise.resolve();

    expect(changeLanguage).not.toHaveBeenCalled();
  });

  it("does not change language when persisted language matches current", async () => {
    const changeLanguage = jest.fn();
    const init = jest.fn();
    const use = jest.fn().mockReturnValue({ init });

    jest.doMock("i18next", () => ({
      __esModule: true,
      default: {
        language: "en",
        changeLanguage,
        use,
        init,
      },
    }));

    jest.doMock("react-i18next", () => ({
      initReactI18next: { type: "3rdParty", init: jest.fn() },
    }));

    jest.doMock("@react-native-async-storage/async-storage", () => ({
      __esModule: true,
      default: {
        getItem: jest
          .fn()
          .mockResolvedValue(JSON.stringify({ language: "en" })),
      },
    }));

    require("../app/i18next");
    await Promise.resolve();

    expect(changeLanguage).not.toHaveBeenCalled();
  });
});
