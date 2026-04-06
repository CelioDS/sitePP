import { useState, useEffect, useMemo, useRef } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import LoadingSvg from "../Item-Layout/Loading";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { format } from "date-fns";
import { fromZonedTime } from "date-fns-tz";
import Style from "./TableAdmin.module.css";
import { FiDownload } from "react-icons/fi";

import TableFilters from "./../Tools/FiltrosSelecao";

export default function TableAdmin({ Url }) {
  const [dataBase, setDatabase] = useState([]);
  const [rota, setRota] = useState("lojapropria");
  const [isLoading, setIsLoading] = useState(false);
  const cacheRef = useRef(new Map()); // Cache para armazenar os dados por rota

  //paginação
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const totalPages = useMemo(() => {
    return Math.ceil(dataBase.length / pageSize) || 1;
  }, [dataBase, pageSize]);

  const paginatedData = useMemo(() => {
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;

    return dataBase.slice(startIndex, endIndex);
  }, [dataBase, page, pageSize]);

  // Filtros
  const [search, setSearch] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [latest, setLatest] = useState(true); // Padrão ligado ou desligado conforme preferir

  useEffect(() => {
    setPage(1);
  }, [rota, search, start, end, latest]);

  const lastReqId = useRef(0);

  const colSpan = useMemo(() => {
    if (rota === "portaaporta") return 22;
    if (rota === "lojapropria") return 10;
    if (rota === "VAREJO") return 14;
    if (rota === "PME") return 14;
    if (rota === "agenteautorizado") return 14;
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

    const params = {
      q: search || undefined,
      start: start || undefined,
      end: end || undefined,
      latest,
      limit: 2000000,
    };

    const cacheKey = JSON.stringify({ rota, ...params });

    // 🔥 SE EXISTIR CACHE → NÃO FAZ REQUEST
    if (cacheRef.current.has(cacheKey)) {
      setDatabase(cacheRef.current.get(cacheKey));
      return;
    }

    setIsLoading(true);

    try {
      const resp = await axios.get(endpoint, { params });

      if (reqId !== lastReqId.current) return;

      const data = toArray(resp.data);

      // 🔥 SALVA NO CACHE
      cacheRef.current.set(cacheKey, data);

      if (cacheRef.current.size > 20) {
        cacheRef.current.clear();
      }

      setDatabase(data);
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

  const handleDownloadAll = () => {
    const base = Url.endsWith("/") ? Url.slice(0, -1) : Url;
    const url = `${base}/FullCateiras`;

    const link = document.createElement("a");
    link.href = url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
              background: rota === "lojapropria" ? "#cc8686" : undefined,
              color: rota === "lojapropria" ? "#6b5757" : undefined,
              cursor: rota === "lojapropria" ? "not-allowed" : null,
            }}
            disabled={rota === "lojapropria" || isLoading}
            onClick={() => setRota("lojapropria")}
          >
            Loja Própria
          </button>
          <button
            style={{
              background: rota === "portaaporta" ? "#cc8686" : undefined,
              color: rota === "portaaporta" ? "#6b5757" : undefined,
              cursor: rota === "portaaporta" ? "not-allowed" : null,
            }}
            disabled={rota === "portaaporta" || isLoading}
            onClick={() => setRota("portaaporta")}
          >
            Porta a Porta
          </button>
          <button
            style={{
              background: rota === "Varejo" ? "#cc8686" : undefined,
              color: rota === "Varejo" ? "#6b5757" : undefined,
              cursor: rota === "Varejo" ? "not-allowed" : null,
            }}
            disabled={rota === "Varejo" || isLoading}
            onClick={() => setRota("Varejo")}
          >
            Varejo
          </button>
          <button
            style={{
              background: rota === "PME" ? "#cc8686" : undefined,
              color: rota === "PME" ? "#6b5757" : undefined,
              cursor: rota === "PME" ? "not-allowed" : null,
            }}
            disabled={rota === "PME" || isLoading}
            onClick={() => setRota("PME")}
          >
            PME
          </button>
          <button
            style={{
              background: rota === "agenteautorizado" ? "#cc8686" : undefined,
              color: rota === "agenteautorizado" ? "#6b5757" : undefined,
              cursor: rota === "agenteautorizado" ? "not-allowed" : null,
            }}
            disabled={rota === "agenteautorizado" || isLoading}
            onClick={() => setRota("agenteautorizado")}
          >
            Agente Autorizado
          </button>
          <button
            onClick={handleDownload}
            disabled={isLoading || dataBase.length === 0}
            style={{
              color: "#ff0000",
              borderRadius: 0,
              background: dataBase.length === 0 ? "#5e5d5d" : "hsl(0, 0%, 0%)",
              cursor: dataBase.length === 0 ? "not-allowed" : null,
            }}
          >
            Download Excel
            <FiDownload color="#ffffff" size={18} />
          </button>

          <button
            onClick={handleDownloadAll}
            disabled={isLoading || dataBase.length === 0}
            style={{
              color: "#ff0000",
              borderRadius: 0,
              background: dataBase.length === 0 ? "#5e5d5d" : "#000000",
              cursor: dataBase.length === 0 ? "not-allowed" : null,
            }}
          >
            Consolidado
            <FiDownload color="#ffffff" size={18} />
          </button>
        </section>

        <div className={Style.PageSize}>
          <p className={Style.DisplayAtualizacao}>
            <strong>Última atualização:</strong>
            {DATA_ATUALIZACAO_info || "—"} {LOGIN_ATUALIZACAO_info || "—"}
          </p>

          <select
            name="pageSize"
            id="pageSize"
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value={250}>250</option>
            <option value={500}>500</option>
            <option value={1000}>1000</option>
          </select>
        </div>

        <section className={Style.sectionTable}>
          {isLoading && dataBase.length === 0 ? (
            <p colSpan={colSpan}>
              <LoadingSvg text="Carregando..." />
            </p>
          ) : (
            <table>
              <thead>
                <tr>
                  {rota === "lojapropria" && (
                    <>
                      <th>ANOMES</th>
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
                  )}
                  {rota === "portaaporta" && (
                    <>
                      <th>ANOMES</th>
                      <th>CANAL</th>
                      <th>ESTRUTURA</th>
                      <th>IBGE</th>
                      <th>CNPJ</th>
                      <th>PARCEIRO LOJA</th>
                      <th>CLASSIFICAÇÃO</th>
                      <th>SEGMENTO</th>
                      <th>LOGIN NET</th>
                      <th>LOGIN CLARO</th>
                      <th>NOME</th>
                      <th>DATA_CADASTRO</th>
                      <th>SITUACAO</th>
                      <th>EXECUTIVO</th>
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
                  {rota === "PME" && (
                    <>
                      <th>ANOMES</th>
                      <th>CANAL</th>
                      <th>COMTA</th>
                      <th>GRUPO</th>
                      <th>PARCEIRO LOJA</th>
                      <th>CNPJ</th>
                      <th>NOME</th>
                      <th>LOGIN NET</th>
                      <th>TERRITORIO</th>
                    </>
                  )}
                  {rota === "agenteautorizado" && (
                    <>
                      <th>ANOMES</th>
                      <th>CANAL</th>
                      <th>IBGE</th>
                      <th>CIDADE</th>
                      <th>PARCEIRO_LOJA</th>
                      <th>CNPJ</th>
                      <th>NOME</th>
                      <th>CLASSIFICACAO</th>
                      <th>SEGMENTO</th>
                      <th>PRODUTO_ATUACAO</th>
                      <th>DATA_CADASTRO</th>
                      <th>SITUACAO</th>
                      <th>LOGIN_NET</th>
                      <th>TIPO</th>
                      <th>LOGIN_CLARO</th>
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
                  paginatedData.map((item, idx) => (
                    <tr key={idx}>
                      {rota === "lojapropria" && (
                        <>
                          <td>{item.ANOMES}</td>
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
                          <td>{item.ANOMES}</td>
                          <td>{item.CANAL}</td>
                          <td>{item.ESTRUTURA}</td>
                          <td>{item.IBGE}</td>
                          <td>{item.CNPJ}</td>
                          <td>{item.PARCEIRO_LOJA}</td>
                          <td>{item.CLASSIFICACAO}</td>
                          <td>{item.SEGMENTO}</td>
                          <td>{item.LOGIN_NET}</td>
                          <td>{item.LOGIN_CLARO}</td>
                          <td>{item.NOME}</td>
                          <td>{item.DATA_CADASTRO}</td>
                          <td>{item.SITUACAO}</td>
                          <td>{item.EXECUTIVO}</td>
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
                      {rota === "PME" && (
                        <>
                          <td>{item.ANOMES}</td>
                          <td>{item.CANAL}</td>
                          <td>{item.COMTA}</td>
                          <td>{item.GRUPO}</td>
                          <td>{item.PARCEIRO_LOJA}</td>
                          <td>{item.CNPJ}</td>
                          <td>{item.NOME}</td>
                          <td>{item.LOGIN_NET}</td>
                          <td>{item.TERRITORIO}</td>
                        </>
                      )}

                      {rota === "agenteautorizado" && (
                        <>
                          <td>{item.ANOMES}</td>
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
                          <td>{item.LOGIN_NET}</td>
                          <td>{item.TIPO}</td>
                          <td>{item.LOGIN_CLARO}</td>
                        </>
                      )}
                    </tr>
                  ))}
              </tbody>
            </table>
          )}
        </section>
        <div className={Style.pagination}>
          <button
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            disabled={page === 1 || isLoading}
            style={{
              background: page === 1 ? "#504e4e" : "",
              cursor: page === 1 && "not-allowed",
            }}
          >
            ◀ anterior
          </button>

          <span>
            Pagina {page} de {totalPages} - {dataBase.length} registros
          </span>

          <button
            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
            disabled={page === totalPages || isLoading}
            style={{
              background: page === totalPages ? "#ccc" : "",
              cursor: page === totalPages && "not-allowed",
            }}
          >
            proximo ▶
          </button>
        </div>
      </section>
    </main>
  );
}
