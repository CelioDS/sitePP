import Style from "./RelatorioUser.module.css";
import GraficoLP from "../Item-Layout/GraficoLP";
import GraficoVarejo from "../Item-Layout/GraficoVarejo";
import ValidarToken from "../Tools/ValidarToken";
import { useState, useEffect } from "react";
import Teste from "../Item-Layout/teste";

export default function RelatorioUser({ Url }) {
  const [userData, setUserData] = useState(null);
  //const admin = userData?.admin;
  //const login = userData?.login;
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
    <main className={Style.main}>
      {canal === "LP" && <GraficoLP Url={Url}></GraficoLP>}
      {canal === "Varejo" && <GraficoVarejo Url={Url}></GraficoVarejo>}
      {canal === "PAP" && <Teste Url={Url}></Teste>}
     
    </main>
  );
}
