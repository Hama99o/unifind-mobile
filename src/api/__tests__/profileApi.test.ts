/**
 * profileApi.test.ts — Node transport for user profile data.
 *
 * Asserts exact endpoint path, method, payload, and returned shape for every
 * function. Most GET/PATCH calls unwrap res.data.data; getCloudinarySign
 * returns res.data directly.
 */

import {
  profileApi,
  type UpdateUserInfoDto,
} from "@/api/profileApi";
import { nodeApi } from "@/api/nodeApi";

beforeEach(() => {
  jest.clearAllMocks();
});

describe("profileApi.getUserInfo", () => {
  it("GETs /userinfo and unwraps res.data.data", async () => {
    const info = { firstName: "Ada", email: "a@x.io" } as never;
    (nodeApi.get as jest.Mock).mockResolvedValueOnce({ data: { data: info } });

    const result = await profileApi.getUserInfo();

    expect((nodeApi.get as jest.Mock).mock.calls[0][0]).toBe("/userinfo");
    expect(result).toBe(info);
  });

  it("propagates a rejection", async () => {
    (nodeApi.get as jest.Mock).mockRejectedValueOnce(new Error("401"));
    await expect(profileApi.getUserInfo()).rejects.toThrow("401");
  });
});

describe("profileApi.updateUserInfo", () => {
  it("PATCHes /userinfo with the dto and unwraps res.data.data", async () => {
    const dto: UpdateUserInfoDto = {
      firstName: "Ada",
      lastName: "Lovelace",
      phoneNumber: "123",
      dialCode: "+1",
      dateOfBirth: "1990-01-01",
      role: "student",
      country: "US",
      city: "NYC",
      gender: "f",
    };
    const updated = { ...dto, email: "a@x.io", photo: "" } as never;
    (nodeApi.patch as jest.Mock).mockResolvedValueOnce({
      data: { data: updated },
    });

    const result = await profileApi.updateUserInfo(dto);

    expect((nodeApi.patch as jest.Mock).mock.calls[0][0]).toBe("/userinfo");
    expect((nodeApi.patch as jest.Mock).mock.calls[0][1]).toEqual(dto);
    expect(result).toBe(updated);
  });
});

describe("profileApi.getUserExtended", () => {
  it("GETs /user-info and unwraps res.data.data", async () => {
    const ext = { bio: "hi", languages: [] };
    (nodeApi.get as jest.Mock).mockResolvedValueOnce({ data: { data: ext } });

    const result = await profileApi.getUserExtended();

    expect((nodeApi.get as jest.Mock).mock.calls[0][0]).toBe("/user-info");
    expect(result).toBe(ext);
  });
});

describe("profileApi.updateUserExtended", () => {
  it("PATCHes /user-info with bio and languageIds", async () => {
    (nodeApi.patch as jest.Mock).mockResolvedValueOnce({ data: {} });

    await profileApi.updateUserExtended({ bio: "new bio", languageIds: ["l1"] });

    expect((nodeApi.patch as jest.Mock).mock.calls[0][0]).toBe("/user-info");
    expect((nodeApi.patch as jest.Mock).mock.calls[0][1]).toEqual({
      bio: "new bio",
      languageIds: ["l1"],
    });
  });

  it("returns undefined (void) on success", async () => {
    (nodeApi.patch as jest.Mock).mockResolvedValueOnce({ data: {} });
    expect(await profileApi.updateUserExtended({ bio: "x" })).toBeUndefined();
  });
});

describe("profileApi.getCountries", () => {
  it("GETs /country and unwraps res.data.data", async () => {
    const countries = [{ _id: "1", countryName: "US", countryCode: "US", countryDialCode: "+1" }];
    (nodeApi.get as jest.Mock).mockResolvedValueOnce({ data: { data: countries } });

    const result = await profileApi.getCountries();

    expect((nodeApi.get as jest.Mock).mock.calls[0][0]).toBe("/country");
    expect(result).toBe(countries);
  });
});

describe("profileApi.getLanguages", () => {
  it("GETs /language and unwraps res.data.data", async () => {
    const langs = [{ _id: "1", languageName: "English" }];
    (nodeApi.get as jest.Mock).mockResolvedValueOnce({ data: { data: langs } });

    const result = await profileApi.getLanguages();

    expect((nodeApi.get as jest.Mock).mock.calls[0][0]).toBe("/language");
    expect(result).toBe(langs);
  });
});

describe("profileApi.getSkills", () => {
  it("GETs /skill and unwraps res.data.data", async () => {
    const skills = [{ _id: "1", skillName: "TS" }];
    (nodeApi.get as jest.Mock).mockResolvedValueOnce({ data: { data: skills } });

    const result = await profileApi.getSkills();

    expect((nodeApi.get as jest.Mock).mock.calls[0][0]).toBe("/skill");
    expect(result).toBe(skills);
  });
});

describe("profileApi.addSkill", () => {
  it("POSTs /skill with { skillName } and unwraps res.data.data", async () => {
    const skill = { _id: "9", skillName: "Go" };
    (nodeApi.post as jest.Mock).mockResolvedValueOnce({ data: { data: skill } });

    const result = await profileApi.addSkill("Go");

    expect((nodeApi.post as jest.Mock).mock.calls[0][0]).toBe("/skill");
    expect((nodeApi.post as jest.Mock).mock.calls[0][1]).toEqual({
      skillName: "Go",
    });
    expect(result).toBe(skill);
  });
});

describe("profileApi.deleteSkill", () => {
  it("DELETEs /skill/:id", async () => {
    (nodeApi.delete as jest.Mock).mockResolvedValueOnce({ data: {} });
    await profileApi.deleteSkill("sk-3");
    expect((nodeApi.delete as jest.Mock).mock.calls[0][0]).toBe("/skill/sk-3");
  });

  it("propagates a rejection", async () => {
    (nodeApi.delete as jest.Mock).mockRejectedValueOnce(new Error("403"));
    await expect(profileApi.deleteSkill("sk-3")).rejects.toThrow("403");
  });
});

describe("profileApi.getCloudinarySign", () => {
  it("GETs /cloudinary/sign and returns res.data directly (not res.data.data)", async () => {
    const sig = {
      signature: "sig",
      timestamp: 123,
      apiKey: "k",
      cloudName: "c",
      folder: "f",
    };
    (nodeApi.get as jest.Mock).mockResolvedValueOnce({ data: sig });

    const result = await profileApi.getCloudinarySign();

    expect((nodeApi.get as jest.Mock).mock.calls[0][0]).toBe("/cloudinary/sign");
    expect(result).toBe(sig);
  });
});

describe("profileApi.updatePhoto", () => {
  it("POSTs /cloudinary/photo with { publicId }", async () => {
    (nodeApi.post as jest.Mock).mockResolvedValueOnce({ data: {} });

    await profileApi.updatePhoto("pub-123");

    expect((nodeApi.post as jest.Mock).mock.calls[0][0]).toBe(
      "/cloudinary/photo"
    );
    expect((nodeApi.post as jest.Mock).mock.calls[0][1]).toEqual({
      publicId: "pub-123",
    });
  });

  it("returns undefined (void) on success", async () => {
    (nodeApi.post as jest.Mock).mockResolvedValueOnce({ data: {} });
    expect(await profileApi.updatePhoto("p")).toBeUndefined();
  });
});
