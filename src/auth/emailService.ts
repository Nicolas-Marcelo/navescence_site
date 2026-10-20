import nodemailer from "nodemailer";

import { config } from "../config/env.js";

type VerificationEmailData = {
  to: string;
  name: string;
  token: string;
};

function smtpConfigurado(): boolean {
  return Boolean(
    config.smtp.host &&
      config.smtp.user &&
      config.smtp.password,
  );
}

function verificationUrl(
  token: string,
): string {
  const baseUrl =
    config.web.publicBaseUrl
      .replace(/\/+$/, "");

  return (
    `${baseUrl}/verificar-email.html` +
    `?token=${encodeURIComponent(token)}`
  );
}

function transporter() {
  return nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.secure,

    auth: {
      user: config.smtp.user,
      pass: config.smtp.password,
    },
  });
}

export async function
sendVerificationEmail(
  data: VerificationEmailData,
): Promise<void> {
  const url =
    verificationUrl(data.token);

  if (!smtpConfigurado()) {
    console.log(
      "\n[EMAIL] SMTP não configurado.",
    );

    console.log(
      `[EMAIL] Verificação de ${data.to}:`,
    );

    console.log(`${url}\n`);

    return;
  }

  const mailer = transporter();

  await mailer.sendMail({
    from: config.smtp.from,
    to: data.to,

    subject:
      "Confirme seu e-mail - NAVESCENCE",

    text:
      `Olá, ${data.name}.\n\n` +
      "Seu cadastro no NAVESCENCE foi realizado.\n\n" +
      "Confirme seu endereço de e-mail acessando:\n" +
      `${url}\n\n` +
      `Este link expira em ${config.auth.verificationMinutes} minutos.\n\n` +
      "Se você não realizou este cadastro, ignore esta mensagem.",

    html: `
      <div
        style="
          font-family: Arial, sans-serif;
          max-width: 560px;
          margin: 0 auto;
          color: #1f2933;
        "
      >
        <h2
          style="
            color: #102f46;
          "
        >
          NAVESCENCE
        </h2>

        <p>
          Olá, <strong>${escapeHtml(data.name)}</strong>.
        </p>

        <p>
          Seu cadastro no NAVESCENCE foi realizado.
          Para utilizar sua conta, confirme seu endereço de e-mail.
        </p>

        <p style="margin: 28px 0;">
          <a
            href="${url}"
            style="
              display: inline-block;
              background: #102f46;
              color: white;
              padding: 12px 20px;
              border-radius: 8px;
              text-decoration: none;
              font-weight: bold;
            "
          >
            Confirmar e-mail
          </a>
        </p>

        <p>
          Este link expira em
          ${config.auth.verificationMinutes} minutos.
        </p>

        <p
          style="
            color: #64748b;
            font-size: 13px;
          "
        >
          Se você não realizou este cadastro,
          ignore esta mensagem.
        </p>
      </div>
    `,
  });

  console.log(
    `[EMAIL] Verificação enviada para ${data.to}.`,
  );
}

function escapeHtml(
  value: string,
): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}