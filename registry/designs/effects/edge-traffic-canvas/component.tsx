"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ArrowRight, Pause, Play } from "lucide-react";

export type EdgeRegion = {
  /** IATA-style code drawn on the map. */
  code: string;
  city: string;
  lon: number;
  lat: number;
  /** Share of global traffic, 0 to 1. */
  share: number;
  /** Median time to first byte at this region, in milliseconds. */
  p50: number;
  /** Which side of the marker the code sits on; use "left" to separate close neighbours. */
  labelSide?: "left" | "right";
};

export type EdgeTrafficCanvasProps = {
  brand?: string;
  headline?: string;
  subline?: string;
  ctaLabel?: string;
  ctaHref?: string;
  regions?: EdgeRegion[];
  /** Requests per second across every region. */
  requestsPerSecond?: number;
  /** Share of requests blocked by rate limits, 0 to 1. Drawn as status-colored dots. */
  blockedRate?: number;
  /** One dot on the map stands for this many requests. */
  sampleEvery?: number;
  onPausedChange?: (paused: boolean) => void;
  className?: string;
};

const DEFAULT_REGIONS: EdgeRegion[] = [
  { code: "IAD", city: "Ashburn", lon: -77.4, lat: 38.9, share: 0.18, p50: 24 },
  { code: "FRA", city: "Frankfurt", lon: 8.7, lat: 50.0, share: 0.15, p50: 21 },
  { code: "LHR", city: "London", lon: -0.5, lat: 51.5, share: 0.12, p50: 23, labelSide: "left" },
  { code: "SFO", city: "San Jose", lon: -121.9, lat: 37.4, share: 0.11, p50: 27 },
  { code: "SIN", city: "Singapore", lon: 103.8, lat: 1.4, share: 0.1, p50: 33 },
  { code: "NRT", city: "Tokyo", lon: 140.4, lat: 35.8, share: 0.09, p50: 29 },
  { code: "BOM", city: "Mumbai", lon: 72.9, lat: 19.1, share: 0.09, p50: 38 },
  { code: "GRU", city: "São Paulo", lon: -46.5, lat: -23.4, share: 0.07, p50: 41 },
  { code: "SYD", city: "Sydney", lon: 151.2, lat: -33.9, share: 0.05, p50: 36 },
  { code: "JNB", city: "Johannesburg", lon: 28.2, lat: -26.1, share: 0.04, p50: 44 },
];

const LON_MIN = -130;
const LON_MAX = 180;
const LAT_MAX = 64;
const LAT_MIN = -47;
const DOTS_PER_SECOND = 40;

