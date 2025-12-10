import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Checkbox } from '../ui/checkbox';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Alert, AlertDescription } from '../ui/alert';
import { Shield, UserCog, Plus, Edit, Trash2, Users, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface Rol {
  id: number;
  nombre: string;
  descripcion: string;
  permisos: Record<string, Record<string, boolean>>;
  activo: boolean;
  fecha_creacion: string;
  fecha_actualizacion: string;
}

interface Usuario {
  id_usuario: number;
  nombre: string;
  correo: string;
  rol_sistema: string;
  roles_asignados: Array<{
    id_rol: number;
    nombre_rol: string;
    descripcion_rol: string;
    fecha_asignacion: string;
  }>;
}

interface RolDisponible {
  id: number;
  nombre: string;
  descripcion: string;
}

export function SecurityRoles() {
  const [roles, setRoles] = useState<Rol[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [rolesDisponibles, setRolesDisponibles] = useState<RolDisponible[]>([]);
  const [estadisticas, setEstadisticas] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Estados para diálogos
  const [isNewRoleOpen, setIsNewRoleOpen] = useState(false);
  const [isEditRoleOpen, setIsEditRoleOpen] = useState(false);
  const [isAssignRoleOpen, setIsAssignRoleOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Rol | null>(null);
  
  // Estados para formularios
  const [newRoleForm, setNewRoleForm] = useState({
    nombre: '',
    descripcion: '',
    permisos: {
      usuarios: { select: false, insert: false, update: false, delete: false },
      cuentas: { select: false, insert: false, update: false, delete: false },
      transacciones: { select: false, insert: false, update: false, delete: false },
      reportes: { select: false, insert: false, update: false, delete: false },
      auditoria: { select: false, insert: false, update: false, delete: false }
    }
  });
  
  const [assignForm, setAssignForm] = useState({
    id_usuario: '',
    id_rol: ''
  });

  useEffect(() => {
    fetchRoles();
    fetchAsignaciones();
  }, []);

  const fetchRoles = async () => {
    try {
      const response = await fetch('/api/admin/roles.php', {
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al obtener roles');
      }

      const data = await response.json();

      if (data.status === 'ok') {
        setRoles(data.data.roles);
        setEstadisticas(data.data.estadisticas);
      } else {
        throw new Error(data.message || 'Error al cargar roles');
      }
    } catch (err) {
      console.error('Error al cargar roles:', err);
      setError(err instanceof Error ? err.message : 'Error de conexión');
    }
  };

  const fetchAsignaciones = async () => {
    try {
      const response = await fetch('/api/admin/asignar-roles.php', {
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al obtener asignaciones');
      }

      const data = await response.json();

      if (data.status === 'ok') {
        setUsuarios(data.data.usuarios);
        setRolesDisponibles(data.data.roles_disponibles);
      } else {
        throw new Error(data.message || 'Error al cargar asignaciones');
      }
    } catch (err) {
      console.error('Error al cargar asignaciones:', err);
      setError(err instanceof Error ? err.message : 'Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/admin/roles.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(newRoleForm)
      });

      const result = await response.json();

      if (result.status === 'ok') {
        toast.success('Rol creado correctamente');
        setIsNewRoleOpen(false);
        setNewRoleForm({
          nombre: '',
          descripcion: '',
          permisos: {
            usuarios: { select: false, insert: false, update: false, delete: false },
            cuentas: { select: false, insert: false, update: false, delete: false },
            transacciones: { select: false, insert: false, update: false, delete: false },
            reportes: { select: false, insert: false, update: false, delete: false },
            auditoria: { select: false, insert: false, update: false, delete: false }
          }
        });
        await fetchRoles();
      } else {
        throw new Error(result.message || 'Error al crear rol');
      }
    } catch (err) {
      console.error('Error al crear rol:', err);
      toast.error('Error al crear el rol');
    }
  };

  const handleUpdateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingRole) return;

    try {
      const response = await fetch('/api/admin/roles.php', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          id: editingRole.id,
          nombre: editingRole.nombre,
          descripcion: editingRole.descripcion,
          permisos: editingRole.permisos
        })
      });

      const result = await response.json();

      if (result.status === 'ok') {
        toast.success('Rol actualizado correctamente');
        setIsEditRoleOpen(false);
        setEditingRole(null);
        await fetchRoles();
      } else {
        throw new Error(result.message || 'Error al actualizar rol');
      }
    } catch (err) {
      console.error('Error al actualizar rol:', err);
      toast.error('Error al actualizar el rol');
    }
  };

  const handleDeleteRole = async (roleId: number, roleName: string) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar el rol "${roleName}"?`)) {
      return;
    }

    try {
      const response = await fetch('/api/admin/roles.php', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ id: roleId })
      });

      const result = await response.json();

      if (result.status === 'ok') {
        toast.success('Rol eliminado correctamente');
        await fetchRoles();
      } else {
        throw new Error(result.message || 'Error al eliminar rol');
      }
    } catch (err) {
      console.error('Error al eliminar rol:', err);
      toast.error('Error al eliminar el rol');
    }
  };

  const handleAssignRole = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!assignForm.id_usuario || !assignForm.id_rol) {
      toast.error('Selecciona usuario y rol');
      return;
    }

    try {
      const response = await fetch('/api/admin/asignar-roles.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          id_usuario: parseInt(assignForm.id_usuario),
          id_rol: parseInt(assignForm.id_rol)
        })
      });

      const result = await response.json();

      if (result.status === 'ok') {
        toast.success(result.message);
        setIsAssignRoleOpen(false);
        setAssignForm({ id_usuario: '', id_rol: '' });
        await fetchAsignaciones();
        await fetchRoles();
      } else {
        throw new Error(result.message || 'Error al asignar rol');
      }
    } catch (err) {
      console.error('Error al asignar rol:', err);
      toast.error('Error al asignar el rol');
    }
  };

  const handleRevokeRole = async (idUsuario: number, idRol: number) => {
    if (!confirm('¿Estás seguro de que quieres revocar este rol?')) {
      return;
    }

    try {
      const response = await fetch('/api/admin/asignar-roles.php', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          id_usuario: idUsuario,
          id_rol: idRol
        })
      });

      const result = await response.json();

      if (result.status === 'ok') {
        toast.success(result.message);
        await fetchAsignaciones();
        await fetchRoles();
      } else {
        throw new Error(result.message || 'Error al revocar rol');
      }
    } catch (err) {
      console.error('Error al revocar rol:', err);
      toast.error('Error al revocar el rol');
    }
  };

  const updatePermission = (modulo: string, operacion: string, valor: boolean) => {
    if (editingRole) {
      setEditingRole({
        ...editingRole,
        permisos: {
          ...editingRole.permisos,
          [modulo]: {
            ...editingRole.permisos[modulo],
            [operacion]: valor
          }
        }
      });
    }
  };

  const updateNewRolePermission = (modulo: string, operacion: string, valor: boolean) => {
    setNewRoleForm({
      ...newRoleForm,
      permisos: {
        ...newRoleForm.permisos,
        [modulo]: {
          ...newRoleForm.permisos[modulo],
          [operacion]: valor
        }
      }
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando roles y permisos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">Seguridad y Roles</h2>
          <p className="text-muted-foreground">Gestión de permisos y roles del sistema</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsNewRoleOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Rol
          </Button>
          
          <Button className="bg-[#0B132B] hover:bg-[#1C2541]" onClick={() => setIsAssignRoleOpen(true)}>
            <UserCog className="h-4 w-4 mr-2" />
            Asignar Rol
          </Button>
        </div>
      </div>

      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {/* Roles definidos */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-[#0B132B]" />
            Roles del Sistema
          </CardTitle>
          <CardDescription>
            Roles disponibles y sus permisos asociados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {roles.map((role) => (
              <Card key={role.id} className="border-l-4 border-l-[#0B132B]">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div>
                        <CardTitle className="text-lg">{role.nombre}</CardTitle>
                        <CardDescription>{role.descripcion}</CardDescription>
                      </div>
                      <Badge variant="outline">
                        {estadisticas[role.nombre] || 0} usuarios
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingRole(role);
                          setIsEditRoleOpen(true);
                        }}
                        disabled={role.nombre === 'admin' || role.nombre === 'cliente'}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteRole(role.id, role.nombre)}
                        disabled={role.nombre === 'admin' || role.nombre === 'cliente'}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Módulo</TableHead>
                        <TableHead className="text-center">Ver</TableHead>
                        <TableHead className="text-center">Crear</TableHead>
                        <TableHead className="text-center">Editar</TableHead>
                        <TableHead className="text-center">Eliminar</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.entries(role.permisos).map(([module, perms]) => (
                        <TableRow key={module}>
                          <TableCell className="capitalize">
                            <Badge variant="outline">{module}</Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Checkbox checked={perms.select} disabled />
                          </TableCell>
                          <TableCell className="text-center">
                            <Checkbox checked={perms.insert} disabled />
                          </TableCell>
                          <TableCell className="text-center">
                            <Checkbox checked={perms.update} disabled />
                          </TableCell>
                          <TableCell className="text-center">
                            <Checkbox checked={perms.delete} disabled />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Asignaciones de usuarios */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-[#0B132B]" />
            Asignaciones de Roles
          </CardTitle>
          <CardDescription>
            Usuarios y sus roles asignados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuario</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Rol Sistema</TableHead>
                <TableHead>Roles Adicionales</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usuarios.map((usuario) => (
                <TableRow key={usuario.id_usuario}>
                  <TableCell className="font-medium">{usuario.nombre}</TableCell>
                  <TableCell>{usuario.correo}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{usuario.rol_sistema}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {usuario.roles_asignados.map((rol) => (
                        <Badge
                          key={rol.id_rol}
                          variant="outline"
                          className="cursor-pointer hover:bg-red-50"
                          onClick={() => handleRevokeRole(usuario.id_usuario, rol.id_rol)}
                          title={`Clic para revocar - ${rol.descripcion_rol}`}
                        >
                          {rol.nombre_rol} ×
                        </Badge>
                      ))}
                      {usuario.roles_asignados.length === 0 && (
                        <span className="text-muted-foreground text-sm">Sin roles adicionales</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setAssignForm({ ...assignForm, id_usuario: usuario.id_usuario.toString() });
                        setIsAssignRoleOpen(true);
                      }}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Asignar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="shadow-md bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">Información de Seguridad</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-blue-800">
            <strong>Ver:</strong> Permite leer y visualizar información
          </p>
          <p className="text-sm text-blue-800">
            <strong>Crear:</strong> Permite crear nuevos registros
          </p>
          <p className="text-sm text-blue-800">
            <strong>Editar:</strong> Permite modificar registros existentes
          </p>
          <p className="text-sm text-blue-800">
            <strong>Eliminar:</strong> Permite eliminar registros
          </p>
        </CardContent>
      </Card>

      {/* Diálogo para crear nuevo rol */}
      <Dialog open={isNewRoleOpen} onOpenChange={setIsNewRoleOpen}>
        <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Crear Nuevo Rol</DialogTitle>
          <DialogDescription>
            Define un nuevo rol y sus permisos asociados
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleCreateRole} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="nombre">Nombre del Rol</Label>
              <Input
                id="nombre"
                value={newRoleForm.nombre}
                onChange={(e) => setNewRoleForm({ ...newRoleForm, nombre: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="descripcion">Descripción</Label>
              <Textarea
                id="descripcion"
                value={newRoleForm.descripcion}
                onChange={(e) => setNewRoleForm({ ...newRoleForm, descripcion: e.target.value })}
                required
              />
            </div>
          </div>
          
          <div>
            <Label>Permisos</Label>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Módulo</TableHead>
                  <TableHead className="text-center">Ver</TableHead>
                  <TableHead className="text-center">Crear</TableHead>
                  <TableHead className="text-center">Editar</TableHead>
                  <TableHead className="text-center">Eliminar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(newRoleForm.permisos).map(([module, perms]) => (
                  <TableRow key={module}>
                    <TableCell className="capitalize">
                      <Badge variant="outline">{module}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Checkbox
                        checked={perms.select}
                        onCheckedChange={(checked) => updateNewRolePermission(module, 'select', !!checked)}
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <Checkbox
                        checked={perms.insert}
                        onCheckedChange={(checked) => updateNewRolePermission(module, 'insert', !!checked)}
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <Checkbox
                        checked={perms.update}
                        onCheckedChange={(checked) => updateNewRolePermission(module, 'update', !!checked)}
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <Checkbox
                        checked={perms.delete}
                        onCheckedChange={(checked) => updateNewRolePermission(module, 'delete', !!checked)}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsNewRoleOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-[#0B132B] hover:bg-[#1C2541]">
              Crear Rol
            </Button>
          </div>
        </form>
        </DialogContent>
      </Dialog>

      {/* Diálogo para editar rol */}
      <Dialog open={isEditRoleOpen} onOpenChange={setIsEditRoleOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Editar Rol</DialogTitle>
            <DialogDescription>
              Modifica los permisos del rol seleccionado
            </DialogDescription>
          </DialogHeader>
          {editingRole && (
            <form onSubmit={handleUpdateRole} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-nombre">Nombre del Rol</Label>
                  <Input
                    id="edit-nombre"
                    value={editingRole.nombre}
                    onChange={(e) => setEditingRole({ ...editingRole, nombre: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit-descripcion">Descripción</Label>
                  <Textarea
                    id="edit-descripcion"
                    value={editingRole.descripcion}
                    onChange={(e) => setEditingRole({ ...editingRole, descripcion: e.target.value })}
                    required
                  />
                </div>
              </div>
              
              <div>
                <Label>Permisos</Label>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Módulo</TableHead>
                      <TableHead className="text-center">Ver</TableHead>
                      <TableHead className="text-center">Crear</TableHead>
                      <TableHead className="text-center">Editar</TableHead>
                      <TableHead className="text-center">Eliminar</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(editingRole.permisos).map(([module, perms]) => (
                      <TableRow key={module}>
                        <TableCell className="capitalize">
                          <Badge variant="outline">{module}</Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Checkbox
                            checked={perms.select}
                            onCheckedChange={(checked) => updatePermission(module, 'select', !!checked)}
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <Checkbox
                            checked={perms.insert}
                            onCheckedChange={(checked) => updatePermission(module, 'insert', !!checked)}
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <Checkbox
                            checked={perms.update}
                            onCheckedChange={(checked) => updatePermission(module, 'update', !!checked)}
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <Checkbox
                            checked={perms.delete}
                            onCheckedChange={(checked) => updatePermission(module, 'delete', !!checked)}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsEditRoleOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" className="bg-[#0B132B] hover:bg-[#1C2541]">
                  Actualizar Rol
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Diálogo para asignar rol */}
      <Dialog open={isAssignRoleOpen} onOpenChange={setIsAssignRoleOpen}>
        <DialogContent>
        <DialogHeader>
          <DialogTitle>Asignar Rol a Usuario</DialogTitle>
          <DialogDescription>
            Selecciona un usuario y el rol que deseas asignarle
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleAssignRole} className="space-y-4">
          <div>
            <Label htmlFor="usuario">Usuario</Label>
            <Select value={assignForm.id_usuario} onValueChange={(value) => setAssignForm({ ...assignForm, id_usuario: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un usuario" />
              </SelectTrigger>
              <SelectContent>
                {usuarios.map((usuario) => (
                  <SelectItem key={usuario.id_usuario} value={usuario.id_usuario.toString()}>
                    {usuario.nombre} ({usuario.correo})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="rol">Rol</Label>
            <Select value={assignForm.id_rol} onValueChange={(value) => setAssignForm({ ...assignForm, id_rol: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un rol" />
              </SelectTrigger>
              <SelectContent>
                {rolesDisponibles.map((rol) => (
                  <SelectItem key={rol.id} value={rol.id.toString()}>
                    {rol.nombre} - {rol.descripcion}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsAssignRoleOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-[#0B132B] hover:bg-[#1C2541]">
              Asignar Rol
            </Button>
          </div>
        </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
