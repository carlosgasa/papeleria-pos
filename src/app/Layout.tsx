import React from 'react';
import { useTheme } from '../shared/hooks/useTheme';
import { signOut } from '../core/firebase/authService';
import { useNavigate } from 'react-router-dom';
import Button from '../shared/components/Button';
import Card from '../shared/components/Card';

/**
 * Layout principal para la aplicación.
 * En Android sería un Activity contenedor con Fragment navigation.
 */

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
}

const Layout: React.FC<LayoutProps> = ({ children, title }) => {
  const { theme, cycleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-4 overflow-y-auto hidden md:block">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            Papelería POS
          </h1>
        </div>

        <nav className="space-y-2">
          {[
            { href: '/', label: '📊 Dashboard', icon: '📊' },
            { href: '/inventory', label: '📦 Inventario', icon: '📦' },
            { href: '/sales/new', label: '🛒 Ventas', icon: '🛒' },
            { href: '/sales/history', label: '📋 Historial', icon: '📋' },
            { href: '/finance', label: '💰 Finanzas', icon: '💰' },
          ].map((item) => (
            <button
              key={item.href}
              onClick={() => navigate(item.href)}
              className="w-full text-left px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white transition-colors"
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="mt-auto pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            variant="outline"
            size="sm"
            fullWidth
            onClick={cycleTheme}
            className="mb-2"
          >
            {theme === 'light' ? '🌙 Oscuro' : theme === 'dark' ? '🎀 Kawaii' : '☀️ Claro'}
          </Button>
          <Button
            variant="danger"
            size="sm"
            fullWidth
            onClick={handleLogout}
          >
            🚪 Cerrar sesión
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Top Bar */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between md:hidden sticky top-0 z-40">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {title || 'Papelería POS'}
          </h2>
          <button
            onClick={cycleTheme}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title="Cambiar tema"
          >
            {theme === 'light' ? '🌙' : theme === 'dark' ? '🎀' : '☀️'}
          </button>
        </div>

        <div className="p-4 md:p-6 pb-24 md:pb-6">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-50">
        <nav className="flex justify-around">
          {[
            { href: '/', label: '📊', title: 'Dashboard' },
            { href: '/inventory', label: '📦', title: 'Inventario' },
            { href: '/sales/new', label: '🛒', title: 'Ventas' },
            { href: '/sales/history', label: '📋', title: 'Historial' },
            { href: '/finance', label: '💰', title: 'Finanzas' },
          ].map((item) => (
            <button
              key={item.href}
              onClick={() => navigate(item.href)}
              className="flex-1 py-3 text-center text-2xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title={item.title}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default Layout;
