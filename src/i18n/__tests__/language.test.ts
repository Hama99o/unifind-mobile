/**
 * language.ts — the chosen language must survive an app restart
 * (QA 2026-11-10 BUG-02: Arabic was lost on every cold start).
 */

import i18n from "@/i18n";
import { secureStorage } from "@/utils/secure-storage";
import { LANG_STORAGE_KEY, restoreAppLanguage, setAppLanguage } from "@/i18n/language";

const changeLanguage = jest.fn(async (lng: string) => {
  (i18n as unknown as { language: string }).language = lng;
});

beforeEach(async () => {
  (i18n as unknown as { changeLanguage: typeof changeLanguage }).changeLanguage = changeLanguage;
  (i18n as unknown as { language: string }).language = "en";
  changeLanguage.mockClear();
  await secureStorage.remove(LANG_STORAGE_KEY);
});

describe("setAppLanguage", () => {
  it("switches i18n and stores the choice", async () => {
    await setAppLanguage("ar");
    expect(changeLanguage).toHaveBeenCalledWith("ar");
    expect(await secureStorage.get(LANG_STORAGE_KEY)).toBe("ar");
  });

  it("ignores an unsupported language", async () => {
    await setAppLanguage("fr");
    expect(changeLanguage).not.toHaveBeenCalled();
    expect(await secureStorage.get(LANG_STORAGE_KEY)).toBeNull();
  });
});

describe("restoreAppLanguage", () => {
  it("applies the stored language at boot", async () => {
    await secureStorage.set(LANG_STORAGE_KEY, "ar");
    await expect(restoreAppLanguage()).resolves.toBe("ar");
    expect(changeLanguage).toHaveBeenCalledWith("ar");
  });

  it("keeps the default when nothing is stored", async () => {
    await expect(restoreAppLanguage()).resolves.toBe("en");
    expect(changeLanguage).not.toHaveBeenCalled();
  });

  it("ignores a corrupt stored value", async () => {
    await secureStorage.set(LANG_STORAGE_KEY, "xx");
    await expect(restoreAppLanguage()).resolves.toBe("en");
    expect(changeLanguage).not.toHaveBeenCalled();
  });

  it("never throws when storage fails", async () => {
    const spy = jest.spyOn(secureStorage, "get").mockRejectedValueOnce(new Error("keystore"));
    await expect(restoreAppLanguage()).resolves.toBe("en");
    spy.mockRestore();
  });
});
