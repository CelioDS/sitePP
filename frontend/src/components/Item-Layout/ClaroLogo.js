import ClaroWebp from "../IMG/PEP_white.svg";
import Style from "./ClaroLogo.module.css";

export default function ClaroLogo({ className, logo }) {
  return <img className={Style.main} src={logo || ClaroWebp} alt="logo claro" />;
}
