import axios from "axios";
import Container from "./Container";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import RenameTitle from "../Tools/RenameTitle";
import ValidarToken from "../Tools/ValidarToken";
import Style from "./SuporteComercial.module.css";
import LinkButton from "../Item-Layout/LinkButton";
import { useSearchParams } from "react-router-dom";
import { useState, useEffect, useMemo, useRef } from "react";
import { AiOutlineGlobal, AiFillPlayCircle } from "react-icons/ai";

export default function SuporteComercial({ pagina }) {
  const Url = process.env.REACT_APP_API_URL || "http://localhost:8000";

  const [userData, setUserData] = useState();
  const hub = userData?.hub;
  const login = userData?.login;
  const inputAnexoRef = useRef(null);
  const hub_admin = userData?.hub_admin;
  const [loading, setLoading] = useState(false);
  const [dataBase, setDataBase] = useState([]);
  const [abaTabela, setAbaTabela] = useState("PENDENTES");

  // ✅ STATES SEPARADOS
  const [tipoSolicitacao, setTipoSolicitacao] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [canal, setCanal] = useState("");
  const [anexo, setAnexo] = useState(null);
  const [sistema, setSistema] = useState("");
  const [descricaoSolicitacao, setDescricaoSolicitacao] = useState("");
  const [HPCliente, setHPCliente] = useState("");
  const [cpfCliente, setCpfCliente] = useState("");
  const [observacao, setObservacao] = useState("");
  const [razaoSocial, setRazaoSocial] = useState("");
  const [nomeCliente, setnomeCliente] = useState("");
  const [loginUsuario, setloginUsuario] = useState("");
  const [numeroPedido, setNumeroPedido] = useState("");
  const [numeroContrato, setNumeroContrato] = useState("");
  const [numeroProposta, setNumeroProposta] = useState("");
  const [enderecoCliente, setEnderecoCliente] = useState("");

  const [searchParams] = useSearchParams();
  const aba = searchParams.get("aba");
  const [handlePagina, setHandlePagina] = useState(() => {
    if (aba === "tabelas") return false;
    return pagina ?? true;
  });

  useEffect(() => {
    async function fetchTable() {
      try {
        const res = await axios.get(`${Url}/neon/suportecomercial`);

        const ordenado = res.data.sort(
          (a, b) => new Date(a.data_criacao) - new Date(b.data_criacao),
        );
        setDataBase(ordenado);
      } catch (err) {
        console.error("Erro ao buscar tabela", err);
      }
    }

    if (!handlePagina) {
      fetchTable();
    }
  }, [Url, handlePagina]);

  //Dados contadores
  const contadores = useMemo(() => {
    let pendente = 0;
    let tratamento = 0;
    let finalizado = 0;

    if (hub) {
      if (!Array.isArray(dataBase))
        return { pendente: 0, tratamento: 0, finalizado: 0 };

      pendente = dataBase.filter(
        (item) =>
          (!item.responsavel || item.status_solicitacao === "PENDENTeE") &&
          item.criado_por === login,
      ).length;
      tratamento = dataBase.filter(
        (item) =>
          item.status_solicitacao === "TRATAMENTO" && item.criado_por === login,
      ).length;
      finalizado = dataBase.filter(
        (item) =>
          item.status_solicitacao === "FINALIZADO" && item.criado_por === login,
      ).length;
    }
    if (hub_admin) {
      if (!Array.isArray(dataBase))
        return { pendente: 0, tratamento: 0, finalizado: 0 };

      pendente = dataBase.filter(
        (item) => !item.responsavel || item.status_solicitacao === "PENDENTeE",
      ).length;
      tratamento = dataBase.filter(
        (item) =>
          item.status_solicitacao === "TRATAMENTO" &&
          item.responsavel === login,
      ).length;
      finalizado = dataBase.filter(
        (item) =>
          item.status_solicitacao === "FINALIZADO" &&
          item.responsavel === login,
      ).length;
    }
    return { pendente, tratamento, finalizado };
  }, [dataBase, hub, hub_admin, login]);

  // dados filtrados para tabela
  const dadosFiltrados = useMemo(() => {
    if (!Array.isArray(dataBase)) return [];

    return dataBase.filter((item) => {
      const status = String(item.status_solicitacao || "").toUpperCase();
      const responsavel = item.responsavel;
      const criado_por = item.criado_por;

      if (hub_admin) {
        if (abaTabela === "PENDENTES") {
          return !responsavel || status === "PENDENTE";
        }
        if (abaTabela === "TRATAMENTOS") {
          return status === "TRATAMENTO" && responsavel === login;
        }
        if (abaTabela === "FINALIZADOS") {
          return status === "FINALIZADO" && responsavel === login;
        }
      }
      if (hub) {
        if (abaTabela === "PENDENTES") {
          return (
            (!responsavel || status === "PENDENTE") && criado_por === login
          );
        }
        if (abaTabela === "TRATAMENTOS") {
          return status === "TRATAMENTO" && criado_por === login;
        }
        if (abaTabela === "FINALIZADOS") {
          return status === "FINALIZADO" && criado_por === login;
        }
      }
      return true;
    });
  }, [dataBase, hub_admin, hub, abaTabela, login]);

  // ✅ USER
  useEffect(() => {
    async function fetchUser() {
      try {
        const data = await ValidarToken();
        setUserData(data);
      } catch (err) {
        console.error(err);
      }
    }
    fetchUser();
  }, []);

  useEffect(() => {
    if (userData?.hub_admin) {
      setHandlePagina(false); // vai direto para tabela
    }
  }, [userData]);

  //assumir demanda
  const handleAssumir = async (id) => {
    try {
      const item = dataBase.find((i) => i.id === id);
      if (item?.responsavel) {
        toast.warning(
          `Demanda já assumida por outro usuario ${item?.responsavel}`,
        );
        return;
      }

      await axios.patch(`${Url}/neon/suportecomercial/${id}`, {
        responsavel: userData?.login,
        status_solicitacao: "TRATAMENTO",
      });

      setDataBase((prev) =>
        prev.map((info) =>
          info.id === id
            ? {
                ...info,
                responsavel: userData?.login,
                status_solicitacao: "TRATAMENTO",
              }
            : info,
        ),
      );

      toast.success("Demanda assumida ✅");
    } catch (err) {
      console.error(err.message, "handleassumir");
      toast.error("Erro ao assumir ❌");
    }
  };

  //verficar foto
  const tiposImagemPermitidos = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/heic",
    "image/heif",
  ];

  const handleAnexoChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) {
      setAnexo(null);
      return;
    }

    if (!tiposImagemPermitidos.includes(file.type)) {
      toast.warning(
        "Anexo permitido somente em formato de foto: JPG, PNG, WEBP ou HEIC ⚠️",
      );
      e.target.value = "";
      setAnexo(null);
      return;
    }

    const tamanhoMaximoMB = 5;
    const tamanhoMaximoBytes = tamanhoMaximoMB * 1024 * 1024;

    if (file.size > tamanhoMaximoBytes) {
      toast.warning(`A foto deve ter no máximo ${tamanhoMaximoMB}MB ⚠️`);
      e.target.value = "";
      setAnexo(null);
      return;
    }

    setAnexo(file);
  };

  const sla = (data) => {
    try {
      if (!data) return null;

      const agora = new Date();
      const dataInput = new Date(data);

      // valida data
      if (isNaN(dataInput.getTime())) {
        throw new Error("Data inválida");
      }

      // diferença em ms
      const diffMs = agora - dataInput;

      // converter para horas
      const diffHoras = diffMs / (1000 * 60 * 60);
      console.log(agora, dataInput, diffHoras);
      // regra SLA
      if (diffHoras <= 24) {
        return {
          status: "verde",
          horas: diffHoras.toFixed(2),
        };
      } else {
        return {
          status: "vermelho",
          horas: diffHoras.toFixed(2),
        };
      }
    } catch (error) {
      console.error("Erro no SLA:", error.message);
      return null;
    }
  };

  // ✅ SALVAR
  const handleSalvar = async () => {
    if (!loginUsuario || !tipoSolicitacao) {
      toast.warning("Preencha LOGIN e TIPO ⚠️");
      return;
    }

    if (!userData?.login) {
      toast.error("Usuário não identificado ❌");
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();

      formData.append("tipoSolicitacao", tipoSolicitacao);
      formData.append("canal", canal);
      formData.append("sistema", sistema);
      formData.append("numeroProposta", numeroProposta);
      formData.append("numeroContrato", numeroContrato);
      formData.append("numeroPedido", numeroPedido);
      formData.append("cnpj", cnpj);
      formData.append("razaoSocial", razaoSocial);
      formData.append("nome", nome);
      formData.append("email", email);
      formData.append("loginUsuario", loginUsuario);
      formData.append("status_solicitacao", "PENDENTE");
      formData.append("observacao", observacao);
      formData.append("descricaoSolicitacao", descricaoSolicitacao);
      formData.append("HPCliente", HPCliente);
      formData.append("enderecoCliente", enderecoCliente);
      formData.append("cpfCliente", cpfCliente);
      formData.append("nomeCliente", nomeCliente);
      formData.append("criado_por", userData.login);

      if (anexo) {
        formData.append("anexo", anexo);
      }

      await axios.post(`${Url}/neon/suportecomercial/add`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success("Salvo com sucesso ✅");

      setTipoSolicitacao("");
      setCanal("");
      setSistema("");
      setNumeroProposta("");
      setNumeroContrato("");
      setNumeroPedido("");
      setCnpj("");
      setRazaoSocial("");
      setNome("");
      setEmail("");
      setAnexo(null);
      setloginUsuario("");
      setObservacao("");
      setDescricaoSolicitacao("");
      setHPCliente("");
      setEnderecoCliente("");
      setCpfCliente("");
      setnomeCliente("");

      if (inputAnexoRef.current) {
        inputAnexoRef.current.value = "";
      }
    } catch (err) {
      console.error("Erro ao salvar suporte comercial:", err);

      const mensagem =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Erro ao salvar ❌";

      toast.error(mensagem);
    } finally {
      setLoading(false);
    }
  };
  // objeto de controle de inputs regra
  const camposPorSistema = {
    SOLAR: ["numeroProposta", "numeroPedido"],
    NETSALES: ["numeroProposta", "numeroPedido"],
    NETSMS: ["numeroContrato"],
    CONEXAO: ["descricao"],
    GED: ["descricao"],
  };

  const mostrarCampo = (campo) => {
    return camposPorSistema[sistema]?.includes(campo);
  };

  return (
    <Container>
      <RenameTitle initialTitle={"P&P - HUB"} />

      {!hub_admin && (
        <nav className={Style.nav}>
          {handlePagina ? (
            <button onClick={() => setHandlePagina(false)}>
              Ver minhas solicitações
            </button>
          ) : (
            <button onClick={() => setHandlePagina(true)}>
              Nova solicitação
            </button>
          )}
        </nav>
      )}
      {handlePagina ? (
        <main className={Style.main}>
          {/* HEADER */}
          <header className={Style.header}>
            <div className={Style.icon}>
              <AiOutlineGlobal color="red" size={35} />
            </div>
            <div>
              <h2>SUPORTE COMERCIAL</h2>
              <span>GESTÃO DE RESOLUÇÃO</span>
            </div>
          </header>

          {/* FORM */}
          <form
            className={Style.form}
            onSubmit={(e) => {
              e.preventDefault();
              handleSalvar();
            }}
          >
            <section className={Style.grid}>
              {/* SOLICITAÇÃO */}
              <section className={Style.dados}>
                <h3>
                  <AiFillPlayCircle color="red" size={18} />
                  <span>Dados da solicitação</span>
                </h3>

                <aside>
                  <div className={Style.field}>
                    <label>TIPO DE SOLICITAÇÃO</label>
                    <select
                      value={tipoSolicitacao}
                      onChange={(e) => setTipoSolicitacao(e.target.value)}
                    >
                      <option value="">Selecione</option>
                      <option>ERRO INESPERADO</option>
                      <option>ERRO NA FERRAMENTA</option>
                      <option>ERRO AO INSERIR PRODUTOS</option>
                      <option>ERRO AO AGENDAR PROPOSTA</option>
                      <option>ERRO AO AGENDAR CONTRATO</option>
                      <option>ERRO NA MUDANÇA DE PACOTE</option>
                      <option>ERRO AO FINALIZAR PROPOSTA</option>
                      <option>ERRO NA EXECUÇÃO DO GATILHO</option>
                      <option>ERRO AO HABILITAR O NUMERO TELEFONICO</option>
                    </select>
                  </div>

                  <div className={Style.field}>
                    <label>CANAL</label>
                    <select
                      value={canal}
                      onChange={(e) => setCanal(e.target.value)}
                    >
                      <option value="">Selecione</option>
                      <option value="PME">PME</option>
                      <option value="VAREJO">VAREJO</option>
                      <option value="PREMIUM">PREMIUM</option>
                      <option value="DISTRIBUIÇÃO">DISTRIBUIÇÃO</option>
                      <option value="LOJA PROPRIA">LOJA PROPRIA</option>
                      <option value="AGENTE AUTORIZADO">
                        AGENTE AUTORIZADO
                      </option>
                      <option value="PORTA PORTA INDIRETO">
                        PORTA PORTA INDIRETO
                      </option>
                    </select>
                  </div>

                  <div className={Style.field}>
                    <label>SISTEMA</label>
                    <select
                      value={sistema}
                      onChange={(e) => setSistema(e.target.value)}
                    >
                      <option value="">Selecione</option>
                      <option value="SOLAR">SOLAR</option>
                      <option value="NETSMS">NETSMS</option>
                      <option value="CONEXAO">CONEXAO</option>
                      <option value="NETSALES">NETSALES</option>
                      <option value="GED">GED(Biometria)</option>
                      <option value="PARCEIRO ONLINE">PARCEIRO ONLINE</option>
                    </select>
                  </div>

                  {mostrarCampo("numeroProposta") && (
                    <div className={Style.field}>
                      <label>NÚMERO PROPOSTA</label>
                      <input
                        value={numeroProposta}
                        onChange={(e) => setNumeroProposta(e.target.value)}
                      />
                    </div>
                  )}

                  {mostrarCampo("numeroPedido") && (
                    <div className={Style.field}>
                      <label>NÚMERO PEDIDO</label>
                      <input
                        value={numeroPedido}
                        onChange={(e) => setNumeroPedido(e.target.value)}
                      />
                    </div>
                  )}

                  {mostrarCampo("numeroContrato") && (
                    <div className={Style.field}>
                      <label>NÚMERO CONTRATO</label>
                      <input
                        value={numeroContrato}
                        onChange={(e) => setNumeroContrato(e.target.value)}
                      />
                    </div>
                  )}

                  {mostrarCampo("descricao") && (
                    <div className={Style.field}>
                      <label>Descrição</label>
                      <input
                        value={descricaoSolicitacao}
                        onChange={(e) =>
                          setDescricaoSolicitacao(e.target.value)
                        }
                      />
                    </div>
                  )}
                </aside>
              </section>

              {/* PARCEIRO */}
              <section className={Style.dados}>
                <h3>
                  <AiFillPlayCircle color="red" size={18} />
                  <span>Dados do parceiro</span>
                </h3>

                <aside>
                  <div className={Style.field}>
                    <label>CNPJ</label>
                    <input
                      value={cnpj}
                      onChange={(e) => setCnpj(e.target.value)}
                    />
                  </div>

                  <div className={Style.field}>
                    <label>RAZÃO SOCIAL</label>
                    <input
                      value={razaoSocial}
                      onChange={(e) => setRazaoSocial(e.target.value)}
                    />
                  </div>
                </aside>
              </section>

              {/* USUÁRIO */}
              <section className={Style.dados}>
                <h3>
                  <AiFillPlayCircle color="red" size={18} />
                  <span>Dados do usuário</span>
                </h3>

                <aside>
                  <div className={Style.field}>
                    <label>NOME</label>
                    <input
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                    />
                  </div>

                  <div className={Style.field}>
                    <label>E-MAIL</label>
                    <input
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>

                  <div className={Style.field}>
                    <label>LOGIN</label>
                    <input
                      value={loginUsuario}
                      onChange={(e) => setloginUsuario(e.target.value)}
                    />
                  </div>

                  <div className={Style.field}>
                    <label>OBSERVAÇÃO</label>
                    <input
                      value={observacao}
                      onChange={(e) => setObservacao(e.target.value)}
                    />
                  </div>
                </aside>
              </section>

              {/*   CLIENTE */}
              <section className={Style.dados}>
                <h3>
                  <AiFillPlayCircle color="red" size={18} />
                  <span>Dados do cliente </span>
                </h3>

                <aside>
                  <div className={Style.field}>
                    <label>NOME DO CLIENTE</label>
                    <input
                      value={nomeCliente}
                      onChange={(e) => setnomeCliente(e.target.value)}
                    />
                  </div>

                  <div className={Style.field}>
                    <label>CPF</label>
                    <input
                      value={cpfCliente}
                      onChange={(e) => setCpfCliente(e.target.value)}
                    />
                  </div>
                  <div className={Style.field}>
                    <label>ENDEREÇO COMPLETO</label>
                    <input
                      value={enderecoCliente}
                      onChange={(e) => setEnderecoCliente(e.target.value)}
                    />
                  </div>
                  <div className={Style.field}>
                    <label>NUMERO HP</label>
                    <input
                      value={HPCliente}
                      onChange={(e) => setHPCliente(e.target.value)}
                    />
                  </div>
                </aside>
              </section>
            </section>

            {/* ANEXO */}
            <div className={Style.field}>
              <label>Anexo</label>
              <input
                ref={inputAnexoRef}
                type="file"
                name="anexo"
                accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
                onChange={handleAnexoChange}
              />
            </div>

            {/* FOOTER */}
            <footer className={Style.footer}>
              <button
                type="button"
                className={Style.cancel}
                onClick={() => {
                  setTipoSolicitacao("");
                  setCanal("");
                  setSistema("");
                  setNumeroProposta("");
                  setNumeroContrato("");
                  setNumeroPedido("");
                  setCnpj("");
                  setRazaoSocial("");
                  setNome("");
                  setEmail("");
                  setloginUsuario("");
                  setObservacao("");
                }}
              >
                Cancelar
              </button>

              <button type="submit" className={Style.save}>
                {loading ? "Salvando..." : "Salvar"}
              </button>
            </footer>
          </form>
        </main>
      ) : (
        <main className={Style.mainTabela}>
          <header className={Style.display}>
            <aside>
              <p>PENDENTE</p>
              <span>{contadores.pendente}</span>
            </aside>
            <aside>
              <p>TRATAMENTO</p>
              <span>{contadores.tratamento}</span>
            </aside>
            <aside>
              <p>FINALIZADO</p>
              <span>{contadores.finalizado}</span>
            </aside>
          </header>

          <div className={Style.btnsTabela}>
            <button
              type="button"
              className={abaTabela === "PENDENTES" ? Style.abaAtiva : ""}
              onClick={() => setAbaTabela("PENDENTES")}
            >
              pendentes
            </button>
            <button
              type="button"
              className={abaTabela === "TRATAMENTOS" ? Style.abaAtiva : ""}
              onClick={() => setAbaTabela("TRATAMENTOS")}
            >
              tratamentos
            </button>
            <button
              type="button"
              className={abaTabela === "FINALIZADOS" ? Style.abaAtiva : ""}
              onClick={() => setAbaTabela("FINALIZADOS")}
            >
              finalizados
            </button>
          </div>

          <div style={{ padding: "20px", width: "100%" }}>
            <h1>{abaTabela}</h1>
            <table border="1" width="100%" style={{ marginTop: "15px" }}>
              <thead>
                <tr>
                  <th>Tipo</th>
                  <th>Canal</th>
                  <th>Sistema</th>
                  <th>Proposta</th>
                  <th>CNPJ</th>
                  <th>Nome</th>
                  <th>LOGIN</th>
                  {abaTabela !== "FINALIZADOS" && <th>SLA</th>}
                  {hub && abaTabela !== "PENDENTES" && <th>RESPONSAVEL</th>}
                  {hub_admin && <th>CRIADOR POR</th>}

                  {hub_admin && abaTabela === "PENDENTES" && (
                    <>
                      <th>Assumir</th>
                    </>
                  )}
                </tr>
              </thead>

              <tbody>
                {dadosFiltrados.length === 0 ? (
                  <tr>
                    <td cols={hub_admin ? 13 : 12}>
                      Nenhuma solicitacao encontrada
                    </td>
                  </tr>
                ) : (
                  dadosFiltrados.map((item) => (
                    <tr key={item.id}>
                      {hub && (
                        <td>
                          <LinkButton
                            to={`/SuporteComercialVisualizar/${item.id}`}
                            text={`${item.tipo_solicitacao}`}
                          />
                        </td>
                      )}
                      {hub_admin && abaTabela === "PENDENTES" && (
                        <td>{item.tipo_solicitacao}</td>
                      )}
                      {hub_admin && abaTabela === "TRATAMENTOS" && (
                        <td>
                          <LinkButton
                            to={`/SuporteComercialVisualizar/${item.id}`}
                            text={`${item.tipo_solicitacao}`}
                          />
                        </td>
                      )}
                      {item?.responsavel === login &&
                        abaTabela === "FINALIZADOS" && (
                          <tr key={item.id}>
                            <td>
                              <LinkButton
                                to={`/SuporteComercialVisualizar/${item.id}`}
                                text={`${item.tipo_solicitacao}`}
                              />
                            </td>
                          </tr>
                        )}

                      <td>{item.canal}</td>
                      <td>{item.sistema}</td>
                      <td>{item.numero_proposta}</td>
                      <td>{item.cnpj}</td>
                      <td>{item.nome}</td>
                      <td>{item.login_usuario}</td>

                      {abaTabela !== "FINALIZADOS" && (
                        <td
                          style={{
                            color:
                              sla(item.data_atualizacao)?.status === "verde"
                                ? "#23a31fdd"
                                : "#bb1d1ddd",
                          }}
                        >
                          {(() => {
                            const resultado = sla(item.data_atualizacao);
                            if (!resultado) return "-";

                            return resultado.status === "verde"
                              ? `Dentro SLA (${resultado.horas}h)`
                              : `Fora SLA (${resultado.horas}h)`;
                          })()}
                        </td>
                      )}

                      {hub_admin && <td>{item.criado_por}</td>}
                      {hub && abaTabela !== "PENDENTES" && (
                        <td>{item.responsavel}</td>
                      )}

                      {hub_admin && abaTabela === "PENDENTES" && (
                        <>
                          <td>
                            <button
                              onClick={() => {
                                handleAssumir(item.id);
                              }}
                            >
                              Assumir
                            </button>
                          </td>
                        </>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </main>
      )}
    </Container>
  );
}
