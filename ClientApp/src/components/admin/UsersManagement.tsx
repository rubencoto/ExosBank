import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Alert, AlertDescription } from "../ui/alert";
import {
  Edit,
  Trash2,
  UserPlus,
  CreditCard,
  RefreshCw,
  Loader2,
  AlertCircle,
} from "lucide-react";

interface NewUserForm {
  nombre: string;
  correo: string;
  contrasena: string;
  rol: string;
  telefono: string;
  cedula: string;
  direccion: string;
}

interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: "admin" | "client";
  status: "active" | "inactive";
  cedula?: string;
  phone?: string;
  address?: string;
  tipoCuenta?: string | number | null;
}

interface Cuenta {
  id_cuenta: number;
  numero_cuenta: string;
  tipo_cuenta: number;
  tipo_cuenta_nombre: string;
  saldo: number;
}

const API_BASE_URL = "/api";

export function UsersManagement() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [stats, setStats] = useState({ total: 0, admins: 0, clients: 0 });
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isNewUserOpen, setIsNewUserOpen] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [createError, setCreateError] = useState<string | null>(null);
  const [tableError, setTableError] = useState("");
  const [creatingUser, setCreatingUser] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState("");
  const [deletingUserId, setDeletingUserId] = useState<number | null>(null);

  // Estado para ver cuentas de cliente
  const [viewingUserAccounts, setViewingUserAccounts] =
    useState<AdminUser | null>(null);
  const [isAccountsOpen, setIsAccountsOpen] = useState(false);
  const [userAccounts, setUserAccounts] = useState<Cuenta[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);

  const [newUser, setNewUser] = useState<NewUserForm>({
    nombre: "",
    correo: "",
    contrasena: "",
    rol: "",
    telefono: "",
    cedula: "",
    direccion: "",
  });

  const normalizeStatus = (value?: string | null): "active" | "inactive" =>
    value && value.toLowerCase() === "inactivo" ? "inactive" : "active";

  const fetchUsers = useCallback(async () => {
    setLoadingUsers(true);
    setTableError("");
    try {
      const response = await fetch(`${API_BASE_URL}/admin/usuarios.php`, {
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Error al obtener los usuarios");
      }

      const data = await response.json();
      if (data.status !== "ok") {
        throw new Error(
          data.message || "No se pudo cargar la lista de usuarios"
        );
      }

      const mapped: AdminUser[] = (data.data.usuarios || []).map(
        (usuario: any) => ({
          id: usuario.id_usuario,
          name: usuario.nombre,
          email: usuario.correo,
          role: usuario.rol === "Administrador" ? "admin" : "client",
          status: normalizeStatus(usuario.estado),
          cedula: usuario.cedula || "",
          phone: usuario.telefono || "",
          address: usuario.direccion || "",
          tipoCuenta: usuario.tipo_cuenta ?? null,
        })
      );

      setUsers(mapped);
      setStats({
        total: data.data.total ?? mapped.length,
        admins:
          data.data.resumen?.administradores ??
          mapped.filter((u) => u.role === "admin").length,
        clients:
          data.data.resumen?.clientes ??
          mapped.filter((u) => u.role === "client").length,
      });
    } catch (err) {
      console.error("Error al cargar usuarios:", err);
      setTableError(
        err instanceof Error
          ? err.message
          : "Error desconocido al cargar usuarios"
      );
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleCreateUser = async () => {
    // Validar campos antes de enviar
    if (!newUser.nombre.trim()) {
      setCreateError("El nombre es obligatorio");
      return;
    }
    if (!newUser.correo.trim()) {
      setCreateError("El correo es obligatorio");
      return;
    }
    if (!newUser.contrasena) {
      setCreateError("La contraseña es obligatoria");
      return;
    }
    if (!newUser.rol) {
      setCreateError("Debe seleccionar un rol");
      return;
    }
    if (!newUser.telefono.trim()) {
      setCreateError("El teléfono es obligatorio");
      return;
    }
    if (!newUser.cedula.trim()) {
      setCreateError("La cédula es obligatoria");
      return;
    }
    if (!newUser.direccion.trim()) {
      setCreateError("La dirección es obligatoria");
      return;
    }

    setCreatingUser(true);
    setCreateError(null);

    try {
      const response = await fetch(
        "http://localhost/ExosBank/api/usuarios/create.php",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(newUser),
        }
      );

      const data = await response.json();

      if (data.success) {
        // Usuario creado exitosamente
        alert("Usuario creado exitosamente");

        await fetchUsers();

        // Limpiar el formulario y cerrar el modal
        setNewUser({
          nombre: "",
          correo: "",
          contrasena: "",
          rol: "",
          telefono: "",
          cedula: "",
          direccion: "",
        });
        setIsNewUserOpen(false);
      } else {
        setCreateError(data.message);
        alert("Error: " + data.message);
      }
    } catch (err) {
      const errorMsg = "Error de conexión con el servidor";
      setCreateError(errorMsg);
      console.error("Error completo:", err);
      alert(errorMsg);
    } finally {
      setCreatingUser(false);
    }
  };

  const handleSaveUser = async () => {
    if (!editingUser) {
      return;
    }

    setSavingEdit(true);
    setEditError("");

    try {
      const payload = {
        id_usuario: editingUser.id,
        nombre: editingUser.name,
        correo: editingUser.email,
        rol: editingUser.role === "admin" ? "Administrador" : "Cliente",
        estado: editingUser.status === "inactive" ? "Inactivo" : "Activo",
        cedula: editingUser.cedula ?? "",
        telefono: editingUser.phone ?? "",
        direccion: editingUser.address ?? "",
        tipo_cuenta: editingUser.tipoCuenta ?? undefined,
      };

      const response = await fetch(`${API_BASE_URL}/admin/usuarios.php`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (data.status !== "ok") {
        throw new Error(data.message || "No se pudo actualizar el usuario");
      }

      await fetchUsers();
      setIsEditOpen(false);
      setEditingUser(null);
    } catch (err) {
      console.error("Error al actualizar usuario:", err);
      setEditError(
        err instanceof Error ? err.message : "Error desconocido al actualizar"
      );
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (
      !confirm(
        "¿Estás seguro de eliminar este usuario? Esta acción es irreversible."
      )
    ) {
      return;
    }

    setDeletingUserId(userId);
    try {
      const response = await fetch(
        `${API_BASE_URL}/admin/usuarios.php?id=${userId}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      const data = await response.json();
      if (data.status !== "ok") {
        throw new Error(data.message || "No se pudo eliminar el usuario");
      }

      await fetchUsers();
    } catch (err) {
      console.error("Error al eliminar usuario:", err);
      alert(
        err instanceof Error
          ? err.message
          : "Error desconocido al eliminar usuario"
      );
    } finally {
      setDeletingUserId(null);
    }
  };

  const handleViewAccounts = async (user: AdminUser) => {
    setViewingUserAccounts(user);
    setIsAccountsOpen(true);
    setLoadingAccounts(true);
    setUserAccounts([]);

    try {
      // Obtener las cuentas del cliente desde el backend
      const response = await fetch(
        `/api/admin/cliente-cuentas.php?id_usuario=${user.id}`,
        {
          credentials: "include",
        }
      );

      const data = await response.json();

      if (data.status === "ok" && data.data.cuentas) {
        setUserAccounts(data.data.cuentas);
      } else {
        console.error("Error al obtener cuentas:", data.message);
      }
    } catch (err) {
      console.error("Error al cargar cuentas del cliente:", err);
    } finally {
      setLoadingAccounts(false);
    }
  };

  const getAccountTypeBadge = (tipo: number) => {
    const config = {
      1: {
        color: "bg-emerald-100 text-emerald-800 hover:bg-emerald-100",
        label: "Corriente",
        icon: "💳",
      },
      2: {
        color: "bg-blue-100 text-blue-800 hover:bg-blue-100",
        label: "Ahorro",
        icon: "🏦",
      },
    };

    const item = config[tipo as keyof typeof config] || config[1];

    return (
      <Badge variant="secondary" className={item.color}>
        <span className="mr-1">{item.icon}</span>
        {item.label}
      </Badge>
    );
  };

  const formatAccountNumber = (numero: string) => {
    if (numero.length === 11) {
      return `${numero.slice(0, 4)}-${numero.slice(4, 8)}-${numero.slice(8)}`;
    }
    return numero;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2>Gestión de Usuarios</h2>
          <p className="text-muted-foreground">
            {stats.total} usuarios ({stats.admins} administradores ·{" "}
            {stats.clients} clientes)
          </p>
        </div>
        <Dialog open={isNewUserOpen} onOpenChange={setIsNewUserOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#10b981] hover:bg-[#059669]">
              <UserPlus className="h-4 w-4 mr-2" />
              Nuevo Usuario
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Crear Nuevo Usuario</DialogTitle>
              <DialogDescription>
                Complete la información del nuevo usuario para registrarlo en el
                sistema.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="nombre">Nombre completo *</Label>
                  <Input
                    id="nombre"
                    placeholder="Juan Pérez Solís"
                    value={newUser.nombre}
                    onChange={(e) =>
                      setNewUser({ ...newUser, nombre: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="correo">Correo electrónico *</Label>
                  <Input
                    id="correo"
                    type="email"
                    placeholder="usuario@email.com"
                    value={newUser.correo}
                    onChange={(e) =>
                      setNewUser({ ...newUser, correo: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="contrasena">Contraseña *</Label>
                  <Input
                    id="contrasena"
                    type="password"
                    placeholder="••••••••"
                    value={newUser.contrasena}
                    onChange={(e) =>
                      setNewUser({ ...newUser, contrasena: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="rol">Rol *</Label>
                  <Select
                    value={newUser.rol}
                    onValueChange={(value) =>
                      setNewUser({ ...newUser, rol: value })
                    }
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione un rol" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Cliente">Cliente</SelectItem>
                      <SelectItem value="Administrador">
                        Administrador
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="telefono">Teléfono *</Label>
                  <Input
                    id="telefono"
                    placeholder="+506 8234 5678"
                    value={newUser.telefono}
                    onChange={(e) =>
                      setNewUser({ ...newUser, telefono: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="cedula">Cédula *</Label>
                  <Input
                    id="cedula"
                    placeholder="1-0000-0000"
                    value={newUser.cedula}
                    onChange={(e) =>
                      setNewUser({ ...newUser, cedula: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="direccion">Dirección *</Label>
                <Input
                  id="direccion"
                  placeholder="Barrio Escalante, San José"
                  value={newUser.direccion}
                  onChange={(e) =>
                    setNewUser({ ...newUser, direccion: e.target.value })
                  }
                  required
                />
              </div>

              {createError && (
                <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
                  {createError}
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={handleCreateUser}
                  disabled={creatingUser}
                  className="flex-1 bg-[#2563eb] hover:bg-[#1d4ed8]"
                >
                  {creatingUser ? "Guardando..." : "Guardar usuario"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsNewUserOpen(false)}
                  disabled={creatingUser}
                  className="flex-1"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="shadow-md">
        <CardHeader className="flex items-center justify-between gap-4">
          <div>
            <CardTitle>Lista de Usuarios</CardTitle>
          </div>
          <button
            onClick={() => fetchUsers()}
            className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm"
            disabled={loadingUsers}
          >
            <RefreshCw
              className={`h-4 w-4 ${loadingUsers ? "animate-spin" : ""}`}
            />
            {loadingUsers ? "Actualizando..." : "Actualizar"}
          </button>
        </CardHeader>
        <CardContent>
          {tableError && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{tableError}</AlertDescription>
            </Alert>
          )}

          {loadingUsers ? (
            <div className="py-12 text-center text-muted-foreground">
              Cargando usuarios...
            </div>
          ) : users.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              No hay usuarios registrados
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Correo</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>#{user.id}</TableCell>
                    <TableCell>{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          user.role === "admin" ? "default" : "secondary"
                        }
                      >
                        {user.role === "admin" ? "Administrador" : "Cliente"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          user.status === "active" ? "default" : "destructive"
                        }
                      >
                        {user.status === "active" ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewAccounts(user)}
                          title="Ver cuentas del cliente"
                        >
                          <CreditCard className="h-4 w-4" />
                        </Button>
                        <Dialog
                          open={isEditOpen && editingUser?.id === user.id}
                          onOpenChange={(open) => {
                            setIsEditOpen(open);
                            if (!open) {
                              setEditingUser(null);
                              setEditError("");
                            }
                          }}
                        >
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setEditingUser({ ...user })}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[460px]">
                            <DialogHeader>
                              <DialogTitle>Editar Usuario</DialogTitle>
                              <DialogDescription>
                                Modifica la información del usuario
                              </DialogDescription>
                            </DialogHeader>
                            {editingUser && (
                              <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                  <Label htmlFor="name">Nombre</Label>
                                  <Input
                                    id="name"
                                    value={editingUser.name}
                                    onChange={(e) =>
                                      setEditingUser({
                                        ...editingUser,
                                        name: e.target.value,
                                      })
                                    }
                                  />
                                </div>
                                <div className="grid gap-2">
                                  <Label htmlFor="email">Correo</Label>
                                  <Input
                                    id="email"
                                    type="email"
                                    value={editingUser.email}
                                    onChange={(e) =>
                                      setEditingUser({
                                        ...editingUser,
                                        email: e.target.value,
                                      })
                                    }
                                  />
                                </div>
                                <div className="grid gap-2">
                                  <Label htmlFor="cedula">Cédula</Label>
                                  <Input
                                    id="cedula"
                                    value={editingUser.cedula ?? ""}
                                    onChange={(e) =>
                                      setEditingUser({
                                        ...editingUser,
                                        cedula: e.target.value,
                                      })
                                    }
                                  />
                                </div>
                                <div className="grid gap-2">
                                  <Label htmlFor="telefono">Teléfono</Label>
                                  <Input
                                    id="telefono"
                                    value={editingUser.phone ?? ""}
                                    onChange={(e) =>
                                      setEditingUser({
                                        ...editingUser,
                                        phone: e.target.value,
                                      })
                                    }
                                  />
                                </div>
                                <div className="grid gap-2">
                                  <Label htmlFor="direccion">Dirección</Label>
                                  <Input
                                    id="direccion"
                                    value={editingUser.address ?? ""}
                                    onChange={(e) =>
                                      setEditingUser({
                                        ...editingUser,
                                        address: e.target.value,
                                      })
                                    }
                                  />
                                </div>
                                <div className="grid gap-2">
                                  <Label htmlFor="role">Rol</Label>
                                  <Select
                                    value={editingUser.role}
                                    onValueChange={(
                                      value: "admin" | "client"
                                    ) =>
                                      setEditingUser({
                                        ...editingUser,
                                        role: value,
                                      })
                                    }
                                  >
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="client">
                                        Cliente
                                      </SelectItem>
                                      <SelectItem value="admin">
                                        Administrador
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="grid gap-2">
                                  <Label htmlFor="status">Estado</Label>
                                  <Select
                                    value={editingUser.status}
                                    onValueChange={(
                                      value: "active" | "inactive"
                                    ) =>
                                      setEditingUser({
                                        ...editingUser,
                                        status: value,
                                      })
                                    }
                                  >
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="active">
                                        Activo
                                      </SelectItem>
                                      <SelectItem value="inactive">
                                        Inactivo
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>

                                {editError && (
                                  <div className="bg-red-50 text-red-600 p-2 rounded text-sm">
                                    {editError}
                                  </div>
                                )}

                                <Button
                                  onClick={handleSaveUser}
                                  disabled={savingEdit}
                                  className="bg-[#0B132B] hover:bg-[#1C2541]"
                                >
                                  {savingEdit
                                    ? "Guardando..."
                                    : "Guardar cambios"}
                                </Button>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteUser(user.id)}
                          disabled={deletingUserId === user.id}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          {deletingUserId === user.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Modal para ver cuentas del cliente */}
      <Dialog open={isAccountsOpen} onOpenChange={setIsAccountsOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Cuentas de {viewingUserAccounts?.name}</DialogTitle>
            <DialogDescription>
              Administra las cuentas bancarias de este cliente
            </DialogDescription>
          </DialogHeader>

          {loadingAccounts ? (
            <div className="py-8 text-center">
              <p className="text-muted-foreground">Cargando cuentas...</p>
            </div>
          ) : userAccounts.length === 0 ? (
            <div className="py-8 text-center">
              <CreditCard className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">
                Este cliente no tiene cuentas registradas
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Resumen */}
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">
                      {userAccounts.length}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Total cuentas
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">
                      $
                      {userAccounts
                        .reduce((sum, c) => sum + c.saldo, 0)
                        .toLocaleString("es-ES", { minimumFractionDigits: 2 })}
                    </div>
                    <p className="text-xs text-muted-foreground">Saldo total</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">
                      {new Set(userAccounts.map((c) => c.tipo_cuenta)).size}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Tipos de cuenta
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Tabla de cuentas */}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Número de Cuenta</TableHead>
                    <TableHead>Saldo</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {userAccounts.map((cuenta) => (
                    <TableRow key={cuenta.id_cuenta}>
                      <TableCell>
                        {getAccountTypeBadge(cuenta.tipo_cuenta)}
                      </TableCell>
                      <TableCell className="font-mono text-base">
                        {formatAccountNumber(cuenta.numero_cuenta)}
                      </TableCell>
                      <TableCell className="text-lg font-semibold text-emerald-600">
                        $
                        {cuenta.saldo.toLocaleString("es-ES", {
                          minimumFractionDigits: 2,
                        })}
                      </TableCell>
                      <TableCell>
                        <Badge variant="default" className="bg-emerald-600">
                          ✓ Activa
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
