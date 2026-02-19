import Container from "../Layout/Container";
import RenameTitle from "../Tools/RenameTitle";
import LinkButton from "../Item-Layout/LinkButton";
import { useEffect, useState } from "react";
import ValidarToken from "../Tools/ValidarToken";

export default function MIS() {
  const [userData, setUserData] = useState();

  const login = userData?.login;

  useEffect(() => {
    let isMounted = true; // Garante que não vamos atualizar estado se o componente desmontar

    async function fetchUserData() {
      try {
        const data = await ValidarToken();

        // Só atualiza se o componente ainda estiver na tela e o dado for válido
        if (isMounted && data) {
          setUserData(data);
        }
      } catch (error) {
        console.error("Erro ao validar token:", error);
      }
    }

    fetchUserData();

    return () => {
      isMounted = false; // Limpeza para evitar vazamento de memória
    };
  }, []); // Array vazio garante que rode apenas uma vez ao montar

  return (
    <Container>
      <RenameTitle initialTitle={"P&P - MIS"} />

      <main>
        <h1>teste</h1>
        <LinkButton to={`/TodoList/${login}`} text={"Todo list"} />

        <li>taberla de frenquencia relatorio</li>

        <li>grafico gantt</li>

        <table>
          <thead>
            <tr>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr></tr>
          </tbody>
        </table>
      </main>
    </Container>
  );
}
