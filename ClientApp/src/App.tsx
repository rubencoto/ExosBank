import { useState, useEffect } from "react";
import { Login } from "./components/Login";
import { AdminDashboard } from "./components/AdminDashboard";
import { ClientDashboard } from "./components/ClientDashboard";
import { Register } from "./components/Register";
import { Toaster } from "./components/ui/sonner";
import { getStoredUserData, clearAuthData } from "./lib/auth";

type AppView = "login" | "admin" | "client" | "register";

interface UserData {
  id: number;
  nombre: string;
  correo: string;
  rol: string;
}

export default function App() {
  const [currentView, setCurrentView] =
    useState<AppView>("login");
  const [userData, setUserData] = useState<UserData | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);

  // Restaurar sesión al cargar la aplicación
  useEffect(() => {
    const storedUserData = getStoredUserData();
    if (storedUserData) {
      setUserData(storedUserData);
      // Determinar la vista basada en el rol
      const role = storedUserData.rol === 'Administrador' ? 'admin' : 'client';
      setCurrentView(role);
    }
    setIsLoading(false);
  }, []);

  const handleLogin = (
    role: "admin" | "client",
    user: UserData,
  ) => {
    setUserData(user);
    setCurrentView(role);
  };

  const handleLogout = async () => {
    try {
      // Llamar al API de logout para cerrar sesión del servidor
      await fetch('/api/logout.php', {
        method: 'POST',
        credentials: 'include'
      });
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    } finally {
      // Limpiar datos locales independientemente del resultado del API
      clearAuthData();
      setUserData(null);
      setCurrentView("login");
    }
  };

  // Mostrar loading mientras se verifica la sesión
  if (isLoading) {
    return (
      <div className="size-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="size-full">
        {currentView === "login" && (
          <Login 
            onLogin={handleLogin}
            onRegister={() => setCurrentView("register")}
          />
        )}
        {currentView === "admin" && userData && (
          <AdminDashboard
            userData={userData}
            onLogout={handleLogout}
          />
        )}
        {currentView === "client" && userData && (
          <ClientDashboard
            userData={userData}
            onLogout={handleLogout}
          />
        )}
        {currentView === "register" && (
          <Register onBack={() => setCurrentView("login")} />
        )}
      </div>
      <Toaster />
    </>
  );
}