import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { ArrowUpRight, ArrowDownLeft, TrendingUp } from 'lucide-react';
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
}

interface HistorialData {
  transacciones: Transaccion[];
  total: number;
  enviadas: number;
  recibidas: number;
}

export function ClientHistory({ clientId }: ClientHistoryProps) {
  const [historial, setHistorial] = useState<HistorialData>({
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

  if (loading) {
    return <div>Cargando historial...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

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
                <p className="text-2xl">{historial.total}</p>
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
                  {historial.enviadas}
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
                  {historial.recibidas}
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
              {historial.transacciones.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No hay transacciones registradas
                  </TableCell>
                </TableRow>
              ) : (
                historial.transacciones.map((transaccion) => {
                  return (
                    <TableRow key={transaccion.id}>
                      <TableCell>
                        {new Date(transaccion.fecha).toLocaleDateString('es-ES', {
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
                          className={transaccion.es_enviada ? 'text-red-700 border-red-300' : 'text-emerald-700 border-emerald-300'}
                        >
                          {transaccion.es_enviada ? (
                            <ArrowUpRight className="h-3 w-3 mr-1" />
                          ) : (
                            <ArrowDownLeft className="h-3 w-3 mr-1" />
                          )}
                          {transaccion.es_enviada ? 'Enviado' : 'Recibido'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{transaccion.descripcion}</TableCell>
                      <TableCell className="font-mono text-xs">{transaccion.origen}</TableCell>
                      <TableCell className="font-mono text-xs">{transaccion.destino}</TableCell>
                      <TableCell className={`${transaccion.es_enviada ? 'text-red-600' : 'text-emerald-600'}`}>
                        {transaccion.es_enviada ? '-' : '+'}₡{transaccion.monto.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={transaccion.estado === 'Completada' ? 'default' : 'secondary'}>
                          {transaccion.estado}
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
