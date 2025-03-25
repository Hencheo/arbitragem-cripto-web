#!/usr/bin/env python

"""
Script para corrigir problemas com asyncio no Windows
"""

import os
import sys
import asyncio

def apply_asyncio_fix():
    """
    Aplicar correção para asyncio no Windows
    """
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
        print("✅ Aplicada correção de asyncio para Windows")
