
  # 🏦 EXOS Bank - Digital Banking Interface

Sistema bancario digital completo con backend PHP y frontend React + TypeScript.

## 📋 Requisitos Previos

- **XAMPP** con PHP 8.0 o superior
- **Node.js** 16+ y npm
- **Git**
- Acceso a Internet

## 🚀 Instalación para Nuevos Desarrolladores

### 1. Clonar el Repositorio

```bash
cd C:\xampp\htdocs
git clone https://github.com/rubencoto/ExosBank.git
cd ExosBank
```

### 2. Configurar Backend (PHP + Azure SQL)

#### Opción A: Instalación Automática (Recomendado)

```powershell
# Abrir PowerShell como Administrador
cd C:\xampp\htdocs\ExosBank
.\install_drivers.ps1
```

#### Opción B: Instalación Manual

Consulta la guía detallada en [SETUP.md](SETUP.md)

### 3. Configurar Variables de Entorno

```bash
# Copiar archivo de ejemplo
copy .env.example .env
```

**⚠️ IMPORTANTE:** Edita `.env` y solicita las credenciales reales al líder del proyecto.

### 4. Configurar Frontend (React)

```bash
cd ClientApp
npm install
npm run dev
```

## 🧪 Verificar Instalación

### Backend (PHP)
```bash
php test_connection.php
```

Deberías ver:
```
✅ Conexión exitosa a Azure SQL Database!
```

### Frontend (React)
```bash
cd ClientApp
npm run dev
```

Abre http://localhost:5173

## 📁 Estructura del Proyecto

```
ExosBank/
├── ClientApp/              # Frontend React + TypeScript
│   ├── src/
│   │   ├── components/    # Componentes React
│   │   ├── lib/          # Utilidades y datos mock
│   │   └── styles/       # Estilos globales
│   └── package.json
├── config/                # Configuración PHP
│   ├── database.php      # Conexión a Azure SQL
│   └── env.php           # Cargador de variables
├── Controllers/          # Controladores PHP
├── Models/              # Modelos de datos
├── Services/            # Lógica de negocio
├── .env                 # ⚠️ NO SE SUBE A GIT
├── .env.example         # Plantilla de variables
└── test_connection.php  # Script de prueba
```

## 📚 Documentación

- **[SETUP.md](SETUP.md)** - Guía completa de instalación
- **[DATABASE_SETUP.md](DATABASE_SETUP.md)** - Configuración de base de datos

## 🔐 Seguridad

- **NUNCA** compartas el archivo `.env`
- **NUNCA** subas credenciales a Git
- El archivo `.env` está en `.gitignore`

## 🌐 Configurar Firewall de Azure

Cada desarrollador debe agregar su IP al firewall:

1. Ve a https://portal.azure.com
2. Busca el servidor SQL: `exos-cr`
3. **Networking** → **Add client IP**

Para conocer tu IP: `curl ifconfig.me`

## 🛠️ Stack Tecnológico

### Backend
- PHP 8.0+ con SQL Server Drivers
- Azure SQL Database
- Apache (XAMPP)

### Frontend
- React 18
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui

## 📞 Soporte

Si tienes problemas:
1. Revisa [SETUP.md](SETUP.md)
2. Contacta al líder del proyecto
3. Crea un issue en GitHub

## 📄 Licencia

Proyecto basado en [EXOS Bank Figma Design](https://www.figma.com/design/JZciy2KTMmEIsumdUbTTuU/EXOS-Bank-Digital-Banking-Interface)
  