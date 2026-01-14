import { Link } from "react-router-dom";
import style from "./LinkButton.module.css";

export default function LinkButton({ to, text, onClick, img, className }) {
  return (
    <Link to={to} title={text} className={className} onClick={onClick}>
      {text}
      {img}
    </Link>
  );
}
LinkButton.defaultProps = {
  //valores padroa
  className: style.btn,
};
