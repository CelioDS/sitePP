import React from "react";

export default function MiniSparkline({ dias, width = 90, height = 28 }) {
  if (!dias || Object.keys(dias).length === 0) return null;

  const entries = Object.entries(dias).sort(
    ([a], [b]) => Number(a.replace("D", "")) - Number(b.replace("D", ""))
  );

  const cotas = entries.map(([, d]) => Number(d.saldo) || 0);
  const os = entries.map(([, d]) => Number(d.qtd_os) || 0);

  const max = Math.max(...cotas, ...os, 1);

  const scaleY = (v) => height - (v / max) * height;
  const stepX = entries.length > 1 ? width / (entries.length - 1) : width;

  const buildLine = (values) =>
    values.map((v, i) => `${i * stepX},${scaleY(v)}`).join(" ");

  return (
    <svg width={width} height={height}>
      {/* OS – Vermelho */}
      <polyline
        points={buildLine(os)}
        fill="none"
        stroke="#d9534f"
        strokeWidth="2"
      />

      {/* Cotas – Verde */}
      <polyline
        points={buildLine(cotas)}
        fill="none"
        stroke="#5cb85c"
        strokeWidth="2"
      />
    </svg>
  );
}