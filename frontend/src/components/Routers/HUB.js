import RenameTitle from "../Tools/RenameTitle";
import LinkButton from "../Item-Layout/LinkButton";
import Container from "../Layout/Container";
import Style from "./HUB.module.css";

export default function Home() {
  return (
    <Container>
      <RenameTitle initialTitle="P&P - HUB" />

      {/* HERO / HEADER */}
      <section className={Style.hero}>
        <div className={Style.heroContent}>
          <span className={Style.badge}>
            SISTEMA INTEGRADO DE SOLICITAÇÕES WEB
          </span>

          <h1>Sistema de Solicitações de Suporte Comercial</h1>

          <p>
            Aqui você pode solicitar e acompanhar suas solicitações de suporte.
          </p>
        </div>
      </section>

      {/* GRID DE OPÇÕES */}
      <section className={Style.gridSection}>
        <h3>ESCOLHA UMA OPÇÃO</h3>

        <div className={Style.grid}>
          
          <LinkButton
            to="/suportecomercial"
            text="SUPORTE COMERCIAL"
            className={Style.card}
            description="Abertura e gestão de solicitações"
          />

          <div className={Style.card}>
            <h4>DÚVIDAS</h4>
            <p>Tire dúvidas sobre cadastro e vendas</p>
          </div>

          <div className={Style.card}>
            <h4>CONSULTA</h4>
            <p>Consulta de ocorrências e registros</p>
          </div>

          <div className={Style.card}>
            <h4>ERROS SISTEMA</h4>
            <p>Suporte a erros técnicos</p>
          </div>

          <div className={Style.card}>
            <h4>ALTERAÇÃO CADASTRAL</h4>
            <p>Atualização de dados</p>
          </div>

        </div>
      </section>
    </Container>
  );
}