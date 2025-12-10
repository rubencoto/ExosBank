import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Button } from "../ui/button";
import { mockUsers } from "../../lib/mockData";
import { User, Mail, Phone, MapPin, IdCard, Lock, Eye, EyeOff, Shield } from "lucide-react";
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
  const [isEditing, setIsEditing] = useState(false);

  // Estados para cambio de contraseña
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

      // Obtener el texto de la respuesta primero
      const responseText = await response.text();
      
      // Mostrar respuesta completa para debugging
      console.log("=== RESPONSE STATUS:", response.status);
      console.log("=== RESPONSE TEXT (first 1000 chars):", responseText.substring(0, 1000));
      
      // Intentar parsear como JSON
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (jsonError) {
        console.error("=== JSON PARSE ERROR:", jsonError);
        console.error("=== FULL RESPONSE TEXT:", responseText);
        throw new Error("El servidor devolvió una respuesta inválida. Verifica la consola del navegador.");
      }

      if (data.status === "ok") {
        toast.success("Perfil actualizado correctamente");
        setUserData((prev) => (prev ? { ...prev, ...data.data } : null));
        setIsEditing(false);
        // Refrescar datos del servidor
        await fetchUserData();
      } else {
        toast.error(data.message || "Error al actualizar perfil");
        setError(data.message || "Error al actualizar perfil");
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Error de conexión";
      console.error("Error al actualizar perfil:", err);
      toast.error(errorMsg);
      setError(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    // Validaciones
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("Todos los campos de contraseña son obligatorios");
      toast.error("Todos los campos son obligatorios");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Las contraseñas nuevas no coinciden");
      toast.error("Las contraseñas nuevas no coinciden");
      return;
    }

    if (newPassword.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      toast.error("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    if (currentPassword === newPassword) {
      setError("La nueva contraseña debe ser diferente a la actual");
      toast.error("La nueva contraseña debe ser diferente a la actual");
      return;
    }

    setChangingPassword(true);

    try {
      const response = await fetch("/api/usuarios/change-password.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          currentPassword: currentPassword,
          newPassword: newPassword,
        }),
      });

      const data = await response.json();

      if (data.status === "ok") {
        toast.success("Contraseña actualizada correctamente");
        // Limpiar campos
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setError("");
      } else {
        toast.error(data.message || "Error al cambiar contraseña");
        setError(data.message || "Error al cambiar contraseña");
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Error de conexión";
      console.error("Error al cambiar contraseña:", err);
      toast.error(errorMsg);
      setError(errorMsg);
    } finally {
      setChangingPassword(false);
    }
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
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Información Personal</CardTitle>
              <div className="flex gap-2">
                {!isEditing ? (
                  <Button
                    type="button"
                    size="sm"
                    className="bg-[#0B132B] hover:bg-[#1C2541]"
                    onClick={() => setIsEditing(true)}
                  >
                    Editar Información
                  </Button>
                ) : (
                  <>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setIsEditing(false);
                        fetchUserData();
                      }}
                      disabled={saving}
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      size="sm"
                      className="bg-[#0B132B] hover:bg-[#1C2541]"
                      disabled={saving}
                      form="profile-form"
                    >
                      {saving ? "Guardando..." : "Guardar Cambios"}
                    </Button>
                  </>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <form id="profile-form" onSubmit={handleSaveProfile} className="space-y-6">
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
                        disabled={!isEditing}
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
                        disabled={!isEditing}
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
                      disabled={!isEditing}
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
                      disabled={!isEditing}
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
                      disabled={!isEditing}
                    />
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Security Card */}
          <Card className="shadow-md mt-6">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-[#0B132B]" />
                <CardTitle>Seguridad de la Cuenta</CardTitle>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Actualiza tu contraseña para mantener tu cuenta segura
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword" className="text-sm font-medium">
                    Contraseña actual
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="currentPassword"
                      type={showCurrentPassword ? "text" : "password"}
                      placeholder="Ingresa tu contraseña actual"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="pl-10 pr-10"
                      disabled={changingPassword}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                      tabIndex={-1}
                    >
                      {showCurrentPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword" className="text-sm font-medium">
                    Nueva contraseña
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="newPassword"
                      type={showNewPassword ? "text" : "password"}
                      placeholder="Mínimo 6 caracteres"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="pl-10 pr-10"
                      disabled={changingPassword}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                      tabIndex={-1}
                    >
                      {showNewPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {newPassword && newPassword.length < 6 && (
                    <p className="text-xs text-red-500 mt-1">
                      La contraseña debe tener al menos 6 caracteres
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium">
                    Confirmar nueva contraseña
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirma tu nueva contraseña"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-10 pr-10"
                      disabled={changingPassword}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {confirmPassword && newPassword !== confirmPassword && (
                    <p className="text-xs text-red-500 mt-1">
                      Las contraseñas no coinciden
                    </p>
                  )}
                </div>

                <div className="pt-4 border-t">
                  <Button
                    type="submit"
                    className="w-full bg-[#0B132B] hover:bg-[#1C2541]"
                    disabled={changingPassword || !currentPassword || !newPassword || !confirmPassword}
                  >
                    {changingPassword ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                        Cambiando contraseña...
                      </>
                    ) : (
                      <>
                        <Lock className="mr-2 h-4 w-4" />
                        Cambiar Contraseña
                      </>
                    )}
                  </Button>
                </div>
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
