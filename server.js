const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const app = express();
app.use(express.json());
app.use(express.static("public"));

const users = []; // sementara (belum pakai database)

// REGISTER
app.post("/register", async (req, res) => {
  const { username, password } = req.body;

  const hashed = await bcrypt.hash(password, 10);
  users.push({ username, password: hashed });

  res.json({ message: "User dibuat" });
});

// LOGIN
app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  const user = users.find(u => u.username === username);
  if (!user) return res.status(400).send("User tidak ada");

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(400).send("Password salah");

  const token = jwt.sign({ username }, process.env.SECRET_KEY);
  res.json({ token });
});

// PROTECTED
app.get("/dashboard", (req, res) => {
  const token = req.headers["authorization"];
  if (!token) return res.sendStatus(403);

  try {
    jwt.verify(token, process.env.SECRET_KEY);
    res.send("Masuk dashboard berhasil");
  } catch {
    res.sendStatus(403);
  }
});

app.listen(3000, () => console.log("http://localhost:3000"));