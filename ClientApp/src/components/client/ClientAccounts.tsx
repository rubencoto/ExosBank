import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { useState, useEffect } from 'react';

interface ClientAccountsProps {
  clientId: number;
}

interface CuentaBancaria {
  id_cuenta: number;
  numero_cuenta: string;
  tipo_cuenta: number;
  saldo: number;
}

export function ClientAccounts({ clientId }: ClientAccountsProps) {
  const [cuentas, setCuentas] = useState<CuentaBancaria[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCuentas();
  }, [clientId]);

  const fetchCuentas = async () => {
    try {
      const response = await fetch('http://localhost/ExosBank/api/usuarios/cuentas.php', {
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
    // Formato: XXXX-XXXX-XXX (11 dígitos, el último indica el tipo)
    if (numero.length === 11) {
      return `${numero.slice(0, 4)}-${numero.slice(4, 8)}-${numero.slice(8)}`;
    }
    return numero;
  };

  if (loading) {
    return <div>Cargando cuentas...</div>;
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h2>Mis Cuentas</h2>
          <p className="text-muted-foreground">Administra tus cuentas bancarias</p>
        </div>
        <Card className="shadow-md border-red-200">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="rounded-full bg-red-100 p-3">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Error al cargar cuentas</h3>
                <p className="text-sm text-muted-foreground mb-4">{error}</p>
                {error.includes('IP address') && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-left text-sm">
                    <p className="font-semibold text-yellow-800 mb-2">💡 Solución:</p>
                    <p className="text-yellow-700">
                      Tu dirección IP necesita ser autorizada en Azure SQL Database.
                      Ve al portal de Azure y agrega tu IP al firewall del servidor.
                    </p>
                  </div>
                )}
                <button 
                  onClick={fetchCuentas}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Reintentar
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (cuentas.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h2>Mis Cuentas</h2>
          <p className="text-muted-foreground">Administra tus cuentas bancarias</p>
        </div>
        <Card className="shadow-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4 text-center py-8">
              <div className="rounded-full bg-gray-100 p-4">
                <svg className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">No tienes cuentas bancarias</h3>
                <p className="text-sm text-muted-foreground">
                  Contacta con un administrador para crear tu primera cuenta bancaria
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2>Mis Cuentas</h2>
        <p className="text-muted-foreground">Administra tus cuentas bancarias</p>
      </div>

      {/* Resumen de cuentas */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Cuentas</CardTitle>
            <svg className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cuentas.length}</div>
            <p className="text-xs text-muted-foreground">
              {cuentas.length === 1 ? 'cuenta activa' : 'cuentas activas'}
            </p>
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
              ₡{cuentas.reduce((sum, c) => sum + c.saldo, 0).toLocaleString('es-CR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">Suma de todas las cuentas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tipos de Cuenta</CardTitle>
            <svg className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(cuentas.map(c => c.tipo_cuenta)).size}
            </div>
            <p className="text-xs text-muted-foreground">Diferentes tipos activos</p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Listado de Cuentas</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">ID</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Número de Cuenta</TableHead>
                <TableHead>Saldo</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cuentas.map((cuenta, index) => (
                <TableRow key={cuenta.id_cuenta}>
                  <TableCell className="font-medium">#{index + 1}</TableCell>
                  <TableCell>{getAccountTypeBadge(cuenta.tipo_cuenta)}</TableCell>
                  <TableCell className="font-mono text-base font-medium">
                    {formatAccountNumber(cuenta.numero_cuenta)}
                  </TableCell>
                  <TableCell className="text-lg font-semibold text-emerald-600">
                    ${cuenta.saldo.toLocaleString('es-CR', { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell>
                    <Badge variant="default" className="bg-emerald-600 hover:bg-emerald-600">
                      ✓ Activa
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
