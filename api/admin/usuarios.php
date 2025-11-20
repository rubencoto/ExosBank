<?php
// Configurar sesión
require_once __DIR__ . '/../../config/session.php';
session_start();

// Configuración de headers y CORS
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (preg_match('/^http:\/\/localhost(:\d+)?$/', $origin)) {
    header("Access-Control-Allow-Origin: $origin");
}
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Methods: GET, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Credentials: true');

// Manejar preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Verificar sesión y rol de administrador
if (!isset($_SESSION['usuario_id']) || !isset($_SESSION['rol'])) {
    http_response_code(401);
    echo json_encode([
        'status' => 'error',
        'message' => 'No hay sesión activa'
    ]);
    exit();
}

if ($_SESSION['rol'] !== 'Administrador') {
    http_response_code(403);
    echo json_encode([
        'status' => 'error',
        'message' => 'No tienes permisos para acceder a este recurso'
    ]);
    exit();
}

require_once __DIR__ . '/../../config/env.php';
require_once __DIR__ . '/../../config/database.php';

function columnExists($conn, $table, $column)
{
    $sql = "SELECT COUNT(*) AS total FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = ? AND COLUMN_NAME = ?";
    $stmt = sqlsrv_prepare($conn, $sql, [$table, $column]);

    if ($stmt && sqlsrv_execute($stmt)) {
        $row = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC);
        sqlsrv_free_stmt($stmt);
        return $row && intval($row['total']) > 0;
    }

    return false;
}

