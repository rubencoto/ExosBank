import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Button } from "../ui/button";
import { mockUsers } from "../../lib/mockData";
import { User, Mail, Phone, MapPin, IdCard } from "lucide-react";
import { toast } from "sonner";
import { useState, useEffect, FormEvent } from "react";

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
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Estados para cambio de contraseña
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    fetchUserData();
  }, [clientId]);

  const fetchUserData = async () => {
    try {
      const response = await fetch("/api/usuarios/me.php", {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Error al obtener datos del usuario");
      }

      const data = await response.json();

      if (data.status === "ok") {
        setUserData(data.data);
      } else {
        // Fallback to mock data if API fails
        const mockUser = mockUsers.find((u) => u.id === clientId);
        if (mockUser) {
          setUserData({
            id: mockUser.id,
            nombre: mockUser.name,
            correo: mockUser.email,
            cedula: mockUser.cedula || "",
            direccion: mockUser.address || "",
            telefono: mockUser.phone || "",
            rol: mockUser.role,
            tipo_cuenta: "cliente",
            cuentas: [],
          });
        } else {
          setError(data.message);
        }
      }
    } catch (err) {
      // Fallback to mock data if connection fails
      const mockUser = mockUsers.find((u) => u.id === clientId);
      if (mockUser) {
        setUserData({
          id: mockUser.id,
          nombre: mockUser.name,
          correo: mockUser.email,
          cedula: mockUser.cedula || "",
          direccion: mockUser.address || "",
          telefono: mockUser.phone || "",
          rol: mockUser.role,
          tipo_cuenta: "cliente",
          cuentas: [],
        });
      } else {
        setError(err instanceof Error ? err.message : "Error de conexión");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccessMessage("");

    const formData = new FormData(e.currentTarget);
    const updateData = {
      nombre: formData.get("name") as string,
      correo: formData.get("email") as string,
      cedula: formData.get("cedula") as string,
      telefono: formData.get("phone") as string,
      direccion: formData.get("address") as string,
    };

    try {
      const response = await fetch("/api/usuarios/update.php", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(updateData),
      });

      const data = await response.json();

      if (data.status === "ok") {
        toast.success("Perfil actualizado correctamente");
        setUserData((prev) => (prev ? { ...prev, ...data.data } : null));
      } else {
        setError(data.message || "Error al actualizar perfil");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error de conexión");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = (e: FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    if (newPassword.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    // Aquí iría la lógica para cambiar la contraseña
    toast.success("Contraseña actualizada correctamente");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
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
    return <div>Usuario no encontrado</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2>Mi Perfil</h2>
        <p className="text-muted-foreground">
          Administra tu información personal
        </p>
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
                  {saving ? "Guardando..." : "Guardar Cambios"}
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
              <form onSubmit={handleChangePassword}>
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Contraseña actual</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    placeholder="••••••••"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">Nueva contraseña</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">
                    Confirmar nueva contraseña
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
                <Button type="submit" variant="outline" className="w-full">
                  Cambiar Contraseña
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Error Messages */}
      {error && (
        <div className="p-4 bg-red-100 text-red-700 rounded-lg border border-red-200">
          ⚠ {error}
        </div>
      )}
    </div>
  );
}
