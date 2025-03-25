#!/usr/bin/env python

"""
Script principal para iniciar o serviço de arbitragem de criptomoedas
"""

import os
import sys
from app.main import create_app, start_data_collector

if __name__ == "__main__":
    app = create_app()
    start_data_collector()
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)), debug=True)
