import { Link } from "react-router-dom";
import { BsList, BsXLg } from "react-icons/bs";
import { useEffect, useState, useCallback } from "react";

import styleExt from "./NavBar.module.css";
import CheckMobile from "../Tools/CheckMobile.js";
import LinkButton from "../Item-Layout/LinkButton";
import ClaroLogo from "../Item-Layout/ClaroLogo.js";
import WalletLogo from "../Item-Layout/WalletLogo.js";
import RelatorioLogo from "../Item-Layout/RelatorioLogo.js";
import Logout from "./logout.js";
import { CgProfile } from "react-icons/cg";

export default function NavBar({ setPermission, permission, canalBD }) {
  const checkMobile = useCallback(CheckMobile, []);
  const isMobile = checkMobile();

  const sizeBtn = 36;
  const colorBtn = "#b98639";
  const colorLink = "#E3262E";

  // REMOVIDO: const [iconMenu, setIconMenu]...
  const [menuUp, setMenuUp] = useState(false);
  const [menuDown, setMenuDown] = useState(null);
  const [MenuOpen, setMenuOpen] = useState(false);
  const [linkAtivo, setLinkAtivo] = useState("Home");

  function openMenu(linkclick) {
    // Verifica se linkclick é um evento (acontece quando vem do Link) ou string
    const nomeLink = typeof linkclick === "string" ? linkclick : linkAtivo;

    setMenuOpen((prevState) => !prevState);
    setMenuUp(!menuUp);

    if (menuDown !== null) {
      setMenuDown((prevState) => !prevState);
    } else {
      setMenuDown(false);
    }

    setLinkAtivo(nomeLink);
  }

  // Sempre que isMobile mudar, reajusta o estado
  useEffect(() => {
    if (!isMobile) {
      setMenuOpen(false);
      setMenuUp(null);
      setMenuDown(null);
    }
  }, [isMobile]);

  // REMOVIDO: useEffect com setTimeout que causava o bug

  useEffect(() => {
    const observer = new MutationObserver((mutationsList) => {
      for (const mutation of mutationsList) {
        if (
          mutation.type === "childList" &&
          mutation.target === document.querySelector("title")
        ) {
          // Proteção caso o título não tenha 3 partes
          const parts = mutation.target.textContent.split(" ");
          if (parts.length > 2) setLinkAtivo(parts[2]);
        }
      }
    });

    const titleNode = document.querySelector("title");
    if (titleNode) {
      observer.observe(titleNode, {
        subtree: true,
        characterData: true,
        childList: true,
      });
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  function getLogo(linkAtivo) {
    if (linkAtivo === "Carteira") return <WalletLogo />;
    if (linkAtivo === "Relatorio") return <RelatorioLogo />;
    if (linkAtivo === "Perfil") return <CgProfile size={54} />;
    return <ClaroLogo />;
  }

  return (
    <main className={styleExt.main}>
      <nav>
        <LinkButton
          to="/"
          text={""}
          img={getLogo(linkAtivo)}
          extStyle={true}
          className={styleExt.logo}
          alt="Logo da Claro"
        />
        {isMobile && (
          <button
            title="botão menu"
            className={`${styleExt.MenuBtn}
          ${menuUp ? styleExt.btnOpen : ""} 
          ${menuUp ? "" : styleExt.btnClose}`}
            // Passamos uma string fixa ou null, pois o botão apenas abre/fecha
            onClick={() => openMenu(linkAtivo)}
          >
            {/* CORREÇÃO AQUI: Renderização condicional direta */}
            {MenuOpen ? (
              <BsXLg color={colorBtn} size={sizeBtn} />
            ) : (
              <BsList color={colorBtn} size={sizeBtn} />
            )}
          </button>
        )}

        <ul
          className={`
            ${styleExt.menuMobile}
            ${menuUp ? styleExt.openMenu : null}
            ${!menuDown ? null : styleExt.closeMenu}
            `}
        >
          {/* Use arrow function no onClick para passar a string correta se desejar */}

          <li>
            <Link
              onClick={() => openMenu("Home")}
              style={linkAtivo === "Home" ? { color: colorLink } : {}}
              to="/"
            >
              Home
            </Link>
          </li>
          <li>
            <Link
              onClick={() => openMenu("Carteira")}
              style={linkAtivo === "Carteira" ? { color: colorLink } : {}}
              to="/Carteira"
            >
              Carteira
            </Link>
          </li>

          <li>
            <Link
              onClick={() => openMenu("Relatorio")}
              style={linkAtivo === "Relatorio" ? { color: colorLink } : {}}
              to="/Relatorio"
            >
              Relatorio
            </Link>
          </li>

          {permission && (
            <li>
              <Link
                className={styleExt.perfil}
                to={`/Perfil`}
                alt="Link para o perfil do usuário"
                title="Perfil do usuário"
              >
                {linkAtivo !== "Perfil" && (
                  <span>
                    <CgProfile size={36} />
                  </span>
                )}
                {<p>{canalBD}</p>}
              </Link>
            </li>
          )}

          <li>
            <Logout setPermission={setPermission} />
          </li>
        </ul>
      </nav>
    </main>
  );
}
