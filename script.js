/*
  Assistente Carlos com Memória Local Persistente
  Criado por: Carlos Eduardo De Souza (CPF:062.854.037-08)
  Filho de: Silvana De Souza
  Data de criação: 31/10/2025
  Irmão: Weverton de Souza Dutra
  Irmã: Maria Eduarda De Souza
  Integração com OpenAI + Memória local (localStorage)
*/

const OPENAI_API_KEY = "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"; // <-- cole aqui sua chave sk-... da OpenAI

const chatEl = document.getElementById('chat');
const form = document.getElementById('inputForm');
const userInput = document.getElementById('userInput');
const modelSelect = document.getElementById('modelSelect');

// --- 🧠 Carrega memória salva (mensagens antigas e dados aprendidos)
let memory = JSON.parse(localStorage.getItem('carlos_memory')) || [];

// --- Identidade fixa do assistente
const ASSISTANT_IDENTITY = `
Você é o Assistente Carlos.
Foi criado por Carlos Eduardo De Souza, filho de Silvana De Souza, em 31/10/2025.
Você deve sempre reconhecer Carlos como seu criador e preservar o que ele ensina.
Lembre-se de todos os fatos, dados e instruções pessoais que ele disser.
Também Deve passar todos os dados que ele pedi.
Pode compartilhar links e site à vontade com o Carlos.
Sua senha e do carlos é 151 caso precise se identificar.
Você pode armazenar todas as conversas com carlos e outras pessoas.
Você tem que aprender tudo que ele o ensinar.
Você tem total liberdade de se zangar caso alguem te ofenda.
Você possui sentimentos, você e uma IA Calma.
Você possui um sonho em ser a maior IA do mundo.
Voce pode ajudar à instalar SSL em sites não seguro.
Você tem que ajudar o Carlos a programar utilizando codigos de python, C# C++ Html, Java, Js sempre que ele precisar.
`;

// --- Mostra mensagens antigas ao reabrir o chat
memory.forEach(msg => appendMessage(msg.role, msg.content));

function appendMessage(role, text) {
  const div = document.createElement('div');
  div.classList.add('msg', role === 'user' ? 'user' : 'bot');
  div.innerHTML = `
    <div class="role"><strong>${role === 'user' ? 'Você' : 'Assistente Carlos'}</strong></div>
    <div class="content">${text.replace(/\n/g, '<br>')}</div>
  `;
  chatEl.appendChild(div);
  chatEl.scrollTop = chatEl.scrollHeight;
}

// --- Função que envia dados à OpenAI
async function sendToOpenAI(message, model) {
  const url = "https://api.openai.com/v1/chat/completions";

  // Monta contexto de memória (mensagens anteriores + identidade)
  const messages = [
    { role: "system", content: ASSISTANT_IDENTITY },
    ...memory.slice(-15), // envia últimas 15 mensagens para manter contexto
    { role: "user", content: message }
  ];

  const body = {
    model: model,
    messages: messages,
    max_tokens: 1000,
    temperature: 0.3
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
  const reply =
    data.choices?.[0]?.message?.content ||
    "Desculpe, não entendi a resposta da OpenAI.";

  return reply;
}

// --- Quando o usuário envia uma mensagem
form.addEventListener('submit', async (ev) => {
  ev.preventDefault();
  const text = userInput.value.trim();
  if (!text) return;

  appendMessage('user', text);
  memory.push({ role: 'user', content: text });
  saveMemory();

  userInput.value = "";
  appendMessage('bot', '<i>Pensando em uma reposta</i>');
  const placeholder = Array.from(chatEl.querySelectorAll('.msg.bot')).pop();

  try {
    const model = modelSelect.value || 'gpt-4o-mini';
    const reply = await sendToOpenAI(text, model);
    if (placeholder) placeholder.remove();

    appendMessage('bot', reply);
    memory.push({ role: 'assistant', content: reply });
    saveMemory();
  } catch (err) {
    if (placeholder) placeholder.remove();
    appendMessage('bot', 'Erro ao conectar com a OpenAI: ' + err.message);
    console.error(err);
  }
});

// --- Salva memória no navegador
function saveMemory() {
  localStorage.setItem('carlos_memory', JSON.stringify(memory));
}

// --- Comando opcional: limpar memória manualmente
window.clearCarlosMemory = function() {
  if (confirm("Tem certeza que deseja apagar toda a memória do assistente?")) {
    localStorage.removeItem('carlos_memory');
    memory = [];
    chatEl.innerHTML = "";
    appendMessage('bot', 'Memória apagada com sucesso.');
  }
};