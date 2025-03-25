'use client';

import React from 'react';
import { ArbitrageProvider } from '../../contexts/ArbitrageContext';
import { WebSocketProvider } from '../../contexts/WebSocketContext';
import DashboardContainer from '../../containers/DashboardContainer';

export default function DashboardPage() {
  return (
    <WebSocketProvider>
      <ArbitrageProvider>
        <DashboardContainer />
      </ArbitrageProvider>
    </WebSocketProvider>
  );
}