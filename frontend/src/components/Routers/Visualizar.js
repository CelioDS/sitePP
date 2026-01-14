import Container from "../Layout/Container";
import { useParams } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useState, useEffect, useRef } from "react";
import Style from "./Visualizar.module.css";
import RenameTitle from "../Tools/RenameTitle";
import LinkButton from "../Item-Layout/LinkButton";
import { useOutletContext } from "react-router-dom";
import { format } from "date-fns";
import { fromZonedTime } from "date-fns-tz";
import ValidarToken from "../Tools/ValidarToken";

export default function Visualizar() {
  const { id } = useParams();
  const ref = useRef({});
  const idNumber = parseInt(id);
  const [database, setDatabase] = useState([]);
  const [hidden, setHidden] = useState();
  const [userData, setUserData] = useState(null);

  const { loginBD } = useOutletContext();
  const name = loginBD || localStorage.getItem("login");

  const Url = process.env.REACT_APP_API_URL || "http://localhost:8000";
  const admin = userData?.admin;
  const login = userData?.login;

  useEffect(() => {
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

  useEffect(() => {
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

  const brasilDate = format(
    fromZonedTime(new Date(), "America/Sao_Paulo"),
    "yyyy-MM-dd-hh-mm"
  ); //
  function formatDateForMySQL(date) {
    if (!date) return null;
    const d = new Date(date);
    return d.toISOString().slice(0, 19).replace("T", " ");
    // "2025-10-18 03:00:00"
  }

  async function handleAssumir(item) {
    if (item.responsavel === true) {
      toast.warn("agenda ja assumida");
      return;
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
        contato_com_sucesso: item.contato_com_sucesso,
        nova_data: formatDateForMySQL(item.nova_data),
        responsavel: name,
        forma_contato: item.forma_contato,
        tel_contato: item.tel_contato,
        obs: item.obs,
        finalizado: item.finalizado,
        data_assumir: brasilDate,
      });
      toast.success(res.data);
      console.log(res);
      setDatabase((prev) =>
        prev.map((info) =>
          info.id === item.id ? { ...info, responsavel: name } : info
        )
      );
    } catch (error) {
      console.log(error);
      toast.error(error.response?.data || error.message);
    }
  }

  async function GetBaseData() {
    try {
      const res = await axios.get(`${Url}/`);

      setDatabase(res.data.filter((item) => item.id === idNumber));
    } catch (error) {
      toast.error(`ERROR - ${error.message}`);
    }
  }

  useEffect(() => {
    GetBaseData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e, item) {
    e.preventDefault();
    const dadosForm = ref.current[item.id];

    if (
      (dadosForm.movimento.value === "Instalação Reagendada" ||
        dadosForm.movimento.value === "Instalação Antecipada") &&
      !dadosForm.novaData.value
    )
      return toast.warning("Erro: Preencha todos os campos obrigatórios!");

    if (
      !dadosForm.movimento.value ||
      !dadosForm.contatoComSucesso.value ||
      !dadosForm.formaContato.value ||
      !dadosForm.telefoneContato.value
    ) {
      return toast.warning("Erro: Preencha todos os campos obrigatórios!1");
    }
    console.log(dadosForm.movimento.value);
    console.log(dadosForm.contatoComSucesso.value);
    console.log(dadosForm.telefoneContato.value);
    console.log(dadosForm.formaContato.value);
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
        movimento: dadosForm.movimento.value,
        contato_com_sucesso: dadosForm.contatoComSucesso.value,
        nova_data: formatDateForMySQL(item.dt_abertura_os),
        responsavel: item.responsavel,
        forma_contato: dadosForm.formaContato.value,
        tel_contato: dadosForm.telefoneContato.value,
        obs: dadosForm.observacao.value,
        finalizado: true,
        data_assumir: brasilDate,
      });

      toast.success(res.data);
      console.log(res);
      console.log(res.data);

      setDatabase((prev) =>
        prev.map((info) =>
          info.id === item.id ? { ...info, finalizado: true } : info
        )
      );
    } catch (error) {
      console.log(error.message);

      toast.error(error.response?.data || error.message);
    }
  }

  return (
    <Container key={id}>
      <main className={Style.main}>
        <section className={Style.btnSecttion}>
          <RenameTitle initialTitle={"P&P - Agenda"} />

          <LinkButton
            to={"/Agenda"}
            text={"Voltar"}
            className={Style.btnVoltar}
          />
          <LinkButton
            to={"/Relatorio"}
            text={"Relatorio"}
            className={Style.btnVoltar}
          />
        </section>
        <section className={Style.sectionDataBase}>
          {database.length > 0 ? (
            database.map((item) => {
              return (
                <section key={item.id} className={Style.sectionItem}>
                  <h1>{`DDD ${item.ddd_mun} ${item.flag_rota}`}</h1>
                  <section className={Style.gridInfo}>
                    <div>
                      <h4> nr_contrato</h4>
                      <p>{item.nr_contrato}</p>
                    </div>
                    <div>
                      <h4>sk_data</h4>
                      <p>
                        {item.sk_data
                          ? new Date(item.sk_data).toLocaleString("pt-BR", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                            })
                          : ""}
                      </p>
                    </div>
                    <div>
                      <h4>canal_venda_subgrupo</h4>
                      <p>{item.nm_canal_venda_subgrupo}</p>
                    </div>
                    <div>
                      <h4>periodo_agendamento</h4>
                      <p>{item.nm_periodo_agendamento}</p>
                    </div>
                    <div>
                      <h4> desc_mun</h4>
                      <p>{item.desc_mun}</p>
                    </div>

                    <div>
                      <h4> segmento_porte</h4>
                      <p>{item.segmento_porte}</p>
                    </div>
                    <div>
                      <h4> territorio</h4>
                      <p>{item.territorio}</p>
                    </div>

                    <div>
                      <h4>flag_agenda_futura</h4>
                      <p>{item.flag_agenda_futura}</p>
                    </div>
                    <div>
                      <h4>data_futura</h4>
                      <p>
                        {item.data_futura
                          ? new Date(item.data_futura).toLocaleString("pt-BR", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                            })
                          : ""}
                      </p>
                    </div>
                    <div>
                      <h4> motivo_quebra_d1</h4>
                      <p>{item.motivo_quebra_d1}</p>
                    </div>
                    <div>
                      <h4> motivo_quebra_ult</h4>
                      <p>{item.motivo_quebra_ult}</p>
                    </div>
                    <div>
                      <h4> dt_quebra_ult</h4>
                      <p>
                        {item.dt_quebra_ult
                          ? new Date(item.dt_quebra_ult).toLocaleString(
                              "pt-BR",
                              {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                              }
                            )
                          : ""}
                      </p>
                    </div>
                    <div>
                      <h4>cd_operadora</h4>
                      <p>{item.cd_operadora}</p>
                    </div>
                    <div>
                      <h4> dt_abertura_os</h4>
                      <p>
                        {item.dt_abertura_os
                          ? new Date(item.dt_abertura_os).toLocaleString(
                              "pt-BR",
                              {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                              }
                            )
                          : ""}
                      </p>
                    </div>
                  </section>

                  {item.responsavel &&
                    !item.finalizado &&
                    login === item.responsavel && (
                      <form
                        className={Style.inputs}
                        ref={(el) => (ref.current[item.id] = el)}
                      >
                        <div>
                      
                        </div>
                        <div>
                          <label htmlFor="movimento">Movimento:</label>
                          <select
                            onChange={(e) => {
                              setHidden(e.target.value);
                            }}
                            name="movimento"
                            className={Style.inputSelect}
                          >
                            <option value="">Selecione a movimentação</option>
                            <option value="Agenda Mantida">
                              Agenda Mantida
                            </option>
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
                        </div>
                        <div>
                          <label htmlFor="contatoComSucesso">
                            Contato Com Sucesso:
                          </label>

                          <select
                            name="contatoComSucesso"
                            className={Style.inputSelect}
                          >
                            <option value="">Selecione</option>
                            <option value="SIM">SIM</option>
                            <option value="NÃO">NÃO</option>
                          </select>
                        </div>

                        {(hidden === "Instalação Reagendada" ||
                          hidden === "Instalação Antecipada") && (
                          <div>
                            <label htmlFor="novaData">DATA :</label>
                            <input
                              type="date"
                              text="Nova Data"
                              name="novaData"
                              placeholder="Escolha a nova data"
                            />
                          </div>
                        )}

                        <div>
                          <label htmlFor="formaContato">Forma de contato</label>
                          <select name="formaContato" className="inputSelect">
                            <option value="">
                              Selecione a forma de contato
                            </option>
                            <option value="Whatsapp">Whatsapp</option>
                            <option value="Ligação">Ligação</option>
                          </select>
                        </div>

                        <textarea
                          name="observacao"
                          placeholder="Digite aqui alguma observação"
                          className="inputTextarea"
                        />
                      </form>
                    )}
                  <section className={Style.btns}>
                    {!admin && !item.responsavel ? (
                      <button
                        disabled={item.responsavel ? true : false}
                        onClick={() => handleAssumir(item)}
                      >
                        Assumir
                      </button>
                    ) : null}

                    {item.responsavel &&
                      !item.finalizado &&
                      login === item.responsavel && (
                        <button
                          onClick={(e) => {
                            handleSubmit(e, item);
                          }}
                        >
                          Salvar
                        </button>
                      )}
                  </section>
                </section>
              );
            })
          ) : (
            <p>Nenhum dado encontrado</p>
          )}
        </section>
      </main>
    </Container>
  );
}

