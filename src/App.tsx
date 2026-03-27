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
  ClipboardList
} from 'lucide-react';
import { Toaster, toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect, FormEvent } from 'react';

interface News {
  id: number;
  title: string;
  content: string;
  category: string;
  image_url: string;
  created_at: string;
  author_id: number;
}

interface User {
  email: string;
  role: string;
}

const IMAGES = {
  logo: 'https://iteraimacidadao.rr.gov.br/cadastrousuarioexterno/include/images/marca/logo_iteraima.png',
  hero: 'https://st2.depositphotos.com/1482106/12327/i/450/depositphotos_123270174-stock-photo-waving-flag-of-roraima-state.jpg',
  news1: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&q=80&w=800',
  news2: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&q=80&w=800',
};

export default function App() {
  const [showTransparenciaSub, setShowTransparenciaSub] = useState(false);
  const [showFinanceiraSub, setShowFinanceiraSub] = useState(false);
  const [showInstitucionalSub, setShowInstitucionalSub] = useState(false);
  const [showLegislacaoSub, setShowLegislacaoSub] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState<'home' | 'news' | 'admin'>('home');
  
  // News State
  const [newsList, setNewsList] = useState<News[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Auth State
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Publish State
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState('REGULARIZAÇÃO');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState(false);
  const [publishError, setPublishError] = useState('');

  // Delete State
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    try {
      const response = await fetch('/api/news');
      const data = await response.json();
      setNewsList(data);
    } catch (error) {
      console.error('Error fetching news:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoginError('');
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      });
      const data = await response.json();
      if (response.ok) {
        setToken(data.token);
        setUser(data.user);
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        setLoginEmail('');
        setLoginPassword('');
      } else {
        setLoginError(data.message);
      }
    } catch (error) {
      setLoginError('Erro ao conectar ao servidor');
    }
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
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
    setIsPublishing(true);
    setPublishError('');
    setPublishSuccess(false);
    try {
      const response = await fetch('/api/news', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          title: newTitle, 
          content: newContent, 
          category: newCategory, 
          image_url: newImageUrl 
        })
      });
      if (response.ok) {
        setNewTitle('');
        setNewContent('');
        setNewImageUrl('');
        setPublishSuccess(true);
        fetchNews();
        setTimeout(() => setPublishSuccess(false), 3000);
      } else {
        setPublishError('Erro ao publicar notícia. Verifique sua conexão.');
      }
    } catch (error) {
      setPublishError('Erro ao conectar ao servidor');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleDeleteNews = async (id: number) => {
    try {
      const response = await fetch(`/api/news/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        fetchNews();
        setDeletingId(null);
      }
    } catch (error) {
      // Silently fail or show error in UI
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const transparenciaItems = [
    { 
      label: 'FINANCEIRA', 
      icon: CircleDollarSign,
      subItems: [
        { label: 'BALANÇO FINANCEIRO', icon: FileText },
        { label: 'CONTRATAÇÃO DIRETA', icon: Handshake },
        { label: 'CONTRATOS E ADITIVOS', icon: FileSignature },
        { label: 'COSLIC', icon: ClipboardList },
        { label: 'PLANO DE CONTRATAÇÃO ANUAL – PCA', icon: Calendar }
      ]
    },
    { label: 'FUNDIÁRIA', icon: Map },
    { label: 'DE PESSOAS', icon: Users }
  ];

  const governoLinks = [
    { label: 'PORTAL DA TRANSPARÊNCIA', icon: Eye, url: 'https://www.transparencia.rr.gov.br/' },
    { label: 'OUVIDORIA GERAL', icon: HelpCircle, url: 'https://ouvidoria.rr.gov.br/' },
    { label: 'DIÁRIO OFICIAL', icon: Newspaper, url: 'https://www.imprensaoficial.rr.gov.br/app/_inicial/' },
    { label: 'ACESSO À INFORMAÇÃO', icon: FileText, url: 'https://falabr.cgu.gov.br/web/home' }
  ];

  const institucionalItems = [
    { label: 'PRESIDÊNCIA', icon: UserRound },
    { label: 'DIRETORIAS', icon: UsersRound },
    { label: 'GALERIA DE PRESIDENTES', icon: Image }
  ];

  const legislacaoItems = [
    { label: 'ADMINISTRATIVA', icon: Scale },
    { label: 'FUNDIÁRIA', icon: FileText },
    { label: 'MODELOS DE REQUERIMENTOS', icon: FileSignature }
  ];

  return (
    <div className="min-h-screen bg-background text-on-surface font-body pb-24">
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
                  src={IMAGES.logo} 
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
                          onClick={() => item.subItems && setShowFinanceiraSub(!showFinanceiraSub)}
                          className="flex items-center justify-between w-full p-3 rounded-xl hover:bg-primary/5 text-primary text-xs font-bold transition-colors text-left"
                        >
                          <div className="flex items-center gap-3">
                            <item.icon className="w-4 h-4 opacity-60" />
                            {item.label}
                          </div>
                          {item.subItems && (
                            <ChevronRight className={`w-4 h-4 transition-transform ${showFinanceiraSub ? 'rotate-90' : ''}`} />
                          )}
                        </button>
                        
                        {item.subItems && (
                          <AnimatePresence>
                            {showFinanceiraSub && (
                              <motion.div 
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden grid gap-1 pl-6 border-l border-primary/10 ml-4 mt-1"
                              >
                                {item.subItems.map((sub) => (
                                  <button 
                                    key={sub.label}
                                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-primary/5 text-primary/70 text-[10px] font-bold transition-colors text-left"
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
                          <button 
                            key={item.label}
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
      <header className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,34,2,0.06)] flex justify-between items-center px-6 h-16">
        <div 
          onClick={() => setIsSidebarOpen(true)}
          className="flex items-center gap-3 active:scale-95 duration-200 cursor-pointer"
        >
          <Menu className="text-primary w-6 h-6" />
          <img 
            src={IMAGES.logo} 
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

      <main className="pt-16">
        {currentPage === 'home' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Hero Section */}
            <section className="relative h-[480px] w-full flex items-end p-8 overflow-hidden">
              <div className="absolute inset-0 z-0">
                <a href={IMAGES.hero} target="_blank" rel="noopener noreferrer" className="block w-full h-full group">
                  <img 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                    src={IMAGES.hero} 
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
                              onClick={() => sub.subItems && setShowFinanceiraSub(!showFinanceiraSub)}
                              className="flex items-center justify-between w-full p-3 rounded-2xl hover:bg-primary/5 text-primary text-xs font-bold transition-colors text-left"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                                  <sub.icon className="w-4 h-4" />
                                </div>
                                {sub.label}
                              </div>
                              {sub.subItems && (
                                <ChevronRight className={`w-4 h-4 transition-transform ${showFinanceiraSub ? 'rotate-90' : ''}`} />
                              )}
                            </button>
                            
                            {sub.subItems && (
                              <AnimatePresence>
                                {showFinanceiraSub && (
                                  <motion.div 
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden grid gap-1 pl-12 border-l border-primary/10 ml-4 mt-1"
                                  >
                                    {sub.subItems.map((item) => (
                                      <button 
                                        key={item.label}
                                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-primary/5 text-primary/70 text-[10px] font-bold transition-colors text-left"
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
                          <button 
                            key={sub.label}
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

              <div className="space-y-8">
                {isLoading ? (
                  <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : newsList.length > 0 ? (
                  newsList.slice(0, 2).map((news, index) => (
                    <article key={news.id} className={`${index === 0 ? 'group cursor-pointer' : 'flex gap-4 group cursor-pointer'}`}>
                      {index === 0 ? (
                        <>
                          <div className="relative w-full aspect-[16/10] rounded-3xl overflow-hidden mb-4">
                            <img 
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                              src={news.image_url || IMAGES.news1} 
                              alt={news.title}
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute top-4 left-4">
                              <span className="px-3 py-1 bg-white/90 glass text-primary text-[10px] font-bold rounded-full uppercase">{news.category}</span>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-[10px] text-secondary font-medium uppercase tracking-wider">
                              <Calendar className="w-3 h-3" />
                              <span>{new Date(news.created_at).toLocaleDateString('pt-BR')}</span>
                            </div>
                            <h3 className="text-xl font-bold text-on-surface font-headline leading-tight group-hover:text-primary transition-colors">
                              {news.title}
                            </h3>
                            <p className="text-sm text-on-surface-variant leading-relaxed line-clamp-2">
                              {news.content}
                            </p>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="w-24 h-24 shrink-0 rounded-2xl overflow-hidden relative">
                            <img 
                              className="w-full h-full object-cover" 
                              src={news.image_url || IMAGES.news2} 
                              alt={news.title}
                              referrerPolicy="no-referrer"
                            />
                          </div>
                          <div className="flex flex-col justify-center">
                            <span className="text-[10px] text-primary font-bold uppercase tracking-wider mb-1">{news.category}</span>
                            <h3 className="text-sm font-bold text-on-surface font-headline leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                              {news.title}
                            </h3>
                          </div>
                        </>
                      )}
                    </article>
                  ))
                ) : (
                  <p className="text-center text-secondary py-8">Nenhuma notícia em destaque.</p>
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
                  <article key={news.id} className="bg-white rounded-3xl overflow-hidden shadow-sm border border-primary/5 group">
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
                          <span>{new Date(news.created_at).toLocaleDateString('pt-BR')}</span>
                        </div>
                        {user && (user.role === 'admin' || user.role === 'editor') && (
                          <div className="flex items-center gap-2">
                            {deletingId === news.id ? (
                              <div className="flex items-center gap-1">
                                <button 
                                  onClick={() => handleDeleteNews(news.id)}
                                  className="px-3 py-1 bg-red-500 text-white text-[10px] font-bold rounded-lg hover:bg-red-600 transition-colors"
                                >
                                  CONFIRMAR
                                </button>
                                <button 
                                  onClick={() => setDeletingId(null)}
                                  className="px-3 py-1 bg-gray-200 text-gray-600 text-[10px] font-bold rounded-lg hover:bg-gray-300 transition-colors"
                                >
                                  CANCELAR
                                </button>
                              </div>
                            ) : (
                              <button 
                                onClick={() => setDeletingId(news.id)}
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
                      <p className="text-sm text-on-surface-variant leading-relaxed whitespace-pre-wrap">
                        {news.content}
                      </p>
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

        {currentPage === 'admin' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="px-6 py-8"
          >
            {!token ? (
              <div className="max-w-md mx-auto bg-white p-8 rounded-3xl shadow-xl border border-primary/5">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
                    <LogIn className="w-8 h-8" />
                  </div>
                  <h2 className="text-2xl font-black text-primary uppercase tracking-wider font-headline">Acesso Restrito</h2>
                  <p className="text-xs text-secondary mt-2">Somente usuários autorizados podem publicar notícias.</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
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
                  <button 
                    type="submit"
                    className="w-full bg-primary text-white font-bold py-4 rounded-2xl shadow-lg shadow-primary/20 active:scale-95 transition-all mt-4"
                  >
                    ENTRAR
                  </button>
                </form>
              </div>
            ) : (
              <div className="max-w-2xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-3xl font-black text-on-surface font-headline leading-none">Publicar Notícia</h2>
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

                <form onSubmit={handlePublish} className="bg-white p-8 rounded-3xl shadow-xl border border-primary/5 space-y-6">
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
                        <label className="block text-[10px] font-bold text-secondary uppercase tracking-widest mb-1.5 ml-1">URL da Imagem</label>
                        <input 
                          type="url" 
                          value={newImageUrl}
                          onChange={(e) => setNewImageUrl(e.target.value)}
                          className="w-full bg-surface-container-low border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary transition-all"
                          placeholder="https://..."
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-secondary uppercase tracking-widest mb-1.5 ml-1">Conteúdo</label>
                      <textarea 
                        value={newContent}
                        onChange={(e) => setNewContent(e.target.value)}
                        className="w-full bg-surface-container-low border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary transition-all min-h-[200px]"
                        placeholder="Escreva o corpo da notícia aqui..."
                        required
                      />
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
                        PUBLICANDO...
                      </>
                    ) : (
                      <>
                        <Plus className="w-5 h-5" />
                        PUBLICAR AGORA
                      </>
                    )}
                  </button>

                  {publishSuccess && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-green-50 text-green-600 p-4 rounded-2xl text-center text-sm font-bold border border-green-100 mt-4"
                    >
                      Notícia publicada com sucesso!
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
              </div>
            )}
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
          src={IMAGES.logo} 
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
          onClick={() => setCurrentPage('home')}
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
      <Toaster position="top-center" richColors />
    </div>
  );
}
