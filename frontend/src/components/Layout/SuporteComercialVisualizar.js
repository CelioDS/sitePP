import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import "react-toastify/dist/ReactToastify.css";
import { toast } from "react-toastify";
import ValidarToken from "../Tools/ValidarToken";
import LinkButton from "../Item-Layout/LinkButton";
import RenameTitle from "../Tools/RenameTitle";
import Container from "./Container";

import styles from "./SuporteComercialVisualizar.module.css";

export default function SuporteComercialVisualizar() {
  const Url = process.env.REACT_APP_API_URL || "http://localhost:8000";
  const { id } = useParams();

  const [dataBase, setDataBase] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [numeroChamado, setNumeroChamado] = useState("");
  const [descricaoResponsavel, setDescricaoResponsavel] = useState("");
  const [userData, setUserData] = useState(null);
  const [loadingSubmit, setLoadingSubmit] = useState(false);

  const hub_admin = userData?.hub_admin;
  const hub = userData?.hub;
  const dados = dataBase?.[0];
  const inputAnexoRef = useRef(null);
  const [anexo, setAnexo] = useState(null);

  const camposPorSistema = {
    FINALIZADO: ["numeroChamado", "descricaoResponsavel", "handleAnexoChange"],
    TRATAMENTO: ["numeroChamado", "descricaoResponsavel", "handleAnexoChange"],
    IMPROCEDENTE: [
      "numeroChamado",
      "descricaoResponsavel",
      "handleAnexoChange",
    ],
  };

  const mostrarCampo = (campo) => {
    return camposPorSistema[status]?.includes(campo);
  };

  const fetchTable = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${Url}/suportecomercial/${id}`);
      setDataBase(res.data || []);
    } catch (err) {
      console.error("Erro ao buscar tabela:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    async function fetchUser() {
      try {
        const data = await ValidarToken();
        setUserData(data);
      } catch (err) {
        console.error("Erro ao validar token:", err);
      }
    }

    fetchUser();
  }, []);

  //inserir arquivo
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

  //assumir demanda
  const handleSubmit = async (id) => {
    try {
      if (loadingSubmit) return; // evita clique duplicado

      const formData = new FormData();

      if (!status || !numeroChamado || !descricaoResponsavel) {
        toast.warning("Preencher todos os campos!!");
        return;
      }

      formData.append("status_solicitacao", status);
      formData.append("numero_chamado", numeroChamado);
      formData.append("responsavel_descricao", descricaoResponsavel);

      if (anexo) {
        formData.append("responsavel_anexo", anexo);
      }

      await axios.patch(`${Url}/suportecomercial/${id}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success("Salvo com sucesso ✅");

      setDataBase((prev) =>
        prev.map((info) =>
          info.id === id
            ? {
                ...info,
                status_solicitacao: status,
                numero_chamado: numeroChamado,
                responsavel_descricao: descricaoResponsavel,
              }
            : info,
        ),
      );

      setLoadingSubmit(false);

      await fetchTable();

      toast.success("Demanda assumida ✅");
    } catch (err) {
      console.error(err.message, "handleassumir");
      toast.error("Erro ao assumir ❌");
    }
  };

  useEffect(() => {
    if (id) {
      fetchTable();
    }
  }, [id, Url]);

  if (loading) {
    return (
      <Container>
        <RenameTitle initialTitle="P&P - HUB" />
        <p className={styles.message}>Carregando solicitação...</p>
      </Container>
    );
  }

  if (!dados) {
    return (
      <Container>
        <RenameTitle initialTitle="P&P - HUB" />
        <p className={styles.message}>Nenhum dado encontrado.</p>
      </Container>
    );
  }

  const handleDownload = async (urlAnexo) => {
    try {
      const response = await fetch(urlAnexo);
      const blob = await response.blob();

      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;

      // ✅ pega nome limpo do arquivo
      const nomeArquivo = urlAnexo.split("/").pop().split("?")[0];

      a.download = nomeArquivo;

      document.body.appendChild(a);
      a.click();
      a.remove();

      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Erro ao baixar arquivo:", err);
    }
  };

  return (
    <Container>
      <RenameTitle initialTitle="P&P - HUB" />

      <nav className={styles.navigation}>
        <LinkButton to="/suportecomercial?aba=tabelas" text="Voltar" />

        {hub && <LinkButton to="/suportecomercial" text="nova solicitação" />}
      </nav>

      <main className={styles.main}>
        <section className={styles.card}>
          <h2>Dados da Solicitação</h2>
          <header className={styles.header}>
            <div>
              <label htmlFor="data_criacao">Data Criação</label>
              <input
                id="data_criacao"
                value={
                  dados.data_criacao
                    ? new Date(dados.data_criacao).toLocaleString("pt-BR")
                    : ""
                }
                readOnly
              />
            </div>

            <div>
              <label htmlFor="data_atualizacao">Data Atualização</label>
              <input
                id="data_atualizacao"
                value={
                  dados.data_atualizacao
                    ? new Date(dados.data_atualizacao).toLocaleString("pt-BR")
                    : ""
                }
                readOnly
              />
            </div>
          </header>
          <fieldset className={styles.grid}>
            <legend className={styles.legend}>
              Informações da solicitação
            </legend>

            <div className={styles.field}>
              <label htmlFor="tipo_solicitacao">Tipo Solicitação</label>
              <input
                id="tipo_solicitacao"
                value={dados.tipo_solicitacao || ""}
                readOnly
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="canal">Canal</label>
              <input id="canal" value={dados.canal || ""} readOnly />
            </div>

            <div className={styles.field}>
              <label htmlFor="sistema">Sistema</label>
              <input id="sistema" value={dados.sistema || ""} readOnly />
            </div>

            <div className={styles.field}>
              <label htmlFor="status_solicitacao">Status Solicitação</label>
              <input
                id="status_solicitacao"
                value={dados.status_solicitacao || ""}
                readOnly
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="responsavel">Responsável</label>
              <input
                id="responsavel"
                value={dados.responsavel || ""}
                readOnly
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="descricao_solicitacao">
                descricao_solicitacao
              </label>
              <textarea
                id="descricao_solicitacao"
                value={dados.descricao_solicitacao || ""}
                readOnly
              />
            </div>
          </fieldset>
        </section>

        <section className={styles.card}>
          <h2>Dados do Cliente</h2>

          <fieldset className={styles.grid}>
            <legend className={styles.legend}>Informações do cliente</legend>

            <div className={styles.field}>
              <label htmlFor="nome">Nome</label>
              <input id="nome" value={dados.nome || ""} readOnly />
            </div>

            <div className={styles.field}>
              <label htmlFor="nome_cliente">Nome Cliente</label>
              <input
                id="nome_cliente"
                value={dados.nome_cliente || ""}
                readOnly
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="cpf_cliente">CPF Cliente</label>
              <input
                id="cpf_cliente"
                value={dados.cpf_cliente || ""}
                readOnly
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="cnpj">CNPJ</label>
              <input id="cnpj" value={dados.cnpj || ""} readOnly />
            </div>

            <div className={styles.field}>
              <label htmlFor="razao_social">Razão Social</label>
              <input
                id="razao_social"
                value={dados.razao_social || ""}
                readOnly
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="email">E-mail</label>
              <input id="email" value={dados.email || ""} readOnly />
            </div>

            <div className={styles.field}>
              <label htmlFor="endereco_cliente">Endereço Cliente</label>
              <input
                id="endereco_cliente"
                value={dados.endereco_cliente || ""}
                readOnly
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="hp_cliente">HP Cliente</label>
              <input id="hp_cliente" value={dados.hp_cliente || ""} readOnly />
            </div>
          </fieldset>
        </section>

        <section className={styles.card}>
          <h2>Dados Comerciais</h2>

          <fieldset className={styles.grid}>
            <legend className={styles.legend}>Informações comerciais</legend>

            <div className={styles.field}>
              <label htmlFor="numero_contrato">Número Contrato</label>
              <input
                id="numero_contrato"
                value={dados.numero_contrato || ""}
                readOnly
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="numero_pedido">Número Pedido</label>
              <input
                id="numero_pedido"
                value={dados.numero_pedido || ""}
                readOnly
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="numero_proposta">Número Proposta</label>
              <input
                id="numero_proposta"
                value={dados.numero_proposta || ""}
                readOnly
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="login_usuario">Login Usuário</label>
              <input
                id="login_usuario"
                value={dados.login_usuario || ""}
                readOnly
              />
            </div>
          </fieldset>
        </section>

        <section className={styles.card}>
          <h2>Observações</h2>

          <fieldset className={styles.gridOne}>
            <legend className={styles.legend}>
              Observações da solicitação
            </legend>

            <div className={styles.field}>
              <label htmlFor="observacao">Observação</label>
              <textarea
                id="observacao"
                value={dados.observacao || ""}
                readOnly
                rows={4}
              />
            </div>
          </fieldset>
        </section>

        <section className={styles.card}>
          <h2>Anexos</h2>

          <fieldset className={styles.grid}>
            <legend className={styles.legend}>
              Informações de data e anexo
            </legend>

            <div className={styles.field}>
              <label htmlFor="anexo">Anexo</label>
              <img src={dados.anexo} alt="Anexo" />
              <button type="dwonl"></button>
            </div>
          </fieldset>
          <button onClick={() => handleDownload(dados.anexo)}>Download</button>
        </section>

        {(hub && dados.status_solicitacao === "FINALIZADO") ||
          (hub_admin && dados.status_solicitacao === "FINALIZADO" && (
            <section className={styles.card}>
              <h2>Atualizar Solicitação</h2>

              <form
                className={styles.form}
                onSubmit={(e) => e.preventDefault()}
              >
                <fieldset className={styles.grid}>
                  <legend className={styles.legend}>
                    Tratativa administrativa
                  </legend>

                  <div className={styles.field}>
                    <label htmlFor="status">Status</label>

                    <input
                      id="status_solicitacao"
                      value={dados.status_solicitacao}
                      readOnly
                    />
                  </div>

                  <div className={styles.field}>
                    <label htmlFor="numero_chamado">Número Chamado</label>

                    <input
                      id="numero_chamado"
                      value={dados.numero_chamado}
                      readOnly
                    />
                  </div>

                  <div className={styles.field}>
                    <label htmlFor="descricao_responsavel">Descrição</label>

                    <textarea
                      id="descricao_responsavel"
                      value={dados.responsavel_descricao}
                      readOnly
                    />
                  </div>

                  <div className={styles.field}>
                    <h2>Responsavel Anexo</h2>

                    <legend className={styles.legend}>
                      Informações de data e anexo
                    </legend>

                    <div className={styles.field}>
                      <label htmlFor="responsavel_anexo">
                        Responsavel Anexo
                      </label>
                      <img src={dados.responsavel_anexo} alt="Anexo" />
                      <button type="dwonl"></button>
                    </div>
                    <button
                      onClick={() => handleDownload(dados.responsavel_anexo)}
                    >
                      Download
                    </button>
                  </div>
                </fieldset>
              </form>
            </section>
          ))}

        {hub_admin && dados.status_solicitacao !== "FINALIZADO" && (
          <section className={styles.card}>
            <h2>Atualizar Solicitação</h2>

            <form className={styles.form} onSubmit={(e) => e.preventDefault()}>
              <fieldset className={styles.grid}>
                <legend className={styles.legend}>
                  Tratativa administrativa
                </legend>

                <div className={styles.field}>
                  <label htmlFor="status">Status</label>

                  <select
                    id="status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    <option value="">Selecione</option>
                    <option value="FINALIZADO">FINALIZADO</option>
                    <option value="IMPROCEDENTE">IMPROCEDENTE</option>
                    <option value="TRATAMENTO">EM TRATAMENTO</option>
                  </select>
                </div>

                {mostrarCampo("numeroChamado") && (
                  <div className={styles.field}>
                    <label htmlFor="numero_chamado">Número Chamado</label>

                    <input
                      id="numero_chamado"
                      value={numeroChamado}
                      onChange={(e) => setNumeroChamado(e.target.value)}
                    />
                  </div>
                )}

                {mostrarCampo("descricaoResponsavel") && (
                  <div className={styles.field}>
                    <label htmlFor="descricao_responsavel">Descrição</label>

                    <input
                      id="descricao_responsavel"
                      value={descricaoResponsavel}
                      onChange={(e) => setDescricaoResponsavel(e.target.value)}
                    />
                  </div>
                )}

                {/* ANEXO */}
                {mostrarCampo("handleAnexoChange") && (
                  <div className={styles.field}>
                    <label>Anexo</label>
                    <input
                      id="handleAnexoChange"
                      ref={inputAnexoRef}
                      type="file"
                      name="anexo"
                      accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
                      onChange={handleAnexoChange}
                    />
                  </div>
                )}
              </fieldset>

              <div className={styles.actions}>
                <button
                  onClick={(e) => handleSubmit(dados.id)}
                  disabled={loadingSubmit}
                >
                  {loadingSubmit ? "Salvando" : "Salvar"}
                </button>
              </div>
            </form>
          </section>
        )}
      </main>
    </Container>
  );
}
