import ClaroWebp from "../IMG/PEP_white.svg";
import Style from "./ClaroLogo.module.css";

export default function ClaroLogo({ className, logo, size  }) {
  return (
    <img
      style={{
        width: size,
        height: size - 15,
      }}
      className={Style.main}
      src={logo || ClaroWebp}
      alt="Logo Claro"
    />
  );
}
