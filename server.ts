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

      INSERT INTO settings (key, value) VALUES ('cover_photo', '/uploads/default-cover.jpg') ON CONFLICT DO NOTHING;
      INSERT INTO settings (key, value) VALUES ('logo_url', 'https://iteraimacidadao.rr.gov.br/cadastrousuarioexterno/include/images/marca/logo_iteraima.png') ON CONFLICT DO NOTHING;
      INSERT INTO settings (key, value) VALUES ('favicon_url', 'https://iteraimacidadao.rr.gov.br/cadastrousuarioexterno/include/images/marca/logo_iteraima.png') ON CONFLICT DO NOTHING;
      
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

  // Menu Nodes (Transparency & Legislation Categories)
  app.get("/api/settings/menu_nodes", async (req, res) => {
    try {
      const { rows } = await pool.query("SELECT key, value FROM settings WHERE key IN ('transparencia_nodes', 'legislacao_nodes')");
      const result: { transparencia: any[], legislacao: any[] } = {
        transparencia: [],
        legislacao: []
      };
      rows.forEach(row => {
        if (row.key === 'transparencia_nodes') {
          try {
            result.transparencia = JSON.parse(row.value);
          } catch (e) {
            result.transparencia = [];
          }
        } else if (row.key === 'legislacao_nodes') {
          try {
            result.legislacao = JSON.parse(row.value);
          } catch (e) {
            result.legislacao = [];
          }
        }
      });
      res.json(result);
    } catch (err) {
      res.status(500).json({ message: "Erro ao buscar categorias do menu" });
    }
  });

  app.post("/api/settings/menu_nodes", authenticateToken, async (req: any, res) => {
    if (req.user.role !== 'admin' && req.user.role !== 'editor') return res.sendStatus(403);
    const { transparencia, legislacao } = req.body;
    try {
      if (transparencia) {
        await pool.query("INSERT INTO settings (key, value) VALUES ('transparencia_nodes', $1) ON CONFLICT (key) DO UPDATE SET value = $1", [JSON.stringify(transparencia)]);
      }
      if (legislacao) {
        await pool.query("INSERT INTO settings (key, value) VALUES ('legislacao_nodes', $1) ON CONFLICT (key) DO UPDATE SET value = $1", [JSON.stringify(legislacao)]);
      }
      res.json({ message: "Categorias do menu atualizadas com sucesso" });
    } catch (err) {
      res.status(500).json({ message: "Erro ao atualizar categorias do menu" });
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
