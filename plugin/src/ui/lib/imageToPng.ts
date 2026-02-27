/**
 * Converte qualquer imagem (data URL ou HTTP) em bytes PNG.
 * Figma createImage() só aceita PNG e JPEG; WebP e outros falham com "Image type is unsupported".
 */

export function ensurePngBytes(imageUrl: string): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas 2d not available"));
          return;
        }
        ctx.drawImage(img, 0, 0);
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("toBlob failed"));
              return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
              const buf = reader.result as ArrayBuffer;
              resolve(new Uint8Array(buf));
            };
            reader.onerror = () => reject(reader.error);
            reader.readAsArrayBuffer(blob);
          },
          "image/png",
          0.92
        );
      } catch (e) {
        reject(e);
      }
    };

    img.onerror = () => reject(new Error("Image load failed"));
    img.src = imageUrl;
  });
}
