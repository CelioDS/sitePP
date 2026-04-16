import React, { useEffect, useState, useCallback, Suspense } from "react";
import axios from "axios";
import Style from "./Cotas.module.css";
import MiniSparkline from "../Tools/MiniSparkline";
import { BsCircleFill } from "react-icons/bs";
import ClaroLogo from "../Item-Layout/ClaroLogo";
import logo from "../IMG/claroLogo.webp";
import { useRef } from "react";

// Lazy Load do Clima para performance
const WeatherInfo = React.lazy(() => import("../Tools/WeatherInfo"));
const WeatherInfoFeatures = React.lazy(
  () => import("../Tools/WeatherInfoFeatures"),
);

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

  const Url = process.env.REACT_APP_API_URL || "http://localhost:8000";

  const CACHE_KEY = "cotas_painel_cache";
  const CACHE_TIME = 5 * 60 * 1000; // 5 Minutos

  // Função para processar os dados e organizar os filtros
  const organizarDados = useCallback(
    (lista) => {
      const diasUnicos = Array.from(
        new Set(lista.flatMap((item) => Object.keys(item.dias || {}))),
      ).sort((a, b) => Number(a.replace("D", "")) - Number(b.replace("D", "")));

      setDados(
        lista.sort((a, b) => a.territorio.localeCompare(b.territorio, "pt-BR")),
      );
      setDias(diasUnicos);
    },
    [setDias, setDados],
  );

  const ultimaAtualizacao = React.useMemo(() => {
    if (!dados || dados.length === 0) return null;

    return dados
      .map((item) => item.data_ref)
      .filter(Boolean)
      .sort((a, b) => new Date(b) - new Date(a))[0];
  }, [dados]);

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
      return d.toLocaleDateString("pt-BR") + ` ${texto}H  ${diaSemana.replace("-feira",'')}`; // MM/DD/YYYY
    } else {
      const texto = "24H";
      const diaSemana = d.toLocaleDateString("pt-BR", { weekday: "long" });

      return d.toLocaleDateString("pt-BR") + ` ${texto} ${diaSemana.replace("-feira",'')}`; // MM/DD/YYYY
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
        const res = await axios.get(`${Url}/cotas-cop`);
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
      const termo = search.toUpperCase();
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
      new Set(dadosFiltrados.map((i) => i.cidade).filter(Boolean)),
    ).sort((a, b) => String(a).localeCompare(String(b), "pt-BR"));
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

  function handleResetFilters() {
    setCidadeFiltro("TODAS");
    setTerritorioFiltro("TODAS");
    setSegmentoFiltro("TODOS");
    setdddFiltro("TODOS");
    setSearch("");
  }

  const handleDownloadHTML = () => {
    const htmlCompleto = document.documentElement.outerHTML;

    const blob = new Blob([htmlCompleto], { type: "text/html;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `P&P-cotas-${new Date().toISOString().slice(0, 10)}.html`;

    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <main className={Style.main} ref={tableRef}>
      <div className={Style.filtros}>
        <div>
          <label>Cidade</label>
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
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div>
          <label>Territorio</label>
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
          <label>Segmento</label>
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
          <label>DDD</label>
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

        <button className={Style.btnClear} onClick={handleResetFilters}>
          Limpar Filtros
        </button>
        <button className={Style.btnClear} onClick={handleDownloadHTML}>
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

        {/*

        <aside className={Style.card}>
          <label htmlFor="Check">Check Admin</label>
          <div>
            <label htmlFor="ddd">ddd</label>
            <span>{dddFiltrados.length}</span>
          </div>
          <div>
            <label htmlFor="cidade">Cidade</label>
            <span>{cidadesFiltradas.length}</span>
          </div>
          <div>
            <label htmlFor="territorio">Territorio</label>
            <span>{territoriosFiltrados.length}</span>
          </div>
          <div>
            <label htmlFor="segmento">Segmento</label>
            <span>{segmentosFiltrados.length}</span>
          </div>
        </aside>*/}

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

      {loading || dadosFiltrados?.length === 0 ? (
        <p>Carregando painel...</p>
      ) : (
        <div className={Style["table-container"]}>
          <table>
            <thead>
              <tr>
                <th>Cidade</th>
                <th>Territorio</th>
                <th>Alarme Agenda</th>
                <th>Escala Tecnica</th>
                <th></th>
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
                <th>Backlog</th>
                {dias.map((dia) => (
                  <React.Fragment key={dia}>
                    <th>Cotas</th>
                    <th>Vol Agendado</th>
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
                    <td>{item.qtd}</td>
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
                          <td className={pClass}>{d?.taxa_ocupacao ?? 0}% </td>
                        </React.Fragment>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
