import RenameTitle from "../Tools/RenameTitle";
import Table from "../Layout/Table";
import Style from "./Depara.module.css";
import Container from "../Layout/Container";
import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import ValidarToken from "../Tools/ValidarToken";

export default function Depara() {
  const [dataBase, setDataBase] = useState(null);
  const [userData, setUserData] = useState(null);
  const Url = process.env.REACT_APP_API_URL || "http://localhost:8000";
  const admin = userData?.admin;
  const login = userData?.login;
  const canal = userData?.canal;

  const rotas = {
    LP: "lojapropria",
    PAP: "portaaporta",
  };

  // Normalizador: transforma qualquer resposta em array
  const toArray = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (payload?.data && Array.isArray(payload.data)) return payload.data;
    return [];
  };

  const fetchData = async () => {
    if (!canal) return;
    try {
      const resp = await axios.get(`${Url}/${rotas[canal]}`);

      // resp.data pode ser: [...]  ou  { data: [...] }  ou até { message: ... }
      const normalized = toArray(resp.data);
      setDataBase(normalized);
    } catch (err) {
      console.error("Erro ao carregar dados:", err);
      toast.error("Erro ao carregar dados:", err.message);

      setDataBase([]); // fallback para garantir array
    }
  };

  useEffect(() => {
    if (!canal) return; // ainda não carregou o usuário

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canal]); // roda apenas 1 vez

  useEffect(() => {
    async function loadUser() {
      const data = await ValidarToken();
      if (!data) {
        window.location.href = "/Error";
        return;
      }
      setUserData(data); // { login, admin }
    }
    loadUser();
  }, []);

  return (
    <Container className={Style.main}>
      <RenameTitle initialTitle={"P&P - Depara"} />
      <h1>DEPARAS</h1>

      {admin && <h1>oi</h1>}
      {!admin && (
        <Table
          dataBase={dataBase}
          setDataBase={setDataBase}
          admin={admin}
          canal={canal}
          login={login}
          fetchData={fetchData}
          Url={Url}
        />
      )}
    </Container>
  );
}
