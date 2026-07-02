const TelegramBot = require('node-telegram-bot-api');
const config = require('./config');
const { db, save, load } = require('./database');

// === PASTIKAN DB TELAH LOAD ===
load();

// === FIX UNTUK PTERODACTYL ===
const bot = new TelegramBot(config.TOKEN, { 
    polling: {
        interval: 300,
        autoStart: true,
        params: {
            timeout: 30
        }
    }
});

// ============ CONSOLE BANNER ============
console.log('🤖 DEV:@drzxcxc');
console.log('🤖 BOT:@OFFC_FTDRAZX_BOT');
console.log('📌 VERSION: 1.0');
console.log('⭐ MODE: VVIP');
console.log('⚠️ GUNAKAN DENGAN BIJAK TANPA MERUSAK');
console.log('');

// Error handling untuk polling
bot.on('polling_error', (error) => {
    console.error('Polling error:', error);
});

bot.on('error', (error) => {
    console.error('Bot error:', error);
});

// ============ VARIABEL SHARE ============
let shareIntervals = {};

// ============ FUNGSI BANTU ============

function isOwner(id) {
    return config.OWNERS.includes(id.toString());
}

function isPremium(id) {
    return db.premium && db.premium.includes(id.toString()) || isOwner(id);
}

function isAdmin(id) {
    if (!db.admins) db.admins = [];
    return db.admins.includes(id.toString()) ||
           isOwner(id) ||
           isPremium(id);
}

function formatUser(user) {
    if (!user) return 'Unknown';
    return user.username ? `@${user.username}` : user.first_name || 'User';
}

function makeQuote(text) {
    return `<blockquote>${text}</blockquote>`;
}

function makeBold(text) {
    return `<b>${text}</b>`;
}

function makeCode(text) {
    return `<code>${text}</code>`;
}

function makeItalic(text) {
    return `<i>${text}</i>`;
}

async function sendMenu(chatId, image, text, replyMarkup) {
    const sent = await bot.sendPhoto(chatId, image, {
        caption: text,
        parse_mode: "HTML",
        reply_markup: replyMarkup
    });

    if (db.lastMenuMessage && db.lastMenuMessage[chatId]) {
        try {
            await bot.deleteMessage(chatId, db.lastMenuMessage[chatId]);
        } catch (e) {
            console.log(e.message);
        }
    }

    if (!db.lastMenuMessage) db.lastMenuMessage = {};
    db.lastMenuMessage[chatId] = sent.message_id;
    save();

    return sent;
}

// ============ ANIMASI BAR ============
function getProgressBar(percent, totalWidth = 20) {
    const filled = Math.round((percent / 100) * totalWidth);
    const empty = totalWidth - filled;
    return '█'.repeat(filled) + '░'.repeat(empty);
}

function getProgressEmoji(percent) {
    if (percent < 20) return '🟥';
    if (percent < 40) return '🟧';
    if (percent < 60) return '🟨';
    if (percent < 80) return '🟩';
    return '✅';
}

// ============ MENU UTAMA ============
async function showMainMenu(chatId, userId) {
    if (!isAdmin(userId) && !isPremium(userId)) {
        const user = await bot.getChatMember(chatId, userId).catch(() => ({ user: { first_name: 'User' } }));
        return bot.sendMessage(chatId, 
            `${makeQuote(`❌ Akses Ditolak!\n\nHalo ${formatUser(user.user)}, Anda belum terverifikasi.\nHubungi owner: @${config.MAIN_OWNER}`)}`,
            { parse_mode: 'HTML' }
        );
    }

    const user = await bot.getChatMember(chatId, userId).catch(() => ({
    user: { first_name: "User" }
}));

const menuText =
`${makeQuote(`🤖 BOT FT CS BY DRAZX

Halo, ${formatUser(user.user)}! 👋

👑 OWNER : ${isOwner(userId) ? "✅" : "❎"}
⭐ PREMIUM : ${isPremium(userId) ? "✅" : "❎"}

Selamat datang di pusat layanan BOT FT CS BY DRAZX.

⚙️ Fitur Lengkap
⚡ Respon Cepat
🛡️ Anti Delay
🌐 Online 24 Jam

Tekan tombol menu di bawah untuk memulai.
Selamat menggunakan! 🚀

👨‍💻 Dev: @drzxcx`)}`;

    const replyMarkup = {
        inline_keyboard: [
            [{ text: '👑 Owner Menu', callback_data: 'owner_menu' }],
            [{ text: '⭐ Premium Menu', callback_data: 'premium_menu' }]
        ]
    };

    await sendMenu(
    chatId,
    config.MENU_IMAGE,
    menuText,
    replyMarkup
    );
    return;   
  }

// ============ COMMAND HANDLER - TANPA PREFIX / ============

