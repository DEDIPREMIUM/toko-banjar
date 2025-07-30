#!/usr/bin/env node

/**
 * Test script untuk memverifikasi konfigurasi bot
 * Jalankan dengan: node test-bot.js
 */

const axios = require('axios');

// Fungsi untuk test bot token
async function testBotToken(token) {
    try {
        console.log('🔍 Testing bot token...');
        const response = await axios.get(`https://api.telegram.org/bot${token}/getMe`);
        
        if (response.data.ok) {
            const bot = response.data.result;
            console.log('✅ Bot token valid!');
            console.log(`🤖 Bot name: ${bot.first_name}`);
            console.log(`👤 Username: @${bot.username}`);
            console.log(`🆔 Bot ID: ${bot.id}`);
            return true;
        } else {
            console.log('❌ Bot token tidak valid');
            return false;
        }
    } catch (error) {
        console.log('❌ Error testing bot token:', error.message);
        return false;
    }
}

// Fungsi untuk test Cloudflare API
async function testCloudflareAPI(apiToken, zoneId) {
    try {
        console.log('🔍 Testing Cloudflare API...');
        const response = await axios.get(`https://api.cloudflare.com/client/v4/zones/${zoneId}`, {
            headers: {
                'Authorization': `Bearer ${apiToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.data.success) {
            const zone = response.data.result;
            console.log('✅ Cloudflare API valid!');
            console.log(`🌐 Domain: ${zone.name}`);
            console.log(`🆔 Zone ID: ${zone.id}`);
            console.log(`📊 Status: ${zone.status}`);
            return true;
        } else {
            console.log('❌ Cloudflare API tidak valid');
            return false;
        }
    } catch (error) {
        console.log('❌ Error testing Cloudflare API:', error.response?.data?.errors?.[0]?.message || error.message);
        return false;
    }
}

// Main function
async function main() {
    console.log('🧪 Cloudflare DNS Manager Bot - Test Script\n');
    
    // Test bot token dari environment variable
    const botToken = process.env.BOT_TOKEN;
    if (!botToken) {
        console.log('❌ BOT_TOKEN environment variable tidak ditemukan');
        console.log('💡 Set dengan: export BOT_TOKEN="your_bot_token_here"');
        return;
    }
    
    const botValid = await testBotToken(botToken);
    
    if (botValid) {
        console.log('\n📋 Untuk test Cloudflare API, jalankan:');
        console.log('node test-bot.js <api_token> <zone_id>');
        
        // Test Cloudflare jika parameter diberikan
        const args = process.argv.slice(2);
        if (args.length >= 2) {
            const [apiToken, zoneId] = args;
            console.log('\n' + '='.repeat(50));
            await testCloudflareAPI(apiToken, zoneId);
        }
    }
    
    console.log('\n✅ Test selesai!');
}

// Run test
if (require.main === module) {
    main().catch(console.error);
}

module.exports = { testBotToken, testCloudflareAPI };