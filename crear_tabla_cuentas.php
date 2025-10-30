<?php
// Script para crear tabla Cuentas y generar cuentas para usuarios existentes
// Ejecutar: php crear_tabla_cuentas.php

require_once __DIR__ . '/config/env.php';
require_once __DIR__ . '/config/database.php';

echo "=== CREANDO TABLA CUENTAS Y GENERANDO CUENTAS BANCARIAS ===\n\n";

try {
    $database = new Database();
    $conn = $database->getConnection();
    
    // Verificar si la tabla existe
    $sqlCheck = "SELECT COUNT(*) as count 
                 FROM INFORMATION_SCHEMA.TABLES 
                 WHERE TABLE_NAME = 'Cuentas'";
    
    $stmtCheck = sqlsrv_query($conn, $sqlCheck);
    $row = sqlsrv_fetch_array($stmtCheck, SQLSRV_FETCH_ASSOC);
    
    if ($row['count'] == 0) {
        echo "Creando tabla Cuentas...\n";
        
        // Crear tabla Cuentas
        $sqlCreate = "CREATE TABLE dbo.Cuentas (
            id_cuenta INT IDENTITY(1,1) PRIMARY KEY,
            id_usuario INT NOT NULL,
            numero_cuenta NVARCHAR(20) NOT NULL UNIQUE,
            tipo_cuenta NVARCHAR(50) NOT NULL,
            saldo DECIMAL(18,2) NOT NULL DEFAULT 0.00,
            estado NVARCHAR(20) NOT NULL DEFAULT 'Activa',
            fecha_creacion DATETIME NOT NULL DEFAULT GETDATE(),
            FOREIGN KEY (id_usuario) REFERENCES dbo.Usuarios(id_usuario)
        )";
        
        $stmtCreate = sqlsrv_query($conn, $sqlCreate);
        
        if (!$stmtCreate) {
            throw new Exception("Error al crear tabla: " . print_r(sqlsrv_errors(), true));
        }
        
        echo "Tabla Cuentas creada exitosamente\n\n";
    } else {
        echo "Tabla Cuentas ya existe\n\n";
    }
    
    // Función para generar número de cuenta
    function generarNumeroCuenta($userId, $tipoCuenta) {
        // Formato: TC-UUUUUU-RRRRRR
        // TC = Tipo de Cuenta (01=Corriente, 02=Ahorro, 03=Crédito)
        // UUUUUU = ID de usuario (6 dígitos)
        // RRRRRR = Random (6 dígitos)
        
        $prefijo = str_pad($tipoCuenta, 2, '0', STR_PAD_LEFT);
        $userId6 = str_pad($userId, 6, '0', STR_PAD_LEFT);
        $random6 = str_pad(rand(0, 999999), 6, '0', STR_PAD_LEFT);
        
        return $prefijo . '-' . $userId6 . '-' . $random6;
    }
    
    // Función para obtener nombre del tipo de cuenta
    function obtenerNombreTipoCuenta($codigo) {
        $tipos = [
            '1' => 'Cuenta Corriente',
            '2' => 'Cuenta de Ahorro',
            '3' => 'Cuenta de Crédito'
        ];
        return $tipos[$codigo] ?? 'Cuenta Corriente';
    }
    
    // Obtener usuarios sin cuenta
    echo "Verificando usuarios sin cuenta bancaria...\n";
    
    $sqlUsuarios = "SELECT c.id_cliente, u.id_usuario, u.nombre, u.correo, u.tipo_cuenta 
                    FROM dbo.Usuarios u
                    INNER JOIN dbo.Clientes c ON u.id_usuario = c.id_usuario
                    LEFT JOIN dbo.Cuentas cu ON c.id_cliente = cu.id_cliente
                    WHERE cu.id_cuenta IS NULL";
    
    $stmtUsuarios = sqlsrv_query($conn, $sqlUsuarios);
    
    if (!$stmtUsuarios) {
        throw new Exception("Error al obtener usuarios: " . print_r(sqlsrv_errors(), true));
    }
    
    $usuariosSinCuenta = [];
    while ($usuario = sqlsrv_fetch_array($stmtUsuarios, SQLSRV_FETCH_ASSOC)) {
        $usuariosSinCuenta[] = $usuario;
    }
    
    if (count($usuariosSinCuenta) == 0) {
        echo "Todos los usuarios ya tienen cuenta bancaria\n\n";
    } else {
        echo "Encontrados " . count($usuariosSinCuenta) . " usuarios sin cuenta\n\n";
        
        foreach ($usuariosSinCuenta as $usuario) {
            echo "Creando cuenta para: {$usuario['nombre']} ({$usuario['correo']})...\n";
            
            $tipoCuenta = $usuario['tipo_cuenta'] ?? '1';
            $numeroCuenta = generarNumeroCuenta($usuario['id_usuario'], $tipoCuenta);
            $nombreTipoCuenta = obtenerNombreTipoCuenta($tipoCuenta);
            
            // Insertar cuenta
            $sqlInsert = "INSERT INTO dbo.Cuentas (id_cliente, numero_cuenta, tipo_cuenta, saldo) 
                          VALUES (?, ?, ?, 0.00)";
            
            $params = array(
                $usuario['id_cliente'],
                $numeroCuenta,
                intval($tipoCuenta)
            );
            
            $stmtInsert = sqlsrv_prepare($conn, $sqlInsert, $params);
            
            if (!$stmtInsert || !sqlsrv_execute($stmtInsert)) {
                echo "  Error al crear cuenta: " . print_r(sqlsrv_errors(), true) . "\n";
                continue;
            }
            
            sqlsrv_free_stmt($stmtInsert);
            
            echo "  Cuenta creada: $numeroCuenta ($nombreTipoCuenta)\n";
            echo "  Saldo inicial: ₡0.00\n\n";
        }
    }
    
    $database->closeConnection();
    
    echo "=== PROCESO COMPLETADO ===\n\n";
    echo "Tabla Cuentas lista y cuentas bancarias generadas\n";
    echo "Los usuarios ahora pueden ver sus cuentas en el perfil\n\n";
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    exit(1);
}
