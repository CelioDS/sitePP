import { useMemo, useState, useEffect } from "react";
import React from "react"; // Necessário para usar React.Fragment
import styles from "./CalendarGraph.module.css";
import axios from "axios";
import { FaCaretDown } from "react-icons/fa";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import ptBR from "date-fns/locale/pt-BR";

export default function GraficoPDU({ year, Url, referencia = "BR" }) {
  const [dataFULL, setDataFULL] = useState(null);

  const tz = "America/Sao_Paulo";
  const hojeBR = toZonedTime(new Date(), tz);
  const tituloMes = format(hojeBR, "yyyyMM", { locale: ptBR }); // ex.: janeiro de 2026

  useEffect(() => {
    const fetchData = async () => {
      try {
        const params = new URLSearchParams();
        if (year) params.set("year", year);

        const resp = await axios.get(`${Url}/PduFullGrafico?}`);
        setDataFULL(resp.data || []);
      } catch (err) {
        console.error("Erro ao carregar dados:", err);
        setDataFULL([]);
      }
    };

    fetchData();
  }, [Url, year]);

  // Define o sufixo baseado na referencia recebida da Home
  const suffix = referencia === "SP_INT" ? "_soma_RSI" : "_soma_br";

  const tituloAbrangencia =
    referencia === "SP_INT" ? "SÃO PAULO INTERIOR" : "BRASIL";

  const yearData = useMemo(() => {
    if (!dataFULL || !Array.isArray(dataFULL)) return [];

    const filterYear = year || "2026";

    return dataFULL
      .filter((d) => d.anomes && d.anomes.toString().startsWith(filterYear))
      .sort((a, b) => a.anomes - b.anomes);
  }, [dataFULL, year]);

  const getMonthName = (anomes) => {
    const months = [
      "JAN",
      "FEV",
      "MAR",
      "ABR",
      "MAI",
      "JUN",
      "JUL",
      "AGO",
      "SET",
      "OUT",
      "NOV",
      "DEZ",
    ];
    const monthIndex = parseInt(anomes.toString().slice(4, 6)) - 1;
    return months[monthIndex];
  };

  const GraphRow = ({ title, color, baseKey }) => {
    if (yearData.length === 0) return null;

    // Constrói a chave: Ex: MOVEL + _soma_br
    const dataKey = `${baseKey}${suffix}`;

    // Calcula máximo. Converte para Number para garantir.
    const maxValue =
      Math.max(...yearData.map((d) => Number(d[dataKey]) || 0)) * 1.3;

    return (
      <main className={styles.rowContainer}>
        <div className={styles.rowHeader} style={{ backgroundColor: color }}>
          {title}
        </div>

        <div className={styles.chartArea}>
          {yearData.map((item, index) => {
            const currentVal = Number(item[dataKey]);
            // Pega o valor anterior para calcular %
            const prevVal =
              index > 0 ? Number(yearData[index - 1][dataKey]) : null;

            let percentChange = 0;
            // Verifica se prevVal existe e não é zero para evitar divisão por zero
            if (prevVal !== null && prevVal !== 0) {
              percentChange = ((currentVal - prevVal) / prevVal) * 100;
            }

            const barHeight = maxValue > 0 ? (currentVal / maxValue) * 100 : 0;

            return (
              <React.Fragment key={item.anomes}>
                {/* CORREÇÃO: Removido <main>, usando React.Fragment para manter o layout flex correto */}

                {/* Conector com Seta (aparece a partir do segundo item) */}
                {index > 0 && (
                  <div className={styles.connectorWrapper} >
                    <div className={styles.connectorLine}>
                      <div className={styles.percentBadge}>
                        {percentChange > 0 ? "+" : ""}
                        {percentChange.toFixed(1).replace(".", ",")}%
                      </div>
                      <div className={styles.arrowTip}>
                        <FaCaretDown size={14} color="#999" />
                      </div>
                    </div>
                  </div>
                )}

                <div className={styles.barWrapper}>
                  <span className={styles.barValue}>
                    {currentVal?.toFixed(2).replace(".", ",")}
                  </span>
                  <div
                    className={styles.bar}
                    style={{
                      height: `${barHeight}%`,
                      backgroundColor: Number(tituloMes) === item.anomes ? "#D35F65" : "#A9A9A9",
                    }}
                  />
                  <span className={styles.barLabel}>
                    {getMonthName(item.anomes)}
                  </span>
                </div>
              </React.Fragment>
            );
          })}
        </div>
      </main>
    );
  };

  if (!yearData || yearData.length === 0) {
    return (
      <div style={{ padding: 20, textAlign: "center", color: "#888" }}>
        Carregando gráfico ou sem dados para {year}...
      </div>
    );
  }

  return (
    <div className={styles.mainContainer}>
      <div className={styles.mainHeader}>
        <h2>CALENDÁRIO | D.U</h2>
        <p>
          RESIDENCIAL | MÓVEL |{" "}
          <span style={{ color: "#9E2A2F", fontWeight: "bold" }}>
            {tituloAbrangencia}
          </span>
        </p>
      </div>

      <GraphRow title="D.U VENDA BRUTA" color="#707070" baseKey="VB" />
      <GraphRow title="D.U INSTALAÇÃO" color="#3E546B" baseKey="INST" />
      {/* Esta linha agora busca MOVEL_soma_br ou MOVEL_soma_RSI */}
      <GraphRow title="D.U MÓVEL" color="#9E2A2F" baseKey="MOVEL" />
    </div>
  );
}
