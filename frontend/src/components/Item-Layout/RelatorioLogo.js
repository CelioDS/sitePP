import relatorio from "../IMG/relatorio.svg";
import Style from "./ClaroLogo.module.css";

export default function RelatorioLogo({ className }) {
  return <img className={Style.main} src={relatorio} alt="logo claro" />;
}
