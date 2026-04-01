import React, { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Loader2, MessageSquare, User, Sparkles } from 'lucide-react';
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
}

export function AiAssistant({ news, documents, presidencia, diretorias, galeria }: AiAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Olá! Sou o Assistente Virtual do ITERAIMA. Como posso ajudar você hoje? Posso responder sobre notícias, documentos da transparência ou informações institucionais.'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await getAiResponse(input, {
        news,
        documents,
        presidencia,
        diretorias,
        galeria
      });

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response || 'Desculpe, não consegui processar sua solicitação.'
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error in AI chat:', error);
      toast.error('Erro ao conectar com o assistente');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-primary text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-50 group overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <Bot className="w-7 h-7" />
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white animate-pulse" />
      </button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-6 w-[400px] max-w-[calc(100vw-48px)] h-[600px] max-h-[calc(100vh-120px)] bg-white rounded-[2.5rem] shadow-2xl border border-primary/10 flex flex-col overflow-hidden z-50"
          >
            {/* Header */}
            <div className="p-6 bg-primary text-white flex items-center justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
              <div className="flex items-center gap-3 relative z-10">
                <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                  <Bot className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-headline font-black text-lg leading-none uppercase tracking-wider">Assistente ITERAIMA</h3>
                  <div className="flex items-center gap-1.5 mt-1">
                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                    <span className="text-[10px] font-bold opacity-80 uppercase tracking-widest">Online Agora</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors relative z-10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-surface-container-low/30">
              {messages.map((msg) => (
                <div 
                  key={msg.id} 
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      msg.role === 'user' ? 'bg-primary text-white' : 'bg-white text-primary shadow-sm border border-primary/5'
                    }`}>
                      {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                    </div>
                    <div className={`p-4 rounded-2xl text-sm leading-relaxed ${
                      msg.role === 'user' 
                        ? 'bg-primary text-white rounded-tr-none shadow-lg shadow-primary/10' 
                        : 'bg-white text-secondary rounded-tl-none shadow-sm border border-primary/5'
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
                    <div className="w-8 h-8 rounded-xl bg-white text-primary shadow-sm border border-primary/5 flex items-center justify-center">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div className="p-4 rounded-2xl rounded-tl-none bg-white text-secondary shadow-sm border border-primary/5 flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                      <span className="text-xs font-bold uppercase tracking-widest opacity-60">Pensando...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSubmit} className="p-6 bg-white border-t border-primary/5">
              <div className="relative group">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Pergunte algo sobre o ITERAIMA..."
                  className="w-full bg-surface-container-low border-none rounded-2xl pl-5 pr-14 py-4 text-sm focus:ring-2 focus:ring-primary transition-all placeholder:text-secondary/40"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-primary text-white rounded-xl flex items-center justify-center hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 transition-all shadow-lg shadow-primary/20"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
              <p className="text-[9px] text-center text-secondary/40 mt-3 uppercase font-bold tracking-widest flex items-center justify-center gap-1">
                <Sparkles className="w-2.5 h-2.5" />
                Powered by Gemini AI
              </p>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
