#!/usr/bin/env python

"""
Script para iniciar a aplicação no Windows, contornando problemas com asyncio
"""

import os
import sys
import asyncio
from fix_asyncio import apply_asyncio_fix

if __name__ == "__main__":
    apply_asyncio_fix()
    os.system("python run_api.py")
