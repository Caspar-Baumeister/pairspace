"use client";

import {
  ArrowRight,
  ChevronDown,
  ChevronRight,
  Info,
  Mail,
  PanelRight,
  Phone,
  Sparkles,
  UserRound,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import { PaneHeader } from "@/components/app/AppShell";
import { displayName, ProfileDetails } from "@/components/applicant/ProfileDetails";
import { Toggle } from "@/components/ui/Field";
import { Spinner } from "@/components/ui/Spinner";
import { track } from "@/lib/analytics";
import { useApplicants, useBallots, useContact } from "@/lib/firebase/data";
import { useLocale, useLocalePath, useT } from "@/lib/i18n/client";
import {
  bestGroups,
  buildModel,
  clusters as findClusters,
  graphEdges,
  type GroupResult,
  type MatchModel,
} from "@/lib/matching";
import { voteOption } from "@/lib/options";
import { euro } from "@/lib/plans";
import type { Applicant, Ballot, Flat, Vote } from "@/lib/types";

import { ApplicantGraph, CLUSTER_COLORS, type GraphLink, type GraphNode } from "./ApplicantGraph";

type Panel = "groups" | "person" | "all";

export function GraphView({ flat }: { flat: Flat }) {
  const t = useT();
  const lp = useLocalePath();
  const applicants = useApplicants(flat.id);
  const ballots = useBallots(flat.id);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [groupKey, setGroupKey] = useState<string | null>(null);
  const [panel, setPanel] = useState<Panel>("groups");
  const [panelOpen, setPanelOpen] = useState(true);
  const [size, setSize] = useState<number | null>(null);
  const [showLabels, setShowLabels] = useState(true);
  const [showVetos, setShowVetos] = useState(false);
  const [colorClusters, setColorClusters] = useState(true);
  const [repel, setRepel] = useState(1);
  const [linkForce, setLinkForce] = useState(1);

  const complete = useMemo(
    () =>
      applicants.data
        .filter((a) => a.status === "complete")
        .sort((a, b) => a.createdAt - b.createdAt) as Applicant[],
    [applicants.data],
  );
  const byId = useMemo(() => new Map(complete.map((a) => [a.uid, a])), [complete]);
  const ballotMap = useMemo(() => {
    const m: Record<string, Ballot> = {};
    for (const b of ballots.data) m[b.uid ?? b.id] = b;
    return m;
  }, [ballots.data]);

  const model = useMemo(() => buildModel(complete, ballotMap, flat.rooms), [complete, ballotMap, flat.rooms]);
  const groupSize = Math.min(size ?? flat.rooms.length, Math.max(1, flat.rooms.length));
  const groups = useMemo(() => bestGroups(model, groupSize, 8), [model, groupSize]);
  const clusterOf = useMemo(() => findClusters(model), [model]);

  const nodes: GraphNode[] = useMemo(
    () =>
      complete.map((a, i) => ({
        id: a.uid,
        label: a.firstName || t("Ohne Namen", "No name"),
        photoUrl: a.photos[0]?.url ?? null,
        weight: model.received[i] === null ? 0.3 : Math.min(1, Math.max(0, (model.received[i]! - 0.25) / 0.75)),
        cluster: clusterOf[i],
      })),
    [complete, model, clusterOf, t],
  );
  const links: GraphLink[] = useMemo(
    () =>
      graphEdges(model).map((e) => ({
        source: e.a,
        target: e.b,
        w: e.w,
        strength: e.strength,
        veto: e.veto,
        mutual: e.mutualLike,
      })),
    [model],
  );

  const selectedGroup = groups.find((g) => key(g) === groupKey) ?? null;
  const highlightIds = useMemo(() => (selectedGroup ? new Set(selectedGroup.members) : null), [selectedGroup]);

  const votesGiven = Object.values(ballotMap).reduce(
    (sum, b) => sum + Object.keys(b.votes ?? {}).filter((id) => byId.has(id) && byId.has(b.uid)).length,
    0,
  );
  const votesPossible = complete.length * (complete.length - 1);
  const loading = applicants.loading || ballots.loading;

  // Once per visit, as soon as there is a graph to see. Only the count, no names.
  const graphTracked = useRef(false);
  useEffect(() => {
    if (loading || graphTracked.current || complete.length === 0) return;
    graphTracked.current = true;
    track("graph_opened", { applicants: complete.length });
  }, [loading, complete.length]);

  const selectPerson = (id: string | null) => {
    setSelectedId(id);
    if (id) {
      setPanel("person");
      setPanelOpen(true);
      setGroupKey(null);
    }
  };

  return (
    <>
      <PaneHeader
        actions={
          <button
            type="button"
            className={`icon-btn ${panelOpen ? "is-active" : ""}`}
            onClick={() => setPanelOpen((o) => !o)}
            aria-label={t("Seitenleiste rechts", "Right sidebar")}
            title={t("Seitenleiste rechts", "Right sidebar")}
          >
            <PanelRight size={16} strokeWidth={1.75} />
          </button>
        }
      />
      <div className="relative flex min-h-0 flex-1">
        <div className="relative min-w-0 flex-1 bg-bg">
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <Spinner />
            </div>
          ) : complete.length === 0 ? (
            <EmptyGraph flat={flat} />
          ) : (
            <ApplicantGraph
              nodes={nodes}
              links={links}
              selectedId={selectedId}
              highlightIds={highlightIds}
              showLabels={showLabels}
              showVetos={showVetos}
              colorClusters={colorClusters}
              repel={repel}
              linkForce={linkForce}
              onSelect={selectPerson}
            />
          )}

          {flat.status !== "live" ? (
            <div className="absolute left-3 top-3 flex max-w-[calc(100%-24px)] items-center gap-3 rounded-lg border border-accent-line bg-bg-2/95 px-3 py-2 text-ui-small backdrop-blur">
              <span className="text-muted">
                {flat.status === "draft"
                  ? t("Noch nicht freigeschaltet.", "Not live yet.")
                  : t("Pausiert, der Link nimmt keine Bewerbungen an.", "Paused, the link takes no applications.")}
              </span>
              <Link
                href={lp(flat.status === "draft" ? `/app/w/${flat.id}/einrichten` : `/app/w/${flat.id}/einstellungen`)}
                className="inline-flex items-center gap-1 text-accent hover:underline"
              >
                {flat.status === "draft" ? t("Einrichtung abschließen", "Finish setup") : t("Einstellungen", "Settings")}{" "}
                <ArrowRight size={13} strokeWidth={1.75} />
              </Link>
            </div>
          ) : null}

          {complete.length > 0 ? (
            <GraphControls
              roomCount={flat.rooms.length}
              size={groupSize}
              setSize={setSize}
              showLabels={showLabels}
              setShowLabels={setShowLabels}
              showVetos={showVetos}
              setShowVetos={setShowVetos}
              colorClusters={colorClusters}
              setColorClusters={setColorClusters}
              repel={repel}
              setRepel={setRepel}
              linkForce={linkForce}
              setLinkForce={setLinkForce}
            />
          ) : null}

          <div className="absolute bottom-0 right-0 flex gap-3 rounded-tl-lg border-l border-t border-line bg-bg-2 px-3 py-1 text-ui-smaller text-faint">
            <span>{t(`${complete.length} Bewerber`, `${complete.length} ${complete.length === 1 ? "applicant" : "applicants"}`)}</span>
            <span>{t(`${flat.rooms.length} Zimmer`, `${flat.rooms.length} ${flat.rooms.length === 1 ? "room" : "rooms"}`)}</span>
            <span>{t(`${votesGiven} von ${votesPossible} Bewertungen`, `${votesGiven} of ${votesPossible} ratings`)}</span>
          </div>
        </div>

        {panelOpen ? (
          <aside className="absolute inset-y-0 right-0 z-20 flex w-[340px] max-w-full flex-col border-l border-line bg-bg-2 shadow-2xl lg:static lg:shadow-none">
            <div className="flex h-10 shrink-0 items-center gap-0.5 border-b border-line px-2">
              <PanelTab active={panel === "groups"} onClick={() => setPanel("groups")} icon={<Sparkles size={15} strokeWidth={1.75} />} label={t("Beste Gruppen", "Best groups")} />
              <PanelTab active={panel === "all"} onClick={() => setPanel("all")} icon={<Users size={15} strokeWidth={1.75} />} label={t("Alle", "All")} />
              <PanelTab
                active={panel === "person"}
                onClick={() => setPanel("person")}
                icon={<UserRound size={15} strokeWidth={1.75} />}
                label={t("Person", "Person")}
                disabled={!selectedId}
              />
              <div className="flex-1" />
              <button type="button" className="icon-btn lg:hidden" onClick={() => setPanelOpen(false)} aria-label={t("Schließen", "Close")}>
                <X size={15} strokeWidth={1.75} />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">
              {panel === "groups" ? (
                <GroupsPanel
                  groups={groups}
                  groupSize={groupSize}
                  model={model}
                  byId={byId}
                  flat={flat}
                  selectedKey={groupKey}
                  onSelect={(g) => {
                    setGroupKey(g && key(g) !== groupKey ? key(g) : null);
                    setSelectedId(null);
                  }}
                  onPerson={selectPerson}
                  applicantCount={complete.length}
                />
              ) : null}
              {panel === "all" ? (
                <AllPanel complete={complete} model={model} clusterOf={clusterOf} onPerson={selectPerson} selectedId={selectedId} />
              ) : null}
              {panel === "person" && selectedId && byId.get(selectedId) ? (
                <PersonPanel
                  flat={flat}
                  applicant={byId.get(selectedId)!}
                  model={model}
                  byId={byId}
                  ballot={ballotMap[selectedId]}
                  groupSize={groupSize}
                  onPerson={selectPerson}
                  onGroup={(g) => {
                    setGroupKey(key(g));
                    setSelectedId(null);
                    setPanel("groups");
                  }}
                />
              ) : null}
              {panel === "person" && !selectedId ? (
                <p className="p-4 text-ui-small text-faint">{t("Klick im Graph auf eine Person.", "Click a person in the graph.")}</p>
              ) : null}
            </div>
          </aside>
        ) : null}
      </div>
    </>
  );
}

