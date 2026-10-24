const SUPPORTED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_EDGE = 1024;
const JPEG_QUALITY = 0.85;

export class UnsupportedImageError extends Error {
  name = "UnsupportedImageError";
}

export type ResizedImage = {
  base64: string;
  mimeType: "image/jpeg";
  width: number;
  height: number;
};

export function fitWithin(width: number, height: number, maxEdge = MAX_EDGE) {
  const scale = Math.min(1, maxEdge / Math.max(width, height));
  return {
    width: Math.round(width * scale),
    height: Math.round(height * scale),
  };
}

export async function resizeImage(file: File): Promise<ResizedImage> {
  if (!SUPPORTED_TYPES.has(file.type)) {
    throw new UnsupportedImageError("Use a JPEG, PNG or WebP photo.");
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new UnsupportedImageError(
      "That photo could not be opened. Try a different one.",
    );
  }

  const { width, height } = fitWithin(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) {
    bitmap.close();
    throw new Error("Canvas 2D context is unavailable.");
  }

  // JPEG has no alpha, so transparent PNG areas would otherwise turn black.
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const dataUrl = canvas.toDataURL("image/jpeg", JPEG_QUALITY);
  return {
    base64: dataUrl.slice(dataUrl.indexOf(",") + 1),
    mimeType: "image/jpeg",
    width,
    height,
  };
}

export function toDataUrl(image: ResizedImage): string {
  return `data:${image.mimeType};base64,${image.base64}`;
}
