import React, { useMemo } from "react";
import ReactApexChart from "react-apexcharts";

export default function DashboardAnalytics({ dados, dias }) {
  // 🔹 Totais por dia
  const totaisPorDia = useMemo(() => {
    const totais = {};

    dias.forEach((dia) => {
      totais[dia] = { cotas: 0, agendado: 0 };
    });

    dados.forEach((item) => {
      dias.forEach((dia) => {
        const d = item.dias?.[dia];
        if (d) {
          totais[dia].cotas += Number(d.saldo || 0);
          totais[dia].agendado += Number(d.qtd_os || 0);
        }
      });
    });

    return totais;
  }, [dados, dias]);

  // 🔹 Dados gráfico linha
  const seriesLinha = [
    {
      name: "Cotas",
      data: dias.map((d) => totaisPorDia[d]?.cotas || 0),
    },
    {
      name: "Agendado",
      data: dias.map((d) => totaisPorDia[d]?.agendado || 0),
    },
  ];

  // 🔹 Top cidades
  const topCidades = useMemo(() => {
    return [...dados]
      .sort((a, b) => b.qtd - a.qtd)
      .slice(0, 10);
  }, [dados]);

  // 🔹 Território
  const territorioData = useMemo(() => {
    const map = {};

    dados.forEach((item) => {
      map[item.territorio] =
        (map[item.territorio] || 0) + Number(item.qtd || 0);
    });

    return map;
  }, [dados]);

  // 🔹 DDD
  const dddData = useMemo(() => {
    const map = {};

    dados.forEach((item) => {
      map[item.ddd] = (map[item.ddd] || 0) + Number(item.qtd || 0);
    });

    return map;
  }, [dados]);

  return (
    <div style={{ display: "grid", gap: "20px" }}>
      
      {/* 📊 Linha: Cotas vs Agendado */}
      <div>
        <h3>Cotas vs Agendado por Dia</h3>
        <ReactApexChart
          type="line"
          height={300}
          series={seriesLinha}
          options={{
            chart: { toolbar: { show: false } },
            xaxis: { categories: dias },
          }}
        />
      </div>

      {/* 📍 Top cidades */}
      <div>
        <h3>Top 10 Cidades (Backlog)</h3>
        <ReactApexChart
          type="bar"
          height={300}
          series={[
            {
              data: topCidades.map((c) => c.qtd),
            },
          ]}
          options={{
            xaxis: {
              categories: topCidades.map((c) => c.cidade),
            },
          }}
        />
      </div>

      {/* 🌎 Território */}
      <div>
        <h3>Distribuição por Território</h3>
        <ReactApexChart
          type="donut"
          height={300}
          series={Object.values(territorioData)}
          options={{
            labels: Object.keys(territorioData),
          }}
        />
      </div>

      {/* 📞 DDD */}
      <div>
        <h3>Distribuição por DDD</h3>
        <ReactApexChart
          type="bar"
          height={300}
          series={[
            {
              data: Object.values(dddData),
            },
          ]}
          options={{
            xaxis: {
              categories: Object.keys(dddData),
            },
          }}
        />
      </div>
    </div>
  );
}