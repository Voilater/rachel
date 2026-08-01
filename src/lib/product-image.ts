const MAX_IMAGE_BYTES = 900_000;

export async function fileToProductImage(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Please choose an image file (JPG, PNG, or WebP).");
  }

  if (file.size > 8 * 1024 * 1024) {
    throw new Error("Image must be under 8 MB.");
  }

  const dataUrl = await readFileAsDataUrl(file);
  const resized = await resizeImageDataUrl(dataUrl, 800);

  if (resized.length > MAX_IMAGE_BYTES) {
    throw new Error("Image is too large after processing. Try a smaller file.");
  }

  return resized;
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Could not read image file."));
    reader.readAsDataURL(file);
  });
}

function resizeImageDataUrl(dataUrl: string, maxWidth: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxWidth / img.width);
      const width = Math.round(img.width * scale);
      const height = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Could not process image."));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", 0.85));
    };
    img.onerror = () => reject(new Error("Could not load image for processing."));
    img.src = dataUrl;
  });
}

export function isDataUrlImage(src: string) {
  return src.startsWith("data:image/");
}
