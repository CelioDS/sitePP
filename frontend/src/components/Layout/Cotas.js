import { useEffect, useState } from "react";
import axios from "axios";
import React from "react";
import Style from "./Cotas.module.css";

export default function PainelBucketsPivot() {
  const [dados, setDados] = useState([]);
  const [dias, setDias] = useState([]);
  const [cidades, setCidades] = useState([]);
  const [segmentos, setSegmentos] = useState([]);

  const [cidadeFiltro, setCidadeFiltro] = useState("TODAS");
  const [segmentoFiltro, setSegmentoFiltro] = useState("TODOS");
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);

  // =========================
  // BUSCA DOS DADOS
  // =========================
  useEffect(() => {
    async function carregar() {
      try {
        const res = await axios.get("http://10.89.196.113:8000/cotas-cop");

        const lista = Object.values(res.data || {});

        // dias
        const diasUnicos = Array.from(
          new Set(lista.flatMap(item => Object.keys(item.dias || {})))
        ).sort(
          (a, b) => Number(a.replace("D", "")) - Number(b.replace("D", ""))
        );

        // cidades
        const cidadesUnicas = Array.from(
          new Set(lista.map(item => item.cidade))
        ).sort((a, b) => a.localeCompare(b, "pt-BR"));

        // segmentos
        const segmentosUnicos = Array.from(
          new Set(lista.map(item => item.mercado))
        ).sort((a, b) => a.localeCompare(b, "pt-BR"));

        setDados(lista);
        setDias(diasUnicos);
        setCidades(cidadesUnicas);
        setSegmentos(segmentosUnicos);
      } catch (e) {
        console.error("Erro ao buscar Buckets Pivot:", e);
      } finally {
        setLoading(false);
      }
    }

    carregar();
  }, []);

  // =========================
  // FILTRO FINAL (cidade + segmento + search)
  // =========================
  const dadosFiltrados = dados
    .filter(item =>
      cidadeFiltro === "TODAS" || item.cidade === cidadeFiltro
    )
    .filter(item =>
      segmentoFiltro === "TODOS" || item.mercado === segmentoFiltro
    )
    .filter(item => {
      if (!search) return true;
      const termo = search.toUpperCase();
      return (
        item.cidade.toUpperCase().includes(termo) ||
        item.mercado.toUpperCase().includes(termo)
      );
    })
    .sort((a, b) => a.cidade.localeCompare(b.cidade, "pt-BR"));

  // =========================
  // RENDER
  // =========================
  return (
    <main className={Style.main}>
      <h2>Painel COP – Cotas por Cidade</h2>

      {/* 🔎 FILTROS */}
      <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
        {/* Cidade */}
        <div>
          <label>Cidade:&nbsp;</label>
          <select
            value={cidadeFiltro}
            onChange={e => setCidadeFiltro(e.target.value)}
          >
            <option value="TODAS">Todas</option>
            {cidades.map(cidade => (
              <option key={cidade} value={cidade}>
                {cidade}
              </option>
            ))}
          </select>
        </div>

        {/* Segmento */}
        <div>
          <label>Segmento:&nbsp;</label>
          <select
            value={segmentoFiltro}
            onChange={e => setSegmentoFiltro(e.target.value)}
          >
            <option value="TODOS">Todos</option>
            {segmentos.map(seg => (
              <option key={seg} value={seg}>
                {seg}
              </option>
            ))}
          </select>
        </div>

        {/* Search */}
        <div>
          <label>Pesquisar:&nbsp;</label>
          <input
            type="text"
            placeholder="Cidade ou segmento"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <p>Carregando dados...</p>
      ) : (
        <div className={Style["table-container"]}>
          <table>
            <thead>
              <tr>
                <th>Cidade</th>
                <th>Segmento</th>
                {dias.map(dia => (
                  <th key={dia} colSpan={3}>{dia}</th>
                ))}
              </tr>

              <tr>
                <th></th>
                <th></th>
                {dias.map(dia => (
                  <React.Fragment key={dia}>
                    <th>Cota</th>
                    <th>OS</th>
                    <th>%</th>
                  </React.Fragment>
                ))}
              </tr>
            </thead>

            <tbody>
              {dadosFiltrados.map((item, idx) => (
                <tr key={idx}>
                  <td className={Style.city}>{item.cidade}</td>
                  <td className={Style.segmento}>{item.mercado}</td>

                  {dias.map(dia => {
                    const d = item.dias[dia];
                    const percentClass =
                      d?.taxa_ocupacao > 100
                        ? Style["percent-danger"]
                        : d?.taxa_ocupacao > 80
                        ? Style["percent-warning"]
                        : Style["percent-normal"];

                    return (
                      <React.Fragment key={dia}>
                        <td>{d?.qtd_os ?? 0}</td>
                        <td>{d?.saldo ?? 0}</td>
                        <td className={percentClass}>
                          {d?.taxa_ocupacao ?? 0}%
                        </td>
                      </React.Fragment>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}