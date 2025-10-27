import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { mockAccounts } from '../../lib/mockData';

interface ClientAccountsProps {
  clientId: number;
}

export function ClientAccounts({ clientId }: ClientAccountsProps) {
  const clientAccounts = mockAccounts.filter(a => a.clientId === clientId);

  const getAccountTypeBadge = (type: string) => {
    const colors = {
      debit: 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100',
      savings: 'bg-blue-100 text-blue-800 hover:bg-blue-100',
      credit: 'bg-red-100 text-red-800 hover:bg-red-100',
    };
    const labels = {
      debit: 'Débito',
      savings: 'Ahorro',
      credit: 'Crédito',
    };
    return (
      <Badge variant="secondary" className={colors[type as keyof typeof colors]}>
        {labels[type as keyof typeof labels]}
      </Badge>
    );
  };

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
              {clientAccounts.map((account) => (
                <TableRow key={account.id}>
                  <TableCell>{getAccountTypeBadge(account.type)}</TableCell>
                  <TableCell className="font-mono">{account.accountNumber}</TableCell>
                  <TableCell className="text-lg">
                    ${account.balance.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
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
