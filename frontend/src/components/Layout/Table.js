import Style from "./Table.module.css";
//import { Link } from "react-router-dom";
import LoadingSvg from "../Item-Layout/Loading";
import axios from "axios";
import { toast } from "react-toastify";
import { useState, useEffect, useMemo } from "react";
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
  Url
}) {
  const DATA_ATUALIZACAO_info = useMemo(() => {
    if (!Array.isArray(dataBase) || dataBase.length === 0) return null;

    const ultimaAtualizacaoo = format(
      fromZonedTime(
        dataBase
          .map((item) => item.DATA_ATUALIZACAO)
          .filter(Boolean)
          .sort()
          .at(-1),
        "America/Sao_Paulo",
      ),
      "HH:mm dd-MM-yyyy ",
    );

    return ultimaAtualizacaoo;
  }, [dataBase]);

  const LOGIN_ATUALIZACAO_info = useMemo(() => {
    if (!Array.isArray(dataBase) || dataBase.length === 0) return null;

    const ultimaAtualizacaoo = dataBase
      .map((item) => item.LOGIN_ATUALIZACAO)
      .filter(Boolean)
      .sort()
      .at(-1);

    return ultimaAtualizacaoo;
  }, [dataBase]);

  const toArray = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (payload?.data && Array.isArray(payload.data)) return payload.data;
    return [];
  };

  const brasilDate = format(
    fromZonedTime(new Date(), "America/Sao_Paulo"),
    "yyyy-MM",
  );
  const ANOMES = brasilDate.replace("-", "");

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
      try {
      const response = await axios.post(`${Url}/upload-excel-lp`, formData, {
        headers: { "Content-Type": "multipart/form-data", login: login },
      });

      toast.success("Arquivo enviado com sucesso!");
      console.log(formData);
      // Se o backend mandar { message, inserted, data: [...] }
      const normalized = toArray(response.data);
      if (normalized.length > 0) {
        setDataBase(normalized); // atualiza a tabela com o que veio
      }
      setDataBase(normalized);
      // Se não vier array, apenas mantém o que já estava renderizado
    } catch (error) {
      console.error(error);

      if (error.response?.data?.sql) {
        toast.error(error.response.data.sql);
      } else {
        toast.error("Erro ao enviar o arquivo");
      }
    }
    fetchData();
    e.target.value = "";
  };

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
    XLSX.utils.book_append_sheet(workbook, worksheet, "LojaPropria");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    saveAs(blob, `lojapropria_${ANOMES}.xlsx`);
  };

  const isLoading = dataBase === null; // loading real
  return (
    <main className={Style.main}>
      <section>
        <input type="file" accept=".xlsx,.xls" onChange={handleUpload} />
        <button onClick={handleDownload}>Download Excel</button>
        <p>
          <strong>Última atualização:</strong> {DATA_ATUALIZACAO_info || "—"}
          {LOGIN_ATUALIZACAO_info || "—"}
        </p>
      </section>

      <table>
        <thead>
          <tr>
            {canal === "LP"   && (
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
          </tr>
        </thead>

        <tbody>
          {isLoading ? (
            <tr>
              <td colSpan={10}>
                <LoadingSvg text={"Sem dados...."} />
              </td>
            </tr>
          ) : (
            dataBase.map((item, idx) => (
              <tr key={item.id || item.ID || idx}>
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
