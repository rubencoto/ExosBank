import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { 
  Shield, Search, RefreshCw, Calendar, User, Activity, AlertCircle, 
  Eye, Download, Filter, Clock, Database, UserCheck 
} from 'lucide-react';
import { toast } from 'sonner';

interface EventoAuditoria {
  id: number;
  accion: string;
  tabla_afectada: string;
  id_registro_afectado: string;
  datos_anteriores: any;
  datos_nuevos: any;
  ip_usuario: string;
  user_agent: string;
  fecha_evento: string;
  id_usuario: number;
  nombre_usuario: string;
  correo_usuario: string;
}

interface EstadisticasAuditoria {
  total_eventos: number;
  usuarios_activos: number;
  eventos_ultima_semana: number;
  eventos_ultimo_dia: number;
}

interface AccionFrecuente {
  accion: string;
  frecuencia: number;
}

interface UsuarioActivo {
  nombre: string;
  eventos: number;
}

interface AuditoriaData {
  eventos: EventoAuditoria[];
  estadisticas: EstadisticasAuditoria;
  acciones_frecuentes: AccionFrecuente[];
  usuarios_activos: UsuarioActivo[];
}

export function AuditLog() {
  const [auditoria, setAuditoria] = useState<AuditoriaData>({
    eventos: [],
    estadisticas: {
      total_eventos: 0,
      usuarios_activos: 0,
      eventos_ultima_semana: 0,
      eventos_ultimo_dia: 0
    },
    acciones_frecuentes: [],
    usuarios_activos: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<EventoAuditoria | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  
  // Filtros
  const [filtros, setFiltros] = useState({
    usuario: '',
    accion: '',
    fecha_desde: '',
    fecha_hasta: '',
    limite: '100'
  });

  useEffect(() => {
    fetchAuditoria();
  }, []);

  const fetchAuditoria = async () => {
    try {
      setLoading(true);
      setError('');

      // Construir query string con filtros
      const queryParams = new URLSearchParams();
      Object.entries(filtros).forEach(([key, value]) => {
        if (value) {
          queryParams.append(key, value as string);
        }
      });

      const response = await fetch(`/api/admin/auditoria.php?${queryParams.toString()}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al obtener auditoría');
      }

      const data = await response.json();

      if (data.status === 'ok') {
        setAuditoria(data.data);
      } else {
        throw new Error(data.message || 'Error al cargar auditoría');
      }
    } catch (err) {
      console.error('Error al cargar auditoría:', err);
      setError(err instanceof Error ? err.message : 'Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFiltros(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const applyFilters = () => {
    fetchAuditoria();
  };

  const clearFilters = () => {
    setFiltros({
      usuario: '',
      accion: '',
      fecha_desde: '',
      fecha_hasta: '',
      limite: '100'
    });
  };

  const showEventDetail = (evento: EventoAuditoria) => {
    setSelectedEvent(evento);
    setIsDetailOpen(true);
  };

  const getActionColor = (accion: string) => {
    const colors = {
      'login': 'bg-green-100 text-green-800',
      'logout': 'bg-gray-100 text-gray-800',
      'create': 'bg-blue-100 text-blue-800',
      'update': 'bg-yellow-100 text-yellow-800',
      'delete': 'bg-red-100 text-red-800',
      'transfer': 'bg-purple-100 text-purple-800',
      'default': 'bg-gray-100 text-gray-800'
    };
    
    const lowerAction = accion.toLowerCase();
    for (const [key, color] of Object.entries(colors)) {
      if (lowerAction.includes(key)) {
        return color;
      }
    }
    return colors.default;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-CR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const exportAuditoria = () => {
    toast.info('Función de exportación en desarrollo');
  };

  if (loading && auditoria.eventos.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando registros de auditoría...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">Auditoría del Sistema</h2>
          <p className="text-muted-foreground">Registro completo de actividades y eventos</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportAuditoria}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button 
            onClick={fetchAuditoria}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        </div>
      </div>

      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {/* Estadísticas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Eventos</p>
                <p className="text-2xl font-bold">{auditoria.estadisticas.total_eventos.toLocaleString()}</p>
              </div>
              <Database className="h-8 w-8 text-[#0B132B]" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Usuarios Activos</p>
                <p className="text-2xl font-bold">{auditoria.estadisticas.usuarios_activos.toLocaleString()}</p>
              </div>
              <UserCheck className="h-8 w-8 text-[#0B132B]" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Última Semana</p>
                <p className="text-2xl font-bold">{auditoria.estadisticas.eventos_ultima_semana.toLocaleString()}</p>
              </div>
              <Calendar className="h-8 w-8 text-[#0B132B]" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Último Día</p>
                <p className="text-2xl font-bold">{auditoria.estadisticas.eventos_ultimo_dia.toLocaleString()}</p>
              </div>
              <Clock className="h-8 w-8 text-[#0B132B]" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Acciones más frecuentes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Acciones Frecuentes
            </CardTitle>
            <CardDescription>Últimos 30 días</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {auditoria.acciones_frecuentes.map((accion, index) => (
                <div key={index} className="flex items-center justify-between">
                  <Badge variant="outline" className={getActionColor(accion.accion)}>
                    {accion.accion}
                  </Badge>
                  <span className="text-sm font-medium">{accion.frecuencia}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Usuarios más activos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Usuarios Activos
            </CardTitle>
            <CardDescription>Últimos 30 días</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {auditoria.usuarios_activos.map((usuario, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{usuario.nombre}</span>
                  <Badge variant="secondary">{usuario.eventos}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="filter-usuario">Usuario</Label>
              <Input
                id="filter-usuario"
                placeholder="Nombre del usuario"
                value={filtros.usuario}
                onChange={(e) => handleFilterChange('usuario', e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="filter-accion">Acción</Label>
              <Input
                id="filter-accion"
                placeholder="Tipo de acción"
                value={filtros.accion}
                onChange={(e) => handleFilterChange('accion', e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="filter-desde">Fecha desde</Label>
              <Input
                id="filter-desde"
                type="date"
                value={filtros.fecha_desde}
                onChange={(e) => handleFilterChange('fecha_desde', e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="filter-hasta">Fecha hasta</Label>
              <Input
                id="filter-hasta"
                type="date"
                value={filtros.fecha_hasta}
                onChange={(e) => handleFilterChange('fecha_hasta', e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="filter-limite">Límite</Label>
              <Select value={filtros.limite} onValueChange={(value) => handleFilterChange('limite', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="50">50 registros</SelectItem>
                  <SelectItem value="100">100 registros</SelectItem>
                  <SelectItem value="200">200 registros</SelectItem>
                  <SelectItem value="500">500 registros</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex gap-2">
              <Button onClick={applyFilters} className="flex-1">
                <Search className="h-4 w-4 mr-2" />
                Aplicar
              </Button>
              <Button variant="outline" onClick={clearFilters}>
                Limpiar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabla de eventos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Registro de Eventos
          </CardTitle>
          <CardDescription>
            Mostrando {auditoria.eventos.length} eventos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Usuario</TableHead>
                <TableHead>Acción</TableHead>
                <TableHead>Tabla</TableHead>
                <TableHead>IP</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {auditoria.eventos.map((evento) => (
                <TableRow key={evento.id}>
                  <TableCell className="text-sm">
                    {formatDate(evento.fecha_evento)}
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{evento.nombre_usuario || 'Sistema'}</div>
                      <div className="text-xs text-muted-foreground">{evento.correo_usuario}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getActionColor(evento.accion)}>
                      {evento.accion}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{evento.tabla_afectada || 'N/A'}</Badge>
                  </TableCell>
                  <TableCell className="text-sm font-mono">
                    {evento.ip_usuario}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => showEventDetail(evento)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Diálogo de detalles del evento */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Detalles del Evento de Auditoría</DialogTitle>
            <DialogDescription>
              Información completa del evento seleccionado
            </DialogDescription>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Fecha y Hora</Label>
                  <p className="text-sm font-mono">{formatDate(selectedEvent.fecha_evento)}</p>
                </div>
                <div>
                  <Label>Usuario</Label>
                  <p className="text-sm">{selectedEvent.nombre_usuario} ({selectedEvent.correo_usuario})</p>
                </div>
                <div>
                  <Label>Acción</Label>
                  <Badge className={getActionColor(selectedEvent.accion)}>
                    {selectedEvent.accion}
                  </Badge>
                </div>
                <div>
                  <Label>Tabla Afectada</Label>
                  <p className="text-sm">{selectedEvent.tabla_afectada || 'N/A'}</p>
                </div>
                <div>
                  <Label>ID Registro</Label>
                  <p className="text-sm font-mono">{selectedEvent.id_registro_afectado || 'N/A'}</p>
                </div>
                <div>
                  <Label>IP Usuario</Label>
                  <p className="text-sm font-mono">{selectedEvent.ip_usuario}</p>
                </div>
              </div>
              
              <div>
                <Label>User Agent</Label>
                <p className="text-xs text-muted-foreground break-all">{selectedEvent.user_agent}</p>
              </div>
              
              {selectedEvent.datos_anteriores && (
                <div>
                  <Label>Datos Anteriores</Label>
                  <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto max-h-40">
                    {JSON.stringify(selectedEvent.datos_anteriores, null, 2)}
                  </pre>
                </div>
              )}
              
              {selectedEvent.datos_nuevos && (
                <div>
                  <Label>Datos Nuevos</Label>
                  <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto max-h-40">
                    {JSON.stringify(selectedEvent.datos_nuevos, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}