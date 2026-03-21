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
          </tr>
        </thead>
        {console.log("e", setStatusAtualizacao)}
        <tbody>
          {statusAtualicao
            .sort((a, b) => new Date(a.ultima) - new Date(b.ultima))
            .map((s) => (
              <tr key={s.tabela}>
                <td>{s.tabela}</td>
                <td>{new Date(s.ultima).toLocaleString()}</td>
                <td>
                  {(() => {
                    const diffDias =
                      (new Date() - new Date(s.ultima)) / (1000 * 60 * 60 * 24);
                    return `${Math.floor(diffDias)} dias atrás`;
                  })()}
                </td>
                <td>
                  {(() => {
                    const dataAtual = new Date();
                    const dataUltima = new Date(s.ultima);

                    const diffMs = dataAtual - dataUltima;

                    const diffDias = diffMs / (1000 * 60 * 60 * 24);
                    const diffmeses = diffDias / 30.44;

                    return diffmeses > 1 ? "Priorizar" : "OK";
                  })()}
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </main>
  );
}
