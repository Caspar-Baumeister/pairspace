"use client";

import {
  deleteObject,
  getDownloadURL,
  getStorage,
  ref,
  uploadBytes,
  type FirebaseStorage,
} from "firebase/storage";

import type { Photo } from "../types";
import { firebase } from "./client";

const MAX_BYTES = 12 * 1024 * 1024;
const OUTPUT_TYPE = "image/webp";

function storage(): FirebaseStorage {
  const { app } = firebase();
  const s = getStorage(app);
  // The SDK default keeps retrying a failed upload for ten minutes, which reads
  // as a frozen button. Fail fast and let the person try again.
  s.maxUploadRetryTime = 15_000;
  s.maxOperationRetryTime = 10_000;
  return s;
}

export class PhotoError extends Error {}

/** How a picture is cut before upload. */
export type PhotoShape =
  | { kind: "square"; edge: number }
  | { kind: "portrait"; width: number; height: number }
  | { kind: "fit"; maxEdge: number };

export const SHAPES = {
  room: { kind: "fit", maxEdge: 1400 },
  applicant: { kind: "portrait", width: 900, height: 1125 },
  avatar: { kind: "square", edge: 400 },
} satisfies Record<string, PhotoShape>;

/**
 * Crops and shrinks the picture in the browser before it leaves the device,
 * which keeps uploads fast and storage tiny.
 */
export async function preparePhoto(file: File, shape: PhotoShape): Promise<Blob> {
  if (!file.type.startsWith("image/")) throw new PhotoError("Das ist kein Bild.");
  if (file.size > MAX_BYTES) throw new PhotoError("Das Bild ist größer als 12 MB.");

  const bitmap = await createImageBitmap(file);
  const { width: bw, height: bh } = bitmap;
  let sx = 0;
  let sy = 0;
  let sw = bw;
  let sh = bh;
  let outW: number;
  let outH: number;

  if (shape.kind === "fit") {
    const scale = Math.min(1, shape.maxEdge / Math.max(bw, bh));
    outW = Math.round(bw * scale);
    outH = Math.round(bh * scale);
  } else {
    const targetW = shape.kind === "square" ? shape.edge : shape.width;
    const targetH = shape.kind === "square" ? shape.edge : shape.height;
    const ratio = targetW / targetH;
    if (bw / bh > ratio) {
      sw = bh * ratio;
      sx = (bw - sw) / 2;
    } else {
      sh = bw / ratio;
      sy = (bh - sh) / 2;
    }
    const scale = Math.min(1, targetW / sw);
    outW = Math.round(sw * scale);
    outH = Math.round(sh * scale);
  }

  const canvas = document.createElement("canvas");
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new PhotoError("Dein Browser konnte das Bild nicht verarbeiten.");
  ctx.drawImage(bitmap, sx, sy, sw, sh, 0, 0, outW, outH);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, OUTPUT_TYPE, 0.84));
  if (!blob) throw new PhotoError("Das Bild konnte nicht gelesen werden.");
  return blob;
}

export async function uploadPhoto(path: string, file: File, shape: PhotoShape): Promise<Photo> {
  const blob = await preparePhoto(file, shape);
  const objectRef = ref(storage(), path);
  try {
    await uploadBytes(objectRef, blob, {
      contentType: OUTPUT_TYPE,
      cacheControl: "public, max-age=31536000, immutable",
    });
    return { url: await getDownloadURL(objectRef), path };
  } catch (e) {
    const code = (e as { code?: string }).code ?? "";
    if (code === "storage/unauthorized") throw new PhotoError("Das Bild wurde abgelehnt.");
    throw new PhotoError("Hochladen hat nicht geklappt. Prüf deine Verbindung und versuch es nochmal.");
  }
}

export async function deletePhoto(path: string | null | undefined): Promise<void> {
  if (!path) return;
  try {
    await deleteObject(ref(storage(), path));
  } catch {
    /* already gone, nothing to do */
  }
}

export function randomId(length = 10): string {
  const alphabet = "abcdefghijkmnpqrstuvwxyz23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
}
