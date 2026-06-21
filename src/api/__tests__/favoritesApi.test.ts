/**
 * favoritesApi.test.ts — Node transport for user favorites.
 *
 * Asserts exact endpoint path, method, payload, and returned shape for both
 * exported functions, covering success and non-success paths.
 */

import { favoritesApi } from "@/api/favoritesApi";
import { nodeApi } from "@/api/nodeApi";

beforeEach(() => {
  jest.clearAllMocks();
});

describe("favoritesApi.toggleFavorite", () => {
  it("POSTs /favorites with { itemID, itemType } and returns res.data", async () => {
    (nodeApi.post as jest.Mock).mockResolvedValueOnce({
      data: { type: "success", action: "added" },
    });

    const result = await favoritesApi.toggleFavorite("prog-1", "Program");

    expect((nodeApi.post as jest.Mock).mock.calls[0][0]).toBe("/favorites");
    expect((nodeApi.post as jest.Mock).mock.calls[0][1]).toEqual({
      itemID: "prog-1",
      itemType: "Program",
    });
    expect(result).toEqual({ type: "success", action: "added" });
  });

  it("returns the error response body verbatim", async () => {
    (nodeApi.post as jest.Mock).mockResolvedValueOnce({
      data: { type: "error", message: "nope" },
    });
    const result = await favoritesApi.toggleFavorite("x", "Offering");
    expect(result).toEqual({ type: "error", message: "nope" });
  });

  it("propagates a rejection", async () => {
    (nodeApi.post as jest.Mock).mockRejectedValueOnce(new Error("network"));
    await expect(
      favoritesApi.toggleFavorite("x", "Institution")
    ).rejects.toThrow("network");
  });
});

describe("favoritesApi.getFavoriteIds", () => {
  it("GETs /favorites/:userId/:type and maps to itemID list", async () => {
    (nodeApi.get as jest.Mock).mockResolvedValueOnce({
      data: {
        type: "success",
        data: [
          { _id: "a", itemID: "i1", itemType: "Program", userId: "u1" },
          { _id: "b", itemID: "i2", itemType: "Program", userId: "u1" },
        ],
      },
    });

    const result = await favoritesApi.getFavoriteIds("u1", "Program");

    expect((nodeApi.get as jest.Mock).mock.calls[0][0]).toBe(
      "/favorites/u1/Program"
    );
    expect(result).toEqual(["i1", "i2"]);
  });

  it("returns [] when type is not 'success'", async () => {
    (nodeApi.get as jest.Mock).mockResolvedValueOnce({
      data: { type: "error", data: [] },
    });
    expect(await favoritesApi.getFavoriteIds("u1", "Offering")).toEqual([]);
  });

  it("returns [] when data missing entirely", async () => {
    (nodeApi.get as jest.Mock).mockResolvedValueOnce({ data: undefined });
    expect(await favoritesApi.getFavoriteIds("u1", "Specialist")).toEqual([]);
  });
});
