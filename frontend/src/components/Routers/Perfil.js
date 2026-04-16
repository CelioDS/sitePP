// components/Routers/Perfil.jsx
import Style from "./Perfil.module.css";
import Container from "../Layout/Container";
import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import ValidarToken from "../Tools/ValidarToken";
import PerfilAdmin from "../Item-Layout/PerfilAdmin";
import RenameTitle from "../Tools/RenameTitle";
import PerfilUsuario from "../Layout/PerfilUsuarios";

export default function Perfil() {
  const Url = process.env.REACT_APP_API_URL || "http://localhost:8000";
  const [perfilData, setPerfilData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);

  const mis = userData?.mis;
  const login = userData?.login;
  const id = userData?.userId;
  const admin = userData?.admin;

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

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        // Ajuste: chama o endpoint alinhado ao backend
        const { data } = await axios.get(`${Url}/users/${id}`);
        // data é um array (rows). Garanta estado coerente:
        setPerfilData(Array.isArray(data) ? data : [data]);
      } catch (error) {
        console.error("Erro ao buscar dados do perfil:", error);
        toast.error("Erro ao carregar perfil. Por favor, tente novamente.");
        setPerfilData([]);
      } finally {
        setLoading(false);
      }
    }

    if (id) fetchData();
  }, [id, Url]);

  return (
    <Container>
      <RenameTitle initialTitle={"P&P - Perfil"} />
      <main className={Style.perfil}>
        {admin && mis ? (
          <PerfilAdmin Url={Url} login={login}/>
        ) : (
          <PerfilUsuario Url={Url} />
        )}
      </main>
    </Container>
  );
}
