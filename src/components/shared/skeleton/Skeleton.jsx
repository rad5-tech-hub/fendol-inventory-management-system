import React from "react";
import styles from "./skeleton.module.scss";

export function SkeletonLine({ width = "100%", height, style = {} }) {
  return <div className={styles.line} style={{ width, height, ...style }} />;
}

export function SkeletonTitle({ width = 180 }) {
  return <div className={styles.title} style={{ width }} />;
}

export function SkeletonCard({ style = {} }) {
  return <div className={styles.card} style={style} />;
}

export function SkeletonCircle({ size = 40 }) {
  return <div className={styles.circle} style={{ width: size, height: size }} />;
}

export function SkeletonBadge({ width = 80 }) {
  return <div className={styles.badge} style={{ width }} />;
}

export function SkeletonTable({ rows = 5, cols = 6 }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* header */}
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 12, padding: "14px 20px" }}>
        {Array.from({ length: cols }).map((_, i) => (
          <SkeletonLine key={`h-${i}`} />
        ))}
      </div>
      {/* rows */}
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 12, padding: "14px 20px", borderTop: "1px solid #F0F0F0" }}>
          {Array.from({ length: cols }).map((_, c) => (
            <SkeletonLine key={`r${r}-${c}`} width={c === 0 ? "70%" : c === cols - 1 ? "40%" : "85%"} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonStatGrid({ count = 4 }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(count, 4)}, 1fr)`, gap: 16 }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 8, padding: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
            <SkeletonCircle size={40} />
            <SkeletonLine width={100} />
          </div>
          <SkeletonLine width="60%" height={24} style={{ marginBottom: 8 }} />
          <SkeletonLine width={80} height={12} />
        </div>
      ))}
    </div>
  );
}

export function SkeletonFilterBar() {
  return (
    <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
      <div style={{ flex: 2, minWidth: 220 }}><div className={styles.base} style={{ height: 38 }} /></div>
      <div style={{ flex: 1, minWidth: 150 }}><div className={styles.base} style={{ height: 38 }} /></div>
      <div style={{ flex: 1, minWidth: 150 }}><div className={styles.base} style={{ height: 38 }} /></div>
      <div style={{ flex: "0 0 auto", width: 100 }}><div className={styles.base} style={{ height: 38 }} /></div>
      <div style={{ flex: "0 0 auto", width: 80 }}><div className={styles.base} style={{ height: 38 }} /></div>
    </div>
  );
}
