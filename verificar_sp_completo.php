<?php
require_once __DIR__ . '/config/env.php';
require_once __DIR__ . '/config/database.php';

echo "<h2>✓ Verificación Completa de Procedimientos Almacenados</h2>";

try {
    $database = new Database();
    $conn = $database->getConnection();
    
    echo "<p style='color:green; font-size:16px;'><strong>✓ Conexión exitosa a Azure SQL</strong></p>";
    
    // Lista de procedimientos esperados según tu script
    $procedimientosEsperados = [
        'sp_Usuario_Crear',
        'sp_Usuario_Actualizar',
        'sp_Usuario_Eliminar',
        'sp_Cliente_Crear',
        'sp_Cuenta_Abrir',
        'sp_Cuenta_Saldo',
        'sp_Mov_Depositar',
        'sp_Mov_Retirar',
        'sp_Mov_Transferir',
        'sp_Mov_ListarPorCuenta'
    ];
    
    echo "<h3>Verificando procedimientos del script...</h3>";
    echo "<table border='1' cellpadding='10' style='border-collapse: collapse; width: 100%; margin-top: 10px;'>";
    echo "<tr style='background-color: #f5f5f5;'>
            <th style='width: 40%;'>Procedimiento</th>
            <th style='width: 20%;'>Estado</th>
            <th style='width: 40%;'>Fecha de Creación</th>
          </tr>";
    
    $totalEncontrados = 0;
    
    foreach ($procedimientosEsperados as $nombreProc) {
        $query = "SELECT 
                    p.name as nombre,
                    p.create_date as fecha_creacion,
                    p.modify_date as fecha_modificacion
                  FROM sys.procedures p
                  WHERE p.name = ?";
        
        $stmt = sqlsrv_prepare($conn, $query, array($nombreProc));
        
        if ($stmt && sqlsrv_execute($stmt)) {
            $proc = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC);
            
            if ($proc) {
                $totalEncontrados++;
                echo "<tr style='background-color: #e8f5e9;'>";
                echo "<td><strong>{$nombreProc}</strong></td>";
                echo "<td style='color:green; text-align:center;'><strong>✓ EXISTE</strong></td>";
                echo "<td>" . $proc['fecha_creacion']->format('Y-m-d H:i:s') . "</td>";
                echo "</tr>";
            } else {
                echo "<tr style='background-color: #ffebee;'>";
                echo "<td><strong>{$nombreProc}</strong></td>";
                echo "<td style='color:red; text-align:center;'><strong>✗ NO EXISTE</strong></td>";
                echo "<td>-</td>";
                echo "</tr>";
            }
        }
    }
    
    echo "</table>";
    
    echo "<div style='margin-top: 20px; padding: 15px; border-radius: 5px; ";
    
    if ($totalEncontrados === count($procedimientosEsperados)) {
        echo "background-color: #e8f5e9; border: 2px solid #4caf50;'>";
        echo "<h3 style='color: #2e7d32; margin: 0;'>✓ ¡Todos los procedimientos están aplicados!</h3>";
        echo "<p style='margin: 10px 0 0 0;'><strong>{$totalEncontrados}</strong> de <strong>" . count($procedimientosEsperados) . "</strong> procedimientos encontrados</p>";
    } else {
        echo "background-color: #fff3e0; border: 2px solid #ff9800;'>";
        echo "<h3 style='color: #e65100; margin: 0;'>⚠ Faltan procedimientos por aplicar</h3>";
        echo "<p style='margin: 10px 0 0 0;'><strong>{$totalEncontrados}</strong> de <strong>" . count($procedimientosEsperados) . "</strong> procedimientos encontrados</p>";
        echo "<p>Necesitas ejecutar el script SQL para crear los procedimientos faltantes.</p>";
    }
    
    echo "</div>";
    
    // Verificar roles
    echo "<h3 style='margin-top: 30px;'>Verificando Roles de Base de Datos...</h3>";
    
    $rolesEsperados = ['RolAdministrador', 'RolCliente'];
    
    echo "<table border='1' cellpadding='10' style='border-collapse: collapse; width: 100%; margin-top: 10px;'>";
    echo "<tr style='background-color: #f5f5f5;'>
            <th>Rol</th>
            <th>Estado</th>
          </tr>";
    
    foreach ($rolesEsperados as $rol) {
        $queryRol = "SELECT name FROM sys.database_principals WHERE type = 'R' AND name = ?";
        $stmtRol = sqlsrv_prepare($conn, $queryRol, array($rol));
        
        if ($stmtRol && sqlsrv_execute($stmtRol)) {
            $resultado = sqlsrv_fetch_array($stmtRol, SQLSRV_FETCH_ASSOC);
            
            if ($resultado) {
                echo "<tr style='background-color: #e8f5e9;'>";
                echo "<td><strong>{$rol}</strong></td>";
                echo "<td style='color:green; text-align:center;'><strong>✓ EXISTE</strong></td>";
                echo "</tr>";
            } else {
                echo "<tr style='background-color: #ffebee;'>";
                echo "<td><strong>{$rol}</strong></td>";
                echo "<td style='color:red; text-align:center;'><strong>✗ NO EXISTE</strong></td>";
                echo "</tr>";
            }
        }
    }
    
    echo "</table>";
    
    $database->closeConnection();
    
} catch (Exception $e) {
    echo "<div style='background-color: #ffebee; border: 2px solid #f44336; padding: 15px; border-radius: 5px; margin-top: 20px;'>";
    echo "<h3 style='color: #c62828; margin: 0;'>✗ Error de conexión</h3>";
    echo "<p style='margin: 10px 0 0 0;'>" . htmlspecialchars($e->getMessage()) . "</p>";
    echo "</div>";
}
?>
