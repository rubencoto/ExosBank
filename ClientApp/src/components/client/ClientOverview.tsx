import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { mockAccounts } from '../../lib/mockData';
import { CreditCard, TrendingUp } from 'lucide-react';
import { Button } from '../ui/button';

interface ClientOverviewProps {
  clientId: number;
  onNavigate: (view: string) => void;
}

export function ClientOverview({ clientId, onNavigate }: ClientOverviewProps) {
  const clientAccounts = mockAccounts.filter(a => a.clientId === clientId);
  const totalBalance = clientAccounts.reduce((sum, acc) => sum + acc.balance, 0);

  const getAccountConfig = (type: string) => {
    const configs = {
      debit: {
        color: 'from-emerald-500 to-emerald-600',
        label: 'Débito',
        subtitle: 'Cuenta Corriente'
      },
      savings: {
        color: 'from-blue-500 to-blue-600',
        label: 'Ahorro',
        subtitle: 'Cuenta de Ahorros'
      },
      credit: {
        color: 'from-red-500 to-red-600',
        label: 'Crédito',
        subtitle: 'Cuenta de Crédito'
      },
    };
    return configs[type as keyof typeof configs] || configs.debit;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Resumen de Cuentas</h2>
        <p className="text-muted-foreground">Visión general de tu patrimonio</p>
      </div>

      {/* Total Balance Card */}
      <Card className="shadow-lg bg-gradient-to-br from-[#1e2a3a] to-[#2d3e52] text-white border-0">
        <CardContent className="p-8">
          <p className="text-sm text-white/70 mb-2">Saldo Total</p>
          <div className="text-5xl font-bold mb-4">
            ${totalBalance.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="flex items-center gap-2 text-emerald-400">
            <TrendingUp className="h-4 w-4" />
            <span className="text-sm">Entre {clientAccounts.length} cuentas</span>
          </div>
        </CardContent>
      </Card>

      {/* Accounts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {clientAccounts.map((account) => {
          const config = getAccountConfig(account.type);
          return (
            <Card
              key={account.id}
              className={`shadow-md overflow-hidden border-0 bg-gradient-to-br ${config.color} text-white`}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-sm font-medium opacity-90 mb-1">{config.label}</p>
                    <p className="text-sm opacity-80">{config.subtitle}</p>
                  </div>
                  <div className="bg-white/20 p-2 rounded-lg">
                    <CreditCard className="h-6 w-6" />
                  </div>
                </div>
                <div className="space-y-2 mt-6">
                  <p className="text-3xl font-bold">
                    ${account.balance.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <p className="text-sm font-mono opacity-90">{account.accountNumber}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-xl">Acciones Rápidas</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button
            onClick={() => onNavigate('transfer')}
            className="bg-[#0B132B] hover:bg-[#1C2541] px-6"
          >
            Realizar Transferencia
          </Button>
          <Button
            onClick={() => onNavigate('history')}
            variant="outline"
            className="px-6"
          >
            Ver Historial
          </Button>
          <Button
            onClick={() => onNavigate('accounts')}
            variant="outline"
            className="px-6"
          >
            Gestionar Cuentas
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
