'use client';

import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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

interface OpportunityCardProps {
  opportunity: Opportunity;
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

const OpportunityCard: React.FC<OpportunityCardProps> = ({ opportunity }) => {
  const {
    exchange_origem,
    exchange_destino,
    par_moedas,
    preco_origem,
    preco_destino,
    diferenca_percentual,
    data_hora,
    volume_24h,
    status
  } = opportunity;

  // Determinar cor do cartão baseado na diferença percentual
  const getStatusColor = () => {
    if (diferenca_percentual >= 1.5) return 'border-green-500 bg-green-50 dark:bg-green-900/20';
    if (diferenca_percentual >= 0.8) return 'border-blue-500 bg-blue-50 dark:bg-blue-900/20';
    return 'border-gray-300 bg-white dark:bg-gray-800';
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return formatDistanceToNow(date, { locale: ptBR, addSuffix: true });
    } catch (e) {
      return 'Data inválida';
    }
  };

  return (
    <div className={`rounded-lg p-4 shadow-md border-l-4 ${getStatusColor()} transition-transform duration-300 hover:transform hover:scale-105`}>
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-lg font-bold text-gray-800 dark:text-white">{par_moedas}</h3>
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
          status === 'ativa' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 
          'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
        }`}>
          {status === 'ativa' ? 'Ativa' : 'Inativa'}
        </span>
      </div>
      
      <div className="flex justify-between items-center mb-3 text-sm text-gray-600 dark:text-gray-300">
        <div>
          <span className="font-medium">{exchange_origem}</span> → <span className="font-medium">{exchange_destino}</span>
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {formatDate(data_hora)}
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded">
          <div className="text-xs text-gray-500 dark:text-gray-400">Preço Origem</div>
          <div className="font-semibold text-gray-800 dark:text-gray-200">{formatCurrency(preco_origem)}</div>
        </div>
        <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded">
          <div className="text-xs text-gray-500 dark:text-gray-400">Preço Destino</div>
          <div className="font-semibold text-gray-800 dark:text-gray-200">{formatCurrency(preco_destino)}</div>
        </div>
      </div>
      
      <div className="flex justify-between items-center">
        <div>
          <span className="text-xs text-gray-500 dark:text-gray-400">Volume 24h:</span>
          <span className="ml-1 text-sm font-medium text-gray-700 dark:text-gray-300">{formatCurrency(volume_24h)}</span>
        </div>
        <div className="text-lg font-bold text-green-600 dark:text-green-400">
          +{diferenca_percentual.toFixed(2)}%
        </div>
      </div>
    </div>
  );
};

export default OpportunityCard;