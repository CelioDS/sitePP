// Home.jsx
import Style from "./Home.module.css";
import RenameTitle from "../Tools/RenameTitle";
import Container from "../Layout/Container";
import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { format } from "date-fns";
import { toZonedTime, formatInTimeZone } from "date-fns-tz";
import ptBR from "date-fns/locale/pt-BR";
import BrRsiApex from "../Tools/grafico";
import Loading from "../Item-Layout/Loading";

export default function Home() {
  const [data, setData] = useState([]);
  const [dataFULL, setDataFULL] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rowOLd, setRowOld] = useState({});
  const Url = process.env.REACT_APP_API_URL || "http://localhost:8000";

  // [FILTROS] Ano (AAAA) e Referência (REFERENCIA)
  const anoAtual = new Date().getFullYear();
  const [year, setYear] = useState(String(anoAtual)); // "2026"
  const [referencia, setReferencia] = useState("BR"); // "BR" | "SP_INT"

  const showYear = Number(year) === anoAtual;
  // Data de referência local (exibição)
  const tz = "America/Sao_Paulo";
  const hojeBR = toZonedTime(new Date(), tz);
  const tituloMes = format(hojeBR, "MMMM 'de' yyyy", { locale: ptBR }); // ex.: janeiro de 2026

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const params = new URLSearchParams();
        if (year) params.set("year", year); // filtra AAAA
        if (referencia) params.set("referencia", referencia); // filtra REFERENCIA

        // Se quiser simular outra data:
        // params.set("refDate", "2026-01-27");

        const resp = await axios.get(`${Url}/pdu?${params.toString()}`);
        setData(resp.data || []);
      } catch (err) {
        console.error("Erro ao carregar dados:", err);
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    const fetchDataFULL = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (year) params.set("year", year); // filtra AAAA
        if (referencia) params.set("referencia", referencia); // filtra REFERENCIA
        // Se quiser simular outra data:
        // params.set("refDate", "2026-01-27");

        const resp = await axios.get(`${Url}/PduFull`);
        setDataFULL(resp.data || []);
      } catch (err) {
        console.error("Erro ao carregar dados:", err);
        setDataFULL([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDataFULL();
    fetchData();
  }, [Url, year, referencia]);

  // Pega a primeira (e única) linha retornada
  const row = data?.[0];

  useEffect(() => {
    // salve somente se houver row

    if (row && typeof row === "object") {
      localStorage.setItem(String(year), JSON.stringify(row));
    }

    // colocar uma conta para o ano atual -1

    const prevYearKey = String(Number(year - 1));
    setRowOld(JSON.parse(localStorage.getItem(prevYearKey)) || {});
  }, [year, row, anoAtual]);

  // Helpers de formatação
  const num = (v, frac = 2) =>
    typeof v === "number"
      ? v.toLocaleString("pt-BR", {
          minimumFractionDigits: frac,
          maximumFractionDigits: frac,
        })
      : (v ?? "-");

  // O backend retorna data_referencia como ISO (UTC). Convertemos para BR só para exibir.
  const refDateBR = useMemo(() => {
    if (!row?.data_referencia) return "-";

    try {
      return formatInTimeZone(
        row.data_referencia,
        "America/Sao_Paulo",
        "dd/MM/yyyy HH:mm",
        { locale: ptBR },
      );
    } catch {
      return "-";
    }
  }, [row?.data_referencia]);

  // Percentual para barra
  const perc = Number(row?.perc_mes_transcorrido ?? 0);
  const percClamped = Math.max(0, Math.min(100, perc));

  if (loading) {
    return (
      <Container className={Style.main}>
        <RenameTitle initialTitle={"P&P - Home"} />
        <div style={styles.loading}>Carregando...</div>
      </Container>
    );
  }

  if (!row) {
    return (
      <Container className={Style.main}>
        <RenameTitle initialTitle={"P&P - Home"} />

        <div style={styles.empty}>
          <Loading text={"Sem dados para exibir."} />
        </div>
      </Container>
    );
  }

  // Opções de filtros
  const anosOptions = [
    String(anoAtual - 1),
    String(anoAtual),
    String(anoAtual + 1),
  ];
  const referencias = [
    { value: "BR", label: "Brasil" },
    { value: "SP_INT", label: "São Paulo — Interior" },
  ];

  return (
    <Container className={Style.main}>
      <RenameTitle initialTitle={"P&P - Home"} />

      <main style={styles.container}>
        {/* Barra de filtros */}
        <section style={filters.row}>
          <div style={filters.group}>
            <label style={filters.label}>Ano</label>
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              style={filters.select}
            >
              {anosOptions.map((y) => (
                <option className={Style.options} key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          <div style={filters.group}>
            <label style={filters.label}>Abrangência</label>
            <select
              value={referencia}
              onChange={(e) => setReferencia(e.target.value)}
              style={filters.select}
            >
              {referencias.map((r) => (
                <option className={Style.options} key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
        </section>

        <h2 style={styles.title}>Resumo mensal — {tituloMes}</h2>
        <p style={{ textAlign: "center", marginTop: -6, color: "#666" }}>
          Data de referência: <b>{refDateBR}</b>
        </p>

        {/* KPIs rápidos */}
        <section style={kpi.row}>
          <aside style={kpi.card}>
            <div style={kpi.label}>Dias no mês: {row.dias_no_mes}</div>
            <section className={Style.luandesing}>
              <div className={Style.gabidesing} style={kpi.value}>
                <p>Instalação</p>
                <p>{num(row.vb_mes_atual, 2)}</p>
              </div>
              <div style={kpi.value}>
                <p>Venda Bruta</p>
                <p>{num(row.inst_mes_atual, 2)}</p>
              </div>
            </section>
          </aside>

          <aside style={kpi.card}>
            <div style={kpi.label}>Dias passados : {row.dias_passados}</div>
            <div className={Style.gabidesing} style={kpi.value}>
              {num(row.inst_ate_hoje, 2)}
            </div>
            <div style={kpi.value}>{num(row.vb_ate_hoje, 2)}</div>
          </aside>

          <aside style={kpi.card}>
            <div style={kpi.label}>Dias restantes: {row.dias_restantes}</div>
            <div className={Style.gabidesing} style={kpi.value}>
              {num(row.inst_mes_atual - row.inst_ate_hoje, 2)}
            </div>
            <div style={kpi.value}>
              {num(row.inst_mes_atual - row.vb_ate_hoje, 2)}
            </div>
          </aside>

          <aside style={kpi.card}>
            <div style={kpi.label}>% transcorrido</div>
            <div style={kpi.value}>{num(perc, 2)}%</div>
          </aside>
        </section>

        {/* Barra de progresso do mês */}
        <div style={{ marginTop: 16 }}>
          <div style={styles.chartRow}>
            <span style={styles.chartLabel}>Mês</span>
            <div style={styles.chartBarContainer} aria-label="Progresso do mês">
              <div
                style={{
                  ...styles.chartBar,
                  width: `${percClamped}%`,
                  background:
                    percClamped < 50
                      ? "#2e7d32" // verde
                      : percClamped < 80
                        ? "#f9a825" // amarelo
                        : "#e3262e", // vermelho
                }}
                title={`${num(perc, 2)}%`}
              />
            </div>
            <span style={styles.chartValue}>{num(perc, 2)}%</span>
          </div>
        </div>

        {/* SUA TABELA REINSERIDA EXATAMENTE COMO ESTAVA */}
        <section className={Style.tablesComparacao}>
          {/* Tabela de somas INST/VB por mês (anterior, atual, próximo) */}

          <p
            style={{
              textAlign: "center",
              color: "#666",
              marginTop: -4,
              marginBottom: 8,
            }}
          >
            <small>
              <b>Legenda:</b> ↗/↘ = diferença real &nbsp;·&nbsp; ▲/▼ = variação
              percentual
            </small>
          </p>
          <table className={Style.container} style={styles.smallTable}>
            <thead>
              <tr>
                <th style={tbl.th}></th>
                {showYear && (
                  <th style={tbl.th} className={Style.AnoAnterior}>
                    Ano anterior
                  </th>
                )}
                {showYear && (
                  <th>
                    <small className={Style.legendas}>Δ(real)</small>
                  </th>
                )}
                <th style={tbl.th} className={Style.Mescomparacao}>
                  Mês anterior
                </th>
                <th>
                  <small className={Style.legendas}>Δ(%)</small>
                </th>
                <th style={tbl.th} className={Style.MesAtual}>
                  Mês atual
                </th>
                <th>
                  <small className={Style.legendas}>Δ(%)</small>
                </th>
                <th style={tbl.th} className={Style.Mescomparacao}>
                  Próximo mês
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={tbl.tdHead} className={Style.classificacaoINST}>
                  INST
                </td>
                {showYear && (
                  <td className={Style.AnoAnterior}>
                    {num(rowOLd["inst_mes_atual"], 2)}
                  </td>
                )}

                {showYear && (
                  <td
                    style={
                      showYear &&
                      row.inst_mes_atual - rowOLd["inst_mes_atual"] >= 0
                        ? { color: "#207210cc" }
                        : { color: "#ff0000" }
                    }
                  >
                    <small title={"Diferença real"}>
                      {showYear &&
                      row.inst_mes_atual - rowOLd["inst_mes_atual"] >= 0
                        ? "↗"
                        : "↘"}

                      {showYear &&
                        num(row.inst_mes_atual - rowOLd["inst_mes_atual"], 2)}
                    </small>
                  </td>
                )}
                <td style={tbl.td} className={Style.Mescomparacao}>
                  {num(row.inst_mes_anterior, 2)}
                </td>
                <td
                  style={
                    row.inst_mes_atual - row.inst_mes_anterior >= 0
                      ? { color: "#207210cc" }
                      : { color: "#ff0000" }
                  }
                >
                  <small title={`Variação vs mês anterior`}>
                    {showYear && row.inst_mes_atual - row.inst_mes_anterior >= 0
                      ? "▲"
                      : "▼"}

                    {num(row.inst_mes_atual / row.inst_mes_anterior - 1, 2) +
                      "%"}
                  </small>
                </td>
                <td style={tbl.td} className={Style.MesAtual}>
                  {num(row.inst_mes_atual, 2)}
                </td>
                <td
                  style={
                    row.inst_mes_atual - row.inst_prox_mes >= 0
                      ? { color: "#207210cc" }
                      : { color: "#ff0000" }
                  }
                >
                  <small title={"Variação vs próximo mês "}>
                    {row.inst_mes_atual - row.inst_prox_mes >= 0 ? "▲" : "▼"}
                    {num(row.inst_mes_atual / row.inst_prox_mes - 1, 2) + "%"}
                  </small>
                </td>
                <td style={tbl.td} className={Style.Mescomparacao}>
                  {num(row.inst_mes_prox_mes ?? row.inst_prox_mes, 2)}
                </td>
              </tr>
              <tr>
                <td style={tbl.tdHead} className={Style.classificacaoVB}>
                  VB
                </td>
                {showYear && (
                  <td className={Style.AnoAnterior}>
                    {num(rowOLd["vb_mes_atual"], 2)}
                  </td>
                )}
                {showYear && (
                  <td
                    style={
                      row.vb_mes_atual - rowOLd["vb_mes_atual"] >= 0
                        ? { color: "#207210cc" }
                        : { color: "#ff0000" }
                    }
                  >
                    <small title={"Diferença real"}>
                      {showYear &&
                      row.vb_mes_atual - rowOLd["vb_mes_atual"] >= 0
                        ? "↗"
                        : "↘"}

                      {showYear &&
                        num(row.vb_mes_atual - rowOLd["vb_mes_atual"], 2)}
                    </small>
                  </td>
                )}
                <td
                  title={"valor bruto "}
                  style={tbl.td}
                  className={Style.Mescomparacao}
                >
                  {num(row.vb_mes_anterior, 2)}
                </td>
                <td
                  style={
                    row.vb_mes_atual - row.vb_mes_anterior >= 0
                      ? { color: "#207210cc" }
                      : { color: "#ff0000" }
                  }
                >
                  <small title={`Variação vs mês anterior`}>
                    {row.vb_mes_atual - row.vb_mes_anterior >= 0 ? "▲" : "▼"}
                    {num(row.vb_mes_atual / row.vb_mes_anterior - 1, 2) + "%"}
                  </small>
                </td>
                <td style={tbl.td} className={Style.MesAtual}>
                  {num(row.vb_mes_atual, 2)}
                </td>
                <td
                  style={
                    row.vb_mes_atual - row.vb_prox_mes >= 0
                      ? { color: "#207210cc" }
                      : { color: "#ff0000" }
                  }
                >
                  <small title={"Variação vs próximo mês "}>
                    {row.vb_mes_atual - row.vb_prox_mes >= 0 ? "▲" : "▼"}
                    {num(row.vb_mes_atual / row.vb_prox_mes - 1, 2) + "%"}
                  </small>
                </td>
                <td style={tbl.td} className={Style.Mescomparacao}>
                  {num(row.vb_mes_prox_mes ?? row.vb_prox_mes, 2)}
                </td>
              </tr>
            </tbody>
          </table>
          <BrRsiApex
            dataFULL={dataFULL}
            loading={loading}
            year={year}
            referencia={referencia}
          ></BrRsiApex>
        </section>

        {/* Roadmap (mantido) */}
        <h3 style={styles.subtitle}>Roadmap</h3>
        <ul>
          <li>- hierarquia</li>
          <li>- todolist</li>
          <li>- data/frequência de relatório repostável</li>
          <li>- inserir DU</li>
          <li>- criar um login para cada canal</li>
          <li>- fazer relatório com base nas informações</li>
          <li>- entender de onde vêm os relatórios</li>
          <li>
            - admin pode ver todos os deparas e terá filtro para todos ou um
            específico
          </li>
          <li>- filtro por mês e tirar dos últimos 7 dias</li>
          <li>fazer grafico de todos os meses</li>
          <li>filtro para o anos e brasil e rsi</li>
          <li>orçamento</li>
        </ul>
      </main>
    </Container>
  );
}

const styles = {
  container: {
    background: "#fff",
    borderRadius: "12px",
    padding: "20px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
    width: "90%",
    maxWidth: "900px",
    margin: "40px auto",
    fontFamily: "Arial, sans-serif",
  },
  title: {
    textAlign: "center",
    color: "#E3262E",
    marginBottom: "15px",
    textTransform: "capitalize",
  },
  subtitle: {
    textAlign: "center",
    marginTop: "25px",
    color: "#333",
  },
  chartRow: {
    display: "flex",
    alignItems: "center",
    marginBottom: "8px",
    gap: 8,
  },
  chartLabel: {
    width: 50,
    fontWeight: "bold",
    color: "#E3262E",
  },
  chartBarContainer: {
    display: "flex",
    alignItems: "center",
    width: "100%",
    background: "#f1f1f1",
    borderRadius: "6px",
    overflow: "hidden",
    height: "20px",
  },
  chartBar: {
    height: "100%",
    borderRadius: "6px 0 0 6px",
    transition: "width 0.5s ease",
  },
  chartValue: {
    minWidth: 48,
    textAlign: "right",
    fontSize: "13px",
  },
  loading: {
    textAlign: "center",
    marginTop: "50px",
  },
  empty: {
    textAlign: "center",
    color: "#888",
    marginTop: "50px",
  },
};

const filters = {
  row: {
    display: "flex",
    gap: 12,
    justifyContent: "center",
    alignItems: "flex-end",
    marginBottom: 8,
    flexWrap: "wrap",
  },
  group: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
    minWidth: 160,
    textAlign: "center",
    alignItems: "center",
  },
  label: { fontSize: 13, color: "#555", fontWeight: 600 },
  select: {
    padding: "8px 10px",
    borderRadius: 8,
    border: "1px solid #ddd",
    background: "#fff",
    textAlign: "center",
    justifyContent: "center",
    alignItems: "center",
  },
};

const kpi = {
  row: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: 12,
    marginTop: 20,
    justifyContent: "space-around",
  },
  card: {
    background: "#f7f7f7",
    borderRadius: 10,
    padding: "12px 14px",
  },
  label: { fontSize: 12, color: "#666" },
  value: {
    fontSize: 16,
    fontWeight: 700,
    color: "#2e2e2e",
    marginTop: 4,
  },
};

const tbl = {
  th: {
    padding: "10px 8px",
    borderBottom: "2px solid #eee",
    color: "#333",
  },
  tdHead: {
    padding: "8px",
    borderBottom: "1px solid #f1f1f1",
    fontWeight: 700,
    textAlign: "left",
    color: "#333",
  },
  td: {
    padding: "8px",
    borderBottom: "1px solid #f1f1f1",
    textAlign: "center",
  },
};
