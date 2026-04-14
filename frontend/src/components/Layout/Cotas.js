import React, { useEffect, useState, useCallback, Suspense } from "react";
import axios from "axios";
import Style from "./Cotas.module.css";

// Lazy Load do Clima para performance
const WeatherInfo = React.lazy(() => import("../Tools/WeatherInfo"));

export default function PainelBucketsPivot() {
  const [dados, setDados] = useState([]);
  const [dias, setDias] = useState([]);
  const [cidades, setCidades] = useState([]);
  const [segmentos, setSegmentos] = useState([]);
  const [loading, setLoading] = useState(true);

  const [cidadeFiltro, setCidadeFiltro] = useState("TODAS");
  const [segmentoFiltro, setSegmentoFiltro] = useState("TODOS");
  const [search, setSearch] = useState("");

  const Url = process.env.REACT_APP_API_URL || "http://localhost:8000";
  const apiKey = process.env.REACT_APP_APITEMPO;
  
  const CACHE_KEY = "cotas_painel_cache";
  const CACHE_TIME = 5 * 60 * 1000; // 5 Minutos

  // Função para processar os dados e organizar os filtros
  const organizarDados = useCallback((lista) => {
    const diasUnicos = Array.from(
      new Set(lista.flatMap((item) => Object.keys(item.dias || {})))
    ).sort((a, b) => Number(a.replace("D", "")) - Number(b.replace("D", "")));

    const cidadesUnicas = Array.from(new Set(lista.map((item) => item.cidade)))
      .sort((a, b) => a.localeCompare(b, "pt-BR"));

    const segmentosUnicos = Array.from(new Set(lista.map((item) => item.mercado)))
      .sort((a, b) => a.localeCompare(b, "pt-BR"));

    setDados(lista);
    setDias(diasUnicos);
    setCidades(cidadesUnicas);
    setSegmentos(segmentosUnicos);
  }, []);

  // Função de Carregamento com Lógica de Cache
  const fetchDados = useCallback(async (forcarAtualizacao = false) => {
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
      
      localStorage.setItem(CACHE_KEY, JSON.stringify({ timestamp: Date.now(), data: lista }));
      organizarDados(lista);
    } catch (e) {
      console.error("Erro ao carregar dados:", e);
    } finally {
      setLoading(false);
    }
  }, [Url, organizarDados]);

  useEffect(() => {
    fetchDados();
  }, [fetchDados]);

  const SearchCotas = (diasData, listaDiasOrdenados) => {
    if (!diasData) return "Sem dados";
    const alarme = { D1: "24H", D2: "24H", D3: "48H", D4: "72H", D5: "96H", D6: ">96H" };
    for (const dia of listaDiasOrdenados) {
      if (diasData[dia]?.saldo > 0) return alarme[dia] || dia;
    }
    return "Esgotado";
  };

  const dadosFiltrados = dados
    .filter(item => cidadeFiltro === "TODAS" || item.cidade === cidadeFiltro)
    .filter(item => segmentoFiltro === "TODOS" || item.mercado === segmentoFiltro)
    .filter(item => {
      const termo = search.toUpperCase();
      return item.cidade.toUpperCase().includes(termo) || item.mercado.toUpperCase().includes(termo);
    });

  return (
    <main className={Style.main}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Painel COP – Cotas por Cidade</h2>
        <button onClick={() => fetchDados(true)} className={Style.btnRefresh}>
          {loading ? "..." : "🔄 Atualizar"}
        </button>
      </div>

      <div className={Style.filtros}>
        <div>
          <label>Cidade: </label>
          <select value={cidadeFiltro} onChange={(e) => setCidadeFiltro(e.target.value)}>
            <option value="TODAS">Todas</option>
            {cidades.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label>Segmento: </label>
          <select value={segmentoFiltro} onChange={(e) => setSegmentoFiltro(e.target.value)}>
            <option value="TODOS">Todos</option>
            {segmentos.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label>Pesquisar: </label>
          <input type="text" placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {loading ? <p>Carregando painel...</p> : (
        <div className={Style["table-container"]}>
          <table>
            <thead>
              <tr>
                <th>Cidade</th>
                <th>Segmento</th>
                <th>Alarme Agenda</th>
                {dias.map(dia => <th key={dia} colSpan={3}>{dia}</th>)}
              </tr>
              <tr>
                <th></th><th></th><th></th>
                {dias.map(dia => (
                  <React.Fragment key={dia}>
                    <th>Cota</th><th>OS</th><th>%</th>
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
                      <div style={{ fontWeight: 'bold' }}>{item.cidade.replace(/[|/-]/g, ", ")}</div>
                      <Suspense fallback={<small>...</small>}>
                        <WeatherInfo cidade={item.cidade} apiKey={apiKey} />
                      </Suspense>
                    </td>
                    <td>{item.mercado}</td>
                    <td style={{ 
                      backgroundColor: status === "24H" ? "#40960f83" : status === "48H" ? "#d1dd2562" : "#e92f2f79",
                      fontWeight: "bold", color: "#333"
                    }}>{status}</td>
                    {dias.map(dia => {
                      const d = item.dias[dia];
                      const pClass = d?.taxa_ocupacao > 100 ? Style["percent-danger"] : 
                                     d?.taxa_ocupacao > 80 ? Style["percent-warning"] : Style["percent-normal"];
                      return (
                        <React.Fragment key={dia}>
                          <td>{d?.qtd_os ?? 0}</td>
                          <td>{d?.saldo ?? 0}</td>
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