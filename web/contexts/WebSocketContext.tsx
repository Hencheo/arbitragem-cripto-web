'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { websocketService } from '../lib/websocket';

// Tipos para o contexto
interface WebSocketContextType {
  isConnected: boolean;
  isAuthenticated: boolean;
  reconnectAttempts: number;
  connect: () => Promise<void>;
  disconnect: () => void;
  authenticate: () => Promise<boolean>;
  forceReconnect: () => Promise<void>;
  requestSystemStatus: () => void;
  forceAuthenticated: (value?: boolean) => boolean;
  reloadPage: () => void;
}

// Valor padrão do contexto
const defaultContextValue: WebSocketContextType = {
  isConnected: false,
  isAuthenticated: false,
  reconnectAttempts: 0,
  connect: async () => {},
  disconnect: () => {},
  authenticate: async () => false,
  forceReconnect: async () => {},
  requestSystemStatus: () => {},
  forceAuthenticated: () => false,
  reloadPage: () => {},
};

// Criar o contexto
const WebSocketContext = createContext<WebSocketContextType>(defaultContextValue);

// Hook personalizado para usar o contexto
export const useWebSocketContext = () => useContext(WebSocketContext);

// Provedor do contexto
export const WebSocketProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  // Estado
  const [isConnected, setIsConnected] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  // Inicializar conexão WebSocket ao montar o componente
  useEffect(() => {
    // Conectar ao WebSocket
    websocketService.connect();

    // Configurar listeners de eventos
    const openListener = () => {
      setIsConnected(true);
      // Tentar autenticar automaticamente
      websocketService.authenticate();
    };

    const closeListener = (data: any) => {
      setIsConnected(false);
      setIsAuthenticated(false);
      if (data && data.code) {
        setReconnectAttempts(prev => prev + 1);
      }
    };

    const authListener = (data: any) => {
      // Atualizar estado baseado na resposta de autenticação
      if (data.status === 'success' || data.data?.success === true) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
    };

    // Registrar listeners
    websocketService.on('open', openListener);
    websocketService.on('close', closeListener);
    websocketService.on('auth', authListener);

    // Limpar listeners ao desmontar
    return () => {
      websocketService.off('open', openListener);
      websocketService.off('close', closeListener);
      websocketService.off('auth', authListener);
    };
  }, []);

  // Função para conectar ao WebSocket
  const connect = useCallback(async () => {
    await websocketService.connect();
  }, []);

  // Função para desconectar do WebSocket
  const disconnect = useCallback(() => {
    websocketService.disconnect();
  }, []);

  // Função para autenticar
  const authenticate = useCallback(async () => {
    return await websocketService.authenticate();
  }, []);

  // Função para forçar reconexão
  const forceReconnect = useCallback(async () => {
    await websocketService.forceReconnect();
  }, []);

  // Função para solicitar status do sistema
  const requestSystemStatus = useCallback(() => {
    websocketService.requestSystemStatus();
  }, []);

  // Função para forçar estado de autenticação (apenas para depuração)
  const forceAuthenticated = useCallback((value: boolean = true) => {
    return websocketService.forceAuthenticated(value);
  }, []);

  // Função para recarregar a página
  const reloadPage = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  }, []);

  // Valor do contexto
  const contextValue: WebSocketContextType = {
    isConnected,
    isAuthenticated,
    reconnectAttempts,
    connect,
    disconnect,
    authenticate,
    forceReconnect,
    requestSystemStatus,
    forceAuthenticated,
    reloadPage,
  };

  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
    </WebSocketContext.Provider>
  );
};

export default WebSocketContext;