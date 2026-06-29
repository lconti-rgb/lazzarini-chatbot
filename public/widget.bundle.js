(function () {
  'use strict';

  if (window.__lzChatLoaded) return;
  window.__lzChatLoaded = true;

  const cfg = Object.assign(
    {
      apiUrl: 'https://lazzarini-chatbot.vercel.app',
      welcomeMessage: 'Ciao! Sono l\'assistente di Lazzarini Arredamento. Come posso aiutarti oggi?',
    },
    window.LazzariniChatConfig || {}
  );

  let isOpen = false;
  let isLeadMode = false;
  const messages = [];

  function el(tag, attrs, children) {
    const node = document.createElement(tag);
    Object.entries(attrs || {}).forEach(([k, v]) => {
      if (k === 'class') node.className = v;
      else if (k.startsWith('on')) node.addEventListener(k.slice(2), v);
      else node.setAttribute(k, v);
    });
    (children || []).forEach(c =>
      node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c)
    );
    return node;
  }

  function svgIcon(path) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    p.setAttribute('d', path);
    svg.appendChild(p);
    return svg;
  }

  function injectStyles() {
    const style = document.createElement('style');
    style.textContent = "#lz-chat-bubble {\n  position: fixed;\n  bottom: 24px;\n  right: 24px;\n  width: 56px;\n  height: 56px;\n  background: #2c2c2c;\n  border-radius: 50%;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  cursor: pointer;\n  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);\n  z-index: 9998;\n  transition: transform 0.2s ease, box-shadow 0.2s ease;\n}\n\n#lz-chat-bubble:hover {\n  transform: scale(1.08);\n  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4);\n}\n\n#lz-chat-bubble svg {\n  width: 26px;\n  height: 26px;\n  fill: #ffffff;\n}\n\n#lz-chat-window {\n  position: fixed;\n  bottom: 92px;\n  right: 24px;\n  width: 360px;\n  height: 500px;\n  background: #ffffff;\n  border-radius: 16px;\n  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18);\n  display: flex;\n  flex-direction: column;\n  z-index: 9999;\n  overflow: hidden;\n  transform: translateY(20px);\n  opacity: 0;\n  pointer-events: none;\n  transition: transform 0.25s ease, opacity 0.25s ease;\n}\n\n#lz-chat-window.lz-open {\n  transform: translateY(0);\n  opacity: 1;\n  pointer-events: all;\n}\n\n#lz-chat-header {\n  background: #2c2c2c;\n  color: #ffffff;\n  padding: 14px 16px;\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  flex-shrink: 0;\n}\n\n#lz-chat-header span {\n  font-family: sans-serif;\n  font-size: 15px;\n  font-weight: 600;\n  letter-spacing: 0.3px;\n}\n\n#lz-chat-close {\n  background: none;\n  border: none;\n  color: #ffffff;\n  font-size: 20px;\n  cursor: pointer;\n  line-height: 1;\n  padding: 0 4px;\n  opacity: 0.8;\n}\n\n#lz-chat-close:hover { opacity: 1; }\n\n#lz-chat-messages {\n  flex: 1;\n  overflow-y: auto;\n  padding: 16px 14px;\n  display: flex;\n  flex-direction: column;\n  gap: 8px;\n}\n\n.lz-msg {\n  max-width: 78%;\n  padding: 10px 14px;\n  border-radius: 14px;\n  font-family: sans-serif;\n  font-size: 14px;\n  line-height: 1.55;\n  word-break: break-word;\n  letter-spacing: 0.1px;\n}\n\n.lz-msg-user {\n  background: #2c2c2c;\n  color: #ffffff;\n  align-self: flex-end;\n  border-bottom-right-radius: 3px;\n}\n\n.lz-msg-assistant {\n  background: #f3f0eb;\n  color: #1a1a1a;\n  align-self: flex-start;\n  border-bottom-left-radius: 3px;\n}\n\n.lz-msg-assistant.lz-streaming::after {\n  content: '▋';\n  animation: lz-blink 0.8s step-end infinite;\n  margin-left: 2px;\n}\n\n@keyframes lz-blink {\n  50% { opacity: 0; }\n}\n\n#lz-chat-input-area {\n  border-top: 1px solid #e8e4de;\n  padding: 10px;\n  display: flex;\n  gap: 8px;\n  flex-shrink: 0;\n}\n\n#lz-chat-input {\n  flex: 1;\n  border: 1px solid #ddd;\n  border-radius: 20px;\n  padding: 8px 14px;\n  font-size: 14px;\n  font-family: sans-serif;\n  outline: none;\n  resize: none;\n}\n\n#lz-chat-input:focus { border-color: #c9a96e; }\n\n#lz-chat-send {\n  background: #c9a96e;\n  border: none;\n  border-radius: 50%;\n  width: 36px;\n  height: 36px;\n  cursor: pointer;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  flex-shrink: 0;\n  transition: background 0.2s;\n}\n\n#lz-chat-send:hover { background: #b8924f; }\n\n#lz-chat-send svg {\n  width: 16px;\n  height: 16px;\n  fill: #ffffff;\n}\n\n#lz-lead-form {\n  padding: 16px;\n  display: flex;\n  flex-direction: column;\n  gap: 10px;\n}\n\n#lz-lead-form p {\n  font-family: sans-serif;\n  font-size: 14px;\n  color: #444;\n  margin: 0;\n}\n\n.lz-lead-input {\n  border: 1px solid #ddd;\n  border-radius: 8px;\n  padding: 9px 12px;\n  font-size: 14px;\n  font-family: sans-serif;\n  outline: none;\n  width: 100%;\n  box-sizing: border-box;\n}\n\n.lz-lead-input:focus { border-color: #c9a96e; }\n\n#lz-lead-submit {\n  background: #2c2c2c;\n  color: #ffffff;\n  border: none;\n  border-radius: 8px;\n  padding: 10px;\n  font-size: 14px;\n  font-family: sans-serif;\n  cursor: pointer;\n  transition: background 0.2s;\n}\n\n#lz-lead-submit:hover { background: #444; }\n\n@media (max-width: 420px) {\n  #lz-chat-window {\n    width: calc(100vw - 16px);\n    right: 8px;\n    bottom: 80px;\n    height: 70vh;\n  }\n}";
    document.head.appendChild(style);
  }

  function createBubble() {
    const bubble = el('div', { id: 'lz-chat-bubble', onclick: toggleChat });
    bubble.appendChild(
      svgIcon('M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z')
    );
    return bubble;
  }

  function createChatWindow() {
    const header = el('div', { id: 'lz-chat-header' }, [
      el('span', {}, ['Lazzarini Arredamento']),
      el('button', { id: 'lz-chat-close', onclick: toggleChat }, ['×']),
    ]);

    const messagesEl = el('div', { id: 'lz-chat-messages' });

    const input = el('input', {
      id: 'lz-chat-input',
      type: 'text',
      placeholder: 'Scrivi un messaggio...',
      onkeydown: (e) => { if (e.key === 'Enter') handleSend(); },
    });

    const sendBtn = el('button', { id: 'lz-chat-send', onclick: handleSend });
    sendBtn.appendChild(svgIcon('M2.01 21L23 12 2.01 3 2 10l15 2-15 2z'));

    const inputArea = el('div', { id: 'lz-chat-input-area' }, [input, sendBtn]);

    return el('div', { id: 'lz-chat-window' }, [header, messagesEl, inputArea]);
  }

  function toggleChat() {
    isOpen = !isOpen;
    const win = document.getElementById('lz-chat-window');
    win.classList.toggle('lz-open', isOpen);

    if (isOpen && messages.length === 0) {
      appendMessage('assistant', cfg.welcomeMessage);
    }

    if (isOpen) {
      setTimeout(() => document.getElementById('lz-chat-input')?.focus(), 300);
    }
  }

  function appendMessage(role, text) {
    const msgEl = el('div', { class: `lz-msg lz-msg-${role}` }, [text]);
    document.getElementById('lz-chat-messages').appendChild(msgEl);
    scrollToBottom();
    if (role === 'assistant') {
      messages.push({ role: 'assistant', content: text });
    }
    return msgEl;
  }

  function scrollToBottom() {
    const container = document.getElementById('lz-chat-messages');
    if (container) container.scrollTop = container.scrollHeight;
  }

  function handleSend() {
    const input = document.getElementById('lz-chat-input');
    const text = input.value.trim();
    if (!text) return;
    input.value = '';

    messages.push({ role: 'user', content: text });
    appendMessage('user', text);
    streamAssistantReply();
  }

  async function streamAssistantReply() {
    const msgEl = el('div', { class: 'lz-msg lz-msg-assistant lz-streaming' }, ['']);
    document.getElementById('lz-chat-messages').appendChild(msgEl);
    scrollToBottom();

    let fullText = '';

    try {
      const res = await fetch(`${cfg.apiUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages }),
      });

      if (!res.ok) {
        msgEl.textContent = 'Errore di connessione. Riprova.';
        msgEl.classList.remove('lz-streaming');
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const payload = line.slice(6);
          if (payload === '[DONE]') break;

          try {
            const { text, error } = JSON.parse(payload);
            if (error) {
              msgEl.textContent = error;
              break;
            }
            fullText += text;
            msgEl.textContent = fullText;
            scrollToBottom();
          } catch {
            // ignore malformed SSE line
          }
        }
      }
    } catch {
      msgEl.textContent = 'Impossibile connettersi al server.';
    }

    msgEl.classList.remove('lz-streaming');
    messages.push({ role: 'assistant', content: fullText });

    if (
      fullText.toLowerCase().includes('nome e') &&
      fullText.toLowerCase().includes('email') &&
      !isLeadMode
    ) {
      showLeadForm();
    }
  }

  function showLeadForm() {
    isLeadMode = true;
    const inputArea = document.getElementById('lz-chat-input-area');
    inputArea.style.display = 'none';

    const nameInput = el('input', {
      class: 'lz-lead-input',
      type: 'text',
      placeholder: 'Il tuo nome',
      id: 'lz-lead-name',
    });

    const emailInput = el('input', {
      class: 'lz-lead-input',
      type: 'email',
      placeholder: 'La tua email',
      id: 'lz-lead-email',
    });

    const submitBtn = el('button', { id: 'lz-lead-submit', onclick: handleLeadSubmit }, [
      'Invia',
    ]);

    const form = el('div', { id: 'lz-lead-form' }, [
      el('p', {}, ['Inserisci i tuoi dati e ti contatteremo:']),
      nameInput,
      emailInput,
      submitBtn,
    ]);

    document.getElementById('lz-chat-window').appendChild(form);
    nameInput.focus();
  }

  async function handleLeadSubmit() {
    const name = document.getElementById('lz-lead-name')?.value.trim();
    const email = document.getElementById('lz-lead-email')?.value.trim();

    if (!name || !email) {
      appendMessage('assistant', 'Inserisci nome e email per procedere.');
      return;
    }

    const summary = messages
      .map(m => `${m.role === 'user' ? 'Cliente' : 'Bot'}: ${m.content}`)
      .join('\n');

    const form = document.getElementById('lz-lead-form');
    if (form) form.remove();
    document.getElementById('lz-chat-input-area').style.display = 'flex';
    isLeadMode = false;

    appendMessage('user', `${name} — ${email}`);

    try {
      const leadRes = await fetch(`${cfg.apiUrl}/api/lead`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, summary }),
      });
      if (!leadRes.ok) throw new Error('lead api error');
      appendMessage(
        'assistant',
        `Grazie ${name}! Uno dei nostri consulenti ti contatterà all'indirizzo ${email} al più presto.`
      );
    } catch {
      appendMessage('assistant', 'Errore nell\'invio. Contattaci direttamente via email.');
    }
  }

  function init() {
    injectStyles();
    document.body.appendChild(createBubble());
    document.body.appendChild(createChatWindow());
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(init, 3000));
  } else {
    setTimeout(init, 3000);
  }
})();
