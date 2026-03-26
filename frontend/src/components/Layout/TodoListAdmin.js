import axios from "axios";
import { toast } from "react-toastify";
import { useEffect, useState, useMemo } from "react";
import Container from "./Container";
import Loading from "../Item-Layout/Loading";
import { BsClockFill, BsCheckCircleFill } from "react-icons/bs";
import Style from "../Layout/TodoListAdmin.module.css";
import debounce from "lodash/debounce";
import { DndContext, closestCenter } from "@dnd-kit/core";
import { FaExclamation } from "react-icons/fa";

import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";

import { CSS } from "@dnd-kit/utilities";

export default function TodoListAdmin() {
  const [dataBase, setDataBase] = useState([]);
  const [tarefasOrdenadas, setTarefasOrdenadas] = useState([]);
  const [userBD, setUserBD] = useState([]);
  const [filterUser, setFilterUser] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [changeStatus, setChangeStatus] = useState(true); // true = pendentes, false = finalizados

  const Url = process.env.REACT_APP_API_URL || "http://localhost:8000";

  // Busca inicial
  useEffect(() => {
    async function fetchData() {
      try {
        const res = await axios.get(`${Url}/todo`);
        const ordenado = res.data.sort(
          (a, b) => (a.ordem ?? 0) - (b.ordem ?? 0),
        );
        setDataBase(ordenado);
        setTarefasOrdenadas(ordenado);
      } catch (err) {
        console.error(err);
        toast.error("Erro ao carregar dados.");
      }
    }
    fetchData();
  }, [Url]);

  // Atualiza lista de usuários únicos para o Select
  useEffect(() => {
    const users = Array.from(
      new Map(dataBase.map((t) => [t.responsavel.split(",")[0], t])).values(),
    );
    setUserBD(users);
  }, [dataBase]);

  // Função de contagem otimizada
  const stats = useMemo(() => {
    const db = dataBase || [];
    const userClear = userSearch.split(",")[0];

    const filtradosPorUser = userSearch
      ? db.filter((t) => t.responsavel.split(",")[0] === userClear)
      : db;

    return {
      pendentes: filtradosPorUser.filter((t) => Number(t.concluido) === 0)
        .length,
      finalizados: filtradosPorUser.filter((t) => Number(t.concluido) === 1)
        .length,
    };
  }, [dataBase, userSearch]);

  // Filtro de busca no backend (Select)
  async function handleSearch(responsavelValor) {
    try {
      const params = responsavelValor ? { responsavel: responsavelValor } : {};
      const res = await axios.get(`${Url}/todo`, { params });
      const ordenado = [...res.data].sort(
        (a, b) => (a.ordem ?? 0) - (b.ordem ?? 0),
      );
      setDataBase(ordenado);
      setTarefasOrdenadas(ordenado);
      setUserSearch(responsavelValor);
      setFilterUser(responsavelValor || "");
    } catch (err) {
      console.error(err);
    }
  }

  // Filtro de interface (Input de texto + Toggle de Status)
  const tarefasFiltradasParaExibir = useMemo(() => {
    return tarefasOrdenadas.filter((t) => {
      const matchUser = t.responsavel
        .toLowerCase()
        .includes(filterUser.toLowerCase());
      const matchStatus = changeStatus
        ? Number(t.concluido) === 0
        : Number(t.concluido) === 1;
      return matchUser && matchStatus;
    });
  }, [tarefasOrdenadas, filterUser, changeStatus]);

  async function handleDragEnd(event) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = tarefasOrdenadas.findIndex((i) => i.id === active.id);
    const newIndex = tarefasOrdenadas.findIndex((i) => i.id === over.id);

    const novaOrdem = arrayMove(tarefasOrdenadas, oldIndex, newIndex);
    setTarefasOrdenadas(novaOrdem);

    try {
      await axios.patch(`${Url}/todo/reorder`, {
        tarefas: novaOrdem.map((t, index) => ({ id: t.id, ordem: index })),
      });
    } catch (err) {
      toast.error("Erro ao salvar ordenação.");
    }
  }

  if (!dataBase || dataBase.length === 0) return <Loading />;

  return (
    <Container>
      <main style={{ width: "100%" }} className={Style.main}>
        <div className={Style.card}>
          <aside>
            <span>Pendentes</span>
            <BsClockFill color="#9fa11a" />
            <h1>{stats.pendentes}</h1>
          </aside>

          <h1>Painel Administrador</h1>

          <aside>
            <span>Finalizados</span>
            <BsCheckCircleFill color="#25a11a" />
            <h1>{stats.finalizados}</h1>
          </aside>
        </div>

        <div style={{ marginBottom: "20px" }} className={Style.searchs}>
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
            {userBD.map((user) => (
              <option key={user.id} value={user.responsavel.split(",")[0]}>
                {user.responsavel.split(",")[0]}
              </option>
            ))}
          </select>
        </div>

        <div className={Style.leganda}>
          <p>{`Exibindo ${tarefasFiltradasParaExibir.length} tarefas`}</p>
          <button
            onClick={() => setChangeStatus((prev) => !prev)}
            style={{
              color: "#ffffff",
              background: changeStatus ? "#25a11a" : "#9fa11a",
              border: "none",
              cursor: "pointer",
            }}
          >
            {changeStatus ? "Finalizadas" : "Pendentes"}
          </button>
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th></th>
              <th>Tarefa</th>

              {changeStatus && (
                <>
                  <th>Obs Admin</th>
                  <th>priorizar</th>
                </>
              )}
              <th>Responsável</th>
              <th>Status</th>
            </tr>
          </thead>

          <DndContext
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={tarefasFiltradasParaExibir.map((t) => t.id)}
              strategy={verticalListSortingStrategy}
            >
              <tbody>
                {tarefasFiltradasParaExibir.map((tarefa) => (
                  <SortableRow
                    key={tarefa.id}
                    tarefa={tarefa}
                    Url={Url}
                    changeStatus={changeStatus}
                    setTarefasOrdenadas={setTarefasOrdenadas}
                  />
                ))}
              </tbody>
            </SortableContext>
          </DndContext>
        </table>
      </main>
    </Container>
  );
}

