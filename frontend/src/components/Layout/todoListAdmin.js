import axios from "axios";
import { useEffect, useState } from "react";
import Container from "./Container";
import Loading from "../Item-Layout/Loading";
import { BsClockFill, BsCheckCircleFill } from "react-icons/bs";
import Style from "../Layout/TodoList.module.css";

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
  const [userBD, setUserBD] = useState([]);
  const [filterUser, setFilterUser] = useState("");

  const [userSearch, setUserSearch] = useState(""); // corrigido
  const [changeStatus, setChangeStatus] = useState(1);

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

  function countTarefas(db, user) {
    const userClear = user.split(',')[0]
   
    if (user !== "") {
      if (!Array.isArray(db)) return { pendentes: 0, concluidos: 0, total: 0 };
      const total = db.filter((t) => t.responsavel === userClear).length;

      const pendentes = db.filter((t) => {
        const responsaveis = t.responsavel.split(",").map((r) => r.trim());
        return responsaveis.includes(userClear) && Number(t.concluido) === 0;
      }).length;

      const finalizados = db.filter((t) => {
        const responsaveis = t.responsavel.split(",").map((r) => r.trim());
        return responsaveis.includes(userClear) && Number(t.concluido) === 1;
      }).length;

      return { pendentes, finalizados, total };
    } else {
      if (!Array.isArray(db)) return { pendentes: 0, concluidos: 0, total: 0 };
      const total = db.filter((t) => t).length;
      const pendentes = db.filter((t) => Number(t.concluido) === 0).length;
      const finalizados = db.filter((t) => Number(t.concluido) === 1).length;
      return { pendentes, finalizados, total };
    }
  }

  async function handleSearch(responsavelValor) {
    try {
      const params = {};
      if (responsavelValor) params.responsavel = responsavelValor;

      const res = await axios.get(`${Url}/todo`, { params });
      const ordenado = [...res.data].sort(
        (a, b) => (a.ordem ?? 0) - (b.ordem ?? 0),
      );
      setDataBase(ordenado);
      setTarefasOrdenadas(ordenado);
      setUserSearch(responsavelValor); // manter o select controlado
      // Opcional: sincronizar o texto do input também
      setFilterUser(responsavelValor || "");
    } catch (err) {
      console.log(err);
    }
  }

  useEffect(() => {
    const users = Array.from(
      new Map(dataBase.map((t) => [t.responsavel.split(",")[0], t])).values(),
    );
    setUserBD(users);
  }, [dataBase]);

  const tarefasFiltradas = tarefasOrdenadas.filter((t) => {
    if (!filterUser) return true;

    return t.responsavel.toLowerCase().includes(filterUser.toLowerCase());
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

      await axios.patch(`${Url}/todo/reorder`, {
        tarefas: novaOrdem.map((t, index) => ({ id: t.id, ordem: index })), // 0-based; ajuste se precisar 1-based
        // se o backend usa "responsavel=?"
      });
    } catch (err) {
      console.log(err);
    }
  }

  if (!dataBase || dataBase.length === 0) return <Loading />;

  return (
    <Container>
      <main style={{ width: "100%" }}>
        <div className={Style.card}>
          <div>
            <span>pendente</span>
            <BsClockFill color="#9fa11a" />
            <h1>{countTarefas(dataBase, userSearch).pendentes}</h1>
          </div>

          <h1>Painel Administrador</h1>
          <aside>
            <span>Finalizados</span>
            <BsCheckCircleFill color="#25a11a" />
            <h1>{countTarefas(dataBase, userSearch).finalizados}</h1>
          </aside>
        </div>

        <div style={{ marginBottom: "20px" }}>
          <input
            type="text"
            placeholder="Filtrar por responsável..."
            value={filterUser}
            onChange={(e) => setFilterUser(e.target.value)}
            style={{ padding: "8px", width: "300px" }}
          />

          <select
            value={userSearch}
            onChange={(e) => handleSearch(e.target.value)}
            style={{ padding: "8px" }}
          >
            <option value="">Todos os responsáveis</option>

            {userBD &&
              userBD.map((user) => (
                <option key={user.id} value={user.responsavel.split(',')[0]}>
                  {user.responsavel.split(',')[0]}
                </option>
              ))}
          </select>
        </div>

        <div>
          <p>
            Ver as
            {changeStatus
              ? countTarefas(dataBase, userSearch).finalizados
              : countTarefas(dataBase, userSearch).pendentes}
            tarefas
          </p>
          <button onClick={() => setChangeStatus((prev) => !prev)}>
            {changeStatus
              ? countTarefas(dataBase, userSearch).finalizados.length >= 1
                ? "finalizadas"
                : "finalizada"
              : countTarefas(dataBase, userSearch).finalizados.length >= 1
                ? "pendentes"
                : "pendente"}
          </button>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th>Tarefa</th>
              <th>Responsável</th>
              <th>Status</th>
              <th>Obs</th>
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
                {changeStatus
                  ? tarefasFiltradas
                      .filter((tarefa) => tarefa.concluido === 0)
                      .map((tarefa) => (
                        <SortableRow
                          key={tarefa.id}
                          tarefa={tarefa}
                          responsavel={tarefa.responsavel.split(",")[0]}
                        />
                      ))
                  : tarefasFiltradas
                      .filter((tarefa) => tarefa.concluido === 1)
                      .map((tarefa) => (
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

function SortableRow({ tarefa, responsavel = "" }) {
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

      <td>
        <textarea
          name="
        "
          id=""
        ></textarea>
      </td>
    </tr>
  );
}
