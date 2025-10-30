import { useState } from "react";
import { Login } from "./components/Login";
import { AdminDashboard } from "./components/AdminDashboard";
import { ClientDashboard } from "./components/ClientDashboard";
import { Register } from "./components/Register";
import { Toaster } from "./components/ui/sonner";

type AppView = "login" | "admin" | "client" | "register";

interface UserData {
  email: string;
  name: string;
  id: number;
}

export default function App() {
  const [currentView, setCurrentView] =
    useState<AppView>("login");
  const [userData, setUserData] = useState<UserData | null>(
    null,
  );

  const handleLogin = (
    role: "admin" | "client",
    user: UserData,
  ) => {
    setUserData(user);
    setCurrentView(role);
  };

  const handleLogout = () => {
    setUserData(null);
    setCurrentView("login");
  };

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