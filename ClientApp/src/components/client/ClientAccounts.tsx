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
      const response = await fetch('http://localhost/ExosBank/api/usuarios/me.php', {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Error al obtener cuentas');
      }

      const data = await response.json();

      if (data.status === 'ok' && data.data.cuentas) {
        setCuentas(data.data.cuentas);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const getAccountTypeBadge = (tipo: number) => {
    const config = {
      1: { color: 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100', label: 'Cuenta Corriente' },
      2: { color: 'bg-blue-100 text-blue-800 hover:bg-blue-100', label: 'Cuenta de Ahorro' },
      3: { color: 'bg-red-100 text-red-800 hover:bg-red-100', label: 'Cuenta de Crédito' },
    };
    
    const item = config[tipo as keyof typeof config] || config[1];
    
    return (
      <Badge variant="secondary" className={item.color}>
        {item.label}
      </Badge>
    );
  };

  if (loading) {
    return <div>Cargando cuentas...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (cuentas.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h2>Mis Cuentas</h2>
          <p className="text-muted-foreground">No tienes cuentas bancarias registradas</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2>Mis Cuentas</h2>
        <p className="text-muted-foreground">Administra tus cuentas bancarias</p>
      </div>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Listado de Cuentas</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo de Cuenta</TableHead>
                <TableHead>Número de Cuenta</TableHead>
                <TableHead>Saldo Disponible</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cuentas.map((cuenta) => (
                <TableRow key={cuenta.id_cuenta}>
                  <TableCell>{getAccountTypeBadge(cuenta.tipo_cuenta)}</TableCell>
                  <TableCell className="font-mono">{cuenta.numero_cuenta}</TableCell>
                  <TableCell className="text-lg">
                    ₡{cuenta.saldo.toLocaleString('es-CR', { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell>
                    <Badge variant="default" className="bg-emerald-600">Activa</Badge>
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
