import axios from "axios";
import { useState, useEffect, useRef, useLayoutEffect } from "react";
import { toast } from "react-toastify";
import Style from "./tabelaUsuarios.module.css";
import Loading from "./Loading";

export default function RelatorioAdmin({ user, DataBase }) {
  const [dataBaseLogin, setDataBaseLogin] = useState([]);
  const ref = useRef();
  const dadosForm = ref.current;
  const [editUser, setEditUser] = useState();
  const [isSubmit, setIsSubmit] = useState(false);
  const [textButtonForm, setTextButtonForm] = useState("Salvar");
  const [handleNumberEdit, setHandleNumberEdit] = useState(1);
  const [idFirst, setIdFirst] = useState();
  const Url = process.env.REACT_APP_API_URL || "http://localhost:8000";

  // 🔹 Buscar dados do backend
  const GetBaseData = async () => {
    try {
      const res = await axios.get(`${Url}/users`);

      setDataBaseLogin(res.data);

      toast.success("Dados carregados com sucesso!");
    } catch (error) {
      toast.error(`ERROR - ${error.message}`);
    } finally {
    }
  };

  useLayoutEffect(() => {
    GetBaseData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleEdit(user) {
    setEditUser(user);
    if (!idFirst) {
      setIdFirst(user.id);
    }

    if (idFirst === user.id) {
      // verifica se o id recebeu 2 click e cancela a edição
      if (handleNumberEdit % 2 === 0) {
        dadosForm.login.value = "";
        dadosForm.senha.value = "";
        dadosForm.canal.value = "";
        dadosForm.admin.value = "";
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
  //preencher o formulario
  useEffect(() => {
    if (editUser && ref.current) {
      const dadosForm = ref.current;
      dadosForm.login.value = editUser.login;
      dadosForm.senha.value = editUser.senha;
      dadosForm.canal.value = editUser.canal;
      dadosForm.admin.value = editUser.admin;
    }
  }, [editUser]);

  async function handleSubmit(e) {
    if (isSubmit) return;

    const dadosForm = ref.current;
    e.preventDefault();

    if (
      !dadosForm.login.value ||
      !dadosForm.senha.value ||
      !dadosForm.canal.value ||
      !dadosForm.admin.value
    ) {
      toast.warn("Preencher todos os valores");
      return;
    }
    setIsSubmit(true);
    setTextButtonForm(editUser ? "Editando..." : "Salvando...");

    if (editUser) {
      console.log("oi");
      await axios
        .put(`${Url}/users/${editUser.id}`, {
          login: dadosForm.login.value.toLowerCase(),
          senha: dadosForm.senha.value,
          canal: dadosForm.canal.value,
          admin: Number(dadosForm.admin.value),
        })
        .then(({ data }) => {
          console.log("oi");
          console.log(data.message);
          toast.success(data.message);
          // Atualiza localmente sem precisar buscar no banco
          setDataBaseLogin((prev) =>
            prev.map((info) =>
              info.id === editUser.id
                ? {
                    ...info,
                    login: dadosForm.login.value.toLowerCase(),
                    senha: dadosForm.senha.value,
                    canal: dadosForm.canal.value,
                    admin: Number(dadosForm.admin.value),
                  }
                : info
            )
          );
        })
        .catch((err) => toast.error(err.message));
    } else {
      if (
        dataBaseLogin.some(
          (user) =>
            user.login.toLowerCase() === dadosForm.login.value.toLowerCase()
        )
      ) {
        toast.warning("Login ja cadastrado!!!");
        setHandleNumberEdit(0);
        setTextButtonForm("Enviar");
        setIsSubmit(false);
        setEditUser(null);
        return;
      }

      if (dadosForm.senha.value.length < 8) {
        toast.warning("A senha deve ter pelo menos 8 caracteres.");
        setHandleNumberEdit(0);
        setTextButtonForm("Enviar");
        setIsSubmit(false);
        setEditUser(null);
        return;
      }

      if (
        !/[A-Z]/.test(dadosForm.senha.value) ||
        !/[a-z]/.test(dadosForm.senha.value) ||
        !/[0-9]/.test(dadosForm.senha.value) ||
        !/[^A-Za-z0-9]/.test(dadosForm.senha.value)
      ) {
        setHandleNumberEdit(0);
        setTextButtonForm("Enviar");
        setIsSubmit(false);
        setEditUser(null);

        toast.warning(
          "A senha deve conter letras maiúsculas, minúsculas, números e caracteres especiais."
        );
        return;
      }
      await axios
        .post(`${Url}/users/add`, {
          login: dadosForm.login.value.toLowerCase(),
          senha: dadosForm.senha.value,
          canal: dadosForm.canal.value,
          admin: Number(dadosForm.admin.value),
        })
        .then(({ data }) => {
          toast.success(data);

          setDataBaseLogin((prev) => [
            ...prev,
            {
              id: data.id,
              login: dadosForm.login.value.toLowerCase(),
              senha: dadosForm.senha.value,
              canal: dadosForm.canal.value,
              admin: Number(dadosForm.admin.value),
            },
          ]);
        })
        .catch((err) => {
          toast.error(err.response?.data || err.message);
        });
    }
    setHandleNumberEdit(0);
    setTextButtonForm("Enviar");
    setIsSubmit(false);
    setEditUser(null);
    dadosForm.reset();
  }

  async function handleExcluir(id) {
    if (isSubmit) return;
    setIsSubmit(true);

    await axios.delete(`${Url}/users/${id}`).then(({ data }) => {
      setDataBaseLogin((prev) => prev.filter((item) => item.id !== id));
      toast.success(data);
    });

    setIsSubmit(false);
  }

  return (
    <main className={Style.main}>
      <section className="formLogin">
        <p>{editUser ? "Editando usuario" : "Criando usuario"}</p>
        <form ref={ref} onSubmit={handleSubmit} className={Style.form}>
          <div>
            <label htmlFor="login"></label>
            <input
              id="login"
              type="text"
              name="login"
              placeholder="Digite seu login aqui"
            />
          </div>

          <div>
            <label htmlFor="senha"></label>
            <input
              autoComplete="off"
              id="senha"
              type="password"
              name="senha"
              placeholder="Digite seu senha aqui"
            />
          </div>
          <div>
            <label htmlFor="canal">canal:</label>
            <select name="canal" id="canal">
              <option value="">Selecione</option>
              <option value="LP">LP</option>
              <option value="PAP">PAP</option>
              <option value="PP">PP</option>
            </select>
          </div>
          <div>
            <label htmlFor="admin">Admin:</label>
            <select name="admin" id="admin">
              <option value="">Selecione</option>
              <option value="1">SIM</option>
              <option value="0">NÃO</option>
            </select>
          </div>
          <button disabled={isSubmit}>{textButtonForm}</button>
        </form>
      </section>
      <section className={Style.sectionLogin}>
        {dataBaseLogin.length > 0 ? (
          <table className={Style.tableLogin}>
            <thead>
              <tr>
                <th>Login</th>
                <th>Senha</th>
                <th>Canal</th>
                <th>Admin</th>
                <th>Editar</th>
                <th>Excluir</th>
              </tr>
            </thead>
            <tbody>
              {dataBaseLogin.map((info, index) =>
                info.login !== "admin" ? (
                  <tr key={index || info.id}>
                    <td>{info.login}</td>
                    <td>{"*".repeat(10)}</td>
                    <td>{info.canal}</td>
                    <td>{info.admin === 1 ? "Sim" : "Não"}</td>
                    <th>
                      <button
                        onClick={() => {
                          handleEdit(info);
                          setHandleNumberEdit(
                            (prevState) => prevState + 1,
                            info.id
                          );
                        }}
                      >
                        {editUser?.id === info?.id && info?.id
                          ? "Editando..."
                          : "Editar"}
                      </button>
                    </th>
                    <th>
                      <button
                        type="button"
                        disabled={editUser || isSubmit ? true : false}
                        onClick={() => handleExcluir(info.id)}
                      >
                        Excluir
                      </button>
                    </th>
                  </tr>
                ) : null
              )}
            </tbody>
          </table>
        ) : (
          <tr>
            <Loading />
          </tr>
        )}
      </section>
    </main>
  );
}
