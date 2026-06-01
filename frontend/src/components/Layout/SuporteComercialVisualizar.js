import { useState, useEffect } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import "react-toastify/dist/ReactToastify.css";

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
  const [descricao, setDescricao] = useState("");
  const [userData, setUserData] = useState(null);

  const hub_admin = userData?.hub_admin;
  const dados = dataBase?.[0];

  const camposPorSistema = {
    FINALIZADO: ["numeroChamado", "descricao"],
    "EM TRATAMENTO": ["numeroChamado", "descricao"],
    IMPROCEDENTE: ["numeroChamado", "descricao"],
  };

  const mostrarCampo = (campo) => {
    return camposPorSistema[status]?.includes(campo);
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

  useEffect(() => {
    async function fetchTable() {
      try {
        setLoading(true);

        const res = await axios.get(`${Url}/suportecomercial/${id}`);

        setDataBase(res.data || []);
      } catch (err) {
        console.error("Erro ao buscar tabela:", err);
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      fetchTable();
    }
  }, [Url, id]);

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

  return (
    <Container>
      <RenameTitle initialTitle="P&P - HUB" />

      <nav className={styles.navigation}>
        <LinkButton to="/suportecomercial?aba=tabelas" text="Voltar" />
        <LinkButton to="/suportecomercial" text="nova solicitação" />
      </nav>

      <main className={styles.main}>
        <section className={styles.card}>
          <h2>Dados da Solicitação</h2>

          <fieldset className={styles.grid}>
            <legend className={styles.legend}>
              Informações da solicitação
            </legend>

            <div className={styles.field}>
              <label htmlFor="id">ID</label>
              <input id="id" value={dados.id || ""} readOnly />
            </div>

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
              <label htmlFor="assumiu">Assumiu</label>
              <input id="assumiu" value={dados.assumiu || ""} readOnly />
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

            <div className={styles.field}>
              <label htmlFor="descricao_atual">Descrição</label>
              <textarea
                id="descricao_atual"
                value={dados.descricao || ""}
                readOnly
                rows={4}
              />
            </div>
          </fieldset>
        </section>

        <section className={styles.card}>
          <h2>Datas e Anexos</h2>

          <fieldset className={styles.grid}>
            <legend className={styles.legend}>
              Informações de data e anexo
            </legend>

            <div className={styles.field}>
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

            <div className={styles.field}>
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

            <div className={styles.field}>
              <label htmlFor="anexo">Anexo</label>
              <input id="anexo" value={dados.anexo || ""} readOnly />
            </div>
          </fieldset>
        </section>

        {!hub_admin && (
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
                    <option value="EM TRATAMENTO">EM TRATAMENTO</option>
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

                {mostrarCampo("descricao") && (
                  <div className={styles.field}>
                    <label htmlFor="descricao">Descrição</label>

                    <input
                      id="descricao"
                      value={descricao}
                      onChange={(e) => setDescricao(e.target.value)}
                    />
                  </div>
                )}
              </fieldset>

              <div className={styles.actions}>
                <button type="submit">Salvar</button>
              </div>
            </form>
          </section>
        )}
      </main>
    </Container>
  );
}
