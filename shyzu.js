/**
  * Base Ori Created By MannR
  * Name Script : Shyzu
  * Creator Script : MannR
  * Version Script : 1.2.5
  * Libary : @whiskeysockets/baileys
  * Version Libary : ^6.6.0
  * Created on Sunday, Sep 1, 2024
  * Updated on Sunday, Dec 15, 2024
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
    const groupAdmins = m.isGroup ? await participants.filter(v => v.admin !== null).map(v => v.id) : '';
    const isBotAdmins = m.isGroup ? groupAdmins.includes(shyzu.user.jid) : false
    const isAdmins = m.isGroup ? groupAdmins.includes(m.sender) : false

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

    const prefix = ['.', ',', '!', '?', '#', ''];
    const args = body.trim().split(/ +/).slice(1);
    const text = args.join(' ');
    if (!prefix.some(p => body.startsWith(p))) return;
    if (m.fromMe) return;
    const [command] = body.slice(prefix.find(p => body.startsWith(p)).length).trim().split(/ +/);
    
    var cmd = prefix + command

    await Read(shyzu, m.key.remoteJid, m.key.id);
    
    let x = chalk.bold.cyan("[ Message Shyzu ]");
    x += chalk.cyan("\nᕐ⁠ᐷ From: ")
    x += chalk.bold.white(isSender)
    x += chalk.cyan("\nᕐ⁠ᐷ Command: ")
    x += chalk.bold.white(command + " " + text)
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
    
    const sendPlay = async (text) => {
        if (!text) return m.reply("Masukan judul!")
        try {
        let { data } = await axios({
            "method": "GET",
            "url": "https://mannoffc-x.hf.space/search/spotify",
            "params": { "s": text }
        })
        let { name, artists, link, image, duration_ms } = data.result[0]
        let { data: _data } = await axios({
            "method": "GET",
            "url": "https://mannoffc-x.hf.space/download/spotify",
            "params": { "url": link }
        })
        let { download } = _data.result
        let resText = `• *Name:* ${name}\n• *Artist:* ${artists}\n• *Duration:* ${duration_ms}ms`
        let qq = await shyzu.sendMessage(m.chat, { image: { url: image }, caption: resText }, { quoted: m })
        shyzu.sendMessage(m.chat, { audio: { url: download }, mimetype: "audio/mpeg" }, { quoted: qq })
        } catch (e) {
        console.log(e)
        m.reply(e.message)
        }
    }
    
    const sendTxt2img = async (text) => {
        if (!text) return m.reply("Masukan teks!")
        try {
        var { data } = await axios({
            "method": "GET",
            "url": "https://hercai.onrender.com/v3/text2image",
            "params": { "prompt": text }
        })
        shyzu.sendMessage(m.chat, {
        image: { url: data.url }
        }, { quoted: m })
        } catch (e) {
        m.reply(e.message)
        console.log(e)
        }
    }
    
    switch (command) {

        case "ai": {
            //if (!text) return m.reply(`Contoh *.ai* <on/off>`)
            if (text == "off") {
                delete shyzu.ai_sessions[m.sender]
                m.reply("[ ✓ ] Success delete session chat")
            } else if (shyzu.ai_sessions[m.sender]) {
                m.reply("[ ! ] Ai sudah aktif lohhh kak..!!!")
            } else {
                shyzu.ai_sessions[m.sender] = { messages: [] }
                m.reply("[ ✓ ] Success create session chat\n> Ketik *.ai* off atau *matikan ai* untuk menghapus sessions chat.")
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
            method: "POST",
            url: "https://api.manaxu.my.id/api/tools/ngl",
            headers: {
              "x-api-key": "key-manaxu-free",
              "Content-Type": "application/json"
            },
            data: {
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
        
        case "brat": {
        if (!text) return m.reply("Masukan teks, Contoh *.brat* kmu knp sih?")
        try {
        let data = "https://mannoffc-x.hf.space/brat?q=" + text
        shyzu.sendImageAsSticker(m.chat, data, { pack: "Created by Shyzu", author: m.pushName, type: "full" })
        } catch ({ message }) {
        return m.reply(message)
        }
        }
        break
        
        case "videy": {
        if (!text.includes("videy.com")) return m.reply("Mana linknya?")
        try {
        let cap = `Menonton video porno itu bahaya, guys! 😤 Bisa bikin hati kita kotor dan jauh dari Allah. Dalam Al-Qur'an Surah Al-Mu'minun ayat 5-7, Allah bilang, "Dan mereka yang menjaga kemaluannya, kecuali terhadap istri-istri mereka..." Jadi, lebih baik fokus ke hal yang positif dan menjaga diri dari yang haram! 😇`
        let { data } = await axios({
            "method": "GET",
            "url": "https://mannoffc-x.hf.space/download/videy",
            "params": { "url": text }
        })
        let s = await shyzu.sendMessage(m.chat, { video: { url: data.result }}, { quoted: m })
        shyzu.sendMessage(m.chat, { text: cap }, { quoted: s })
        } catch (e) {
        m.reply("Terdapat kesalahan: " + e.message)
        console.log(e)
        }
        }
        break;

        case "play": {
        await sendPlay(text);
        }
        break;
        
        case "hitungwr": {
        if (!text) return m.reply("Contoh *.hitungwr* 650 58 89")
        let [tm, tw, mw] = text.split(" ")
        if (isNaN(tm)) return m.reply("Masukan total Match")
        if (isNaN(tw)) return m.reply("Masukan total Winrate")
        if (isNaN(mw)) return m.reply("Masukan tujuan Winrate")
        try {
        const TotalMatch = tm
        const TotalWr = tw
        const MauWr = mw

        function result() {
        if (MauWr === 100) {
        m.reply("Mana bisalahh 100% 😂");
        }
        const resultNum = rumus(TotalMatch, TotalWr, MauWr);
        const x = `Kamu memerlukan sekitar ${resultNum} win tanpa lose untuk mendapatkan win rate ${MauWr}%`;
        m.reply(x)
        }

        function rumus(TotalMatch, TotalWr, MauWr) {
        let tWin = TotalMatch * (TotalWr / 100);
        let tLose = TotalMatch - tWin;
        let sisaWr = 100 - MauWr;
        let wrResult = 100 / sisaWr;
        let seratusPersen = tLose * wrResult;
        let final = seratusPersen - TotalMatch;
        return Math.round(final);
        }
        result()
        } catch (e) {
        console.log(e)
        }
        }
        break
        
        case "txt2img": {
        await sendTxt2img(text);
        }
        break
        
        case "myip": {
        if (!isOwner) return m.reply("Khusus owner hehe :3")
        try {
        var { ip } = (await axios.get("https://api.ipify.org/?format=json")).data
        m.reply("IP: " + ip)
        } catch (e) {
        console.log(e)
        m.reply(e.message)
        }
        }
        break;
        
        case "s": case "sticker": case "stiker": {
        let q = m.quoted ? m.quoted : m
        let mime = (q.msg || q).mimetype || ''
        if (/image/.test(mime)) {
        let media = await q.download()
        shyzu.sendImageAsSticker(m.chat, media, m, { pack: "cobalagidanlagi", type: "full" })
        } else {
        m.reply("Balas sebuah gambar (ga support video) dengan *.s*")
        }
        }
        break
        
        case "menu": {
        try {
        let { id, name } = await shyzu.user
        let c = "_Hello i'm Shyzu simple WhatsApp bot created by MannR. I can to do something, search, get data and information only through WhatsApp._\n\n`失敗がすべての終わりじゃない、立ち直って、人生は一度きり、絶対に諦めない、絶対に諦めない人になろう`\n\n> *(__> ALL CMD <__)*\n> [ • ] .ai\n> [ • ] .brat\n> [ • ] .clock\n> [ • ] .enc\n> [ • ] .exec\n> [ • ] .getpp\n> [ • ] .hitungwr\n> [ • ] .menu\n> [ • ] .myip\n> [ • ] .ngl\n> [ • ] .play\n> [ • ] .soundcloud\n> [ • ] .sticker\n> [ • ] .tiktok\n> [ • ] .toptv\n> [ • ] .txt2img\n> [ • ] .videy\n\n_© MannR - 2024_"
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
        let xtx = m.text.slice(0)
        if (shyzu.ai_sessions[m.sender] && xtx) {
        if (xtx.startsWith("gambarkan")) {
        sendTxt2img(xtx.slice(9))
        } else if (xtx.includes("buka grup")) {
        if (!isGroup) return m.reply("Hmm cuma bisa digrup")
        if (!isBotAdmins) return m.reply("Jadikan bot sebagai Admin grup")
        if (!isAdmins) return m.reply("Khusus Admin")
        shyzu.groupSettingsUpdate(m.chat, "announcement")
        } else if (xtx.includes("tutup grup")) {
        if (!isGroup) return m.reply("Hmm cuma bisa digrup")
        if (!isBotAdmins) return m.reply("Jadikan bot sebagai Admin grup")
        if (!isAdmins) return m.reply("Khusus Admin")
        shyzu.groupSettingsUpdate(m.chat, "not_announcement")
        } else if (xtx.startsWith("putarkan")) {
        sendPlay(xtx.slice(8))
        } else if (xtx.includes("matikan ai")) {
        delete shyzu.ai_sessions[m.sender]
        m.reply("[ ✓ ] Success delete session chat")
        } else {
        const senderId = m.sender;
        const aiSessions = shyzu.ai_sessions

        const msgs = [
        ...aiSessions[senderId].messages,
        { content: xtx, role: "user" }
        ];

        const api_url = 'https://api.manaxu.my.id/api/ai';
        const api_key = 'key-manaxu-free';

        axios({
        method: 'POST',
        url: api_url,
        headers: {
           'x-api-key': api_key,
           'Content-Type': 'application/json'
        },
        data: {
            logic: 'nama kamu adalah Shyzu, assistent AI cerdas buatan MannR.',
            messages: msgs
        }
        })
        .then(response => {
        if (response.status === 200) {
        const { result } = response.data;
        m.reply(result ?? "Hmmm sepertinya terjadi kesalahan pada API, Minta bantuan ke owner ya.");
        aiSessions[senderId].messages.push({ content: xtx, role: "user" });
        aiSessions[senderId].messages.push({ content: result, role: "assistant" });
        shyzu.ai_sessions = aiSessions;
        } else {
        m.reply("Hmmm sepertinya terjadi kesalahan pada API, Minta bantuan ke owner ya.");
        }
        })
        .catch(error => {
        console.error(error);
        m.reply("Hmmm sepertinya terjadi kesalahan, Minta bantuan ke owner ya.");
        });
        }
        }
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
