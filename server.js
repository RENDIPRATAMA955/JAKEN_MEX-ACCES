/**
 * ============================================
 * SERVER.JS - JAKEN MEX ACCES
 * ============================================
 * Server Node.js + Express untuk autentikasi JWT
 * Fitur: Register, Login, Dashboard (protected)
 * ============================================
 */

// Import library yang diperlukan
const express = require("express");      // Framework web untuk Node.js
const bcryptjs = require("bcryptjs");    // Library untuk hashing password (pure JS, tidak perlu compile)
const jwt = require("jsonwebtoken");     // Library untuk membuat dan verifikasi JWT token
require("dotenv").config();              // Memuat environment variable dari file .env

// ============================================
// KONFIGURASI DEPLOY
// ============================================
// Gunakan PORT dari environment variable (untuk deploy platform),
// jika tidak ada, fallback ke 3000 (untuk local development)
const PORT = process.env.PORT || 3000;

// Fallback SECRET_KEY jika tidak di-set di environment variable
// Untuk production, wajib set SECRET_KEY di panel deploy!
const SECRET_KEY = process.env.SECRET_KEY || "default_secret_jaken_dev";

// Inisialisasi aplikasi Express
const app = express();

// ============================================
// MIDDLEWARE
// ============================================

// Middleware untuk parsing body request dalam format JSON
// Agar kita bisa membaca req.body saat menerima POST request
app.use(express.json());

// Middleware untuk serve static file (HTML, CSS, JS) dari folder /public/
// Jadi saat user akses http://localhost:3000/index.html, Express akan mencari file di folder public
app.use(express.static("public"));

// ============================================
// DATA SEMENTARA (IN-MEMORY)
// ============================================
// Array users menyimpan data user yang terdaftar.
// Format: { username, password }
// Catatan: Di production, sebaiknya gunakan database seperti MongoDB atau PostgreSQL.
const users = [];

// Buat default user dari .env jika tersedia
(async () => {
  const defaultUser = process.env.DEFAULT_USERNAME;
  const defaultPass = process.env.DEFAULT_PASSWORD;
  if (defaultUser && defaultPass) {
    const existing = users.find((u) => u.username === defaultUser);
    if (!existing) {
      const hashed = await bcryptjs.hash(defaultPass, 10);
      users.push({ username: defaultUser, password: hashed });
      console.log(`🔑 Default user '${defaultUser}' berhasil dibuat dari .env`);
    }
  }
})();

// ============================================
// MIDDLEWARE: AUTENTIKASI JWT
// ============================================
/**
 * Fungsi middleware untuk melindungi route tertentu.
 * Cara kerja:
 * 1. Ambil header Authorization dari request (format: "Bearer <token>")
 * 2. Jika tidak ada, kirim status 403 (Forbidden)
 * 3. Ambil token setelah kata "Bearer "
 * 4. Verifikasi token menggunakan SECRET_KEY
 * 5. Jika valid, simpan data decoded (payload JWT) ke req.user
 * 6. Lanjutkan ke route handler berikutnya
 * 7. Jika invalid, kirim status 403
 */
function authenticateToken(req, res, next) {
  // Ambil header Authorization
  const authHeader = req.headers["authorization"];

  // Jika header tidak ada, tolak akses
  if (!authHeader) {
    return res.status(403).json({ message: "Akses ditolak: token tidak ditemukan" });
  }

  // Format header: "Bearer <token>"
  // Kita split berdasarkan spasi dan ambil bagian kedua (index 1)
  const token = authHeader.split(" ")[1];

  // Jika setelah split token masih kosong, tolak akses
  if (!token) {
    return res.status(403).json({ message: "Akses ditolak: format token salah" });
  }

  // Verifikasi token menggunakan SECRET_KEY
  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    // Jika terjadi error saat verifikasi (token expired atau invalid)
    if (err) {
      return res.status(403).json({ message: "Akses ditolak: token tidak valid" });
    }

    // Jika berhasil, simpan data decoded ke req.user agar bisa diakses di route handler
    req.user = decoded;

    // Lanjutkan ke route handler berikutnya
    next();
  });
}

// ============================================
// ROUTE: ROOT "/"
// ============================================
/**
 * Route utama (http://localhost:3000/)
 * Kita redirect ke /index.html agar user langsung melihat halaman login.
 * Ini mencegah error "Cannot GET /" yang terjadi ketika Express tidak
 * menemukan file index.html di dalam folder public.
 */
app.get("/", (req, res) => {
  res.redirect("/index.html");
});

// ============================================
// ENDPOINT: POST /register
// ============================================
/**
 * Endpoint untuk mendaftarkan user baru.
 * Body request: { username, password }
 * Proses:
 * 1. Ambil username dan password dari body
 * 2. Cek apakah username sudah terdaftar
 * 3. Hash password menggunakan bcryptjs (salt round 10)
 * 4. Simpan user baru ke array users
 * 5. Kirim response sukses
 */
