<?php
/**
 * Script para verificar las cuentas bancarias en la base de datos
 */

require_once __DIR__ . '/config/env.php';
require_once __DIR__ . '/config/database.php';

echo "=== VERIFICACIÓN DE CUENTAS BANCARIAS ===\n\n";

try {
    $database = new Database();
    $conn = $database->getConnection();
    
    // Obtener todas las cuentas
    $query = "SELECT 
                c.id_cuenta,
                c.numero_cuenta,
                c.tipo_cuenta,
                c.saldo,
                cl.id_cliente,
                u.id_usuario,
                u.nombre,
                u.correo
              FROM dbo.Cuentas c
              INNER JOIN dbo.Clientes cl ON c.id_cliente = cl.id_cliente
              INNER JOIN dbo.Usuarios u ON cl.id_usuario = u.id_usuario
              ORDER BY c.id_cuenta DESC";
    
    $stmt = sqlsrv_query($conn, $query);
    
    if (!$stmt) {
        throw new Exception("Error en la consulta: " . print_r(sqlsrv_errors(), true));
    }
    
    $cuentas = [];
    while ($row = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC)) {
        $cuentas[] = $row;
    }
    
    sqlsrv_free_stmt($stmt);
    
    echo "Total de cuentas encontradas: " . count($cuentas) . "\n\n";
    
    if (empty($cuentas)) {
        echo "⚠️  No hay cuentas registradas en la base de datos.\n";
        echo "Crea un usuario nuevo para generar una cuenta automáticamente.\n";
    } else {
        foreach ($cuentas as $i => $cuenta) {
            echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
            echo "Cuenta #" . ($i + 1) . "\n";
            echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
            echo "ID Cuenta:       " . $cuenta['id_cuenta'] . "\n";
            echo "Número Cuenta:   " . $cuenta['numero_cuenta'] . "\n";
            
            // Verificar formato del número de cuenta
            $numLen = strlen($cuenta['numero_cuenta']);
            echo "Longitud:        " . $numLen . " dígitos ";
            if ($numLen === 11) {
                echo "✓ (correcto)\n";
            } else {
                echo "⚠️  (debería ser 11)\n";
            }
            
            // Mostrar el último dígito (tipo de cuenta)
            $ultimoDigito = substr($cuenta['numero_cuenta'], -1);
            echo "Último dígito:   " . $ultimoDigito;
            if ($ultimoDigito == $cuenta['tipo_cuenta']) {
                echo " ✓ (coincide con tipo)\n";
            } else {
                echo " ⚠️  (NO coincide: tipo=" . $cuenta['tipo_cuenta'] . ")\n";
            }
            
            // Tipo de cuenta
            $tipos = [
                1 => 'Cuenta Corriente 💳',
                2 => 'Cuenta de Ahorro 🏦'
            ];
            echo "Tipo:            " . ($tipos[$cuenta['tipo_cuenta']] ?? 'Desconocido') . "\n";
            echo "Saldo:           ₡" . number_format($cuenta['saldo'], 2) . "\n";
            echo "\nPropietario:\n";
            echo "  - ID Usuario:  " . $cuenta['id_usuario'] . "\n";
            echo "  - ID Cliente:  " . $cuenta['id_cliente'] . "\n";
            echo "  - Nombre:      " . $cuenta['nombre'] . "\n";
            echo "  - Correo:      " . $cuenta['correo'] . "\n";
            echo "\n";
        }
        
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
        echo "RESUMEN\n";
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
        
        // Contar por tipo
        $porTipo = [];
        foreach ($cuentas as $cuenta) {
            $tipo = $cuenta['tipo_cuenta'];
            if (!isset($porTipo[$tipo])) {
                $porTipo[$tipo] = 0;
            }
            $porTipo[$tipo]++;
        }
        
        echo "Cuentas por tipo:\n";
        foreach ($porTipo as $tipo => $cantidad) {
            echo "  - " . ($tipos[$tipo] ?? "Tipo $tipo") . ": $cantidad\n";
        }
        
        $saldoTotal = array_sum(array_column($cuentas, 'saldo'));
        echo "\nSaldo total: ₡" . number_format($saldoTotal, 2) . "\n";
    }
    
    $database->closeConnection();
    echo "\n✅ Verificación completada exitosamente\n";
    
} catch (Exception $e) {
    echo "\n❌ ERROR: " . $e->getMessage() . "\n";
    echo "\nDetalles técnicos:\n";
    echo $e->getTraceAsString() . "\n";
}
