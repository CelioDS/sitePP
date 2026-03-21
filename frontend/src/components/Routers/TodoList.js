import Container from "../Layout/Container";
import { useEffect, useState } from "react";
import ValidarToken from "../Tools/ValidarToken";
import TodoUser from "../Layout/TodoListUser.js";

export default function TodoList() {
  const [userData, setUserData] = useState();
  const [view, setView] = useState(0);

  const login = userData?.login;
  //const adminMis = userData?.adminMis;

  useEffect(() => {
    let isMounted = true; // Garante que não vamos atualizar estado se o componente desmontar

    async function fetchUserData() {
      try {
        const data = await ValidarToken();

        // Só atualiza se o componente ainda estiver na tela e o dado for válido
        if (isMounted && data) {
          setUserData(data);
          console.log(data);
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
      <main>
        <button onClick={() => setView((prev) => (prev = !prev))}>mudar</button>

        {view ? <TodoAdmin login={login} /> : <TodoUser />}
      </main>
    </Container>
  );
}
