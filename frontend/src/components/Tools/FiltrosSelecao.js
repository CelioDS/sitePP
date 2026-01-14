import Style from "./FiltrosSelecao.module.css";

export default function FiltrosSelecao({
  municipios = [],
  DDDSpi = [],
  dataFuturas = [],
  flagAgendaFuturas = [],

  filterMunicipio,
  setFilterMunicipio,
  filterddd_mun,
  setFilterddd_mun,
  filterData_futura,
  setFilterData_futura,
  filterflag_agenda_futura,
  setfilterflag_agenda_futura,

  clearFilters,
}) {
  return (
    <div className={Style.filters}>
      {/* Filtro por Município */}
      <select
        value={filterMunicipio}
        onChange={(e) => setFilterMunicipio(e.target.value)}
      >
        <option value="">Todos os Municípios</option>
        {municipios.map((mun) => (
          <option key={mun} value={mun}>
            {mun}
          </option>
        ))}
      </select>

      {/* Filtro por ddd_mun */}
      <select
        value={filterddd_mun}
        onChange={(e) => setFilterddd_mun(e.target.value)}
      >
        <option value="">Todos os DDD</option>
        {DDDSpi.map((ddd) => (
          <option key={ddd} value={ddd}>
            {ddd}
          </option>
        ))}
      </select>

      {/* Filtro por Responsável */}
      <select
        value={filterData_futura}
        onChange={(e) => setFilterData_futura(e.target.value)}
      >
        <option value="">Todos os data futura</option>
        {dataFuturas.map((resp) => (
          <option key={resp} value={resp}>
            {resp ? new Date(resp).toLocaleDateString("pt-BR") : ""}
          </option>
        ))}
      </select>

      {/* Filtro por flag agenda futura */}
      <select
        value={filterflag_agenda_futura}
        onChange={(e) => setfilterflag_agenda_futura(e.target.value)}
      >
        <option value="">Todos os flag_agenda_futura</option>
        {flagAgendaFuturas.map((resp) => (
          <option key={resp} value={resp}>
            {resp}
          </option>
        ))}
      </select>

      {/* Botão para limpar todos os filtros */}
      <button className={Style.clearFilters} onClick={clearFilters}>
        Limpar filtros
      </button>
    </div>
  );
}
