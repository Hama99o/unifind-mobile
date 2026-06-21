/**
 * share.test.ts — unit tests for shareLink (cross-platform share util).
 *
 * Branches:
 *   NATIVE (Platform.OS !== "web", default in jest-expo = "ios"):
 *     - calls RN Share.share({ message: url, title }).
 *     - a rejection from Share.share is swallowed (no throw).
 *   WEB (Platform.OS === "web"):
 *     - navigator.share present → calls navigator.share({ url, title }).
 *     - else navigator.clipboard.writeText present → copies + showToast("clipboard").
 *     - else → showToast(url).
 *     - any thrown error in the share/clipboard path falls through to showToast(url).
 *
 * Platform.OS is read at call time inside shareLink, so we override it per-branch
 * with jest.spyOn on the Platform module's getter.
 *
 * showToast writes to the real (unmocked) toast Zustand store; we read it back
 * via useToastStore.getState().message. i18n is globally mocked so i18n.t(k)=>k,
 * hence the clipboard toast message is the literal key "clipboard".
 */

import { Platform, Share } from "react-native";
import { shareLink } from "@/utils/share";
import { useToastStore } from "@/stores/toastStore";

/** Set Platform.OS for the duration of a test (restored in afterEach). */
function setPlatform(os: string) {
  Object.defineProperty(Platform, "OS", {
    configurable: true,
    get: () => os,
  });
}

const realNavigator = (global as { navigator?: unknown }).navigator;

beforeEach(() => {
  jest.clearAllMocks();
  // Reset toast store between tests.
  useToastStore.setState({ message: null, seq: 0 });
});

afterEach(() => {
  // Restore Platform.OS to the jest-expo default ("ios") and navigator.
  setPlatform("ios");
  Object.defineProperty(global, "navigator", {
    configurable: true,
    writable: true,
    value: realNavigator,
  });
});

describe("shareLink — native branch", () => {
  it("calls RN Share.share with { message: url, title }", async () => {
    setPlatform("ios");
    const shareSpy = jest
      .spyOn(Share, "share")
      .mockResolvedValue({ action: "sharedAction" } as never);

    await shareLink("https://unifind.app/x", "My Title");

    expect(shareSpy).toHaveBeenCalledTimes(1);
    expect(shareSpy).toHaveBeenCalledWith({
      message: "https://unifind.app/x",
      title: "My Title",
    });
    shareSpy.mockRestore();
  });

  it("passes title as undefined when omitted", async () => {
    setPlatform("android");
    const shareSpy = jest
      .spyOn(Share, "share")
      .mockResolvedValue({ action: "sharedAction" } as never);

    await shareLink("https://unifind.app/y");

    expect(shareSpy).toHaveBeenCalledWith({
      message: "https://unifind.app/y",
      title: undefined,
    });
    shareSpy.mockRestore();
  });

  it("swallows a rejection from Share.share (resolves, no throw, no toast)", async () => {
    setPlatform("ios");
    const shareSpy = jest
      .spyOn(Share, "share")
      .mockRejectedValue(new Error("user dismissed"));

    await expect(shareLink("https://unifind.app/z")).resolves.toBeUndefined();
    expect(useToastStore.getState().message).toBeNull();
    shareSpy.mockRestore();
  });
});

describe("shareLink — web branch", () => {
  it("uses navigator.share when available", async () => {
    setPlatform("web");
    const navShare = jest.fn(async () => undefined);
    Object.defineProperty(global, "navigator", {
      configurable: true,
      writable: true,
      value: { share: navShare },
    });

    await shareLink("https://unifind.app/web", "WebTitle");

    expect(navShare).toHaveBeenCalledTimes(1);
    expect(navShare).toHaveBeenCalledWith({
      url: "https://unifind.app/web",
      title: "WebTitle",
    });
    // No toast on successful native web share.
    expect(useToastStore.getState().message).toBeNull();
  });

  it("falls back to clipboard.writeText + toast('clipboard') when navigator.share is absent", async () => {
    setPlatform("web");
    const writeText = jest.fn(async () => undefined);
    Object.defineProperty(global, "navigator", {
      configurable: true,
      writable: true,
      value: { clipboard: { writeText } },
    });

    await shareLink("https://unifind.app/copy");

    expect(writeText).toHaveBeenCalledWith("https://unifind.app/copy");
    // i18n.t("clipboard") => "clipboard" (key passthrough in the global mock).
    expect(useToastStore.getState().message).toBe("clipboard");
  });

  it("shows the URL in a toast when neither share nor clipboard exist", async () => {
    setPlatform("web");
    Object.defineProperty(global, "navigator", {
      configurable: true,
      writable: true,
      value: {},
    });

    await shareLink("https://unifind.app/fallback");

    expect(useToastStore.getState().message).toBe("https://unifind.app/fallback");
  });

  it("falls through to URL toast if navigator.share rejects", async () => {
    setPlatform("web");
    const navShare = jest.fn(async () => {
      throw new Error("share denied");
    });
    Object.defineProperty(global, "navigator", {
      configurable: true,
      writable: true,
      value: { share: navShare },
    });

    await shareLink("https://unifind.app/denied");

    // The catch block falls through to showToast(url).
    expect(navShare).toHaveBeenCalled();
    expect(useToastStore.getState().message).toBe("https://unifind.app/denied");
  });

  it("falls through to URL toast if clipboard.writeText rejects", async () => {
    setPlatform("web");
    const writeText = jest.fn(async () => {
      throw new Error("clipboard blocked");
    });
    Object.defineProperty(global, "navigator", {
      configurable: true,
      writable: true,
      value: { clipboard: { writeText } },
    });

    await shareLink("https://unifind.app/blocked");

    expect(writeText).toHaveBeenCalled();
    expect(useToastStore.getState().message).toBe("https://unifind.app/blocked");
  });
});
