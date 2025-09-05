<?php
// Set headers for JSON response and CORS
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// API configuration - using free exchangerate-api.com
$baseUrl = 'https://api.exchangerate-api.com/v4/latest/';

// Make API request to exchangerate-api.com using cURL
function makeApiRequest($baseCurrency) {
    global $baseUrl;
    
    $url = $baseUrl . $baseCurrency;
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    curl_setopt($ch, CURLOPT_USERAGENT, 'CurrencyConverter/1.0');
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);
    
    if ($response === false || !empty($error)) {
        throw new Exception('API request failed: ' . $error);
    }
    
    if ($httpCode !== 200) {
        throw new Exception('API returned HTTP ' . $httpCode);
    }
    
    $data = json_decode($response, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception('Invalid JSON response');
    }
    
    return $data;
}

// Send JSON response to client
function sendResponse($success, $data = null, $error = null) {
    $response = [
        'success' => $success,
        'timestamp' => date('Y-m-d H:i:s')
    ];
    
    if ($success && $data !== null) {
        $response = array_merge($response, $data);
    }
    
    if ($error) {
        $response['error'] = $error;
    }
    
    echo json_encode($response, JSON_UNESCAPED_UNICODE);
    exit;
}

try {
    $action = $_GET['action'] ?? '';
    
    // Handle different API actions
    switch ($action) {
        case 'test':
            // Test API connection
            sendResponse(true, [
                'message' => 'API is working',
                'php_version' => PHP_VERSION,
                'curl_available' => function_exists('curl_init'),
                'timestamp' => date('Y-m-d H:i:s')
            ]);
            break;
            
        case 'getRates':
            // Fetch latest exchange rates
            $response = makeApiRequest('TRY');
            
            if (!isset($response['rates'])) {
                sendResponse(false, null, 'Invalid API response');
            }
            
            // Filter only the currencies we need
            $neededCurrencies = ['USD', 'EUR', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD'];
            $filteredRates = [];
            foreach ($neededCurrencies as $currency) {
                if (isset($response['rates'][$currency])) {
                    $filteredRates[$currency] = $response['rates'][$currency];
                }
            }
            
            sendResponse(true, [
                'rates' => $filteredRates,
                'date' => $response['date'],
                'base' => $response['base']
            ]);
            break;
            
        case 'convert':
            // Handle currency conversion
            $from = $_GET['from'] ?? '';
            $to = $_GET['to'] ?? '';
            $amount = floatval($_GET['amount'] ?? 0);
            
            if (empty($from) || empty($to) || $amount <= 0) {
                sendResponse(false, null, 'Invalid parameters');
            }
            
            if ($from === $to) {
                sendResponse(true, [
                    'result' => $amount,
                    'rate' => 1
                ]);
            }
            
            $response = makeApiRequest($from);
            
            if (!isset($response['rates'][$to])) {
                sendResponse(false, null, 'Currency not found');
            }
            
            $rate = $response['rates'][$to];
            $result = $amount * $rate;
            
            sendResponse(true, [
                'result' => $result,
                'rate' => $rate,
                'from' => $from,
                'to' => $to,
                'amount' => $amount
            ]);
            break;
            
        default:
            sendResponse(false, null, 'Invalid operation');
    }
    
} catch (Exception $e) {
    sendResponse(false, null, $e->getMessage());
}
?>
