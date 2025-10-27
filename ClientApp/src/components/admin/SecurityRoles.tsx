import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Checkbox } from '../ui/checkbox';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Shield, UserCog } from 'lucide-react';

export function SecurityRoles() {
  const roles = [
    {
      name: 'Administrador',
      description: 'Acceso completo al sistema',
      permissions: {
        users: { select: true, insert: true, update: true, delete: true },
        accounts: { select: true, insert: true, update: true, delete: true },
        transactions: { select: true, insert: true, update: true, delete: true },
        settings: { select: true, insert: true, update: true, delete: true },
      }
    },
    {
      name: 'Cliente',
      description: 'Acceso limitado a funciones de cliente',
      permissions: {
        users: { select: false, insert: false, update: false, delete: false },
        accounts: { select: true, insert: false, update: false, delete: false },
        transactions: { select: true, insert: true, update: false, delete: false },
        settings: { select: true, insert: false, update: true, delete: false },
      }
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2>Seguridad y Roles</h2>
          <p className="text-muted-foreground">Gestión de permisos y roles del sistema</p>
        </div>
        <Button className="bg-[#0B132B] hover:bg-[#1C2541]">
          <UserCog className="h-4 w-4 mr-2" />
          Asignar Rol a Usuario
        </Button>
      </div>

      {roles.map((role, index) => (
        <Card key={index} className="shadow-md">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-[#0B132B]" />
              <div>
                <CardTitle>{role.name}</CardTitle>
                <CardDescription>{role.description}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Módulo</TableHead>
                  <TableHead className="text-center">SELECT</TableHead>
                  <TableHead className="text-center">INSERT</TableHead>
                  <TableHead className="text-center">UPDATE</TableHead>
                  <TableHead className="text-center">DELETE</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(role.permissions).map(([module, perms]) => (
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

      <Card className="shadow-md bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">Información de Seguridad</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-blue-800">
            <strong>SELECT:</strong> Permite leer y visualizar información
          </p>
          <p className="text-sm text-blue-800">
            <strong>INSERT:</strong> Permite crear nuevos registros
          </p>
          <p className="text-sm text-blue-800">
            <strong>UPDATE:</strong> Permite modificar registros existentes
          </p>
          <p className="text-sm text-blue-800">
            <strong>DELETE:</strong> Permite eliminar registros
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
