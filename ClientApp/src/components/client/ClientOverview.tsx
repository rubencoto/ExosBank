import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { mockAccounts } from '../../lib/mockData';
import { CreditCard, TrendingUp, Wallet } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

interface ClientOverviewProps {
  clientId: number;
  onNavigate: (view: string) => void;
}

export function ClientOverview({ clientId, onNavigate }: ClientOverviewProps) {
  const clientAccounts = mockAccounts.filter(a => a.clientId === clientId);
  const totalBalance = clientAccounts.reduce((sum, acc) => sum + acc.balance, 0);

  const getAccountColor = (type: string) => {
    const colors = {
      debit: 'from-emerald-500 to-emerald-600',
      savings: 'from-blue-500 to-blue-600',
      credit: 'from-red-500 to-red-600',
    };
    return colors[type as keyof typeof colors] || 'from-gray-500 to-gray-600';
  };

  const getAccountIcon = (type: string) => {
    return type === 'credit' ? Wallet : CreditCard;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2>Resumen de Cuentas</h2>
        <p className="text-muted-foreground">Visión general de tu patrimonio</p>
      </div>

      {/* Total Balance Card */}
      <Card className="shadow-lg bg-gradient-to-br from-[#0B132B] to-[#1C2541] text-white">
        <CardHeader>
          <CardTitle className="text-white/80">Saldo Total</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-4xl mb-4">${totalBalance.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</div>
          <div className="flex items-center gap-2 text-emerald-400">
            <TrendingUp className="h-4 w-4" />
            <span className="text-sm">Entre {clientAccounts.length} cuentas</span>
          </div>
        </CardContent>
      </Card>

      {/* Accounts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {clientAccounts.map((account) => {
          const Icon = getAccountIcon(account.type);
          return (
            <Card
              key={account.id}
              className={`shadow-md overflow-hidden border-0 bg-gradient-to-br ${getAccountColor(account.type)}`}
            >
              <CardContent className="p-6 text-white">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <Badge className="bg-white/20 text-white hover:bg-white/30 mb-2">
                      {account.type === 'debit' ? 'Débito' : account.type === 'savings' ? 'Ahorro' : 'Crédito'}
                    </Badge>
                    <p className="text-sm opacity-90">Cuenta {account.type === 'savings' ? 'de Ahorros' : account.type === 'debit' ? 'Corriente' : 'de Crédito'}</p>
                  </div>
                  <Icon className="h-8 w-8 opacity-80" />
                </div>
                <div className="space-y-2">
                  <p className="text-2xl">${account.balance.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</p>
                  <p className="text-sm font-mono opacity-80">{account.accountNumber}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Acciones Rápidas</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <Button
            onClick={() => onNavigate('transfer')}
            className="bg-[#0B132B] hover:bg-[#1C2541]"
          >
            Realizar Transferencia
          </Button>
          <Button
            onClick={() => onNavigate('history')}
            variant="outline"
          >
            Ver Historial
          </Button>
          <Button
            onClick={() => onNavigate('accounts')}
            variant="outline"
          >
            Gestionar Cuentas
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
