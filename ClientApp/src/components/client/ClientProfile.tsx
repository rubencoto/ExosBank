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
        <h2>Mi Perfil</h2>
        <p className="text-muted-foreground">Administra tu información personal</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Info Card */}
        <div className="lg:col-span-1">
          <Card className="shadow-md">
            <CardContent className="p-6 text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-[#0B132B] to-[#1C2541] rounded-full mx-auto mb-4 flex items-center justify-center">
                <User className="h-12 w-12 text-white" />
              </div>
              <h3 className="mb-1">{userData.nombre}</h3>
              <p className="text-sm text-muted-foreground">{userData.correo}</p>
              <div className="mt-4 pt-4 border-t">
                <p className="text-xs text-muted-foreground">Cliente desde</p>
                <p className="text-sm">Enero 2024</p>
              </div>
            </CardContent>
          </Card>

          {/* Cuentas Bancarias */}
          {userData.cuentas && userData.cuentas.length > 0 && (
            <Card className="shadow-md mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Mis Cuentas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {userData.cuentas.map((cuenta) => (
                  <div key={cuenta.id_cuenta} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold">{cuenta.numero_cuenta}</p>
                        <p className="text-sm text-muted-foreground">
                          {tipoCuentaDescripcion[cuenta.tipo_cuenta.toString() as '1'|'2'|'3'] || 'Cuenta'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold">₡{cuenta.saldo.toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">Saldo disponible</p>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Profile Form */}
        <div className="lg:col-span-2">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>Información Personal</CardTitle>
            </CardHeader>
            <CardContent>
              {successMessage && (
                <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md">
                  {successMessage}
                </div>
              )}
              {error && (
                <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
                  {error}
                </div>
              )}
              <form onSubmit={handleSaveProfile} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nombre completo</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="name"
                        name="name"
                        defaultValue={userData.nombre}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cedula">Cédula</Label>
                    <div className="relative">
                      <IdCard className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="cedula"
                        name="cedula"
                        defaultValue={userData.cedula}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Correo electrónico</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      defaultValue={userData.correo}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      name="phone"
                      defaultValue={userData.telefono}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Dirección</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="address"
                      name="address"
                      defaultValue={userData.direccion}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-[#0B132B] hover:bg-[#1C2541]"
                  disabled={saving}
                >
                  {saving ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Security Card */}
          <Card className="shadow-md mt-6">
            <CardHeader>
              <CardTitle>Seguridad</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Contraseña actual</Label>
                <Input id="currentPassword" type="password" placeholder="••••••••" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">Nueva contraseña</Label>
                <Input id="newPassword" type="password" placeholder="••••••••" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar nueva contraseña</Label>
                <Input id="confirmPassword" type="password" placeholder="••••••••" />
              </div>
              <Button variant="outline" className="w-full">
                Cambiar Contraseña
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
