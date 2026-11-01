"use client";

import { ArrowDown, ArrowUp, BedDouble, CalendarDays, Equal, GripVertical, Ruler } from "lucide-react";
import { useMemo, useState } from "react";

import { Spinner } from "@/components/ui/Spinner";
import { saveRoomRanks } from "@/lib/firebase/data";
import { formatDate } from "@/lib/options";
import { euro } from "@/lib/plans";
import type { Room } from "@/lib/types";
import { BottomBar, Column, FlowHeader } from "./FlowShell";

/**
 * Rooms in the applicant's order. A tie flag between neighbours makes them
 * equally good. Stored as competition ranking: ties share a rank and the next
 * rank skips, so two favourites out of three give 1, 1, 3.
 */
interface Order {
  ids: string[];
  /** tied[i] means ids[i] is as good as ids[i - 1]. tied[0] is always false. */
  tied: boolean[];
}

function fromRanks(rooms: Room[], ranks: Record<string, number> | undefined): Order {
  const known = rooms.filter((r) => typeof ranks?.[r.id] === "number");
  if (!ranks || !known.length) return { ids: rooms.map((r) => r.id), tied: rooms.map(() => false) };
  const position = new Map(rooms.map((r, i) => [r.id, i]));
  const sorted = [...rooms].sort((a, b) => {
    const ra = ranks[a.id] ?? Infinity;
    const rb = ranks[b.id] ?? Infinity;
    return ra === rb ? position.get(a.id)! - position.get(b.id)! : ra - rb;
  });
  return {
    ids: sorted.map((r) => r.id),
    tied: sorted.map((r, i) => i > 0 && ranks[r.id] !== undefined && ranks[r.id] === ranks[sorted[i - 1].id]),
  };
}

export function competitionRanks(order: Order): Record<string, number> {
  const ranks: Record<string, number> = {};
  let rank = 1;
  order.ids.forEach((id, i) => {
    if (i > 0 && !order.tied[i]) rank = i + 1;
    ranks[id] = rank;
  });
  return ranks;
}

