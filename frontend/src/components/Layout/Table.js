import Style from "./Table.module.css";
import LoadingSvg from "../Item-Layout/Loading";
import axios from "axios";
import { toast } from "react-toastify";
import { useState, useMemo, useEffect, useRef } from "react";
import { format } from "date-fns";
import { fromZonedTime } from "date-fns-tz";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import FiltrosSelecao from "./../Tools/FiltrosSelecao";

export default function Table({ canal, login, admin, Url }) {
  const [search, setSearch] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [latest, setLatest] = useState(true);
  const lastReqId = useRef(0);
  const [isLoading, setIsLoading] = useState(false);
  const [dataBase, setDatabase] = useState([]);

  const rotas = {
    PME: "pme",
    Varejo: "varejo",
    LP: "lojapropria",
    PAP: "portaaporta",
    AA: "agenteautorizado",
    PAP_PREMIUM: "pap_premium",
  };

  const [rota, setRota] = useState(rotas[canal]);

  // Mantém 'rota' em sincronia quando 'canal' mudar
  useEffect(() => {
    setRota(rotas[canal]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canal]);

  // Normalizador: transforma qualquer resposta em array
  const toArray = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (payload?.data && Array.isArray(payload.data)) return payload.data;
    return [];
  };

  const fetchData = async () => {
    if (!Url || !rota) return;

    const base = Url.endsWith("/") ? Url.slice(0, -1) : Url;
    const endpoint = `${base}/${rota}`;
    const reqId = ++lastReqId.current;

    setIsLoading(true);

    try {
      // Enviamos start, end e latest juntos
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

  const parseAsDate = (value) => {
    if (!value) return null;
    const d = new Date(value);
    return isNaN(d) ? null : d;
  };

  const DATA_ATUALIZACAO_info = useMemo(() => {
    if (!Array.isArray(dataBase) || dataBase.length === 0) return null;

    const datasValidas = dataBase
      .map((item) => parseAsDate(item.DATA_ATUALIZACAO))
      .filter(Boolean)
      .sort((a, b) => a - b);

    if (datasValidas.length === 0) return null;

    const ultima = datasValidas.at(-1);
    const zoned = fromZonedTime(ultima, "America/Sao_Paulo");

    return format(zoned, "HH:mm dd/MM/yyyy");
  }, [dataBase]);

  const LOGIN_ATUALIZACAO_info = useMemo(() => {
    if (!Array.isArray(dataBase) || dataBase.length === 0) return null;

    const logins = dataBase
      .map((item) => item.LOGIN_ATUALIZACAO)
      .filter(Boolean)
      .sort();

    return logins.at(-1) ?? null;
  }, [dataBase]);

  const ANOMES = format(
    fromZonedTime(new Date(), "America/Sao_Paulo"),
    "yyyyMM",
  );

  // ===== Upload Excel =====
  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      if (canal === "PAP") {
        const response = await axios.post(`${Url}/upload-excel-PAP`, formData, {
          headers: { "Content-Type": "multipart/form-data", login: login },
        });
        toast.success("Arquivo enviado com sucesso!");
        const normalized = toArray(response.data);
        setDatabase(normalized);
      }
      if (canal === "PME") {
        const response = await axios.post(`${Url}/upload-excel-pme`, formData, {
          headers: { "Content-Type": "multipart/form-data", login: login },
        });
        toast.success("Arquivo enviado com sucesso!");
        const normalized = toArray(response.data);
        setDatabase(normalized);
      }
      if (canal === "LP") {
        const response = await axios.post(`${Url}/upload-excel-lp`, formData, {
          headers: { "Content-Type": "multipart/form-data", login: login },
        });
        toast.success("Arquivo enviado com sucesso!");
        const normalized = toArray(response.data);
        setDatabase(normalized);
      }
      if (canal === "Varejo") {
        const response = await axios.post(
          `${Url}/upload-excel-varejo`,
          formData,
          {
            headers: { "Content-Type": "multipart/form-data", login: login },
          },
        );
        toast.success("Arquivo enviado com sucesso!");
        const normalized = toArray(response.data);
        setDatabase(normalized);
      }
      if (canal === "AA") {
        const response = await axios.post(`${Url}/upload-excel-AA`, formData, {
          headers: { "Content-Type": "multipart/form-data", login: login },
        });
        toast.success("Arquivo enviado com sucesso!");
        const normalized = toArray(response.data);
        setDatabase(normalized);
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.sql || "Erro ao enviar o arquivo");
    }

    fetchData();
    e.target.value = "";
  };

  // ===== Download Excel =====
  const handleDownload = () => {
    if (!Array.isArray(dataBase) || dataBase.length === 0) {
      toast.warning("Não há dados para download");
      return;
    }

    const formattedData = dataBase.map(
      ({ ID, DATA_MAX, DATA_ATUALIZACAO, LOGIN_ATUALIZACAO, ...rest }) => rest,
    );

    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    const workbook = XLSX.utils.book_new();

    const sheetName = rotas[canal];

    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    saveAs(
      new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }),
      `${sheetName.toLowerCase()}_${ANOMES}.xlsx`,
    );
  };

  const filteredData = dataBase ?? [];

  return (
    <main className={Style.main}>
      <section>
        <div>
          <FiltrosSelecao
            search={search}
            setSearch={setSearch}
            start={start}
            setStart={setStart}
            end={end}
            setEnd={setEnd}
            latest={latest}
            setLatest={setLatest}
            isLoading={isLoading}
            className={Style.table}
          />
        </div>

        <div>
          {!admin && (
            <>
              <input type="file" accept=".xlsx,.xls" onChange={handleUpload} />
              <button onClick={handleDownload}>Download Excel</button>
            </>
          )}
        </div>

        <div>
          <p>
            <strong>Última atualização:</strong> {DATA_ATUALIZACAO_info || "—"}
            {LOGIN_ATUALIZACAO_info ? ` ${LOGIN_ATUALIZACAO_info.toUpperCase()}` : ""}
          </p>
        </div>
      </section>

      {/* TABELA */}
      <section>
        <table>
          <thead>
            {isLoading ? (
              <tr></tr>
            ) : (
              <tr>
                {canal === "LP" && (
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
                )}

                {canal === "PAP" && (
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

                {canal === "PME" && (
                  <>
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
                {canal === "Varejo" && (
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
                {canal === "AA" && (
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
            )}
          </thead>

          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={12}>
                  <LoadingSvg text="Carregando..." />
                </td>
              </tr>
            ) : (
              filteredData.map((item, idx) => (
                <tr key={item.ID || idx}>
                  {canal === "LP" && (
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

                  {canal === "PME" && (
                    <>
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

                  {canal === "PAP" && (
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
                  {canal === "Varejo" && (
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
                  {canal === "AA" && (
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
              ))
            )}
          </tbody>
        </table>
      </section>
    </main>
  );
}
