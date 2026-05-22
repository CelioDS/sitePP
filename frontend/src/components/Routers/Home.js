// Home.jsx
import Style from "./Home.module.css";
import RenameTitle from "../Tools/RenameTitle";
import Container from "../Layout/Container";
import MIS from "./MIS";
import Pdu from "./Pdu";

export default function Home() {
  return (
    <Container className={Style.main}>
      <RenameTitle initialTitle={"P&P - Home"} />

      <MIS />
      <Pdu></Pdu>
    </Container>
  );
}
