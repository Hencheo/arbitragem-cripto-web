#!/usr/bin/env python

"""
Script para iniciar apenas a API REST e WebSocket sem o coletor de dados
"""

import os
import sys
import logging
import argparse
from dotenv import load_dotenv
from app.main_web import create_web_app

# Configurar logger
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("arbitragem.log"),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

def parse_args():
    """Parse command line arguments"""
    parser = argparse.ArgumentParser(description='Iniciar API de arbitragem de criptomoedas')
    parser.add_argument(
        '--debug', 
        action='store_true', 
        help='Executar em modo debug'
    )
    parser.add_argument(
        '--host', 
        type=str, 
        default='0.0.0.0', 
        help='Host para o servidor (padrão: 0.0.0.0)'
    )
    parser.add_argument(
        '--port', 
        type=int, 
        default=8000, 
        help='Porta para o servidor (padrão: 8000)'
    )
    return parser.parse_args()

if __name__ == "__main__":
    # Carregar variáveis de ambiente
    load_dotenv()
    
    # Analisar argumentos
    args = parse_args()
    
    # Criar e iniciar aplicação
    try:
        logger.info(f"Iniciando API em {args.host}:{args.port} (debug: {args.debug})")
        app = create_web_app()
        app.run(
            host=args.host, 
            port=args.port, 
            debug=args.debug
        )
    except Exception as e:
        logger.error(f"Erro ao iniciar API: {e}")
        sys.exit(1)
