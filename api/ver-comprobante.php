<?php
/* Brutale Pizza · muestra un comprobante a quien tenga el enlace privado (el restaurante lo recibe por WhatsApp). */
require __DIR__ . '/_comun.php';

$id = $_GET['id'] ?? '';
if (!preg_match('/^[a-f0-9]{32}$/', $id)) { http_response_code(404); exit('Comprobante no encontrado.'); }
if (!web_rate_limit('ver', 120, 3600)) { http_response_code(429); exit('Demasiadas solicitudes.'); }

$types = ['jpg' => 'image/jpeg', 'png' => 'image/png', 'webp' => 'image/webp', 'heic' => 'image/heic', 'heif' => 'image/heif', 'pdf' => 'application/pdf'];
$dir = web_dir('comprobantes');
foreach ($types as $ext => $mime) {
    $file = $dir . '/' . $id . '.' . $ext;
    if (is_file($file)) {
        header('Content-Type: ' . $mime);
        header('Content-Length: ' . filesize($file));
        header('Content-Disposition: inline; filename="comprobante-' . substr($id, 0, 8) . '.' . $ext . '"');
        header('Cache-Control: private, max-age=86400');
        header('X-Robots-Tag: noindex, nofollow');
        header('X-Content-Type-Options: nosniff');
        header("Content-Security-Policy: default-src 'none'; img-src 'self'; style-src 'unsafe-inline'");
        readfile($file);
        exit;
    }
}
http_response_code(404);
echo 'Comprobante no encontrado o ya vencido (se guardan 60 días).';
