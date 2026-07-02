import nodemailer from "nodemailer";

export const enviarEmailMudancaStatus = async ({
  email,
  nome,
  statusAntigo,
  statusNovo,
  chamadoId,
}) => {
  const transporter = nodemailer.createTransport({
    host: "smtp.office365.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.OUTLOOK_USER,
      pass: process.env.OUTLOOK_PASS,
    },
  });

  const html = `
    <h2>Atualização de Chamado</h2>
    <p>Olá ${nome},</p>
    <p>O status do seu chamado <b>#${chamadoId}</b> foi atualizado:</p>

    <p><b>De:</b> ${statusAntigo}</p>
    <p><b>Para:</b> ${statusNovo}</p>

    <br>
    <p>Equipe P&P HUB</p>
  `;

  await transporter.sendMail({
    from: `"P&P HUB" <${process.env.OUTLOOK_USER}>`,
    to: email,
    subject: `Atualização de Chamado #${chamadoId}`,
    html,
  });
};