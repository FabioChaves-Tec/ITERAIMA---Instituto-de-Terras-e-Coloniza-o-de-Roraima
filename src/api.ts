
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
  month?: string;
  url: string;
  upload_date: string;
  author_id: number;
}

export interface Presidencia {
  id: number;
  name: string;
  photo_url: string;
  biography: string;
  updated_at: string;
}

export interface Diretoria {
  id: number;
  name: string;
  director_name: string;
  photo_url: string;
  updated_at: string;
}

export interface GaleriaPresidente {
  id: number;
  name: string;
  photo_url: string;
  period: string;
  created_at: string;
}

export interface MenuNode {
  id: string;
  label: string;
  iconName: string;
  type: 'years' | 'months' | 'parent';
  subItems?: MenuNode[];
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

  async uploadFile(file: File): Promise<{ url: string }> {
    const formData = new FormData();
    formData.append('file', file);
    
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/api/upload`, {
      method: 'POST',
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: formData
    });
    if (!res.ok) throw new Error('Erro ao enviar arquivo');
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

  async updateNews(id: number, news: Partial<News>) {
    const res = await fetch(`${API_URL}/api/news/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(news)
    });
    if (!res.ok) throw new Error('Erro ao atualizar notícia');
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

  async deleteDocument(id: number) {
    const res = await fetch(`${API_URL}/api/documents/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Erro ao remover documento');
    return res.json();
  },

  async getPendingUsers(): Promise<User[]> {
    const res = await fetch(`${API_URL}/api/users/pending`, {
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Erro ao buscar usuários pendentes');
    return res.json();
  },

  async getUsers(): Promise<User[]> {
    const res = await fetch(`${API_URL}/api/users`, {
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Erro ao buscar todos os usuários');
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
  },

  async changePassword(currentPassword: string, newPassword: string) {
    const res = await fetch(`${API_URL}/api/users/change-password`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ currentPassword, newPassword })
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Erro ao alterar senha');
    }
    return res.json();
  },

  async getCoverPhoto(): Promise<{ url: string }> {
    const res = await fetch(`${API_URL}/api/settings/cover`);
    if (!res.ok) throw new Error('Erro ao buscar foto de capa');
    return res.json();
  },

  async updateCoverPhoto(url: string) {
    const res = await fetch(`${API_URL}/api/settings/cover`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ url })
    });
    if (!res.ok) throw new Error('Erro ao atualizar foto de capa');
    return res.json();
  },

  async getLogo(): Promise<{ url: string }> {
    const res = await fetch(`${API_URL}/api/settings/logo`);
    if (!res.ok) throw new Error('Erro ao buscar logo');
    return res.json();
  },

  async updateLogo(url: string) {
    const res = await fetch(`${API_URL}/api/settings/logo`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ url })
    });
    if (!res.ok) throw new Error('Erro ao atualizar logo');
    return res.json();
  },

  async getFavicon(): Promise<{ url: string }> {
    const res = await fetch(`${API_URL}/api/settings/favicon`);
    if (!res.ok) throw new Error('Erro ao buscar favicon');
    return res.json();
  },

  async updateFavicon(url: string) {
    const res = await fetch(`${API_URL}/api/settings/favicon`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ url })
    });
    if (!res.ok) throw new Error('Erro ao atualizar favicon');
    return res.json();
  },

  async getPresidencia(): Promise<Presidencia> {
    const res = await fetch(`${API_URL}/api/presidencia`);
    if (!res.ok) throw new Error('Erro ao buscar informações da presidência');
    return res.json();
  },

  async updatePresidencia(data: Partial<Presidencia>) {
    const res = await fetch(`${API_URL}/api/presidencia`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Erro ao atualizar informações da presidência');
    return res.json();
  },

  async getDiretorias(): Promise<Diretoria[]> {
    const res = await fetch(`${API_URL}/api/diretorias`);
    if (!res.ok) throw new Error('Erro ao buscar diretorias');
    return res.json();
  },

  async addDiretoria(data: Partial<Diretoria>) {
    const res = await fetch(`${API_URL}/api/diretorias`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Erro ao adicionar diretoria');
    return res.json();
  },

  async deleteDiretoria(id: number) {
    const res = await fetch(`${API_URL}/api/diretorias/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Erro ao remover diretoria');
    return res.json();
  },

  async getGaleria(): Promise<GaleriaPresidente[]> {
    const res = await fetch(`${API_URL}/api/galeria`);
    if (!res.ok) throw new Error('Erro ao buscar galeria');
    return res.json();
  },

  async addGaleria(data: Partial<GaleriaPresidente>) {
    const res = await fetch(`${API_URL}/api/galeria`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Erro ao adicionar à galeria');
    return res.json();
  },

  async deleteGaleria(id: number) {
    const res = await fetch(`${API_URL}/api/galeria/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Erro ao remover da galeria');
    return res.json();
  },

  async getMenuNodes(): Promise<{ transparencia: MenuNode[], legislacao: MenuNode[], years: string[] }> {
    const res = await fetch(`${API_URL}/api/settings/menu_nodes`);
    if (!res.ok) throw new Error('Erro ao buscar categorias do menu');
    return res.json();
  },

  async updateMenuNodes(transparencia: MenuNode[], legislacao: MenuNode[], years?: string[]) {
    const res = await fetch(`${API_URL}/api/settings/menu_nodes`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ transparencia, legislacao, years })
    });
    if (!res.ok) throw new Error('Erro ao salvar categorias do menu');
    return res.json();
  }
};
