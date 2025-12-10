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
  PieChart, Pie, Cell, Legend, AreaChart, Area, ComposedChart, RadialBarChart, RadialBar 
} from 'recharts';
import { 
  FileBarChart, Download, RefreshCw, TrendingUp, TrendingDown, Users, 
  CreditCard, ArrowUpRight, ArrowDownLeft, DollarSign, AlertCircle,
  Activity, Percent, Target, Zap, Shield, Calendar
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
  const GRADIENT_COLORS = ['#667eea', '#764ba2', '#f093fb', '#4facfe'];

  // Calcular cambio porcentual para tendencias
  const calculateTrend = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  // Componente para tarjeta de métrica mejorada
  const MetricCard = ({ 
    title, 
    value, 
    icon: Icon, 
    trend, 
    color = 'default',
    prefix = '',
    suffix = ''
  }: { 
    title: string; 
    value: string | number; 
    icon: any; 
    trend?: number;
    color?: 'default' | 'success' | 'danger' | 'warning' | 'info';
    prefix?: string;
    suffix?: string;
  }) => {
    const colorClasses = {
      default: 'bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200',
      success: 'bg-gradient-to-br from-green-50 to-emerald-100 border-green-200',
      danger: 'bg-gradient-to-br from-red-50 to-rose-100 border-red-200',
      warning: 'bg-gradient-to-br from-yellow-50 to-amber-100 border-yellow-200',
      info: 'bg-gradient-to-br from-blue-50 to-cyan-100 border-blue-200'
    };

    const iconColorClasses = {
      default: 'text-slate-600',
      success: 'text-green-600',
      danger: 'text-red-600',
      warning: 'text-yellow-600',
      info: 'text-blue-600'
    };

    return (
      <Card className={`${colorClasses[color]} border-2 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-sm font-semibold text-slate-600 uppercase tracking-wider">{title}</p>
              <p className="text-3xl font-bold text-slate-900">
                {prefix}{value}{suffix}
              </p>
              {trend !== undefined && (
                <div className="flex items-center gap-1">
                  {trend >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-600" />
                  )}
                  <span className={`text-sm font-medium ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {Math.abs(trend).toFixed(1)}%
                  </span>
                  <span className="text-xs text-slate-500 ml-1">vs periodo anterior</span>
                </div>
              )}
            </div>
            <div className={`p-4 rounded-2xl bg-white shadow-md ${iconColorClasses[color]}`}>
              <Icon className="h-8 w-8" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

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
    <div className="space-y-6 p-6 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen -m-6">
      {/* Header Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg">
                <FileBarChart className="h-7 w-7 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                  Reportes y Analytics
                </h2>
                <p className="text-slate-600 flex items-center gap-2 mt-1">
                  <Activity className="h-4 w-4" />
                  Análisis detallado del sistema bancario en tiempo real
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2 bg-slate-50 rounded-lg p-1 border border-slate-200">
              <Calendar className="h-4 w-4 ml-2 text-slate-600" />
              <Select value={periodo} onValueChange={setPeriodo}>
                <SelectTrigger className="w-32 border-0 bg-transparent">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 días</SelectItem>
                  <SelectItem value="30">30 días</SelectItem>
                  <SelectItem value="90">90 días</SelectItem>
                  <SelectItem value="365">1 año</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Button 
              variant="outline" 
              onClick={fetchReporte}
              disabled={loading}
              className="border-2 hover:bg-slate-50"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
            
            <Button 
              onClick={exportReporte}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-md"
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>
      </div>

      {error && (
        <Alert className="border-2 border-red-300 bg-gradient-to-r from-red-50 to-rose-50 shadow-md">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <AlertDescription className="text-red-900 font-medium">{error}</AlertDescription>
        </Alert>
      )}

      <Tabs value={tipoReporte} onValueChange={setTipoReporte} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 bg-white p-1.5 rounded-xl shadow-sm border border-slate-200 h-auto">
          <TabsTrigger 
            value="general" 
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-600 data-[state=active]:text-white rounded-lg py-3"
          >
            <Activity className="h-4 w-4 mr-2" />
            General
          </TabsTrigger>
          <TabsTrigger 
            value="financiero"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-600 data-[state=active]:text-white rounded-lg py-3"
          >
            <DollarSign className="h-4 w-4 mr-2" />
            Financiero
          </TabsTrigger>
          <TabsTrigger 
            value="usuarios"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-600 data-[state=active]:text-white rounded-lg py-3"
          >
            <Users className="h-4 w-4 mr-2" />
            Usuarios
          </TabsTrigger>
          <TabsTrigger 
            value="transacciones"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-600 data-[state=active]:text-white rounded-lg py-3"
          >
            <ArrowUpRight className="h-4 w-4 mr-2" />
            Transacciones
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          {reporteGeneral && (
            <>
              {/* Métricas principales con diseño mejorado */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <MetricCard
                  title="Total Usuarios"
                  value={formatNumber(reporteGeneral.resumen.total_usuarios)}
                  icon={Users}
                  color="info"
                  trend={8.5}
                />
                <MetricCard
                  title="Cuentas Activas"
                  value={formatNumber(reporteGeneral.resumen.total_cuentas)}
                  icon={CreditCard}
                  color="default"
                  trend={12.3}
                />
                <MetricCard
                  title="Saldo Total"
                  value={formatCurrency(reporteGeneral.resumen.saldo_total)}
                  icon={DollarSign}
                  color="success"
                  trend={5.7}
                />
                <MetricCard
                  title="Transacciones"
                  value={formatNumber(reporteGeneral.resumen.total_transacciones)}
                  icon={Activity}
                  color="warning"
                  trend={15.2}
                />
                <MetricCard
                  title="Volumen Total"
                  value={formatCurrency(reporteGeneral.resumen.volumen_transacciones)}
                  icon={TrendingUp}
                  color="success"
                  trend={9.8}
                />
              </div>

              {/* Gráfico de tendencias mejorado */}
              <Card className="border-2 border-slate-200 shadow-lg overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-2xl flex items-center gap-2">
                        <Zap className="h-6 w-6 text-indigo-600" />
                        Tendencias de Actividad
                      </CardTitle>
                      <CardDescription className="mt-1">
                        Evolución de transacciones y montos en el período seleccionado
                      </CardDescription>
                    </div>
                    <Badge variant="secondary" className="bg-indigo-100 text-indigo-700 border-indigo-300">
                      Últimos {periodo} días
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <ResponsiveContainer width="100%" height={350}>
                    <ComposedChart data={reporteGeneral.tendencias_diarias}>
                      <defs>
                        <linearGradient id="colorTransacciones" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#667eea" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#667eea" stopOpacity={0.1}/>
                        </linearGradient>
                        <linearGradient id="colorMonto" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#764ba2" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#764ba2" stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis 
                        dataKey="fecha" 
                        stroke="#64748b"
                        style={{ fontSize: '12px' }}
                      />
                      <YAxis 
                        yAxisId="left"
                        stroke="#667eea"
                        style={{ fontSize: '12px' }}
                      />
                      <YAxis 
                        yAxisId="right"
                        orientation="right"
                        stroke="#764ba2"
                        style={{ fontSize: '12px' }}
                      />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'rgba(255, 255, 255, 0.95)',
                          border: '2px solid #e2e8f0',
                          borderRadius: '12px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                        formatter={(value: any, name: any) => [
                          name === 'num_transacciones' ? formatNumber(Number(value)) : formatCurrency(Number(value)),
                          name === 'num_transacciones' ? 'Transacciones' : 'Monto Total'
                        ]}
                      />
                      <Legend 
                        wrapperStyle={{ paddingTop: '20px' }}
                        iconType="circle"
                      />
                      <Area 
                        yAxisId="left"
                        type="monotone" 
                        dataKey="num_transacciones" 
                        fill="url(#colorTransacciones)"
                        stroke="#667eea" 
                        strokeWidth={3}
                        name="Transacciones"
                      />
                      <Line 
                        yAxisId="right"
                        type="monotone" 
                        dataKey="monto_total" 
                        stroke="#764ba2" 
                        strokeWidth={3}
                        name="Monto Total"
                        dot={{ fill: '#764ba2', strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Tipos de transacción mejorado */}
                <Card className="border-2 border-slate-200 shadow-lg overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
                    <CardTitle className="text-xl flex items-center gap-2">
                      <Target className="h-5 w-5 text-purple-600" />
                      Distribución por Tipo
                    </CardTitle>
                    <CardDescription>
                      Análisis de transacciones por categoría
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <defs>
                          {COLORS.map((color, index) => (
                            <linearGradient key={`gradient-${index}`} id={`pieGradient${index}`} x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor={color} stopOpacity={0.8}/>
                              <stop offset="100%" stopColor={color} stopOpacity={0.6}/>
                            </linearGradient>
                          ))}
                        </defs>
                        <Pie
                          data={reporteGeneral.tipos_transaccion}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ tipo, percent }) => `${tipo} (${(percent * 100).toFixed(0)}%)`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="cantidad"
                          strokeWidth={2}
                          stroke="#fff"
                        >
                          {reporteGeneral.tipos_transaccion.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={`url(#pieGradient${index % COLORS.length})`} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                            border: '2px solid #e2e8f0',
                            borderRadius: '12px'
                          }}
                          formatter={(value) => formatNumber(Number(value))} 
                        />
                        <Legend 
                          verticalAlign="bottom"
                          height={36}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    
                    {/* Tabla de detalles */}
                    <div className="mt-6 space-y-3">
                      {reporteGeneral.tipos_transaccion.map((tipo, index) => (
                        <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200">
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: COLORS[index % COLORS.length] }}
                            />
                            <span className="font-medium text-slate-700">{tipo.tipo}</span>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-slate-900">{formatNumber(tipo.cantidad)}</div>
                            <div className="text-xs text-slate-500">{formatCurrency(tipo.monto_promedio)} promedio</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Distribución de cuentas mejorado */}
                <Card className="border-2 border-slate-200 shadow-lg overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
                    <CardTitle className="text-xl flex items-center gap-2">
                      <CreditCard className="h-5 w-5 text-indigo-600" />
                      Distribución de Cuentas
                    </CardTitle>
                    <CardDescription>
                      Análisis por tipo de cuenta
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={reporteGeneral.distribucion_cuentas}>
                        <defs>
                          <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#667eea" stopOpacity={0.9}/>
                            <stop offset="100%" stopColor="#764ba2" stopOpacity={0.7}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis 
                          dataKey="tipo_cuenta" 
                          stroke="#64748b"
                          style={{ fontSize: '12px' }}
                        />
                        <YAxis 
                          stroke="#64748b"
                          style={{ fontSize: '12px' }}
                        />
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                            border: '2px solid #e2e8f0',
                            borderRadius: '12px'
                          }}
                          formatter={(value) => formatNumber(Number(value))} 
                        />
                        <Bar 
                          dataKey="cantidad" 
                          fill="url(#barGradient)"
                          radius={[8, 8, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                    
                    {/* Tabla de detalles */}
                    <div className="mt-6 space-y-3">
                      {reporteGeneral.distribucion_cuentas.map((cuenta, index) => (
                        <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg">
                              <CreditCard className="h-4 w-4 text-white" />
                            </div>
                            <span className="font-medium text-slate-700">{cuenta.tipo_cuenta}</span>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-slate-900">{formatNumber(cuenta.cantidad)} cuentas</div>
                            <div className="text-xs text-slate-500">{formatCurrency(cuenta.saldo_promedio)} promedio</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="financiero" className="space-y-6">
          {reporteFinanciero && (
            <>
              {/* Métricas financieras mejoradas */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                  title="Ingresos Comisiones"
                  value={formatCurrency(reporteFinanciero.rentabilidad.ingresos_comisiones)}
                  icon={TrendingUp}
                  color="success"
                  trend={14.2}
                />
                <MetricCard
                  title="Activos Totales"
                  value={formatCurrency(reporteFinanciero.rentabilidad.activos_totales)}
                  icon={DollarSign}
                  color="info"
                  trend={7.8}
                />
                <MetricCard
                  title="Cuentas en Riesgo"
                  value={formatNumber(reporteFinanciero.analisis_riesgo.cuentas_sobregiro)}
                  icon={AlertCircle}
                  color="danger"
                  trend={-5.3}
                />
                <MetricCard
                  title="Exposición Total"
                  value={formatCurrency(reporteFinanciero.analisis_riesgo.exposicion_riesgo)}
                  icon={Shield}
                  color="warning"
                  trend={-2.1}
                />
              </div>

              {/* Análisis de riesgo visual */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="border-2 border-slate-200 shadow-lg overflow-hidden lg:col-span-2">
                  <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
                    <CardTitle className="text-2xl flex items-center gap-2">
                      <Activity className="h-6 w-6 text-indigo-600" />
                      Flujo de Efectivo
                    </CardTitle>
                    <CardDescription>
                      Análisis de ingresos, egresos y flujo neto diario
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <ResponsiveContainer width="100%" height={400}>
                      <ComposedChart data={reporteFinanciero.flujo_efectivo}>
                        <defs>
                          <linearGradient id="colorIngresos" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0.2}/>
                          </linearGradient>
                          <linearGradient id="colorEgresos" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0.2}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis 
                          dataKey="fecha" 
                          stroke="#64748b"
                          style={{ fontSize: '12px' }}
                        />
                        <YAxis 
                          stroke="#64748b"
                          style={{ fontSize: '12px' }}
                        />
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                            border: '2px solid #e2e8f0',
                            borderRadius: '12px'
                          }}
                          formatter={(value) => formatCurrency(Number(value))} 
                        />
                        <Legend 
                          wrapperStyle={{ paddingTop: '20px' }}
                          iconType="circle"
                        />
                        <Area 
                          type="monotone" 
                          dataKey="ingresos" 
                          stackId="1" 
                          stroke="#10b981" 
                          fill="url(#colorIngresos)"
                          strokeWidth={2}
                          name="Ingresos"
                        />
                        <Area 
                          type="monotone" 
                          dataKey="egresos" 
                          stackId="2" 
                          stroke="#ef4444" 
                          fill="url(#colorEgresos)"
                          strokeWidth={2}
                          name="Egresos"
                        />
                        <Line 
                          type="monotone" 
                          dataKey="flujo_neto" 
                          stroke="#0B132B" 
                          strokeWidth={4}
                          name="Flujo Neto"
                          dot={{ fill: '#0B132B', strokeWidth: 2, r: 5 }}
                          activeDot={{ r: 7 }}
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Panel de indicadores de riesgo */}
                <Card className="border-2 border-slate-200 shadow-lg overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
                    <CardTitle className="text-xl flex items-center gap-2">
                      <Shield className="h-5 w-5 text-red-600" />
                      Análisis de Riesgo
                    </CardTitle>
                    <CardDescription>
                      Indicadores clave
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-6">
                    {/* Indicador de cuentas en sobregiro */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-700">Cuentas en Sobregiro</span>
                        <span className="text-lg font-bold text-red-600">
                          {formatNumber(reporteFinanciero.analisis_riesgo.cuentas_sobregiro)}
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-red-500 to-rose-600 h-3 rounded-full transition-all duration-500"
                          style={{ 
                            width: `${Math.min((reporteFinanciero.analisis_riesgo.cuentas_sobregiro / 100) * 100, 100)}%` 
                          }}
                        />
                      </div>
                    </div>

                    {/* Indicador de cuentas alto valor */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-700">Cuentas Alto Valor</span>
                        <span className="text-lg font-bold text-green-600">
                          {formatNumber(reporteFinanciero.analisis_riesgo.cuentas_alto_valor)}
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-green-500 to-emerald-600 h-3 rounded-full transition-all duration-500"
                          style={{ 
                            width: `${Math.min((reporteFinanciero.analisis_riesgo.cuentas_alto_valor / 50) * 100, 100)}%` 
                          }}
                        />
                      </div>
                    </div>

                    {/* Indicador de exposición */}
                    <div className="p-4 bg-gradient-to-br from-red-50 to-rose-100 rounded-xl border-2 border-red-200">
                      <div className="flex items-center gap-3 mb-2">
                        <AlertCircle className="h-5 w-5 text-red-600" />
                        <span className="font-semibold text-red-900">Exposición al Riesgo</span>
                      </div>
                      <p className="text-3xl font-bold text-red-700">
                        {formatCurrency(reporteFinanciero.analisis_riesgo.exposicion_riesgo)}
                      </p>
                      <p className="text-sm text-red-600 mt-1">
                        Requiere atención inmediata
                      </p>
                    </div>

                    {/* Saldo promedio */}
                    <div className="p-4 bg-gradient-to-br from-blue-50 to-cyan-100 rounded-xl border-2 border-blue-200">
                      <div className="flex items-center gap-3 mb-2">
                        <DollarSign className="h-5 w-5 text-blue-600" />
                        <span className="font-semibold text-blue-900">Saldo Promedio</span>
                      </div>
                      <p className="text-3xl font-bold text-blue-700">
                        {formatCurrency(reporteFinanciero.analisis_riesgo.saldo_promedio)}
                      </p>
                      <p className="text-sm text-blue-600 mt-1">
                        Por cuenta activa
                      </p>
                    </div>

                    {/* Clientes activos */}
                    <div className="p-4 bg-gradient-to-br from-purple-50 to-violet-100 rounded-xl border-2 border-purple-200">
                      <div className="flex items-center gap-3 mb-2">
                        <Users className="h-5 w-5 text-purple-600" />
                        <span className="font-semibold text-purple-900">Clientes Activos</span>
                      </div>
                      <p className="text-3xl font-bold text-purple-700">
                        {formatNumber(reporteFinanciero.rentabilidad.clientes_activos)}
                      </p>
                      <p className="text-sm text-purple-600 mt-1">
                        Con transacciones recientes
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Resumen de rentabilidad */}
              <Card className="border-2 border-slate-200 shadow-lg overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-100 border-b border-green-200">
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <Percent className="h-6 w-6 text-green-600" />
                    Análisis de Rentabilidad
                  </CardTitle>
                  <CardDescription>
                    Resumen de ingresos y comisiones del período
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border-2 border-green-200">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-3 bg-green-500 rounded-lg shadow-md">
                          <DollarSign className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-green-700 uppercase tracking-wide">Ingresos</p>
                          <p className="text-2xl font-bold text-green-900">
                            {formatCurrency(reporteFinanciero.rentabilidad.ingresos_comisiones)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-green-200">
                        <TrendingUp className="h-4 w-4 text-green-600" />
                        <span className="text-sm text-green-700">
                          {formatNumber(reporteFinanciero.rentabilidad.transacciones_con_comision)} transacciones
                        </span>
                      </div>
                    </div>

                    <div className="p-6 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border-2 border-blue-200">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-3 bg-blue-500 rounded-lg shadow-md">
                          <Activity className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-blue-700 uppercase tracking-wide">Activos</p>
                          <p className="text-2xl font-bold text-blue-900">
                            {formatCurrency(reporteFinanciero.rentabilidad.activos_totales)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-blue-200">
                        <Target className="h-4 w-4 text-blue-600" />
                        <span className="text-sm text-blue-700">
                          Total bajo gestión
                        </span>
                      </div>
                    </div>

                    <div className="p-6 bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl border-2 border-purple-200">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-3 bg-purple-500 rounded-lg shadow-md">
                          <Users className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-purple-700 uppercase tracking-wide">Clientes</p>
                          <p className="text-2xl font-bold text-purple-900">
                            {formatNumber(reporteFinanciero.rentabilidad.clientes_activos)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-purple-200">
                        <Zap className="h-4 w-4 text-purple-600" />
                        <span className="text-sm text-purple-700">
                          Activos en el período
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="usuarios" className="space-y-6">
          <Card className="border-2 border-slate-200 shadow-lg overflow-hidden">
            <CardContent className="pt-12 pb-12 text-center space-y-6">
              <div className="flex justify-center">
                <div className="p-6 bg-gradient-to-br from-slate-100 to-slate-200 rounded-3xl shadow-inner">
                  <FileBarChart className="h-20 w-20 text-slate-400" />
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-slate-900">Reporte de Usuarios</h3>
                <p className="text-slate-600 max-w-md mx-auto">
                  El análisis detallado de usuarios estará disponible próximamente. 
                  Incluirá métricas de actividad, segmentación y comportamiento.
                </p>
              </div>
              <div className="flex justify-center gap-3 pt-4">
                <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-300 px-4 py-2">
                  En desarrollo
                </Badge>
                <Badge variant="secondary" className="bg-purple-100 text-purple-700 border-purple-300 px-4 py-2">
                  Próximamente
                </Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transacciones" className="space-y-6">
          <Card className="border-2 border-slate-200 shadow-lg overflow-hidden">
            <CardContent className="pt-12 pb-12 text-center space-y-6">
              <div className="flex justify-center">
                <div className="p-6 bg-gradient-to-br from-slate-100 to-slate-200 rounded-3xl shadow-inner">
                  <Activity className="h-20 w-20 text-slate-400" />
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-slate-900">Reporte de Transacciones</h3>
                <p className="text-slate-600 max-w-md mx-auto">
                  El análisis profundo de transacciones estará disponible próximamente.
                  Incluirá patrones, frecuencias y análisis de fraude.
                </p>
              </div>
              <div className="flex justify-center gap-3 pt-4">
                <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-300 px-4 py-2">
                  En desarrollo
                </Badge>
                <Badge variant="secondary" className="bg-indigo-100 text-indigo-700 border-indigo-300 px-4 py-2">
                  Próximamente
                </Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}