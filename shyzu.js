/**
  * Base Ori Created By MannR
  * Name Script : Shyzu
  * Creator Script : MannR
  * Version Script : 1.0.0
  * Libary : @whiskeysockets/baileys
  * Version Libary : ^6.6.0
  * Created on Sunday, Sep 1, 2024
  * Thank you to MannR and the module providers and those who use this base.
  * Please use this base as best as possible and do not delete the copyright.
  * © MannR 2024
**/

require("./lib/config.js")
var { axios, JavaScriptObfuscator, fetch, fs, chalk, baileys, execSync, util } = require("./lib/module.js")
var { watchFile, unwatchFile, readFileSync } = fs
var { generateWAMessageContent, generateWAMessageFromContent, getContentType, proto } = baileys
let cp = execSync
let { promisify } = util
let exec = promisify(cp.exec).bind(cp)

module.exports = async (shyzu, m) => {
    try {
    let Read = async (shyzu, jid, messageId) => {
        await shyzu.readMessages([{ remoteJid: jid, id: messageId, participant: null }]);
    }
    
    if (!m) return m
    let M = proto.WebMessageInfo
    if (m.key) {
        m.id = m.key.id
        m.isBaileys = m.id.startsWith('BAE5') && m.id.length === 16
        m.chat = m.key.remoteJid
        m.fromMe = m.key.fromMe
        m.isGroup = m.chat.endsWith('@g.us')
        m.sender = shyzu.decodeJid(m.fromMe && shyzu.user.id || m.participant || m.key.participant || m.chat || '')
        if (m.isGroup) m.participant = shyzu.decodeJid(m.key.participant) || ''
    }
    
    if (m.message) {
        m.mtype = getContentType(m.message)
        m.msg = (m.mtype == 'viewOnceMessage' ? m.message[m.mtype].message[getContentType(m.message[m.mtype].message)] : m.message[m.mtype])
        m.body = m.message.conversation || m.msg.caption || m.msg.text || (m.mtype == 'listResponseMessage') && m.msg.singleSelectReply.selectedRowId || (m.mtype == 'buttonsResponseMessage') && m.msg.selectedButtonId || (m.mtype == 'viewOnceMessage') && m.msg.caption || m.text
        let quoted = m.quoted = m.msg.contextInfo ? m.msg.contextInfo.quotedMessage : null
        m.mentionedJid = m.msg.contextInfo ? m.msg.contextInfo.mentionedJid : []
        if (m.quoted) {
            let type = getContentType(quoted)
			m.quoted = m.quoted[type]
            if (['productMessage'].includes(type)) {
				type = getContentType(m.quoted)
				m.quoted = m.quoted[type]
			}
            if (typeof m.quoted === 'string') m.quoted = {
				text: m.quoted
			}
            m.quoted.mtype = type
            m.quoted.id = m.msg.contextInfo.stanzaId
			m.quoted.chat = m.msg.contextInfo.remoteJid || m.chat
            m.quoted.isBaileys = m.quoted.id ? m.quoted.id.startsWith('BAE5') && m.quoted.id.length === 16 : false
			m.quoted.sender = shyzu.decodeJid(m.msg.contextInfo.participant)
			m.quoted.fromMe = m.quoted.sender === (shyzu.user && shyzu.user.id)
            m.quoted.text = m.quoted.text || m.quoted.caption || m.quoted.conversation || m.quoted.contentText || m.quoted.selectedDisplayText || m.quoted.title || ''
			m.quoted.mentionedJid = m.msg.contextInfo ? m.msg.contextInfo.mentionedJid : []
            let vM = m.quoted.fakeObj = M.fromObject({
                key: {
                    remoteJid: m.quoted.chat,
                    fromMe: m.quoted.fromMe,
                    id: m.quoted.id
                },
                message: quoted,
                ...(m.isGroup ? { participant: m.quoted.sender } : {})
            })

            m.quoted.delete = () => shyzu.sendMessage(m.quoted.chat, { delete: vM.key })

            m.quoted.copyNForward = (jid, forceForward = false, options = {}) => shyzu.copyNForward(jid, vM, forceForward, options)

            m.quoted.download = () => shyzu.downloadMediaMessage(m.quoted)
        }
    }
    if (m.msg.url) m.download = () => shyzu.downloadMediaMessage(m.msg)
    m.text = m.msg.text || m.msg.caption || m.message.conversation || m.msg.contentText || m.msg.selectedDisplayText || m.msg.title || ''

	m.copyNForward = (jid = m.chat, forceForward = false, options = {}) => shyzu.copyNForward(jid, m, forceForward, options)
	
    const message = m.message;
    const isGroup = m.key.remoteJid.endsWith('@g.us');
    const isName = m.pushName || 'no name';
    const isFrom = m.key.remoteJid;
    const isSender = isGroup ? (m.key.participant ? m.key.participant : m.participant) : m.key.remoteJid;
    const isOwner = global.owner.includes(isSender);
    const groupMetadata = isGroup ? await shyzu.groupMetadata(isFrom) : {}; 
    
    const participants = isGroup ? groupMetadata.participants : '';
    const groupName = isGroup ? groupMetadata.subject : '';

    let mType = Object.keys(message)[0];
    let body = (mType === 'conversation' && message.conversation) ? message.conversation :
               (mType === 'extendedTextMessage' && message.extendedTextMessage.text) ? message.extendedTextMessage.text :
               (mType === 'imageMessage' && message.imageMessage.caption) ? message.imageMessage.caption :
               (mType === 'videoMessage' && message.videoMessage.caption) ? message.videoMessage.caption :
               (mType === 'buttonsResponseMessage') ? message.buttonsResponseMessage.selectedButtonId :
               (mType === 'listResponseMessage') ? message.listResponseMessage.singleSelectReply.selectedRowId :
               (mType === 'templateButtonReplyMessage') ? message.templateButtonReplyMessage.selectedId :
               (mType === 'messageContextInfo') ? (message.buttonsResponseMessage?.selectedButtonId || message.listResponseMessage?.singleSelectReply.selectedRowId || message.text) :
               (mType === 'documentMessage' && message.documentMessage.caption) ? message.documentMessage.caption : '';

    const prefix = ['.', ',', '!', '?', '#'];
    if (!prefix.some(p => body.startsWith(p))) return;
    const [command, ...args] = body.slice(prefix.find(p => body.startsWith(p)).length).trim().split(/ +/);
    const text = args.join(' ');
    const budy = (typeof text == 'string' ? text : '')
    
    var cmd = prefix + command

    await Read(shyzu, m.key.remoteJid, m.key.id);
    
    let x = chalk.bold.cyan("[ Message Shyzu ]");
    x += chalk.cyan("\nᕐ⁠ᐷ From: ")
    x += chalk.bold.white(isSender)
    x += chalk.cyan("\nᕐ⁠ᐷ Command: ")
    x += chalk.bold.white("." + command + " " + text)
    console.log(x)
    
    m.reply = async (text) => {
        let { id, name } = await shyzu.user
        let z = await shyzu.profilePictureUrl(id, "image")
        shyzu.sendMessage(m.key.remoteJid, { text: text, contextInfo: {
        forwardingScore: 0,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
          newsletterJid: "120363226980141082@newsletter",
          serverMessageId: 0,
          newsletterName: "私たちのチャンネルをフォローしてください"
        },
        mentionedJid: [m.sender],
        externalAdReply: {
        showAdAttribution: true,
        title: name,
        body: "© MannR - 2024",
        thumbnailUrl: z,
        sourceUrl: "https://whatsapp.com/channel/0029VaGqCO6I1rcjc9hisJ3U",
        mediaType: 1,
        renderLargerThumbnail: false
        }}}, { quoted: m })
    };
    
    m.react = (q) => {
        shyzu.sendMessage(m.chat, { react: { text: q, key: m.key }})
    }
    
    m.upTime = () => {
        let ms = require("process").uptime() * 1000
        let h = isNaN(ms) ? '--' : Math.floor(ms / 3600000)
        let m = isNaN(ms) ? '--' : Math.floor(ms / 60000) % 60
        let s = isNaN(ms) ? '--' : Math.floor(ms / 1000) % 60
        return [h, m, s].map(v => v.toString().padStart(2, 0)).join(':')
    }
    
    shyzu.sendButton = async (jid, text, btn) => {
    let msg = generateWAMessageFromContent(jid, { viewOnceMessage: {
        message: { 
            "messageContextInfo": { 
            "deviceListMetadata": {}, 
            "deviceListMetadataVersion": 2
        }, 
        interactiveMessage: proto.Message.InteractiveMessage.create({
        contextInfo: { 
            mentionedJid: [jid] 
        },
        body: proto.Message.InteractiveMessage.Body.create({ 
            text: text
        }), 
        nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({ 
        buttons: btn
        })
        })}
        }}, { userJid: jid, quoted: m })
        await shyzu.relayMessage(msg.key.remoteJid, msg.message, { 
        messageId: msg.key.id 
        })
    }
    
    function format(views) {
    if (views >= 1000000) {
        return (views / 1000000).toFixed(1) + 'M';
    } else if (views >= 1000) {
        return (views / 1000).toFixed(1) + 'K';
    } else {
        return views.toString();
    }
    }
    
    switch (command) {
        case "ai": {
        if (!text) return m.reply("Masukan pertanyaan!")
        try {
        var { data } = await axios({
            "method": "GET",
            "url": "https://mannoffc-x.hf.space/ai/prompt",
            "params": {
		"prompt": "Nama kamu adalah shyzu",
                "message": text
            }
        })
        m.reply(data.result)
        } catch ({ message }) {
        m.reply(message)
        }
        }
        break
        
        case "enc": {
        if (!text) return m.reply("Masukan teksnya!")
        try {
        let { getObfuscatedCode: res } = JavaScriptObfuscator.obfuscate(text)
        return res
        } catch ({ message }) {
        m.reply(message)
        }
        }
        break
        
        case "clock": {
        let date = new Date();
        let year = date.getFullYear();
        let month = date.getMonth() + 1;
        let day = date.getDate();
        let hour = date.getHours();
        let minute = date.getMinutes();
        let second = date.getSeconds();
        let x = `${day}/${month}/${year} ${hour}:${minute}:${second}`;
        m.reply(x)
        }
        break
        
        case "tiktok": case "tt": {
        if (!text.includes("tiktok.com")) return m.reply("Masukan link tiktok, Contoh *.tt* https://www.tiktok.com/xxxx")
        try {
        let { data } = await axios({
        "method": "GET",
        "url": "https://mannoffc-x.hf.space/download/tiktok",
          "params": {
            "url": text
          }
        })
        let { author, title, duration, medias } = data.result;
        let { url } = medias[1]
        let caption = `*T I K T O K • D O W N L O A D E R*\n• Author: ${author}\n• Title: ${title}\n• Duration: ${duration}s`
        shyzu.sendMessage(m.chat, { video: { url }, caption }, { quoted: m })
        } catch ({ message }) {
        m.reply(message)
        }
        }
        break

	case "facebook": case "fb": {
        if (!text.includes("facebook.com")) return m.reply("Masukan link facebook, Contoh *.fb* https://www.facebook.com/xxxx")
        try {
        axios({ "method": "GET", "url": "https://mannoffc-x.hf.space/download/facebook", "params": { "url": text }}).then(_ => {
        shyzu.sendMessage(m.chat, { video: { url: _.data.result.video }, caption: "Ini dia kak" }, { quoted: m })
        })
        } catch ({ message }) {
        return m.reply(message)
        }
        }
        break
        
        /** case "upch": {
        if (!m.quoted) return m.reply("Balas sebuah gambar/video/audio dengan caption *.upch*")
        try {
        let q = await m.quoted.download()
        } catch ({ message }) {
        m.reply(message)
        }
        }
        break **/
        
        case "ngl": {
        let c = text.split("|")
        let username = c[0]
        let message = c[1]
        if (!username) return m.reply("Masukan usernamenya, Contoh *.ngl* mann|halo")
        if (!message) return m.reply("Masukan messagenya, Contoh *.ngl* mann|halo")
        try {
        await axios({
            method: "GET",
            url: "https://api-nodex.vercel.app",
            params: {
                username,
                message
            }
        })
        m.reply("Pesan " + message + " berhasil terkirim ke " + username)
        } catch ({ message }) {
        m.reply(message)
        }
        }
        break
        
        case "exec": {
        if (!isOwner) return m.reply("Khusus owner hehe :3")
        m.reply('🐾Executing...')
        let o
        try {
        o = await exec(command.trimStart()  + ' ' + text.trimEnd())
        } catch (e) {
        o = e
        } finally {
        let { stdout, stderr } = o
        if (stdout.trim()) m.reply(stdout)
        if (stderr.trim()) m.reply(stderr)
        }
        }
        break
        
        case ">": {
        if (!isOwner) return m.reply("Khusus owner hehe :3")
        try {
        let evaled = await eval(text)
        if (typeof evaled !== 'string') evaled = require('util').inspect(evaled)
        await m.reply(evaled)
        } catch (err) {
        m.reply(String(err))
        }
        }
        break
        
        /** case "auto-ai": {
        if (!auto_ai) {
        shyzu.auto_ai = shyzu.auto_ai ? shyzu.auto_ai : {};
        shyzu.auto_ai[isSender] = {
            status: true
        }
        m.reply("Mengaktifkan auto ai")
        m.reply("Jika ingin menonaktifkannya silahkan ketik *.auto-ai* sekali lagi")
        } else {
        delete shyzu.auto_ai[isSender]
        m.reply("Menonaktifkan auto ai")
        }
        }
        break **/
        
        case "soundcloud": {
        if (!text) return m.reply("Masukan judulnya, Contoh *.soundcloud* dear god");
        try {
        var { data: dataSearch } = await axios({
            "method": "GET",
            "url": "https://api-nodex.vercel.app/soundcloud/search",
            "params": {
                "q": text
            }
        })
    
        let { result: resultSearch } = dataSearch
        // let { link, title } = resultSearch[Math.floor(Math.random() * resultSearch.length)]
        let { link, title } = resultSearch[0]
    
        var { data: dataDownload } = await axios({
            "method": "GET",
            "url": "https://api-nodex.vercel.app/soundcloud/download",
           "params": {
                "url": link
            }
        })
    
        let { result: resultDownload } = dataDownload
    
        shyzu.sendMessage(m.chat, { audio: { url: resultDownload.download }, mimetype: "audio/mp4" }, { quoted: m })
        } catch ({ message }) {
        return m.reply(message)
        }
        }
        break
        
        case "getpp": {
        try {
        let who
        if (m.isGroup) who = m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted.sender
        else who = m.quoted.sender ? m.quoted.sender : m.sender
        let pp = await shyzu.profilePictureUrl(who, 'image').catch((_) => "https://telegra.ph/file/24fa902ead26340f3df2c.png")
        shyzu.sendMessage(m.chat, { image: { url: pp }, caption: "Ini dia kak" }, { quoted: m })
        } catch {
        let sender = m.sender
        let pp = await shyzu.profilePictureUrl(sender, 'image').catch((_) => "https://telegra.ph/file/24fa902ead26340f3df2c.png")
        shyzu.sendMessage(m.chat, { image: { url: pp }, caption: "Ini dia kak" }, { quoted: m })
        }
        }
        break
        
        case "toptv": {
        if (!m.quoted) return m.reply("Balas sebuah video dengan *.toptv*")
        try {
        let x = await m.quoted.download()
        let msg = await generateWAMessageContent({ video: x }, { upload: shyzu.waUploadToServer })
        await shyzu.relayMessage(m.chat, { ptvMessage: msg.videoMessage }, { quoted: m })
        } catch ({ message }) {
        return m.reply(message)
        }
        }
        break
        
        case "stc": {
        if (!text) return m.reply("Masukan teks, Contoh *.stc* kmu knp sih?")
        try {
        let data = "https://mannoffc-x.hf.space/brat?q=" + text
        shyzu.sendImageAsSticker(m.chat, data, m, { packname: "Created by Shyzu", author: m.pushName })
        } catch ({ message }) {
        return m.reply(message)
        }
        }
        break
        
        case "menu": {
        try {
        let { id, name } = await shyzu.user
        let c = "_Hello i'm Shyzu simple WhatsApp bot created by MannR. I can to do something, search, get data and information only through WhatsApp._\n\n`失敗がすべての終わりじゃない、立ち直って、人生は一度きり、絶対に諦めない、絶対に諦めない人になろう`\n\n> *(__> ALL CMD <__)*\n> [ • ] .ai\n> [ • ] .clock\n> [ • ] .enc\n> [ • ] .exec\n> [ • ] .getpp\n> [ • ] .menu\n> [ • ] .ngl\n> [ • ] .soundcloud\n> [ • ] .stc\n> [ • ] .tiktok\n> [ • ] .toptv\n\n_© MannR - 2024_"
        let z = await shyzu.profilePictureUrl(id, "image")
        shyzu.sendMessage(m.chat, { text: c, contextInfo: {
        forwardingScore: 0,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
          newsletterJid: "120363226980141082@newsletter",
          serverMessageId: 0,
          newsletterName: "私たちのチャンネルをフォローしてください"
        },
        mentionedJid: [m.sender],
        externalAdReply: {
        showAdAttribution: true,
        title: name,
        body: "© MannR - 2024",
        thumbnailUrl: z,
        sourceUrl: "https://whatsapp.com/channel/0029VaGqCO6I1rcjc9hisJ3U",
        mediaType: 1,
        renderLargerThumbnail: true
        }}})
        } catch ({ message }) {
        return m.reply(message)
        }
        }
        break
        default:
        /** if (!shyzu.auto_ai[isSender].status) return
        try {
        var { data } = await axios({
            "method": "GET",
            "url": "https://hercai.onrender.com/v3/hercai",
            "params": {
                "question": text
            }
        })
        m.reply(data.reply)
        } catch ({ message }) {
        return m.reply(message)
        } **/
    }
    } catch ({ message }) {
    console.log(chalk.redBright(message))
    }
}

let file = require.resolve(__filename);
watchFile(file, () => {
    unwatchFile(file);
    console.log(chalk.redBright(`File telah diubah: ${__filename}`));
    delete require.cache[file];
    require(file);
});
