# JAKEN MEX ACCES - Login Node.js + Express + JWT

Project autentikasi sederhana menggunakan **Node.js**, **Express**, dan **JWT (JSON Web Token)**.

## Fitur

- ✅ Registrasi akun baru (`POST /register`)
- ✅ Login dengan username & password (`POST /login`)
- ✅ Dashboard yang dilindungi JWT (`GET /dashboard`)
- ✅ Static file serving dari folder `/public`
- ✅ Halaman login langsung tampil saat buka `http://localhost:3000`

## Cara Menjalankan

### 1. Install Dependency

```bash
npm install
```

### 2. Jalankan Server

```bash
node server.js
```

### 3. Buka di Browser

Buka browser dan akses:

```
http://localhost:3000
```

Halaman login akan muncul secara otomatis.

## Alur Penggunaan

1. **Register** → Isi username & password, klik tombol **Register**
2. **Login** → Masukkan username & password yang sudah didaftarkan, klik **Login**
3. **Dashboard** → Setelah login berhasil, akan otomatis redirect ke dashboard
4. **Logout** → Klik tombol **Logout** di dashboard untuk menghapus token dan kembali ke login

## Default User (Dari .env)

Kamu bisa mengatur akun default yang otomatis dibuat saat server dijalankan, tanpa perlu register manual.

Caranya:
1. Buka file `.env`
2. Ubah nilai `DEFAULT_USERNAME` dan `DEFAULT_PASSWORD` sesuai keinginanmu
3. Restart server (`node server.js`)
4. Akun tersebut langsung bisa dipakai login

Contoh `.env`:
```env
SECRET_KEY=rahasia_jaken_123
DEFAULT_USERNAME=admin
DEFAULT_PASSWORD=admin123
```

> ⚠️ **Penting:** Ganti password default sebelum digunakan di production!

## Struktur Project

```
JAKEN_MEX-ACCES/
│
├── server.js              # File utama server Express
├── package.json           # Daftar dependency
├── .env                   # Environment variable (SECRET_KEY)
├── README.md              # Dokumentasi ini
│
└── public/                # Folder static file (HTML, CSS, JS)
    ├── index.html         # Halaman login & register
    └── dashboard.html     # Halaman dashboard (protected)
```

## Endpoint API

| Method | Endpoint    | Deskripsi                              | Auth |
|--------|-------------|----------------------------------------|------|
| POST   | /register   | Daftar user baru                       | ❌   |
| POST   | /login      | Login dan dapatkan token JWT           | ❌   |
| GET    | /dashboard  | Akses dashboard (return JSON)          | ✅   |

## Deploy ke Platform Hosting (Render / Railway / Heroku)

Project ini sudah siap deploy. Berikut yang perlu diperhatikan:

### 1. Environment Variables

Di panel dashboard platform deploy, tambahkan **Environment Variables** berikut:

| Variable         | Nilai Contoh         | Keterangan                          |
|------------------|----------------------|-------------------------------------|
| `SECRET_KEY`     | `rahasia_jaken_123`  | **WAJIB** — kunci rahasia JWT       |
| `DEFAULT_USERNAME`| `admin`             | Opsional — akun default             |
| `DEFAULT_PASSWORD`| `admin123`          | Opsional — password default         |

> ⚠️ **WAJIB:** Pastikan `SECRET_KEY` diisi! Kalau tidak, server tetap jalan tapi pakai fallback default (kurang aman untuk production).

### 2. Build / Start Command

Platform akan otomatis membaca file `Procfile` dan menjalankan:

```
web: node server.js
```

Atau pakai start script dari `package.json`:

```bash
npm start
```

### 3. Port Otomatis

Server sekarang menggunakan port dinamis:

```javascript
const PORT = process.env.PORT || 3000;
```

Jadi platform deploy bisa assign port apa saja tanpa error.

## Penjelasan Error "Cannot GET /"

Error ini muncul karena beberapa alasan berikut:

### Penyebab #1: File HTML tidak ada di folder `/public/`

`server.js` menggunakan middleware:

```javascript
app.use(express.static("public"));
```

Middleware ini akan mencari file static (HTML, CSS, JS) di dalam folder **`/public/`**. Jika file `index.html` dan `dashboard.html` berada di root folder (bukan di `/public/`), maka Express tidak akan menemukan file tersebut dan akan mengembalikan error **"Cannot GET /"**.

**Solusi:** Pindahkan `index.html` dan `dashboard.html` ke dalam folder `/public/`.

### Penyebab #2: Versi Package Belum Rilis di npm

File `package.json` sebelumnya menggunakan versi package yang **belum tersedia** di npm registry:

- `express@^5.2.1` → belum rilis
- `dotenv@^17.4.2` → belum rilis
- `bcrypt@^6.0.0` → belum rilis

Ini menyebabkan `npm install` gagal, sehingga server tidak bisa dijalankan.

**Solusi:** Turunkan versi package ke yang stabil dan tersedia di npm:
- `express: ^4.19.2`
- `dotenv: ^16.4.5`
- `jsonwebtoken: ^9.0.2`
- `bcryptjs: ^2.4.3` (menggantikan `bcrypt` yang butuh compile native)

### Penyebab #3: Tidak ada route untuk `/`

Jika file `index.html` ada di `/public/` tapi tidak diberi nama `index.html`, atau jika user mengakses `http://localhost:3000/` (tanpa `/index.html`), Express akan mencari file `index.html` secara otomatis. Jika tidak ditemukan, muncul "Cannot GET /".

**Solusi:** Tambahkan route redirect:

```javascript
app.get("/", (req, res) => {
  res.redirect("/index.html");
});
```

## Teknologi yang Digunakan

- **Node.js** - Runtime JavaScript
- **Express.js** - Framework web
- **bcryptjs** - Hashing password (pure JS, tidak perlu compile)
- **jsonwebtoken** - Generate & verifikasi JWT
- **dotenv** - Environment variable management

---

Dibuat oleh: RENDIPRATAMA955
