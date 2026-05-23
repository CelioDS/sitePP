import { useState, useEffect } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import Style from "./HUB.module.css";
import RenameTitle from "../Tools/RenameTitle";
import Container from "../Layout/Container";
import { AiOutlineGlobal, AiFillPlayCircle } from "react-icons/ai";
import ValidarToken from "../Tools/ValidarToken";

export default function Home() {
  const [handleOption, setHandleOption] = useState("");
  const [statusIW, setStatusIW] = useState("");
  const [statusSolicitacao, setStatusSolicitacao] = useState("");
  const [observacao, setObservacao] = useState("");
  const [handleTeste, setHandleTeste] = useState(false);

  const [userData, setUserData] = useState();
  const [dataBase, setDataBase] = useState([]); // ✅ corrigido
  const [loading, setLoading] = useState(false);

  const Url = process.env.REACT_APP_API_URL || "http://localhost:8000";

  const STATUS_OPTIONS = ["AGUARDANDO", "PENDENTE"];

  const STATUS_OPTIONS_1 = {
    AGUARDANDO: [
      "AGUARDANDO",
      "AGUARDANDO COM SUCESSO",
      "AGUARDANDO COM ERROS",
      "AGUARDANDO PACIALMENTE",
      "AGUARDANDO EM ANALISES",
    ],
    PENDENTE: [
      "EXECUTANDO",
      "CONCLUIDO COM SUCESSO",
      "CONCLUÍDO COM ERROS",
      "CONCLUÍDO PACIALMENTE",
      "CADASTRO EM ANALISES",
    ],
  };

  // ✅ BUSCA USER
  useEffect(() => {
    let isMounted = true;

    async function fetchUserData() {
      try {
        const data = await ValidarToken();
        if (isMounted && data) setUserData(data);
      } catch (error) {
        console.error("Erro ao validar token:", error);
      }
    }

    fetchUserData();

    return () => {
      isMounted = false;
    };
  }, []);

  // ✅ BUSCAR DADOS
  const getDataBase = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${Url}/suportecomercial`);
      setDataBase(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao buscar dados ❌");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getDataBase();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ SALVAR
  const handleSalvar = async () => {
    if (!statusIW || !statusSolicitacao) {
      toast.warning("Preencha STATUS IW e STATUS SOLICITAÇÃO ⚠️");
      return;
    }

    if (!userData?.login) {
      toast.error("Usuário não identificado ❌");
      return;
    }

    try {
      setLoading(true);

      await axios.post(`${Url}/suportecomercial/add`, {
        status_iw: statusIW,
        status_solicitacao: statusSolicitacao,
        observacao,
        responsavel: userData.login,
      });

      toast.success("Salvo com sucesso ✅");

      // reset
      setStatusIW("");
      setStatusSolicitacao("");
      setObservacao("");
      setHandleOption("");

      await getDataBase(); // ✅ refresh
    } catch (err) {
      console.error(err);
      toast.error("Erro ao salvar ❌");
    } finally {
      setLoading(false);
    }
  };

  // ✅ ASSUMIR
  const handleAssumir = async (id) => {
    try {
      await axios.patch(`${Url}/suportecomercial/${id}`, {
        responsavel: userData?.login,
      });

      toast.success("Demanda assumida ✅");

      await getDataBase(); // ✅ refresh
    } catch (err) {
      console.error(err);
      toast.error("Erro ao assumir ❌");
    }
  };

  return (
    <Container>
      <RenameTitle initialTitle={"P&P - HUB"} />
      <ToastContainer />

      <button onClick={() => setHandleTeste((prev) => !prev)}>
        handle
      </button>

      {userData?.hub || handleTeste ? (
        <main className={Style.main}>
          <header className={Style.header}>
            <div className={Style.icon}>
              <AiOutlineGlobal color="red" size={35} />
            </div>
            <div>
              <h2>SUPORTE COMERCIAL</h2>
              <span>GESTÃO DE ACESSO</span>
            </div>
          </header>

          <form
            className={Style.section}
            onSubmit={(e) => {
              e.preventDefault();
              handleSalvar();
            }}
          >
            <h3>
              <AiFillPlayCircle color="red" size={18} />
              <strong>STATUS </strong>
            </h3>

            <div className={Style.grid}>
              <div className={Style.field}>
                <label>STATUS IW</label>
                <select
                  value={statusIW}
                  onChange={(e) => {
                    setStatusIW(e.target.value);
                    setHandleOption(e.target.value);
                    setStatusSolicitacao("");
                  }}
                >
                  <option value="">Selecione</option>
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              <div className={Style.field}>
                <label>STATUS SOLICITAÇÃO</label>
                <select
                  value={statusSolicitacao}
                  onChange={(e) => setStatusSolicitacao(e.target.value)}
                  disabled={!handleOption}
                >
                  <option value="">Selecione</option>
                  {(STATUS_OPTIONS_1[handleOption] || []).map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              <div className={Style.field}>
                <label>OBSERVAÇÃO ADICIONAL</label>
                <input
                  value={observacao}
                  onChange={(e) => setObservacao(e.target.value)}
                  placeholder="Digite uma observação..."
                />
              </div>
            </div>

            {/* ✅ sem required */}
            <Input text={"Anexos"} type={"file"} />

            <footer className={Style.footer}>
              <button
                type="button"
                className={Style.cancel}
                onClick={() => {
                  setStatusIW("");
                  setStatusSolicitacao("");
                  setObservacao("");
                  setHandleOption("");
                }}
              >
                Cancelar
              </button>

              <button type="submit" className={Style.save} disabled={loading}>
                {loading ? "Salvando..." : "Salvar"}
              </button>
            </footer>
          </form>
        </main>
      ) : (
        <section className={Style.tableContainer}>
          <header className={Style.header}>
            <h2>FILA DE DEMANDAS</h2>
            <span>Click para assumir</span>
          </header>

          {loading ? (
            <p>Carregando...</p>
          ) : (
            <table className={Style.table}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Status IW</th>
                  <th>Status</th>
                  <th>Observação</th>
                  <th>Responsável</th>
                  <th>Ação</th>
                </tr>
              </thead>

              <tbody>
                {dataBase.map((item) => {
                  const isMinha =
                    item.responsavel === userData?.login;

                  return (
                    <tr
                      key={item.id}
                      style={{
                        background: isMinha ? "#e3f2fd" : "white",
                      }}
                    >
                      <td>{item.id}</td>
                      <td>{item.status_iw}</td>
                      <td>{item.status_solicitacao}</td>
                      <td>{item.observacao}</td>
                      <td>{item.responsavel || "-"}</td>

                      <td>
                        {!item.responsavel && (
                          <button
                            className={Style.assumir}
                            onClick={() => handleAssumir(item.id)}
                          >
                            Assumir
                          </button>
                        )}

                        {isMinha && (
                          <span style={{ color: "#1976d2" }}>
                            MINHA
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </section>
      )}
    </Container>
  );
}

// ✅ INPUT COMPONENT
function Input({ text, placeholder = "", type }) {
  return (
    <div className={Style.field}>
      <label>{text}</label>
      <input type={type} placeholder={placeholder} />
    </div>
  );
}