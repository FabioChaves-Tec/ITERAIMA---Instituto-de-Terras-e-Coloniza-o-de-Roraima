import React, { useState, useEffect } from 'react';
import { 
  Accessibility, 
  Volume2, 
  VolumeX, 
  ZoomIn, 
  ZoomOut, 
  SunMoon, 
  Keyboard, 
  Type, 
  X, 
  Check, 
  Sparkles, 
  Shuffle, 
  BookOpen, 
  HelpCircle,
  Undo2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

interface AccessibilityPanelProps {
  onPageChange: (page: 'home' | 'news' | 'admin' | 'folder' | 'presidencia' | 'diretorias' | 'galeria' | 'news-detail') => void;
}

export function AccessibilityPanel({ onPageChange }: AccessibilityPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [contrastMode, setContrastMode] = useState(false);
  const [grayscaleMode, setGrayscaleMode] = useState(false);
  const [fontScale, setFontScale] = useState(1.0); // 1.0 = 100%
  const [speechActive, setSpeechActive] = useState(false);
  const [isReadingLineActive, setIsReadingLineActive] = useState(false);
  const [readingLineY, setReadingLineY] = useState(200);
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);
  const [speechLanguage, setSpeechLanguage] = useState('pt-BR');

  // Load saved preferences
  useEffect(() => {
    const savedContrast = localStorage.getItem('acc-contrast') === 'true';
    const savedGrayscale = localStorage.getItem('acc-grayscale') === 'true';
    const savedFontScale = localStorage.getItem('acc-fontscale');
    const savedSpeech = localStorage.getItem('acc-speech') === 'true';
    const savedReadingLine = localStorage.getItem('acc-readingline') === 'true';

    if (savedContrast) {
      setContrastMode(true);
      document.documentElement.classList.add('high-contrast');
    }
    if (savedGrayscale) {
      setGrayscaleMode(true);
      document.documentElement.classList.add('grayscale');
    }
    if (savedFontScale) {
       const scale = parseFloat(savedFontScale);
       setFontScale(scale);
       document.documentElement.style.fontSize = `${scale * 100}%`;
    }
    setSpeechActive(savedSpeech);
    setIsReadingLineActive(savedReadingLine);
  }, []);

  // Sync state modifications with DOM & localStorage
  const toggleContrast = () => {
    const nextValue = !contrastMode;
    setContrastMode(nextValue);
    localStorage.setItem('acc-contrast', String(nextValue));
    
    if (nextValue) {
      document.documentElement.classList.add('high-contrast');
      toast.success('Modo de Alto Contraste ativado para melhor visualização.', { id: 'contrast-t' });
    } else {
      document.documentElement.classList.remove('high-contrast');
      toast.success('Modo de Alto Contraste desativado.', { id: 'contrast-t' });
    }
  };

  const toggleGrayscale = () => {
    const nextValue = !grayscaleMode;
    setGrayscaleMode(nextValue);
    localStorage.setItem('acc-grayscale', String(nextValue));

    if (nextValue) {
      document.documentElement.classList.add('grayscale');
      toast.success('Filtro de Escala de Cinza ativado.', { id: 'gray-t' });
    } else {
      document.documentElement.classList.remove('grayscale');
      toast.success('Filtro de Escala de Cinza desativado.', { id: 'gray-t' });
    }
  };

  const increaseFont = () => {
    const nextScale = Math.min(fontScale + 0.1, 1.5);
    setFontScale(nextScale);
    localStorage.setItem('acc-fontscale', String(nextScale));
    document.documentElement.style.fontSize = `${nextScale * 100}%`;
    toast.success(`Tamanho da fonte aumentado para ${Math.round(nextScale * 100)}%`, { id: 'font-t' });
  };

  const decreaseFont = () => {
    const nextScale = Math.max(fontScale - 0.1, 0.825);
    setFontScale(nextScale);
    localStorage.setItem('acc-fontscale', String(nextScale));
    document.documentElement.style.fontSize = `${nextScale * 100}%`;
    toast.success(`Tamanho da fonte reduzido para ${Math.round(nextScale * 100)}%`, { id: 'font-t' });
  };

  const resetAccessibilitySettings = () => {
    setContrastMode(false);
    setGrayscaleMode(false);
    setFontScale(1.0);
    setSpeechActive(false);
    setIsReadingLineActive(false);

    document.documentElement.classList.remove('high-contrast');
    document.documentElement.classList.remove('grayscale');
    document.documentElement.style.fontSize = '100%';
    
    localStorage.removeItem('acc-contrast');
    localStorage.removeItem('acc-grayscale');
    localStorage.removeItem('acc-fontscale');
    localStorage.removeItem('acc-speech');
    localStorage.removeItem('acc-readingline');

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    toast.success('Preferências de acessibilidade restauradas para o padrão.');
  };

  const toggleSpeechActive = () => {
    const nextValue = !speechActive;
    setSpeechActive(nextValue);
    localStorage.setItem('acc-speech', String(nextValue));

    if (nextValue) {
      toast.info('Leitor de tela do Portal ativado! Clique em qualquer texto ou título para ouvir a leitura de voz.', {
        id: 'speech-tutorial',
        duration: 5000
      });
      speakText('Leitor de tela integrado ativado. Clique em qualquer texto para ouvir.');
    } else {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      toast.success('Leitor de tela desativado.');
    }
  };

  const toggleReadingLine = () => {
    const nextValue = !isReadingLineActive;
    setIsReadingLineActive(nextValue);
    localStorage.setItem('acc-readingline', String(nextValue));
    if (nextValue) {
      toast.success('Régua ou guia visual de leitura ativa. Mova o mouse sobre os conteúdos.');
    }
  };

  // Keyboard Navigation Support & Shortcuts of Brazilian e-MAG standard
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ALT + [1-6] for custom actions
      if (e.altKey) {
        switch (e.key) {
          case '1': // Alt+1: Ir para a Home
            e.preventDefault();
            onPageChange('home');
            toast.success('Navegando para: Início (Home)', { id: 'shortcut-nav' });
            break;
          case '2': // Alt+2: Ir para Notícias
            e.preventDefault();
            onPageChange('news');
            toast.success('Navegando para: Notícias', { id: 'shortcut-nav' });
            break;
          case '3': // Alt+3: Abrir Painel de Acessibilidade
            e.preventDefault();
            setIsOpen(prev => !prev);
            break;
          case '4': // Alt+4: Alternar Alto Contraste
            e.preventDefault();
            toggleContrast();
            break;
          case '5': // Alt+5: Alternar Áudio/Leitor Integrado
            e.preventDefault();
            toggleSpeechActive();
            break;
          case '6': // Alt+6: Resetar Acessibilidade
            e.preventDefault();
            resetAccessibilitySettings();
            break;
          default:
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [contrastMode, grayscaleMode, fontScale, speechActive, isReadingLineActive]);

  // Handle Reading Guide Line Mouse tracking
  useEffect(() => {
    if (!isReadingLineActive) return;

    const handleMouseMove = (e: MouseEvent) => {
      setReadingLineY(e.clientY);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [isReadingLineActive]);

  // Click-to-Speech Core Engine
  const speakText = (text: string) => {
    if (!('speechSynthesis' in window)) {
      toast.error('Navegador não suporta a síntese de voz (TTS).');
      return;
    }

    try {
      window.speechSynthesis.cancel(); // Stop playing current speech queue

      if (!text || text.trim() === '') return;

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = speechLanguage;
      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      // Prioritize Brazilian Portuguese voice if speaking is in pt-BR
      const voices = window.speechSynthesis.getVoices();
      const ptBRVoice = voices.find(v => v.lang.includes('pt-BR') || v.lang.includes('pt_BR'));
      if (ptBRVoice) {
        utterance.voice = ptBRVoice;
      }

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.error('Speech synthesis failure:', err);
    }
  };

  // Capture click events globally when Speech Engine is active
  useEffect(() => {
    if (!speechActive) return;

    const handleDocumentClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;

      // Prevent Speech on clicking the accessibility widgets, sidebars, or interactive input fields
      const isAccWidget = target.closest('#acc-section') || target.closest('[vw]') || target.closest('input') || target.closest('textarea') || target.closest('select');
      if (isAccWidget) return;

      // Extract text content cleanly
      let speakableContent = '';

      if (target.getAttribute('alt')) {
        speakableContent = `Imagem: ${target.getAttribute('alt')}`;
      } else if (target.innerText) {
        // Limit text length to prevent speaking whole pages unexpectedly
        const maxWords = target.innerText.substring(0, 300);
        speakableContent = maxWords;
      }

      if (speakableContent.trim() !== '') {
        speakText(speakableContent);
        
        // Brief visual border indicator
        target.classList.add('speak-indicator');
        setTimeout(() => {
          target.classList.remove('speak-indicator');
        }, 1200);
      }
    };

    document.addEventListener('click', handleDocumentClick, true);
    return () => document.removeEventListener('click', handleDocumentClick, true);
  }, [speechActive]);

  // Brazilian VLibras 3D Avatar Dynamic Ingestion
  useEffect(() => {
    // Check if VLibras script is already injected
    if (document.getElementById('vlibras-script')) return;

    try {
      // 1. Create main DIV container for VLibras
      const divContainer = document.createElement('div');
      divContainer.setAttribute('vw', 'true');
      divContainer.className = 'enabled';
      divContainer.id = 'vlibras-widget-container';

      const divBtn = document.createElement('div');
      divBtn.setAttribute('vw-access-button', 'true');
      divBtn.className = 'active';

      const divWrapper = document.createElement('div');
      divWrapper.setAttribute('vw-plugin-wrapper', 'true');

      const divTopWrapper = document.createElement('div');
      divTopWrapper.className = 'vw-plugin-top-wrapper';

      divWrapper.appendChild(divTopWrapper);
      divContainer.appendChild(divBtn);
      divContainer.appendChild(divWrapper);
      document.body.appendChild(divContainer);

      // 2. Load VLibras Plugin Javascript script
      const script = document.createElement('script');
      script.id = 'vlibras-script';
      script.src = 'https://vlibras.gov.br/app/vlibras-plugin.js';
      script.async = true;
      script.onload = () => {
        try {
          // @ts-ignore
          if (window.VLibras) {
            // @ts-ignore
            new window.VLibras.Widget('https://vlibras.gov.br/app');
          }
        } catch (e) {
          console.error("Vlibras widget initialization error: ", e);
        }
      };

      document.body.appendChild(script);
    } catch (err) {
      console.error('Failed loading VLibras script: ', err);
    }
  }, []);

  return (
    <div id="acc-section" className="relative">
      
      {/* 1. TOP STATS BAR INTEGRATION (e-MAG Compliant accessibility shortcut links) */}
      <div 
        id="acc-top-shortcut-bar" 
        className="w-full bg-[#002202] text-white/95 text-[10px] font-bold px-6 py-2 flex flex-wrap items-center justify-between gap-4 border-b border-white/5 relative z-50 shadow-sm"
      >
        <div id="acc-shortcuts-legend" className="flex items-center gap-4">
          <span className="text-[#bfdfc4] font-black uppercase tracking-wider">Atalhos do Portal:</span>
          <span className="flex items-center gap-1"><kbd className="bg-white/10 px-1 border border-white/20 rounded">Alt + 1</kbd> Início</span>
          <span className="flex items-center gap-1"><kbd className="bg-white/10 px-1 border border-white/20 rounded">Alt + 2</kbd> Notícias</span>
          <span className="flex items-center gap-1"><kbd className="bg-white/10 px-1 border border-white/20 rounded">Alt + 3</kbd> Abrir Acessibilidade</span>
          <span className="flex items-center gap-1"><kbd className="bg-white/10 px-1 border border-white/20 rounded">Alt + 4</kbd> Alto Contraste</span>
          <span className="flex items-center gap-1"><kbd className="bg-white/10 px-1 border border-white/20 rounded">Alt + 5</kbd> Ouvir Áudio</span>
        </div>

        <div id="acc-top-links-block" className="flex items-center gap-4">
          <button 
            id="acc-topbar-faq-btn"
            onClick={() => setShowShortcutsHelp(true)}
            className="text-white hover:text-green-300 transition-colors uppercase tracking-widest text-[9px] flex items-center gap-1.5"
          >
            <Keyboard className="w-3.5 h-3.5" />
            Guia de Teclado
          </button>
          
          <button
            id="acc-topbar-contrast-btn"
            onClick={toggleContrast}
            className={`px-3 py-1 rounded border transition-all uppercase tracking-widest text-[9px] font-black flex items-center gap-1 ${
              contrastMode 
                ? 'bg-yellow-400 text-black border-yellow-400' 
                : 'text-white border-white/20 hover:bg-white/10'
            }`}
          >
            <SunMoon className="w-3 h-3" />
            Contraste
          </button>
        </div>
      </div>

      {/* 2. FLOATING FLOATING ACCESSIBILITY FAB BUTTON */}
      <button
        id="acc-fab-control-trigger"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 left-6 w-14 h-14 bg-[#0a8019] text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-50 group border border-white/20"
        title="Menu de Acessibilidade (Alt + 3)"
        aria-label="Configurações de acessibilidade para visão e audição"
      >
        <Accessibility className="w-7 h-7" />
        <span className="absolute left-full ml-2 px-3 py-1 bg-black/85 text-[10px] text-white rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none uppercase tracking-wider font-extrabold shadow-md">
          Acessibilidade
        </span>
      </button>

      {/* 3. SIDE SIDE PANEL / DRAWER */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop cover */}
            <motion.div
              id="acc-backdrop-cover"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[80]"
            />

            {/* Slider Drawer content (Alt+3 Panel) */}
            <motion.div
              id="acc-drawer-panel"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed top-0 left-0 h-full w-[360px] max-w-[90vw] bg-white text-secondary z-[90] shadow-2xl p-6 flex flex-col justify-between overflow-y-auto"
            >
              <div id="acc-drawer-header-block">
                
                {/* Header panel details */}
                <div id="acc-header-main" className="flex items-center justify-between mb-8 pb-4 border-b border-primary/10">
                  <div id="acc-header-title-block" className="flex items-center gap-3">
                    <div id="acc-header-icon-box" className="w-10 h-10 bg-primary/15 rounded-xl flex items-center justify-center text-primary">
                      <Accessibility className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-headline font-black text-base text-primary uppercase tracking-wide leading-none">Acessibilidade</h3>
                      <p className="text-[10px] text-[#4f5e80] font-bold uppercase tracking-widest mt-1">Multiacesso e Voz</p>
                    </div>
                  </div>
                  <button 
                    id="acc-drawer-close-btn"
                    onClick={() => setIsOpen(false)} 
                    className="p-2 rounded-xl hover:bg-primary/5 text-primary/70 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Body settings area */}
                <div id="acc-setting-options-grid" className="space-y-6">
                  
                  {/* Option: Font Resizing */}
                  <div id="acc-block-text-size" className="p-4 rounded-3xl bg-surface-container-low border border-primary/5">
                    <div id="acc-opt-label-text" className="flex items-center justify-between mb-3">
                      <span className="text-xs font-headline font-black text-primary uppercase tracking-wider flex items-center gap-2">
                        <Type className="w-4 h-4 opacity-75" />
                        Tamanho do Texto
                      </span>
                      <span className="text-[10px] font-extrabold px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                        {Math.round(fontScale * 100)}%
                      </span>
                    </div>
                    <div id="acc-button-group-text-size" className="grid grid-cols-2 gap-2">
                      <button
                        id="acc-btn-decrease-text"
                        onClick={decreaseFont}
                        className="py-2.5 rounded-2xl bg-white border border-primary/10 flex items-center justify-center gap-2 hover:bg-primary/5 text-xs font-bold text-primary shadow-sm hover:border-primary-container"
                        title="Diminuir letras"
                      >
                        <ZoomOut className="w-4 h-4" />
                        Diminuir
                      </button>
                      <button
                        id="acc-btn-increase-text"
                        onClick={increaseFont}
                        className="py-2.5 rounded-2xl bg-white border border-primary/10 flex items-center justify-center gap-2 hover:bg-primary/5 text-xs font-bold text-primary shadow-sm hover:border-primary-container"
                        title="Aumentar letras"
                      >
                        <ZoomIn className="w-4 h-4" />
                        Aumentar
                      </button>
                    </div>
                  </div>

                  {/* Option: Speech / Voice Reader */}
                  <div id="acc-block-voice-reader" className="p-4 rounded-3xl bg-surface-container-low border border-primary/5">
                    <div id="acc-opt-label-voice" className="flex items-center justify-between mb-2">
                      <span className="text-xs font-headline font-black text-primary uppercase tracking-wider flex items-center gap-2">
                        <Volume2 className="w-4 h-4 opacity-75" />
                        Leitor de Áudio e Voz
                      </span>
                      <span className={`w-3 h-3 rounded-full ${speechActive ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
                    </div>
                    <p className="text-[10px] text-[#4f5e80] mb-3 leading-normal font-medium pr-1">
                      Ideal para pessoas com **deficiência visual**. Ao ativar, clique em qualquer bloco de texto do Portal para que seja lido em áudio em português.
                    </p>
                    <button
                      id="acc-btn-speech-toggle"
                      onClick={toggleSpeechActive}
                      className={`w-full py-3 rounded-2xl font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-sm ${
                        speechActive 
                          ? 'bg-primary text-white hover:bg-primary' 
                          : 'bg-white text-primary border border-primary/10 hover:bg-primary/5 hover:border-primary'
                      }`}
                    >
                      {speechActive ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                      {speechActive ? 'Desativar Leitor de Tela' : 'Ativar Leitor de Áudio'}
                    </button>
                  </div>

                  {/* Option: Design Overrides Contrast / Grayscale */}
                  <div id="acc-block-theme-overrides" className="p-4 rounded-3xl bg-surface-container-low border border-primary/5">
                    <span className="text-xs font-headline font-black text-primary uppercase tracking-wider flex items-center gap-2 mb-3">
                      <SunMoon className="w-4 h-4 opacity-75" />
                      Visual & Contraste
                    </span>
                    
                    <div id="acc-overrides-list" className="space-y-2">
                      {/* Contrast Toggle Button */}
                      <button
                        id="acc-btn-contrast-override"
                        onClick={toggleContrast}
                        className={`w-full p-3 rounded-2xl flex items-center justify-between font-bold text-xs border transition-all ${
                          contrastMode 
                            ? 'bg-yellow-400 text-black border-yellow-400' 
                            : 'bg-white text-secondary border-[#4f5e80]/10 hover:bg-primary/5 hover:text-primary hover:border-primary/20'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <Check className={`w-4 h-4 ${contrastMode ? 'opacity-100' : 'opacity-0'}`} />
                          Alto Contraste Visual
                        </span>
                        <span className="text-[9px] uppercase tracking-wider font-extrabold opacity-60">Alt + 4</span>
                      </button>

                      {/* Monochromatic grayscale Button */}
                      <button
                        id="acc-btn-grayscale-override"
                        onClick={toggleGrayscale}
                        className={`w-full p-3 rounded-2xl flex items-center justify-between font-bold text-xs border transition-all ${
                          grayscaleMode 
                            ? 'bg-primary text-white border-primary' 
                            : 'bg-white text-secondary border-[#4f5e80]/10 hover:bg-primary/5 hover:text-primary hover:border-primary/20'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <Check className={`w-4 h-4 ${grayscaleMode ? 'opacity-100' : 'opacity-0'}`} />
                          Monocromático (Cinza)
                        </span>
                        <span className="text-[9px] uppercase tracking-wider font-extrabold opacity-60">Daltonismo</span>
                      </button>
                    </div>
                  </div>

                  {/* Option: Reading line aid (Guia de leitura) */}
                  <div id="acc-block-reading-line" className="p-4 rounded-3xl bg-surface-container-low border border-primary/5">
                    <div id="acc-opt-label-rline" className="flex items-center justify-between mb-2">
                      <span className="text-xs font-headline font-black text-primary uppercase tracking-wider flex items-center gap-2">
                        <BookOpen className="w-4 h-4 opacity-75" />
                        Guia de Leitura Visual
                      </span>
                      <span className={`w-3 h-3 rounded-full ${isReadingLineActive ? 'bg-primary' : 'bg-gray-300'}`} />
                    </div>
                    <p className="text-[10px] text-[#4f5e80] mb-3 leading-normal font-medium">
                      Exibe uma régua visual amarela horizontal que segue o cursor para auxiliar na concentração e foco da leitura.
                    </p>
                    <button
                      id="acc-btn-toggle-rline"
                      onClick={toggleReadingLine}
                      className={`w-full py-2.5 rounded-2xl font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-sm ${
                        isReadingLineActive 
                          ? 'bg-[#00640f]/10 text-[#00640f] border border-[#00640f]/20' 
                          : 'bg-white text-secondary border border-[#4f5e80]/10 hover:bg-primary/5 hover:text-primary hover:border-primary/20'
                      }`}
                    >
                      {isReadingLineActive ? 'Desativar Régua Guia' : 'Ativar Régua Guia'}
                    </button>
                  </div>

                </div>
              </div>

              {/* Reset accessibility options at the bottom of panel */}
              <div id="acc-drawer-footer-block" className="mt-8 pt-4 border-t border-primary/10">
                <button
                  id="acc-btn-reset-all"
                  onClick={resetAccessibilitySettings}
                  className="w-full py-3 rounded-2xl bg-red-500/10 hover:bg-red-500/15 text-red-600 font-extrabold text-xs tracking-wider transition-all uppercase flex items-center justify-center gap-2"
                >
                  <Undo2 className="w-4 h-4" />
                  Restaurar Padrão
                </button>
                <p id="acc-footer-credit" className="text-[9px] text-center text-secondary/40 font-bold uppercase tracking-widest mt-4">
                  ITERAIMA • PORTAL ACESSÍVEL
                </p>
              </div>

            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 4. MODAL: KEYBOARD SHORTCUTS GUIDE DETAILS */}
      <AnimatePresence>
        {showShortcutsHelp && (
          <>
            {/* Backdrop */}
            <motion.div
              id="acc-guide-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowShortcutsHelp(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[95]"
            />
            {/* Modal dialog */}
            <motion.div
              id="acc-guide-modal"
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.95 }}
              className="fixed inset-x-4 top-[10%] mx-auto max-w-lg bg-white rounded-[2.5rem] shadow-2xl border border-primary/10 p-6 z-[100] flex flex-col overflow-hidden"
            >
              <div id="acc-modal-header" className="flex items-center justify-between pb-4 border-b border-primary/10 mb-6">
                <div id="acc-modal-title" className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#00640f]/10 rounded-2xl flex items-center justify-center text-[#00640f]">
                    <Keyboard className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-headline font-black text-lg text-primary uppercase tracking-wide leading-none">Acessibilidade do Teclado</h3>
                    <p className="text-[10px] text-secondary font-bold uppercase tracking-widest mt-1">Regras de Acesso e Navegação e-MAG</p>
                  </div>
                </div>
                <button 
                  id="acc-modal-close"
                  onClick={() => setShowShortcutsHelp(false)}
                  className="p-2 rounded-full hover:bg-primary/5 text-primary"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div id="acc-modal-body" className="space-y-4 max-h-[50vh] overflow-y-auto pr-2">
                <p className="text-xs text-secondary/80 leading-relaxed font-medium">
                  Este portal segue as diretrizes do **e-MAG (Modelo de Acessibilidade em Governo Eletrônico)**, garantindo que usuários com limitações motoras ou visuais naveguem livremente pelo teclado utilizando a tecla <kbd className="bg-primary/5 px-1 border border-primary/15 rounded">Tab</kbd>, <kbd className="bg-primary/5 px-1 border border-primary/15 rounded">Shift + Tab</kbd> e as teclas de atalho:
                </p>

                <div id="acc-modal-shortcuts-list" className="space-y-2.5">
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-surface-container-low border border-primary/5">
                    <span className="text-xs font-bold text-secondary">Voltar / Ir para Página Inicial (Home)</span>
                    <kbd className="bg-[#002202] text-white px-2 py-1 text-[10px] font-extrabold rounded border border-white/15">Alt + 1</kbd>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-2xl bg-surface-container-low border border-primary/5">
                    <span className="text-xs font-bold text-secondary">Navegar para a seção de Notícias</span>
                    <kbd className="bg-[#002202] text-white px-2 py-1 text-[10px] font-extrabold rounded border border-white/15">Alt + 2</kbd>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-2xl bg-surface-container-low border border-[#00640f]/20">
                    <span className="text-xs font-bold text-[#00640f] flex items-center gap-1.5 font-black">
                      <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                      Visualizar Menu de Acessibilidade completo
                    </span>
                    <kbd className="bg-[#002202] text-white px-2 py-1 text-[10px] font-extrabold rounded border border-white/15">Alt + 3</kbd>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-2xl bg-surface-container-low border border-primary/5">
                    <span className="text-xs font-bold text-secondary">Ativar / Desativar Alto Contraste</span>
                    <kbd className="bg-[#002202] text-white px-2 py-1 text-[10px] font-extrabold rounded border border-white/15">Alt + 4</kbd>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-2xl bg-surface-container-low border border-primary/5">
                    <span className="text-xs font-bold text-secondary">Ativar / Desativar Leitor de Tela de Voz</span>
                    <kbd className="bg-[#002202] text-white px-2 py-1 text-[10px] font-extrabold rounded border border-white/15">Alt + 5</kbd>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-2xl bg-surface-container-low border border-primary/5">
                    <span className="text-xs font-bold text-secondary">Restaurar ajustes aos valores padrões</span>
                    <kbd className="bg-[#002202] text-white px-2 py-1 text-[10px] font-extrabold rounded border border-white/15">Alt + 6</kbd>
                  </div>
                </div>

                <p className="text-[10px] text-secondary/60 leading-relaxed font-bold uppercase mt-4">
                  * Observação para usuários macOS: Utilize as combinações de teclado correspondentes do seu sistema operacional.
                </p>
              </div>

              <div id="acc-modal-footer" className="mt-6 pt-4 border-t border-primary/10 flex justify-end">
                <button
                  id="acc-guide-confirm-btn"
                  onClick={() => setShowShortcutsHelp(false)}
                  className="px-6 py-2.5 rounded-full bg-primary text-white font-bold text-xs tracking-wide uppercase hover:scale-105 active:scale-95 transition-all"
                >
                  Entendi
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 5. VISUAL GUIDELINE AID OVERLAY (Cursor tracking ruler ruler bar) */}
      {isReadingLineActive && (
        <div
          id="acc-reading-line-guide"
          className="fixed left-0 right-0 h-9 bg-yellow-400/22 pointer-events-none z-[999] border-y-[2.5px] border-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.2)]"
          style={{ top: `${readingLineY - 18}px` }}
        />
      )}

      {/* 6. SPEAK SPEECH INDICATOR STYLE DEFINITION OVERLAY */}
      <style>{`
        .speak-indicator {
          outline: 3px dashed #fc8181 !important;
          outline-offset: 4px !important;
          background-color: rgba(254, 178, 178, 0.15) !important;
          transition: all 0.2s ease-in-out;
        }
        /* Custom accessibility contrast mode classes */
        .high-contrast {
          background-color: #000000 !important;
          color: #ffffff !important;
        }
        .high-contrast input,
        .high-contrast textarea,
        .high-contrast select {
          border: 2.5px solid #ffffff !important;
          background-color: #000000 !important;
          color: #ffffff !important;
        }
        /* Custom grayscale mode */
        .grayscale {
          filter: grayscale(100%) !important;
        }
      `}</style>

    </div>
  );
}
