import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import exosLogo from 'figma:asset/f64e73f4c248a8bf63bd9ade8025b7b28f3a7d8a.png';

interface LoginProps {
  onLogin: (role: 'admin' | 'client', userData: any) => void;
  onRegister?: () => void;
}

export function Login({ onLogin, onRegister }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      console.log('Intentando login con:', email);
      
      const response = await fetch('http://localhost/ExosBank/api/login.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          email: email,
          password: password
        })
      });

      console.log('Respuesta del servidor:', response.status);

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const data = await response.json();
      console.log('Datos recibidos:', data);

      if (data.status === 'ok' && data.data) {
        // Determinar el rol
        const role = data.data.rol === 'Administrador' ? 'admin' : 'client';
        
        // Preparar datos del usuario
        const userData = {
          id: data.data.id_usuario,
          name: data.data.nombre,
          email: data.data.correo,
          role: data.data.rol
        };

        // Guardar en localStorage
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('isAuthenticated', 'true');

        // Llamar al callback de login
        onLogin(role, userData);
      } else {
        setError(data.message || 'Credenciales incorrectas');
      }
    } catch (err) {
      console.error('Error de login:', err);
      setError('Error de conexión con el servidor. Verifica que Apache esté corriendo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-[#0B132B] via-[#1C2541] to-[#2a3f5f]">
      <div className="w-full max-w-md p-8">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <img src={exosLogo} alt="EXOS Bank" className="h-20 object-contain" />
          </div>

          <h2 className="text-center mb-2 text-[#0B132B]">Bienvenido a EXOS Bank</h2>
          <p className="text-center text-gray-600 mb-6">Ingresa tus credenciales para continuar</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-[#F4F4F4]"
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-[#F4F4F4]"
              />
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
              className="w-full bg-[#0B132B] hover:bg-[#1C2541]"
              disabled={isLoading}
            >
              {isLoading ? 'Iniciando sesión...' : 'Iniciar sesión'}
            </Button>

            {/* Forgot Password */}
            <div className="text-center">
              <a href="#" className="text-sm text-[#0B132B] hover:text-[#1C2541]">
                ¿Olvidaste tu contraseña?
              </a>
            </div>

            {/* Register Button */}
            <div className="text-center pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600 mb-3">¿No tienes cuenta?</p>
              <Button 
                type="button"
                variant="outline"
                className="w-full border-[#0B132B] text-[#0B132B] hover:bg-[#0B132B] hover:text-white"
                onClick={onRegister}
              >
                Aplicar para una cuenta
              </Button>
            </div>
          </form>

          {/* Demo Credentials */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-600 mb-2">Credenciales de prueba:</p>
            <p className="text-xs text-gray-500">Admin: admin@exosbank.com / Admin123</p>
            <p className="text-xs text-gray-500">Cliente: juan@correo.com / Cliente123</p>
            <p className="text-xs text-gray-500">Cliente: maria@correo.com / Cliente123</p>
          </div>
        </div>
      </div>
    </div>
  );
}
