import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import Database from "better-sqlite3";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import cors from "cors";

const db = new Database("database.sqlite");
const JWT_SECRET = process.env.JWT_SECRET || "iteraima-secret-key";

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    password TEXT,
    role TEXT DEFAULT 'editor'
  );

  CREATE TABLE IF NOT EXISTS news (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    content TEXT,
    category TEXT,
    image_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    author_id INTEGER,
    FOREIGN KEY(author_id) REFERENCES users(id)
  );
`);

// Create default admin if not exists
const adminEmail = "admin@iteraima.rr.gov.br";
const existingAdmin = db.prepare("SELECT * FROM users WHERE email = ?").get(adminEmail);
if (!existingAdmin) {
  const hashedPassword = bcrypt.hashSync("admin123", 10);
  db.prepare("INSERT INTO users (email, password, role) VALUES (?, ?, ?)").run(adminEmail, hashedPassword, "admin");
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // Auth Middleware
  const authenticateToken = (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err) return res.sendStatus(403);
      req.user = user;
      next();
    });
  };

  // API Routes
  app.post("/api/login", (req, res) => {
    const { email, password } = req.body;
    const user: any = db.prepare("SELECT * FROM users WHERE email = ?").get(email);

    if (user && bcrypt.compareSync(password, user.password)) {
      const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET);
      res.json({ token, user: { email: user.email, role: user.role } });
    } else {
      res.status(401).json({ message: "Credenciais inválidas" });
    }
  });

  app.get("/api/news", (req, res) => {
    const news = db.prepare("SELECT * FROM news ORDER BY created_at DESC").all();
    res.json(news);
  });

  app.post("/api/news", authenticateToken, (req: any, res) => {
    const { title, content, category, image_url } = req.body;
    try {
      const result = db.prepare("INSERT INTO news (title, content, category, image_url, author_id) VALUES (?, ?, ?, ?, ?)")
        .run(title, content, category, image_url, req.user.id);
      res.json({ id: result.lastInsertRowid });
    } catch (error) {
      res.status(500).json({ message: "Erro ao publicar notícia" });
    }
  });

  app.delete("/api/news/:id", authenticateToken, (req, res) => {
    const { id } = req.params;
    db.prepare("DELETE FROM news WHERE id = ?").run(id);
    res.json({ message: "Notícia removida" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
