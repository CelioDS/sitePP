import { toast } from "react-toastify";
import axios from "axios";

export function ImportarCotas(Url, ultimaAtualizacao) {
  const importar = async () => {
    if (!podeExecutarAgora(ultimaAtualizacao)) {
      return;
    }

    try {
      // Dispara as duas requisições simultaneamente
      const [resLocal, resNeon] = await Promise.all([
        axios.get(`${Url}/import-cotas-cop`),
        axios.get(`${Url}/neon/import-cotas-cop`),
      ]);

      // Se chegou aqui, ambos tiveram sucesso
      toast.success("Importação concluída (Local e Neon)");
      console.log("Local:", resLocal.data, "Neon:", resNeon.data);
    } catch (err) {
      // Identifica onde ocorreu o erro para facilitar o debug
      console.error("Erro na importação:", err);

      if (err.response) {
        toast.error(`Falha: ${err.response.data.error || "Erro no servidor"}`);
      } else {
        toast.error("Erro de conexão ao importar dados");
      }
    }
  };

  importar();
}

function podeExecutarAgora(ultimaAtualizacao) {
  const agora = new Date();
  const diaSemana = agora.getDay();
  const horaAtual = agora.getHours();
  const minutoAtual = agora.getMinutes();

  // 1. Segunda (1) a Sexta (5)
  if (diaSemana < 1 || diaSemana > 5) return false;

  // 2. Das 09h às 18h (Para às 18:00)
  if (horaAtual < 9 || horaAtual >= 18) return false;

  // 3. Janela específica: entre o minuto 11 e 19
  // Se quiser que rode em qualquer momento após o minuto 10, use (minutoAtual <= 10)
  if (minutoAtual < 10) return false; // Bloqueia apenas os primeiros 10 min

  // 4. Validação de "1 vez por hora"
  if (ultimaAtualizacao) {
    try {
      // Tenta extrair a hora indpendente de vírgula ou espaço
      const apenasHoraStr = ultimaAtualizacao.match(/(\d{2}):/)[1];
      const ultimaHora = Number(apenasHoraStr);

      if (!isNaN(ultimaHora) && ultimaHora === horaAtual) {
        console.log("Já atualizado nesta hora.");
        return false;
      }
    } catch (e) {
      console.error("Erro ao processar string de data:", e);
    }
  }

  return true;
}
