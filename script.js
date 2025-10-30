/*
  Assistente Carlos - integração simples com OpenAI
  ATENÇÃO: Não compartilhe sua chave. Cole-a abaixo em OPENAI_API_KEY.
*/

const OPENAI_API_KEY = "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"; // <<< cole sua chave sk-... aqui, NUNCA compartilhe

const chatEl = document.getElementById('chat');
const form = document.getElementById('inputForm');
const userInput = document.getElementById('userInput');
const modelSelect = document.getElementById('modelSelect');

function appendMessage(role, text) {
  const div = document.createElement('div');
  div.classList.add('msg');
  div.classList.add(role === 'user' ? 'user' : 'bot');
  div.innerHTML = `<div class="role"><strong>${role === 'user' ? 'Você' : 'Assistente Carlos'}</strong></div><div class="content">${text.replace(/\n/g,'<br>')}</div>`;
  chatEl.appendChild(div);
  chatEl.scrollTop = chatEl.scrollHeight;
}

async function sendToOpenAI(message, model) {
  const url = "https://api.openai.com/v1/chat/completions";
  const body = {
    model: model,
    messages: [{role: "user", content: message}],
    max_tokens: 1000,
    temperature: 0.2
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + OPENAI_API_KEY
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error('Erro na API: ' + res.status + ' - ' + errText);
  }

  const data = await res.json();
  const reply = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content
    ? data.choices[0].message.content
    : "Desculpe, não entendi a resposta da API.";

  return reply;
}

form.addEventListener('submit', async (ev) => {
  ev.preventDefault();
  const text = userInput.value.trim();
  if (!text) return;
  appendMessage('user', text);
  userInput.value = "";
  appendMessage('bot', '<i>Escrevendo...</i>');
  const placeholder = Array.from(chatEl.querySelectorAll('.msg.bot')).pop();

  try {
    const model = modelSelect.value || 'gpt-4o-mini';
    const reply = await sendToOpenAI(text, model);
    if (placeholder) placeholder.remove();
    appendMessage('bot', reply);
  } catch (err) {
    if (placeholder) placeholder.remove();
    appendMessage('bot', 'Erro ao conectar com a OpenAI: ' + err.message);
    console.error(err);
  }
});