import { toast } from "react-toastify";
import axios from "axios";

export function ImportarCotas(Url, ultimaAtualizacao) {
  const importar = async () => {
    if (!podeExecutarAgora(ultimaAtualizacao)) {
      return;
    }

    try {
      const res = await axios.get(`${Url}/import-cotas-cop`);
      const data = res.data;
      toast.success(data.message || "Importação concluída");
    } catch (err) {
      toast.error("Erro ao importar");
    }
  };

  importar();
}function podeExecutarAgora(ultimaAtualizacao) {
  const agora = new Date();
  const dia = agora.getDay();
  const hora = agora.getHours();
  const minuto = agora.getMinutes();

  // Segunda a sexta
  if (dia < 1 || dia > 5) return false;

  // Das 09h às 18h
  if (hora < 9 || hora > 18 ) return false;

  // Após o minuto 10
  if (minuto <= 10 || minuto >=20 ) return false;

  // Validação "1 vez por hora", baseada na última atualização
  if (ultimaAtualizacao) {
    const partes = ultimaAtualizacao.split(",");
    if (partes[1]) {
      const horaStr = partes[1].trim().split(":")[0];
      const ultimaHora = Number(horaStr);

      console.log(ultimaHora, hora)
      if (!isNaN(ultimaHora) && ultimaHora === hora) {
        return false;
      }
    }
  }


  return true;
}