async function handleCommand(msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const text = msg.text ? msg.text.trim() : '';
    
    const parts = text.split(' ');
    const command = parts[0].toLowerCase();
    const args = parts.slice(1);
    
    if (command === '/start' && msg.chat.type === 'private') {
        await showMainMenu(chatId, userId);
        return;
    }
    
    if (command === 'menu') {
        await showMainMenu(chatId, userId);
        return;
    }
    
    if (command === 'full') {
        await fullCommand(msg);
        return;
    }
    
    if (command === 'addrules') {
        await addRules(msg);
        return;
    }
    
    if (command === 'bc') {
        await bcCommand(msg);
        return;
    }
    
    if (command === 'share') {
        await shareCommand(msg, args);
        return;
    }
    
    if (command === 'stopshare') {
        await stopShareCommand(msg);
        return;
    }
    
    if (command === 'addprem') {
        await addPremium(msg);
        return;
    }
    
    if (command === 'delprem') {
        await delPremium(msg);
        return;
    }
    
    if (command === 'listprem') {
        await totalPremium(msg);
        return;
    }
    
    if (command === 'listgb') {
        await listGroups(msg);
        return;
    }
    
    if (command === 'ping') {
        await ping(msg);
        return;
    }
    
    if (command === 'addpay') {
        await addPayment(msg);
        return;
    }
    
    if (command === 'pay') {
        await showPayment(msg);
        return;
    }
    
    if (['d1', 'd2', 'd3', 'd4'].includes(command)) {
        const num = parseInt(command.charAt(1));
        await handleDuel(msg, num);
        return;
    }
    
    if (command === 'resetduel') {
        await resetDuel(msg);
        return;
    }
}

// ============ FITUR full ============
async function fullCommand(msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    
    if (!isAdmin(userId) && !isPremium(userId)) {
        return bot.sendMessage(chatId, 
            `${makeQuote('❌ Anda tidak memiliki akses ke command ini!')}`,
            { parse_mode: 'HTML' }
        );
    }
    
    if (msg.chat.type !== 'group' && msg.chat.type !== 'supergroup') {
        return bot.sendMessage(chatId, 
            `${makeQuote('❌ Perintah ini hanya bisa digunakan di dalam GRUP!')}`,
            { parse_mode: 'HTML' }
        );
    }
    
    try {
        const member = await bot.getChatMember(chatId, userId);
        const isGroupAdmin = member.status === 'administrator' || member.status === 'creator';
        
        if (!isGroupAdmin) {
            return bot.sendMessage(chatId, 
                `${makeQuote('❌ Anda harus menjadi ADMIN di grup ini untuk menggunakan full!')}`,
                { parse_mode: 'HTML' }
            );
        }
        
        const botId = (await bot.getMe()).id;
        const botMember = await bot.getChatMember(chatId, botId);
        const isBotAdmin = botMember.status === 'administrator' || botMember.status === 'creator';
        
        if (!isBotAdmin) {
            return bot.sendMessage(chatId, 
                `${makeQuote(`❌ Bot harus menjadi ADMIN di grup ini!\n\n${makeBold('Cara:')}\n1. Klik profil bot\n2. Pilih "Add to Admin"\n3. Berikan izin ${makeCode('Change group info')} dan ${makeCode('Invite users')}`)}`,
                { parse_mode: 'HTML' }
            );
        }
        
        const chat = await bot.getChat(chatId);
        const currentName = chat.title;
        
        if (currentName.includes('FULL + INGAME✅') || currentName.includes('FULL+INGAME✅')) {
            return bot.sendMessage(chatId, 
                `${makeQuote(`⚠️ Grup ini sudah dalam status ${makeBold('FULL + INGAME✅')}!\n\n📌 Nama saat ini: ${makeBold(currentName)}`)}`,
                { parse_mode: 'HTML' }
            );
        }
        
        let newName = currentName;
        newName = newName.replace(/ FULL\s*\+\s*INGAME✅/i, '');
        newName = newName.replace(/ FULL\+INGAME✅/i, '');
        newName = newName.replace(/ FULL\s*✅/i, '');
        newName = newName.replace(/ FULL✅/i, '');
        newName = newName.replace(/ INGAME✅/i, '');
        newName = newName.replace(/ - FULL✅/i, '');
        newName = newName.replace(/ FULL/i, '');
        newName = newName.replace(/✅/g, '');
        newName = newName.trim();
        newName = newName + ' FULL + INGAME✅';
        
        const loadingMsg = await bot.sendMessage(chatId, 
            `${makeQuote('🔄 Sedang memproses...')}`,
            { parse_mode: 'HTML' }
        );
        
        try {
            await bot.setChatTitle(chatId, newName);
        } catch (e) {
            await bot.editMessageText(
                `${makeQuote(`❌ Gagal mengubah nama grup!\n\nError: ${e.message}`)}`,
                {
                    chat_id: chatId,
                    message_id: loadingMsg.message_id,
                    parse_mode: 'HTML'
                }
            );
            return;
        }
        
        try {
            await bot.createChatInviteLink(chatId, {
                member_limit: 1,
                expire_date: Math.floor(Date.now() / 1000) + 86400
            });
        } catch (e) {}
        
        const rulesLink = db.rules && db.rules[userId.toString()] ? db.rules[userId.toString()] : null;
        
        const replyMarkup = {
            inline_keyboard: [
                [{ text: '📋 RULES', url: rulesLink || 'https://t.me/yourrules' }]
            ]
        };
        
        const resultMessage = `${makeQuote(`${makeBold('✅ ALL UDH DONE GAS SUNG MAIN!')}`)}`;

        await bot.editMessageText(resultMessage, {
            chat_id: chatId,
            message_id: loadingMsg.message_id,
            parse_mode: 'HTML',
            disable_web_page_preview: true,
            reply_markup: replyMarkup
        });
        
        for (const ownerId of config.OWNERS) {
            try {
                await bot.sendMessage(ownerId, 
                    `${makeQuote(`${makeBold('📢 full digunakan!')}\n\n${makeBold('📌 Grup:')} ${newName}\n${makeBold('🆔 ID:')} ${makeCode(chatId)}\n${makeBold('👤 Oleh:')} ${formatUser(msg.from)}`)}`,
                    { parse_mode: 'HTML' }
                );
            } catch (e) {}
        }
        
    } catch (error) {
        console.error('Error di full:', error);
        bot.sendMessage(chatId, 
            `${makeQuote(`❌ Terjadi kesalahan!\n\nError: ${error.message}`)}`,
            { parse_mode: 'HTML' }
        );
    }
}

