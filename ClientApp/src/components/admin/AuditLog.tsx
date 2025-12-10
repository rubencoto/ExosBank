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
import { ScrollArea } from '../ui/scroll-area';
import { Separator } from '../ui/separator';
import { 
  Shield, Search, RefreshCw, Calendar, User, Activity, AlertCircle, 
  Eye, Download, Filter, Clock, Database, UserCheck, TrendingUp,
  FileText, MapPin, Monitor, X, ChevronRight
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
  const [hasActiveFilters, setHasActiveFilters] = useState(false);

  useEffect(() => {
    console.log('🚀 AuditLog component mounted, fetching data...');
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

      const url = `/api/admin/auditoria.php?${queryParams.toString()}`;
      console.log('🔍 Fetching auditoría from:', url);

      const response = await fetch(url, {
        credentials: 'include'
      });

      console.log('📡 Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Error de servidor' }));
        console.error('❌ Error response:', errorData);
        throw new Error(errorData.message || 'Error al obtener auditoría');
      }

      const data = await response.json();
      console.log('📦 Data received:', data);

      if (data.status === 'ok') {
        console.log('✅ Auditoría loaded successfully:', {
          eventos: data.data.eventos?.length || 0,
          estadisticas: data.data.estadisticas,
          acciones_frecuentes: data.data.acciones_frecuentes?.length || 0,
          usuarios_activos: data.data.usuarios_activos?.length || 0
        });
        setAuditoria(data.data);
      } else {
        console.error('❌ Invalid status:', data);
        throw new Error(data.message || 'Error al cargar auditoría');
      }
    } catch (err) {
      console.error('💥 Error al cargar auditoría:', err);
      setError(err instanceof Error ? err.message : 'Error de conexión');
      toast.error('Error al cargar auditoría: ' + (err instanceof Error ? err.message : 'Error de conexión'));
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
    // Verificar si hay filtros activos
    const hasFilters = filtros.usuario || filtros.accion || filtros.fecha_desde || filtros.fecha_hasta;
    setHasActiveFilters(hasFilters);
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
    setHasActiveFilters(false);
    // Recargar datos sin filtros
    setTimeout(() => {
      fetchAuditoria();
    }, 0);
  };

  const setQuickDateFilter = (days: number) => {
    const today = new Date();
    const pastDate = new Date();
    pastDate.setDate(today.getDate() - days);
    
    setFiltros(prev => ({
      ...prev,
      fecha_desde: pastDate.toISOString().split('T')[0],
      fecha_hasta: today.toISOString().split('T')[0]
    }));
  };

  const showEventDetail = (evento: EventoAuditoria) => {
    setSelectedEvent(evento);
    setIsDetailOpen(true);
  };

  const getActionColor = (accion: string) => {
    const colors = {
      'login': 'bg-emerald-50 text-emerald-700 border-emerald-200',
      'logout': 'bg-slate-50 text-slate-700 border-slate-200',
      'create': 'bg-blue-50 text-blue-700 border-blue-200',
      'update': 'bg-amber-50 text-amber-700 border-amber-200',
      'delete': 'bg-red-50 text-red-700 border-red-200',
      'transfer': 'bg-purple-50 text-purple-700 border-purple-200',
      'default': 'bg-gray-50 text-gray-700 border-gray-200'
    };
    
    const lowerAction = accion.toLowerCase();
    for (const [key, color] of Object.entries(colors)) {
      if (lowerAction.includes(key)) {
        return color;
      }
    }
    return colors.default;
  };

  const getActionIcon = (accion: string) => {
    const lowerAction = accion.toLowerCase();
    if (lowerAction.includes('login')) return '🔐';
    if (lowerAction.includes('logout')) return '🚪';
    if (lowerAction.includes('create')) return '➕';
    if (lowerAction.includes('update')) return '✏️';
    if (lowerAction.includes('delete')) return '🗑️';
    if (lowerAction.includes('transfer')) return '💸';
    return '📝';
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
      <div className="flex items-center justify-center h-[600px]">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-[#0B132B] mx-auto" />
            <Shield className="h-6 w-6 text-[#0B132B] absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
          </div>
          <div>
            <p className="text-lg font-semibold text-gray-900">Cargando auditoría</p>
            <p className="text-sm text-muted-foreground">Obteniendo registros del sistema...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#0B132B] rounded-lg">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Auditoría del Sistema</h2>
              <p className="text-sm text-muted-foreground">Monitoreo completo de actividades y eventos del sistema</p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportAuditoria} className="shadow-sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button 
            onClick={fetchAuditoria}
            disabled={loading}
            className="bg-[#0B132B] hover:bg-[#1a2444] shadow-sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        </div>
      </div>

      {error && (
        <Alert className="border-red-300 bg-red-50 shadow-sm">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <AlertDescription className="text-red-800 font-medium">{error}</AlertDescription>
        </Alert>
      )}

      {/* Mensaje informativo si no hay datos pero cargó exitosamente */}
      {!loading && !error && auditoria.estadisticas.total_eventos === 0 && (
        <Alert className="border-blue-300 bg-blue-50 shadow-sm">
          <AlertCircle className="h-5 w-5 text-blue-600" />
          <AlertDescription className="text-blue-800 font-medium">
            No hay eventos de auditoría registrados en el sistema. Los eventos se registrarán automáticamente cuando los usuarios realicen acciones.
          </AlertDescription>
        </Alert>
      )}

      {/* Estadísticas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-300 bg-gradient-to-br from-white to-gray-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  Total Eventos
                </p>
                <p className="text-3xl font-bold text-gray-900">{auditoria.estadisticas.total_eventos.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Registros históricos</p>
              </div>
              <div className="h-14 w-14 rounded-full bg-blue-100 flex items-center justify-center">
                <Database className="h-7 w-7 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-300 bg-gradient-to-br from-white to-emerald-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <UserCheck className="h-4 w-4" />
                  Usuarios Activos
                </p>
                <p className="text-3xl font-bold text-gray-900">{auditoria.estadisticas.usuarios_activos.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">En el sistema</p>
              </div>
              <div className="h-14 w-14 rounded-full bg-emerald-100 flex items-center justify-center">
                <UserCheck className="h-7 w-7 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-300 bg-gradient-to-br from-white to-purple-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Última Semana
                </p>
                <p className="text-3xl font-bold text-gray-900">{auditoria.estadisticas.eventos_ultima_semana.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Actividad reciente</p>
              </div>
              <div className="h-14 w-14 rounded-full bg-purple-100 flex items-center justify-center">
                <Calendar className="h-7 w-7 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-300 bg-gradient-to-br from-white to-amber-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Último Día
                </p>
                <p className="text-3xl font-bold text-gray-900">{auditoria.estadisticas.eventos_ultimo_dia.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Últimas 24 horas</p>
              </div>
              <div className="h-14 w-14 rounded-full bg-amber-100 flex items-center justify-center">
                <Clock className="h-7 w-7 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Acciones más frecuentes */}
        <Card className="border-0 shadow-md hover:shadow-lg transition-all duration-300">
          <CardHeader className="bg-gradient-to-r from-[#0B132B] to-[#1a2444] text-white rounded-t-xl">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Activity className="h-5 w-5" />
              Acciones Frecuentes
            </CardTitle>
            <CardDescription className="text-gray-300">Últimos 30 días</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            {auditoria.acciones_frecuentes.length > 0 ? (
              <div className="space-y-3">
                {auditoria.acciones_frecuentes.map((accion, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{getActionIcon(accion.accion)}</span>
                      <Badge variant="outline" className={`${getActionColor(accion.accion)} font-medium`}>
                        {accion.accion}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-gray-900">{accion.frecuencia}</span>
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No hay datos disponibles</p>
            )}
          </CardContent>
        </Card>

        {/* Usuarios más activos */}
        <Card className="border-0 shadow-md hover:shadow-lg transition-all duration-300">
          <CardHeader className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-t-xl">
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-5 w-5" />
              Usuarios Activos
            </CardTitle>
            <CardDescription className="text-emerald-100">Últimos 30 días</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            {auditoria.usuarios_activos.length > 0 ? (
              <div className="space-y-3">
                {auditoria.usuarios_activos.map((usuario, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                        <User className="h-5 w-5 text-emerald-700" />
                      </div>
                      <span className="text-sm font-semibold text-gray-900">{usuario.nombre}</span>
                    </div>
                    <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 font-bold">
                      {usuario.eventos}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No hay datos disponibles</p>
            )}
          </CardContent>
        </Card>

        {/* Filtros */}
        <Card className="border-0 shadow-md hover:shadow-lg transition-all duration-300">
          <CardHeader className="bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-t-xl">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Filter className="h-5 w-5" />
                  Filtros de Búsqueda
                </CardTitle>
              </div>
              {hasActiveFilters && (
                <Badge className="bg-white text-purple-700 hover:bg-white">
                  Activos
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            {/* Filtros rápidos de fecha */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Filtros Rápidos</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setQuickDateFilter(1)}
                  className="text-xs hover:bg-purple-50 hover:border-purple-300"
                >
                  <Clock className="h-3 w-3 mr-1" />
                  Hoy
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setQuickDateFilter(7)}
                  className="text-xs hover:bg-purple-50 hover:border-purple-300"
                >
                  <Calendar className="h-3 w-3 mr-1" />
                  7 días
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setQuickDateFilter(30)}
                  className="text-xs hover:bg-purple-50 hover:border-purple-300"
                >
                  <Calendar className="h-3 w-3 mr-1" />
                  30 días
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setQuickDateFilter(90)}
                  className="text-xs hover:bg-purple-50 hover:border-purple-300"
                >
                  <Calendar className="h-3 w-3 mr-1" />
                  90 días
                </Button>
              </div>
            </div>

            <Separator />

            {/* Filtro de usuario */}
            <div className="space-y-2">
              <Label htmlFor="filter-usuario" className="text-sm font-semibold flex items-center gap-1">
                <User className="h-3 w-3" />
                Usuario
              </Label>
              <Input
                id="filter-usuario"
                placeholder="Buscar por nombre..."
                value={filtros.usuario}
                onChange={(e) => handleFilterChange('usuario', e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                className="border-gray-300 focus:border-purple-500 focus:ring-purple-500"
              />
            </div>
            
            {/* Filtro de acción con Select mejorado */}
            <div className="space-y-2">
              <Label htmlFor="filter-accion" className="text-sm font-semibold flex items-center gap-1">
                <Activity className="h-3 w-3" />
                Tipo de Acción
              </Label>
              <Select value={filtros.accion || "all"} onValueChange={(value) => handleFilterChange('accion', value === 'all' ? '' : value)}>
                <SelectTrigger className="border-gray-300 focus:border-purple-500 focus:ring-purple-500">
                  <SelectValue placeholder="Todas las acciones" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las acciones</SelectItem>
                  <SelectItem value="login">🔐 Login</SelectItem>
                  <SelectItem value="logout">🚪 Logout</SelectItem>
                  <SelectItem value="create">➕ Crear</SelectItem>
                  <SelectItem value="update">✏️ Actualizar</SelectItem>
                  <SelectItem value="delete">🗑️ Eliminar</SelectItem>
                  <SelectItem value="transfer">💸 Transferencia</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Filtros de fecha */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label htmlFor="filter-desde" className="text-sm font-semibold">Desde</Label>
                <Input
                  id="filter-desde"
                  type="date"
                  value={filtros.fecha_desde}
                  onChange={(e) => handleFilterChange('fecha_desde', e.target.value)}
                  className="border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="filter-hasta" className="text-sm font-semibold">Hasta</Label>
                <Input
                  id="filter-hasta"
                  type="date"
                  value={filtros.fecha_hasta}
                  onChange={(e) => handleFilterChange('fecha_hasta', e.target.value)}
                  className="border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                />
              </div>
            </div>
            
            {/* Límite de registros */}
            <div className="space-y-2">
              <Label htmlFor="filter-limite" className="text-sm font-semibold flex items-center gap-1">
                <Database className="h-3 w-3" />
                Límite de registros
              </Label>
              <Select value={filtros.limite} onValueChange={(value) => handleFilterChange('limite', value)}>
                <SelectTrigger className="border-gray-300 focus:border-purple-500 focus:ring-purple-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="25">25 registros</SelectItem>
                  <SelectItem value="50">50 registros</SelectItem>
                  <SelectItem value="100">100 registros</SelectItem>
                  <SelectItem value="200">200 registros</SelectItem>
                  <SelectItem value="500">500 registros</SelectItem>
                  <SelectItem value="1000">1000 registros</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Separator className="my-4" />
            
            {/* Botones de acción */}
            <div className="space-y-2">
              <Button 
                onClick={applyFilters} 
                className="w-full bg-purple-600 hover:bg-purple-700 shadow-sm"
                disabled={loading}
              >
                <Search className="h-4 w-4 mr-2" />
                {loading ? 'Buscando...' : 'Aplicar Filtros'}
              </Button>
              <Button 
                variant="outline" 
                onClick={clearFilters} 
                className="w-full shadow-sm hover:bg-gray-100"
                disabled={!hasActiveFilters && !filtros.usuario && !filtros.accion && !filtros.fecha_desde && !filtros.fecha_hasta}
              >
                <X className="h-4 w-4 mr-2" />
                Limpiar Filtros
              </Button>
            </div>

            {/* Indicador de filtros activos */}
            {hasActiveFilters && (
              <div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                <p className="text-xs font-semibold text-purple-900 mb-2 flex items-center gap-1">
                  <Filter className="h-3 w-3" />
                  Filtros activos:
                </p>
                <div className="space-y-1">
                  {filtros.usuario && (
                    <div className="text-xs text-purple-700">
                      • Usuario: <span className="font-semibold">{filtros.usuario}</span>
                    </div>
                  )}
                  {filtros.accion && (
                    <div className="text-xs text-purple-700">
                      • Acción: <span className="font-semibold">{filtros.accion}</span>
                    </div>
                  )}
                  {filtros.fecha_desde && (
                    <div className="text-xs text-purple-700">
                      • Desde: <span className="font-semibold">{filtros.fecha_desde}</span>
                    </div>
                  )}
                  {filtros.fecha_hasta && (
                    <div className="text-xs text-purple-700">
                      • Hasta: <span className="font-semibold">{filtros.fecha_hasta}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabla de eventos */}
      <Card className="border-0 shadow-md">
        <CardHeader className="bg-white border-b border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-xl">
                <FileText className="h-5 w-5 text-[#0B132B]" />
                Registro de Eventos
              </CardTitle>
              <CardDescription className="mt-1">
                Mostrando <span className="font-semibold text-gray-900">{auditoria.eventos.length}</span> eventos de auditoría
              </CardDescription>
            </div>
            {auditoria.eventos.length > 0 && (
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 px-4 py-1">
                {auditoria.eventos.length} resultados
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {auditoria.eventos.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 hover:bg-gray-50">
                    <TableHead className="font-semibold text-gray-900">Fecha y Hora</TableHead>
                    <TableHead className="font-semibold text-gray-900">Usuario</TableHead>
                    <TableHead className="font-semibold text-gray-900">Acción</TableHead>
                    <TableHead className="font-semibold text-gray-900">Tabla</TableHead>
                    <TableHead className="font-semibold text-gray-900">Dirección IP</TableHead>
                    <TableHead className="font-semibold text-gray-900 text-center">Detalles</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditoria.eventos.map((evento) => (
                    <TableRow key={evento.id} className="hover:bg-gray-50 transition-colors">
                      <TableCell className="text-sm">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-gray-400" />
                          <span className="font-medium text-gray-900">
                            {formatDate(evento.fecha_evento)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                            <User className="h-4 w-4 text-gray-600" />
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">{evento.nombre_usuario || 'Sistema'}</div>
                            <div className="text-xs text-muted-foreground">{evento.correo_usuario}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${getActionColor(evento.accion)} font-medium shadow-sm`}>
                          <span className="mr-1">{getActionIcon(evento.accion)}</span>
                          {evento.accion}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-gray-50 border-gray-300 font-mono text-xs">
                          {evento.tabla_afectada || 'N/A'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          <span className="text-sm font-mono text-gray-700">{evento.ip_usuario}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => showEventDetail(evento)}
                          className="shadow-sm hover:shadow-md transition-all hover:bg-[#0B132B] hover:text-white"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Ver
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <div className="h-20 w-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <FileText className="h-10 w-10 text-gray-400" />
              </div>
              <p className="text-lg font-semibold text-gray-900 mb-2">No hay eventos registrados</p>
              <p className="text-sm text-muted-foreground text-center max-w-md">
                No se encontraron eventos de auditoría con los filtros seleccionados. Intenta ajustar los criterios de búsqueda.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Diálogo de detalles del evento */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Shield className="h-5 w-5 text-[#0B132B]" />
              Detalles del Evento de Auditoría
            </DialogTitle>
            <DialogDescription>
              Información completa del evento seleccionado
            </DialogDescription>
          </DialogHeader>
          {selectedEvent && (
            <ScrollArea className="max-h-[calc(90vh-120px)] pr-4">
              <div className="space-y-6">
                {/* Información principal */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Fecha y Hora
                    </Label>
                    <p className="text-sm font-mono font-semibold text-gray-900">
                      {formatDate(selectedEvent.fecha_evento)}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground flex items-center gap-1">
                      <User className="h-3 w-3" />
                      Usuario
                    </Label>
                    <p className="text-sm font-semibold text-gray-900">
                      {selectedEvent.nombre_usuario}
                    </p>
                    <p className="text-xs text-muted-foreground">{selectedEvent.correo_usuario}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground flex items-center gap-1">
                      <Activity className="h-3 w-3" />
                      Acción
                    </Label>
                    <Badge className={`${getActionColor(selectedEvent.accion)} font-medium mt-1`}>
                      <span className="mr-1">{getActionIcon(selectedEvent.accion)}</span>
                      {selectedEvent.accion}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground flex items-center gap-1">
                      <Database className="h-3 w-3" />
                      Tabla Afectada
                    </Label>
                    <p className="text-sm font-mono font-semibold text-gray-900">
                      {selectedEvent.tabla_afectada || 'N/A'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      ID Registro
                    </Label>
                    <p className="text-sm font-mono font-semibold text-gray-900">
                      {selectedEvent.id_registro_afectado || 'N/A'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      Dirección IP
                    </Label>
                    <p className="text-sm font-mono font-semibold text-gray-900">
                      {selectedEvent.ip_usuario}
                    </p>
                  </div>
                </div>
                
                <Separator />
                
                {/* User Agent */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold flex items-center gap-2">
                    <Monitor className="h-4 w-4 text-gray-600" />
                    User Agent
                  </Label>
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-xs text-gray-700 break-all font-mono">
                      {selectedEvent.user_agent}
                    </p>
                  </div>
                </div>
                
                {/* Datos Anteriores */}
                {selectedEvent.datos_anteriores && (
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold flex items-center gap-2 text-amber-700">
                      <FileText className="h-4 w-4" />
                      Datos Anteriores
                    </Label>
                    <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                      <ScrollArea className="max-h-60">
                        <pre className="text-xs text-amber-900 font-mono">
                          {JSON.stringify(selectedEvent.datos_anteriores, null, 2)}
                        </pre>
                      </ScrollArea>
                    </div>
                  </div>
                )}
                
                {/* Datos Nuevos */}
                {selectedEvent.datos_nuevos && (
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold flex items-center gap-2 text-emerald-700">
                      <FileText className="h-4 w-4" />
                      Datos Nuevos
                    </Label>
                    <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                      <ScrollArea className="max-h-60">
                        <pre className="text-xs text-emerald-900 font-mono">
                          {JSON.stringify(selectedEvent.datos_nuevos, null, 2)}
                        </pre>
                      </ScrollArea>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}