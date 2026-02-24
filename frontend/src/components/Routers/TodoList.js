import axios from "axios";
import { toast } from "react-toastify";
import Container from "../Layout/Container";
import { useParams } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import {
  BsPenFill,
  BsCheck,
  BsTrashFill,
  BsXCircle,
  BsEyeSlashFill,
  BsEyeFill,
} from "react-icons/bs";
import Style from "./TodoList.module.css";
import Loading from "../Item-Layout/Loading";

export default function ToDo() {
  const ref = useRef();

  const [expanded, setExpanded] = useState(new Set());

  const { login } = useParams();
  const [dataBase, setDataBase] = useState();
  const [isSubmit, setIsSubmit] = useState(false);
  const [editTarefa, setEditTarefa] = useState();
  const [textBTN, setTextBTN] = useState("Salvar");
  const [handleNumberEdit, setHandleNumberEdit] = useState(1);
  const [idFirst, setIdFirst] = useState();
  const [etapasId, setEtapasId] = useState();

  const Url = process.env.REACT_APP_API_URL || "http://localhost:8000";

  // Normaliza strings removendo acentos e padronizando para minúsculas
  function normalize(str) {
    return (str ?? "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
  }

  // Garante que o peso fique no intervalo 1..3; se inválido/ausente, cai para 1
  function sanitizePeso(peso) {
    const p = Number(peso);
    if (!Number.isFinite(p)) return 1;
    return Math.min(3, Math.max(1, p));
  }

  function porcentagemPonderada(item) {
    if (!Array.isArray(item) || item.length === 0) return 0;

    // Soma total de pesos (clamp 1..3 e default 1)
    const totalPeso = item.reduce((acc, e) => acc + sanitizePeso(e.peso), 0);
    if (totalPeso === 0) return 0; // salvaguarda

    // Soma apenas pesos dos concluídos
    const pesoConcluido = item.reduce((acc, e) => {
      const concluidoFlag = Number(e.concluido) === 1;
      const concluidoStatus = normalize(e.status) === "concluido";
      const concluido = concluidoFlag || concluidoStatus;
      return acc + (concluido ? sanitizePeso(e.peso) : 0);
    }, 0);

    return (pesoConcluido / totalPeso) * 100;
  }

  function toggleEtapas(tarefaId) {
    setExpanded((prev) => {
      //const next = new Set(prev);
      //if (next.has(tarefaId)) next.delete(tarefaId);
      //else next.add(tarefaId);
      setEtapasId(tarefaId);
      if (prev.has(tarefaId)) {
        return new Set();
      }
      // senão, abre somente esse (set com um único valor)
      return new Set([tarefaId]);
    });
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(`${Url}/todo`);
        setDataBase(res.data);
      } catch (err) {
        console.log(err);
        toast.error("ERRO - Ao buscar o TODO ");
      }
    };
    fetchData();
  }, [Url]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (isSubmit) return;

    const dadosForm = ref.current; // mantém seu padrão
    const tarefaValue = dadosForm?.tarefa?.value?.trim() || ""; // <-- SAFE

    if (!tarefaValue) {
      toast.warn("Preencher todos os valores");
      return;
    }

    setIsSubmit(true);
    setTextBTN(editTarefa ? "Editando... " : "Salvando...");

    if (editTarefa) {
      await axios
        .put(`${Url}/todo/${editTarefa.id}`, {
          tarefa: tarefaValue, // <-- usa a variável segura
          responsavel: login,
          concluido: editTarefa.concluido,
          DATA_ATUALIZACAO:
            editTarefa?.DATA_ATUALIZACAO ?? editTarefa?.data_atualizacao,
        })
        .then(({ data }) => {
          toast.success(data?.message ?? "Tarefa atualizada!");
          setDataBase((prev) =>
            prev.map((info) =>
              info.id === editTarefa.id
                ? {
                    ...info,
                    id: editTarefa.id,
                    tarefa: tarefaValue,
                    responsavel: login,
                    concluido: data?.concluido ?? info.concluido,
                    // guarda nos dois campos para não quebrar telas antigas
                    DATA_ATUALIZACAO:
                      data?.data_atualizacao ?? new Date().toISOString(),
                    data_atualizacao:
                      data?.data_atualizacao ?? new Date().toISOString(),
                  }
                : info,
            ),
          );
        })
        .catch((err) => toast.error(err.response?.data || err.message));
    } else {
      if (
        dataBase?.some(
          (data) =>
            (data.tarefa || "").toLowerCase() === tarefaValue.toLowerCase(),
        ) &&
        !editTarefa
      ) {
        toast.warning("Tarefa ja cadastrada...");
        setTextBTN("Enviar");
        setHandleNumberEdit(0);
        setIsSubmit(false);
        setEditTarefa(null);
        return;
      }

      await axios
        .post(`${Url}/todo/add`, {
          tarefa: tarefaValue,
          responsavel: login,
          concluido: 0,
        })
        .then(({ data }) => {
          toast.success(data?.message ?? "Tarefa criada!");
          setDataBase((prev) => [
            ...(prev || []),
            {
              id: data?.id,
              tarefa: data?.tarefa ?? tarefaValue,
              responsavel: data?.responsavel ?? login,
              concluido: data?.concluido ?? 0,
              // guarda nos dois campos para compat
              DATA_ATUALIZACAO:
                data?.data_atualizacao ?? new Date().toISOString(),
              data_atualizacao:
                data?.data_atualizacao ?? new Date().toISOString(),
              etapas: Array.isArray(data?.etapas) ? data.etapas : [],
            },
          ]);
        })
        .catch((err) => {
          toast.error(err.response?.data || err.message);
        });
    }

    setTextBTN("Salvar");
    setHandleNumberEdit(0);
    setIsSubmit(false);
    setEditTarefa(null);
    // segura: só chama se existir
    dadosForm?.reset?.();
  }

  async function handleSubmitEtapas(e, tarefaId, etapasDaTarefa = []) {
    e.preventDefault();

    // Guarda o id no state (mantendo sua lógica),
    // mas usa a variável local tarefaId para evitar atraso de setState.

    // LÊ OS CAMPOS DO PRÓPRIO FORM DA LINHA (sem usar ref compartilhado)
    const form = e.currentTarget;
    const etapaValue = form.etapas?.value?.trim() || "";
    const pesoValue = form.peso?.value || "";
    const statusValue = form.status?.value || "";

    if ((!etapaValue && !pesoValue) || !statusValue) {
      toast.warn("Preencher todos os valores");
      return;
    }

    // Evita duplicidade usando as etapas da própria tarefa da linha
    const existe = (etapasDaTarefa || []).some(
      (data) => normalize(data.etapas) === normalize(etapaValue),
    );
    if (existe && !editTarefa) {
      toast.warning("Etapas ja cadastrada...");
      return;
    }

    await axios
      .post(`${Url}/todo/etapas/add`, {
        tarefa_id: tarefaId,
        etapas: etapaValue,
        peso: sanitizePeso(pesoValue),
        status: statusValue,
        concluido: 0,
      })
      .then(({ data }) => {
        toast.success(data?.message ?? "Etapa adicionada!");
        setDataBase((prev) =>
          (prev || []).map((t) =>
            t.id === tarefaId
              ? {
                  ...t,
                  etapas: Array.isArray(t.etapas)
                    ? [
                        ...t.etapas,
                        {
                          id: data?.id,
                          tarefa_id: tarefaId,
                          etapas: data?.etapas ?? etapaValue,
                          peso: data?.peso ?? pesoValue,
                          status: data?.status ?? statusValue,
                          concluido: data?.concluido ?? 0,
                          data_atualizacao:
                            data?.data_atualizacao ?? new Date().toISOString(),
                        },
                      ]
                    : [
                        {
                          id: data?.id,
                          tarefa_id: tarefaId,
                          etapas: data?.etapas ?? etapaValue,
                          peso: data?.peso ?? pesoValue,
                          status: data?.status ?? statusValue,
                          concluido: data?.concluido ?? 0,
                          data_atualizacao:
                            data?.data_atualizacao ?? new Date().toISOString(),
                        },
                      ],
                }
              : t,
          ),
        );

        form.reset(); // limpa o form da linha
      })
      .catch((err) => {
        toast.error(err.response?.data || err.message);
      });
  }

  async function handlaEdit(tarefa) {
    setEditTarefa(tarefa);
    setTextBTN("Editando");

    if (!idFirst) {
      setIdFirst(tarefa.id);
    }

    if (idFirst === tarefa.id) {
      // verifica se o id recebeu 2 click e cancela a edição
      if (handleNumberEdit % 2 === 0) {
        if (ref.current?.tarefa) ref.current.tarefa.value = "";
        setTextBTN("Salvar");
        setEditTarefa(null);
      } else {
        setEditTarefa(tarefa);
      }
    } else {
      // se nenhuma condição é antiginda, nova tarefa, novo id e nova cotagem inicia
      setEditTarefa(tarefa);
      setIdFirst(tarefa.id);
    }
  }
  async function handlaEditEtapas(tarefa) {
    setEditTarefa(tarefa);
    setTextBTN("Editando");

    if (!idFirst) {
      setIdFirst(tarefa.id);
    }

    if (idFirst === tarefa.id) {
      // verifica se o id recebeu 2 click e cancela a edição
      if (handleNumberEdit % 2 === 0) {
        if (ref.current?.tarefa) ref.current.tarefa.value = "";
        setTextBTN("Salvar");
        setEditTarefa(null);
      } else {
        setEditTarefa(tarefa);
      }
    } else {
      // se nenhuma condição é antiginda, nova tarefa, novo id e nova cotagem inicia
      setEditTarefa(tarefa);
      setIdFirst(tarefa.id);
    }
  }

  useEffect(() => {
    if (editTarefa && ref.current) {
      const dadosForm = ref.current;
      if (dadosForm?.tarefa) {
        dadosForm.tarefa.value = editTarefa.tarefa; // SAFE
      }
    }
  }, [editTarefa]);

  async function handleDelete(id) {
    if (isSubmit) return;

    setIsSubmit(true);

    try {
      await axios.delete(`${Url}/todo/${id}`).then(({ data }) => {
        setDataBase((prev) => (prev || []).filter((item) => item.id !== id));
        toast.success(data?.message ?? "Tarefa excluída!");
      });
    } catch (err) {
      toast.error(err.response?.data || err.message);
    } finally {
      setIsSubmit(false);
    }
  }

  async function handleDeleteEtapas(id) {
    if (isSubmit) return;

    setIsSubmit(true);

    try {
      await axios.delete(`${Url}/todo/${id}`).then(({ data }) => {
        setDataBase((prev) => (prev || []).filter((item) => item.id !== id));
        toast.success(data?.message ?? "Tarefa excluída!");
      });
    } catch (err) {
      toast.error(err.response?.data || err.message);
    } finally {
      setIsSubmit(false);
    }
  }

  return (
    <Container>
      <main className={Style.main}>
        <h1>Tarefas</h1>

        <form ref={ref} onSubmit={handleSubmit} className={Style.formTarefa}>
          <div>
            <input
              id="tarefa"
              name="tarefa"
              type="text"
              placeholder="Digite a sua terefa aqui..."
            />
          </div>
          <button className={Style.btnSubmit} disabled={isSubmit}>
            {textBTN}
          </button>
        </form>

        <section className={Style.sectionTarefas}>
          {!dataBase ? (
            <Loading />
          ) : dataBase.length === 0 ? (
            <p style={{ color: "#888" }}>Nenhuma tarefa cadastrada.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Tarefa</th>
                  <th>porcentagem</th>
                  <th>concluido</th>
                  <th>DATA_ATUALIZACAO</th>
                  <th>Finalizar</th>
                  <th>Excluir</th>
                  <th>Editar</th>
                  <th>Etapas</th>
                  <th>Etapas</th>
                </tr>
              </thead>

              <tbody>
                {dataBase &&
                  dataBase
                    .filter((tarefa) => tarefa.responsavel === login)
                    .map((tarefa) => {
                      const isOpen = expanded.has(tarefa.id);

                      return (
                        <tr key={tarefa.id}>
                          <td
                            style={{
                              background:
                                idFirst === tarefa.id && editTarefa
                                  ? "#b80b0b"
                                  : undefined,
                            }}
                          >
                            {tarefa.tarefa}
                          </td>

                          {/* Percentual ponderado da própria tarefa */}
                          <td>
                            {porcentagemPonderada(tarefa.etapas).toFixed(2)}%
                          </td>

                          <td>{tarefa.concluido}</td>

                          {/* Renderiza com fallback para evitar quebra de chave */}
                          <td>
                            {tarefa?.DATA_ATUALIZACAO ??
                              tarefa?.data_atualizacao ??
                              ""}
                          </td>

                          {/* Finalizar (mantido sem handler, como no seu código) */}
                          <td>
                            <button className={Style.btnFinished}>
                              <BsCheck size={28} />
                            </button>
                          </td>

                          {/* Excluir */}
                          <td>
                            <button
                              className={Style.btnDelete}
                              onClick={() => handleDelete(tarefa.id)}
                            >
                              <BsTrashFill size={20} />
                            </button>
                          </td>

                          {/* Editar */}
                          <td>
                            <button
                              className={Style.btnEdit}
                              onClick={() => {
                                handlaEdit(tarefa);
                                setHandleNumberEdit((prev) => prev + 1);
                              }}
                            >
                              {editTarefa?.id === tarefa?.id ? (
                                <BsXCircle />
                              ) : (
                                <BsPenFill />
                              )}
                            </button>
                          </td>

                          {/* Botão para expandir/ocultar etapas */}
                          <td>
                            <button
                              type="button"
                              onClick={() => toggleEtapas(tarefa.id)}
                              aria-expanded={isOpen}
                              aria-controls={`detalhe-etapas-${tarefa.id}`}
                            >
                              {isOpen ? <BsEyeSlashFill /> : <BsEyeFill />}
                            </button>
                          </td>

                          {/* Form para adicionar etapa à tarefa da linha */}
                          <td>
                            <form
                              className={Style.formEtapas}
                              onSubmit={(e) =>
                                handleSubmitEtapas(e, tarefa.id, tarefa.etapas)
                              } // <-- passa o id aqui + etapas da tarefa
                            >
                              <div>
                                <input
                                  type="text"
                                  id={`etapas-${tarefa.id}`}
                                  name="etapas"
                                  placeholder="Nova etapa"
                                />
                              </div>
                              <div>
                                <label htmlFor={`peso-${tarefa.id}`}>
                                  peso
                                </label>
                                <select
                                  id={`peso-${tarefa.id}`}
                                  name="peso"
                                  defaultValue=""
                                >
                                  <option value="">Selecione</option>
                                  <option value="1">1</option>
                                  <option value="2">2</option>
                                  <option value="3">3</option>
                                </select>
                              </div>
                              <div>
                                <label htmlFor={`status-${tarefa.id}`}>
                                  status
                                </label>
                                <select
                                  id={`status-${tarefa.id}`}
                                  name="status"
                                  defaultValue=""
                                >
                                  <option value="">Selecione</option>
                                  <option value="Pendente">Pendente</option>
                                  <option value="Andamento">
                                    Em Andamento
                                  </option>
                                  <option value="Concluido">Concluido</option>
                                </select>
                              </div>

                              <button type="submit">salvar</button>
                            </form>
                          </td>
                        </tr>
                      );
                    })}
              </tbody>
            </table>
          )}
          {dataBase &&
            dataBase
              .filter((tarefa) => tarefa.responsavel === login)
              .map((t) => {
                const isOpen = expanded.has(t.id);
                if (!isOpen) return null;
                if (t.etapas.length === 0) return <div>sem dados..</div>;

                return (
                  <div
                    className={Style.sectionEtapas}
                    key={`detalhe-${t.id}`}
                    id={`detalhe-etapas-${t.id}`}
                    style={{ width: isOpen ? 240 : "none" }}
                  >
                    {Array.isArray(t.etapas) && t.etapas.length > 0 ? (
                      <ul>
                        {t.etapas.map((et, i) => {
                          const st = normalize(et.status);
                          return (
                            <>
                              <h4>ETAPAS</h4>
                              <li
                                key={et.id ?? i}
                                style={{
                                  textDecoration:
                                    st === "concluido"
                                      ? "line-through"
                                      : "none",
                                  fontStyle:
                                    st === "concluido" ? "italic" : "normal",
                                  color:
                                    st === "concluido"
                                      ? "#968b8b"
                                      : st === "pendente"
                                        ? "#79d45d"
                                        : "#a2b91f",
                                }}
                              >
                                <strong>{et.etapas}</strong>
                                {et.peso && <> — peso: {et.peso}</>}
                                {et.status && <> — {et.status}</>}
                              </li>
                              {/* Finalizar (mantido sem handler, como no seu código) */}

                              <button className={Style.btnFinished}>
                                <BsCheck size={28} />
                              </button>

                              {/* Excluir */}

                              <button
                                className={Style.btnDelete}
                                onClick={() => handleDeleteEtapas(et.etapas.id)}
                              >
                                <BsTrashFill size={20} />
                              </button>

                              {/* Editar */}

                              <button>ç</button>
                            </>
                          );
                        })}
                      </ul>
                    ) : (
                      <em style={{ color: "#888" }}>Sem etapas</em>
                    )}
                  </div>
                );
              })}
        </section>

        {/* Lista de etapas por tarefa (colapsável) renderizada abaixo da tabela, mantendo sua ideia de expandir */}
      </main>
    </Container>
  );
}
