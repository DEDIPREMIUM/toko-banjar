# 🚀 Deployment Guide

Panduan deployment bot Cloudflare DNS Manager di berbagai platform.

## 📋 Prerequisites

1. **Bot Token** dari [@BotFather](https://t.me/botfather)
2. **Cloudflare API Token** dengan permission yang sesuai
3. **Account ID** dan **Zone ID** Cloudflare

## 🖥️ Local Development

### 1. Clone Repository
```bash
git clone <repository-url>
cd cloudflare-dns-bot
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Set Environment Variable
```bash
export BOT_TOKEN="your_bot_token_here"
```

### 4. Run Bot
```bash
npm start
```

## ☁️ VPS/Server Deployment

### Ubuntu/Debian

#### 1. Install Node.js
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

#### 2. Clone & Setup
```bash
git clone <repository-url>
cd cloudflare-dns-bot
npm install
```

#### 3. Set Environment Variable
```bash
echo 'export BOT_TOKEN="your_bot_token_here"' >> ~/.bashrc
source ~/.bashrc
```

#### 4. Run with PM2 (Recommended)
```bash
npm install -g pm2
pm2 start bot.js --name "cloudflare-dns-bot"
pm2 startup
pm2 save
```

### CentOS/RHEL

#### 1. Install Node.js
```bash
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs
```

#### 2. Follow Ubuntu steps 2-4

## 🌐 Replit Deployment

### 1. Create New Repl
- Buka [replit.com](https://replit.com)
- Pilih "Node.js" template
- Upload semua file bot

### 2. Set Environment Variable
- Buka tab "Secrets" di sidebar
- Tambah secret: `BOT_TOKEN` = `your_bot_token_here`

### 3. Run Bot
- Klik tombol "Run"
- Bot akan otomatis restart saat ada perubahan

## 🐳 Docker Deployment

### 1. Create Dockerfile
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
```

### 2. Build & Run
```bash
docker build -t cloudflare-dns-bot .
docker run -d \
  --name cloudflare-dns-bot \
  -e BOT_TOKEN="your_bot_token_here" \
  cloudflare-dns-bot
```

## 🔧 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `BOT_TOKEN` | Telegram Bot Token dari @BotFather | ✅ Yes |

## 📊 Monitoring

### PM2 Commands
```bash
pm2 status                    # Check status
pm2 logs cloudflare-dns-bot   # View logs
pm2 restart cloudflare-dns-bot # Restart bot
pm2 stop cloudflare-dns-bot   # Stop bot
```

### Manual Monitoring
```bash
# Check if bot is running
ps aux | grep node

# View logs
tail -f ~/.pm2/logs/cloudflare-dns-bot-out.log
tail -f ~/.pm2/logs/cloudflare-dns-bot-error.log
```

## 🔒 Security Considerations

### 1. File Permissions
```bash
# Secure user data file
chmod 600 user_data.json

# Secure bot token
chmod 600 .env
```

### 2. Firewall
```bash
# Allow only necessary ports
sudo ufw allow ssh
sudo ufw enable
```

### 3. Regular Updates
```bash
# Update dependencies
npm update

# Update PM2
npm install -g pm2@latest
```

## 🚨 Troubleshooting

### Bot Not Responding
1. Check if bot is running: `pm2 status`
2. Check logs: `pm2 logs cloudflare-dns-bot`
3. Verify token: `echo $BOT_TOKEN`

### Permission Errors
```bash
# Fix file permissions
chmod +x start.sh
chmod 600 user_data.json
```

### Port Issues
- Bot tidak memerlukan port terbuka
- Pastikan server bisa akses internet untuk Telegram API

## 📞 Support

Jika mengalami masalah deployment:
1. Check logs untuk error messages
2. Verify environment variables
3. Test bot token di browser: `https://api.telegram.org/bot<TOKEN>/getMe`