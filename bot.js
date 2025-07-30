const { Telegraf, Scenes, session } = require('telegraf');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Konfigurasi bot - ganti dengan token bot Anda
const BOT_TOKEN = process.env.BOT_TOKEN || 'YOUR_BOT_TOKEN_HERE';

// Inisialisasi bot
const bot = new Telegraf(BOT_TOKEN);

// Middleware session
bot.use(session());

// File untuk menyimpan data user
const USER_DATA_FILE = 'user_data.json';

// Fungsi untuk membaca data user
function loadUserData() {
    try {
        if (fs.existsSync(USER_DATA_FILE)) {
            const data = fs.readFileSync(USER_DATA_FILE, 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('Error loading user data:', error);
    }
    return {};
}

// Fungsi untuk menyimpan data user
function saveUserData(data) {
    try {
        fs.writeFileSync(USER_DATA_FILE, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error saving user data:', error);
    }
}

// Fungsi untuk mendapatkan data user
function getUserData(userId) {
    const userData = loadUserData();
    return userData[userId] || null;
}

// Fungsi untuk menyimpan data user
function setUserData(userId, data) {
    const userData = loadUserData();
    userData[userId] = data;
    saveUserData(userData);
}

// Fungsi untuk menghapus data user
function deleteUserData(userId) {
    const userData = loadUserData();
    delete userData[userId];
    saveUserData(userData);
}

// Fungsi untuk membuat request ke Cloudflare API
async function cloudflareRequest(userData, endpoint, method = 'GET', data = null) {
    try {
        const config = {
            method,
            url: `https://api.cloudflare.com/client/v4${endpoint}`,
            headers: {
                'Authorization': `Bearer ${userData.apiToken}`,
                'Content-Type': 'application/json'
            }
        };

        if (data) {
            config.data = data;
        }

        const response = await axios(config);
        return response.data;
    } catch (error) {
        console.error('Cloudflare API Error:', error.response?.data || error.message);
        throw error;
    }
}

// Command /start
bot.command('start', (ctx) => {
    const welcomeMessage = `
🤖 **Cloudflare DNS Manager Bot**

Selamat datang! Bot ini membantu Anda mengelola DNS Cloudflare dengan mudah melalui Telegram.

📋 **Fitur Utama:**
• Tambah A Record
• Tambah CNAME Wildcard
• List semua DNS Record
• Hapus DNS Record
• Reset Login

⚠️ **Peraturan dan Risiko:**
• Pastikan API Token, Account ID, dan Zone ID Anda benar
• Bot akan menyimpan data Anda secara lokal
• Jangan bagikan API Token Anda kepada siapapun
• Gunakan dengan bijak dan bertanggung jawab

Klik tombol di bawah untuk melanjutkan:
    `;

    ctx.reply(welcomeMessage, {
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: [
                [{ text: '✅ Saya Setuju', callback_data: 'agree' }]
            ]
        }
    });
});

// Callback untuk setuju
bot.action('agree', (ctx) => {
    ctx.answerCbQuery();
    ctx.reply('Baik! Mari kita mulai setup akun Cloudflare Anda.\n\nSilakan masukkan **API Token** Cloudflare Anda:', {
        parse_mode: 'Markdown'
    });
    
    // Set state untuk menunggu API Token
    ctx.session.state = 'waiting_api_token';
});

// Handle text messages untuk setup
bot.on('text', async (ctx) => {
    const state = ctx.session.state;
    const userId = ctx.from.id;
    const text = ctx.message.text;

    if (!state) return;

    switch (state) {
        case 'waiting_api_token':
            // Simpan API Token
            setUserData(userId, { apiToken: text });
            ctx.session.state = 'waiting_account_id';
            ctx.reply('✅ API Token tersimpan!\n\nSekarang masukkan **Account ID** Cloudflare Anda:', {
                parse_mode: 'Markdown'
            });
            break;

        case 'waiting_account_id':
            // Simpan Account ID
            const userData = getUserData(userId);
            userData.accountId = text;
            setUserData(userId, userData);
            ctx.session.state = 'waiting_zone_id';
            ctx.reply('✅ Account ID tersimpan!\n\nTerakhir, masukkan **Zone ID** domain Anda:', {
                parse_mode: 'Markdown'
            });
            break;

        case 'waiting_zone_id':
            // Simpan Zone ID dan tampilkan menu utama
            const finalUserData = getUserData(userId);
            finalUserData.zoneId = text;
            setUserData(userId, finalUserData);
            
            // Test koneksi ke Cloudflare
            try {
                await cloudflareRequest(finalUserData, `/zones/${text}`);
                ctx.session.state = null;
                showMainMenu(ctx);
            } catch (error) {
                ctx.reply('❌ Error: Zone ID tidak valid atau API Token salah. Silakan coba lagi dengan `/start`');
                deleteUserData(userId);
                ctx.session.state = null;
            }
            break;

        case 'waiting_subdomain':
            // Untuk A Record
            ctx.session.subdomain = text;
            ctx.session.state = 'waiting_ip';
            ctx.reply('✅ Subdomain tersimpan!\n\nSekarang masukkan **IP Address** tujuan:');
            break;

        case 'waiting_ip':
            // Untuk A Record
            const ip = text;
            if (!/^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(ip)) {
                ctx.reply('❌ Format IP Address tidak valid. Silakan masukkan IP yang benar:');
                return;
            }
            
            ctx.session.ip = ip;
            ctx.session.state = 'waiting_proxy_a';
            ctx.reply('✅ IP Address tersimpan!\n\nPilih status proxy untuk A Record:', {
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: '🟢 Proxy ON', callback_data: 'proxy_on_a' },
                            { text: '🔴 Proxy OFF', callback_data: 'proxy_off_a' }
                        ]
                    ]
                }
            });
            break;

        case 'waiting_cname_subdomain':
            // Untuk CNAME Wildcard
            ctx.session.cnameSubdomain = text;
            ctx.session.state = 'waiting_cname_target';
            ctx.reply('✅ Subdomain tersimpan!\n\nSekarang masukkan **target domain** (contoh: sg.domain.xyz):');
            break;

        case 'waiting_cname_target':
            // Untuk CNAME Wildcard
            ctx.session.cnameTarget = text;
            ctx.session.state = 'waiting_proxy_cname';
            ctx.reply('✅ Target domain tersimpan!\n\nPilih status proxy untuk CNAME Wildcard:', {
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: '🟢 Proxy ON', callback_data: 'proxy_on_cname' },
                            { text: '🔴 Proxy OFF', callback_data: 'proxy_off_cname' }
                        ]
                    ]
                }
            });
            break;
    }
});

