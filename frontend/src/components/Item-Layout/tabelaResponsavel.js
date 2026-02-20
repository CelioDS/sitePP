import Style from "./tabelaResponsavel.module.css";
import GraficoLP from "../Item-Layout/GraficoLP";

export default function TabelaResponsavel(Url) {
  return (
    <main style={{ padding: "1rem" }} className={Style.main}>
      <h2>📊 Relatório por Responsável</h2>

      <GraficoLP Url={Url}/>
    </main>
  );
}
