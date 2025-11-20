import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { ArrowUpRight, ArrowDownLeft, CreditCard, TrendingUp } from 'lucide-react';
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
      const response = await fetch('/api/transacciones/historial.php', {
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al obtener historial');
      }

      const data = await response.json();

      if (data.status === 'ok') {
        setHistorial(data.data);
        setError(''); // Limpiar cualquier error previo
      } else {
        throw new Error(data.message || 'Error al procesar historial');
      }
    } catch (err) {
      console.error('Error al cargar historial:', err);
      setError(err instanceof Error ? err.message : 'Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  // Agrupar transacciones por cuenta - Ya no se usa, se muestran todas juntas
  // const transaccionesPorCuenta: Record<string, { cuenta: Cuenta, transacciones: Transaccion[] }> = historial.cuentas.reduce((acc, cuenta) => {
  //   const transacciones = historial.transacciones.filter(t => 
  //     t.origen === cuenta.numero_cuenta || t.destino === cuenta.numero_cuenta
  //   );
  //   acc[cuenta.numero_cuenta] = {
  //     cuenta,
  //     transacciones
  //   };
  //   return acc;
  // }, {} as Record<string, { cuenta: Cuenta, transacciones: Transaccion[] }>);

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
          <h2 className="text-3xl font-bold">Historial de Transacciones</h2>
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
        <p className="text-muted-foreground">Revisa todas tus operaciones</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="shadow-md border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground font-medium">Total Transacciones</p>
              <TrendingUp className="h-5 w-5 text-blue-500" />
            </div>
            <p className="text-4xl font-bold">{historial.total}</p>
          </CardContent>
        </Card>

        <Card className="shadow-md border-l-4 border-l-red-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground font-medium">Enviadas</p>
              <ArrowUpRight className="h-5 w-5 text-red-500" />
            </div>
            <p className="text-4xl font-bold">{historial.enviadas}</p>
          </CardContent>
        </Card>

        <Card className="shadow-md border-l-4 border-l-emerald-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground font-medium">Recibidas</p>
              <ArrowDownLeft className="h-5 w-5 text-emerald-500" />
            </div>
            <p className="text-4xl font-bold">{historial.recibidas}</p>
          </CardContent>
        </Card>
      </div>

      {/* Movimientos Recientes - Tabla única */}
      <Card className="shadow-md">
        <CardHeader className="border-b">
          <CardTitle className="text-xl">Movimientos Recientes</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {historial.transacciones.length === 0 ? (
            <div className="text-center py-12">
              <CreditCard className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-xl font-semibold mb-2">No hay transacciones</h3>
              <p className="text-muted-foreground">
                Aún no tienes movimientos registrados
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold">Fecha</TableHead>
                    <TableHead className="font-semibold">Tipo</TableHead>
                    <TableHead className="font-semibold">Descripción</TableHead>
                    <TableHead className="font-semibold">Origen</TableHead>
                    <TableHead className="font-semibold">Destino</TableHead>
                    <TableHead className="font-semibold text-right">Monto</TableHead>
                    <TableHead className="font-semibold">Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {historial.transacciones.map((transaccion) => {
                    const esEnviada = historial.cuentas.some(c => c.numero_cuenta === transaccion.origen);
                    
                    return (
                      <TableRow key={transaccion.id} className="hover:bg-muted/30">
                        <TableCell className="whitespace-nowrap">
                          {new Date(transaccion.fecha).toLocaleDateString('es-ES', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
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
                              <>
                                <ArrowUpRight className="h-3 w-3 mr-1" />
                                Enviado
                              </>
                            ) : (
                              <>
                                <ArrowDownLeft className="h-3 w-3 mr-1" />
                                Recibido
                              </>
                            )}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-[200px]">
                          <span className="font-medium">{transaccion.descripcion}</span>
                        </TableCell>
                        <TableCell className="font-mono text-sm text-muted-foreground">
                          {transaccion.origen}
                        </TableCell>
                        <TableCell className="font-mono text-sm text-muted-foreground">
                          {transaccion.destino}
                        </TableCell>
                        <TableCell className={`font-semibold text-right ${esEnviada ? 'text-red-600' : 'text-emerald-600'}`}>
                          {esEnviada ? '-' : '+'}${transaccion.monto.toLocaleString('es-ES', { 
                            minimumFractionDigits: 2, 
                            maximumFractionDigits: 2 
                          })}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="secondary"
                            className="bg-emerald-100 text-emerald-800 border-emerald-200"
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
    </div>
  );
}
