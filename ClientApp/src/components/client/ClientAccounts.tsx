import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Plus, CheckCircle2 } from 'lucide-react';

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
  const [showNewAccountModal, setShowNewAccountModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [selectedAccountType, setSelectedAccountType] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [userInfo, setUserInfo] = useState<any>(null);

  useEffect(() => {
    fetchCuentas();
    fetchUserInfo();
  }, [clientId]);

  const fetchUserInfo = async () => {
    try {
      const response = await fetch('/api/usuarios/me.php', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        if (data.status === 'ok') {
          setUserInfo(data.data);
        }
      }
    } catch (err) {
      console.error('Error al cargar información del usuario:', err);
    }
  };

  const fetchCuentas = async () => {
    try {
      const response = await fetch('/api/usuarios/cuentas.php', {
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

  const handleRequestNewAccount = async () => {
    if (!selectedAccountType) {
      toast.error('Por favor selecciona un tipo de cuenta');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/usuarios/solicitar-cuenta.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          tipo_cuenta: parseInt(selectedAccountType)
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setShowNewAccountModal(false);
        setShowSuccessModal(true);
        setSelectedAccountType('');
        
        // Recargar cuentas después de 2 segundos
        setTimeout(() => {
          fetchCuentas();
          setShowSuccessModal(false);
        }, 2000);
      } else {
        toast.error(data.message || 'Error al solicitar la cuenta');
      }
    } catch (err) {
      console.error('Error al solicitar cuenta:', err);
      toast.error('Error de conexión al solicitar la cuenta');
    } finally {
      setSubmitting(false);
    }
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
      <div className="flex justify-between items-center">
        <div>
          <h2>Mis Cuentas</h2>
          <p className="text-muted-foreground">Administra tus cuentas bancarias</p>
        </div>
        <Button 
          onClick={() => setShowNewAccountModal(true)}
          className="bg-[#0B132B] hover:bg-[#1C2541]"
        >
          <Plus className="h-4 w-4 mr-2" />
          Solicitar Cuenta Adicional
        </Button>
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

      {/* Modal para solicitar nueva cuenta */}
      <Dialog open={showNewAccountModal} onOpenChange={setShowNewAccountModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Solicitar Cuenta Adicional</DialogTitle>
            <DialogDescription>
              Completa la información para solicitar una nueva cuenta bancaria
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Información del usuario (precargada y no editable) */}
            <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-sm text-gray-700">Datos del Titular</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-gray-600">Nombre Completo</Label>
                  <p className="text-sm font-medium mt-1">{userInfo?.nombre || 'Cargando...'}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-600">Cédula</Label>
                  <p className="text-sm font-medium mt-1">{userInfo?.cedula || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-600">Correo Electrónico</Label>
                  <p className="text-sm font-medium mt-1">{userInfo?.correo || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-600">Teléfono</Label>
                  <p className="text-sm font-medium mt-1">{userInfo?.telefono || 'N/A'}</p>
                </div>
              </div>
              
              <div>
                <Label className="text-xs text-gray-600">Dirección</Label>
                <p className="text-sm font-medium mt-1">{userInfo?.direccion || 'N/A'}</p>
              </div>

              <div className="flex items-center gap-2 text-xs text-emerald-600 mt-2">
                <CheckCircle2 className="h-4 w-4" />
                <span>Datos verificados automáticamente</span>
              </div>
            </div>

            {/* Selección de tipo de cuenta */}
            <div className="space-y-2">
              <Label htmlFor="tipo_cuenta">
                Tipo de Cuenta <span className="text-red-500">*</span>
              </Label>
              <Select value={selectedAccountType} onValueChange={setSelectedAccountType}>
                <SelectTrigger id="tipo_cuenta">
                  <SelectValue placeholder="Selecciona el tipo de cuenta" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">
                    <div className="flex items-center gap-2">
                      <span>💳</span>
                      <span>Cuenta Corriente</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="2">
                    <div className="flex items-center gap-2">
                      <span>🏦</span>
                      <span>Cuenta de Ahorro</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {selectedAccountType === '1' && '💡 Ideal para movimientos frecuentes y pagos diarios'}
                {selectedAccountType === '2' && '💡 Perfecta para guardar dinero y generar intereses'}
              </p>
            </div>

            {/* Nota informativa */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-800">
                <strong>ℹ️ Nota:</strong> Tu solicitud será procesada automáticamente y tu nueva cuenta 
                estará disponible de inmediato con un saldo inicial de ₡0.00
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowNewAccountModal(false);
                setSelectedAccountType('');
              }}
              disabled={submitting}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleRequestNewAccount}
              disabled={!selectedAccountType || submitting}
              className="flex-1 bg-[#0B132B] hover:bg-[#1C2541]"
            >
              {submitting ? 'Procesando...' : 'Confirmar Solicitud'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de éxito */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="sm:max-w-[400px]">
          <div className="flex flex-col items-center gap-4 py-6 text-center">
            <div className="rounded-full bg-emerald-100 p-3">
              <CheckCircle2 className="h-12 w-12 text-emerald-600" />
            </div>
            <div>
              <DialogTitle className="text-2xl mb-2">¡Cuenta Creada!</DialogTitle>
              <DialogDescription className="text-base">
                Tu nueva cuenta ha sido creada exitosamente y ya está disponible para usar.
              </DialogDescription>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
