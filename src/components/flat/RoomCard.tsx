import { BedDouble, CalendarDays, Ruler } from "lucide-react";
import type { ReactNode } from "react";

import { formatDate } from "@/lib/options";
import { euro } from "@/lib/plans";
import type { Room } from "@/lib/types";

/** A room as a card with photo, rent, size and move in date. */
export function RoomCard({
  room,
  badge,
  footer,
  compact = false,
}: {
  room: Room;
  badge?: ReactNode;
  footer?: ReactNode;
  compact?: boolean;
}) {
  const from = formatDate(room.availableFrom);
  return (
    <div className="card overflow-hidden">
      <div className={`relative bg-base-25 ${compact ? "aspect-[16/9]" : "aspect-[4/3]"}`}>
        {room.photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={room.photo.url} alt={room.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-faint">
            <BedDouble size={28} strokeWidth={1.5} />
          </div>
        )}
        {badge ? <div className="absolute left-2 top-2">{badge}</div> : null}
      </div>
      <div className="p-3">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="truncate text-ui-medium font-semibold">{room.name}</h3>
          {room.rent ? (
            <span className="shrink-0 text-ui-medium font-semibold text-ink">
              {euro(room.rent)}
              <span className="text-ui-smaller font-normal text-faint"> warm</span>
            </span>
          ) : null}
        </div>
        <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-ui-smaller text-muted">
          {room.size ? (
            <span className="inline-flex items-center gap-1">
              <Ruler size={12} strokeWidth={1.75} /> {room.size} m²
            </span>
          ) : null}
          {from ? (
            <span className="inline-flex items-center gap-1">
              <CalendarDays size={12} strokeWidth={1.75} /> frei ab {from}
            </span>
          ) : null}
        </div>
        {room.note && !compact ? <p className="mt-2 text-ui-small text-muted">{room.note}</p> : null}
        {footer ? <div className="mt-3">{footer}</div> : null}
      </div>
    </div>
  );
}