// Callback untuk proxy A Record
bot.action('proxy_on_a', async (ctx) => {
    await createARecord(ctx, true);
});

bot.action('proxy_off_a', async (ctx) => {
    await createARecord(ctx, false);
});

// Callback untuk proxy CNAME
bot.action('proxy_on_cname', async (ctx) => {
    await createCNAMEWildcard(ctx, true);
});

bot.action('proxy_off_cname', async (ctx) => {
    await createCNAMEWildcard(ctx, false);
});

// Fungsi untuk membuat A Record
async function createARecord(ctx, proxied) {
    const userId = ctx.from.id;
    const userData = getUserData(userId);
    const subdomain = ctx.session.subdomain;
    const ip = ctx.session.ip;

    try {
        const recordData = {
            type: 'A',
            name: subdomain,
            content: ip,
            proxied: proxied,
            ttl: 1 // Auto TTL
        };

        const result = await cloudflareRequest(
            userData,
            `/zones/${userData.zoneId}/dns_records`,
            'POST',
            recordData
        );

        if (result.success) {
            const message = `
✅ **A Record Berhasil Ditambahkan**

🔹 Name: \`${subdomain}\`
🔹 Type: \`A\`
🔹 IP: \`${ip}\`
🔹 Proxy: \`${proxied ? 'ON' : 'OFF'}\`
            `;

            ctx.reply(message, {
                parse_mode: 'Markdown',
                reply_markup: {
                    inline_keyboard: [
                        [{ text: '🔙 Kembali ke Menu', callback_data: 'main_menu' }]
                    ]
                }
            });
        } else {
            ctx.reply('❌ Gagal menambahkan A Record. Silakan coba lagi.');
        }
    } catch (error) {
        ctx.reply('❌ Error: ' + (error.response?.data?.errors?.[0]?.message || error.message));
    }

    // Reset session
    ctx.session.state = null;
    delete ctx.session.subdomain;
    delete ctx.session.ip;
}

