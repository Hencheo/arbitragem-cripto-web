'use client';

import React from 'react';
import { useArbitrageContext } from '../contexts/ArbitrageContext';
import { useWebSocketContext } from '../contexts/WebSocketContext';
import CryptoDashboard from '../components/dashboard/CryptoDashboard';
import WebSocketDebugger from '../components/Debug/WebSocketDebugger';

const DashboardContainer: React.FC = () => {
  // Usar os contextos para obter dados e funcionalidades
  const {
    opportunities,
    recentOpportunities,
    statistics,
    loading,
    lastUpdate,
    error
  } = useArbitrageContext();
  
  const {
    isConnected,
    isAuthenticated,
    reconnectAttempts,
    connect,
    authenticate,
    forceReconnect,
    requestSystemStatus,
    forceAuthenticated,
    reloadPage
  } = useWebSocketContext();

  // Renderizar o componente do dashboard com os dados
  return (
    <div className="space-y-6">
      <CryptoDashboard 
        opportunities={recentOpportunities}
        statistics={statistics}
        loading={loading}
        lastUpdate={lastUpdate}
        error={error}
      />
      
      {/* Mostrar depurador apenas em ambiente de desenvolvimento */}
      {process.env.NODE_ENV === 'development' && (
        <WebSocketDebugger 
          isConnected={isConnected}
          isAuthenticated={isAuthenticated}
          reconnectAttempts={reconnectAttempts}
          onConnect={connect}
          onAuthenticate={authenticate}
          onForceReconnect={forceReconnect}
          onRequestStatus={requestSystemStatus}
          onForceAuthenticated={forceAuthenticated}
          onReloadPage={reloadPage}
        />
      )}
    </div>
  );
};

export default DashboardContainer;