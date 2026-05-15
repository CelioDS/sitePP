import React, { useMemo } from "react";
import ReactApexChart from "react-apexcharts";
import Style from "./DashCotas.module.css";
import logo from "../IMG/claroLogo.webp";
import ClaroLogo from "../Item-Layout/ClaroLogo";

import { BsCircleFill } from "react-icons/bs";

export default function DashboardAnalytics({
  dados,
  dias,
  rankingCidades,
  dadosPrint,
  dadosPrintCidades,
}) {
  // 🔹 Cores da paleta
  const MAPA_CORES_TERRITORIO = {
    CENTRAL: "#E42B2D",
    OESTE: "#E69138",
    NOROESTE: "#F2C516",
    SUDESTE: "#8A8381",
    // Adicione todos os seus territórios aqui...
  };

  // 🔹 Função auxiliar para somar saldo de cotas
  const somarSaldo = (diasObj) => {
    if (!diasObj) return 0;
    return Object.values(diasObj).reduce((total, d) => {
      const val = Number(d?.saldo || 0);
      return total + (isNaN(val) ? 0 : val);
    }, 0);
  };

  // 🔹 Totais por dia (Gráfico de Linha)
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

  // 🔹 Rankings Ordenados por Quantidade de Cotas (Saldo)
  const rankingMelhores = useMemo(() => {
    return [...(rankingCidades?.melhores || [])]
      .map((c) => ({ ...c, totalCotas: somarSaldo(c.dias) }))
      .sort((a, b) => b.totalCotas - a.totalCotas)
      .slice(0, 10);
  }, [rankingCidades.melhores]);

  const rankingPiores = useMemo(() => {
    return [...(rankingCidades?.piores || [])]
      .map((c) => ({ ...c, totalCotas: somarSaldo(c.dias) }))
      .sort((a, b) => a.totalCotas - b.totalCotas) // Menores saldos primeiro
      .slice(0, 10);
  }, [rankingCidades.piores]);

  // 🔹 Preparação do Gráfico de Ocupação (D0 e D1 vindos da Query)
  const graficoOcupacao = useMemo(() => {
    const map = {};

    dadosPrint
      ?.filter((item) => item.territorio && item.taxa_perc != null)
      .forEach((item) => {
        if (!map[item.territorio]) {
          map[item.territorio] = { D0: 0, D1: 0 };
        }
        // Usa a chave diretamente como vem da query (D0 ou D1)
        map[item.territorio][item.dia] = Number(item.taxa_perc);
      });

    const categorias = Object.keys(map);

    return {
      categorias,
      series: [
        {
          name: "D0",
          data: categorias.map((t) => map[t]?.D0 || 0),
        },
        {
          name: "D1",
          data: categorias.map((t) => map[t]?.D1 || 0),
        },
      ],
    };
  }, [dadosPrint]);

  const graficoOcupacaoCidades = useMemo(() => {
    const map = {};

    dadosPrintCidades
      ?.filter((item) => item.cidade && item.taxa_perc != null)
      .forEach((item) => {
        if (!map[item.cidade]) {
          map[item.cidade] = { D0: 0, D1: 0 };
        }
        // Usa a chave diretamente como vem da query (D0 ou D1)
        map[item.cidade][item.dia] = Number(item.taxa_perc);
      });

    const categorias = Object.keys(map);

    return {
      categorias,
      series: [
        {
          name: "D0",
          data: categorias.map((t) => map[t]?.D0 || 0),
        },
        {
          name: "D1",
          data: categorias.map((t) => map[t]?.D1 || 0),
        },
      ],
    };
  }, [dadosPrintCidades]);

  // 🔹 Dados Adicionais
  const seriesLinha = [
    { name: "Cotas", data: dias.map((d) => totaisPorDia[d]?.cotas || 0) },
    { name: "Agendado", data: dias.map((d) => totaisPorDia[d]?.agendado || 0) },
  ];

  const topCidades = useMemo(() => {
    return [...dados].sort((a, b) => b.qtd - a.qtd).slice(0, 10);
  }, [dados]);

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

  return (
    <main className={Style.main} style={{ display: "grid", gap: "20px" }}>
      <header
        className={Style.cards}
        style={{
          display: "flex",
          width: "100%",
          justifyContent: "space-around",
          textAlign: "center",
          alignItems: "center",
          fontSize: "11px",
        }}
      >
        <aside>
          <p style={{ color: "#4e4d4d", gap: "5px" }}>
            Legenda graficos territorios
          </p>

          <span style={{ color: "#4e4d4d", gap: "15px" }}>
            <BsCircleFill color="#E42B2D" /> CENTRAL
          </span>
          <span style={{ color: "#4e4d4d", gap: "15px" }}>
            <BsCircleFill color="#E69138" />
            OESTE
          </span>
          <span style={{ color: "#4e4d4d", gap: "15px" }}>
            <BsCircleFill color="#F2C516" />
            NOROESTE
          </span>
          <span style={{ color: "#4e4d4d", gap: "15px" }}>
            <BsCircleFill color="#8A8381" />
            SUDESTE
          </span>
        </aside>

        <aside
          style={{
            display: "flex",
            justifyContent: "space_around",
            flexDirection: "row",
            gap: "20px",
            marginBottom: "10px",
            fontSize: "10px",
          }}
        >
          <div>
            <h2>MAPA DE OCUPAÇAO COTAS</h2>
            <span style={{ color: "#4e4d4d", fontSize: "12px" }}>
              CLASSE 1 (Novos Domicílios)
            </span>
          </div>
          <div>
            <ClaroLogo size={50} logo={logo} />
          </div>
        </aside>
      </header>
      <section className={Style.asidePrint}>
        <aside>
          <div>
            <h6>Alta Disponibilidade De Cotas (Saldo)</h6>

            <ReactApexChart
              type="bar"
              height={250}
              width={600}
              series={[
                {
                  name: "Cotas",
                  data: rankingMelhores.map((c) => {
                    // Procuramos dentro do objeto alarme qual dia tem cotas > 0
                    const diaComDados = Object.values(c.alarme || {}).find(
                      (a) => Number(a.cotas) > 0,
                    );
                    return diaComDados ? Number(diaComDados.cotas) : 0;
                  }),
                },
              ]}
              options={{
                xaxis: {
                  categories: rankingMelhores.map((c) => {
                    // Exemplo: Se tiver '|', divide em duas linhas
                    if (c.cidade.includes("|")) {
                      return c.cidade.split("|").map((s) => s.trim());
                    }
                    // Se o nome for muito grande, divide por espaços
                    return c.cidade;
                  }),
                  labels: {
                    show: true,
                    rotate: -45,
                    rotateAlways: true,
                    minHeight: 100, // Dá espaço para o texto rotacionado não sumir
                    style: {
                      fontSize: "9px",
                    },
                  },
                },
                colors: rankingMelhores.map(
                  (c) => MAPA_CORES_TERRITORIO[c.territorio],
                ),
                plotOptions: {
                  bar: {
                    distributed: true, // Isso permite que cada barra tenha sua cor do array acima
                  },
                },

                dataLabels: {
                  enabled: true,
                  style: { fontSize: "10px", colors: ["#000"] },
                },
                legend: { show: false },
              }}
            />

            <h6>Baixa Disponibilidade De Cotas (Saldo)</h6>
            <ReactApexChart
              type="bar"
              height={250}
              width={600}
              series={[
                {
                  name: "Cotas",
                  data: rankingPiores.map((c) => {
                    // Procuramos dentro do objeto alarme qual dia tem cotas > 0
                    const diaComDados = Object.values(c.alarme || {}).find(
                      (a) => Number(a.cotas) > 0,
                    );
                    return diaComDados ? Number(diaComDados.cotas) : 0;
                  }),
                },
              ]}
              options={{
                xaxis: {
                  categories: rankingPiores.map((c) => {
                    // Exemplo: Se tiver '|', divide em duas linhas
                    if (c.cidade.includes("|")) {
                      return c.cidade.split("|").map((s) => s.trim());
                    }
                    // Se o nome for muito grande, divide por espaços
                    return c.cidade;
                  }),
                  labels: {
                    show: true,
                    rotate: -45,
                    rotateAlways: true,
                    minHeight: 100, // Dá espaço para o texto rotacionado não sumir
                    style: {
                      fontSize: "9px",
                    },
                  },
                },
                colors: rankingMelhores.map(
                  (c) => MAPA_CORES_TERRITORIO[c.territorio],
                ),
                plotOptions: { bar: { distributed: true } },
                dataLabels: {
                  enabled: true,
                  style: { fontSize: "10px", colors: ["#000"] },
                },
                legend: { show: false },
              }}
            />
          </div>
        </aside>

        <aside className={Style.graficopizza}>
          <div>
            <h6>% Ocupação por Território (D0 vs D1)</h6>
            <ReactApexChart
              type="bar"
              height={250}
              width={600}
              series={graficoOcupacao.series}
              options={{
                xaxis: { categories: graficoOcupacao.categorias },

                fill: {
                  type: "solid",
                  opacity: [1, 0.5], // D0 opacidade total, D1 fica 50% mais claro automaticamente
                },
                colors: [
                  ({ value, seriesIndex, dataPointIndex, w }) => {
                    const territorio =
                      w.config.xaxis.categories[dataPointIndex];
                    return MAPA_CORES_TERRITORIO[territorio] || "#ccc";
                  },
                ],
                plotOptions: {
                  bar: {
                    horizontal: false,
                    columnWidth: "55%",
                    distributed: false, // Voltamos para false para agrupar D0 e D1
                  },
                },
                dataLabels: {
                  enabled: true,
                  formatter: (val) => val?.toFixed(1) + "%",
                  style: { fontSize: "9px", colors: ["#333"] },
                  offsetY: -20,
                },
                yaxis: { labels: { formatter: (val) => val + "%" } },
                legend: {
                  show: true,
                  position: "top",
                  // Forçamos a legenda a mostrar D0 e D1 com cores neutras ou fixas
                  // para não confundir, já que as barras mudam por território
                  markers: { fillColors: ["#555", "#AAA"] },
                },
                tooltip: {
                  shared: true,
                  intersect: false,
                },
              }}
            />
          </div>
          <div>
            <h6>% Ocupação por CIDADES (D0 vs D1)</h6>
            <ReactApexChart
              type="bar"
              height={250}
              width={600}
              series={graficoOcupacaoCidades.series}
              options={{
                // Função que busca a cor do território para cada cidade no eixo X
                colors: [
                  ({ dataPointIndex, w }) => {
                    const nomeCidade =
                      graficoOcupacaoCidades.categorias[dataPointIndex];
                    // Procura nos seus dados originais qual o território dessa cidade
                    const item = dados.find((d) => d.cidade === nomeCidade);
                    return MAPA_CORES_TERRITORIO[item?.territorio] || "#ccc";
                  },
                ],
                fill: {
                  type: "solid",
                  opacity: [1, 0.5], // D0 forte, D1 claro
                },
                plotOptions: {
                  bar: { distributed: false },
                },
                xaxis: {
                  // Correção: 'c' já é a string da cidade aqui
                  categories: graficoOcupacaoCidades.categorias.map((c) => {
                    return c.includes("|")
                      ? c.split("|").map((s) => s.trim())
                      : c;
                  }),
                  labels: {
                    rotate: -45,
                    style: { fontSize: "9px" },
                    multiline: true,
                  },
                },

                plotOptions: {
                  bar: {
                    horizontal: false,
                    columnWidth: "70%",
                    distributed: false, // Mantenha false para ver D0 e D1 lado a lado por cidade
                  },
                },
                dataLabels: {
                  enabled: true,
                  formatter: (val) => val?.toFixed(1) + "%",
                  style: { fontSize: "8px", colors: ["#000"] },
                },
                yaxis: { labels: { formatter: (val) => val + "%" } },
                legend: { show: true, position: "top" },
              }}
            />
          </div>
        </aside>
      </section>

      <section className={Style.elet}>
        <div>
          <h3>Distribuição de backlog por Território</h3>
          <ReactApexChart
            type="donut"
            height={250}
            series={Object.values(territorioData)}
            options={{ labels: Object.keys(territorioData) }}
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
              xaxis: { categories: dias },
              colors: ["#A1343C", "#595A4A"],
              chart: { toolbar: { show: false } },
            }}
          />
        </div>

        <div>
          <h3>Top 10 Cidades (Backlog)</h3>
          <ReactApexChart
            type="bar"
            height={300}
            width={1200}
            series={[{ data: topCidades.map((c) => c.qtd) }]}
            options={{
              xaxis: { categories: topCidades.map((c) => c.cidade) },
              colors: rankingMelhores.map(
                (c) => MAPA_CORES_TERRITORIO[c.territorio],
              ),
              plotOptions: { bar: { distributed: true } },
            }}
          />
        </div>

        <div>
          <h3>Distribuição por DDD</h3>
          <ReactApexChart
            type="bar"
            height={300}
            series={[{ data: Object.values(dddData) }]}
            options={{
              xaxis: { categories: Object.keys(dddData) },
              colors: rankingMelhores.map(
                (c) => MAPA_CORES_TERRITORIO[c.territorio],
              ),
              plotOptions: { bar: { distributed: true } },
            }}
          />
        </div>
      </section>
    </main>
  );
}
