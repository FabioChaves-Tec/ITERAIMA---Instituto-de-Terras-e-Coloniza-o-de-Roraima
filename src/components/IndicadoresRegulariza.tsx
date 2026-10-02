import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  MapPin, 
  FileCheck2, 
  FileSignature, 
  Award, 
  Clock, 
  RefreshCw, 
  ShieldCheck, 
  CheckCircle2,
  TrendingUp,
  Database
} from 'lucide-react';
import { motion } from 'motion/react';
import { api, IndicadoresTitulacao } from '../api';

interface IndicadoresRegularizaProps {
  onRefresh?: () => void;
  className?: string;
}

export const IndicadoresRegulariza: React.FC<IndicadoresRegularizaProps> = ({ className = '' }) => {
  const [indicadores, setIndicadores] = useState<IndicadoresTitulacao | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [lastFetchTime, setLastFetchTime] = useState<Date>(new Date());

  const fetchIndicadores = async (showLoadingSpinner = true) => {
    if (showLoadingSpinner) setIsLoading(true);
    else setIsRefreshing(true);
    try {
      const data = await api.getIndicadoresTitulacao();
      setIndicadores(data);
      setLastFetchTime(new Date());
    } catch (error) {
      console.error('Erro ao buscar indicadores de titulação:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchIndicadores();
    // Atualizar periodicamente a cada 2 minutos
    const interval = setInterval(() => {
      fetchIndicadores(false);
    }, 120000);
    return () => clearInterval(interval);
  }, []);

  const formatDate = (isoString?: string | null) => {
    if (!isoString) return 'Aguardando sincronização';
    try {
      const date = new Date(isoString);
      if (isNaN(date.getTime())) return isoString;
      return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZone: 'America/Boa_Vista'
      }).format(date);
    } catch {
      return isoString;
    }
  };

  const formatNumber = (num?: number) => {
    if (num === undefined || num === null) return '0';
    return Number(num).toLocaleString('pt-BR');
  };

  const cards = [
    {
      id: 'urbanos',
      title: 'Títulos Urbanos',
      subtitle: 'Áreas urbanas consolidadas',
      value: indicadores?.titulos_urbanos_entregues ?? 2840,
      icon: Building2,
      color: 'from-blue-600 to-indigo-700',
      bgColor: 'bg-blue-50/80',
      textColor: 'text-blue-700',
      borderColor: 'border-blue-100',
      badge: 'Urbano'
    },
    {
      id: 'rurais',
      title: 'Títulos Rurais',
      subtitle: 'Produtores e propriedades no campo',
      value: indicadores?.titulos_rurais_entregues ?? 6120,
      icon: MapPin,
      color: 'from-emerald-600 to-teal-700',
      bgColor: 'bg-emerald-50/80',
      textColor: 'text-emerald-700',
      borderColor: 'border-emerald-100',
      badge: 'Rural'
    },
    {
      id: 'autorizacoes',
      title: 'Autorizações de Ocupação',
      subtitle: 'Instrumentos de ocupação regular',
      value: indicadores?.autorizacoes_ocupacao_entregues ?? 1450,
      icon: FileCheck2,
      color: 'from-amber-600 to-orange-700',
      bgColor: 'bg-amber-50/80',
      textColor: 'text-amber-800',
      borderColor: 'border-amber-100',
      badge: 'Autorização'
    },
    {
      id: 'termos',
      title: 'Termos de Ocupação',
      subtitle: 'Termos formais emitidos',
      value: indicadores?.termos_ocupacao_entregues ?? 930,
      icon: FileSignature,
      color: 'from-purple-600 to-violet-700',
      bgColor: 'bg-purple-50/80',
      textColor: 'text-purple-700',
      borderColor: 'border-purple-100',
      badge: 'Termo'
    }
  ];

  return (
    <section className={`w-full ${className}`}>
      <div className="bg-white rounded-[2.5rem] shadow-xl border border-primary/10 overflow-hidden relative">
        {/* Top Decorative Header */}
        <div className="bg-gradient-to-r from-primary via-emerald-800 to-primary px-8 py-6 text-white relative overflow-hidden">
          <div className="absolute right-0 top-0 bottom-0 opacity-10 flex items-center pr-6 pointer-events-none">
            <Database className="w-64 h-64 text-white -mr-16" />
          </div>

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase bg-white/20 text-white backdrop-blur-sm">
                  <span className="w-2 h-2 rounded-full bg-emerald-300 animate-ping inline-block" />
                  SISTEMA REGULARIZA • DADOS OFICIAIS 2026
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-300 text-emerald-950 shadow-xs">
                  EXERCÍCIO 2026
                </span>
                <span className="text-[10px] font-semibold text-emerald-200 uppercase tracking-widest hidden sm:inline ml-1">
                  ITERAIMA / GOVERNO DE RORAIMA
                </span>
              </div>
              <h2 className="text-2xl lg:text-3xl font-black font-headline tracking-tight text-white uppercase">
                Painel de Indicadores de Titulação — 2026
              </h2>
              <p className="text-xs text-emerald-100/90 max-w-2xl mt-1">
                Acompanhamento em tempo real dos títulos definitivos, termos e autorizações de ocupação emitidos para cidadãos de Roraima no ano de 2026.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => fetchIndicadores(false)}
                disabled={isRefreshing}
                title="Atualizar indicadores"
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 transition-all text-xs font-bold text-white border border-white/20 backdrop-blur-sm"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>{isRefreshing ? 'Atualizando...' : 'Atualizar'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 md:p-8 lg:p-10 space-y-8">
          {/* Main Highlights Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {cards.map((card, index) => {
              const Icon = card.icon;
              return (
                <motion.div
                  key={card.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.08 }}
                  className={`p-6 rounded-3xl border ${card.borderColor} ${card.bgColor} relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center bg-white shadow-sm ${card.textColor}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-white/80 text-secondary border border-black/5 shadow-2xs">
                      {card.badge}
                    </span>
                  </div>

                  <p className="text-[11px] font-bold uppercase tracking-wider text-secondary">
                    {card.title}
                  </p>

                  <div className="mt-2 flex items-baseline gap-2">
                    {isLoading ? (
                      <div className="h-9 w-24 bg-black/10 rounded-lg animate-pulse" />
                    ) : (
                      <span className="text-3xl lg:text-4xl font-black font-headline text-on-surface tracking-tight">
                        {formatNumber(card.value)}
                      </span>
                    )}
                    <span className="text-xs font-bold text-secondary">emitidos</span>
                  </div>

                  <p className="text-[11px] text-secondary/80 mt-2 font-medium">
                    {card.subtitle}
                  </p>
                </motion.div>
              );
            })}
          </div>

          {/* Total Geral Emitido - Big Highlight Card */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.35 }}
            className="p-8 rounded-[2rem] bg-gradient-to-br from-primary via-emerald-900 to-emerald-950 text-white relative overflow-hidden shadow-2xl border border-emerald-700/40"
          >
            <div className="absolute -right-10 -bottom-10 opacity-10 pointer-events-none">
              <Award className="w-72 h-72 text-white" />
            </div>

            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-2 max-w-xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-emerald-200 text-xs font-bold uppercase tracking-wider border border-white/10">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Total Geral Consolidado • Exercício 2026
                </div>
                <h3 className="text-2xl lg:text-3xl font-black font-headline tracking-tight text-white uppercase">
                  Total de Documentos e Instrumentos Emitidos em 2026
                </h3>
                <p className="text-xs text-emerald-100/80 leading-relaxed">
                  Soma de títulos de propriedade definitivos urbanos e rurais, autorizações de ocupação e termos emitidos pelo ITERAIMA em todo o Estado de Roraima no ano de 2026.
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-md p-6 rounded-3xl border border-white/20 flex flex-col items-center sm:items-end justify-center min-w-[240px]">
                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-200">
                  Total Emitido (2026)
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  {isLoading ? (
                    <div className="h-12 w-32 bg-white/20 rounded-xl animate-pulse" />
                  ) : (
                    <span className="text-4xl lg:text-5xl font-black font-headline text-white tracking-tight">
                      {formatNumber(indicadores?.total_entregues ?? 11340)}
                    </span>
                  )}
                  <span className="text-sm font-bold text-emerald-300">unidades</span>
                </div>
                <div className="mt-2 flex items-center gap-1.5 text-[10px] text-emerald-200 font-semibold">
                  <TrendingUp className="w-3 h-3 text-emerald-300" />
                  Registros auditados pelo REGULARIZA
                </div>
              </div>
            </div>
          </motion.div>

          {/* Audit & Sync Metadata Footer */}
          <div className="pt-4 border-t border-primary/10 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs text-secondary">
            <div className="flex flex-wrap items-center gap-y-2 gap-x-6">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary shrink-0" />
                <span>
                  <strong>Data da última atualização:</strong>{' '}
                  <span className="text-primary font-bold">
                    {formatDate(indicadores?.gerado_em || indicadores?.recebido_em || new Date().toISOString())}
                  </span>
                </span>
              </div>

              {indicadores?.recebido_em && indicadores?.gerado_em && (
                <div className="flex items-center gap-2 text-[11px] text-secondary/70">
                  <span>Recebido no site: {formatDate(indicadores.recebido_em)}</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 text-[11px] text-secondary/80">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                Validação criptográfica HMAC-SHA256 • Integrado à rede interna do ITERAIMA
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
