// Daily Pump (and later progress) photos are shrunk on the phone before upload: a
// phone photo is 3–8 MB, the upload is ~200–500 KB. Drawing the image on a canvas
// also drops its metadata — GPS location included — which matters for personal photos.
// Browsers apply the photo's EXIF rotation when they draw it, so it stays upright.

export const PHOTO_MAX_EDGE_PX = 1600;
export const PHOTO_JPEG_QUALITY = 0.82;
export const PHOTO_MAX_INPUT_BYTES = 15 * 1024 * 1024;

export class PhotoReadError extends Error {}
export class PhotoTooLargeError extends Error {}

function loadImage(file: Blob): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file);
  const image = new Image();
  image.src = url;
  return image
    .decode()
    .then(() => image)
    .finally(() => URL.revokeObjectURL(url));
}

/** A JPEG of at most PHOTO_MAX_EDGE_PX on the long side. */
export async function compressPhoto(file: File): Promise<Blob> {
  if (file.size > PHOTO_MAX_INPUT_BYTES) throw new PhotoTooLargeError();

  let image: HTMLImageElement;
  try {
    image = await loadImage(file);
  } catch {
    // e.g. a HEIC file on a browser that can't decode it (iOS hands over JPEG itself).
    throw new PhotoReadError();
  }

  const scale = Math.min(1, PHOTO_MAX_EDGE_PX / Math.max(image.naturalWidth, image.naturalHeight));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
  const context = canvas.getContext('2d');
  if (!context) throw new PhotoReadError();
  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new PhotoReadError())),
      'image/jpeg',
      PHOTO_JPEG_QUALITY,
    );
  });
}
