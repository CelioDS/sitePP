import { useEffect, useState } from "react";
import axios from "axios";
import Chart from "react-apexcharts";
import Style from "./tabelaResponsavel.module.css";
import { format } from "date-fns";
import { fromZonedTime } from "date-fns-tz";

export default function TabelaResponsavel() {
  const [data, setData] = useState([]);
  const [dataDaily, setDataDaily] = useState([]);
  const [loading, setLoading] = useState(true);
  const Url = process.env.REACT_APP_API_URL || "http://localhost:8000";
  const brasilDate = format(
    fromZonedTime(new Date(), "America/Sao_Paulo"),
    "yyyy-MM-dd"
  );
  const [dia, setDia] = useState();
  const [mes, setMes] = useState();
  const [ano, setAno] = useState();

  useEffect(() => {
    axios
      .get(`${Url}/tabelaResponsavel`, { params: { dia, mes, ano } })
      .then((res) => {
        setData(res.data);
        setLoading(false);
      })
      .catch((err) => console.error("Erro ao buscar dados:", err));

    axios
      .get(`${Url}/totalDia`)
      .then((res) => {
        setDataDaily(res.data);
        setLoading(false);
      })
      .catch((err) => console.error("Erro ao buscar dados:", err));

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dia, mes, ano]);

  if (loading) return <p>Carregando dados...</p>;

  // extrai os nomes dos responsáveis e somas totais

  const responsaveisFilter = data.filter(
    (item) => item.responsavel !== "TOTAL"
  );
  const responsaveis = responsaveisFilter.map((item) => item.responsavel);
  const totalAgendas = responsaveisFilter.map(
    (item) =>
      Object.values(item)
        .filter((v) => typeof v === "number")
        .reduce((a, b) => a + b, 0) 
  );

  const chartOptions = {
    chart: { type: "bar" },
    title: { text: "Resumo por Responsável" },
    xaxis: { categories: responsaveis },
  };

  const chartSeries = [{ name: "Total", data: totalAgendas }];

  return (
    <main style={{ padding: "1rem" }} className={Style.main}>
      <h2>📊 Relatório por Responsável</h2>
      <section className={Style.sectionFiltro}>
        <div>
          <label htmlFor=""></label>

          {/* Filtro por mês */}
          <select
            value={mes}
            onChange={(e) => {
              setDia("");
              setMes(e.target.value);
              setAno(ano);
            }}
          >
            <option value="">Todos os meses</option>
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={(i + 1).toString().padStart(2, "0")}>
                {i + 1}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor=""></label>

          {/* Filtro por ano */}
          <select
            value={ano}
            onChange={(e) => {
              setDia("");
              setMes("");
              setAno(e.target.value);
            }}
          >
            <option value="">Todos os anos</option>
            {Array.from({ length: 5 }, (_, i) => {
              const y = 2023 + i;
              return (
                <option key={y} value={y}>
                  {y}
                </option>
              );
            })}
          </select>
        </div>
        <div>
          <label htmlFor="date"></label>

          <input
            type="date"
            placeholder="Dia"
            value={ano && mes && dia ? `${ano}-${mes}-${dia}` : ""}
            onChange={(e) => {
              const [y, m, d] = e.target.value.split("-");
              setDia(d);
              setMes(m);
              setAno(y);
            }}
          />
        </div>

        <button
          onClick={() => {
            setDia(brasilDate.split("-")[2]);
            setMes(brasilDate.split("-")[1]);
            setAno(brasilDate.split("-")[0]);
          }}
        >
          clear
        </button>
      </section>
      {/* 📈 Gráfico de Totais por Dia */}
      <div style={{ maxWidth: 800, margin: "3rem auto" }}>
        <h2>📅 Total de Finalizados por Dia</h2>
        <Chart
          options={{
            chart: { type: "line" },
            title: { text: "Finalizações Diárias" },
            xaxis: {
              categories: dataDaily.map((item) => item.dia),
              title: { text: "Dia" },
            },
            yaxis: {
              title: { text: "Total" },
            },
            stroke: {
              curve: "smooth",
            },
            markers: {
              size: 4,
            },
          }}
          series={[
            {
              name: "Total Finalizado",
              data: dataDaily.map((item) => item.total),
            },
          ]}
          type="line"
          height={300}
        />
      </div>

      <div style={{ maxWidth: 800, margin: "auto" }}>
        <Chart
          options={chartOptions}
          series={chartSeries}
          type="bar"
          height={300}
        />
      </div>

      <table
        style={{
          width: "100%",
          marginTop: "2rem",
          borderCollapse: "collapse",
          textAlign: "left",
        }}
      >
        <thead>
          <tr>
            <th>Responsável</th>
            <th>Agenda Mantida</th>
            <th>Instalação Antecipada</th>
            <th>Sem Retorno</th>
            <th>Serviço Já Conectado</th>
            <th>Cancelado Cliente</th>
            <th>Erro Pacote</th>
            <th>Reagendada</th>
            <th>Quebra Técnica</th>
            <th>TOTAL</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, idx) => {
            const isTotalRow = item.responsavel === "TOTAL"; // verifica se é a linha TOTAL
            return (
              <tr
                key={idx}
                style={
                  isTotalRow
                    ? { backgroundColor: "#ffe5e5", fontWeight: "bold" }
                    : {}
                }
              >
                <td>{item.responsavel}</td>
                <td>{item.agenda_mantida}</td>
                <td>{item.Instalacao_Antecipada}</td>
                <td>{item.Sem_Retorno_do_Cliente}</td>
                <td>{item.Servico_Ja_Conectado}</td>
                <td>{item.Solicitado_ou_Cancelado_pelo_Cliente}</td>
                <td>{item.Erro_de_Pacote_ou_Cadastro_no_Sistema}</td>
                <td>{item.Instalacao_Reagendada}</td>
                <td>{item.Quebra_Tecnica_de_Instalacao}</td>
                <td
                  style={
                    isTotalRow
                      ? { color: "#e3262e", background: "#fe918d" }
                      : {}
                  }
                >
                  {item.total}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </main>
  );
}