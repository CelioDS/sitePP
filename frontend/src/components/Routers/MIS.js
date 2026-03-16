import { useEffect, useState, useMemo } from "react";
import Container from "../Layout/Container";
import RenameTitle from "../Tools/RenameTitle";
import LinkButton from "../Item-Layout/LinkButton";
import ValidarToken from "../Tools/ValidarToken";

import styles from "./MIS.module.css";

export default function MIS() {

  const [userData, setUserData] = useState(null);
  const login = userData?.login || "usuario";

  useEffect(() => {

    let active = true;

    async function loadUser() {
      try {
        const data = await ValidarToken();
        if (active && data) {
          setUserData(data);
        }
      } catch (err) {
        console.error("Erro ao validar token:", err);
      }
    }

    loadUser();

    return () => {
      active = false;
    };

  }, []);

  const relatorios = useMemo(() => [
    {
      nome: "DAILY RESIDENCIAL",
      frequencia: "SEG → SEX",
      responsavel: "CÉLIO",
      destinatarios: "DIRETORIA / GERÊNCIA",
      origem: "F201154/N6158445.TENDENCIA_RES\nF201154/N6158445.REALIZADO_RES_DIA"
    },
    {
      nome: "TENDÊNCIA MATRIZ SHAREPOINT",
      frequencia: "SEG → SÁB",
      responsavel: "LAURA / CÉLIO",
      destinatarios: "DIRETORIA / GERÊNCIA / PONTAS",
      origem: "INN.BACKLOGPUSH\nCARD WPP\nBI_HIS_VENDAS_FIXA"
    },
    {
      nome: "BACKLOG COMERCIAL + QUEBRA",
      frequencia: "DAILY",
      responsavel: "LAURA / CÉLIO",
      destinatarios: "DIRETORIA / GERÊNCIA",
      origem: "INN.FT_BACKLOG_COMERCIAL\nFT_ANALITICA_QUEBRA"
    },
    {
      nome: "DAILY MÓVEL",
      frequencia: "SEG → SEX",
      responsavel: "CÉLIO",
      destinatarios: "DIRETORIA / GERÊNCIA / PONTAS",
      origem: "TMP_GROSS_4_HMLG_REL\nCANAL_MASTER_AJUSTADA_DET"
    },
    {
      nome: "ANTIQUEBRA",
      frequencia: "SEG → SEX",
      responsavel: "LAURA",
      destinatarios: "DIRETORIA / GERÊNCIA / PONTAS",
      origem: "BASE MAURO MG"
    },
    {
      nome: "HUB ESTEIRA AGENDAMENTO",
      frequencia: "SEG → SEX",
      responsavel: "LAURA",
      destinatarios: "DIRETORIA / GERÊNCIA / PONTAS",
      origem: "LISTA SHAREPOINT"
    },
    {
      nome: "APARELHOS OBSOLETOS",
      frequencia: "QUINTA",
      responsavel: "LAURA",
      destinatarios: "DIRETORIA / GERÊNCIA / PONTAS",
      origem: "SAP MB52"
    },
    {
      nome: "EFICIÊNCIA ESTEIRA",
      frequencia: "SEG → SEX",
      responsavel: "LAURA",
      destinatarios: "DIRETORIA / GERÊNCIA",
      origem: "LISTA SHAREPOINT"
    },
    {
      nome: "APARELHOS",
      frequencia: "SEG / QUA / SEX",
      responsavel: "CÉLIO",
      destinatarios: "DIRETORIA / GERÊNCIA / PONTAS",
      origem: "SAP IW781"
    },
    {
      nome: "MPLAY",
      frequencia: "SEX",
      responsavel: "CÉLIO",
      destinatarios: "DIRETORIA / GERÊNCIA / PONTAS",
      origem: "DM_HIS_MOVIMENTO_MPLAY"
    }
  ], []);

  return (
    <Container>

      <RenameTitle initialTitle="P&P - MIS" />

      <main className={styles.main}>

        <header className={styles.header}>
          <h1>MIS – Controle de Relatórios</h1>
          <p>Central de monitoramento das entregas operacionais</p>
        </header>

        <div className={styles.buttonArea}>
          <LinkButton
            to={`/TodoList/${login}`}
            text="Abrir Todo List"
          />
        </div>

        <section className={styles.tableSection}>

          <h2>Relatórios Operacionais</h2>

          <div className={styles.tableWrapper}>

            <table className={styles.table}>

              <thead>
                <tr>
                  <th>Relatório</th>
                  <th>Frequência</th>
                  <th>Responsável</th>
                  <th>Destinatários</th>
                  <th>Origem</th>
                </tr>
              </thead>

              <tbody>

                {relatorios.map((relatorio, index) => (

                  <tr key={index}>

                    <td className={styles.reportName}>
                      {relatorio.nome}
                    </td>

                    <td>{relatorio.frequencia}</td>

                    <td>{relatorio.responsavel}</td>

                    <td>{relatorio.destinatarios}</td>

                    <td className={styles.origin}>
                      {relatorio.origem}
                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        </section>

      </main>

    </Container>
  );
}
