import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { mockAccounts } from '../../lib/mockData';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface ClientTransferProps {
  clientId: number;
}

export function ClientTransfer({ clientId }: ClientTransferProps) {
  const [fromAccount, setFromAccount] = useState('');
  const [toAccount, setToAccount] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const clientAccounts = mockAccounts.filter(a => a.clientId === clientId);

  const handleTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!fromAccount || !toAccount || !amount) {
      toast.error('Por favor completa todos los campos requeridos');
      return;
    }

    if (fromAccount === toAccount) {
      toast.error('No puedes transferir a la misma cuenta');
      return;
    }

    const amountNum = parseFloat(amount);
    const sourceAccount = clientAccounts.find(a => a.accountNumber === fromAccount);
    
    if (sourceAccount && amountNum > sourceAccount.balance) {
      toast.error('Saldo insuficiente');
      return;
    }

    // Simular transferencia exitosa
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      setFromAccount('');
      setToAccount('');
      setAmount('');
      setDescription('');
      toast.success('Transferencia realizada exitosamente');
    }, 2000);
  };

  if (showSuccess) {
    return (
      <div className="space-y-6">
        <Card className="shadow-lg border-2 border-emerald-500">
          <CardContent className="p-12 text-center">
            <CheckCircle2 className="h-24 w-24 text-emerald-500 mx-auto mb-6" />
            <h2 className="text-emerald-700 mb-2">¡Transferencia Exitosa!</h2>
            <p className="text-muted-foreground">
              Tu transferencia de ${parseFloat(amount).toFixed(2)} ha sido procesada correctamente
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2>Realizar Transferencia</h2>
        <p className="text-muted-foreground">Transfiere dinero entre cuentas</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Transfer Form */}
        <div className="lg:col-span-2">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>Nueva Transferencia</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleTransfer} className="space-y-6">
                {/* From Account */}
                <div className="space-y-2">
                  <Label htmlFor="from">Cuenta origen</Label>
                  <Select value={fromAccount} onValueChange={setFromAccount}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una cuenta" />
                    </SelectTrigger>
                    <SelectContent>
                      {clientAccounts.map((account) => (
                        <SelectItem key={account.id} value={account.accountNumber}>
                          {account.accountNumber} - ${account.balance.toFixed(2)} ({account.type})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Arrow Indicator */}
                <div className="flex justify-center">
                  <ArrowRight className="h-6 w-6 text-[#0B132B]" />
                </div>

                {/* To Account */}
                <div className="space-y-2">
                  <Label htmlFor="to">Cuenta destino</Label>
                  <Input
                    id="to"
                    placeholder="Número de cuenta destino"
                    value={toAccount}
                    onChange={(e) => setToAccount(e.target.value)}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Puede ser una cuenta propia u otra cuenta
                  </p>
                </div>

                {/* Amount */}
                <div className="space-y-2">
                  <Label htmlFor="amount">Monto</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">Descripción (opcional)</Label>
                  <Textarea
                    id="description"
                    placeholder="Concepto de la transferencia"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                  />
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full bg-[#0B132B] hover:bg-[#1C2541]"
                >
                  Confirmar Transferencia
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Summary */}
        <div className="lg:col-span-1">
          <Card className="shadow-md sticky top-6">
            <CardHeader>
              <CardTitle>Resumen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Cuenta origen</p>
                <p className="font-mono">{fromAccount || 'No seleccionada'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Cuenta destino</p>
                <p className="font-mono">{toAccount || 'No ingresada'}</p>
              </div>
              <div className="border-t pt-4">
                <p className="text-sm text-muted-foreground mb-1">Monto a transferir</p>
                <p className="text-2xl">${amount ? parseFloat(amount).toFixed(2) : '0.00'}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
