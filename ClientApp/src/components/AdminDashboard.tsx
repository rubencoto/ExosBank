import { useState } from 'react';
import { LayoutDashboard, Users, CreditCard, ArrowLeftRight, Shield, Settings, LogOut } from 'lucide-react';
import { AdminOverview } from './admin/AdminOverview';
import { UsersManagement } from './admin/UsersManagement';
import { AccountsManagement } from './admin/AccountsManagement';
import { SecurityRoles } from './admin/SecurityRoles';
import exosLogo from 'figma:asset/f64e73f4c248a8bf63bd9ade8025b7b28f3a7d8a.png';

interface AdminDashboardProps {
  userData: any;
  onLogout: () => void;
}

type AdminView = 'dashboard' | 'users' | 'accounts' | 'security' | 'settings';

export function AdminDashboard({ userData, onLogout }: AdminDashboardProps) {
  const [currentView, setCurrentView] = useState<AdminView>('dashboard');

  const menuItems = [
    { id: 'dashboard' as AdminView, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'users' as AdminView, label: 'Usuarios', icon: Users },
    { id: 'accounts' as AdminView, label: 'Cuentas', icon: CreditCard },
    { id: 'security' as AdminView, label: 'Seguridad', icon: Shield },
    { id: 'settings' as AdminView, label: 'Configuración', icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-[#F4F4F4]">
      {/* Sidebar */}
      <div className="w-64 bg-[#0B132B] text-white flex flex-col shadow-xl">
        {/* Logo */}
        <div className="p-6 border-b border-[#1C2541]">
          <img src={exosLogo} alt="EXOS Bank" className="h-16 object-contain mx-auto" />
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  isActive
                    ? 'bg-[#1C2541] text-[#FFD700]'
                    : 'hover:bg-[#1C2541] text-gray-300 hover:text-white'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* User Info & Logout */}
        <div className="p-4 border-t border-[#1C2541] space-y-2">
          <div className="px-4 py-2">
            <p className="text-sm text-gray-400">Administrador</p>
            <p className="truncate">{userData.name}</p>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-red-600 transition-all text-gray-300 hover:text-white"
          >
            <LogOut className="h-5 w-5" />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          {currentView === 'dashboard' && <AdminOverview />}
          {currentView === 'users' && <UsersManagement />}
          {currentView === 'accounts' && <AccountsManagement />}
          {currentView === 'security' && <SecurityRoles />}
          {currentView === 'settings' && (
            <div className="space-y-6">
              <div>
                <h2>Configuración</h2>
                <p className="text-muted-foreground">Ajustes del sistema</p>
              </div>
              <div className="bg-white p-8 rounded-lg shadow-md text-center">
                <Settings className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600">Módulo de configuración en desarrollo</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
