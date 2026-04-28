import React, {
  useEffect,
  useState,
  useCallback,
  Suspense,
  useMemo,
} from "react";
import axios from "axios";
import Style from "./Cotas.module.css";
import MiniSparkline from "../Tools/MiniSparkline";
import { BsCircleFill, BsEyeFill, BsEyeSlashFill } from "react-icons/bs";
import ClaroLogo from "../Item-Layout/ClaroLogo";
import logo from "../IMG/claroLogo.webp";
import { useRef } from "react";
import DashboardAnalytics from "./DashCotas";
import Loading from "../Item-Layout/Loading";
import { ImportarCotas } from "../Tools/importarCotasCop";

// Lazy Load do Clima para performance
const WeatherInfo = React.lazy(() => import("../Tools/WeatherInfo"));

//const WeatherInfoFeatures = React.lazy(
//  () => import("../Tools/WeatherInfoFeatures"),
//);

export default function PainelBucketsPivot() {
  const [dados, setDados] = useState([]);
  const [dias, setDias] = useState([]);
  const tableRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [cidadeFiltro, setCidadeFiltro] = useState("TODAS");
  const [territorioFiltro, setTerritorioFiltro] = useState("TODAS");
  const [alarmeFiltro, setAlarmeFiltro] = useState("TODOS");
  const [segmentoFiltro, setSegmentoFiltro] = useState("TODOS");
  const [dddFiltro, setdddFiltro] = useState("TODOS");
  const [search, setSearch] = useState("");
  const [handleCotas, setHandleCotas] = useState(false);
  const [hidden, setHidden] = useState(0);

  const Url = process.env.REACT_APP_API_URL || "http://localhost:8000";

  const CACHE_KEY = "cotas_painel_cache";
  const CACHE_TIME = 5 * 60 * 1000; // 5 Minutos

  const ultimaAtualizacao = React.useMemo(() => {
    if (!dados || dados.length === 0) return null;

    return dados
      .map((item) => item.data_ref)
      .filter(Boolean)
      .sort((a, b) => new Date(b) - new Date(a))[0];
  }, [dados]);
  // Função para processar os dados e organizar os filtros
  const organizarDados = useCallback(
    (lista) => {
      const diasUnicos = Array.from(
        new Set(lista.flatMap((item) => Object.keys(item.dias || {}))),
      ).sort((a, b) => Number(a.replace("D", "")) - Number(b.replace("D", "")));

      setDados(
        lista.sort((a, b) =>
          String(a.territorio || "").localeCompare(
            String(b.territorio || ""),
            "pt-BR",
          ),
        ),
      );
      setDias(diasUnicos);
      ImportarCotas(Url, ultimaAtualizacao);
    },
    [setDias, setDados, Url, ultimaAtualizacao],
  );

  const addDaysAndFormat = (baseDate, daysToAdd) => {
    if (!baseDate) return "--";
    const parseBRDate = (dateStr) => {
      if (!dateStr) return null;

      const [day, month, year] = dateStr.split("/");
      return new Date(year, month - 1, day);
    };

    // Dia da semana (segunda-feira, terça-feira, etc.)

    // Remove a hora → "15/04/2026"
    const dateOnly = baseDate.split(",")[0];

    const d = parseBRDate(dateOnly);
    if (!d || isNaN(d)) return "--";

    d.setDate(d.getDate() + daysToAdd);

    if (daysToAdd >= 2) {
      const texto = daysToAdd * 24;
      const diaSemana = d.toLocaleDateString("pt-BR", { weekday: "long" });
      return (
        d.toLocaleDateString("pt-BR") +
        ` ${texto}H  ${diaSemana.replace("-feira", "")}`
      ); // MM/DD/YYYY
    } else {
      const texto = "24H";
      const diaSemana = d.toLocaleDateString("pt-BR", { weekday: "long" });

      return (
        d.toLocaleDateString("pt-BR") +
        ` ${texto} ${diaSemana.replace("-feira", "")}`
      ); // MM/DD/YYYY
    }
  };

  // Função de Carregamento com Lógica de Cache
  const fetchDados = useCallback(
    async (forcarAtualizacao = false) => {
      setLoading(true);

      const cache = localStorage.getItem(CACHE_KEY);
      if (!forcarAtualizacao && cache) {
        const { timestamp, data } = JSON.parse(cache);
        if (Date.now() - timestamp < CACHE_TIME) {
          organizarDados(data);
          setLoading(false);
          return;
        }
      }

      try {
        const res = await axios.get(`${Url}/neon/cotas-cop`);
        const lista = Object.values(res.data || {});

        localStorage.setItem(
          CACHE_KEY,
          JSON.stringify({ timestamp: Date.now(), data: lista }),
        );
        organizarDados(lista);
      } catch (e) {
        console.error("Erro ao carregar dados:", e);
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [Url, organizarDados],
  );

  useEffect(() => {
    fetchDados();
  }, [fetchDados]);

  const SearchCotas = (diasData, listaDiasOrdenados) => {
    if (!diasData) {
      return {
        status: "Sem dados",
        alarme: null,
      };
    }

    const alarme = {
      D1: { label: "24H", qtd: 0 },
      D2: { label: "24H", qtd: 0 },
      D3: { label: "48H", qtd: 0 },
      D4: { label: "72H", qtd: 0 },
      D5: { label: "96H", qtd: 0 },
      D6: { label: ">96H", qtd: 0 },
    };

    let status = ">96H";

    for (const dia of listaDiasOrdenados) {
      if (diasData[dia]?.saldo > 1 && alarme[dia]) {
        alarme[dia].qtd += 1;
        status = alarme[dia].label;
        break;
      }
    }

    return { status, alarme };
  };

  const dadosFiltrados = dados
    .filter((item) => cidadeFiltro === "TODAS" || item.cidade === cidadeFiltro)
    .filter(
      (item) =>
        territorioFiltro === "TODAS" || item.territorio === territorioFiltro,
    )
    .filter((item) => dddFiltro === "TODOS" || item.ddd === dddFiltro)
    .filter(
      (item) => segmentoFiltro === "TODOS" || item.mercado === segmentoFiltro,
    )
    .filter((item) => {
      const termo = search.toUpperCase().trim();
      return (
        item.cidade.toUpperCase().includes(termo) ||
        item.mercado.toUpperCase().includes(termo)
      );
    })
    .filter((item) => {
      if (alarmeFiltro === "TODOS") return true;

      const resultado = SearchCotas(item.dias, dias);
      return resultado.status === alarmeFiltro;
    });

  const resumoAlarmes = React.useMemo(() => {
    const total = {
      "24H": 0,
      "48H": 0,
      "72H": 0,
      "96H": 0,
      ">96H": 0,
    };

    dadosFiltrados.forEach((item) => {
      const resultado = SearchCotas(item.dias, dias);

      if (resultado?.status && total[resultado.status] !== undefined) {
        total[resultado.status] += 1;
      }
    });

    return total;
  }, [dadosFiltrados, dias]);

  const cidadesFiltradas = React.useMemo(() => {
    return Array.from(
      new Set(
        dadosFiltrados
          .map((i) => i.cidade)
          .filter(Boolean)
          .flatMap((cidade) =>
            String(cidade)
              .split("|")
              .map((c) => c.trim())
              .filter(Boolean),
          ),
      ),
    ).sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [dadosFiltrados]);

  const territoriosFiltrados = React.useMemo(() => {
    return Array.from(
      new Set(dadosFiltrados.map((i) => i.territorio).filter(Boolean)),
    ).sort((a, b) => String(a).localeCompare(String(b), "pt-BR"));
  }, [dadosFiltrados]);

  const segmentosFiltrados = React.useMemo(() => {
    return Array.from(
      new Set(dadosFiltrados.map((i) => i.mercado).filter(Boolean)),
    ).sort((a, b) => String(a).localeCompare(String(b), "pt-BR"));
  }, [dadosFiltrados]);

  const dddFiltrados = React.useMemo(() => {
    return Array.from(
      new Set(dadosFiltrados.map((i) => i.ddd).filter(Boolean)),
    ).sort();
  }, [dadosFiltrados]);

  const backlogTotal = React.useMemo(
    () => dadosFiltrados.reduce((total, item) => total + Number(item.qtd), 0),
    [dadosFiltrados],
  );

  const totalSemAgenda = useMemo(
    () =>
      dadosFiltrados.reduce(
        (total, item) => total + Number(item.sem_agenda),
        0,
      ),
    [dadosFiltrados],
  );

  const totalAgendaFutura = useMemo(
    () =>
      dadosFiltrados.reduce(
        (total, item) => total + Number(item.agenda_futura),
        0,
      ),
    [dadosFiltrados],
  );

  const totalRota = useMemo(
    () => dadosFiltrados.reduce((total, item) => total + Number(item.rota), 0),
    [dadosFiltrados],
  );

  function handleResetFilters(search) {
    setCidadeFiltro("TODAS");
    setTerritorioFiltro("TODAS");
    setSegmentoFiltro("TODOS");
    if (!search) {
      setSearch("");
    }
    setdddFiltro("TODOS");
    setAlarmeFiltro("TODOS");
  }
  // Função para exportar um HTML estático limpo da tabela filtrada
  const handleDownloadHTML = () => {
    if (!tableRef.current) return;

    // Busca apenas a tabela dentro da ref principal
    const tableElement = tableRef.current.querySelector("table");
    if (!tableElement) return;

    const tableHTML = tableElement.outerHTML;

    // Cria um HTML estático envelopando a tabela e aplicando um CSS básico
    const htmlCompleto = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <title>Relatório de Cotas P&P</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
          h2 { text-align: center; color: #e3000f; /* Cor padrão Claro */ }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: center; }
          th { background-color: #f4f4f4; font-weight: bold; }
          .city { text-align: left; font-weight: bold; }
        </style>
      </head>
      <body>
        <h2>Relatório de Cotas - Filtros Atuais</h2>
        <p><strong>Filtros aplicados:</strong> Cidade: ${cidadeFiltro} | Território: ${territorioFiltro} | Alarme: ${alarmeFiltro}</p>
        ${tableHTML}
      </body>
      </html>
    `;

    const blob = new Blob([htmlCompleto], { type: "text/html;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Relatorio_Cotas_${new Date().toISOString().slice(0, 10)}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Função para exportar nativamente para Excel (CSV compatível)
  const handleDownloadExcel = () => {
    // 1. Montar Cabeçalhos
    let colunas = [
      "Cidade",
      "Territorio",
      "Alarme Agenda",
      "Escala Tecnica",
      "Backlog Total",
    ];

    if (hidden) {
      colunas.push("Sem Agenda", "Agenda Futura", "Rota");
    }

    dias.forEach((dia, index) => {
      const dataLabel = addDaysAndFormat(ultimaAtualizacao, index);
      colunas.push(
        `${dataLabel} - Cotas`,
        `${dataLabel} - Agendado`,
        `${dataLabel} - % Ocupacao`,
      );
    });

    let csvContent = colunas.join(";") + "\n"; // Usando ponto e vírgula para separar (padrão Excel PT-BR)

    // 2. Montar Linhas com os dados filtrados
    dadosFiltrados.forEach((item) => {
      const status = SearchCotas(item.dias, dias).status;

      // Envelopa os textos em aspas para evitar quebra de colunas caso haja ponto e vírgula na string
      let linha = [
        `"${item.cidade.replace(/[|/-]/g, ", ")}"`,
        `"${item.territorio}"`,
        `"${status}"`,
        `"${item.escala_tecnica}"`,
        `"${item.qtd || 0}"`,
      ];

      if (hidden) {
        linha.push(
          `"${item.sem_agenda || 0}"`,
          `"${item.agenda_futura || 0}"`,
          `"${item.rota || 0}"`,
        );
      }

      dias.forEach((dia) => {
        const d = item.dias[dia];
        linha.push(
          `"${d?.saldo || 0}"`,
          `"${d?.qtd_os || 0}"`,
          `"${d?.taxa_ocupacao || 0}%"`,
        );
      });

      csvContent += linha.join(";") + "\n";
    });

    // 3. Gerar o Blob. O "\uFEFF" é o BOM (Byte Order Mark) que garante que o Excel leia UTF-8 e não quebre os acentos
    const blob = new Blob(["\uFEFF" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Dados_Cotas_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  const totaisPorDia = React.useMemo(() => {
    const totais = {};

    dias.forEach((dia) => {
      totais[dia] = {
        cotas: 0,
        agendado: 0,
      };
    });

    dadosFiltrados.forEach((item) => {
      dias.forEach((dia) => {
        const d = item.dias?.[dia];

        if (d) {
          totais[dia].cotas += Number(d.saldo || 0);
          totais[dia].agendado += Number(d.qtd_os || 0);
        }
      });
    });

    return totais;
  }, [dadosFiltrados, dias]);

  return (
    <main className={Style.main} ref={tableRef}>
      <button onClick={() => setHandleCotas((prev) => !prev)}>
        {handleCotas ? "relatorio" : "tabela"}
      </button>
      {!!handleCotas ? (
        <DashboardAnalytics dados={dadosFiltrados} dias={dias} />
      ) : (
        <>
          <div className={Style.filtros}>
            <div>
              <label>Cidade {cidadesFiltradas.length}</label>
              <select
                value={cidadeFiltro}
                onChange={(e) => setCidadeFiltro(e.target.value)}
              >
                <option value="TODAS">Todas</option>
                {cidadesFiltradas.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label>Pesquisar</label>
              <input
                type="text"
                placeholder="Buscar..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  handleResetFilters(true);
                }}
              />
            </div>
            <div>
              <label>Territorio {territoriosFiltrados.length}</label>
              <select
                value={territorioFiltro}
                onChange={(e) => setTerritorioFiltro(e.target.value)}
              >
                <option value="TODAS">Todas</option>
                {territoriosFiltrados.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label>Segmento {segmentosFiltrados.length}</label>
              <select
                value={segmentoFiltro}
                onChange={(e) => setSegmentoFiltro(e.target.value)}
              >
                <option value="TODOS">Todos</option>
                {segmentosFiltrados.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label>DDD {dddFiltrados.length}</label>
              <select
                value={dddFiltro}
                onChange={(e) => setdddFiltro(e.target.value)}
              >
                <option value="TODOS">Todos</option>
                {dddFiltrados.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label>Alarme</label>
              <select
                value={alarmeFiltro}
                onChange={(e) => setAlarmeFiltro(e.target.value)}
              >
                <option value="TODOS">Todos</option>
                <option value="24H">24H</option>
                <option value="48H">48H</option>
                <option value="72H">72H</option>
                <option value="96H">96H</option>
                <option value=">96H">&gt;96H</option>
              </select>
            </div>

            <button
              className={Style.btnClear}
              onClick={() => handleResetFilters(false)}
            >
              Limpar Filtros
            </button>
            <button className={Style.btnClear} onClick={handleDownloadExcel}>
              Download HTML
            </button>
          </div>
          <div
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
              <p style={{ color: "#4e4d4d", gap: "5px" }}>Legenda</p>

              <span style={{ color: "#4e4d4d", gap: "5px" }}>
                <BsCircleFill color="#5cb85c" /> Cotas
              </span>
              <span style={{ color: "#4e4d4d", gap: "5px" }}>
                <BsCircleFill color="#d9534f" /> Agendamento
              </span>
              <span
                style={{
                  display: "flex",
                  justifyContent: "space_around",
                  flexDirection: "row",
                  gap: "20px",
                  marginBottom: "10px",
                  fontSize: "11px",
                  textAlign: "end",
                  alignItems: "end",
                }}
              >
                Ultima atualização {ultimaAtualizacao}
              </span>
            </aside>

            <aside className={Style.cardAlarme}>
              <h4>Alarmes Cidades</h4>
              <aside>
                {Object.entries(resumoAlarmes).map(([label, qtd]) => (
                  <div
                    key={label}
                    style={{
                      backgroundColor:
                        label === "24H"
                          ? "#40960f83"
                          : label === "48H"
                            ? "#d1dd2562"
                            : "#e92f2f79",
                      fontWeight: "bold",
                      color: "#333",
                    }}
                  >
                    <span>{label}</span>
                    <strong>{qtd}</strong>
                  </div>
                ))}
              </aside>
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
                <h2>Cotas por Cidade</h2>
                <span style={{ color: "#4e4d4d", fontSize: "12px" }}>
                  CLASSE 1 (Novos Domicílios)
                </span>
              </div>
              <div>
                <ClaroLogo size={50} logo={logo} />
              </div>
            </aside>
          </div>
          {loading || dadosFiltrados?.length <= 0 ? (
            <>
              <Loading />
              <p style={{ textAlign: "center" }}>Atualizando painel...</p>
            </>
          ) : (
            <div className={Style["table-container"]}>
              <table className={`${hidden ? Style.hidden : ""}`}>
                <thead>
                  <tr>
                    <th>Cidade</th>
                    <th>Territorio</th>
                    <th>Alarme Agenda</th>
                    <th>Escala Tecnica</th>
                    <th className={Style.btnHidden}>
                      <h4>Backlog</h4>
                      <button
                        className={Style.btnHidden}
                        onClick={() => setHidden((prev) => !prev)}
                      >
                        {hidden ? <BsEyeSlashFill /> : <BsEyeFill />}
                      </button>
                    </th>
                    {!!hidden && (
                      <>
                        <th>Sem Agenda</th>
                        <th>Agenda Futura</th>
                        <th>rota</th>
                      </>
                    )}
                    {dias.map((dia, index) => (
                      <th key={dia} colSpan={3}>
                        {addDaysAndFormat(ultimaAtualizacao, index)}
                      </th>
                    ))}
                  </tr>

                  <tr>
                    <th></th>
                    <th></th>
                    <th></th>
                    <th></th>
                    <th>Total {backlogTotal}</th>

                    {!!hidden && (
                      <>
                        <th>Total {totalSemAgenda}</th>
                        <th>Total {totalAgendaFutura}</th>
                        <th>Total {totalRota}</th>
                      </>
                    )}
                    {dias.map((dia) => (
                      <React.Fragment key={dia}>
                        <th>Cotas {totaisPorDia[dia]?.cotas}</th>
                        <th>Vol Agendado {totaisPorDia[dia]?.agendado}</th>
                        <th>% Ocupação</th>
                      </React.Fragment>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {dadosFiltrados.map((item, idx) => {
                    const status = SearchCotas(item.dias, dias).status;

                    return (
                      <tr key={idx}>
                        <td className={Style.city}>
                          <div style={{ fontWeight: "bold" }}>
                            {item.cidade.replace(/[|/-]/g, ", ")}
                          </div>
                          <Suspense fallback={<small>...</small>}>
                            <WeatherInfo cidade={item.cidade} />
                          </Suspense>
                          <MiniSparkline dias={item.dias} />
                        </td>
                        <td>{item.territorio}</td>
                        <td
                          style={{
                            backgroundColor:
                              status === "24H"
                                ? "#40960f83"
                                : status === "48H"
                                  ? "#d1dd2562"
                                  : "#e92f2f79",
                            fontWeight: "bold",
                            color: "#333",
                          }}
                        >
                          {status}
                        </td>

                        <td>{item.escala_tecnica}</td>
                        <td>{item.qtd || 0}</td>
                        {!!hidden && (
                          <>
                            <td>{item.sem_agenda ?? 0}</td>
                            <td>{item.agenda_futura ?? 0}</td>
                            <td>{item.rota ?? 0}</td>
                          </>
                        )}
                        {dias.map((dia) => {
                          const d = item.dias[dia];
                          const pClass =
                            d?.taxa_ocupacao > 100
                              ? Style["percent-danger"]
                              : d?.taxa_ocupacao > 80
                                ? Style["percent-warning"]
                                : Style["percent-normal"];
                          return (
                            <React.Fragment key={dia}>
                              <td>{d?.saldo ?? 0}</td>
                              <td>{d?.qtd_os ?? 0}</td>
                              <td className={pClass}>
                                {d?.taxa_ocupacao ?? 0}%{" "}
                              </td>
                            </React.Fragment>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}{" "}
        </>
      )}
    </main>
  );
}
