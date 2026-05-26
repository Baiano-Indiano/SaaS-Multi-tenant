import { Resend } from "resend";

export const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

interface SecurityAlertParams {
  to: string;
  userName: string;
  ip: string;
  userAgent: string;
  location?: string; // Future: Add geo-ip support
}

function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Sends a security alert email when a new login environment is detected.
 */
export async function sendSecurityAlertEmail({
  to,
  userName,
  ip,
  userAgent,
  location = "Localização não identificada",
}: SecurityAlertParams) {
  if (!resend) {
    console.warn(`[Mail] Resend API key missing. Skipping security alert to ${to}. (Environment: ${location}, IP: ${ip})`);
    return;
  }
  try {
    const safeUserName = escapeHtml(userName);
    const safeIp = escapeHtml(ip);
    const safeLocation = escapeHtml(location);
    const safeUserAgent = escapeHtml(userAgent);

    await resend.emails.send({
      from: "Security <security@mg.vittis.com.br>", // Replace with verified domain in production
      to,
      subject: "Alerte de Segurança: Novo Login Detectado",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
          <h2 style="color: #d32f2f;">Novo login não reconhecido</h2>
          <p>Olá, <strong>${safeUserName}</strong>,</p>
          <p>Detectamos um novo login na sua conta a partir de um dispositivo ou local que você não costuma usar.</p>
          
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 4px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>IP:</strong> ${safeIp}</p>
            <p style="margin: 5px 0;"><strong>Localização:</strong> ${safeLocation}</p>
            <p style="margin: 5px 0;"><strong>Dispositivo:</strong> ${safeUserAgent}</p>
          </div>

          <p>Se foi você, pode ignorar este e-mail. Se você <strong>não reconhece</strong> este acesso, por favor:</p>
          <ol>
            <li>Mude sua senha imediatamente.</li>
            <li>Revogue sessões ativas no seu painel de configurações.</li>
            <li>Ative a Autenticação de Dois Fatores (2FA) se ainda não o fez.</li>
          </ol>
          
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #777;">Este é um e-mail automático de segurança. Por favor, não responda.</p>
        </div>
      `,
    });
    console.log(`[Mail] Security alert sent to ${to}`);
  } catch (error) {
    console.error(`[Mail Error] Failed to send security alert to ${to}:`, error);
  }
}
