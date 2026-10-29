"use client";

import { useId, useLayoutEffect, useEffect, useRef, useState, type KeyboardEvent, type RefObject } from "react";

/*
 * Filter Menu – grouped filters with chips, customized for Nazazi design system.
 * Active filters sit on top as removable chips; below, collapsible groups list their options as checkboxes
 * with a count of what's picked. Arrow keys move through groups and options, Enter or Space picks,
 * ← and → fold a group. Heights glide when groups open or chips come and go.
 * Tailored with Nazazi brand burgundy, warm paper backgrounds, and crisp radius styling.
 */

const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

export type FilterOption = { id: string; label: string };

export type FilterGroup = {
  id: string;
  label: string;
  options: FilterOption[];
  /** Put in front of the option on its chip, e.g. "Status: " → "Status: Approved" */
  chipPrefix?: string;
};

/** Picked option ids per group id */
export type FilterValue = Record<string, string[]>;

export type FilterMenuProps = {
  groups: FilterGroup[];
  /** Controlled value */
  value?: FilterValue;
  /** Starting value when uncontrolled */
  defaultValue?: FilterValue;
  onChange?: (value: FilterValue) => void;
  /** Groups that start open – by default the first one */
  defaultOpen?: string[];
  title?: string;
  /** Show the keyboard hints at the bottom */
  hints?: boolean;
  className?: string;
};

type Row =
  | { kind: "group"; group: FilterGroup; gi: number }
  | { kind: "option"; group: FilterGroup; option: FilterOption; gi: number; oi: number };

