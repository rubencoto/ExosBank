import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { mockUsers } from '../../lib/mockData';
import { User, Mail, Phone, MapPin, IdCard } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface ClientProfileProps {
  clientId: number;
}

export function ClientProfile({ clientId }: ClientProfileProps) {
  const clientData = mockUsers.find(u => u.id === clientId);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Perfil actualizado correctamente');
  };

  if (!clientData) {
    return <div>Usuario no encontrado</div>;
  }

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
              <h3 className="mb-1">{clientData.name}</h3>
              <p className="text-sm text-muted-foreground">{clientData.email}</p>
              <div className="mt-4 pt-4 border-t">
                <p className="text-xs text-muted-foreground">Cliente desde</p>
                <p className="text-sm">Enero 2024</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Profile Form */}
        <div className="lg:col-span-2">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>Información Personal</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveProfile} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nombre completo</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="name"
                        defaultValue={clientData.name}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cedula">Cédula</Label>
                    <div className="relative">
                      <IdCard className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="cedula"
                        defaultValue={clientData.cedula}
                        className="pl-10"
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
                      type="email"
                      defaultValue={clientData.email}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      defaultValue={clientData.phone}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Dirección</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="address"
                      defaultValue={clientData.address}
                      className="pl-10"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-[#0B132B] hover:bg-[#1C2541]"
                >
                  Guardar Cambios
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
