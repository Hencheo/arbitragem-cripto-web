'use client';

import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import OpportunityCard from './OpportunityCard';

// Tipos
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

interface CryptoDashboardProps {
  opportunities: Opportunity[];
  statistics: Statistics | null;
  loading: boolean;
  lastUpdate: Date | null;
  error: string | null;
}

// Formatador de valores monetários
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

const CryptoDashboard: React.FC<CryptoDashboardProps> = ({
  opportunities,
  statistics,
  loading,
  lastUpdate,
  error
}) => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-center text-gray-800 dark:text-white">
        Dashboard de Arbitragem de Criptomoedas
      </h1>
      
      {/* Status e Estatísticas */}
      <div className="mb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">Status</h3>
          <div className="flex items-center mt-2">
            <div className={`h-3 w-3 rounded-full mr-2 ${loading ? 'bg-yellow-400' : 'bg-green-500'}`}></div>
            <p className="text-gray-600 dark:text-gray-300">{loading ? 'Atualizando...' : 'Online'}</p>
          </div>
          {lastUpdate && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Última atualização: {formatDistanceToNow(lastUpdate, { locale: ptBR, addSuffix: true })}
            </p>
          )}
        </div>
        
        <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">Total de Oportunidades</h3>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-2">
            {statistics?.total_oportunidades || 0}
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">Potencial de Lucro</h3>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-2">
            {statistics?.total_profit ? formatCurrency(statistics.total_profit) : '$0.00'}
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">Spread Médio</h3>
          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-2">
            {statistics?.spread_medio ? `${statistics.spread_medio.toFixed(2)}%` : '0.00%'}
          </p>
        </div>
      </div>
      
      {/* Mensagem de erro */}
      {error && (
        <div className="mb-6 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded">
          <p className="font-bold">Erro</p>
          <p>{error}</p>
        </div>
      )}
      
      {/* Lista de Oportunidades */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">
          Oportunidades Recentes
        </h2>
        
        {loading && opportunities.length === 0 ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : opportunities.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {opportunities.map((opportunity) => (
              <OpportunityCard key={opportunity.id} opportunity={opportunity} />
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 text-center">
            <p className="text-gray-600 dark:text-gray-300">
              Nenhuma oportunidade de arbitragem encontrada no momento.
            </p>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">
              As oportunidades aparecem quando há diferenças de preço significativas entre exchanges.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CryptoDashboard;