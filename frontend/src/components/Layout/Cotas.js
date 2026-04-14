import React, { useEffect, useState, useCallback, Suspense } from "react";
import axios from "axios";
import Style from "./Cotas.module.css";
import MiniSparkline from "../Tools/MiniSparkline";
import { BsCircleFill } from "react-icons/bs";
import ClaroLogo from "../Item-Layout/ClaroLogo";
import logo from "../IMG/claroLogo.webp";

// Lazy Load do Clima para performance
const WeatherInfo = React.lazy(() => import("../Tools/WeatherInfo"));

export default function PainelBucketsPivot() {
  const [dados, setDados] = useState([]);
  const [dias, setDias] = useState([]);

  const [loading, setLoading] = useState(true);

  const [cidadeFiltro, setCidadeFiltro] = useState("TODAS");
  const [territorioFiltro, setTerritorioFiltro] = useState("TODAS");
  const [segmentoFiltro, setSegmentoFiltro] = useState("TODOS");
  const [dddFiltro, setdddFiltro] = useState("TODOS");
  const [search, setSearch] = useState("");

  const Url = process.env.REACT_APP_API_URL || "http://localhost:8000";
  const apiKey = process.env.REACT_APP_APITEMPO;

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
    if (!diasData) return "Sem dados";
    const alarme = {
      D1: "24H",
      D2: "24H",
      D3: "48H",
      D4: "72H",
      D5: "96H",
      D6: ">96H",
    };
    for (const dia of listaDiasOrdenados) {
      if (diasData[dia]?.saldo > 1) return alarme[dia] || ">96H";
    }
    return "Esgotado";
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
    });

  const cidadesFiltradas = React.useMemo(() => {
    return Array.from(
      new Set(dadosFiltrados.map((i) => i.cidade).filter(Boolean)),
    ).sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [dadosFiltrados]);

  const territoriosFiltrados = React.useMemo(() => {
    return Array.from(
      new Set(dadosFiltrados.map((i) => i.territorio).filter(Boolean)),
    ).sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [dadosFiltrados]);

  const segmentosFiltrados = React.useMemo(() => {
    return Array.from(
      new Set(dadosFiltrados.map((i) => i.mercado).filter(Boolean)),
    ).sort((a, b) => a.localeCompare(b, "pt-BR"));
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

  return (
    <main className={Style.main}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          flexDirection: "column",
          alignItems: "start",
          marginBottom: "5px",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            textAlign: "center",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            gap: "5px",
          }}
        >
          <h2>Cotas por Cidade</h2>
          <ClaroLogo logo={logo} />
        </div>
        <p style={{ color: "#4e4d4d" }}>CLASSE 1 (Novos Domicílios)</p>
      </div>

      <div className={Style.filtros}>
        <div>
          <label>Cidade: </label>
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
          <label>Pesquisar: </label>
          <input
            type="text"
            placeholder="Buscar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div>
          <label>Territorio: </label>
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
          <label>Segmento: </label>
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
          <label>DDD: </label>
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

        <button className={Style.btnClear} onClick={handleResetFilters}>
          Limpar Filtros
        </button>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space_around",
          gap: "20px",
          marginBottom: "10px",
        }}
      >
        <p style={{ color: "#4e4d4d" }}>Legenda</p>

        <span>
          <BsCircleFill color="#5cb85c" /> Cotas
        </span>
        <span>
          <BsCircleFill color="#d9534f" /> Agendamento
        </span>
      </div>

      {loading ? (
        <p>Carregando painel...</p>
      ) : (
        <div className={Style["table-container"]}>
          <table>
            <thead>
              <tr>
                <th>Cidade</th>
                <th>TERRITORIO</th>
                <th>Alarme Agenda</th>
                <th>Escala</th>
                <th>backlog</th>
                {dias.map((dia) => (
                  <th key={dia} colSpan={3}>
                    {dia}
                  </th>
                ))}
              </tr>
              <tr>
                <th></th>
                <th></th>
                <th></th>
                <th></th>
                <th></th>
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
                const status = SearchCotas(item.dias, dias);
                return (
                  <tr key={idx}>
                    <td className={Style.city}>
                      <div style={{ fontWeight: "bold" }}>
                        {item.cidade.replace(/[|/-]/g, ", ")}
                      </div>
                      <Suspense fallback={<small>...</small>}>
                        <WeatherInfo cidade={item.cidade} apiKey={apiKey} />
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
                          <td className={pClass}>{d?.taxa_ocupacao ?? 0}%</td>
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
