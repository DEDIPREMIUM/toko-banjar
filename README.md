# 🤖 Cloudflare DNS Manager Bot

Bot Telegram untuk mengelola DNS Cloudflare dengan mudah melalui interface yang interaktif. Bot ini mendukung multi-user dan menyimpan data setiap user secara terpisah.

## 📋 Fitur Utama

- ✅ **Tambah A Record** - Menambahkan DNS A record dengan proxy ON/OFF
- 🌐 **Tambah CNAME Wildcard** - Menambahkan CNAME wildcard untuk subdomain
- 📋 **List Semua Record** - Menampilkan semua DNS record dengan fitur copy
- 🗑️ **Hapus Record** - Menghapus DNS record dengan konfirmasi
- 🔁 **Reset Login** - Menghapus data user dan mulai ulang setup

## 🚀 Cara Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Bot Token

Buat bot Telegram melalui [@BotFather](https://t.me/botfather) dan dapatkan token bot.

#### Opsi A: Environment Variable (Recommended)
```bash
export BOT_TOKEN="your_bot_token_here"
```

#### Opsi B: Edit File
Buka file `bot.js` dan ganti `YOUR_BOT_TOKEN_HERE` dengan token bot Anda.

### 3. Jalankan Bot

```bash
npm start
```

Atau untuk development dengan auto-restart:
```bash
npm run dev
```

## 🔧 Setup Cloudflare

### 1. API Token
1. Login ke [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Buka **My Profile** → **API Tokens**
3. Klik **Create Token**
4. Pilih **Custom token**
5. Berikan permission:
   - **Zone:Zone:Read** (untuk semua zone)
   - **Zone:DNS:Edit** (untuk semua zone)
6. Set **Zone Resources** ke **Include: All zones**
7. Copy token yang dihasilkan

### 2. Account ID
1. Di Cloudflare Dashboard, lihat **Account ID** di sidebar kanan
2. Copy Account ID tersebut

### 3. Zone ID
1. Pilih domain yang ingin dikelola
2. Di halaman **Overview**, lihat **Zone ID**
3. Copy Zone ID tersebut

## 📱 Cara Penggunaan

### 1. Mulai Bot
- Kirim `/start` ke bot
- Baca peraturan dan klik **✅ Saya Setuju**

### 2. Setup Akun
Bot akan memandu Anda mengisi:
- **API Token** Cloudflare
- **Account ID** Cloudflare  
- **Zone ID** domain

### 3. Menu Utama
Setelah setup selesai, Anda akan melihat menu utama dengan 5 opsi:

#### ➕ Tambah A Record
1. Masukkan nama subdomain (contoh: `api`, `www`)
2. Masukkan IP address tujuan
3. Pilih status proxy (ON/OFF)
4. Record akan dibuat otomatis

#### 🌐 Tambah CNAME Wildcard
1. Masukkan subdomain (tanpa *, contoh: `sg`)
2. Masukkan target domain (contoh: `sg.domain.xyz`)
3. Pilih status proxy (ON/OFF)
4. Record `*.sg` akan dibuat

#### 📋 List Semua Record
- Menampilkan semua DNS record dalam format yang rapi
- Setiap record memiliki tombol **📋 Salin Record Ini**
- Data siap copy untuk dokumentasi

#### 🗑️ Hapus Record
1. Pilih record yang ingin dihapus dari daftar
2. Konfirmasi penghapusan
3. Record akan dihapus dari Cloudflare

#### 🔁 Reset Login
- Menghapus semua data user
- Kembali ke awal setup

## 📁 Struktur File

```
├── bot.js              # File utama bot
├── package.json        # Dependencies dan scripts
├── user_data.json      # Data user (auto-generated)
└── README.md          # Dokumentasi ini
```

## 🔒 Keamanan

- ✅ Data user disimpan secara lokal dalam file JSON
- ✅ API Token tidak dibagikan atau disimpan di tempat lain
- ✅ Setiap user memiliki data terpisah berdasarkan Telegram ID
- ✅ Bot dapat di-reset untuk menghapus data user

## ⚠️ Perhatian

- **Jangan bagikan API Token** kepada siapapun
- **Gunakan dengan bijak** - bot memiliki akses penuh ke DNS Anda
- **Backup data** penting sebelum menggunakan bot
- **Test di domain non-produksi** terlebih dahulu

## 🛠️ Troubleshooting

### Bot tidak merespon
- Pastikan token bot benar
- Cek apakah bot sudah dijalankan
- Lihat log error di console

### Error API Cloudflare
- Pastikan API Token memiliki permission yang benar
- Cek Account ID dan Zone ID
- Pastikan domain aktif di Cloudflare

### Data user hilang
- File `user_data.json` mungkin terhapus
- Jalankan ulang setup dengan `/start`

## 📞 Support

Jika mengalami masalah, pastikan:
1. Semua setup sudah benar
2. Log error sudah dicek
3. Dokumentasi sudah dibaca

## 📄 License

MIT License - Gunakan dengan bertanggung jawab.