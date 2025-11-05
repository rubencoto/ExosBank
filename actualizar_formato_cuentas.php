<?php
require_once __DIR__ . '/config/database.php';

echo "=== ACTUALIZACIÓN DE NÚMEROS DE CUENTA A FORMATO DE 11 DÍGITOS ===\n\n";

try {
    $database = new Database();
    $conn = $database->getConnection();
    
    // Obtener todos los clientes con sus cuentas
    $sql = "SELECT c.id_cliente, c.id_usuario, u.nombre, 
                   COUNT(cu.id_cuenta) as num_cuentas
            FROM dbo.Clientes c
            INNER JOIN dbo.Usuarios u ON c.id_usuario = u.id_usuario
            LEFT JOIN dbo.Cuentas cu ON c.id_cliente = cu.id_cliente
            GROUP BY c.id_cliente, c.id_usuario, u.nombre
            HAVING COUNT(cu.id_cuenta) > 0
            ORDER BY c.id_cliente";
    
    $stmt = sqlsrv_query($conn, $sql);
    
    if (!$stmt) {
        die('Error al obtener clientes: ' . print_r(sqlsrv_errors(), true));
    }
    
    $clientesActualizados = 0;
    $cuentasActualizadas = 0;
    
    // Primero obtener todos los clientes en un array
    $clientes = [];
    while ($cliente = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC)) {
        $clientes[] = $cliente;
    }
    sqlsrv_free_stmt($stmt);
    
    // Ahora procesar cada cliente
    foreach ($clientes as $cliente) {
        $idCliente = $cliente['id_cliente'];
        $nombre = $cliente['nombre'];
        $numCuentas = $cliente['num_cuentas'];
        
        echo "Cliente: $nombre (ID: $idCliente) - $numCuentas cuenta(s)\n";
        
        // Generar los primeros 10 dígitos únicos para este cliente
        $base10Digitos = str_pad(rand(0, 9999999999), 10, '0', STR_PAD_LEFT);
        
        // Obtener todas las cuentas de este cliente
        $sqlCuentas = "SELECT id_cuenta, numero_cuenta, tipo_cuenta FROM dbo.Cuentas WHERE id_cliente = ?";
        $stmtCuentas = sqlsrv_prepare($conn, $sqlCuentas, array(&$idCliente));
        
        if (!$stmtCuentas || !sqlsrv_execute($stmtCuentas)) {
            echo "  ✗ Error al obtener cuentas: " . print_r(sqlsrv_errors(), true) . "\n";
            continue;
        }
        
        while ($cuenta = sqlsrv_fetch_array($stmtCuentas, SQLSRV_FETCH_ASSOC)) {
            $idCuenta = $cuenta['id_cuenta'];
            $numeroViejo = $cuenta['numero_cuenta'];
            $tipoCuenta = $cuenta['tipo_cuenta'];
            
            // Crear nuevo número: 10 dígitos base + tipo de cuenta
            $numeroNuevo = $base10Digitos . $tipoCuenta;
            
            // Actualizar la cuenta
            $sqlUpdate = "UPDATE dbo.Cuentas SET numero_cuenta = ? WHERE id_cuenta = ?";
            $stmtUpdate = sqlsrv_prepare($conn, $sqlUpdate, array(&$numeroNuevo, &$idCuenta));
            
            if ($stmtUpdate && sqlsrv_execute($stmtUpdate)) {
                echo "  ✓ Cuenta ID $idCuenta: $numeroViejo → $numeroNuevo (Tipo: $tipoCuenta)\n";
                $cuentasActualizadas++;
                sqlsrv_free_stmt($stmtUpdate);
            } else {
                echo "  ✗ Error al actualizar cuenta $idCuenta: " . print_r(sqlsrv_errors(), true) . "\n";
            }
        }
        
        sqlsrv_free_stmt($stmtCuentas);
        $clientesActualizados++;
        echo "\n";
    }
    
    $database->closeConnection();
    
    echo "=== RESUMEN ===\n";
    echo "Clientes actualizados: $clientesActualizados\n";
    echo "Cuentas actualizadas: $cuentasActualizadas\n";
    echo "\n✓ Actualización completada exitosamente\n";
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>
