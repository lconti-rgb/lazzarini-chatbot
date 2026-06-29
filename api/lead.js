import { Resend } from 'resend';
import { kv } from '@vercel/kv';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, summary } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: 'name e email sono richiesti' });
  }

  const lead = {
    name,
    email,
    summary: summary ?? '',
    createdAt: new Date().toISOString(),
  };

  const key = `lead:${Date.now()}`;
  await kv.set(key, lead);

  await resend.emails.send({
    from: 'chatbot@lazzariniarredamento.it',
    to: process.env.LEAD_EMAIL,
    subject: `Nuovo lead chatbot: ${name}`,
    html: `
      <h2>Nuovo lead dal chatbot</h2>
      <p><strong>Nome:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Riepilogo conversazione:</strong><br>${summary ?? 'Non disponibile'}</p>
    `,
  });

  return res.status(200).json({ ok: true });
}
