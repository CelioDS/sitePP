import Style from "./Home.module.css";
import RenameTitle from "../Tools/RenameTitle";
import Container from "../Layout/Container";
import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { format } from "date-fns";
import { fromZonedTime } from "date-fns-tz";

export default function Home() {
  const [data, setData] = useState([]);
  const Url = process.env.REACT_APP_API_URL || "http://localhost:8000";

  const brasilDate = format(
    fromZonedTime(new Date(), "America/Sao_Paulo"),
    "yyyy-MM"
  );

  const ANOMES = brasilDate.replace("-", "");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [depara] = await Promise.all([axios.get(`${Url}/lojapropria`)]);
        setData(depara.data);
      } catch (err) {
        console.error("Erro ao carregar dados:", err);
      } finally {
      }
    };
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Container className={Style.main}>
      <RenameTitle initialTitle={"P&P - Home"} />
      <div style={styles.container}>
        <h1>de paras de canais</h1>
      </div>
    </Container>
  );
}

const styles = {
  container: {
    background: "#fff",
    borderRadius: "12px",
    padding: "20px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
    width: "90%",
    maxWidth: "900px",
    margin: "40px auto",
    fontFamily: "Arial, sans-serif",
  },
  title: {
    textAlign: "center",
    color: "#E3262E",
    marginBottom: "15px",
  },
  subtitle: {
    textAlign: "center",
    marginTop: "25px",
    color: "#333",
  },
  chart: {
    marginTop: "15px",
    marginBottom: "25px",
    padding: "10px 0",
  },
  chartRow: {
    display: "flex",
    alignItems: "center",
    marginBottom: "8px",
  },
  chartLabel: {
    width: "50px",
    fontWeight: "bold",
    color: "#E3262E",
  },
  chartBarContainer: {
    display: "flex",
    alignItems: "center",
    width: "100%",
    background: "#f1f1f1",
    borderRadius: "6px",
    overflow: "hidden",
    height: "20px",
  },
  chartBar: {
    height: "100%",
    background: "#E3262E",
    borderRadius: "6px 0 0 6px",
    transition: "width 0.5s ease",
  },
  chartValue: {
    marginLeft: "8px",
    minWidth: "30px",
    textAlign: "right",
    fontSize: "13px",
  },
  smallTable: {
    width: "60%",
    margin: "0 auto",
    borderCollapse: "collapse",
    textAlign: "center",
    fontSize: "15px",
  },
  loading: {
    textAlign: "center",
    marginTop: "50px",
  },
  empty: {
    textAlign: "center",
    color: "#888",
    marginTop: "50px",
  },
};