// ============ FITUR addrules ============
async function addRules(msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    
    if (!isAdmin(userId) && !isPremium(userId)) {
        return bot.sendMessage(chatId, `${makeQuote('❌ Anda tidak memiliki akses!')}`, { parse_mode: 'HTML' });
    }
    
    if (!msg.reply_to_message || !msg.reply_to_message.text) {
        return bot.sendMessage(chatId, 
            `${makeQuote('❌ Reply pesan yang berisi LINK RULES dengan addrules\n\nContoh:\n1. Kirim pesan berisi link rules\n2. Reply pesan tersebut dengan addrules')}`,
            { parse_mode: 'HTML' }
        );
    }
    
    const text = msg.reply_to_message.text.trim();
    const urlRegex = /(https?:\/\/[^\s]+)/gi;
    const urls = text.match(urlRegex);
    
    if (!urls || urls.length === 0) {
        return bot.sendMessage(chatId, 
            `${makeQuote('❌ Tidak ditemukan LINK di pesan yang di-reply!\n\nPastikan pesan berisi link rules yang valid.')}`,
            { parse_mode: 'HTML' }
        );
    }
    
    const link = urls[0];
    
    if (!db.rules) db.rules = {};
    db.rules[userId.toString()] = link;
    save();
    
    const userInfo = await bot.getChatMember(chatId, userId).then(m => m.user);
    
    bot.sendMessage(chatId, 
        `${makeQuote(`${makeBold('✅ Rules berhasil disimpan!')}\n\n${makeBold('👤 User:')} ${formatUser(userInfo)}\n${makeBold('🔗 Link Rules:')}\n${link}\n\n💡 Sekarang tombol RULES akan mengarah ke link ini saat full dijalankan.`)}`,
        { parse_mode: 'HTML' }
    );
}

// ============ SHOW PAYMENT ============
async function showPayment(msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    
    if (!isAdmin(userId) && !isPremium(userId)) {
        return bot.sendMessage(chatId, `${makeQuote('❌ Anda tidak memiliki akses!')}`, { parse_mode: 'HTML' });
    }
    
    const payment = db.payments[userId.toString()];
    if (!payment) return bot.sendMessage(chatId, `${makeQuote('❌ Belum punya QRIS. Gunakan addpay')}`, { parse_mode: 'HTML' });
    
    const qrisCaption = 
`${makeQuote(
`${makeBold('QRIS PAYMENT BY @' + config.MAIN_OWNER + ' 🔰')}\n\n` +
`${makeBold('TRX WAJIB SERTAKAN BUKTI‼️')}\n` +
`${makeBold('BUKPAL? LU GW TANDAIN‼️')}`
)}`;
    
    bot.sendPhoto(chatId, payment.fileId, {
        caption: qrisCaption,
        parse_mode: 'HTML'
    });
}

// ============ ADD PAYMENT ============
async function addPayment(msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    
    if (!isAdmin(userId) && !isPremium(userId)) {
        return bot.sendMessage(chatId, `${makeQuote('❌ Anda tidak memiliki akses!')}`, { parse_mode: 'HTML' });
    }
    
    if (!msg.reply_to_message || !msg.reply_to_message.photo) {
        return bot.sendMessage(chatId, `${makeQuote('❌ Reply foto QRIS dengan addpay')}`, { parse_mode: 'HTML' });
    }
    
    const photo = msg.reply_to_message.photo[msg.reply_to_message.photo.length - 1];
    db.payments[userId.toString()] = {
        fileId: photo.file_id,
        timestamp: new Date().toISOString()
    };
    save();
    bot.sendMessage(chatId, `${makeQuote(`${makeBold('✅ QRIS berhasil disimpan!')}`)}`, { parse_mode: 'HTML' });
}

