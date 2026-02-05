import Wallet from "../IMG/carteira.svg";
import Style from "./ClaroLogo.module.css";

export default function ClaroLogo({ className }) {
  return <img className={Style.main} src={Wallet} alt="logo claro" />;
}
