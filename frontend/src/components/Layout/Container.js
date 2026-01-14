import style from "../Layout/Container.module.css";

export default function Container({ children }) {
  return <div className={style.container}>{children}</div>;
}
Container.defaultProps = {
  //valores padroa
  className: style.container,
};
