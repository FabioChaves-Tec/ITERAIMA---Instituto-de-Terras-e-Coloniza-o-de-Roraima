# ITERAIMA - Portal Institucional e da Transparência

Este é o portal oficial do **Instituto de Terras e Colonização de Roraima (ITERAIMA)**, desenvolvido para fornecer informações sobre regularização fundiária, notícias institucionais, transparência pública e atendimento via Inteligência Artificial.

## 🚀 Como Iniciar

Para rodar o projeto localmente ou em produção, consulte a documentação detalhada:

👉 **[DOCUMENTATION.md](./DOCUMENTATION.md)**

## 🛠️ Tecnologias Utilizadas

- **Frontend:** React, Vite, Tailwind CSS, Lucide Icons, Framer Motion.
- **Backend:** Node.js, Express, Multer (Uploads), JWT (Auth).
- **Banco de Dados:** PostgreSQL.
- **IA:** OpenAI (GPT-4o).

## 📁 Estrutura Principal

- `/src/App.tsx`: Interface principal do portal.
- `/server.ts`: Servidor de API e Banco de Dados (agora com suporte nativo a OpenAI).
- `/src/services/aiService.ts`: Integração com a IA através do backend.
- `/uploads/`: Armazenamento de documentos e imagens.

## 🔑 Configuração Necessária

Para o funcionamento total do portal, adicione as seguintes chaves nas configurações de **Secrets** do AI Studio:
- `OPENAI_API_KEY`: Para o Assistente Virtual.
- `JWT_SECRET`: Chave secreta para autenticação.
- `GEMINI_API_KEY`: (Opcional) Para funcionalidades que ainda usem Gemini.

## 📞 Contato

- **Email:** protoiteraima@gmail.com
- **WhatsApp:** (95) 98408-0403
