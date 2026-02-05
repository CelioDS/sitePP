import ClaroWebp from "../IMG/PEP_white.svg";
import Style from "./ClaroLogo.module.css";

export default function ClaroLogo({ className }) {
  return <img className={Style.main} src={ClaroWebp} alt="logo claro" />;
}
