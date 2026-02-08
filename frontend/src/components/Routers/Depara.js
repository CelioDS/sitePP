import RenameTitle from "../Tools/RenameTitle";
import Table from "../Layout/Table";
import Style from "./Depara.module.css";
import Container from "../Layout/Container";
import { useEffect, useState } from "react";
import ValidarToken from "../Tools/ValidarToken";
import TableAdmin from "../Layout/TableAdmin";
import { Link } from "react-router-dom";
import { CgProfile } from "react-icons/cg";

export default function Depara() {
  const [dataBase, setDataBase] = useState(null);
  const [userData, setUserData] = useState(null);
  const Url = process.env.REACT_APP_API_URL || "http://localhost:8000";
  const admin = userData?.admin;
  const login = userData?.login;
  const canal = userData?.canal;
  const id = userData?.userId;

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

      <Link
        to={`/Perfil/${id}/${login}`}
        alt="Link para o perfil do usuário"
        title="Perfil do usuário"
      >
        <span>
          <CgProfile size={22} />
        </span>
        o{login && <p>{login} </p>}
      </Link>

      {admin && <TableAdmin Url={Url} />}
      {!admin && (
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
