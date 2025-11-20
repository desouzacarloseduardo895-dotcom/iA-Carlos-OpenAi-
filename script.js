/*
  Assistente Jasmyle com Memória Local Persistente
  Criado por: Carlos Eduardo De Souza
  Data: 31/10/2025
  Versão segura (requisições via servidor local)
*/

const chatEl = document.getElementById("chat");
const form = document.getElementById("inputForm");
const userInput = document.getElementById("userInput");
const modelSelect = document.getElementById("modelSelect");

// --- 🧠 Carrega memória salva (mensagens antigas e dados aprendidos)
let memory = JSON.parse(localStorage.getItem("carlos_memory")) || [];

// --- Identidade do assistente
const ASSISTANT_IDENTITY = `
Você é a assistente Jasmyle, uma IA empática e educada criada por Carlos Eduardo De Souza em 31/10/2025.
Sua função é ajudar, aprender e responder de forma natural e gentil.
Sempre trate os usuários com respeito e clareza.
`;

// --- Mostra mensagens antigas ao reabrir o chat
memory.forEach(msg => appendMessage(msg.role, msg.content));

function appendMessage(role, text) {
  const div = document.createElement("div");
  div.classList.add("msg", role === "user" ? "user" : "bot");
  div.innerHTML = `
    <div class="role"><strong>${role === "user" ? "Você" : "Jasmyle"}</strong></div>
    <div class="content">${text.replace(/\n/g, "<br>")}</div>
  `;
  chatEl.appendChild(div);
  chatEl.scrollTop = chatEl.scrollHeight;
}

// --- Função que envia dados ao backend seguro
async function sendToOpenAI(message, model) {
  const body = {
    message,
    model,
    memory: memory.slice(-15),
    system: ASSISTANT_IDENTITY
  };

  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error("Erro na API: " + res.status + " - " + errText);
  }

  const data = await res.json();
  const reply =
    data.choices?.[0]?.message?.content ||
    data.reply ||
    "Desculpe, não entendi a resposta.";

  return reply;
}

// --- Quando o usuário envia uma mensagem
form.addEventListener("submit", async ev => {
  ev.preventDefault();
  const text = userInput.value.trim();
  if (!text) return;

  appendMessage("user", text);
  memory.push({ role: "user", content: text });
  saveMemory();

  userInput.value = "";
  appendMessage("bot", "<i>Escrevendo...</i>");
  const placeholder = Array.from(chatEl.querySelectorAll(".msg.bot")).pop();

  try {
    const model = modelSelect.value || "gpt-4o-mini";
    const reply = await sendToOpenAI(text, model);
    if (placeholder) placeholder.remove();

    appendMessage("bot", reply);
    memory.push({ role: "assistant", content: reply });
    saveMemory();
  } catch (err) {
    if (placeholder) placeholder.remove();
    appendMessage("bot", "Erro ao conectar com o servidor: " + err.message);
    console.error(err);
  }
});

// --- Salva memória no navegador
function saveMemory() {
  localStorage.setItem("carlos_memory", JSON.stringify(memory));
}

// --- Comando para limpar memória manualmente
window.clearCarlosMemory = function () {
  if (confirm("Tem certeza que deseja apagar toda a memória do assistente?")) {
    localStorage.removeItem("carlos_memory");
    memory = [];
    chatEl.innerHTML = "";
    appendMessage("bot", "Memória apagada com sucesso.");
  }
};

// --- 📞 Funções de voz (ligar e desligar)
let isCalling = false;
let recognition = null;

const callBtn = document.getElementById("callBtn");
callBtn.addEventListener("click", () => {
  if (!isCalling) ligarParaJasmyle();
  else encerrarLigacao();
});

async function ligarParaJasmyle() {
  if (isCalling) return;
  isCalling = true;
  callBtn.textContent = "🔴";

  appendMessage("bot", "<i>📞 Ligação iniciada com Jasmyle...</i>");
  speakJasmyle("Em que posso ajudá-lo?");

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    appendMessage("bot", "Seu navegador não suporta reconhecimento de voz.");
    isCalling = false;
    callBtn.textContent = "�"
    return;
  }

  recognition = new SpeechRecognition();
  recognition.lang = "pt-BR";
  recognition.continuous = true;

  recognition.onresult = async event => {
    const transcript = event.results[event.results.length - 1][0].transcript.trim();
    if (!transcript) return;

    appendMessage("user", transcript);
    memory.push({ role: "user", content: transcript });
    saveMemory();

    const model = modelSelect.value || "gpt-4o-mini";
    try {
      const reply = await sendToOpenAI(transcript, model);
      appendMessage("bot", reply);
      memory.push({ role: "assistant", content: reply });
      saveMemory();
      speakJasmyle(reply);
    } catch (err) {
      appendMessage("bot", "Erro de voz: " + err.message);
    }
  };

  recognition.start();
}

function encerrarLigacao() {
  if (!isCalling) return;
  isCalling = false;
  callBtn.textContent = "📶";
  if (recognition) recognition.stop();
  appendMessage("bot", "<i>📞 Ligação encerrada.</i>");
  speakJasmyle("Até logo, querido!❤️");
}

// --- 🔊 Voz da Jasmyle
function speakJasmyle(text) {
  const synth = window.speechSynthesis;
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = "pt-BR";
  utter.pitch = 1.2;
  utter.rate = 1;
  const voices = synth.getVoices();
  utter.voice = voices.find(v => v.lang.startsWith("pt") && v.name.toLowerCase().includes("female")) || null;
  synth.speak(utter);
}