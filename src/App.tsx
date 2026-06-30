/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  Menu, 
  Search, 
  Eye, 
  Wallet, 
  ChevronRight, 
  Gavel, 
  Rss, 
  Calendar, 
  ExternalLink, 
  MapPin, 
  Phone, 
  Mail, 
  Share2, 
  ArrowUp, 
  Home, 
  LayoutGrid, 
  Newspaper, 
  HelpCircle,
  Landmark,
  CircleDollarSign,
  Map,
  Users,
  X,
  UserRound,
  Clock,
  UsersRound,
  Image,
  Scale,
  FileText,
  FileSignature,
  Plus,
  Trash2,
  LogOut,
  LogIn,
  Handshake,
  ClipboardList,
  ArrowLeft,
  Folder,
  Upload,
  File,
  CheckCircle2,
  Download,
  ShieldCheck,
  ShieldAlert,
  UserPlus,
  Settings,
  Lock,
  Volume2,
  MessageCircle,
} from 'lucide-react';
import { Toaster, toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import React, { useState, useEffect, FormEvent } from 'react';
import { api, User, News, TransparencyDocument, Presidencia, Diretoria, GaleriaPresidente } from './api';
import { AccessibilityPanel } from './components/AccessibilityPanel';
const AiAssistant = React.lazy(() => import('./components/AiAssistant').then(m => ({ default: m.AiAssistant })));

const IMAGES = {
  logo: 'https://iteraimacidadao.rr.gov.br/cadastrousuarioexterno/include/images/marca/logo_iteraima.png',
  hero: 'https://st2.depositphotos.com/1482106/12327/i/450/depositphotos_123270174-stock-photo-waving-flag-of-roraima-state.jpg',
  news1: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&q=80&w=800',
  news2: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&q=80&w=800',
};

const transparencyCategories = [
  'BALANÇO FINANCEIRO',
  'CONTRATAÇÃO DIRETA',
  'CONTRATOS E ADITIVOS',
  'AVISO',
  'COMUNICADO',
  'DISPENSA',
  'EDITAIS',
  'INEXIGIBILIDADE',
  'RESULTADO',
  'SÍNTESE',
  'ATA DE REGISTRO DE PREÇOS',
  'PLANO DE CONTRATAÇÃO ANUAL – PCA',
  'IMÓVEIS',
  'REGULARIZADOS',
  'NOTIFICAÇÕES',
  'REQUERIMENTO DE REGULARIZAÇÃO',
  'CONCURSOS E SELEÇÕES',
  'DIÁRIAS',
  'ESTAGIÁRIOS',
  'FOLHA DE PAGAMENTO',
  'TERCEIRIZADOS',
  'ADMINISTRATIVA',
  'FUNDIÁRIA',
  'MODELOS DE REQUERIMENTOS',
  'RURAL',
  'URBANA',
  'ACORDO DE COOPERAÇÃO TÉCNICA'
];

const MONTHS = [
  'JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO',
  'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'
];

import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

const quillModules = {
  toolbar: [
    [{ 'header': [1, 2, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{'list': 'ordered'}, {'list': 'bullet'}],
    ['link'],
    [{ 'color': [] }, { 'background': [] }],
    ['clean']
  ],
};

const stripHtml = (html: string) => {
  if (typeof window === 'undefined') return html.replace(/<[^>]*>?/gm, '');
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body.textContent || "";
};

// ITERAIMA Portal - v1.0.3 - Triggering sync refresh
export default function App() {
  const [showTransparenciaSub, setShowTransparenciaSub] = useState(false);
  const [openLevel2Menu, setOpenLevel2Menu] = useState<string | null>(null);
  const [openLevel3Menu, setOpenLevel3Menu] = useState<string | null>(null);
  const [openLevel4Menu, setOpenLevel4Menu] = useState<string | null>(null);
  const [showInstitucionalSub, setShowInstitucionalSub] = useState(false);
  const [showLegislacaoSub, setShowLegislacaoSub] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState<'home' | 'news' | 'admin' | 'folder' | 'presidencia' | 'diretorias' | 'galeria' | 'news-detail'>('home');
  const [selectedNews, setSelectedNews] = useState<News | null>(null);
  const [editingNewsId, setEditingNewsId] = useState<number | null>(null);
  const [adminTab, setAdminTab] = useState<'publish' | 'users' | 'documents' | 'settings'>('publish');
  const [selectedFolder, setSelectedFolder] = useState<{ label: string, items: any[] } | null>(null);
  const [selectedYear, setSelectedYear] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  
  // Institutional State
  const [presidencia, setPresidencia] = useState<Presidencia | null>(null);
  const [diretorias, setDiretorias] = useState<Diretoria[]>([]);
  const [galeria, setGaleria] = useState<GaleriaPresidente[]>([]);
  // News State
  const [newsList, setNewsList] = useState<News[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Transparency Documents State
  const [documents, setDocuments] = useState<TransparencyDocument[]>([]);
  const [isUploadingDocs, setIsUploadingDocs] = useState(false);
  const [uploadCategory, setUploadCategory] = useState('BALANÇO FINANCEIRO');
  const [availableYears, setAvailableYears] = useState<string[]>(() => {
    const saved = localStorage.getItem('iteraima_years');
    return saved ? JSON.parse(saved) : ['2022', '2023', '2024', '2025', '2026'];
  });
  const [uploadYear, setUploadYear] = useState(() => {
    const saved = localStorage.getItem('iteraima_years');
    const years = saved ? JSON.parse(saved) : ['2022', '2023', '2024', '2025', '2026'];
    const sorted = [...years].sort((a, b) => b.localeCompare(a));
    return sorted[0] || '2026';
  });
  const [newYearInput, setNewYearInput] = useState('');
  const [uploadMonth, setUploadMonth] = useState('JANEIRO');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  
  // Auth State
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [registerSuccess, setRegisterSuccess] = useState(false);

  // Admin State
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [coverPhotoUrl, setCoverPhotoUrl] = useState(IMAGES.hero);
  const [logoUrl, setLogoUrl] = useState(IMAGES.logo);
  const [faviconUrl, setFaviconUrl] = useState(IMAGES.logo);
  const [isUpdatingCover, setIsUpdatingCover] = useState(false);
  const [isUpdatingLogo, setIsUpdatingLogo] = useState(false);
  const [isUpdatingFavicon, setIsUpdatingFavicon] = useState(false);

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState(false);
  const [passwordChangeError, setPasswordChangeError] = useState('');

  // Institutional Admin State
  const [isUpdatingPresidencia, setIsUpdatingPresidencia] = useState(false);
  const [presName, setPresName] = useState('');
  const [presBio, setPresBio] = useState('');
  const [presPhoto, setPresPhoto] = useState<File | null>(null);

  const [isAddingDiretoria, setIsAddingDiretoria] = useState(false);
  const [dirName, setDirName] = useState('');
  const [dirDirector, setDirDirector] = useState('');
  const [dirPhoto, setDirPhoto] = useState<File | null>(null);

  const [isAddingGaleria, setIsAddingGaleria] = useState(false);
  const [galName, setGalName] = useState('');
  const [galPeriod, setGalPeriod] = useState('');
  const [galPhoto, setGalPhoto] = useState<File | null>(null);

  // Publish State
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState('REGULARIZAÇÃO');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newImageFile, setNewImageFile] = useState<File | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState(false);
  const [publishError, setPublishError] = useState('');

  // Delete State
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    // Auth state from localStorage
    const savedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (savedUser && token) {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      if (parsedUser.role === 'viewer') {
        setAdminTab('settings');
      }
    }
    setIsAuthReady(true);

    // Initial data fetch
    const fetchData = async () => {
      try {
        const [news, docs, cover, logo, favicon, pres, dir, gal] = await Promise.all([
          api.getNews(),
          api.getDocuments(),
          api.getCoverPhoto(),
          api.getLogo(),
          api.getFavicon(),
          api.getPresidencia(),
          api.getDiretorias(),
          api.getGaleria()
        ]);
        setNewsList(news);
        setDocuments(docs);
        if (cover.url) setCoverPhotoUrl(cover.url);
        if (logo.url) setLogoUrl(logo.url);
        if (favicon.url) setFaviconUrl(favicon.url);
        setPresidencia(pres);
        setDiretorias(dir);
        setGaleria(gal);
      } catch (error) {
        console.error("Error fetching initial data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

    // Poll for updates (simplified replacement for onSnapshot)
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const initializedPres = React.useRef(false);
  useEffect(() => {
    if (presidencia && !initializedPres.current) {
      setPresName(presidencia.name || '');
      setPresBio(presidencia.biography || '');
      initializedPres.current = true;
    }
  }, [presidencia]);

  // Admin: Fetch pending users
  useEffect(() => {
    if (user?.role === 'admin') {
      const fetchPending = async () => {
        try {
          const pending = await api.getPendingUsers();
          setPendingUsers(pending);
        } catch (error) {
          console.error("Error fetching pending users:", error);
        }
      };
      
      const fetchAll = async () => {
        try {
          const users = await api.getUsers();
          setAllUsers(users);
        } catch (error) {
          console.error("Error fetching all users:", error);
        }
      };

      fetchPending();
      fetchAll();
      const interval = setInterval(() => {
        fetchPending();
        fetchAll();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  useEffect(() => {
    const link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
    if (link) {
      link.href = faviconUrl;
    } else {
      const newLink = document.createElement('link');
      newLink.rel = 'icon';
      newLink.href = faviconUrl;
      document.head.appendChild(newLink);
    }
  }, [faviconUrl]);

  const handleUpdatePresidencia = async (e: FormEvent) => {
    e.preventDefault();
    if (!user || (user.role !== 'admin' && user.role !== 'editor')) return;
    setIsUpdatingPresidencia(true);
    try {
      let photoUrl = presidencia?.photo_url || '';
      if (presPhoto) {
        const res = await api.uploadFile(presPhoto);
        photoUrl = res.url;
      }
      await api.updatePresidencia({ name: presName, photo_url: photoUrl, biography: presBio });
      const updated = await api.getPresidencia();
      setPresidencia(updated);
      toast.success('Informações da presidência atualizadas');
    } catch (err) {
      toast.error('Erro ao atualizar presidência');
    } finally {
      setIsUpdatingPresidencia(false);
    }
  };

  const handleAddDiretoria = async (e: FormEvent) => {
    e.preventDefault();
    if (!user || (user.role !== 'admin' && user.role !== 'editor')) return;
    if (!dirPhoto) return toast.error('Selecione uma foto');
    setIsAddingDiretoria(true);
    try {
      const res = await api.uploadFile(dirPhoto);
      await api.addDiretoria({ name: dirName, director_name: dirDirector, photo_url: res.url });
      const updated = await api.getDiretorias();
      setDiretorias(updated);
      setDirName('');
      setDirDirector('');
      setDirPhoto(null);
      toast.success('Diretoria adicionada com sucesso');
    } catch (err) {
      toast.error('Erro ao adicionar diretoria');
    } finally {
      setIsAddingDiretoria(false);
    }
  };

  const handleDeleteDiretoria = async (id: number) => {
    try {
      await api.deleteDiretoria(id);
      setDiretorias(prev => prev.filter(d => d.id !== id));
      toast.success('Diretoria removida');
    } catch (err) {
      toast.error('Erro ao remover diretoria');
    }
  };

  const handleAddGaleria = async (e: FormEvent) => {
    e.preventDefault();
    if (!user || (user.role !== 'admin' && user.role !== 'editor')) return;
    if (!galPhoto) return toast.error('Selecione uma foto');
    setIsAddingGaleria(true);
    try {
      const res = await api.uploadFile(galPhoto);
      await api.addGaleria({ name: galName, period: galPeriod, photo_url: res.url });
      const updated = await api.getGaleria();
      setGaleria(updated);
      setGalName('');
      setGalPeriod('');
      setGalPhoto(null);
      toast.success('Presidente adicionado à galeria');
    } catch (err) {
      toast.error('Erro ao adicionar à galeria');
    } finally {
      setIsAddingGaleria(false);
    }
  };

  const handleDeleteGaleria = async (id: number) => {
    try {
      await api.deleteGaleria(id);
      setGaleria(prev => prev.filter(g => g.id !== id));
      toast.success('Removido da galeria');
    } catch (err) {
      toast.error('Erro ao remover da galeria');
    }
  };

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoginError('');
    try {
      const data = await api.login(loginEmail, loginPassword);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setUser(data.user);
      if (data.user.role === 'viewer') {
        setAdminTab('settings');
      } else {
        setAdminTab('publish');
      }
      setLoginEmail('');
      setLoginPassword('');
    } catch (error: any) {
      setLoginError(error.message);
    }
  };

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    setLoginError('');
    try {
      await api.register(loginEmail, loginPassword);
      setRegisterSuccess(true);
      setLoginEmail('');
      setLoginPassword('');
      setIsRegistering(false);
      setTimeout(() => setRegisterSuccess(false), 5000);
    } catch (error: any) {
      setLoginError(error.message);
    }
  };

  const handleLogout = async () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const handleApproveUser = async (id: number, role: 'admin' | 'editor' | 'viewer') => {
    try {
      await api.approveUser(id, role);
      setPendingUsers(prev => prev.filter(u => u.id !== id));
      toast.success('Usuário aprovado com sucesso!');
    } catch (error) {
      toast.error('Erro ao aprovar usuário');
    }
  };

  const handleRejectUser = async (id: number) => {
    try {
      await api.rejectUser(id);
      setPendingUsers(prev => prev.filter(u => u.id !== id));
      toast.success('Solicitação rejeitada.');
    } catch (error) {
      toast.error('Erro ao rejeitar usuário');
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'ITERAIMA - Instituto de Terras e Colonização de Roraima',
          text: 'Confira o portal do ITERAIMA!',
          url: window.location.href,
        });
      } catch (error) {
        if (error instanceof Error && error.name !== 'AbortError') {
          toast.error('Erro ao compartilhar');
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Link copiado para a área de transferência!');
      } catch (err) {
        toast.error('Erro ao copiar link');
      }
    }
  };

  const handlePublish = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setIsPublishing(true);
    setPublishError('');
    setPublishSuccess(false);
    
    if (!newContent || newContent === '<p><br></p>') {
      setPublishError('O conteúdo da notícia é obrigatório');
      setIsPublishing(false);
      return;
    }

    try {
      let imageUrl = newImageUrl;
      
      if (newImageFile) {
        const uploadRes = await api.uploadFile(newImageFile);
        imageUrl = uploadRes.url;
      }

      if (editingNewsId) {
        await api.updateNews(editingNewsId, {
          title: newTitle,
          content: newContent,
          category: newCategory,
          image_url: imageUrl
        });
        toast.success('Notícia atualizada com sucesso!');
      } else {
        await api.publishNews({
          title: newTitle,
          content: newContent,
          category: newCategory,
          image_url: imageUrl
        });
        toast.success('Notícia publicada com sucesso!');
      }
      
      setNewTitle('');
      setNewContent('');
      setNewImageUrl('');
      setNewImageFile(null);
      setEditingNewsId(null);
      setPublishSuccess(true);
      
      // Refresh news
      const news = await api.getNews();
      setNewsList(news);
      
      setTimeout(() => setPublishSuccess(false), 3000);
    } catch (error) {
      console.error('Erro ao processar notícia:', error);
      setPublishError(error instanceof Error ? error.message : 'Erro ao processar notícia. Verifique sua conexão.');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleEditNews = (news: News) => {
    setEditingNewsId(news.id);
    setNewTitle(news.title);
    setNewContent(news.content);
    setNewCategory(news.category);
    setNewImageUrl(news.image_url);
    setAdminTab('publish');
    scrollToTop();
  };

  const handleCancelEdit = () => {
    setEditingNewsId(null);
    setNewTitle('');
    setNewContent('');
    setNewCategory('REGULARIZAÇÃO');
    setNewImageUrl('');
    setNewImageFile(null);
  };

  const handleAddYearFolder = () => {
    const trimmed = newYearInput.trim();
    if (!trimmed) {
      toast.error('Por favor, informe o ano.');
      return;
    }
    if (!/^\d{4}$/.test(trimmed)) {
      toast.error('O ano deve conter exatamente 4 números.');
      return;
    }
    if (availableYears.includes(trimmed)) {
      toast.error('Esta pasta de ano já existe.');
      return;
    }
    const nextYears = [...availableYears, trimmed].sort((a, b) => b.localeCompare(a));
    setAvailableYears(nextYears);
    localStorage.setItem('iteraima_years', JSON.stringify(nextYears));
    setNewYearInput('');
    toast.success(`Pasta do ano ${trimmed} criada com sucesso em todas as seções do Portal!`);
  };

  const handleRemoveYearFolder = (yr: string) => {
    if (availableYears.length <= 1) {
      toast.error('O sistema precisa de pelo menos uma pasta de ano ativa.');
      return;
    }
    const confirmed = window.confirm(`Deseja realmente remover a pasta do ano ${yr}? Os documentos salvos com este ano continuarão no banco de dados, mas a pasta não aparecerá na navegação.`);
    if (!confirmed) return;

    const nextYears = availableYears.filter(y => y !== yr);
    setAvailableYears(nextYears);
    localStorage.setItem('iteraima_years', JSON.stringify(nextYears));
    toast.success(`Pasta do ano ${yr} removida.`);
  };

  const handleDeleteNews = async (id: any) => {
    try {
      await api.deleteNews(id);
      setNewsList(prev => prev.filter(n => n.id !== id));
      setDeletingId(null);
      toast.success('Notícia excluída com sucesso!');
    } catch (error) {
      toast.error('Erro ao excluir notícia');
    }
  };

  const handleUploadDocs = async () => {
    if (selectedFiles.length === 0 || !user) return;
    
    setIsUploadingDocs(true);
    
    try {
      for (const file of selectedFiles) {
        const uploadRes = await api.uploadFile(file);
        await api.uploadDocument({
          name: file.name,
          category: uploadCategory,
          year: uploadYear,
          month: ['ESTAGIÁRIOS', 'FOLHA DE PAGAMENTO', 'TERCEIRIZADOS'].includes(uploadCategory) ? uploadMonth : undefined,
          url: uploadRes.url
        });
      }
      
      // Refresh docs
      const docs = await api.getDocuments();
      setDocuments(docs);
      
      setIsUploadingDocs(false);
      setSelectedFiles([]);
      toast.success(`${selectedFiles.length} documentos enviados com sucesso!`);
    } catch (error) {
      setIsUploadingDocs(false);
      toast.error('Erro ao enviar documentos');
    }
  };

  const handleDeleteDocument = async (id: number) => {
    try {
      await api.deleteDocument(id);
      setDocuments(prev => prev.filter(doc => doc.id !== id));
      toast.success('Documento removido com sucesso!');
    } catch (error) {
      toast.error('Erro ao remover documento');
    }
  };

  const handleChangePassword = async (e: FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordChangeError('As senhas não coincidem');
      return;
    }
    
    setIsChangingPassword(true);
    setPasswordChangeError('');
    setPasswordChangeSuccess(false);
    
    try {
      await api.changePassword(currentPassword, newPassword);
      setPasswordChangeSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordChangeSuccess(false), 3000);
    } catch (error: any) {
      setPasswordChangeError(error.message);
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleUpdateCover = async (file: File) => {
    setIsUpdatingCover(true);
    try {
      const uploadRes = await api.uploadFile(file);
      await api.updateCoverPhoto(uploadRes.url);
      setCoverPhotoUrl(uploadRes.url);
      toast.success('Foto de capa atualizada!');
    } catch (error) {
      toast.error('Erro ao atualizar foto de capa');
    } finally {
      setIsUpdatingCover(false);
    }
  };

  const handleUpdateLogo = async (file: File) => {
    setIsUpdatingLogo(true);
    try {
      const uploadRes = await api.uploadFile(file);
      await api.updateLogo(uploadRes.url);
      setLogoUrl(uploadRes.url);
      toast.success('Logo atualizado!');
    } catch (error) {
      toast.error('Erro ao atualizar logo');
    } finally {
      setIsUpdatingLogo(false);
    }
  };

  const handleUpdateFavicon = async (file: File) => {
    setIsUpdatingFavicon(true);
    try {
      const uploadRes = await api.uploadFile(file);
      await api.updateFavicon(uploadRes.url);
      setFaviconUrl(uploadRes.url);
      toast.success('Favicon atualizado!');
    } catch (error) {
      toast.error('Erro ao atualizar favicon');
    } finally {
      setIsUpdatingFavicon(false);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getBasicYears = () => {
    return [...availableYears].sort((a, b) => b.localeCompare(a)).map(y => ({ label: y, icon: Calendar }));
  };

  const getMonthlyYears = () => {
    return [...availableYears].sort((a, b) => b.localeCompare(a)).map(y => ({ 
      label: y, 
      icon: Calendar,
      subItems: MONTHS.map(m => ({ label: m, icon: Clock }))
    }));
  };

  const transparenciaItems = [
    { 
      label: 'ACORDO DE COOPERAÇÃO TÉCNICA', 
      icon: Handshake,
      subItems: getBasicYears()
    },
    { 
      label: 'FINANCEIRA', 
      icon: CircleDollarSign,
      subItems: [
        { 
          label: 'BALANÇO FINANCEIRO', 
          icon: FileText,
          subItems: getBasicYears()
        },
        { 
          label: 'CONTRATAÇÃO DIRETA', 
          icon: Handshake,
          subItems: getBasicYears()
        },
        { 
          label: 'CONTRATOS E ADITIVOS', 
          icon: FileSignature,
          subItems: getBasicYears()
        },
        { 
          label: 'COSLIC', 
          icon: ClipboardList,
          subItems: [
            { 
              label: 'AVISO', 
              icon: FileText,
              subItems: getBasicYears()
            },
            { 
              label: 'COMUNICADO', 
              icon: FileText,
              subItems: getBasicYears()
            },
            { 
              label: 'DISPENSA', 
              icon: FileText,
              subItems: getBasicYears()
            },
            { 
              label: 'EDITAIS', 
              icon: FileText,
              subItems: getBasicYears()
            },
            { 
              label: 'INEXIGIBILIDADE', 
              icon: FileText,
              subItems: getBasicYears()
            },
            { 
              label: 'RESULTADO', 
              icon: FileText,
              subItems: getBasicYears()
            },
            { 
              label: 'SÍNTESE', 
              icon: FileText,
              subItems: getBasicYears()
            },
            { 
              label: 'ATA DE REGISTRO DE PREÇOS', 
              icon: FileText,
              subItems: getBasicYears()
            }
          ]
        },
        { 
          label: 'PLANO DE CONTRATAÇÃO ANUAL – PCA', 
          icon: Calendar,
          subItems: getBasicYears()
        }
      ]
    },
    { 
      label: 'FUNDIÁRIA', 
      icon: Map,
      subItems: [
        { 
          label: 'IMÓVEIS', 
          icon: Home,
          subItems: getBasicYears()
        },
        { 
          label: 'REGULARIZADOS', 
          icon: FileSignature,
          subItems: getBasicYears()
        },
        { 
          label: 'NOTIFICAÇÕES', 
          icon: Rss,
          subItems: getBasicYears()
        },
        { 
          label: 'REQUERIMENTO DE REGULARIZAÇÃO', 
          icon: ClipboardList,
          subItems: getBasicYears()
        }
      ]
    },
    { 
      label: 'DE PESSOAS', 
      icon: Users,
      subItems: [
        { 
          label: 'CONCURSOS E SELEÇÕES', 
          icon: UsersRound,
          subItems: getBasicYears()
        },
        { 
          label: 'DIÁRIAS', 
          icon: CircleDollarSign,
          subItems: getBasicYears()
        },
        { 
          label: 'ESTAGIÁRIOS', 
          icon: UserRound,
          subItems: getMonthlyYears()
        },
        { 
          label: 'FOLHA DE PAGAMENTO', 
          icon: FileText,
          subItems: getMonthlyYears()
        },
        { 
          label: 'TERCEIRIZADOS', 
          icon: Handshake,
          subItems: getMonthlyYears()
        }
      ]
    }
  ];

  const governoLinks = [
    { label: 'PORTAL DA TRANSPARÊNCIA', icon: Eye, url: 'https://www.transparencia.rr.gov.br/' },
    { label: 'OUVIDORIA GERAL', icon: HelpCircle, url: 'https://ouvidoria.rr.gov.br/' },
    { label: 'DIÁRIO OFICIAL', icon: Newspaper, url: 'https://www.imprensaoficial.rr.gov.br/app/_inicial/' },
    { label: 'FALA.BR', icon: FileText, url: 'https://falabr.cgu.gov.br/web/home' }
  ];

  const institucionalItems = [
    { label: 'PRESIDÊNCIA', icon: UserRound },
    { label: 'DIRETORIAS', icon: UsersRound },
    { label: 'GALERIA DE PRESIDENTES', icon: Image }
  ];

  const legislacaoItems = [
    { 
      label: 'ADMINISTRATIVA', 
      icon: Scale,
      subItems: getBasicYears()
    },
    { 
      label: 'FUNDIÁRIA', 
      icon: FileText,
      subItems: [
        { 
          label: 'RURAL', 
          icon: ShieldCheck,
          subItems: getBasicYears()
        },
        { 
          label: 'URBANA', 
          icon: ShieldAlert,
          subItems: getBasicYears()
        }
      ]
    },
    { 
      label: 'MODELOS DE REQUERIMENTOS', 
      icon: FileSignature,
      subItems: getBasicYears()
    }
  ];

  return (
    <div className="min-h-screen bg-background text-on-surface font-body pb-24">
        {/* Painel de Acessibilidade */}
        <AccessibilityPanel onPageChange={setCurrentPage} />

        {/* Sidebar / Drawer */}
        <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
            />
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 h-full w-[280px] bg-white z-[70] shadow-2xl p-6 flex flex-col"
            >
              <div className="flex items-center justify-between mb-8">
                <img 
                  src={logoUrl} 
                  alt="ITERAIMA Logo" 
                  className="h-8 w-auto object-contain"
                  referrerPolicy="no-referrer"
                />
                <button onClick={() => setIsSidebarOpen(false)} className="p-2 rounded-full hover:bg-primary/5">
                  <X className="text-primary w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6 overflow-y-auto flex-1">
                <div>
                  <div className="flex items-center gap-3 text-primary font-bold text-sm mb-4 px-2">
                    <Eye className="w-5 h-5" />
                    TRANSPARÊNCIA
                  </div>
                  <div className="grid gap-2 pl-4 border-l-2 border-primary/10 ml-4">
                    {transparenciaItems.map((item) => (
                      <div key={item.label}>
                        <button 
                          onClick={() => {
                            if (item.subItems) {
                              if (item.subItems.some(i => i.label === '2022')) {
                                setSelectedFolder({ label: item.label, items: item.subItems });
                                setCurrentPage('folder');
                                setIsSidebarOpen(false);
                                return;
                              }
                              const isOpening = openLevel2Menu !== item.label;
                              setOpenLevel2Menu(isOpening ? item.label : null);
                              if (!isOpening) {
                                setOpenLevel3Menu(null);
                                setOpenLevel4Menu(null);
                              }
                            }
                          }}
                          className="flex items-center justify-between w-full p-3 rounded-xl hover:bg-primary/5 text-primary text-xs font-bold transition-colors text-left"
                        >
                          <div className="flex items-center gap-3">
                            <item.icon className="w-4 h-4 opacity-60" />
                            {item.label}
                          </div>
                          {item.subItems && !item.subItems.some(i => i.label === '2022') && (
                            <ChevronRight className={`w-4 h-4 transition-transform ${openLevel2Menu === item.label ? 'rotate-90' : ''}`} />
                          )}
                        </button>
                        
                        {item.subItems && (
                          <AnimatePresence>
                            {openLevel2Menu === item.label && (
                              <motion.div 
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden grid gap-1 pl-6 border-l border-primary/10 ml-4 mt-1"
                              >
                                {item.subItems.map((sub) => (
                                  <div key={sub.label}>
                                    <button 
                                      onClick={() => {
                                        if (sub.subItems) {
                                          if (sub.subItems.some(i => i.label === '2022')) {
                                            setSelectedFolder({ label: sub.label, items: sub.subItems });
                                            setCurrentPage('folder');
                                            setIsSidebarOpen(false);
                                          } else {
                                            const isOpening = openLevel3Menu !== sub.label;
                                            setOpenLevel3Menu(isOpening ? sub.label : null);
                                            if (!isOpening) {
                                              setOpenLevel4Menu(null);
                                            }
                                          }
                                        }
                                      }}
                                      className="flex items-center justify-between w-full p-2 rounded-lg hover:bg-primary/5 text-primary/70 text-[10px] font-bold transition-colors text-left"
                                    >
                                      <div className="flex items-center gap-3">
                                        <sub.icon className="w-3 h-3 opacity-60" />
                                        {sub.label}
                                      </div>
                                      {sub.subItems && (
                                        <ChevronRight className={`w-3 h-3 transition-transform ${openLevel3Menu === sub.label ? 'rotate-90' : ''}`} />
                                      )}
                                    </button>
                                    
                                    {sub.subItems && (
                                      <AnimatePresence>
                                        {openLevel3Menu === sub.label && (
                                          <motion.div 
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="overflow-hidden grid gap-1 pl-6 border-l border-primary/5 ml-2 mt-1"
                                          >
                                            {sub.subItems.map((subItem) => (
                                              <div key={subItem.label}>
                                                <button 
                                                  onClick={() => {
                                                    if (subItem.subItems) {
                                                      if (subItem.subItems.some(i => i.label === '2022')) {
                                                        setSelectedFolder({ label: subItem.label, items: subItem.subItems });
                                                        setCurrentPage('folder');
                                                        setIsSidebarOpen(false);
                                                      } else {
                                                        setOpenLevel4Menu(openLevel4Menu === subItem.label ? null : subItem.label);
                                                      }
                                                    }
                                                  }}
                                                  className="flex items-center justify-between w-full p-1.5 rounded-md hover:bg-primary/5 text-primary/60 text-[9px] font-bold transition-colors text-left"
                                                >
                                                  <div className="flex items-center gap-2">
                                                    <subItem.icon className="w-2.5 h-2.5 opacity-50" />
                                                    {subItem.label}
                                                  </div>
                                                  {subItem.subItems && (
                                                    <ChevronRight className={`w-2.5 h-2.5 transition-transform ${openLevel4Menu === subItem.label ? 'rotate-90' : ''}`} />
                                                  )}
                                                </button>

                                                {subItem.subItems && (
                                                  <AnimatePresence>
                                                    {openLevel4Menu === subItem.label && (
                                                      <motion.div 
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: 'auto', opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        className="overflow-hidden grid gap-1 pl-4 border-l border-primary/5 ml-2 mt-1"
                                                      >
                                                        {subItem.subItems.map((leaf) => (
                                                          <button 
                                                            key={leaf.label}
                                                            className="flex items-center gap-2 p-1 rounded-md hover:bg-primary/5 text-primary/50 text-[8px] font-bold transition-colors text-left"
                                                          >
                                                            <leaf.icon className="w-2 h-2 opacity-40" />
                                                            {leaf.label}
                                                          </button>
                                                        ))}
                                                      </motion.div>
                                                    )}
                                                  </AnimatePresence>
                                                )}
                                              </div>
                                            ))}
                                          </motion.div>
                                        )}
                                      </AnimatePresence>
                                    )}
                                  </div>
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <a 
                  href="https://iteraimacidadao.rr.gov.br/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-secondary font-bold text-sm w-full p-2 rounded-xl hover:bg-primary/5 transition-colors"
                >
                  <Wallet className="w-5 h-5" />
                  ITERAIMA CIDADÃO
                </a>
                <div>
                  <div 
                    onClick={() => setShowInstitucionalSub(!showInstitucionalSub)}
                    className="flex items-center justify-between gap-3 text-secondary font-bold text-sm w-full p-2 rounded-xl hover:bg-primary/5 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <Landmark className="w-5 h-5" />
                      INSTITUCIONAL
                    </div>
                    <ChevronRight className={`w-4 h-4 transition-transform ${showInstitucionalSub ? 'rotate-90' : ''}`} />
                  </div>
                  <AnimatePresence>
                    {showInstitucionalSub && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden grid gap-2 pl-4 border-l-2 border-primary/10 ml-4 mt-2"
                      >
                        {institucionalItems.map((item) => (
                          <button 
                            key={item.label}
                            onClick={() => {
                              if (item.label === 'PRESIDÊNCIA') setCurrentPage('presidencia');
                              if (item.label === 'DIRETORIAS') setCurrentPage('diretorias');
                              if (item.label === 'GALERIA DE PRESIDENTES') setCurrentPage('galeria');
                              setIsSidebarOpen(false);
                            }}
                            className="flex items-center gap-3 p-3 rounded-xl hover:bg-primary/5 text-primary text-xs font-bold transition-colors text-left"
                          >
                            <item.icon className="w-4 h-4 opacity-60" />
                            {item.label}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <div>
                  <div 
                    onClick={() => setShowLegislacaoSub(!showLegislacaoSub)}
                    className="flex items-center justify-between gap-3 text-secondary font-bold text-sm w-full p-2 rounded-xl hover:bg-primary/5 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <Gavel className="w-5 h-5" />
                      LEGISLAÇÃO
                    </div>
                    <ChevronRight className={`w-4 h-4 transition-transform ${showLegislacaoSub ? 'rotate-90' : ''}`} />
                  </div>
                  <AnimatePresence>
                    {showLegislacaoSub && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden grid gap-2 pl-4 border-l-2 border-primary/10 ml-4 mt-2"
                      >
                        {legislacaoItems.map((item) => (
                          <div key={item.label}>
                            <button 
                              onClick={() => {
                                if (item.subItems) {
                                  if (item.subItems.some(i => i.label === '2022')) {
                                    setSelectedFolder({ label: item.label, items: item.subItems });
                                    setCurrentPage('folder');
                                    setIsSidebarOpen(false);
                                  } else {
                                    const isOpening = openLevel2Menu !== item.label;
                                    setOpenLevel2Menu(isOpening ? item.label : null);
                                    if (!isOpening) {
                                      setOpenLevel3Menu(null);
                                      setOpenLevel4Menu(null);
                                    }
                                  }
                                }
                              }}
                              className="flex items-center justify-between w-full p-3 rounded-xl hover:bg-primary/5 text-primary text-xs font-bold transition-colors text-left"
                            >
                              <div className="flex items-center gap-3">
                                <item.icon className="w-4 h-4 opacity-60" />
                                {item.label}
                              </div>
                              {item.subItems && !item.subItems.some(i => i.label === '2022') && (
                                <ChevronRight className={`w-4 h-4 transition-transform ${openLevel2Menu === item.label ? 'rotate-90' : ''}`} />
                              )}
                            </button>

                            {item.subItems && !item.subItems.some(i => i.label === '2022') && (
                              <AnimatePresence>
                                {openLevel2Menu === item.label && (
                                  <motion.div 
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden grid gap-1 pl-6 border-l border-primary/10 ml-4 mt-1"
                                  >
                                    {item.subItems.map((sub) => (
                                      <button 
                                        key={sub.label}
                                        onClick={() => {
                                          if (sub.subItems) {
                                            setSelectedFolder({ label: sub.label, items: sub.subItems });
                                            setCurrentPage('folder');
                                            setIsSidebarOpen(false);
                                          }
                                        }}
                                        className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-primary/5 text-primary/70 text-[10px] font-bold transition-colors text-left"
                                      >
                                        <sub.icon className="w-3 h-3 opacity-60" />
                                        {sub.label}
                                      </button>
                                    ))}
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            )}
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <button 
                  onClick={() => {
                    setCurrentPage('news');
                    setIsSidebarOpen(false);
                  }}
                  className={`flex items-center gap-3 font-bold text-sm w-full p-2 rounded-xl transition-colors ${currentPage === 'news' ? 'bg-primary text-white' : 'text-secondary hover:bg-primary/5'}`}
                >
                  <Rss className="w-5 h-5" />
                  NOTÍCIAS
                </button>

                {user && (
                  <button 
                    onClick={() => {
                      setCurrentPage('admin');
                      setIsSidebarOpen(false);
                    }}
                    className={`flex items-center gap-3 font-bold text-sm w-full p-2 rounded-xl transition-colors ${currentPage === 'admin' ? 'bg-primary text-white' : 'text-secondary hover:bg-primary/5'}`}
                  >
                    <Plus className="w-5 h-5" />
                    PUBLICAR NOTÍCIA
                  </button>
                )}
              </div>

                <div className="mt-auto pt-6 border-t border-primary/10">
                  <div className="text-[10px] font-bold text-secondary uppercase tracking-widest mb-4 px-2">Links Úteis</div>
                  <div className="grid gap-2">
                    {governoLinks.map((link) => (
                      <a 
                        key={link.label}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-2 rounded-xl hover:bg-primary/5 text-secondary text-[10px] font-bold transition-colors"
                      >
                        <link.icon className="w-3.5 h-3.5 opacity-60" />
                        {link.label}
                      </a>
                    ))}
                  </div>
                  <div className="flex items-center gap-3 text-secondary text-xs font-medium mt-6">
                    <Landmark className="w-4 h-4 opacity-40" />
                    Governo de Roraima
                  </div>
                </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* TopAppBar */}
      <header className="fixed top-0 md:top-[34px] w-full z-50 bg-background/80 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,34,2,0.06)] flex justify-between items-center px-6 h-16">
        <div 
          onClick={() => setIsSidebarOpen(true)}
          className="flex items-center gap-3 active:scale-95 duration-200 cursor-pointer"
        >
          <Menu className="text-primary w-6 h-6" />
          <img 
            src={logoUrl} 
            alt="ITERAIMA Logo" 
            className="h-10 w-auto object-contain"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="flex items-center gap-4">
          <button className="p-2 rounded-full hover:bg-primary/5 transition-colors">
            <Search className="text-primary w-6 h-6" />
          </button>
        </div>
      </header>

      <main className="pt-16 md:pt-[98px]">
        {currentPage === 'home' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Hero Section */}
            <section className="relative h-[480px] w-full flex items-end p-8 overflow-hidden">
              <div className="absolute inset-0 z-0">
                <a href={coverPhotoUrl} target="_blank" rel="noopener noreferrer" className="block w-full h-full group">
                  <img 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                    src={coverPhotoUrl} 
                    alt="Aerial view of Roraima rainforest"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/30 to-transparent"></div>
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity bg-white/20 backdrop-blur-md p-2 rounded-full">
                    <ExternalLink className="text-white w-4 h-4" />
                  </div>
                </a>
              </div>
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative z-10 max-w-xl"
              >
                <span className="inline-block px-3 py-1 bg-primary-container text-on-primary text-[10px] font-bold uppercase tracking-widest rounded-full mb-4">
                  Governo de Roraima
                </span>
                <h1 className="text-4xl font-extrabold text-white font-headline leading-tight tracking-tight mb-4">
                  Instituto de Terras e Colonização de Roraima
                </h1>
                <p className="text-white/80 text-sm leading-relaxed mb-6 max-w-md">
                  Trabalhando na regularização fundiária e no desenvolvimento sustentável do nosso estado, garantindo segurança jurídica ao produtor.
                </p>
                <button className="bg-surface-container-lowest text-primary px-8 py-3 rounded-full font-bold text-sm shadow-xl active:scale-95 transition-all hover:bg-surface-bright">
                  Consultar Processo
                </button>
              </motion.div>
            </section>

            {/* Service Grid */}
            <section className="px-6 -mt-12 relative z-20">
              <div className="grid grid-cols-2 gap-4">
                {/* Transparência */}
                <div className="relative">
                  <motion.div 
                    whileHover={{ y: -4 }}
                    onClick={() => setShowTransparenciaSub(!showTransparenciaSub)}
                    className={`bg-surface-container-lowest p-6 rounded-3xl shadow-[0_8px_32px_rgba(0,34,2,0.06)] flex flex-col items-center justify-center text-center gap-3 cursor-pointer transition-all duration-300 ${showTransparenciaSub ? 'ring-2 ring-primary' : ''}`}
                  >
                    <div className="w-14 h-14 bg-surface-container-high rounded-full flex items-center justify-center text-primary">
                      {showTransparenciaSub ? <X className="w-8 h-8" /> : <Eye className="w-8 h-8" />}
                    </div>
                    <span className="font-headline font-bold text-primary text-sm">Transparência</span>
                  </motion.div>

                  <AnimatePresence>
                    {showTransparenciaSub && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.9, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 10 }}
                        className="absolute top-full left-0 w-full mt-2 bg-white rounded-3xl shadow-2xl p-4 z-30 grid gap-2"
                      >
                        {transparenciaItems.map((sub) => (
                          <div key={sub.label}>
                            <button 
                              onClick={() => {
                                if (sub.subItems) {
                                  if (sub.subItems.some(i => i.label === '2022')) {
                                    setSelectedFolder({ label: sub.label, items: sub.subItems });
                                    setCurrentPage('folder');
                                    setShowTransparenciaSub(false);
                                    scrollToTop();
                                    return;
                                  }
                                  const isOpening = openLevel2Menu !== sub.label;
                                  setOpenLevel2Menu(isOpening ? sub.label : null);
                                  if (!isOpening) {
                                    setOpenLevel3Menu(null);
                                    setOpenLevel4Menu(null);
                                  }
                                }
                              }}
                              className="flex items-center justify-between w-full p-3 rounded-2xl hover:bg-primary/5 text-primary text-xs font-bold transition-colors text-left"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                                  <sub.icon className="w-4 h-4" />
                                </div>
                                {sub.label}
                              </div>
                              {sub.subItems && !sub.subItems.some(i => i.label === '2022') && (
                                <ChevronRight className={`w-4 h-4 transition-transform ${openLevel2Menu === sub.label ? 'rotate-90' : ''}`} />
                              )}
                            </button>
                            
                            {sub.subItems && (
                              <AnimatePresence>
                                {openLevel2Menu === sub.label && (
                                  <motion.div 
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden grid gap-1 pl-12 border-l border-primary/10 ml-4 mt-1"
                                  >
                                    {sub.subItems.map((item) => (
                                      <div key={item.label}>
                                        <button 
                                          onClick={() => {
                                            if (item.subItems) {
                                              if (item.subItems.some(i => i.label === '2022')) {
                                                setSelectedFolder({ label: item.label, items: item.subItems });
                                                setCurrentPage('folder');
                                                setShowTransparenciaSub(false);
                                              } else {
                                                const isOpening = openLevel3Menu !== item.label;
                                                setOpenLevel3Menu(isOpening ? item.label : null);
                                                if (!isOpening) {
                                                  setOpenLevel4Menu(null);
                                                }
                                              }
                                            }
                                          }}
                                          className="flex items-center justify-between w-full p-2 rounded-lg hover:bg-primary/5 text-primary/70 text-[10px] font-bold transition-colors text-left"
                                        >
                                          <div className="flex items-center gap-3">
                                            <item.icon className="w-3 h-3 opacity-60" />
                                            {item.label}
                                          </div>
                                          {item.subItems && (
                                            <ChevronRight className={`w-3 h-3 transition-transform ${openLevel3Menu === item.label ? 'rotate-90' : ''}`} />
                                          )}
                                        </button>
                                        
                                        {item.subItems && (
                                          <AnimatePresence>
                                            {openLevel3Menu === item.label && (
                                              <motion.div 
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="overflow-hidden grid gap-1 pl-6 border-l border-primary/5 ml-2 mt-1"
                                              >
                                                {item.subItems.map((subItem) => (
                                                  <div key={subItem.label}>
                                                    <button 
                                                      onClick={() => {
                                                        if (subItem.subItems) {
                                                          if (subItem.subItems.some(i => i.label === '2022')) {
                                                            setSelectedFolder({ label: subItem.label, items: subItem.subItems });
                                                            setCurrentPage('folder');
                                                            setShowTransparenciaSub(false);
                                                          } else {
                                                            setOpenLevel4Menu(openLevel4Menu === subItem.label ? null : subItem.label);
                                                          }
                                                        }
                                                      }}
                                                      className="flex items-center justify-between w-full p-1.5 rounded-md hover:bg-primary/5 text-primary/60 text-[9px] font-bold transition-colors text-left"
                                                    >
                                                      <div className="flex items-center gap-2">
                                                        <subItem.icon className="w-2.5 h-2.5 opacity-50" />
                                                        {subItem.label}
                                                      </div>
                                                      {subItem.subItems && (
                                                        <ChevronRight className={`w-2.5 h-2.5 transition-transform ${openLevel4Menu === subItem.label ? 'rotate-90' : ''}`} />
                                                      )}
                                                    </button>

                                                    {subItem.subItems && (
                                                      <AnimatePresence>
                                                        {openLevel4Menu === subItem.label && (
                                                          <motion.div 
                                                            initial={{ height: 0, opacity: 0 }}
                                                            animate={{ height: 'auto', opacity: 1 }}
                                                            exit={{ height: 0, opacity: 0 }}
                                                            className="overflow-hidden grid gap-1 pl-4 border-l border-primary/5 ml-2 mt-1"
                                                          >
                                                            {subItem.subItems.map((leaf) => (
                                                              <button 
                                                                key={leaf.label}
                                                                className="flex items-center gap-2 p-1 rounded-md hover:bg-primary/5 text-primary/50 text-[8px] font-bold transition-colors text-left"
                                                              >
                                                                <leaf.icon className="w-2 h-2 opacity-40" />
                                                                {leaf.label}
                                                              </button>
                                                            ))}
                                                          </motion.div>
                                                        )}
                                                      </AnimatePresence>
                                                    )}
                                                  </div>
                                                ))}
                                              </motion.div>
                                            )}
                                          </AnimatePresence>
                                        )}
                                      </div>
                                    ))}
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            )}
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Iteraima Cidadão */}
                <a 
                  href="https://iteraimacidadao.rr.gov.br/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-primary p-6 rounded-3xl shadow-[0_8px_32px_rgba(0,34,2,0.06)] flex flex-col items-center justify-center text-center gap-3 cursor-pointer hover:bg-primary-container transition-all active:scale-95"
                >
                  <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center text-white">
                    <Wallet className="w-8 h-8" />
                  </div>
                  <span className="font-headline font-bold text-white text-sm">Iteraima Cidadão</span>
                </a>

                {/* Institucional */}
                <div className="col-span-2 relative">
                  <motion.div 
                    whileHover={{ x: 4 }}
                    onClick={() => setShowInstitucionalSub(!showInstitucionalSub)}
                    className={`bg-surface-container-low p-6 rounded-3xl flex items-center justify-between cursor-pointer transition-all duration-300 ${showInstitucionalSub ? 'ring-2 ring-primary' : ''}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-primary shadow-sm">
                        {showInstitucionalSub ? <X className="w-6 h-6" /> : <Landmark className="w-6 h-6" />}
                      </div>
                      <div className="text-left">
                        <span className="block font-headline font-bold text-primary text-sm">Institucional</span>
                        <span className="text-[10px] text-secondary font-medium uppercase tracking-wider">Conheça o ITERAIMA</span>
                      </div>
                    </div>
                    <ChevronRight className={`text-secondary w-5 h-5 transition-transform ${showInstitucionalSub ? 'rotate-90' : ''}`} />
                  </motion.div>

                  <AnimatePresence>
                    {showInstitucionalSub && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.9, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 10 }}
                        className="absolute top-full left-0 w-full mt-2 bg-white rounded-3xl shadow-2xl p-4 z-30 grid gap-2"
                      >
                        {institucionalItems.map((sub) => (
                          <button 
                            key={sub.label}
                            onClick={() => {
                              if (sub.label === 'PRESIDÊNCIA') setCurrentPage('presidencia');
                              if (sub.label === 'DIRETORIAS') setCurrentPage('diretorias');
                              if (sub.label === 'GALERIA DE PRESIDENTES') setCurrentPage('galeria');
                              setShowInstitucionalSub(false);
                              scrollToTop();
                            }}
                            className="flex items-center gap-3 p-3 rounded-2xl hover:bg-primary/5 text-primary text-xs font-bold transition-colors text-left"
                          >
                            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                              <sub.icon className="w-4 h-4" />
                            </div>
                            {sub.label}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Legislação */}
                <div className="relative">
                  <motion.div 
                    whileHover={{ y: -4 }}
                    onClick={() => setShowLegislacaoSub(!showLegislacaoSub)}
                    className={`bg-surface-container-lowest p-6 rounded-3xl shadow-[0_8px_32px_rgba(0,34,2,0.06)] flex flex-col items-center justify-center text-center gap-3 cursor-pointer transition-all duration-300 ${showLegislacaoSub ? 'ring-2 ring-primary' : ''}`}
                  >
                    <div className="w-14 h-14 bg-surface-container-high rounded-full flex items-center justify-center text-primary">
                      {showLegislacaoSub ? <X className="w-8 h-8" /> : <Gavel className="w-8 h-8" />}
                    </div>
                    <span className="font-headline font-bold text-primary text-sm">Legislação</span>
                  </motion.div>

                  <AnimatePresence>
                    {showLegislacaoSub && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.9, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 10 }}
                        className="absolute top-full left-0 w-full mt-2 bg-white rounded-3xl shadow-2xl p-4 z-30 grid gap-2"
                      >
                        {legislacaoItems.map((sub) => (
                          <div key={sub.label}>
                            <button 
                              onClick={() => {
                                if (sub.subItems) {
                                  if (sub.subItems.some(i => i.label === '2022')) {
                                    setSelectedFolder({ label: sub.label, items: sub.subItems });
                                    setCurrentPage('folder');
                                    setShowLegislacaoSub(false);
                                    scrollToTop();
                                  } else {
                                    const isOpening = openLevel2Menu !== sub.label;
                                    setOpenLevel2Menu(isOpening ? sub.label : null);
                                    if (!isOpening) {
                                      setOpenLevel3Menu(null);
                                      setOpenLevel4Menu(null);
                                    }
                                  }
                                }
                              }}
                              className="flex items-center justify-between w-full p-3 rounded-2xl hover:bg-primary/5 text-primary text-xs font-bold transition-colors text-left"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                                  <sub.icon className="w-4 h-4" />
                                </div>
                                {sub.label}
                              </div>
                              {sub.subItems && !sub.subItems.some(i => i.label === '2022') && (
                                <ChevronRight className={`w-4 h-4 transition-transform ${openLevel2Menu === sub.label ? 'rotate-90' : ''}`} />
                              )}
                            </button>

                            {sub.subItems && !sub.subItems.some(i => i.label === '2022') && (
                              <AnimatePresence>
                                {openLevel2Menu === sub.label && (
                                  <motion.div 
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden grid gap-1 pl-12 border-l border-primary/10 ml-4 mt-1"
                                  >
                                    {sub.subItems.map((item) => (
                                      <button 
                                        key={item.label}
                                        onClick={() => {
                                          if (item.subItems) {
                                            setSelectedFolder({ label: item.label, items: item.subItems });
                                            setCurrentPage('folder');
                                            setShowLegislacaoSub(false);
                                            scrollToTop();
                                          }
                                        }}
                                        className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-primary/5 text-primary/70 text-[10px] font-bold transition-colors text-left"
                                      >
                                        <item.icon className="w-3 h-3 opacity-60" />
                                        {item.label}
                                      </button>
                                    ))}
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            )}
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Notícias */}
                <motion.div 
                  whileHover={{ y: -4 }}
                  onClick={() => setCurrentPage('news')}
                  className="bg-surface-container-lowest p-6 rounded-3xl shadow-[0_8px_32px_rgba(0,34,2,0.06)] flex flex-col items-center justify-center text-center gap-3 cursor-pointer"
                >
                  <div className="w-14 h-14 bg-surface-container-high rounded-full flex items-center justify-center text-primary">
                    <Rss className="w-8 h-8" />
                  </div>
                  <span className="font-headline font-bold text-primary text-sm">Notícias</span>
                </motion.div>
              </div>
            </section>

            {/* News Section (Destaques) */}
            <section className="mt-12 px-6">
              <div className="flex items-end justify-between mb-8">
                <div>
                  <span className="text-primary font-bold text-xs uppercase tracking-[0.2em]">Fique por dentro</span>
                  <h2 className="text-3xl font-black text-on-surface font-headline leading-none mt-1">Destaques</h2>
                </div>
                <button 
                  onClick={() => setCurrentPage('news')}
                  className="text-primary font-bold text-sm border-b-2 border-primary/20 pb-1"
                >
                  Ver todas
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {isLoading ? (
                  <div className="flex justify-center py-12 col-span-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : newsList.length > 0 ? (
                  newsList.slice(0, 2).map((news) => (
                    <article 
                      key={news.id} 
                      onClick={() => {
                        setSelectedNews(news);
                        setCurrentPage('news-detail');
                        scrollToTop();
                      }}
                      className="group cursor-pointer bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all border border-primary/5"
                    >
                      <div className="relative aspect-[16/10] overflow-hidden">
                        <img 
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                          src={news.image_url || IMAGES.news1} 
                          alt={news.title}
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute top-4 left-4">
                          <span className="px-3 py-1 bg-white/90 glass text-primary text-[10px] font-bold rounded-full uppercase tracking-widest">{news.category}</span>
                        </div>
                      </div>
                      <div className="p-6 space-y-3">
                        <div className="flex items-center gap-2 text-[10px] text-secondary font-bold uppercase tracking-widest">
                          <Calendar className="w-3 h-3" />
                          <span>{new Date(news.created_at!).toLocaleDateString('pt-BR')}</span>
                        </div>
                        <h3 className="text-xl font-black text-on-surface font-headline leading-tight group-hover:text-primary transition-colors line-clamp-2">
                          {news.title}
                        </h3>
                        <p className="text-sm text-secondary leading-relaxed line-clamp-2">
                          {stripHtml(news.content)}
                        </p>
                      </div>
                    </article>
                  ))
                ) : (
                  <p className="text-center text-secondary py-8 col-span-full">Nenhuma notícia em destaque.</p>
                )}
              </div>
            </section>

          </motion.div>
        )}

        {currentPage === 'news' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="px-6 py-8"
          >
            <div className="mb-8">
              <span className="text-primary font-bold text-xs uppercase tracking-[0.2em]">Feed de Notícias</span>
              <h2 className="text-3xl font-black text-on-surface font-headline leading-none mt-1">Notícias</h2>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="grid gap-8">
                {newsList.map((news) => (
                  <article 
                    key={news.id} 
                    onClick={() => {
                      setSelectedNews(news);
                      setCurrentPage('news-detail');
                      scrollToTop();
                    }}
                    className="bg-white rounded-3xl overflow-hidden shadow-sm border border-primary/5 group cursor-pointer"
                  >
                    <div className="relative aspect-[16/9]">
                      <img 
                        src={news.image_url || IMAGES.news1} 
                        alt={news.title}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute top-4 left-4">
                        <span className="px-3 py-1 bg-primary text-white text-[10px] font-bold rounded-full uppercase">
                          {news.category}
                        </span>
                      </div>
                    </div>
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2 text-[10px] text-secondary font-medium uppercase tracking-wider">
                          <Calendar className="w-3 h-3" />
                          <span>
                            {new Date(news.created_at).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                        {user && (user.role === 'admin' || user.role === 'editor') && (
                          <div className="flex items-center gap-2">
                            {deletingId === news.id ? (
                              <div className="flex items-center gap-1">
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteNews(news.id);
                                  }}
                                  className="px-3 py-1 bg-red-500 text-white text-[10px] font-bold rounded-lg hover:bg-red-600 transition-colors"
                                >
                                  CONFIRMAR
                                </button>
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDeletingId(null);
                                  }}
                                  className="px-3 py-1 bg-gray-200 text-gray-600 text-[10px] font-bold rounded-lg hover:bg-gray-300 transition-colors"
                                >
                                  CANCELAR
                                </button>
                              </div>
                            ) : (
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeletingId(news.id);
                                }}
                                className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                                title="Excluir notícia"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                      <h3 className="text-xl font-bold text-on-surface font-headline mb-3 group-hover:text-primary transition-colors">
                        {news.title}
                      </h3>
                      <div 
                        className="text-sm text-on-surface-variant leading-relaxed line-clamp-3 quill-content"
                        dangerouslySetInnerHTML={{ __html: news.content }}
                      />
                    </div>
                  </article>
                ))}
                {newsList.length === 0 && (
                  <div className="text-center py-20 text-secondary">
                    <Newspaper className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p>Nenhuma notícia publicada ainda.</p>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}

        {currentPage === 'news-detail' && selectedNews && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="px-6 py-8"
          >
            <button 
              onClick={() => setCurrentPage('home')}
              className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest mb-8 hover:bg-primary/5 px-4 py-2 rounded-xl transition-all w-fit"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar para Início
            </button>

            <article className="bg-white rounded-[40px] overflow-hidden shadow-2xl shadow-primary/5 border border-primary/5">
              <div className="relative aspect-[16/9] md:aspect-[21/9]">
                <img 
                  src={selectedNews.image_url || IMAGES.news1} 
                  alt={selectedNews.title}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-6 left-6">
                  <span className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-full uppercase tracking-wider shadow-lg">
                    {selectedNews.category}
                  </span>
                </div>
              </div>
              
              <div className="p-8 md:p-12 font-main">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-6 border-b border-primary/10">
                  <div className="flex items-center gap-3 text-secondary font-medium uppercase tracking-widest text-[10px]">
                    <Calendar className="w-4 h-4 text-primary" />
                    <span>{new Date(selectedNews.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                  </div>

                  <button
                    id="listen-news-btn"
                    onClick={() => {
                      if ('speechSynthesis' in window) {
                        window.speechSynthesis.cancel();
                        const cleanContent = stripHtml(selectedNews.content);
                        const utterance = new SpeechSynthesisUtterance(
                          `${selectedNews.title}. Categoria: ${selectedNews.category}. Conteúdo da notícia: ${cleanContent}`
                        );
                        utterance.lang = 'pt-BR';
                        const voices = window.speechSynthesis.getVoices();
                        const ptVoice = voices.find(v => v.lang.includes('pt-BR') || v.lang.includes('pt_BR'));
                        if (ptVoice) utterance.voice = ptVoice;
                        window.speechSynthesis.speak(utterance);
                        toast.success('Iniciando leitura por áudio da notícia completa.', { id: 'news-audio' });
                      } else {
                        toast.error('Navegador não suporta síntese de voz.');
                      }
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary/15 text-primary rounded-xl font-bold text-xs uppercase tracking-wider transition-all"
                    title="Ouvir esta notícia completa em áudio"
                  >
                    <Volume2 className="w-4 h-4" />
                    Ouvir Notícia
                  </button>
                </div>
                
                <h1 className="text-3xl md:text-5xl font-black text-on-surface font-headline leading-tight mb-8">
                  {selectedNews.title}
                </h1>
                
                <div 
                  className="prose prose-primary max-w-none text-lg text-on-surface-variant leading-relaxed quill-content"
                  dangerouslySetInnerHTML={{ __html: selectedNews.content }}
                />
              </div>
            </article>
          </motion.div>
        )}

        {currentPage === 'folder' && selectedFolder && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="px-6 py-8 min-h-[60vh]"
          >
            <div className="flex items-center gap-4 mb-8">
              <button 
                onClick={() => {
                  if (selectedMonth) {
                    setSelectedMonth(null);
                  } else if (selectedYear) {
                    setSelectedYear(null);
                  } else {
                    setCurrentPage('home');
                    setSelectedFolder(null);
                  }
                }}
                className="p-3 rounded-2xl bg-primary/10 text-primary hover:bg-primary/20 transition-all active:scale-90"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div>
                <span className="text-primary font-bold text-xs uppercase tracking-[0.2em]">
                  {legislacaoItems.some(i => i.label === selectedFolder.label || (i.subItems && i.subItems.some(s => s.label === selectedFolder.label))) ? 'Legislação' : 'Transparência'}
                </span>
                <h2 className="text-3xl font-black text-on-surface font-headline leading-none mt-1">{selectedFolder.label}</h2>
              </div>
            </div>

            {!selectedYear ? (
              <div className="grid grid-cols-2 gap-4">
                {selectedFolder.items.map((item) => (
                  <motion.div
                    key={item.label}
                    onClick={() => setSelectedYear(item.label)}
                    whileHover={{ y: -4 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-white p-8 rounded-[2.5rem] shadow-[0_8px_32px_rgba(0,34,2,0.06)] border border-primary/5 flex flex-col items-center justify-center text-center gap-4 cursor-pointer group hover:border-primary/20 transition-all"
                  >
                    <div className="w-16 h-16 bg-primary/5 rounded-3xl flex items-center justify-center text-primary group-hover:bg-primary/10 transition-colors">
                      <Folder className="w-8 h-8" />
                    </div>
                    <span className="font-headline font-bold text-primary text-sm uppercase tracking-wider">{item.label}</span>
                  </motion.div>
                ))}
              </div>
            ) : (selectedFolder.items.find(i => i.label === selectedYear)?.subItems && !selectedMonth) ? (
              <div className="grid grid-cols-2 gap-4">
                {selectedFolder.items.find(i => i.label === selectedYear)?.subItems?.map((month: any) => (
                  <motion.div
                    key={month.label}
                    onClick={() => setSelectedMonth(month.label)}
                    whileHover={{ y: -4 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-white p-6 rounded-[2rem] shadow-[0_8px_32px_rgba(0,34,2,0.06)] border border-primary/5 flex flex-col items-center justify-center text-center gap-3 cursor-pointer group hover:border-primary/20 transition-all"
                  >
                    <div className="w-12 h-12 bg-primary/5 rounded-2xl flex items-center justify-center text-primary group-hover:bg-primary/10 transition-colors">
                      <Clock className="w-6 h-6" />
                    </div>
                    <span className="font-headline font-bold text-primary text-xs uppercase tracking-wider">{month.label}</span>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex gap-2">
                    <span className="bg-primary/10 text-primary px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
                      Ano: {selectedYear}
                    </span>
                    {selectedMonth && (
                      <span className="bg-primary/10 text-primary px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
                        Mês: {selectedMonth}
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid gap-3">
                  {documents
                    .filter(doc => 
                      doc.category === selectedFolder.label && 
                      doc.year === selectedYear &&
                      (!selectedMonth || doc.month === selectedMonth)
                    )
                    .map(doc => (
                      <div key={doc.id} className="bg-white p-4 rounded-2xl border border-primary/5 flex items-center justify-between group hover:border-primary/20 transition-all shadow-sm">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-primary/5 rounded-xl flex items-center justify-center text-primary">
                            <File className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="block text-sm font-bold text-primary break-words">{doc.name}</span>
                            <span className="text-[10px] text-secondary font-medium uppercase tracking-wider">
                              PDF • {new Date(doc.upload_date).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <a 
                            href={doc.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="p-2 text-primary hover:bg-primary/5 rounded-full transition-all"
                          >
                            <Download className="w-5 h-5" />
                          </a>
                          {(user?.role === 'admin' || user?.role === 'editor') && (
                            <button 
                              onClick={() => handleDeleteDocument(doc.id)}
                              className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-all"
                              title="Excluir Documento"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  {documents.filter(doc => 
                    doc.category === selectedFolder.label && 
                    doc.year === selectedYear &&
                    (!selectedMonth || doc.month === selectedMonth)
                  ).length === 0 && (
                    <div className="text-center py-12 bg-surface-container-low rounded-3xl border border-dashed border-primary/20">
                      <File className="w-12 h-12 mx-auto mb-4 opacity-10 text-primary" />
                      <p className="text-xs text-secondary font-medium">Nenhum documento encontrado para este período.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="mt-12 p-6 bg-primary/5 rounded-3xl border border-primary/10">
              <div className="flex items-center gap-3 text-primary mb-2">
                <HelpCircle className="w-5 h-5" />
                <span className="font-bold text-sm uppercase tracking-wider">Informação</span>
              </div>
              <p className="text-xs text-secondary leading-relaxed">
                Selecione o ano desejado para acessar os documentos e relatórios correspondentes à categoria <strong>{selectedFolder.label}</strong>.
              </p>
            </div>
          </motion.div>
        )}

        {currentPage === 'admin' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="px-6 py-8"
          >
            {!isAuthReady ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
              </div>
            ) : !user ? (
              <div className="max-w-md mx-auto bg-white p-8 rounded-3xl shadow-xl border border-primary/5">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
                    {isRegistering ? <UserPlus className="w-8 h-8" /> : <LogIn className="w-8 h-8" />}
                  </div>
                  <h2 className="text-2xl font-black text-primary uppercase tracking-wider font-headline">
                    {isRegistering ? 'Criar Conta' : 'Acesso Restrito'}
                  </h2>
                  <p className="text-xs text-secondary mt-2">
                    {isRegistering 
                      ? 'Cadastre-se para solicitar acesso ao painel administrativo.' 
                      : 'Somente usuários autorizados podem publicar notícias.'}
                  </p>
                </div>

                <form onSubmit={isRegistering ? handleRegister : handleLogin} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-secondary uppercase tracking-widest mb-1.5 ml-1">E-mail</label>
                    <input 
                      type="email" 
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="w-full bg-surface-container-low border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary transition-all"
                      placeholder="seu@email.com"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-secondary uppercase tracking-widest mb-1.5 ml-1">Senha</label>
                    <input 
                      type="password" 
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full bg-surface-container-low border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary transition-all"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                  
                  {loginError && (
                    <p className="text-red-500 text-xs font-bold text-center">{loginError}</p>
                  )}
                  
                  {registerSuccess && (
                    <p className="text-green-600 text-xs font-bold text-center bg-green-50 p-3 rounded-xl border border-green-100">
                      Cadastro realizado! Aguarde a aprovação de um administrador.
                    </p>
                  )}

                  <button 
                    type="submit"
                    className="w-full bg-primary text-white font-bold py-4 rounded-2xl shadow-lg shadow-primary/20 active:scale-95 transition-all mt-4"
                  >
                    {isRegistering ? 'SOLICITAR ACESSO' : 'ENTRAR'}
                  </button>

                  <div className="text-center mt-6">
                    <button 
                      type="button"
                      onClick={() => {
                        setIsRegistering(!isRegistering);
                        setLoginError('');
                      }}
                      className="text-[10px] font-bold text-primary uppercase tracking-widest hover:underline"
                    >
                      {isRegistering ? 'JÁ TENHO CONTA (ENTRAR)' : 'NÃO TEM CONTA? CADASTRE-SE AGORA'}
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-3xl font-black text-on-surface font-headline leading-none">Painel Administrativo</h2>
                    <p className="text-xs text-secondary mt-2">Olá, {user?.email}</p>
                  </div>
                  <button 
                    onClick={handleLogout}
                    className="flex items-center gap-2 text-red-500 font-bold text-xs uppercase tracking-widest hover:bg-red-50 px-4 py-2 rounded-xl transition-all"
                  >
                    <LogOut className="w-4 h-4" />
                    Sair
                  </button>
                </div>

                {/* Admin Tabs */}
                {user && (
                  <div className="flex gap-2 mb-8 bg-white p-1.5 rounded-2xl shadow-sm border border-primary/5">
                    {(user.role === 'admin' || user.role === 'editor') && (
                      <button 
                        onClick={() => setAdminTab('publish')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-xs transition-all ${adminTab === 'publish' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-secondary hover:bg-primary/5'}`}
                      >
                        <Newspaper className="w-4 h-4" />
                        NOTÍCIAS
                      </button>
                    )}
                    {user.role === 'admin' && (
                      <button 
                        onClick={() => setAdminTab('users')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-xs transition-all ${adminTab === 'users' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-secondary hover:bg-primary/5'}`}
                      >
                        <UsersRound className="w-4 h-4" />
                        USUÁRIOS
                        {pendingUsers.length > 0 && (
                          <span className="bg-red-500 text-white text-[8px] px-1.5 py-0.5 rounded-full animate-pulse ml-1">
                            {pendingUsers.length}
                          </span>
                        )}
                      </button>
                    )}
                    {(user.role === 'admin' || user.role === 'editor') && (
                      <button 
                        onClick={() => setAdminTab('documents')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-xs transition-all ${adminTab === 'documents' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-secondary hover:bg-primary/5'}`}
                      >
                        <Folder className="w-4 h-4" />
                        DOCUMENTOS
                      </button>
                    )}
                    <button 
                      onClick={() => setAdminTab('settings')}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-xs transition-all ${adminTab === 'settings' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-secondary hover:bg-primary/5'}`}
                    >
                      <Settings className="w-4 h-4" />
                      CONFIGURAÇÕES
                    </button>
                  </div>
                )}

                {adminTab === 'publish' && (
                  <div className="space-y-8">
                    <form onSubmit={handlePublish} className="bg-white p-8 rounded-3xl shadow-xl border border-primary/5 space-y-6">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                            {editingNewsId ? <Settings className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                          </div>
                          <h3 className="text-lg font-black text-on-surface font-headline uppercase tracking-wider">
                            {editingNewsId ? 'Editar Notícia' : 'Nova Notícia'}
                          </h3>
                        </div>
                        {editingNewsId && (
                          <button 
                            type="button"
                            onClick={handleCancelEdit}
                            className="text-xs font-bold text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-all"
                          >
                            CANCELAR EDIÇÃO
                          </button>
                        )}
                      </div>
                      <div className="grid gap-6">
                        <div>
                          <label className="block text-[10px] font-bold text-secondary uppercase tracking-widest mb-1.5 ml-1">Título da Notícia</label>
                          <input 
                            type="text" 
                            value={newTitle}
                            onChange={(e) => setNewTitle(e.target.value)}
                            className="w-full bg-surface-container-low border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary transition-all"
                            placeholder="Ex: Novo mutirão de regularização..."
                            required
                          />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[10px] font-bold text-secondary uppercase tracking-widest mb-1.5 ml-1">Categoria</label>
                            <select 
                              value={newCategory}
                              onChange={(e) => setNewCategory(e.target.value)}
                              className="w-full bg-surface-container-low border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary transition-all"
                            >
                              <option value="REGULARIZAÇÃO">REGULARIZAÇÃO</option>
                              <option value="INSTITUCIONAL">INSTITUCIONAL</option>
                              <option value="PRODUTOR RURAL">PRODUTOR RURAL</option>
                              <option value="AVISO">AVISO</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-secondary uppercase tracking-widest mb-1.5 ml-1">Imagem da Notícia</label>
                            <div className="relative">
                              <input 
                                type="file" 
                                accept="image/*"
                                onChange={(e) => setNewImageFile(e.target.files ? e.target.files[0] : null)}
                                className="hidden"
                                id="news-image-upload"
                              />
                              <label 
                                htmlFor="news-image-upload"
                                className="w-full flex items-center justify-between bg-surface-container-low border-2 border-dashed border-primary/10 rounded-2xl px-4 py-3 text-sm cursor-pointer hover:bg-primary/5 transition-all"
                              >
                                <span className="text-secondary truncate">
                                  {newImageFile ? newImageFile.name : 'Selecionar imagem...'}
                                </span>
                                <Image className="w-4 h-4 text-primary" />
                              </label>
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-secondary uppercase tracking-widest mb-1.5 ml-1">Conteúdo</label>
                          <div className="bg-surface-container-low rounded-2xl overflow-hidden border-none">
                            <ReactQuill 
                              theme="snow"
                              value={newContent}
                              onChange={setNewContent}
                              modules={quillModules}
                              placeholder="Escreva o corpo da notícia aqui..."
                              className="news-editor"
                            />
                          </div>
                        </div>
                      </div>

                      <button 
                        type="submit"
                        disabled={isPublishing}
                        className={`w-full ${isPublishing ? 'bg-gray-400' : 'bg-primary'} text-white font-bold py-4 rounded-2xl shadow-lg shadow-primary/20 active:scale-95 transition-all flex items-center justify-center gap-2`}
                      >
                        {isPublishing ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            {editingNewsId ? 'ATUALIZANDO...' : 'PUBLICANDO...'}
                          </>
                        ) : (
                          <>
                            {editingNewsId ? <Settings className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                            {editingNewsId ? 'ATUALIZAR NOTÍCIA' : 'PUBLICAR AGORA'}
                          </>
                        )}
                      </button>

                      {publishSuccess && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-green-50 text-green-600 p-4 rounded-2xl text-center text-sm font-bold border border-green-100 mt-4"
                        >
                          Notícia {editingNewsId ? 'atualizada' : 'publicada'} com sucesso!
                        </motion.div>
                      )}

                      {publishError && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-red-50 text-red-600 p-4 rounded-2xl text-center text-sm font-bold border border-red-100 mt-4"
                        >
                          {publishError}
                        </motion.div>
                      )}
                    </form>

                    {/* News Management List */}
                    <div className="bg-white p-8 rounded-3xl shadow-xl border border-primary/5">
                      <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                          <Newspaper className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-black text-on-surface font-headline leading-none">Gerenciar Notícias</h3>
                          <p className="text-xs text-secondary mt-1">Edite ou remova notícias publicadas</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        {newsList.map((news) => (
                          <div key={news.id} className="bg-surface-container-low p-4 rounded-2xl flex items-center gap-4 border border-primary/5 group">
                            <img src={news.image_url} alt="" className="w-16 h-16 rounded-xl object-cover shadow-sm" referrerPolicy="no-referrer" />
                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-on-surface truncate">{news.title}</h4>
                              <p className="text-[10px] text-secondary uppercase tracking-widest mt-1">
                                {news.category} • {new Date(news.created_at!).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={() => handleEditNews(news)}
                                className="p-2 text-primary hover:bg-primary/10 rounded-xl transition-all"
                                title="Editar"
                              >
                                <Settings className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleDeleteNews(news.id)}
                                className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                title="Excluir"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                        {newsList.length === 0 && (
                          <p className="text-center text-secondary py-8 italic">Nenhuma notícia publicada.</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {adminTab === 'users' && user?.role === 'admin' && (
                  <div className="space-y-8">
                    {/* Pending Users */}
                    {pendingUsers.length > 0 && (
                      <div className="bg-white p-8 rounded-3xl shadow-xl border border-primary/5">
                        <div className="flex items-center gap-4 mb-8">
                          <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                            <UserPlus className="w-6 h-6" />
                          </div>
                          <div>
                            <h3 className="text-2xl font-black text-on-surface font-headline leading-none">Aprovações Pendentes</h3>
                            <p className="text-xs text-secondary mt-1">Usuários aguardando acesso ao sistema</p>
                          </div>
                        </div>
                        <div className="grid gap-4">
                          {pendingUsers.map((pendingUser) => (
                            <div key={pendingUser.id} className="bg-surface-container-low p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 border border-primary/5">
                              <div>
                                <p className="font-bold text-on-surface">{pendingUser.email}</p>
                                <p className="text-[10px] text-secondary uppercase tracking-widest mt-1">Solicitado em: {new Date(pendingUser.created_at!).toLocaleDateString()}</p>
                              </div>
                              <div className="flex flex-wrap items-center gap-2">
                                <button 
                                  onClick={() => handleApproveUser(pendingUser.id, 'viewer')}
                                  className="bg-white text-primary border border-primary/10 px-4 py-2 rounded-xl text-[10px] font-bold hover:bg-primary hover:text-white transition-all shadow-sm"
                                >
                                  APROVAR COMO LEITOR
                                </button>
                                <button 
                                  onClick={() => handleApproveUser(pendingUser.id, 'editor')}
                                  className="bg-white text-primary border border-primary/10 px-4 py-2 rounded-xl text-[10px] font-bold hover:bg-primary hover:text-white transition-all shadow-sm"
                                >
                                  APROVAR COMO EDITOR
                                </button>
                                <button 
                                  onClick={() => handleRejectUser(pendingUser.id)}
                                  className="bg-red-50 text-red-500 px-4 py-2 rounded-xl text-[10px] font-bold hover:bg-red-500 hover:text-white transition-all shadow-sm"
                                >
                                  REJEITAR
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* All Users List */}
                    <div className="bg-white p-8 rounded-3xl shadow-xl border border-primary/5">
                      <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                          <UsersRound className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-black text-on-surface font-headline leading-none">Todos os Usuários</h3>
                          <p className="text-xs text-secondary mt-1">Gerencie permissões e acessos existentes</p>
                        </div>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-primary/10">
                              <th className="pb-4 text-[10px] font-bold text-secondary uppercase tracking-widest">E-mail</th>
                              <th className="pb-4 text-[10px] font-bold text-secondary uppercase tracking-widest">Função</th>
                              <th className="pb-4 text-[10px] font-bold text-secondary uppercase tracking-widest">Data</th>
                              <th className="pb-4 text-[10px] font-bold text-secondary uppercase tracking-widest text-right">Ações</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-primary/5">
                            {allUsers.filter(u => u.role !== 'pending').map((u) => (
                              <tr key={u.id} className="group">
                                <td className="py-4 text-sm font-medium">{u.email}</td>
                                <td className="py-4">
                                  <span className={`text-[9px] font-bold px-2 py-1 rounded-full uppercase tracking-widest ${
                                    u.role === 'admin' ? 'bg-purple-100 text-purple-600' :
                                    u.role === 'editor' ? 'bg-blue-100 text-blue-600' :
                                    'bg-gray-100 text-gray-600'
                                  }`}>
                                    {u.role}
                                  </span>
                                </td>
                                <td className="py-4 text-xs text-secondary">{new Date(u.created_at!).toLocaleDateString()}</td>
                                <td className="py-4 text-right">
                                  {u.email !== user?.email && (
                                    <div className="flex items-center justify-end gap-2">
                                      <select 
                                        value={u.role}
                                        onChange={(e) => handleApproveUser(u.id, e.target.value as any)}
                                        className="bg-surface-container-low border-none rounded-lg px-2 py-1 text-[10px] font-bold focus:ring-1 focus:ring-primary"
                                      >
                                        <option value="admin">Admin</option>
                                        <option value="editor">Editor</option>
                                        <option value="viewer">Leitor</option>
                                      </select>
                                      <button 
                                        onClick={() => handleRejectUser(u.id)}
                                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                        title="Remover Usuário"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {adminTab === 'documents' && (
                  <div className="space-y-8">
                    <div className="bg-white p-8 rounded-3xl shadow-xl border border-primary/5 space-y-8">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                        <Upload className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-black text-on-surface font-headline leading-none">Upload de Documentos</h3>
                        <p className="text-xs text-secondary mt-1">Adicione arquivos ao Portal da Transparência</p>
                      </div>
                    </div>

                    <div className="grid gap-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold text-secondary uppercase tracking-widest mb-1.5 ml-1">Categoria</label>
                          <select 
                            value={uploadCategory}
                            onChange={(e) => setUploadCategory(e.target.value)}
                            className="w-full bg-surface-container-low border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary transition-all"
                          >
                            {transparencyCategories.map(cat => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                          </select>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] font-bold text-secondary uppercase tracking-widest mb-1.5 ml-1">Ano</label>
                            <select 
                              value={uploadYear}
                              onChange={(e) => setUploadYear(e.target.value)}
                              className="w-full bg-surface-container-low border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary transition-all"
                            >
                              {[...availableYears].sort((a, b) => b.localeCompare(a)).map(y => (
                                <option key={y} value={y}>{y}</option>
                              ))}
                            </select>
                          </div>
                          {['ESTAGIÁRIOS', 'FOLHA DE PAGAMENTO', 'TERCEIRIZADOS'].includes(uploadCategory) && (
                            <div>
                              <label className="block text-[10px] font-bold text-secondary uppercase tracking-widest mb-1.5 ml-1">Mês</label>
                              <select 
                                value={uploadMonth}
                                onChange={(e) => setUploadMonth(e.target.value)}
                                className="w-full bg-surface-container-low border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary transition-all"
                              >
                                {MONTHS.map(m => (
                                  <option key={m} value={m}>{m}</option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>
                      </div>

                      <div 
                        className="border-2 border-dashed border-primary/10 rounded-3xl p-12 text-center hover:border-primary/5 transition-all cursor-pointer"
                        onClick={() => document.getElementById('file-upload')?.click()}
                      >
                        <input 
                          id="file-upload"
                          type="file" 
                          multiple
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files) {
                              setSelectedFiles(Array.from(e.target.files));
                            }
                          }}
                        />
                        <div className="w-16 h-16 bg-primary/5 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
                          <FileText className="w-8 h-8" />
                        </div>
                        <p className="text-sm font-bold text-on-surface">Arraste arquivos ou clique para selecionar</p>
                        <p className="text-xs text-secondary mt-1">PDF, DOCX, XLSX (Máx. 10MB)</p>
                      </div>

                      {selectedFiles.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-[10px] font-bold text-secondary uppercase tracking-widest ml-1">Arquivos Selecionados ({selectedFiles.length})</p>
                          <div className="grid gap-2">
                            {selectedFiles.map((file, idx) => (
                              <div key={idx} className="bg-surface-container-low p-3 rounded-xl flex items-center justify-between text-xs font-medium">
                                <div className="flex items-center gap-2">
                                  <File className="w-4 h-4 text-primary opacity-60" />
                                  {file.name}
                                </div>
                                <button onClick={() => setSelectedFiles(prev => prev.filter((_, i) => i !== idx))} className="text-red-500 hover:bg-red-50 p-1 rounded-lg">
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <button 
                        onClick={handleUploadDocs}
                        disabled={isUploadingDocs || selectedFiles.length === 0}
                        className={`w-full ${isUploadingDocs || selectedFiles.length === 0 ? 'bg-gray-400' : 'bg-primary'} text-white font-bold py-4 rounded-2xl shadow-lg shadow-primary/20 active:scale-95 transition-all flex items-center justify-center gap-2`}
                      >
                        {isUploadingDocs ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ENVIANDO...
                          </>
                        ) : (
                          <>
                            <Plus className="w-5 h-5" />
                            ENVIAR DOCUMENTOS
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Gerenciamento de Pastas de Anos */}
                  <div className="bg-white p-8 rounded-3xl shadow-xl border border-primary/5 space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                        <Folder className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-black text-on-surface font-headline leading-none">Gerenciar Pastas de Anos</h3>
                        <p className="text-xs text-secondary mt-1">Adicione ou remova pastas de anos do Portal da Transparência e Legislação</p>
                      </div>
                    </div>

                    <div className="p-4 bg-primary/5 rounded-2xl flex items-start gap-4 border border-primary/10">
                      <span className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0 animate-pulse" />
                      <p className="text-xs text-secondary leading-relaxed">
                        Ao adicionar um ano aqui, uma nova pasta será <strong>criada automaticamente</strong> em todas as categorias do Portal da Transparência, Legislação Administrativa, Legislação Fundiária e Modelos de Requerimentos. A nova pasta de ano aparecerá tanto na navegação geral para os cidadãos quanto nas opções de upload de documentos para os gestores.
                      </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8 items-start">
                      {/* Formulário de Adição */}
                      <div className="space-y-4">
                        <div>
                          <label className="block text-[10px] font-bold text-secondary uppercase tracking-widest mb-1.5 ml-1">Criar Nova Pasta de Ano</label>
                          <div className="flex gap-2">
                            <input 
                              type="text"
                              maxLength={4}
                              placeholder="Digite o ano (Ex: 2027)"
                              value={newYearInput}
                              onChange={(e) => setNewYearInput(e.target.value.replace(/\D/g, ''))}
                              className="flex-1 bg-surface-container-low border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary transition-all font-bold placeholder:font-normal"
                            />
                            <button
                              onClick={handleAddYearFolder}
                              className="bg-primary hover:bg-primary/90 text-white font-bold px-5 py-3 rounded-2xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 duration-100 transition-all flex items-center gap-2 text-xs uppercase tracking-wider"
                            >
                              <Plus className="w-4 h-4" />
                              Criar Pasta
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Lista de Pastas Ativas */}
                      <div className="space-y-3">
                        <span className="block text-[10px] font-bold text-secondary uppercase tracking-widest ml-1">Pastas de Ano Ativas</span>
                        <div className="flex flex-wrap gap-2.5 max-h-48 overflow-y-auto p-1">
                          {[...availableYears].sort((a, b) => b.localeCompare(a)).map((yr) => (
                            <div 
                              key={yr} 
                              className="flex items-center gap-2 bg-surface-container-low border border-primary/5 px-4 py-2.5 rounded-xl hover:border-primary/15 transition-all text-sm font-bold text-on-surface group"
                            >
                              <Folder className="w-4 h-4 text-primary opacity-75" />
                              <span>{yr}</span>
                              <button 
                                onClick={() => handleRemoveYearFolder(yr)}
                                className="text-red-500 hover:bg-[#ffebec] p-1 rounded-md opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity ml-1"
                                title={`Remover pasta do ano ${yr}`}
                              >
                                <X className="w-3.5 h-3.5 text-red-600" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

                {adminTab === 'settings' && (
                  <div className="space-y-8">
                    {/* Change Password Section */}
                    <div className="bg-white p-8 rounded-3xl shadow-xl border border-primary/5">
                      <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                          <Lock className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-black text-on-surface font-headline leading-none">Alterar Senha</h3>
                          <p className="text-xs text-secondary mt-1">Mantenha sua conta segura atualizando sua senha</p>
                        </div>
                      </div>

                      <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                        <div>
                          <label className="block text-[10px] font-bold text-secondary uppercase tracking-widest mb-1.5 ml-1">Senha Atual</label>
                          <input 
                            type="password" 
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            className="w-full bg-surface-container-low border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary transition-all"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-secondary uppercase tracking-widest mb-1.5 ml-1">Nova Senha</label>
                          <input 
                            type="password" 
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full bg-surface-container-low border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary transition-all"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-secondary uppercase tracking-widest mb-1.5 ml-1">Confirmar Nova Senha</label>
                          <input 
                            type="password" 
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full bg-surface-container-low border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary transition-all"
                            required
                          />
                        </div>

                        {passwordChangeError && (
                          <p className="text-red-500 text-xs font-bold">{passwordChangeError}</p>
                        )}
                        {passwordChangeSuccess && (
                          <p className="text-green-600 text-xs font-bold">Senha alterada com sucesso!</p>
                        )}

                        <button 
                          type="submit"
                          disabled={isChangingPassword}
                          className={`w-full ${isChangingPassword ? 'bg-gray-400' : 'bg-primary'} text-white font-bold py-4 rounded-2xl shadow-lg shadow-primary/20 active:scale-95 transition-all flex items-center justify-center gap-2`}
                        >
                          {isChangingPassword ? 'ALTERANDO...' : 'ATUALIZAR SENHA'}
                        </button>
                      </form>
                    </div>

                    {/* Change Cover Photo Section (Admin & Editor) */}
                    {(user?.role === 'admin' || user?.role === 'editor') && (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="bg-white p-8 rounded-3xl shadow-xl border border-primary/5">
                          <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                              <Image className="w-6 h-6" />
                            </div>
                            <div>
                              <h3 className="text-2xl font-black text-on-surface font-headline leading-none">Foto de Capa</h3>
                              <p className="text-xs text-secondary mt-1">Altere a imagem principal da página inicial</p>
                            </div>
                          </div>

                          <div className="space-y-6">
                            <div className="aspect-video w-full rounded-3xl overflow-hidden border border-primary/10 bg-surface-container-low">
                              <img 
                                src={coverPhotoUrl} 
                                alt="Capa Atual" 
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                            </div>

                            <div className="flex items-center gap-4">
                              <input 
                                type="file" 
                                accept="image/*"
                                id="cover-upload"
                                className="hidden"
                                onChange={(e) => {
                                  if (e.target.files?.[0]) {
                                    handleUpdateCover(e.target.files[0]);
                                  }
                                }}
                              />
                              <button 
                                onClick={() => document.getElementById('cover-upload')?.click()}
                                disabled={isUpdatingCover}
                                className={`bg-primary text-white font-bold px-6 py-3 rounded-2xl shadow-lg shadow-primary/20 active:scale-95 transition-all flex items-center gap-2 text-xs uppercase tracking-widest ${isUpdatingCover ? 'opacity-50 cursor-not-allowed' : ''}`}
                              >
                                {isUpdatingCover ? (
                                  <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ATUALIZANDO...
                                  </>
                                ) : (
                                  <>
                                    <Upload className="w-4 h-4" />
                                    ALTERAR FOTO DE CAPA
                                  </>
                                )}
                              </button>
                            </div>
                            <p className="text-[10px] text-secondary font-medium uppercase tracking-widest">Recomendado: 1920x1080px</p>
                          </div>
                        </div>

                        <div className="space-y-8">
                          {/* Logo Upload */}
                          <div className="bg-white p-8 rounded-3xl shadow-xl border border-primary/5">
                            <div className="flex items-center gap-4 mb-6">
                              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                                <Image className="w-5 h-5" />
                              </div>
                              <div>
                                <h3 className="text-lg font-black text-on-surface font-headline leading-none">Logotipo</h3>
                                <p className="text-[10px] text-secondary mt-1">Logo principal do cabeçalho e rodapé</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-6">
                              <div className="w-20 h-20 bg-surface-container-low rounded-2xl flex items-center justify-center p-2 border border-primary/5">
                                <img src={logoUrl} alt="Logo" className="max-w-full max-h-full object-contain" referrerPolicy="no-referrer" />
                              </div>
                              <div className="flex-1 space-y-3">
                                <input 
                                  type="file" 
                                  accept="image/*"
                                  id="logo-upload"
                                  className="hidden"
                                  onChange={(e) => {
                                    if (e.target.files?.[0]) {
                                      handleUpdateLogo(e.target.files[0]);
                                    }
                                  }}
                                />
                                <button 
                                  onClick={() => document.getElementById('logo-upload')?.click()}
                                  disabled={isUpdatingLogo}
                                  className="w-full bg-primary/10 text-primary font-bold px-4 py-2.5 rounded-xl hover:bg-primary/20 transition-all text-[10px] uppercase tracking-widest flex items-center justify-center gap-2"
                                >
                                  {isUpdatingLogo ? 'ATUALIZANDO...' : 'ALTERAR LOGO'}
                                </button>
                                <p className="text-[9px] text-secondary font-medium uppercase tracking-widest">PNG transparente recomendado</p>
                              </div>
                            </div>
                          </div>

                          {/* Favicon Upload */}
                          <div className="bg-white p-8 rounded-3xl shadow-xl border border-primary/5">
                            <div className="flex items-center gap-4 mb-6">
                              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                                <Settings className="w-5 h-5" />
                              </div>
                              <div>
                                <h3 className="text-lg font-black text-on-surface font-headline leading-none">Favicon</h3>
                                <p className="text-[10px] text-secondary mt-1">Ícone que aparece na aba do navegador</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-6">
                              <div className="w-12 h-12 bg-surface-container-low rounded-xl flex items-center justify-center p-2 border border-primary/5">
                                <img src={faviconUrl} alt="Favicon" className="w-8 h-8 object-contain" referrerPolicy="no-referrer" />
                              </div>
                              <div className="flex-1 space-y-3">
                                <input 
                                  type="file" 
                                  accept="image/*"
                                  id="favicon-upload"
                                  className="hidden"
                                  onChange={(e) => {
                                    if (e.target.files?.[0]) {
                                      handleUpdateFavicon(e.target.files[0]);
                                    }
                                  }}
                                />
                                <button 
                                  onClick={() => document.getElementById('favicon-upload')?.click()}
                                  disabled={isUpdatingFavicon}
                                  className="w-full bg-primary/10 text-primary font-bold px-4 py-2.5 rounded-xl hover:bg-primary/20 transition-all text-[10px] uppercase tracking-widest flex items-center justify-center gap-2"
                                >
                                  {isUpdatingFavicon ? 'ATUALIZANDO...' : 'ALTERAR FAVICON'}
                                </button>
                                <p className="text-[9px] text-secondary font-medium uppercase tracking-widest">ICO ou PNG (32x32px)</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Institutional Management (Admin & Editor) */}
                    {(user?.role === 'admin' || user?.role === 'editor') && (
                      <div className="space-y-8">
                        {/* Presidencia Management */}
                        <div className="bg-white p-8 rounded-3xl shadow-xl border border-primary/5">
                          <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                              <UserRound className="w-6 h-6" />
                            </div>
                            <div>
                              <h3 className="text-2xl font-black text-on-surface font-headline leading-none">Gerenciar Presidência</h3>
                              <p className="text-xs text-secondary mt-1">Atualize o nome, foto e biografia do presidente atual</p>
                            </div>
                          </div>

                          <form onSubmit={handleUpdatePresidencia} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div>
                                <label className="block text-[10px] font-bold text-secondary uppercase tracking-widest mb-1.5 ml-1">Nome do Presidente</label>
                                <input 
                                  type="text" 
                                  value={presName}
                                  onChange={(e) => setPresName(e.target.value)}
                                  className="w-full bg-surface-container-low border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary transition-all"
                                  required
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-secondary uppercase tracking-widest mb-1.5 ml-1">Foto do Presidente</label>
                                <input 
                                  type="file" 
                                  accept="image/*"
                                  onChange={(e) => setPresPhoto(e.target.files?.[0] || null)}
                                  className="w-full bg-surface-container-low border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary transition-all"
                                />
                              </div>
                            </div>
                            
                            <div>
                              <label className="block text-[10px] font-bold text-secondary uppercase tracking-widest mb-1.5 ml-1">Biografia</label>
                              <div className="bg-surface-container-low rounded-2xl overflow-hidden border-none">
                                <ReactQuill 
                                  theme="snow"
                                  value={presBio}
                                  onChange={setPresBio}
                                  modules={quillModules}
                                  placeholder="Escreva a biografia do presidente..."
                                  className="news-editor"
                                />
                              </div>
                            </div>

                            <button 
                              type="submit"
                              disabled={isUpdatingPresidencia}
                              className={`w-full ${isUpdatingPresidencia ? 'bg-gray-400' : 'bg-primary'} text-white font-bold py-4 rounded-2xl shadow-lg shadow-primary/20 active:scale-95 transition-all flex items-center justify-center gap-2`}
                            >
                              {isUpdatingPresidencia ? 'ATUALIZANDO...' : 'SALVAR ALTERAÇÕES'}
                            </button>
                          </form>
                        </div>

                        {/* Diretorias Management */}
                        <div className="bg-white p-8 rounded-3xl shadow-xl border border-primary/5">
                          <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                              <UsersRound className="w-6 h-6" />
                            </div>
                            <div>
                              <h3 className="text-2xl font-black text-on-surface font-headline leading-none">Gerenciar Diretorias</h3>
                              <p className="text-xs text-secondary mt-1">Adicione ou remova diretorias e seus respectivos diretores</p>
                            </div>
                          </div>

                          <form onSubmit={handleAddDiretoria} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 bg-surface-container-low p-6 rounded-[2rem]">
                            <div>
                              <label className="block text-[10px] font-bold text-secondary uppercase tracking-widest mb-1.5 ml-1">Nome da Diretoria</label>
                              <input 
                                type="text" 
                                value={dirName}
                                onChange={(e) => setDirName(e.target.value)}
                                placeholder="Ex: Diretoria Fundiária"
                                className="w-full bg-white border-none rounded-xl px-4 py-2.5 text-xs focus:ring-2 focus:ring-primary transition-all"
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-secondary uppercase tracking-widest mb-1.5 ml-1">Nome do Diretor</label>
                              <input 
                                type="text" 
                                value={dirDirector}
                                onChange={(e) => setDirDirector(e.target.value)}
                                placeholder="Nome completo"
                                className="w-full bg-white border-none rounded-xl px-4 py-2.5 text-xs focus:ring-2 focus:ring-primary transition-all"
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-secondary uppercase tracking-widest mb-1.5 ml-1">Foto</label>
                              <div className="flex gap-2">
                                <input 
                                  type="file" 
                                  accept="image/*"
                                  onChange={(e) => setDirPhoto(e.target.files?.[0] || null)}
                                  className="flex-1 bg-white border-none rounded-xl px-4 py-2 text-[10px] focus:ring-2 focus:ring-primary transition-all"
                                />
                                <button 
                                  type="submit"
                                  disabled={isAddingDiretoria}
                                  className="bg-primary text-white p-2.5 rounded-xl shadow-lg shadow-primary/20 active:scale-95 transition-all"
                                >
                                  {isAddingDiretoria ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Plus className="w-5 h-5" />}
                                </button>
                              </div>
                            </div>
                          </form>

                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {diretorias.map((dir) => (
                              <div key={dir.id} className="flex items-center gap-4 p-4 bg-surface-container-low rounded-2xl border border-primary/5 group">
                                <img src={dir.photo_url} alt={dir.director_name} className="w-12 h-12 rounded-xl object-cover shadow-sm" referrerPolicy="no-referrer" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-black text-primary uppercase truncate">{dir.director_name}</p>
                                  <p className="text-[10px] font-bold text-secondary uppercase truncate">{dir.name}</p>
                                </div>
                                <button 
                                  onClick={() => handleDeleteDiretoria(dir.id)}
                                  className="p-2 text-red-500 hover:bg-red-50 rounded-xl opacity-0 group-hover:opacity-100 transition-all"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Galeria Management */}
                        <div className="bg-white p-8 rounded-3xl shadow-xl border border-primary/5">
                          <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                              <Image className="w-6 h-6" />
                            </div>
                            <div>
                              <h3 className="text-2xl font-black text-on-surface font-headline leading-none">Galeria de Presidentes</h3>
                              <p className="text-xs text-secondary mt-1">Adicione ex-presidentes à galeria histórica</p>
                            </div>
                          </div>

                          <form onSubmit={handleAddGaleria} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 bg-surface-container-low p-6 rounded-[2rem]">
                            <div>
                              <label className="block text-[10px] font-bold text-secondary uppercase tracking-widest mb-1.5 ml-1">Nome do Presidente</label>
                              <input 
                                type="text" 
                                value={galName}
                                onChange={(e) => setGalName(e.target.value)}
                                placeholder="Nome completo"
                                className="w-full bg-white border-none rounded-xl px-4 py-2.5 text-xs focus:ring-2 focus:ring-primary transition-all"
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-secondary uppercase tracking-widest mb-1.5 ml-1">Período</label>
                              <input 
                                type="text" 
                                value={galPeriod}
                                onChange={(e) => setGalPeriod(e.target.value)}
                                placeholder="Ex: 2019 - 2022"
                                className="w-full bg-white border-none rounded-xl px-4 py-2.5 text-xs focus:ring-2 focus:ring-primary transition-all"
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-secondary uppercase tracking-widest mb-1.5 ml-1">Foto</label>
                              <div className="flex gap-2">
                                <input 
                                  type="file" 
                                  accept="image/*"
                                  onChange={(e) => setGalPhoto(e.target.files?.[0] || null)}
                                  className="flex-1 bg-white border-none rounded-xl px-4 py-2 text-[10px] focus:ring-2 focus:ring-primary transition-all"
                                />
                                <button 
                                  type="submit"
                                  disabled={isAddingGaleria}
                                  className="bg-primary text-white p-2.5 rounded-xl shadow-lg shadow-primary/20 active:scale-95 transition-all"
                                >
                                  {isAddingGaleria ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Plus className="w-5 h-5" />}
                                </button>
                              </div>
                            </div>
                          </form>

                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {galeria.map((p) => (
                              <div key={p.id} className="flex items-center gap-4 p-4 bg-surface-container-low rounded-2xl border border-primary/5 group">
                                <img src={p.photo_url} alt={p.name} className="w-12 h-12 rounded-xl object-cover shadow-sm" referrerPolicy="no-referrer" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-black text-primary uppercase truncate">{p.name}</p>
                                  <p className="text-[10px] font-bold text-secondary uppercase truncate">{p.period}</p>
                                </div>
                                <button 
                                  onClick={() => handleDeleteGaleria(p.id)}
                                  className="p-2 text-red-500 hover:bg-red-50 rounded-xl opacity-0 group-hover:opacity-100 transition-all"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
        {currentPage === 'presidencia' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto px-6 py-12"
          >
            {presidencia ? (
              <div className="bg-white rounded-[2.5rem] shadow-xl border border-primary/5 overflow-hidden">
                <div className="md:flex items-start">
                  <div className="md:w-2/5 p-8 lg:p-10 shrink-0">
                    <div className="aspect-[4/5] rounded-3xl overflow-hidden shadow-lg border-4 border-primary/10 bg-surface-container-low">
                      <img 
                        src={presidencia.photo_url} 
                        alt={presidencia.name} 
                        className="w-full h-full object-cover object-top"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  </div>
                  <div className="md:w-3/5 p-8 lg:p-10 md:pl-0">
                    <h1 className="text-3xl font-black text-primary font-headline mb-2 uppercase tracking-tight">{presidencia.name}</h1>
                    <div className="h-1.5 w-20 bg-primary rounded-full mb-6" />
                    <div 
                      className="quill-content text-secondary leading-relaxed text-base"
                      dangerouslySetInnerHTML={{ __html: presidencia.biography }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center py-20">
                <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
              </div>
            )}
          </motion.div>
        )}

        {currentPage === 'diretorias' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-6xl mx-auto px-6 py-12"
          >
            <div className="text-center mb-12">
              <h1 className="text-4xl font-black text-primary font-headline mb-4 uppercase">Diretorias</h1>
              <div className="h-1 w-20 bg-primary rounded-full mx-auto" />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {diretorias.map((dir) => (
                <div key={dir.id} className="bg-white rounded-[2.5rem] shadow-lg border border-primary/5 overflow-hidden group hover:shadow-2xl transition-all duration-500">
                  <div className="aspect-[4/5] overflow-hidden relative bg-surface-container-low">
                    <img 
                      src={dir.photo_url} 
                      alt={dir.director_name} 
                      className="w-full h-full object-cover object-top group-hover:scale-110 transition-transform duration-700"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  </div>
                  <div className="p-6 text-center">
                    <h3 className="text-xl font-black text-primary font-headline mb-1 uppercase">{dir.director_name}</h3>
                    <p className="text-xs font-bold text-secondary uppercase tracking-widest">{dir.name}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {currentPage === 'galeria' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-6xl mx-auto px-6 py-12"
          >
            <div className="text-center mb-12">
              <h1 className="text-4xl font-black text-primary font-headline mb-4 uppercase">Galeria de Presidentes</h1>
              <div className="h-1 w-20 bg-primary rounded-full mx-auto" />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
              {galeria.map((p) => (
                <div key={p.id} className="bg-white rounded-[2rem] shadow-md border border-primary/5 overflow-hidden group hover:shadow-xl transition-all">
                  <div className="aspect-[2/3] overflow-hidden bg-surface-container-low">
                    <img 
                      src={p.photo_url} 
                      alt={p.name} 
                      className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="p-4 text-center bg-surface-container-low">
                    <h3 className="text-sm font-black text-primary font-headline mb-1 uppercase">{p.name}</h3>
                    <p className="text-[10px] font-bold text-secondary uppercase tracking-tighter">{p.period}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-surface-container-low border-t border-primary/5 flex flex-col items-center text-center p-8 pb-12 gap-4">
        <div className="font-headline font-black text-primary text-lg uppercase tracking-widest mb-2">ITERAIMA</div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-4xl mb-8">
          {governoLinks.map((link) => (
            <a 
              key={link.label}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white/50 hover:bg-white transition-all border border-primary/5 group"
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                <link.icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold text-secondary group-hover:text-primary transition-colors leading-tight">
                {link.label}
              </span>
            </a>
          ))}
        </div>

        {/* Ouvidoria ITERAIMA Card */}
        <div id="acc-ouvidoria-box" className="w-full max-w-xl p-6 rounded-[2rem] bg-[#f2faf3] border border-[#00640f]/15 hover:border-[#00640f]/30 transition-all mb-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-[#0a8019] animate-pulse" />
            <h4 className="text-xs font-headline font-black text-[#00640f] uppercase tracking-widest">Ouvidoria ITERAIMA</h4>
          </div>
          <p className="text-[10px] text-secondary font-medium mb-4 max-w-md mx-auto leading-relaxed">
            Canal direto para denúncias, solicitações, sugestões, reclamações e elogios. Clique nos botões abaixo para falar imediatamente com a nossa equipe.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <a 
              href="https://wa.me/5595991773573" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2.5 px-4 py-3 rounded-2xl bg-[#25d366] hover:bg-[#20ba5a] text-white font-bold text-xs uppercase tracking-wider shadow-sm hover:scale-[1.01] transition-all active:scale-95 duration-100"
              title="Falar com a Ouvidoria por WhatsApp"
            >
              <MessageCircle className="w-4 h-4" />
              WhatsApp: (95) 99177-3573
            </a>
            <a 
              href="mailto:ouvidoriaiteraima@gmail.com"
              className="flex items-center justify-center gap-2.5 px-4 py-3 rounded-2xl bg-[#00640f] hover:bg-[#004e0b] text-white font-bold text-xs uppercase tracking-wider shadow-sm hover:scale-[1.01] transition-all active:scale-95 duration-100"
              title="Mandar e-mail para ouvidoriaiteraima@gmail.com"
            >
              <Mail className="w-4 h-4" />
              ouvidoriaiteraima@gmail.com
            </a>
          </div>
        </div>

        <div className="flex flex-col gap-4 mb-6">
          <div className="flex items-center justify-center gap-2 text-secondary">
            <MapPin className="w-4 h-4" />
            <span className="text-xs">Av. Capitão Júlio Bezerra, 1861, Trinta e um de Março, CEP:69.305-294, Boa Vista/RR</span>
          </div>
          <div className="flex items-center justify-center gap-2 text-secondary">
            <Phone className="w-4 h-4" />
            <span className="text-xs">(95) 98408-0403</span>
          </div>
          <div className="flex items-center justify-center gap-2 text-secondary">
            <Clock className="w-4 h-4" />
            <span className="text-xs">Horário de Funcionamento: 7:30 às 13:30</span>
          </div>
          <div className="flex items-center justify-center gap-2 text-secondary">
            <Mail className="w-4 h-4" />
            <span className="text-xs">E-mail: protoiteraima@gmail.com</span>
          </div>
        </div>
        
        <div className="flex gap-4 mb-8">
          {[
            { Icon: MapPin, href: 'https://www.google.com/maps?cid=2222408489871394770&g_mp=CiVnb29nbGUubWFwcy5wbGFjZXMudjEuUGxhY2VzLkdldFBsYWNlEAEYASAB&hl=pt-BR&gl=BR&source=embed' },
            { Icon: Mail, href: 'mailto:protoiteraima@gmail.com' },
            { Icon: Share2, onClick: handleShare }
          ].map(({ Icon, href, onClick }, i) => {
            const Component = href ? 'a' : 'button';
            return (
              <Component 
                key={i} 
                href={href}
                onClick={onClick}
                target={href?.startsWith('http') ? "_blank" : undefined}
                rel={href?.startsWith('http') ? "noopener noreferrer" : undefined}
                className="w-10 h-10 rounded-full border border-primary/10 flex items-center justify-center text-primary cursor-pointer hover:bg-primary hover:text-white transition-all"
              >
                <Icon className="w-5 h-5" />
              </Component>
            );
          })}
        </div>

        <button 
          onClick={scrollToTop}
          className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest mb-6 active:scale-95 transition-all"
        >
          <ArrowUp className="w-4 h-4" />
          Voltar ao topo
        </button>
        
        <img 
          src={logoUrl} 
          alt="ITERAIMA Logo" 
          className="h-12 w-auto object-contain mb-6 opacity-80"
          referrerPolicy="no-referrer"
        />
        
        <p className="text-xs leading-relaxed text-secondary">© 2026 ITERAIMA - Governo do Estado de Roraima</p>
        <div className="flex gap-4 mt-2">
          <a href="#" className="underline text-primary text-xs">Privacidade</a>
          <a href="#" className="text-secondary text-xs">Acessibilidade</a>
        </div>
      </footer>

      {/* BottomNavBar */}
      <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 h-20 bg-background/80 backdrop-blur-xl rounded-t-[1.5rem] border-t border-primary/10 shadow-[0_-8px_32px_rgba(0,34,2,0.06)]">
        <button 
          onClick={() => {
            setCurrentPage('home');
            setSelectedFolder(null);
            setSelectedYear(null);
          }}
          className={`flex flex-col items-center justify-center rounded-2xl px-4 py-1.5 active:scale-90 duration-150 transition-all ${currentPage === 'home' ? 'bg-primary text-white' : 'text-secondary hover:text-primary'}`}
        >
          <Home className="w-6 h-6" />
          <span className="text-[11px] font-medium uppercase tracking-wider mt-1">Início</span>
        </button>
        <a 
          href="https://iteraimacidadao.rr.gov.br/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center justify-center text-secondary px-4 py-1.5 hover:text-primary transition-all active:scale-90 duration-150"
        >
          <LayoutGrid className="w-6 h-6" />
          <span className="text-[11px] font-medium uppercase tracking-wider mt-1">Iteraima Cidadão</span>
        </a>
        <button 
          onClick={() => setCurrentPage('news')}
          className={`flex flex-col items-center justify-center rounded-2xl px-4 py-1.5 active:scale-90 duration-150 transition-all ${currentPage === 'news' ? 'bg-primary text-white' : 'text-secondary hover:text-primary'}`}
        >
          <Newspaper className="w-6 h-6" />
          <span className="text-[11px] font-medium uppercase tracking-wider mt-1">Notícias</span>
        </button>
        <button 
          onClick={() => setCurrentPage('admin')}
          className={`flex flex-col items-center justify-center rounded-2xl px-4 py-1.5 active:scale-90 duration-150 transition-all ${currentPage === 'admin' ? 'bg-primary text-white' : 'text-secondary hover:text-primary'}`}
        >
          <UserRound className="w-6 h-6" />
          <span className="text-[11px] font-medium uppercase tracking-wider mt-1">Admin</span>
        </button>
      </nav>
      
      <React.Suspense fallback={null}>
        <AiAssistant 
          news={newsList}
          documents={documents}
          presidencia={presidencia}
          diretorias={diretorias}
          galeria={galeria}
        />
      </React.Suspense>
      
      <Toaster position="top-center" richColors />
    </div>
  );
}
