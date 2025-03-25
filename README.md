# Sistema de Arbitragem de Criptomoedas

Sistema avançado para identificação e análise de oportunidades de arbitragem entre diferentes exchanges de criptomoedas em tempo real.

![Arbitragem Cripto](https://img.shields.io/badge/Arbitragem-Cripto-blue)
![Tecnologia](https://img.shields.io/badge/Frontend-Next.js-black)
![Backend](https://img.shields.io/badge/Backend-Python%20Flask-green)
![WebSockets](https://img.shields.io/badge/Comunicação-WebSockets-orange)

## 🚀 Sobre o Projeto

O sistema de arbitragem de criptomoedas identifica disparidades de preços entre diferentes exchanges em tempo real, permitindo que traders e investidores aproveitem oportunidades de lucro no mercado volátil de criptomoedas.

## 🔍 Problema Resolvido

Em um mercado fragmentado com milhares de pares de moedas em dezenas de exchanges, é virtualmente impossível para um ser humano identificar oportunidades de arbitragem manualmente em tempo hábil. Esta solução automatiza todo o processo, desde a coleta de dados até a apresentação das oportunidades, permitindo que o usuário foque na tomada de decisão.

## 🛠️ Tecnologias Utilizadas

### Backend
- **Python**: Linguagem principal para processamento de dados
- **Flask**: Framework web para API RESTful
- **WebSockets**: Comunicação em tempo real
- **SQLAlchemy**: ORM para interação com banco de dados
- **Celery**: Processamento assíncrono de tarefas

### Frontend
- **Next.js**: Framework React para construção da interface
- **React**: Biblioteca para construção de UI
- **WebSocket API**: Comunicação em tempo real com o backend
- **TailwindCSS**: Framework CSS para design responsivo
- **TypeScript**: Para tipagem estática

## 📋 Funcionalidades

- Monitoramento simultâneo de múltiplas exchanges
- Análise de disparidades de preços em tempo real
- Cálculo automatizado de lucro potencial considerando taxas
- Dashboard interativo com estatísticas e gráficos
- Histórico de oportunidades para análise posterior
- Sistema de alertas configurável

## 📦 Instalação e Configuração

### Pré-requisitos
- Node.js 18+
- Python 3.9+
- Redis (para filas de tarefas e caching)
- PostgreSQL (ou outro banco de dados compatível)

### Backend

```bash
# Clonar o repositório
git clone https://github.com/seu-usuario/arbitragem-cripto-web.git
cd arbitragem-cripto-web

# Configurar ambiente virtual Python
python -m venv venv
source venv/bin/activate  # No Windows: venv\Scripts\activate

# Instalar dependências
pip install -r requirements.txt

# Configurar variáveis de ambiente
cp .env.example .env
# Edite o arquivo .env com suas configurações

# Executar migrações do banco de dados
flask db upgrade

# Iniciar o servidor de desenvolvimento
flask run

# Em outro terminal, iniciar o worker Celery
celery -A app.celery worker --loglevel=info

# Iniciar o coletor de dados em tempo real
python data_collector.py
```

### Frontend

```bash
# Navegue para o diretório frontend
cd web

# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env.local
# Edite o arquivo .env.local com suas configurações

# Iniciar o servidor de desenvolvimento
npm run dev
```

Acesse o aplicativo em: http://localhost:3000

## 🔧 Configuração das Exchanges

O sistema suporta as seguintes exchanges:
- Binance
- Coinbase
- Kraken
- Bybit
- KuCoin

Para cada exchange, é necessário configurar as chaves de API no arquivo `.env`:

```
BINANCE_API_KEY=sua_chave_api
BINANCE_API_SECRET=seu_secret_api

COINBASE_API_KEY=sua_chave_api
COINBASE_API_SECRET=seu_secret_api

# Outras exchanges...
```

## 👨‍💻 Uso

1. Após iniciar o backend e o frontend, acesse http://localhost:3000
2. Na página de dashboard, você verá as oportunidades de arbitragem em tempo real
3. Configure os filtros para mostrar apenas pares específicos ou exchanges de seu interesse
4. Utilize o painel de estatísticas para analisar o desempenho geral
5. Clique em uma oportunidade para ver detalhes e uma análise mais aprofundada

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 📬 Contato

Para dúvidas, sugestões ou colaborações, entre em contato pelo LinkedIn ou abra uma issue no GitHub.