try {
    $database = new Database();
    $conn = $database->getConnection();
    $method = $_SERVER['REQUEST_METHOD'];
    $estadoColumn = columnExists($conn, 'Usuarios', 'estado');

    if ($method === 'GET') {
        $search = isset($_GET['q']) ? trim($_GET['q']) : '';
        $params = [];
        $filters = '';

        if ($search !== '') {
            $filters = "WHERE u.nombre LIKE ? OR u.correo LIKE ? OR u.cedula LIKE ?";
            $like = '%' . $search . '%';
            $params = [$like, $like, $like];
        }

        $estadoSelect = $estadoColumn ? "COALESCE(u.estado, 'Activo')" : "'Activo'";

        $query = "SELECT 
                    u.id_usuario,
                    u.nombre,
                    u.correo,
                    u.rol,
                    u.cedula,
                    u.direccion,
                    u.telefono,
                    u.tipo_cuenta,
                    $estadoSelect AS estado,
                    c.id_cliente,
                    cuentas.total_cuentas,
                    cuentas.saldo_total
                  FROM dbo.Usuarios u
                  LEFT JOIN dbo.Clientes c ON u.id_usuario = c.id_usuario
                  OUTER APPLY (
                      SELECT 
                          COUNT(*) AS total_cuentas,
                          SUM(saldo) AS saldo_total
                      FROM dbo.Cuentas cu
                      WHERE c.id_cliente IS NOT NULL AND cu.id_cliente = c.id_cliente
                  ) cuentas
                  $filters
                  ORDER BY u.id_usuario DESC";

        $stmt = sqlsrv_prepare($conn, $query, $params);

        if (!$stmt || !sqlsrv_execute($stmt)) {
            throw new Exception('Error al obtener usuarios');
        }

        $usuarios = [];
        $totalAdmins = 0;
        $totalClientes = 0;

        while ($row = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC)) {
            $usuarios[] = [
                'id_usuario' => intval($row['id_usuario']),
                'nombre' => $row['nombre'],
                'correo' => $row['correo'],
                'rol' => $row['rol'],
                'estado' => $row['estado'] ?? 'Activo',
                'cedula' => $row['cedula'] ?? '',
                'direccion' => $row['direccion'] ?? '',
                'telefono' => $row['telefono'] ?? '',
                'tipo_cuenta' => $row['tipo_cuenta'] ?? null,
                'id_cliente' => $row['id_cliente'] ?? null,
                'total_cuentas' => isset($row['total_cuentas']) ? intval($row['total_cuentas']) : 0,
                'saldo_total' => isset($row['saldo_total']) ? floatval($row['saldo_total']) : 0.0
            ];

            if ($row['rol'] === 'Administrador') {
                $totalAdmins++;
            } else {
                $totalClientes++;
            }
        }

        sqlsrv_free_stmt($stmt);
        $database->closeConnection();

        echo json_encode([
            'status' => 'ok',
            'data' => [
                'total' => count($usuarios),
                'resumen' => [
                    'administradores' => $totalAdmins,
                    'clientes' => $totalClientes
                ],
                'usuarios' => $usuarios
            ]
        ]);
        exit();
    }

    if ($method === 'PUT') {
        $input = file_get_contents('php://input');
        $data = json_decode($input, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new Exception('JSON inválido');
        }

        $idUsuario = isset($data['id_usuario']) ? intval($data['id_usuario']) : 0;
        $nombre = isset($data['nombre']) ? trim($data['nombre']) : '';
        $correo = isset($data['correo']) ? trim($data['correo']) : '';
        $rol = isset($data['rol']) ? trim($data['rol']) : '';
        $cedula = isset($data['cedula']) ? trim($data['cedula']) : '';
        $direccion = isset($data['direccion']) ? trim($data['direccion']) : '';
        $telefono = isset($data['telefono']) ? trim($data['telefono']) : '';
        $estado = isset($data['estado']) ? trim($data['estado']) : 'Activo';
        $tipoCuenta = isset($data['tipo_cuenta']) ? trim($data['tipo_cuenta']) : null;

        if ($idUsuario <= 0) {
            throw new Exception('ID de usuario inválido');
        }

        if ($nombre === '' || $correo === '' || $rol === '') {
            throw new Exception('Nombre, correo y rol son obligatorios');
        }

        if (!filter_var($correo, FILTER_VALIDATE_EMAIL)) {
            throw new Exception('Correo inválido');
        }

        if (!in_array($rol, ['Administrador', 'Cliente'])) {
            throw new Exception('Rol inválido');
        }

        if ($estadoColumn && !in_array($estado, ['Activo', 'Inactivo'])) {
            throw new Exception('Estado inválido');
        }

        // Verificar que el correo no esté en uso por otro usuario
        $sqlCheck = "SELECT id_usuario FROM dbo.Usuarios WHERE correo = ? AND id_usuario != ?";
        $stmtCheck = sqlsrv_prepare($conn, $sqlCheck, [$correo, $idUsuario]);

        if (!$stmtCheck || !sqlsrv_execute($stmtCheck)) {
            throw new Exception('Error al verificar correo');
        }

        if (sqlsrv_fetch_array($stmtCheck, SQLSRV_FETCH_ASSOC)) {
            sqlsrv_free_stmt($stmtCheck);
            http_response_code(409);
            echo json_encode([
                'status' => 'error',
                'message' => 'El correo ya está registrado en otro usuario'
            ]);
            exit();
        }

        sqlsrv_free_stmt($stmtCheck);

        // Obtener datos actuales
        $sqlUser = "SELECT id_usuario, tipo_cuenta FROM dbo.Usuarios WHERE id_usuario = ?";
        $stmtUser = sqlsrv_prepare($conn, $sqlUser, [$idUsuario]);

        if (!$stmtUser || !sqlsrv_execute($stmtUser)) {
            throw new Exception('Error al obtener usuario');
        }

        $usuarioActual = sqlsrv_fetch_array($stmtUser, SQLSRV_FETCH_ASSOC);
        sqlsrv_free_stmt($stmtUser);

        if (!$usuarioActual) {
            http_response_code(404);
            echo json_encode([
                'status' => 'error',
                'message' => 'Usuario no encontrado'
            ]);
            exit();
        }

        if ($tipoCuenta === null) {
            $tipoCuenta = $usuarioActual['tipo_cuenta'] ?? '1';
        }

        if (!sqlsrv_begin_transaction($conn)) {
            throw new Exception('No se pudo iniciar la transacción');
        }

        try {
            $updateSql = "UPDATE dbo.Usuarios SET nombre = ?, correo = ?, rol = ?, cedula = ?, direccion = ?, telefono = ?, tipo_cuenta = ?";
            $params = [$nombre, $correo, $rol, $cedula, $direccion, $telefono, $tipoCuenta];

            if ($estadoColumn) {
                $updateSql .= ", estado = ?";
                $params[] = $estado;
            }

            $updateSql .= " WHERE id_usuario = ?";
            $params[] = $idUsuario;

            $stmtUpdate = sqlsrv_prepare($conn, $updateSql, $params);

            if (!$stmtUpdate || !sqlsrv_execute($stmtUpdate)) {
                throw new Exception('Error al actualizar usuario');
            }

            sqlsrv_free_stmt($stmtUpdate);

            // Actualizar/crear registro en Clientes si aplica
            $sqlCliente = "SELECT id_cliente FROM dbo.Clientes WHERE id_usuario = ?";
            $stmtCliente = sqlsrv_prepare($conn, $sqlCliente, [$idUsuario]);

            if (!$stmtCliente || !sqlsrv_execute($stmtCliente)) {
                throw new Exception('Error al verificar cliente');
            }

            $cliente = sqlsrv_fetch_array($stmtCliente, SQLSRV_FETCH_ASSOC);
            sqlsrv_free_stmt($stmtCliente);

            if ($rol === 'Cliente') {
                if ($cliente) {
                    $sqlUpdateCliente = "UPDATE dbo.Clientes SET cedula = ?, direccion = ?, telefono = ? WHERE id_cliente = ?";
                    $stmtUpdateCliente = sqlsrv_prepare($conn, $sqlUpdateCliente, [$cedula, $direccion, $telefono, $cliente['id_cliente']]);

                    if (!$stmtUpdateCliente || !sqlsrv_execute($stmtUpdateCliente)) {
                        throw new Exception('Error al actualizar cliente');
                    }
                    sqlsrv_free_stmt($stmtUpdateCliente);
                } else {
                    $sqlInsertCliente = "INSERT INTO dbo.Clientes (id_usuario, cedula, direccion, telefono) VALUES (?, ?, ?, ?)";
                    $stmtInsertCliente = sqlsrv_prepare($conn, $sqlInsertCliente, [$idUsuario, $cedula, $direccion, $telefono]);

                    if (!$stmtInsertCliente || !sqlsrv_execute($stmtInsertCliente)) {
                        throw new Exception('Error al crear cliente');
                    }
                    sqlsrv_free_stmt($stmtInsertCliente);
                }
            }

            sqlsrv_commit($conn);
            $database->closeConnection();

            echo json_encode([
                'status' => 'ok',
                'message' => 'Usuario actualizado correctamente'
            ]);
            exit();
        } catch (Exception $txError) {
            sqlsrv_rollback($conn);
            throw $txError;
        }
    }

    if ($method === 'DELETE') {
        $idUsuario = isset($_GET['id']) ? intval($_GET['id']) : 0;

        if ($idUsuario <= 0) {
            throw new Exception('ID de usuario inválido');
        }

        if ($idUsuario === intval($_SESSION['usuario_id'])) {
            throw new Exception('No puedes eliminar tu propio usuario');
        }

        $sqlUser = "SELECT id_usuario FROM dbo.Usuarios WHERE id_usuario = ?";
        $stmtUser = sqlsrv_prepare($conn, $sqlUser, [$idUsuario]);

        if (!$stmtUser || !sqlsrv_execute($stmtUser)) {
            throw new Exception('Error al verificar usuario');
        }

        $usuario = sqlsrv_fetch_array($stmtUser, SQLSRV_FETCH_ASSOC);
        sqlsrv_free_stmt($stmtUser);

        if (!$usuario) {
            http_response_code(404);
            echo json_encode([
                'status' => 'error',
                'message' => 'Usuario no encontrado'
            ]);
            exit();
        }

        if (!sqlsrv_begin_transaction($conn)) {
            throw new Exception('No se pudo iniciar la transacción');
        }

        try {
            $clienteId = null;
            $sqlCliente = "SELECT id_cliente FROM dbo.Clientes WHERE id_usuario = ?";
            $stmtCliente = sqlsrv_prepare($conn, $sqlCliente, [$idUsuario]);

            if ($stmtCliente && sqlsrv_execute($stmtCliente)) {
                $clienteData = sqlsrv_fetch_array($stmtCliente, SQLSRV_FETCH_ASSOC);
                $clienteId = $clienteData['id_cliente'] ?? null;
            }
            sqlsrv_free_stmt($stmtCliente);

            if ($clienteId) {
                // Obtener cuentas del cliente
                $sqlCuentas = "SELECT id_cuenta FROM dbo.Cuentas WHERE id_cliente = ?";
                $stmtCuentas = sqlsrv_prepare($conn, $sqlCuentas, [$clienteId]);
                $cuentasIds = [];

                if ($stmtCuentas && sqlsrv_execute($stmtCuentas)) {
                    while ($cuenta = sqlsrv_fetch_array($stmtCuentas, SQLSRV_FETCH_ASSOC)) {
                        $cuentasIds[] = intval($cuenta['id_cuenta']);
                    }
                }
                sqlsrv_free_stmt($stmtCuentas);

                if (!empty($cuentasIds)) {
                    $placeholders = implode(',', array_fill(0, count($cuentasIds), '?'));
                    $deleteTransSql = "DELETE FROM dbo.Transacciones WHERE id_cuenta_origen IN ($placeholders) OR id_cuenta_destino IN ($placeholders)";
                    $transParams = array_merge($cuentasIds, $cuentasIds);
                    $stmtDeleteTrans = sqlsrv_prepare($conn, $deleteTransSql, $transParams);

                    if (!$stmtDeleteTrans || !sqlsrv_execute($stmtDeleteTrans)) {
                        throw new Exception('Error al eliminar transacciones');
                    }
                    sqlsrv_free_stmt($stmtDeleteTrans);
                }

                $stmtDeleteCuentas = sqlsrv_prepare($conn, "DELETE FROM dbo.Cuentas WHERE id_cliente = ?", [$clienteId]);
                if (!$stmtDeleteCuentas || !sqlsrv_execute($stmtDeleteCuentas)) {
                    throw new Exception('Error al eliminar cuentas');
                }
                sqlsrv_free_stmt($stmtDeleteCuentas);

                $stmtDeleteCliente = sqlsrv_prepare($conn, "DELETE FROM dbo.Clientes WHERE id_cliente = ?", [$clienteId]);
                if (!$stmtDeleteCliente || !sqlsrv_execute($stmtDeleteCliente)) {
                    throw new Exception('Error al eliminar cliente');
                }
                sqlsrv_free_stmt($stmtDeleteCliente);
            }

            $stmtDeleteUsuario = sqlsrv_prepare($conn, "DELETE FROM dbo.Usuarios WHERE id_usuario = ?", [$idUsuario]);
            if (!$stmtDeleteUsuario || !sqlsrv_execute($stmtDeleteUsuario)) {
                throw new Exception('Error al eliminar usuario');
            }
            sqlsrv_free_stmt($stmtDeleteUsuario);

            sqlsrv_commit($conn);
            $database->closeConnection();

            echo json_encode([
                'status' => 'ok',
                'message' => 'Usuario eliminado correctamente'
            ]);
            exit();
        } catch (Exception $txError) {
            sqlsrv_rollback($conn);
            throw $txError;
        }
    }

    http_response_code(405);
    echo json_encode([
        'status' => 'error',
        'message' => 'Método no permitido'
    ]);
    exit();
} catch (Exception $e) {
    error_log('Error en admin/usuarios.php: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage()
    ]);
}
