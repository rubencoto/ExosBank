<?php
require_once __DIR__ . '/config/database.php';

try {
    $database = new Database();
    $conn = $database->getConnection();
    
    $email = 'morita@gmail.com';
    $newPassword = 'morita123';
    $passwordHash = password_hash($newPassword, PASSWORD_DEFAULT);
    
    $sql = "UPDATE dbo.Usuarios SET contrasena = ? WHERE correo = ?";
    $stmt = sqlsrv_prepare($conn, $sql, array(&$passwordHash, &$email));
    
    if (!$stmt || !sqlsrv_execute($stmt)) {
        die('Error al actualizar: ' . print_r(sqlsrv_errors(), true));
    }
    
    echo "✓ Contraseña actualizada exitosamente para $email\n";
    echo "Nueva contraseña: $newPassword\n\n";
    
    // Verificar
    echo "Verificando...\n";
    $sqlCheck = "SELECT contrasena FROM dbo.Usuarios WHERE correo = ?";
    $stmtCheck = sqlsrv_prepare($conn, $sqlCheck, array(&$email));
    
    if ($stmtCheck && sqlsrv_execute($stmtCheck)) {
        $row = sqlsrv_fetch_array($stmtCheck, SQLSRV_FETCH_ASSOC);
        $verify = password_verify($newPassword, $row['contrasena']);
        echo ($verify ? "✓ Verificación exitosa\n" : "✗ Error en verificación\n");
        sqlsrv_free_stmt($stmtCheck);
    }
    
    sqlsrv_free_stmt($stmt);
    $database->closeConnection();
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>
