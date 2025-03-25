'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { websocketService } from '../lib/websocket';

// Tipos para o contexto
interface Opportunity {
  id: number;
  exchange_origem: string;
  exchange_destino: string;
  par_moedas: string;
  preco_origem: number;
  preco_destino: number;
  diferenca_percentual: number;
  data_hora: string;
  volume_24h: number;
  status: string;
}

interface Statistics {
  total_oportunidades: number;
  total_profit?: number;
  volume_total?: number;
  spread_medio?: number;
  oportunidades_por_par?: Record<string, number>;
  oportunidades_por_exchange?: Record<string, number>;
}

interface ArbitrageContextType {
  opportunities: Opportunity[];
  recentOpportunities: Opportunity[];
  statistics: Statistics | null;
  loading: boolean;
  lastUpdate: Date | null;
  error: string | null;
}

// Valor padrão do contexto
const defaultContextValue: ArbitrageContextType = {
  opportunities: [],
  recentOpportunities: [],
  statistics: null,
  loading: true,
  lastUpdate: null,
  error: null,
};

// Criar o contexto
const ArbitrageContext = createContext<ArbitrageContextType>(defaultContextValue);

// Hook personalizado para usar o contexto
export const useArbitrageContext = () => useContext(ArbitrageContext);

// Provedor do contexto
export const ArbitrageProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  // Estado
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [recentOpportunities, setRecentOpportunities] = useState<Opportunity[]>([]);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Efeito para lidar com as atualizações de WebSocket
  useEffect(() => {
    // Tratar novas oportunidades
    const handleOpportunity = (data: any) => {
      if (data && Array.isArray(data)) {
        setOpportunities(data);
        setRecentOpportunities(data.slice(0, 9)); // Mostrar apenas as 9 mais recentes
        setLastUpdate(new Date());
        setLoading(false);
      }
    };

    // Tratar atualizações de status
    const handleStatus = (data: any) => {
      setLoading(false);
      
      if (!data) {
        setError('Dados de status vazios ou inválidos');
        return;
      }
      
      // Atualizar estatísticas
      if (data.statistics) {
        setStatistics(data.statistics);
      }
      
      // Atualizar oportunidades recentes
      if (data.recent_opportunities) {
        setOpportunities(data.recent_opportunities);
        setRecentOpportunities(data.recent_opportunities.slice(0, 9));
      }
      
      setLastUpdate(new Date());
    };

    // Tratar erros
    const handleError = (error: any) => {
      console.error('Erro no WebSocket:', error);
      if (error?.message) {
        setError(`Erro de comunicação: ${error.message}`);
      } else {
        setError('Erro de comunicação com o servidor');
      }
      setLoading(false);
    };

    // Registrar listeners
    websocketService.on('opportunity', handleOpportunity);
    websocketService.on('status', handleStatus);
    websocketService.on('error', handleError);

    // Limpar listeners ao desmontar
    return () => {
      websocketService.off('opportunity', handleOpportunity);
      websocketService.off('status', handleStatus);
      websocketService.off('error', handleError);
    };
  }, []);

  // Valor do contexto
  const contextValue: ArbitrageContextType = {
    opportunities,
    recentOpportunities,
    statistics,
    loading,
    lastUpdate,
    error,
  };

  return (
    <ArbitrageContext.Provider value={contextValue}>
      {children}
    </ArbitrageContext.Provider>
  );
};

export default ArbitrageContext;