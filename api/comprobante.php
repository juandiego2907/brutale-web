<?php
/* Brutale Pizza · recibe el comprobante de pago que carga el cliente en el carrito.
   - Solo imágenes (JPG, PNG, WebP, HEIC) o PDF, máximo 8 MB.
   - Se guarda en la carpeta privada con un nombre aleatorio imposible de adivinar.
   - Devuelve un enlace privado (ver-comprobante.php?id=…) que viaja en el mensaje de WhatsApp.
   - Los comprobantes se borran solos a los 60 días. */
require __DIR__ . '/_comun.php';

const MAX_BYTES = 8 * 1024 * 1024;
const KEEP_DAYS = 60;
const TYPES = [
    'image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp',
    'image/heic' => 'heic', 'image/heif' => 'heif', 'application/pdf' => 'pdf',
];

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') { web_json(['ok' => false, 'error' => 'metodo'], 405); }
if (!web_rate_limit('comprobante', 12, 3600)) { web_json(['ok' => false, 'error' => 'demasiados_intentos'], 429); }

$rest = $_POST['restaurante'] ?? '';
if (!in_array($rest, ['brutale'], true)) { web_json(['ok' => false, 'error' => 'restaurante'], 400); }

$f = $_FILES['comprobante'] ?? null;
if (!$f || !is_array($f) || ($f['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK || !is_uploaded_file($f['tmp_name'])) {
    web_json(['ok' => false, 'error' => 'archivo'], 400);
}
if ($f['size'] <= 0 || $f['size'] > MAX_BYTES) { web_json(['ok' => false, 'error' => 'tamano'], 413); }

// Tipo real según el contenido (no el nombre que manda el navegador)
$mime = '';
if (class_exists('finfo')) { $mime = (new finfo(FILEINFO_MIME_TYPE))->file($f['tmp_name']) ?: ''; }
if (!isset(TYPES[$mime])) {
    $head = (string) file_get_contents($f['tmp_name'], false, null, 0, 16);
    if (strncmp($head, "\xFF\xD8\xFF", 3) === 0) $mime = 'image/jpeg';
    elseif (strncmp($head, "\x89PNG", 4) === 0) $mime = 'image/png';
    elseif (strncmp($head, '%PDF', 4) === 0) $mime = 'application/pdf';
    elseif (substr($head, 0, 4) === 'RIFF' && substr($head, 8, 4) === 'WEBP') $mime = 'image/webp';
    elseif (substr($head, 4, 4) === 'ftyp') $mime = 'image/heic';
}
if (!isset(TYPES[$mime])) { web_json(['ok' => false, 'error' => 'tipo'], 415); }

$dir = web_dir('comprobantes');
$id = bin2hex(random_bytes(16));                      // 32 caracteres aleatorios
$name = $id . '.' . TYPES[$mime];
if (!move_uploaded_file($f['tmp_name'], $dir . '/' . $name)) { web_json(['ok' => false, 'error' => 'guardar'], 500); }
@chmod($dir . '/' . $name, 0640);

// Registro mínimo para el dueño (qué restaurante y cuándo); no guarda datos personales.
@file_put_contents(web_dir() . '/comprobantes.log', date('c') . "\t" . $rest . "\t" . $name . "\n", FILE_APPEND | LOCK_EX);

// Limpieza: comprobantes con más de KEEP_DAYS días
foreach (glob($dir . '/*') ?: [] as $old) {
    if (is_file($old) && filemtime($old) < time() - KEEP_DAYS * 86400) { @unlink($old); }
}

web_json(['ok' => true, 'url' => web_api_url() . 'ver-comprobante.php?id=' . $id]);
