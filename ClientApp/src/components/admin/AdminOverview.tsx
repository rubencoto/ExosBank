import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Users, CreditCard, TrendingUp, DollarSign, RefreshCw, AlertCircle } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';

interface DashboardTotals {
  usuarios: number;
  clientes: number;
  cuentas: number;
  cuentas_saldo_total: number;
  transacciones: number;
  transacciones_monto_total: number;
}

interface AccountTypeDatum {
  tipo_cuenta: number;
  nombre: string;
  total: number;
}

interface DailyActivityDatum {
  fecha: string;
  transacciones: number;
  monto: number;
}

interface RecentTransaction {
  id: number;
  fecha: string | null;
  tipo: string;
  descripcion: string;
  origen: string;
  destino: string;
  monto: number;
  estado: string;
}

interface DashboardResponse {
  totals: DashboardTotals;
  account_types: AccountTypeDatum[];
  daily_activity: DailyActivityDatum[];
  recent_transactions: RecentTransaction[];
}

export function AdminOverview() {
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch('/api/admin/dashboard.php', {
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al obtener el resumen');
      }

      const data = await response.json();
      if (data.status === 'ok') {
        setDashboard(data.data);
      } else {
        throw new Error(data.message || 'Respuesta inválida');
      }
    } catch (err) {
      console.error('Error al cargar dashboard:', err);
      setError(err instanceof Error ? err.message : 'Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading && !dashboard) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando resumen del sistema...</p>
        </div>
      </div>
    );
  }

  if (error && !dashboard) {
    return (
      <Card className="shadow-md border-red-200">
        <CardContent className="py-12 text-center space-y-4">
          <AlertCircle className="h-8 w-8 text-red-600 mx-auto" />
          <p className="text-muted-foreground">{error}</p>
          <button
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[#0B132B] text-white"
            onClick={fetchDashboard}
          >
            <RefreshCw className="h-4 w-4" /> Reintentar
          </button>
        </CardContent>
      </Card>
    );
  }

  const totals = dashboard?.totals ?? {
    usuarios: 0,
    clientes: 0,
    cuentas: 0,
    cuentas_saldo_total: 0,
    transacciones: 0,
    transacciones_monto_total: 0
  };

  const accountTypeData = (dashboard?.account_types ?? []).map((item) => ({
    type: item.nombre,
    count: item.total
  }));

  const dailyData = (dashboard?.daily_activity ?? []).map((item) => ({
    date: new Date(item.fecha).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short'
    }),
    transactions: item.transacciones,
    amount: item.monto
  }));

  const recentTransactions = dashboard?.recent_transactions ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h2>Panel Administrativo</h2>
        <p className="text-muted-foreground">Visión general del sistema EXOS Bank</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Total Usuarios</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{totals.usuarios}</div>
            <p className="text-xs text-muted-foreground">Registrados en el sistema</p>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Clientes Activos</CardTitle>
            <Users className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{totals.clientes}</div>
            <p className="text-xs text-muted-foreground">Con cuentas activas</p>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Cuentas Abiertas</CardTitle>
            <CreditCard className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{totals.cuentas}</div>
            <p className="text-xs text-muted-foreground">Saldo total ₡{totals.cuentas_saldo_total.toLocaleString('es-CR', { minimumFractionDigits: 2 })}</p>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Transacciones Totales</CardTitle>
            <DollarSign className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">
              ${totals.transacciones_monto_total.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">{totals.transacciones} operaciones registradas</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Account Types Chart */}
        <Card className="shadow-md">
          <CardHeader className="flex items-center justify-between gap-2">
            <div>
              <CardTitle>Tipos de Cuenta</CardTitle>
              <CardDescription>Distribución por tipo de cuenta</CardDescription>
            </div>
            <ButtonRefresh loading={loading} onRefresh={fetchDashboard} />
          </CardHeader>
          <CardContent>
            {accountTypeData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-12">Sin datos disponibles</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={accountTypeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="type" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#0B132B" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Daily Activity Chart */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Actividad Diaria</CardTitle>
            <CardDescription>Número de transacciones por día</CardDescription>
          </CardHeader>
          <CardContent>
            {dailyData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-12">Sin actividad registrada</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="transactions" stroke="#10b981" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions Table */}
      <Card className="shadow-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Últimas Transacciones</CardTitle>
              <CardDescription>Actividad reciente del sistema</CardDescription>
            </div>
            <ButtonRefresh loading={loading} onRefresh={fetchDashboard} />
          </div>
        </CardHeader>
        <CardContent>
          {error && dashboard && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {recentTransactions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-12">No hay transacciones registradas</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Desde</TableHead>
                  <TableHead>Hacia</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentTransactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>#{transaction.id}</TableCell>
                    <TableCell className="capitalize">{transaction.tipo}</TableCell>
                    <TableCell>${transaction.monto.toFixed(2)}</TableCell>
                    <TableCell>{transaction.origen}</TableCell>
                    <TableCell>{transaction.destino}</TableCell>
                    <TableCell>
                      {transaction.fecha
                        ? new Date(transaction.fecha).toLocaleDateString('es-ES', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        : 'Sin fecha'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={transaction.estado === 'Completada' ? 'default' : 'secondary'}>
                        {transaction.estado}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ButtonRefresh({ loading, onRefresh }: { loading: boolean; onRefresh: () => void }) {
  return (
    <button
      onClick={onRefresh}
      className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm"
      disabled={loading}
    >
      <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
      {loading ? 'Actualizando...' : 'Actualizar'}
    </button>
  );
}
