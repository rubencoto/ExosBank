------------------------------------------------------------
-- EXOSBANK - STORED PROCEDURES (SIN TABLA AUDITORIA)
------------------------------------------------------------

------------------------------------------------------------
-- 1) SP REALIZAR TRANSFERENCIA
------------------------------------------------------------
IF OBJECT_ID('dbo.sp_realizar_transferencia', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_realizar_transferencia;
GO

CREATE PROCEDURE dbo.sp_realizar_transferencia
    @id_usuario INT,
    @cuenta_origen NVARCHAR(20),
    @cuenta_destino NVARCHAR(20),
    @monto DECIMAL(12,2),
    @descripcion NVARCHAR(250) = N'',
    @resultado INT OUTPUT,
    @mensaje NVARCHAR(500) OUTPUT,
    @id_transaccion INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @id_cuenta_origen INT;
    DECLARE @id_cuenta_destino INT;
    DECLARE @saldo_origen DECIMAL(12,2);
    DECLARE @id_cliente INT;

    BEGIN TRY
        BEGIN TRANSACTION;

        -- Validar que las cuentas no sean iguales
        IF @cuenta_origen = @cuenta_destino
        BEGIN
            SET @resultado = -1;
            SET @mensaje = N'La cuenta destino debe ser diferente a la cuenta origen';
            ROLLBACK TRANSACTION;
            RETURN;
        END;

        -- Validar monto
        IF @monto <= 0
        BEGIN
            SET @resultado = -2;
            SET @mensaje = N'El monto debe ser mayor a cero';
            ROLLBACK TRANSACTION;
            RETURN;
        END;

        -- Validar cuenta origen pertenece al usuario
        SELECT @id_cuenta_origen = c.id_cuenta,
               @saldo_origen     = c.saldo,
               @id_cliente       = cl.id_cliente
        FROM dbo.Cuentas c
        INNER JOIN dbo.Clientes cl ON c.id_cliente = cl.id_cliente
        WHERE cl.id_usuario = @id_usuario
          AND c.numero_cuenta = @cuenta_origen;

        IF @id_cuenta_origen IS NULL
        BEGIN
            SET @resultado = -4;
            SET @mensaje = N'La cuenta origen no pertenece al usuario actual';
            ROLLBACK TRANSACTION;
            RETURN;
        END;

        -- Validar fondos suficientes
        IF @saldo_origen < @monto
        BEGIN
            SET @resultado = -5;
            SET @mensaje = N'Fondos insuficientes';
            ROLLBACK TRANSACTION;
            RETURN;
        END;

        -- Validar cuenta destino
        SELECT @id_cuenta_destino = id_cuenta
        FROM dbo.Cuentas
        WHERE numero_cuenta = @cuenta_destino;

        IF @id_cuenta_destino IS NULL
        BEGIN
            SET @resultado = -6;
            SET @mensaje = N'La cuenta destino no existe';
            ROLLBACK TRANSACTION;
            RETURN;
        END;

        -- Debitar cuenta origen
        UPDATE dbo.Cuentas
        SET saldo = saldo - @monto
        WHERE id_cuenta = @id_cuenta_origen;

        -- Acreditar cuenta destino
        UPDATE dbo.Cuentas
        SET saldo = saldo + @monto
        WHERE id_cuenta = @id_cuenta_destino;

        -- Registrar transacción
        INSERT INTO dbo.Transacciones(id_cuenta_origen, id_cuenta_destino, tipo, monto, fecha)
        VALUES (@id_cuenta_origen, @id_cuenta_destino, N'Transferencia', @monto, GETDATE());

        SET @id_transaccion = SCOPE_IDENTITY();

        COMMIT TRANSACTION;

        SET @resultado = 0;
        SET @mensaje = N'Transferencia realizada con éxito';
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;

        SET @resultado = -99;
        SET @mensaje = ERROR_MESSAGE();
    END CATCH
END;
GO


------------------------------------------------------------
-- 2) SP REGISTRAR USUARIO + CLIENTE + CUENTA INICIAL
------------------------------------------------------------
IF OBJECT_ID('dbo.sp_registrar_usuario_cliente', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_registrar_usuario_cliente;
GO

CREATE PROCEDURE dbo.sp_registrar_usuario_cliente
    @nombre NVARCHAR(100),
    @correo NVARCHAR(100),
    @cedula NVARCHAR(20),
    @direccion NVARCHAR(100),
    @telefono NVARCHAR(20),
    @tipo_cuenta INT,
    @password_hash NVARCHAR(255),
    @rol NVARCHAR(20) = N'Cliente',
    @saldo_inicial DECIMAL(12,2) = 0,
    @resultado INT OUTPUT,
    @mensaje NVARCHAR(500) OUTPUT,
    @id_usuario INT OUTPUT,
    @id_cliente INT OUTPUT,
    @numero_cuenta NVARCHAR(20) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @intentos INT = 0;

    BEGIN TRY
        BEGIN TRANSACTION;

        -- Validar correo único
        IF EXISTS (SELECT 1 FROM dbo.Usuarios WHERE correo = @correo)
        BEGIN
            SET @resultado = -1;
            SET @mensaje = N'El correo electrónico ya está registrado';
            ROLLBACK TRANSACTION;
            RETURN;
        END;

        -- Validar cédula única
        IF EXISTS (SELECT 1 FROM dbo.Clientes WHERE cedula = @cedula)
        BEGIN
            SET @resultado = -2;
            SET @mensaje = N'La cédula ya está registrada';
            ROLLBACK TRANSACTION;
            RETURN;
        END;

        -- Insertar usuario
        INSERT INTO dbo.Usuarios(nombre, correo, contrasena, rol)
        VALUES (@nombre, @correo, @password_hash, @rol);

        SET @id_usuario = SCOPE_IDENTITY();

        -- Insertar cliente
        INSERT INTO dbo.Clientes(id_usuario, cedula, telefono, direccion)
        VALUES (@id_usuario, @cedula, @telefono, @direccion);

        SET @id_cliente = SCOPE_IDENTITY();

        -- Generar número de cuenta único
        WHILE @intentos < 10
        BEGIN
            SET @numero_cuenta = CAST(@tipo_cuenta AS NVARCHAR(1)) +
                RIGHT('000000000000000000' + CAST(ABS(CHECKSUM(NEWID())) AS NVARCHAR(18)), 18);

            IF NOT EXISTS (SELECT 1 FROM dbo.Cuentas WHERE numero_cuenta = @numero_cuenta)
                BREAK;

            SET @intentos = @intentos + 1;
        END;

        -- Crear cuenta
        INSERT INTO dbo.Cuentas(id_cliente, numero_cuenta, tipo_cuenta, saldo)
        VALUES (@id_cliente, @numero_cuenta, @tipo_cuenta, @saldo_inicial);

        COMMIT TRANSACTION;

        SET @resultado = 0;
        SET @mensaje = N'Usuario y cuenta registrados con éxito';
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;

        SET @resultado = -99;
        SET @mensaje = ERROR_MESSAGE();
    END CATCH
END;
GO


------------------------------------------------------------
-- 3) SP CREAR CUENTA BANCARIA ADICIONAL
------------------------------------------------------------
IF OBJECT_ID('dbo.sp_crear_cuenta_bancaria', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_crear_cuenta_bancaria;
GO

CREATE PROCEDURE dbo.sp_crear_cuenta_bancaria
    @id_usuario INT,
    @tipo_cuenta INT,
    @saldo_inicial DECIMAL(12,2) = 0,
    @resultado INT OUTPUT,
    @mensaje NVARCHAR(500) OUTPUT,
    @id_cuenta INT OUTPUT,
    @numero_cuenta NVARCHAR(20) OUTPUT,
    @id_cliente INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @intentos INT = 0;

    BEGIN TRY
        BEGIN TRANSACTION;

        -- Obtener cliente a partir del usuario
        SELECT @id_cliente = id_cliente
        FROM dbo.Clientes
        WHERE id_usuario = @id_usuario;

        IF @id_cliente IS NULL
        BEGIN
            SET @resultado = -1;
            SET @mensaje = N'Cliente no encontrado para el usuario especificado';
            ROLLBACK TRANSACTION;
            RETURN;
        END;

        -- Generar número de cuenta único
        WHILE @intentos < 10
        BEGIN
            SET @numero_cuenta = CAST(@tipo_cuenta AS NVARCHAR(1)) +
                RIGHT('000000000000000000' + CAST(ABS(CHECKSUM(NEWID())) AS NVARCHAR(18)), 18);

            IF NOT EXISTS (SELECT 1 FROM dbo.Cuentas WHERE numero_cuenta = @numero_cuenta)
                BREAK;

            SET @intentos = @intentos + 1;
        END;

        -- Insertar cuenta
        INSERT INTO dbo.Cuentas(id_cliente, numero_cuenta, saldo, tipo_cuenta)
        VALUES (@id_cliente, @numero_cuenta, @saldo_inicial, @tipo_cuenta);

        SET @id_cuenta = SCOPE_IDENTITY();

        COMMIT TRANSACTION;

        SET @resultado = 0;
        SET @mensaje = N'Cuenta creada con éxito';
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;

        SET @resultado = -99;
        SET @mensaje = ERROR_MESSAGE();
    END CATCH
END;
GO


------------------------------------------------------------
-- 4) SP VALIDAR LOGIN (devuelve hash para verificar en app)
------------------------------------------------------------
IF OBJECT_ID('dbo.sp_validar_login', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_validar_login;
GO

CREATE PROCEDURE dbo.sp_validar_login
    @correo NVARCHAR(100),
    @resultado INT OUTPUT,
    @mensaje NVARCHAR(500) OUTPUT,
    @id_usuario INT OUTPUT,
    @nombre NVARCHAR(100) OUTPUT,
    @rol NVARCHAR(20) OUTPUT,
    @password_hash NVARCHAR(255) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        @id_usuario    = id_usuario,
        @nombre        = nombre,
        @rol           = rol,
        @password_hash = contrasena
    FROM dbo.Usuarios
    WHERE correo = @correo;

    IF @id_usuario IS NULL
    BEGIN
        SET @resultado = -1;
        SET @mensaje = N'Credenciales incorrectas';
        RETURN;
    END;

    SET @resultado = 0;
    SET @mensaje = N'Usuario encontrado';
END;
GO


------------------------------------------------------------
-- 5) SP OBTENER DATOS DE UNA TRANSACCIÓN
------------------------------------------------------------
IF OBJECT_ID('dbo.sp_obtener_datos_transaccion', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_obtener_datos_transaccion;
GO

CREATE PROCEDURE dbo.sp_obtener_datos_transaccion
    @id_transaccion INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        t.id_transaccion,
        t.id_cuenta_origen,
        t.id_cuenta_destino,
        t.monto,
        t.fecha,
        t.tipo,
        co.numero_cuenta AS numero_cuenta_origen,
        cd.numero_cuenta AS numero_cuenta_destino
    FROM dbo.Transacciones t
    INNER JOIN dbo.Cuentas co ON t.id_cuenta_origen = co.id_cuenta
    LEFT JOIN dbo.Cuentas cd  ON t.id_cuenta_destino = cd.id_cuenta
    WHERE t.id_transaccion = @id_transaccion;
END;
GO


------------------------------------------------------------
-- 6) SP OBTENER CLIENTE COMPLETO POR ID_CLIENTE
------------------------------------------------------------
IF OBJECT_ID('dbo.sp_obtener_cliente_completo', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_obtener_cliente_completo;
GO

CREATE PROCEDURE dbo.sp_obtener_cliente_completo
    @id_cliente INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        c.id_cliente,
        c.id_usuario,
        u.nombre,
        u.correo,
        c.cedula,
        c.direccion,
        c.telefono,
        u.rol
    FROM dbo.Clientes c
    INNER JOIN dbo.Usuarios u ON c.id_usuario = u.id_usuario
    WHERE c.id_cliente = @id_cliente;
END;
GO


------------------------------------------------------------
-- 7) SP OBTENER CLIENTE POR ID_CUENTA
------------------------------------------------------------
IF OBJECT_ID('dbo.sp_obtener_cliente_por_cuenta', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_obtener_cliente_por_cuenta;
GO

CREATE PROCEDURE dbo.sp_obtener_cliente_por_cuenta
    @id_cuenta INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        c.id_cliente,
        c.id_usuario,
        u.nombre,
        u.correo,
        c.cedula,
        c.direccion,
        c.telefono,
        u.rol
    FROM dbo.Clientes c
    INNER JOIN dbo.Cuentas cu ON cu.id_cliente = c.id_cliente
    INNER JOIN dbo.Usuarios u ON c.id_usuario = u.id_usuario
    WHERE cu.id_cuenta = @id_cuenta;
END;
GO


------------------------------------------------------------
-- 8) PERMISOS (opcional, si ya tienes RolAdministrador / RolCliente)
------------------------------------------------------------
-- Ajusta o comenta estas líneas según tu modelo de seguridad

