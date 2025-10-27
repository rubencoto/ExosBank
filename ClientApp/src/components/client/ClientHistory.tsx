import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { mockTransactions, mockAccounts } from '../../lib/mockData';
import { ArrowUpRight, ArrowDownLeft, TrendingUp } from 'lucide-react';

interface ClientHistoryProps {
  clientId: number;
}

export function ClientHistory({ clientId }: ClientHistoryProps) {
  const clientAccounts = mockAccounts.filter(a => a.clientId === clientId);
  const accountNumbers = clientAccounts.map(a => a.accountNumber);
  
  // Filtrar transacciones que involucran las cuentas del cliente
  const clientTransactions = mockTransactions.filter(
    t => accountNumbers.includes(t.fromAccount) || accountNumbers.includes(t.toAccount)
  );

  const getTransactionType = (transaction: any) => {
    const isOutgoing = accountNumbers.includes(transaction.fromAccount);
    return isOutgoing ? 'outgoing' : 'incoming';
  };

  return (
    <div className="space-y-6">
      <div>
        <h2>Historial de Transacciones</h2>
        <p className="text-muted-foreground">Revisa todas tus operaciones</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Transacciones</p>
                <p className="text-2xl">{clientTransactions.length}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Enviadas</p>
                <p className="text-2xl text-red-600">
                  {clientTransactions.filter(t => accountNumbers.includes(t.fromAccount)).length}
                </p>
              </div>
              <ArrowUpRight className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Recibidas</p>
                <p className="text-2xl text-emerald-600">
                  {clientTransactions.filter(t => accountNumbers.includes(t.toAccount)).length}
                </p>
              </div>
              <ArrowDownLeft className="h-8 w-8 text-emerald-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transactions Table */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Movimientos Recientes</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Origen</TableHead>
                <TableHead>Destino</TableHead>
                <TableHead>Monto</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clientTransactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No hay transacciones registradas
                  </TableCell>
                </TableRow>
              ) : (
                clientTransactions.map((transaction) => {
                  const type = getTransactionType(transaction);
                  return (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        {new Date(transaction.date).toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={type === 'outgoing' ? 'text-red-700 border-red-300' : 'text-emerald-700 border-emerald-300'}
                        >
                          {type === 'outgoing' ? (
                            <ArrowUpRight className="h-3 w-3 mr-1" />
                          ) : (
                            <ArrowDownLeft className="h-3 w-3 mr-1" />
                          )}
                          {type === 'outgoing' ? 'Enviado' : 'Recibido'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{transaction.description}</TableCell>
                      <TableCell className="font-mono text-xs">{transaction.fromAccount}</TableCell>
                      <TableCell className="font-mono text-xs">{transaction.toAccount}</TableCell>
                      <TableCell className={`${type === 'outgoing' ? 'text-red-600' : 'text-emerald-600'}`}>
                        {type === 'outgoing' ? '-' : '+'}${transaction.amount.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={transaction.status === 'completed' ? 'default' : 'secondary'}>
                          {transaction.status === 'completed' ? 'Completada' : 'Pendiente'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