// ============ DUEL COMMANDS ============
async function handleDuel(msg, num) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    
    if (!isAdmin(userId) && !isPremium(userId)) {
        return bot.sendMessage(chatId, `${makeQuote('❌ Anda tidak memiliki akses!')}`, { parse_mode: 'HTML' });
    }
    
    if (!msg.reply_to_message || !msg.reply_to_message.from) {
        return bot.sendMessage(chatId, `${makeQuote(`❌ Reply pesan peserta dengan d${num}`)}`, { parse_mode: 'HTML' });
    }
    
    if (!db.duels[chatId]) db.duels[chatId] = { d1: null, d2: null, d3: null, d4: null };
    
    const key = `d${num}`;
    if (db.duels[chatId][key]) {
        return bot.sendMessage(chatId, `${makeQuote(`⚠️ Slot D${num} sudah terisi!`)}`, { parse_mode: 'HTML' });
    }
    
    const target = {
        id: msg.reply_to_message.from.id.toString(),
        username: formatUser(msg.reply_to_message.from)
    };
    
    let duplicateSlot = null;
    for (let i = 1; i <= 4; i++) {
        const slot = `d${i}`;
        if (db.duels[chatId][slot] && db.duels[chatId][slot].id === target.id) {
            duplicateSlot = `D${i}`;
            break;
        }
    }
    
    if (duplicateSlot) {
        const errorMsg = 
`${makeQuote(
`⚠️ ${makeBold('USER SUDAH TERDAFTAR!')}\n\n` +
`${target.username} sudah terdaftar di slot ${makeBold(duplicateSlot)}.\n\n` +
`${makeBold('Pilih user lain untuk slot D' + num)}.`
)}`;
        return bot.sendMessage(chatId, errorMsg, { parse_mode: 'HTML' });
    }
    
    db.duels[chatId][key] = target;
    save();
    
    const duel = db.duels[chatId];
    
    if (duel.d1 && duel.d2) {
        const pot1Message = 
`${makeQuote(
`${makeBold('🔥 POT 1 SIAP 🔥')}\n\n` +
`${duel.d1.username} 🆚 ${duel.d2.username}`
)}`;
        await bot.sendMessage(chatId, pot1Message, { parse_mode: 'HTML' });
        
        db.duels[chatId].d1 = null;
        db.duels[chatId].d2 = null;
        save();
    }
    
    if (duel.d3 && duel.d4) {
        const pot2Message = 
`${makeQuote(
`${makeBold('🔥 POT 2 SIAP 🔥')}\n\n` +
`${duel.d3.username} 🆚 ${duel.d4.username}`
)}`;
        await bot.sendMessage(chatId, pot2Message, { parse_mode: 'HTML' });
        
        db.duels[chatId].d3 = null;
        db.duels[chatId].d4 = null;
        save();
    }
    
    const currentDuel = db.duels[chatId];
    let statusMsg = `${makeQuote(`${makeBold('📊 Status Slot Saat Ini:')}`)}`;
    let slotStatus = '';
    for (let i = 1; i <= 4; i++) {
        const slot = `d${i}`;
        const user = currentDuel[slot];
        const status = user ? `✅ ${user.username}` : '❌ Kosong';
        slotStatus += `D${i}: ${status}\n`;
    }
    statusMsg += `\n${slotStatus}`;
    
    let pairInfo = '';
    if (currentDuel.d1 && currentDuel.d2) pairInfo += `\n✅ D1 + D2 sudah siap untuk POT!`;
    if (currentDuel.d3 && currentDuel.d4) pairInfo += `\n✅ D3 + D4 sudah siap untuk POT!`;
    if (!currentDuel.d1 || !currentDuel.d2) pairInfo += `\n💡 Butuh pasangan untuk D1 & D2`;
    if (!currentDuel.d3 || !currentDuel.d4) pairInfo += `\n💡 Butuh pasangan untuk D3 & D4`;
    statusMsg += `\n${pairInfo}`;
    
    await bot.sendMessage(chatId, statusMsg, { parse_mode: 'HTML' });
}

async function resetDuel(msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    
    if (!isAdmin(userId) && !isPremium(userId)) {
        return bot.sendMessage(chatId, `${makeQuote('❌ Anda tidak memiliki akses!')}`, { parse_mode: 'HTML' });
    }
    
    if (!db.duels[chatId]) db.duels[chatId] = { d1: null, d2: null, d3: null, d4: null };
    db.duels[chatId] = { d1: null, d2: null, d3: null, d4: null };
    save();
    bot.sendMessage(chatId, `${makeQuote(`${makeBold('🔄 Semua slot duel direset!')}`)}`, { parse_mode: 'HTML' });
}

