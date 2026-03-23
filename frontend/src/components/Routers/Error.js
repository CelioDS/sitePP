import styleExt from "./Error.module.css";
import { useEffect } from "react";
import LinkButton from '../Item-Layout/LinkButton'

export default function Error() {
  useEffect(() => {
    const timer = setTimeout(() => {
      window.location.href = "/";
    }, 100000);

    return () => clearTimeout(timer);
  });

  return (
    <main className={styleExt.container}>

      <LinkButton text={'Ir para home'} to={'/'}/>

      <br /><br /><br /><br />



      <h1 className={styleExt.titles}>ERROR 404</h1>
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
