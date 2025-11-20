import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Textarea } from '../ui/textarea';
import { Alert, AlertDescription } from '../ui/alert';
import { Settings, Save, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface ConfiguracionItem {
  clave: string;
  valor: any;
  descripcion: string;
  tipo: 'string' | 'number' | 'boolean' | 'json';
  fecha_actualizacion: string;
}

export function SystemSettings() {
  const [configuraciones, setConfiguraciones] = useState<ConfiguracionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [changes, setChanges] = useState<Record<string, { valor: any; tipo: string }>>({});

  useEffect(() => {
    fetchConfiguraciones();
  }, []);

  const fetchConfiguraciones = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch('/api/admin/configuracion.php', {
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al obtener configuraciones');
      }

      const data = await response.json();

      if (data.status === 'ok') {
        setConfiguraciones(data.data.configuraciones);
        setChanges({});
      } else {
        throw new Error(data.message || 'Error al cargar configuraciones');
      }
    } catch (err) {
      console.error('Error al cargar configuraciones:', err);
      setError(err instanceof Error ? err.message : 'Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const handleValueChange = (clave: string, valor: any, tipo: string) => {
    let valorProcesado = valor;
    
    // Procesar según tipo
    if (tipo === 'number') {
      valorProcesado = parseFloat(valor) || 0;
    } else if (tipo === 'boolean') {
      valorProcesado = Boolean(valor);
    }

    setChanges(prev => ({
      ...prev,
      [clave]: { valor: valorProcesado, tipo }
    }));
  };

  const handleSave = async () => {
    if (Object.keys(changes).length === 0) {
      toast.info('No hay cambios que guardar');
      return;
    }

    try {
      setSaving(true);
      setError('');

      const configuracionesActualizadas = Object.entries(changes).map(([clave, data]) => ({
        clave,
        valor: (data as { valor: any; tipo: string }).valor,
        tipo: (data as { valor: any; tipo: string }).tipo
      }));

      const response = await fetch('/api/admin/configuracion.php', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          configuraciones: configuracionesActualizadas
        })
      });

      const result = await response.json();

      if (result.status === 'ok') {
        toast.success('Configuración actualizada correctamente');
        await fetchConfiguraciones(); // Recargar datos
      } else {
        throw new Error(result.message || 'Error al actualizar configuración');
      }
    } catch (err) {
      console.error('Error al guardar configuración:', err);
      setError(err instanceof Error ? err.message : 'Error al guardar');
      toast.error('Error al guardar la configuración');
    } finally {
      setSaving(false);
    }
  };

  const renderConfigField = (config: ConfiguracionItem) => {
    const hasChanges = changes.hasOwnProperty(config.clave);
    const currentValue = hasChanges ? changes[config.clave].valor : config.valor;

    switch (config.tipo) {
      case 'boolean':
        return (
          <div className="flex items-center space-x-2">
            <Switch
              checked={currentValue}
              onCheckedChange={(checked) => handleValueChange(config.clave, checked, config.tipo)}
            />
            <Label>{currentValue ? 'Activado' : 'Desactivado'}</Label>
          </div>
        );

      case 'number':
        return (
          <Input
            type="number"
            value={currentValue}
            onChange={(e) => handleValueChange(config.clave, e.target.value, config.tipo)}
            step={config.clave.includes('porcentaje') ? '0.01' : '1'}
            min="0"
          />
        );

      case 'json':
        return (
          <Textarea
            value={typeof currentValue === 'object' ? JSON.stringify(currentValue, null, 2) : currentValue}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value);
                handleValueChange(config.clave, parsed, config.tipo);
              } catch {
                handleValueChange(config.clave, e.target.value, config.tipo);
              }
            }}
            rows={4}
            className="font-mono text-sm"
          />
        );

      default:
        return (
          <Input
            type="text"
            value={currentValue}
            onChange={(e) => handleValueChange(config.clave, e.target.value, config.tipo)}
          />
        );
    }
  };

  const getConfigSection = (clave: string) => {
    if (clave.includes('transferencia') || clave.includes('comision') || clave.includes('retencion')) {
      return 'Transacciones y Finanzas';
    } else if (clave.includes('email') || clave.includes('notificar') || clave.includes('smtp') || clave.includes('mail_')) {
      return 'Notificaciones';
    } else if (clave.includes('mantenimiento') || clave.includes('backup')) {
      return 'Sistema';
    } else {
      return 'General';
    }
  };

  // Agrupar configuraciones por sección
  const configPorSeccion = configuraciones.reduce<Record<string, ConfiguracionItem[]>>((acc, config) => {
    const seccion = getConfigSection(config.clave);
    if (!acc[seccion]) {
      acc[seccion] = [];
    }
    acc[seccion].push(config);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando configuraciones...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">Configuración del Sistema</h2>
          <p className="text-muted-foreground">Gestiona los parámetros y ajustes del sistema</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={fetchConfiguraciones}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Recargar
          </Button>
          <Button 
            onClick={handleSave}
            disabled={saving || Object.keys(changes).length === 0}
            className="bg-[#0B132B] hover:bg-[#1C2541]"
          >
            {saving ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Guardar Cambios
          </Button>
        </div>
      </div>

      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {Object.keys(changes).length > 0 && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertCircle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            Tienes {Object.keys(changes).length} cambio(s) sin guardar
          </AlertDescription>
        </Alert>
      )}

      {Object.entries(configPorSeccion).map(([seccion, configs]) => (
        <Card key={seccion} className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-[#0B132B]" />
              {seccion}
            </CardTitle>
            <CardDescription>
              Configuraciones relacionadas con {seccion.toLowerCase()}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {(configs as ConfiguracionItem[]).map((config) => (
              <div key={config.clave} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <Label className="text-sm font-medium capitalize">
                      {config.clave.replace(/_/g, ' ')}
                      {changes.hasOwnProperty(config.clave) && (
                        <span className="ml-2 text-orange-600">●</span>
                      )}
                    </Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      {config.descripcion}
                    </p>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {config.fecha_actualizacion && (
                      <span>Actualizado: {new Date(config.fecha_actualizacion).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
                <div className="max-w-md">
                  {renderConfigField(config)}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}

      {configuraciones.length === 0 && !loading && (
        <Card className="shadow-md">
          <CardContent className="pt-6 text-center space-y-4">
            <div className="flex justify-center">
              <div className="rounded-full bg-gray-100 p-3">
                <Settings className="h-6 w-6 text-gray-600" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-medium">No hay configuraciones disponibles</h3>
              <p className="text-muted-foreground">
                Las configuraciones se crearán automáticamente al acceder por primera vez
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}