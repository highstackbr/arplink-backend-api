import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type Transporter from 'nodemailer/lib/mailer';

export interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

@Injectable()
export class EmailService {
  private transporter: Transporter | null = null;
  private from: string = '';
  private brevoApiKey: string | null = null;
  private isConfigured = false;

  constructor(private readonly config: ConfigService) {
    const from = this.config.get<string>('ARPLINK_EMAIL_FROM');
    const apiKey = this.config.get<string>('BREVO_API_KEY');

    if (apiKey && from) {
      this.brevoApiKey = apiKey;
      this.from = from;
      this.isConfigured = true;
      return;
    }

    const host = this.config.get<string>('SMTP_HOST');
    const user = this.config.get<string>('SMTP_USER');
    const pass = this.config.get<string>('SMTP_PASS');
    if (host && user && pass && from) {
      this.from = from;
      const port = this.config.get<number>('SMTP_PORT') ?? 587;
      const secure = this.config.get<boolean>('SMTP_SECURE') ?? false;
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: { user, pass },
        connectionTimeout: 20_000,
        greetingTimeout: 15_000,
        socketTimeout: 30_000,
      });
      this.isConfigured = true;
    }
  }

  isEmailConfigured(): boolean {
    return this.isConfigured;
  }

  async sendMail(options: SendMailOptions): Promise<void> {
    if (this.brevoApiKey) {
      await this.sendViaBrevoApi(options);
      return;
    }
    if (!this.transporter) {
      throw new Error(
        'E-mail não configurado. Defina BREVO_API_KEY + ARPLINK_EMAIL_FROM (recomendado) ou SMTP_HOST, SMTP_USER, SMTP_PASS e ARPLINK_EMAIL_FROM.',
      );
    }
    await this.transporter.sendMail({
      from: this.from,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });
  }

  private async sendViaBrevoApi(options: SendMailOptions): Promise<void> {
    const res = await fetch(BREVO_API_URL, {
      method: 'POST',
      headers: {
        'api-key': this.brevoApiKey!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sender: { email: this.from, name: 'ARP LINK' },
        to: [{ email: options.to }],
        subject: options.subject,
        htmlContent: options.html,
        textContent: options.text ?? undefined,
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Brevo API: ${res.status} ${res.statusText}${body ? ` - ${body}` : ''}`);
    }
  }

  private getFrontendUrl(): string {
    const url = this.config.get<string>('FRONTEND_URL');
    if (!url) throw new Error('FRONTEND_URL não configurado.');
    return url.replace(/\/$/, '');
  }

  /** Template de boas-vindas após cadastro */
  getSignupWelcomeHtml(params: { name: string; loginUrl: string }): string {
    const { name, loginUrl } = params;
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bem-vindo à ARP LINK</title>
  <style>
    body { font-family: 'Open Sans', Helvetica, Arial, sans-serif; background-color: #F6F6F6; margin: 0; padding: 0; }
    .wrapper { width: 100%; background-color: #F6F6F6; padding: 40px 20px; }
    .main { background-color: #ffffff; max-width: 600px; margin: 0 auto; color: #3C4043; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05); }
    .header { background-color: #004A79; padding: 40px; text-align: center; }
    .content { padding: 40px; line-height: 1.6; }
    .footer { padding: 20px; text-align: center; font-size: 12px; color: #64748B; }
    .button { background-color: #004A79; color: #ffffff !important; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block; margin-top: 25px; }
    .logo-text { color: #ffffff; font-size: 24px; font-weight: bold; letter-spacing: 2px; }
    h1 { color: #004A79; font-size: 24px; margin-bottom: 20px; }
    p { font-size: 16px; color: #64748B; margin-bottom: 10px; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="main">
      <div class="header">
        <div class="logo-text">ARP LINK</div>
        <div style="color: #B3C3DA; font-size: 10px; text-transform: uppercase; margin-top: 5px; font-weight: bold;">Rede Social de Drones</div>
      </div>
      <div class="content">
        <h1>Seja bem-vindo, ${escapeHtml(name)}!</h1>
        <p>Sua conta na ARP LINK foi criada com sucesso.</p>
        <p>Você já pode acessar a maior rede vertical de drones da América Latina. Faça login e explore o feed, cursos e oportunidades.</p>
        <a href="${escapeHtml(loginUrl)}" class="button">Acessar minha conta</a>
        <p style="margin-top: 30px; font-size: 13px;">Se você não criou esta conta, ignore este e-mail.</p>
      </div>
      <div class="footer">
        <p>© ${new Date().getFullYear()} ARP LINK - Todos os direitos reservados.</p>
      </div>
    </div>
  </div>
</body>
</html>`;
  }

  /** Template de recuperação de senha */
  getPasswordResetHtml(params: { resetUrl: string; expiresInMinutes: number }): string {
    const { resetUrl, expiresInMinutes } = params;
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Recuperação de senha - ARP LINK</title>
  <style>
    body { font-family: 'Open Sans', Helvetica, Arial, sans-serif; background-color: #F6F6F6; margin: 0; padding: 0; }
    .wrapper { width: 100%; background-color: #F6F6F6; padding: 40px 20px; }
    .main { background-color: #ffffff; max-width: 600px; margin: 0 auto; color: #3C4043; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05); }
    .header { background-color: #004A79; padding: 40px; text-align: center; }
    .content { padding: 40px; line-height: 1.6; }
    .footer { padding: 20px; text-align: center; font-size: 12px; color: #64748B; }
    .button { background-color: #004A79; color: #ffffff !important; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block; margin-top: 25px; }
    .logo-text { color: #ffffff; font-size: 24px; font-weight: bold; letter-spacing: 2px; }
    h1 { color: #004A79; font-size: 24px; margin-bottom: 20px; }
    p { font-size: 16px; color: #64748B; margin-bottom: 10px; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="main">
      <div class="header">
        <div class="logo-text">ARP LINK</div>
        <div style="color: #B3C3DA; font-size: 10px; text-transform: uppercase; margin-top: 5px; font-weight: bold;">Recuperação de senha</div>
      </div>
      <div class="content">
        <h1>Redefinir sua senha</h1>
        <p>Recebemos uma solicitação para redefinir a senha da sua conta ARP LINK.</p>
        <p>Clique no botão abaixo para criar uma nova senha. Este link expira em ${expiresInMinutes} minutos.</p>
        <a href="${escapeHtml(resetUrl)}" class="button">Redefinir senha</a>
        <p style="margin-top: 30px; font-size: 13px;">Se você não solicitou essa alteração, ignore este e-mail. Sua senha permanecerá a mesma.</p>
      </div>
      <div class="footer">
        <p>© ${new Date().getFullYear()} ARP LINK - Todos os direitos reservados.</p>
      </div>
    </div>
  </div>
</body>
</html>`;
  }

  async sendSignupWelcome(to: string, name: string): Promise<void> {
    const loginUrl = `${this.getFrontendUrl()}/login`;
    const html = this.getSignupWelcomeHtml({ name: name || 'Piloto', loginUrl });
    await this.sendMail({
      to,
      subject: 'Bem-vindo à ARP LINK – sua conta foi criada',
      html,
    });
  }

  async sendPasswordReset(to: string, resetToken: string, expiresInMinutes: number): Promise<void> {
    const baseUrl = this.getFrontendUrl();
    const resetUrl = `${baseUrl}/reset-password?token=${encodeURIComponent(resetToken)}`;
    const html = this.getPasswordResetHtml({ resetUrl, expiresInMinutes });
    await this.sendMail({
      to,
      subject: 'Redefinir sua senha - ARP LINK',
      html,
    });
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
