<?php
/**
 * Конфигурация приложения NGB
 */
return [
    'application' => [
        'directory' => __DIR__ . '/../',
        'dispatcher' => [
            'catchException' => true,
            'throwException' => true,
        ],
        'modules' => 'Index,Api,Admin',
        'bootstrap' => APP_ROOT . '/Bootstrap.php',
    ],
    'database' => [
        'adapter' => 'PDO_MYSQL',
        'params' => [
            'host' => getenv('DB_HOST') ?: 'localhost',
            'username' => getenv('DB_USER') ?: 'ngb_user',
            'password' => getenv('DB_PASSWORD') ?: 'secret',
            'dbname' => getenv('DB_NAME') ?: 'ngb_app',
            'charset' => 'utf8mb4',
            'port' => getenv('DB_PORT') ?: 3306,
        ],
    ],
    'redis' => [
        'host' => getenv('REDIS_HOST') ?: '127.0.0.1',
        'port' => getenv('REDIS_PORT') ?: 6379,
        'auth' => getenv('REDIS_PASSWORD') ?: null,
        'db' => getenv('REDIS_DB') ?: 0,
    ],
    'telegram' => [
        'bot_token' => getenv('TG_BOT_TOKEN'),
        'webhook_url' => getenv('TG_WEBHOOK_URL'),
        'app_url' => getenv('TG_APP_URL'),
    ],
    'ton' => [
        'api_key' => getenv('TON_API_KEY'),
        'api_url' => 'https://api.ton.org/v1/',
    ],
    'app' => [
        'timezone' => 'Europe/Moscow',
        'bet_close_time' => '19:00',
        'result_time' => '03:00',
        'notification_time' => '03:05',
        'donation_window_start' => '19:01',
        'donation_window_end' => '21:55',
        'late_bet_time' => '22:00',
    ],
];