<?php
// Script para crear usuarios de prueba
// Ejecutar: php crear_usuarios_prueba.php

require_once __DIR__ . '/config/env.php';
require_once __DIR__ . '/config/database.php';

echo "=== CREANDO USUARIOS DE PRUEBA ===\n\n";

// Lista de usuarios de prueba
$usuarios = [
    [
        'nombre' => 'Administrador EXOS',
        'correo' => 'admin@exosbank.com',
        'contrasena' => 'Admin123',
        'rol' => 'Administrador',
        'cedula' => '1-1111-1111',
        'direccion' => 'San José, Costa Rica',
        'telefono' => '+506 8888 0001',
        'tipo_cuenta' => '0'
    ],
    [
        'nombre' => 'Juan Pérez',
        'correo' => 'juan@correo.com',
        'contrasena' => 'Cliente123',
        'rol' => 'Cliente',
        'cedula' => '2-2222-2222',
        'direccion' => 'Heredia, Costa Rica',
        'telefono' => '+506 8888 0002',
        'tipo_cuenta' => '1'
    ],
    [
        'nombre' => 'María García',
        'correo' => 'maria@correo.com',
        'contrasena' => 'Cliente123',
        'rol' => 'Cliente',
        'cedula' => '3-3333-3333',
        'direccion' => 'Alajuela, Costa Rica',
        'telefono' => '+506 8888 0003',
        'tipo_cuenta' => '3'
    ],
    [
        'nombre' => 'Carlos Empresario',
        'correo' => 'carlos@empresa.com',
        'contrasena' => 'Empresa123',
        'rol' => 'Cliente',
        'cedula' => '4-4444-4444',
        'direccion' => 'Cartago, Costa Rica',
        'telefono' => '+506 8888 0004',
        'tipo_cuenta' => '7'
    ]
];

try {
    $database = new Database();
    $conn = $database->getConnection();
    
    foreach ($usuarios as $usuario) {
        echo "Creando usuario: {$usuario['nombre']} ({$usuario['correo']})...\n";
        
        // Verificar si existe
        $sqlCheck = "SELECT COUNT(*) as count FROM dbo.Usuarios WHERE correo = ?";
        $correo = $usuario['correo'];
        $stmtCheck = sqlsrv_prepare($conn, $sqlCheck, array(&$correo));
        
        if (!$stmtCheck || !sqlsrv_execute($stmtCheck)) {
            echo "   Error al verificar: " . print_r(sqlsrv_errors(), true) . "\n";
            continue;
        }
        
        $row = sqlsrv_fetch_array($stmtCheck, SQLSRV_FETCH_ASSOC);
        
        if ($row['count'] > 0) {
            echo "    Usuario ya existe, saltando...\n\n";
            sqlsrv_free_stmt($stmtCheck);
            continue;
        }
        
        sqlsrv_free_stmt($stmtCheck);
        
        // Hash de contraseña
        $contrasenaHash = password_hash($usuario['contrasena'], PASSWORD_DEFAULT);
        
        // Insertar usuario
        $sqlInsert = "INSERT INTO dbo.Usuarios (nombre, correo, contrasena, rol, cedula, direccion, telefono, tipo_cuenta) 
                      VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
        $params = array(
            $usuario['nombre'],
            $usuario['correo'],
            $contrasenaHash,
            $usuario['rol'],
            $usuario['cedula'],
            $usuario['direccion'],
            $usuario['telefono'],
            $usuario['tipo_cuenta']
        );
        
        $stmtInsert = sqlsrv_prepare($conn, $sqlInsert, $params);
        
        if (!$stmtInsert || !sqlsrv_execute($stmtInsert)) {
            echo "  Error al insertar: " . print_r(sqlsrv_errors(), true) . "\n";
            continue;
        }
        
        sqlsrv_free_stmt($stmtInsert);
        
        echo "     Creado exitosamente\n";
        echo "     Email: {$usuario['correo']}\n";
        echo "     Contraseña: {$usuario['contrasena']}\n";
        echo "     Rol: {$usuario['rol']}\n\n";
    }
    
    $database->closeConnection();
    
    echo "=== PROCESO COMPLETADO ===\n\n";
    echo "Credenciales de prueba:\n";
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
    echo "ADMINISTRADOR:\n";
    echo "  Email: admin@exosbank.com\n";
    echo "  Contraseña: Admin123\n\n";
    echo "CLIENTES:\n";
    echo "  Email: juan@correo.com\n";
    echo "  Contraseña: Cliente123\n\n";
    echo "  Email: maria@correo.com\n";
    echo "  Contraseña: Cliente123\n";
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
    
} catch (Exception $e) {
    echo " Error: " . $e->getMessage() . "\n";
    exit(1);
}