IF EXISTS (SELECT 1 FROM sys.database_principals WHERE name = N'RolAdministrador')
BEGIN
    GRANT EXECUTE ON dbo.sp_realizar_transferencia      TO RolAdministrador;
    GRANT EXECUTE ON dbo.sp_registrar_usuario_cliente   TO RolAdministrador;
    GRANT EXECUTE ON dbo.sp_crear_cuenta_bancaria       TO RolAdministrador;
    GRANT EXECUTE ON dbo.sp_validar_login               TO RolAdministrador;
    GRANT EXECUTE ON dbo.sp_obtener_datos_transaccion   TO RolAdministrador;
    GRANT EXECUTE ON dbo.sp_obtener_cliente_completo    TO RolAdministrador;
    GRANT EXECUTE ON dbo.sp_obtener_cliente_por_cuenta  TO RolAdministrador;
END;

IF EXISTS (SELECT 1 FROM sys.database_principals WHERE name = N'RolCliente')
BEGIN
    GRANT EXECUTE ON dbo.sp_realizar_transferencia      TO RolCliente;
    GRANT EXECUTE ON dbo.sp_crear_cuenta_bancaria       TO RolCliente;
    GRANT EXECUTE ON dbo.sp_validar_login               TO RolCliente;
    GRANT EXECUTE ON dbo.sp_obtener_datos_transaccion   TO RolCliente;
END;
GO
