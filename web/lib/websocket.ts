import { getSession } from 'next-auth/react';

interface WebSocketMessage {
  type: string;
  data?: any;
  timestamp?: string;
  status?: string;
  user_id?: number;
  message?: string;
}

// URL base do WebSocket - deve ser configurada no .env
const WS_BASE_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/ws';

/**
 * Classe de serviço WebSocket para comunicação com o servidor.
 * Gerencia conexão, autenticação e troca de mensagens.
 */
export class WebSocketService {
  private socket: WebSocket | null = null;
  private isConnected: boolean = false;
  private isAuthenticated: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private pingInterval: NodeJS.Timeout | null = null;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private eventListeners: Record<string, ((data: any) => void)[]> = {
    opportunity: [],
    ticker: [],
    status: [],
    subscription: [],
    auth: [],
    error: [],
    open: [],
    close: [],
    message: [],
  };
  protected authToken: string | null = null;

  // Getters públicos
  getIsConnected() {
    return this.isConnected;
  }

  getIsAuthenticated() {
    return this.isAuthenticated;
  }

  // Conecta ao WebSocket
  async connect() {
    if (typeof window === 'undefined') return;

    try {
      // Se já estiver conectado, não faz nada
      if (this.isConnected && this.socket) {
        console.log("WebSocket já está conectado");
        return;
      }
      
      // Obter token da sessão do usuário
      let wsUrl = WS_BASE_URL;
      
      try {
        const session = await getSession();
        console.log("Sessão obtida:", session ? "Sim" : "Não");
        
        if (session?.access_token) {
          this.authToken = session.access_token;
          console.log("Token de acesso obtido:", this.authToken.substring(0, 20) + "...");
          
          // Adicionar o token como parâmetro de query
          wsUrl = `${WS_BASE_URL}?token=${session.access_token}`;
          console.log("Conectando com token de autenticação");
        } else {
          console.warn("Sem token de autenticação disponível");
        }
      } catch (error) {
        console.warn('Não foi possível obter o token de autenticação:', error);
      }
      
      // Fechar a conexão anterior se existir
      if (this.socket) {
        this.socket.close();
      }
      
      console.log(`Conectando ao WebSocket em: ${wsUrl}`);
      this.socket = new WebSocket(wsUrl);
      
      // Evento de conexão aberta
      this.socket.onopen = () => {
        console.log('WebSocket conectado com sucesso');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this._startPingInterval();
        this._notifyListeners('open', { timestamp: new Date().toISOString() });
        
        // Tentar autenticar se não foi feito na URL
        this._authenticateIfNeeded();
      };
      
      // Evento de mensagem recebida
      this.socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log("Mensagem recebida do WebSocket:", message);
          this._handleMessage(message);
        } catch (error) {
          console.error('Erro ao processar mensagem WebSocket:', error);
        }
      };
      
