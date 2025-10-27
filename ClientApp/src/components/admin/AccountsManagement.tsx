import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { mockAccounts, mockTransactions } from '../../lib/mockData';
import { CreditCard, Trash2, Plus, TrendingUp } from 'lucide-react';

export function AccountsManagement() {
  const [accounts] = useState(mockAccounts);
  const [transactions] = useState(mockTransactions);

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
      <div className="flex justify-between items-center">
        <div>
          <h2>Gestión de Cuentas y Transacciones</h2>
          <p className="text-muted-foreground">Administra cuentas bancarias y transacciones</p>
        </div>
      </div>

      <Tabs defaultValue="accounts" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="accounts">Cuentas</TabsTrigger>
          <TabsTrigger value="transactions">Transacciones</TabsTrigger>
        </TabsList>

        {/* Accounts Tab */}
        <TabsContent value="accounts" className="space-y-4">
          <div className="flex justify-end">
            <Button className="bg-[#10b981] hover:bg-[#059669]">
              <Plus className="h-4 w-4 mr-2" />
              Nueva Cuenta
            </Button>
          </div>

          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>Listado de Cuentas</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Número de Cuenta</TableHead>
                    <TableHead>Saldo</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {accounts.map((account) => (
                    <TableRow key={account.id}>
                      <TableCell>#{account.id}</TableCell>
                      <TableCell>{account.clientName}</TableCell>
                      <TableCell>{getAccountTypeBadge(account.type)}</TableCell>
                      <TableCell className="font-mono">{account.accountNumber}</TableCell>
                      <TableCell className="font-semibold">${account.balance.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            <TrendingUp className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
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
        </TabsContent>

        {/* Transactions Tab */}
        <TabsContent value="transactions" className="space-y-4">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>Historial de Transacciones</CardTitle>
            </CardHeader>
            <CardContent>
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
                        {new Date(transaction.date).toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </TableCell>
                      <TableCell className="capitalize">
                        <Badge variant="outline">{transaction.type}</Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{transaction.fromAccount}</TableCell>
                      <TableCell className="font-mono text-xs">{transaction.toAccount}</TableCell>
                      <TableCell className="font-semibold">${transaction.amount.toFixed(2)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{transaction.description}</TableCell>
                      <TableCell>
                        <Badge variant={transaction.status === 'completed' ? 'default' : 'secondary'}>
                          {transaction.status === 'completed' ? 'Completada' : 'Pendiente'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
