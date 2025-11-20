<?php
// Cargar excepciones personalizadas
require_once __DIR__ . '/../Exceptions/ExceptionLoader.php';

// Include SQL Server function stubs for IDE support (only in development)
if (!function_exists('sqlsrv_connect')) {
    require_once __DIR__ . '/sqlsrv_stub.php';
}

// Configuración de Base de Datos Azure SQL
define('DB_SERVER', getenv('DB_SERVER') ?: 'tcp:exos-cr.database.windows.net,1433');
define('DB_NAME', getenv('DB_NAME') ?: 'exos_db');
define('DB_USER', getenv('DB_USER') ?: 'exosadmin');
define('DB_PASSWORD', getenv('DB_PASSWORD') ?: 'Admin2025**');
define('DB_CHARSET', 'UTF-8');

class Database
{
    private $conn;
    private $connectionAttempts = 0;
    private $maxRetryAttempts = 3;
    private $retryDelay = 2; // segundos

    public function getConnection()
    {
        if ($this->conn !== null) {
            return $this->conn;
        }

        return $this->establishConnection();
    }

    private function establishConnection()
    {
        $this->connectionAttempts = 0;

        while ($this->connectionAttempts < $this->maxRetryAttempts) {
            $this->connectionAttempts++;

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
                    "LoginTimeout" => 30,
                    "ConnectRetryCount" => 2,
                    "ConnectRetryInterval" => 10
                );

                $this->conn = sqlsrv_connect(DB_SERVER, $connectionInfo);

                if ($this->conn === false) {
                    $sqlErrors = sqlsrv_errors();
                    $errorMessage = $this->formatSqlErrors($sqlErrors);
                    throw new DatabaseConnectionException(
                        "Error de conexión (intento {$this->connectionAttempts}/{$this->maxRetryAttempts}): " . $errorMessage
                    );
                }

                // Conexión exitosa
                error_log("Conexión a base de datos establecida exitosamente");
                return $this->conn;
            } catch (DatabaseConnectionException $e) {
                error_log("Intento de conexión {$this->connectionAttempts} falló: " . $e->getMessage());

                // Si es el último intento, lanzar excepción
                if ($this->connectionAttempts >= $this->maxRetryAttempts) {
                    throw new DatabaseConnectionException(
                        "No se pudo establecer conexión a la base de datos después de {$this->maxRetryAttempts} intentos"
                    );
                }

                // Esperar antes del siguiente intento
                sleep($this->retryDelay);
            } catch (Exception $e) {
                error_log("Error inesperado en conexión a BD: " . $e->getMessage());
                throw new DatabaseConnectionException(
                    "Error inesperado al conectar a la base de datos: " . $e->getMessage()
                );
            }
        }

        throw new DatabaseConnectionException("Máximo número de intentos de conexión excedido");
    }

    /**
     * Formatear errores de SQL Server para logging
     */
    private function formatSqlErrors($sqlErrors): string
    {
        if (!is_array($sqlErrors) || empty($sqlErrors)) {
            return "Error desconocido";
        }

        $formattedErrors = [];
        foreach ($sqlErrors as $error) {
            $formattedErrors[] = sprintf(
                "[SQLSTATE %s] [Code %s] %s",
                $error['SQLSTATE'] ?? 'Unknown',
                $error['code'] ?? 'Unknown',
                $error['message'] ?? 'Unknown error'
            );
        }

        return implode('; ', $formattedErrors);
    }

    /**
     * Ejecutar consulta con manejo de errores
     */
    public function executeQuery($sql, $params = [])
    {
        try {
            $conn = $this->getConnection();

            if (empty($params)) {
                $stmt = sqlsrv_query($conn, $sql);
            } else {
                $stmt = sqlsrv_prepare($conn, $sql, $params);
                if ($stmt) {
                    $result = sqlsrv_execute($stmt);
                    if (!$result) {
                        $stmt = false;
                    }
                }
            }

            if ($stmt === false) {
                $sqlErrors = sqlsrv_errors();
                $errorMessage = $this->formatSqlErrors($sqlErrors);
                throw new SqlQueryException("Error en consulta SQL: " . $errorMessage);
            }

            return $stmt;
        } catch (SqlQueryException $e) {
            throw $e;
        } catch (Exception $e) {
            throw new SqlQueryException("Error inesperado ejecutando consulta: " . $e->getMessage());
        }
    }

    /**
     * Verificar si la conexión está activa
     */
    public function isConnected(): bool
    {
        if ($this->conn === null) {
            return false;
        }

        try {
            $result = sqlsrv_query($this->conn, "SELECT 1 as test");
            if ($result === false) {
                $this->conn = null;
                return false;
            }
            sqlsrv_free_stmt($result);
            return true;
        } catch (Exception $e) {
            $this->conn = null;
            return false;
        }
    }

    /**
     * Cerrar conexión con limpieza
     */
    public function closeConnection(): void
    {
        if ($this->conn !== null) {
            try {
                sqlsrv_close($this->conn);
                error_log("Conexión a base de datos cerrada correctamente");
            } catch (Exception $e) {
                error_log("Error al cerrar conexión: " . $e->getMessage());
            } finally {
                $this->conn = null;
                $this->connectionAttempts = 0;
            }
        }
    }

    /**
     * Liberar statement
     */
    public function freeStatement($stmt): void
    {
        if ($stmt !== null && $stmt !== false) {
            try {
                sqlsrv_free_stmt($stmt);
            } catch (Exception $e) {
                error_log("Error al liberar statement: " . $e->getMessage());
            }
        }
    }

    /**
     * Obtener campo de resultado
     */
    public function getField($stmt, $fieldIndex)
    {
        try {
            return sqlsrv_get_field($stmt, $fieldIndex);
        } catch (Exception $e) {
            error_log("Error al obtener campo: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Fetch de resultado
     */
    public function fetch($stmt): bool
    {
        try {
            return sqlsrv_fetch($stmt);
        } catch (Exception $e) {
            error_log("Error en fetch: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Destructor para asegurar limpieza
     */
    public function __destruct()
    {
        $this->closeConnection();
    }
}
