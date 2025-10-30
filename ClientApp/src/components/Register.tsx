import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { UserPlus, CheckCircle2, ArrowLeft } from 'lucide-react';
import exosLogo from 'figma:asset/f64e73f4c248a8bf63bd9ade8025b7b28f3a7d8a.png';

interface RegisterProps {
  onBack: () => void;
}

export function Register({ onBack }: RegisterProps) {
  const [formData, setFormData] = useState({
    name: '',
    cedula: '',
    email: '',
    phone: '',
    address: '',
    tipo_cuenta: '',
    username: '',
    password: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Validaciones
    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      setIsLoading(false);
      return;
    }

    if (!formData.tipo_cuenta) {
      setError('Debes seleccionar un tipo de cuenta');
      setIsLoading(false);
      return;
    }

    try {
      console.log('Enviando datos de registro:', {
        nombre: formData.name,
        correo: formData.email,
        cedula: formData.cedula,
        direccion: formData.address,
        telefono: formData.phone,
        tipo_cuenta: formData.tipo_cuenta,
        username: formData.username || formData.email
      });

      const response = await fetch('http://localhost/ExosBank/api/register.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          nombre: formData.name,
          correo: formData.email,
          cedula: formData.cedula,
          direccion: formData.address,
          telefono: formData.phone,
          tipo_cuenta: formData.tipo_cuenta,
          username: formData.username || formData.email,
          password: formData.password
        })
      });

      console.log('Respuesta HTTP:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error del servidor:', errorText);
        throw new Error(`Error HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('Datos recibidos:', data);

      if (data.status === 'ok') {
        // Registro exitoso
        setShowSuccess(true);
        setTimeout(() => {
          onBack();
        }, 2000);
      } else {
        setError(data.message || 'Error al crear la cuenta');
      }
    } catch (err) {
      console.error('Error completo de registro:', err);
      setError(err instanceof Error ? err.message : 'Error de conexión con el servidor. Verifica que Apache esté corriendo.');
    } finally {
      setIsLoading(false);
    }
  };

  if (showSuccess) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-[#0B132B] via-[#1C2541] to-[#2a3f5f] p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-12 text-center">
            <CheckCircle2 className="h-24 w-24 text-emerald-500 mx-auto mb-6" />
            <h2 className="text-emerald-700 mb-2">¡Registro Exitoso!</h2>
            <p className="text-muted-foreground">
              Tu cuenta ha sido creada. Redirigiendo al inicio de sesión...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#0B132B] via-[#1C2541] to-[#2a3f5f] p-4 overflow-y-auto">
      <div className="max-w-2xl mx-auto py-8">
        <Button
          variant="ghost"
          onClick={onBack}
          className="mb-4 text-white hover:text-white hover:bg-white/10"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver al inicio
        </Button>

        <Card className="shadow-2xl">
          <CardHeader className="text-center">
            <img src={exosLogo} alt="EXOS Bank" className="h-16 object-contain mx-auto mb-4" />
            <CardTitle className="flex items-center justify-center gap-2">
              <UserPlus className="h-6 w-6" />
              Registro de Cliente
            </CardTitle>
            <p className="text-muted-foreground">Crea tu cuenta en EXOS Bank</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Nombre completo */}
                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="name">Nombre completo *</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="Juan Pérez"
                  />
                </div>

                {/* Cédula */}
                <div className="space-y-2">
                  <Label htmlFor="cedula">Cédula *</Label>
                  <Input
                    id="cedula"
                    name="cedula"
                    value={formData.cedula}
                    onChange={handleChange}
                    required
                    placeholder="1234567890"
                  />
                </div>

                {/* Teléfono */}
                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono *</Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    placeholder="+593 99 123 4567"
                  />
                </div>

                {/* Email */}
                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="email">Correo electrónico *</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="tu@email.com"
                  />
                </div>

                {/* Dirección */}
                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="address">Dirección *</Label>
                  <Input
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    required
                    placeholder="Av. Principal 123, Ciudad"
                  />
                </div>

                {/* Tipo de Cuenta */}
                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="tipo_cuenta">Tipo de cuenta *</Label>
                  <select
                    id="tipo_cuenta"
                    name="tipo_cuenta"
                    value={formData.tipo_cuenta}
                    onChange={(e) => setFormData({...formData, tipo_cuenta: e.target.value})}
                    required
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="">Selecciona un tipo de cuenta</option>
                    <option value="1">Cuenta Corriente</option>
                    <option value="2">Cuenta de Ahorro</option>
                    <option value="3">Cuenta de Crédito</option>
                  </select>
                </div>

                {/* Nombre de Usuario */}
                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="username">Nombre de usuario *</Label>
                  <Input
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    required
                    placeholder="usuario123"
                  />
                  <p className="text-xs text-muted-foreground">Este será tu identificador único para iniciar sesión</p>
                </div>

                {/* Contraseña */}
                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña *</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    placeholder="Mínimo 8 caracteres"
                  />
                </div>

                {/* Confirmar contraseña */}
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar contraseña *</Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    placeholder="Repite la contraseña"
                  />
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm text-center">
                  {error}
                </div>
              )}

              {/* Submit Button */}
              <Button 
                type="submit" 
                className="w-full bg-[#10b981] hover:bg-[#059669]"
                disabled={isLoading}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                {isLoading ? 'Registrando...' : 'Registrar cuenta'}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                Al registrarte, aceptas los términos y condiciones de EXOS Bank
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
