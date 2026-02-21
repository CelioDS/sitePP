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

  const dadosForm = ref.current;

  const { login } = useParams();

  const [dataBase, setDataBase] = useState();

  const [isSubmit, setIsSubmit] = useState();

  const [editUser, setEditUser] = useState();

  const [textBTN, setTextBTN] = useState("Salvar");

  const [handleNumberEdit, setHandleNumberEdit] = useState(1);

  const [idFirst, setIdFirst] = useState();

  const Url = process.env.REACT_APP_API_URL || "http://localhost:8000";

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

    const dadosForm = ref.current;

    if (
      !dadosForm.tarefa.value ||
      !dadosForm.porcentagem.value ||
      !dadosForm.etapas.value
    ) {
      toast.warn("Preencher todos os valores");

      return;
    }

    setIsSubmit(true);

    setTextBTN(editUser ? "Editando... " : "Salvando...");

    console.log(editUser);

    if (editUser) {
      await axios

        .put(`${Url}/todo/${editUser.id}`, {
          tarefa: dadosForm.tarefa.value,

          etapas: dadosForm.etapas.value,

          porcentagem: dadosForm.porcentagem.value,

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

                    tarefa: dadosForm.tarefa.value,

                    etapas: dadosForm.etapas.value,

                    porcentagem: dadosForm.porcentagem.value,

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
        dataBase.some(
          (data) =>
            data.tarefa.toLowerCase() === dadosForm.tarefa.value.toLowerCase(),
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
          tarefa: dadosForm?.tarefa.value,
          etapas: dadosForm?.etapas.value,
          porcentagem: dadosForm?.porcentagem.value,
          responsavel: login,
          concluido: 0,
        })

        .then(({ data }) => {
          toast.success(data);

          setDataBase((prev) => [
            ...prev,

            {
              id: data.id,

              tarefa: data.tarefa,

              etapas: data.etapas,

              porcentagem: data.porcentagem,

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

    dadosForm.reset();
  }

  async function handleSubmitEtapas(item, e) {
    e.preventDefault();
    await axios

      .post(`${Url}/todo/etapas/add`, {
        etapas: dadosForm?.etapas.value,
        peso: dadosForm?.peso.value,
        porcentagem: dadosForm?.porcentagem.value,
        md5: item.id,

        concluido: 0,
      })

      .then(({ data }) => {
        toast.success(data);

        setDataBase((prev) => [
          ...prev,

          {
            id: data.id,
            tarefa: data.tarefa,
            etapas: data.etapas,
            porcentagem: data.porcentagem,
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

  async function handlaEdit(user) {
    setEditUser(user);

    setTextBTN("Editando");

    if (!idFirst) {
      setIdFirst(user.id);
    }

    if (idFirst === user.id) {
      // verifica se o id recebeu 2 click e cancela a edição

      if (handleNumberEdit % 2 === 0) {
        dadosForm.tarefa.value = "";
        dadosForm.etapas.value = "";
        dadosForm.porcentagem.value = "";

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
      dadosForm.tarefa.value = editUser.tarefa;
      dadosForm.etapas.value = editUser.etapas;
      dadosForm.porcentagem.value = editUser.porcentagem;
    }
  }, [editUser]);

  async function handleDelete(id) {
    console.log(id);

    if (isSubmit) return;

    setIsSubmit(true);

    try {
      await axios.delete(`${Url}/todo/${id}`).then(({ data }) => {
        setDataBase((prev) => prev.filter((item) => item.id !== id));

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

        <form ref={ref} onSubmit={handleSubmit}>
          <div>
            <label htmlFor="tarefa">Tarefa</label>

            <input
              id="tarefa"
              name="tarefa"
              type="text"
              placeholder="Digite a sua terefa aqui..."
            />
          </div>

          <div>
            <label htmlFor="etapas">Etapas</label>

            <input
              id="etapas"
              name="etapas"
              type="text"
              placeholder="Digite a sua etapas aqui..."
            />
          </div>

          <div>
            <label htmlFor="porcentagem">Porcentagem</label>

            <select id="porcentagem" name="porcentagem" type="text">
              <option value="0">0%</option>

              <option value="30">30%</option>

              <option value="50">50%</option>

              <option value="80">80%</option>

              <option value="100">100%</option>
            </select>
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

                  <th>Etapas</th>

                  <th>porcentagem</th>

                  <th>concluido</th>

                  <th>DATA_ATUALIZACAO</th>

                  <th>Finalizar</th>

                  <th>Excluir</th>

                  <th>Editar</th>
                </tr>
              </thead>

              <tbody>
                {dataBase &&
                  dataBase

                    .filter((item) => item.responsavel === login)

                    .map((item, index) => (
                      <tr key={item?.id || index}>
                        <td
                          style={{
                            background:
                              idFirst === item.id && editUser
                                ? "#b80b0b"
                                : undefined,
                          }}
                        >
                          {item.tarefa}
                        </td>

                        <td>
                          
                          <form action="">
                            <div>
                              <label htmlFor="etapas">etapas</label>
                              <input type="text" id="etapas" name="etapas" />
                            </div>
                            <div>
                              <label htmlFor="peso">peso</label>
                              <input type="text" id="peso" name="peso" />
                            </div>
                            <div>
                              <label htmlFor="etapas">etapas</label>
                              <input type="text" id="etapas" name="etapas" />
                            </div>

                            <button
                              onClick={() => {
                                handleSubmitEtapas(item);
                              }}
                            >
                              salvar
                            </button>
                          </form>
                        </td>

                        <td>{item.porcentagem}%</td>

                        <td>{item.concluido}</td>

                        <td>{item.DATA_ATUALIZACAO}</td>

                        <td>
                          <button className={Style.btnFinished}>
                            <BsCheck size={28} />
                          </button>
                        </td>

                        <td>
                          <button
                            className={Style.btnEdit}
                            onClick={() => {
                              handlaEdit(item);

                              setHandleNumberEdit(
                                (prevState) => prevState + 1,

                                item.id,
                              );
                            }}
                          >
                            {editUser?.id === item?.id ? (
                              <BsXCircle />
                            ) : (
                              <BsPenFill />
                            )}
                          </button>
                        </td>

                        <td>
                          <button
                            className={Style.btnDelete}
                            onClick={() => handleDelete(item.id)}
                          >
                            {<BsTrashFill size={20} />}
                          </button>
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
