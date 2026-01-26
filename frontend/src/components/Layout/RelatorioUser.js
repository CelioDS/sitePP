import LoadingSvg from "../Item-Layout/Loading";
import { Link } from "react-router-dom";
import Style from "./RelatorioUser.module.css";
import { useMemo, useState, useEffect } from "react";
import { toast } from "react-toastify";
import axios from "axios";
//import QrCode from "../Item-Layout/qrCode";
import { BsWhatsapp } from "react-icons/bs";
import ValidarToken from "../Tools/ValidarToken";

export default function RelatorioUser({
  DataBase,
  setDataBase,
  handleInputChange,
  handleSubmit,
  today,
  admin,
}) {
  const Url = process.env.REACT_APP_API_URL || "http://localhost:8000";
  const data = DataBase.length;
  const [hidden, setHidden] = useState();
  const [whatsNumber, setWhatsNumber] = useState("");
  const [isSubmit, setSubmit] = useState(false);
  const [whatsappOn, setWhatsappOn] = useState();
  const userId = localStorage.getItem("login"); // vindo do login
  const [userData, setUserData] = useState(null);

  const user = userData?.login;

  useEffect(() => {
    async function loadUser() {
      const data = await ValidarToken();
      if (!data) {
        window.location.href = "/Error";
        return;
      }
      console.log(DataBase);
      setUserData(data); // { login, admin }
    }
    loadUser();
  }, [DataBase]);

  function gerarMensagens(item, nomeAssistente) {
    const footer = `\n\n— Atendimento Claro\n${nomeAssistente}`;
    const dataFormatada = new Date(item.data_futura).toLocaleDateString(
      "pt-BR"
    );

    function getOnlyNumber(value) {
      if (!value) return 0; // se vier null, undefined, "", etc

      const onlyNumbers = String(value).replace(/\D/g, ""); // remove tudo que não for número

      return onlyNumbers ? Number(onlyNumbers) : 0;
    }

    const flag = getOnlyNumber(item.flag_agenda_futura);
    // Mensagens para antecipação de agenda
    if (flag > 24) {
      return [
        `Olá! Tudo bem?

Aqui é do *Time de Agendamento da Claro*. Identificamos uma oportunidade para *antecipar o seu atendimento* 😊

O atendimento está vinculado ao contrato *${item.nr_contrato}*, programado para o período *${item.nm_periodo_agendamento}* na cidade de *${item.desc_mun}*.

Atualmente, sua visita está agendada para o dia *${dataFormatada}*.

Caso você tenha disponibilidade para ser atendido antes, podemos ajustar imediatamente. Basta me confirmar por aqui que farei a alteração para você.

Fico no aguardo da sua resposta!${footer}`,
      ];
    }

    // ===========================
    // 📌 MENSAGENS PARA CONFIRMAÇÃO DE AGENDAMENTO
    // ===========================
    return [
      `Olá! Tudo bem?

Aqui é do *Time de Agendamento da Claro*. Estamos entrando em contato para realizar a *confirmação do seu atendimento* referente ao contrato *${item.nr_contrato}*.

Seu atendimento está programado para o período *${item.nm_periodo_agendamento}*, no município de *${item.desc_mun}*, com agendamento previsto para o dia *${dataFormatada}*.

Para garantirmos que tudo ocorra conforme o planejado, poderia confirmar sua disponibilidade para essa data e período?

Sua confirmação é muito importante para mantermos o atendimento sem atrasos.

Agradeço desde já!${footer}`,
    ];
  }

  async function handleSendWhats(item) {
    if (isSubmit) {
      toast.warning("Aguarde um momento para reenviar a mensagem via WhatsApp");
      return;
    }
    setSubmit(true);

    if (!whatsNumber) {
      toast.warn("Digite o número!");
      setSubmit(false);
      return;
    }

    const mensagens = gerarMensagens(
      item,
      localStorage.getItem("login").toUpperCase()
    );
    const mesagensAleatorios =
      mensagens[Math.floor(Math.random() * mensagens.length)];

    try {
      const res = await axios.patch(`${Url}/${item.id}`, {
        tel_contato: whatsNumber,
      });

      toast.success(res.data);

      setDataBase((prev) =>
        prev.map((dbItem) =>
          dbItem.id === item.id
            ? { ...dbItem, tel_contato: whatsNumber }
            : dbItem
        )
      );
    } catch (error) {
      toast.error(error.response?.data || error.message);
      console.log(error);
    } finally {
      setTimeout(() => {
        setSubmit(false);
      }, 5000);
    }

    try {
      await axios.post(`${Url}/send/${userId}`, {
        number: whatsNumber,
        message: mesagensAleatorios,
      });

      toast.success("Mensagem enviada com sucesso!");
    } catch (error) {
      toast.error("Erro ao enviar mensagem: " + error.message);
    }
    setWhatsNumber("");
  }

  const finalizadoHoje = useMemo(() => {
    return DataBase.filter(
      (item) =>
        item.finalizado === 1 && item.data_assumir?.slice(0, 10) === today
    );
  }, [DataBase, today]);

  const pendenteHoje = useMemo(() => {
    return DataBase.filter((item) => !item.finalizado);
  }, [DataBase]);

  return (
    <main className={Style.main}>
    
      <p>Lista de agendamentos pendentes de : {user}</p>
      <p>Quantidade: {pendenteHoje.length}</p>

      <section>
        {data.length === 0 ? (
          <main>
            <LoadingSvg text={"Sem dados pendentes..."} />
          </main>
        ) : (
          <table className={Style.table}>
            <thead>
              <tr>
                <th>Contrato</th>
                <th>Telefone</th>
                <th>Movimento</th>
                <th>Contato com sucesso</th>
                {/*hidden === "Instalação Reagendada" && <th>Data Nova</th> */}
                {/*hidden === "Instalação Antecipada" && <th>Data Nova</th>*/}
                <th>Data Nova</th>
                <th>Forma de Contato</th>
                <th>Observação</th>
                <th>Salvar</th>
              </tr>
            </thead>
            <tbody>
              {DataBase.map((item, index) =>
                !item.finalizado ? (
                  <tr key={item.id || index}>
                    <td>
                      <Link
                        to={`/Visualizar/${item.id}/${item.nr_contrato}`}
                        title="Acesse aqui"
                        aria-label={`Acesse ${item.nr_contrato}`}
                      >
                        {item.nr_contrato}
                      </Link>
                    </td>

                    <td>
                      <div className={Style.whatsapp}>
                        <input
                          type="text"
                          value={item.tel_contato ? item.tel_contato : null}
                          disabled={
                            Boolean(item.tel_contato) ||
                            Boolean(isSubmit) ||
                            Boolean(!whatsappOn)
                          }
                          onChange={(e) => {
                            setWhatsNumber(e.target.value);
                            handleInputChange(e, index, "telefoneContato");
                          }}
                          placeholder="(XX) XXXXX-XXXX"                        />

                        <button
                        className={Style.btnWhats}
                          disabled={
                            Boolean(item.tel_contato) ||
                            Boolean(isSubmit) ||
                            Boolean(!whatsappOn)
                          }
                          type="button"
                          onClick={() => handleSendWhats(item)}
                        >
                          <BsWhatsapp />
                        </button>
                      </div>
                    </td>

                    <td>
                      <select
                        id="movimento"
                        name="movimento"
                        value={item.movimento || ""}
                        onChange={(e) => {
                          handleInputChange(e, index, "movimento");
                          setHidden(e.target.value);
                        }}
                      >
                        <option value="">Selecione a movimentação</option>
                        <option value="Agenda Mantida">Agenda Mantida</option>
                        <option value="Instalação Antecipada">
                          Instalação Antecipada
                        </option>
                        <option value="Sem Retorno do Cliente">
                          Sem Retorno do Cliente
                        </option>
                        <option value="Serviço Já Conectado">
                          Serviço Já Conectado
                        </option>
                        <option value="Solicitado ou Cancelado pelo Cliente">
                          Solicitado ou Cancelado pelo Cliente
                        </option>
                        <option value="Erro de Pacote ou Cadastro no Sistema">
                          Erro de Pacote ou Cadastro no Sistema
                        </option>
                        <option value="Instalação Reagendada">
                          Instalação Reagendada
                        </option>
                        <option value="Quebra Técnica de Instalação (Sem Viabilidade)">
                          Quebra Técnica de Instalação (Sem Viabilidade)
                        </option>
                      </select>
                    </td>

                    <td>
                      <select
                        value={item.contatoComSucesso || ""}
                        onChange={(e) =>
                          handleInputChange(e, index, "contatoComSucesso")
                        }
                      >
                        <option value="">Selecione</option>
                        <option value="SIM">SIM</option>
                        <option value="NAO">NÃO</option>
                      </select>
                    </td>

                    {[
                      "Instalação Reagendada",
                      "Instalação Antecipada",
                    ].includes(item.movimento) ? (
                      <td>
                        <input
                          type="date"
                          value={item.novaData || ""}
                          onChange={(e) =>
                            handleInputChange(e, index, "novaData")
                          }
                        />
                      </td>
                    ) : (
                      <td>{!hidden && ""}</td>
                    )}

                    <td>
                      <select
                        value={item.formaContato || ""}
                        onChange={(e) =>
                          handleInputChange(e, index, "formaContato")
                        }
                      >
                        <option value="">Selecione</option>
                        <option value="Whatsapp">Whatsapp</option>
                        <option value="Ligacao">Ligação</option>
                      </select>
                    </td>

                    <td>
                      <textarea
                        value={item.observacao || ""}
                        onChange={(e) =>
                          handleInputChange(e, index, "observacao")
                        }
                      />
                    </td>

                    <td>
                      <button onClick={() => handleSubmit(item)}>Salvar</button>
                    </td>
                  </tr>
                ) : (
                  <tr key={`no-data-${index}`}>
                    {data.length === 0 && (
                      <td colSpan={8}>Sem pedidos pendentes {today}</td>
                    )}
                  </tr>
                )
              )}
            </tbody>
          </table>
        )}
      </section>
      <p>Lista de agendamentos finalizados:</p>
      <p>Quantidade: {finalizadoHoje.length}</p>
      <section>
        {data === 0 ? (
          <main>
            <LoadingSvg text={"Sem dados pendentes..."} />
          </main>
        ) : (
          <table className={Style.table}>
            <thead>
              <tr>
                <th>Contrato</th>
                <th>Município</th>
                <th>Movimento</th>
                <th>Contato com sucesso</th>
                <th>Nova Data</th>
                <th>Forma de Contato</th>
                <th>Telefone</th>
                <th>Observação</th>
              </tr>
            </thead>
            <tbody>
              {DataBase.map((item, index) =>
                item.finalizado && item.data_assumir?.slice(0, 10) === today ? (
                  <tr key={item.id || index}>
                    <td>
                      <Link
                        to={`/Visualizar/${item.id}/${item.nr_contrato}`}
                        title="Acesse aqui"
                        aria-label={`Acesse ${item.nr_contrato}`}
                      >
                        {item.nr_contrato}
                      </Link>
                    </td>
                    <td>{item.desc_mun}</td>

                    <td>{item.movimento}</td>

                    <td>{item.contato_com_sucesso}</td>

                    <td>
                      {item.nova_data && item.nova_data
                        ? new Date(item.nova_data).toLocaleString("pt-BR", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          })
                        : "__/__/__"}
                    </td>

                    <td>{item.forma_contato}</td>

                    <td>{item.tel_contato}</td>

                    <td>{item.obs}</td>
                  </tr>
                ) : (
                  <tr key={`no-data-${index}`}>
                    {data.length === 0 && (
                      <td colSpan={8}>Sem pedidos finalizado {today}</td>
                    )}
                  </tr>
                )
              )}
            </tbody>
          </table>
        )}
      </section>
    </main>
  );
}
