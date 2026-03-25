import axios from "axios";
import { useState, useEffect, useRef, useLayoutEffect } from "react";
import { toast } from "react-toastify";
import Style from "./tabelaUsuarios.module.css";
import Loading from "./Loading";

export default function RelatorioAdmin({ login, DataBase }) {
  const ref = useRef();
  const [isMis, setIsMis] = useState("");
  const [editUser, setEditUser] = useState();
  const [isSubmit, setIsSubmit] = useState(false);
  const [dataBaseLogin, setDataBaseLogin] = useState([]);
  const [textButtonForm, setTextButtonForm] = useState("Salvar");
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
    if (isSubmit) return; // evita cliques durante submit

    // Se já está editando exatamente esse usuário → toggle (cancelar edição)
    if (editUser?.id === user.id) {
      if (ref.current) {
        ref.current.reset(); // limpa o form
      }
      setEditUser(null);
      // se quiser resetar o contador também:
      // setHandleNumberEdit(1);
    }
    // Senão → inicia edição desse usuário
    else {
      setEditUser(user);
      // O preenchimento do form acontece no useEffect, NÃO aqui
    }
  }
  //preencher o formulario
  useEffect(() => {
    if (editUser && ref.current) {
      const dadosForm = ref.current;
      dadosForm.login.value = editUser.login;
      dadosForm.senha.value = editUser.senha;
      dadosForm.canal.value = editUser.canal;
      dadosForm.mis.value = editUser.mis;
      dadosForm.admin.value = editUser.admin;
    }
  }, [editUser]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (isSubmit) return;

    const dadosForm = ref.current;

    const senhaValue = dadosForm.senha.value;
    const canalValue = dadosForm.canal?.value || "MIS";
    const misValue = Number(dadosForm.mis.value);
    const adminValue = Number(dadosForm.admin.value);

    if (
      !dadosForm.login.value ||
      !dadosForm.senha.value ||
      !dadosForm.mis.value ||
      !dadosForm.admin.value
    ) {
      if (isMis && !dadosForm.canal?.value)
        toast.warn("Preencher todos os valores");
      return;
    }
    setIsSubmit(true);
    setTextButtonForm(editUser ? "Editando..." : "Salvando...");

    if (editUser) {
      await axios
        .put(`${Url}/users/${editUser.id}`, {
          login: dadosForm.login?.value?.toLowerCase(),
          senha: dadosForm.senha.value,
          canal: dadosForm.canal?.value || "MIS",
          mis: Number(dadosForm.mis.value),
          admin: Number(dadosForm.admin.value),
        })
        .then(({ data }) => {
          toast.success(data.message);
          // Atualiza localmente sem precisar buscar no banco
          setDataBaseLogin((prev) =>
            prev.map((info) =>
              info.id === editUser.id
                ? {
                    ...info,
                    login: dadosForm.login?.value?.toLowerCase(),
                    senha: dadosForm.senha.value,
                    canal: dadosForm.canal.value || "MIS",
                    mis: Number(dadosForm.mis.value),
                    admin: Number(dadosForm.admin.value),
                  }
                : info,
            ),
          );
        })
        .catch((err) => toast.error(err.message));
    } else {
      if (
        dataBaseLogin.some(
          (user) =>
            user?.login?.toLowerCase() ===
            dadosForm.login?.value?.toLowerCase(),
        )
      ) {
        toast.warning("Login ja cadastrado!!!");
        setTextButtonForm("Enviar");
        setIsSubmit(false);
        setEditUser(null);
        return;
      }

      if (dadosForm.senha.value.length < 8) {
        toast.warning("A senha deve ter pelo menos 8 caracteres.");
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
        setTextButtonForm("Enviar");
        setIsSubmit(false);
        setEditUser(null);

        toast.warning(
          "A senha deve conter letras maiúsculas, minúsculas, números e caracteres especiais.",
        );
        return;
      }
      await axios
        .post(`${Url}/users/add`, {
          login: dadosForm.login?.value?.toLowerCase(),
          senha: dadosForm.senha.value,
          canal: dadosForm.canal?.value || "MIS",
          mis: Number(dadosForm.mis.value),
          admin: Number(dadosForm.admin.value),
        })
        .then(({ data }) => {
          toast.success(data);

          setDataBaseLogin((prev) => [
            ...prev,
            {
              id: data.id,
              login: data.login,
              senha: senhaValue,
              canal: canalValue,
              mis: misValue,
              admin: adminValue,
            },
          ]);
        })
        .catch((err) => {
          toast.error(err.response?.data || err.message);
        });
    }
    setTextButtonForm("Enviar");
    setIsSubmit(false);
    setEditUser(null);
    dadosForm.reset();
  }

  async function handleExcluir(id) {
    if (isSubmit || !id) {
      toast.warn("Aguarde!!!");
      return;
    }
    setIsSubmit(true);

    /*await axios.delete(`${Url}/users/${id}`).then(({ data }) => {
      setDataBaseLogin((prev) => prev.filter((item) => Number(item.id) !== id));
      toast.success(data.message);
    });*/

    const { data } = await axios.patch(`${Url}/users/${id}`, {
      ocultar: 1,
    });

    setDataBaseLogin((prev) => prev.filter((item) => Number(item.id) !== id));

    toast.success(data, 'Login excluido com sucesso!');

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
            <label htmlFor="mis">mis:</label>
            <select
              name="mis"
              id="mis"
              value={isMis}
              onChange={(e) => setIsMis(e.target.value)}
            >
              <option value="">Selecione</option>
              <option value="1">SIM</option>
              <option value="0">NÃO</option>
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
          {(isMis === "0" || editUser) && (
            <div>
              <label htmlFor="canal">canal:</label>
              <select name="canal" id="canal">
                <option value="">Selecione</option>
                <option value="PME">PME</option>
                <option value="Varejo">Varejo</option>
                <option value="LP">Loja Propria</option>
                <option value="PAP">Porta a Porta</option>
                <option value="AA">Agente Autorizado</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          )}
          <button disabled={isSubmit}>{textButtonForm}</button>
        </form>
      </section>
      <section className={Style.sectionLogin}>
        {dataBaseLogin.length > 0 ? (
          <table className={Style.tableLogin}>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Login</th>
                <th>Senha</th>
                <th>Canal</th>
                <th>mis</th>
                <th>Admin</th>
                <th>ultimo acesso</th>
                <th>Editar</th>
                <th>Excluir</th>
              </tr>
            </thead>
            <tbody>
              {dataBaseLogin.map((info, index) =>
                info?.login !== "admin" && !info?.ocultar ? (
                  <tr key={index || info?.id}>
                    <td>{info?.nome}</td>
                    <td>{info?.login}</td>
                    <td>{"*".repeat(10)}</td>
                    <td>{info?.canal}</td>
                    <td>{info?.mis ? "Sim" : "Não"}</td>
                    <td>{info?.admin === 1 ? "Sim" : "Não"}</td>
                    <td>
                      {info?.ultimo_acesso
                        ? new Date(info.ultimo_acesso).toLocaleDateString(
                            "pt-BR",
                            { timeZone: "UTC" },
                          )
                        : "SEM ACESSO!!!"}
                    </td>
                    <td>
                      <button
                        onClick={() => {
                          handleEdit(info);
                        }}
                      >
                        {editUser?.id === info?.id && info?.id
                          ? "Editando..."
                          : "Editar"}
                      </button>
                    </td>

                    {login === "admin" && (
                      <td>
                        <button
                          type="button"
                          disabled={editUser || isSubmit ? true : false}
                          onClick={() => {
                            handleExcluir(info.id);
                          }}
                        >
                          Excluir
                        </button>
                      </td>
                    )}
                  </tr>
                ) : null,
              )}
            </tbody>
          </table>
        ) : (
          <section>
            <Loading />
          </section>
        )}
      </section>
    </main>
  );
}
