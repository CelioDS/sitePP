import Style from "./Table.module.css";
import { Link } from "react-router-dom";
import LoadingSvg from "../Item-Layout/Loading";
import axios from "axios";
import { toast } from "react-toastify";
import { useState, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import FiltrosSelecao from "../Tools/FiltrosSelecao";
import { format } from "date-fns";
import { fromZonedTime } from "date-fns-tz";
import FormatarString from '../Tools/FormataString'

export default function Table({ dataBase, setDataBase, admin }) {
  const { loginBD } = useOutletContext();
  const name = loginBD || localStorage.getItem("login");
  const Url = process.env.REACT_APP_API_URL || "http://localhost:8000";

  const brasilDate = format(
    fromZonedTime(new Date(), "America/Sao_Paulo"),
    "yyyy-MM-dd"
  ); //

  const [isSubmit, setIsSubmit] = useState(false);

  const [searchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;

  const [filterMunicipio, setFilterMunicipio] = useState("");
  const [filterddd_mun, setFilterddd_mun] = useState("");
  const [filterData_futura, setFilterData_futura] = useState("");
  const [filterflag_agenda_futura, setfilterflag_agenda_futura] = useState("");

  // 🔹 Limpar filtros
  const clearFilters = () => {
    setFilterMunicipio("");
    setFilterddd_mun("");
    setfilterflag_agenda_futura("");
    setFilterData_futura("");
  };

  // 🔹 Função para formatar data
  function formatDateForMySQL(date) {
    if (!date) return null;
    const d = new Date(date);
    return d.toISOString().slice(0, 19).replace("T", " ");
  }

  // 🔹 Ação para "Assumir"
  async function handleAssumir(item) {
    setIsSubmit(true);
    if (isSubmit) return;
    if (item.responsavel === true) {
      toast.warn("agenda ja assumida");
      return;
    }
    try {
      const res = await axios.put(`${Url}/${item.id}`, {
        sk_data: formatDateForMySQL(item.sk_data),
        nm_canal_venda_subgrupo: item.nm_canal_venda_subgrupo,
        nm_parceiro: item.nm_parceiro,
        nm_periodo_agendamento: item.nm_periodo_agendamento,
        desc_mun: item.desc_mun,
        ddd_mun: item.ddd_mun,
        segmento_porte: item.segmento_porte,
        territorio: item.territorio,
        flag_rota: item.flag_rota,
        flag_agenda_futura: item.flag_agenda_futura,
        data_futura: formatDateForMySQL(item.sk_data),
        motivo_quebra_d1: item.motivo_quebra_d1,
        motivo_quebra_ult: item.motivo_quebra_ult,
        dt_quebra_ult: formatDateForMySQL(item.sk_data),
        cd_operadora: item.cd_operadora,
        nr_contrato: item.nr_contrato,
        dt_abertura_os: formatDateForMySQL(item.sk_data),
        movimento: item.movimento,
        contato_com_sucesso: item.contato_com_sucesso,
        nova_data: formatDateForMySQL(item.nova_data),
        responsavel: name,
        forma_contato: item.forma_contato,
        tel_contato: item.tel_contato,
        obs: item.obs,
        finalizado: item.finalizado,
        data_assumir: brasilDate,
      });

      toast.success(res.data);
      console.log(res.data);
      setDataBase((prev) => prev.filter((info) => info.id !== item.id));
      setIsSubmit(false);
    } catch (error) {
      console.log(error);
      toast.error(error.response?.data || error.message);
    }
  }

  // 🔹 Filtragem completa (busca + seleção)
  const filteredData = useMemo(() => {
    let data = dataBase;

    data = data.filter((info) => !info.responsavel);
    // Filtro de texto
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      data = data.filter((info) =>
        [
          info.nm_parceiro,
          info.desc_mun,
          info.nr_contrato,
          info.motivo_quebra_d1,
          info.motivo_quebra_ult,
          info.ddd_mun,
        ]
          .filter(Boolean)
          .some((field) => field.toLowerCase().includes(lower))
      );
    }

    // Filtros de seleção
    if (filterMunicipio)
      data = data.filter((info) => info.desc_mun === filterMunicipio);
    if (filterddd_mun)
      data = data.filter((info) => String(info.ddd_mun) === filterddd_mun);

    if (filterData_futura)
      data = data.filter((info) => info.data_futura === filterData_futura);

    if (filterflag_agenda_futura)
      data = data.filter(
        (info) => info.flag_agenda_futura === filterflag_agenda_futura
      );

    return data;
  }, [
    searchTerm,
    filterMunicipio,
    filterddd_mun,
    filterData_futura,
    filterflag_agenda_futura,
    dataBase,
  ]);

  // 🔹 Paginação
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredData, currentPage]);

  function handlePageChange(page) {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  }

  // 🔹 Opções únicas para os filtros
  const municipios = [...new Set(dataBase.map((item) => item.desc_mun))].filter(
    Boolean
  );
  const DDDSpi = [...new Set(dataBase.map((item) => item.ddd_mun))].filter(
    Boolean
  );
  const dataFuturas = [
    ...new Set(dataBase.map((item) => item.data_futura)),
  ].filter(Boolean);

  const flagAgendaFuturas = [
    ...new Set(dataBase.map((item) => item.flag_agenda_futura)),
  ].filter(Boolean);

  return (
    <main className={Style.main}>
      <div className={Style.header}>
        {/**
       * 
      <input
          type="text"
          placeholder="Buscar por parceiro, município, contrato..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
          className={Style.searchInput}
        /> 
          */}
        <FiltrosSelecao
          municipios={municipios}
          DDDSpi={DDDSpi}
          dataFuturas={dataFuturas}
          flagAgendaFuturas={flagAgendaFuturas}
          /**/
          filterMunicipio={filterMunicipio}
          setFilterMunicipio={setFilterMunicipio}
          filterddd_mun={filterddd_mun}
          setFilterddd_mun={setFilterddd_mun}
          filterData_futura={filterData_futura}
          setFilterData_futura={setFilterData_futura}
          filterflag_agenda_futura={filterflag_agenda_futura}
          setfilterflag_agenda_futura={setfilterflag_agenda_futura}
          clearFilters={clearFilters}
          Style={Style}
        />

        <p className={Style.resultInfo}>
          {filteredData.length} resultado{filteredData.length !== 1 && "s"}{" "}
          encontrado{filteredData.length !== 1 && "s"}
        </p>
      </div>

      <div className={Style.tableWrapper}>
        <table className={Style.table}>
          <thead>
            <tr>
              <th>CONTRATO</th>
              <th>FLAG ROTA</th>
              <th>DDD</th>
              <th>DATA AGENDA</th>
              <th>CIDADE</th>
              <th>DATA QUEBRA</th>
              <th>MOTIVO QUEBRA D-1</th>
              <th>ÚLTIMA LIGAÇÃO</th>
              <th>ÚLTIMA TRATATIVA</th>
              <th>ÚLTIMO MOVIMENTO</th>
              <th>DATA TRATATIVA</th>
              <th>MOTIVO ULTIMA QUEBRA</th>
              {!admin && <th>Assumir</th>}
            </tr>
          </thead>

          <tbody>
            {paginatedData.length > 0 ? (
              paginatedData.map(
                (info, key) =>
                  !info.responsavel &&
                  info && (
                    <tr key={info.id_os || key}>
                      <td data-label="Nome Parceiro">
                        <Link
                          to={`/Visualizar/${info.id}/${FormatarString(info.nm_parceiro)}`}
                          title="Acesse aqui"
                          aria-label={`Acesse ${info.nm_parceiro}`}
                        >
                          {info.nr_contrato}
                        </Link>
                      </td>
                      <td>{info.flag_rota}</td>
                      <td>{info.ddd_mun}</td>
                      <td>
                        {info.data_futura
                          ? new Date(info.data_futura).toLocaleDateString(
                              "pt-BR"
                            )
                          : ""}
                      </td>
                      <td>{info.desc_mun}</td>
                      <td>
                        {info.dt_quebra_ult
                          ? new Date(info.dt_quebra_ult).toLocaleDateString(
                              "pt-BR"
                            )
                          : ""}
                      </td>
                      <td>{info.motivo_quebra_d1}</td>
                      <td>{info.ligacaoUltTratativa}</td>
                      <td>{info.tratado_anteriormente}</td>
                      <td>{info.movimento_ult_tratativa}</td>
                      <td>
                        {info.data_ult_tratativa
                          ? new Date(
                              info.data_ult_tratativa
                            ).toLocaleDateString("pt-BR")
                          : ""}
                      </td>
                      <td>{info.motivo_quebra_ult}</td>
                      {!admin && (
                        <td>
                          <button
                            className={Style.btnAssumir}
                            disabled={
                              info.responsavel ? true : false || isSubmit
                            }
                            onClick={() => handleAssumir(info)}
                          >
                            Assumir
                          </button>
                        </td>
                      )}
                    </tr>
                  )
              )
            ) : (
              <tr>
                <td colSpan={18} className={Style.loadingCell}>
                  {dataBase.length === 0 ? <LoadingSvg /> : "Nenhum resultado"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 🔹 Controles de Paginação */}
      {totalPages > 1 && (
        <div className={Style.pagination}>
          <button
            className={Style.btnPagination}
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            ⬅️ Anterior
          </button>
          <span>
            Página {currentPage} de {totalPages}
          </span>
          <button
            className={Style.btnPagination}
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Próxima ➡️
          </button>
        </div>
      )}
    </main>
  );
}
