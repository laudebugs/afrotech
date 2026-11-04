// Shrinks a camera photo in the browser before it's stored (plan 0006):
// at most 1600 px on the long side, as WebP, or JPEG where the browser can't
// write WebP. A 3–5 MB phone photo comes out around 150–300 KB.

export const MAX_SIDE = 1600;
/** The Worker refuses anything larger. */
export const MAX_BYTES = 2 * 1024 * 1024;

const encode = (canvas: HTMLCanvasElement, type: string, quality: number) =>
  new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));

export async function shrinkPhoto(file: Blob): Promise<Blob> {
  // from-image applies the camera's rotation, so portrait shots stay upright.
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  for (const quality of [0.8, 0.6, 0.4]) {
    const webp = await encode(canvas, "image/webp", quality);
    // Browsers that can't write WebP quietly hand back a PNG.
    const blob = webp?.type === "image/webp" ? webp : await encode(canvas, "image/jpeg", quality + 0.05);
    if (blob && blob.size <= MAX_BYTES) return blob;
  }
  throw new Error("This photo is too large to save, even shrunk.");
}
