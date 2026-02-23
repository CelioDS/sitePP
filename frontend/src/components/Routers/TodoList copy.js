// ✅ Exemplo mínimo em React para "mostrar/ocultar etapas" por tarefa
import { useState } from "react";

export default function Tarefas({ lista }) {
  // Usamos um Set para guardar quais IDs de tarefas estão abertas (expandido = mostrando etapas)
  const [expanded, setExpanded] = useState(new Set());

  // Alterna o estado aberto/fechado de uma tarefa específica
  function toggleEtapas(tarefaId) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(tarefaId)) next.delete(tarefaId); // se já está aberta, fecha
      else next.add(tarefaId);                        // se está fechada, abre
      return next;
    });
  }

  return (
    <table>
      <thead>
        <tr>
          <th>Tarefa</th>
          <th>Mostrar Etapas</th>
        </tr>
      </thead>

      <tbody>
        {lista.map((t) => {
          const isOpen = expanded.has(t.id); // true = mostrar; false = ocultar

          return (
            <Fragment key={t.id}>
              {/* Linha principal da tarefa */}
              <tr>
                <td>{t.tarefa}</td>
                <td>
                  <button
                    type="button"
                    onClick={() => toggleEtapas(t.id)}
                    aria-expanded={isOpen}
                    aria-controls={`detalhe-etapas-${t.id}`}
                  >
                    {isOpen ? "Ocultar etapas" : "Mostrar etapas"}
                  </button>
                </td>
              </tr>

              {/* Linha de detalhe (aparece só quando isOpen = true) */}
              {isOpen && (
                <tr>
                  <td colSpan={2} id={`detalhe-etapas-${t.id}`}>
                    {/* Formulário de adicionar etapa */}
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        const fd = new FormData(e.currentTarget);
                        const novaEtapa = (fd.get("etapa") || "").toString().trim();
                        if (!novaEtapa) return;
                        // aqui você chamaria sua API para salvar a etapa de t.id
                        // depois atualize o estado externo que contém `lista`
                        e.currentTarget.reset();
                      }}
                      style={{ marginBottom: 8 }}
                    >
                      <input name="etapa" placeholder="Nova etapa" />
                      <button type="submit">Salvar etapa</button>
                    </form>

                    {/* Lista de etapas */}
                    {Array.isArray(t.etapas) && t.etapas.length > 0 ? (
                      <ul style={{ margin: 0, paddingLeft: "1.2rem" }}>
                        {t.etapas.map((et, i) => (
                          <li key={et.id ?? i}>
                            <strong>{et.etapas}</strong>
                            {et.peso && <> — peso: {et.peso}</>}
                            {et.status && <> — {et.status}</>}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <em style={{ color: "#888" }}>Sem etapas</em>
                    )}
                  </td>
                </tr>
              )}
            </Fragment>
          );
        })}
      </tbody>
    </table>
  );
}

/*
📌 Como funciona (comentários no código):
1) expanded: Set com os IDs das tarefas que estão "abertas".
2) toggleEtapas(id): se o id já estiver no Set, remove (fecha); se não estiver, adiciona (abre).
3) isOpen = expanded.has(t.id): controla a renderização condicional.
4) Botão: muda o texto entre "Mostrar" e "Ocultar" conforme isOpen e chama toggleEtapas.
5) A linha de detalhe (form + lista) só é renderizada quando isOpen === true.
*/
