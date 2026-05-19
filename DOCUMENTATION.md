# Documentação Técnica - Portal ITERAIMA

Este documento fornece uma visão detalhada da arquitetura, estrutura e funcionamento do Portal Institucional e da Transparência do **ITERAIMA (Instituto de Terras e Colonização de Roraima)**.

---

## 1. Visão Geral do Projeto

O Portal ITERAIMA é uma aplicação full-stack moderna projetada para centralizar informações institucionais, notícias, documentos de transparência e oferecer um canal de atendimento inteligente via IA para os cidadãos.

### Principais Funcionalidades:
- **Portal de Notícias:** Publicação e visualização de notícias institucionais.
- **Portal da Transparência:** Organização e busca de documentos (editais, balanços, contratos) por categoria, ano e mês.
- **Assistente Virtual (IA):** Chatbot inteligente integrado à OpenAI (GPT-4o) que responde dúvidas baseando-se no conteúdo do portal.
- **Painel Administrativo:** Área restrita para editores gerenciarem notícias, documentos, membros da diretoria e galeria de presidentes.
- **Gestão de Conteúdo:** Upload de arquivos e fotos diretamente pelo painel.

---

## 2. Arquitetura e Tecnologias

A aplicação utiliza uma arquitetura de **Single Page Application (SPA)** com um servidor de API integrado.

- **Frontend:**
  - **React 18**: Biblioteca principal de UI.
  - **Vite**: Ferramenta de build e servidor de desenvolvimento.
  - **Tailwind CSS**: Estilização baseada em utilitários.
  - **Lucide React**: Biblioteca de ícones.
  - **Motion (Framer Motion)**: Animações e transições suaves.
  - **Sonner**: Sistema de notificações (Toasts).

- **Backend:**
  - **Node.js + Express**: Servidor de API e roteamento.
  - **PostgreSQL**: Banco de dados relacional para persistência de dados.
  - **JWT (JSON Web Token)**: Autenticação segura para o painel administrativo.
  - **Multer**: Middleware para upload de arquivos.
  - **Bcryptjs**: Criptografia de senhas.

- **Inteligência Artificial:**
  - **OpenAI API (GPT-4o)**: Motor de processamento de linguagem natural acessado via backend.

---

## 3. Estrutura de Pastas

Abaixo está a localização dos itens principais do projeto:

```text
/
├── server.ts               # Servidor Express (API, DB, Auth, Uploads)
├── vite.config.ts          # Configuração do Vite e variáveis de ambiente
├── .env.example            # Modelo de variáveis de ambiente
├── uploads/                # Pasta onde os arquivos enviados são salvos
└── src/
    ├── App.tsx             # Componente principal (UI, Rotas, Lógica do Portal)
    ├── main.tsx            # Ponto de entrada do React
    ├── api.ts              # Cliente de API (Comunicação Frontend -> Backend)
    ├── index.css           # Estilos globais e Tailwind
    ├── components/
    │   └── AiAssistant.tsx # Componente do Chatbot de IA
    ├── services/
    │   └── aiService.ts    # Lógica de integração com OpenAI (via Backend)
    └── lib/
        └── pdfUtils.ts     # Utilitários para processamento de PDFs
```

---

## 4. Banco de Dados (Schema)

O banco de dados PostgreSQL é inicializado automaticamente pelo `server.ts`. As tabelas principais são:

1.  **users**: Armazena editores (id, email, password, role).
2.  **news**: Notícias (title, content, category, image_url).
3.  **documents**: Documentos de transparência e legislação (name, category, year, month, url).
    *   *Categorias:* Balanço Financeiro, Editais, Lei Vigente, Lei Não Vigente, etc.
4.  **presidencia**: Informações do atual presidente.
5.  **diretorias**: Lista de diretores e suas pastas.
6.  **galeria_presidentes**: Histórico de ex-presidentes.
7.  **settings**: Configurações gerais (ex: foto de capa do portal).

---

## 5. Configuração e Instalação (Passo a Passo)

### Pré-requisitos:
- Node.js instalado.
- PostgreSQL instalado e rodando.

### Passo 1: Clonar e Instalar
```bash
# Instalar dependências
npm install
```

### Passo 2: Configurar Variáveis de Ambiente
Crie um arquivo `.env` na raiz do projeto com os seguintes campos:
```env
DATABASE_URL=postgres://usuario:senha@localhost:5432/iteraima
JWT_SECRET=sua_chave_secreta_aqui
OPENAI_API_KEY=sua_chave_da_openai
```

### Passo 3: Iniciar a Aplicação
```bash
# Modo desenvolvimento
npm run dev
```

---

## 6. Guia de Manutenção

### Adicionar um Novo Administrador:
Atualmente, o primeiro usuário pode ser criado via script ou diretamente no banco de dados. O sistema utiliza `bcrypt` para as senhas.

### Atualizar a Inteligência Artificial:
A lógica da IA reside em `src/services/aiService.ts`. Para mudar o comportamento do robô, altere o `systemInstruction` dentro deste arquivo.

### Limites de Upload:
O servidor está configurado para aceitar arquivos via Multer. Certifique-se de que a pasta `uploads/` tenha permissões de escrita no servidor de produção.

---

## 7. Contatos e Suporte

Para dúvidas técnicas ou suporte na aplicação:
- **Email:** protoiteraima@gmail.com
- **Telefone/WhatsApp:** (95) 98408-0403

---
*Documentação gerada em 06 de Abril de 2026.*
