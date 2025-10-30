import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { mockUsers, User } from '../../lib/mockData';
import { Edit, Trash2, UserPlus } from 'lucide-react';

interface NewUserForm {
  nombre: string;
  correo: string;
  contrasena: string;
  rol: string;
  telefono: string;
  cedula: string;
  direccion: string;
}

export function UsersManagement() {
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isNewUserOpen, setIsNewUserOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newUser, setNewUser] = useState<NewUserForm>({
    nombre: '',
    correo: '',
    contrasena: '',
    rol: '',
    telefono: '',
    cedula: '',
    direccion: ''
  });

  const handleCreateUser = async () => {
    // Validar campos antes de enviar
    if (!newUser.nombre.trim()) {
      setError('El nombre es obligatorio');
      return;
    }
    if (!newUser.correo.trim()) {
      setError('El correo es obligatorio');
      return;
    }
    if (!newUser.contrasena) {
      setError('La contraseña es obligatoria');
      return;
    }
    if (!newUser.rol) {
      setError('Debe seleccionar un rol');
      return;
    }
    if (!newUser.telefono.trim()) {
      setError('El teléfono es obligatorio');
      return;
    }
    if (!newUser.cedula.trim()) {
      setError('La cédula es obligatoria');
      return;
    }
    if (!newUser.direccion.trim()) {
      setError('La dirección es obligatoria');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('Enviando datos:', newUser); // Para debug
      
      const response = await fetch('http://localhost:80/ExosBank/api/usuarios/create.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newUser)
      });

      const data = await response.json();
      console.log('Respuesta del servidor:', data); // Para debug

      if (data.success) {
        // Usuario creado exitosamente
        alert('Usuario creado exitosamente');
        
        // Agregar el nuevo usuario a la lista
        const nuevoUsuarioLocal: User = {
          id: data.data.id_usuario,
          name: data.data.nombre,
          email: data.data.correo,
          role: data.data.rol === 'Administrador' ? 'admin' : 'client',
          status: 'active'
        };
        setUsers([...users, nuevoUsuarioLocal]);

        // Limpiar el formulario y cerrar el modal
        setNewUser({
          nombre: '',
          correo: '',
          contrasena: '',
          rol: '',
          telefono: '',
          cedula: '',
          direccion: ''
        });
        setIsNewUserOpen(false);
      } else {
        setError(data.message);
        alert('Error: ' + data.message);
      }
    } catch (err) {
      const errorMsg = 'Error de conexión con el servidor';
      setError(errorMsg);
      console.error('Error completo:', err);
      alert(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveUser = () => {
    if (editingUser) {
      setUsers(users.map(u => u.id === editingUser.id ? editingUser : u));
      setIsEditOpen(false);
      setEditingUser(null);
    }
  };

  const handleDeleteUser = (userId: number) => {
    if (confirm('¿Estás seguro de eliminar este usuario?')) {
      setUsers(users.filter(u => u.id !== userId));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2>Gestión de Usuarios</h2>
          <p className="text-muted-foreground">Administra los usuarios del sistema</p>
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
                Complete la información del nuevo usuario para registrarlo en el sistema.
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
                    onChange={(e) => setNewUser({ ...newUser, nombre: e.target.value })}
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
                    onChange={(e) => setNewUser({ ...newUser, correo: e.target.value })}
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
                    onChange={(e) => setNewUser({ ...newUser, contrasena: e.target.value })}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="rol">Rol *</Label>
                  <Select
                    value={newUser.rol}
                    onValueChange={(value) => setNewUser({ ...newUser, rol: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione un rol" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Cliente">Cliente</SelectItem>
                      <SelectItem value="Administrador">Administrador</SelectItem>
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
                    onChange={(e) => setNewUser({ ...newUser, telefono: e.target.value })}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="cedula">Cédula *</Label>
                  <Input
                    id="cedula"
                    placeholder="1-0000-0000"
                    value={newUser.cedula}
                    onChange={(e) => setNewUser({ ...newUser, cedula: e.target.value })}
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
                  onChange={(e) => setNewUser({ ...newUser, direccion: e.target.value })}
                  required
                />
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-2">
                <Button 
                  onClick={handleCreateUser} 
                  disabled={isLoading}
                  className="flex-1 bg-[#2563eb] hover:bg-[#1d4ed8]"
                >
                  {isLoading ? 'Guardando...' : 'Guardar usuario'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setIsNewUserOpen(false)}
                  disabled={isLoading}
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
        <CardHeader>
          <CardTitle>Lista de Usuarios</CardTitle>
        </CardHeader>
        <CardContent>
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
                    <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                      {user.role === 'admin' ? 'Administrador' : 'Cliente'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.status === 'active' ? 'default' : 'destructive'}>
                      {user.status === 'active' ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Dialog open={isEditOpen && editingUser?.id === user.id} onOpenChange={(open) => {
                        setIsEditOpen(open);
                        if (!open) setEditingUser(null);
                      }}>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingUser({ ...user })}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
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
                                  onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                                />
                              </div>
                              <div className="grid gap-2">
                                <Label htmlFor="email">Correo</Label>
                                <Input
                                  id="email"
                                  type="email"
                                  value={editingUser.email}
                                  onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                                />
                              </div>
                              <div className="grid gap-2">
                                <Label htmlFor="role">Rol</Label>
                                <Select
                                  value={editingUser.role}
                                  onValueChange={(value: 'admin' | 'client') => 
                                    setEditingUser({ ...editingUser, role: value })
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="client">Cliente</SelectItem>
                                    <SelectItem value="admin">Administrador</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="grid gap-2">
                                <Label htmlFor="status">Estado</Label>
                                <Select
                                  value={editingUser.status}
                                  onValueChange={(value: 'active' | 'inactive') => 
                                    setEditingUser({ ...editingUser, status: value })
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="active">Activo</SelectItem>
                                    <SelectItem value="inactive">Inactivo</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <Button onClick={handleSaveUser} className="bg-[#0B132B] hover:bg-[#1C2541]">
                                Guardar cambios
                              </Button>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteUser(user.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
