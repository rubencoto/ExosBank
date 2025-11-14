import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { mockAccounts } from '../../lib/mockData';
import { ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

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
            <h2 className="text-3xl font-bold text-emerald-700 mb-2">¡Transferencia Exitosa!</h2>
            <p className="text-muted-foreground text-lg">
              Tu transferencia de ${parseFloat(amount).toLocaleString('es-ES', { minimumFractionDigits: 2 })} ha sido procesada correctamente
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const selectedSourceAccount = clientAccounts.find(a => a.accountNumber === fromAccount);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Realizar Transferencia</h2>
        <p className="text-muted-foreground">Transfiere dinero entre cuentas</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Transfer Form */}
        <div className="lg:col-span-2">
          <Card className="shadow-md">
            <CardHeader className="border-b bg-muted/30">
              <CardTitle className="text-xl">Nueva Transferencia</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleTransfer} className="space-y-6">
                {/* From Account */}
                <div className="space-y-2">
                  <Label htmlFor="from" className="text-base font-medium">Cuenta origen</Label>
                  <Select value={fromAccount} onValueChange={setFromAccount}>
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Selecciona una cuenta" />
                    </SelectTrigger>
                    <SelectContent>
                      {clientAccounts.map((account) => (
                        <SelectItem key={account.id} value={account.accountNumber}>
                          <div className="flex items-center gap-2">
                            <span className="font-mono">{account.accountNumber}</span>
                            <span className="text-muted-foreground">•</span>
                            <span className="font-semibold">${account.balance.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedSourceAccount && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      Saldo disponible: ${selectedSourceAccount.balance.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                    </p>
                  )}
                </div>

                {/* Arrow Indicator */}
                <div className="flex justify-center">
                  <div className="bg-muted p-3 rounded-full">
                    <ArrowRight className="h-6 w-6 text-primary" />
                  </div>
                </div>

                {/* To Account */}
                <div className="space-y-2">
                  <Label htmlFor="to" className="text-base font-medium">Cuenta destino</Label>
                  <Input
                    id="to"
                    placeholder="Número de cuenta destino"
                    value={toAccount}
                    onChange={(e) => setToAccount(e.target.value)}
                    className="h-12 font-mono"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Puede ser una cuenta propia u otra cuenta
                  </p>
                </div>

                {/* Amount */}
                <div className="space-y-2">
                  <Label htmlFor="amount" className="text-base font-medium">Monto</Label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg text-muted-foreground">$</span>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      min="0.01"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="h-12 pl-8 text-lg font-semibold"
                      required
                    />
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-base font-medium">Descripción (opcional)</Label>
                  <Textarea
                    id="description"
                    placeholder="Concepto de la transferencia"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="resize-none"
                  />
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full bg-[#0B132B] hover:bg-[#1C2541] h-12 text-base font-semibold"
                  size="lg"
                >
                  Confirmar Transferencia
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Summary */}
        <div className="lg:col-span-1">
          <Card className="shadow-md sticky top-6 border-2">
            <CardHeader className="border-b bg-muted/30">
              <CardTitle className="text-xl">Resumen</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div>
                <p className="text-sm text-muted-foreground mb-2 font-medium">Cuenta origen</p>
                <p className="font-mono text-sm bg-muted px-3 py-2 rounded">
                  {fromAccount || 'No seleccionada'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2 font-medium">Cuenta destino</p>
                <p className="font-mono text-sm bg-muted px-3 py-2 rounded">
                  {toAccount || 'No ingresada'}
                </p>
              </div>
              <div className="border-t pt-6">
                <p className="text-sm text-muted-foreground mb-2 font-medium">Monto a transferir</p>
                <p className="text-4xl font-bold text-primary">
                  ${amount ? parseFloat(amount).toLocaleString('es-ES', { minimumFractionDigits: 2 }) : '0.00'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
