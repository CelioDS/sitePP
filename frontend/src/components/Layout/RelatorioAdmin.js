import Style from "./RelatorioAdmin.module.css";
import TabelaUsuarios from "../Item-Layout/tabelaUsuarios";
import TabelaResponsavel from "../Item-Layout/tabelaResponsavel";
import { useState } from "react";
export default function RelatorioAdmin({ user, DataBase }) {
  const [pagina, setPagina] = useState(false);

  return (
    <main className={Style.main}>
      <button onClick={() => setPagina((prev) => !prev)}>
        {pagina ? "Relatorio" : "usuarios"}
      </button>

      {pagina && <TabelaUsuarios></TabelaUsuarios>}

      {!pagina && <TabelaResponsavel></TabelaResponsavel>}
    </main>
  );
}
