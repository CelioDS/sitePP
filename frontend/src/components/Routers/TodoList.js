import axios from "axios";
import { toast } from "react-toastify";
import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import Container from "../Layout/Container";
import { BsPenFill, BsCheck, BsTrash } from "react-icons/bs";

export default function ToDo() {
  const Url = process.env.REACT_APP_API_URL || "http://localhost:8000";
  const [dataBase, setDataBase] = useState();
  const { login } = useParams();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(`${Url}/todo`);
        setDataBase(res.data);
      } catch (err) {
        console.log(err);
        toast.error("ERRO - Ao buscar o TODO ");
      }
    };
    fetchData();
  }, [Url]);



  

  return (
    <Container>
      <main>
        <h1>Tarefas</h1>

        <form>
          <div>
            <label htmlFor="Tarefa">Tarefa</label>
            <input type="text" />
          </div>
          <div>
            <label htmlFor="Etapas">Etapas</label>
            <input type="text" />
          </div>
          <div>
            <label htmlFor="Porcentagem">Porcentagem</label>
            <input type="text" />
          </div>

          <button>Salvar</button>
        </form>
        <section>
          <table>
            <thead>
              <tr>
                <th>Tarefa</th>
                <th>Etapas</th>
                <th>porcentagem</th>
                <th>concluido</th>
                <th>DATA_ATUALIZACAO</th>
                <th>Finalizar</th>
                <th>Excluir</th>
                <th>Editar</th>
              </tr>
            </thead>
            <tbody>
              {dataBase &&
                dataBase
                  .filter((item) => item.responsavel === login)
                  .map((item, index) => (
                    <tr key={item.id || index}>
                      <td>{item.tarefa}</td>
                      <td>{item.etapas}</td>
                      <td>{item.porcentagem}</td>
                      <td>{item.concluido}</td>
                      <td>{item.DATA_ATUALIZACAO}</td>
                      <td>
                        <button>
                          <BsCheck />
                        </button>
                      </td>
                      <td>
                        <button>
                          <BsPenFill />
                        </button>
                      </td>
                      <td>
                        <button>{<BsTrash />}</button>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </section>
      </main>
    </Container>
  );
}
