'use client';

import React, { useState, useEffect } from 'react';
import { websocketService } from '../../lib/websocket';

interface WebSocketDebuggerProps {
  isConnected: boolean;
  isAuthenticated: boolean;
  reconnectAttempts: number;
  onConnect: () => Promise<void>;
  onAuthenticate: () => Promise<boolean>;
  onForceReconnect: () => Promise<void>;
  onRequestStatus: () => void;
  onForceAuthenticated: (value?: boolean) => boolean;
  onReloadPage: () => void;
}

const WebSocketDebugger: React.FC<WebSocketDebuggerProps> = ({
  isConnected,
  isAuthenticated,
  reconnectAttempts,
  onConnect,
  onAuthenticate,
  onForceReconnect,
  onRequestStatus,
  onForceAuthenticated,
  onReloadPage
}) => {
  // Estado para guardar logs
  const [logs, setLogs] = useState<string[]>([]);
  const [statusData, setStatusData] = useState<any>(null);
  
  // Adicionar um log
  const addLog = (message: string) => {
    const timestamp = new Date().toISOString().split('T')[1].slice(0, -1);
    setLogs((prevLogs) => [
      `[${timestamp}] ${message}`, 
      ...prevLogs.slice(0, 49)
    ]);
  };
  
  // Limpar logs
  const clearLogs = () => {
    setLogs([]);
  };
  
  // Adicionar logs para eventos de WebSocket
  useEffect(() => {
    const handleOpen = () => {
      addLog('📡 WebSocket conectado com sucesso');
    };

    const handleClose = (data: any) => {
      addLog(`❌ WebSocket desconectado: Código ${data.code || 'n/a'}, Razão: ${data.reason || 'n/a'}`);
    };

    const handleAuth = (data: any) => {
      if (data.status === 'success' || data.data?.success === true) {
        addLog('🔑 Autenticação WebSocket bem-sucedida');
      } else {
        addLog(`❌ Falha na autenticação WebSocket: ${JSON.stringify(data)}`);
      }
    };

    const handleError = (error: any) => {
      addLog(`⚠️ Erro WebSocket: ${error.message || JSON.stringify(error)}`);
    };
    
    const handleStatus = (data: any) => {
      setStatusData(data);
      addLog(`📊 Status recebido: ${data.statistics ? 'Com estatísticas' : 'Sem estatísticas'}`);
      
      if (data.statistics) {
        addLog(`📈 Total de oportunidades: ${data.statistics.total_oportunidades}`);
      }
      
      if (data.recent_opportunities) {
        addLog(`🔄 Oportunidades recentes: ${data.recent_opportunities.length}`);
      }
    };

    // Registrar listeners
    websocketService.on('open', handleOpen);
    websocketService.on('close', handleClose);
    websocketService.on('auth', handleAuth);
    websocketService.on('error', handleError);
    websocketService.on('status', handleStatus);

    // Limpar listeners ao desmontar
    return () => {
      websocketService.off('open', handleOpen);
      websocketService.off('close', handleClose);
      websocketService.off('auth', handleAuth);
      websocketService.off('error', handleError);
      websocketService.off('status', handleStatus);
    };
  }, []);

  return (
    <div className="mt-8 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">WebSocket Debugger</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <div className="bg-white dark:bg-gray-700 p-3 rounded shadow">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Status</h3>
          <div className="flex items-center mt-1">
            <div className={`h-3 w-3 rounded-full mr-2 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <p className="text-gray-600 dark:text-gray-300">{isConnected ? 'Conectado' : 'Desconectado'}</p>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-700 p-3 rounded shadow">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Autenticação</h3>
          <div className="flex items-center mt-1">
            <div className={`h-3 w-3 rounded-full mr-2 ${isAuthenticated ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <p className="text-gray-600 dark:text-gray-300">{isAuthenticated ? 'Autenticado' : 'Não autenticado'}</p>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-700 p-3 rounded shadow">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Reconexões</h3>
          <p className="text-gray-600 dark:text-gray-300 mt-1">{reconnectAttempts} tentativas</p>
        </div>
        
        <div className="bg-white dark:bg-gray-700 p-3 rounded shadow">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Status de Dados</h3>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            {statusData ? 'Dados recebidos' : 'Sem dados'}
          </p>
        </div>
      </div>
      
      {/* Status Data */}
      {statusData && (
        <div className="mb-4 p-3 bg-white dark:bg-gray-700 rounded shadow">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Dados de Status</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
            <div>
              <span className="font-medium">Total de oportunidades:</span> {statusData.statistics?.total_oportunidades || 0}
            </div>
            <div>
              <span className="font-medium">Oportunidades recentes:</span> {statusData.recent_opportunities?.length || 0}
            </div>
            <div>
              <span className="font-medium">Config. carregada:</span> {statusData.config ? 'Sim' : 'Não'}
            </div>
            <div className="col-span-3 text-gray-500">
              Recebido em: {new Date().toLocaleTimeString()}
            </div>
          </div>
        </div>
      )}
      
      {/* Ações */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={onConnect}
          disabled={isConnected}
          className="px-3 py-1 bg-blue-600 text-white text-sm rounded disabled:bg-blue-300 disabled:cursor-not-allowed"
        >
          Conectar
        </button>
        
        <button
          onClick={onAuthenticate}
          disabled={!isConnected || isAuthenticated}
          className="px-3 py-1 bg-green-600 text-white text-sm rounded disabled:bg-green-300 disabled:cursor-not-allowed"
        >
          Autenticar
        </button>
        
        <button
          onClick={onForceReconnect}
          className="px-3 py-1 bg-orange-600 text-white text-sm rounded"
        >
          Forçar Reconexão
        </button>
        
        <button
          onClick={onRequestStatus}
          disabled={!isConnected}
          className="px-3 py-1 bg-purple-600 text-white text-sm rounded disabled:bg-purple-300 disabled:cursor-not-allowed"
        >
          Solicitar Status
        </button>
        
        <button
          onClick={() => onForceAuthenticated(true)}
          className="px-3 py-1 bg-yellow-600 text-white text-sm rounded"
        >
          Forçar Autenticação
        </button>
        
        <button
          onClick={onReloadPage}
          className="px-3 py-1 bg-gray-600 text-white text-sm rounded"
        >
          Recarregar Página
        </button>
        
        <button
          onClick={clearLogs}
          className="px-3 py-1 bg-red-600 text-white text-sm rounded"
        >
          Limpar Logs
        </button>
      </div>
      
      {/* Logs */}
      <div className="border border-gray-300 dark:border-gray-600 rounded bg-black overflow-auto h-60">
        <div className="p-2 font-mono text-xs text-green-400">
          {logs.length > 0 ? (
            logs.map((log, index) => (
              <div key={index}>{log}</div>
            ))
          ) : (
            <div className="text-gray-500">Nenhum log para exibir</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WebSocketDebugger;