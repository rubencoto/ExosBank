<?php
require_once __DIR__ . '/config/database.php';

try {
    $database = new Database();
    $conn = $database->getConnection();
    
    $sql = "SELECT id_usuario, nombre, correo, contrasena FROM dbo.Usuarios WHERE correo = ?";
    $email = 'morita@gmail.com';
    $stmt = sqlsrv_prepare($conn, $sql, array(&$email));
    
    if (!$stmt || !sqlsrv_execute($stmt)) {
        die('Error: ' . print_r(sqlsrv_errors(), true));
    }
    
    $usuario = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC);
    
    if ($usuario) {
        echo "Usuario encontrado:\n";
        echo "ID: " . $usuario['id_usuario'] . "\n";
        echo "Nombre: " . $usuario['nombre'] . "\n";
        echo "Email: " . $usuario['correo'] . "\n";
        echo "Hash: " . $usuario['contrasena'] . "\n\n";
        
        // Probar contraseñas comunes
        $passwords = ['123456', 'Morita123', 'morita', 'password'];
        foreach ($passwords as $pass) {
            $verify = password_verify($pass, $usuario['contrasena']);
            echo "Password '$pass': " . ($verify ? "✓ VÁLIDA" : "✗ Inválida") . "\n";
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
