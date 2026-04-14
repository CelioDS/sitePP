import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styleExt from "./Error.module.css";
import LinkButton from "../Item-Layout/LinkButton";

export default function Error() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/", { replace: true }); // replace: true evita voltar para a página de erro no histórico
    }, 1000); // Reduzi para 10 segundos (100 segundos é muito tempo)

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <main className={styleExt.container}>
      <LinkButton text="Ir para Home" to="/" />

      <br />
      <br />
      <br />
      <br />

      <h1 className={styleExt.titles}>ERROR 404</h1>
      <p>Página não encontrada.</p>

      <a
        href="https://planejamentoperformance.netlify.app"
        target="_blank"
        rel="noopener noreferrer"
      >
        Criado e desenvolvido por <span>P&P</span>
      </a>
    </main>
  );
}
