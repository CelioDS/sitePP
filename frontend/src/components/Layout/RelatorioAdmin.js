import Style from "./RelatorioAdmin.module.css";
import TabelaResponsavel from "../Item-Layout/tabelaResponsavel";
import { useState } from "react";
import GraficoLP from "../Item-Layout/GraficoLP";
import GraficoPAP from "../Item-Layout/GraficoPAP";
import GraficoVarejo from "../Item-Layout/GraficoVarejo";

export default function RelatorioAdmin({ Url }) {
  const [pagina, setPagina] = useState(false);
  const [grafico, setGrafico] = useState();

  return (
    <main className={Style.main}>
      <header>
        <span>Ir para:</span>
        <button onClick={() => setPagina((prev) => !prev)}>
          {" "}
          {pagina ? "ultima atualizacao" : "Relatorio"}
        </button>
      </header>

      {pagina && (
        <section>
          <aside>
            <button onClick={() => setGrafico("LP")}>LP</button>
            <button onClick={() => setGrafico("PAP")}>PAP</button>
            <button onClick={() => setGrafico("Varejo")}>Varejo</button>
          </aside>
        </section>
      )}

      {grafico === "LP" && <GraficoLP Url={Url} />}
      {grafico === "PAP" && <GraficoPAP Url={Url} />}
      {grafico === "Varejo" && <GraficoVarejo Url={Url} />}

      {!pagina && <TabelaResponsavel Url={Url}></TabelaResponsavel>}
    </main>
  );
}
