import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend, AreaChart, Area 
} from 'recharts';
import { 
  FileBarChart, Download, RefreshCw, TrendingUp, TrendingDown, Users, 
  CreditCard, ArrowUpRight, ArrowDownLeft, DollarSign, AlertCircle 
} from 'lucide-react';
import { toast } from 'sonner';

interface ReporteGeneral {
  resumen: {
    total_usuarios: number;
    total_cuentas: number;
    saldo_total: number;
    total_transacciones: number;
    volumen_transacciones: number;
  };
  tendencias_diarias: Array<{
    fecha: string;
    num_transacciones: number;
    monto_total: number;
    cuentas_activas: number;
  }>;
  tipos_transaccion: Array<{
    tipo: string;
    cantidad: number;
    monto_total: number;
    monto_promedio: number;
  }>;
  distribucion_cuentas: Array<{
    tipo_cuenta: string;
    cantidad: number;
    saldo_total: number;
    saldo_promedio: number;
  }>;
}

interface ReporteFinanciero {
  rentabilidad: {
    ingresos_comisiones: number;
    transacciones_con_comision: number;
    activos_totales: number;
    clientes_activos: number;
  };
  analisis_riesgo: {
    cuentas_sobregiro: number;
    cuentas_alto_valor: number;
    exposicion_riesgo: number;
    saldo_promedio: number;
  };
  flujo_efectivo: Array<{
    fecha: string;
    ingresos: number;
    egresos: number;
    flujo_neto: number;
  }>;
}