/** Coarse coastlines as [lon, lat] rings: enough to read as the world in a dot matrix, small enough to inline. */
// prettier-ignore
const LAND: [number, number][][] = [
  // North America
  [[-165, 64], [-140, 60], [-130, 55], [-124, 48], [-124, 40], [-117, 32], [-110, 23], [-105, 20], [-97, 16], [-92, 14], [-84, 10], [-80, 8], [-77, 8], [-83, 15], [-88, 16], [-87, 21], [-90, 21], [-97, 22], [-97, 27], [-90, 29], [-84, 30], [-82, 26], [-80, 25], [-80, 31], [-76, 35], [-74, 40], [-70, 42], [-66, 44], [-61, 46], [-56, 52], [-60, 55], [-64, 60], [-75, 62], [-80, 58], [-92, 57], [-95, 62], [-90, 68], [-110, 70], [-130, 70], [-165, 68]],
  // Greenland
  [[-55, 60], [-42, 60], [-20, 70], [-30, 80], [-60, 80], [-70, 77], [-55, 68]],
  // South America
  [[-80, 9], [-72, 12], [-62, 11], [-52, 5], [-50, 0], [-35, -5], [-35, -10], [-39, -15], [-41, -22], [-48, -26], [-53, -33], [-58, -38], [-65, -41], [-66, -48], [-72, -52], [-75, -46], [-73, -37], [-71, -28], [-70, -18], [-76, -14], [-81, -6], [-80, 0], [-78, 7]],
  // Eurasia
  [[-9, 37], [-9, 43], [-2, 44], [-5, 48], [2, 51], [5, 53], [9, 54], [8, 57], [12, 56], [18, 60], [22, 65], [16, 68], [20, 70], [30, 71], [45, 68], [60, 70], [80, 73], [100, 77], [130, 72], [160, 70], [180, 68], [180, 62], [165, 60], [160, 55], [156, 51], [142, 58], [136, 55], [140, 52], [135, 43], [130, 42], [129, 35], [126, 35], [125, 39], [121, 39], [122, 37], [119, 35], [122, 31], [121, 28], [119, 25], [110, 21], [108, 16], [109, 12], [105, 9], [100, 13], [103, 1.5], [101, 3], [98, 8], [98, 16], [94, 17], [92, 21], [88, 22], [86, 20], [80, 15], [78, 8], [76, 10], [73, 18], [72, 22], [67, 25], [57, 25], [59, 22], [52, 16], [44, 13], [42, 16], [35, 28], [34, 31], [36, 36], [28, 37], [26, 40], [22, 37], [20, 40], [14, 45], [12, 44], [18, 40], [16, 38], [12, 42], [9, 44], [3, 43], [-1, 37], [-6, 36]],
  // Africa
  [[-17, 21], [-17, 15], [-15, 11], [-8, 4], [5, 6], [9, 4], [9, -1], [12, -6], [13, -12], [12, -17], [15, -27], [18, -34], [25, -34], [32, -28], [35, -24], [40, -15], [40, -10], [39, -5], [43, 0], [51, 11], [43, 12], [38, 18], [33, 28], [32, 31], [25, 32], [20, 31], [10, 34], [10, 37], [-1, 36], [-6, 36], [-10, 30], [-13, 27]],
  // Great Britain
  [[-6, 50], [2, 51], [1, 53], [-2, 56], [-5, 58], [-7, 57], [-5, 54], [-5, 52]],
  // Japan
  [[130, 31], [135, 34], [140, 35], [142, 40], [141, 45], [140, 41], [136, 37], [131, 34]],
  // Sumatra, Borneo, Java, New Guinea
  [[95, 5], [98, 4], [104, -2], [106, -6], [102, -5], [96, 2]],
  [[109, 1], [117, 7], [119, 1], [116, -4], [110, -3]],
  [[105, -6], [114, -7], [114, -8.5], [106, -7.5]],
  [[131, -1], [141, -3], [150, -10], [141, -9], [137, -5]],
  // Australia
  [[114, -22], [122, -17], [130, -12], [137, -12], [142, -11], [146, -19], [153, -25], [151, -34], [146, -39], [140, -38], [135, -35], [130, -32], [115, -34], [114, -26]],
  // New Zealand, Madagascar, Philippines
  [[172, -35], [178, -38], [174, -41], [168, -46], [171, -44]],
  [[44, -25], [47, -25], [50, -15], [49, -12], [44, -16]],
  [[120, 18], [122, 18], [126, 7], [122, 7]],
];

type Palette = { accent: string; foreground: string; muted: string; border: string; blocked: string; mono: string };
type Packet = { ox: number; oy: number; node: number; born: number; duration: number; blocked: boolean };
type Flash = { node: number; at: number; blocked: boolean };
type Rect = { x: number; y: number; w: number; h: number };
type Projection = { x: number; y: number; sx: number; sy: number };

