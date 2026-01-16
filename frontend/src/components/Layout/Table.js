import Style from "./Table.module.css";
import { Link } from "react-router-dom";
import LoadingSvg from "../Item-Layout/Loading";
import axios from "axios";
import { toast } from "react-toastify";
import { useState, useMemo, useEffect } from "react";
import { format } from "date-fns";
import { fromZonedTime } from "date-fns-tz";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export default function Table({ dataBase, setDataBase, admin }) {
  const [data, setData] = useState([]);
  const Url = process.env.REACT_APP_API_URL || "http://localhost:8000";

  const brasilDate = format(
    fromZonedTime(new Date(), "America/Sao_Paulo"),
    "yyyy-MM"
  );

  const ANOMES = brasilDate.replace("-", "");

  const handleUpload = async (e) => {
    const file = e.target.files[0];

    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axios.post(`${Url}/upload-excel-lp`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success("Arquivo enviado com sucesso!");

      // Se o backend devolver os dados já tratados
      if (response.data) {
        setData(response.data);
      }
    } catch (error) {
      console.error(error);
      toast.error("Erro ao enviar o arquivo");
    }
  };

  const handleDownload = () => {
    if (data.length === 0) {
      toast.warning("Não há dados para download");
      return;
    }

    // Converte JSON → Planilha

    const formattedData = data.map(({ ID, ...rest }) => rest);

    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "LojaPropria");

    // Gera arquivo
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    saveAs(blob, `lojapropria_${ANOMES}.xlsx`);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [depara] = await Promise.all([axios.get(`${Url}/lojapropria`)]);
        setData(depara.data);
      } catch (err) {
        console.error("Erro ao carregar dados:", err);
      } finally {
      }
    };
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className={Style.main}>
      <input type="file" accept=".xlsx,.xls" onChange={handleUpload} />
      <button onClick={handleDownload}>Download Excel</button>

      <table>
        <thead>
          <tr>
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
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={10}>
                {" "}
                <LoadingSvg />
              </td>
            </tr>
          ) : (
            data.map((item) => (
              <tr key={item.id}>
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
              </tr>
            ))
          )}
        </tbody>
      </table>
    </main>
  );
}
