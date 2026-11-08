"use client";

import { useEffect, useRef } from "react";

import { useT } from "@/lib/i18n/client";

import { CAMP_COLOR, FPS, LINKS, NEIGHBORS, PEOPLE, SPAWN_FRAME, TRIO, nodeRadius, orbitLayout } from "./heroGraph";

const ACCENT = "#8a6cef";
/** Perspective: larger is flatter. */
const LENS = 3.2;
/** Half of the swing to either side while nobody touches it, in radians. */
const SWAY = 0.8;

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const clampSpin = (x: number) => Math.min(4, Math.max(-4, x));
const easeOutBack = (t: number) => Math.max(0, 1 + 3.2 * Math.pow(t - 1, 3) + 2.2 * Math.pow(t - 1, 2));
/** The same angle, as close to zero as it gets, so it never unwinds extra turns. */
const wrap = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));

function sprite(size: number, paint: (c: CanvasRenderingContext2D) => void) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  paint(canvas.getContext("2d")!);
  return canvas;
}

/** A round portrait, or the initial for people without a photo. */
function faceSprite(i: number, onLoad: () => void, font: string) {
  const person = PEOPLE[i];
  const size = 160;
  const canvas = sprite(size, (c) => {
    c.beginPath();
    c.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    c.fillStyle = "#2a2a2a";
    c.fill();
    if (person.face) return;
    c.fillStyle = CAMP_COLOR[person.camp];
    c.font = `700 ${size * 0.48}px ${font}`;
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText(person.name[0], size / 2, size / 2 + 3);
  });
  if (person.face) {
    const img = new Image();
    img.onload = () => {
      const c = canvas.getContext("2d")!;
      c.save();
      c.beginPath();
      c.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
      c.clip();
      c.drawImage(img, 0, 0, size, size);
      c.restore();
      onLoad();
    };
    img.src = `/faces/${person.face}.webp`;
  }
  return canvas;
}

const glowSprite = (color: string) =>
  sprite(128, (c) => {
    const g = c.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, color);
    g.addColorStop(1, "rgba(138,108,239,0)");
    c.fillStyle = g;
    c.fillRect(0, 0, 128, 128);
  });

/**
 * Draws and runs the graph. Canvas instead of the hero window's SVG, because
 * every position changes on every frame. Returns the cleanup.
 */
