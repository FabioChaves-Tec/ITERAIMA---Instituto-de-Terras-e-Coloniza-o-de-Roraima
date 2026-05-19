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
import OpenAI from "openai";

dotenv.config();

// Ensure uploads directory exists
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgres://iteraima_user:NovaSenha123@localhost:5432/iteraima"
});

const JWT_SECRET = process.env.JWT_SECRET || "iteraima-secret-key-producao";

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

      CREATE TABLE IF NOT EXISTS menus (
        id SERIAL PRIMARY KEY,
        label TEXT NOT NULL,
        path TEXT,
        parent_id INTEGER REFERENCES menus(id) ON DELETE CASCADE,
        order_index INTEGER DEFAULT 0,
        icon TEXT,
        is_external BOOLEAN DEFAULT FALSE,
        type TEXT DEFAULT 'link'
      );

      INSERT INTO settings (key, value) VALUES ('cover_photo', '/uploads/default-cover.jpg') ON CONFLICT DO NOTHING;
      INSERT INTO settings (key, value) VALUES ('logo_url', 'https://iteraimacidadao.rr.gov.br/cadastrousuarioexterno/include/images/marca/logo_iteraima.png') ON CONFLICT DO NOTHING;
      INSERT INTO settings (key, value) VALUES ('favicon_url', 'https://iteraimacidadao.rr.gov.br/cadastrousuarioexterno/include/images/marca/logo_iteraima.png') ON CONFLICT DO NOTHING;
      
      -- Seed Menus if empty
      DO $$
      DECLARE
        inst_id INTEGER;
        transp_id INTEGER;
        legis_id INTEGER;
        
        -- Transparency Sub-ids
        financeira_id INTEGER;
        coslic_id INTEGER;
        fundiaria_id INTEGER;
        pessoas_id INTEGER;
        
        -- Legislation Sub-ids
        legis_fundiaria_id INTEGER;
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM menus) THEN
          -- Home Link
          INSERT INTO menus (label, path, order_index, icon) VALUES ('INÍCIO', 'home', -1, 'Home');

          -- Institutional
          INSERT INTO menus (label, type, order_index, icon) VALUES ('INSTITUCIONAL', 'folder', 0, 'Landmark') RETURNING id INTO inst_id;
          INSERT INTO menus (label, path, parent_id, order_index) VALUES ('PRESIDÊNCIA', 'presidencia', inst_id, 0);
          INSERT INTO menus (label, path, parent_id, order_index) VALUES ('DIRETORIAS', 'diretorias', inst_id, 1);
          INSERT INTO menus (label, path, parent_id, order_index) VALUES ('GALERIA DE PRESIDENTES', 'galeria', inst_id, 2);

          -- Transparency
          INSERT INTO menus (label, type, order_index, icon) VALUES ('TRANSPARÊNCIA', 'folder', 1, 'Search') RETURNING id INTO transp_id;
          
          INSERT INTO menus (label, type, parent_id, order_index, icon) VALUES ('ACORDO DE COOPERAÇÃO TÉCNICA', 'folder', transp_id, 0, 'Handshake') RETURNING id;
          
          INSERT INTO menus (label, type, parent_id, order_index, icon) VALUES ('FINANCEIRA', 'folder', transp_id, 1, 'DollarSign') RETURNING id INTO financeira_id;
          INSERT INTO menus (label, path, parent_id, order_index, type) VALUES ('BALANÇO FINANCEIRO', 'folder', financeira_id, 0, 'category');
          INSERT INTO menus (label, path, parent_id, order_index, type) VALUES ('CONTRATAÇÃO DIRETA', 'folder', financeira_id, 1, 'category');
          INSERT INTO menus (label, path, parent_id, order_index, type) VALUES ('CONTRATOS E ADITIVOS', 'folder', financeira_id, 2, 'category');
          INSERT INTO menus (label, type, parent_id, order_index, icon) VALUES ('COSLIC', 'folder', financeira_id, 3, 'FileText') RETURNING id INTO coslic_id;
            INSERT INTO menus (label, path, parent_id, order_index, type) VALUES ('AVISO', 'folder', coslic_id, 0, 'category');
            INSERT INTO menus (label, path, parent_id, order_index, type) VALUES ('COMUNICADO', 'folder', coslic_id, 1, 'category');
            INSERT INTO menus (label, path, parent_id, order_index, type) VALUES ('DISPENSA', 'folder', coslic_id, 2, 'category');
            INSERT INTO menus (label, path, parent_id, order_index, type) VALUES ('EDITAIS', 'folder', coslic_id, 3, 'category');
            INSERT INTO menus (label, path, parent_id, order_index, type) VALUES ('INEXIGIBILIDADE', 'folder', coslic_id, 4, 'category');
            INSERT INTO menus (label, path, parent_id, order_index, type) VALUES ('RESULTADO', 'folder', coslic_id, 5, 'category');
            INSERT INTO menus (label, path, parent_id, order_index, type) VALUES ('SÍNTESE', 'folder', coslic_id, 6, 'category');
            INSERT INTO menus (label, path, parent_id, order_index, type) VALUES ('ATA DE REGISTRO DE PREÇOS', 'folder', coslic_id, 7, 'category');
          INSERT INTO menus (label, path, parent_id, order_index, type) VALUES ('PLANO DE CONTRATAÇÃO ANUAL – PCA', 'folder', financeira_id, 4, 'Calendar');

          INSERT INTO menus (label, type, parent_id, order_index, icon) VALUES ('FUNDIÁRIA', 'folder', transp_id, 2, 'Map') RETURNING id INTO fundiaria_id;
          INSERT INTO menus (label, path, parent_id, order_index, type, icon) VALUES ('IMÓVEIS', 'folder', fundiaria_id, 0, 'category', 'Home');
          INSERT INTO menus (label, path, parent_id, order_index, type, icon) VALUES ('REGULARIZADOS', 'folder', fundiaria_id, 1, 'category', 'CheckCircle');
          INSERT INTO menus (label, path, parent_id, order_index, type, icon) VALUES ('NOTIFICAÇÕES', 'folder', fundiaria_id, 2, 'category', 'Bell');
          INSERT INTO menus (label, path, parent_id, order_index, type, icon) VALUES ('REQUERIMENTO DE REGULARIZAÇÃO', 'folder', fundiaria_id, 3, 'category', 'FileEdit');

          INSERT INTO menus (label, type, parent_id, order_index, icon) VALUES ('DE PESSOAS', 'folder', transp_id, 3, 'Users') RETURNING id INTO pessoas_id;
          INSERT INTO menus (label, path, parent_id, order_index, type, icon) VALUES ('CONCURSOS E SELEÇÕES', 'folder', pessoas_id, 0, 'category', 'UserPlus');
          INSERT INTO menus (label, path, parent_id, order_index, type, icon) VALUES ('DIRETORIA DE PESSOAS', 'folder', pessoas_id, 1, 'category', 'Briefcase');
          INSERT INTO menus (label, path, parent_id, order_index, type, icon) VALUES ('DIÁRIAS', 'folder', pessoas_id, 2, 'category', 'DollarSign');
          INSERT INTO menus (label, path, parent_id, order_index, type, icon) VALUES ('ESTAGIÁRIOS', 'folder', pessoas_id, 3, 'category', 'User');
          INSERT INTO menus (label, path, parent_id, order_index, type, icon) VALUES ('FOLHA DE PAYAMENTO', 'folder', pessoas_id, 4, 'category', 'FileText');
          INSERT INTO menus (label, path, parent_id, order_index, type, icon) VALUES ('TERCEIRIZADOS', 'folder', pessoas_id, 5, 'category', 'Users');

          -- Legislation
          INSERT INTO menus (label, type, order_index, icon) VALUES ('LEGISLAÇÃO', 'folder', 2, 'Gavel') RETURNING id INTO legis_id;
          INSERT INTO menus (label, path, parent_id, order_index, type) VALUES ('ADMINISTRATIVA', 'folder', legis_id, 0, 'category');
          INSERT INTO menus (label, type, parent_id, order_index, icon) VALUES ('FUNDIÁRIA', 'folder', legis_id, 1, 'Map') RETURNING id INTO legis_fundiaria_id;
            INSERT INTO menus (label, path, parent_id, order_index, type) VALUES ('LEI VIGENTE', 'folder', legis_fundiaria_id, 0, 'category');
            INSERT INTO menus (label, path, parent_id, order_index, type) VALUES ('LEI NÃO VIGENTE', 'folder', legis_fundiaria_id, 1, 'category');
          INSERT INTO menus (label, path, parent_id, order_index, type) VALUES ('MODELOS DE REQUERIMENTOS', 'folder', legis_id, 2, 'category');
          
        END IF;
      END $$;
      
      -- Initialize presidencia if empty
      INSERT INTO presidencia (id, name, photo_url, biography) 
      SELECT 1, 'Presidente do ITERAIMA', 'https://picsum.photos/seed/president/400/400', 'Biografia do presidente...'
      WHERE NOT EXISTS (SELECT 1 FROM presidencia WHERE id = 1);

      -- Ensure updated_at column exists in news table
      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='news' AND column_name='updated_at') THEN 
          ALTER TABLE news ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP; 
        END IF; 
      END $$;

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

  app.get("/api/settings/logo", async (req, res) => {
    try {
      const { rows } = await pool.query("SELECT value FROM settings WHERE key = 'logo_url'");
      res.json({ url: rows[0]?.value || "" });
    } catch (err) {
      res.status(500).json({ message: "Erro ao buscar logo" });
    }
  });

  app.post("/api/settings/logo", authenticateToken, async (req: any, res) => {
    if (req.user.role !== 'admin' && req.user.role !== 'editor') return res.sendStatus(403);
    const { url } = req.body;
    try {
      await pool.query("INSERT INTO settings (key, value) VALUES ('logo_url', $1) ON CONFLICT (key) DO UPDATE SET value = $1", [url]);
      res.json({ message: "Logo atualizado" });
    } catch (err) {
      res.status(500).json({ message: "Erro ao atualizar logo" });
    }
  });

  app.get("/api/settings/favicon", async (req, res) => {
    try {
      const { rows } = await pool.query("SELECT value FROM settings WHERE key = 'favicon_url'");
      res.json({ url: rows[0]?.value || "" });
    } catch (err) {
      res.status(500).json({ message: "Erro ao buscar favicon" });
    }
  });

  app.post("/api/settings/favicon", authenticateToken, async (req: any, res) => {
    if (req.user.role !== 'admin' && req.user.role !== 'editor') return res.sendStatus(403);
    const { url } = req.body;
    try {
      await pool.query("INSERT INTO settings (key, value) VALUES ('favicon_url', $1) ON CONFLICT (key) DO UPDATE SET value = $1", [url]);
      res.json({ message: "Favicon atualizado" });
    } catch (err) {
      res.status(500).json({ message: "Erro ao atualizar favicon" });
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

  // Menus API
  app.get("/api/menus", async (req, res) => {
    try {
      const { rows } = await pool.query("SELECT * FROM menus ORDER BY order_index ASC, id ASC");
      res.json(rows);
    } catch (err) {
      res.status(500).json({ message: "Erro ao buscar menus" });
    }
  });

  app.post("/api/menus", authenticateToken, async (req: any, res) => {
    if (req.user.role !== 'admin' && req.user.role !== 'editor') return res.sendStatus(403);
    const { label, path, parent_id, order_index, icon, is_external, type } = req.body;
    try {
      const { rows } = await pool.query(
        "INSERT INTO menus (label, path, parent_id, order_index, icon, is_external, type) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *",
        [label, path, parent_id, order_index, icon, is_external, type]
      );
      res.json(rows[0]);
    } catch (err) {
      res.status(500).json({ message: "Erro ao criar menu" });
    }
  });

  app.put("/api/menus/:id", authenticateToken, async (req: any, res) => {
    if (req.user.role !== 'admin' && req.user.role !== 'editor') return res.sendStatus(403);
    const { label, path, parent_id, order_index, icon, is_external, type } = req.body;
    try {
      const { rows } = await pool.query(
        "UPDATE menus SET label = $1, path = $2, parent_id = $3, order_index = $4, icon = $5, is_external = $6, type = $7 WHERE id = $8 RETURNING *",
        [label, path, parent_id, order_index, icon, is_external, type, req.params.id]
      );
      res.json(rows[0]);
    } catch (err) {
      res.status(500).json({ message: "Erro ao atualizar menu" });
    }
  });

  app.delete("/api/menus/:id", authenticateToken, async (req: any, res) => {
    if (req.user.role !== 'admin' && req.user.role !== 'editor') return res.sendStatus(403);
    try {
      await pool.query("DELETE FROM menus WHERE id = $1", [req.params.id]);
      res.json({ message: "Menu removido com sucesso" });
    } catch (err) {
      res.status(500).json({ message: "Erro ao remover menu" });
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

  app.put("/api/news/:id", authenticateToken, async (req: any, res) => {
    if (req.user.role !== 'admin' && req.user.role !== 'editor') return res.sendStatus(403);
    const { id } = req.params;
    const { title, content, category, image_url } = req.body;
    try {
      await pool.query(
        "UPDATE news SET title = $1, content = $2, category = $3, image_url = $4, updated_at = CURRENT_TIMESTAMP WHERE id = $5",
        [title, content, category, image_url, id]
      );
      res.json({ message: "Notícia atualizada" });
    } catch (err) {
      res.status(500).json({ message: "Erro ao atualizar notícia" });
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

  // AI Chat Route
  app.post("/api/ai/chat", async (req, res) => {
    const { query, context } = req.body;
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ message: "OpenAI API Key não configurada no servidor." });
    }

    try {
      const openai = new OpenAI({ apiKey });

      // Build context string similarly to the client-side service
      const newsText = context.news
        ? context.news.map((n: any) => `Notícia (${n.category}): ${n.title}\n${n.content}`).slice(0, 5).join('\n\n')
        : '';

      const presidenciaText = context.presidencia 
        ? `Presidência: ${context.presidencia.name}\n${context.presidencia.biography}`
        : '';
      
      const diretoriasText = context.diretorias
        ? context.diretorias.map((d: any) => `Diretoria: ${d.name} - Diretor: ${d.director_name}`).join('\n')
        : '';

      const galeriaText = context.galeria
        ? context.galeria.map((p: any) => `Ex-Presidente: ${p.name} (${p.period})`).join('\n')
        : '';

      const docsSummary = context.documents
        ? context.documents.map((d: any) => `- ${d.name} (${d.category}, ${d.year}${d.month ? `, ${d.month}` : ''})`).slice(0, 20).join('\n')
        : '';

      const systemInstruction = `
        Você é o Assistente Virtual do ITERAIMA (Instituto de Terras e Colonização de Roraima).
        Sua missão é ajudar os cidadãos com informações sobre o instituto, notícias, transparência e documentos.
        
        --- INFORMAÇÕES INSTITUCIONAIS ---
        ${presidenciaText}
        ${diretoriasText}
        ${galeriaText}
        
        --- NOTÍCIAS RECENTES ---
        ${newsText}
        
        --- LISTA DE DOCUMENTOS NO PORTAL DA TRANSPARÊNCIA ---
        ${docsSummary}
        
        --- INSTRUÇÕES ---
        1. Responda de forma clara, educada e profissional.
        2. Se a pergunta for sobre um documento que não está na lista, informe que ele pode não estar disponível digitalmente ainda.
        3. Se você não souber a resposta, direcione o usuário para: protoiteraima@gmail.com ou (95) 98408-0403.
        4. Use Markdown para formatar suas respostas.
      `;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemInstruction },
          { role: "user", content: query }
        ],
        temperature: 0.7,
      });

      res.json({ text: response.choices[0].message.content });
    } catch (error) {
      console.error('Error in AI chat route:', error);
      res.status(500).json({ message: "Erro ao processar solicitação de IA" });
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
