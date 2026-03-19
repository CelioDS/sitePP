import axios from "axios";
import { toast } from "react-toastify";
import Container from "./Container";
import { useParams } from "react-router-dom";
import { useEffect, useState, useRef, useCallback } from "react";
import {
  BsPenFill,
  BsCheck,
  BsTrashFill,
  BsXCircle,
  BsEyeSlashFill,
  BsEyeFill,
  BsClockFill,
  BsCheckCircleFill,
  BsShare,
} from "react-icons/bs";
import Style from "./TodoList.module.css";
import Loading from "../Item-Layout/Loading";
import debounce from "lodash/debounce";
import Modal from "../Item-Layout/Modal";

export default function ToDo() {
  const ref = useRef();

  const [expanded, setExpanded] = useState(new Set());

  const { login } = useParams();
  const [dataBase, setDataBase] = useState();
  const [isSubmit, setIsSubmit] = useState(false);
  const [editTarefa, setEditTarefa] = useState();
  const [editEtapas, setEditEtapas] = useState();
  const [textBTN, setTextBTN] = useState("Salvar");
  const [handleNumberEdit, setHandleNumberEdit] = useState(1);
  const [idFirst, setIdFirst] = useState();
  const [etapasShow, setEtapasShow] = useState();
  const [tarefaShow, setTarefaShow] = useState(0);
  const [userBD, setUserBD] = useState([]);
  const [shareTarefa, setshareTarefa] = useState(0);
  const [deleteTarefa, setdeleteTarefa] = useState(0);
  const [deleteEtapas, setdeleteEtapas] = useState(0);
  const [IDShare, setIDShare] = useState();
  const [userShare, setuserShare] = useState();
  const [showModal, setshowModal] = useState();

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

  function countTarefas(db, user) {
    if (!Array.isArray(db)) return { pendentes: 0, concluidos: 0, total: 0 };
    const total = db.filter((t) => t.responsavel === user).length;
    const pendentes = db.filter(
      (t) => t.responsavel === user && Number(t.concluido) === 0,
    ).length;
    const finalizados = db.filter(
      (t) => t.responsavel === user && Number(t.concluido) === 1,
    ).length;

    return { pendentes, finalizados, total };
  }

  function toggleEtapas(tarefaId) {
    setExpanded((prev) => {
      //const next = new Set(prev);
      //if (next.has(tarefaId)) next.delete(tarefaId);
      //else next.add(tarefaId);
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

        const ordenado = res.data.sort((a, b) => a.ordem - b.ordem);

        setDataBase(ordenado);
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
    const obsValue = dadosForm?.obs?.value?.trim() || ""; // <-- SAFE
    const ordemValue = 0; // <-- SAFE

    if (!tarefaValue) {
      toast.warn("Preencher todos os valores");
      return;
    }

    setIsSubmit(true);
    setTextBTN(editTarefa ? "Editando... " : "Salvando...");

    if (editTarefa) {
      console.log(editTarefa);
      await axios
        .put(`${Url}/todo/${editTarefa.id}`, {
          tarefa: tarefaValue, // <-- usa a variável segura
          obs: editTarefa.obs, // <-- usa a variável segura
          responsavel: login,
          concluido: editTarefa.concluido,
          ordem: editTarefa.ordem,
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
                    obs: editTarefa.obs,
                    responsavel: login,
                    ordem: ordemValue,
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
          obs: obsValue,
          responsavel: login,
          ordem: 0,
          concluido: 0,
        })
        .then(({ data }) => {
          toast.success(data?.message ?? "Tarefa criada!");
          setDataBase((prev) => [
            ...(prev || []),
            {
              id: data?.id,
              tarefa: data?.tarefa ?? tarefaValue,
              obs: data?.obs ?? obsValue,
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
    if (existe && !editEtapas) {
      toast.warning("Etapas ja cadastrada...");
      return;
    }

    if (editEtapas) {
      await axios
        .put(`${Url}/todo/etapas/${editEtapas.id}`, {
          tarefa: e.etapa.value, // <-- usa a variável segura
          obs: e.obs.value,
          responsavel: login,
          concluido: editEtapas.concluido,
          DATA_ATUALIZACAO:
            editEtapas?.DATA_ATUALIZACAO ?? editEtapas?.data_atualizacao,
        })
        .then(({ data }) => {
          toast.success(data?.message ?? "Tarefa atualizada!");
          setDataBase((prev) =>
            prev.map((info) =>
              info.id === editEtapas.id
                ? {
                    ...info,
                    id: editEtapas.id,
                    tarefa: e.etapa.value,
                    obs: e.obs.value,
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
      await axios
        .post(`${Url}/todo/etapas/add`, {
          tarefa_id: tarefaId,
          etapas: etapaValue,
          peso: sanitizePeso(pesoValue),
          status: statusValue,
          concluido: statusValue === "Concluido" ? 1 : 0,
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
                              data?.data_atualizacao ??
                              new Date().toISOString(),
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
                              data?.data_atualizacao ??
                              new Date().toISOString(),
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

  async function handlaEditEtapas(etapa) {
    setEditEtapas(etapa);
    console.log(etapa);
    setTextBTN("Editando");

    if (!idFirst) {
      setIdFirst(etapa.id); // id da etapa
    }

    if (idFirst === etapa.id) {
      // verifica se recebeu 2 clicks e cancela a edição
      if (handleNumberEdit % 2 === 0) {
        if (ref.current?.etapas) ref.current.etapas.value = "";
        setTextBTN("Salvar");
        setEditEtapas(null);
      } else {
        setEditEtapas(etapa);
      }
    } else {
      setEditEtapas(etapa);
      setIdFirst(etapa.id);
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
      await axios.delete(`${Url}/todo/${id}`, {}).then(({ data }) => {
        setDataBase((prev) => (prev || []).filter((item) => item.id !== id));
        toast.success(data?.message ?? "Tarefa excluída!");
      });
    } catch (err) {
      toast.error(err.response?.data || err.message);
    } finally {
      setIsSubmit(false);
      setdeleteTarefa(false);
    }
  }

  async function handleDeleteEtapas(etapa) {
    if (isSubmit) return;

    setIsSubmit(true);

    try {
      await axios.delete(`${Url}/todo/etapas/${etapa.id}`).then(({ data }) => {
        setDataBase((prev) =>
          (prev || []).map((t) => {
            if (t.id !== etapa.tarefa_id) return t;
            return {
              ...t,
              etapas: (t.etapas || []).filter((e) => e.id !== etapa.id),
            };
          }),
        );

        toast.success(data?.message ?? "Tarefa excluída!");
      });
    } catch (err) {
      toast.error(err.response?.data || err.message);
    } finally {
      setIsSubmit(false);
    }
  }

  async function handleFinishedEtapas(etapa) {
    setIsSubmit(true);

    try {
      const { data } = await axios.patch(`${Url}/todo/etapas/${etapa.id}`, {
        concluido: 1,
        status: "Concluido",
      });

      setDataBase((prev) =>
        (prev || []).map((t) => {
          if (t.id !== etapa.tarefa_id) return t;
          return {
            ...t,
            etapas: (t.etapas || []).map((e) =>
              e.id === etapa.id
                ? {
                    ...e,
                    concluido: 1,
                    status: "Concluido",
                    data_atualizacao:
                      data?.data_atualizacao ?? new Date().toISOString(),
                  }
                : e,
            ),
          };
        }),
      );

      toast.success(data?.message ?? "Etapa Concluida!");
    } catch (err) {
      toast.error(err.response?.data || err.message);
    } finally {
      setIsSubmit(false);
    }
  }

  useEffect(() => {
    if (!Array.isArray(dataBase)) return;

    const users = [
      ...new Set(
        dataBase.flatMap((t) =>
          (t.responsavel || "")
            .split(",")
            .map((r) => r.trim())
            .filter((r) => r.length >= 1),
        ),
      ),
    ];

    setUserBD(users);
  }, [dataBase]);

  async function handleFinished(tarefa) {
    const etapas = Array.isArray(tarefa?.etapas) ? tarefa.etapas : [];

    const hasPendente = etapas.some((et) => {
      const byFlag = Number(et?.concluido) === 0;
      const byStatus = (et?.status ?? "").toLowerCase() === "pendente";

      return byFlag || byStatus;
    });

    if (hasPendente) {
      toast.warn("Existe etapas pendentes!!!");
      return;
    }

    try {
      await axios
        .patch(`${Url}/todo/${tarefa.id}`, {
          concluido: 1,
        })
        .then(({ data }) => {
          setDataBase((prev) =>
            prev.map((info) =>
              info.id === tarefa.id
                ? {
                    ...info,
                    concluido: 1,
                  }
                : info,
            ),
          );

          toast.success(data?.message ?? "Tarefa Concluida!");
        });
    } catch (err) {
      toast.error(err.response?.data || err.message);
    } finally {
      setIsSubmit(false);
    }
  }

  const UpdateHandleSumitTextarea = useCallback(
    debounce(async (tarefa, value) => {
      try {
        const { data } = await axios.patch(`${Url}/todo/${tarefa.id}`, {
          obs: value,
        });

        toast.success("OBS atualizada! ", { data });
      } catch (err) {
        toast.error(err.response?.data || err.message);
      }
    }, 2000),
    [],
  );

  async function handleSubmitTextarea(e, tarefa) {
    const value = e.target.value;
    setDataBase((prev) =>
      (prev || []).map((t) =>
        t.id === tarefa.id
          ? {
              ...t,
              obs: value,
            }
          : t,
      ),
    );

    UpdateHandleSumitTextarea(tarefa, value);
  }

  async function handleShareTarefa(usuario, tarefa) {
    if (isSubmit) setIsSubmit(true);
    try {
      console.log(tarefa);
      const data = await axios.patch(`${Url}/todo/${tarefa.id}`, {
        responsavel: `${tarefa.responsavel}, ${usuario}`,
      });

      setDataBase((prev) =>
        prev.map((info) =>
          info.id === tarefa.id
            ? {
                ...info,
                responsavel: `${tarefa.responsavel}, ${usuario}`,
              }
            : info,
        ),
      );

      toast.success(
        `Tarefa compartilhada com sucesso com a ${usuario}` || data,
      );
    } catch (err) {
      toast.error(err.response?.data || err.message);
    } finally {
      setIsSubmit(false);
      setshowModal(false);
    }
  }

  return (
    <Container>
      <main className={Style.main}>
        <h1>Tarefas</h1>
        <header className={Style.card}>
          <div>
            <span>pendente</span>
            <BsClockFill color="#9fa11a" />
            <h1>{countTarefas(dataBase, login).pendentes}</h1>
          </div>
          <form ref={ref} onSubmit={handleSubmit} className={Style.formTarefa}>
            <input
              id="tarefa"
              name="tarefa"
              type="text"
              placeholder="Digite a sua terefa aqui..."
            />

            <button
              className={Style.btnSubmit}
              disabled={isSubmit}
              aria-label="Salvar tarefa"
              title="Salvar tarefa"
            >
              {textBTN}
            </button>
          </form>

          <div>
            <span>Concluidos</span>
            <BsCheckCircleFill color="#25a11a" />
            <h1>{countTarefas(dataBase, login).finalizados}</h1>
          </div>
        </header>

        <h4>Ver terafas</h4>
        <button
          aria-label="ver tarefa"
          title="ver tarefa"
          className={Style.btnTarefa}
          onClick={() => {
            setTarefaShow((prev) => !prev);
            toggleEtapas(0);
            setEtapasShow(0);
          }}
        >
          {tarefaShow ? "Pendente" : "Concluido"}
        </button>
        <br />
        <h1>Lista de tarefas {tarefaShow ? "concluidas" : "pendentes"}</h1>
        <section className={Style.section}>
          {!dataBase ? (
            <Loading />
          ) : dataBase.length === 0 ? (
            <p style={{ color: "#757171" }}>Nenhuma tarefa cadastrada.</p>
          ) : (
            <aside className={Style.sectionTarefas}>
              <table>
                <thead>
                  <tr>
                    <th>Tarefa</th>
                    <th>Obs</th>
                    {!tarefaShow && (
                      <>
                        <th>Finalizar </th>
                        <th>Excluir </th>
                        <th>Editar </th>
                        <th>Etapas </th>
                        {!etapasShow && <th>share </th>}
                        {!etapasShow && !!shareTarefa && <th>destinatario </th>}
                      </>
                    )}

                    <th>Criar Etapas </th>
                  </tr>
                </thead>

                <tbody>
                  {dataBase &&
                    dataBase
                      .filter(
                        (tarefa) =>
                          tarefa.responsavel.includes(login) &&
                          tarefa.concluido === Number(tarefaShow),
                      )
                      .map((tarefa) => {
                        const isOpen = expanded.has(tarefa.id);
                        return (
                          <tr key={tarefa.id}>
                            <td
                              style={{
                                background:
                                  Number(idFirst) === Number(tarefa.id) &&
                                  editTarefa
                                    ? "#b80b0b"
                                    : Number(tarefa.id) === Number(etapasShow)
                                      ? "#cebebe"
                                      : "#fff",
                              }}
                            >
                              <p>{tarefa.tarefa}</p>

                              {
                                <h6 style={{ color: " #929090" }}>
                                  {tarefa?.DATA_ATUALIZACAO
                                    ? new Date(
                                        tarefa.DATA_ATUALIZACAO,
                                      ).toLocaleDateString("pt-BR")
                                    : tarefa?.data_atualizacao
                                      ? new Date(
                                          tarefa.data_atualizacao,
                                        ).toLocaleDateString("pt-BR")
                                      : ""}
                                  <span
                                    style={{
                                      color:
                                        Number(
                                          porcentagemPonderada(tarefa.etapas),
                                        ) >= 80
                                          ? "#3ba820"
                                          : Number(
                                                porcentagemPonderada(
                                                  tarefa.etapas,
                                                ),
                                              ) >= 50
                                            ? "#b92828"
                                            : "#585c1c",
                                    }}
                                  >
                                    &nbsp;
                                    {porcentagemPonderada(
                                      tarefa.etapas,
                                    ).toFixed(2)}
                                  </span>
                                  %
                                </h6>
                              }
                              <br />
                              <small
                                style={{
                                  color: " #929090",
                                  fontStyle: "italic",
                                }}
                              >
                                Etapas: {tarefa.etapas.length}
                              </small>
                              <br />
                              <small
                                style={{
                                  color: " #929090",
                                  fontStyle: "italic",
                                }}
                              >
                                Autor: {tarefa.responsavel.split(",")[0]}
                              </small>
                            </td>

                            {tarefaShow ? (
                              <td>
                                <p>{tarefa.obs}</p>
                              </td>
                            ) : (
                              <td>
                                <textarea
                                  onChange={(e) =>
                                    handleSubmitTextarea(e, tarefa)
                                  }
                                  value={tarefa.obs}
                                  name="obs"
                                  id="obs"
                                ></textarea>
                              </td>
                            )}

                            {!tarefaShow && (
                              <>
                                <td>
                                  <button
                                    aria-label="Concluir tarefa"
                                    title="Concluir tarefa"
                                    className={Style.btnFinished}
                                    onClick={() => {
                                      handleFinished(tarefa);
                                    }}
                                  >
                                    <BsCheck />
                                  </button>
                                </td>

                                {/* Excluir */}
                                <td>
                                  <button
                                    aria-label="Excluir tarefa"
                                    title="Excluir tarefa"
                                    className={Style.btnDelete}
                                    onClick={() =>
                                      setdeleteTarefa((prev) => !prev)
                                    }
                                  >
                                    <BsTrashFill />
                                  </button>
                                </td>

                                {!!deleteTarefa && (
                                  <Modal
                                    cancelar={() =>
                                      setdeleteTarefa((prev) => !prev)
                                    }
                                    confirmar={() => handleDelete(tarefa.id)}
                                    titulo={"Deletar tarefa?"}
                                    texto={`Deseja deletar a essa tarefa?`}
                                  />
                                )}

                                {/* Editar */}
                                <td>
                                  <button
                                    aria-label="Editar tarefa"
                                    title="Editar tarefa"
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
                              </>
                            )}

                            {/* Botão para expandir/ocultar etapas */}
                            <td>
                              <button
                                aria-label="ver etapas"
                                title="ver etapas"
                                type="button"
                                className={Style.btnHidden}
                                disabled={tarefa?.etapas.length === 0}
                                onClick={() => {
                                  toggleEtapas(tarefa.id);
                                  setEtapasShow(
                                    isOpen ? 0 : tarefa?.etapas[0]?.tarefa_id,
                                  );
                                  setshareTarefa(0);
                                }}
                                aria-expanded={isOpen}
                                aria-controls={`detalhe-etapas-${tarefa.id}`}
                              >
                                {isOpen ? <BsEyeSlashFill /> : <BsEyeFill />}
                              </button>
                            </td>
                            {!etapasShow && tarefa.concluido === 0 && (
                              <td>
                                <button
                                  className={Style.btnShare}
                                  aria-label="compartilhar tarefas"
                                  title="compartilhar tarefas"
                                  type="button"
                                  onClick={() => {
                                    if (IDShare === tarefa.id)
                                      setshareTarefa((prev) => !prev);
                                    setIDShare(tarefa.id);
                                  }}
                                >
                                  <BsShare />
                                </button>
                              </td>
                            )}
                            {!etapasShow &&
                              !!shareTarefa &&
                              !tarefaShow &&
                              IDShare === tarefa.id && (
                                <td>
                                  <select
                                    value={(e) => e.target.value}
                                    onChange={(e) => {
                                      setshowModal((prev) => !prev);
                                      setuserShare(e.target.value);
                                    }}
                                    style={{ padding: "8px" }}
                                  >
                                    <option value="">Selecionar</option>
                                    {userBD &&
                                      userBD
                                        .filter(
                                          (user) =>
                                            !tarefa.responsavel
                                              .split(",")
                                              .map((r) => r.trim())
                                              .includes(user),
                                        )
                                        .map((user) => (
                                          <option key={user.id} value={user}>
                                            {user}
                                          </option>
                                        ))}
                                  </select>
                                </td>
                              )}

                            {showModal && (
                              <Modal
                                cancelar={() => setshowModal((prev) => !prev)}
                                confirmar={(e) =>
                                  handleShareTarefa(userShare, tarefa)
                                }
                                titulo={"Compartilhar tarefa?"}
                                texto={`Deseja compartilhar a tarefa com ${userShare}`}
                              />
                            )}

                            {!etapasShow &&
                              !!shareTarefa &&
                              !tarefaShow &&
                              IDShare !== tarefa.id && <td></td>}
                            {/* Form para adicionar etapa à tarefa da linha */}

                            {!tarefaShow && (
                              <>
                                <td>
                                  <form
                                    className={Style.formEtapas}
                                    onSubmit={(e) =>
                                      handleSubmitEtapas(
                                        e,
                                        tarefa.id,
                                        tarefa.etapas,
                                      )
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
                                        <option value="Pendente">
                                          Pendente
                                        </option>
                                        <option value="Andamento">
                                          Em Andamento
                                        </option>
                                        <option value="Concluido">
                                          Concluido
                                        </option>
                                      </select>
                                    </div>

                                    <button
                                      aria-label="Salvar tarefa"
                                      title="Salvar tarefa"
                                      type="submit"
                                    >
                                      salvar
                                    </button>
                                  </form>
                                </td>
                              </>
                            )}
                          </tr>
                        );
                      })}
                </tbody>
              </table>
            </aside>
          )}
          {dataBase &&
            dataBase
              .filter((tarefa) => tarefa.responsavel.includes(login))
              .map((t) => {
                const isOpen = expanded.has(t.id);
                if (!isOpen) return null;
                return (
                  <aside
                    className={Style.sectionEtapas}
                    key={`detalhe-${t.id}`}
                    id={`detalhe-etapas-${t.id}`}
                  >
                    <h4>VER ETAPAS</h4>
                    {Array.isArray(t.etapas) &&
                      t.etapas.length > 0 &&
                      t.etapas.map((etapa, i) => <button>{etapa[i]}</button>)}

                    {Array.isArray(t.etapas) && t.etapas.length > 0 ? (
                      <ul>
                        {t.etapas.map((et, i) => {
                          const st = normalize(et.status);
                          <h4>ETAPAS</h4>;
                          return (
                            <>
                              <div
                                className={Style.divEtapas}
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

                                  justifyContent: tarefaShow ? "center" : "",
                                }}
                              >
                                <strong className={Style.etapasLine}>
                                  {et.etapas}
                                  <span>
                                    {et.peso && <> peso: {et.peso}</>}
                                    <br />
                                    {et.status && <> {et.status}</>}
                                  </span>
                                </strong>
                                {!tarefaShow && (
                                  <>
                                    {/* Finalizar (mantido sem handler, como no seu código) */}

                                    <aside>
                                      {
                                        <button
                                          aria-label="Marcar etapa como concluída"
                                          disabled={et.concluido === 1}
                                          key={et.id ?? i}
                                          className={Style.btnFinished}
                                          onClick={() =>
                                            handleFinishedEtapas(et)
                                          }
                                          title="Marcar etapa como concluída"
                                        >
                                          <BsCheck />
                                        </button>
                                      }

                                      {/* Excluir */}

                                      <button
                                        aria-label="deletar Etapa"
                                        title="deletar Etapa"
                                        className={Style.btnDelete}
                                        key={et.id ?? i}
                                        disabled={et.concluido === 1}
                                        onClick={() =>
                                          setdeleteEtapas((prev) => !prev)
                                        }
                                      >
                                        <BsTrashFill />
                                      </button>

                                      {!!deleteEtapas && (
                                        <Modal
                                          cancelar={() => {
                                            setdeleteEtapas((prev) => !prev);
                                          }}
                                          confirmar={(e) =>
                                            handleDeleteEtapas(et)
                                          }
                                          titulo={"Deletar etapa?"}
                                          texto={`Deseja deletar a etapa?`}
                                        />
                                      )}

                                      {/* Editar */}
                                      <button
                                        aria-label="Editar Etapa"
                                        title="Editar Etapa"
                                        className={Style.btnEdit}
                                        disabled={et.concluido === 1}
                                        onClick={() => {
                                          handlaEditEtapas(et); // <- passe a etapa
                                          setHandleNumberEdit(
                                            (prev) => prev + 1,
                                          );
                                        }}
                                      >
                                        {editEtapas?.id === et?.id ? (
                                          <BsXCircle />
                                        ) : (
                                          <BsPenFill />
                                        )}
                                      </button>
                                    </aside>
                                  </>
                                )}
                              </div>
                            </>
                          );
                        })}
                      </ul>
                    ) : (
                      <em style={{ color: "#888" }}>Sem etapas</em>
                    )}
                  </aside>
                );
              })}
        </section>
      </main>
    </Container>
  );
}
