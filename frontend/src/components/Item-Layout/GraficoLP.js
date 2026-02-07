import LoadingSvg from "./Loading";
import Style from "./GraficoLP.module.css";
import { useMemo, useState, useEffect } from "react";
import { toast } from "react-toastify";
import axios from "axios";
import ValidarToken from "../Tools/ValidarToken";
import ReactApexChart from "react-apexcharts";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import ptBR from "date-fns/locale/pt-BR";
import { MdManageAccounts} from "react-icons/md";
import { RiTeamFill } from "react-icons/ri";
import { GiShop } from "react-icons/gi";
import { FaCity } from "react-icons/fa";



export default function RelatorioUser({ Url }) {
  const [userData, setUserData] = useState(null);
  const [dataBase, setDataBase] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dataMAX, setDataMAX] = useState();

  // Base histórica exclusiva para o gráfico de linha (sempre todos os meses)
  const [dataHistory, setDataHistory] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  // Filtro por mês (YYYY-MM)
  const tz = "America/Sao_Paulo";
  const hojeBR = toZonedTime(new Date(), tz);
  const tituloMes = format(hojeBR, "yyyy'-'MM", { locale: ptBR }); // ex.: janeiro de 2026



  const [monthFilter, setMonthFilter] = useState(tituloMes); // exemplo: "2026-01"

  // Função robusta para converter ANOMES (202401 ou data ISO) em objeto Date
  const parseAnomes = (value) => {
    if (!value) return null;

    // Se for número ou string numérica (ex: 202401)
    const str = String(value).replace(/\D/g, "");
    if (str.length === 6) {
      const ano = parseInt(str.substring(0, 4));
      const mes = parseInt(str.substring(4, 6)) - 1; // Mês começa em 0 no JS
      return new Date(ano, mes, 1);
    }

    // Tenta formato padrão de data
    const d = new Date(value);
    return isNaN(d) ? null : d;
  };

  useEffect(() => {
    async function fetchMaxDate() {
      try {
        setIsLoading(true);
        const resp = await axios.get(`${Url}/lojapropriaGraficoHistorico`);

        const sortedDates = resp.data
          .map((item) => parseAnomes(item.anomes)) // Converte para Date
          .filter(Boolean) // Remove nulos
          .sort((a, b) => b - a); // ORDENAÇÃO DECRESCENTE (Mais recente -> Mais antigo)

        if (sortedDates.length > 0) {
          // Pega o índice 0 (O mais recente)
          const lastDate = sortedDates[0];
          const formattedDate = format(lastDate, "yyyy'-'MM", { locale: ptBR });

          setDataMAX(formattedDate);
          setMonthFilter(formattedDate); // <-- mantém seu comportamento atual
        }
      } catch (err) {
        console.error("Erro ao carregar datas:", err);
        toast.error("Falha ao carregar datas.");
        setIsLoading(false); // Para o loading se der erro aqui
      }
      // Nota: Não damos setIsLoading(false) no finally aqui para evitar "piscar" a tela
      // O loading vai sumir quando o próximo useEffect terminar.
    }

    fetchMaxDate();
  }, [Url]);

  // ---- Validar token (uma vez ao montar) ----
  useEffect(() => {
    let ignore = false;
    async function loadUser() {
      const data = await ValidarToken();
      if (ignore) return;
      if (!data) {
        window.location.href = "/Error";
        return;
      }
      setUserData(data); // { login, admin, ... }
    }
    loadUser();
    return () => {
      ignore = true;
    };
  }, []);

  // ---- Helpers ----
  // Normaliza um registro vindo da API
  const normalizeRow = (r) => ({
    anomes: Number(r?.anomes ?? r?.ANOMES ?? 0),
    coordenador: (r?.coordenador ?? r?.COORDENADOR ?? "").toString(),
    colab: Number(
      r?.qtde_colaboradores_distintos ??
        r?.qtde_colaborador_distintas ??
        r?.QTDE_COLABORADORES_DISTINTOS ??
        r?.QTDE_COLABORADOR_DISTINTAS ??
        r?.colaboradores ??
        0,
    ),
    lojas: Number(
      r?.qtde_lojas_distintas ?? r?.QTDE_LOJAS_DISTINTAS ?? r?.lojas ?? 0,
    ),
    cidades: Number(
      r?.qtde_cidades_distintas ?? r?.QTDE_CIDADES_DISTINTAS ?? r?.cidades ?? 0,
    ),
    registros: Number(r?.registros ?? r?.REGISTROS ?? 0),
  });

  // Converte "YYYY-MM" => 202601 (número)
  const toAnomes = (val) => {
    if (!val) return undefined;
    const digits = val.replace("-", ""); // "2026-01" -> "202601"
    const n = Number(digits);
    return Number.isFinite(n) ? n : undefined;
  };

  // ---- Buscar dados da API (com filtro anomes) ----
  useEffect(() => {
    let ignore = false;

    async function fetchData() {
      try {
        setIsLoading(true);
        const params = {};
        const anomes = toAnomes(monthFilter);
        if (anomes) params.anomes = anomes;

        const resp = await axios.get(`${Url}/lojapropriaGrafico`, { params });
        const rows = Array.isArray(resp.data) ? resp.data : [];
        const parsed = rows.map(normalizeRow);

        if (!ignore) {
          setDataBase(parsed);
          if (!parsed.length) {
            toast.info("Sem dados para o período selecionado.");
          }
        }
      } catch (err) {
        console.error("Erro ao carregar dados:", err);
        toast.error("Falha ao carregar dados. Exibindo dados de exemplo.");
        if (!ignore) setDataBase(userData);
      } finally {
        if (!ignore) setIsLoading(false);
      }
    }

    fetchData();
    return () => {
      ignore = true;
    };
  }, [Url, monthFilter, userData]); // refetch quando trocar o filtro

  // ---- Validar token (uma vez ao montar) ----
  useEffect(() => {
    let ignore = false;
    async function loadUser() {
      const data = await ValidarToken();
      if (ignore) return;
      if (!data) {
        window.location.href = "/Error";
        return;
      }
      setUserData(data); // { login, admin, ... }
    }
    loadUser();
    return () => {
      ignore = true;
    };
  }, []);

  // ---- MEMOs para gráficos ----
  // Ordena: lojas desc -> cidades desc -> coordenador A-Z
  const byCoord = useMemo(() => {
    const rows = [...dataBase];
    rows.sort(
      (a, b) =>
        b.lojas - a.lojas ||
        b.cidades - a.cidades ||
        a.coordenador.localeCompare(b.coordenador),
    );
    return rows;
  }, [dataBase]);

  // Donut (participação por Lojas; pode trocar para Colab)
  const donut = useMemo(() => {
    const labels = byCoord.map((r) => r.coordenador.split(" ")[0]);
    const series = byCoord.map((r) => r.lojas);
    return { labels, series };
  }, [byCoord]);

  // KPIs
  const kpis = useMemo(() => {
    const coords = new Set(byCoord.map((x) => x.coordenador)).size;
    const totalColab = byCoord.reduce((acc, r) => acc + r.colab, 0);
    const totalLojas = byCoord.reduce((acc, r) => acc + r.lojas, 0);
    const totalCidades = byCoord.reduce((acc, r) => acc + r.cidades, 0);
    return { coords, totalColab, totalLojas, totalCidades };
  }, [byCoord]);

  // ---- ApexCharts options/series ----
  const optionsBar = useMemo(
    () => ({
      chart: { type: "bar", toolbar: { show: true } },
      plotOptions: { bar: { horizontal: false, columnWidth: "55%" } },
      dataLabels: { enabled: false },
      stroke: { show: true, width: 2, colors: ["transparent"] },
      xaxis: {
        categories: byCoord.map((r) => r.coordenador.split(" ")[0]),
        title: { text: "Coordenador" },
      },
      yaxis: { title: { text: "Quantidade" }, decimalsInFloat: 0 },
      tooltip: { shared: true, intersect: false },
      legend: { position: "bottom" },
      colors: ["#A1343C", "#E68F96", "#8f8989"], // colab, lojas, cidades
    }),
    [byCoord],
  );

  const seriesBar = useMemo(
    () => [
      { name: "Colaboradores", data: byCoord.map((r) => r.colab) },
      { name: "Lojas", data: byCoord.map((r) => r.lojas) },
      { name: "Cidades", data: byCoord.map((r) => r.cidades) },
    ],
    [byCoord],
  );

  const optionsDonut = useMemo(
    () => ({
      chart: { toolbar: { show: true } },
      labels: donut.labels,
      legend: { position: "bottom" },
      tooltip: { y: { formatter: (val) => `${val}` } },
      colors: [
        "#A1343C",
        "#E68F96",
        "#bfa5a4",
        "#595A4A",
        "#999999",
        "#E6E6E6",
        "#CCCCCC",
        "#897170",
        "#8BAAAD",
      ], // paleta
    }),
    [donut],
  );

  // -------------------------------
  // --------- LINHA (NOVO) --------
  // -------------------------------

  // 1) Fetch separado SEMPRE sem filtro (todos os meses da base)
  useEffect(() => {
    let ignore = false;
    async function fetchHistory() {
      try {
        setIsLoadingHistory(true);

        const resp = await axios.get(`${Url}/lojapropriaGraficoHistorico`);
        const rows = Array.isArray(resp.data) ? resp.data : [];
        const parsed = rows.map(normalizeRow);
        if (!ignore) setDataHistory(parsed);
      } catch (err) {
        console.error("Erro ao carregar histórico:", err);
        toast.error("Falha ao carregar histórico para a evolução.");
        if (!ignore) setDataHistory([]);
      } finally {
        if (!ignore) setIsLoadingHistory(false);
      }
    }
    fetchHistory();
    return () => {
      ignore = true;
    };
  }, [Url]);

  // 2) Helpers para timeline
  const formatAnomesToLabel = (anomesNum) => {
    // anomesNum: 202401 -> "01/2024"
    const s = String(anomesNum || "");
    if (s.length !== 6) return String(anomesNum ?? "");
    const ano = s.substring(0, 4);
    const mes = s.substring(4, 6);
    return `${mes}/${ano}`;
  };

  const buildLineSeries = (rows, { limitLastMonths = null } = {}) => {
    // 2.1) ANOMES únicos
    const allAnomes = Array.from(new Set(rows.map((r) => r.anomes))).filter(
      Boolean,
    );
    allAnomes.sort((a, b) => a - b); // crescente

    // (Opcional) limitar aos últimos N meses
    let anomesX = allAnomes;
    if (
      limitLastMonths &&
      Number.isFinite(limitLastMonths) &&
      limitLastMonths > 0
    ) {
      anomesX = allAnomes.slice(-limitLastMonths);
    }

    // 2.2) Agrupar coord x anomes somando colab
    const mapCoord = new Map(); // coord -> Map(anomes -> soma colab)
    for (const r of rows) {
      if (!r.coordenador || !r.anomes) continue;
      if (!mapCoord.has(r.coordenador)) mapCoord.set(r.coordenador, new Map());
      const m = mapCoord.get(r.coordenador);
      m.set(r.anomes, (m.get(r.anomes) || 0) + (r.colab || 0));
    }

    // 2.3) Séries
    const series = [];
    for (const [coord, m] of mapCoord.entries()) {
      const data = anomesX.map((a) => m.get(a) || 0);
      series.push({
        name: coord.split(" ")[0], // só primeiro nome
        data,
      });
    }

    // 2.4) Eixo X
    const categories = anomesX.map(formatAnomesToLabel);

    return { categories, series };
  };

  // 3) Ordenação só para o line (usando a base histórica completa)
  const byCoordHistory = useMemo(() => {
    const rows = [...dataHistory];
    rows.sort(
      (a, b) =>
        b.lojas - a.lojas ||
        b.cidades - a.cidades ||
        a.coordenador.localeCompare(b.coordenador),
    );
    return rows;
  }, [dataHistory]);

  // 4) Series e options do line com TODOS os meses
  const { lineCategories, lineSeries } = useMemo(() => {
    const { categories, series } = buildLineSeries(byCoordHistory, {
      /* limitLastMonths: 12 */
    });
    return { lineCategories: categories, lineSeries: series };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [byCoordHistory]);

  const optionsLine = useMemo(
    () => ({
      chart: { type: "line", toolbar: { show: true }, zoom: { enabled: true } },
      stroke: { width: 2, curve: "smooth" },
      dataLabels: { enabled: false },
      xaxis: {
        categories: lineCategories,
        title: { text: "Mês/Ano (ANOMES)" },
      },
      yaxis: {
        title: { text: "Colaboradores" },
        decimalsInFloat: 0,
        forceNiceScale: true,
      },
      tooltip: { shared: true, intersect: false },
      legend: { position: "bottom" },
      colors: [
        "#A1343C",
        "#E68F96",
        "#595A4A",
        "#8BAAAD",
        "#897170",
        "#1F77B4",
        "#FF7F0E",
        "#2CA02C",
        "#D62728",
        "#9467BD",
        "#8C564B",
        "#E377C2",
        "#7F7F7F",
        "#BCBD22",
        "#17BECF",
      ],
    }),
    [lineCategories],
  );

  return (
    <main className={Style.main}>
      {/* Cabeçalho + Filtro */}
      <section
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 16,
          flexWrap: "wrap",
        }}
      >
        <h2 style={{ margin: 0 }}>Lojas Próprias + ATP</h2>

        <div
          style={{
            marginLeft: "auto",
            display: "flex",
            gap: 8,
            alignItems: "center",
          }}
        >
          <label
            className={Style.btn}
            style={{ fontSize: 12, color: "#6b7280" }}
          >
            Filtrar por mês
          </label>
          <input
            type="month"
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
            aria-label="Filtro por mês (YYYY-MM)"
          />
          {monthFilter && (
            <button
              type="button"
              className={Style.linkBtn}
              onClick={() => setMonthFilter("")}
              style={{ padding: "6px 10px" }}
              title="Limpar filtro"
            >
              Limpar
            </button>
          )}
        </div>
      </section>

      {/* Loading */}
      {isLoading && (
        <div style={{ display: "grid", placeItems: "center", height: 260 }}>
          <LoadingSvg />
          <p style={{ marginTop: 8, color: "#6b7280" }}>Carregando dados...</p>
        </div>
      )}

      {/* Conteúdo */}
      {!isLoading && (
        <>
          {/* KPIs */}
          <section
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, minmax(160px, 1fr))",
              gap: 12,
              marginBottom: 16,
            }}
          >
            <Kpi
              title="Coordenadores"
              value={kpis.coords}
              icon={<MdManageAccounts size={26} />}
            />
            <Kpi
              title="Total de Colaboradores"
              value={kpis.totalColab}
              icon={<RiTeamFill size={26} />}
            />
            <Kpi
              title="Total de Lojas"
              value={kpis.totalLojas}
              icon={<GiShop size={26} />}
            />
            <Kpi
              title="Total de Cidades"
              value={kpis.totalCidades}
              icon={<FaCity size={26} color="#000000"/>}
            />
          </section>

          <section className={Style.graficoaside}>
            {/* Barras Agrupadas */}
            <aside className={Style.card}>
              <h3 style={{ marginBottom: 8 }}>
                Colaboradores × Lojas × Cidades (por Coordenador)
              </h3>
              <div
                style={{ width: "100%", maxWidth: "100%", overflow: "hidden" }}
              >
                <ReactApexChart
                  options={optionsBar}
                  series={seriesBar}
                  type="bar"
                  height={360}
                  width={420}
                />
              </div>
            </aside>

            {/* Donut */}
            <aside className={Style.card}>
              <h3 style={{ marginBottom: 8 }}>
                Participação por Coordenador (Lojas)
              </h3>
              <ReactApexChart
                options={optionsDonut}
                series={donut.series}
                type="donut"
                height={340}
                width={420}
              />
            </aside>
          </section>

          {/* Linha: Evolução de Colaboradores por Coordenador (usa TODOS os meses) */}
          <aside className={Style.card}>
            <h3 style={{ marginBottom: 8 }}>
              Evolução de Colaboradores por Coordenador (ANOMES)
            </h3>

            {isLoadingHistory ? (
              <div
                style={{ display: "grid", placeItems: "center", height: 260 }}
              >
                <LoadingSvg />
                <p style={{ marginTop: 8, color: "#6b7280" }}>
                  Carregando histórico...
                </p>
              </div>
            ) : (
              <div
                style={{
                  width: "100%",
                  maxWidth: "100%",
                  overflow: "hidden",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <ReactApexChart
                  options={optionsLine}
                  series={lineSeries}
                  type="line"
                  height={360}
                  width={1000} // mais largo para linha; ajuste se necessário
                />
              </div>
            )}

            {/* Dica opcional para muitos coordenadores */}
            {!isLoadingHistory && lineSeries.length > 10 && (
              <p style={{ marginTop: 8, color: "#6b7280", fontSize: 12 }}>
                Dica: use a legenda para ocultar/mostrar coordenadores e o zoom
                do gráfico para focar em períodos.
              </p>
            )}
          </aside>

          {/* Tabela simples */}
          <section className={Style.card}>
            <div style={{ overflowX: "auto" }}>
              <table className={Style.table}>
                <thead>
                  <tr>
                    <th>ANOMES</th>
                    <th>Coordenador</th>
                    <th>Colaboradores</th>
                    <th>Lojas</th>
                    <th>Cidades</th>
                  </tr>
                </thead>
                <tbody>
                  {byCoord.map((r, idx) => (
                    <tr key={idx}>
                      <td>{r.anomes}</td>
                      <td>{r.coordenador}</td>
                      <td>{r.colab}</td>
                      <td>{r.lojas}</td>
                      <td>{r.cidades}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </main>
  );
}

function Kpi({ title, value, icon }) {
  return (
    <main className={Style.card} style={{ padding: 12 }}>
      {icon}
      <section style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>
        {title}
      </section>
      <section style={{ fontSize: 28, fontWeight: 700 }}>{value}</section>
    </main>
  );
}
