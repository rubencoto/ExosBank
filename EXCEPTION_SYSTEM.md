# Sistema de Manejo de Excepciones - ExosBank

## Resumen

Se ha implementado un sistema completo de manejo de excepciones para el proyecto ExosBank, incluyendo:

- ✅ Clases de excepción personalizadas para diferentes tipos de errores
- ✅ Manejo mejorado de errores en la clase Database
- ✅ Excepciones específicas en APIs de transacciones
- ✅ Manejo robusto de errores en NotificationService
- ✅ Try-catch mejorado en APIs de administración
- ✅ Error handling avanzado en frontend React
- ✅ Middleware de error logging y auditoría

## Estructura de Excepciones

### Backend (PHP)

#### Clases Base
- `BaseException`: Excepción base con logging automático y respuesta JSON
- `ExceptionFactory`: Factory para crear excepciones comunes
- `GlobalExceptionHandler`: Handler global para excepciones no capturadas

#### Tipos de Excepciones

1. **Base de Datos**
   - `DatabaseException`: Error general de BD
   - `DatabaseConnectionException`: Error de conexión
   - `SqlQueryException`: Error en consulta SQL
   - `DatabaseIntegrityException`: Violación de integridad

2. **Autenticación y Autorización**
   - `AuthenticationException`: Error de autenticación
   - `InvalidCredentialsException`: Credenciales incorrectas
   - `SessionExpiredException`: Sesión expirada
   - `InsufficientPermissionsException`: Permisos insuficientes
   - `InvalidTokenException`: Token JWT inválido

3. **Transacciones**
   - `TransactionException`: Error general en transacción
   - `InsufficientFundsException`: Fondos insuficientes
   - `AccountNotFoundException`: Cuenta no encontrada
   - `InvalidAmountException`: Monto inválido
   - `TransactionLimitExceededException`: Límite excedido
   - `AccountBlockedException`: Cuenta bloqueada

4. **Validación**
   - `ValidationException`: Error de validación con detalles
   - `MissingFieldsException`: Campos requeridos faltantes
   - `InvalidJsonException`: JSON inválido
   - `InvalidEmailException`: Email inválido

5. **Servicios**
   - `ServiceException`: Error en servicio externo
   - `NotificationException`: Error en notificaciones
   - `MailConfigException`: Error de configuración SMTP
   - `MailSendException`: Error al enviar email
   - `ServiceUnavailableException`: Servicio no disponible

### Frontend (React/TypeScript)

#### Hooks Personalizados
- `useErrorHandler`: Hook para manejo de errores con estados
- `useApi`: Hook para llamadas API con manejo automático de errores

#### Componentes
- `ErrorDisplay`: Componente para mostrar errores con iconos y detalles
- `SuccessDisplay`: Componente para mensajes de éxito
- `LoadingDisplay`: Componente para estados de carga
- `ErrorBoundary`: Boundary para capturar errores de React

## Uso

### Backend

#### Configuración Inicial
```php
// Incluir al inicio de cada API
require_once __DIR__ . '/config/error_config.php';
```

#### Uso de Excepciones
```php
// Lanzar excepción específica
throw new InsufficientFundsException();

// Usar factory
throw ExceptionFactory::createAccountNotFoundException();

// Manejo de errores
try {
    // Código que puede fallar
} catch (BaseException $e) {
    // Excepción personalizada - maneja su propia respuesta
    $e->sendJsonResponse();
} catch (Exception $e) {
    // Excepción genérica
    logError('Error inesperado: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Error interno']);
}
```

#### Logging
```php
// Diferentes niveles de log
logError('Error crítico', ['context' => 'data']);
logWarning('Advertencia', ['user_id' => 123]);
logInfo('Información', ['operation' => 'login']);
logAudit('Usuario creado', ['user_id' => 456]);

// Log de actividad de usuario
logUserActivity('login_attempt', ['success' => true]);

// Log de performance
$start = microtime(true);
// ... operación
logPerformance('database_query', $start);
```

### Frontend

#### Hook useApi
```tsx
import { useApi } from '../hooks/useApi';

function MyComponent() {
  const { post, isLoading, error, clearError } = useApi();
  
  const handleSubmit = async () => {
    try {
      const result = await post('/api/endpoint', data);
      // Manejar éxito
    } catch (error) {
      // Error ya está en el estado
    }
  };
  
  return (
    <div>
      {error && <ErrorDisplay error={error} onDismiss={clearError} />}
      {/* resto del componente */}
    </div>
  );
}
```

#### Hook useErrorHandler
```tsx
import { useErrorHandler } from '../hooks/useErrorHandler';

function MyComponent() {
  const { executeAsync, error, isLoading, clearError } = useErrorHandler();
  
  const handleAsyncOperation = () => {
    executeAsync(
      () => fetch('/api/data').then(r => r.json()),
      {
        onSuccess: (data) => console.log('Success:', data),
        onError: (error) => console.log('Error:', error)
      }
    );
  };
}
```

#### ErrorBoundary
```tsx
import { ErrorBoundary } from '../components/common/SimpleErrorBoundary';

function App() {
  return (
    <ErrorBoundary onError={(error) => console.error(error)}>
      <MyComponent />
    </ErrorBoundary>
  );
}
```

## Características

### Logging Automático
- Todas las excepciones se registran automáticamente
- Diferentes niveles: ERROR, WARNING, INFO, AUDIT
- Contexto completo: IP, usuario, timestamp, stack trace
- Rotación automática de archivos de log
- Compresión de logs antiguos

### Respuestas Consistentes
```json
{
  "status": "error",
  "message": "Descripción del error",
  "error_code": "SPECIFIC_ERROR_CODE",
  "validation_errors": {
    "field": ["Error específico del campo"]
  },
  "timestamp": "2024-11-19T15:30:00Z"
}
```

### Performance Monitoring
- Log de operaciones lentas (>5 segundos)
- Medición de memoria y tiempo de ejecución
- Estadísticas de performance por endpoint

### Seguridad
- Headers de seguridad automáticos
- Sanitización de entrada
- Log de intentos de acceso no autorizado
- Ocultación de detalles técnicos en producción

## Archivos Principales

### Backend
- `/Exceptions/` - Clases de excepción
- `/config/error_config.php` - Configuración global
- `/ErrorLoggingMiddleware.php` - Middleware de logging
- `/logs/` - Archivos de log (se crea automáticamente)

### Frontend
- `/src/hooks/useErrorHandler.ts` - Hook de manejo de errores
- `/src/hooks/useApi.ts` - Hook para APIs
- `/src/components/common/ErrorDisplay.tsx` - Componente de error
- `/src/components/common/SimpleErrorBoundary.tsx` - Error boundary

## Beneficios

1. **Consistencia**: Manejo uniforme de errores en toda la aplicación
2. **Debugging**: Logs detallados facilitan la identificación de problemas
3. **UX**: Mensajes de error más informativos para el usuario
4. **Monitoreo**: Seguimiento de errores y performance
5. **Seguridad**: Mejor control de información sensible
6. **Mantenimiento**: Código más limpio y fácil de mantener

## Próximos Pasos

1. Integrar con servicio de monitoreo externo (ej: Sentry)
2. Implementar alertas automáticas para errores críticos
3. Dashboard de monitoreo de errores
4. Métricas de performance en tiempo real
5. Tests automatizados para el manejo de errores