const key = (g: GroupResult) => [...g.members].sort().join("|");

/* ------------------------------------------------------------ controls */

function GraphControls(p: {
  roomCount: number;
  size: number;
  setSize: (n: number) => void;
  showLabels: boolean;
  setShowLabels: (v: boolean) => void;
  showVetos: boolean;
  setShowVetos: (v: boolean) => void;
  colorClusters: boolean;
  setColorClusters: (v: boolean) => void;
  repel: number;
  setRepel: (v: number) => void;
  linkForce: number;
  setLinkForce: (v: number) => void;
}) {
  const t = useT();
  const [open, setOpen] = useState(false);
  return (
    <div className="absolute right-3 top-3 z-10 w-[232px] rounded-lg border border-line bg-bg-2/95 text-ui-small shadow-xl backdrop-blur">
      <button type="button" className="flex w-full items-center gap-1.5 px-3 py-2 text-muted hover:text-ink" onClick={() => setOpen((o) => !o)}>
        {open ? <ChevronDown size={14} strokeWidth={1.75} /> : <ChevronRight size={14} strokeWidth={1.75} />}
        {t("Graph Einstellungen", "Graph settings")}
      </button>
      {open ? (
        <div className="space-y-4 border-t border-line px-3 pb-3 pt-3">
          <ControlSection title={t("Gruppen", "Groups")}>
            <label className="block">
              <span className="flex justify-between text-ui-smaller text-muted">
                <span>{t("Freie Zimmer", "Free rooms")}</span>
                <span className="tabular-nums text-ink">{p.size}</span>
              </span>
              <input
                type="range"
                className="slider mt-2"
                min={1}
                max={Math.max(1, p.roomCount)}
                value={p.size}
                onChange={(e) => p.setSize(Number(e.target.value))}
              />
            </label>
            <Row label={t("Cluster färben", "Colour clusters")}>
              <Toggle checked={p.colorClusters} onChange={p.setColorClusters} label={t("Cluster färben", "Colour clusters")} />
            </Row>
          </ControlSection>
          <ControlSection title={t("Anzeige", "Display")}>
            <Row label={t("Namen", "Names")}>
              <Toggle checked={p.showLabels} onChange={p.setShowLabels} label={t("Namen anzeigen", "Show names")} />
            </Row>
            <Row label={t("Ablehnungen", "Rejections")}>
              <Toggle checked={p.showVetos} onChange={p.setShowVetos} label={t("Ablehnungen anzeigen", "Show rejections")} />
            </Row>
          </ControlSection>
          <ControlSection title={t("Kräfte", "Forces")}>
            <Slider label={t("Abstoßung", "Repulsion")} value={p.repel} onChange={p.setRepel} />
            <Slider label={t("Anziehung", "Attraction")} value={p.linkForce} onChange={p.setLinkForce} />
          </ControlSection>
          <div className="space-y-1.5 border-t border-line pt-3 text-ui-smaller text-faint">
            <p>{t("Linie und Nähe: beide mögen sich, je dicker desto mehr.", "Line and closeness: both like each other, thicker means more.")}</p>
            <p>{t("Abstand ohne Linie: mindestens eine Seite will eher nicht.", "Distance, no line: at least one side would rather not.")}</p>
            <p>{t("Größe: wie beliebt jemand insgesamt ist.", "Size: how popular someone is overall.")}</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ControlSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="space-y-2.5">
      <div className="ui-label">{title}</div>
      {children}
    </div>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between text-ui-smaller text-muted">
      {label}
      {children}
    </div>
  );
}

function Slider({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="block">
      <span className="text-ui-smaller text-muted">{label}</span>
      <input
        type="range"
        className="slider mt-2"
        min={0.3}
        max={2}
        step={0.05}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}

function PanelTab({
  active,
  onClick,
  icon,
  label,
  disabled,
}: {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex h-7 items-center gap-1.5 rounded-sm px-2 text-ui-small transition disabled:opacity-40 ${
        active ? "bg-[var(--active)] text-ink" : "text-faint hover:bg-[var(--hover)] hover:text-ink"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

/* ---------------------------------------------------------- groups list */

function GroupsPanel({
  groups,
  groupSize,
  model,
  byId,
  flat,
  selectedKey,
  onSelect,
  onPerson,
  applicantCount,
}: {
  groups: GroupResult[];
  groupSize: number;
  model: MatchModel;
  byId: Map<string, Applicant>;
  flat: Flat;
  selectedKey: string | null;
  onSelect: (g: GroupResult | null) => void;
  onPerson: (id: string) => void;
  applicantCount: number;
}) {
  const t = useT();
  const locale = useLocale();
  const [explain, setExplain] = useState(false);
  const missing = groupSize - applicantCount;
  const open = (g: GroupResult, rank: number) => {
    // Only when a group opens, not when it closes again.
    if (key(g) !== selectedKey) track("group_opened", { rank });
    onSelect(g);
  };
  return (
    <div className="p-3">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-ui-medium font-semibold">
          {groupSize === 1
            ? t("Beste Einzelbewerber", "Best single applicants")
            : t(`Beste ${groupSize}er Gruppen`, `Best groups of ${groupSize}`)}
        </h2>
        <button
          type="button"
          className={`icon-btn ${explain ? "is-active" : ""}`}
          onClick={() => setExplain((e) => !e)}
          aria-label={t("So wird gerechnet", "How the score works")}
        >
          <Info size={15} strokeWidth={1.75} />
        </button>
      </div>
      {explain ? <Explainer /> : null}

      {applicantCount < groupSize ? (
        <p className="mt-2 px-1 text-ui-small text-faint">
          {t(
            `Noch ${missing} Bewerber bis zur ersten vollen Gruppe. Bis dahin siehst du die beste Teilgruppe.`,
            `${missing} more ${missing === 1 ? "applicant" : "applicants"} until the first full group. Until then you see the best partial group.`,
          )}
        </p>
      ) : null}
      {groups.length === 0 && applicantCount > 0 ? (
        <p className="mt-3 px-1 text-ui-small text-faint">
          {t(
            "Keine Gruppe ohne Ablehnung möglich. Warte auf weitere Bewerber oder wähle weniger freie Zimmer.",
            "No group without a rejection yet. Wait for more applicants or pick fewer free rooms.",
          )}
        </p>
      ) : null}

      <ol className="mt-3 space-y-2">
        {groups.map((g, i) => {
          const selected = key(g) === selectedKey;
          return (
            <li key={key(g)}>
              <div
                role="button"
                tabIndex={0}
                onClick={() => open(g, i + 1)}
                onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && open(g, i + 1)}
                className={`card block w-full cursor-pointer p-3 text-left transition ${
                  selected ? "border-accent-line bg-accent-soft" : "hover:border-base-40"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="w-5 text-ui-smaller tabular-nums text-faint">#{i + 1}</span>
                  <div className="flex -space-x-2">
                    {g.members.map((id) => (
                      <Avatar key={id} applicant={byId.get(id)} size={30} ring />
                    ))}
                  </div>
                  <div className="ml-auto text-right">
                    <div className="text-[22px] font-bold leading-none tabular-nums">{Math.round(g.score)}</div>
                    <div className="text-[10px] uppercase tracking-wide text-faint">{t("Punkte", "points")}</div>
                  </div>
                </div>
                <div className="mt-2 truncate pl-8 text-ui-small text-muted">
                  {g.members.map((id) => byId.get(id)?.firstName).join(", ")}
                </div>
                {/* The last column fits "12 von 12" or "12 of 12", the bars share the rest. */}
                <div className="mt-2.5 grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] gap-2 pl-8">
                  <Meter label={t("Harmonie", "Harmony")} value={g.harmony} />
                  <Meter label={t("Zimmer", "Rooms")} value={g.roomFit} />
                  {g.possible ? (
                    <Meter
                      label={t("Bewertet", "Rated")}
                      value={g.rated / g.possible}
                      display={t(`${g.rated} von ${g.possible}`, `${g.rated} of ${g.possible}`)}
                      muted
                    />
                  ) : null}
                </div>

                {selected ? (
                  <div className="mt-3 space-y-1.5 border-t border-line pt-3">
                    <div className="ui-label mb-1">{t("Zimmerverteilung", "Room assignment")}</div>
                    {g.members.map((id) => {
                      const room = flat.rooms.find((r) => r.id === g.assignment[id]);
                      const rank = room ? model.roomFit[model.index.get(id)!]?.[model.roomIds.indexOf(room.id)] : null;
                      return (
                        <button
                          type="button"
                          key={id}
                          onClick={(e) => {
                            e.stopPropagation();
                            onPerson(id);
                          }}
                          className="flex w-full items-center gap-2 rounded-sm px-1 py-1 text-left text-ui-small hover:bg-[var(--hover)]"
                        >
                          <Avatar applicant={byId.get(id)} size={22} />
                          <span className="min-w-0 flex-1 truncate">{byId.get(id)?.firstName}</span>
                          <ArrowRight size={12} strokeWidth={1.75} className="text-faint" />
                          <span className="max-w-[46%] truncate text-muted">{room?.name ?? t("ohne Zimmer", "no room")}</span>
                          {rank === 1 ? <span className="tag px-1.5 py-0 text-[10px]">{t("Wunsch", "Top pick")}</span> : null}
                        </button>
                      );
                    })}
                    <WeakestPair group={g} model={model} byId={byId} />
                    {g.mutualLikes > 0 ? (
                      <p className="text-ui-smaller text-faint">
                        {t(
                          `${g.mutualLikes} von ${pairCount(g)} Paaren mögen sich gegenseitig.`,
                          pairCount(g) === 1 ? "The two like each other." : `${g.mutualLikes} of ${pairCount(g)} pairs like each other.`,
                        )}
                      </p>
                    ) : null}
                    {totalRent(g, flat) ? (
                      <p className="text-ui-smaller text-faint">
                        {t(`Miete zusammen ${euro(totalRent(g, flat)!, locale)}`, `Total rent ${euro(totalRent(g, flat)!, locale)}`)}
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

const pairCount = (g: GroupResult) => (g.members.length * (g.members.length - 1)) / 2;

function totalRent(g: GroupResult, flat: Flat): number | null {
  const sum = Object.values(g.assignment).reduce((s, roomId) => s + (flat.rooms.find((r) => r.id === roomId)?.rent ?? 0), 0);
  return sum || null;
}

function WeakestPair({ group, model, byId }: { group: GroupResult; model: MatchModel; byId: Map<string, Applicant> }) {
  const t = useT();
  const locale = useLocale();
  if (group.members.length < 2) return null;
  let worst: [string, string] | null = null;
  let worstW = Infinity;
  for (let a = 0; a < group.members.length; a++) {
    for (let b = a + 1; b < group.members.length; b++) {
      const i = model.index.get(group.members[a])!;
      const j = model.index.get(group.members[b])!;
      const w = model.w[i * model.n + j];
      if (w < worstW) {
        worstW = w;
        worst = [group.members[a], group.members[b]];
      }
    }
  }
  if (!worst || worstW >= 0.75) return null;
  const i = model.index.get(worst[0])!;
  const j = model.index.get(worst[1])!;
  const a = byId.get(worst[0])?.firstName;
  const b = byId.get(worst[1])?.firstName;
  const ab = <VoteWord vote={model.vote[i][j]} />;
  const ba = <VoteWord vote={model.vote[j][i]} />;
  // The word order differs, so each language gets its own sentence around the coloured votes.
  return (
    <p className="pt-1 text-ui-smaller text-faint">
      {t("Schwächstes Paar:", "Weakest pair:")}{" "}
      {locale === "en" ? (
        <>
          {a} says {ab} to {b}, {b} says {ba} to {a}.
        </>
      ) : (
        <>
          {a} findet {b} {ab}, umgekehrt {ba}.
        </>
      )}
    </p>
  );
}

function VoteWord({ vote }: { vote: Vote | null }) {
  const t = useT();
  const o = voteOption(vote);
  if (!o) return <span className="text-faint">{t("noch offen", "nothing yet")}</span>;
  return <span style={{ color: o.color }}>{t(o.label.de, o.label.en).toLowerCase()}</span>;
}

function Explainer() {
  const t = useT();
  return (
    <div className="mt-2 space-y-2 rounded-lg border border-line bg-bg p-3 text-ui-smaller leading-relaxed text-muted">
      <p>
        {t(
          "Jede Bewertung wird zu einem Wert: Auf keinen Fall 0, Schlecht 0,25, Mittel 0,5, Gut 0,75, Unbedingt 1. Für jedes Paar nehmen wir das geometrische Mittel beider Richtungen, so zählt gegenseitige Sympathie mehr als einseitige.",
          "Every rating becomes a value: No way 0, Bad 0.25, Okay 0.5, Good 0.75, Absolutely 1. For each pair we take the geometric mean of both directions, so mutual liking counts more than one-sided liking.",
        )}
      </p>
      <p>
        <span className="text-ink">{t("Harmonie", "Harmony")}</span>{" "}
        {t(
          "ist halb der Durchschnitt aller Paare, halb das schwächste Paar. Eine WG ist nur so gut wie ihr schwierigstes Verhältnis.",
          "is half the average of all pairs, half the weakest pair. A shared flat is only as good as its toughest relationship.",
        )}
      </p>
      <p>
        <span className="text-ink">{t("Zimmer", "Rooms")}</span>
        {t(
          ": Der Hungarian Algorithmus verteilt die Zimmer so, dass die Wünsche insgesamt am besten erfüllt werden.",
          ": the Hungarian algorithm assigns the rooms so that everyone's preferences are met as well as possible overall.",
        )}
      </p>
      <p>
        <span className="text-ink">{t("Punkte", "Points")}</span>
        {t(
          ` = 75 % Harmonie + 25 % Zimmer. Ein "Auf keinen Fall" in einer Richtung schließt die Gruppe aus. Fehlende Bewertungen zählen als Mittel.`,
          ` = 75% harmony + 25% rooms. A "No way" in either direction rules the group out. Missing ratings count as Okay.`,
        )}{" "}
        <span className="text-ink">{t("Bewertet", "Rated")}</span>{" "}
        {t(
          "zeigt, wie viele der möglichen Bewertungen in der Gruppe schon abgegeben sind, bei drei Personen zum Beispiel 5 von 6.",
          "shows how many of the possible ratings within the group are already in, with three people for example 5 of 6.",
        )}
      </p>
      <p>
        {t(
          "Wir prüfen jede mögliche Gruppe, bei sehr vielen Bewerbern eine lokale Suche.",
          "We check every possible group, or run a local search when there are lots of applicants.",
        )}
      </p>
    </div>
  );
}

function Meter({
  label,
  value,
  display,
  muted = false,
}: {
  label: string;
  value: number;
  /** Replaces the percentage on the right. */
  display?: string;
  muted?: boolean;
}) {
  return (
    <div>
      <div className="flex justify-between gap-1.5 text-[10px] text-faint">
        <span className="truncate">{label}</span>
        <span className="shrink-0 tabular-nums">{display ?? Math.round(value * 100)}</span>
      </div>
      <div className="mt-1 h-[3px] overflow-hidden rounded-full bg-base-30">
        <div className={`h-full rounded-full ${muted ? "bg-base-60" : "bg-accent"}`} style={{ width: `${Math.round(value * 100)}%` }} />
      </div>
    </div>
  );
}

/* ----------------------------------------------------------- everyone */

function AllPanel({
  complete,
  model,
  clusterOf,
  onPerson,
  selectedId,
}: {
  complete: Applicant[];
  model: MatchModel;
  clusterOf: number[];
  onPerson: (id: string) => void;
  selectedId: string | null;
}) {
  const t = useT();
  const rows = complete
    .map((a, i) => ({ a, received: model.received[i], cluster: clusterOf[i], given: model.vote[i].filter((v) => v !== null).length }))
    .sort((x, y) => (y.received ?? -1) - (x.received ?? -1));
  return (
    <div className="p-2">
      {rows.map(({ a, received, cluster, given }) => (
        <button
          type="button"
          key={a.uid}
          onClick={() => onPerson(a.uid)}
          className={`nav-item w-full py-1.5 text-left ${selectedId === a.uid ? "is-active" : ""}`}
        >
          <Avatar applicant={a} size={28} />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-ink">{displayName(a, t)}</span>
            <span className="block truncate text-[11px] text-faint">
              {t(
                `${a.occupation || "ohne Angabe"} · hat ${given} von ${complete.length - 1} bewertet`,
                `${a.occupation || "not given"} · rated ${given} of ${complete.length - 1}`,
              )}
            </span>
          </span>
          {cluster >= 0 ? (
            <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: CLUSTER_COLORS[cluster % CLUSTER_COLORS.length] }} />
          ) : null}
          <span className="w-8 shrink-0 text-right text-ui-smaller tabular-nums text-muted">
            {received === null ? t("neu", "new") : Math.round(received * 100)}
          </span>
        </button>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------- person */

function PersonPanel({
  flat,
  applicant,
  model,
  byId,
  ballot,
  groupSize,
  onPerson,
  onGroup,
}: {
  flat: Flat;
  applicant: Applicant;
  model: MatchModel;
  byId: Map<string, Applicant>;
  ballot: Ballot | undefined;
  groupSize: number;
  onPerson: (id: string) => void;
  onGroup: (g: GroupResult) => void;
}) {
  const t = useT();
  const locale = useLocale();
  const contact = useContact(flat.id, applicant.uid);
  const i = model.index.get(applicant.uid)!;
  const best = useMemo(() => bestGroups(model, groupSize, 1, i)[0] ?? null, [model, groupSize, i]);

  const others = model.ids
    .map((id, j) => ({ id, j }))
    .filter(({ j }) => j !== i)
    .map(({ id, j }) => ({ id, given: model.vote[i][j], received: model.vote[j][i], w: model.w[i * model.n + j] }))
    .sort((a, b) => b.w - a.w);

  const ranked = flat.rooms
    .map((r) => ({ room: r, rank: ballot?.roomRanks?.[r.id] ?? null }))
    .sort((a, b) => (a.rank ?? 99) - (b.rank ?? 99));

  return (
    <div className="p-4">
      <ProfileDetails applicant={applicant} compact />

      <Section title={t("Kontakt", "Contact")}>
        {contact.data ? (
          <div className="space-y-1 text-ui-small">
            <a href={`mailto:${contact.data.email}`} className="flex items-center gap-2 text-accent hover:underline">
              <Mail size={13} strokeWidth={1.75} /> {contact.data.email}
            </a>
            {contact.data.phone ? (
              <a href={`tel:${contact.data.phone.replace(/\s/g, "")}`} className="flex items-center gap-2 text-muted hover:text-ink">
                <Phone size={13} strokeWidth={1.75} /> {contact.data.phone}
              </a>
            ) : null}
          </div>
        ) : (
          <p className="text-ui-small text-faint">{t("Noch keine Kontaktdaten hinterlegt.", "No contact details yet.")}</p>
        )}
      </Section>

      {best && groupSize > 1 ? (
        <Section
          title={t(`Beste ${groupSize}er Gruppe mit ${applicant.firstName}`, `Best group of ${groupSize} with ${applicant.firstName}`)}
        >
          <button type="button" className="card flex w-full items-center gap-3 p-2.5 text-left hover:border-base-40" onClick={() => onGroup(best)}>
            <div className="flex -space-x-2">
              {best.members.map((id) => (
                <Avatar key={id} applicant={byId.get(id)} size={26} ring />
              ))}
            </div>
            <span className="min-w-0 flex-1 truncate text-ui-small text-muted">
              {best.members.filter((id) => id !== applicant.uid).map((id) => byId.get(id)?.firstName).join(", ")}
            </span>
            <span className="text-ui-medium font-bold tabular-nums">{Math.round(best.score)}</span>
          </button>
        </Section>
      ) : null}

      <Section title={t("Zimmerwünsche", "Room preferences")}>
        {ballot && Object.keys(ballot.roomRanks ?? {}).length ? (
          <ol className="space-y-1">
            {ranked.map(({ room, rank }) => (
              <li key={room.id} className="flex items-center gap-2 text-ui-small">
                <span className="w-5 text-right tabular-nums text-faint">{rank ?? "·"}</span>
                <span className="min-w-0 flex-1 truncate text-muted">{room.name}</span>
                {room.rent ? <span className="text-ui-smaller text-faint">{euro(room.rent, locale)}</span> : null}
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-ui-small text-faint">{t("Noch nicht sortiert.", "Not ranked yet.")}</p>
        )}
      </Section>

      <Section title={t("Gegenseitige Einschätzung", "Mutual ratings")}>
        <div className="mb-2 grid grid-cols-[1fr_76px_76px] gap-2 text-[10px] uppercase tracking-wide text-faint">
          <span />
          <span className="text-center">{t("gibt", "gives")}</span>
          <span className="text-center">{t("bekommt", "gets")}</span>
        </div>
        <div className="space-y-0.5">
          {others.map((o) => (
            <button
              type="button"
              key={o.id}
              onClick={() => onPerson(o.id)}
              className="grid w-full grid-cols-[1fr_76px_76px] items-center gap-2 rounded-sm px-1 py-1 text-left hover:bg-[var(--hover)]"
            >
              <span className="flex min-w-0 items-center gap-2">
                <Avatar applicant={byId.get(o.id)} size={22} />
                <span className="truncate text-ui-small">{byId.get(o.id)?.firstName}</span>
              </span>
              <VotePill vote={o.given} />
              <VotePill vote={o.received} />
            </button>
          ))}
        </div>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-5 border-t border-line pt-4">
      <h3 className="ui-label mb-2.5">{title}</h3>
      {children}
    </section>
  );
}

function VotePill({ vote }: { vote: Vote | null }) {
  const t = useT();
  const o = voteOption(vote);
  if (!o) return <span className="text-center text-[11px] text-faint">{t("offen", "not yet")}</span>;
  return (
    <span
      className="truncate rounded-full px-1.5 py-0.5 text-center text-[11px]"
      style={{ color: o.color, background: `color-mix(in srgb, ${o.color} 14%, transparent)` }}
      title={t(o.label.de, o.label.en)}
    >
      {t(o.short.de, o.short.en)}
    </span>
  );
}

export function Avatar({ applicant, size, ring = false }: { applicant?: Applicant; size: number; ring?: boolean }) {
  const url = applicant?.photos[0]?.url;
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-base-35 text-[11px] font-semibold text-muted ${
        ring ? "ring-2 ring-bg-2" : ""
      }`}
      style={{ width: size, height: size }}
    >
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" className="h-full w-full object-cover" />
      ) : (
        (applicant?.firstName ?? "?").slice(0, 1)
      )}
    </span>
  );
}

function EmptyGraph({ flat }: { flat: Flat }) {
  const t = useT();
  const lp = useLocalePath();
  return (
    <div className="absolute inset-0 flex items-center justify-center p-6">
      <div className="max-w-[360px] text-center">
        <svg viewBox="0 0 120 80" className="mx-auto w-[140px] text-base-40" aria-hidden="true">
          <g stroke="currentColor" strokeWidth="1">
            <line x1="30" y1="40" x2="60" y2="20" />
            <line x1="60" y1="20" x2="90" y2="45" />
            <line x1="30" y1="40" x2="55" y2="62" />
          </g>
          <g fill="currentColor">
            <circle cx="30" cy="40" r="6" />
            <circle cx="60" cy="20" r="7" />
            <circle cx="90" cy="45" r="5" />
            <circle cx="55" cy="62" r="5" />
          </g>
        </svg>
        <h2 className="h4 mt-4">{t("Noch keine Bewerber", "No applicants yet")}</h2>
        <p className="mt-2 text-ui-small text-muted">
          {t(
            "Sobald sich jemand über deinen Link einträgt und andere einschätzt, wächst hier der Graph.",
            "As soon as someone signs up through your link and rates the others, the graph grows here.",
          )}
        </p>
        <Link href={lp(`/app/w/${flat.id}/link`)} className="btn btn-cta mt-5">
          {t("Link teilen", "Share link")}
        </Link>
      </div>
    </div>
  );
}
