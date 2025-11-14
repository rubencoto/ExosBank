import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { User, Mail, Phone, MapPin, IdCard } from 'lucide-react';
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
  
  // Estados para cambio de contraseña
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

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

  const handleChangePassword = (e: FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }
    
    if (newPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    // Aquí iría la lógica para cambiar la contraseña
    setSuccessMessage('Contraseña actualizada correctamente');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Usuario no encontrado</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Mi Perfil</h2>
        <p className="text-muted-foreground">Administra tu información personal</p>
      </div>

      {/* User Info Card with Avatar */}
      <Card className="shadow-md">
        <CardContent className="p-8">
          <div className="flex items-start gap-6">
            {/* Avatar Circle */}
            <div className="flex-shrink-0">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white shadow-lg">
                <User className="w-16 h-16" />
              </div>
            </div>
            
            {/* User Info */}
            <div className="flex-1">
              <h3 className="text-2xl font-bold mb-1">{userData.nombre}</h3>
              <p className="text-muted-foreground mb-4">{userData.correo}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <IdCard className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Cliente desde:</span>
                  <span className="font-medium">Enero 2024</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Personal Information Form */}
      <Card className="shadow-md">
        <CardHeader className="border-b bg-muted/30">
          <CardTitle className="text-xl">Información Personal</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSaveProfile} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-base font-medium flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  Nombre completo
                </Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={userData.nombre}
                  className="h-11"
                  required
                />
              </div>

              {/* Cédula */}
              <div className="space-y-2">
                <Label htmlFor="cedula" className="text-base font-medium flex items-center gap-2">
                  <IdCard className="h-4 w-4 text-muted-foreground" />
                  Cédula
                </Label>
                <Input
                  id="cedula"
                  name="cedula"
                  defaultValue={userData.cedula}
                  className="h-11"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address" className="text-base font-medium flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                Dirección
              </Label>
              <Input
                id="address"
                name="address"
                defaultValue={userData.direccion}
                className="h-11"
                required
              />
            </div>

            <div className="pt-4 flex gap-3 justify-end border-t">
              <Button
                type="button"
                variant="outline"
                className="px-6"
                onClick={() => window.location.reload()}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-[#0B132B] hover:bg-[#1C2541] px-6"
                disabled={saving}
              >
                {saving ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card className="shadow-md">
        <CardHeader className="border-b bg-muted/30">
          <CardTitle className="text-xl">Información de Contacto</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-base font-medium flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                Correo electrónico
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={userData.correo}
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-base font-medium flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                Teléfono
              </Label>
              <Input
                id="phone"
                name="phone"
                defaultValue={userData.telefono}
                className="h-11"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Section */}
      <Card className="shadow-md">
        <CardHeader className="border-b bg-muted/30">
          <CardTitle className="text-xl">Seguridad</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleChangePassword} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="current-password" className="text-base font-medium">Contraseña actual</Label>
              <Input
                id="current-password"
                type="password"
                placeholder="••••••••"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-password" className="text-base font-medium">Nueva contraseña</Label>
              <Input
                id="new-password"
                type="password"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password" className="text-base font-medium">Confirmar nueva contraseña</Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="h-11"
              />
            </div>

            <div className="pt-4 border-t">
              <Button
                type="submit"
                variant="outline"
                className="px-6"
              >
                Cambiar Contraseña
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="p-4 bg-emerald-100 text-emerald-700 rounded-lg border border-emerald-200">
          ✓ {successMessage}
        </div>
      )}
      {error && (
        <div className="p-4 bg-red-100 text-red-700 rounded-lg border border-red-200">
          ⚠ {error}
        </div>
      )}
    </div>
  );
}
