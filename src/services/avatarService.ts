/**
 * avatarService — 3-step Cloudinary avatar upload (AUTH_SECURITY.md §4).
 *
 * Step 1: GET /cloudinary/sign (Node, Bearer token)
 * Step 2: POST to Cloudinary with signed fields
 * Step 3: POST /cloudinary/photo { publicId } (Node, auth-required)
 *
 * Validates: image only, ≤ 10 MB.
 * Updates authStore.user.picture on success.
 */

import { profileApi } from "@/api/profileApi";
import { useAuthStore } from "@/stores/authStore";

export interface PickedImage {
  uri: string;
  type?: string;
  name?: string;
  size?: number;
}

const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

/**
 * Upload an avatar image through the 3-step Cloudinary flow.
 * @param image — picked image from expo-image-picker
 * @returns public URL of the uploaded image, or throws on failure
 */
async function uploadAvatar(image: PickedImage): Promise<string> {
  // Validate size if available
  if (image.size && image.size > MAX_SIZE_BYTES) {
    throw new Error("Image exceeds 10 MB limit");
  }

  // Validate type
  const mime = image.type ?? "image/jpeg";
  if (!mime.startsWith("image/")) {
    throw new Error("Only image files are allowed");
  }

  // Step 1 — get Cloudinary signing params
  const sign = await profileApi.getCloudinarySign();

  // Step 2 — upload directly to Cloudinary
  const formData = new FormData();
  formData.append("file", {
    uri: image.uri,
    type: mime,
    name: image.name ?? "avatar.jpg",
  } as unknown as Blob);
  formData.append("api_key", sign.apiKey);
  formData.append("signature", sign.signature);
  formData.append("timestamp", String(sign.timestamp));
  formData.append("folder", sign.folder ?? "avatars");
  if (sign.eager) {
    formData.append("eager", sign.eager);
  }

  const uploadUrl = `https://api.cloudinary.com/v1_1/${sign.cloudName}/auto/upload`;

  const uploadRes = await fetch(uploadUrl, {
    method: "POST",
    body: formData,
  });

  if (!uploadRes.ok) {
    const errText = await uploadRes.text();
    throw new Error(`Cloudinary upload failed: ${errText}`);
  }

  const uploadData = (await uploadRes.json()) as {
    public_id: string;
    secure_url: string;
  };

  const publicId = uploadData.public_id;
  const secureUrl = uploadData.secure_url;

  // Step 3 — update Auth0 picture via the secured Node endpoint
  await profileApi.updatePhoto(publicId);

  // Update authStore locally so the UI reflects immediately
  useAuthStore.getState().setPicture(secureUrl);

  return secureUrl;
}

export const avatarService = { uploadAvatar };