export function FilterMenu({
  groups: rawGroups,
  value,
  defaultValue = {},
  onChange,
  defaultOpen,
  title = "Filters",
  hints = true,
  className,
}: FilterMenuProps) {
  // Gaps, groups without an options list and options without a label are skipped; ids stay as given
  const groups = (Array.isArray(rawGroups) ? rawGroups : [])
    .filter((g): g is FilterGroup => !!g && typeof g === "object")
    .map((g) => ({
      ...g,
      label: String(g.label ?? ""),
      options: (Array.isArray(g.options) ? g.options : [])
        .filter((o): o is FilterOption => !!o && typeof o === "object")
        .map((o) => ({ ...o, label: String(o.label ?? "") })),
    }));

  const uid = useId();
  const [inner, setInner] = useState<FilterValue>(defaultValue);
  const picked = value ?? inner;
  const [open, setOpen] = useState<Set<string>>(() => new Set(defaultOpen ?? groups.slice(0, 1).map((g) => g.id)));
  const [focus, setFocus] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const chipsInner = useRef<HTMLDivElement>(null);
  const chipsOuter = useSmoothHeight(chipsInner);

  const commit = (next: FilterValue) => {
    if (value === undefined) setInner(next);
    onChange?.(next);
  };

  // Only lists count – a string or a stray value in `value` picks nothing
  const pickedIn = (g: string) => (Array.isArray(picked[g]) ? picked[g] : []);
  const isOn = (g: string, o: string) => pickedIn(g).includes(o);
  const toggle = (g: string, o: string) => {
    const cur = pickedIn(g);
    commit({ ...picked, [g]: cur.includes(o) ? cur.filter((x) => x !== o) : [...cur, o] });
  };
  const toggleGroup = (g: string) =>
    setOpen((s) => {
      const next = new Set(s);
      if (next.has(g)) next.delete(g);
      else next.add(g);
      return next;
    });

  // Chips in the order of the groups and their options – one per picked id, even if an id repeats
  const seen = new Set<string>();
  const chips = groups.flatMap((g) =>
    g.options
      .filter((o) => isOn(g.id, o.id) && !seen.has(`${g.id}\u0000${o.id}`) && !!seen.add(`${g.id}\u0000${o.id}`))
      .map((o) => ({ group: g, option: o, label: `${g.chipPrefix ?? ""}${o.label}` })),
  );

  // Everything the arrow keys can reach, top to bottom
  const rows: Row[] = groups.flatMap((g, gi) => [
    { kind: "group", group: g, gi } as Row,
    ...(open.has(g.id) ? g.options.map((o, oi) => ({ kind: "option", group: g, option: o, gi, oi }) as Row) : []),
  ]);
  const keyOf = (r: Row) => (r.kind === "group" ? `g:${r.gi}` : `o:${r.gi}:${r.oi}`);

  const moveTo = (key: string) => {
    setFocus(key);
    listRef.current?.querySelector<HTMLElement>(`[data-key="${CSS.escape(key)}"]`)?.focus();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const i = rows.findIndex((r) => keyOf(r) === focus);
    const row = rows[i];
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const next = rows[Math.max(0, Math.min(rows.length - 1, i + (e.key === "ArrowDown" ? 1 : -1)))] ?? rows[0];
      moveTo(keyOf(next));
    } else if (e.key === "Home" || e.key === "End") {
      e.preventDefault();
      moveTo(keyOf(rows[e.key === "Home" ? 0 : rows.length - 1]));
    } else if (row && (e.key === "ArrowRight" || e.key === "ArrowLeft")) {
      e.preventDefault();
      const g = row.group.id;
      if (e.key === "ArrowRight" && !open.has(g)) toggleGroup(g);
      if (e.key === "ArrowLeft") {
        if (open.has(g)) toggleGroup(g);
        moveTo(`g:${row.gi}`);
      }
    } else if (row && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      if (row.kind === "group") toggleGroup(row.group.id);
      else toggle(row.group.id, row.option.id);
    }
  };

  return (
    <div className={["ui-fm", className].filter(Boolean).join(" ")}>
      <style href="ui-filter-menu" precedence="default">
        {css}
      </style>

      <div className="ui-fm__card">
        <div className="ui-fm__head">
          <span className="ui-fm__title" dir="auto" title={title}>
            {title}
          </span>
          <button type="button" className="ui-fm__clear" disabled={chips.length === 0} onClick={() => commit({})}>
            Clear all
          </button>
        </div>

        {/* Active filters – the box glides to its new height as chips come and go */}
        <div className="ui-fm__chips-outer" ref={chipsOuter}>
          <div className="ui-fm__chips" ref={chipsInner} aria-live="polite">
            {chips.map((c, i) => (
              <span key={i} className="ui-fm__chip">
                <span className="ui-fm__chip-label" dir="auto" title={c.label}>
                  {c.label}
                </span>
                <button type="button" aria-label={`Remove ${c.label}`} onClick={() => toggle(c.group.id, c.option.id)}>
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" />
                  </svg>
                </button>
              </span>
            ))}
          </div>
        </div>

        <div className="ui-fm__groups" ref={listRef} onKeyDown={onKeyDown}>
          {groups.map((g, gi) => {
            const isOpen = open.has(g.id);
            const count = new Set(pickedIn(g.id).filter((id) => g.options.some((o) => o.id === id))).size;
            const gKey = `g:${gi}`;
            return (
              <section key={`${g.id}#${gi}`} className="ui-fm__group" data-open={isOpen ? "" : undefined}>
                <button
                  type="button"
                  className="ui-fm__group-head"
                  data-key={gKey}
                  tabIndex={focus === gKey || (focus === null && gi === 0) ? 0 : -1}
                  aria-expanded={isOpen}
                  aria-controls={`${uid}-${gi}`}
                  onFocus={() => setFocus(gKey)}
                  onClick={() => toggleGroup(g.id)}
                >
                  <svg className="ui-fm__chevron" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M6.5 9.5 12 15l5.5-5.5" />
                  </svg>
                  <span className="ui-fm__group-label" dir="auto" title={g.label}>
                    {g.label}
                  </span>
                  <span className="ui-fm__group-count">{g.options.length.toLocaleString("en-US")}</span>
                  <span className="ui-fm__group-picked" aria-live="polite">
                    {count > 0 ? `${count} filter${count === 1 ? "" : "s"}` : ""}
                  </span>
                </button>
                {/* Opens and closes by animating its grid row from 0 to the content height */}
                <div className="ui-fm__panel" id={`${uid}-${gi}`} role="group" aria-label={g.label}>
                  <div className="ui-fm__panel-inner">
                    {g.options.map((o, oi) => {
                      const key = `o:${gi}:${oi}`;
                      const on = isOn(g.id, o.id);
                      return (
                        <button
                          key={`${o.id}#${oi}`}
                          type="button"
                          role="checkbox"
                          aria-checked={on}
                          className="ui-fm__option"
                          data-key={key}
                          tabIndex={isOpen && focus === key ? 0 : -1}
                          onFocus={() => setFocus(key)}
                          onClick={() => toggle(g.id, o.id)}
                        >
                          <span className="ui-fm__box" aria-hidden="true">
                            <svg viewBox="0 0 24 24">
                              <path d="m6 12.5 4 4 8-9" />
                            </svg>
                          </span>
                          <span className="ui-fm__option-label" dir="auto" title={o.label}>
                            {o.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </section>
            );
          })}
        </div>
      </div>

      {hints && (
        <div className="ui-fm__hints" aria-hidden="true">
          <span className="ui-fm__hint">
            <kbd>
              <svg viewBox="0 0 24 24">
                <path d="M12 5v14m0 0-5-5m5 5 5-5" />
              </svg>
            </kbd>
            <kbd>
              <svg viewBox="0 0 24 24">
                <path d="M12 19V5m0 0-5 5m5-5 5 5" />
              </svg>
            </kbd>
            To navigate
          </span>
          <span className="ui-fm__hint">
            <kbd>
              <svg viewBox="0 0 24 24">
                <path d="M18 6v6.5a2 2 0 0 1-2 2H7m0 0 3.5-3.5M7 14.5 10.5 18" />
              </svg>
            </kbd>
            To select
          </span>
        </div>
      )}
    </div>
  );
}

/** The outer box follows the inner box's height, with a transition after the first frame */
function useSmoothHeight(inner: RefObject<HTMLElement | null>) {
  const outer = useRef<HTMLDivElement>(null);
  useIsomorphicLayoutEffect(() => {
    const o = outer.current;
    const i = inner.current;
    if (!o || !i) return;
    const sync = () => {
      o.style.height = `${i.offsetHeight}px`;
    };
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(i);
    const frame = requestAnimationFrame(() => o.setAttribute("data-smooth", ""));
    return () => {
      ro.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [inner]);
  return outer;
}

/* ---------- Nazazi Design System Styles ---------- */

const css = /* css */ `
.ui-fm {
  --ui-fm-tray: #F3EFEA;
  --ui-fm-card: #FFFFFF;
  --ui-fm-card-line: #E8E4DF;
  --ui-fm-ink: #24211F;
  --ui-fm-text: #544E49;
  --ui-fm-muted: #8F8781;
  --ui-fm-chip: #FAF4F2;
  --ui-fm-chip-hover: #F3E6E2;
  --ui-fm-chip-text: #981C00;
  --ui-fm-chip-border: #E8DCD9;
  --ui-fm-box: #FAF8F5;
  --ui-fm-box-line: #DDD7CF;
  --ui-fm-check: #FFFFFF;
  --ui-fm-check-bg: #981C00;
  --ui-fm-row-hover: #FAF8F5;
  --ui-fm-kbd: #FFFFFF;
  --ui-fm-focus: #981C00;
  --ui-fm-shadow: 0 1px 3px rgba(36, 33, 31, 0.06), 0 1px 2px rgba(36, 33, 31, 0.04);
  --ui-fm-ease: cubic-bezier(0.22, 1, 0.36, 1);
  --ui-fm-radius-tray: 15px;
  --ui-fm-radius-card: 15px;
  --ui-fm-radius-chip: 15px;
  --ui-fm-radius-box: 6px;

  width: 100%;
  max-width: 420px;
  padding: 6px;
  border-radius: var(--ui-fm-radius-tray);
  background: var(--ui-fm-tray);
  border: 1px solid var(--ui-fm-card-line);
  font-family: var(--font-sans, "Stack Sans Headline", system-ui, -apple-system, sans-serif);
  color: var(--ui-fm-ink);
  -webkit-font-smoothing: antialiased;
}
.ui-fm *, .ui-fm *::before, .ui-fm *::after { box-sizing: border-box; }
.ui-fm button { font: inherit; color: inherit; margin: 0; cursor: pointer; -webkit-tap-highlight-color: transparent; }
.ui-fm button:focus-visible { outline: 2px solid var(--ui-fm-focus); outline-offset: 2px; }

.ui-fm__card {
  padding: 14px 14px 10px;
  border: 1px solid var(--ui-fm-card-line);
  border-radius: var(--ui-fm-radius-card);
  background: var(--ui-fm-card);
  box-shadow: var(--ui-fm-shadow);
}

/* ---------- Header ---------- */

.ui-fm__head { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 0 2px; }
.ui-fm__title {
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  text-align: start;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: -0.01em;
  color: var(--ui-fm-ink);
}
.ui-fm__clear {
  flex: none;
  padding: 4px 8px;
  margin-right: -4px !important;
  border: 0;
  border-radius: 4px;
  background: none;
  font-size: 12px;
  font-weight: 600;
  color: var(--ui-fm-muted) !important;
  transition: color 160ms ease, background-color 160ms ease, opacity 200ms ease;
}
.ui-fm__clear:hover:not(:disabled) {
  color: var(--ui-fm-check-bg) !important;
  background: var(--ui-fm-chip);
}
.ui-fm__clear:disabled { opacity: 0.45; cursor: default; }

/* ---------- Chips ---------- */

.ui-fm__chips-outer { overflow: hidden; }
.ui-fm__chips-outer[data-smooth] { transition: height 320ms var(--ui-fm-ease); }
.ui-fm__chips { display: flex; flex-wrap: wrap; gap: 6px; padding-top: 10px; }
.ui-fm__chips:empty { padding-top: 0; }
.ui-fm__chip {
  display: inline-flex;
  min-width: 0;
  max-width: 100%;
  align-items: center;
  gap: 3px;
  height: 28px;
  padding: 0 4px 0 9px;
  border-radius: var(--ui-fm-radius-chip);
  background: var(--ui-fm-chip);
  border: 1px solid var(--ui-fm-chip-border);
  font-size: 12px;
  font-weight: 600;
  color: var(--ui-fm-chip-text);
  white-space: nowrap;
  animation: ui-fm-chip-in 260ms var(--ui-fm-ease) both;
}
.ui-fm__chip-label { min-width: 0; overflow: hidden; text-overflow: ellipsis; }
.ui-fm__chip button {
  display: grid;
  flex: none;
  place-items: center;
  width: 20px;
  height: 20px;
  padding: 0;
  border: 0;
  border-radius: 4px;
  background: none;
  color: var(--ui-fm-muted);
  transition: background-color 160ms ease, color 160ms ease;
}
.ui-fm__chip button:hover { background: var(--ui-fm-chip-hover); color: var(--ui-fm-check-bg); }
.ui-fm__chip svg { width: 13px; height: 13px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; }

/* ---------- Groups ---------- */

.ui-fm__groups { display: grid; grid-template-columns: minmax(0, 1fr); padding-top: 4px; }
.ui-fm__group-head {
  display: flex;
  align-items: center;
  gap: 7px;
  width: calc(100% + 12px);
  height: 36px;
  margin: 2px -6px 0 !important;
  padding: 0 8px 0 6px;
  border: 0;
  border-radius: 5px;
  background: none;
  text-align: left;
  transition: background-color 160ms ease;
}
.ui-fm__group-head:hover { background: var(--ui-fm-row-hover); }
.ui-fm__chevron {
  width: 15px;
  height: 15px;
  flex: none;
  fill: none;
  stroke: var(--ui-fm-text);
  stroke-width: 1.9;
  stroke-linecap: round;
  stroke-linejoin: round;
  transform: rotate(-90deg);
  transition: transform 260ms var(--ui-fm-ease);
}
.ui-fm__group[data-open] .ui-fm__chevron { transform: none; stroke: var(--ui-fm-check-bg); }
.ui-fm__group-label {
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  text-align: start;
  font-size: 13.5px;
  font-weight: 600;
  color: var(--ui-fm-ink);
}
.ui-fm__group-count { flex: none; font-size: 11.5px; color: var(--ui-fm-muted); font-variant-numeric: tabular-nums; font-family: monospace; }
.ui-fm__group-picked { flex: none; margin-left: auto; white-space: nowrap; font-size: 11.5px; font-weight: 600; color: var(--ui-fm-check-bg); }

.ui-fm__panel {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 320ms var(--ui-fm-ease);
}
.ui-fm__group[data-open] .ui-fm__panel { grid-template-rows: 1fr; }
.ui-fm__panel-inner {
  min-height: 0;
  overflow: hidden;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 1px;
  padding: 0;
  opacity: 0;
  transition: opacity 220ms ease, padding 320ms var(--ui-fm-ease);
}
.ui-fm__group[data-open] .ui-fm__panel-inner { opacity: 1; padding: 2px 0 6px; }
.ui-fm__group[data-open] .ui-fm__panel-inner { max-height: 320px; overflow-x: hidden; overflow-y: auto; overscroll-behavior: contain; }

.ui-fm__option {
  display: flex;
  align-items: center;
  gap: 10px;
  width: calc(100% + 12px);
  height: 33px;
  margin: 0 -6px !important;
  padding: 0 8px;
  border: 0;
  border-radius: 5px;
  background: none;
  font-size: 13px;
  color: var(--ui-fm-text) !important;
  text-align: left;
  transition: background-color 160ms ease;
}
.ui-fm__option-label { min-width: 0; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; text-align: start; }
.ui-fm__option:hover { background: var(--ui-fm-row-hover); color: var(--ui-fm-ink) !important; }
.ui-fm__option:focus-visible { outline-offset: -2px; }
.ui-fm__box {
  display: grid;
  place-items: center;
  width: 18px;
  height: 18px;
  flex: none;
  border-radius: var(--ui-fm-radius-box);
  background: var(--ui-fm-box);
  box-shadow: inset 0 0 0 1px var(--ui-fm-box-line);
  transition: background-color 180ms ease, box-shadow 180ms ease;
}
.ui-fm__box svg {
  width: 13px;
  height: 13px;
  fill: none;
  stroke: var(--ui-fm-check);
  stroke-width: 2.2;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-dasharray: 20;
  stroke-dashoffset: 20;
  transition: stroke-dashoffset 260ms var(--ui-fm-ease);
}
.ui-fm__option[aria-checked="true"] .ui-fm__box {
  background: var(--ui-fm-check-bg);
  box-shadow: inset 0 0 0 1px var(--ui-fm-check-bg);
}
.ui-fm__option[aria-checked="true"] .ui-fm__box svg { stroke-dashoffset: 0; }
.ui-fm__option[aria-checked="true"] .ui-fm__option-label {
  font-weight: 600;
  color: var(--ui-fm-ink);
}

/* ---------- Keyboard hints on the tray ---------- */

.ui-fm__hints { display: flex; justify-content: space-between; gap: 12px; padding: 8px 8px 3px; border-top: 1px solid var(--ui-fm-card-line); margin-top: 4px; }
.ui-fm__hint { display: inline-flex; align-items: center; gap: 5px; font-size: 11px; color: var(--ui-fm-muted); }
.ui-fm__hint kbd {
  display: grid;
  place-items: center;
  width: 20px;
  height: 20px;
  border-radius: 4px;
  background: var(--ui-fm-kbd);
  color: var(--ui-fm-text);
  border: 1px solid var(--ui-fm-card-line);
  box-shadow: 0 1px 1px rgba(0, 0, 0, 0.04);
}
.ui-fm__hint kbd:last-of-type { margin-right: 3px; }
.ui-fm__hint svg { width: 12px; height: 12px; fill: none; stroke: var(--ui-fm-text); stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }

@keyframes ui-fm-chip-in { from { opacity: 0; transform: scale(0.92); } }

@media (prefers-reduced-motion: reduce) {
  .ui-fm__chips-outer[data-smooth], .ui-fm__panel, .ui-fm__panel-inner, .ui-fm__chevron, .ui-fm__box svg { transition: none; }
  .ui-fm__chip { animation: none; }
}

/* Dark mode: follows .dark or [data-theme="dark"] on ancestor */
:where(.dark, [data-theme="dark"]) .ui-fm {
  --ui-fm-tray: #141211;
  --ui-fm-card: #1D1A18;
  --ui-fm-card-line: #2C2825;
  --ui-fm-ink: #FAF8F5;
  --ui-fm-text: #C4BCB5;
  --ui-fm-muted: #807973;
  --ui-fm-chip: #2A1D1A;
  --ui-fm-chip-hover: #3A2420;
  --ui-fm-chip-text: #E89382;
  --ui-fm-chip-border: #3A2420;
  --ui-fm-box: #24201E;
  --ui-fm-box-line: #38322E;
  --ui-fm-check: #FFFFFF;
  --ui-fm-check-bg: #C43214;
  --ui-fm-row-hover: rgba(255, 255, 255, 0.04);
  --ui-fm-kbd: #24201E;
  --ui-fm-focus: #C43214;
  --ui-fm-shadow: 0 4px 14px rgba(0, 0, 0, 0.4);
}
`;
