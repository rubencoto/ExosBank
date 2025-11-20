import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Trash2, RefreshCw, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '../ui/alert';

interface Cuenta {
  id_cuenta: number;
  numero_cuenta: string;
  tipo_cuenta: number;
  tipo_cuenta_nombre: string;
  saldo: number;
  cliente: {
    id_cliente: number;
    id_usuario: number;
    nombre: string;
    correo: string;
  };
}

interface Movimiento {
  id: number;
  fecha: string;
  tipo: string;
  origen: string;
  destino: string;
  monto: number;
  descripcion: string;
  estado: string;
  origen_nombre?: string | null;
  destino_nombre?: string | null;
}

export function AccountsManagement() {
  const [cuentas, setCuentas] = useState<Cuenta[]>([]);
  const [transactions, setTransactions] = useState<Movimiento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [loadingTransactions, setLoadingTransactions] = useState(true);
  const [transactionsError, setTransactionsError] = useState('');

  useEffect(() => {
    fetchCuentas();
    fetchTransacciones();
  }, []);

  const fetchCuentas = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch('/api/admin/cuentas.php', {
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al obtener cuentas');
      }

      const data = await response.json();

      if (data.status === 'ok' && data.data.cuentas) {
        setCuentas(data.data.cuentas);
      } else {
        throw new Error(data.message || 'No se pudieron cargar las cuentas');
      }
    } catch (err) {
      console.error('Error al cargar cuentas:', err);
      setError(err instanceof Error ? err.message : 'Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const fetchTransacciones = async () => {
    try {
      setLoadingTransactions(true);
      setTransactionsError('');

      const response = await fetch('/api/admin/transacciones.php?limit=200', {
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al obtener transacciones');
      }

      const data = await response.json();

      if (data.status === 'ok' && data.data?.transacciones) {
        setTransactions(data.data.transacciones);
      } else {
        throw new Error(data.message || 'Respuesta inválida del servidor');
      }
    } catch (err) {
      console.error('Error al cargar transacciones:', err);
      setTransactionsError(err instanceof Error ? err.message : 'Error de conexión');
    } finally {
      setLoadingTransactions(false);
    }
  };

  const handleDeleteAccount = async (idCuenta: number) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta cuenta? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/cuentas.php?id=${idCuenta}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      const data = await response.json();

      if (data.status === 'ok') {
        alert('Cuenta eliminada exitosamente');
        fetchCuentas(); // Recargar la lista
      } else {
        throw new Error(data.message || 'Error al eliminar cuenta');
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al eliminar cuenta');
    }
  };

  const getAccountTypeBadge = (tipo: number) => {
    const config = {
      1: { color: 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100', label: 'Corriente', icon: '💳' },
      2: { color: 'bg-blue-100 text-blue-800 hover:bg-blue-100', label: 'Ahorro', icon: '🏦' },
    };
    
    const item = config[tipo as keyof typeof config] || config[1];
    
    return (
      <Badge variant="secondary" className={item.color}>
        <span className="mr-1">{item.icon}</span>
        {item.label}
      </Badge>
    );
  };

  const formatAccountNumber = (numero: string) => {
    // Formato: XXXX-XXXX-XXX (11 dígitos)
    if (numero.length === 11) {
      return `${numero.slice(0, 4)}-${numero.slice(4, 8)}-${numero.slice(8)}`;
    }
    return numero;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2>Gestión de Cuentas y Transacciones</h2>
          <p className="text-muted-foreground">Administra cuentas bancarias y transacciones</p>
        </div>
      </div>

      {/* Resumen de estadísticas */}
      {!loading && !error && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Cuentas</CardTitle>
              <svg className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{cuentas.length}</div>
              <p className="text-xs text-muted-foreground">Cuentas registradas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Saldo Total</CardTitle>
              <svg className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${cuentas.reduce((sum, c) => sum + c.saldo, 0).toLocaleString('es-ES', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-muted-foreground">En todas las cuentas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cuentas Corrientes</CardTitle>
              <span className="text-2xl">💳</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {cuentas.filter(c => c.tipo_cuenta === 1).length}
              </div>
              <p className="text-xs text-muted-foreground">Tipo corriente</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cuentas de Ahorro</CardTitle>
              <span className="text-2xl">🏦</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {cuentas.filter(c => c.tipo_cuenta === 2).length}
              </div>
              <p className="text-xs text-muted-foreground">Tipo ahorro</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="accounts" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="accounts">Cuentas</TabsTrigger>
          <TabsTrigger value="transactions">Transacciones</TabsTrigger>
        </TabsList>

        {/* Accounts Tab */}
        <TabsContent value="accounts" className="space-y-4">
          <div className="flex justify-end gap-2">
            <Button 
              variant="outline"
              onClick={fetchCuentas}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Recargar
            </Button>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {loading ? (
            <Card className="shadow-md">
              <CardContent className="p-12 text-center">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">Cargando cuentas...</p>
              </CardContent>
            </Card>
          ) : cuentas.length === 0 ? (
            <Card className="shadow-md">
              <CardContent className="p-12 text-center">
                <p className="text-muted-foreground">No hay cuentas registradas</p>
              </CardContent>
            </Card>
          ) : (
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle>Listado de Cuentas ({cuentas.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[80px]">ID</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Número de Cuenta</TableHead>
                      <TableHead>Saldo</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cuentas.map((cuenta, index) => (
                      <TableRow key={cuenta.id_cuenta}>
                        <TableCell className="font-medium">#{index + 1}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{cuenta.cliente.nombre}</div>
                            <div className="text-sm text-muted-foreground">{cuenta.cliente.correo}</div>
                          </div>
                        </TableCell>
                        <TableCell>{getAccountTypeBadge(cuenta.tipo_cuenta)}</TableCell>
                        <TableCell className="font-mono text-base">
                          {formatAccountNumber(cuenta.numero_cuenta)}
                        </TableCell>
                        <TableCell className="font-semibold text-lg text-emerald-600">
                          ${cuenta.saldo.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleDeleteAccount(cuenta.id_cuenta)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Transactions Tab */}
        <TabsContent value="transactions" className="space-y-4">
          <Card className="shadow-md">
            <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Historial de Transacciones</CardTitle>
                <p className="text-sm text-muted-foreground">Últimos movimientos registrados en el sistema</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={fetchTransacciones} disabled={loadingTransactions}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${loadingTransactions ? 'animate-spin' : ''}`} />
                  Actualizar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {transactionsError && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{transactionsError}</AlertDescription>
                </Alert>
              )}

              {loadingTransactions ? (
                <div className="py-12 text-center text-muted-foreground">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
                  Cargando transacciones...
                </div>
              ) : transactions.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  No hay transacciones registradas.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Origen</TableHead>
                      <TableHead>Destino</TableHead>
                      <TableHead>Monto</TableHead>
                      <TableHead>Descripción</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>#{transaction.id}</TableCell>
                        <TableCell>
                          {transaction.fecha ? new Date(transaction.fecha).toLocaleDateString('es-ES', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          }) : 'Sin fecha'}
                        </TableCell>
                        <TableCell className="capitalize">
                          <Badge variant="outline">{transaction.tipo}</Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {transaction.origen}
                          {transaction.origen_nombre && (
                            <span className="block text-[11px] text-muted-foreground">{transaction.origen_nombre}</span>
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {transaction.destino}
                          {transaction.destino_nombre && (
                            <span className="block text-[11px] text-muted-foreground">{transaction.destino_nombre}</span>
                          )}
                        </TableCell>
                        <TableCell className="font-semibold">
                          ${transaction.monto.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{transaction.descripcion}</TableCell>
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
