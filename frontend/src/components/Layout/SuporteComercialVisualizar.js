import { useState, useEffect } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import "react-toastify/dist/ReactToastify.css";

import RenameTitle from "../Tools/RenameTitle";
import Container from "./Container";

export default function Home() {
  const Url = process.env.REACT_APP_API_URL || "http://localhost:8000";

  const { id } = useParams();

  const [dataBase, setDataBase] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState();
  const [numeroChamado, setNumeroChamado] = useState();
  const [descricao, setDescricao] = useState();

  const dados = dataBase?.[0];

  // objeto de controle de inputs regra
  const camposPorSistema = {
    FINALIZADO: ["numeroChamado", "descricao"],
    TRATAMENTO: ["numeroChamado", "descricao"],
    IMPROCEDENTE: ["numeroChamado", "descricao"],
  };

  const mostrarCampo = (campo) => {
    return camposPorSistema[status]?.includes(campo);
  };

  useEffect(() => {
    async function fetchTable() {
      try {
        setLoading(true);

        const res = await axios.get(`${Url}/suportecomercial/${id}`);

        setDataBase(res.data);
      } catch (err) {
        console.error("Erro ao buscar tabela", err);
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      fetchTable();
    }
  }, [Url, id]);

  return (
    <Container>
      <RenameTitle initialTitle={"P&P - HUB"} />

      {loading && <p>Carregando solicitação...</p>}

      {!loading && !dados && <p>Nenhum dado encontrado.</p>}

      {!loading && dados && (
        <main
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "24px",
            padding: "20px",
          }}
        >
          <section
            style={{
              border: "1px solid #ddd",
              borderRadius: "12px",
              padding: "20px",
              background: "#fff",
            }}
          >
            <h2>Dados da Solicitação</h2>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "16px",
              }}
            >
              <Campo label="ID" value={dados.id} />
              <Campo label="Tipo Solicitação" value={dados.tipo_solicitacao} />
              <Campo label="Canal" value={dados.canal} />
              <Campo label="Sistema" value={dados.sistema} />
              <Campo
                label="Status Solicitação"
                value={dados.status_solicitacao}
              />
              <Campo label="Responsável" value={dados.responsavel} />
              <Campo label="Assumiu" value={dados.assumiu} />
            </div>
          </section>

          <section
            style={{
              border: "1px solid #ddd",
              borderRadius: "12px",
              padding: "20px",
              background: "#fff",
            }}
          >
            <h2>Dados do Cliente</h2>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "16px",
              }}
            >
              <Campo label="Nome" value={dados.nome} />
              <Campo label="Nome Cliente" value={dados.nome_cliente} />
              <Campo label="CPF Cliente" value={dados.cpf_cliente} />
              <Campo label="CNPJ" value={dados.cnpj} />
              <Campo label="Razão Social" value={dados.razao_social} />
              <Campo label="E-mail" value={dados.email} />
              <Campo label="Endereço Cliente" value={dados.endereco_cliente} />
              <Campo label="HP Cliente" value={dados.hp_cliente} />
            </div>
          </section>

          <section
            style={{
              border: "1px solid #ddd",
              borderRadius: "12px",
              padding: "20px",
              background: "#fff",
            }}
          >
            <h2>Dados Comerciais</h2>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "16px",
              }}
            >
              <Campo label="Número Contrato" value={dados.numero_contrato} />
              <Campo label="Número Pedido" value={dados.numero_pedido} />
              <Campo label="Número Proposta" value={dados.numero_proposta} />
              <Campo label="Login Usuário" value={dados.login_usuario} />
            </div>
          </section>

          <section
            style={{
              border: "1px solid #ddd",
              borderRadius: "12px",
              padding: "20px",
              background: "#fff",
            }}
          >
            <h2>Observações</h2>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr",
                gap: "16px",
              }}
            >
              <CampoArea label="Observação" value={dados.observacao} />
              <CampoArea label="Descrição" value={dados.descricao} />
            </div>
          </section>

          <section
            style={{
              border: "1px solid #ddd",
              borderRadius: "12px",
              padding: "20px",
              background: "#fff",
            }}
          >
            <h2>Datas e Anexos</h2>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "16px",
              }}
            >
              <Campo
                label="Data Criação"
                value={
                  dados.data_criacao
                    ? new Date(dados.data_criacao).toLocaleString("pt-BR")
                    : ""
                }
              />

              <Campo
                label="Data Atualização"
                value={
                  dados.data_atualizacao
                    ? new Date(dados.data_atualizacao).toLocaleString("pt-BR")
                    : ""
                }
              />

              <Campo label="Anexo" value={dados.anexo} />
            </div>
          </section>

          <form
            action="
          
          
          "
          >
            <div>
              <label>STATUS</label>
              <select onChange={(e) => setStatus(e.target.value)}>
                <option value={status}>Selecione</option>
                <option>FINALIZADO</option>
                <option>IMPROCEDENTE</option>
                <option>EM TRATAMENTO</option>
              </select>
            </div>

            {mostrarCampo("numeroChamado") && (
              <div>
                <label>NUMERO CHAMADO</label>
                <input
                  value={numeroChamado}
                  onChange={(e) => {
                    setNumeroChamado(e.target.value);
                  }}
                ></input>
              </div>
            )}

            {mostrarCampo("descricao") && (
              <div>
                <label>descricao</label>
                <input
                  value={descricao}
                  onChange={(e) => {
                    setDescricao(e.target.value);
                  }}
                ></input>
              </div>
            )}
          </form>
        </main>
      )}
    </Container>
  );
}

function Campo({ label, value }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      <label
        style={{
          fontSize: "12px",
          fontWeight: "600",
          color: "#555",
          textTransform: "uppercase",
        }}
      >
        {label}
      </label>

      <input
        value={value || ""}
        readOnly
        style={{
          width: "100%",
          height: "38px",
          padding: "8px 10px",
          border: "1px solid #ccc",
          borderRadius: "8px",
          background: "#f8f8f8",
          color: "#222",
        }}
      />
    </div>
  );
}

function CampoArea({ label, value }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      <label
        style={{
          fontSize: "12px",
          fontWeight: "600",
          color: "#555",
          textTransform: "uppercase",
        }}
      >
        {label}
      </label>

      <textarea
        value={value || ""}
        readOnly
        rows={4}
        style={{
          width: "100%",
          padding: "10px",
          border: "1px solid #ccc",
          borderRadius: "8px",
          background: "#f8f8f8",
          color: "#222",
          resize: "none",
        }}
      />
    </div>
  );
}
