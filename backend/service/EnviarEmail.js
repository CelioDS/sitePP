import dotenv from "dotenv";
import { Resend } from "resend";
dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export async function enviarEmailMudancaStatus({
  emailDestino,
  nomeResponsavel,
  idChamado,
  statusAnterior,
  statusNovo,
  numeroChamado,
  descricaoResponsavel,
  tipoSolicitacao,
  nomeCliente,
  sistema,
}) {
  if (!emailDestino) {
    return { enviado: false, motivo: "Sem emailDestino" };
  }

  const assunto = `Atualização do chamado #${idChamado} - ${statusNovo}`;

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #222;">
      <h2 style="margin-bottom: 8px;">Atualização de status do chamado</h2>

      <p>Olá, ${escapeHtml(nomeResponsavel || "responsável")}.</p>

      <p>O chamado <strong>#${escapeHtml(idChamado)}</strong> teve mudança de status.</p>

      <table cellpadding="8" cellspacing="0" border="1" style="border-collapse: collapse; width: 100%; max-width: 700px;">
        <tr>
          <td><strong>ID Chamado</strong></td>
          <td>${escapeHtml(idChamado)}</td>
        </tr>
        <tr>
          <td><strong>Status anterior</strong></td>
          <td>${escapeHtml(statusAnterior || "-")}</td>
        </tr>
        <tr>
          <td><strong>Status novo</strong></td>
          <td>${escapeHtml(statusNovo || "-")}</td>
        </tr>
        <tr>
          <td><strong>Número chamado</strong></td>
          <td>${escapeHtml(numeroChamado || "-")}</td>
        </tr>
        <tr>
          <td><strong>Tipo solicitação</strong></td>
          <td>${escapeHtml(tipoSolicitacao || "-")}</td>
        </tr>
        <tr>
          <td><strong>Sistema</strong></td>
          <td>${escapeHtml(sistema || "-")}</td>
        </tr>
        <tr>
          <td><strong>Cliente</strong></td>
          <td>${escapeHtml(nomeCliente || "-")}</td>
        </tr>
        <tr>
          <td><strong>Descrição do responsável</strong></td>
          <td>${escapeHtml(descricaoResponsavel || "-")}</td>
        </tr>
      </table>

      <p style="margin-top: 16px;">
        Esta é uma notificação automática do sistema P&P - HUB.
      </p>
    </div>
  `;

  const text = `
Atualização de status do chamado

Olá, ${nomeResponsavel || "responsável"}.

O chamado #${idChamado} teve mudança de status.

Status anterior: ${statusAnterior || "-"}
Status novo: ${statusNovo || "-"}
Número chamado: ${numeroChamado || "-"}
Tipo solicitação: ${tipoSolicitacao || "-"}
Sistema: ${sistema || "-"}
Cliente: ${nomeCliente || "-"}
Descrição do responsável: ${descricaoResponsavel || "-"}

Mensagem automática do sistema P&P - HUB.
  `;

  const { data, error } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL,
    to: [emailDestino],
    subject: assunto,
    html,
    text,
  });

  if (error) {
    throw new Error(error.message || "Erro ao enviar e-mail");
  }

  return { enviado: true, data };
}