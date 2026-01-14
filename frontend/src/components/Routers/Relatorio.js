import RenameTitle from "../Tools/RenameTitle";
import { useState, useEffect, useLayoutEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import Container from "../Layout/Container";
import { format } from "date-fns";
import { fromZonedTime } from "date-fns-tz";
import Style from "./Relatorio.module.css";
import ValidarToken from "../Tools/ValidarToken";

export default function Relatorio() {
  const [DataBase, setDataBase] = useState([]);
  const Url = process.env.REACT_APP_API_URL || "http://localhost:8000";
  const [userData, setUserData] = useState(null);
  const today = format(
    fromZonedTime(new Date(), "America/Sao_Paulo"),
    "yyyy-MM-dd"
  ); //
  const user = userData?.login;
  const admin = userData?.admin;

  useLayoutEffect(() => {
    async function loadUser() {
      const data = await ValidarToken();
      if (!data) {
        window.location.href = "/Error";
        return;
      }
      setUserData(data); // { login, admin }
    }
    loadUser();
  }, []);

  // 🔹 Buscar dados do backend
  const GetBaseData = async () => {
    try {
      // FAZER UMA QUERY PARA VALORES ASSUMIDOS
      const res = await axios.get(`${Url}/`);

      const filtered = res.data.filter(
        (item) => item.responsavel && item.responsavel === user
      );

      setDataBase(filtered);
      toast.success("Dados carregados com sucesso!");
    } catch (error) {
      toast.error(`ERROR - ${error.message}`);
    } finally {
    }
  };

  useEffect(() => {
    if (user) {
      GetBaseData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // 🔹 Atualiza valores dos inputs na tabela
  function handleInputChange(e, index, field) {
    const value = e.target.value;
    setDataBase((prev) => {
      const newData = [...prev];
      newData[index] = { ...newData[index], [field]: value };
      return newData;
    });
  }

  // 🔹 Formata datas para MySQL
  function formatDateForMySQL(date) {
    if (!date) return null;
    const d = new Date(date);
    return d.toISOString().slice(0, 19).replace("T", " ");
  }

  // 🔹 Salvar linha atualizada
  async function handleSubmit(item) {
    if (
      item.movimento === "Instalação Reagendada" ||
      (item.movimento === "Instalação Antecipada" && !item.novaData)
    )
      return toast.warning("Erro: Preencha todos os campos obrigatórios!");

    if (
      !item.movimento ||
      !item.contatoComSucesso ||
      !item.responsavel ||
      !item.formaContato
    ) {
      return toast.warning("Erro: Preencha todos os campos obrigatórios!");
    }

    if (!item.telefoneContato && !item.tel_contato) {
      return toast.warning("Erro: Preencha todos os campos obrigatórios!");
    }

    try {
      const res = await axios.put(`${Url}/${item.id}`, {
        sk_data: formatDateForMySQL(item.sk_data),
        nm_canal_venda_subgrupo: item.nm_canal_venda_subgrupo,
        nm_parceiro: item.nm_parceiro,
        nm_periodo_agendamento: item.nm_periodo_agendamento,
        desc_mun: item.desc_mun,
        ddd_mun: item.ddd_mun,
        segmento_porte: item.segmento_porte,
        territorio: item.territorio,
        flag_rota: item.flag_rota,
        flag_agenda_futura: item.flag_agenda_futura,
        data_futura: formatDateForMySQL(item.data_futura),
        motivo_quebra_d1: item.motivo_quebra_d1,
        motivo_quebra_ult: item.motivo_quebra_ult,
        dt_quebra_ult: formatDateForMySQL(item.dt_quebra_ult),
        cd_operadora: item.cd_operadora,
        nr_contrato: item.nr_contrato,
        dt_abertura_os: formatDateForMySQL(item.dt_abertura_os),
        movimento: item.movimento,
        contato_com_sucesso: item.contatoComSucesso,
        nova_data: formatDateForMySQL(item.novaData),
        responsavel: item.responsavel,
        forma_contato: item.formaContato,
        tel_contato: item.telefoneContato,
        obs: item.observacao,
        finalizado: true,
        data_assumir: formatDateForMySQL(today),
      });

      toast.success(res.data);

      setDataBase((prev) =>
        prev.map((info) =>
          info.id === item.id
            ? {
                ...info,
                movimento: item.movimento,
                contato_com_sucesso: item.contatoComSucesso,
                nova_data: formatDateForMySQL(item.novaData),
                responsavel: item.responsavel,
                forma_contato: item.formaContato,
                tel_contato: item.telefoneContato,
                obs: item.obs,
                finalizado: true,
                data_assumir: formatDateForMySQL(today),
              }
            : info
        )
      );
    } catch (error) {
      toast.error(error.response?.data || error.message);
      console.log(error);
    } finally {
    }
  }

  return (
    <Container>
      <main className={Style.main}>
        <RenameTitle initialTitle={"P&P - Relatório"} />
        {admin && <h1>teste</h1>}
      </main>
    </Container>
  );
}
