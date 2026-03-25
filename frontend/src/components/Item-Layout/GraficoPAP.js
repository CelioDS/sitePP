// PortaAPorta.jsx
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
import { FaCity } from "react-icons/fa";
import { GiShop } from "react-icons/gi";

export default function PortaAPorta({ Url }) {
  const [dataBase, setDataBase] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [dataHistory, setDataHistory] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  const [donutMetric, setDonutMetric] = useState("executivo");

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
    const s = String(anomes);
    return `${s.slice(4, 6)}/${s.slice(0, 4)}`;
  };

  // -------------------- NORMALIZAÇÃO --------------------
  const normalizeRow = (r) => {
    const anomesNum = Number(String(r?.anomes || "").replace(/\D/g, ""));
    if (!anomesNum) return null;

    const coordenador = (r?.FILIAL_COORDENADOR || "").toString().trim();
    if (!coordenador) return null;

    return {
      anomes: anomesNum,
      coordenador,
      parceiroLoja: Number(r?.PARCEIRO_LOJA || 0),
      executivo: Number(r?.executivo || 0),
      cidades: Number(r?.ibge || 0),
      estrutura: (r?.ESTRUTURA || "").trim(),
    };
  };

  // -------------------- TOKEN --------------------
  useEffect(() => {
    let ignore = false;
    (async () => {
      const data = await ValidarToken();
      if (!data && !ignore) window.location.href = "/Error";
    })();
    return () => (ignore = true);
  }, []);

  // -------------------- HISTÓRICO --------------------
  useEffect(() => {
    let ignore = false;

    async function fetchHistory() {
      try {
        setIsLoadingHistory(true);
        const resp = await axios.get(`${Url}/portaaportagraficohistorico`);
        const clean = resp.data.map(normalizeRow).filter(Boolean);

        if (!ignore) {
          setDataHistory(clean);

          const all = clean.map((x) => x.anomes);
          if (all.length) {
            const last = Math.max(...all);
            setMonthFilter(
              `${String(last).slice(0, 4)}-${String(last).slice(4, 6)}`,
            );
          }
        }
      } catch (err) {
        toast.error("Erro ao carregar histórico Porta a Porta.");
        if (!ignore) setDataHistory([]);
      } finally {
        if (!ignore) setIsLoadingHistory(false);
      }
    }

    fetchHistory();
    return () => (ignore = true);
  }, [Url]);

  // -------------------- MÊS ATUAL --------------------
  useEffect(() => {
    let ignore = false;

    async function fetchMonth() {
      try {
        setIsLoading(true);
        const params = {};
        const anomes = toAnomesNum(monthFilter);
        if (anomes) params.anomes = anomes;

        const resp = await axios.get(`${Url}/portaaportagrafico`, { params });
        const clean = resp.data.map(normalizeRow).filter(Boolean);

        if (!ignore) {
          setDataBase(clean);
        }
      } catch (err) {
        toast.error("Erro ao carregar dados Porta a Porta.");
        if (!ignore) setDataBase([]);
      } finally {
        if (!ignore) setIsLoading(false);
      }
    }

    fetchMonth();
    return () => (ignore = true);
  }, [Url, monthFilter]);

  // -------------------- ORDENAÇÃO --------------------
  const byCoord = useMemo(() => {
    const rows = [...dataBase];
    rows.sort(
      (a, b) =>
        b.executivo - a.executivo ||
        b.parceiroLoja - a.parceiroLoja ||
        a.coordenador.localeCompare(b.coordenador),
    );
    return rows;
  }, [dataBase]);

  // -------------------- KPIs --------------------
  const kpis = useMemo(() => {
    return {
      coords: new Set(byCoord.map((x) => x.coordenador)).size,
      totalExecutivo: byCoord.reduce((acc, r) => acc + r.executivo, 0),
      totalParceiroLoja: byCoord.reduce((acc, r) => acc + r.parceiroLoja, 0),
      totalCidades: byCoord.reduce((acc, r) => acc + r.cidades, 0),
    };
  }, [byCoord]);

  // -------------------- GRAFICO BARRAS --------------------
  const seriesBar = useMemo(
    () => [
      { name: "Executivos", data: byCoord.map((x) => x.executivo) },
      { name: "Parceiro Loja", data: byCoord.map((x) => x.parceiroLoja) },
      { name: "Cidades IBGE", data: byCoord.map((x) => x.cidades) },
    ],
    [byCoord],
  );

  const optionsBar = useMemo(
    () => ({
      chart: { type: "bar", toolbar: { show: true } },
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
        style: { fontSize: "12px", colors: ["#000000"] },
        offsetY: -20,
      },
      xaxis: {
        categories: byCoord.map((x) => x.coordenador.split(" ")[0]),
      },
      legend: { position: "bottom" },
      colors: ["#A1343C", "#E68F96", "#8BAAAD"],
    }),
    [byCoord],
  );

  // -------------------- DONUT --------------------
  const donutData = useMemo(() => {
    const key =
      donutMetric === "executivo"
        ? "executivo"
        : donutMetric === "parceiroLoja"
          ? "parceiroLoja"
          : donutMetric === "estrutura"
            ? "estrutura"
            : "cidades";

    return {
      labels: byCoord.map((r) => r.coordenador.split(" ")[0]),
      series: byCoord.map((r) => r[key]),
    };
  }, [byCoord, donutMetric]);

  const optionsDonut = useMemo(
    () => ({
      labels: donutData.labels,
      legend: { position: "bottom" },
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
                  donutMetric === "executivo"
                    ? "Executivos"
                    : donutMetric === "parceiroLoja"
                      ? "parceiroLoja"
                      : donutMetric === "estrutura"
                        ? "estrutura"
                        : "cidades",
                formatter: (w) =>
                  w.globals.seriesTotals.reduce((a, b) => a + b, 0),
              },
            },
          },
        },
      },
    }),
    [donutData, donutMetric],
  );

  // -------------------- HISTÓRICO LINHA --------------------
  const buildLineSeries = (rows) => {
    const months = [...new Set(rows.map((r) => r.anomes))].sort();
    const last12 = months.slice(-12);

    const coordMap = new Map();
    for (const r of rows) {
      if (!coordMap.has(r.coordenador)) coordMap.set(r.coordenador, {});
      coordMap.get(r.coordenador)[r.anomes] = r.executivo;
    }

    const series = [...coordMap.entries()].map(([coord, data]) => ({
      name: coord.split(" ")[0],
      data: last12.map((m) => data[m] || 0),
    }));

    return {
      categories: last12.map(anomesToLabel),
      series,
    };
  };

  const { categories, series } = buildLineSeries(dataHistory);

  const optionsLine = {
    chart: { type: "line" },
    xaxis: { categories },
    colors: ["#A1343C", "#E68F96", "#8BAAAD", "#595A4A", "#1F77B4"],
    legend: { position: "bottom" },
  };

  return (
    <main className={Style.main}>
      <section
        style={{ display: "flex", alignItems: "center", marginBottom: 16 }}
      >
        <h2>Porta a Porta</h2>

        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <label className={Style.btn}>Filtrar por mês</label>
          <input
            type="month"
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
          />

          {monthFilter && (
            <button
              className={Style.linkBtn}
              onClick={() => setMonthFilter("")}
            >
              Limpar
            </button>
          )}
        </div>
      </section>

      {/* LOADING */}
      {isLoading && (
        <div style={{ display: "grid", placeItems: "center", height: 260 }}>
          <LoadingSvg />
          <p>Carregando dados...</p>
        </div>
      )}

      {/* CONTEÚDO */}
      {!isLoading && (
        <>
          {/* KPIs */}
          <section
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, minmax(140px, 1fr))",
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
              title="Executivos"
              value={kpis.totalExecutivo}
              icon={<RiTeamFill size={26} />}
            />
            <Kpi
              title="Parceiro Loja"
              value={kpis.totalParceiroLoja}
              icon={<GiShop size={26} />}
            />
            <Kpi
              title="Cidades"
              value={kpis.totalCidades}
              icon={<FaCity size={26} />}
            />
          </section>

          {/* GRAFI COS */}
          <section className={Style.graficoaside}>
            {/* BARRAS */}
            <aside className={Style.card}>
              <h5>Executivos × Parceiro Loja × Cidades</h5>

              <ReactApexChart
                options={optionsBar}
                series={seriesBar}
                type="bar"
                height={360}
                width={420}
              />
            </aside>

            {/* DONUT */}
            <aside className={Style.card}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <h5>Participação por Coordenador</h5>

                <select
                  value={donutMetric}
                  onChange={(e) => setDonutMetric(e.target.value)}
                  style={{ width: 140 }}
                >
                  <option value="executivo">Executivos</option>
                  <option value="parceiroLoja">Parceiro Loja</option>
                  <option value="cidades">Cidades</option>
                </select>
              </div>

              <ReactApexChart
                options={optionsDonut}
                series={donutData.series}
                type="donut"
                height={360}
                width={420}
              />
            </aside>
          </section>

          {/* LINHA */}
          <aside className={Style.card}>
            <h3 style={{ textAlign: "center" }}>
              Evolução de Executivos (12 meses)
            </h3>

            {isLoadingHistory ? (
              <div style={{ placeItems: "center", height: 260 }}>
                <LoadingSvg />
              </div>
            ) : (
              <ReactApexChart
                options={optionsLine}
                series={series}
                type="line"
                height={360}
                width={1000}
              />
            )}
          </aside>

          {/* TABELA */}
          <section className={Style.card}>
            <div style={{ overflowX: "auto" }}>
              <table className={Style.table}>
                <thead>
                  <tr>
                    <th>ANOMES</th>
                    <th>Coordenador</th>
                    <th>Executivo</th>
                    <th>Parceiro Loja</th>
                    <th>Cidades</th>
                  </tr>
                </thead>
                <tbody>
                  {byCoord.map((r, i) => (
                    <tr key={i}>
                      <td>{r.anomes}</td>
                      <td>{r.coordenador}</td>
                      <td>{r.executivo}</td>
                      <td>{r.parceiroLoja}</td>
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
    <section className={Style.card} style={{ padding: 12 }}>
      {icon}
      <section style={{ fontSize: 12, color: "#6b7280" }}>{title}</section>
      <section style={{ fontSize: 28, fontWeight: 700 }}>{value}</section>
    </section>
  );
}