app.post("/register", async (req, res) => {
  // Ambil data dari body request
  const { username, password } = req.body;

  // Validasi: pastikan username dan password tidak kosong
  if (!username || !password) {
    return res.status(400).json({ message: "Username dan password wajib diisi" });
  }

  // Cek apakah username sudah ada di database (array users)
  const existingUser = users.find((u) => u.username === username);
  if (existingUser) {
    return res.status(400).json({ message: "Username sudah terdaftar" });
  }

  // Hash password sebelum disimpan ke database
  // Salt round 10 = tingkat keamanan hashing (semakin tinggi semakin lambat)
  const hashedPassword = await bcryptjs.hash(password, 10);

  // Simpan user baru ke array (database sementara)
  users.push({ username, password: hashedPassword });

  // Kirim response sukses
  res.status(201).json({ message: "Registrasi berhasil! Silakan login." });
});

// ============================================
// ENDPOINT: POST /login
// ============================================
/**
 * Endpoint untuk login user.
 * Body request: { username, password }
 * Proses:
 * 1. Ambil username dan password dari body
 * 2. Cari user di database
 * 3. Bandingkan password dengan hash yang tersimpan menggunakan bcryptjs.compare
 * 4. Jika cocok, generate JWT token
 * 5. Kirim token ke client
 */
app.post("/login", async (req, res) => {
  // Ambil data dari body request
  const { username, password } = req.body;

  // Validasi: pastikan username dan password tidak kosong
  if (!username || !password) {
    return res.status(400).json({ message: "Username dan password wajib diisi" });
  }

  // Cari user berdasarkan username
  const user = users.find((u) => u.username === username);

  // Jika user tidak ditemukan, kirim error 400
  if (!user) {
    return res.status(400).json({ message: "User tidak ditemukan" });
  }

  // Bandingkan password yang diinput dengan hash yang tersimpan di database
  const isValidPassword = await bcryptjs.compare(password, user.password);

  // Jika password tidak cocok, kirim error 400
  if (!isValidPassword) {
    return res.status(400).json({ message: "Password salah" });
  }

  // Generate JWT token dengan payload berisi username
  // Token akan expired setelah 1 jam (3600 detik)
  const token = jwt.sign(
    { username: user.username },
    SECRET_KEY,
    { expiresIn: "1h" }
  );

  // Kirim token ke client (client akan menyimpannya di localStorage)
  res.json({ message: "Login berhasil", token });
});

// ============================================
// ENDPOINT: POST /change-password (PROTECTED)
// ============================================
/**
 * Endpoint untuk mengganti password user yang sedang login.
 * Body request: { oldPassword, newPassword }
 * Header: Authorization: Bearer <token>
 * Proses:
 * 1. Verifikasi token JWT (via middleware)
 * 2. Cari user berdasarkan username dari token
 * 3. Bandingkan oldPassword dengan hash yang tersimpan
 * 4. Hash newPassword dan update di array users
 */
app.post("/change-password", authenticateToken, async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const username = req.user.username;

  if (!oldPassword || !newPassword) {
    return res.status(400).json({ message: "Password lama dan password baru wajib diisi" });
  }

  const user = users.find((u) => u.username === username);
  if (!user) {
    return res.status(404).json({ message: "User tidak ditemukan" });
  }

  const isMatch = await bcryptjs.compare(oldPassword, user.password);
  if (!isMatch) {
    return res.status(400).json({ message: "Password lama salah" });
  }

  user.password = await bcryptjs.hash(newPassword, 10);
  res.json({ message: "Password berhasil diubah" });
});

// ============================================
// ENDPOINT: GET /dashboard (PROTECTED)
// ============================================
/**
 * Endpoint untuk mengakses dashboard.
 * Route ini dilindungi oleh middleware authenticateToken.
 * Hanya user yang memiliki token JWT valid yang bisa mengaksesnya.
 * Response: { message, user: { username } }
 */
app.get("/dashboard", authenticateToken, (req, res) => {
  // req.user berisi data decoded dari JWT (di-set oleh middleware authenticateToken)
  res.json({
    message: "Akses dashboard berhasil!",
    user: req.user
  });
});

// ============================================
// MENJALANKAN SERVER
// ============================================
// Server akan berjalan di PORT yang ditentukan environment variable
// atau fallback ke 3000 untuk local development
app.listen(PORT, () => {
  console.log(`✅ Server berjalan di port ${PORT}`);
  console.log("📌 Endpoint yang tersedia:");
  console.log("   POST /register  → Daftar akun baru");
  console.log("   POST /login     → Login dan dapatkan token");
  console.log("   GET  /dashboard → Akses dashboard (butuh JWT)");
});
