"use client";

import {
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  forceX,
  forceY,
  type Simulation,
  type SimulationLinkDatum,
  type SimulationNodeDatum,
} from "d3-force";
import { Maximize2, Minus, Plus } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { useT } from "@/lib/i18n/client";

/**
 * Force directed graph in the style of Obsidian's graph view, drawn on canvas.
 *
 * Mutual sympathy is a spring that pulls people together, stronger and shorter
 * the better they rate each other. Dislike and vetos are not drawn, they push
 * people apart instead, so clusters of people who want to live together form
 * on their own.
 */

export interface GraphNode {
  id: string;
  label: string;
  photoUrl: string | null;
  /** 0 to 1, how well this person is rated by others. Scales the node. */
  weight: number;
  /** Cluster number, -1 for none. */
  cluster: number;
}

export interface GraphLink {
  source: string;
  target: string;
  /** Pair weight 0 to 1, 0.5 is neutral. */
  w: number;
  /** Positive part rescaled 0 to 1. */
  strength: number;
  veto: boolean;
  mutual: boolean;
}

export const CLUSTER_COLORS = ["#a882ff", "#53dfdd", "#e9973f", "#44cf6e", "#fa99cd", "#e0de71", "#027aff", "#fb464c"];

interface SimNode extends SimulationNodeDatum, GraphNode {
  r: number;
}
type SimLink = SimulationLinkDatum<SimNode> & Omit<GraphLink, "source" | "target">;

interface Props {
  nodes: GraphNode[];
  links: GraphLink[];
  selectedId: string | null;
  /** When set, everyone else fades, like hovering in Obsidian. */
  highlightIds: Set<string> | null;
  showLabels: boolean;
  showVetos: boolean;
  colorClusters: boolean;
  repel: number;
  linkForce: number;
  onSelect: (id: string | null) => void;
}

const BASE_R = 17;

