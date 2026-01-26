import Style from "./ButtonWhats.module.css";
import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import axios from "axios";
import QrCode from "./qrCode";
import { BsWhatsapp } from "react-icons/bs";
import ValidarToken from "../Tools/ValidarToken";

export default function ButtonWhats({ DataBase, setDatabase, admin, item }) {
  const Url = process.env.REACT_APP_API_URL || "http://localhost:8000";
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

      setDatabase((prev) =>
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

  return (
    <main className={Style.main}>
      {!admin && <QrCode setWhatsappOn={setWhatsappOn}></QrCode>}
      
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
          }}
          placeholder="(XX) XXXXX-XXXX"
        />

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
    </main>
  );
}
