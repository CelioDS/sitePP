import { useEffect, useState, useMemo } from "react";
import Container from "../Layout/Container";
import RenameTitle from "../Tools/RenameTitle";
import LinkButton from "../Item-Layout/LinkButton";
import ValidarToken from "../Tools/ValidarToken";
import { BsLink } from "react-icons/bs";

import styles from "./MIS.module.css";

export default function MIS() {
  const [userData, setUserData] = useState(null);
  const login = userData?.login || "usuario";
  const mis = userData?.mis 
  const canal = userData?.canal 

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

  const relatorios = useMemo(
    () => [
      {
        nome: "DAILY RESIDENCIAL",
        link: "https://corpclarobr.sharepoint.com/:f:/r/sites/USER-PPRSI/Residencial/DAILY%20RESIDENCIAL?csf=1&web=1&e=jYguUH",
        frequencia: "SEG → SEX",
        responsavel: "CÉLIO",
        descricao: "DIRETORIA / GERÊNCIA",
        origem:
          "F201154/N6158445.TENDENCIA_RES\nF201154/N6158445.REALIZADO_RES_DIA",
      },
      {
        nome: "TENDÊNCIA MATRIZ SHAREPOINT",
        frequencia: "SEG → SÁB",
        responsavel: "LAURA / CÉLIO",
        descricao: "DIRETORIA / GERÊNCIA / PONTAS",
        origem: "INN.BACKLOGPUSH\nCARD WPP\nBI_HIS_VENDAS_FIXA",
      },
      {
        nome: "BACKLOG COMERCIAL + QUEBRA",
        frequencia: "DAILY",
        responsavel: "LAURA / CÉLIO",
        descricao: "DIRETORIA / GERÊNCIA",
        origem: "INN.FT_BACKLOG_COMERCIAL\nFT_ANALITICA_QUEBRA",
      },
      {
        nome: "DAILY MÓVEL",
        link: "https://corpclarobr.sharepoint.com/:f:/r/sites/USER-PPRSI/Mvel/DAILY%20MOVEL?csf=1&web=1&e=wYrdst",
        frequencia: "SEG → SEX",
        responsavel: "CÉLIO",
        descricao: "DIRETORIA / GERÊNCIA / PONTAS",
        origem: "TMP_GROSS_4_HMLG_REL\nCANAL_MASTER_AJUSTADA_DET",
      },
      {
        nome: "ANTIQUEBRA",
        frequencia: "SEG → SEX",
        responsavel: "LAURA",
        descricao: "DIRETORIA / GERÊNCIA / PONTAS",
        origem: "BASE MAURO MG",
      },
      {
        nome: "HUB ESTEIRA AGENDAMENTO",
        frequencia: "SEG → SEX",
        responsavel: "LAURA",
        descricao: "DIRETORIA / GERÊNCIA / PONTAS",
        origem: "LISTA SHAREPOINT",
      },
      {
        nome: "APARELHOS OBSOLETOS",
        frequencia: "QUINTA",
        responsavel: "LAURA",
        descricao: "DIRETORIA / GERÊNCIA / PONTAS",
        origem: "SAP MB52",
      },
      {
        nome: "EFICIÊNCIA ESTEIRA",
        frequencia: "SEG → SEX",
        responsavel: "LAURA",
        descricao: "DIRETORIA / GERÊNCIA",
        origem: "LISTA SHAREPOINT",
      },
      {
        nome: "APARELHOS",
        link: "https://corpclarobr.sharepoint.com/:f:/r/sites/USER-PPRSI/Mvel/APARELHOS%20-%20SELL%20OUT%20%26%20SELL%20IN?csf=1&web=1&e=ndWGGJ",
        frequencia: "SEG / QUA / SEX",
        responsavel: "CÉLIO",
        descricao: "DIRETORIA / GERÊNCIA / PONTAS",
        origem: "SAP IW781",
      },
      {
        nome: "MPLAY",
        link: "https://corpclarobr.sharepoint.com/:f:/r/sites/USER-PPRSI/Residencial/MPLAY?csf=1&web=1&e=dfB8ov",
        frequencia: "SEX",
        responsavel: "CÉLIO",
        descricao: "DIRETORIA / GERÊNCIA / PONTAS",
        origem: "DM_HIS_MOVIMENTO_MPLAY",
      },
    ],
    [],
  );

  return (
    <Container>
      <RenameTitle initialTitle="P&P - MIS" />

      <main className={styles.main}>
        <header className={styles.header}>
          <h1>MIS – Controle de Relatórios</h1>
          <p>Central de monitoramento das entregas operacionais</p>
        </header>
        {mis === 1 && canal === "admin" && (
          <div className={styles.buttonArea}>
            <LinkButton to={`/TodoList/${login}`} text="Abrir Todo List" />
          </div>
        )}
        
        <section className={styles.tableSection}>
          <h2>Relatórios Operacionais</h2>

          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Relatório</th>
                  <th>Link</th>
                  <th>Frequência</th>
                  <th>Responsável</th>
                  <th>Descrição</th>

                  {!!mis &&
                  <th>Origem</th>
                  }
                </tr>
              </thead>

              <tbody>
                {relatorios.map((relatorio, index) => (
                  <tr key={index}>
                    <td className={styles.reportName}>{relatorio.nome}</td>
                    <td>
                      <a
                        href={relatorio.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={`Abrir ${relatorio.nome}`}
                        aria-label={`Abrir ${relatorio.nome}`}
                      >
                        <BsLink fontSize={28} />
                      </a>
                    </td>
                    <td>{relatorio.frequencia}</td>

                    <td>{relatorio.responsavel}</td>

                    <td>{relatorio.descricao}</td>
    {!!mis &&
                    <td className={styles.origin}>{relatorio.origem}</td> }
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
