<?php
// Archivo de configuración de sesión compartido
// Configurar sesión ANTES de session_start()

// Para desarrollo local (HTTP sin SSL)
ini_set('session.cookie_samesite', 'Lax');
ini_set('session.cookie_secure', '0'); // false para HTTP
ini_set('session.cookie_httponly', '1'); // true para seguridad
ini_set('session.use_cookies', '1');
ini_set('session.use_only_cookies', '1');
ini_set('session.cookie_lifetime', '0'); // Hasta que se cierre el navegador
ini_set('session.cookie_path', '/');
ini_set('session.cookie_domain', ''); // Vacío para localhost
ini_set('session.gc_maxlifetime', '3600'); // 1 hora

// Configurar nombre de sesión consistente
session_name('EXOSBANK_SESSION');
