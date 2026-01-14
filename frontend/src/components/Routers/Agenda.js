import RenameTitle from "../Tools/RenameTitle";
import Table from "../Layout/Table";
import Style from "./Agenda.module.css";
import Container from "../Layout/Container";
import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import ValidarToken from "../Tools/ValidarToken";

export default function Agenda() {
  const [dataBase, setDataBase] = useState([]);
  const [userData, setUserData] = useState(null);

  const Url = process.env.REACT_APP_API_URL || "http://localhost:8000";

  const admin = userData?.admin;

  const GetBaseData = async () => {
    try {
      const res = await axios.get(`${Url}/totalPendente`);
      setDataBase(res.data.filter((item) => item.responsavel === null));
      toast.success("dados carregados com sucesso!");
    } catch (error) {
      toast.error(`ERROR - ${error.message}`);
    }
  };

  useEffect(() => {
    GetBaseData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      <RenameTitle initialTitle={"P&P - Agenda"} />
      <h1>agenda</h1>
      <Table dataBase={dataBase} setDataBase={setDataBase} admin={admin} />
    </Container>
  );
}
