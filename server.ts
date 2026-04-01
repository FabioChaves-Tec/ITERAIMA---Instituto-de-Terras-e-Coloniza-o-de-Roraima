import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { Pool } from "pg";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/iteraima"
});

const JWT_SECRET = process.env.JWT_SECRET || "iteraima-secret-key";

// Initialize Database
const initDb = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email TEXT UNIQUE,
        password TEXT,
        role TEXT DEFAULT 'editor',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS news (
        id SERIAL PRIMARY KEY,
        title TEXT,
        content TEXT,
        category TEXT,
        image_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        author_id INTEGER REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS documents (
        id SERIAL PRIMARY KEY,
        name TEXT,
        category TEXT,
        year TEXT,
        url TEXT,
        upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        author_id INTEGER REFERENCES users(id)
      );
    `);

    // Create default admin if not exists
    const adminEmail = "admin@iteraima.rr.gov.br";
    const { rows: existingAdmin } = await pool.query("SELECT * FROM users WHERE email = $1", [adminEmail]);
    if (existingAdmin.length === 0) {
      const hashedPassword = bcrypt.hashSync("admin123", 10);
      await pool.query("INSERT INTO users (email, password, role) VALUES ($1, $2, $3)", [adminEmail, hashedPassword, "admin"]);
    }
    console.log("Database initialized");
  } catch (err) {
    console.error("Error initializing database:", err);
  }
};

initDb();

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
  app.post("/api/register", async (req, res) => {
    const { email, password } = req.body;
    try {
      const hashedPassword = bcrypt.hashSync(password, 10);
      await pool.query(
        "INSERT INTO users (email, password, role) VALUES ($1, $2, $3)",
        [email, hashedPassword, "pending"]
      );
      res.json({ message: "Cadastro realizado, aguarde aprovação" });
    } catch (err) {
      res.status(500).json({ message: "Erro ao realizar cadastro" });
    }
  });

  app.post("/api/login", async (req, res) => {
    const { email, password } = req.body;
    try {
      const { rows } = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
      const user = rows[0];

      if (user && bcrypt.compareSync(password, user.password)) {
        if (user.role === 'pending') {
          return res.status(403).json({ message: "Sua conta está aguardando aprovação" });
        }
        const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET);
        res.json({ token, user: { email: user.email, role: user.role } });
      } else {
        res.status(401).json({ message: "Credenciais inválidas" });
      }
    } catch (err) {
      res.status(500).json({ message: "Erro no servidor" });
    }
  });

  app.get("/api/users", authenticateToken, async (req: any, res) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);
    try {
      const { rows } = await pool.query("SELECT id, email, role, created_at FROM users ORDER BY created_at DESC");
      res.json(rows);
    } catch (err) {
      res.status(500).json({ message: "Erro ao buscar usuários" });
    }
  });

  app.get("/api/users/pending", authenticateToken, async (req: any, res) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);
    try {
      const { rows } = await pool.query("SELECT id, email, role, created_at FROM users WHERE role = 'pending'");
      res.json(rows);
    } catch (err) {
      res.status(500).json({ message: "Erro ao buscar usuários pendentes" });
    }
  });

  app.post("/api/users/approve", authenticateToken, async (req: any, res) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);
    const { id, role } = req.body;
    try {
      await pool.query("UPDATE users SET role = $1 WHERE id = $2", [role, id]);
      res.json({ message: "Usuário aprovado" });
    } catch (err) {
      res.status(500).json({ message: "Erro ao aprovar usuário" });
    }
  });

  app.post("/api/users/reject", authenticateToken, async (req: any, res) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);
    const { id } = req.body;
    try {
      await pool.query("DELETE FROM users WHERE id = $1", [id]);
      res.json({ message: "Usuário rejeitado" });
    } catch (err) {
      res.status(500).json({ message: "Erro ao rejeitar usuário" });
    }
  });

  app.get("/api/news", async (req, res) => {
    try {
      const { rows } = await pool.query("SELECT * FROM news ORDER BY created_at DESC");
      res.json(rows);
    } catch (err) {
      res.status(500).json({ message: "Erro ao buscar notícias" });
    }
  });

  app.post("/api/news", authenticateToken, async (req: any, res) => {
    const { title, content, category, image_url } = req.body;
    try {
      const { rows } = await pool.query(
        "INSERT INTO news (title, content, category, image_url, author_id) VALUES ($1, $2, $3, $4, $5) RETURNING id",
        [title, content, category, image_url, req.user.id]
      );
      res.json({ id: rows[0].id });
    } catch (error) {
      res.status(500).json({ message: "Erro ao publicar notícia" });
    }
  });

  app.delete("/api/news/:id", authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
      await pool.query("DELETE FROM news WHERE id = $1", [id]);
      res.json({ message: "Notícia removida" });
    } catch (err) {
      res.status(500).json({ message: "Erro ao remover notícia" });
    }
  });

  // Documents Routes
  app.get("/api/documents", async (req, res) => {
    try {
      const { rows } = await pool.query("SELECT * FROM documents ORDER BY upload_date DESC");
      res.json(rows);
    } catch (err) {
      res.status(500).json({ message: "Erro ao buscar documentos" });
    }
  });

  app.post("/api/documents", authenticateToken, async (req: any, res) => {
    const { name, category, year, url } = req.body;
    try {
      const { rows } = await pool.query(
        "INSERT INTO documents (name, category, year, url, author_id) VALUES ($1, $2, $3, $4, $5) RETURNING id",
        [name, category, year, url, req.user.id]
      );
      res.json({ id: rows[0].id });
    } catch (error) {
      res.status(500).json({ message: "Erro ao enviar documento" });
    }
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
