import { useState, useEffect, useMemo, useRef } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import LoadingSvg from "../Item-Layout/Loading";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { format } from "date-fns";
import { fromZonedTime } from "date-fns-tz";
import Style from "./TableAdmin.module.css";

import TableFilters from "./../Tools/FiltrosSelecao";

export default function TableAdmin({ Url }) {
  const [dataBase, setDatabase] = useState([]);
  const [rota, setRota] = useState("lojapropria");
  const [isLoading, setIsLoading] = useState(false);

  // Filtros
  const [search, setSearch] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [latest, setLatest] = useState(true); // Padrão ligado ou desligado conforme preferir

  const lastReqId = useRef(0);

  const colSpan = useMemo(() => {
    if (rota === "portaaporta") return 22;
    if (rota === "lojapropria") return 10;
    if (rota === "VAREJO") return 14;
  }, [rota]);

  const toArray = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (payload?.data && Array.isArray(payload.data)) return payload.data;
    return [];
  };

  // Info de data apenas visual
  const DATA_ATUALIZACAO_info = useMemo(() => {
    if (!Array.isArray(dataBase) || dataBase.length === 0) return null;
    const datas = dataBase.map((item) => item.DATA_ATUALIZACAO).filter(Boolean);
    if (!datas.length) return null;
    return format(
      fromZonedTime(datas.sort().at(-1), "America/Sao_Paulo"),
      "HH:mm dd-MM-yyyy ",
    );
  }, [dataBase]);

  const LOGIN_ATUALIZACAO_info = useMemo(() => {
    if (!Array.isArray(dataBase) || dataBase.length === 0) return null;
    return dataBase
      .map((item) => item.LOGIN_ATUALIZACAO)
      .filter(Boolean)
      .sort()
      .at(-1);
  }, [dataBase]);

  const fetchData = async () => {
    if (!Url || !rota) return;

    const base = Url.endsWith("/") ? Url.slice(0, -1) : Url;
    const endpoint = `${base}/${rota}`;
    const reqId = ++lastReqId.current;

    setIsLoading(true);

    try {
      // MUDANÇA AQUI: Enviamos start, end e latest JUNTOS.
      const params = {
        q: search || undefined,
        start: start || undefined,
        end: end || undefined,
        latest: latest, // true ou false
        limit: 2000,
      };

      const resp = await axios.get(endpoint, { params });

      if (reqId !== lastReqId.current) return;
      setDatabase(toArray(resp.data));
    } catch (err) {
      if (reqId !== lastReqId.current) return;
      console.error("Erro ao carregar:", err);
      toast.error("Erro ao carregar dados");
      setDatabase([]);
    } finally {
      if (reqId === lastReqId.current) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [Url, rota, search, start, end, latest]);

  const handleDownload = () => {
    if (!dataBase.length) {
      toast.warning("Não há dados para download");
      return;
    }
    const formattedData = dataBase.map(
      ({ ID, DATA_MAX, DATA_ATUALIZACAO, LOGIN_ATUALIZACAO, ...rest }) => rest,
    );
    const sheet = XLSX.utils.json_to_sheet(formattedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, rota);
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    // Nome do arquivo dinâmico
    const prefix = latest ? "LatestMes" : "Geral";
    const range = start ? `_${start}_${end}` : "";
    saveAs(blob, `${rota}_${prefix}${range}.xlsx`);
  };

  return (
    <main className={Style.main}>
      <TableFilters
        search={search}
        setSearch={setSearch}
        start={start}
        setStart={setStart}
        end={end}
        setEnd={setEnd}
        latest={latest}
        setLatest={setLatest}
        isLoading={isLoading}
      />

      <section style={{ marginTop: 12 }}>
        <section className={Style.asideBTN}>
          <button
            style={{
              background: rota === "lojapropria" ? "#740404" : undefined,
            }}
            disabled={rota === "lojapropria" || isLoading}
            onClick={() => setRota("lojapropria")}
          >
            Loja Própria
          </button>
          <button
            style={{
              background: rota === "portaaporta" ? "#740404" : undefined,
            }}
            disabled={rota === "portaaporta" || isLoading}
            onClick={() => setRota("portaaporta")}
          >
            Porta a Porta
          </button>
          <button
            style={{
              background: rota === "Varejo" ? "#740404" : undefined,
            }}
            disabled={rota === "Varejo" || isLoading}
            onClick={() => setRota("Varejo")}
          >
            Varejo
          </button>
          {console.log(rota)}

          <button
            style={{
              background: rota === "PME" ? "#740404" : undefined,
            }}
            disabled={rota === "PME" || isLoading}
            onClick={() => setRota("PME")}
          >
            PME
          </button>
          <button
            style={{
              background: rota === "agenteautorizado" ? "#740404" : undefined,
            }}
            disabled={rota === "agenteautorizado" || isLoading}
            onClick={() => setRota("agenteautorizado")}
          >
            Agente Autorizado
          </button>
          <button
            onClick={handleDownload}
            disabled={isLoading || dataBase.length === 0}
          >
            Download Excel
          </button>
        </section>

        <p>
          <strong>Última atualização (do resultado):</strong>{" "}
          {DATA_ATUALIZACAO_info || "—"} {LOGIN_ATUALIZACAO_info || "—"}
        </p>

        <table style={{ marginTop: 12, width: "100%" }}>
          <thead>
            <tr>
              {isLoading ? (
                <th colSpan={colSpan}>
                  <LoadingSvg text="Carregando..." />
                </th>
              ) : (
                rota === "lojapropria" && (
                  <>
                    <th>CANAL</th>
                    <th>COLABORADOR</th>
                    <th>LOGIN_CLARO</th>
                    <th>COMTA</th>
                    <th>CABEAMENTO</th>
                    <th>LOGIN_NET</th>
                    <th>LOJA</th>
                    <th>CIDADE</th>
                    <th>COORDENADOR</th>
                    <th>STATUS</th>
                  </>
                )
              )}

              {rota === "portaaporta" && (
                <>
                  <th>CANAL</th>
                  <th>IBGE</th>
                  <th>CIDADE</th>
                  <th>PARCEIRO LOJA</th>
                  <th>CNPJ</th>
                  <th>NOME</th>
                  <th>CLASSIFICAÇÃO</th>
                  <th>SEGMENTO</th>
                  <th>PRODUTO_ATUACAO</th>
                  <th>DATA_CADASTRO</th>
                  <th>SITUACAO</th>
                  <th>TIPO</th>
                  <th>RAZAO_SOCIAL</th>
                  <th>LOGIN NET</th>
                  <th>LOGIN CLARO</th>
                  <th>EXECUTIVO</th>
                  <th>GRUPO</th>
                  <th>COMTA</th>
                  <th>CABEAMENTO</th>
                  <th>FILIAL COORDENADOR</th>
                </>
              )}
              {rota === "Varejo" && (
                <>
                  <th>ANOMES</th>
                  <th>CANAL</th>
                  <th>IBGE</th>
                  <th>COD_PDV</th>
                  <th>PARCEIRO_LOJA</th>
                  <th>CNPJ</th>
                  <th>NM_VEND</th>
                  <th>CARGO</th>
                  <th>CPF_VEND</th>
                  <th>PRODUTO_ATUACAO</th>
                  <th>DATA_CADASTRO</th>
                  <th>SITUACAO</th>
                  <th>FILIAL</th>
                  <th>GN</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {!isLoading && !dataBase.length && (
              <tr>
                <td colSpan={colSpan} style={{ textAlign: "center" }}>
                  Sem dados...
                </td>
              </tr>
            )}
            {!isLoading &&
              dataBase.map((item, idx) => (
                <tr key={idx}>
                  {rota === "lojapropria" && (
                    <>
                      <td>{item.CANAL}</td>
                      <td>{item.COLABORADOR}</td>
                      <td>{item.LOGIN_CLARO}</td>
                      <td>{item.COMTA}</td>
                      <td>{item.CABEAMENTO}</td>
                      <td>{item.LOGIN_NET}</td>
                      <td>{item.LOJA}</td>
                      <td>{item.CIDADE}</td>
                      <td>{item.COORDENADOR}</td>
                      <td>{item.STATUS}</td>
                    </>
                  )}
                  {rota === "portaaporta" && (
                    <>
                      <td>{item.CANAL}</td>
                      <td>{item.IBGE}</td>
                      <td>{item.CIDADE}</td>
                      <td>{item.PARCEIRO_LOJA}</td>
                      <td>{item.CNPJ}</td>
                      <td>{item.NOME}</td>
                      <td>{item.CLASSIFICACAO}</td>
                      <td>{item.SEGMENTO}</td>
                      <td>{item.PRODUTO_ATUACAO}</td>
                      <td>{item.DATA_CADASTRO}</td>
                      <td>{item.SITUACAO}</td>
                      <td>{item.TIPO}</td>
                      <td>{item.RAZAO_SOCIAL}</td>
                      <td>{item.LOGIN_NET}</td>
                      <td>{item.LOGIN_CLARO}</td>
                      <td>{item.EXECUTIVO}</td>
                      <td>{item.GRUPO}</td>
                      <td>{item.COMTA}</td>
                      <td>{item.CABEAMENTO}</td>
                      <td>{item.FILIAL_COORDENADOR}</td>
                    </>
                  )}
                  {rota === "Varejo" && (
                    <>
                      <td>{item.ANOMES}</td>
                      <td>{item.CANAL}</td>
                      <td>{item.IBGE}</td>
                      <td>{item.COD_PDV}</td>
                      <td>{item.PARCEIRO_LOJA}</td>
                      <td>{item.CNPJ}</td>
                      <td>{item.NOME_COLABORADOR}</td>
                      <td>{item.CARGO}</td>
                      <td>{item.CPF_COLABORADOR}</td>
                      <td>{item.PRODUTO_ATUACAO}</td>
                      <td>{item.DATA_CADASTRO}</td>
                      <td>{item.SITUACAO}</td>
                      <td>{item.FILIAL_COORDENADOR}</td>
                      <td>{item.GN}</td>
                    </>
                  )}
                </tr>
              ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}
