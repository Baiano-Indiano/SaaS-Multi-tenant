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

interface AnomalyAlertEmailParams {
  to: string;
  orgName: string;
  type: "MFA_SPIKE" | "WEBHOOK_SURGE";
  details: string;
}

/**
 * Sends a critical security alert email when an anomaly is identified.
 */
export async function sendAnomalyAlertEmail({
  to,
  orgName,
  type,
  details,
}: AnomalyAlertEmailParams) {
  if (!resend) {
    console.warn(`[Mail] Resend API key missing. Skipping anomaly alert to ${to}. (Org: ${orgName}, Type: ${type})`);
    return;
  }
  try {
    const safeOrgName = escapeHtml(orgName);
    const safeDetails = escapeHtml(details);
    const typeLabel = type === "MFA_SPIKE" 
      ? "Pico de Falhas de MFA / Brute-Force" 
      : "Surto de Consumo de Webhooks";
      
    const subject = `Alerta de Segurança: Anomalia Detectada (${type === "MFA_SPIKE" ? "MFA Spike" : "Webhook Surge"})`;

    await resend.emails.send({
      from: "Security <security@mg.vittis.com.br>", // Replace with verified domain in production
      to,
      subject,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
          <h2 style="color: #d32f2f; margin-top: 0;">Alerta de Segurança Crítico</h2>
          <p>Olá,</p>
          <p>Identificamos um comportamento anômalo e potencialmente suspeito na organização <strong>${safeOrgName}</strong>.</p>
          
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 4px; margin: 20px 0; border-left: 4px solid #d32f2f;">
            <p style="margin: 5px 0;"><strong>Tipo de Evento:</strong> ${typeLabel}</p>
            <p style="margin: 5px 0;"><strong>Detalhes:</strong> ${safeDetails}</p>
            <p style="margin: 5px 0;"><strong>Data/Hora:</strong> ${new Date().toLocaleString()}</p>
          </div>

          <p><strong>Ações Recomendadas:</strong></p>
          ${
            type === "MFA_SPIKE" 
              ? `<ol>
                  <li>Revise a lista de membros e sessões ativas no painel da organização.</li>
                  <li>Monitore IPs de origem das requisições recentes no log de auditoria.</li>
                  <li>Considere forçar a alteração de senhas dos administradores se houver suspeita de vazamento de credenciais.</li>
                 </ol>`
              : `<ol>
                  <li>Revise as integrações ativas e os destinos de webhooks configurados.</li>
                  <li>Revogue chaves de API recentes se o tráfego anômalo vier de integrações automatizadas.</li>
                  <li>Monitore o consumo no painel de cobrança para evitar cobranças excedentes não autorizadas.</li>
                 </ol>`
          }
          
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #777;">Este é um e-mail de segurança automatizado emitido pela central de monitoramento de anomalias da plataforma. Por favor, não responda.</p>
        </div>
      `,
    });
    console.log(`[Mail] Anomaly alert sent to ${to}`);
  } catch (error) {
    console.error(`[Mail Error] Failed to send anomaly alert to ${to}:`, error);
  }
}
