"use client";

import React, {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type FocusEvent,
  type PointerEvent,
  type ReactNode,
} from "react";

/*
 * Integration Beam – Nazazi Edition
 * 
 * Demonstrates the 3-Step Journey in real-time motion:
 * Left: Telebirr, CBE Bank, and Verify.ET sending payment confirmations inward.
 * Center: The Nazazi Spiritual SMS Engine glowing and synchronizing.
 * Right: Outgoing automated beams delivering Daily SMS, Scripture Verses, and Dawn 12:30 Blessings.
 */

export type BeamTool = {
  name: string;
  subtitle?: string;
  logo: ReactNode;
};

export type BeamCenter = {
  name: string;
  logo?: ReactNode;
};

export type IntegrationBeamProps = {
  left?: BeamTool[];
  right?: BeamTool[];
  center?: BeamCenter;
  className?: string;
  label?: string;
  isAmharic?: boolean;
};

/* Choreography, in ms */
const TRAVEL = 1600; // one pulse, end to end
const STAGGER = 300; // between the pulses of one wave
const REST = 1600; // quiet time between two sync cycles
const MORPH = 460; // tiles and curves gliding to a new layout
const FLASH = 1500; // tooltip shown after a tap
const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

const easeOut = (t: number) => 1 - (1 - t) ** 5;
const easeInOut = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2;

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

type Point = { x: number; y: number };
type Curve = number[];