function SortableRow({ tarefa, changeStatus, setTarefasOrdenadas, Url }) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: tarefa.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const updateBackend = useMemo(() => {
    return debounce(async (id, value) => {
      try {
        await axios.patch(`${Url}/todo/${id}`, {
          obs_admin: value,
        });
        toast.success("Obs atualizada!");
      } catch (err) {
        toast.error("Erro ao salvar no servidor.");
      }
    }, 1000);
  }, [Url]);

  async function handleObsAdmin(e) {
    const value = e.target.value;

    // Atualiza a UI imediatamente para permitir digitação fluida
    setTarefasOrdenadas((prev) =>
      prev.map((t) => (t.id === tarefa.id ? { ...t, obs_admin: value } : t)),
    );

    updateBackend(tarefa.id, value);
  }

  async function handlePrioridade(tarefa) {
    try {
      await axios.patch(`${Url}/todo/${tarefa.id}`, {
        prioridade: !tarefa.prioridade,
      });

      setTarefasOrdenadas((prev) =>
        prev.map((t) =>
          t.id === tarefa.id ? { ...t, prioridade: !t.prioridade } : t,
        ),
      );
      toast.success("prioridade atualizada!");
    } catch (err) {
      toast.error("Erro ao salvar no servidor.");
    }
  }

  return (
    <tr ref={setNodeRef} style={style}>
      {/* Alça de Arraste (Handle) */}
      <td
        {...attributes}
        {...listeners}
        style={{
          cursor: "grab",
          textAlign: "center",
          border: "1px solid #ccc",
          fontSize: "20px",
        }}
      >
        ☰
      </td>

      <td style={{ border: "1px solid #ccc" }}>{tarefa.tarefa}</td>

      {!tarefa.concluido && (
        <>
          <td style={{ border: "1px solid #ccc" }}>
            <textarea
              onChange={handleObsAdmin}
              name="obs_admin"
              value={tarefa.obs_admin || ""}
              style={{
                width: "100%",
                display: "block",
                minHeight: "50px",
                padding: "5px",
                border: "1px solid #eee",
              }}
            />
          </td>
          <td>
            <button
              onClick={() => handlePrioridade(tarefa)}
              className={Style.btnPrioridade}
              style={{
                background: tarefa.prioridade ? "#ff00002c" : "#9c989817",
              }}
            >
              {tarefa.prioridade ? (
                <FaExclamation color="#ff0000" />
              ) : (
                <FaExclamation color="#9c9898" />
              )}{" "}
            </button>
          </td>
        </>
      )}
      <td style={{ border: "1px solid #ccc" }}>{tarefa.responsavel}</td>
      <td
        style={{
          background:
            Number(tarefa.concluido) === 1 ? "#25a11a7a" : "#9fa11a50",
          color: Number(tarefa.concluido) === 1 ? "#25a11a" : "#9fa11a",
          border: "1px solid #ccc",
          textAlign: "center",
          fontWeight: "bold",
        }}
      >
        {Number(tarefa.concluido) === 1 ? "Concluído" : "Pendente"}
      </td>
    </tr>
  );
}
