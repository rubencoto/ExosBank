import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import exosLogo from 'figma:asset/f64e73f4c248a8bf63bd9ade8025b7b28f3a7d8a.png';

interface LoginProps {
  onLogin: (role: 'admin' | 'client', userData: any) => void;
}

export function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Determinar el rol basándose en el email
    const isAdmin = email.toLowerCase().includes('admin') || email.toLowerCase() === 'admin@exosbank.com';
    const role = isAdmin ? 'admin' : 'client';
    
    // Simular login exitoso
    const userData = {
      email,
      name: role === 'admin' ? 'Admin Usuario' : 'Juan Pérez Solís',
      id: role === 'admin' ? 1 : 2,
    };
    
    onLogin(role, userData);
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

            {/* Submit Button */}
            <Button type="submit" className="w-full bg-[#0B132B] hover:bg-[#1C2541]">
              Iniciar sesión
            </Button>

            {/* Forgot Password */}
            <div className="text-center">
              <a href="#" className="text-sm text-[#0B132B] hover:text-[#1C2541]">
                ¿Olvidaste tu contraseña?
              </a>
            </div>
          </form>

          {/* Demo Credentials */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-600 mb-2">Credenciales de prueba:</p>
            <p className="text-xs text-gray-500">Admin: admin@exosbank.com</p>
            <p className="text-xs text-gray-500">Cliente: Cualquier otro email</p>
            <p className="text-xs text-gray-500 mt-1">Contraseña: cualquiera</p>
          </div>
        </div>
      </div>
    </div>
  );
}
