"use client";

import { ImagePlus, Minus, Plus, Trash2 } from "lucide-react";
import { useRef, useState } from "react";

import { ErrorText } from "@/components/ui/Field";
import { Spinner } from "@/components/ui/Spinner";
import { track } from "@/lib/analytics";
import { newRoom, updateFlat } from "@/lib/firebase/data";
import { deletePhoto, PhotoError, randomId, SHAPES, uploadPhoto } from "@/lib/firebase/storage";
import { useT } from "@/lib/i18n/client";
import { MAX_ROOMS } from "@/lib/plans";
import type { Flat, Room } from "@/lib/types";

/**
 * Number of rooms plus one row per room: photo, name, rent, size, free from.
 * Saves the whole rooms array at once.
 */
export function RoomsEditor({
  flat,
  submitLabel,
  onSaved,
}: {
  flat: Flat;
  submitLabel?: string;
  onSaved?: () => void;
}) {
  const t = useT();
  const defaultName = (index: number) => t(`Zimmer ${index + 1}`, `Room ${index + 1}`);
  // New rooms get their name in the landlord's language. The untouched German
  // defaults a new flat starts with are renamed the same way.
  const fresh = (index: number): Room => ({ ...newRoom(index), name: defaultName(index) });
  const [rooms, setRooms] = useState<Room[]>(() =>
    flat.rooms.length
      ? flat.rooms.map((r, i) => (r.name === `Zimmer ${i + 1}` ? { ...r, name: defaultName(i) } : r))
      : [fresh(0)],
  );
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const setCount = (count: number) => {
    const n = Math.min(MAX_ROOMS, Math.max(1, count));
    setRooms((list) => {
      if (n > list.length) return [...list, ...Array.from({ length: n - list.length }, (_, i) => fresh(list.length + i))];
      return list.slice(0, n);
    });
    setSaved(false);
  };

  const patch = (id: string, value: Partial<Room>) => {
    setRooms((list) => list.map((r) => (r.id === id ? { ...r, ...value } : r)));
    setSaved(false);
  };

  const upload = async (room: Room, file: File) => {
    setUploading((u) => ({ ...u, [room.id]: true }));
    setError("");
    try {
      const photo = await uploadPhoto(
        `landlords/${flat.ownerUid}/flats/${flat.id}/${room.id}-${randomId(4)}.webp`,
        file,
        SHAPES.room,
      );
      await deletePhoto(room.photo?.path);
      patch(room.id, { photo });
    } catch (e) {
      setError(
        e instanceof PhotoError
          ? t(e.message, e.en)
          : t("Das Foto konnte nicht hochgeladen werden.", "The photo couldn't be uploaded."),
      );
    } finally {
      setUploading((u) => ({ ...u, [room.id]: false }));
    }
  };

  const save = async () => {
    setBusy(true);
    setError("");
    try {
      await updateFlat(flat.id, {
        rooms: rooms.map((r, i) => ({ ...r, name: r.name.trim() || defaultName(i), note: r.note.trim() })),
      });
      track("rooms_saved", { rooms: rooms.length });
      setSaved(true);
      onSaved?.();
    } catch (e) {
      console.error(e);
      setError(t("Speichern hat nicht geklappt.", "Saving didn't work."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div className="setting">
        <div className="min-w-0 flex-1">
          <div className="setting-name">{t("Anzahl Zimmer", "Number of rooms")}</div>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="btn h-8 w-8 px-0"
            onClick={() => setCount(rooms.length - 1)}
            aria-label={t("Ein Zimmer weniger", "One room fewer")}
          >
            <Minus size={14} strokeWidth={1.75} />
          </button>
          <span className="w-8 text-center text-ui-medium font-semibold tabular-nums">{rooms.length}</span>
          <button
            type="button"
            className="btn h-8 w-8 px-0"
            onClick={() => setCount(rooms.length + 1)}
            aria-label={t("Ein Zimmer mehr", "One more room")}
          >
            <Plus size={14} strokeWidth={1.75} />
          </button>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {rooms.map((room, i) => (
          <RoomRow
            key={room.id}
            room={room}
            index={i}
            uploading={Boolean(uploading[room.id])}
            onPatch={(v) => patch(room.id, v)}
            onUpload={(f) => upload(room, f)}
            onRemove={
              rooms.length > 1
                ? () => {
                    setRooms((list) => list.filter((r) => r.id !== room.id));
                    setSaved(false);
                  }
                : undefined
            }
          />
        ))}
      </div>

      <div className="mt-5 flex items-center gap-3">
        <button
          type="button"
          className="btn btn-cta btn-lg"
          disabled={busy || Object.values(uploading).some(Boolean)}
          onClick={save}
        >
          {busy ? <Spinner size={14} /> : null}
          {submitLabel ?? t("Speichern", "Save")}
        </button>
        {saved && !onSaved ? <span className="text-ui-small text-green">{t("Gespeichert", "Saved")}</span> : null}
      </div>
      <div className="mt-2">
        <ErrorText>{error}</ErrorText>
      </div>
    </div>
  );
}

function RoomRow({
  room,
  index,
  uploading,
  onPatch,
  onUpload,
  onRemove,
}: {
  room: Room;
  index: number;
  uploading: boolean;
  onPatch: (value: Partial<Room>) => void;
  onUpload: (file: File) => void;
  onRemove?: () => void;
}) {
  const t = useT();
  const fileRef = useRef<HTMLInputElement>(null);
  const num = (v: string) => (v === "" ? null : Math.max(0, Number(v)));

  return (
    <div className="card flex flex-col gap-3 p-3 sm:flex-row">
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        className="group relative aspect-[4/3] w-full shrink-0 overflow-hidden rounded-lg border border-dashed border-base-40 bg-base-25 sm:w-[168px]"
        aria-label={t(`Foto für ${room.name} wählen`, `Choose a photo for ${room.name}`)}
      >
        {room.photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={room.photo.url} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="flex h-full flex-col items-center justify-center gap-1 text-ui-smaller text-faint">
            <ImagePlus size={20} strokeWidth={1.5} />
            {t("Foto hinzufügen", "Add a photo")}
          </span>
        )}
        {room.photo ? (
          <span className="absolute inset-x-0 bottom-0 bg-black/55 py-1 text-center text-[11px] text-white opacity-0 transition group-hover:opacity-100">
            {t("Foto ändern", "Change photo")}
          </span>
        ) : null}
        {uploading ? (
          <span className="absolute inset-0 flex items-center justify-center bg-black/50">
            <Spinner />
          </span>
        ) : null}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onUpload(f);
            e.target.value = "";
          }}
        />
      </button>

      <div className="grid min-w-0 flex-1 grid-cols-2 gap-2.5 sm:grid-cols-6">
        <label className="col-span-2 sm:col-span-6">
          <span className="sr-only">Name</span>
          <div className="flex items-center gap-2">
            <span className="text-ui-smaller tabular-nums text-faint">{String(index + 1).padStart(2, "0")}</span>
            <input
              className="input font-medium"
              value={room.name}
              onChange={(e) => onPatch({ name: e.target.value })}
              placeholder={t(`Zimmer ${index + 1}`, `Room ${index + 1}`)}
              maxLength={60}
            />
            {onRemove ? (
              <button type="button" className="icon-btn shrink-0" onClick={onRemove} aria-label={t("Zimmer entfernen", "Remove room")}>
                <Trash2 size={14} strokeWidth={1.75} />
              </button>
            ) : null}
          </div>
        </label>
        <label className="sm:col-span-2">
          <span className="mb-1 block text-ui-smaller text-faint">{t("Miete warm, €", "Rent incl. bills, €")}</span>
          <input
            className="input"
            type="number"
            inputMode="numeric"
            min={0}
            value={room.rent ?? ""}
            onChange={(e) => onPatch({ rent: num(e.target.value) })}
          />
        </label>
        <label className="sm:col-span-2">
          <span className="mb-1 block text-ui-smaller text-faint">{t("Größe, m²", "Size, m²")}</span>
          <input
            className="input"
            type="number"
            inputMode="decimal"
            min={0}
            value={room.size ?? ""}
            onChange={(e) => onPatch({ size: num(e.target.value) })}
          />
        </label>
        <label className="col-span-2 sm:col-span-2">
          <span className="mb-1 block text-ui-smaller text-faint">{t("Frei ab", "Available from")}</span>
          <input
            className="input"
            type="date"
            value={room.availableFrom ?? ""}
            onChange={(e) => onPatch({ availableFrom: e.target.value || null })}
          />
        </label>
        <label className="col-span-2 sm:col-span-6">
          <span className="sr-only">{t("Notiz", "Note")}</span>
          <input
            className="input"
            value={room.note}
            onChange={(e) => onPatch({ note: e.target.value })}
            placeholder={t("Notiz, zum Beispiel Balkon oder Hochbett", "Note, for example balcony or loft bed")}
            maxLength={160}
          />
        </label>
      </div>
    </div>
  );
}
