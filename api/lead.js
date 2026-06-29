import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

async function saveToKV(lead) {
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) return;
  try {
    const { kv } = await import('@vercel/kv');
    await kv.set(`lead:${Date.now()}`, lead);
  } catch (err) {
    console.warn('[/api/lead] KV not available, skipping backup:', err.message);
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, summary } = req.body;

  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  if (!name || !email) {
    return res.status(400).json({ error: 'name e email sono richiesti' });
  }

  const lead = {
    name,
    email,
    summary: summary ?? '',
    createdAt: new Date().toISOString(),
  };

  await saveToKV(lead);

  await resend.emails.send({
    from: process.env.RESEND_FROM ?? 'onboarding@resend.dev',
    to: process.env.LEAD_EMAIL,
    subject: `Nuovo lead chatbot: ${name} (${summary.split('\n').length} messaggi)`,
    html: `
<!DOCTYPE html>
<html lang="it">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr>
          <td style="background:#2c2c2c;padding:24px 32px;">
            <p style="margin:0;font-size:11px;color:#c9a96e;letter-spacing:2px;text-transform:uppercase;">Lazzarini Arredamento</p>
            <h1 style="margin:4px 0 0;font-size:20px;color:#ffffff;font-weight:600;">Nuovo lead dal chatbot</h1>
          </td>
        </tr>

        <!-- Dati cliente -->
        <tr>
          <td style="padding:28px 32px 0;">
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e8e8e8;border-radius:6px;overflow:hidden;">
              <tr style="background:#f9f9f9;">
                <td style="padding:12px 16px;width:120px;font-size:13px;color:#888;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Nome</td>
                <td style="padding:12px 16px;font-size:15px;color:#2c2c2c;font-weight:600;">${esc(name)}</td>
              </tr>
              <tr style="border-top:1px solid #e8e8e8;">
                <td style="padding:12px 16px;font-size:13px;color:#888;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Email</td>
                <td style="padding:12px 16px;font-size:15px;"><a href="mailto:${esc(email)}" style="color:#c9a96e;text-decoration:none;">${esc(email)}</a></td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Riepilogo -->
        <tr>
          <td style="padding:24px 32px 0;">
            <p style="margin:0 0 10px;font-size:13px;color:#888;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Riepilogo conversazione</p>
            <div style="background:#f9f9f9;border-left:3px solid #c9a96e;padding:16px;border-radius:0 6px 6px 0;font-size:14px;line-height:1.7;">
              ${(summary ?? 'Non disponibile').split('\n').map(line => {
                const isBot = line.startsWith('Bot:');
                const color = isBot ? '#2c2c2c' : '#c9a96e';
                const label = isBot ? 'Bot' : 'Cliente';
                const text = esc(line.replace(/^(Bot|Cliente):\s*/, ''));
                return `<p style="margin:0 0 6px;"><span style="font-weight:700;color:${color};font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">${label}</span><br><span style="color:#444;">${text}</span></p>`;
              }).join('')}
            </div>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:24px 32px 28px;">
            <p style="margin:0;font-size:12px;color:#bbb;text-align:center;">
              Lazzarini Arredamento · Via Provinciale 15, Lurano BG · 035 487 7483
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`,
  });

  return res.status(200).json({ ok: true });
}
