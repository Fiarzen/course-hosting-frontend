// src/components/Leaf.jsx
// Shared visual primitives for the mindleaf design system.
// Drop-in components that render the leaf glyph, leaf rows, and the
// vertical "growing stem" progress metaphor.

import React from "react";

// ---------------------------------------------------------------
// Leaf — single SVG glyph. One shape, one vein. Use everywhere.
// ---------------------------------------------------------------
export function Leaf({ size = 16, filled = true, tilt = -18, color, strokeWidth = 1.4, style }) {
  const stroke = color || "currentColor";
  const fill = filled ? (color || "currentColor") : "none";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ transform: `rotate(${tilt}deg)`, display: "inline-block", verticalAlign: "middle", ...style }}
      aria-hidden="true"
    >
      <path d="M12 2 C 5 8, 5 17, 12 22 C 19 17, 19 8, 12 2 Z" fill={fill} />
      <path d="M12 4 V 21" stroke={color || "var(--paper)"} opacity={filled ? 0.55 : 0.8} />
    </svg>
  );
}

export function BrandLeaf({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={{ display: "inline-block", verticalAlign: "-2px" }}>
      <path d="M12 2 C 5 8, 5 17, 12 22 C 19 17, 19 8, 12 2 Z" fill="var(--moss)" />
      <path d="M12 4 V 21" stroke="var(--paper)" strokeWidth="1.2" strokeLinecap="round" opacity="0.7" />
    </svg>
  );
}

// ---------------------------------------------------------------
// LeafRow — horizontal vine, leaves attached above/below via tiny
// petioles. Filled = done. Click to jump (optional).
// ---------------------------------------------------------------
export function LeafRow({ total, completed, size = 16, gap = 8, onLeafClick }) {
  if (total === 0) return null;
  const step = size + gap;
  const padX = size * 0.6;
  const w = step * total + padX * 2 - gap;
  const h = size * 2.6;
  const stemY = h / 2;
  const startX = padX;
  const lastDoneIdx = Math.max(0, completed - 1);
  const grownX = startX + lastDoneIdx * step;

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      width={w}
      height={h}
      style={{ display: "block", overflow: "visible" }}
      role="img"
      aria-label={`${completed} of ${total} lessons complete`}
    >
      <line x1={startX - 6} y1={stemY} x2={w - padX + 6} y2={stemY}
            stroke="var(--hair-strong)" strokeWidth="1" strokeLinecap="round" />
      {completed > 0 && (
        <line x1={startX - 6} y1={stemY} x2={grownX} y2={stemY}
              stroke="var(--moss)" strokeWidth="1.6" strokeLinecap="round" />
      )}
      {completed > 0 && <circle cx={grownX} cy={stemY} r="1.8" fill="var(--moss)" />}

      {Array.from({ length: total }).map((_, i) => {
        const cx = startX + i * step;
        const above = i % 2 === 0;
        const done = i < completed;
        const tilt = above ? -55 - ((i * 5) % 10) : 55 + ((i * 5) % 10);
        const color = done ? "var(--moss)" : "var(--ink-faint)";
        const petEndY = above ? stemY - size * 0.35 : stemY + size * 0.35;
        return (
          <g
            key={i}
            onClick={onLeafClick ? () => onLeafClick(i) : undefined}
            style={{ cursor: onLeafClick ? "pointer" : "default", opacity: done ? 1 : 0.75 }}
          >
            <title>{`Lesson ${i + 1}${done ? " complete" : ""}`}</title>
            <line x1={cx} y1={stemY} x2={cx} y2={petEndY}
                  stroke={color} strokeWidth={done ? 1.1 : 0.9} strokeLinecap="round" />
            <g transform={`translate(${cx} ${petEndY}) rotate(${tilt}) scale(${size / 22})`}>
              <path d="M0 0 C -7 -3, -10 -10, 0 -16 C 10 -10, 7 -3, 0 0 Z"
                    fill={done ? color : "transparent"}
                    stroke={color}
                    strokeWidth={done ? 0 : 1.3} strokeLinejoin="round" />
              <path d="M0 0 V -15" stroke={done ? "var(--paper-2)" : color}
                    strokeWidth="0.8" strokeLinecap="round" opacity={done ? 0.55 : 0.7} />
            </g>
          </g>
        );
      })}
    </svg>
  );
}

