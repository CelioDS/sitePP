import { useEffect, useState } from "react";
import React, { useMemo } from "react";
import logo from "../IMG/claroLogo.webp";
import Style from "./DashCotas.module.css";
import ReactApexChart from "react-apexcharts";
import ClaroLogo from "../Item-Layout/ClaroLogo";
import { BsCircleFill, BsClock } from "react-icons/bs";
import { MdEventAvailable } from "react-icons/md";
import { FaCalendarCheck } from "react-icons/fa";
import ValidarToken from "../Tools/ValidarToken";

export default function DashboardAnalytics({
  dados,
  dias,
  rankingCidades,
  dadosPrint,
  dadosPrintCidades,
  ultimaAtualizacao,
}) {
  // 🔹 Cores da paleta
  const STORAGE_KEY = "rankingCidadesSnapshot";
  const [userData, setUserData] = useState();
  const admin = userData?.admin;

  const [deveSalvarSnapshot, setDeveSalvarSnapshot] = useState(false);
  const MAPA_CORES_TERRITORIO = {
    OESTE: "#E69138",
    SUDESTE: "#8A8381",
    CENTRAL: "#E42B2D",
    NOROESTE: "#F2C516",
    "VALE/LITORAL": "#ff0000",
  };

  const gerarSnapshot = (lista) => {
    const map = {};

    lista.forEach((c) => {
      const diaEntry = Object.entries(c.alarme || {}).find(
        ([_, a]) => Number(a.cotas) > 0,
      );
      const dia = diaEntry ? diaEntry[0] : null;
      const valor = diaEntry ? Number(diaEntry[1].cotas) : 0;

      map[c.cidade] = {
        valor,
        dia,
      };
    });

    return map;
  };

  const getSnapshotAnterior = () => {
    try {
      return JSON.parse(localStorage.getItem("snapshotAnterior")) || {};
    } catch {
      return {};
    }
  };

  // ✅ BUSCA USER
  useEffect(() => {
    let isMounted = true;

    async function fetchUserData() {
      try {
        const data = await ValidarToken();
        if (isMounted && data) setUserData(data);
      } catch (error) {
        console.error("Erro ao validar token:", error);
      }
    }

    fetchUserData();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const salvarSnapshot = (snapshot) => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
      localStorage.setItem(
        "penultimaAtualizacao",
        JSON.stringify(ultimaAtualizacao),
      );
    };

    if (deveSalvarSnapshot && rankingCidades?.total?.length) {
      salvarSnapshot(gerarSnapshot(rankingCidades.total));

      setDeveSalvarSnapshot(false);
    }
  }, [
    deveSalvarSnapshot,
    rankingCidades,
    setDeveSalvarSnapshot,
    ultimaAtualizacao,
  ]);

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

  // 🔹 Rankings Ordenados por Quantidade de Cotas do Alarme Ativo
  const rankingMelhores = useMemo(() => {
    const snapshotAnterior = getSnapshotAnterior();

    return [...(rankingCidades?.melhores || [])]
      .map((c) => {
        const diaEntry = Object.entries(c.alarme || {}).find(
          ([_, a]) => Number(a.cotas) > 0,
        );

        const diaAtual = diaEntry ? diaEntry[0] : null;
        const valorAtual = diaEntry ? Number(diaEntry[1].cotas) : 0;
        const prev = snapshotAnterior[c.cidade] || {};
        const valorAnterior = prev.valor || 0;
        const diaAnterior = prev.dia || null;
        const delta = valorAtual - valorAnterior;

        const categoriasEixoX =
          c.cidade && c.cidade.includes("|")
            ? c.cidade.split("|").map((item) => item.trim())
            : [c.cidade];

        return {
          ...c,
          valorCotaBarra: valorAtual,
          delta,
          diaAtual,
          diaAnterior,
          categoriasEixoX,
        };
      })
      .sort((a, b) => b.valorCotaBarra - a.valorCotaBarra)
      .slice(0, 10);
  }, [rankingCidades.melhores]);

  const rankingPiores = useMemo(() => {
    const snapshotAnterior = getSnapshotAnterior();

    return [...(rankingCidades?.piores || [])]
      .map((c) => {
        const diaEntry = Object.entries(c.alarme || {}).find(
          ([_, a]) => Number(a.cotas) > 0,
        );

        const diaAtual = diaEntry ? diaEntry[0] : null;
        const valorAtual = diaEntry ? Number(diaEntry[1].cotas) : 0;

        const prev = snapshotAnterior[c.cidade] || {};
        const valorAnterior = prev.valor || 0;

        const delta = valorAtual - valorAnterior;

        const categoriasEixoX =
          c.cidade && c.cidade.includes("|")
            ? c.cidade.split("|").map((item) => item.trim())
            : [c.cidade];

        return {
          ...c,
          valorCotaBarra: valorAtual,
          delta,
          diaAtual,
          categoriasEixoX,
        };
      })
      .sort((a, b) => a.valorCotaBarra - b.valorCotaBarra)
      .slice(0, 10);
  }, [rankingCidades.piores]);

  //resumo territorio

  const resumoTerriotrios = useMemo(() => {
    const map = {};

    dadosPrint
      ?.filter((item) => item.territorio) //ignora null
      .forEach((item) => {
        if (!map[item.territorio]) {
          map[item.territorio] = {
            cotas: 0,
            agendamentos: 0,
            cotas_dia1: 0,
            agendamentos_dia1: 0,
          };
        }

        if (item.dia === "D1") {
          map[item.territorio].cotas += Number(item.cotas || 0);
          map[item.territorio].agendamentos += Number(item.agendamentos || 0);
        } else {
          map[item.territorio].agendamentos_dia1 += Number(
            item.agendamentos || 0,
          );
          map[item.territorio].cotas_dia1 += Number(item.cotas || 0);
        }
      });

    return Object.entries(map).map(([territorio, valores]) => ({
      territorio,
      ...valores,
    }));
  }, [dadosPrint]);

  // 🔹 Preparação do Gráfico de Ocupação (D0 e D1 vindos da Query)
  const graficoOcupacao = useMemo(() => {
    const map = {};

    dadosPrint

      ?.filter((item) => item.territorio && item.taxa_perc != null)

      .forEach((item) => {
        if (!map[item.territorio]) {
          map[item.territorio] = { D0: 0, D1: 0 };
        }
        map[item.territorio][item.dia] = Number(item.taxa_perc);
      });

    const categorias = Object.keys(map);

    return {
      categorias,

      series: [
        {
          name: "D0",
          data: categorias.map((t) => map[t]?.D0 || 0),
          data2: categorias.map((t) => map[t]?.D0 || 0),
        },

        {
          name: "D1",
          data: categorias.map((t) => map[t]?.D1 || 0),
        },
      ],
    };
  }, [dadosPrint]);

  useEffect(() => {
    if (!ultimaAtualizacao || !rankingCidades?.total?.length) return;

    const ultimaSalva = localStorage.getItem("ultimaAtualizacao");

    const snapshotAtual = gerarSnapshot(rankingCidades.total);

    // ✅ primeira execução
    if (!ultimaSalva) {
      localStorage.setItem("snapshotAtual", JSON.stringify(snapshotAtual));
      localStorage.setItem("ultimaAtualizacao", ultimaAtualizacao);
      return;
    }

    // ✅ nova atualização
    if (ultimaAtualizacao !== ultimaSalva) {
      console.log("🔄 Nova atualização detectada");

      const snapshotAnterior = localStorage.getItem("snapshotAtual");

      if (snapshotAnterior) {
        localStorage.setItem("snapshotAnterior", snapshotAnterior);
      }

      // ✅ salva novo como atual
      localStorage.setItem("snapshotAtual", JSON.stringify(snapshotAtual));
      localStorage.setItem("ultimaAtualizacao", ultimaAtualizacao);
    }
  }, [ultimaAtualizacao, rankingCidades]);

  const graficoOcupacaoCidades = useMemo(() => {
    const map = {};

    dadosPrintCidades
      ?.filter((item) => item.cidade && item.taxa_perc != null)
      .forEach((item) => {
        if (!map[item.cidade]) {
          map[item.cidade] = { D0: 0, D1: 0 };
        }
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
    return [...dados].sort((a, b) => b.qtd - a.qtd).slice(0, 30);
  }, [dados]);

  const dddData = useMemo(() => {
    const map = {};

    dados.forEach((item) => {
      map[item.ddd] = (map[item.ddd] || 0) + Number(item.qtd || 0);
    });

    return map;
  }, [dados]);

  // backlog por território para gráfico de pizza
  const territorioData = useMemo(() => {
    const map = {};

    dados.forEach((item) => {
      map[item.territorio] =
        (map[item.territorio] || 0) + Number(item.qtd || 0);
    });

    return map;
  }, [dados]);

  const subtrairUmDia = (dataStr) => {
    if (!dataStr) return "";

    const [dataParte, horaParte] = dataStr.split(",");

    const [dia, mes, ano] = dataParte.trim().split("/");

    const data = new Date(
      `${ano}-${mes}-${dia}T${horaParte?.trim() || "00:00:00"}`,
    );

    data.setDate(data.getDate() - 1);

    const dataclear = data.toLocaleDateString("pt-BR").split(", ");

    return dataclear[0];
  };

  return (
    <main className={Style.main} style={{ display: "grid" }}>
      <header
        className={Style.cards}
        style={{
          display: "flex",
          width: "100%",
          justify: "space-around",
          textAlign: "center",
          alignItems: "center",
          fontSize: "11px",
        }}
      >
        <aside className={Style.legenda}>
          <p style={{ color: "#5e5a5a", gap: "5px", fontWeight: "bold" }}>
            Legenda graficos territorios
          </p>

          <div>
            <span style={{ color: "#4e4d4d" }}>
              <BsCircleFill color="#E42B2D" /> CENTRAL
            </span>
            <span style={{ color: "#4e4d4d" }}>
              <BsCircleFill color="#E69138" /> OESTE
            </span>
            <span style={{ color: "#4e4d4d" }}>
              <BsCircleFill color="#F2C516" /> NOROESTE
            </span>
            <span style={{ color: "#4e4d4d" }}>
              <BsCircleFill color="#8A8381" /> SUDESTE
            </span>
            <span style={{ color: "#4e4d4d" }}>
              <BsCircleFill color="#ff0000" /> VALE LITORAL
            </span>
          </div>
          <span style={{ color: "#4e4d4d", gap: "5px" }}>
            <BsClock />
            Ultima atualização {ultimaAtualizacao}
          </span>
        </aside>

        <aside className={Style.legenda2}>
          <div>
            <p style={{ color: "#5e5a5a", gap: "5px", fontWeight: "bold" }}>
              Mapa de ocupação cotas
            </p>
            <span style={{ color: "#4e4d4d" }}>
              CLASSE 1 (Novos Domicílios)
            </span>
            <span style={{ color: "#4e4d4d", gap: "5px" }}>
              <BsClock />
              Ultima janela do dia : {subtrairUmDia(ultimaAtualizacao)}
            </span>
          </div>
          <div className={Style.logoFinal}>
            <ClaroLogo size={50} logo={logo} />
          </div>
        </aside>
      </header>

      <section className={Style.asidePrint}>
        <aside>
          <div>
            <h6>Alta Disponibilidade De Cotas (Alarme / Saldo)</h6>
            <ReactApexChart
              type="bar"
              height={250}
              width={600}
              series={[
                {
                  name: "Cotas",
                  data: rankingMelhores.map((c) => c.valorCotaBarra),
                },
              ]}
              options={{
                chart: {
                  toolbar: {
                    show: true,
                    offsetX: 0,
                    offsetY: -10,
                  },
                },
                yaxis: {
                  min: 0,
                  max:
                    Math.max(...rankingMelhores.map((c) => c.valorCotaBarra)) +
                    6.5,
                  forceNiceScale: false,
                  labels: {
                    formatter: (val) => Math.round(val),
                  },
                },
                xaxis: {
                  categories: rankingMelhores.map((c) =>
                    (c.categoriasEixoX || []).map((nome) =>
                      String(nome)
                        .normalize("NFD")
                        .replace(/[\u0300-\u036f]/g, "")
                        .replace(/\bsao\b/gi, "S")
                        .replace(/\bdo\b/gi, "D")
                        .replace(/\bdos\b/gi, "D")
                        .replace(/\brio\b/gi, "R")
                        .replace(/\bjose\b/gi, "J"),
                    ),
                  ),
                  labels: {
                    rotate: -45,
                    show: true,
                    trim: true,
                    hideOverlappingLabels: true,
                    rotateAlways: true,
                    style: {
                      fontSize: "8px",
                    },
                  },
                },
                colors: rankingMelhores.map(
                  (c) => MAPA_CORES_TERRITORIO[c.territorio],
                ),
                plotOptions: {
                  bar: {
                    columnWidth: "45%", // ↓ diminui largura
                    distributed: true,
                    dataLabels: {
                      position: "top",
                    },
                  },
                },

                dataLabels: {
                  enabled: true,
                  offsetY: -22,
                  style: {
                    fontSize: "9px",
                    fontWeight: "bold",
                    colors: ["#000000"], // texto principal preto
                  },
                  background: {
                    enabled: false,
                  },
                  formatter: function (val, opts) {
                    const i = opts.dataPointIndex;
                    const item = rankingMelhores[i];
                    const dia = item?.diaAtual || "";

                    return `${dia} (${val})`;
                  },
                },
                annotations: {
                  points: rankingMelhores
                    .map((c, index) => {
                      const delta = Number(c.delta || 0);

                      if (delta === 0) return null;

                      const categoria = (c.categoriasEixoX || [])
                        .map((nome) =>
                          String(nome)
                            .normalize("NFD")
                            .replace(/[\u0300-\u036f]/g, "")
                            .replace(/\bsao\b/gi, "S")
                            .replace(/\bdo\b/gi, "D")
                            .replace(/\bdos\b/gi, "D")
                            .replace(/\brio\b/gi, "R")
                            .replace(/\bjose\b/gi, "J"),
                        )
                        .join(" ");

                      return {
                        x: categoria,
                        y: c.valorCotaBarra,
                        marker: {
                          size: 0,
                        },
                        label: {
                          text: delta > 0 ? `+${delta}` : `${delta}`,
                          offsetX: 20,
                          offsetY: -16,
                          borderColor: "transparent",
                          style: {
                            color: delta > 0 ? "#008000" : "#D50000",
                            background: "rgba(255,255,255,0)",
                            fontSize: "8px",
                            fontWeight: 700,
                          },
                        },
                      };
                    })
                    .filter(Boolean),
                },
                legend: { show: false },
              }}
            />

            <h6>Baixa Disponibilidade De Cotas (Alarme / Saldo)</h6>
            <ReactApexChart
              type="bar"
              height={250}
              width={600}
              series={[
                {
                  name: "Cotas",
                  data: rankingPiores.map((c) => c.valorCotaBarra),
                },
              ]}
              options={{
                chart: {
                  toolbar: {
                    show: true,
                    offsetX: 0,
                    offsetY: -10,
                  },
                },
                yaxis: {
                  min: 0,
                  max:
                    Math.max(...rankingPiores.map((c) => c.valorCotaBarra)) +
                    6.5,
                  forceNiceScale: false,

                  labels: {
                    formatter: (val) => Math.round(val),
                  },
                },
                xaxis: {
                  categories: rankingPiores.map((c) =>
                    (c.categoriasEixoX || []).map((nome) =>
                      String(nome)
                        .normalize("NFD")
                        .replace(/[\u0300-\u036f]/g, "")
                        .replace(/\bsao\b/gi, "S")
                        .replace(/\bdo\b/gi, "D")
                        .replace(/\bdos\b/gi, "D")
                        .replace(/\brio\b/gi, "R")
                        .replace(/\bjose\b/gi, "J"),
                    ),
                  ),
                  labels: {
                    rotate: -45,
                    show: true,
                    trim: true,
                    hideOverlappingLabels: true,
                    rotateAlways: true,
                    style: {
                      fontSize: "8px",
                    },
                  },
                },
                colors: rankingPiores.map(
                  (c) => MAPA_CORES_TERRITORIO[c.territorio],
                ),
                plotOptions: {
                  bar: {
                    columnWidth: "45%", // ↓ diminui largura
                    distributed: true,
                    dataLabels: {
                      position: "top",
                    },
                  },
                },

                dataLabels: {
                  enabled: true,
                  offsetY: -22,
                  style: {
                    fontSize: "9px",
                    fontWeight: "bold",
                    colors: ["#000000"], // texto principal preto
                  },
                  background: {
                    enabled: false,
                  },
                  formatter: function (val, opts) {
                    const i = opts.dataPointIndex;
                    const item = rankingPiores[i];
                    const dia = item?.diaAtual || "";

                    return `${dia} (${val})`;
                  },
                },
                annotations: {
                  points: rankingPiores
                    .map((c, index) => {
                      const delta = Number(c.delta || 0);

                      if (delta === 0) return null;

                      const categoria = (c.categoriasEixoX || [])
                        .map((nome) =>
                          String(nome)
                            .normalize("NFD")
                            .replace(/[\u0300-\u036f]/g, "")
                            .replace(/\bsao\b/gi, "S")
                            .replace(/\bdo\b/gi, "D")
                            .replace(/\bdos\b/gi, "D")
                            .replace(/\brio\b/gi, "R")
                            .replace(/\bjose\b/gi, "J"),
                        )
                        .join(" ");

                      return {
                        x: categoria,
                        y: c.valorCotaBarra,
                        marker: {
                          size: 0,
                        },
                        label: {
                          text: delta > 0 ? `+${delta}` : `${delta}`,
                          offsetX: 20,
                          offsetY: -16,
                          borderColor: "transparent",
                          style: {
                            color: delta > 0 ? "#008000" : "#D50000",
                            background: "rgba(145, 76, 76, 0)",
                            fontSize: "9px",
                            fontWeight: 700,
                          },
                        },
                      };
                    })
                    .filter(Boolean),
                },

                legend: { show: false },
              }}
            />
          </div>
        </aside>

        <aside className={Style.graficopizza}>
          <h6>% Ocupação por Território (D0 vs D1)</h6>
          <section className={Style.territorioDisplay}>
            {resumoTerriotrios.map((item) => {
              const taxaD0 = item.agendamentos
                ? (item.cotas / item.agendamentos) * 100
                : 0;

              const taxaD1 = item.agendamentos_dia1
                ? (item.cotas_dia1 / item.agendamentos_dia1) * 100
                : 0;

              const delta = taxaD1 - taxaD0;

              const corStatus =
                delta > 0 ? "#00C853" : delta < 0 ? "#D50000" : "#999";

              return (
                <aside
                  key={item.territorio}
                  style={{
                    borderTop: `5px solid ${
                      MAPA_CORES_TERRITORIO[item.territorio] || "#ccc"
                    }`,
                  }}
                >
                  {/* HEADER */}
                  <div className={Style.headerTerritorio}>
                    <h5>{item.territorio}</h5>

                    <span style={{ color: corStatus }}>
                      {delta > 0
                        ? `↑ +${delta.toFixed(1)}%`
                        : delta < 0
                          ? `↓ ${delta.toFixed(1)}%`
                          : "-"}
                    </span>
                  </div>

                  {/* COTAS */}
                  <div>
                    <span>
                      <MdEventAvailable size={10} /> Cotas
                    </span>
                    <span>{item.cotas}</span>
                    <span>→</span>
                    <span>{item.cotas_dia1}</span>
                  </div>

                  {/* AGENDAMENTO */}
                  <div>
                    <span>
                      {" "}
                      <FaCalendarCheck size={10} /> Agend
                    </span>
                    <span>{item.agendamentos}</span>
                    <span>→</span>
                    <span>{item.agendamentos_dia1}</span>
                  </div>
                </aside>
              );
            })}
          </section>
          <div>
            <ReactApexChart
              type="bar"
              height={200}
              width={650}
              series={graficoOcupacao.series}
              options={{
                xaxis: { categories: graficoOcupacao.categorias },
                fill: {
                  type: "solid",
                  opacity: [1, 1],
                },
                colors: ["#E42B2D", "#960002"],
                plotOptions: {
                  bar: {
                    horizontal: false,
                    columnWidth: "55%",
                    distributed: false,
                  },
                },
                dataLabels: {
                  enabled: true,
                  formatter: (val) => val?.toFixed(1) + "%",
                  style: { fontSize: "9px", colors: ["#ffffff"] },
                  offsetY: -15,
                },
                yaxis: { labels: { formatter: (val) => val + "%" } },
                legend: {
                  show: true,
                  position: "top",
                },
                tooltip: {
                  shared: true,
                  intersect: false,
                },
              }}
            />
          </div>
          <div>
            <h6>% Ocupação por CIDADES (D0 vs D1) Top Cidade por DDD </h6>
            <ReactApexChart
              type="bar"
              height={250}
              width={650}
              series={graficoOcupacaoCidades.series}
              options={{
                colors: ["#E42B2D", "#960002"],
                fill: {
                  type: "solid",
                  opacity: [1, 1],
                },
                xaxis: {
                  categories: graficoOcupacaoCidades.categorias.map((c) => {
                    return c.includes("|")
                      ? c.split("|").map((s) =>
                          s
                            .trim()
                            .normalize("NFD")
                            .replace(/[\u0300-\u036f]/g, "")
                            .replace(/\bdo\b/gi, "D")
                            .replace(/\bdos\b/gi, "D")
                            .replace(/\bjose\b/gi, "J"),
                        )
                      : c.trim();
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
                    columnWidth: "85%",
                    distributed: false,
                  },
                },

                dataLabels: {
                  enabled: true,
                  formatter: (val) => val?.toFixed(1) + "%",
                  style: { fontSize: "8px", colors: ["#ffffff"] },
                  offsetY: 5,
                },
                yaxis: { labels: { formatter: (val) => val + "%" } },
                legend: { show: true, position: "top" },
              }}
            />
          </div>
        </aside>
      </section>

      <section className={Style.backlog}>
        <div>
          <h3>Top 30 Cidades (Backlog)</h3>
          <ReactApexChart
            type="bar"
            height={600}
            width={1300}
            series={[{ data: topCidades.map((c) => c.qtd) }]}
            options={{
              xaxis: {
                categories: topCidades.map((c) => {
                  const nome = c.cidade?.includes("|")
                    ? c.cidade.split("|").join(" / ")
                    : c.cidade;

                  return nome.length > 100
                    ? nome.substring(0, 100) + "..."
                    : nome;
                }),
                position: "top",
              },

              colors: rankingMelhores.map(
                (c) => MAPA_CORES_TERRITORIO[c.territorio],
              ),
              dataLabels: {
                enabled: true,
                formatter: (val) => val?.toFixed(1),

                style: {
                  fontSize: "10px",
                  fontWeight: 700,
                  colors: ["#bd0202"],
                },

                background: {
                  enabled: true,
                  foreColor: "#ffffff",
                  borderRadius: 4,
                  padding: 4,
                  opacity: 0.95,
                  borderWidth: 0,
                  borderColor: "transparent",
                },

                offsetX: 50,
                offsetY: 0,
              },
              plotOptions: {
                bar: {
                  horizontal: true,
                  barHeight: "55%",
                  distributed: true,
                },
              },
              legend: { show: false, position: "top" },
            }}
          />
        </div>
        {admin && (
          <>
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
          </>
        )}
      </section>
    </main>
  );
}