export function Reports() {
  const [reporteGeneral, setReporteGeneral] = useState<ReporteGeneral | null>(null);
  const [reporteFinanciero, setReporteFinanciero] = useState<ReporteFinanciero | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [periodo, setPeriodo] = useState('30');
  const [tipoReporte, setTipoReporte] = useState('general');

  useEffect(() => {
    fetchReporte();
  }, [periodo, tipoReporte]);

  const fetchReporte = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch(`/api/admin/reportes.php?tipo=${tipoReporte}&periodo=${periodo}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al obtener reporte');
      }

      const data = await response.json();

      if (data.status === 'ok') {
        if (tipoReporte === 'general') {
          setReporteGeneral(data.data);
        } else if (tipoReporte === 'financiero') {
          setReporteFinanciero(data.data);
        }
      } else {
        throw new Error(data.message || 'Error al cargar reporte');
      }
    } catch (err) {
      console.error('Error al cargar reporte:', err);
      setError(err instanceof Error ? err.message : 'Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CR', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('es-CR').format(num);
  };

  const exportReporte = () => {
    toast.info('Función de exportación en desarrollo');
  };

  const COLORS = ['#0B132B', '#1C2541', '#3A506B', '#5BC0BE', '#6FFFE9'];

  if (loading && !reporteGeneral && !reporteFinanciero) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4" />
          <p className="text-muted-foreground">Generando reporte...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">Reportes y Analytics</h2>
          <p className="text-muted-foreground">Análisis detallado del sistema bancario</p>
        </div>
        <div className="flex gap-2">
          <Select value={periodo} onValueChange={setPeriodo}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 días</SelectItem>
              <SelectItem value="30">30 días</SelectItem>
              <SelectItem value="90">90 días</SelectItem>
              <SelectItem value="365">1 año</SelectItem>
            </SelectContent>
          </Select>
          
          <Button 
            variant="outline" 
            onClick={fetchReporte}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
          
          <Button onClick={exportReporte}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      <Tabs value={tipoReporte} onValueChange={setTipoReporte} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="financiero">Financiero</TabsTrigger>
          <TabsTrigger value="usuarios">Usuarios</TabsTrigger>
          <TabsTrigger value="transacciones">Transacciones</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          {reporteGeneral && (
            <>
              {/* Métricas principales */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Usuarios</p>
                        <p className="text-2xl font-bold">{formatNumber(reporteGeneral.resumen.total_usuarios)}</p>
                      </div>
                      <Users className="h-8 w-8 text-[#0B132B]" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Cuentas</p>
                        <p className="text-2xl font-bold">{formatNumber(reporteGeneral.resumen.total_cuentas)}</p>
                      </div>
                      <CreditCard className="h-8 w-8 text-[#0B132B]" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Saldo Total</p>
                        <p className="text-2xl font-bold">{formatCurrency(reporteGeneral.resumen.saldo_total)}</p>
                      </div>
                      <DollarSign className="h-8 w-8 text-[#0B132B]" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Transacciones</p>
                        <p className="text-2xl font-bold">{formatNumber(reporteGeneral.resumen.total_transacciones)}</p>
                      </div>
                      <ArrowUpRight className="h-8 w-8 text-[#0B132B]" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Volumen</p>
                        <p className="text-2xl font-bold">{formatCurrency(reporteGeneral.resumen.volumen_transacciones)}</p>
                      </div>
                      <TrendingUp className="h-8 w-8 text-[#0B132B]" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Gráfico de tendencias */}
              <Card>
                <CardHeader>
                  <CardTitle>Tendencias Diarias</CardTitle>
                  <CardDescription>Actividad de transacciones por día</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={reporteGeneral.tendencias_diarias}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="fecha" />
                      <YAxis />
                      <Tooltip 
                        formatter={(value, name) => [
                          name === 'num_transacciones' ? formatNumber(Number(value)) : formatCurrency(Number(value)),
                          name === 'num_transacciones' ? 'Transacciones' : 'Monto Total'
                        ]}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="num_transacciones" stroke="#0B132B" name="Transacciones" />
                      <Line type="monotone" dataKey="monto_total" stroke="#1C2541" name="Monto Total" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Tipos de transacción */}
                <Card>
                  <CardHeader>
                    <CardTitle>Tipos de Transacción</CardTitle>
                    <CardDescription>Distribución por tipo</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={reporteGeneral.tipos_transaccion}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ tipo, percent }) => `${tipo} (${(percent * 100).toFixed(0)}%)`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="cantidad"
                        >
                          {reporteGeneral.tipos_transaccion.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => formatNumber(Number(value))} />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Distribución de cuentas */}
                <Card>
                  <CardHeader>
                    <CardTitle>Distribución de Cuentas</CardTitle>
                    <CardDescription>Por tipo de cuenta</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={reporteGeneral.distribucion_cuentas}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="tipo_cuenta" />
                        <YAxis />
                        <Tooltip formatter={(value) => formatNumber(Number(value))} />
                        <Bar dataKey="cantidad" fill="#0B132B" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="financiero" className="space-y-6">
          {reporteFinanciero && (
            <>
              {/* Métricas financieras */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Ingresos Comisiones</p>
                        <p className="text-2xl font-bold">{formatCurrency(reporteFinanciero.rentabilidad.ingresos_comisiones)}</p>
                      </div>
                      <TrendingUp className="h-8 w-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Activos Totales</p>
                        <p className="text-2xl font-bold">{formatCurrency(reporteFinanciero.rentabilidad.activos_totales)}</p>
                      </div>
                      <DollarSign className="h-8 w-8 text-[#0B132B]" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Cuentas Sobregiro</p>
                        <p className="text-2xl font-bold text-red-600">{formatNumber(reporteFinanciero.analisis_riesgo.cuentas_sobregiro)}</p>
                      </div>
                      <AlertCircle className="h-8 w-8 text-red-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Exposición Riesgo</p>
                        <p className="text-2xl font-bold text-red-600">{formatCurrency(reporteFinanciero.analisis_riesgo.exposicion_riesgo)}</p>
                      </div>
                      <TrendingDown className="h-8 w-8 text-red-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Flujo de efectivo */}
              <Card>
                <CardHeader>
                  <CardTitle>Flujo de Efectivo</CardTitle>
                  <CardDescription>Ingresos vs Egresos por día</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <AreaChart data={reporteFinanciero.flujo_efectivo}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="fecha" />
                      <YAxis />
                      <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                      <Legend />
                      <Area type="monotone" dataKey="ingresos" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
                      <Area type="monotone" dataKey="egresos" stackId="2" stroke="#ef4444" fill="#ef4444" fillOpacity={0.6} />
                      <Line type="monotone" dataKey="flujo_neto" stroke="#0B132B" strokeWidth={3} />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="usuarios" className="space-y-6">
          <Card>
            <CardContent className="pt-6 text-center space-y-4">
              <FileBarChart className="h-16 w-16 mx-auto text-gray-400" />
              <div>
                <h3 className="text-lg font-medium">Reporte de Usuarios</h3>
                <p className="text-muted-foreground">Este reporte estará disponible próximamente</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transacciones" className="space-y-6">
          <Card>
            <CardContent className="pt-6 text-center space-y-4">
              <FileBarChart className="h-16 w-16 mx-auto text-gray-400" />
              <div>
                <h3 className="text-lg font-medium">Reporte de Transacciones</h3>
                <p className="text-muted-foreground">Este reporte estará disponible próximamente</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}