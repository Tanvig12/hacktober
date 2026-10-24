import { describe, expect, it } from "vitest";
import { fitWithin, resizeImage, UnsupportedImageError } from "./resize";

describe("fitWithin", () => {
  it("scales a landscape image to 1024px on the long edge", () => {
    expect(fitWithin(4032, 3024)).toEqual({ width: 1024, height: 768 });
  });

  it("scales a portrait image by its height", () => {
    expect(fitWithin(3000, 4000)).toEqual({ width: 768, height: 1024 });
  });

  it("never upscales a small image", () => {
    expect(fitWithin(640, 480)).toEqual({ width: 640, height: 480 });
  });
});

describe("resizeImage", () => {
  it.each(["image/heic", "image/gif", "application/pdf", ""])(
    "rejects %j before decoding",
    async (type) => {
      const file = new File(["x"], "photo", { type });
      await expect(resizeImage(file)).rejects.toBeInstanceOf(
        UnsupportedImageError,
      );
    },
  );
});
