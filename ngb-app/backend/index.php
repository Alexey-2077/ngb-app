<?php
/**
 * NGB App Backend
 * Основной файл бэкенда для Telegram WebApp проекта NGB
 * 
 * @version 1.0.0
 */

// Настройка окружения
ini_set('display_errors', 0);
error_reporting(E_ALL);
date_default_timezone_set('Europe/Moscow');

// Определение констант
define('APP_ROOT', __DIR__);
define('CONFIG_PATH', APP_ROOT . '/config');
define('LOG_PATH', APP_ROOT . '/logs');
define('CACHE_PATH', APP_ROOT . '/cache');

// Автозагрузка классов
spl_autoload_register(function ($class) {
    $file = APP_ROOT . '/src/' . str_replace('\\', '/', $class) . '.php';
    if (file_exists($file)) {
        require $file;
    }
});

// Загрузка конфигурации
$config = require CONFIG_PATH . '/config.php';

// Инициализация приложения
$app = new Yaf_Application($config);
$app->bootstrap()->run();


