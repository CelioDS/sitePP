import axios from "axios";
import { toast } from "react-toastify";
import Container from "../Layout/Container";
import { useParams } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { BsPenFill, BsCheck, BsTrashFill, BsXCircle } from "react-icons/bs";
import Style from "./TodoList.module.css";
import Loading from "../Item-Layout/Loading";

export default function ToDo() {
  const ref = useRef();
  const dadosForm = ref.current; // mantém como no seu código

  const [expanded, setExpanded] = useState(new Set());

  const { login } = useParams();
  const [dataBase, setDataBase] = useState();
  const [isSubmit, setIsSubmit] = useState();
  const [editUser, setEditUser] = useState();
  const [textBTN, setTextBTN] = useState("Salvar");
  const [handleNumberEdit, setHandleNumberEdit] = useState(1);
  const [idFirst, setIdFirst] = useState();
  const [idTarefa, setIdTarefa] = useState();
  const Url = process.env.REACT_APP_API_URL || "http://localhost:8000";
  const etapas = (dataBase || []).filter((dados) => dados.id === idTarefa);

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
      const next = new Set(prev);
      if (next.has(tarefaId)) next.delete(tarefaId);
      else next.add(tarefaId);
      return next;
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

    setTextBTN(editUser ? "Editando... " : "Salvando...");

    if (editUser) {
      await axios
        .put(`${Url}/todo/${editUser.id}`, {
          tarefa: tarefaValue, // <-- usa a variável segura
          responsavel: login,
          concluido: editUser.concluido,
          DATA_ATUALIZACAO: editUser.DATA_ATUALIZACAO,
        })
        .then(({ data }) => {
          toast.success(data.message);

          setDataBase((prev) =>
            prev.map((info) =>
              info.id === editUser.id
                ? {
                    ...info,

                    id: editUser.id,
                    tarefa: tarefaValue, // <-- usa a variável segura
                    responsavel: login,
                    concluido: data.concluido,
                    DATA_ATUALIZACAO: data.data_atualizacao,
                  }
                : info,
            ),
          );
        })
        .catch((err) => toast.error(err.message));
    } else {
      if (
        dataBase?.some(
          (data) => data.tarefa.toLowerCase() === tarefaValue.toLowerCase(),
        ) &&
        !editUser
      ) {
        toast.warning("Tarefa ja cadastrada...");

        setTextBTN("Enviar");

        setHandleNumberEdit(0);

        setIsSubmit(false);

        setEditUser(null);

        return;
      }

      await axios
        .post(`${Url}/todo/add`, {
          tarefa: tarefaValue, // <-- usa a variável segura
          responsavel: login,
          concluido: 0,
        })
        .then(({ data }) => {
          toast.success(data);

          setDataBase((prev) => [
            ...(prev || []),

            {
              id: data.id,
              tarefa: data.tarefa,
              responsavel: data.responsavel,
              concluido: data.concluido,
              DATA_ATUALIZACAO: data.data_atualizacao,
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

    setEditUser(null);

    // segura: só chama se existir
    dadosForm?.reset?.();
  }

  async function handleSubmitEtapas(e) {
    e.preventDefault();

    // LÊ OS CAMPOS DO PRÓPRIO FORM DA LINHA (sem usar ref compartilhado)
    const form = e.currentTarget; // <-- usa o form submetido
    const etapaValue = form.etapas?.value?.trim() || "";
    const pesoValue = form.peso?.value || "";
    const statusValue = form.status?.value || "";

    if ((!etapaValue && !pesoValue) || !statusValue) {
      toast.warn("Preencher todos os valores");
      return;
    }

    if (
      etapas?.[0]?.etapas?.some(
        (data) =>
          (data.etapas || "").toLowerCase() === etapaValue.toLowerCase(),
      ) &&
      !editUser
    ) {
      toast.warning("Etapas ja cadastrada...");
      return;
    }

    await axios
      .post(`${Url}/todo/etapas/add`, {
        tarefa_id: idTarefa,
        etapas: etapaValue, // <-- usa o valor lido do form da linha
        peso: pesoValue,
        status: statusValue,
        concluido: 0,
      })
      .then(({ data }) => {
        toast.success(data);

        setDataBase((prev) =>
          (prev || []).map((t) =>
            t.id === idTarefa
              ? {
                  ...t,
                  etapas: Array.isArray(t.etapas)
                    ? [
                        ...t.etapas,
                        {
                          // Ajuste os campos conforme o que o backend te devolve em `data`
                          tarefa_id: idTarefa,
                          etapas: data.etapas,
                          peso: data.peso,
                          status: data.status,
                          concluido: data.concluido ?? 0,
                          data_atualizacao: data.data_atualizacao,
                        },
                      ]
                    : [
                        {
                          tarefa_id: idTarefa,
                          etapas: data.etapas,
                          peso: data.peso,
                          status: data.status,
                          concluido: data.concluido ?? 0,
                          data_atualizacao: data.data_atualizacao,
                        },
                      ],
                }
              : t,
          ),
        );

        form.reset(); // <-- limpa o form da linha
      })
      .catch((err) => {
        toast.error(err.response?.data || err.message);
      });
  }

  async function handlaEdit(user) {
    setEditUser(user);

    setTextBTN("Editando");

    if (!idFirst) {
      setIdFirst(user.id);
    }

    if (idFirst === user.id) {
      // verifica se o id recebeu 2 click e cancela a edição

      if (handleNumberEdit % 2 === 0) {
        // SAFE: só acessa se existir
        if (ref.current?.tarefa) ref.current.tarefa.value = "";

        setTextBTN("Salvar");

        setEditUser(null);
      } else {
        setEditUser(user);
      }
    } else {
      // se nenhuma condição é antiginda, nova tarefa, novo id e nova cotagem inicia

      setEditUser(user);

      setIdFirst(user.id);
    }
  }

  useEffect(() => {
    if (editUser && ref.current) {
      const dadosForm = ref.current;
      if (dadosForm?.tarefa) {
        dadosForm.tarefa.value = editUser.tarefa; // SAFE
      }
    }
  }, [editUser]);

  async function handleDelete(id) {
    if (isSubmit) return;

    setIsSubmit(true);

    try {
      await axios.delete(`${Url}/todo/${id}`).then(({ data }) => {
        setDataBase((prev) => (prev || []).filter((item) => item.id !== id));

        toast.success(data.message);
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

        <section>
          {(dataBase && dataBase.length === 0) || !dataBase ? (
            <Loading />
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
                    .map((tarefa) => (
                      <tr key={tarefa.id}>
                        <td
                          style={{
                            background:
                              idFirst === tarefa.id && editUser
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

                        {/* Evite console.log no JSX de célula */}
                        {/* <td>{console.log(tarefa.etapas)}</td> */}

                        <td>{tarefa.concluido}</td>
                        <td>{tarefa.data_atualizacao}</td>

                        <td>
                          <button className={Style.btnFinished}>
                            <BsCheck size={28} />
                          </button>
                        </td>

                        <td>
                          <button
                            className={Style.btnEdit}
                            onClick={() => {
                              handlaEdit(tarefa);
                              setHandleNumberEdit((prev) => prev + 1);
                            }}
                          >
                            {editUser?.id === tarefa?.id ? (
                              <BsXCircle />
                            ) : (
                              <BsPenFill />
                            )}
                          </button>
                        </td>
                        <td>
                          <button
                            className={Style.btnDelete}
                            onClick={() => handleDelete(tarefa.id)}
                          >
                            <BsTrashFill size={20} />
                          </button>
                        </td>

                        {/* Form para adicionar etapa à tarefa da linha */}
                        <td>
                          <form
                            className={Style.formEtapas}
                            onSubmit={(e) => handleSubmitEtapas(e, tarefa.id)} // <-- passa o id aqui
                          >
                            {/* Se preferir, dá para usar um hidden input também */}
                            {/* <input type="hidden" name="tarefa_id" value={tarefa.id} /> */}

                            <div>
                              <input
                                type="text"
                                id="etapas"
                                name="etapas"
                                placeholder="Nova etapa"
                              />
                            </div>
                            <div>
                              <label htmlFor="peso">peso</label>
                              <select id="peso" name="peso" defaultValue="">
                                <option value="">Selecione</option>
                                <option value="1">1</option>
                                <option value="2">2</option>
                                <option value="3">3</option>
                              </select>
                            </div>
                            <div>
                              <label htmlFor="status">status</label>
                              <select id="status" name="status" defaultValue="">
                                <option value="">Selecione</option>
                                <option value="Pendente">Pendente</option>
                                <option value="Andamento">Em Andamento</option>
                                <option value="Concluido">Concluido</option>
                              </select>
                            </div>

                            <button type="submit">salvar</button>
                          </form>
                        </td>

                        {}
                        <tbody>
                          {dataBase.map((t) => {
                            const isOpen = expanded.has(t.id); // true = mostrar; false = ocultar

                            return (
                              <>
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
                                      {isOpen
                                        ? "Ocultar etapas"
                                        : "Mostrar etapas"}
                                    </button>
                                  </td>
                                </tr>

                                {/* Linha de detalhe (aparece só quando isOpen = true) */}
                                {isOpen && (
                                  <tr>
                                    <td
                                      colSpan={2}
                                      id={`detalhe-etapas-${t.id}`}
                                    >
                                      {/* Formulário de adicionar etapa */}
                                      <form
                                        onSubmit={(e) => {
                                          e.preventDefault();
                                          const fd = new FormData(
                                            e.currentTarget,
                                          );
                                          const novaEtapa = (
                                            fd.get("etapa") || ""
                                          )
                                            .toString()
                                            .trim();
                                          if (!novaEtapa) return;
                                          // aqui você chamaria sua API para salvar a etapa de t.id
                                          // depois atualize o estado externo que contém `lista`
                                          e.currentTarget.reset();
                                        }}
                                        style={{ marginBottom: 8 }}
                                      >
                                        <input
                                          name="etapa"
                                          placeholder="Nova etapa"
                                        />
                                        <button type="submit">
                                          Salvar etapa
                                        </button>
                                      </form>

                                      {/* Lista de etapas */}
                                      {Array.isArray(t.etapas) &&
                                      t.etapas.length > 0 ? (
                                        <ul
                                          style={{
                                            margin: 0,
                                            paddingLeft: "1.2rem",
                                          }}
                                        >
                                          {t.etapas.map((et, i) => (
                                            <li
                                              key={et.id ?? i}
                                              style={{
                                                decoration:
                                                  et.status === "concluido"
                                                    ? "line-through"
                                                    : "",
                                                fontStyle:
                                                  et.status === "concluido"
                                                    ? "italic"
                                                    : "",
                                                color:
                                                  et.status === "concluido"
                                                    ? "#968b8b"
                                                    : et.status === "pendente"
                                                      ? "#79d45d"
                                                      : "#a2b91f",
                                              }}
                                            >
                                              <strong>{et.etapas}</strong>
                                              {et.peso && (
                                                <> — peso: {et.peso}</>
                                              )}
                                              {et.status && <> — {et.status}</>}
                                            </li>
                                          ))}
                                        </ul>
                                      ) : (
                                        <em style={{ color: "#888" }}>
                                          Sem etapas
                                        </em>
                                      )}
                                    </td>
                                  </tr>
                                )}
                              </>
                            );
                          })}
                        </tbody>

                        {/** */}

                        {/* Coluna das etapas da própria tarefa da linha */}
                        <td>
                          {Array.isArray(tarefa.etapas) &&
                          tarefa.etapas.length > 0 ? (
                            <ul>
                              {tarefa.etapas.map((et, idx) => (
                                <li
                                  key={et.id ?? idx}
                                  style={{
                                    decoration:
                                      et.status === "concluido"
                                        ? "line-through"
                                        : "",
                                    fontStyle:
                                      et.status === "concluido" ? "italic" : "",
                                    color:
                                      et.status === "concluido"
                                        ? "#968b8b"
                                        : et.status === "pendente"
                                          ? "#79d45d"
                                          : "#a2b91f",
                                  }}
                                >
                                  <strong>{et.etapas}</strong>
                                  {et.peso ? (
                                    <>
                                      {" "}
                                      — peso: <span>{et.peso}</span>
                                    </>
                                  ) : null}
                                  {et.status ? (
                                    <>
                                      {" "}
                                      — <span>{et.status}</span>
                                    </>
                                  ) : null}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <em style={{ color: "#888" }}>Sem etapas</em>
                          )}
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
          )}
        </section>
      </main>
    </Container>
  );
}