// ============ FITUR bc ============
async function bcCommand(msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    
    if (!isPremium(userId) && !isOwner(userId)) {
        return bot.sendMessage(chatId, 
            `${makeQuote('❌ Command ini hanya untuk PREMIUM dan OWNER!')}`,
            { parse_mode: 'HTML' }
        );
    }
    
    if (!msg.reply_to_message) {
        return bot.sendMessage(chatId, 
            `${makeQuote(`${makeBold('❌ Format salah!')}\n\nReply pesan yang mau di-BC dengan:\nbc`)}`,
            { parse_mode: 'HTML' }
        );
    }
    
    const replyMsg = msg.reply_to_message;
    const targets = db.groups ? db.groups.filter(g => g.canBroadcast) : [];
    if (!targets.length) {
        return bot.sendMessage(chatId, 
            `${makeQuote('❌ Tidak ada grup aktif dengan member >= 100!')}`,
            { parse_mode: 'HTML' }
        );
    }
    
    const totalGroups = targets.length;
    
    const statusMsg = await bot.sendMessage(chatId, 
        `${makeQuote(
`${makeBold('📢 BROADCAST DIMULAI')}\n\n` +
`📊 Total Grup: ${totalGroups}\n` +
`📨 Grup yang memenuhi syarat: ${totalGroups}\n\n` +
`${getProgressEmoji(0)} [${getProgressBar(0)}] 0%`
)}`,
        { parse_mode: 'HTML' }
    );
    
    async function updateProgress(percent, success, failed) {
        const emoji = getProgressEmoji(percent);
        const bar = getProgressBar(percent);
        const text = 
`${makeQuote(
`${makeBold('📢 BROADCAST')}\n\n` +
`📊 Total Grup: ${totalGroups}\n` +
`✅ Berhasil: ${success}\n` +
`❌ Gagal: ${failed}\n\n` +
`${emoji} [${bar}] ${percent}%`
)}`;
        try {
            await bot.editMessageText(text, {
                chat_id: chatId,
                message_id: statusMsg.message_id,
                parse_mode: 'HTML'
            });
        } catch (e) {}
    }
    
    let success = 0, failed = 0;
    const total = targets.length;
    let sentCount = 0;
    
    await updateProgress(0, 0, 0);
    
    for (let i = 0; i < targets.length; i++) {
        const g = targets[i];
        try {
            if (replyMsg.text) {
                await bot.sendMessage(g.id, `${makeQuote(`${makeBold('📢 BROADCAST')}\n\n${replyMsg.text}`)}`, { 
                    parse_mode: 'HTML',
                    disable_web_page_preview: true
                });
            } else if (replyMsg.photo) {
                const photo = replyMsg.photo[replyMsg.photo.length - 1];
                await bot.sendPhoto(g.id, photo.file_id, {
                    caption: `${makeQuote(`${makeBold('📢 BROADCAST')}\n\n${replyMsg.caption || ''}`)}`,
                    parse_mode: 'HTML'
                });
            } else if (replyMsg.video) {
                await bot.sendVideo(g.id, replyMsg.video.file_id, {
                    caption: `${makeQuote(`${makeBold('📢 BROADCAST')}\n\n${replyMsg.caption || ''}`)}`,
                    parse_mode: 'HTML'
                });
            } else if (replyMsg.document) {
                await bot.sendDocument(g.id, replyMsg.document.file_id, {
                    caption: `${makeQuote(`${makeBold('📢 BROADCAST')}\n\n${replyMsg.caption || ''}`)}`,
                    parse_mode: 'HTML'
                });
            } else {
                await bot.sendMessage(g.id, `${makeQuote(`${makeBold('📢 BROADCAST')}\n\n[Media tidak didukung]`)}`, { 
                    parse_mode: 'HTML'
                });
            }
            success++;
        } catch (e) {
            failed++;
        }
        sentCount++;
        
        if (sentCount % 5 === 0 || sentCount === total) {
            const progressPercent = Math.round((sentCount / total) * 100);
            await updateProgress(progressPercent, success, failed);
        }
    }
    
    await updateProgress(100, success, failed);
    
    const resultText = 
`${makeQuote(
`${makeBold('✅ BROADCAST SELESAI!')}\n\n` +
`📊 Total Grup: ${totalGroups}\n` +
`📨 Berhasil: ${success}\n` +
`❌ Gagal: ${failed}\n\n` +
`📌 Untuk broadcast lagi, reply pesan lain dengan bc`
)}`;
    
    await bot.editMessageText(resultText, {
        chat_id: chatId,
        message_id: statusMsg.message_id,
        parse_mode: 'HTML'
    });
}

// ============ FITUR share ============
async function shareCommand(msg, args) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    
    if (!isOwner(userId)) {
        return bot.sendMessage(chatId, `${makeQuote('❌ Command ini hanya untuk OWNER!')}`, { parse_mode: 'HTML' });
    }
    
    if (!msg.reply_to_message) {
        return bot.sendMessage(chatId, 
            `${makeQuote(`${makeBold('❌ Format salah!')}\n\nReply pesan yang mau di-share dengan:\nshare <menit>\n\nContoh: share 5`)}`,
            { parse_mode: 'HTML' }
        );
    }
    
    if (args.length < 1 || isNaN(args[0]) || parseInt(args[0]) < 1) {
        return bot.sendMessage(chatId, 
            `${makeQuote(`${makeBold('❌ Format salah!')}\n\nReply pesan yang mau di-share dengan:\nshare <menit>\n\nContoh: share 5`)}`,
            { parse_mode: 'HTML' }
        );
    }
    
    const minutes = parseInt(args[0]);
    const ms = minutes * 60 * 1000;
    
    if (shareIntervals[chatId] && shareIntervals[chatId].running) {
        return bot.sendMessage(chatId, 
            `${makeQuote(`⚠️ Sudah ada SHARE aktif di chat ini!\nDelay: ${shareIntervals[chatId].delay} menit\n\nGunakan stopshare untuk menghentikan.`)}`,
            { parse_mode: 'HTML' }
        );
    }
    
    const replyMsg = msg.reply_to_message;
    
    async function doShare() {
        const targets = db.groups ? db.groups.filter(g => g.canBroadcast) : [];
        if (!targets.length) {
            await bot.sendMessage(chatId, `${makeQuote('❌ Tidak ada grup aktif untuk broadcast!')}`, { parse_mode: 'HTML' });
            return { success: 0, failed: 0, total: 0 };
        }
        
        let success = 0, failed = 0;
        for (const g of targets) {
            try {
                if (replyMsg.text) {
                    await bot.sendMessage(g.id, `${makeQuote(`${makeBold('📢 SHARE')}\n\n${replyMsg.text}`)}`, { 
                        parse_mode: 'HTML',
                        disable_web_page_preview: true
                    });
                } else if (replyMsg.photo) {
                    const photo = replyMsg.photo[replyMsg.photo.length - 1];
                    await bot.sendPhoto(g.id, photo.file_id, {
                        caption: `${makeQuote(`${makeBold('📢 SHARE')}\n\n${replyMsg.caption || ''}`)}`,
                        parse_mode: 'HTML'
                    });
                } else if (replyMsg.video) {
                    await bot.sendVideo(g.id, replyMsg.video.file_id, {
                        caption: `${makeQuote(`${makeBold('📢 SHARE')}\n\n${replyMsg.caption || ''}`)}`,
                        parse_mode: 'HTML'
                    });
                } else if (replyMsg.document) {
                    await bot.sendDocument(g.id, replyMsg.document.file_id, {
                        caption: `${makeQuote(`${makeBold('📢 SHARE')}\n\n${replyMsg.caption || ''}`)}`,
                        parse_mode: 'HTML'
                    });
                } else {
                    await bot.sendMessage(g.id, `${makeQuote(`${makeBold('📢 SHARE')}\n\n[Media tidak didukung]`)}`, { 
                        parse_mode: 'HTML'
                    });
                }
                success++;
            } catch (e) {
                failed++;
            }
            await new Promise(r => setTimeout(r, 500));
        }
        
        return { success, failed, total: targets.length };
    }
    
    const statusMsg = await bot.sendMessage(chatId, 
        `${makeQuote(`✅ SHARE diaktifkan!\n\n⏱️ Delay: ${minutes} menit\n📨 Akan broadcast setiap ${minutes} menit.\n\nGunakan stopshare untuk menghentikan.`)}`,
        { parse_mode: 'HTML' }
    );
    
    const result = await doShare();
    await bot.editMessageText(
        `${makeQuote(`✅ SHARE diaktifkan!\n\n⏱️ Delay: ${minutes} menit\n📊 Broadcast pertama selesai!\n📨 Berhasil: ${result.success}\n❌ Gagal: ${result.failed}\n\nGunakan stopshare untuk menghentikan.`)}`,
        {
            chat_id: chatId,
            message_id: statusMsg.message_id,
            parse_mode: 'HTML'
        }
    );
    
    const intervalId = setInterval(async () => {
        try {
            const result = await doShare();
            await bot.sendMessage(chatId, 
                `${makeQuote(`✅ SHARE OTOMATIS\n\n⏱️ Delay: ${minutes} menit\n📨 Berhasil: ${result.success}\n❌ Gagal: ${result.failed}`)}`,
                { parse_mode: 'HTML' }
            );
        } catch (e) {
            console.error('Error di share interval:', e);
        }
    }, ms);
    
    shareIntervals[chatId] = {
        intervalId: intervalId,
        delay: minutes,
        running: true,
        statusMsgId: statusMsg.message_id
    };
}

