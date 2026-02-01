import { useMemo, useState } from "react";
import Chart from "react-apexcharts";

export default function BrInstLineSimple({
  dataFULL = [],
  loading = false,
  years,
  referencia,
}) {
  // Estado local para selecionar origem (BR ou RSI) e ano (opcional)
  const [source] = useState(referencia); // "BR" | "RSI"
  const [year] = useState(years); // "" = todos os anos

  // Utilitário: AAAAMM -> MM/AAAA
  const formatAnoMes = (anomes) => {
    const s = String(anomes ?? "");
    const ano = s.slice(0, 4);
    const mes = s.slice(4, 6);
    return `${mes}/${ano}`;
  };

  // Ordena por anomes e aplica filtro de ano (se selecionado)
  const sorted = useMemo(() => {
    const arr = [...(dataFULL || [])].sort(
      (a, b) => Number(a.anomes) - Number(b.anomes),
    );
    if (!year) return arr;
    return arr.filter((d) => String(d.anomes).slice(0, 4) === String(year));
  }, [dataFULL, year]);

  // Monta labels e escolhe os campos conforme a origem escolhida
  const labels = useMemo(
    () => sorted.map((d) => formatAnoMes(d.anomes)),
    [sorted],
  );

  const vb = useMemo(() => {
    return source === "BR"
      ? sorted.map((d) => d.VB_soma_br ?? null)
      : sorted.map((d) => d.VB_soma_RSI ?? null);
  }, [sorted, source]);

  const inst = useMemo(() => {
    return source === "BR"
      ? sorted.map((d) => d.INST_soma_br ?? null)
      : sorted.map((d) => d.INST_soma_RSI ?? null);
  }, [sorted, source]);

  // Opções do ApexCharts (um gráfico simples de linhas)
  const options = {
    chart: {
      type: "line",
      toolbar: { show: true },
      animations: { easing: "easeinout", speed: 350 },
    },
    noData: { text: loading ? "Carregando..." : "Sem dados" },
    stroke: { curve: "smooth", width: 2 },
    markers: { size: 3 },
    legend: { position: "top" },
    colors: ["#1f77b4", "#2ca02c"], // VB = azul, INST = verde
    title: {
      style: { fontSize: "14px" },
    },
    xaxis: {
      categories: labels,
      labels: { rotate: -15, style: { fontSize: "12px" } },
      axisBorder: { show: true },
      axisTicks: { show: true },
    },
    yaxis: {
      labels: {
        formatter: (val) => (val != null ? val.toFixed(2) : ""),
      },
    },
    tooltip: {
      shared: true,
      y: { formatter: (val) => (val != null ? val.toFixed(2) : "") },
    },
    grid: { strokeDashArray: 4 },
  };

  const series = [
    { name: "VB", data: vb },
    { name: "INST", data: inst },
  ];

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div
        className="card"
        style={{
          background: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: 12,
          padding: 12,
        }}
      >
        <Chart
          type="line"
          height={200}
          options={options}
          series={series}
          width={850} // 👈 AQUI! (pode ser qualquer valor)
        />
      </div>
    </div>
  );
}
