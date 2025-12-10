import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface ClientTransferProps {
  clientId: number;
}

export function ClientTransfer({ clientId }: ClientTransferProps) {
  interface CuentaUsuario {
    id_cuenta: number;
    numero_cuenta: string;
    tipo_cuenta: number;
    saldo: number;
  }

  const [accounts, setAccounts] = useState<CuentaUsuario[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [accountsError, setAccountsError] = useState('');
  const [fromAccount, setFromAccount] = useState('');
  const [toAccount, setToAccount] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchAccounts();
  }, [clientId]);

  const fetchAccounts = async () => {
    try {
      setLoadingAccounts(true);
      setAccountsError('');

      const response = await fetch('/api/usuarios/cuentas.php', {
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al obtener cuentas');
      }

      const data = await response.json();

      if (data.status === 'ok' && data.data?.cuentas) {
        setAccounts(data.data.cuentas);
        // Mantener seleccionada la cuenta previa si sigue disponible
        if (fromAccount && !data.data.cuentas.some((c: CuentaUsuario) => c.numero_cuenta === fromAccount)) {
          setFromAccount('');
        }
      } else {
        throw new Error(data.message || 'No se pudieron obtener las cuentas');
      }
    } catch (err) {
      console.error('Error al cargar cuentas para transferencias:', err);
      setAccountsError(err instanceof Error ? err.message : 'Error de conexión');
    } finally {
      setLoadingAccounts(false);
    }
  };

  const handleTransfer = async (e: React.FormEvent) => {
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
    const sourceAccount = accounts.find(a => a.numero_cuenta === fromAccount);
    
    if (sourceAccount && amountNum > sourceAccount.saldo) {
      toast.error('Saldo insuficiente');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/transacciones/transferir.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          cuenta_origen: fromAccount,
          cuenta_destino: toAccount,
          monto: amountNum,
          descripcion: description,
        })
      });

      // Verificar si la respuesta tiene contenido antes de parsear JSON
      const text = await response.text();
      
      if (!text) {
        throw new Error('El servidor no devolvió ninguna respuesta');
      }

      let data;
      try {
        data = JSON.parse(text);
      } catch (jsonError) {
        console.error('Respuesta del servidor:', text);
        throw new Error('El servidor devolvió una respuesta inválida');
      }

      if (!response.ok || data.status !== 'ok') {
        throw new Error(data.message || 'No se pudo completar la transferencia');
      }

      setShowSuccess(true);
      toast.success('Transferencia realizada exitosamente');
      await fetchAccounts();
      setTimeout(() => {
        setShowSuccess(false);
        setFromAccount('');
        setToAccount('');
        setAmount('');
        setDescription('');
      }, 1500);
    } catch (err) {
      console.error('Error en transferencia:', err);
      toast.error(err instanceof Error ? err.message : 'Error de conexión con el servidor');
    } finally {
      setIsSubmitting(false);
    }
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

  const selectedSourceAccount = accounts.find(a => a.numero_cuenta === fromAccount);

  if (loadingAccounts) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando cuentas disponibles...</p>
        </div>
      </div>
    );
  }

  if (accountsError) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold">Realizar Transferencia</h2>
          <p className="text-muted-foreground">No pudimos cargar tus cuentas bancarias.</p>
        </div>
        <Card className="shadow-md border-red-200">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="rounded-full bg-red-100 p-3">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Error al cargar cuentas</h3>
                <p className="text-sm text-muted-foreground mb-4">{accountsError}</p>
                {accountsError.includes('IP address') && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-left text-sm">
                    <p className="font-semibold text-yellow-800 mb-2">💡 Solución:</p>
                    <p className="text-yellow-700">
                      Autoriza tu IP en Azure SQL Database desde el portal antes de intentar de nuevo.
                    </p>
                  </div>
                )}
                <Button onClick={fetchAccounts} className="mt-4">
                  Reintentar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (accounts.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold">Realizar Transferencia</h2>
          <p className="text-muted-foreground">Aún no tienes cuentas activas para transferir.</p>
        </div>
        <Card className="shadow-md">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">Solicita a un administrador la creación de tu primera cuenta bancaria.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

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
                      {accounts.map((account) => (
                        <SelectItem key={account.id_cuenta} value={account.numero_cuenta}>
                          <div className="flex items-center gap-2">
                            <span className="font-mono">{account.numero_cuenta}</span>
                            <span className="text-muted-foreground">•</span>
                            <span className="font-semibold">${account.saldo.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedSourceAccount && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      Saldo disponible: ${selectedSourceAccount.saldo.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
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
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Procesando...' : 'Confirmar Transferencia'}
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
