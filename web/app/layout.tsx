import './globals.css';
import { Inter } from 'next/font/google';
import type { Metadata } from 'next';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Sistema de Arbitragem de Criptomoedas',
  description: 'Monitore e analise oportunidades de arbitragem entre exchanges em tempo real',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.className} bg-gray-100 dark:bg-gray-900 min-h-screen`}>
        <header className="bg-white dark:bg-gray-800 shadow-md py-4">
          <div className="container mx-auto px-4 flex justify-between items-center">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-blue-600 dark:text-blue-400">CryptoArbitrage</h1>
            </div>
            <nav>
              <ul className="flex space-x-4">
                <li>
                  <a href="/dashboard" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">
                    Dashboard
                  </a>
                </li>
                <li>
                  <a href="/settings" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">
                    Configurações
                  </a>
                </li>
              </ul>
            </nav>
          </div>
        </header>
        
        <main className="container mx-auto py-6">
          {children}
        </main>
        
        <footer className="bg-white dark:bg-gray-800 shadow-inner py-4 mt-8">
          <div className="container mx-auto px-4 text-center text-sm text-gray-600 dark:text-gray-400">
            <p>© {new Date().getFullYear()} Sistema de Arbitragem de Criptomoedas</p>
          </div>
        </footer>
      </body>
    </html>
  );
}