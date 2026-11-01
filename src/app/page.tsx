import { ArrowRight, BedDouble, Link2, Waypoints } from "lucide-react";
import Link from "next/link";

import { SiteFooter, SiteNav } from "@/components/site/SiteNav";

/**
 * Placeholder landing page. The real one gets designed in detail later, this
 * only explains the idea and leads to sign up.
 */
export default function LandingPage() {
  return (
    <div className="min-h-dvh">
      <SiteNav />
      <main>
        <section className="mx-auto grid max-w-[1080px] items-center gap-10 px-4 pb-16 pt-16 md:grid-cols-[1.1fr_1fr] md:px-6 md:pt-24">
          <div>
            <span className="tag">Für Vermieter möblierter WG Zimmer</span>
            <h1 className="mt-5 text-[40px] font-bold leading-[1.08] tracking-[-0.025em] md:text-[56px]">
              Vermiete an Leute, die zusammenpassen.
            </h1>
            <p className="mt-5 max-w-[520px] text-[17px] leading-relaxed text-muted">
              Deine Bewerber schätzen sich gegenseitig ein und sortieren die Zimmer. Du siehst als Graph, wer miteinander
              wohnen will, und bekommst die beste Gruppe samt Zimmerverteilung.
            </p>
            <div className="mt-8 flex flex-wrap gap-2">
              <Link href="/anmelden?neu=1" className="btn btn-cta btn-lg">
                7 Tage kostenlos testen <ArrowRight size={15} strokeWidth={1.75} />
              </Link>
              <Link href="/preise" className="btn btn-lg">
                Preise
              </Link>
            </div>
          </div>
          <HeroGraph />
        </section>

        <section id="so-gehts" className="border-t border-line">
          <div className="mx-auto max-w-[1080px] px-4 py-16 md:px-6">
            <h2 className="h2">So geht&apos;s</h2>
            <div className="mt-8 grid gap-3 md:grid-cols-3">
              {[
                {
                  icon: BedDouble,
                  title: "Wohnung anlegen",
                  text: "Zimmer mit Foto, Miete und Größe, dazu ein paar Sätze über dich.",
                },
                {
                  icon: Link2,
                  title: "Link teilen",
                  text: "In deine Anzeige oder als Antwort an alle, die sich melden. Bewerber brauchen keine App.",
                },
                {
                  icon: Waypoints,
                  title: "Gruppe finden",
                  text: "Bewerber bewerten sich gegenseitig von Auf keinen Fall bis Unbedingt. Du siehst, wer zusammenpasst.",
                },
              ].map(({ icon: Icon, title, text }, i) => (
                <div key={title} className="card p-5">
                  <div className="flex items-center gap-2 text-faint">
                    <Icon size={18} strokeWidth={1.75} className="text-accent" />
                    <span className="text-ui-smaller tabular-nums">0{i + 1}</span>
                  </div>
                  <h3 className="mt-4 text-ui-large font-semibold">{title}</h3>
                  <p className="mt-2 text-ui-medium leading-relaxed text-muted">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

/** A still life of the graph view: two clusters, one loner, thin lines. */
function HeroGraph() {
  const nodes = [
    { x: 120, y: 120, r: 16, c: "#a882ff" },
    { x: 190, y: 80, r: 13, c: "#a882ff" },
    { x: 205, y: 160, r: 14, c: "#a882ff" },
    { x: 140, y: 200, r: 11, c: "#a882ff" },
    { x: 330, y: 230, r: 15, c: "#53dfdd" },
    { x: 390, y: 180, r: 12, c: "#53dfdd" },
    { x: 400, y: 280, r: 13, c: "#53dfdd" },
    { x: 300, y: 320, r: 10, c: "#53dfdd" },
    { x: 330, y: 70, r: 9, c: "#666666" },
    { x: 80, y: 320, r: 9, c: "#666666" },
  ];
  const edges = [
    [0, 1, 3],
    [0, 2, 2.5],
    [1, 2, 2],
    [0, 3, 1.2],
    [2, 3, 1],
    [4, 5, 2.5],
    [4, 6, 3],
    [5, 6, 1.5],
    [4, 7, 1],
    [6, 7, 1.2],
    [2, 4, 0.8],
    [1, 8, 0.6],
  ];
  return (
    <div className="card relative aspect-[5/4] overflow-hidden bg-bg">
      <svg viewBox="0 0 480 384" className="h-full w-full" aria-hidden="true">
        {edges.map(([a, b, w], i) => (
          <line
            key={i}
            x1={nodes[a].x}
            y1={nodes[a].y}
            x2={nodes[b].x}
            y2={nodes[b].y}
            stroke={a === 0 || b === 0 ? "hsl(254 80% 68%)" : "rgba(255,255,255,0.22)"}
            strokeWidth={w}
            strokeLinecap="round"
          />
        ))}
        {nodes.map((n, i) => (
          <g key={i}>
            {i === 0 ? <circle cx={n.x} cy={n.y} r={n.r + 8} fill="hsl(254 80% 68% / 0.2)" /> : null}
            <circle cx={n.x} cy={n.y} r={n.r} fill="#3f3f3f" stroke={n.c} strokeWidth={2.5} />
          </g>
        ))}
      </svg>
      <div className="absolute bottom-3 right-3 rounded-lg border border-line bg-bg-2/95 px-3 py-2 text-ui-small">
        <div className="text-faint">Beste 3er Gruppe</div>
        <div className="mt-0.5 flex items-baseline gap-2">
          <span className="text-[20px] font-bold">91</span>
          <span className="text-muted">Lena, Jonas, Sophie</span>
        </div>
      </div>
    </div>
  );
}
