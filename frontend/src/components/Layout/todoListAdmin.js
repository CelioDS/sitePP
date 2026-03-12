import axios from "axios";
import { useEffect, useState } from "react";
import Container from "./Container";
import Loading from "../Item-Layout/Loading";

import { DndContext, closestCenter } from "@dnd-kit/core";

import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";

import { CSS } from "@dnd-kit/utilities";

export default function AdminTarefas() {
  const [dataBase, setDataBase] = useState([]);
  const [tarefasOrdenadas, setTarefasOrdenadas] = useState([]);
  const [filterUser, setFilterUser] = useState("");

  const Url = process.env.REACT_APP_API_URL || "http://localhost:8000";

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await axios.get(`${Url}/todo`);
        const ordenado = res.data.sort((a, b) => a.ordem - b.ordem);
        setDataBase(ordenado);
        setTarefasOrdenadas(ordenado);

      } catch (err) {
        console.log(err);
      }
    }

    fetchData();
  }, [Url]);

  const tarefasFiltradas = tarefasOrdenadas.filter((t) => {
    if (!filterUser) return true;

    return (
      t.responsavel.toLowerCase().includes(filterUser.toLowerCase()) &&
      t.concluido === 0
    );
  });

  async function handleDragEnd(event) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = tarefasOrdenadas.findIndex((i) => i.id === active.id);
    const newIndex = tarefasOrdenadas.findIndex((i) => i.id === over.id);

    const novaOrdem = arrayMove(tarefasOrdenadas, oldIndex, newIndex);
    setTarefasOrdenadas(novaOrdem);

    try {
      // enviar para /todo/reorder de uma vez
      await axios.put(
        `${Url}/todo/reorder`,
        novaOrdem.map((t, index) => ({ id: t.id, ordem: index })),
      );
    } catch (err) {
      console.log(err);
    }
  }

  if (!dataBase) return <Loading />;

  return (
    <Container>
      <main style={{ width: "100%" }}>
        <h1>Painel Administrador</h1>

        <div style={{ marginBottom: "20px" }}>
          <input
            type="text"
            placeholder="Filtrar por responsável..."
            value={filterUser}
            onChange={(e) => setFilterUser(e.target.value)}
            style={{ padding: "8px", width: "300px" }}
          />
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th>Tarefa</th>
              <th>Responsável</th>
              <th>Status</th>
            </tr>
          </thead>

          <DndContext
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={tarefasFiltradas.map((t) => t.id)}
              strategy={verticalListSortingStrategy}
            >
              <tbody>
                {tarefasFiltradas.map((tarefa) => (
                  <SortableRow key={tarefa.id} tarefa={tarefa} />
                ))}
              </tbody>
            </SortableContext>
          </DndContext>
        </table>
      </main>
    </Container>
  );
}

function SortableRow({ tarefa }) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: tarefa.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    cursor: "grab",
  };

  return (
    <tr ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <td style={{ border: "1px solid #ccc", padding: "8px" }}>
        {tarefa.tarefa}
      </td>

      <td style={{ border: "1px solid #ccc", padding: "8px" }}>
        {tarefa.responsavel}
      </td>

      <td style={{ border: "1px solid #ccc", padding: "8px" }}>
        {Number(tarefa.concluido) === 1 ? "Concluído" : "Pendente"}
      </td>
    </tr>
  );
}
