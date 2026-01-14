import Style from "./Button.module.css";

export default function Button({ text, onClick, type, className }) {
  return (
    <button
      className={className ? className : Style.btn}
      onClick={onClick}
      type={type}
    >
      {text}
    </button>
  );
}