// ============ FITUR stopshare ============
async function stopShareCommand(msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    
    if (!isOwner(userId)) {
        return bot.sendMessage(chatId, `${makeQuote('❌ Command ini hanya untuk OWNER!')}`, { parse_mode: 'HTML' });
    }
    
    if (!shareIntervals[chatId] || !shareIntervals[chatId].running) {
        return bot.sendMessage(chatId, `${makeQuote('⚠️ Tidak ada SHARE yang aktif di chat ini.')}`, { parse_mode: 'HTML' });
    }
    
    clearInterval(shareIntervals[chatId].intervalId);
    shareIntervals[chatId].running = false;
    
    await bot.sendMessage(chatId, 
        `${makeQuote(`✅ SHARE dihentikan!\n\nTotal berjalan selama ${shareIntervals[chatId].delay} menit per interval.`)}`,
        { parse_mode: 'HTML' }
    );
    
    delete shareIntervals[chatId];
}

// ============ PREMIUM COMMANDS ============
async function addPremium(msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    if (!isOwner(userId)) {
        return bot.sendMessage(chatId,
            `${makeQuote('❌ Hanya owner!')}`,
            { parse_mode: 'HTML' }
        );
    }

    if (!msg.reply_to_message) {
        return bot.sendMessage(chatId,
            `${makeQuote('❌ Reply pesan user yang ingin dijadikan Premium!')}`,
            { parse_mode: 'HTML' }
        );
    }

    const targetUser = msg.reply_to_message.from;
    const id = targetUser.id.toString();

    if (!db.premium) db.premium = [];

    if (config.OWNERS.includes(id)) {
        return bot.sendMessage(chatId,
            `${makeQuote('❌ User tersebut adalah Owner!')}`,
            { parse_mode: 'HTML' }
        );
    }

    if (db.premium.includes(id)) {
        return bot.sendMessage(chatId,
            `${makeQuote('❌ User sudah Premium!')}`,
            { parse_mode: 'HTML' }
        );
    }

    db.premium.push(id);
    save();

    await bot.sendMessage(chatId,
        `${makeQuote(
            `✅ Premium berhasil ditambahkan!\n\n` +
            `👤 User: ${formatUser(targetUser)}\n` +
            `🆔 ID: ${makeCode(id)}`
        )}`,
        { parse_mode: 'HTML' }
    );

    try {
        await bot.sendMessage(id,
            `${makeQuote('🎉 Selamat! Anda sekarang menjadi Premium User.')}`,
            { parse_mode: 'HTML' }
        );
    } catch (e) {}
}

