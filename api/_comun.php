<?php
/* Brutale Pizza · utilidades compartidas por los archivos de api/ (no se abre directamente). */

if (basename($_SERVER['SCRIPT_FILENAME'] ?? '') === basename(__FILE__)) { http_response_code(404); exit; }

/* Carpeta privada donde se guardan comprobantes, caché de la tasa y contadores.
   Se intenta FUERA de public_html (no accesible desde internet). Si el hosting no lo permite,
   se usa api/privado/, que está bloqueada por .htaccess. */
function web_dir(string $sub = ''): string {
    static $base = null;
    if ($base === null) {
        $candidates = [dirname(__DIR__, 2) . '/brutale-privado', __DIR__ . '/privado'];
        foreach ($candidates as $dir) {
            if ((is_dir($dir) || @mkdir($dir, 0750, true)) && is_writable($dir)) { $base = $dir; break; }
        }
        if ($base === null) { web_json(['ok' => false, 'error' => 'almacenamiento'], 500); }
        if (strpos($base, __DIR__) === 0 && !is_file($base . '/.htaccess')) {
            @file_put_contents($base . '/.htaccess', "Require all denied\nDeny from all\n");
        }
    }
    $dir = $sub === '' ? $base : $base . '/' . $sub;
    if (!is_dir($dir)) { @mkdir($dir, 0750, true); }
    return $dir;
}

function web_json(array $data, int $code = 200): void {
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    header('X-Content-Type-Options: nosniff');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function web_ip(): string {
    return $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
}

/* Límite simple por IP: $max solicitudes por ventana de $seconds segundos. */
function web_rate_limit(string $bucket, int $max, int $seconds): bool {
    $file = web_dir('limites') . '/' . $bucket . '-' . hash('sha256', web_ip()) . '.json';
    $now = time();
    $hits = [];
    if (is_file($file)) {
        $hits = json_decode((string) @file_get_contents($file), true) ?: [];
        $hits = array_values(array_filter($hits, function ($t) use ($now, $seconds) { return $t > $now - $seconds; }));
    }
    if (count($hits) >= $max) { return false; }
    $hits[] = $now;
    @file_put_contents($file, json_encode($hits), LOCK_EX);
    return true;
}

/* URL base del sitio (https://dominio/ruta/api/) para armar enlaces. */
function web_api_url(): string {
    $https = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');
    $host = preg_replace('/[^A-Za-z0-9.\-:]/', '', $_SERVER['HTTP_HOST'] ?? 'localhost');
    $path = rtrim(str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'] ?? '/api/x.php')), '/');
    return ($https ? 'https' : 'http') . '://' . $host . $path . '/';
}
