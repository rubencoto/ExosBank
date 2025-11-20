<?php
require_once __DIR__ . '/jwt.php';

class AuthHelper {
    /**
     * Verifica la autenticación del usuario usando sesión o JWT
     * @param string $requiredRole Rol requerido ('Administrador' o null para cualquier usuario autenticado)
     * @return array|false Datos del usuario autenticado o false si no está autenticado
     */
    public static function validateAuth($requiredRole = null) {
        $userData = null;
        
        // Primero intentar con sesión
        if (isset($_SESSION['usuario_id'])) {
            $userData = [
                'user_id' => $_SESSION['usuario_id'],
                'nombre' => $_SESSION['nombre'] ?? 'Usuario',
                'correo' => $_SESSION['correo'] ?? '',
                'rol' => $_SESSION['rol'] ?? 'Cliente'
            ];
        } else {
            // Si no hay sesión, intentar con token JWT
            $tokenData = JWTHelper::validateAuthToken();
            if ($tokenData && isset($tokenData['user_id'])) {
                $userData = [
                    'user_id' => $tokenData['user_id'],
                    'nombre' => $tokenData['nombre'] ?? 'Usuario',
                    'correo' => $tokenData['correo'] ?? '',
                    'rol' => $tokenData['rol'] ?? 'Cliente'
                ];
            }
        }
        
        // Si no hay datos de usuario autenticado
        if (!$userData) {
            return false;
        }
        
        // Verificar rol si es requerido
        if ($requiredRole && $userData['rol'] !== $requiredRole) {
            return false;
        }
        
        return $userData;
    }
    
    /**
     * Envía respuesta de error de autenticación y termina la ejecución
     */
    public static function sendAuthError($message = 'No autorizado') {
        http_response_code(401);
        echo json_encode([
            'status' => 'error',
            'message' => $message
        ]);
        exit();
    }
    
    /**
     * Verifica autenticación y devuelve datos del usuario o termina con error
     */
    public static function requireAuth($requiredRole = null) {
        $userData = self::validateAuth($requiredRole);
        if (!$userData) {
            self::sendAuthError($requiredRole ? 'Permisos insuficientes' : 'No autorizado');
        }
        return $userData;
    }
}
?>