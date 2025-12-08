@echo off
echo ================================================
echo  ExosBank - Instalador de Drivers SQL Server
echo ================================================
echo.
echo Este script instalara los drivers necesarios
echo para conectarse a Azure SQL Database.
echo.
echo REQUIERE PERMISOS DE ADMINISTRADOR
echo.
pause

PowerShell -NoProfile -ExecutionPolicy Bypass -Command "& {Start-Process PowerShell -ArgumentList '-NoProfile -ExecutionPolicy Bypass -File ""%~dp0install_drivers.ps1""' -Verb RunAs}"

pause