// Fungsi untuk membuat CNAME Wildcard
async function createCNAMEWildcard(ctx, proxied) {
    const userId = ctx.from.id;
    const userData = getUserData(userId);
    const subdomain = ctx.session.cnameSubdomain;
    const target = ctx.session.cnameTarget;

    try {
        const recordData = {
            type: 'CNAME',
            name: `*.${subdomain}`,
            content: target,
            proxied: proxied,
            ttl: 1 // Auto TTL
        };

        const result = await cloudflareRequest(
            userData,
            `/zones/${userData.zoneId}/dns_records`,
            'POST',
            recordData
        );

        if (result.success) {
            const message = `
✅ **CNAME Wildcard Berhasil Ditambahkan**

🔹 Name: \`*.${subdomain}\`
🔹 Type: \`CNAME\`
🔹 Target: \`${target}\`
🔹 Proxy: \`${proxied ? 'ON' : 'OFF'}\`
            `;

            ctx.reply(message, {
                parse_mode: 'Markdown',
                reply_markup: {
                    inline_keyboard: [
                        [{ text: '🔙 Kembali ke Menu', callback_data: 'main_menu' }]
                    ]
                }
            });
        } else {
            ctx.reply('❌ Gagal menambahkan CNAME Wildcard. Silakan coba lagi.');
        }
    } catch (error) {
        ctx.reply('❌ Error: ' + (error.response?.data?.errors?.[0]?.message || error.message));
    }

    // Reset session
    ctx.session.state = null;
    delete ctx.session.cnameSubdomain;
    delete ctx.session.cnameTarget;
}

// Fungsi untuk menampilkan menu utama
function showMainMenu(ctx) {
    const message = `
🎯 **Menu Utama Cloudflare DNS Manager**

Pilih fitur yang ingin Anda gunakan:
    `;

    ctx.reply(message, {
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: [
                [{ text: '➕ Tambah A Record', callback_data: 'add_a_record' }],
                [{ text: '🌐 Tambah CNAME Wildcard', callback_data: 'add_cname_wildcard' }],
                [{ text: '📋 List Semua Record', callback_data: 'list_records' }],
                [{ text: '🗑️ Hapus Record', callback_data: 'delete_record' }],
                [{ text: '🔁 Reset Login', callback_data: 'reset_login' }]
            ]
        }
    });
}

// Callback untuk menu utama
bot.action('main_menu', (ctx) => {
    ctx.answerCbQuery();
    showMainMenu(ctx);
});

// Callback untuk tambah A Record
bot.action('add_a_record', (ctx) => {
    ctx.answerCbQuery();
    ctx.session.state = 'waiting_subdomain';
    ctx.reply('Masukkan **nama subdomain** (contoh: api, www, mail):', {
        parse_mode: 'Markdown'
    });
});

// Callback untuk tambah CNAME Wildcard
bot.action('add_cname_wildcard', (ctx) => {
    ctx.answerCbQuery();
    ctx.session.state = 'waiting_cname_subdomain';
    ctx.reply('Masukkan **subdomain** (tanpa *, contoh: sg):');
});

// Callback untuk list records
bot.action('list_records', async (ctx) => {
    ctx.answerCbQuery();
    
    const userId = ctx.from.id;
    const userData = getUserData(userId);

    try {
        const result = await cloudflareRequest(userData, `/zones/${userData.zoneId}/dns_records`);
        
        if (result.success && result.result.length > 0) {
            for (const record of result.result) {
                const recordInfo = `
**Name:** \`${record.name}\`
**Type:** \`${record.type}\`
**Content:** \`${record.content}\`
**Proxy:** \`${record.proxied ? 'ON' : 'OFF'}\`
                `;

                ctx.reply(recordInfo, {
                    parse_mode: 'Markdown',
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: '📋 Salin Record Ini', callback_data: `copy_${record.id}` }],
                            [{ text: '🔙 Kembali ke Menu', callback_data: 'main_menu' }]
                        ]
                    }
                });
            }
        } else {
            ctx.reply('📭 Tidak ada DNS record yang ditemukan.', {
                reply_markup: {
                    inline_keyboard: [
                        [{ text: '🔙 Kembali ke Menu', callback_data: 'main_menu' }]
                    ]
                }
            });
        }
    } catch (error) {
        ctx.reply('❌ Error: ' + (error.response?.data?.errors?.[0]?.message || error.message), {
            reply_markup: {
                inline_keyboard: [
                    [{ text: '🔙 Kembali ke Menu', callback_data: 'main_menu' }]
                ]
            }
        });
    }
});

// Callback untuk copy record
bot.action(/copy_(.+)/, async (ctx) => {
    ctx.answerCbQuery();
    
    const recordId = ctx.match[1];
    const userId = ctx.from.id;
    const userData = getUserData(userId);

    try {
        const result = await cloudflareRequest(userData, `/zones/${userData.zoneId}/dns_records/${recordId}`);
        
        if (result.success) {
            const record = result.result;
            const copyText = `
📋 **Berikut data siap salin:**

Name: ${record.name}
Type: ${record.type}
Content: ${record.content}
Proxy: ${record.proxied ? 'ON' : 'OFF'}
            `;

            ctx.reply(copyText, {
                parse_mode: 'Markdown',
                reply_markup: {
                    inline_keyboard: [
                        [{ text: '🔙 Kembali ke Menu', callback_data: 'main_menu' }]
                    ]
                }
            });
        }
    } catch (error) {
        ctx.reply('❌ Error mengambil data record.');
    }
});

