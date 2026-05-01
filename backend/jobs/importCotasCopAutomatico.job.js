// jobs/importCotasCopAutomatico.job.js
import cron from "node-cron";
import { importarCotasCop } from "../Controllers/Cotas.js";
import { importarCotasCopNeon } from "../ControllersNeon/neon.js";

cron.schedule(
  "10 9-18 * * *",
  //"10 9-18 * * *",
  async () => {
    console.log("[CRON] Importando cotas COP");
    await importarCotasCop();
    await importarCotasCopNeon();
  },
  {
    timezone: "America/Sao_Paulo",
  },
);
