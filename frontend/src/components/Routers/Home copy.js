// Home.jsx
import Style from "./Home.module.css";
import RenameTitle from "../Tools/RenameTitle";
import Container from "../Layout/Container";
import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import ptBR from "date-fns/locale/pt-BR";

export default function Home() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rowOld, setRowOld] = useState(null);

  const Url = process.env.REACT_APP_API_URL || "http://localhost:8000";

  // [FILTROS] Ano (AAAA) e Referência (REFERENCIA)
  const anoAtual = new Date().getFullYear();
  const [year, setYear] = useState(String(anoAtual)); // "2026"
  const [referencia, setReferencia] = useState("BR"); // "BR" | "SP_INT"

  // Data de referência local (exibição)
  const tz = "America/Sao_Paulo";
  const hojeBR = toZonedTime(new Date(), tz);
  const tituloMes = format(hojeBR, "MMMM 'de' yyyy", { locale: ptBR }); // ex.: janeiro de 2026

  // Helpers numéricos e visuais
  const num = (v, frac = 2) =>
    typeof v === "number"
      ? v.toLocaleString("pt-BR", {
          minimumFractionDigits: frac,
          maximumFractionDigits: frac,
        })
      : v ?? "-";

  const diffReal = (atual, anterior) => {
    if (typeof atual !== "number" || typeof anterior !== "number") return null;
    return atual - anterior;
  };

  const diffPerc = (atual, anterior) => {
    if (typeof atual !== "number" || typeof anterior !== "number") return null;
    if (anterior === 0) return null;
    return (atual / anterior - 1) * 100;
  };

  const styleByValue = (v) =>
    v >= 0 ? { color: "#207210cc", fontWeight: 600 } : { color: "#c62828", fontWeight: 600 };

  const symbolReal = (v) => (v >= 0 ? "↗" : "↘"); // diferença real
  const symbolPerc = (v) => (v >= 0 ? "▲" : "▼"); // variação %

  // Fetch dos dados
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
    fetchData();
  }, [Url, year, referencia]);

  // Pega a primeira (e única) linha retornada
  const row = data?.[0];

  // Salvar o row do ano selecionado e carregar o do ano anterior
  useEffect(() => {
    // Salva somente se houver row
    if (row) {
      localStorage.setItem(String(year), JSON.stringify(row));
    }

    try {
      // Buscar dinamicamente o ano anterior ao selecionado
      const prevYearKey = String(Number(year) - 1);
      const raw = localStorage.getItem(prevYearKey); // chave deve ser STRING
      const parsed = raw ? JSON.parse(raw) : null;
      setRowOld(parsed);
    } catch (e) {
      console.warn("Falha ao ler ano anterior do localStorage:", e);
      setRowOld(null);
    }
  }, [year, row]);

  // O backend retorna data_referencia como ISO (UTC). Convertemos para BR só para exibir.
  const refDateBR = useMemo(() => {
    if (!row?.data_referencia) return "-";
    try {
      const d = new Date(row.data_referencia); // ISO
      const zoned = toZonedTime(d, tz);
      return format(zoned, "dd/MM/yyyy", { locale: ptBR });
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
        <div style={styles.empty}>Sem dados para exibir.</div>
      </Container>
    );
  }

  // Opções de filtros
  const anosOptions = [String(anoAtual - 1), String(anoAtual), String(anoAtual + 1)];
  const referencias = [
    { value: "BR", label: "Brasil" },
    { value: "SP_INT", label: "São Paulo — Interior" },
  ];

  // Safe alias para evitar crash quando rowOld === null
  const old = rowOld ?? {};

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
                <option key={y} value={y}>
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
                <option key={r.value} value={r.value}>
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
                      : "#E3262E", // vermelho
                }}
                title={`${num(perc, 2)}%`}
              />
            </div>
            <span style={styles.chartValue}>{num(perc, 2)}%</span>
          </div>
        </div>

        {/* Tabela de somas INST/VB por mês (anterior, atual, próximo) */}
        <section className={Style.tablesComparacao}>
          <h3 style={styles.subtitle}>Somas por mês (INST e VB)</h3>
          <p style={{ textAlign: "center", color: "#666", marginTop: -4, marginBottom: 8 }}>
            <small>
              <b>Legenda:</b> ↗/↘ = diferença real &nbsp;·&nbsp; ▲/▼ = variação percentual
            </small>
          </p>

          <table className={Style.container} style={styles.smallTable}>
            <thead>
              <tr style={{ background: "#fafafa" }}>
                <th style={{ ...tbl.th, width: 90 }}></th>
                <th style={tbl.th}>Ano anterior</th>
                <th style={tbl.th}>
                  Δ <small style={{ color: "#777" }}>(real)</small>
                </th>

                <th style={tbl.th}>Mês anterior</th>
                <th style={tbl.th}>
                  Δ% <small style={{ color: "#777" }}>(%)</small>
                </th>
                <th style={tbl.th}>Mês atual</th>
                <th style={tbl.th}>
                  Δ% <small style={{ color: "#777" }}>(vs próx)</small>
                </th>
                <th style={tbl.th}>Próximo mês</th>
              </tr>
            </thead>
            <tbody>
              {/* ===== INST ===== */}
              <tr>
                <td style={tbl.tdHead}>INST</td>

                {/* Ano anterior */}
                <td style={{ ...tbl.td, fontWeight: 600 }}>
                  {num(old?.inst_mes_atual ?? 0, 2)}
                </td>

                {/* Δ real (atual - ano anterior) */}
                {(() => {
                  const dr = diffReal(row.inst_mes_atual, old?.inst_mes_atual);
                  return (
                    <td
                      style={{
                        ...tbl.td,
                        ...(dr !== null ? styleByValue(dr) : { color: "#999" }),
                        fontSize: 13,
                      }}
                      title={dr !== null ? `Diferença real: ${num(dr, 2)}` : "Sem base"}
                    >
                      <small>
                        {dr !== null ? symbolReal(dr) : "–"} {dr !== null ? num(dr, 2) : "-"}
                      </small>
                    </td>
                  );
                })()}

                {/* Mês anterior (valor base) */}
                <td style={{ ...tbl.td, fontWeight: 600 }}>
                  {num(row.inst_mes_anterior, 2)}
                </td>

                {/* Δ% vs mês anterior */}
                {(() => {
                  const dp = diffPerc(row.inst_mes_atual, row.inst_mes_anterior);
                  return (
                    <td
                      style={{
                        ...tbl.td,
                        ...(dp !== null ? styleByValue(dp) : { color: "#999" }),
                        fontSize: 12,
                      }}
                      title={
                        dp !== null ? `Variação vs mês anterior: ${num(dp, 2)}%` : "Sem base"
                      }
                    >
                      <small>
                        {dp !== null ? symbolPerc(dp) : "–"} {dp !== null ? num(dp, 2) : "-"}%
                      </small>
                    </td>
                  );
                })()}

                {/* Mês atual (valor base) */}
                <td style={{ ...tbl.td, fontWeight: 700 }}>{num(row.inst_mes_atual, 2)}</td>

                {/* Δ% vs próximo mês (planejado) */}
                {(() => {
                  const base = row.inst_prox_mes ?? row.inst_mes_prox_mes;
                  const dp = diffPerc(row.inst_mes_atual, base);
                  return (
                    <td
                      style={{
                        ...tbl.td,
                        ...(dp !== null ? styleByValue(dp) : { color: "#999" }),
                        fontSize: 12,
                      }}
                      title={
                        dp !== null ? `Variação vs próximo mês: ${num(dp, 2)}%` : "Sem base"
                      }
                    >
                      <small>
                        {dp !== null ? symbolPerc(dp) : "–"} {dp !== null ? num(dp, 2) : "-"}%
                      </small>
                    </td>
                  );
                })()}

                {/* Próximo mês (valor base) */}
                <td style={{ ...tbl.td, fontWeight: 600 }}>
                  {num(row.inst_mes_prox_mes ?? row.inst_prox_mes, 2)}
                </td>
              </tr>

              {/* ===== VB ===== */}
              <tr>
                <td style={tbl.tdHead}>VB</td>

                {/* Ano anterior */}
                <td style={{ ...tbl.td, fontWeight: 600 }}>
                  {num(old?.vb_mes_atual ?? 0, 2)}
                </td>

                {/* Δ real (atual - ano anterior) */}
                {(() => {
                  const dr = diffReal(row.vb_mes_atual, old?.vb_mes_atual);
                  return (
                    <td
                      style={{
                        ...tbl.td,
                        ...(dr !== null ? styleByValue(dr) : { color: "#999" }),
                        fontSize: 13,
                      }}
                      title={dr !== null ? `Diferença real: ${num(dr, 2)}` : "Sem base"}
                    >
                      <small>
                        {dr !== null ? symbolReal(dr) : "–"} {dr !== null ? num(dr, 2) : "-"}
                      </small>
                    </td>
                  );
                })()}

                {/* Mês anterior (valor base) */}
                <td style={{ ...tbl.td, fontWeight: 600 }}>
                  {num(row.vb_mes_anterior, 2)}
                </td>

                {/* Δ% vs mês anterior */}
                {(() => {
                  const dp = diffPerc(row.vb_mes_atual, row.vb_mes_anterior);
                  return (
                    <td
                      style={{
                        ...tbl.td,
                        ...(dp !== null ? styleByValue(dp) : { color: "#999" }),
                        fontSize: 12,
                      }}
                      title={
                        dp !== null ? `Variação vs mês anterior: ${num(dp, 2)}%` : "Sem base"
                      }
                    >
                      <small>
                        {dp !== null ? symbolPerc(dp) : "–"} {dp !== null ? num(dp, 2) : "-"}%
                      </small>
                    </td>
                  );
                })()}

                {/* Mês atual (valor base) */}
                <td style={{ ...tbl.td, fontWeight: 700 }}>{num(row.vb_mes_atual, 2)}</td>

                {/* Δ% vs próximo mês (planejado) */}
                {(() => {
                  const base = row.vb_prox_mes ?? row.vb_mes_prox_mes;
                  const dp = diffPerc(row.vb_mes_atual, base);
                  return (
                    <td
                      style={{
                        ...tbl.td,
                        ...(dp !== null ? styleByValue(dp) : { color: "#999" }),
                        fontSize: 12,
                      }}
                      title={
                        dp !== null ? `Variação vs próximo mês: ${num(dp, 2)}%` : "Sem base"
                      }
                    >
                      <small>
                        {dp !== null ? symbolPerc(dp) : "–"} {dp !== null ? num(dp, 2) : "-"}%
                      </small>
                    </td>
                  );
                })()}

                {/* Próximo mês (valor base) */}
                <td style={{ ...tbl.td, fontWeight: 600 }}>
                  {num(row.vb_mes_prox_mes ?? row.vb_prox_mes, 2)}
                </td>
              </tr>
            </tbody>
          </table>
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
          <li>- admin pode ver todos os deparas e terá filtro para todos ou um específico</li>
          <li>- filtro por mês e tirar dos últimos 7 dias</li>
          <li>fazer gráfico de todos os meses</li>
          <li>filtro para o anos e brasil e rsi</li>
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
    maxWidth: "980px",
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
  smallTable: {
    marginTop: 6,
    width: "100%",
    borderCollapse: "separate",
    borderSpacing: "0 6px",
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
  },
  label: { fontSize: 13, color: "#555", fontWeight: 600 },
  select: {
    padding: "8px 10px",
    borderRadius: 8,
    border: "1px solid #ddd",
    background: "#fff",
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
    textAlign: "center",
  },
  tdHead: {
    padding: "8px",
    borderBottom: "1px solid #f1f1f1",
    fontWeight: 700,
    textAlign: "left",
    color: "#333",
    width: 90,
  },
  td: {
    padding: "8px",
    borderBottom: "1px solid #f1f1f1",
    textAlign: "center",
  },
};
