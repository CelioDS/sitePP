import Style from "./Login.module.css";
import Input from "../Item-Layout/Input";
import Logoclaro from "../Item-Layout/ClaroLogoColor";
import Button from "../Item-Layout/Button";
import { useState } from "react";
import { toast } from "react-toastify";
import axios from "axios";

export default function Login({
  setPermission,
  setLoginBD,
  setCanalBD,
  setMisBD,
}) {
  const [Text, setText] = useState("Entrar");
  const [login, setLogin] = useState();
  const [senha, setSenha] = useState();
  //const [admin, setAdmin] = useState();

  const Url = process.env.REACT_APP_API_URL || "http://localhost:8000";

  async function handleLogin() {
    if (!login || !senha) {
      toast.warning("Preencha todos os campos!");
      return;
    }

    try {
      setText("Entrando...");
      const response = await axios.post(`${Url}/auth/login`, { login, senha });

      if (response.data?.token) {
        const { user, token } = response.data;
        localStorage.setItem("Token", token);
        localStorage.setItem("login", user.login);
        localStorage.setItem("permission", true);
        setLoginBD(user.login);
        setCanalBD(user.canal);
        setMisBD(user.mis);

        toast.success("Login realizado com sucesso!");
        setPermission(true);
      } else {
        toast.error("Resposta inválida do servidor.");
        setText("Entrar");
      }
    } catch (err) {
      console.error(err);
      if (err.response) {
        toast.error(err.response.data.message || "Login ou senha inválida!");
      } else {
        toast.error(
          "Erro ao conectar com o servidor. Tente novamente mais tarde.",
        );
      }
      setText("Entrar");
    }
  }

  function handleKeyPress(e) {
    if (e.key === "Enter" || e.key === "NumpadEnter") {
      handleLogin();
    }
  }

  return (
    <main className={Style.main}>
      <section onKeyDown={handleKeyPress}>
        <Logoclaro className={Style.Logo} />
        <Input
          text={"Login"}
          type={"text"}
          name={"Login"}
          placeholder={"Digite seu login aqui..."}
          value={login}
          onChange={(e) => {
            setLogin(e.target.value);
          }}
        />
        <Input
          text={"Senha"}
          type={"password"}
          name={"Senha"}
          placeholder={"Digite seu Senha aqui..."}
          value={senha}
          onChange={(e) => {
            setSenha(e.target.value);
          }}
        />
        <Button
          text={Text}
          type={"submit"}
          className={Style.btn}
          onClick={() => {
            handleLogin();
          }}
        />
      </section>
    </main>
  );
}