export function ApplicantGraph({
  nodes,
  links,
  selectedId,
  highlightIds,
  showLabels,
  showVetos,
  colorClusters,
  repel,
  linkForce,
  onSelect,
}: Props) {
  const t = useT();
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const simRef = useRef<Simulation<SimNode, SimLink> | null>(null);
  const nodesRef = useRef<Map<string, SimNode>>(new Map());
  const linksRef = useRef<SimLink[]>([]);
  const view = useRef({ k: 1, x: 0, y: 0 });
  const size = useRef({ w: 0, h: 0, dpr: 1 });
  const hover = useRef<string | null>(null);
  /** Once someone pans or zooms, we stop fitting the view automatically. */
  const userMoved = useRef(false);
  const fitRef = useRef<() => void>(() => {});
  const images = useRef<Map<string, HTMLImageElement>>(new Map());
  const frame = useRef<number | null>(null);
  const props = useRef({ selectedId, highlightIds, showLabels, showVetos, colorClusters });
  props.current = { selectedId, highlightIds, showLabels, showVetos, colorClusters };
  const [cursor, setCursor] = useState("grab");

  /* ------------------------------------------------------------- drawing */

  const draw = useCallback(() => {
    frame.current = null;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { w, h, dpr } = size.current;
    const { k, x, y } = view.current;
    const { selectedId: sel, highlightIds: hl, showLabels: labels, showVetos: vetos, colorClusters: colors } =
      props.current;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.setTransform(dpr * k, 0, 0, dpr * k, dpr * x, dpr * y);

    // Focus set: hover wins, then an explicit highlight, then the selection.
    const focusId = hover.current ?? sel;
    let focus: Set<string> | null = hl;
    if (hover.current || (!hl && sel)) {
      focus = new Set([focusId!]);
      for (const l of linksRef.current) {
        const a = (l.source as SimNode).id;
        const b = (l.target as SimNode).id;
        if (l.strength <= 0) continue;
        if (a === focusId) focus.add(b);
        if (b === focusId) focus.add(a);
      }
    }
    const faded = (id: string) => focus !== null && !focus.has(id);

    // Links
    ctx.lineCap = "round";
    for (const l of linksRef.current) {
      const s = l.source as SimNode;
      const t = l.target as SimNode;
      if (s.x == null || t.x == null) continue;
      if (l.veto || l.strength <= 0) {
        if (!vetos || !l.veto) continue;
        ctx.setLineDash([4, 5]);
        ctx.strokeStyle = faded(s.id) || faded(t.id) ? "rgba(251,70,76,0.08)" : "rgba(251,70,76,0.45)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(s.x, s.y!);
        ctx.lineTo(t.x, t.y!);
        ctx.stroke();
        ctx.setLineDash([]);
        continue;
      }
      const inFocus = focus !== null && focus.has(s.id) && focus.has(t.id) && (hl !== null || s.id === focusId || t.id === focusId);
      if (inFocus) ctx.strokeStyle = "hsl(254 80% 68%)";
      else if (focus) ctx.strokeStyle = "rgba(255,255,255,0.04)";
      else ctx.strokeStyle = `rgba(255,255,255,${0.12 + 0.28 * l.strength})`;
      ctx.lineWidth = (inFocus ? 1.2 : 0.7) + 2.6 * l.strength;
      ctx.beginPath();
      ctx.moveTo(s.x, s.y!);
      ctx.lineTo(t.x, t.y!);
      ctx.stroke();
    }

    // Nodes
    for (const n of nodesRef.current.values()) {
      if (n.x == null || n.y == null) continue;
      const isFaded = faded(n.id);
      const isSel = n.id === sel;
      const isHover = n.id === hover.current;
      ctx.globalAlpha = isFaded ? 0.18 : 1;

      if (isSel || isHover) {
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r + 7, 0, Math.PI * 2);
        ctx.fillStyle = "hsl(254 80% 68% / 0.22)";
        ctx.fill();
      }

      ctx.save();
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      ctx.closePath();
      ctx.fillStyle = "#3f3f3f";
      ctx.fill();
      ctx.clip();
      const img = n.photoUrl ? images.current.get(n.photoUrl) : undefined;
      if (img && img.complete && img.naturalWidth) {
        const s = Math.min(img.naturalWidth, img.naturalHeight);
        ctx.drawImage(
          img,
          (img.naturalWidth - s) / 2,
          (img.naturalHeight - s) / 4,
          s,
          s,
          n.x - n.r,
          n.y - n.r,
          n.r * 2,
          n.r * 2,
        );
      } else {
        ctx.fillStyle = "#b3b3b3";
        ctx.font = `600 ${n.r * 0.9}px ui-sans-serif, -apple-system, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(n.label.slice(0, 1).toUpperCase(), n.x, n.y + 1);
      }
      ctx.restore();

      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      const clusterColor = colors && n.cluster >= 0 ? CLUSTER_COLORS[n.cluster % CLUSTER_COLORS.length] : null;
      if (isSel || (hl && hl.has(n.id))) {
        ctx.strokeStyle = "hsl(254 80% 68%)";
        ctx.lineWidth = 3;
      } else if (clusterColor) {
        ctx.strokeStyle = clusterColor;
        ctx.lineWidth = 2.5;
      } else {
        ctx.strokeStyle = isHover ? "#dadada" : "#555555";
        ctx.lineWidth = 1.5;
      }
      ctx.stroke();

      // Labels fade in with zoom, like Obsidian's text fade threshold.
      const labelAlpha = isHover || isSel || (hl && hl.has(n.id)) ? 1 : labels ? Math.min(1, Math.max(0, (k - 0.45) * 2.5)) : 0;
      if (labelAlpha > 0) {
        ctx.globalAlpha = (isFaded ? 0.2 : 1) * labelAlpha;
        ctx.fillStyle = isHover || isSel ? "#dadada" : "#b3b3b3";
        ctx.font = `${isHover || isSel ? 600 : 400} 11px ui-sans-serif, -apple-system, BlinkMacSystemFont, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.fillText(n.label, n.x, n.y + n.r + 5);
      }
      ctx.globalAlpha = 1;
    }
  }, []);

  const requestDraw = useCallback(() => {
    if (frame.current === null) frame.current = requestAnimationFrame(draw);
  }, [draw]);

  /* ---------------------------------------------------------- simulation */

  useEffect(() => {
    const sim = forceSimulation<SimNode, SimLink>()
      .alphaDecay(0.025)
      .velocityDecay(0.35)
      .on("tick", requestDraw)
      .on("end", () => {
        if (!userMoved.current) fitRef.current();
      });
    simRef.current = sim;
    return () => {
      sim.stop();
    };
  }, [requestDraw]);

  // Data changes keep existing positions, so the graph never jumps.
  useEffect(() => {
    const sim = simRef.current;
    if (!sim) return;
    const prev = nodesRef.current;
    const next = new Map<string, SimNode>();
    nodes.forEach((n, i) => {
      const old = prev.get(n.id);
      const angle = (i / Math.max(1, nodes.length)) * Math.PI * 2;
      next.set(n.id, {
        ...n,
        r: BASE_R + 10 * n.weight,
        x: old?.x ?? Math.cos(angle) * 160 + (Math.random() - 0.5) * 20,
        y: old?.y ?? Math.sin(angle) * 160 + (Math.random() - 0.5) * 20,
        vx: old?.vx,
        vy: old?.vy,
      });
      if (n.photoUrl && !images.current.has(n.photoUrl)) {
        const img = new Image();
        img.decoding = "async";
        img.onload = requestDraw;
        img.src = n.photoUrl;
        images.current.set(n.photoUrl, img);
      }
    });
    nodesRef.current = next;
    linksRef.current = links
      .filter((l) => next.has(l.source) && next.has(l.target))
      .map((l) => ({ ...l, source: next.get(l.source)!, target: next.get(l.target)! }));

    const positive = linksRef.current.filter((l) => l.strength > 0 && !l.veto);
    const negative = linksRef.current.filter((l) => l.w < 0.5 || l.veto);

    sim.nodes([...next.values()]);
    sim
      .force(
        "link",
        forceLink<SimNode, SimLink>(positive)
          .id((d) => d.id)
          .distance((l) => 170 - 100 * l.strength)
          .strength((l) => (0.08 + 0.7 * l.strength) * linkForce),
      )
      .force("charge", forceManyBody<SimNode>().strength(-240 * repel).distanceMax(700))
      .force("collide", forceCollide<SimNode>().radius((d) => d.r + 10))
      .force("x", forceX<SimNode>(0).strength(0.045))
      .force("y", forceY<SimNode>(0).strength(0.045))
      .force("dislike", (alpha: number) => {
        // People who reject each other push apart up to a long distance.
        for (const l of negative) {
          const s = l.source as SimNode;
          const t = l.target as SimNode;
          const dx = t.x! - s.x! || 0.01;
          const dy = t.y! - s.y! || 0.01;
          const d = Math.hypot(dx, dy);
          const reach = 380;
          if (d > reach) continue;
          const power = (l.veto ? 1 : (0.5 - l.w) * 2) * 0.09 * repel;
          const f = ((reach - d) / d) * power * alpha;
          s.vx! -= dx * f;
          s.vy! -= dy * f;
          t.vx! += dx * f;
          t.vy! += dy * f;
        }
      });
    sim.alpha(prev.size ? 0.5 : 1).restart();
    requestDraw();
  }, [nodes, links, repel, linkForce, requestDraw]);

  useEffect(requestDraw, [selectedId, highlightIds, showLabels, showVetos, colorClusters, requestDraw]);

  /* ------------------------------------------------------- size and zoom */

  const fit = useCallback(() => {
    const list = [...nodesRef.current.values()];
    const { w, h } = size.current;
    if (!list.length || !w) {
      view.current = { k: 1, x: w / 2, y: h / 2 };
      requestDraw();
      return;
    }
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const n of list) {
      minX = Math.min(minX, n.x! - n.r);
      maxX = Math.max(maxX, n.x! + n.r);
      minY = Math.min(minY, n.y! - n.r);
      maxY = Math.max(maxY, n.y! + n.r + 18);
    }
    const pad = 60;
    const k = Math.min(1.6, Math.max(0.3, Math.min((w - pad * 2) / (maxX - minX), (h - pad * 2) / (maxY - minY))));
    view.current = { k, x: w / 2 - ((minX + maxX) / 2) * k, y: h / 2 - ((minY + maxY) / 2) * k };
    requestDraw();
  }, [requestDraw]);
  fitRef.current = fit;

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    let first = true;
    const ro = new ResizeObserver(() => {
      const rect = wrap.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const prev = size.current;
      size.current = { w: rect.width, h: rect.height, dpr };
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      if (first) {
        view.current = { k: 0.9, x: rect.width / 2, y: rect.height / 2 };
        first = false;
      } else if (userMoved.current) {
        view.current.x += (rect.width - prev.w) / 2;
        view.current.y += (rect.height - prev.h) / 2;
      } else {
        fitRef.current();
      }
      requestDraw();
    });
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [requestDraw]);

  /* ---------------------------------------------------------- pointer */

  const toWorld = (clientX: number, clientY: number) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const { k, x, y } = view.current;
    return { x: (clientX - rect.left - x) / k, y: (clientY - rect.top - y) / k };
  };

  const nodeAt = (clientX: number, clientY: number): SimNode | null => {
    const p = toWorld(clientX, clientY);
    let best: SimNode | null = null;
    let bestD = Infinity;
    for (const n of nodesRef.current.values()) {
      const d = Math.hypot(n.x! - p.x, n.y! - p.y);
      if (d < n.r + 4 && d < bestD) {
        best = n;
        bestD = d;
      }
    }
    return best;
  };

  const drag = useRef<{
    mode: "pan" | "node";
    node?: SimNode;
    startX: number;
    startY: number;
    moved: boolean;
    viewX: number;
    viewY: number;
  } | null>(null);

  const onPointerDown = (e: React.PointerEvent) => {
    (e.target as Element).setPointerCapture(e.pointerId);
    const node = nodeAt(e.clientX, e.clientY);
    drag.current = {
      mode: node ? "node" : "pan",
      node: node ?? undefined,
      startX: e.clientX,
      startY: e.clientY,
      moved: false,
      viewX: view.current.x,
      viewY: view.current.y,
    };
    if (node) {
      node.fx = node.x;
      node.fy = node.y;
      simRef.current?.alphaTarget(0.25).restart();
    }
    setCursor(node ? "grabbing" : "grabbing");
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) {
      const node = nodeAt(e.clientX, e.clientY);
      const id = node?.id ?? null;
      if (id !== hover.current) {
        hover.current = id;
        setCursor(id ? "pointer" : "grab");
        requestDraw();
      }
      return;
    }
    if (Math.hypot(e.clientX - d.startX, e.clientY - d.startY) > 3) d.moved = true;
    if (d.mode === "node" && d.node) {
      const p = toWorld(e.clientX, e.clientY);
      d.node.fx = p.x;
      d.node.fy = p.y;
    } else {
      view.current.x = d.viewX + (e.clientX - d.startX);
      view.current.y = d.viewY + (e.clientY - d.startY);
      if (d.moved) userMoved.current = true;
    }
    requestDraw();
  };

  const onPointerUp = () => {
    const d = drag.current;
    drag.current = null;
    setCursor(hover.current ? "pointer" : "grab");
    if (!d) return;
    if (d.mode === "node" && d.node) {
      d.node.fx = null;
      d.node.fy = null;
      simRef.current?.alphaTarget(0);
      if (!d.moved) onSelect(d.node.id);
    } else if (!d.moved) {
      onSelect(null);
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;
      const { k, x, y } = view.current;
      const factor = Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0018));
      const nk = Math.min(4, Math.max(0.2, k * factor));
      view.current = { k: nk, x: px - ((px - x) / k) * nk, y: py - ((py - y) / k) * nk };
      userMoved.current = true;
      requestDraw();
    };
    canvas.addEventListener("wheel", onWheel, { passive: false });
    return () => canvas.removeEventListener("wheel", onWheel);
  }, [requestDraw]);

  const zoomBy = (factor: number) => {
    const { w, h } = size.current;
    const { k, x, y } = view.current;
    const nk = Math.min(4, Math.max(0.2, k * factor));
    view.current = { k: nk, x: w / 2 - ((w / 2 - x) / k) * nk, y: h / 2 - ((h / 2 - y) / k) * nk };
    userMoved.current = true;
    requestDraw();
  };

  return (
    <div ref={wrapRef} className="absolute inset-0 overflow-hidden">
      <canvas
        ref={canvasRef}
        className="block touch-none select-none"
        style={{ cursor }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={() => {
          if (!drag.current && hover.current) {
            hover.current = null;
            requestDraw();
          }
        }}
        aria-label={t(
          "Graph der Bewerber. Nähe und Linien zeigen, wer sich gegenseitig mag.",
          "Applicant graph. Closeness and lines show who likes each other.",
        )}
        role="img"
      />
      <div className="absolute bottom-3 left-3 flex flex-col overflow-hidden rounded-lg border border-line bg-bg-2/90 backdrop-blur">
        <button type="button" className="icon-btn rounded-none" onClick={() => zoomBy(1.25)} aria-label={t("Hineinzoomen", "Zoom in")}>
          <Plus size={15} strokeWidth={1.75} />
        </button>
        <button type="button" className="icon-btn rounded-none" onClick={() => zoomBy(0.8)} aria-label={t("Herauszoomen", "Zoom out")}>
          <Minus size={15} strokeWidth={1.75} />
        </button>
        <button
          type="button"
          className="icon-btn rounded-none"
          onClick={() => {
            userMoved.current = false;
            fit();
          }}
          aria-label={t("Alles zeigen", "Show everyone")}
        >
          <Maximize2 size={13} strokeWidth={1.75} />
        </button>
      </div>
    </div>
  );
}
