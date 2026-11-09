import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Loader2, User, Sparkles, Move, HelpCircle, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import { toast } from 'sonner';
import { getAiResponse } from '../services/aiService';
import { News, TransparencyDocument, Presidencia, Diretoria, GaleriaPresidente } from '../api';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface AiAssistantProps {
  news: News[];
  documents: TransparencyDocument[];
  presidencia: Presidencia | null;
  diretorias: Diretoria[];
  galeria: GaleriaPresidente[];
  logoUrl?: string;
}

const DEFAULT_LOGO = 'https://iteraimacidadao.rr.gov.br/cadastrousuarioexterno/include/images/marca/logo_iteraima.png';

const QUICK_QUESTIONS = [
  'Como consultar processo fundiário?',
  'O que é o ITERAIMA Cidadão?',
  'Contatos e Ouvidoria',
  'Últimas notícias do ITERAIMA'
];

export function AiAssistant({ news, documents, presidencia, diretorias, galeria, logoUrl = DEFAULT_LOGO }: AiAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Olá! Sou a **I.A do ITERAIMA**, sua assistente virtual oficial. Estou aqui para responder dúvidas sobre regularização fundiária, títulos definitivos, notícias, transparência e serviços ao produtor rural de Roraima. Como posso ajudar você hoje?'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Dynamic drag constraints so button can move freely across any screen size
  const [dragConstraints, setDragConstraints] = useState({ left: -300, right: 0, top: -500, bottom: 0 });

  useEffect(() => {
    const updateConstraints = () => {
      const isMobile = window.innerWidth < 768;
      const btnSize = 64;
      const padding = 12;
      // Initial position on mobile: bottom: 96px (bottom-24), right: 16px (right-4)
      // Initial position on desktop: bottom: 32px (bottom-8), right: 32px (right-8)
      const initRight = isMobile ? 16 : 32;
      const initBottom = isMobile ? 96 : 32;

      setDragConstraints({
        left: -(window.innerWidth - initRight - btnSize - padding),
        right: initRight - padding,
        top: -(window.innerHeight - initBottom - btnSize - padding - 40),
        bottom: initBottom - padding,
      });
    };

    updateConstraints();
    window.addEventListener('resize', updateConstraints);
    return () => window.removeEventListener('resize', updateConstraints);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const sendQuery = async (queryText: string) => {
    if (!queryText.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: queryText
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await getAiResponse(queryText, {
        news,
        documents,
        presidencia,
        diretorias,
        galeria
      });

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response || 'Desculpe, não consegui processar sua solicitação no momento.'
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error in AI chat:', error);
      toast.error('Erro ao conectar com a I.A do ITERAIMA');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await sendQuery(input);
  };

  return (
    <>
      {/* Floating Draggable ITERAIMA AI Button */}
      <motion.div
        drag
        dragConstraints={dragConstraints}
        dragElastic={0.08}
        dragMomentum={false}
        whileDrag={{ scale: 1.08, zIndex: 70 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={() => {
          setTimeout(() => setIsDragging(false), 120);
        }}
        className="fixed bottom-24 right-4 md:bottom-8 md:right-8 z-50 touch-none select-none"
        title="I.A ITERAIMA - Arraste para posicionar onde desejar"
      >
        <div className="relative group">
          {/* Tooltip hint on hover (desktop) */}
          <div className="hidden sm:flex absolute right-full top-1/2 -translate-y-1/2 mr-3 items-center gap-2 px-3 py-1.5 bg-[#002202]/95 backdrop-blur-md text-white text-xs font-bold rounded-2xl shadow-xl border border-white/15 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
            <span>I.A ITERAIMA</span>
            <span className="text-[10px] text-white/60 flex items-center gap-0.5 ml-1 border-l border-white/10 pl-2 font-normal">
              <Move className="w-3 h-3" /> arraste
            </span>
          </div>

          {/* Button Core */}
          <button
            onClick={() => {
              if (!isDragging) {
                setIsOpen(!isOpen);
              }
            }}
            className="w-16 h-16 rounded-full p-[3px] bg-gradient-to-tr from-[#004e0b] via-[#0a8019] to-[#fbbf24] shadow-[0_8px_25px_rgba(0,100,15,0.4)] hover:shadow-[0_12px_32px_rgba(0,100,15,0.6)] cursor-grab active:cursor-grabbing flex items-center justify-center transition-all relative overflow-visible focus:outline-none focus:ring-4 focus:ring-primary/20"
            aria-label="Abrir I.A do ITERAIMA"
          >
            {/* White disc inside */}
            <div className="w-full h-full rounded-full bg-white flex items-center justify-center p-1.5 relative overflow-hidden shadow-inner">
              <img 
                src={logoUrl || DEFAULT_LOGO} 
                alt="Logo ITERAIMA" 
                className="w-9 h-9 object-contain pointer-events-none select-none"
                referrerPolicy="no-referrer"
              />
            </div>

            {/* Glowing Golden "I.A" Badge */}
            <div className="absolute -bottom-1 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-[#003808] font-black text-[9px] px-2 py-0.5 rounded-full shadow-md border-2 border-white flex items-center gap-0.5 uppercase tracking-wider">
              <Sparkles className="w-2.5 h-2.5 fill-current" />
              <span>I.A</span>
            </div>

            {/* Green Online Radar Pulse */}
            <span className="absolute top-0 right-0 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-green-500 border-2 border-white shadow-sm" />
            </span>
          </button>
        </div>
      </motion.div>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-4 md:bottom-8 md:right-8 w-[400px] max-w-[calc(100vw-32px)] h-[620px] max-h-[calc(100vh-120px)] bg-white rounded-[2.5rem] shadow-2xl border border-primary/10 flex flex-col overflow-hidden z-50"
          >
            {/* Header com a cara do ITERAIMA */}
            <div className="p-5 bg-gradient-to-r from-[#004e0b] via-[#0a8019] to-[#004e0b] text-white flex items-center justify-between relative overflow-hidden border-b border-white/10">
              <div className="absolute top-0 right-0 w-36 h-36 bg-yellow-400/10 rounded-full -mr-16 -mt-16 blur-2xl pointer-events-none" />
              
              <div className="flex items-center gap-3 relative z-10">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center p-1.5 shadow-md border-2 border-yellow-400/80 shrink-0">
                  <img 
                    src={logoUrl || DEFAULT_LOGO} 
                    alt="Logo ITERAIMA" 
                    className="w-full h-full object-contain"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-headline font-black text-base uppercase tracking-wider leading-none">I.A ITERAIMA</h3>
                    <span className="bg-yellow-400 text-[#003808] text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider">Oficial</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    <span className="text-[10px] font-bold text-white/90 uppercase tracking-widest">Online • Governo de Roraima</span>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center relative z-10 text-white"
                aria-label="Fechar I.A do ITERAIMA"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-[#f7fcf8]">
              {messages.map((msg) => (
                <div 
                  key={msg.id} 
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex gap-3 max-w-[88%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
                      msg.role === 'user' 
                        ? 'bg-primary text-white' 
                        : 'bg-white border border-primary/15 p-1'
                    }`}>
                      {msg.role === 'user' ? (
                        <User className="w-4 h-4" />
                      ) : (
                        <img 
                          src={logoUrl || DEFAULT_LOGO} 
                          alt="ITERAIMA" 
                          className="w-full h-full object-contain"
                          referrerPolicy="no-referrer"
                        />
                      )}
                    </div>
                    <div className={`p-4 rounded-2xl text-sm leading-relaxed ${
                      msg.role === 'user' 
                        ? 'bg-[#00640f] text-white rounded-tr-none shadow-md shadow-primary/10' 
                        : 'bg-white text-secondary rounded-tl-none shadow-sm border border-primary/10'
                    }`}>
                      <div className="markdown-body">
                        <Markdown>{msg.content}</Markdown>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex gap-3 max-w-[85%]">
                    <div className="w-8 h-8 rounded-xl bg-white border border-primary/15 p-1 flex items-center justify-center shrink-0 shadow-sm">
                      <img 
                        src={logoUrl || DEFAULT_LOGO} 
                        alt="ITERAIMA" 
                        className="w-full h-full object-contain"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="p-3.5 rounded-2xl rounded-tl-none bg-white text-secondary shadow-sm border border-primary/10 flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-[#00640f]" />
                      <span className="text-xs font-bold text-primary uppercase tracking-widest">Consultando dados do ITERAIMA...</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Quick Questions Chips (quando a conversa está no início) */}
              {messages.length <= 2 && !isLoading && (
                <div className="pt-2">
                  <span className="text-[10px] font-bold text-secondary uppercase tracking-widest block mb-2 flex items-center gap-1">
                    <HelpCircle className="w-3 h-3 text-primary" /> Perguntas Frequentes:
                  </span>
                  <div className="grid gap-1.5">
                    {QUICK_QUESTIONS.map((question) => (
                      <button
                        key={question}
                        onClick={() => sendQuery(question)}
                        className="text-left text-xs text-primary bg-white hover:bg-primary/5 p-2.5 rounded-xl border border-primary/10 transition-colors flex items-center justify-between group shadow-2xs"
                      >
                        <span className="font-semibold">{question}</span>
                        <ArrowRight className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-primary" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <form onSubmit={handleSubmit} className="p-4 bg-white border-t border-primary/10">
              <div className="relative group">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Pergunte à I.A do ITERAIMA..."
                  className="w-full bg-[#f4fbf4] border border-primary/15 rounded-2xl pl-4 pr-12 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all placeholder:text-secondary/50 text-on-surface"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 w-9 h-9 bg-primary hover:bg-[#004e0b] text-white rounded-xl flex items-center justify-center active:scale-95 disabled:opacity-40 disabled:hover:bg-primary transition-all shadow-md shadow-primary/20"
                  aria-label="Enviar mensagem"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              <div className="flex items-center justify-between text-[9px] text-secondary/60 mt-2.5 px-1 font-semibold uppercase tracking-wider">
                <span>ITERAIMA • Governo de Roraima</span>
                <span className="flex items-center gap-1 text-primary">
                  <Sparkles className="w-2.5 h-2.5 fill-current" />
                  Inteligência Artificial Oficial
                </span>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
