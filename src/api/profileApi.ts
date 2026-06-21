/**
 * profileApi — Node API transport for user profile data.
 *
 * Backend: Node (nodeApi + Auth0 Bearer token).
 * Transport only — no multi-step logic (that goes in services/).
 *
 * Endpoints:
 *   GET  /userinfo             → UserInfo (profile info + email)
 *   PATCH /userinfo            → UpdateUserInfoDto → UserInfo
 *   GET  /user-info            → UserExtended (bio, languages, skills summary)
 *   PATCH /user-info           → { bio?, languageIds? }
 *   GET  /country              → Country[]
 *   GET  /language             → Language[]
 *   GET  /skill                → Skill[]
 *   POST /skill                → Skill
 *   DELETE /skill/:id          → void
 *   GET  /cloudinary/sign      → CloudinarySignature
 *   POST /cloudinary/photo     → void  (update avatar, auth-required)
 */

import { nodeApi } from "@/api/nodeApi";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UserInfo {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  dialCode: string;
  dateOfBirth: string;
  role: string;
  country: string;
  city: string;
  gender: string;
  photo: string;
}

export interface UpdateUserInfoDto {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  dialCode: string;
  dateOfBirth: string;
  role: string;
  country: string;
  city?: string;
  gender: string;
}

export interface UserExtended {
  bio: string;
  languages: Array<{ _id: string; languageName: string }>;
}

export interface Country {
  _id: string;
  countryName: string;
  countryCode: string;
  countryDialCode: string;
}

export interface Language {
  _id: string;
  languageName: string;
}

export interface Skill {
  _id: string;
  skillName: string;
}

export interface CloudinarySignature {
  signature: string;
  timestamp: number;
  apiKey: string;
  cloudName: string;
  folder: string;
  eager?: string;
}

// ─── API calls ────────────────────────────────────────────────────────────────

export const profileApi = {
  /** GET /userinfo — profile data + email */
  async getUserInfo(): Promise<UserInfo> {
    const res = await nodeApi.get<{ data: UserInfo }>("/userinfo");
    return res.data.data;
  },

  /** PATCH /userinfo — update profile fields */
  async updateUserInfo(dto: UpdateUserInfoDto): Promise<UserInfo> {
    const res = await nodeApi.patch<{ data: UserInfo }>("/userinfo", dto);
    return res.data.data;
  },

  /** GET /user-info — extended info (bio, languages) */
  async getUserExtended(): Promise<UserExtended> {
    const res = await nodeApi.get<{ data: UserExtended }>("/user-info");
    return res.data.data;
  },

  /** PATCH /user-info — update bio and/or languageIds */
  async updateUserExtended(dto: { bio?: string; languageIds?: string[] }): Promise<void> {
    await nodeApi.patch("/user-info", dto);
  },

  /** GET /country — all countries with dial codes */
  async getCountries(): Promise<Country[]> {
    const res = await nodeApi.get<{ data: Country[] }>("/country");
    return res.data.data;
  },

  /** GET /language — all available languages */
  async getLanguages(): Promise<Language[]> {
    const res = await nodeApi.get<{ data: Language[] }>("/language");
    return res.data.data;
  },

  /** GET /skill — user's skills */
  async getSkills(): Promise<Skill[]> {
    const res = await nodeApi.get<{ data: Skill[] }>("/skill");
    return res.data.data;
  },

  /** POST /skill — add a skill */
  async addSkill(skillName: string): Promise<Skill> {
    const res = await nodeApi.post<{ data: Skill }>("/skill", { skillName });
    return res.data.data;
  },

  /** DELETE /skill/:id — remove a skill */
  async deleteSkill(id: string): Promise<void> {
    await nodeApi.delete(`/skill/${id}`);
  },

  /** GET /cloudinary/sign — get signed upload credentials */
  async getCloudinarySign(): Promise<CloudinarySignature> {
    const res = await nodeApi.get<CloudinarySignature>("/cloudinary/sign");
    return res.data;
  },

  /** POST /cloudinary/photo — update avatar (auth-required, secure path) */
  async updatePhoto(publicId: string): Promise<void> {
    await nodeApi.post("/cloudinary/photo", { publicId });
  },
};
