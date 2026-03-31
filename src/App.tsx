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
  UserPlus
} from 'lucide-react';
import { Toaster, toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import React, { useState, useEffect, FormEvent, Component, ErrorInfo, ReactNode } from 'react';
import { api, User, News, TransparencyDocument } from './api';

// Error Boundary Component
class ErrorBoundary extends Component<any, any> {
  public state = { hasError: false, errorInfo: '' };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, errorInfo: error.message };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-surface-container-low p-6">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-primary/5 max-w-md w-full text-center">
            <div className="w-16 h-16 bg-red-50 rounded-3xl flex items-center justify-center text-red-500 mx-auto mb-6">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-black text-on-surface font-headline mb-2">Ops! Algo deu errado</h2>
            <p className="text-sm text-secondary mb-8">{this.state.errorInfo}</p>
            <button 
              onClick={() => window.location.reload()}
              className="w-full bg-primary text-white font-bold py-4 rounded-2xl shadow-lg shadow-primary/20 active:scale-95 transition-all"
            >
              TENTAR NOVAMENTE
            </button>
          </div>
        </div>
      );
    }

    return (this as any).props.children;
  }
}

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
  'ATA DE REGISTRO DE PREÇOS'
];

export default function App() {
  const [showTransparenciaSub, setShowTransparenciaSub] = useState(false);
  const [openLevel2Menu, setOpenLevel2Menu] = useState<string | null>(null);
  const [openLevel3Menu, setOpenLevel3Menu] = useState<string | null>(null);
  const [openLevel4Menu, setOpenLevel4Menu] = useState<string | null>(null);
  const [showInstitucionalSub, setShowInstitucionalSub] = useState(false);
  const [showLegislacaoSub, setShowLegislacaoSub] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState<'home' | 'news' | 'admin' | 'folder'>('home');
  const [selectedFolder, setSelectedFolder] = useState<{ label: string, items: any[] } | null>(null);
  const [selectedYear, setSelectedYear] = useState<string | null>(null);
  
  // News State
  const [newsList, setNewsList] = useState<News[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Transparency Documents State
  const [documents, setDocuments] = useState<TransparencyDocument[]>([]);
  const [isUploadingDocs, setIsUploadingDocs] = useState(false);
  const [uploadCategory, setUploadCategory] = useState('BALANÇO FINANCEIRO');
  const [uploadYear, setUploadYear] = useState('2026');
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

  // Publish State
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState('REGULARIZAÇÃO');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState(false);
  const [publishError, setPublishError] = useState('');

  // Delete State
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    // Auth state from localStorage
    const savedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (savedUser && token) {
      setUser(JSON.parse(savedUser));
    }
    setIsAuthReady(true);

    // Initial data fetch
    const fetchData = async () => {
      try {
        const [news, docs] = await Promise.all([
          api.getNews(),
          api.getDocuments()
        ]);
        setNewsList(news);
        setDocuments(docs);
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
      fetchPending();
      const interval = setInterval(fetchPending, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoginError('');
    try {
      const data = await api.login(loginEmail, loginPassword);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setUser(data.user);
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
    try {
      await api.publishNews({
        title: newTitle,
        content: newContent,
        category: newCategory,
        image_url: newImageUrl
      });
      
      setNewTitle('');
      setNewContent('');
      setNewImageUrl('');
      setPublishSuccess(true);
      
      // Refresh news
      const news = await api.getNews();
      setNewsList(news);
      
      setTimeout(() => setPublishSuccess(false), 3000);
    } catch (error) {
      setPublishError('Erro ao publicar notícia. Verifique sua conexão.');
    } finally {
      setIsPublishing(false);
    }
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
        await api.uploadDocument({
          name: file.name,
          category: uploadCategory,
          year: uploadYear,
          url: '#' // Placeholder
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

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const transparenciaItems = [
    { 
      label: 'FINANCEIRA', 
      icon: CircleDollarSign,
      subItems: [
        { 
          label: 'BALANÇO FINANCEIRO', 
          icon: FileText,
          subItems: [
            { label: '2022', icon: Calendar },
            { label: '2023', icon: Calendar },
            { label: '2024', icon: Calendar },
            { label: '2025', icon: Calendar },
            { label: '2026', icon: Calendar }
          ]
        },
        { 
          label: 'CONTRATAÇÃO DIRETA', 
          icon: Handshake,
          subItems: [
            { label: '2022', icon: Calendar },
            { label: '2023', icon: Calendar },
            { label: '2024', icon: Calendar },
            { label: '2025', icon: Calendar },
            { label: '2026', icon: Calendar }
          ]
        },
        { 
          label: 'CONTRATOS E ADITIVOS', 
          icon: FileSignature,
          subItems: [
            { label: '2022', icon: Calendar },
            { label: '2023', icon: Calendar },
            { label: '2024', icon: Calendar },
            { label: '2025', icon: Calendar },
            { label: '2026', icon: Calendar }
          ]
        },
        { 
          label: 'COSLIC', 
          icon: ClipboardList,
          subItems: [
            { 
              label: 'AVISO', 
              icon: FileText,
              subItems: [
                { label: '2022', icon: Calendar },
                { label: '2023', icon: Calendar },
                { label: '2024', icon: Calendar },
                { label: '2025', icon: Calendar },
                { label: '2026', icon: Calendar }
              ]
            },
            { 
              label: 'COMUNICADO', 
              icon: FileText,
              subItems: [
                { label: '2022', icon: Calendar },
                { label: '2023', icon: Calendar },
                { label: '2024', icon: Calendar },
                { label: '2025', icon: Calendar },
                { label: '2026', icon: Calendar }
              ]
            },
            { 
              label: 'DISPENSA', 
              icon: FileText,
              subItems: [
                { label: '2022', icon: Calendar },
                { label: '2023', icon: Calendar },
                { label: '2024', icon: Calendar },
                { label: '2025', icon: Calendar },
                { label: '2026', icon: Calendar }
              ]
            },
            { 
              label: 'EDITAIS', 
              icon: FileText,
              subItems: [
                { label: '2022', icon: Calendar },
                { label: '2023', icon: Calendar },
                { label: '2024', icon: Calendar },
                { label: '2025', icon: Calendar },
                { label: '2026', icon: Calendar }
              ]
            },
            { 
              label: 'INEXIGIBILIDADE', 
              icon: FileText,
              subItems: [
                { label: '2022', icon: Calendar },
                { label: '2023', icon: Calendar },
                { label: '2024', icon: Calendar },
                { label: '2025', icon: Calendar },
                { label: '2026', icon: Calendar }
              ]
            },
            { 
              label: 'RESULTADO', 
              icon: FileText,
              subItems: [
                { label: '2022', icon: Calendar },
                { label: '2023', icon: Calendar },
                { label: '2024', icon: Calendar },
                { label: '2025', icon: Calendar },
                { label: '2026', icon: Calendar }
              ]
            },
            { 
              label: 'SÍNTESE', 
              icon: FileText,
              subItems: [
                { label: '2022', icon: Calendar },
                { label: '2023', icon: Calendar },
                { label: '2024', icon: Calendar },
                { label: '2025', icon: Calendar },
                { label: '2026', icon: Calendar }
              ]
            },
            { 
              label: 'ATA DE REGISTRO DE PREÇOS', 
              icon: FileText,
              subItems: [
                { label: '2022', icon: Calendar },
                { label: '2023', icon: Calendar },
                { label: '2024', icon: Calendar },
                { label: '2025', icon: Calendar },
                { label: '2026', icon: Calendar }
              ]
            }
          ]
        },
        { 
          label: 'PLANO DE CONTRATAÇÃO ANUAL – PCA', 
          icon: Calendar,
          subItems: [
            { label: '2022', icon: Calendar },
            { label: '2023', icon: Calendar },
            { label: '2024', icon: Calendar },
            { label: '2025', icon: Calendar },
            { label: '2026', icon: Calendar }
          ]
        }
      ]
    },
    { 
      label: 'FUNDIÁRIA', 
      icon: Map,
      subItems: [
        { label: 'IMÓVEIS', icon: Home },
        { label: 'REGULARIZADOS', icon: FileSignature },
        { label: 'NOTIFICAÇÕES', icon: Rss },
        { label: 'REQUERIMENTO DE REGULARIZAÇÃO', icon: ClipboardList }
      ]
    },
    { 
      label: 'DE PESSOAS', 
      icon: Users,
      subItems: [
        { label: 'CONCURSOS E SELEÇÕES', icon: UsersRound },
        { label: 'DIÁRIAS', icon: CircleDollarSign },
        { label: 'ESTAGIÁRIOS', icon: UserRound },
        { label: 'FOLHA DE PAGAMENTO', icon: FileText },
        { label: 'TERCEIRIZADOS', icon: Handshake }
      ]
    }
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
                          onClick={() => {
                            if (item.subItems) {
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
                          {item.subItems && (
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
                              onClick={() => {
                                if (sub.subItems) {
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
                              {sub.subItems && (
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
                          <span>
                            {new Date(news.created_at).toLocaleDateString('pt-BR')}
                          </span>
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
                  if (selectedYear) {
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
                <span className="text-primary font-bold text-xs uppercase tracking-[0.2em]">Transparência</span>
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
            ) : (
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="bg-primary/10 text-primary px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
                    Ano: {selectedYear}
                  </span>
                </div>

                <div className="grid gap-3">
                  {documents
                    .filter(doc => doc.category === selectedFolder.label && doc.year === selectedYear)
                    .map(doc => (
                      <div key={doc.id} className="bg-white p-4 rounded-2xl border border-primary/5 flex items-center justify-between group hover:border-primary/20 transition-all shadow-sm">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-primary/5 rounded-xl flex items-center justify-center text-primary">
                            <File className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="block text-sm font-bold text-primary truncate max-w-[200px]">{doc.name}</span>
                            <span className="text-[10px] text-secondary font-medium uppercase tracking-wider">
                              PDF • {new Date(doc.upload_date).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                        </div>
                        <a 
                          href={doc.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="p-2 text-primary hover:bg-primary/5 rounded-full transition-all"
                        >
                          <Download className="w-5 h-5" />
                        </a>
                      </div>
                    ))}
                  {documents.filter(doc => doc.category === selectedFolder.label && doc.year === selectedYear).length === 0 && (
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

                {/* User Management Section - Admin Only */}
                {user?.role === 'admin' && pendingUsers.length > 0 && (
                  <div className="mt-12 pt-12 border-t border-primary/10">
                    <div className="flex items-center gap-4 mb-8">
                      <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                        <UserPlus className="w-6 h-6" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-black text-on-surface font-headline leading-none">Aprovação de Usuários</h2>
                        <p className="text-xs text-secondary mt-1">Gerencie novos cadastros e atribua funções</p>
                      </div>
                    </div>

                    <div className="grid gap-4">
                      {pendingUsers.map(pendingUser => (
                        <div key={pendingUser.id} className="bg-white p-6 rounded-3xl border border-primary/5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
                          <div>
                            <span className="block text-sm font-bold text-primary">{pendingUser.email}</span>
                            <span className="text-[10px] text-secondary font-medium uppercase tracking-wider">
                              Solicitado em: {pendingUser.created_at ? new Date(pendingUser.created_at).toLocaleDateString('pt-BR') : 'Recentemente'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => handleApproveUser(pendingUser.id, 'viewer')}
                              className="px-4 py-2 bg-surface-container-low text-primary text-[10px] font-bold rounded-xl hover:bg-primary/10 transition-all uppercase tracking-widest"
                            >
                              Viewer
                            </button>
                            <button 
                              onClick={() => handleApproveUser(pendingUser.id, 'editor')}
                              className="px-4 py-2 bg-primary/10 text-primary text-[10px] font-bold rounded-xl hover:bg-primary/20 transition-all uppercase tracking-widest"
                            >
                              Editor
                            </button>
                            <button 
                              onClick={() => handleApproveUser(pendingUser.id, 'admin')}
                              className="px-4 py-2 bg-primary text-white text-[10px] font-bold rounded-xl hover:opacity-90 transition-all uppercase tracking-widest"
                            >
                              Admin
                            </button>
                            <button 
                              onClick={() => handleRejectUser(pendingUser.id)}
                              className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-all"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Document Upload Section - Admin/Editor Only */}
                {(user?.role === 'admin' || user?.role === 'editor') && (
                  <div className="mt-12 pt-12 border-t border-primary/10">
                    <div className="flex items-center gap-4 mb-8">
                      <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                        <Upload className="w-6 h-6" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-black text-on-surface font-headline leading-none">Upload de Documentos</h2>
                        <p className="text-xs text-secondary mt-1">Adicione novos arquivos ao portal da transparência</p>
                      </div>
                    </div>
                    <div className="bg-white p-8 rounded-3xl shadow-xl border border-primary/5 space-y-6">
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
                        <div>
                          <label className="block text-[10px] font-bold text-secondary uppercase tracking-widest mb-1.5 ml-1">Ano</label>
                          <select 
                            value={uploadYear}
                            onChange={(e) => setUploadYear(e.target.value)}
                            className="w-full bg-surface-container-low border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary transition-all"
                          >
                            {['2022', '2023', '2024', '2025', '2026'].map(y => (
                              <option key={y} value={y}>{y}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="relative">
                        <input 
                          type="file" 
                          multiple 
                          accept=".pdf"
                          onChange={(e) => {
                            const files = Array.from(e.target.files || []);
                            if (files.length > 10) {
                              toast.error('Máximo de 10 arquivos por vez');
                              setSelectedFiles(files.slice(0, 10));
                            } else {
                              setSelectedFiles(files);
                            }
                          }}
                          className="hidden" 
                          id="pdf-upload"
                        />
                        <label 
                          htmlFor="pdf-upload"
                          className="w-full border-2 border-dashed border-primary/20 rounded-3xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-primary/5 transition-all group"
                        >
                          <div className="w-14 h-14 bg-primary/5 rounded-full flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                            <Upload className="w-7 h-7" />
                          </div>
                          <div className="text-center">
                            <span className="block text-sm font-bold text-primary">Clique para selecionar PDFs</span>
                            <span className="text-[10px] text-secondary font-medium uppercase tracking-wider">Até 10 arquivos simultâneos</span>
                          </div>
                        </label>
                      </div>

                      {selectedFiles.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between px-2">
                            <span className="text-[10px] font-bold text-secondary uppercase tracking-widest">Arquivos Selecionados ({selectedFiles.length})</span>
                            <button onClick={() => setSelectedFiles([])} className="text-[10px] font-bold text-red-500 uppercase tracking-widest">Limpar</button>
                          </div>
                          <div className="grid gap-2">
                            {selectedFiles.map((file, i) => (
                              <div key={i} className="flex items-center gap-3 p-3 bg-surface-container-low rounded-xl border border-primary/5">
                                <File className="w-4 h-4 text-primary opacity-60" />
                                <span className="text-xs font-medium text-primary truncate flex-1">{file.name}</span>
                                <CheckCircle2 className="w-4 h-4 text-green-500" />
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
                            <Upload className="w-5 h-5" />
                            ENVIAR DOCUMENTOS
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
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
      <Toaster position="top-center" richColors />
    </div>
  );
}