function cx(...classes: (string | false | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

function formatRate(value: number) {
  return Math.round(value).toLocaleString("en-US");
}

/** Deterministic pseudo-random numbers, so the reduced-motion snapshot is the same on every render. */
function seeded(seed: number) {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

/** Equirectangular fit inside the map area; latitude may stretch up to 1.5x so short areas stay readable. */
function projection(rect: Rect): Projection {
  const pad = 20;
  const sx = (rect.w - pad * 2) / (LON_MAX - LON_MIN);
  const sy = Math.min(sx * 1.5, (rect.h - pad * 2) / (LAT_MAX - LAT_MIN));
  const height = sy * (LAT_MAX - LAT_MIN);
  return { x: rect.x + pad, y: rect.y + (rect.h - height) / 2, sx, sy };
}

function toScreen(lon: number, lat: number, fit: Projection) {
  return { x: fit.x + (lon - LON_MIN) * fit.sx, y: fit.y + (LAT_MAX - lat) * fit.sy };
}

function onLand(lon: number, lat: number) {
  for (const ring of LAND) {
    let inside = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i, i += 1) {
      const [xi, yi] = ring[i] ?? [0, 0];
      const [xj, yj] = ring[j] ?? [0, 0];
      if (yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside;
    }
    if (inside) return true;
  }
  return false;
}

function pickRegion(regions: EdgeRegion[], random: number) {
  let sum = 0;
  const total = regions.reduce((acc, region) => acc + region.share, 0) || 1;
  for (let index = 0; index < regions.length; index += 1) {
    sum += (regions[index]?.share ?? 0) / total;
    if (random <= sum) return index;
  }
  return regions.length - 1;
}

/** A point on the packet's arc from its client to the region, t from 0 to 1. */
function along(packet: Packet, target: { x: number; y: number }, t: number) {
  const mx = (packet.ox + target.x) / 2;
  const my = (packet.oy + target.y) / 2;
  const dx = target.x - packet.ox;
  const dy = target.y - packet.oy;
  // Lift the arc perpendicular to its direction by a fifth of its length.
  const qx = mx - dy * 0.2;
  const qy = my + dx * 0.2;
  const u = 1 - t;
  return {
    x: u * u * packet.ox + 2 * u * t * qx + t * t * target.x,
    y: u * u * packet.oy + 2 * u * t * qy + t * t * target.y,
  };
}

function spawn(regions: EdgeRegion[], fit: Projection, now: number, random: () => number, blockedRate: number): Packet {
  const node = pickRegion(regions, random());
  const region = regions[node];
  const home = region ? toScreen(region.lon, region.lat, fit) : { x: fit.x, y: fit.y };
  // Clients sit within roughly 25 degrees of the region that answers them.
  const angle = random() * Math.PI * 2;
  const distance = 6 + random() * 22;
  return {
    ox: home.x + Math.cos(angle) * distance * fit.sx,
    oy: home.y + Math.sin(angle) * distance * 0.6 * fit.sy,
    node,
    born: now,
    duration: 700 + random() * 500,
    blocked: random() < blockedRate,
  };
}

/** The static layer: background dot grid, land as a denser dot matrix, corner ticks and the projection label. */
function drawLayer(
  context: CanvasRenderingContext2D,
  size: { w: number; h: number },
  rect: Rect,
  fit: Projection,
  palette: Palette,
) {
  context.clearRect(0, 0, size.w, size.h);
  context.fillStyle = palette.border;
  for (let y = 12; y < size.h; y += 24) {
    for (let x = 12; x < size.w; x += 24) {
      if (x > rect.x && x < rect.x + rect.w && y > rect.y && y < rect.y + rect.h) continue;
      context.fillRect(x, y, 1.5, 1.5);
    }
  }
  const step = rect.w < 520 ? 6 : 8;
  for (let y = rect.y + step / 2; y < rect.y + rect.h; y += step) {
    for (let x = rect.x + step / 2; x < rect.x + rect.w; x += step) {
      const lon = LON_MIN + (x - fit.x) / fit.sx;
      const lat = LAT_MAX - (y - fit.y) / fit.sy;
      const land = lat <= LAT_MAX && lat >= LAT_MIN && lon >= LON_MIN && lon <= LON_MAX && onLand(lon, lat);
      context.fillStyle = land ? palette.muted : palette.border;
      context.globalAlpha = land ? 0.85 : 0.5;
      const dot = land ? 1.75 : 1;
      context.fillRect(x - dot / 2, y - dot / 2, dot, dot);
    }
  }
  context.globalAlpha = 0.8;
  context.strokeStyle = palette.muted;
  context.lineWidth = 1;
  const tick = 10;
  for (const [x, y, sx, sy] of [
    [rect.x, rect.y, 1, 1],
    [rect.x + rect.w, rect.y, -1, 1],
    [rect.x, rect.y + rect.h, 1, -1],
    [rect.x + rect.w, rect.y + rect.h, -1, -1],
  ] as const) {
    context.beginPath();
    context.moveTo(x + 0.5 * sx, y + tick * sy);
    context.lineTo(x + 0.5 * sx, y + 0.5 * sy);
    context.lineTo(x + tick * sx, y + 0.5 * sy);
    context.stroke();
  }
  context.globalAlpha = 1;
  context.fillStyle = palette.muted;
  context.font = `500 10px ${palette.mono}`;
  context.textBaseline = "top";
  context.fillText("EQUIRECTANGULAR · 64°N–47°S", rect.x + 16, rect.y + 6);
}

function drawFrame(
  context: CanvasRenderingContext2D,
  layer: HTMLCanvasElement,
  size: { w: number; h: number },
  fit: Projection,
  regions: EdgeRegion[],
  packets: Packet[],
  flashes: Flash[],
  now: number,
  palette: Palette,
) {
  context.clearRect(0, 0, size.w, size.h);
  context.drawImage(layer, 0, 0, size.w, size.h);
  const positions = regions.map((region) => toScreen(region.lon, region.lat, fit));

  // Packets: an arc from the client to its region, with a short trail behind the head.
  for (const packet of packets) {
    const target = positions[packet.node];
    if (!target) continue;
    const t = Math.min(1, (now - packet.born) / packet.duration);
    const eased = 1 - (1 - t) * (1 - t);
    const color = packet.blocked ? palette.blocked : palette.accent;
    context.strokeStyle = color;
    context.lineWidth = 1.25;
    context.globalAlpha = 0.5;
    context.beginPath();
    for (let step = 0; step <= 8; step += 1) {
      const point = along(packet, target, Math.max(0, eased - 0.3 + (step / 8) * 0.3));
      if (step === 0) context.moveTo(point.x, point.y);
      else context.lineTo(point.x, point.y);
    }
    context.stroke();
    context.globalAlpha = 1;
    const head = along(packet, target, eased);
    context.fillStyle = color;
    context.fillRect(head.x - 1.5, head.y - 1.5, 3, 3);
  }

  // Arrival rings: a square outline that widens and fades over 420ms.
  for (const flash of flashes) {
    const target = positions[flash.node];
    if (!target) continue;
    const t = Math.min(1, (now - flash.at) / 420);
    const half = 5 + t * 10;
    context.globalAlpha = 1 - t;
    context.strokeStyle = flash.blocked ? palette.blocked : palette.accent;
    context.lineWidth = 1;
    context.strokeRect(target.x - half + 0.5, target.y - half + 0.5, half * 2, half * 2);
  }
  context.globalAlpha = 1;

  // Regions: a solid square sized by traffic share, and its code.
  context.font = `600 11px ${palette.mono}`;
  context.textBaseline = "middle";
  regions.forEach((region, index) => {
    const point = positions[index];
    if (!point) return;
    const half = 2.5 + Math.min(3, region.share * 18);
    context.fillStyle = palette.foreground;
    context.fillRect(point.x - half, point.y - half, half * 2, half * 2);
    if (region.labelSide === "left") {
      context.textAlign = "right";
      context.fillText(region.code, point.x - half - 5, point.y - half - 4);
      context.textAlign = "left";
    } else context.fillText(region.code, point.x + half + 5, point.y - half - 4);
  });
}

export function EdgeTrafficCanvas({
  brand = "Ostra Edge",
  headline = "Every request lands at the closest of 10 regions.",
  subline = "This is production traffic, sampled. Each dot is one request travelling from a client to the region that answered it, in a median of 27 ms.",
  ctaLabel = "Open traffic explorer",
  ctaHref = "#explorer",
  regions = DEFAULT_REGIONS,
  requestsPerSecond = 48214,
  blockedRate = 0.018,
  sampleEvery = 2000,
  onPausedChange,
  className = "",
}: EdgeTrafficCanvasProps) {
  const titleId = useId();
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const probeRef = useRef<HTMLSpanElement>(null);
  const pausedRef = useRef(false);
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(query.matches);
    const frame = window.requestAnimationFrame(update);
    query.addEventListener("change", update);
    return () => {
      window.cancelAnimationFrame(frame);
      query.removeEventListener("change", update);
    };
  }, []);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    const section = sectionRef.current;
    const canvas = canvasRef.current;
    const map = mapRef.current;
    const probe = probeRef.current;
    const context = canvas?.getContext("2d");
    if (!section || !canvas || !map || !probe || !context) return;

    let size = { w: 0, h: 0 };
    let rect: Rect = { x: 0, y: 0, w: 0, h: 0 };
    let fit: Projection = { x: 0, y: 0, sx: 1, sy: 1 };
    let palette: Palette = { accent: "", foreground: "", muted: "", border: "", blocked: "", mono: "monospace" };
    let paletteKey = "";
    let packets: Packet[] = [];
    let flashes: Flash[] = [];
    let visible = false;
    let frame = 0;
    let last = 0;
    let carry = 0;
    let clock = 0;
    let colorsReadAt = -Infinity;
    const random = seeded(20260314);
    // Grid, land and labels change only on resize or re-theme, so they are drawn once into an offscreen layer.
    const layer = document.createElement("canvas");
    const layerContext = layer.getContext("2d");
    if (!layerContext) return;

    const paintLayer = () => {
      const ratio = canvas.width / Math.max(1, size.w);
      layer.width = canvas.width;
      layer.height = canvas.height;
      layerContext.setTransform(ratio, 0, 0, ratio, 0, 0);
      drawLayer(layerContext, size, rect, fit, palette);
    };

    const readPalette = () => {
      const pick = (key: string) => {
        const element = probe.querySelector<HTMLElement>(`[data-probe="${key}"]`);
        return element ? getComputedStyle(element).color : "";
      };
      const monoProbe = probe.querySelector<HTMLElement>('[data-probe="mono"]');
      palette = {
        accent: pick("accent"),
        foreground: pick("foreground"),
        muted: pick("muted"),
        border: pick("border"),
        blocked: pick("blocked"),
        mono: monoProbe ? getComputedStyle(monoProbe).fontFamily : "monospace",
      };
      const key = Object.values(palette).join("|");
      if (key !== paletteKey) {
        paletteKey = key;
        if (size.w > 0) paintLayer();
      }
    };

    const measure = () => {
      const box = section.getBoundingClientRect();
      const area = map.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      size = { w: box.width, h: box.height };
      rect = { x: area.left - box.left, y: area.top - box.top, w: area.width, h: area.height };
      fit = projection(rect);
      canvas.width = Math.round(box.width * ratio);
      canvas.height = Math.round(box.height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      packets = [];
      flashes = [];
      paintLayer();
    };

    // A frozen frame of requests mid-flight, so reduced motion and the paused map still show the shape of traffic.
    const snapshot = () => {
      if (packets.length > 0) {
        drawFrame(context, layer, size, fit, regions, packets, [], clock, palette);
        return;
      }
      const still = seeded(7);
      const now = 10000;
      const frozen = Array.from({ length: 64 }, () => {
        const packet = spawn(regions, fit, now, still, blockedRate);
        packet.born = now - packet.duration * (0.2 + still() * 0.7);
        return packet;
      });
      drawFrame(context, layer, size, fit, regions, frozen, [], now, palette);
    };

    const running = () =>
      visible &&
      !pausedRef.current &&
      document.visibilityState === "visible" &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const loop = (time: number) => {
      frame = 0;
      if (!running()) {
        last = 0;
        return;
      }
      const delta = last ? Math.min(64, time - last) : 16;
      last = time;
      clock += delta;
      if (clock - colorsReadAt > 1000) {
        readPalette();
        colorsReadAt = clock;
      }
      carry += (delta / 1000) * DOTS_PER_SECOND;
      while (carry >= 1 && packets.length < 120) {
        packets.push(spawn(regions, fit, clock, random, blockedRate));
        carry -= 1;
      }
      const landed = packets.filter((packet) => clock - packet.born >= packet.duration);
      for (const packet of landed) flashes.push({ node: packet.node, at: clock, blocked: packet.blocked });
      packets = packets.filter((packet) => clock - packet.born < packet.duration);
      flashes = flashes.filter((flash) => clock - flash.at < 420);
      drawFrame(context, layer, size, fit, regions, packets, flashes, clock, palette);
      frame = window.requestAnimationFrame(loop);
    };

    const resume = () => {
      if (frame === 0 && running()) frame = window.requestAnimationFrame(loop);
    };

    measure();
    readPalette();
    snapshot();

    const resizeObserver = new ResizeObserver(() => {
      measure();
      if (!running()) snapshot();
    });
    resizeObserver.observe(section);
    const visibilityObserver = new IntersectionObserver((entries) => {
      visible = entries.some((entry) => entry.isIntersecting);
      resume();
    });
    visibilityObserver.observe(section);
    const onVisibility = () => resume();
    document.addEventListener("visibilitychange", onVisibility);
    const onPauseToggle = () => {
      if (pausedRef.current) {
        readPalette();
        snapshot();
      } else resume();
    };
    section.addEventListener("edge-traffic:toggle", onPauseToggle);

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      visibilityObserver.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      section.removeEventListener("edge-traffic:toggle", onPauseToggle);
    };
  }, [regions, blockedRate, reduced]);

  // The readout follows the same gate as the canvas: it ticks once a second only while traffic is drawn live.
  useEffect(() => {
    if (paused || reduced) return;
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") setTick((value) => value + 1);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [paused, reduced]);

  const togglePaused = () => {
    const next = !paused;
    pausedRef.current = next;
    setPaused(next);
    onPausedChange?.(next);
    sectionRef.current?.dispatchEvent(new Event("edge-traffic:toggle"));
  };

  // Gentle, deterministic variance per second so the readout reads as live without inventing a trend.
  const wobble = (index: number) => (tick === 0 ? 1 : 1 + Math.sin(tick * 1.7 + index * 2.3) * 0.025);
  const top = [...regions].sort((a, b) => b.share - a.share).slice(0, 4);
  const live = !paused && !reduced;
  const status = reduced ? "Snapshot" : paused ? "Paused" : "Live";

  return (
    <section
      ref={sectionRef}
      aria-labelledby={titleId}
      className={cx(
        "relative isolate overflow-hidden bg-(--iu-background) font-(family-name:--iu-font) text-(--iu-foreground)",
        className,
      )}
    >
      <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 -z-10 size-full" />
      <span ref={probeRef} aria-hidden="true" className="hidden">
        <span data-probe="accent" className="text-(--iu-accent)" />
        <span data-probe="foreground" className="text-(--iu-foreground)" />
        <span data-probe="muted" className="text-(--iu-muted)" />
        <span data-probe="border" className="text-(--iu-foreground)/18" />
        <span data-probe="blocked" className="text-red-600 dark:text-red-400" />
        <span data-probe="mono" className="font-mono" />
      </span>

      <div className="mx-auto flex max-w-[1200px] flex-col px-4 pt-10 pb-6 sm:px-10 sm:pt-16 sm:pb-10">
        <div className="grid grid-cols-12 gap-x-6">
          <div className="col-span-12 lg:col-span-5">
            <div className="relative rounded-[min(var(--iu-radius),8px)] border border-(--iu-border) bg-(--iu-background) p-[calc(24px*var(--iu-density))] dark:border-(--iu-foreground)/14 dark:bg-(--iu-surface)">
              <div className="flex items-center justify-between gap-4 font-mono text-[11px] tracking-[0.08em] text-(--iu-muted) uppercase">
                <span>{brand} / traffic</span>
                <span className="inline-flex items-center gap-2 text-(--iu-foreground)">
                  <span
                    aria-hidden="true"
                    className={cx("size-1.5 rounded-full", live ? "bg-(--iu-accent)" : "bg-(--iu-muted)")}
                  />
                  {status}
                </span>
              </div>
              <h2
                id={titleId}
                className="mt-6 text-[clamp(1.875rem,1.3rem+2.2vw,2.75rem)] leading-[1.05] font-semibold tracking-[-0.03em] text-balance"
              >
                {headline}
              </h2>
              <p className="mt-4 text-[15px] leading-relaxed text-pretty text-(--iu-muted)">{subline}</p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <a
                  href={ctaHref}
                  className="group inline-flex h-10 items-center gap-2 rounded-[min(var(--iu-radius),8px)] bg-(--iu-accent) px-4 text-sm font-medium text-(--iu-accent-foreground) transition-[filter] duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--iu-accent) motion-reduce:transition-none pointer-fine:hover:brightness-110"
                >
                  {ctaLabel}
                  <ArrowRight
                    size={16}
                    strokeWidth={1.5}
                    aria-hidden="true"
                    className="transition-transform duration-150 motion-reduce:transition-none pointer-fine:group-hover:translate-x-0.5"
                  />
                </a>
                {reduced ? null : (
                  <button
                    type="button"
                    onClick={togglePaused}
                    className="inline-flex h-10 items-center gap-2 rounded-[min(var(--iu-radius),8px)] border border-(--iu-foreground)/35 px-3 font-mono text-xs text-(--iu-foreground) transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--iu-accent) motion-reduce:transition-none pointer-fine:hover:bg-(--iu-foreground)/6"
                  >
                    {paused ? (
                      <Play size={14} strokeWidth={1.5} aria-hidden="true" />
                    ) : (
                      <Pause size={14} strokeWidth={1.5} aria-hidden="true" />
                    )}
                    {paused ? "Resume map" : "Pause map"}
                  </button>
                )}
              </div>
            </div>
          </div>
          <div
            ref={mapRef}
            role="img"
            aria-label={`Map of ${regions.length} edge regions with sampled requests arriving at each. Busiest: ${top
              .map((region) => `${region.city} ${Math.round(region.share * 100)}%`)
              .join(", ")}.`}
            className="col-span-12 mt-6 h-[220px] sm:h-[340px] lg:col-span-7 lg:mt-0 lg:h-auto lg:min-h-[420px]"
          />
        </div>

        <div className="mt-6 rounded-[min(var(--iu-radius),8px)] border border-(--iu-border) bg-(--iu-background) dark:border-(--iu-foreground)/14 dark:bg-(--iu-surface)">
          <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-b border-dashed border-(--iu-border) px-4 py-2.5 font-mono text-[11px] tracking-[0.08em] text-(--iu-muted) uppercase dark:border-(--iu-foreground)/14">
            <span className="inline-flex flex-wrap items-center gap-x-4 gap-y-1">
              <span className="inline-flex items-center gap-1.5">
                <span aria-hidden="true" className="size-2 bg-(--iu-accent)" />
                Served
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span aria-hidden="true" className="size-2 bg-red-600 dark:bg-red-400" />
                Blocked 429
              </span>
            </span>
            <span className="tracking-normal normal-case">1 dot ≈ {sampleEvery.toLocaleString("en-US")} requests</span>
          </div>
          <dl className="grid grid-cols-2 gap-px bg-(--iu-border) sm:grid-cols-3 lg:grid-cols-6 dark:bg-(--iu-foreground)/14">
            <div className="bg-(--iu-background) px-4 py-[calc(12px*var(--iu-density))] dark:bg-(--iu-surface)">
              <dt className="font-mono text-[11px] tracking-[0.08em] text-(--iu-muted) uppercase">Requests / s</dt>
              <dd className="mt-1 font-mono text-xl text-(--iu-foreground) tabular-nums">
                {formatRate(requestsPerSecond * wobble(9))}
              </dd>
            </div>
            <div className="bg-(--iu-background) px-4 py-[calc(12px*var(--iu-density))] dark:bg-(--iu-surface)">
              <dt className="font-mono text-[11px] tracking-[0.08em] text-(--iu-muted) uppercase">Blocked</dt>
              <dd className="mt-1 font-mono text-xl text-(--iu-foreground) tabular-nums">
                {(blockedRate * 100 * wobble(4)).toFixed(1)}%
              </dd>
            </div>
            {top.map((region, index) => (
              <div
                key={region.code}
                className="bg-(--iu-background) px-4 py-[calc(12px*var(--iu-density))] dark:bg-(--iu-surface)"
              >
                <dt className="flex items-baseline justify-between gap-2 font-mono text-[11px] tracking-[0.08em] text-(--iu-muted) uppercase">
                  <span>{region.code}</span>
                  <span className="tracking-normal normal-case">{region.p50} ms p50</span>
                </dt>
                <dd className="mt-1 font-mono text-xl text-(--iu-foreground) tabular-nums">
                  {formatRate(requestsPerSecond * region.share * wobble(index))}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}

export default EdgeTrafficCanvas;
