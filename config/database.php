<?php
// Configuración de Base de Datos Azure SQL
define('DB_SERVER', getenv('DB_SERVER') ?: 'tcp:exos-cr.database.windows.net,1433');
define('DB_NAME', getenv('DB_NAME') ?: 'exos_db');
define('DB_USER', getenv('DB_USER') ?: 'exosadmin');
define('DB_PASSWORD', getenv('DB_PASSWORD') ?: 'Admin2025**');
define('DB_CHARSET', 'UTF-8');

class Database {
    private $conn;
    
    public function getConnection() {
        $this->conn = null;
        
        try {
            $connectionInfo = array(
                "Database" => DB_NAME,
                "UID" => DB_USER,
                "PWD" => DB_PASSWORD,
                "CharacterSet" => DB_CHARSET,
                "Encrypt" => true,
                "TrustServerCertificate" => false,
                "ConnectionPooling" => true,
                "MultipleActiveResultSets" => false,
                "LoginTimeout" => 30
            );
            
            $this->conn = sqlsrv_connect(DB_SERVER, $connectionInfo);
            
            if ($this->conn === false) {
                throw new Exception("Error de conexión: " . print_r(sqlsrv_errors(), true));
            }
            
        } catch(Exception $e) {
            error_log("Error de conexión a la base de datos: " . $e->getMessage());
            throw $e;
        }
        
        return $this->conn;
    }
    
    public function closeConnection() {
        if ($this->conn) {
            sqlsrv_close($this->conn);
        }
    }
}
