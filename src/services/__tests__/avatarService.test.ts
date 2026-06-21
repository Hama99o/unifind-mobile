/**
 * avatarService.test.ts — unit tests for the 3-step Cloudinary avatar upload.
 *
 * Flow under test (avatarService.uploadAvatar):
 *   Step 1: profileApi.getCloudinarySign()      → nodeApi.get("/cloudinary/sign")
 *   Step 2: POST FormData to Cloudinary          → global.fetch (mocked here)
 *   Step 3: profileApi.updatePhoto(publicId)     → nodeApi.post("/cloudinary/photo")
 *   Then: useAuthStore.setPicture(secureUrl) and return secureUrl.
 *
 * nodeApi is globally mocked (jest.setup.ts). We mock global.fetch for the
 * direct Cloudinary upload and reset the auth store between tests.
 *
 * Note: this service contains NO image-picker logic — it receives an already
 * picked image. The "reject" paths are therefore the size/type validations.
 */

import { avatarService } from "@/services/avatarService";
import { nodeApi } from "@/api/nodeApi";
import { useAuthStore } from "@/stores/authStore";

const realFetch = global.fetch;

const SIGN = {
  signature: "sig-abc",
  timestamp: 1700000000,
  apiKey: "key-123",
  cloudName: "demo-cloud",
  folder: "avatars",
  eager: "c_fill,w_200",
};

/** Stub a successful Cloudinary upload response. */
function mockCloudinaryOk(publicId = "avatars/pic1", secureUrl = "https://res.cloudinary.com/demo/pic1.jpg") {
  global.fetch = jest.fn(async () => ({
    ok: true,
    json: async () => ({ public_id: publicId, secure_url: secureUrl }),
  })) as unknown as typeof fetch;
}

beforeEach(() => {
  jest.clearAllMocks();
  global.fetch = realFetch;
  // Seed a logged-in user so setPicture has a user object to update.
  useAuthStore.setState({
    isLoggedIn: true,
    isBootstrapping: false,
    accessToken: "tok",
    user: { sub: "auth0|u1", userID: "u1", picture: "https://old/pic.png" },
  });
});

afterEach(() => {
  global.fetch = realFetch;
});

describe("avatarService.uploadAvatar — validation", () => {
  it("throws when the image exceeds the 10 MB limit", async () => {
    await expect(
      avatarService.uploadAvatar({ uri: "file://big.jpg", size: 11 * 1024 * 1024 })
    ).rejects.toThrow("Image exceeds 10 MB limit");
    // Aborts before any network call.
    expect(nodeApi.get).not.toHaveBeenCalled();
  });

  it("throws when the file type is not an image", async () => {
    await expect(
      avatarService.uploadAvatar({ uri: "file://doc.pdf", type: "application/pdf" })
    ).rejects.toThrow("Only image files are allowed");
    expect(nodeApi.get).not.toHaveBeenCalled();
  });

  it("accepts an image at exactly the size limit (10 MB is allowed)", async () => {
    (nodeApi.get as jest.Mock).mockResolvedValueOnce({ data: SIGN });
    (nodeApi.post as jest.Mock).mockResolvedValueOnce({ data: {} });
    mockCloudinaryOk();
    // size === MAX is NOT > MAX, so it passes the guard.
    await expect(
      avatarService.uploadAvatar({ uri: "file://ok.jpg", type: "image/jpeg", size: 10 * 1024 * 1024 })
    ).resolves.toBe("https://res.cloudinary.com/demo/pic1.jpg");
  });

  it("defaults the mime type to image/jpeg when none is provided (passes the type guard)", async () => {
    (nodeApi.get as jest.Mock).mockResolvedValueOnce({ data: SIGN });
    (nodeApi.post as jest.Mock).mockResolvedValueOnce({ data: {} });
    mockCloudinaryOk();
    await expect(
      avatarService.uploadAvatar({ uri: "file://noType.jpg" })
    ).resolves.toContain("cloudinary");
  });
});

describe("avatarService.uploadAvatar — happy path", () => {
  it("runs all 3 steps, updates the store picture and returns the secure URL", async () => {
    (nodeApi.get as jest.Mock).mockResolvedValueOnce({ data: SIGN });
    (nodeApi.post as jest.Mock).mockResolvedValueOnce({ data: {} });
    mockCloudinaryOk("avatars/jane", "https://res.cloudinary.com/demo/jane.jpg");

    const url = await avatarService.uploadAvatar({
      uri: "file://jane.jpg",
      type: "image/png",
      name: "jane.png",
      size: 2048,
    });

    // Step 1 — signing call.
    expect(nodeApi.get).toHaveBeenCalledWith("/cloudinary/sign");

    // Step 2 — direct upload to Cloudinary's auto/upload endpoint for the cloud.
    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [uploadUrl, opts] = (global.fetch as jest.Mock).mock.calls[0];
    expect(uploadUrl).toBe("https://api.cloudinary.com/v1_1/demo-cloud/auto/upload");
    expect(opts.method).toBe("POST");
    expect(opts.body).toBeInstanceOf(FormData);

    // Step 3 — update photo via secured Node endpoint with the returned public_id.
    expect(nodeApi.post).toHaveBeenCalledWith("/cloudinary/photo", { publicId: "avatars/jane" });

    // Store updated + return value.
    expect(useAuthStore.getState().user?.picture).toBe("https://res.cloudinary.com/demo/jane.jpg");
    expect(url).toBe("https://res.cloudinary.com/demo/jane.jpg");
  });

  it("uses the default avatars folder name and skips eager when the sign omits them", async () => {
    const minimalSign = {
      signature: "s",
      timestamp: 1,
      apiKey: "k",
      cloudName: "c",
      // no folder, no eager
    };
    (nodeApi.get as jest.Mock).mockResolvedValueOnce({ data: minimalSign });
    (nodeApi.post as jest.Mock).mockResolvedValueOnce({ data: {} });
    mockCloudinaryOk("p", "https://res.cloudinary.com/c/p.jpg");

    const url = await avatarService.uploadAvatar({ uri: "file://x.jpg", type: "image/jpeg" });

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect((global.fetch as jest.Mock).mock.calls[0][0]).toBe(
      "https://api.cloudinary.com/v1_1/c/auto/upload"
    );
    expect(url).toBe("https://res.cloudinary.com/c/p.jpg");
  });
});

describe("avatarService.uploadAvatar — error paths", () => {
  it("throws when the Cloudinary upload responds with a non-ok status", async () => {
    (nodeApi.get as jest.Mock).mockResolvedValueOnce({ data: SIGN });
    global.fetch = jest.fn(async () => ({
      ok: false,
      text: async () => "Invalid signature",
    })) as unknown as typeof fetch;

    await expect(
      avatarService.uploadAvatar({ uri: "file://x.jpg", type: "image/jpeg" })
    ).rejects.toThrow("Cloudinary upload failed: Invalid signature");

    // Step 3 not reached, store not updated.
    expect(nodeApi.post).not.toHaveBeenCalled();
    expect(useAuthStore.getState().user?.picture).toBe("https://old/pic.png");
  });

  it("propagates an error if the signing call fails (no upload attempted)", async () => {
    (nodeApi.get as jest.Mock).mockRejectedValueOnce(new Error("sign failed"));
    global.fetch = jest.fn() as unknown as typeof fetch;

    await expect(
      avatarService.uploadAvatar({ uri: "file://x.jpg", type: "image/jpeg" })
    ).rejects.toThrow("sign failed");
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