// Callback untuk hapus record
bot.action('delete_record', async (ctx) => {
    ctx.answerCbQuery();
    
    const userId = ctx.from.id;
    const userData = getUserData(userId);

    try {
        const result = await cloudflareRequest(userData, `/zones/${userData.zoneId}/dns_records`);
        
        if (result.success && result.result.length > 0) {
            const buttons = result.result.map(record => [{
                text: record.name,
                callback_data: `delete_confirm_${record.id}`
            }]);

            buttons.push([{ text: '🔙 Kembali ke Menu', callback_data: 'main_menu' }]);

            ctx.reply('Pilih record yang ingin dihapus:', {
                reply_markup: {
                    inline_keyboard: buttons
                }
            });
        } else {
            ctx.reply('📭 Tidak ada DNS record yang ditemukan.', {
                reply_markup: {
                    inline_keyboard: [
                        [{ text: '🔙 Kembali ke Menu', callback_data: 'main_menu' }]
                    ]
                }
            });
        }
    } catch (error) {
        ctx.reply('❌ Error: ' + (error.response?.data?.errors?.[0]?.message || error.message), {
            reply_markup: {
                inline_keyboard: [
                    [{ text: '🔙 Kembali ke Menu', callback_data: 'main_menu' }]
                ]
            }
        });
    }
});

// Callback untuk konfirmasi hapus
bot.action(/delete_confirm_(.+)/, async (ctx) => {
    ctx.answerCbQuery();
    
    const recordId = ctx.match[1];
    const userId = ctx.from.id;
    const userData = getUserData(userId);

    try {
        const result = await cloudflareRequest(userData, `/zones/${userData.zoneId}/dns_records/${recordId}`);
        
        if (result.success) {
            const record = result.result;
            ctx.reply(`Yakin ingin menghapus record ini?\n\n**Name:** ${record.name}\n**Type:** ${record.type}`, {
                parse_mode: 'Markdown',
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: '✅ Ya', callback_data: `delete_yes_${recordId}` },
                            { text: '❌ Tidak', callback_data: 'main_menu' }
                        ]
                    ]
                }
            });
        }
    } catch (error) {
        ctx.reply('❌ Error mengambil data record.');
    }
});

// Callback untuk hapus record (ya)
bot.action(/delete_yes_(.+)/, async (ctx) => {
    ctx.answerCbQuery();
    
    const recordId = ctx.match[1];
    const userId = ctx.from.id;
    const userData = getUserData(userId);

    try {
        const result = await cloudflareRequest(userData, `/zones/${userData.zoneId}/dns_records/${recordId}`, 'DELETE');
        
        if (result.success) {
            ctx.reply('🗑️ **Record Berhasil Dihapus**\n\nSilakan cek di dashboard Cloudflare Anda.', {
                parse_mode: 'Markdown',
                reply_markup: {
                    inline_keyboard: [
                        [{ text: '🔙 Kembali ke Menu', callback_data: 'main_menu' }]
                    ]
                }
            });
        } else {
            ctx.reply('❌ Gagal menghapus record. Silakan coba lagi.');
        }
    } catch (error) {
        ctx.reply('❌ Error: ' + (error.response?.data?.errors?.[0]?.message || error.message));
    }
});

// Callback untuk reset login
bot.action('reset_login', (ctx) => {
    ctx.answerCbQuery();
    
    const userId = ctx.from.id;
    deleteUserData(userId);
    ctx.session.state = null;
    
    ctx.reply('✅ **Data berhasil dihapus, silakan mulai ulang.**\n\nKetik `/start` untuk memulai setup baru.', {
        parse_mode: 'Markdown'
    });
});

// Error handling
bot.catch((err, ctx) => {
    console.error(`Error for ${ctx.updateType}:`, err);
    ctx.reply('❌ Terjadi kesalahan. Silakan coba lagi.');
});

// Start bot
bot.launch().then(() => {
    console.log('🤖 Bot Cloudflare DNS Manager berhasil dijalankan!');
    console.log('📝 Pastikan Anda telah mengatur BOT_TOKEN di environment variable atau menggantinya di kode.');
}).catch((error) => {
    console.error('❌ Error starting bot:', error);
});

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));