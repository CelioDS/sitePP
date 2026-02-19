// Varejo.jsx
import LoadingSvg from "./Loading";
import Style from "./GraficoVarejo.module.css";
import { useMemo, useState, useEffect } from "react";
import { toast } from "react-toastify";
import axios from "axios";
import ValidarToken from "../Tools/ValidarToken";
import ReactApexChart from "react-apexcharts";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import ptBR from "date-fns/locale/pt-BR";
import { MdManageAccounts } from "react-icons/md";
import { RiTeamFill } from "react-icons/ri";
import { GiShop } from "react-icons/gi";
import { FaCity } from "react-icons/fa";

/**
 * Novo componente Varejo com gráficos melhorados
 * - Usa /VAREJOgrafico e /VAREJOgraficoHISTORICO (conforme payload enviado)
 * - Corrige campos: filial_coordenador, loja, colaborador, cidades, parceiro
 * - Adiciona seletor de métrica no donut e range na linha
 * - Responsivo (100% width) e alturas dinâmicas
 */

export default function Varejo({ Url }) {
  // Dados filtrados pelo mês
  const [dataBase, setDataBase] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Histórico completo (todos os meses)
  const [dataHistory, setDataHistory] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  // Seletor de métrica para o donut
  const [donutMetric, setDonutMetric] = useState("lojas"); // lojas | colab | cidades | parceiro

  // Seletor de range para a linha (null=todos, 6, 12)
  const [lineRange, setLineRange] = useState(12);

  // Mês selecionado (YYYY-MM)
  const tz = "America/Sao_Paulo";
  const hojeBR = toZonedTime(new Date(), tz);
  const mesAtualYYYYMM = format(hojeBR, "yyyy'-'MM", { locale: ptBR });
  const [monthFilter, setMonthFilter] = useState(mesAtualYYYYMM);

  const toAnomesNum = (yyyyMM) => {
    if (!yyyyMM) return undefined;
    const digits = String(yyyyMM).replace(/\D/g, "");
    if (digits.length === 6) return Number(digits);
    if (/^\d{4}-\d{2}$/.test(yyyyMM)) return Number(yyyyMM.replace("-", ""));
    return undefined;
  };

  const anomesToLabel = (anomes) => {
    const s = String(anomes || "");
    if (s.length !== 6) return s;
    return `${s.slice(4, 6)}/${s.slice(0, 4)}`;
  };

  // -------- Normalização de linhas da API --------
  const normalizeRow = (r) => {
    const rawAnoMes = r?.anomes;
    const anomesNum = Number(String(rawAnoMes ?? "").replace(/\D/g, "")) || 0;

    // Ignora placeholders "[value-x]"
    if (!anomesNum || /\[value-/i.test(String(rawAnoMes ?? ""))) return null;

    const coordenador = (r?.filial_coordenador ?? r?.coordenador ?? "")
      .toString()
      .trim();

    if (!coordenador || /\[value-/i.test(coordenador)) return null;

    const row = {
      anomes: anomesNum, // 202602
      coordenador,
      gn: (r?.gn ?? "").toString().trim(),
      lojas: Number(r?.loja ?? r?.lojas ?? 0),
      cidades: Number(r?.cidades ?? 0),
      colab: Number(r?.colaborador ?? r?.colab ?? 0),
      parceiro: Number(r?.parceiro ?? 0),
      cargo: Number(r?.cargo ?? 0),
      situacao: Number(r?.situacao ?? 0),
    };
    return row;
  };

  // -------- Validar token (uma vez) --------
  useEffect(() => {
    let ignore = false;
    (async () => {
      const data = await ValidarToken();
      if (ignore) return;
      if (!data) {
        window.location.href = "/Error";
        return;
      }
    })();
    return () => {
      ignore = true;
    };
  }, []);

  // -------- Buscar Histórico Completo --------
  useEffect(() => {
    let ignore = false;

    async function fetchHistory() {
      try {
        setIsLoadingHistory(true);
        const resp = await axios.get(`${Url}/VAREJOgraficoHISTORICO`);
        const rows = Array.isArray(resp.data) ? resp.data : [];
        const clean = rows.map(normalizeRow).filter(Boolean);

        if (!ignore) {
          setDataHistory(clean);

          // Descobrir o ANOMES mais recente do histórico para setar o filtro inicial
          const allAnomes = clean.map((x) => x.anomes).filter(Boolean);
          if (allAnomes.length) {
            const last = Math.max(...allAnomes); // 202602
            const lastYYYYMM = `${String(last).slice(0, 4)}-${String(last).slice(4, 6)}`;
            setMonthFilter(lastYYYYMM);
          }
        }
      } catch (err) {
        console.error("Erro ao carregar histórico:", err);
        toast.error("Falha ao carregar histórico do Varejo.");
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

  // -------- Buscar Dados do mês (com filtro) --------
  useEffect(() => {
    let ignore = false;

    async function fetchMonthData() {
      try {
        setIsLoading(true);
        const params = {};
        const anomes = toAnomesNum(monthFilter);
        if (anomes) params.anomes = anomes;

        const resp = await axios.get(`${Url}/VAREJOgrafico`, { params });
        const rows = Array.isArray(resp.data) ? resp.data : [];
        const clean = rows.map(normalizeRow).filter(Boolean);

        if (!ignore) {
          setDataBase(clean);
          if (!clean.length) {
            toast.info("Sem dados para o período selecionado.");
          }
        }
      } catch (err) {
        console.error("Erro ao carregar dados:", err);
        toast.error("Falha ao carregar dados do Varejo.");
        if (!ignore) setDataBase([]);
      } finally {
        if (!ignore) setIsLoading(false);
      }
    }

    fetchMonthData();
    return () => {
      ignore = true;
    };
  }, [Url, monthFilter]);

  // -------- MEMOs e agregações --------
  // Ordenação: lojas desc -> cidades desc -> coordenador A-Z
  const byCoord = useMemo(() => {
    const rows = [...dataBase];
    rows.sort(
      (a, b) =>
        (b.lojas || 0) - (a.lojas || 0) ||
        (b.cidades || 0) - (a.cidades || 0) ||
        a.coordenador.localeCompare(b.coordenador),
    );
    return rows;
  }, [dataBase]);

  const kpis = useMemo(() => {
    const coords = new Set(byCoord.map((x) => x.coordenador)).size;
    const totalColab = byCoord.reduce((acc, r) => acc + (r.colab || 0), 0);
    const totalLojas = byCoord.reduce((acc, r) => acc + (r.lojas || 0), 0);
    const totalCidades = byCoord.reduce((acc, r) => acc + (r.cidades || 0), 0);
    const totalParceiro = byCoord.reduce(
      (acc, r) => acc + (r.parceiro || 0),
      0,
    );
    return { coords, totalColab, totalLojas, totalCidades, totalParceiro };
  }, [byCoord]);

  // -------- Alturas dinâmicas --------
  const barHeight = useMemo(() => {
    // Ajusta a altura de acordo com o nº de coordenadores (mín 320, máx 520)
    const base = 32 * Math.max(5, byCoord.length); // 32px por item
    return Math.max(320, Math.min(base, 520));
  }, [byCoord.length]);

  // -------- Séries e opções (BARRAS) --------
  const seriesBar = useMemo(
    () => [
      { name: "Colaboradores", data: byCoord.map((r) => r.colab || 0) },
      { name: "Lojas", data: byCoord.map((r) => r.lojas || 0) },
      { name: "Cidades", data: byCoord.map((r) => r.cidades || 0) },
      { name: "Parceiros", data: byCoord.map((r) => r.parceiro || 0) },
    ],
    [byCoord],
  );

  const optionsBar = useMemo(
    () => ({
      chart: {
        type: "bar",
        toolbar: { show: true },
        animations: { enabled: true },
      },
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: "55%",
          dataLabels: { position: "top" },
        },
      },
      dataLabels: {
        enabled: true,
        formatter: (val) =>
          val >= 1000 ? `${(val / 1000).toFixed(1)}k` : `${val}`,
        style: { fontSize: "10px", colors: ["#000000"] },
        offsetY: -20,
      },
      stroke: { show: true, width: 1, colors: ["#ffffff"] },
      xaxis: {
        categories: byCoord.map((r) => r.coordenador.split(" ")[0]),
        title: { text: "Coordenador" },
        labels: { rotate: -25, rotateAlways: false, trim: true },
      },
      yaxis: { title: { text: "Quantidade" }, decimalsInFloat: 0 },
      tooltip: { shared: true, intersect: false },
      legend: { position: "bottom" },
      colors: ["#A1343C", "#E68F96", "#8BAAAD", "#595A4A"], // colab, lojas, cidades, parceiro
      grid: { strokeDashArray: 4 },
      responsive: [
        {
          breakpoint: 1024,
          options: {
            plotOptions: { bar: { columnWidth: "60%" } },
            dataLabels: { enabled: false },
          },
        },
        {
          breakpoint: 640,
          options: {
            xaxis: { labels: { rotate: -45 } },
            legend: { position: "bottom" },
          },
        },
      ],
    }),
    [byCoord],
  );

  // -------- Série e opções (DONUT) --------
  const donut = useMemo(() => {
    const metricKey =
      donutMetric === "colab"
        ? "colab"
        : donutMetric === "cidades"
          ? "cidades"
          : donutMetric === "parceiro"
            ? "parceiro"
            : "lojas";

    const labels = byCoord.map((r) => r.coordenador.split(" ")[0]);
    const series = byCoord.map((r) => Number(r[metricKey] || 0));
    return { labels, series };
  }, [byCoord, donutMetric]);

  const optionsDonut = useMemo(
    () => ({
      chart: { toolbar: { show: true } },
      labels: donut.labels,
      legend: { position: "bottom" },
      tooltip: {
        y: { formatter: (val) => `${val}` },
      },
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
        "#1F77B4",
        "#FF7F0E",
        "#2CA02C",
        "#D62728",
        "#9467BD",
      ],
      plotOptions: {
        pie: {
          donut: {
            size: "65%",
            labels: {
              show: true,
              total: {
                show: true,
                label:
                  donutMetric === "colab"
                    ? "Colab."
                    : donutMetric === "cidades"
                      ? "Cidades"
                      : donutMetric === "parceiro"
                        ? "Parceiros"
                        : "Lojas",
                formatter: (w) => {
                  const total = w.globals.seriesTotals.reduce(
                    (a, b) => a + b,
                    0,
                  );
                  return `${total}`;
                },
              },
            },
          },
        },
      },
    }),
    [donut, donutMetric],
  );

  // -------- Construção da linha (histórico) --------
  const buildLineSeries = (rows, limitLastMonths = null) => {
    const anomesUniq = Array.from(new Set(rows.map((r) => r.anomes))).filter(
      Boolean,
    );
    anomesUniq.sort((a, b) => a - b);

    const xAnomes = limitLastMonths
      ? anomesUniq.slice(-Number(limitLastMonths))
      : anomesUniq;

    // Mapa coordenador -> anomes -> soma colab
    const mapCoord = new Map();
    for (const r of rows) {
      if (!r.coordenador || !r.anomes) continue;
      if (!mapCoord.has(r.coordenador)) mapCoord.set(r.coordenador, new Map());
      const m = mapCoord.get(r.coordenador);
      m.set(r.anomes, (m.get(r.anomes) || 0) + (r.colab || 0));
    }

    const series = [];
    for (const [coord, m] of mapCoord.entries()) {
      const data = xAnomes.map((a) => m.get(a) || 0);
      series.push({ name: coord.split(" ")[0], data });
    }

    const categories = xAnomes.map(anomesToLabel);
    return { categories, series };
  };

  // Ordenação de histórico (mesma do atual, para consistência de cores/legenda)
  const byCoordHistory = useMemo(() => {
    const rows = [...dataHistory];
    rows.sort(
      (a, b) =>
        (b.lojas || 0) - (a.lojas || 0) ||
        (b.cidades || 0) - (a.cidades || 0) ||
        a.coordenador.localeCompare(b.coordenador),
    );
    return rows;
  }, [dataHistory]);

  const { lineCategories, lineSeries } = useMemo(() => {
    const { categories, series } = buildLineSeries(byCoordHistory, lineRange);
    return { lineCategories: categories, lineSeries: series };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [byCoordHistory, lineRange]);

  const optionsLine = useMemo(
    () => ({
      chart: { type: "line", toolbar: { show: true }, zoom: { enabled: true } },
      stroke: { width: 2, curve: "smooth" },
      dataLabels: { enabled: false },
      xaxis: { categories: lineCategories, title: { text: "Mês/Ano" } },
      yaxis: {
        title: { text: "Colaboradores" },
        decimalsInFloat: 0,
        forceNiceScale: true,
      },
      tooltip: { shared: true, intersect: false },
      legend: { position: "bottom" },
      grid: { strokeDashArray: 4 },
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
      responsive: [
        {
          breakpoint: 768,
          options: { legend: { position: "bottom" } },
        },
      ],
    }),
    [lineCategories],
  );

  // -------- Exportar CSV --------

  return (
    <main className={Style.main}>
      {/* Cabeçalho + Filtros */}
      <section
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 16,
          flexWrap: "wrap",
        }}
      >
        <h2 style={{ margin: 0 }}>Varejo</h2>

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

      {/* Loading do mês */}
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
              gridTemplateColumns: "repeat(5, minmax(140px, 1fr))",
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
              icon={<FaCity size={26} color="#000000" />}
            />
            <Kpi
              title="Total de Parceiros"
              value={kpis.totalParceiro}
              icon={<GiShop size={26} />}
            />
          </section>

          {/* Gráficos principais */}
          <section className={Style.graficoaside}>
            {/* Barras Agrupadas */}
            <aside className={Style.card}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 8,
                }}
              >
                <h5 style={{ margin: 0 }}>
                  Colaboradores × Lojas × Cidades × Parceiros (por Coordenador)
                </h5>
              </div>

              <div style={{ width: "100%", maxWidth: "100%" }}>
                <ReactApexChart
                  options={optionsBar}
                  series={seriesBar}
                  type="bar"
                  height={360}
                  width={420}
                />
              </div>
            </aside>

            {/* Donut com seletor de métrica */}
            <aside className={Style.card}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 8,
                }}
              >
                <h5 style={{ margin: 0 }}>Participação por Coordenador</h5>
                <select
                  value={donutMetric}
                  onChange={(e) => setDonutMetric(e.target.value)}
                  style={{ padding: "1px 1px", width: 120, borderRadius: 6 }}
                  aria-label="Selecione a métrica do donut"
                >
                  <option value="lojas">Lojas</option>
                  <option value="colab">Colaboradores</option>
                  <option value="cidades">Cidades</option>
                  <option value="parceiro">Parceiros</option>
                </select>
              </div>

              <ReactApexChart
                options={optionsDonut}
                series={donut.series}
                type="donut"
                height={360}
                width={420}
              />
            </aside>
          </section>

          {/* Linha: Evolução de Colaboradores (Histórico Completo) */}
          <aside className={Style.card}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                textAlign: "center",
                justifyContent: "center",
                marginBottom: 8,
              }}
            >
              <h3>Evolução de Colaboradores por Coordenador (ANOMES)</h3>
            </div>

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
                  width={1000}
                />
              </div>
            )}

            {/* Dica para muitos coordenadores */}
            {!isLoadingHistory && lineSeries.length > 10 && (
              <p style={{ marginTop: 8, color: "#6b7280", fontSize: 12 }}>
                Dica: use a legenda para ocultar/mostrar coordenadores e o zoom
                para focar em períodos.
              </p>
            )}
          </aside>

          {/* Tabela */}
          <section className={Style.card}>
            <div style={{ overflowX: "auto" }}>
              <table className={Style.table}>
                <thead>
                  <tr>
                    <th>ANOMES</th>
                    <th>Coordenador</th>
                    <th>gn</th>
                    <th>Colaboradores</th>
                    <th>Lojas</th>
                    <th>Cidades</th>
                    <th>Parceiros</th>
                  </tr>
                </thead>
                <tbody>
                  {byCoord.map((r, idx) => (
                    <tr key={idx}>
                      <td>{r.anomes}</td>
                      <td>{r.coordenador}</td>
                      <td>{r.gn}</td>
                      <td>{r.colab}</td>
                      <td>{r.lojas}</td>
                      <td>{r.cidades}</td>
                      <td>{r.parceiro}</td>
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
