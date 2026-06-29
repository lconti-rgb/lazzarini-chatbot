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
    from: 'chatbot@lazzariniarredamento.it',
    to: process.env.LEAD_EMAIL,
    subject: `Nuovo lead chatbot: ${name}`,
    html: `
      <h2>Nuovo lead dal chatbot</h2>
      <p><strong>Nome:</strong> ${esc(name)}</p>
      <p><strong>Email:</strong> ${esc(email)}</p>
      <p><strong>Riepilogo conversazione:</strong><br>${esc(summary ?? 'Non disponibile')}</p>
    `,
  });

  return res.status(200).json({ ok: true });
}
