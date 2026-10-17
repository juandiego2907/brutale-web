<?php
/* Brutale Pizza · tasa oficial del dólar según el BCV (respaldo de la página cuando DolarApi no responde).
   Lee https://www.bcv.org.ve, guarda las tasas por "fecha valor" y devuelve la VIGENTE hoy
   (la última cuya fecha valor ya llegó), con caché de 1 hora.
   Respuesta: {"ok":true,"tasa":875.65,"fecha":"2026-10-09","fuente":"bcv.org.ve"} */
require __DIR__ . '/_comun.php';

date_default_timezone_set('America/Caracas');
$cacheFile = web_dir('cache') . '/tasa-bcv.json';
$cache = is_file($cacheFile) ? (json_decode((string) file_get_contents($cacheFile), true) ?: []) : [];
$history = $cache['historial'] ?? [];          // ["2026-10-09" => 875.65, ...]

if (empty($cache['leido']) || time() - $cache['leido'] > 3600) {
    $html = false;
    if (function_exists('curl_init')) {
        $ch = curl_init('https://www.bcv.org.ve/');
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_TIMEOUT => 12,
            CURLOPT_USERAGENT => 'Mozilla/5.0 (RestauranteWeb tasa BCV)',
            // El certificado del BCV suele venir incompleto; el dato es público y solo se lee.
            CURLOPT_SSL_VERIFYPEER => false,
            CURLOPT_SSL_VERIFYHOST => 0,
        ]);
        $html = curl_exec($ch);
        curl_close($ch);
    }
    if (is_string($html) && preg_match('/id="dolar".*?<strong[^>]*>\s*([\d.,]+)\s*<\/strong>/s', $html, $m)) {
        $rate = (float) str_replace(',', '.', str_replace('.', '', $m[1]));
        $date = preg_match('/Fecha Valor:.*?content="(\d{4}-\d{2}-\d{2})/s', $html, $d) ? $d[1] : date('Y-m-d');
        if ($rate > 0) {
            $history[$date] = $rate;
            ksort($history);
            $history = array_slice($history, -15, null, true);
        }
    }
    $cache = ['leido' => time(), 'historial' => $history];
    @file_put_contents($cacheFile, json_encode($cache), LOCK_EX);
}

if (!$history) { web_json(['ok' => false, 'error' => 'sin_tasa'], 503); }

// La vigente: la última con fecha valor <= hoy. Si todas son futuras, la más antigua disponible.
$today = date('Y-m-d');
$valid = array_filter($history, function ($d) use ($today) { return $d <= $today; }, ARRAY_FILTER_USE_KEY);
$pick = $valid ?: $history;
$keys = array_keys($pick);
$fecha = $valid ? end($keys) : reset($keys);

header('Access-Control-Allow-Origin: *');
web_json(['ok' => true, 'tasa' => $pick[$fecha], 'fecha' => $fecha, 'fuente' => 'bcv.org.ve']);