async function delPremium(msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    if (!isOwner(userId)) {
        return bot.sendMessage(chatId,
            `${makeQuote('❌ Hanya owner!')}`,
            { parse_mode: 'HTML' }
        );
    }

    if (!msg.reply_to_message) {
        return bot.sendMessage(chatId,
            `${makeQuote('❌ Reply pesan user yang ingin dihapus dari Premium!')}`,
            { parse_mode: 'HTML' }
        );
    }

    const targetUser = msg.reply_to_message.from;
    const id = targetUser.id.toString();

    if (!db.premium || !db.premium.includes(id)) {
        return bot.sendMessage(chatId,
            `${makeQuote('❌ User tersebut bukan Premium!')}`,
            { parse_mode: 'HTML' }
        );
    }

    db.premium = db.premium.filter(p => p !== id);
    save();

    await bot.sendMessage(chatId,
        `${makeQuote(
            `✅ Premium berhasil dihapus!\n\n` +
            `👤 User: ${formatUser(targetUser)}\n` +
            `🆔 ID: ${makeCode(id)}`
        )}`,
        { parse_mode: 'HTML' }
    );

    try {
        await bot.sendMessage(id,
            `${makeQuote('❌ Status Premium Anda telah dicabut.')}`,
            { parse_mode: 'HTML' }
        );
    } catch (e) {}
}

async function totalPremium(msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    
    if (!isOwner(userId)) return bot.sendMessage(chatId, `${makeQuote('❌ Bukan owner!')}`, { parse_mode: 'HTML' });
    
    let msgText = `${makeQuote(`${makeBold('⭐ Premium (' + (db.premium ? db.premium.length : 0) + ')')}`)}\n\n`;
    if (db.premium) {
        for (const id of db.premium) {
            try {
                const user = await bot.getChatMember(chatId, parseInt(id));
                msgText += `${makeQuote(`• ${formatUser(user.user)} (ID: ${makeCode(id)})`)}\n`;
            } catch {
                msgText += `${makeQuote(`• ID: ${makeCode(id)}`)}\n`;
            }
        }
    }
    bot.sendMessage(chatId, msgText, { parse_mode: 'HTML' });
}

// ============ LIST GROUPS ============
async function listGroups(msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    
    if (!isOwner(userId)) return bot.sendMessage(chatId, `${makeQuote('❌ Bukan owner!')}`, { parse_mode: 'HTML' });
    if (!db.groups || !db.groups.length) return bot.sendMessage(chatId, `${makeQuote('📭 Belum ada grup.')}`, { parse_mode: 'HTML' });
    
    let msgText = `${makeQuote(`${makeBold('📋 Daftar Grup (' + db.groups.length + ')')}`)}\n\n`;
    db.groups.forEach((g, i) => {
        msgText += `${makeQuote(`${i+1}. ${makeBold(g.name)}\n   ID: ${makeCode(g.id)} | Member: ${g.memberCount}\n   Broadcast: ${g.canBroadcast ? '✅' : '❌'}`)}\n\n`;
    });
    bot.sendMessage(chatId, msgText, { parse_mode: 'HTML' });
}

// ============ PING ============
async function ping(msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    
    if (!isOwner(userId)) return bot.sendMessage(chatId, `${makeQuote('❌ Bukan owner!')}`, { parse_mode: 'HTML' });
    const start = Date.now();
    bot.sendMessage(chatId, `${makeQuote('🏓 Pinging...')}`, { parse_mode: 'HTML' }).then(sent => {
        bot.editMessageText(`${makeQuote(`${makeBold('🏓 Pong!')}\n${makeBold('📡')} ${Date.now() - start}ms`)}`, {
            chat_id: chatId,
            message_id: sent.message_id,
            parse_mode: 'HTML'
        });
    });
}

// ============ REGISTER GROUP ============
async function registerGroup(chatId) {
    try {
        const memberCount = await bot.getChatMembersCount(chatId).catch(() => 0);
        const botId = (await bot.getMe()).id;
        const member = await bot.getChatMember(chatId, botId).catch(() => null);
        const isAdminBot = member && (member.status === 'administrator' || member.status === 'creator');
        const chat = await bot.getChat(chatId).catch(() => null);
        const name = chat ? chat.title : chatId;
        
        const info = {
            id: chatId.toString(),
            name: name,
            memberCount: memberCount,
            isAdmin: isAdminBot,
            canBroadcast: isAdminBot && memberCount >= config.MIN_MEMBER
        };
        
        const existing = db.groups ? db.groups.find(g => g.id === info.id) : null;
        
        if (existing) {
            Object.assign(existing, info);
        } else {
            if (!db.groups) db.groups = [];
            db.groups.push(info);
            const msg = `${makeQuote(`${makeBold('📢 Grup Baru!')}\n\n${makeBold('📌')} ${info.name}\n${makeBold('🆔')} ${makeCode(info.id)}\n${makeBold('👥')} ${info.memberCount} member\n${makeBold('🛡️ Admin:')} ${info.isAdmin ? '✅' : '❌'}\n${makeBold('📡 Broadcast:')} ${info.canBroadcast ? '✅' : '❌'}`)}`;
            for (const ownerId of config.OWNERS) {
                bot.sendMessage(ownerId, msg, { parse_mode: 'HTML' }).catch(() => {});
            }
        }
        save();
    } catch (e) {}
}

// ============ EVENT HANDLER ============

bot.on('message', async (msg) => {
    if (!msg.text) return;
    if (msg.chat.type !== 'private' && msg.chat.type !== 'group' && msg.chat.type !== 'supergroup') return;
    
    const text = msg.text.trim();
    if (text.startsWith('/')) return;
    
    await handleCommand(msg);
});

bot.on('new_chat_members', async (msg) => {
    if (!msg.chat || (msg.chat.type !== 'group' && msg.chat.type !== 'supergroup')) return;
    try {
        const botId = (await bot.getMe()).id;
        const isBot = msg.new_chat_members.some(m => m.id === botId);
        if (isBot) {
            await registerGroup(msg.chat.id);
        }
    } catch (e) {}
});

