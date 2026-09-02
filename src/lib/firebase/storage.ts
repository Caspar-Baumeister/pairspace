"use client";

import {
  deleteObject,
  getDownloadURL,
  getStorage,
  ref,
  uploadBytes,
  type FirebaseStorage,
} from "firebase/storage";

import { firebase } from "./client";

const MAX_EDGE = 640;
const MAX_BYTES = 5 * 1024 * 1024;
const OUTPUT_TYPE = "image/webp";

function storage(): FirebaseStorage {
  const { app } = firebase();
  const s = getStorage(app);
  // The SDK default keeps retrying a failed upload for ten minutes, which reads
  // as a frozen "Saving" button. Fail fast and let the person try again.
  s.maxUploadRetryTime = 15_000;
  s.maxOperationRetryTime = 10_000;
  return s;
}

export class PhotoError extends Error {}

/**
 * Squares and shrinks the picture in the browser before it ever leaves the
 * device. Nobody needs a 12 megapixel portrait for a 44 pixel circle, and doing
 * it client side keeps upload cost and storage tiny.
 */
export async function preparePhoto(file: File): Promise<Blob> {
  if (!file.type.startsWith("image/")) {
    throw new PhotoError("That file is not an image.");
  }
  if (file.size > MAX_BYTES) {
    throw new PhotoError("That image is larger than 5 MB. Please pick a smaller one.");
  }

  const bitmap = await createImageBitmap(file);
  const edge = Math.min(bitmap.width, bitmap.height);
  const size = Math.min(MAX_EDGE, edge);

  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new PhotoError("Your browser could not process the image.");

  ctx.drawImage(
    bitmap,
    (bitmap.width - edge) / 2,
    (bitmap.height - edge) / 2,
    edge,
    edge,
    0,
    0,
    size,
    size,
  );
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, OUTPUT_TYPE, 0.86),
  );
  if (!blob) throw new PhotoError("Could not read that image.");
  return blob;
}

export interface UploadedPhoto {
  url: string;
  path: string;
}

export async function uploadParticipantPhoto(
  eventId: string,
  uid: string,
  file: File,
): Promise<UploadedPhoto> {
  const blob = await preparePhoto(file);
  const path = `events/${eventId}/participants/${uid}.webp`;
  const objectRef = ref(storage(), path);
  try {
    await uploadBytes(objectRef, blob, {
      contentType: OUTPUT_TYPE,
      cacheControl: "public, max-age=31536000, immutable",
    });
    return { url: await getDownloadURL(objectRef), path };
  } catch (e) {
    const code = (e as { code?: string }).code ?? "";
    if (code === "storage/unauthorized") {
      throw new PhotoError("Your photo was rejected. Please pick a different image.");
    }
    throw new PhotoError(
      "Could not upload your photo. Please check your connection and try again.",
    );
  }
}

export async function deleteParticipantPhoto(path: string): Promise<void> {
  try {
    await deleteObject(ref(storage(), path));
  } catch {
    /* already gone, nothing to do */
  }
}

/** Instant preview while the upload runs. */
export function localPreview(file: File): string {
  return URL.createObjectURL(file);
}
