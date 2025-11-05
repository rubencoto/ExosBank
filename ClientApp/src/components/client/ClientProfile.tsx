import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { User, Mail, Phone, MapPin, IdCard, CreditCard } from 'lucide-react';
import { useState, useEffect, FormEvent } from 'react';

interface ClientProfileProps {
  clientId: number;
}

interface UserData {
  id: number;
  nombre: string;
  correo: string;
  cedula: string;
  direccion: string;
  telefono: string;
  rol: string;
  tipo_cuenta: string;
  cuentas: Array<{
    id_cuenta: number;
    numero_cuenta: string;
    tipo_cuenta: number;
    saldo: number;
  }>;
}

export function ClientProfile({ clientId }: ClientProfileProps) {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchUserData();
  }, [clientId]);

  const fetchUserData = async () => {
    try {
      const response = await fetch('http://localhost/ExosBank/api/usuarios/me.php', {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Error al obtener datos del usuario');
      }

      const data = await response.json();

      if (data.status === 'ok') {
        setUserData(data.data);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccessMessage('');

    const formData = new FormData(e.currentTarget);
    const updateData = {
      nombre: formData.get('name') as string,
      correo: formData.get('email') as string,
      cedula: formData.get('cedula') as string,
      telefono: formData.get('phone') as string,
      direccion: formData.get('address') as string,
    };

    try {
      const response = await fetch('http://localhost/ExosBank/api/usuarios/update.php', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(updateData)
      });

      const data = await response.json();

      if (data.status === 'ok') {
        setSuccessMessage('Perfil actualizado correctamente');
        setUserData(prev => prev ? { ...prev, ...data.data } : null);
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError(data.message || 'Error al actualizar perfil');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de conexión');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div>Cargando perfil...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!userData) {
    return <div>Usuario no encontrado</div>;
  }

  const tipoCuentaDescripcion = {
    '1': 'Cuenta Corriente',
    '2': 'Cuenta de Ahorro',
    '3': 'Cuenta de Crédito'
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold mb-2">{userData.nombre}</h1>
      </div>

      {/* Datos del Usuario */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-2xl">Datos del Usuario</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Columna 1 */}
            <div className="space-y-6">
              <div className="flex items-start gap-3">
                <IdCard className="h-6 w-6 text-muted-foreground mt-1" />
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Cédula</p>
                  <p className="text-lg font-medium">{userData.cedula}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="h-6 w-6 text-muted-foreground mt-1" />
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Dirección</p>
                  <p className="text-lg font-medium">{userData.direccion}</p>
                </div>
              </div>
            </div>

            {/* Columna 2 */}
            <div className="space-y-6">
              <div className="flex items-start gap-3">
                <Mail className="h-6 w-6 text-muted-foreground mt-1" />
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Correo</p>
                  <p className="text-lg font-medium break-all">{userData.correo}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="h-6 w-6 text-muted-foreground mt-1" />
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Teléfono</p>
                  <p className="text-lg font-medium">{userData.telefono}</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Información de Contacto */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-2xl">Información de Contacto</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <Label htmlFor="email-edit" className="text-base">Correo electrónico</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                <Input
                  id="email-edit"
                  name="email"
                  type="email"
                  defaultValue={userData.correo}
                  className="pl-11 h-11 text-base"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone-edit" className="text-base">Teléfono</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                <Input
                  id="phone-edit"
                  name="phone"
                  defaultValue={userData.telefono}
                  className="pl-11 h-11 text-base"
                />
              </div>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="address-edit" className="text-base">Dirección</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                <Input
                  id="address-edit"
                  name="address"
                  defaultValue={userData.direccion}
                  className="pl-11 h-11 text-base"
                />
              </div>
            </div>
          </div>

          <div className="mt-6 flex gap-3 justify-end">
            <Button
              variant="outline"
              className="px-6"
            >
              Cancelar
            </Button>
            <Button
              className="bg-[#0B132B] hover:bg-[#1C2541] px-6"
              disabled={saving}
            >
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {successMessage && (
        <div className="p-4 bg-green-100 text-green-700 rounded-md">
          {successMessage}
        </div>
      )}
      {error && (
        <div className="p-4 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}
    </div>
  );
}
