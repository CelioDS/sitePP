import { useEffect, useState } from "react";

export default function TableFilters({
  search,
  setSearch,
  start,
  setStart,
  end,
  setEnd,
  latest,
  setLatest,
  isLoading,
}) {
  const [localSearch, setLocalSearch] = useState(search);
  const [mesSelecionado, setMesSelecionado] = useState("");

  // Debounce do search
  useEffect(() => {
    const timer = setTimeout(() => setSearch(localSearch), 500);
    return () => clearTimeout(timer);
  }, [localSearch, setSearch]);

  // Função para tratar seleção de mês
  // Nota: Não desligamos mais o 'latest' aqui
  const handleChangeMes = (value) => {
    setMesSelecionado(value);

    // Se o usuário limpar o mês, limpamos as datas, mas mantemos o latest como está
    if (!value) {
      setStart("");
      setEnd("");
      return;
    }

    const [ano, mes] = value.split("-");
    const inicio = `${ano}-${mes}-01`;
    const ultimoDia = new Date(ano, parseInt(mes), 0).getDate();
    const fim = `${ano}-${mes}-${ultimoDia}`;

    setStart(inicio);
    setEnd(fim);
  };

  const clearFilters = () => {
    setLocalSearch("");
    setSearch("");
    setStart("");
    setEnd("");
    setMesSelecionado("");
    setLatest(false); // Reset padrão pode ser false ou true, conforme sua preferência
  };

  return (
    <section
      style={{
        display: "grid",
        gap: 8,
        gridTemplateColumns: "1.5fr 1fr 1fr 1fr auto auto",
        alignItems: "end",
      }}
    >
      {/* SEARCH */}
      <label>
        Buscar:
        <input
          type="input"
          style={{ width: "100%" }}
          placeholder="Login, loja, cidade..."
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          disabled={isLoading}
        />
      </label>

      {/* MÊS */}
      <label>
        Mês:
        <select
          style={{ width: "100%" }}
          value={mesSelecionado}
          onChange={(e) => handleChangeMes(e.target.value)}
          disabled={isLoading}
        >
          <option value="">Selecionar mês...</option>
          <option value="2026-12">Dezembro/2026</option>
          <option value="2026-11">Novembro/2026</option>
          <option value="2026-10">Outubro/2026</option>
          <option value="2026-09">Setembro/2026</option>
          <option value="2026-08">Agosto/2026</option>
          <option value="2026-07">Julho/2026</option>
          <option value="2026-06">Junho/2026</option>
          <option value="2026-05">Maio/2026</option>
          <option value="2026-04">Abril/2026</option>
          <option value="2026-03">Março/2026</option>
          <option value="2026-02">Fevereiro/2026</option>
          <option value="2026-01">Janeiro/2026</option>
          <option value="2025-12">Dezembro/2025</option>
          <option value="2025-11">Novembro/2025</option>
          <option value="2025-10">Outubro/2025</option>
          <option value="2025-09">Setembro/2025</option>
          <option value="2025-08">Agosto/2025</option>
          <option value="2025-07">Julho/2025</option>
          <option value="2025-06">Junho/2025</option>
          <option value="2025-05">Maio/2025</option>
          <option value="2025-04">Abril/2025</option>
          <option value="2025-03">Março/2025</option>
          <option value="2025-02">Fevereiro/2025</option>
          <option value="2025-01">Janeiro/2025</option>
        </select>
      </label>

      {/* INÍCIO */}
      <label>
        Início:
        <input
          type="date"
          style={{ width: "100%" }}
          value={start}
          onChange={(e) => setStart(e.target.value)} // Não mexe no latest
          disabled={isLoading}
        />
      </label>

      {/* FIM */}
      <label>
        Fim:
        <input
          type="date"
          style={{ width: "100%" }}
          value={end}
          onChange={(e) => setEnd(e.target.value)} // Não mexe no latest
          disabled={isLoading}
        />
      </label>

      {/* CHECKBOX */}
      <label
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          cursor: "pointer",
          paddingBottom: 8,
        }}
      >
        <input
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            cursor: "pointer",
            paddingBottom: 8,
          }}
          type="checkbox"
          checked={latest}
          onChange={(e) => setLatest(e.target.checked)}
        />
        <span style={{ fontSize: 13 }}>Última de cada mês</span>
      </label>

      {/* BOTÃO LIMPAR */}
      <button
        onClick={clearFilters}
        disabled={isLoading}
        style={{ marginBottom: 4 }}
      >
        Limpar
      </button>
    </section>
  );
}
