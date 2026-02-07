import RenameTitle from "../Tools/RenameTitle";
import { useState, useLayoutEffect } from "react";

import Container from "../Layout/Container";
import RelatorioUser from "../Layout/RelatorioUser";
import RelatorioAdmin from "../Layout/RelatorioAdmin";
import { format } from "date-fns";
import { fromZonedTime } from "date-fns-tz";
import Style from "./Relatorio.module.css";
import ValidarToken from "../Tools/ValidarToken";

export default function Relatorio() {
  const Url = process.env.REACT_APP_API_URL || "http://localhost:8000";
  const [userData, setUserData] = useState(null);
  const today = format(
    fromZonedTime(new Date(), "America/Sao_Paulo"),
    "yyyy-MM-dd",
  ); //
  const user = userData?.login;
  const admin = userData?.admin;
  const canal = userData?.canal;

  useLayoutEffect(() => {
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
    <Container>
      <main className={Style.main}>
        <RenameTitle initialTitle={"P&P - Relatorio"} />
        {admin && canal === "admin" ? (
          <RelatorioAdmin user={user} Url={Url} />
        ) : (
          <RelatorioUser Url={Url} user={user} today={today} admin={admin} />
        )}
      </main>
    </Container>
  );
}