export function IntegrationBeam({
  left,
  right,
  center,
  className,
  label,
  isAmharic = true,
}: IntegrationBeamProps) {
  const defaultLeft: BeamTool[] = [
    {
      name: isAmharic ? "ቴሌብር (Telebirr)" : "Telebirr",
      subtitle: isAmharic ? "የሞባይል ክፍያ" : "Mobile Money",
      logo: (
        <svg viewBox="0 0 28 28" fill="none" className="w-full h-full" aria-hidden="true">
          <rect width="28" height="28" rx="7" fill="#00A3E0" />
          <path
            d="M8 8.5C8 7.67 8.67 7 9.5 7H18.5C19.33 7 20 7.67 20 8.5V19.5C20 20.33 19.33 21 18.5 21H9.5C8.67 21 8 20.33 8 19.5V8.5Z"
            fill="white"
            fillOpacity="0.15"
          />
          <path
            d="M10.5 11H17.5M14 11V18M11.5 18H16.5"
            stroke="white"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="14" cy="7.5" r="1" fill="#FFC836" />
        </svg>
      ),
    },
    {
      name: isAmharic ? "ንግድ ባንክ (CBE)" : "Commercial Bank (CBE)",
      subtitle: isAmharic ? "የባንክ ማስተላለፊያ" : "Bank Transfer",
      logo: (
        <svg viewBox="0 0 28 28" fill="none" className="w-full h-full" aria-hidden="true">
          <rect width="28" height="28" rx="7" fill="#58167D" />
          <path
            d="M14 6L21 14L14 22L7 14L14 6Z"
            stroke="#F4B41A"
            strokeWidth="1.8"
            fill="#F4B41A"
            fillOpacity="0.25"
          />
          <circle cx="14" cy="14" r="3" fill="#F4B41A" />
        </svg>
      ),
    },
    {
      name: isAmharic ? "Verify.ET" : "Verify.ET",
      subtitle: isAmharic ? "ቅጽበታዊ ማረጋገጫ" : "Instant Verification",
      logo: (
        <svg viewBox="0 0 28 28" fill="none" className="w-full h-full" aria-hidden="true">
          <rect width="28" height="28" rx="7" fill="#0E1B26" />
          <path
            d="M14 6L7 9.5V14.5C7 18.8 9.9 22.8 14 24C18.1 22.8 21 18.8 21 14.5V9.5L14 6Z"
            fill="#059669"
            fillOpacity="0.2"
            stroke="#10B981"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <path
            d="M11 14.2L13 16.2L17.5 11.8"
            stroke="#34D399"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
  ];

  const defaultRight: BeamTool[] = [
    {
      name: isAmharic ? "ቀጥታ SMS" : "Direct SMS",
      subtitle: isAmharic ? "ያለ ኢንተርኔት" : "Offline Delivery",
      logo: (
        <svg viewBox="0 0 28 28" fill="none" className="w-full h-full" aria-hidden="true">
          <rect width="28" height="28" rx="7" fill="#FAF4F2" className="dark:fill-[#2A1D1A]" />
          <rect
            x="7"
            y="6"
            width="14"
            height="16"
            rx="2.5"
            stroke="#981C00"
            className="dark:stroke-[#C43214]"
            strokeWidth="1.6"
          />
          <path
            d="M10 10H18M10 13H15M13 18H15"
            stroke="#981C00"
            className="dark:stroke-[#C43214]"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      ),
    },
    {
      name: isAmharic ? "የዕለቱ ቃል" : "Daily Scripture",
      subtitle: isAmharic ? "የመንፈስ ብርታት" : "Spiritual Verses",
      logo: (
        <svg viewBox="0 0 28 28" fill="none" className="w-full h-full" aria-hidden="true">
          <rect width="28" height="28" rx="7" fill="#FAF4F2" className="dark:fill-[#2A1D1A]" />
          <path
            d="M7 8C7 7.4 7.4 7 8 7H13.2C13.7 7 14 7.3 14 7.8V20.5C13.6 20.2 12.8 20 12 20H8C7.4 20 7 19.6 7 19V8Z"
            fill="#981C00"
            fillOpacity="0.2"
            stroke="#981C00"
            className="dark:fill-[#C43214] dark:stroke-[#C43214]"
            strokeWidth="1.5"
          />
          <path
            d="M21 8C21 7.4 20.6 7 20 7H14.8C14.3 7 14 7.3 14 7.8V20.5C14.4 20.2 15.2 20 16 20H20C20.6 20 21 19.6 21 19V8Z"
            fill="#981C00"
            fillOpacity="0.2"
            stroke="#981C00"
            className="dark:fill-[#C43214] dark:stroke-[#C43214]"
            strokeWidth="1.5"
          />
          <path
            d="M14 8.5V20M10 11H12M16 11H18"
            stroke="#981C00"
            className="dark:stroke-[#C43214]"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
        </svg>
      ),
    },
    {
      name: isAmharic ? "ማለዳ 12:30" : "Dawn 12:30",
      subtitle: isAmharic ? "በየዕለቱ በሰዓቱ" : "Every Morning",
      logo: (
        <svg viewBox="0 0 28 28" fill="none" className="w-full h-full" aria-hidden="true">
          <rect width="28" height="28" rx="7" fill="#FAF4F2" className="dark:fill-[#2A1D1A]" />
          <circle
            cx="14"
            cy="14"
            r="7"
            stroke="#F59E0B"
            strokeWidth="1.6"
            fill="#F59E0B"
            fillOpacity="0.15"
          />
          <path
            d="M14 10V14L16.5 15.5"
            stroke="#F59E0B"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M14 4V5.5M14 22.5V24M4 14H5.5M22.5 14H24"
            stroke="#F59E0B"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
        </svg>
      ),
    },
  ];

  const defaultCenter: BeamCenter = {
    name: isAmharic ? "ናዛዚ" : "Nazazi",
    logo: (
      <div className="w-9 h-9 rounded-2xl bg-gradient-to-b from-[#7A1D28] via-[#981C00] to-[#5C1000] text-white flex items-center justify-center font-bold text-sm shadow-md ring-2 ring-[#FAF8F5]/20">
        <span className="font-bela-bereka text-base tracking-tighter">ና</span>
      </div>
    ),
  };

  const effectiveLeft = left ?? defaultLeft;
  const effectiveRight = right ?? defaultRight;
  const effectiveCenter = center ?? defaultCenter;

  const uid = "ui-ib" + useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const tools = [...effectiveLeft, ...effectiveRight];
  const n = tools.length;
  const nLeft = effectiveLeft.length;

  const [off, setOff] = useState<ReadonlySet<number>>(() => new Set());
  const [focus, setFocus] = useState<number | null>(null);
  const [flash, setFlash] = useState<number | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [announce, setAnnounce] = useState("");

  const rootRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const centerRef = useRef<HTMLDivElement>(null);
  const centerRingRef = useRef<HTMLSpanElement>(null);
  const chipRef = useRef<HTMLSpanElement>(null);
  const chipInnerRef = useRef<HTMLSpanElement>(null);
  const toolRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const ringRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const lineRefs = useRef<(SVGPathElement | null)[]>([]);
  const pulseRefs = useRef<(SVGGElement | null)[]>([]);
  const gradRefs = useRef<(SVGLinearGradientElement | null)[]>([]);
  const flashTimer = useRef(0);
  const offRef = useRef(off);
  offRef.current = off;

  const connected = n - off.size;
  const status =
    connected === 0
      ? isAmharic
        ? "ሁሉም ቆመዋል"
        : "All paused"
      : syncing
      ? isAmharic
        ? "በማስተላለፍ ላይ…"
        : "Syncing…"
      : isAmharic
      ? `${connected} ተገናኝተዋል`
      : `${connected} connected`;

  /* ---------- Beams: measure, morph, pulses ---------- */
  useIsoLayoutEffect(() => {
    const root = rootRef.current;
    const scene = sceneRef.current;
    const svg = svgRef.current;
    const hub = centerRef.current;
    if (!root || !scene || !svg || !hub) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let shown: Curve[] = [];
    let from: Curve[] = [];
    let to: Curve[] = [];
    let morphStart = 0;
    let lastPos: Point[] | null = null;
    let lastStack: boolean | null = null;
    const lengths: number[] = [];

    const centerOf = (el: HTMLElement): Point => ({
      x: el.offsetLeft + el.offsetWidth / 2,
      y: el.offsetTop + el.offsetHeight / 2,
    });

    const curve = (a: Point, b: Point, stack: boolean): Curve => {
      if (stack) {
        const my = (a.y + b.y) / 2;
        return [a.x, a.y, a.x, my, b.x, my, b.x, b.y];
      }
      const mx = (a.x + b.x) / 2;
      return [a.x, a.y, mx, a.y, mx, b.y, b.x, b.y];
    };

    const draw = (curves: Curve[]) => {
      shown = curves;
      curves.forEach((c, i) => {
        const d = `M${c[0]} ${c[1]}C${c[2]} ${c[3]} ${c[4]} ${c[5]} ${c[6]} ${c[7]}`;
        const line = lineRefs.current[i];
        if (!line) return;
        line.setAttribute("d", d);
        pulseRefs.current[i]?.querySelectorAll("path").forEach((p) => p.setAttribute("d", d));
        lengths[i] = line.getTotalLength();
      });
    };

    const measure = () => {
      svg.setAttribute("viewBox", `0 0 ${root.clientWidth} ${root.clientHeight}`);
      const stack = getComputedStyle(scene).getPropertyValue("--ui-ib-stack").trim() === "1";
      const els = [...toolRefs.current.slice(0, n), hub];
      if (els.some((el) => !el)) return;
      const pos = els.map((el) => centerOf(el!));
      const c = pos[n];
      const target = pos
        .slice(0, n)
        .map((p, i) => (i < nLeft ? curve(p, c, stack) : curve(c, p, stack)));

      if (lastPos && lastStack !== null && stack !== lastStack && !reduce) {
        els.forEach((el, i) => {
          const dx = lastPos![i].x - pos[i].x;
          const dy = lastPos![i].y - pos[i].y;
          if (dx || dy)
            el!.animate(
              [{ transform: `translate(${dx}px, ${dy}px)` }, { transform: "none" }],
              { duration: MORPH, easing: EASE },
            );
        });
        from = shown.length === n ? shown : target;
        to = target;
        morphStart = performance.now();
        kick();
      } else if (morphStart) {
        to = target;
      } else {
        draw(target);
      }
      lastPos = pos;
      lastStack = stack;
    };

    const pulseStart: (number | null)[] = Array(n).fill(null);
    let queue: { beam: number; at: number }[] = [];
    let nextCycle = 0;
    let syncFrom = 0;
    let syncTo = 0;
    let wasSyncing = false;
    let visible = false;
    let raf = 0;

    const hide = (i: number) => {
      pulseStart[i] = null;
      const g = pulseRefs.current[i];
      if (g) g.style.opacity = "0";
    };

    const ring = (el: HTMLElement | null | undefined) =>
      el?.animate(
        [
          { opacity: 0, transform: "scale(0.96)" },
          { opacity: 1, transform: "scale(1)", offset: 0.3 },
          { opacity: 0, transform: "scale(1.14)" },
        ],
        { duration: 760, easing: "ease-out" },
      );

    const planCycle = (now: number) => {
      const ins = Array.from({ length: nLeft }, (_, i) => i).filter(
        (i) => !offRef.current.has(i),
      );
      const outs = Array.from({ length: n - nLeft }, (_, i) => nLeft + i).filter(
        (i) => !offRef.current.has(i),
      );
      if (!ins.length && !outs.length) {
        nextCycle = now + REST;
        return;
      }
      const t0 = now;
      const tOut = ins.length ? t0 + TRAVEL : t0;
      queue = [
        ...ins.map((beam, k) => ({ beam, at: t0 + k * STAGGER })),
        ...outs.map((beam, k) => ({ beam, at: tOut + k * STAGGER })),
      ];
      const end = Math.max(...queue.map((q) => q.at)) + TRAVEL;
      syncFrom = ins.length ? tOut : t0;
      syncTo = end;
      nextCycle = end + REST;
    };

    const paint = (i: number, t: number) => {
      const line = lineRefs.current[i];
      const g = pulseRefs.current[i];
      const grad = gradRefs.current[i];
      if (!line || !g || !grad) return;
      const L = lengths[i] || 0;
      const seg = Math.min(84, L * 0.42);
      const head = easeInOut(t) * (L + seg);
      g.querySelectorAll("path").forEach((p) => {
        p.style.strokeDasharray = `${seg} ${L + seg}`;
        p.style.strokeDashoffset = `${seg - head}`;
      });
      const a = line.getPointAtLength(Math.max(0, Math.min(L, head - seg)));
      const b = line.getPointAtLength(Math.max(0, Math.min(L, head)));
      grad.setAttribute("x1", `${a.x}`);
      grad.setAttribute("y1", `${a.y}`);
      grad.setAttribute("x2", `${b.x + (b.x === a.x && b.y === a.y ? 0.01 : 0)}`);
      grad.setAttribute("y2", `${b.y}`);
      g.style.opacity = "1";
    };

    const frame = (now: number) => {
      raf = 0;
      if (morphStart) {
        const t = Math.min(1, (now - morphStart) / MORPH);
        const e = easeOut(t);
        draw(to.map((c, i) => c.map((v, k) => (from[i]?.[k] ?? v) + (v - (from[i]?.[k] ?? v)) * e)));
        if (t >= 1) morphStart = 0;
      }
      if (visible && !reduce) {
        if (now >= nextCycle) planCycle(now);
        queue = queue.filter((q) => {
          if (q.at > now) return true;
          if (!offRef.current.has(q.beam) && pulseStart[q.beam] === null) pulseStart[q.beam] = q.at;
          return false;
        });
        for (let i = 0; i < n; i++) {
          const start = pulseStart[i];
          if (start === null) continue;
          if (offRef.current.has(i)) {
            hide(i);
            continue;
          }
          const t = (now - start) / TRAVEL;
          if (t >= 1) {
            hide(i);
            ring(i < nLeft ? centerRingRef.current : ringRefs.current[i]);
            continue;
          }
          paint(i, t);
        }
        const isSyncing = now >= syncFrom && now < syncTo;
        if (isSyncing !== wasSyncing) {
          wasSyncing = isSyncing;
          setSyncing(isSyncing);
        }
      }
      if (morphStart || (visible && !reduce)) raf = requestAnimationFrame(frame);
    };
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(frame);
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(root);

    const io =
      typeof IntersectionObserver === "undefined"
        ? null
        : new IntersectionObserver(([e]) => {
            visible = e.isIntersecting;
            if (visible) {
              nextCycle = performance.now() + 400;
              kick();
            } else {
              queue = [];
              for (let i = 0; i < n; i++) hide(i);
              syncTo = 0;
              if (wasSyncing) setSyncing((wasSyncing = false));
            }
          });
    io?.observe(root);

    return () => {
      ro.disconnect();
      io?.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [n, nLeft]);

  useIsoLayoutEffect(() => {
    const chip = chipRef.current;
    const inner = chipInnerRef.current;
    if (chip && inner) chip.style.width = `${inner.offsetWidth}px`;
  }, [status]);

  useEffect(() => () => window.clearTimeout(flashTimer.current), []);

  const toggle = (i: number) => {
    const pausing = !off.has(i);
    const next = new Set(off);
    if (pausing) next.add(i);
    else next.delete(i);
    setOff(next);
    setAnnounce(
      isAmharic
        ? `${tools[i].name} ${pausing ? "ተቋርጧል" : "ተገናኝቷል"}። ${n - next.size} ከ ${n} ተገናኝተዋል።`
        : `${tools[i].name} ${pausing ? "paused" : "connected"}. ${n - next.size} of ${n} connected.`,
    );
    setFlash(i);
    window.clearTimeout(flashTimer.current);
    flashTimer.current = window.setTimeout(() => setFlash(null), FLASH);
  };

  const onEnter = (i: number) => (e: PointerEvent) => {
    if (e.pointerType === "mouse") setFocus(i);
  };
  const onFocus = (i: number) => (e: FocusEvent<HTMLButtonElement>) => {
    if (e.currentTarget.matches(":focus-visible")) setFocus(i);
  };

  const tile = (t: BeamTool, i: number) => (
    <button
      key={i}
      ref={(el) => {
        toolRefs.current[i] = el;
      }}
      type="button"
      className="ui-ib__tool group cursor-pointer"
      aria-pressed={!off.has(i)}
      aria-label={`${t.name}, ${
        off.has(i)
          ? isAmharic
            ? "ቆሟል"
            : "paused"
          : isAmharic
          ? "ተገናኝቷል"
          : "connected"
      }`}
      data-off={off.has(i) || undefined}
      data-tip={focus === i || flash === i || undefined}
      onClick={() => toggle(i)}
      onPointerEnter={onEnter(i)}
      onPointerLeave={() => setFocus(null)}
      onFocus={onFocus(i)}
      onBlur={() => setFocus(null)}
    >
      <span
        className="ui-ib__ring"
        ref={(el) => {
          ringRefs.current[i] = el;
        }}
      />
      <span className="ui-ib__logo" aria-hidden="true">
        {t.logo}
      </span>
      <span className="ui-ib__tip shadow-md" aria-hidden="true">
        <span className="font-semibold">{t.name}</span>
        {t.subtitle && (
          <span className="block text-[10.5px] opacity-75 font-normal">{t.subtitle}</span>
        )}
        {off.has(i) && (
          <span className="ui-ib__tip-state text-[#981C00] dark:text-[#E89382]">
            {" "}
            · {isAmharic ? "ቆሟል" : "Paused"}
          </span>
        )}
      </span>
    </button>
  );

  return (
    <div
      ref={rootRef}
      className={["ui-ib", className].filter(Boolean).join(" ")}
      role="group"
      aria-label={label ?? `${effectiveCenter.name} connected to ${tools.map((t) => t.name).join(", ")}`}
      data-focus={focus !== null || undefined}
    >
      <style href="ui-integration-beam" precedence="default">
        {css}
      </style>

      <svg ref={svgRef} className="ui-ib__beams" aria-hidden="true">
        <defs>
          <filter id={`${uid}-blur`} filterUnits="userSpaceOnUse" x="-100" y="-100" width="10000" height="10000">
            <feGaussianBlur stdDeviation="3.5" />
          </filter>
          {tools.map((_, i) => (
            <linearGradient
              key={i}
              id={`${uid}-g${i}`}
              gradientUnits="userSpaceOnUse"
              ref={(el) => {
                gradRefs.current[i] = el;
              }}
            >
              <stop offset="0" className="ui-ib__stop-tail" />
              <stop offset="0.6" className="ui-ib__stop-mid" />
              <stop offset="1" className="ui-ib__stop-head" />
            </linearGradient>
          ))}
        </defs>
        {tools.map((_, i) => (
          <path
            key={i}
            className="ui-ib__line"
            data-off={off.has(i) || undefined}
            data-focus={focus === i || undefined}
            ref={(el) => {
              lineRefs.current[i] = el;
            }}
          />
        ))}
        {tools.map((_, i) => (
          <g
            key={i}
            className="ui-ib__pulse"
            data-focus={focus === i || undefined}
            ref={(el) => {
              pulseRefs.current[i] = el;
            }}
          >
            <path className="ui-ib__glow" stroke={`url(#${uid}-g${i})`} filter={`url(#${uid}-blur)`} />
            <path className="ui-ib__core" stroke={`url(#${uid}-g${i})`} />
          </g>
        ))}
      </svg>

      <div ref={sceneRef} className="ui-ib__scene">
        {/* Left Inputs (Payment & Verification) */}
        <div className="ui-ib__group ui-ib__group--in">
          {effectiveLeft.map((t, i) => tile(t, i))}
        </div>

        {/* Center Hub (Nazazi Engine) */}
        <div
          ref={centerRef}
          className="ui-ib__center"
          data-syncing={(syncing && connected > 0) || undefined}
        >
          <span className="ui-ib__ring ui-ib__ring--center" ref={centerRingRef} />
          <span className="ui-ib__mark" aria-hidden="true">
            {effectiveCenter.logo}
          </span>
          <span ref={chipRef} className="ui-ib__chip">
            <span ref={chipInnerRef} className="ui-ib__chip-inner">
              <span className="ui-ib__dot" data-idle={connected === 0 || undefined} />
              <span className="ui-ib__status" key={status}>
                {status}
              </span>
            </span>
          </span>
        </div>

        {/* Right Outputs (Daily Blessings & Deliveries) */}
        <div className="ui-ib__group ui-ib__group--out">
          {effectiveRight.map((t, i) => tile(t, nLeft + i))}
        </div>
      </div>

      <span className="ui-ib__sr" aria-live="polite">
        {announce}
      </span>
    </div>
  );
}

/* ---------- Nazazi Theme Styles ---------- */

const css = /* css */ `
.ui-ib {
  --ui-ib-ink: #24211F;
  --ui-ib-text: #5A534E;
  --ui-ib-muted: #8A8179;
  --ui-ib-faint: #D8D2C9;
  --ui-ib-line: #E8E3DC;
  --ui-ib-line-hi: #C43214;
  --ui-ib-card: #FFFFFF;
  --ui-ib-tray: #F7F4EF;
  --ui-ib-accent: #981C00;
  /* Nazazi Pulse: terracotta to warm golden amber tip */
  --ui-ib-pulse: #981C00;
  --ui-ib-tip-color: #F59E0B;
  --ui-ib-ring: rgba(152, 28, 0, 0.28);
  --ui-ib-glow: rgba(196, 50, 20, 0.38);
  --ui-ib-hub: #1C1917;
  --ui-ib-hub-mark: #FAF8F5;
  --ui-ib-hub-edge: rgba(152, 28, 0, 0.35);
  --ui-ib-tooltip: #1C1917;
  --ui-ib-tooltip-text: #FAF8F5;
  --ui-ib-shadow: 0 0 0 1px rgba(0, 0, 0, 0.06), 0 2px 4px rgba(0, 0, 0, 0.03), 0 12px 24px -10px rgba(0, 0, 0, 0.12);
  --ui-ib-focus: rgba(152, 28, 0, 0.35);
  --ui-ib-ease: ${EASE};
  position: relative;
  width: 100%;
  container-type: inline-size;
  font-family: inherit;
  font-size: 13px;
  color: var(--ui-ib-text);
  -webkit-tap-highlight-color: transparent;
}
.ui-ib *, .ui-ib *::before, .ui-ib *::after { box-sizing: border-box; }

/* ---------- Beams ---------- */

.ui-ib__beams {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
  pointer-events: none;
}
.ui-ib__line {
  fill: none;
  stroke: var(--ui-ib-line);
  stroke-width: 1.75;
  stroke-linecap: round;
  transition: stroke 300ms var(--ui-ib-ease), opacity 300ms var(--ui-ib-ease);
}
.ui-ib__line[data-off] { stroke: var(--ui-ib-faint); stroke-dasharray: 3 6; opacity: 0.65; }
.ui-ib[data-focus] .ui-ib__line:not([data-focus]) { opacity: 0.3; }
.ui-ib__line[data-focus]:not([data-off]) { stroke: var(--ui-ib-line-hi); }

.ui-ib__pulse { opacity: 0; transition: opacity 240ms ease; }
.ui-ib__pulse path { fill: none; stroke-linecap: round; transition: opacity 300ms var(--ui-ib-ease); }
.ui-ib__core { stroke-width: 2.5; }
.ui-ib__glow { stroke-width: 7; opacity: 0.55; }
.ui-ib[data-focus] .ui-ib__pulse:not([data-focus]) path { opacity: 0.2; }
.ui-ib__pulse[data-focus] .ui-ib__glow { opacity: 0.8; }
.ui-ib__stop-tail { stop-color: var(--ui-ib-pulse); stop-opacity: 0; }
.ui-ib__stop-mid { stop-color: var(--ui-ib-pulse); stop-opacity: 0.95; }
.ui-ib__stop-head { stop-color: var(--ui-ib-tip-color); stop-opacity: 1; }

/* ---------- Layout ---------- */

.ui-ib__scene {
  --ui-ib-stack: 0;
  display: grid;
  grid-template-columns: auto minmax(40px, 1fr) auto minmax(40px, 1fr) auto;
  grid-template-areas: "in . hub . out";
  align-items: center;
  padding: 12px 0 28px;
}
.ui-ib__group { display: flex; flex-direction: column; gap: 28px; }
.ui-ib__group--in { grid-area: in; }
.ui-ib__group--out { grid-area: out; }

/* ---------- Tools ---------- */

.ui-ib__tool {
  position: relative;
  display: grid;
  place-items: center;
  width: 62px;
  height: 62px;
  padding: 0;
  border: 0;
  border-radius: 20px;
  background: var(--ui-ib-card);
  box-shadow: var(--ui-ib-shadow);
  color: var(--ui-ib-ink);
  font: inherit;
  cursor: pointer;
  transition: background-color 300ms var(--ui-ib-ease), box-shadow 300ms var(--ui-ib-ease), transform 300ms var(--ui-ib-ease);
}
.ui-ib__tool:focus-visible { outline: 2px solid var(--ui-ib-focus); outline-offset: 3px; }
.ui-ib__logo {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  transition: transform 300ms var(--ui-ib-ease), filter 300ms var(--ui-ib-ease), opacity 300ms var(--ui-ib-ease);
}
.ui-ib__logo > svg { width: 100%; height: 100%; }
@media (hover: hover) {
  .ui-ib__tool:hover { transform: translateY(-2px); box-shadow: 0 16px 32px -10px rgba(152, 28, 0, 0.15), var(--ui-ib-shadow); }
  .ui-ib__tool:hover .ui-ib__logo { transform: scale(1.08); }
}
.ui-ib__tool[data-off] { background: var(--ui-ib-tray); transform: none; }
.ui-ib__tool[data-off] .ui-ib__logo { filter: grayscale(1); opacity: 0.35; }

/* Arrival glow */
.ui-ib__ring {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  box-shadow: 0 0 0 3px var(--ui-ib-ring), 0 0 24px 3px var(--ui-ib-glow);
  opacity: 0;
  pointer-events: none;
}

/* Tooltips */
.ui-ib__tip {
  --ui-ib-tip-from: translate(-4px, -50%);
  position: absolute;
  z-index: 30;
  top: 50%;
  left: calc(100% + 12px);
  padding: 6px 11px;
  border-radius: 10px;
  background: var(--ui-ib-tooltip);
  color: var(--ui-ib-tooltip-text);
  font-size: 12px;
  font-weight: 500;
  line-height: 16px;
  white-space: nowrap;
  pointer-events: none;
  opacity: 0;
  transform: var(--ui-ib-tip-from);
  transition: opacity 180ms ease, transform 260ms var(--ui-ib-ease);
}
.ui-ib__group--out .ui-ib__tip { --ui-ib-tip-from: translate(4px, -50%); left: auto; right: calc(100% + 12px); }
.ui-ib__tip-state { opacity: 0.7; font-weight: 500; }
.ui-ib__tool[data-tip] .ui-ib__tip { opacity: 1; transform: translate(0, -50%); }

/* ---------- Center Hub ---------- */

.ui-ib__center {
  grid-area: hub;
  position: relative;
  display: grid;
  place-items: center;
  width: 86px;
  height: 86px;
  border-radius: 26px;
  background: var(--ui-ib-hub);
  box-shadow: 0 0 0 1px var(--ui-ib-hub-edge), inset 0 1px 0 rgba(255, 255, 255, 0.15), 0 16px 36px -12px rgba(152, 28, 0, 0.45);
  color: var(--ui-ib-hub-mark);
}
.ui-ib__mark { display: grid; place-items: center; width: 44px; height: 44px; }
.ui-ib__ring--center { inset: -1px; }

/* Status chip */
.ui-ib__chip {
  position: absolute;
  top: calc(100% + 14px);
  left: 50%;
  translate: -50% 0;
  display: block;
  height: 28px;
  overflow: hidden;
  border-radius: 999px;
  background: var(--ui-ib-card);
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.05);
  transition: width 320ms var(--ui-ib-ease);
}
.ui-ib__chip-inner {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  width: max-content;
  height: 28px;
  padding: 0 12px 0 10px;
  font-size: 12px;
  font-weight: 600;
  color: var(--ui-ib-text);
  white-space: nowrap;
}
.ui-ib__status { display: inline-block; animation: ui-ib-in 320ms var(--ui-ib-ease) both; }
.ui-ib__dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--ui-ib-accent);
  transition: background-color 300ms ease;
}
.ui-ib__dot[data-idle] { background: var(--ui-ib-faint); }
.ui-ib__center[data-syncing] .ui-ib__dot { animation: ui-ib-breathe 1.1s ease-in-out infinite; }

.ui-ib__sr {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}

@keyframes ui-ib-in { from { opacity: 0; transform: translateY(6px); filter: blur(2px); } to { opacity: 1; transform: none; filter: none; } }
@keyframes ui-ib-breathe { 50% { box-shadow: 0 0 0 4px var(--ui-ib-ring); } }

/* Narrow / Mobile: Senders above, hub in center, receivers below */
@container (max-width: 520px) {
  .ui-ib__scene {
    --ui-ib-stack: 1;
    grid-template-columns: 1fr;
    grid-template-areas: "in" "hub" "out";
    justify-items: center;
    row-gap: 86px;
    padding: 0 0 8px;
  }
  .ui-ib__group { flex-direction: row; gap: clamp(14px, 7cqw, 34px); }
  .ui-ib__tool { width: 56px; height: 56px; border-radius: 17px; }
  .ui-ib__center { width: 78px; height: 78px; border-radius: 24px; }
  .ui-ib__tip,
  .ui-ib__group--out .ui-ib__tip {
    --ui-ib-tip-from: translate(-50%, -4px);
    top: calc(100% + 8px);
    right: auto;
    left: 50%;
  }
  .ui-ib__group--out .ui-ib__tip { --ui-ib-tip-from: translate(-50%, 4px); top: auto; bottom: calc(100% + 8px); }
  .ui-ib__tool[data-tip] .ui-ib__tip { transform: translate(-50%, 0); }
  .ui-ib__tool:first-child .ui-ib__tip { left: 0; translate: 50% 0; }
  .ui-ib__tool:last-child .ui-ib__tip { left: 100%; translate: -50% 0; }
}

@media (prefers-reduced-motion: reduce) {
  .ui-ib__line, .ui-ib__tool, .ui-ib__logo, .ui-ib__tip, .ui-ib__chip, .ui-ib__dot { transition: none; }
  .ui-ib__status, .ui-ib__center[data-syncing] .ui-ib__dot { animation: none; }
}

/* Dark mode */
:where(.dark, [data-theme="dark"]) .ui-ib {
  --ui-ib-ink: #FAF8F5;
  --ui-ib-text: #D5CFC9;
  --ui-ib-muted: #8E867E;
  --ui-ib-faint: #423C36;
  --ui-ib-line: #332E2A;
  --ui-ib-line-hi: #E89382;
  --ui-ib-card: #211D1A;
  --ui-ib-tray: #171513;
  --ui-ib-accent: #C43214;
  --ui-ib-pulse: #E89382;
  --ui-ib-tip-color: #FDE68A;
  --ui-ib-ring: rgba(196, 50, 20, 0.35);
  --ui-ib-glow: rgba(232, 147, 130, 0.4);
  --ui-ib-hub: #2A1D1A;
  --ui-ib-hub-mark: #FAF8F5;
  --ui-ib-hub-edge: rgba(196, 50, 20, 0.3);
  --ui-ib-tooltip: #FAF8F5;
  --ui-ib-tooltip-text: #1C1917;
  --ui-ib-shadow: 0 0 0 1px rgba(255, 255, 255, 0.08), 0 2px 4px rgba(0, 0, 0, 0.4), 0 14px 28px -10px rgba(0, 0, 0, 0.6);
  --ui-ib-focus: rgba(196, 50, 20, 0.5);
}
:where(.dark, [data-theme="dark"]) .ui-ib__chip {
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.1), 0 2px 4px rgba(0, 0, 0, 0.4);
}
`;