export function RoomStep({
  flatId,
  uid,
  flatTitle,
  rooms,
  ranks,
  returning,
  onDone,
  onBack,
}: {
  flatId: string;
  uid: string;
  flatTitle: string;
  rooms: Room[];
  ranks: Record<string, number> | undefined;
  returning: boolean;
  onDone: () => void;
  onBack?: () => void;
}) {
  const [order, setOrder] = useState<Order>(() => fromRanks(rooms, ranks));
  const [dragging, setDragging] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const byId = useMemo(() => new Map(rooms.map((r) => [r.id, r])), [rooms]);
  // Rooms added by the landlord after this screen opened go to the end.
  const ids = [...order.ids.filter((id) => byId.has(id)), ...rooms.map((r) => r.id).filter((id) => !order.ids.includes(id))];
  const tied = ids.map((id) => {
    const i = order.ids.indexOf(id);
    return i > 0 && order.tied[i] && ids.indexOf(order.ids[i - 1]) === ids.indexOf(id) - 1;
  });
  const current: Order = { ids, tied };
  const ranksNow = competitionRanks(current);

  const move = (from: number, to: number) => {
    if (to < 0 || to >= ids.length || from === to) return;
    const next = [...ids];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    // Moving a room breaks the ties it was part of, the rest stays.
    const nextTied = next.map((id, i) => {
      if (i === 0 || id === item || next[i - 1] === item) return false;
      const oldI = ids.indexOf(id);
      return tied[oldI] && ids[oldI - 1] === next[i - 1];
    });
    setOrder({ ids: next, tied: nextTied });
  };

  const toggleTie = (i: number) => {
    const next = [...tied];
    next[i] = !next[i];
    setOrder({ ids, tied: next });
  };

  const save = async () => {
    setBusy(true);
    setError("");
    try {
      await saveRoomRanks(flatId, uid, competitionRanks(current));
      onDone();
    } catch {
      setError("Speichern hat nicht geklappt. Prüf deine Verbindung.");
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-dvh flex-col">
      <FlowHeader
        title={returning ? "Zimmer sortieren" : flatTitle}
        subtitle={returning ? undefined : "Schritt 2 von 4"}
        onBack={onBack}
        step={returning ? undefined : 1}
      />
      <Column className="flex-1 pt-5">
        <h1 className="h3 text-ink">Welches Zimmer hättest du am liebsten?</h1>
        <p className="mt-2 text-ui-medium leading-relaxed text-muted">
          Sortier die Zimmer nach deinem Wunsch. Wenn dir zwei gleich wichtig sind, verbinde sie mit dem
          Gleichzeichen.
        </p>

        <ol className="mt-5">
          {ids.map((id, i) => {
            const room = byId.get(id);
            if (!room) return null;
            const from = formatDate(room.availableFrom);
            const rank = ranksNow[id];
            return (
              <li key={id}>
                {i > 0 ? (
                  <div className="flex items-center justify-center py-1.5">
                    <button
                      type="button"
                      onClick={() => toggleTie(i)}
                      aria-pressed={tied[i]}
                      className="chip h-7 px-2.5 text-ui-smaller"
                    >
                      <Equal size={13} strokeWidth={2} />
                      {tied[i] ? "Gleich wichtig" : "Gleich wichtig wie darüber?"}
                    </button>
                  </div>
                ) : null}
                <div
                  draggable
                  onDragStart={() => setDragging(i)}
                  onDragEnd={() => setDragging(null)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => {
                    if (dragging !== null) move(dragging, i);
                    setDragging(null);
                  }}
                  className={`card flex items-stretch gap-3 overflow-hidden p-2 transition-opacity ${
                    dragging === i ? "opacity-40" : ""
                  } ${rank === 1 ? "border-accent-line" : ""}`}
                >
                  <div className="relative w-[112px] shrink-0 overflow-hidden rounded-lg bg-base-25">
                    {room.photo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={room.photo.url} alt={room.name} className="absolute inset-0 h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full min-h-[84px] items-center justify-center text-faint">
                        <BedDouble size={22} strokeWidth={1.5} />
                      </div>
                    )}
                    <span
                      className={`absolute left-1.5 top-1.5 flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-ui-smaller font-bold ${
                        rank === 1 ? "bg-accent text-white" : "bg-black/70 text-white"
                      }`}
                    >
                      {rank}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1 py-1">
                    <p className="truncate text-ui-medium font-semibold text-ink">{room.name}</p>
                    {room.rent ? (
                      <p className="text-ui-small text-ink">
                        {euro(room.rent)} <span className="text-faint">warm</span>
                      </p>
                    ) : null}
                    <div className="mt-1 flex flex-wrap gap-x-2.5 gap-y-0.5 text-ui-smaller text-muted">
                      {room.size ? (
                        <span className="inline-flex items-center gap-1">
                          <Ruler size={11} strokeWidth={1.75} /> {room.size} m²
                        </span>
                      ) : null}
                      {from ? (
                        <span className="inline-flex items-center gap-1">
                          <CalendarDays size={11} strokeWidth={1.75} /> ab {from}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex flex-col items-center justify-center gap-0.5">
                    <button
                      type="button"
                      className="icon-btn"
                      onClick={() => move(i, i - 1)}
                      disabled={i === 0}
                      aria-label={`${room.name} nach oben`}
                    >
                      <ArrowUp size={16} strokeWidth={1.75} />
                    </button>
                    <span className="hidden cursor-grab text-faint sm:block" aria-hidden="true">
                      <GripVertical size={14} strokeWidth={1.75} />
                    </span>
                    <button
                      type="button"
                      className="icon-btn"
                      onClick={() => move(i, i + 1)}
                      disabled={i === ids.length - 1}
                      aria-label={`${room.name} nach unten`}
                    >
                      <ArrowDown size={16} strokeWidth={1.75} />
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
        <RoomNotes rooms={rooms} />
      </Column>
      <BottomBar>
        <button type="button" className="btn btn-cta btn-lg w-full" onClick={save} disabled={busy}>
          {busy ? <Spinner size={14} /> : null}
          {returning ? "Speichern" : "Weiter zum Profil"}
        </button>
        {error ? <p className="mt-2 text-center text-ui-small text-red">{error}</p> : null}
      </BottomBar>
    </div>
  );
}

function RoomNotes({ rooms }: { rooms: Room[] }) {
  const notes = rooms.filter((r) => r.note);
  if (!notes.length) return null;
  return (
    <div className="mt-6 grid gap-2">
      <p className="ui-label">Hinweise zu den Zimmern</p>
      {notes.map((r) => (
        <p key={r.id} className="text-ui-small text-muted">
          <span className="font-semibold text-ink">{r.name}:</span> {r.note}
        </p>
      ))}
    </div>
  );
}
