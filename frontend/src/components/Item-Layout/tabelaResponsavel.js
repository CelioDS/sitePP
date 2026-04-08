import Style from "./tabelaResponsavel.module.css";
import axios from "axios";
import { useState, useEffect } from "react";

export default function TabelaResponsavel({ Url }) {
  const [statusAtualicao, setStatusAtualizacao] = useState([]);

  const fetchStatus = async () => {
    try {
      const res = await axios.get(`${Url}/statusatualizacao`);
      setStatusAtualizacao(res.data);
    } catch (err) {
      console.error("Erro ao buscar status atualizaçao", err);
    }
  };

  useEffect(() => {
    fetchStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main style={{ padding: "1rem" }} className={Style.main}>
      <h2>📊 Ultima data de atualização</h2>
      <table>
        <thead>
          <tr>
            <th>Carteira</th>
            <th>Ultima atualizacao</th>
            <th>Dias</th>
            <th>Status</th>
            <th>media</th>
            <th>ultimo registro </th>
            <th>diferença</th>
          </tr>
        </thead>
        <tbody>
          {statusAtualicao
            .sort((a, b) => new Date(a.ultima_data) - new Date(b.ultima_data))
            .map((s) => (
              <tr key={s.tabela}>
                <td>{s.tabela}</td>
                <td>{new Date(s.ultima_data).toLocaleString()}</td>
                <td>
                  {(() => {
                    const diffDias =
                      (new Date() - new Date(s.ultima_data)) /
                      (1000 * 60 * 60 * 24);
                    return `${Math.floor(diffDias)} dias atrás`;
                  })()}
                </td>
                <td
                  style={
                    (() => {
                      const dataAtual = new Date();
                      const dataUltima = new Date(s.ultima_data);

                      const diffMs = dataAtual - dataUltima;

                      const diffDias = diffMs / (1000 * 60 * 60 * 24);
                      const diffmeses = diffDias / 30.44;

                      return diffmeses > 1 ? "Priorizar" : "OK";
                    })() === "Priorizar"
                      ? { color: "#ff0000", background: "#be8181a9" }
                      : { color: "#12380a",background: "#638a5ffb" }
                  }
                >
                  {((e) => {
                    const dataAtual = new Date();
                    const dataUltima = new Date(s.ultima_data);

                    const diffMs = dataAtual - dataUltima;

                    const diffDias = diffMs / (1000 * 60 * 60 * 24);
                    const diffmeses = diffDias / 30.44;

                    return diffmeses > 1 ? "Priorizar" : "OK";
                  })()}
                </td>

                <td>{Number(s.media_registros_dia).toFixed(2)}</td>
                <td>{Number(s.registros_ultimo_dia).toFixed(2)}</td>
                <td>{Number(s.variacao_registros).toFixed(2)}</td>
              </tr>
            ))}
        </tbody>
      </table>
    </main>
  );
}
