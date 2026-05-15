import React, { useMemo } from "react";
import ReactApexChart from "react-apexcharts";
import Style from "./DashCotas.module.css";

export default function DashboardAnalytics({
  dados,
  dias,
  rankingCidades,
  dadosPrint,
}) {
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

  const coresCustom = [
    "#A1343C",
    "#E68F96",
    "#bfa5a4",
    "#595A4A",
    "#999999",
    "#b36565",
    "#CCCCCC",
    "#897170",
    "#8BAAAD",
  ]; // paleta

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
    return [...dados].sort((a, b) => b.qtd - a.qtd).slice(0, 10);
  }, [dados]);

  const rankingPiores = useMemo(() => {
    return [...rankingCidades.piores]
      .sort((a, b) => b.qtd - a.qtd)
      .slice(0, 10);
  }, [rankingCidades.piores]);

  const rankingMelhores = useMemo(() => {
    return [...rankingCidades.melhores]
      .sort((a, b) => b.qtd - a.qtd)
      .slice(0, 10);
  }, [rankingCidades.melhores]);

  // 🔹 Território
  const graficoOcupacao = useMemo(() => {
    const map = {};

    dadosPrint
      ?.filter((item) => item.territorio && item.taxa_perc != null) // remove lixo/null
      .forEach((item) => {
        if (!map[item.territorio]) {
          map[item.territorio] = { D1: 0, D2: 0 };
        }

        map[item.territorio][item.dia] = Number(item.taxa_perc);
      });

    const categorias = Object.keys(map);

    return {
      categorias,
      series: [
        {
          name: "D1",
          data: categorias.map((t) => map[t]?.D1 || 0),
        },
        {
          name: "D2",
          data: categorias.map((t) => map[t]?.D2 || 0),
        },
      ],
    };
  }, [dadosPrint]);

  // 🔹 DDD
  const dddData = useMemo(() => {
    const map = {};

    dados.forEach((item) => {
      map[item.ddd] = (map[item.ddd] || 0) + Number(item.qtd || 0);
    });

    return map;
  }, [dados]);

  const territorioData = useMemo(() => {
    const map = {};

    dados.forEach((item) => {
      map[item.territorio] =
        (map[item.territorio] || 0) + Number(item.qtd || 0);
    });

    return map;
  }, [dados]);

  const somarSaldo = (diasObj) => {
    if (!diasObj) return 0;

    return Object.values(diasObj).reduce((total, d) => {
      return total + Number(d?.saldo || 0);
    }, 0);
  };

  return (
    <main className={Style.main} style={{ display: "grid", gap: "20px" }}>
      {/* 📊 Linha: Cotas vs Agendado */}

      <section className={Style.asidePrint}>
        <aside>
          <div>
            <h3>Alta Disponibilidade De Cotas</h3>

            <ReactApexChart
              type="bar"
              height={250}
              width={600}
              series={[
                {
                  data: rankingMelhores.map((c) => somarSaldo(c.dias)),
                },
              ]}
              options={{
                xaxis: {
                  categories: rankingMelhores.map((c) => c.cidade),
                },
                colors: coresCustom,
                legend: { show: false },
                plotOptions: {
                  bar: {
                    distributed: true,
                  },
                },
                dataLabels: {
                  style: { fontSize: "12px", colors: ["#000000"] },
                },
              }}
            />

            <h3>Baixa Disponibilidade De Cotas</h3>
            <ReactApexChart
              type="bar"
              height={250}
              width={600}
              series={[
                {
                  data: rankingPiores.map((c) => somarSaldo(c.dias)),
                },
              ]}
              options={{
                xaxis: {
                  categories: rankingPiores.map((c) => c.cidade),
                },
                colors: coresCustom,
                legend: { show: false },
                plotOptions: {
                  bar: {
                    distributed: true,
                  },
                },
                dataLabels: {
                  style: { fontSize: "12px", colors: ["#000000"] },
                },
              }}
            />
          </div>
        </aside>
        <aside className={Style.graficopizza}>
          <div>
            <h3>% Ocupação por Território (D0 vs D1)</h3>

            <ReactApexChart
              type="bar"
              height={250}
              width={600}
              series={[
                {
                  name: "D0",
                  data: graficoOcupacao.series[0]?.data || [],
                },
                {
                  name: "D1",
                  data: graficoOcupacao.series[1]?.data || [],
                },
              ]}
              options={{
                xaxis: {
                  categories: graficoOcupacao.categorias,
                },
                colors: ["#ff261e", "#FF4D4F"], // D1 azul | D2 vermelho
                plotOptions: {
                  bar: {
                    horizontal: false,
                    columnWidth: "50%",
                  },
                },
                dataLabels: {
                  enabled: true,
                  formatter: (val) => val?.toFixed(1) + "%",
                  style: { fontSize: "12px", colors: ["#000000"] },
                },
                yaxis: {
                  labels: {
                    formatter: (val) => val + "%",
                  },
                },
                tooltip: {
                  y: {
                    formatter: (val) => val.toFixed(2) + "%",
                  },
                },
              }}
            />
          </div>

        </aside>
      </section>

      <section className={Style.elet}>
          {/* 🌎 Território */}
          <div>
            <h3>Distribuição de backlog por Território</h3>
            <ReactApexChart
              type="donut"
              height={250}
              series={Object.values(territorioData)}
              options={{
                labels: Object.keys(territorioData),
              }}
            />
          </div>
        <div>
          <h3>Cotas vs Agendado por Dia</h3>
          <ReactApexChart
            type="line"
            height={300}
            width={1200}
            series={seriesLinha}
            options={{
              chart: { toolbar: { show: false } },
              xaxis: { categories: dias },
              colors: coresCustom,
              plotOptions: {
                bar: {
                  distributed: true,
                },
              },
            }}
          />
        </div>

        <div>
          <h3>Top 10 Cidades (Backlog)</h3>
          <ReactApexChart
            type="bar"
            height={300}
            width={1200}
            series={[
              {
                data: topCidades.map((c) => c.qtd),
              },
            ]}
            options={{
              xaxis: {
                categories: topCidades.map((c) => c.cidade),
              },
              colors: coresCustom,
              plotOptions: {
                bar: {
                  distributed: true,
                },
              },
            }}
          />
        </div>

        {/* 📍 Top cidades */}

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
              colors: coresCustom,
              plotOptions: {
                bar: {
                  distributed: true,
                },
              },
            }}
          />
        </div>
      </section>
    </main>
  );
}
