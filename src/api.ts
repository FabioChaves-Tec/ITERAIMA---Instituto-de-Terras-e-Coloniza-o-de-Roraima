
const API_URL = ''; // Relative to the same origin

export interface User {
  id: number;
  email: string;
  role: 'admin' | 'editor' | 'viewer' | 'pending';
  created_at?: string;
}

export interface News {
  id: number;
  title: string;
  content: string;
  category: string;
  image_url: string;
  created_at: string;
  author_id: number;
}

export interface TransparencyDocument {
  id: number;
  name: string;
  category: string;
  year: string;
  url: string;
  upload_date: string;
  author_id: number;
}

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

export const api = {
  async login(email: string, password: string) {
    const res = await fetch(`${API_URL}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Erro ao realizar login');
    }
    return res.json();
  },

  async register(email: string, password: string) {
    const res = await fetch(`${API_URL}/api/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Erro ao realizar cadastro');
    }
    return res.json();
  },

  async getNews(): Promise<News[]> {
    const res = await fetch(`${API_URL}/api/news`);
    if (!res.ok) throw new Error('Erro ao buscar notícias');
    return res.json();
  },

  async publishNews(news: Partial<News>) {
    const res = await fetch(`${API_URL}/api/news`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(news)
    });
    if (!res.ok) throw new Error('Erro ao publicar notícia');
    return res.json();
  },

  async deleteNews(id: number) {
    const res = await fetch(`${API_URL}/api/news/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Erro ao remover notícia');
    return res.json();
  },

  async getDocuments(): Promise<TransparencyDocument[]> {
    const res = await fetch(`${API_URL}/api/documents`);
    if (!res.ok) throw new Error('Erro ao buscar documentos');
    return res.json();
  },

  async uploadDocument(doc: Partial<TransparencyDocument>) {
    const res = await fetch(`${API_URL}/api/documents`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(doc)
    });
    if (!res.ok) throw new Error('Erro ao enviar documento');
    return res.json();
  },

  async getPendingUsers(): Promise<User[]> {
    const res = await fetch(`${API_URL}/api/users/pending`, {
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Erro ao buscar usuários pendentes');
    return res.json();
  },

  async approveUser(id: number, role: string) {
    const res = await fetch(`${API_URL}/api/users/approve`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ id, role })
    });
    if (!res.ok) throw new Error('Erro ao aprovar usuário');
    return res.json();
  },

  async rejectUser(id: number) {
    const res = await fetch(`${API_URL}/api/users/reject`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ id })
    });
    if (!res.ok) throw new Error('Erro ao rejeitar usuário');
    return res.json();
  }
};
