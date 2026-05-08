// jobs/importCotasCopAutomatico.job.js
import cron from "node-cron";
import { importarCotasCop } from "../Controllers/Cotas.js";
import { importarCotasCopNeon } from "../ControllersNeon/neon.js";

/* Comentario
  Esse cron agenda a execução automática das funções:
  - importarCotasCop
  - importarCotasCopNeon

  EXPRESSÃO CRON: "10 9-18 * * *"

  Significado:
  ┌──────── minuto (10)
  │ ┌────── hora (9 até 18)
  │ │ ┌──── dia do mês (* = qualquer)
  │ │ │ ┌── mês (* = qualquer)
  │ │ │ │ ┌ dia da semana (* = qualquer)
  │ │ │ │ │
  │ │ │ │ │
  10 9-18 * * *

  ✅ Executa todo dia
  ✅ Das 09h até 18h
  ✅ Sempre no minuto 10 de cada hora

  Ou seja:
  09:10, 10:10, 11:10 ... até 18:10

  ⚠️ OBS: atualmente roda TODOS os dias.
  Se quiser só de segunda a sexta, deveria usar:
  "10 9-18 * * 1-5"
*/

cron.schedule(
  "10 9-18 * * *",
  async () => {
    console.log("[CRON] Importando cotas COP");
    await importarCotasCop();
    await importarCotasCopNeon();
  },
  {
    timezone: "America/Sao_Paulo",
  },
);
