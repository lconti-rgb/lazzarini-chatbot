# Lazzarini Chatbot — Guida per il team

Widget chatbot AI per [lazzariniarredamento.it](https://www.lazzariniarredamento.it).
Stack: Vanilla JS + Vercel Serverless Functions + Claude Haiku API + Resend email.

## Setup locale

```bash
npm install
npm run build   # genera public/widget.bundle.js
npm test        # 8 test, tutti devono passare
```

## Variabili d'ambiente

Per sviluppare in locale crea un file `.env.local` (non committare):

```
ANTHROPIC_API_KEY=sk-ant-...
RESEND_API_KEY=re_...
LEAD_EMAIL=l.conti@webmobili.it
RESEND_FROM=onboarding@resend.dev
```

Per produzione le variabili sono su Vercel (dashboard → Settings → Environment Variables).

## Struttura

```
api/
  chat.js        # proxy SSE verso Claude Haiku, rate limiting 10 req/min/IP
  lead.js        # salva lead e manda email via Resend
prompts/
  system.txt     # prompt di sistema del Pre-Arredatore AI — modificare qui il comportamento
src/
  widget.js      # widget IIFE vanilla JS
  widget.css     # stili del widget
public/
  widget.bundle.js  # output del build (CSS inlined) — NON modificare a mano
build.js         # script che genera widget.bundle.js
```

## Workflow

1. Modifica `src/widget.js` o `src/widget.css`
2. Esegui `npm run build` per rigenerare il bundle
3. Committa sia i sorgenti che `public/widget.bundle.js`

Per modificare il comportamento del chatbot: edita solo `prompts/system.txt` — non serve rebuild.

## Deploy

Il deploy è automatico su push a `master` via Vercel.
URL produzione: [lazzarini-chatbot.vercel.app](https://lazzarini-chatbot.vercel.app)
Widget URL: `https://lazzarini-chatbot.vercel.app/widget.bundle.js`

## Installazione su WordPress

Tramite WPCode (o qualsiasi plugin snippet): aggiungi questo nell'HTML del footer:

```html
<script src="https://lazzarini-chatbot.vercel.app/widget.bundle.js" defer></script>
```

## Brand e showroom

I dati del negozio e i brand sono in `prompts/system.txt`.
Brand: B&B Italia, Cassina, Edra, Flexform, Flos, Flou, Molteni&C, Poliform, Poltrona Frau, Rimadesio, Valcucine, Vitra.
