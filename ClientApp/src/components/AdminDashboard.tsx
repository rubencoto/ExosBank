import { useState } from 'react';
import { LayoutDashboard, Users, CreditCard, ArrowLeftRight, Shield, Settings, LogOut, FileBarChart, Activity } from 'lucide-react';
import { AdminOverview } from './admin/AdminOverview';
import { UsersManagement } from './admin/UsersManagement';
import { AccountsManagement } from './admin/AccountsManagement';
import { SecurityRoles } from './admin/SecurityRoles';
import { SystemSettings } from './admin/SystemSettings';
import { Reports } from './admin/Reports';
import { AuditLog } from './admin/AuditLog';

interface AdminDashboardProps {
  userData: any;
  onLogout: () => void;
}

type AdminView = 'dashboard' | 'users' | 'accounts' | 'security' | 'settings' | 'reports' | 'audit';

export function AdminDashboard({ userData, onLogout }: AdminDashboardProps) {
  const [currentView, setCurrentView] = useState<AdminView>('dashboard');

  const menuItems = [
    { id: 'dashboard' as AdminView, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'users' as AdminView, label: 'Usuarios', icon: Users },
    { id: 'accounts' as AdminView, label: 'Cuentas', icon: CreditCard },
    { id: 'reports' as AdminView, label: 'Reportes', icon: FileBarChart },
    { id: 'security' as AdminView, label: 'Seguridad', icon: Shield },
    { id: 'audit' as AdminView, label: 'Auditoría', icon: Activity },
    { id: 'settings' as AdminView, label: 'Configuración', icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-[#F4F4F4]">
      {/* Sidebar */}
      <div className="w-64 bg-[#0B132B] text-white flex flex-col shadow-xl">
        {/* Logo */}
        <div className="p-6 border-b border-[#1C2541] text-center">
          <h1 className="text-2xl font-bold text-white">EXOS Bank</h1>
          <p className="text-sm text-gray-300 mt-1">Admin Panel</p>
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
          {currentView === 'reports' && <Reports />}
          {currentView === 'security' && <SecurityRoles />}
          {currentView === 'audit' && <AuditLog />}
          {currentView === 'settings' && <SystemSettings />}
        </div>
      </div>
    </div>
  );
}
