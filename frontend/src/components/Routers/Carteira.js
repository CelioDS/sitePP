import RenameTitle from "../Tools/RenameTitle";
import Table from "../Layout/Table";
import Style from "./Carteira.module.css";
import Container from "../Layout/Container";
import { useEffect, useState } from "react";
import ValidarToken from "../Tools/ValidarToken";
import TableAdmin from "../Layout/TableAdmin";

export default function Depara() {
  const [dataBase, setDataBase] = useState(null);
  const [userData, setUserData] = useState(null);
  const Url = process.env.REACT_APP_API_URL || "http://localhost:8000";
  const admin = userData?.admin;
  const login = userData?.login;
  const canal = userData?.canal;


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
      <RenameTitle initialTitle={"P&P - Carteira"} />
      <p>
        Carteira: <span>{canal}</span>
      </p>
      <p>
        usuario: <span>{login}</span>
      </p>

      {admin && canal === "admin" ? (
        <TableAdmin Url={Url} />
      ) : (
        <Table
          dataBase={dataBase}
          setDataBase={setDataBase}
          admin={admin}
          canal={canal}
          login={login}
          Url={Url}
        />
      )}
    </Container>
  );
}
