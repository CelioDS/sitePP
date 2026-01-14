import { toast } from "react-toastify";
import Button from "../Item-Layout/Button";
import { useNavigate } from "react-router-dom";

export default function Logout({ setPermission }) {
  const navigate = useNavigate();

  const buttonStyle = {
    backgroundColor: "#e63946",
    color: "white",
    border: "none",
    padding: "10px 16px",
    borderRadius: "8px",
    cursor: "pointer",
    transition: "0.3s",
  };

  const hoverStyle = {
    backgroundColor: "#c1121f",
  };

  function handleLogout() {
    localStorage.removeItem("Token");
    localStorage.removeItem("login");
    localStorage.removeItem("admin");
    localStorage.removeItem("permission");
    setPermission(false); // ← Atualiza o estado no React

    navigate("/");
    toast.info("Você saiu da conta!");
  }

  // Lógica de hover (opcional, apenas para efeito visual)
  const handleMouseOver = (e) => {
    Object.assign(e.target.style, hoverStyle);
  };

  const handleMouseOut = (e) => {
    Object.assign(e.target.style, buttonStyle);
  };

  return (
    <Button
      text="Sair"
      onClick={handleLogout}
      style={buttonStyle}
      onMouseOver={handleMouseOver}
      onMouseOut={handleMouseOut}
    />
  );
}
