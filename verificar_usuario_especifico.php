<?php
require_once __DIR__ . '/config/database.php';

try {
    $database = new Database();
    $conn = $database->getConnection();
    
    $sql = "SELECT u.id_usuario, u.nombre, u.correo, u.rol, u.contrasena, 
                   c.id_cliente, c.telefono, c.direccion
            FROM dbo.Usuarios u
            LEFT JOIN dbo.Clientes c ON u.id_usuario = c.id_usuario
            WHERE u.correo = ?";
    
    $email = 'morita@gmail.com';
    $stmt = sqlsrv_prepare($conn, $sql, array(&$email));
    
    if (!$stmt || !sqlsrv_execute($stmt)) {
        die('Error: ' . print_r(sqlsrv_errors(), true));
    }
    
    $usuario = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC);
    
    if ($usuario) {
        echo "=== INFORMACIÓN DEL USUARIO MORITA ===\n\n";
        echo "ID Usuario: " . $usuario['id_usuario'] . "\n";
        echo "Nombre: " . $usuario['nombre'] . "\n";
        echo "Email: " . $usuario['correo'] . "\n";
        echo "Rol: " . $usuario['rol'] . "\n";
        echo "ID Cliente: " . ($usuario['id_cliente'] ?? 'NULL') . "\n";
        echo "Teléfono: " . ($usuario['telefono'] ?? 'NULL') . "\n";
        echo "Dirección: " . ($usuario['direccion'] ?? 'NULL') . "\n";
        echo "Hash contraseña: " . substr($usuario['contrasena'], 0, 50) . "...\n\n";
        
        // Verificar si tiene cuenta
        $sqlCuenta = "SELECT numero_cuenta, saldo, tipo_cuenta FROM dbo.Cuentas WHERE id_cliente = ?";
        $idCliente = $usuario['id_cliente'];
        $stmtCuenta = sqlsrv_prepare($conn, $sqlCuenta, array(&$idCliente));
        
        if ($stmtCuenta && sqlsrv_execute($stmtCuenta)) {
            echo "=== CUENTAS ===\n";
            while ($cuenta = sqlsrv_fetch_array($stmtCuenta, SQLSRV_FETCH_ASSOC)) {
                echo "Número: " . $cuenta['numero_cuenta'] . "\n";
                echo "Tipo: " . $cuenta['tipo_cuenta'] . "\n";
                echo "Saldo: ₡" . number_format($cuenta['saldo'], 2) . "\n\n";
            }
            sqlsrv_free_stmt($stmtCuenta);
        }
        
        echo "=== PRUEBA DE CONTRASEÑAS ===\n";
        $passwords = ['morita', 'Morita', 'morita123', 'Morita123', '123456', 'password'];
        foreach ($passwords as $pass) {
            $verify = password_verify($pass, $usuario['contrasena']);
            echo "'" . $pass . "': " . ($verify ? "✓ CORRECTA" : "✗ Incorrecta") . "\n";
        }
        
    } else {
        echo "Usuario no encontrado\n";
    }
    
    sqlsrv_free_stmt($stmt);
    $database->closeConnection();
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>