      // Evento de conexão fechada
      this.socket.onclose = (event) => {
        console.log('WebSocket desconectado', event.code, event.reason);
        this.isConnected = false;
        this.isAuthenticated = false;
        this._clearPingInterval();
        this._notifyListeners('close', { 
          timestamp: new Date().toISOString(),
          code: event.code,
          reason: event.reason 
        });
        
        // Tentar reconectar com backoff exponencial
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          const timeout = Math.min(1000 * 2 ** this.reconnectAttempts, 30000);
          console.log(`Tentando reconectar em ${timeout}ms (tentativa ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})...`);
          this.reconnectTimeout = setTimeout(() => {
            this.reconnectAttempts++;
            this.connect();
          }, timeout);
        } else {
          console.error(`Falha nas reconexões após ${this.maxReconnectAttempts} tentativas.`);
        }
      };
      
      // Evento de erro
      this.socket.onerror = (error) => {
        console.error('Erro na conexão WebSocket:', error);
        this._notifyListeners('error', error);
      };
    } catch (error) {
      console.error('Erro ao criar conexão WebSocket:', error);
    }
  }
  
  // Desconecta do WebSocket
  disconnect() {
    if (this.socket && this.isConnected) {
      this._clearPingInterval();
      
      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout);
        this.reconnectTimeout = null;
      }
      
      this.socket.close();
      this.socket = null;
      this.isConnected = false;
      this.isAuthenticated = false;
    }
  }
  
  // Inscrição para receber atualizações de um par específico
  subscribeToPair(pair: string) {
    if (!this.isConnected || !this.socket) {
      console.error('WebSocket não está conectado');
      return;
    }
    
    this.socket.send(JSON.stringify({
      type: 'subscribe',
      pair: pair
    }));
  }
  
  // Inscrição para receber atualizações de uma exchange específica
  subscribeToExchange(exchange: string) {
    if (!this.isConnected || !this.socket) {
      console.error('WebSocket não está conectado');
      return;
    }
    
    this.socket.send(JSON.stringify({
      type: 'subscribe',
      exchange: exchange
    }));
  }
  
  // Adiciona um listener para um tipo específico de evento
  on(eventType: string, callback: (data: any) => void) {
    if (!this.eventListeners[eventType]) {
      this.eventListeners[eventType] = [];
    }
    
    this.eventListeners[eventType].push(callback);
    
    return () => this.off(eventType, callback);
  }
  
  // Remove um listener específico
  off(eventType: string, callback: (data: any) => void) {
    if (this.eventListeners[eventType]) {
      this.eventListeners[eventType] = this.eventListeners[eventType].filter(
        cb => cb !== callback
      );
    }
  }
  
  // Envia uma mensagem para o servidor WebSocket
  send(data: any) {
    if (!this.isConnected || !this.socket) {
      console.error('WebSocket não está conectado');
      return;
    }
    
    this.socket.send(JSON.stringify(data));
  }
  
  // Método público para tentar autenticação
  async authenticate() {
    if (!this.isConnected || !this.socket) {
      console.log("Não é possível autenticar: WebSocket não está conectado");
      return false;
    }
    
    if (this.isAuthenticated) {
      console.log("WebSocket já está autenticado");
      return true;
    }
    
    try {
      // Se já temos o token, enviar
      if (this.authToken) {
        console.log("Enviando token para autenticação:", this.authToken.substring(0, 20) + "...");
        this.socket.send(JSON.stringify({
          type: 'auth',
          token: this.authToken
        }));
        return true;
      }
      
      // Tentar obter token da sessão
      const session = await getSession();
      if (session?.access_token) {
        this.authToken = session.access_token;
        console.log("Obtido token da sessão, enviando para autenticação:", this.authToken.substring(0, 20) + "...");
        this.socket.send(JSON.stringify({
          type: 'auth',
          token: session.access_token
        }));
        return true;
      } else {
        console.warn("Sem token disponível para autenticação");
        return false;
      }
    } catch (error) {
      console.error("Erro ao tentar autenticar:", error);
      return false;
    }
  }
  
  // Métodos privados para gerenciamento interno
  
  // Autenticar após a conexão se não foi feito na URL
  private async _authenticateIfNeeded() {
    if (!this.isConnected || !this.socket) return;
    
    // Se já estamos autenticados, não precisamos fazer nada
    if (this.isAuthenticated) {
      console.log("WebSocket já autenticado");
      // Após autenticação com sucesso, solicitar dados de status do sistema
      this._requestSystemStatus();
      return;
    }
    
    // Se já temos o authToken
    if (this.authToken) {
      console.log("Enviando token de autenticação:", this.authToken.substring(0, 20) + "...");
      this.socket.send(JSON.stringify({
        type: 'auth',
        token: this.authToken
      }));
      return;
    }
    
    try {
      const session = await getSession();
      if (session?.access_token) {
        this.authToken = session.access_token;
        // Enviar token para autenticação
        console.log("Obtido token de sessão, enviando para autenticação:", this.authToken.substring(0, 20) + "...");
        this.socket.send(JSON.stringify({
          type: 'auth',
          token: session.access_token
        }));
      } else {
        console.warn("Sem token disponível para autenticação");
      }
    } catch (error) {
      console.warn('Não foi possível autenticar o WebSocket após conexão:', error);
    }
  }
  
  // Solicita dados atuais do sistema
  private _requestSystemStatus() {
    if (!this.isConnected || !this.socket) return;
    
    console.log("Solicitando status do sistema após autenticação");
    
    // Incluir o token de autenticação na solicitação para garantir que seja processada corretamente
    if (this.authToken) {
      this.socket.send(JSON.stringify({
        type: 'get_status',
        token: this.authToken // Adicionar o token explicitamente
      }));
    } else {
      // Tentativa sem token (pode falhar se o servidor exigir autenticação)
      this.socket.send(JSON.stringify({
        type: 'get_status'
      }));
    }
  }
  
  // Inicia o intervalo de ping para manter a conexão viva
  private _startPingInterval() {
    this._clearPingInterval();
    
    // Envia ping a cada 30 segundos para manter a conexão ativa
    this.pingInterval = setInterval(() => {
      if (this.isConnected && this.socket) {
        this.socket.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000);
    
    // Adiciona verificação periódica de saúde da conexão a cada 60 segundos
    this.healthCheckInterval = setInterval(() => {
      // Se estamos conectados mas não recebemos resposta de ping por muito tempo, 
      // podemos estar em um estado zombi
      if (this.isConnected) {
        console.log("Verificação de saúde WebSocket: enviando ping de diagnóstico");
        
        try {
          // Tentar enviar um ping
          if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify({ 
              type: 'ping',
              health_check: true,
              timestamp: new Date().toISOString()
            }));
            
            // Verificar também o estado de autenticação
            if (this.isAuthenticated && this.authToken) {
              // Tentar solicitar status como verificação de autenticação
              setTimeout(() => {
                this._requestSystemStatus();
              }, 1000);
            }
          } else {
            // Se o readyState não é OPEN, a conexão está comprometida
            console.warn("Verificação de saúde WebSocket: conexão comprometida, forçando reconexão");
            this.forceReconnect();
          }
        } catch (error) {
          console.error("Erro na verificação de saúde WebSocket:", error);
          // Em caso de erro, forçar reconexão
          this.forceReconnect();
        }
      }
    }, 60000);
  }
  
  // Limpa o intervalo de ping
  private _clearPingInterval() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }
  
  // Processa mensagens recebidas do servidor
  private _handleMessage(message: WebSocketMessage) {
    const { type, data } = message;
    
    switch (type) {
      case 'opportunity':
        this._notifyListeners('opportunity', data);
        break;
      case 'ticker':
        this._notifyListeners('ticker', data);
        break;
      case 'status':
        console.log("Recebido status do sistema:", data ? "com dados" : "sem dados");
        
        // Verificar se os dados são válidos
        if (!data) {
          console.warn("Resposta de status sem dados");
          this._notifyListeners('status', { error: "Sem dados no status" });
          return;
        }
        
        // Log dos dados recebidos para diagnóstico
        console.log("Dados de status:", 
          data.statistics ? "Estatísticas✓" : "Sem estatísticas", 
          data.recent_opportunities ? `Oportunidades(${data.recent_opportunities.length})✓` : "Sem oportunidades",
          data.config ? "Configuração✓" : "Sem configuração"
        );
        
        this._notifyListeners('status', data);
        break;
      case 'subscription':
        this._notifyListeners('subscription', data);
        break;
      case 'auth':
        // Resposta de autenticação
        console.log("Resposta de autenticação recebida:", message);
        
        // Verificar se o status é de sucesso
        const isSuccess = 
          (message.status === "success" || !!message.user_id) || 
          (data && (data.success === true || data.status === "success" || !!data.user_id));
        
        console.log("Resultado da verificação de autenticação:", isSuccess ? "SUCESSO" : "FALHA");
        
        if (isSuccess) {
          console.log("✅ Autenticação WebSocket bem-sucedida!");
          this.isAuthenticated = true;
          
          // Após autenticação com sucesso, solicitar dados de status do sistema
          setTimeout(() => {
            this._requestSystemStatus();
          }, 500);
        } else {
          console.warn("❌ Falha na autenticação WebSocket:", message);
          this.isAuthenticated = false;
        }
        
        this._notifyListeners('auth', message);
        break;
      case 'pong':
        // Resposta ao ping, não precisa fazer nada
        break;
      case 'error':
        console.error("Erro recebido do WebSocket:", message);
        
        // Se o erro for relacionado à autenticação e estivermos marcados como autenticados,
        // pode ser necessário forçar uma reautenticação
        if (this.isAuthenticated && 
            message?.message?.toLowerCase().includes('autent') ||
            message?.data?.message?.toLowerCase().includes('autent')) {
          console.warn("Detectado erro de autenticação. Tentando reautenticar...");
          setTimeout(() => {
            this.authenticate();
          }, 1000);
        }
        
        this._notifyListeners('error', message);
        break;
      default:
        // Em vez de dar erro, apenas log e tentar processar genericamente
        console.log(`Recebida mensagem com tipo não reconhecido: ${type}`, message);
        
        // Se a mensagem parece ser um status, notificar mesmo com tipo desconhecido
        if (data && (data.statistics || data.recent_opportunities || data.config)) {
          console.log("A mensagem parece ser um status do sistema, processando...");
          this._notifyListeners('status', data);
        } else {
          // Notificar como mensagem genérica
          this._notifyListeners('message', message);
        }
        break;
    }
  }
  
  // Notifica os listeners registrados para um evento específico
  private _notifyListeners(eventType: string, data: any) {
    if (this.eventListeners[eventType]) {
      this.eventListeners[eventType].forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Erro no listener de ${eventType}:`, error);
        }
      });
    }
  }

  // Método público para solicitar dados atuais do sistema
  requestSystemStatus() {
    if (!this.isConnected || !this.socket) {
      console.error('WebSocket não está conectado');
      return;
    }
    
    console.log("Solicitando explicitamente dados do sistema");
    
    // Incluir o token de autenticação na solicitação para garantir que seja processada corretamente
    if (this.authToken) {
      this.socket.send(JSON.stringify({
        type: 'get_status',
        token: this.authToken // Adicionar o token explicitamente
      }));
    } else {
      // Tentativa sem token (pode falhar se o servidor exigir autenticação)
      this.socket.send(JSON.stringify({
        type: 'get_status'
      }));
    }
  }
  
  // Método público para forçar uma reconexão e autenticação completa
  async forceReconnect() {
    console.log("Forçando reconexão do WebSocket");
    
    // Desconectar primeiro
    if (this.socket) {
      this.socket.close();
      this.socket = null;
      this.isConnected = false;
      this.isAuthenticated = false;
    }
    
    // Aguardar um pouco e reconectar
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Reconectar
    await this.connect();
    
    // Tentar autenticar
    if (this.isConnected) {
      await this.authenticate();
      
      // Se autenticou, solicita dados
      if (this.isAuthenticated) {
        this.requestSystemStatus();
      }
    }
  }

  // Método para forçar o estado de autenticação (uso apenas para depuração)
  forceAuthenticated(value: boolean = true) {
    console.log(`Forçando estado de autenticação para: ${value ? 'autenticado' : 'não-autenticado'}`);
    this.isAuthenticated = value;
    
    // Enviar uma mensagem de autenticação fictícia para o servidor
    // para garantir que ele também atualize seu estado
    if (value && this.socket && this.isConnected) {
      // Se temos um token real, usar ele
      if (this.authToken) {
        console.log("Enviando token real para autenticação forçada");
        this.socket.send(JSON.stringify({
          type: 'auth',
          token: this.authToken
        }));
      } else {
        // Caso contrário, enviar um token fictício
        console.log("Enviando token fictício para autenticação forçada");
        const fakeToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxLCJlbWFpbCI6InRlc3RlQGV4ZW1wbG8uY29tIiwiZXhwIjoxOTExMDY2MjM2LjMxNDI0Mn0.7rLzuEo6gzfGjA-huzBMqFrhDyLhBwfnWKZJB-THN4E";
        this.authToken = fakeToken;
        this.socket.send(JSON.stringify({
          type: 'auth',
          token: fakeToken
        }));
      }
    }
    
    // Se forçando autenticação, também solicita status automaticamente
    if (value) {
      setTimeout(() => {
        this._requestSystemStatus();
      }, 1000);
    }
    
    this._notifyListeners('auth', {
      type: 'auth',
      status: value ? 'success' : 'error',
      forced: true
    });
    
    return this.isAuthenticated;
  }
}

// Classe de mock para desenvolvimento
export class MockWebSocketService {
  private listeners: ((data: any) => void)[] = [];
  private mockData: any;
  
  constructor() {
    // Criar dados mock estáticos ao inicializar
    this.mockData = this.generateStaticMockData();
  }

  // Enviar dados imediatamente ao conectar
  connect() {
    // Notificar todos os listeners com dados estáticos
    setTimeout(() => {
      this.listeners.forEach(listener => listener(this.mockData));
    }, 100);
  }
  
  disconnect() {
    // Não faz nada, sem intervalos para limpar
  }
  
  addListener(callback: (data: any) => void) {
    this.listeners.push(callback);
    
    // Enviar dados imediatamente para o novo listener
    setTimeout(() => {
      callback(this.mockData);
    }, 0);
    
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }
  
  // Gerar dados estáticos para teste
  private generateStaticMockData() {
    const oportunidades = [
      {
        id: 1,
        exchange_origem: 'Binance',
        exchange_destino: 'Coinbase',
        par_moedas: 'BTC/USDT',
        preco_origem: 42150.75,
        preco_destino: 42400.25,
        diferenca_percentual: 0.59,
        data_hora: new Date().toISOString(),
        volume_24h: 8750000,
        status: 'ativa'
      },
      {
        id: 2,
        exchange_origem: 'Kraken',
        exchange_destino: 'Bybit',
        par_moedas: 'ETH/USDT',
        preco_origem: 2235.45,
        preco_destino: 2255.80,
        diferenca_percentual: 0.91,
        data_hora: new Date().toISOString(),
        volume_24h: 4250000,
        status: 'ativa'
      },
      {
        id: 3,
        exchange_origem: 'KuCoin',
        exchange_destino: 'Binance',
        par_moedas: 'SOL/USDT',
        preco_origem: 138.25,
        preco_destino: 139.80,
        diferenca_percentual: 1.12,
        data_hora: new Date().toISOString(),
        volume_24h: 2150000,
        status: 'ativa'
      }
    ];
    
    const estatisticas = {
      total_oportunidades: 12,
      total_profit: 350.75,
      volume_total: 3500000,
      spread_medio: 0.85,
      oportunidades_por_par: {
        'BTC/USDT': 4,
        'ETH/USDT': 3,
        'SOL/USDT': 2,
        'XRP/USDT': 2,
        'ADA/USDT': 1
      },
      oportunidades_por_exchange: {
        'Binance': 5,
        'Coinbase': 3,
        'Kraken': 2,
        'Bybit': 1,
        'KuCoin': 1
      }
    };
    
    return {
      type: 'update',
      data: {
        oportunidades,
        estatisticas
      }
    };
  }
}

// Criar uma instância do serviço apropriado baseado no ambiente
let serviceInstance: WebSocketService | MockWebSocketService;

// Para ambiente de desenvolvimento, podemos usar um mock
if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true') {
  console.log("Usando mock do WebSocket para desenvolvimento");
  serviceInstance = new MockWebSocketService();
} else {
  // Caso contrário, usar o serviço real
  serviceInstance = new WebSocketService();
}

// Exportar a instância do serviço para uso em outros componentes
export const websocketService = serviceInstance;