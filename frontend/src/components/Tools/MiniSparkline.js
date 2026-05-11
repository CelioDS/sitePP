import React, { useMemo } from "react";

export default function MiniSparkline({ dias, width = 100, height = 35 }) {
  const data = useMemo(() => {
    if (!dias || Object.keys(dias).length === 0) return null;

    const entries = Object.entries(dias).sort(
      ([a], [b]) =>
        Number(a.replace("D", "")) - Number(b.replace("D", ""))
    );

    const cotas = entries.map(([, d]) => Number(d.saldo) || 0);
    const os = entries.map(([, d]) => Number(d.qtd_os) || 0);

    const max = Math.max(...cotas, ...os, 1);

    return { entries, cotas, os, max };
  }, [dias]);

  if (!data) return null;

  const { entries, cotas, os, max } = data;

  const scaleY = (v) => height - (v / max) * (height - 4);
  const stepX = entries.length > 1 ? width / (entries.length - 1) : width;

  const buildLine = (values) =>
    values
      .map((v, i) => `${i * stepX},${scaleY(v)}`)
      .join(" ");

  const buildArea = (values) => {
    return `
      0,${height}
      ${values
        .map((v, i) => `${i * stepX},${scaleY(v)}`)
        .join(" ")}
      ${width},${height}
    `;
  };

  return (
    <svg width={width} height={height}>
      {/* Gradientes */}
      <defs>
        <linearGradient id="greenGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#5cb85c" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#5cb85c" stopOpacity="0" />
        </linearGradient>

        <linearGradient id="redGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#d9534f" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#d9534f" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Grid */}
      {[0.25, 0.5, 0.75].map((p, i) => (
        <line
          key={i}
          x1={0}
          x2={width}
          y1={height * p}
          y2={height * p}
          stroke="#eee"
          strokeWidth={0.5}
        />
      ))}

      {/* Área OS (vermelho) */}
      <polygon points={buildArea(os)} fill="url(#redGrad)" />

      {/* Área Cotas (verde) */}
      <polygon points={buildArea(cotas)} fill="url(#greenGrad)" />

      {/* Linha OS */}
      <polyline
        points={buildLine(os)}
        fill="none"
        stroke="#d9534f"
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* Linha Cotas */}
      <polyline
        points={buildLine(cotas)}
        fill="none"
        stroke="#5cb85c"
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* Pontos + destaque final */}
      {os.map((v, i) => (
        <circle
          key={`os-${i}`}
          cx={i * stepX}
          cy={scaleY(v)}
          r={i === os.length - 1 ? 3 : 1.8}
          fill="#d9534f"
        />
      ))}

      {cotas.map((v, i) => (
        <circle
          key={`cota-${i}`}
          cx={i * stepX}
          cy={scaleY(v)}
          r={i === cotas.length - 1 ? 3 : 1.8}
          fill="#5cb85c"
        />
      ))}
    </svg>
  );
}