// ---------------------------------------------------------------
// GrowingStem — vertical stem with petiole-attached leaves.
// Use on course-detail as the bold progress metaphor.
// ---------------------------------------------------------------
export function GrowingStem({ lessons, currentIndex = 0, onJump }) {
  const completed = lessons.filter((l) => l.done).length;
  const total = lessons.length;
  const stemLen = 480;
  const startY = 40;
  const step = (stemLen - 80) / Math.max(total - 1, 1);
  const width = 160;
  const stemX = 80;

  const growthIdx = Math.max(currentIndex, completed - 1);
  const tipY = startY + step * Math.max(0, growthIdx);

  return (
    <div style={{ position: "relative", width, height: stemLen + 40 }}>
      <svg viewBox={`0 0 ${width} ${stemLen + 40}`} width={width} height={stemLen + 40} style={{ overflow: "visible" }}>
        <line x1={stemX} y1={startY - 8} x2={stemX} y2={stemLen} stroke="var(--hair-strong)" strokeWidth="1" />
        <line x1={stemX} y1={startY - 8} x2={stemX} y2={tipY + 14} stroke="var(--moss)" strokeWidth="1.8" strokeLinecap="round" />
        <line x1={stemX - 12} y1={stemLen + 4} x2={stemX + 12} y2={stemLen + 4} stroke="var(--hair-strong)" strokeWidth="1" />
        <circle cx={stemX} cy={tipY + 14} r="3" fill="var(--moss)" />

        {lessons.map((lesson, i) => {
          const y = startY + step * i;
          const done = lesson.done;
          const isCurrent = i === currentIndex;
          const sideSign = i % 2 === 0 ? -1 : 1;
          const active = done || isCurrent;
          const color = done ? "var(--moss)" : (isCurrent ? "var(--moss-deep)" : "var(--ink-faint)");
          const stroke = done ? "var(--moss)" : "var(--ink-faint)";

          const petEndX = stemX + sideSign * 22;
          const petEndY = y - 6;
          const ctrlX = stemX + sideSign * 8;
          const ctrlY = y + 1;

          const leafRot = sideSign * 70;
          const labelX = stemX + sideSign * 56;
          const labelAnchor = sideSign === -1 ? "end" : "start";

          return (
            <g key={lesson.id || i} onClick={() => onJump && onJump(i)} style={{ cursor: "pointer" }}>
              <title>{`${String(i + 1).padStart(2, "0")} — ${lesson.title}`}</title>
              <rect x={sideSign === -1 ? stemX - 70 : stemX} y={y - 18} width="70" height="36" fill="transparent" />
              <path
                d={`M ${stemX} ${y} Q ${ctrlX} ${ctrlY} ${petEndX} ${petEndY}`}
                stroke={active ? stroke : "var(--ink-faint)"}
                strokeWidth={done ? 1.4 : 1}
                fill="none" strokeLinecap="round"
                opacity={active ? 1 : 0.55}
              />
              <g transform={`translate(${petEndX} ${petEndY}) rotate(${leafRot}) scale(1.1)`}>
                <path d="M0 0 C -7 -3, -10 -10, 0 -16 C 10 -10, 7 -3, 0 0 Z"
                      fill={active ? color : "transparent"}
                      stroke={color}
                      strokeWidth={active ? 0 : 1.3} strokeLinejoin="round" />
                <path d="M0 0 V -15" stroke={active ? "var(--paper-2)" : color}
                      strokeWidth="0.8" strokeLinecap="round" opacity={active ? 0.55 : 0.7} />
              </g>
              <text x={labelX} y={y + 4} textAnchor={labelAnchor}
                    fontSize="10" fontFamily="DM Mono, monospace" letterSpacing="1"
                    fill={isCurrent ? "var(--ink)" : "var(--ink-faint)"}>
                {String(i + 1).padStart(2, "0")}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// MiniStem — compact 80x100 version for cards and thumbnails.
export function MiniStem({ completed, total }) {
  const h = 100;
  const start = 6;
  const stemX = 40;
  const step = (h - 18) / Math.max(total - 1, 1);
  const tipY = start + step * Math.max(0, completed - 1);
  return (
    <svg viewBox="0 0 80 100" width="80" height="100" style={{ overflow: "visible" }}>
      <line x1={stemX} y1={start} x2={stemX} y2={h - 4} stroke="var(--hair-strong)" strokeWidth="1" />
      <line x1={stemX} y1={start} x2={stemX} y2={tipY + 8} stroke="var(--moss)" strokeWidth="1.6" strokeLinecap="round" />
      {completed > 0 && <circle cx={stemX} cy={tipY + 8} r="1.8" fill="var(--moss)" />}
      {Array.from({ length: total }).map((_, i) => {
        const y = start + step * i;
        const side = i % 2 === 0 ? -1 : 1;
        const done = i < completed;
        const petEndX = stemX + side * 14;
        const petEndY = y - 3;
        const color = done ? "var(--moss)" : "var(--ink-faint)";
        return (
          <g key={i}>
            <path d={`M ${stemX} ${y} Q ${stemX + side * 5} ${y + 1} ${petEndX} ${petEndY}`}
                  stroke={color} strokeWidth={done ? 1.1 : 0.8} fill="none" strokeLinecap="round"
                  opacity={done ? 1 : 0.55} />
            <g transform={`translate(${petEndX} ${petEndY}) rotate(${side * 65})`}>
              <path d="M0 0 C -3.5 -1.5, -5 -6, 0 -10 C 5 -6, 3.5 -1.5, 0 0 Z"
                    fill={done ? color : "transparent"}
                    stroke={color}
                    strokeWidth={done ? 0 : 0.9} opacity={done ? 1 : 0.7} />
            </g>
          </g>
        );
      })}
    </svg>
  );
}

// ---------------------------------------------------------------
// Simple shared atoms used across pages.
// ---------------------------------------------------------------
export function Kicker({ children, className = "" }) {
  return <div className={`ml-kicker ${className}`}>{children}</div>;
}

export function SectionHeading({ kicker, children }) {
  return (
    <div className="mb-7">
      {kicker && (
        <div className="ml-kicker flex items-center gap-2 mb-3">
          <Leaf size={11} strokeWidth={0} tilt={-22} /> {kicker}
        </div>
      )}
      <h2 className="font-serif text-3xl sm:text-4xl text-ink leading-tight tracking-tight2">{children}</h2>
    </div>
  );
}

export function LeafTag({ children }) {
  return (
    <span className="ml-pill">
      <Leaf size={9} strokeWidth={0} tilt={-22} /> {children}
    </span>
  );
}

export function Field({ label, hint, required, children }) {
  return (
    <label className="block mb-6">
      <div className="flex justify-between items-baseline mb-2">
        <span className="ml-kicker text-ink-soft">
          {label}{required && <span className="ml-1 text-moss">·</span>}
        </span>
        {hint && <span className="text-[11px] text-ink-faint">{hint}</span>}
      </div>
      {children}
    </label>
  );
}

// RolePill — admin/creator/student marker used in the people table.
export function RolePill({ role }) {
  const map = {
    ADMIN:   { label: "admin",   bg: "color-mix(in oklab, var(--moss-deep) 18%, transparent)", fg: "var(--moss-deep)" },
    CREATOR: { label: "creator", bg: "var(--moss-wash)", fg: "var(--moss-deep)" },
    STUDENT: { label: "student", bg: "transparent", fg: "var(--ink-soft)" },
  };
  const m = map[role] || map.STUDENT;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      padding: "4px 10px", borderRadius: 999,
      background: m.bg, color: m.fg,
      border: "1px solid " + (role === "STUDENT" ? "var(--hair-strong)" : "color-mix(in oklab, var(--moss-soft) 60%, transparent)"),
      fontSize: 11, letterSpacing: "0.04em",
    }}>
      {role !== "STUDENT" && <Leaf size={9} strokeWidth={0} />}
      {m.label}
    </span>
  );
}

// MilestoneCelebration — a quiet, one-time note when the lifetime
// leaves-collected count crosses a milestone. Deliberately understated:
// no confetti, no scores against anyone else.
const MILESTONE_WORDS = {
  10: "Ten",
  25: "Twenty-five",
  50: "Fifty",
  100: "One hundred",
  250: "Two hundred and fifty",
  500: "Five hundred",
  1000: "One thousand",
};

export function MilestoneCelebration({ milestone, onDismiss }) {
  if (!milestone) return null;
  const words = MILESTONE_WORDS[milestone] || String(milestone);
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "color-mix(in oklab, var(--ink) 45%, transparent)" }}
      onClick={onDismiss}
      role="dialog"
      aria-modal="true"
      aria-label={`${milestone} leaves collected`}
    >
      <div
        className="w-full max-w-md rounded-md p-10 text-center"
        style={{ background: "var(--paper)", border: "1px solid var(--hair-strong)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <span className="ml-leaf-pulse inline-block" style={{ color: "var(--moss)" }}>
          <Leaf size={52} strokeWidth={0} />
        </span>
        <Kicker className="mt-6 mb-3 flex items-center justify-center">a quiet milestone</Kicker>
        <h3 className="font-serif text-[28px] text-ink leading-tight">{words} leaves collected.</h3>
        <p className="mt-3 text-[14px] text-ink-soft">Tended one lesson at a time.</p>
        <button onClick={onDismiss} className="ml-button-ghost mt-8">
          keep tending
        </button>
      </div>
    </div>
  );
}

// LeafLoader — a quiet breathing leaf used in place of spinners.
export function LeafLoader({ size = 28, label = "loading" }) {
  return (
    <div className="flex items-center justify-center h-64" role="status" aria-label={label}>
      <span className="ml-leaf-pulse" style={{ color: "var(--moss)" }}>
        <Leaf size={size} strokeWidth={1.2} />
      </span>
    </div>
  );
}
