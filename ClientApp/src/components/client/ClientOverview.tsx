import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { CreditCard, TrendingUp, AlertCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { authenticatedFetch } from '../../lib/auth';

interface ClientOverviewProps {
  clientId: number;
  onNavigate: (view: string) => void;
}

export function ClientOverview({ clientId, onNavigate }: ClientOverviewProps) {
  interface CuentaResumen {
    id_cuenta: number;
    numero_cuenta: string;
    tipo_cuenta: number;
    saldo: number;
  }

  const [accounts, setAccounts] = useState<CuentaResumen[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        setLoading(true);
        setError('');

        const response = await authenticatedFetch('/api/usuarios/cuentas.php');

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Error al obtener cuentas');
        }

        const data = await response.json();

        if (data.status === 'ok' && data.data?.cuentas) {
          setAccounts(data.data.cuentas);
        } else {
          throw new Error(data.message || 'No se pudieron cargar las cuentas');
        }
      } catch (err) {
        console.error('Error al cargar resumen de cuentas:', err);
        setError(err instanceof Error ? err.message : 'Error de conexión');
      } finally {
        setLoading(false);
      }
    };

    fetchAccounts();
  }, [clientId]);

  const totalBalance = accounts.reduce((sum, acc) => sum + acc.saldo, 0);

  const getAccountConfig = (type: number) => {
    const configs = {
      1: {
        color: 'from-emerald-500 to-emerald-600',
        label: 'Corriente',
        subtitle: 'Cuenta Corriente'
      },
      2: {
        color: 'from-blue-500 to-blue-600',
        label: 'Ahorro',
        subtitle: 'Cuenta de Ahorros'
      },
      3: {
        color: 'from-red-500 to-red-600',
        label: 'Crédito',
        subtitle: 'Cuenta de Crédito'
      }
    };
    return configs[type as keyof typeof configs] || configs[1];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando resumen de cuentas...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold">Resumen de Cuentas</h2>
          <p className="text-muted-foreground">No pudimos obtener la información en este momento.</p>
        </div>
        <Card className="shadow-md border-red-200">
          <CardContent className="pt-6 text-center space-y-4">
            <div className="flex justify-center">
              <div className="rounded-full bg-red-100 p-3">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button onClick={() => window.location.reload()}>Reintentar</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (accounts.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold">Resumen de Cuentas</h2>
          <p className="text-muted-foreground">Aún no tienes cuentas activas.</p>
        </div>
        <Card className="shadow-md">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">Contacta a un administrador para crear tu primera cuenta.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

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
            <span className="text-sm">Entre {accounts.length} cuentas</span>
          </div>
        </CardContent>
      </Card>

      {/* Accounts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {accounts.map((account) => {
          const config = getAccountConfig(account.tipo_cuenta);
          return (
            <Card
              key={account.id_cuenta}
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
                    ${account.saldo.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <p className="text-sm font-mono opacity-90">{account.numero_cuenta}</p>
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