/*

{
    "id": 1,
    "sk_data": "2025-10-18T03:00:00.000Z",
    "nm_canal_venda_subgrupo": "Ativo Aquisição Indireto",
    "nm_parceiro": "TEL TELEMATICA E MARKETING LTDA",
    "nm_periodo_agendamento": "15:00 - 18:00",
    "desc_mun": "SAO JOSE DO RIO PRETO",
    "ddd_mun": 12,
    "segmento_porte": "Grandes Mercados",
    "territorio": "OESTE",
    "flag_rota": "AGENDA FUTURA",
    "flag_agenda_futura": "48h",
    "data_futura": "2025-10-20T03:00:00.000Z",
    "motivo_quebra_d1": "Não Informado",
    "motivo_quebra_ult": "106 CLIENTE AUSENTE",
    "dt_quebra_ult": "2025-10-13T03:00:00.000Z",
    "cd_operadora": 6,
    "nr_contrato": "17932444",
    "dt_abertura_os": "2025-10-11T14:56:00.000Z",
    "contato_com_sucesso": null,
    "nova_data": null,
    "responsavel": null,
    "forma_de_contato": null,
    "telefone_contato": null,
    "obs": null

    {
    id,
    sk_data,
    nm_canal_venda_subgrupo,
    nm_parceiro, 
    nm_periodo_agendamento, 
    desc_mun,
    ddd_mun, 
    segmento_porte, 
    territorio, 
    flag_rota, 
    flag_agenda_futura, 
    data_futura, 
    motivo_quebra_d1, 
    motivo_quebra_ult, 
    dt_quebra_ult, 
    cd_operadora,
    nr_contrato,
    dt_abertura_os,
    contato_com_sucesso, 
    nova_data, 
    responsavel, 
    forma_de_contato, 
    telefone_contato, 
    obs, 
  },
  },
*/
