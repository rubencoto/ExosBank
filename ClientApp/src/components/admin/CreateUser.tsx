import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Eye, EyeOff, Building2 } from 'lucide-react';

interface FormData {
  fullName: string;
  email: string;
  password: string;
  role: string;
  phone: string;
  address: string;
  cedula: string;
}

interface FormErrors {
  fullName?: string;
  email?: string;
  password?: string;
  role?: string;
  phone?: string;
  address?: string;
  cedula?: string;
}

interface CreateUserProps {
  onCancel: () => void;
  onSuccess: () => void;
}

export function CreateUser({ onCancel, onSuccess }: CreateUserProps) {
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    email: '',
    password: '',
    role: '',
    phone: '',
    address: '',
    cedula: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateCedula = (cedula: string) => {
    const cedulaRegex = /^\d-\d{4}-\d{4}$/;
    return cedulaRegex.test(cedula);
  };

  const validatePhone = (phone: string) => {
    const phoneRegex = /^\+506\s?\d{4}\s?\d{4}$/;
    return phoneRegex.test(phone);
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Este campo es requerido';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Este campo es requerido';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Correo electrónico inválido';
    }

    if (!formData.password) {
      newErrors.password = 'Este campo es requerido';
    } else if (formData.password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
    }

    if (!formData.role) {
      newErrors.role = 'Debe seleccionar un rol';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Este campo es requerido';
    } else if (!validatePhone(formData.phone)) {
      newErrors.phone = 'Formato inválido. Use: +506 8234 5678';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Este campo es requerido';
    }

    if (!formData.cedula.trim()) {
      newErrors.cedula = 'Este campo es requerido';
    } else if (!validateCedula(formData.cedula)) {
      newErrors.cedula = 'Formato inválido. Use: 1-0000-0000';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    try {
      const response = await fetch('http://localhost/ExosBank/api/usuarios/create.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          nombre: formData.fullName,
          correo: formData.email,
          contrasena: formData.password,
          rol: formData.role === 'admin' ? 'Administrador' : 'Cliente',
          telefono: formData.phone,
          cedula: formData.cedula,
          direccion: formData.address,
          tipo_cuenta: '1' // Por defecto cuenta corriente
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setIsSuccessModalOpen(true);
      } else {
        setSubmitError(data.message || 'Error al crear el usuario');
      }
    } catch (error) {
      console.error('Error al crear usuario:', error);
      setSubmitError('Error de conexión. Verifica que Apache esté corriendo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelClick = () => {
    onCancel();
  };

  const handleSuccessClose = () => {
    setIsSuccessModalOpen(false);
    // Reset form
    setFormData({
      fullName: '',
      email: '',
      password: '',
      role: '',
      phone: '',
      address: '',
      cedula: '',
    });
    setErrors({});
    // Volver a la lista de usuarios
    onSuccess();
  };

  return (
    <div className="min-h-screen bg-background p-6">
      {/* Header con logo */}
      <div className="max-w-4xl mx-auto mb-8">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="mb-2">Crear Nuevo Usuario</h1>
            <p className="text-muted-foreground">
              Complete la información del nuevo usuario para registrarlo en el sistema.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg shadow-md">
            <Building2 className="h-6 w-6" />
            <span className="font-semibold">EXOS Bank</span>
          </div>
        </div>
      </div>

      {/* Formulario */}
      <div className="max-w-4xl mx-auto">
        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle>Información del Usuario</CardTitle>
            <CardDescription>
              Todos los campos son obligatorios
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Grid de 2 columnas para campos */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Nombre completo */}
                <div className="space-y-2">
                  <Label htmlFor="fullName">Nombre completo</Label>
                  <Input
                    id="fullName"
                    placeholder="Juan Pérez Solís"
                    value={formData.fullName}
                    onChange={(e) => {
                      setFormData({ ...formData, fullName: e.target.value });
                      setErrors({ ...errors, fullName: undefined });
                    }}
                    className={errors.fullName ? 'border-destructive' : ''}
                  />
                  {errors.fullName && (
                    <p className="text-destructive text-sm">{errors.fullName}</p>
                  )}
                </div>

                {/* Correo electrónico */}
                <div className="space-y-2">
                  <Label htmlFor="email">Correo electrónico</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="usuario@email.com"
                    value={formData.email}
                    onChange={(e) => {
                      setFormData({ ...formData, email: e.target.value });
                      setErrors({ ...errors, email: undefined });
                    }}
                    className={errors.email ? 'border-destructive' : ''}
                  />
                  {errors.email && (
                    <p className="text-destructive text-sm">{errors.email}</p>
                  )}
                </div>

                {/* Contraseña */}
                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={(e) => {
                        setFormData({ ...formData, password: e.target.value });
                        setErrors({ ...errors, password: undefined });
                      }}
                      className={errors.password ? 'border-destructive pr-10' : 'pr-10'}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-destructive text-sm">{errors.password}</p>
                  )}
                </div>

                {/* Rol */}
                <div className="space-y-2">
                  <Label htmlFor="role">Rol</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value) => {
                      setFormData({ ...formData, role: value });
                      setErrors({ ...errors, role: undefined });
                    }}
                  >
                    <SelectTrigger className={errors.role ? 'border-destructive' : ''}>
                      <SelectValue placeholder="Seleccione un rol" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Administrador</SelectItem>
                      <SelectItem value="client">Cliente</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.role && (
                    <p className="text-destructive text-sm">{errors.role}</p>
                  )}
                </div>

                {/* Teléfono */}
                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input
                    id="phone"
                    placeholder="+506 8234 5678"
                    value={formData.phone}
                    onChange={(e) => {
                      setFormData({ ...formData, phone: e.target.value });
                      setErrors({ ...errors, phone: undefined });
                    }}
                    className={errors.phone ? 'border-destructive' : ''}
                  />
                  {errors.phone && (
                    <p className="text-destructive text-sm">{errors.phone}</p>
                  )}
                </div>

                {/* Cédula */}
                <div className="space-y-2">
                  <Label htmlFor="cedula">Cédula</Label>
                  <Input
                    id="cedula"
                    placeholder="1-0000-0000"
                    value={formData.cedula}
                    onChange={(e) => {
                      setFormData({ ...formData, cedula: e.target.value });
                      setErrors({ ...errors, cedula: undefined });
                    }}
                    className={errors.cedula ? 'border-destructive' : ''}
                  />
                  {errors.cedula && (
                    <p className="text-destructive text-sm">{errors.cedula}</p>
                  )}
                </div>
              </div>

              {/* Dirección (campo completo) */}
              <div className="space-y-2">
                <Label htmlFor="address">Dirección</Label>
                <Input
                  id="address"
                  placeholder="Barrio Escalante, San José"
                  value={formData.address}
                  onChange={(e) => {
                    setFormData({ ...formData, address: e.target.value });
                    setErrors({ ...errors, address: undefined });
                  }}
                  className={errors.address ? 'border-destructive' : ''}
                />
                {errors.address && (
                  <p className="text-destructive text-sm">{errors.address}</p>
                )}
              </div>

              {/* Botones */}
              <div className="flex gap-4 pt-4">
                <Button
                  type="submit"
                  className="flex-1 bg-[#3b82f6] hover:bg-[#2563eb]"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Guardando...' : 'Guardar usuario'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancelClick}
                  className="flex-1"
                  disabled={isSubmitting}
                >
                  Cancelar
                </Button>
              </div>

              {/* Error de envío */}
              {submitError && (
                <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm text-center">
                  {submitError}
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Modal de éxito */}
      <Dialog open={isSuccessModalOpen} onOpenChange={setIsSuccessModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-success">
              ¡Usuario creado exitosamente!
            </DialogTitle>
            <DialogDescription className="text-center pt-4">
              El usuario <strong>{formData.fullName}</strong> ha sido registrado en el sistema.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center pt-4">
            <Button
              onClick={handleSuccessClose}
              className="bg-[#10b981] hover:bg-[#059669]"
            >
              Aceptar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
