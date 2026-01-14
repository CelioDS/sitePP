import styleExt from "./Footer.module.css";

export default function Footer() {
  const anoAtual = new Date().getFullYear();

  return (
    <footer className={styleExt.footer}>
      <main className={styleExt.main}>
        <section className={styleExt.logo}></section>

        <section>
          <p>
            Copyright <span>&copy;</span> <span id="ano">{anoAtual}</span> -
            Todos os direitos reservados
          </p>
          <a
            href="https://planejamentoperformance.netlify.app"
            target="_blank"
            rel="noopener noreferrer"
          >
            Criado e desenvolvido por <span>&nbsp;P&P</span>
          </a>
        </section>
      </main>
    </footer>
  );
}
