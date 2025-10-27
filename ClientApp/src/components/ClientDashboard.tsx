import { useState } from 'react';
import { Home, CreditCard, Send, History, User, LogOut, Menu, X } from 'lucide-react';
import { ClientOverview } from './client/ClientOverview';
import { ClientAccounts } from './client/ClientAccounts';
import { ClientTransfer } from './client/ClientTransfer';
import { ClientHistory } from './client/ClientHistory';
import { ClientProfile } from './client/ClientProfile';
import exosLogo from 'figma:asset/f64e73f4c248a8bf63bd9ade8025b7b28f3a7d8a.png';

interface ClientDashboardProps {
  userData: any;
  onLogout: () => void;
}

type ClientView = 'home' | 'accounts' | 'transfer' | 'history' | 'profile';

export function ClientDashboard({ userData, onLogout }: ClientDashboardProps) {
  const [currentView, setCurrentView] = useState<ClientView>('home');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const menuItems = [
    { id: 'home' as ClientView, label: 'Inicio', icon: Home },
    { id: 'accounts' as ClientView, label: 'Mis Cuentas', icon: CreditCard },
    { id: 'transfer' as ClientView, label: 'Transferencias', icon: Send },
    { id: 'history' as ClientView, label: 'Historial', icon: History },
    { id: 'profile' as ClientView, label: 'Perfil', icon: User },
  ];

  return (
    <div className="flex h-screen bg-[#F4F4F4]">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-[#0B132B] text-white rounded-lg"
      >
        {isSidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {/* Sidebar */}
      <div
        className={`
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
          fixed lg:static
          w-64 bg-white shadow-xl
          flex flex-col
          transition-transform duration-300
          z-40
          h-full
        `}
      >
        {/* Logo */}
        <div className="p-6 border-b">
          <img src={exosLogo} alt="EXOS Bank" className="h-12 object-contain mx-auto" />
        </div>

        {/* User Info */}
        <div className="p-4 border-b bg-gradient-to-br from-[#0B132B] to-[#1C2541] text-white">
          <p className="text-sm opacity-80">Bienvenido(a)</p>
          <p className="truncate">{userData.name}</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentView(item.id);
                  setIsSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  isActive
                    ? 'bg-[#0B132B] text-white'
                    : 'hover:bg-gray-100 text-gray-700'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-red-50 transition-all text-red-600 hover:text-red-700"
          >
            <LogOut className="h-5 w-5" />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </div>

      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-4 lg:p-8">
          {currentView === 'home' && <ClientOverview clientId={userData.id} onNavigate={setCurrentView} />}
          {currentView === 'accounts' && <ClientAccounts clientId={userData.id} />}
          {currentView === 'transfer' && <ClientTransfer clientId={userData.id} />}
          {currentView === 'history' && <ClientHistory clientId={userData.id} />}
          {currentView === 'profile' && <ClientProfile clientId={userData.id} />}
        </div>
      </div>
    </div>
  );
}