function startOrbit(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
  const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const pts = orbitLayout();
  const trio = new Set(TRIO);
  const font = getComputedStyle(canvas).fontFamily;
  const faces = PEOPLE.map((_, i) => faceSprite(i, () => wake(), font));
  const halo = glowSprite("rgba(138,108,239,0.55)");
  const spark = glowSprite("rgba(235,228,255,0.95)");

  // The best group faces the viewer in the rest position.
  const center = [0, 1, 2].map((k) => TRIO.reduce((sum, i) => sum + pts[i][k], 0) / TRIO.length);
  const front = Math.atan2(-center[0], center[2]);
  const level = Math.atan2(-center[1], Math.hypot(center[0], center[2]));

  const count = PEOPLE.length;
  const sx = new Float32Array(count);
  const sy = new Float32Array(count);
  const scale = new Float32Array(count);
  const depth = new Float32Array(count);
  const radius = new Float32Array(count);
  const nodeItems = PEOPLE.map((_, i) => ({ z: 0, node: i, link: -1 }));
  // Only the best group's links join the depth sort. All others lie behind the
  // faces: a thin line jumping from behind a portrait to in front of it flickers.
  const isBest = LINKS.map((l) => trio.has(l.a) && trio.has(l.b));
  const bestItems = LINKS.flatMap((_, k) => (isBest[k] ? [{ z: 0, node: -1, link: k }] : []));
  // Sorted in place on every frame, so depths are only ever written through the two lists above.
  const items = [...nodeItems, ...bestItems];
  const pulses = still ? [] : Array.from({ length: 8 }, () => ({ link: 0, at: 1 + Math.random() * 2, speed: 0.5 }));

  let width = 0;
  let height = 0;
  let unit = 0;
  let raf = 0;
  let visible = true;
  let last = 0;
  let age = still ? 99 : 0;
  let clock = 0;
  let pace = 1;
  let yaw = 0;
  let pitch = 0;
  let spinX = 0;
  let spinY = 0;
  let idleFor = 99;
  let dragging = false;
  let lastX = 0;
  let lastY = 0;
  let lastMove = 0;
  let hover: number | null = null;
  let focus: number | null = null;
  let focusMix = 0;

  function resize() {
    const box = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = box.width;
    height = box.height;
    unit = Math.min(width, height) * 0.4;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    wake();
  }

  function step(dt: number) {
    age += dt;
    idleFor += dt;
    pace += ((dragging ? 0 : hover !== null ? 0.15 : 1) - pace) * Math.min(1, dt * 4);
    focusMix = clamp01(focusMix + (hover !== null ? 7 : -7) * dt);
    if (still) return;
    clock += dt * pace;
    if (!dragging) {
      yaw += spinX * dt;
      pitch += spinY * dt;
      const friction = Math.exp(-2.4 * dt);
      spinX *= friction;
      spinY *= friction;
      // Once it has been let go for a moment it drifts back to the rest position.
      if (idleFor > 2.5) {
        const back = Math.exp(-0.25 * dt);
        yaw = wrap(yaw) * back;
        pitch *= back;
      }
    }
    for (const p of pulses) {
      p.at += dt * p.speed;
      if (p.at < 1) continue;
      p.link = Math.floor(Math.random() * LINKS.length);
      p.speed = 0.35 + Math.random() * 0.4;
      p.at = -Math.random() * 2;
    }
  }

  function project() {
    const a = front + yaw + (still ? 0 : SWAY * Math.sin(clock * 0.16));
    const b = level + pitch + (still ? 0 : 0.2 * Math.sin(clock * 0.11));
    const [ca, sa, cb, sb] = [Math.cos(a), Math.sin(a), Math.cos(b), Math.sin(b)];
    const cx = width / 2;
    const cy = height / 2;
    for (let i = 0; i < count; i++) {
      // Every node drifts a little on its own, so the graph never stands still.
      const x0 = pts[i][0] + (still ? 0 : 0.014 * Math.sin(clock * 0.7 + i * 1.7));
      const y0 = pts[i][1] + (still ? 0 : 0.014 * Math.cos(clock * 0.6 + i * 2.3));
      const z0 = pts[i][2];
      const x1 = x0 * ca + z0 * sa;
      const z1 = -x0 * sa + z0 * ca;
      const y2 = y0 * cb + z1 * sb;
      const z2 = -y0 * sb + z1 * cb;
      const s = LENS / (LENS - z2);
      sx[i] = cx + x1 * s * unit;
      sy[i] = cy + y2 * s * unit;
      scale[i] = s;
      depth[i] = z2;
      nodeItems[i].z = z2;
    }
    for (const item of bestItems) {
      // Slightly behind both ends, a link never crosses over its own node.
      const l = LINKS[item.link];
      item.z = Math.min(depth[l.a], depth[l.b]) - 0.02;
    }
    items.sort((p, q) => p.z - q.z);
  }

  /** Bright in front, fading into the page behind. */
  const fogAt = (z: number) => 0.14 + 0.86 * Math.pow(clamp01((z + 1) / 2), 1.5);
  const popAt = (i: number) => (still ? 1 : clamp01((age - (SPAWN_FRAME[i] / FPS) * 0.42) / 0.55));

  function draw() {
    ctx.clearRect(0, 0, width, height);
    const lit = still ? 1 : clamp01((age - 2.5) / 0.9);
    const size = unit / 200;
    if (hover !== null) focus = hover;
    const near = focus !== null ? NEIGHBORS[focus] : null;

    const drawLink = (k: number) => {
      const l = LINKS[k];
      const fade = Math.min(popAt(l.a), popAt(l.b));
      if (fade <= 0) return;
      const fog = fogAt((depth[l.a] + depth[l.b]) / 2);
      const touched = focus !== null && (l.a === focus || l.b === focus) && l.s >= 0.45;
      const mean = (scale[l.a] + scale[l.b]) / 2;
      ctx.beginPath();
      ctx.moveTo(sx[l.a], sy[l.a]);
      ctx.lineTo(sx[l.b], sy[l.b]);
      if (touched && focusMix > 0) {
        ctx.strokeStyle = ACCENT;
        ctx.globalAlpha = (0.25 + 0.75 * fog) * focusMix;
        ctx.lineWidth = (1 + 1.6 * l.s) * mean;
      } else if (isBest[k]) {
        ctx.strokeStyle = ACCENT;
        ctx.globalAlpha = fade * (0.35 + 0.65 * fog) * (0.25 + 0.75 * lit) * (1 - 0.6 * focusMix);
        ctx.lineWidth = (1.4 + 2 * lit) * mean;
      } else {
        ctx.strokeStyle = "#dadada";
        ctx.globalAlpha = fade * fog * (0.1 + 0.34 * l.s) * (1 - 0.7 * focusMix);
        ctx.lineWidth = (0.6 + 1.1 * l.s) * mean;
      }
      ctx.stroke();
    };

    for (let k = 0; k < LINKS.length; k++) if (!isBest[k]) drawLink(k);

    for (const item of items) {
      if (item.link >= 0) {
        drawLink(item.link);
        continue;
      }

      const i = item.node;
      const pop = popAt(i);
      if (pop <= 0) continue;
      const best = trio.has(i);
      const inFocus = focus !== null && (i === focus || near!.has(i));
      const fog = fogAt(item.z);
      const shown = fog * (inFocus ? 1 : 1 - 0.72 * focusMix);
      const r = nodeRadius(i) * (best ? 1.3 : 1) * scale[i] * size * easeOutBack(pop);
      if (best && lit > 0) {
        const g = r * 3;
        ctx.globalAlpha = lit * (0.3 + 0.7 * fog) * (1 - 0.6 * focusMix);
        ctx.drawImage(halo, sx[i] - g, sy[i] - g, 2 * g, 2 * g);
      }
      // A dark disc first, so nothing behind shines through a faded portrait.
      ctx.globalAlpha = 1;
      ctx.beginPath();
      ctx.arc(sx[i], sy[i], r, 0, Math.PI * 2);
      ctx.fillStyle = "#1e1e1e";
      ctx.fill();
      ctx.globalAlpha = Math.max(0.16, shown);
      ctx.drawImage(faces[i], sx[i] - r, sy[i] - r, 2 * r, 2 * r);
      ctx.beginPath();
      ctx.arc(sx[i], sy[i], r, 0, Math.PI * 2);
      ctx.strokeStyle = i === focus && focusMix > 0 ? ACCENT : best && lit > 0.5 ? ACCENT : CAMP_COLOR[PEOPLE[i].camp];
      ctx.lineWidth = (best ? 2.6 : 1.8) * scale[i];
      ctx.globalAlpha = Math.max(0.16, shown);
      ctx.stroke();

      radius[i] = r;
    }

    // Names last, so no portrait ever covers one.
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.lineWidth = 3;
    ctx.strokeStyle = "rgba(30,30,30,0.85)";
    ctx.fillStyle = "#dadada";
    // One fixed size: a size that follows the depth would jump a whole pixel now and then.
    ctx.font = `600 13px ${font}`;
    for (let i = 0; i < count; i++) {
      const inFocus = focus !== null && (i === focus || near!.has(i));
      const named = inFocus ? focusMix : trio.has(i) ? lit * (1 - focusMix) : 0;
      if (named <= 0 || popAt(i) <= 0) continue;
      ctx.globalAlpha = named * (0.45 + 0.55 * fogAt(depth[i]));
      ctx.strokeText(PEOPLE[i].name, sx[i], sy[i] + radius[i] + 5);
      ctx.fillText(PEOPLE[i].name, sx[i], sy[i] + radius[i] + 5);
    }

    // Ratings travelling from one applicant to another.
    for (const p of pulses) {
      if (p.at <= 0) continue;
      const l = LINKS[p.link];
      if (Math.min(popAt(l.a), popAt(l.b)) < 1) continue;
      const x = sx[l.a] + (sx[l.b] - sx[l.a]) * p.at;
      const y = sy[l.a] + (sy[l.b] - sy[l.a]) * p.at;
      const z = depth[l.a] + (depth[l.b] - depth[l.a]) * p.at;
      const g = 9 * size * (LENS / (LENS - z));
      ctx.globalAlpha = fogAt(z) * Math.sin(p.at * Math.PI) * (1 - 0.7 * focusMix);
      ctx.drawImage(spark, x - g, y - g, 2 * g, 2 * g);
    }
    ctx.globalAlpha = 1;
    if (hover === null && focusMix === 0) focus = null;
  }

  function frame(now: number) {
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
    last = now;
    step(dt);
    project();
    draw();
    // With reduced motion it only redraws while someone is turning or pointing at it.
    const settled = still && !dragging && focusMix === (hover !== null ? 1 : 0);
    raf = visible && !settled ? requestAnimationFrame(frame) : 0;
    if (!raf) last = 0;
  }

  function wake() {
    if (!raf && visible && width > 0) raf = requestAnimationFrame(frame);
  }

  const nodeAt = (x: number, y: number) => {
    for (let k = items.length - 1; k >= 0; k--) {
      const i = items[k].node;
      if (i < 0 || popAt(i) < 1) continue;
      const r = nodeRadius(i) * (trio.has(i) ? 1.3 : 1) * scale[i] * (unit / 200) + 3;
      if (Math.hypot(sx[i] - x, sy[i] - y) <= r) return i;
    }
    return null;
  };

  const onDown = (e: PointerEvent) => {
    if (e.button !== 0) return;
    canvas.setPointerCapture(e.pointerId);
    dragging = true;
    hover = null;
    lastX = e.clientX;
    lastY = e.clientY;
    lastMove = e.timeStamp;
    spinX = spinY = 0;
    wake();
  };
  const onMove = (e: PointerEvent) => {
    if (!dragging) {
      if (e.pointerType !== "touch") {
        const box = canvas.getBoundingClientRect();
        const found = nodeAt(e.clientX - box.left, e.clientY - box.top);
        if (found !== hover) {
          hover = found;
          wake();
        }
      }
      return;
    }
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    const elapsed = Math.max(1, e.timeStamp - lastMove) / 1000;
    yaw += dx * 0.008;
    pitch = Math.max(-1.1, Math.min(1.1, pitch + dy * 0.006));
    if (!still) {
      spinX = clampSpin(spinX * 0.6 + ((dx * 0.008) / elapsed) * 0.4);
      spinY = clampSpin(spinY * 0.6 + ((dy * 0.006) / elapsed) * 0.4);
    }
    lastX = e.clientX;
    lastY = e.clientY;
    lastMove = e.timeStamp;
    idleFor = 0;
    wake();
  };
  const onUp = (e: PointerEvent) => {
    dragging = false;
    // A pause before letting go means it was put down, not thrown.
    if (e.timeStamp - lastMove > 80) spinX = spinY = 0;
    idleFor = 0;
    wake();
  };
  const onLeave = () => {
    if (!dragging && hover !== null) {
      hover = null;
      wake();
    }
  };

  canvas.addEventListener("pointerdown", onDown);
  canvas.addEventListener("pointermove", onMove);
  canvas.addEventListener("pointerup", onUp);
  canvas.addEventListener("pointercancel", onUp);
  canvas.addEventListener("pointerleave", onLeave);

  const sizes = new ResizeObserver(resize);
  sizes.observe(canvas);
  // No work while it is scrolled away.
  const seen = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) wake();
  });
  seen.observe(canvas);

  return () => {
    cancelAnimationFrame(raf);
    sizes.disconnect();
    seen.disconnect();
    canvas.removeEventListener("pointerdown", onDown);
    canvas.removeEventListener("pointermove", onMove);
    canvas.removeEventListener("pointerup", onUp);
    canvas.removeEventListener("pointercancel", onUp);
    canvas.removeEventListener("pointerleave", onLeave);
  };
}

/**
 * The hero graph: applicants float in a ball that turns slowly, the best group
 * in front. Drag it to spin it, let go and it comes back to rest.
 */
export function OrbitGraph() {
  const t = useT();
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    return startOrbit(canvas, ctx);
  }, []);

  return (
    <canvas
      ref={ref}
      role="img"
      aria-label={t(
        "Beweglicher Graph mit 48 Bewerbern in vier Gruppen, die beste Dreiergruppe leuchtet",
        "Moving graph of 48 applicants in four clusters, the best group of three lights up",
      )}
      className="absolute inset-0 h-full w-full cursor-grab touch-pan-y select-none active:cursor-grabbing"
    />
  );
}
