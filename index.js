// index.js — IA Jasmyle com integração WhatsApp + OpenAI + QRCode web/terminal

import { Client, LocalAuth } from "whatsapp-web.js";
import qrcode from "qrcode";
import dotenv from "dotenv";
import OpenAI from "openai";
import fs from "fs";
import express from "express";

// 🔹 Carrega variáveis do .env
dotenv.config();

// 🔹 Inicializa cliente do WhatsApp
const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  },
});

// 🔹 Inicializa cliente da OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 🔹 Memória separada por grupo/usuário
const memoryFile = "memory.json";
let memory = {};
if (fs.existsSync(memoryFile)) {
  memory = JSON.parse(fs.readFileSync(memoryFile, "utf-8"));
}

// 🔸 Função para salvar memória
function saveMemory() {
  fs.writeFileSync(memoryFile, JSON.stringify(memory, null, 2));
}

// ============================
// SERVIDOR EXPRESS PARA QR
// ============================

const app = express();
let qrCodeData = null;

app.get("/qr", (req, res) => {
  if (qrCodeData) {
    res.send(`
      <html>
        <body style="text-align:center; background:#111; color:#fff; font-family:sans-serif;">
          <h2>Escaneie para conectar ao WhatsApp</h2>
          <img src="${qrCodeData}" style="width:300px; border-radius:10px; box-shadow:0 0 15px #0f0;">
          <p style="margin-top:20px;">IA Jasmyle está aguardando conexão...</p>
        </body>
      </html>
    `);
  } else {
    res.send("<h3 style='text-align:center;'>QR ainda não gerado...</h3>");
  }
});

app.listen(3000, () =>
  console.log("🌐 Servidor QR ativo: http://localhost:3000/qr")
);

// ============================
// EVENTOS DO WHATSAPP
// ============================

// Evento QR — mostra no terminal e na web
client.on("qr", async (qr) => {
  console.log("📱 Gerando QR code...");

  // Gera QR no terminal
  qrcode.toString(qr, { type: "terminal" }, (err, url) => {
    console.log(url);
  });

  // Gera QR como imagem (Termux ou web)
  await qrcode.toFile("qr.png", qr);
  qrCodeData = await qrcode.toDataURL(qr);

  console.log("✅ QR gerado!");
  console.log("➡️ Escaneie via terminal ou acesse: http://localhost:3000/qr");
});

// Evento de autenticação concluída
client.on("ready", () => {
  console.log("🤖 IA Jasmyle conectada ao WhatsApp com sucesso!");
});

// Evento para mensagens recebidas
client.on("message", async (msg) => {
  const chat = await msg.getChat();
  const sender = chat.isGroup ? chat.id._serialized : msg.from;

  // Cria memória se não existir
  if (!memory[sender]) memory[sender] = [];

  // Guarda a última mensagem
  memory[sender].push({ role: "user", content: msg.body });

  // Mantém histórico pequeno (últimas 10 mensagens)
  if (memory[sender].length > 10) memory[sender].shift();

  // Se mensagem é pra IA
  if (msg.body.toLowerCase().includes("jasmyle") || msg.body.startsWith("!")) {
    msg.react("💬");

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: memory[sender],
      });

      const reply = completion.choices[0].message.content;
      memory[sender].push({ role: "assistant", content: reply });
      saveMemory();

      msg.reply(reply);
    } catch (err) {
      console.error("Erro IA:", err.message);
      msg.reply("⚠️ Ocorreu um erro ao falar com a IA Jasmyle.");
    }
  }
});

// Inicializa o cliente
client.initialize();