import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { Pool } from "pg";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import cors from "cors";
import dotenv from "dotenv";
import multer from "multer";
import fs from "fs";

dotenv.config();

// Ensure uploads directory exists
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

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
        month TEXT,
        url TEXT,
        upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        author_id INTEGER REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT
      );

      CREATE TABLE IF NOT EXISTS presidencia (
        id SERIAL PRIMARY KEY,
        name TEXT,
        photo_url TEXT,
        biography TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS diretorias (
        id SERIAL PRIMARY KEY,
        name TEXT,
        director_name TEXT,
        photo_url TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS galeria_presidentes (
        id SERIAL PRIMARY KEY,
        name TEXT,
        photo_url TEXT,
        period TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      INSERT INTO settings (key, value) VALUES ('cover_photo', '/uploads/default-cover.jpg') ON CONFLICT DO NOTHING;
      
      -- Initialize presidencia if empty
      INSERT INTO presidencia (id, name, photo_url, biography) 
      SELECT 1, 'Presidente do ITERAIMA', 'https://picsum.photos/seed/president/400/400', 'Biografia do presidente...'
      WHERE NOT EXISTS (SELECT 1 FROM presidencia WHERE id = 1);

      -- Ensure month column exists in documents table
      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='documents' AND column_name='month') THEN 
          ALTER TABLE documents ADD COLUMN month TEXT; 
        END IF; 
      END $$;
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
  app.use("/uploads", express.static(uploadDir));

  // Multer Configuration
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    }
  });
  const upload = multer({ storage });

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

  app.post("/api/users/change-password", authenticateToken, async (req: any, res) => {
    const { currentPassword, newPassword } = req.body;
    try {
      const { rows } = await pool.query("SELECT * FROM users WHERE id = $1", [req.user.id]);
      const user = rows[0];

      if (user && bcrypt.compareSync(currentPassword, user.password)) {
        const hashedPassword = bcrypt.hashSync(newPassword, 10);
        await pool.query("UPDATE users SET password = $1 WHERE id = $2", [hashedPassword, req.user.id]);
        res.json({ message: "Senha alterada com sucesso" });
      } else {
        res.status(400).json({ message: "Senha atual incorreta" });
      }
    } catch (err) {
      res.status(500).json({ message: "Erro ao alterar senha" });
    }
  });

  app.get("/api/settings/cover", async (req, res) => {
    try {
      const { rows } = await pool.query("SELECT value FROM settings WHERE key = 'cover_photo'");
      res.json({ url: rows[0]?.value || "" });
    } catch (err) {
      res.status(500).json({ message: "Erro ao buscar foto de capa" });
    }
  });

  app.post("/api/settings/cover", authenticateToken, async (req: any, res) => {
    if (req.user.role !== 'admin' && req.user.role !== 'editor') return res.sendStatus(403);
    const { url } = req.body;
    try {
      await pool.query("INSERT INTO settings (key, value) VALUES ('cover_photo', $1) ON CONFLICT (key) DO UPDATE SET value = $1", [url]);
      res.json({ message: "Foto de capa atualizada" });
    } catch (err) {
      res.status(500).json({ message: "Erro ao atualizar foto de capa" });
    }
  });

  // Presidencia
  app.get("/api/presidencia", async (req, res) => {
    try {
      const { rows } = await pool.query("SELECT * FROM presidencia WHERE id = 1");
      res.json(rows[0]);
    } catch (err) {
      res.status(500).json({ message: "Erro ao buscar informações da presidência" });
    }
  });

  app.post("/api/presidencia", authenticateToken, async (req: any, res) => {
    if (req.user.role !== 'admin' && req.user.role !== 'editor') return res.sendStatus(403);
    const { name, photo_url, biography } = req.body;
    try {
      await pool.query(
        "UPDATE presidencia SET name = $1, photo_url = $2, biography = $3, updated_at = CURRENT_TIMESTAMP WHERE id = 1",
        [name, photo_url, biography]
      );
      res.json({ message: "Informações da presidência atualizadas" });
    } catch (err) {
      res.status(500).json({ message: "Erro ao atualizar informações da presidência" });
    }
  });

  // Diretorias
  app.get("/api/diretorias", async (req, res) => {
    try {
      const { rows } = await pool.query("SELECT * FROM diretorias ORDER BY id ASC");
      res.json(rows);
    } catch (err) {
      res.status(500).json({ message: "Erro ao buscar diretorias" });
    }
  });

  app.post("/api/diretorias", authenticateToken, async (req: any, res) => {
    if (req.user.role !== 'admin' && req.user.role !== 'editor') return res.sendStatus(403);
    const { name, director_name, photo_url } = req.body;
    try {
      await pool.query(
        "INSERT INTO diretorias (name, director_name, photo_url) VALUES ($1, $2, $3)",
        [name, director_name, photo_url]
      );
      res.json({ message: "Diretoria adicionada com sucesso" });
    } catch (err) {
      res.status(500).json({ message: "Erro ao adicionar diretoria" });
    }
  });

  app.delete("/api/diretorias/:id", authenticateToken, async (req: any, res) => {
    if (req.user.role !== 'admin' && req.user.role !== 'editor') return res.sendStatus(403);
    try {
      await pool.query("DELETE FROM diretorias WHERE id = $1", [req.params.id]);
      res.json({ message: "Diretoria removida com sucesso" });
    } catch (err) {
      res.status(500).json({ message: "Erro ao remover diretoria" });
    }
  });

  // Galeria de Presidentes
  app.get("/api/galeria", async (req, res) => {
    try {
      const { rows } = await pool.query("SELECT * FROM galeria_presidentes ORDER BY created_at DESC");
      res.json(rows);
    } catch (err) {
      res.status(500).json({ message: "Erro ao buscar galeria" });
    }
  });

  app.post("/api/galeria", authenticateToken, async (req: any, res) => {
    if (req.user.role !== 'admin' && req.user.role !== 'editor') return res.sendStatus(403);
    const { name, photo_url, period } = req.body;
    try {
      await pool.query(
        "INSERT INTO galeria_presidentes (name, photo_url, period) VALUES ($1, $2, $3)",
        [name, photo_url, period]
      );
      res.json({ message: "Presidente adicionado à galeria" });
    } catch (err) {
      res.status(500).json({ message: "Erro ao adicionar à galeria" });
    }
  });

  app.delete("/api/galeria/:id", authenticateToken, async (req: any, res) => {
    if (req.user.role !== 'admin' && req.user.role !== 'editor') return res.sendStatus(403);
    try {
      await pool.query("DELETE FROM galeria_presidentes WHERE id = $1", [req.params.id]);
      res.json({ message: "Presidente removido da galeria" });
    } catch (err) {
      res.status(500).json({ message: "Erro ao remover da galeria" });
    }
  });

  app.post("/api/upload", authenticateToken, upload.single("file"), (req: any, res) => {
    if (!req.file) return res.status(400).json({ message: "Nenhum arquivo enviado" });
    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({ url: fileUrl });
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
    const { name, category, year, month, url } = req.body;
    try {
      const { rows } = await pool.query(
        "INSERT INTO documents (name, category, year, month, url, author_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id",
        [name, category, year, month, url, req.user.id]
      );
      res.json({ id: rows[0].id });
    } catch (error) {
      res.status(500).json({ message: "Erro ao enviar documento" });
    }
  });

  app.delete("/api/documents/:id", authenticateToken, async (req: any, res) => {
    if (req.user.role !== 'admin' && req.user.role !== 'editor') return res.sendStatus(403);
    try {
      await pool.query("DELETE FROM documents WHERE id = $1", [req.params.id]);
      res.json({ message: "Documento removido com sucesso" });
    } catch (err) {
      res.status(500).json({ message: "Erro ao remover documento" });
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
