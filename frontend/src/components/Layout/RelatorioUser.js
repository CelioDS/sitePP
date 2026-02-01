import LoadingSvg from "../Item-Layout/Loading";
import Style from "./RelatorioUser.module.css";
import { useMemo, useState, useEffect } from "react";
import { toast } from "react-toastify";
import axios from "axios";
import ValidarToken from "../Tools/ValidarToken";
import ReactApexChart from "react-apexcharts";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import ptBR from "date-fns/locale/pt-BR";

/**
 * Este componente:
 * - Busca /lojapropriaGrafico
 * - Normaliza as chaves de retorno (ANOMES, coordenador, quantidades)
 * - Renderiza 2 gráficos (Barras agrupadas, Donut)
 * - Exibe KPIs e Loading
 * - **Possui filtro por mês/ano (input type="month")**
 */
export default function RelatorioUser({ Url }) {
  const [userData, setUserData] = useState(null);
  const [dataBase, setDataBase] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filtro por mês (YYYY-MM)

  const tz = "America/Sao_Paulo";
  const hojeBR = toZonedTime(new Date(), tz);
  const tituloMes = format(hojeBR, "yyyy'-'MM", { locale: ptBR }); // ex.: janeiro de 2026

  const [monthFilter, setMonthFilter] = useState(tituloMes); // exemplo: "2026-01"

  //const user = userData?.login;
  //const canal = userData?.canal;

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
      ], // colab, lojas, cidades
    }),
    [donut],
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
        <h2 style={{ margin: 0 }}>Lojas Próprias</h2>

        <div
          style={{
            marginLeft: "auto",
            display: "flex",
            gap: 8,
            alignItems: "center",
          }}
        >
          <label style={{ fontSize: 12, color: "#6b7280" }}>
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
            <Kpi title="Coordenadores" value={kpis.coords} />
            <Kpi title="Total de Colaboradores" value={kpis.totalColab} />
            <Kpi title="Total de Lojas" value={kpis.totalLojas} />
            <Kpi title="Total de Cidades" value={kpis.totalCidades} />
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

function Kpi({ title, value }) {
  return (
    <div className={Style.card} style={{ padding: 12 }}>
      <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>
        {title}
      </div>
      <div style={{ fontSize: 28, fontWeight: 700 }}>{value}</div>
    </div>
  );
}
