import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useSearchParams } from "react-router-dom";
import Style from "./SuporteComercial.module.css";
import RenameTitle from "../Tools/RenameTitle";
import Container from "./Container";
import { AiOutlineGlobal, AiFillPlayCircle } from "react-icons/ai";
import ValidarToken from "../Tools/ValidarToken";
import LinkButton from "../Item-Layout/LinkButton";

export default function SuporteComercial({ pagina }) {
  const Url = process.env.REACT_APP_API_URL || "http://localhost:8000";

  const [userData, setUserData] = useState();
  const login = userData?.login;
  const [loading, setLoading] = useState(false);
  const [dataBase, setDataBase] = useState([]);

  // ✅ STATES SEPARADOS
  const [tipoSolicitacao, setTipoSolicitacao] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [canal, setCanal] = useState("");
  const [anexo, setAnexo] = useState(null);
  const [sistema, setSistema] = useState("");
  const [HPCliente, setHPCliente] = useState("");
  const [descricao, setDescricao] = useState("");
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
        const res = await axios.get(`${Url}/suportecomercial`);
        setDataBase(res.data);
      } catch (err) {
        console.error("Erro ao buscar tabela", err);
      }
    }

    if (!handlePagina) {
      fetchTable();
    }
  }, [Url, handlePagina]);

  //verificar se e para voltar na tabela

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

  const handleAssumir = async (id) => {
    try {
      const item = dataBase.find((i) => i.id === id);
      if (item?.assumiu) {
        toast.warning(`Demanda já assumida por outro usuario ${item?.assumiu}`);
        return;
      }

      await axios.patch(`${Url}/suportecomercial/${id}`, {
        assumiu: userData?.login,
      });

      setDataBase((prev) =>
        prev.map((info) =>
          info.id === id
            ? {
                ...info,
                assumiu: userData?.login,
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

      await axios.post(`${Url}/suportecomercial/add`, {
        tipoSolicitacao,
        canal,
        sistema,
        numeroProposta,
        numeroContrato,
        numeroPedido,
        cnpj,
        razaoSocial,
        nome,
        email,
        loginUsuario,
        observacao,
        HPCliente,
        enderecoCliente,
        cpfCliente,
        nomeCliente,
        anexo,
        responsavel: userData.login,
      });

      toast.success("Salvo com sucesso ✅");

      // reset
      setTipoSolicitacao("");
      setCanal("");
      setSistema("");
      setNumeroProposta("");
      setNumeroContrato("");
      setNumeroPedido("");
      setCnpj("");
      setRazaoSocial("");
      setNome("");
      setAnexo("");
      setloginUsuario("");
      setObservacao("");
    } catch (err) {
      toast.error("Erro ao salvar ❌");
      console.error(err);
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
      {handlePagina ? (
        <main className={Style.main}>
          {/* HEADER */}
          <header className={Style.header}>
            <div className={Style.icon}>
              <AiOutlineGlobal color="red" size={35} />
            </div>
            <div>
              <h2>SUPORTE COMERCIAL</h2>
              <span>GESTÃO DE ACESSO</span>
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
                        value={descricao}
                        onChange={(e) => setDescricao(e.target.value)}
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
                    <label>ENDEREÇO</label>
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
                type="file"
                name="anexo"
                onChange={(e) => setAnexo(e.target.files[0])}
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
          <div style={{ padding: "20px", width: "100%" }}>
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
                  <th>Responsável</th>
                  <th>Assumir</th>
                </tr>
              </thead>

              <tbody>
                {dataBase.map(
                  (item) =>
                    !item?.assumiu && (
                      <tr key={item.id}>
                        <td>{item.tipo_solicitacao}</td>
                        <td>{item.canal}</td>
                        <td>{item.sistema}</td>
                        <td>{item.numero_proposta}</td>
                        <td>{item.cnpj}</td>
                        <td>{item.nome}</td>
                        <td>{item.status_iw}</td>
                        <td>{item.assumiu}</td>
                        <td>
                          <button
                            onClick={() => {
                              handleAssumir(item.id);
                            }}
                          >
                            Assumir
                          </button>
                        </td>
                      </tr>
                    ),
                )}
              </tbody>
            </table>

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
                  <th>Responsável</th>
                </tr>
              </thead>

              <tbody>
                {dataBase.map(
                  (item) =>
                    item?.assumiu === login && (
                      <tr key={item.id}>
                        <td>
                          <LinkButton
                            to={`/SuporteComercialVisualizar/${item.id}`}
                            text={`${item.tipo_solicitacao}`}
                          />
                        </td>
                        <td>{item.canal}</td>
                        <td>{item.sistema}</td>
                        <td>{item.numero_proposta}</td>
                        <td>{item.cnpj}</td>
                        <td>{item.nome}</td>
                        <td>{item.status_iw}</td>
                        <td>{item.responsavel}</td>
                      </tr>
                    ),
                )}
              </tbody>
            </table>
          </div>
        </main>
      )}
    </Container>
  );
}
