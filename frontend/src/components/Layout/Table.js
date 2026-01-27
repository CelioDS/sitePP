
import Style from "./Table.module.css";
import LoadingSvg from "../Item-Layout/Loading";
import axios from "axios";
import { toast } from "react-toastify";
import { useState, useMemo, useEffect } from "react";
import { format } from "date-fns";
import { fromZonedTime } from "date-fns-tz";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export default function Table({
  dataBase,
  setDataBase,
  canal,
  login,
  admin,
  fetchData,
  Url,
}) {
  // ===== NOVOS ESTADOS: filtro por período =====
  const [start, setStart] = useState(""); // YYYY-MM-DD
  const [end, setEnd] = useState(""); // YYYY-MM-DD
  const [latest, setLatest] = useState(true); // quando true ignora período

  // ===== FILTRO DE TEXTO =====
  const [search, setSearch] = useState("");

  const dateFieldByCanal = useMemo(() => {
    if (canal === "PAP") return "DATA_CADASTRO";
    return "DATA_ATUALIZACAO"; // LP e PEP
  }, [canal]);

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
    return format(zoned, "HH:mm dd-MM-yyyy");
  }, [dataBase]);

  const LOGIN_ATUALIZACAO_info = useMemo(() => {
    if (!Array.isArray(dataBase) || dataBase.length === 0) return null;

    const logins = dataBase
      .map((item) => item.LOGIN_ATUALIZACAO)
      .filter(Boolean)
      .sort();

    return logins.at(-1) ?? null;
  }, [dataBase]);

  const toArray = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (payload?.data && Array.isArray(payload.data)) return payload.data;
    return [];
  };

  const brasilDate = format(
    fromZonedTime(new Date(), "America/Sao_Paulo"),
    "yyyy-MM"
  );
  const ANOMES = brasilDate.replace("-", "");

  // ===========================================================
  //  FETCH AUTOMÁTICO QUANDO FILTROS MUDAM
  // ===========================================================
  const fetchFilteredData = async () => {
    try {
      const response = await axios.get(Url, {
        params: {
          q: search || "",
          start: latest ? "" : start,
          end: latest ? "" : end,
          latest: latest,
          limit: 5000,
        },
      });

      setDataBase(response.data);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao buscar dados filtrados.");
    }
  };

  useEffect(() => {
    fetchFilteredData();
  }, [search, start, end, latest]);

  // ===== Upload Excel =====
  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axios.post(`${Url}/upload-excel-lp`, formData, {
        headers: { "Content-Type": "multipart/form-data", login: login },
      });

      toast.success("Arquivo enviado com sucesso!");
      const normalized = toArray(response.data);
      setDataBase(normalized);
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.sql || "Erro ao enviar o arquivo");
    }

    fetchFilteredData();
    e.target.value = "";
  };

  // ===== Download Excel =====
  const handleDownload = () => {
    if (!Array.isArray(dataBase) || dataBase.length === 0) {
      toast.warning("Não há dados para download");
      return;
    }

    const formattedData = dataBase.map(
      ({ ID, DATA_MAX, LOGIN_ATUALIZACAO, ...rest }) => rest
    );

    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    const workbook = XLSX.utils.book_new();
    const sheetName =
      canal === "LP" ? "LojaPropria" : canal === "PAP" ? "PortaAPorta" : "PEP";

    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    saveAs(blob, `${sheetName.toLowerCase()}_${ANOMES}.xlsx`);
  };

  // ====== Carregamento ======
  const isLoading = dataBase === null;

  // Helpers rápidos
  const setLastNDays = (n) => {
    const hoje = new Date();
    const ini = new Date();
    ini.setDate(hoje.getDate() - n);
    setStart(ini.toISOString().slice(0, 10));
    setEnd(hoje.toISOString().slice(0, 10));
    setLatest(false);
  };

  const clearPeriod = () => {
    setStart("");
    setEnd("");
    setLatest(true);
  };

  const filteredData = dataBase ?? [];

  return (
    <main className={Style.main}>
      <section>
        <input type="file" accept=".xlsx,.xls" onChange={handleUpload} />

        <button onClick={handleDownload}>Download Excel</button>

        <p>
          <strong>Última atualização:</strong> {DATA_ATUALIZACAO_info || "—"}{" "}
          {LOGIN_ATUALIZACAO_info ? `por ${LOGIN_ATUALIZACAO_info}` : ""}
        </p>

        {/* FILTRO DE TEXTO */}
        <input
          type="text"
          placeholder="Filtrar resultados..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ padding: 8, marginTop: 10, width: "50%" }}
        />

        {/* FILTRO POR PERÍODO */}
        <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
          <label>
            Início:
            <input
              type="date"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              disabled={latest}
            />
          </label>

          <label>
            Fim:
            <input
              type="date"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              disabled={latest}
            />
          </label>

          <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <input
              type="checkbox"
              checked={latest}
              onChange={(e) => setLatest(e.target.checked)}
            />
            Somente última carga
          </label>

          <button disabled={latest} onClick={() => setLastNDays(7)}>
            Últimos 7 dias
          </button>

          <button disabled={latest} onClick={() => setLastNDays(30)}>
            Últimos 30 dias
          </button>

          <button onClick={clearPeriod}>Limpar período</button>
        </div>
      </section>

      {/* TABELA */}
      <table>
        <thead>
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
                <th>RAZAO_SOCIAL</th>
                <th>CNPJ</th>
                <th>NOME</th>
                <th>CLASSIFICACAO</th>
                <th>SEGMENTO</th>
                <th>PRODUTO_ATUACAO</th>
                <th>DATA_CADASTRO</th>
                <th>SITUACAO</th>
                <th>LOGIN_NET</th>
                <th>TIPO</th>
              </>
            )}

            {canal === "PEP" && (
              <>
                <th>CANAL</th>
                <th>CIDADE</th>
                <th>IBGE</th>
                <th>ATIVO</th>
                <th>GERENTE</th>
                <th>COORD</th>
                <th>EXECUTIVO</th>
                <th>LOGIN_NET</th>
                <th>LOGIN_MPLAY</th>
                <th>LOGIN_CLARO</th>
                <th>ADMISSAO</th>
                <th>TIPO_HC</th>
              </>
            )}
          </tr>
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
              <tr key={item.ID || item.id || idx}>
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

                {canal === "PEP" && (
                  <>
                    <td>{item.CANAL}</td>
                    <td>{item.CIDADE}</td>
                    <td>{item.IBGE}</td>
                    <td>{item.ATIVO}</td>
                    <td>{item.GERENTE}</td>
                    <td>{item.COORD}</td>
                    <td>{item.EXECUTIVO}</td>
                    <td>{item.LOGIN_NET}</td>
                    <td>{item.LOGIN_MPLAY}</td>
                    <td>{item.LOGIN_CLARO}</td>
                    <td>{item.ADMISSAO}</td>
                    <td>{item.TIPO_HC}</td>
                  </>
                )}

                {canal === "PAP" && (
                  <>
                    <td>{item.CANAL}</td>
                    <td>{item.IBGE}</td>
                    <td>{item.CIDADE}</td>
                    <td>{item.RAZAO_SOCIAL}</td>
                    <td>{item.CNPJ}</td>
                    <td>{item.NOME}</td>
                    <td>{item.CLASSIFICACAO}</td>
                    <td>{item.SEGMENTO}</td>
                    <td>{item.PRODUTO_ATUACAO}</td>
                    <td>{item.DATA_CADASTRO}</td>
                    <td>{item.SITUACAO}</td>
                    <td>{item.LOGIN_NET}</td>
                    <td>{item.TIPO}</td>
                  </>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </main>
  );
}
