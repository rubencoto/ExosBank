import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { ArrowUpRight, ArrowDownLeft, CreditCard } from 'lucide-react';
import { useState, useEffect } from 'react';

interface ClientHistoryProps {
  clientId: number;
}

interface Transaccion {
  id: number;
  fecha: string;
  tipo: string;
  descripcion: string;
  origen: string;
  destino: string;
  monto: number;
  estado: string;
  es_enviada: boolean;
  numero_cuenta: string;
}

interface Cuenta {
  numero_cuenta: string;
  tipo_cuenta: number;
  tipo_cuenta_nombre: string;
}

interface HistorialData {
  cuentas: Cuenta[];
  transacciones: Transaccion[];
  total: number;
  enviadas: number;
  recibidas: number;
}

export function ClientHistory({ clientId }: ClientHistoryProps) {
  const [historial, setHistorial] = useState<HistorialData>({
    cuentas: [],
    transacciones: [],
    total: 0,
    enviadas: 0,
    recibidas: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchHistorial();
  }, [clientId]);

  const fetchHistorial = async () => {
    try {
      const response = await fetch('http://localhost/ExosBank/api/transacciones/historial.php', {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Error al obtener historial');
      }

      const data = await response.json();

      if (data.status === 'ok') {
        setHistorial(data.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  // Agrupar transacciones por cuenta
  const transaccionesPorCuenta: Record<string, { cuenta: Cuenta, transacciones: Transaccion[] }> = historial.cuentas.reduce((acc, cuenta) => {
    const transacciones = historial.transacciones.filter(t => 
      t.origen === cuenta.numero_cuenta || t.destino === cuenta.numero_cuenta
    );
    acc[cuenta.numero_cuenta] = {
      cuenta,
      transacciones
    };
    return acc;
  }, {} as Record<string, { cuenta: Cuenta, transacciones: Transaccion[] }>);

  const getAccountTypeBadge = (tipo: number) => {
    const config = {
      1: { color: 'bg-emerald-100 text-emerald-800', label: 'Corriente', icon: '💳' },
      2: { color: 'bg-blue-100 text-blue-800', label: 'Ahorro', icon: '🏦' },
    };
    
    const item = config[tipo as keyof typeof config] || config[1];
    
    return (
      <Badge variant="secondary" className={item.color}>
        <span className="mr-1">{item.icon}</span>
        {item.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando historial...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h2>Historial de Transacciones</h2>
          <p className="text-muted-foreground">Revisa todas tus operaciones</p>
        </div>
        <Card className="shadow-md border-red-200">
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <p className="text-red-600 mb-2">⚠️ Error al cargar historial</p>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Historial de Transacciones</h2>
        <p className="text-muted-foreground">Revisa todas tus operaciones por cuenta</p>
      </div>

      {/* Mostrar mensaje si no hay cuentas */}
      {historial.cuentas.length === 0 ? (
        <Card className="shadow-md">
          <CardContent className="py-12">
            <div className="text-center">
              <CreditCard className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-xl font-semibold mb-2">No tienes cuentas registradas</h3>
              <p className="text-muted-foreground">
                Crea una cuenta para empezar a realizar transacciones
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Transacciones agrupadas por cuenta */}
          {Object.entries(transaccionesPorCuenta).map(([numeroCuenta, { cuenta, transacciones }]) => (
            <Card key={numeroCuenta} className="shadow-md">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {cuenta.tipo_cuenta === 1 ? (
                      <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center text-2xl">
                        💳
                      </div>
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-2xl">
                        🏦
                      </div>
                    )}
                    <div>
                      <CardTitle className="text-2xl">
                        Cuenta de {cuenta.tipo_cuenta_nombre}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground font-mono mt-1">
                        {numeroCuenta}
                      </p>
                    </div>
                  </div>
                  {getAccountTypeBadge(cuenta.tipo_cuenta)}
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                {transacciones.length === 0 ? (
                  <div className="text-center py-8">
                    <CreditCard className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-40" />
                    <p className="text-muted-foreground text-lg">
                      No hay transacciones para mostrar
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Esta cuenta no tiene movimientos registrados
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Fecha</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Descripción</TableHead>
                          <TableHead>Destino/Origen</TableHead>
                          <TableHead className="text-right">Monto</TableHead>
                          <TableHead>Estado</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {transacciones.map((transaccion) => {
                          const esEnviada = transaccion.origen === numeroCuenta;
                          const otraCuenta = esEnviada ? transaccion.destino : transaccion.origen;
                          
                          return (
                            <TableRow key={transaccion.id}>
                              <TableCell className="whitespace-nowrap">
                                {new Date(transaccion.fecha).toLocaleDateString('es-ES', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric'
                                })}
                                <div className="text-xs text-muted-foreground">
                                  {new Date(transaccion.fecha).toLocaleTimeString('es-ES', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className={esEnviada ? 'text-red-700 border-red-300 bg-red-50' : 'text-emerald-700 border-emerald-300 bg-emerald-50'}
                                >
                                  {esEnviada ? (
                                    <ArrowUpRight className="h-3 w-3 mr-1" />
                                  ) : (
                                    <ArrowDownLeft className="h-3 w-3 mr-1" />
                                  )}
                                  {esEnviada ? 'Enviado' : 'Recibido'}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-sm max-w-[200px] truncate">
                                {transaccion.descripcion}
                              </TableCell>
                              <TableCell className="font-mono text-xs">
                                {otraCuenta}
                              </TableCell>
                              <TableCell className={`font-semibold text-right text-lg ${esEnviada ? 'text-red-600' : 'text-emerald-600'}`}>
                                {esEnviada ? '-' : '+'}₡{transaccion.monto.toLocaleString('es-CR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </TableCell>
                              <TableCell>
                                <Badge 
                                  variant={transaccion.estado === 'Completada' ? 'default' : 'secondary'}
                                  className={transaccion.estado === 'Completada' ? 'bg-green-100 text-green-800' : ''}
                                >
                                  {transaccion.estado}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </>
      )}
    </div>
  );
}
