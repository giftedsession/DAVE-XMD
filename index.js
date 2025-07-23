const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  getContentType,
  Browsers
} = require('@whiskeysockets/baileys');
const P = require('pino');
const fs = require('fs');
const path = require('path');
const os = require('os');
const express = require('express');
const config = require('./config');
const { cmd, commands } = require('./command');
const { getBuffer } = require('./lib/functions');
const { saveMessage } = require('./data');
const app = express();
const port = process.env.PORT || 9090;

const tempDir = path.join(os.tmpdir(), 'cache-temp');
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);
setInterval(() => {
  fs.readdir(tempDir, (err, files) => {
    if (err) return;
    for (const file of files) {
      fs.unlink(path.join(tempDir, file), () => {});
    }
  });
}, 5 * 60 * 1000);

// === SESSION RESTORE ===
const credsPath = path.join(__dirname, 'sessions', 'creds.json');
if (!fs.existsSync(credsPath)) {
  if (!config.SESSION_ID) {
    console.error('❌ SESSION_ID is not set!');
  } else {
    const base64 = config.SESSION_ID.includes("Bellah~") ? config.SESSION_ID.split("Bellah~")[1] : config.SESSION_ID;
    const sessionBuffer = Buffer.from(base64, 'base64');
    fs.mkdirSync(path.dirname(credsPath), { recursive: true });
    fs.writeFileSync(credsPath, sessionBuffer);
    console.log('✅ Session restored from SESSION_ID');
  }
}

async function connectToWA() {
  console.log("Connecting to WhatsApp ⏳️...");
  const { state, saveCreds } = await useMultiFileAuthState('./sessions');
  const { version } = await fetchLatestBaileysVersion();
  const conn = makeWASocket({
    logger: P({ level: 'silent' }),
    printQRInTerminal: false,
    browser: Browsers.ubuntu('Chrome'),
    syncFullHistory: true,
    auth: state,
    version
  });

  conn.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === 'close') {
      if (lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut) {
        connectToWA();
      }
    } else if (connection === 'open') {
      console.log('🧬 Installing Plugins');
      fs.readdirSync('./plugins').forEach(file => {
        if (file.endsWith('.js')) require('./plugins/' + file);
      });
      console.log('✅ Plugins installed');

      const welcome = `*🤖 𝐃𝐀𝐕𝐄-𝐗𝐌𝐃 BOT ONLINE!*\n\n✅ Type *.menu* to view commands\n👑 Developer: DAVE\n🔄 Mode: ${config.MODE}`;
      conn.sendMessage(conn.user.id, {
        image: { url: 'https://files.catbox.moe/nxzaly.jpg' },
        caption: welcome
      });
    }
  });

  conn.ev.on('creds.update', saveCreds);

  conn.ev.on('messages.upsert', async ({ messages }) => {
    let mek = messages[0];
    if (!mek.message) return;

    mek.message = getContentType(mek.message) === 'ephemeralMessage'
      ? mek.message.ephemeralMessage.message
      : mek.message;

    const from = mek.key.remoteJid;
    const type = getContentType(mek.message);
    const body = type === 'conversation'
      ? mek.message.conversation
      : type === 'imageMessage'
      ? mek.message.imageMessage.caption
      : type === 'videoMessage'
      ? mek.message.videoMessage.caption
      : type === 'extendedTextMessage'
      ? mek.message.extendedTextMessage.text
      : '';

    const isCmd = body.startsWith(config.PREFIX);
    const command = isCmd ? body.slice(1).trim().split(/ +/).shift().toLowerCase() : '';
    const args = body.trim().split(/ +/).slice(1);
    const text = args.join(" ");
    const sender = mek.key.fromMe ? conn.user.id : mek.key.participant || mek.key.remoteJid;

    const reply = (text) => conn.sendMessage(from, { text }, { quoted: mek });

    if (isCmd) {
      for (let plugin of commands) {
        if (plugin.pattern === command || (plugin.alias && plugin.alias.includes(command))) {
          try {
            await plugin.function(conn, mek, message = {
              from, sender, text, args, command, isCmd, prefix: config.PREFIX
            }, { reply, isOwner: sender.includes(config.OWNER_NUMBER) });
          } catch (e) {
            console.error(e);
            reply("❌ Command error.");
          }
        }
      }
    }

    // Save message for anti-delete or status usage
    await saveMessage(mek);
  });
}

connectToWA();
app.get('/', (req, res) => res.send("𝐃𝐀𝐕𝐄-𝐗𝐌𝐃 BOT IS LIVE ✅"));
app.listen(port, () => console.log("Server running on PORT " + port));
