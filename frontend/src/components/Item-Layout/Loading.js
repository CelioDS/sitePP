import { useEffect, useState } from "react";
import LoadingSvg from "../IMG/loading.svg";
import style from "./Loading.module.css";

export default function Loading({ text }) {
  const [TextLoading, SetTextLoading] = useState(
    text ? text : "Carregando dados..."
  );

  useEffect(() => {
    if (!text) {
      const timer = setTimeout(() => {
        SetTextLoading("ERRO : Falha ao carregar os dados...");
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [text]);

  return (
    <main className={style.main}>
      <img src={LoadingSvg} alt="Loading"></img>
      <p>
        <small>{TextLoading}</small>
      </p>
    </main>
  );
}