bot.on('left_chat_member', async (msg) => {
    if (!msg.chat || (msg.chat.type !== 'group' && msg.chat.type !== 'supergroup')) return;
    try {
        const botId = (await bot.getMe()).id;
        if (msg.left_chat_member && msg.left_chat_member.id === botId) {
            db.groups = db.groups ? db.groups.filter(g => g.id !== msg.chat.id.toString()) : [];
            save();
        }
    } catch (e) {}
});

bot.on('message', async (msg) => {
    if (!msg.chat || (msg.chat.type !== 'group' && msg.chat.type !== 'supergroup')) return;
    try {
        const group = db.groups ? db.groups.find(g => g.id === msg.chat.id.toString()) : null;
        if (group) {
            const now = Date.now();
            if (!group.lastUpdate || now - group.lastUpdate > 1800000) {
                const memberCount = await bot.getChatMembersCount(msg.chat.id).catch(() => 0);
                const botId = (await bot.getMe()).id;
                const member = await bot.getChatMember(msg.chat.id, botId).catch(() => null);
                const isAdminBot = member && (member.status === 'administrator' || member.status === 'creator');
                const chat = await bot.getChat(msg.chat.id).catch(() => null);
                const name = chat ? chat.title : msg.chat.id;
                
                group.name = name;
                group.memberCount = memberCount;
                group.isAdmin = isAdminBot;
                group.canBroadcast = isAdminBot && memberCount >= config.MIN_MEMBER;
                group.lastUpdate = now;
                save();
            }
        }
    } catch (e) {}
});

// ============ CALLBACK QUERY ============
bot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;
    const messageId = query.message.message_id;
    const userId = query.from.id;

    console.log("========== CALLBACK ==========");
    console.log("User ID      :", userId);
    console.log("Callback Data:", query.data);
    console.log("Owner List   :", config.OWNERS);
    console.log("Is Owner     :", isOwner(userId));
    console.log("==============================");

    bot.answerCallbackQuery(query.id);
    
    // ============ OWNER MENU ============
    if (query.data === 'owner_menu') {
        if (!isOwner(userId)) {
            return bot.sendMessage(chatId, `${makeQuote('❌ Hanya owner!')}`, { parse_mode: 'HTML' });
        }
        
        const ownerMenuText = 
`${makeQuote(`${makeBold('👑 Owner Menu')}\n\n` +
`share (menit) - Broadcast otomatis setiap menit (reply)\n` +
`stopshare - Hentikan share\n` +
`addprem - Tambah premium\n` +
`delprem - Hapus premium\n` +
`listprem - List premium\n` +
`listgb - List grup\n` +
`ping - Cek bot`)}`;

        const replyMarkup = {
            inline_keyboard: [
                [{ text: '🔙 BACK', callback_data: 'back_to_menu' }]
            ]
        };

        try {
    await sendMenu(
        chatId,
        config.MENU_IMAGE,
        ownerMenuText,
        replyMarkup
    );
} catch (e) {
    console.error("OWNER MENU ERROR:");
    console.error(e);
}

return;
}
    
    // ============ PREMIUM MENU ============
    if (query.data === 'premium_menu') {
        if (!isPremium(userId) && !isOwner(userId)) {
            return bot.sendMessage(chatId, `${makeQuote('❌ Hanya premium/owner!')}`, { parse_mode: 'HTML' });
        }
        
        const premiumMenuText = 
`${makeQuote(`${makeBold('⭐ Premium Menu')}\n\n` +
`bc - Broadcast pesan ke semua grup (reply)\n` +
`full - FULL + INGAME✅ + tombol RULES\n` +
`addrules - Tambah link rules\n` +
`d1-d4 - Tandai peserta duel (otomatis POT)\n` +
`resetduel - Reset semua slot\n` +
`addpay - Tambah QRIS (reply foto)\n` +
`pay - Lihat QRIS`)}`;

        const replyMarkup = {
            inline_keyboard: [
                [{ text: '🔙 BACK', callback_data: 'back_to_menu' }]
            ]
        };

        try {
            await sendMenu(
    chatId,
    config.MENU_IMAGE,
    premiumMenuText,
    replyMarkup
);
        } catch (e) {}
        return;
    }
    
    // ============ BACK TO MENU ============
    if (query.data === 'back_to_menu') {
        await showMainMenu(chatId, userId);
        return;
    }
});

// ============ ERROR HANDLING ============
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection:', reason);
});

// ============ START ============
console.log('✅ Bot Started!');
console.log('');

// Send ready message ke semua owner
(async () => {
   for (const ownerId of config.OWNERS) {
            try {
                await bot.sendMessage(ownerId, 
                    `${makeQuote(`${makeBold('🤖 Bot Ready!')}\n\n✅ Online\n👑 You are owner\n⭐ Premium: ${db.premium ? db.premium.length : 0} user\n📊 Groups: ${db.groups ? db.groups.length : 0}\n\n${makeBold('🆕 Fitur:')}\nSemua command tanpa prefix "/"\nContoh: bc, full, addrules, d1, d2, d3, d4, addpay, pay, resetduel, share, stopshare, addprem, delprem, listprem, listgb, ping, menu`)}`, 
                    { parse_mode: 'HTML' }
                );
            } catch (e) {}
        }
    })();

console.log('✅ Bot siap digunakan!');