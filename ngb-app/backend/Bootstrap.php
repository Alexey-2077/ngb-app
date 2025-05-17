<?php
/**
 * Bootstrap класс для инициализации приложения
 */
class Bootstrap extends Yaf_Bootstrap_Abstract
{
    /**
     * Инициализация конфигурации
     */
    public function _initConfig(Yaf_Dispatcher $dispatcher)
    {
        $config = Yaf_Application::app()->getConfig();
        Yaf_Registry::set('config', $config);
    }

    /**
     * Инициализация логгера
     */
    public function _initLogger(Yaf_Dispatcher $dispatcher)
    {
        $logger = new Logger\FileLogger(LOG_PATH . '/app.log');
        Yaf_Registry::set('logger', $logger);
    }

    /**
     * Инициализация соединения с базой данных
     */
    public function _initDatabase(Yaf_Dispatcher $dispatcher)
    {
        $config = Yaf_Registry::get('config');
        $dbConfig = $config->database->params->toArray();
        
        try {
            $db = new Database\MySQLAdapter($dbConfig);
            Yaf_Registry::set('db', $db);
        } catch (Exception $e) {
            $logger = Yaf_Registry::get('logger');
            $logger->error('Database connection error: ' . $e->getMessage());
            throw new Exception('Database connection failed');
        }
    }

    /**
     * Инициализация Redis для кэширования
     */
    public function _initRedis(Yaf_Dispatcher $dispatcher)
    {
        $config = Yaf_Registry::get('config');
        $redisConfig = $config->redis->toArray();
        
        try {
            $redis = new Redis();
            $redis->connect($redisConfig['host'], $redisConfig['port']);
            
            if (!empty($redisConfig['auth'])) {
                $redis->auth($redisConfig['auth']);
            }
            
            if (isset($redisConfig['db'])) {
                $redis->select($redisConfig['db']);
            }
            
            Yaf_Registry::set('redis', $redis);
        } catch (Exception $e) {
            $logger = Yaf_Registry::get('logger');
            $logger->warning('Redis connection error: ' . $e->getMessage());
            // Продолжаем работу без Redis
        }
    }

    /**
     * Инициализация Telegram клиента
     */
    public function _initTelegram(Yaf_Dispatcher $dispatcher)
    {
        $config = Yaf_Registry::get('config');
        $telegramConfig = $config->telegram->toArray();
        
        $telegram = new Services\TelegramService($telegramConfig['bot_token']);
        Yaf_Registry::set('telegram', $telegram);
    }

    /**
     * Инициализация планировщика задач
     */
    public function _initScheduler(Yaf_Dispatcher $dispatcher)
    {
        $scheduler = new Services\SchedulerService();
        Yaf_Registry::set('scheduler', $scheduler);
    }

    /**
     * Инициализация плагинов
     */
    public function _initPlugins(Yaf_Dispatcher $dispatcher)
    {
        // Регистрация плагина для аутентификации
        $dispatcher->registerPlugin(new Plugins\AuthPlugin());
        
        // Регистрация плагина для CORS
        $dispatcher->registerPlugin(new Plugins\CorsPlugin());
        
        // Регистрация плагина для логирования запросов
        $dispatcher->registerPlugin(new Plugins\LoggerPlugin());
    }

    /**
     * Инициализация маршрутов
     */
    public function _initRoute(Yaf_Dispatcher $dispatcher)
    {
        $router = $dispatcher->getRouter();
        
        // API маршруты
        $router->addRoute('api_auth', new Yaf_Route_Regex(
            '#^/api/auth/([^/]+)#',
            ['module' => 'Api', 'controller' => 'Auth', 'action' => 'index'],
            [1 => 'method']
        ));
        
        $router->addRoute('api_users', new Yaf_Route_Regex(
            '#^/api/users/([^/]+)#',
            ['module' => 'Api', 'controller' => 'Users', 'action' => 'index'],
            [1 => 'method']
        ));
        
        $router->addRoute('api_bets', new Yaf_Route_Regex(
            '#^/api/bets/([^/]+)#',
            ['module' => 'Api', 'controller' => 'Bets', 'action' => 'index'],
            [1 => 'method']
        ));
        
        $router->addRoute('api_tasks', new Yaf_Route_Regex(
            '#^/api/tasks/([^/]+)#',
            ['module' => 'Api', 'controller' => 'Tasks', 'action' => 'index'],
            [1 => 'method']
        ));
        
        $router->addRoute('api_prices', new Yaf_Route_Regex(
            '#^/api/prices/([^/]+)#',
            ['module' => 'Api', 'controller' => 'Prices', 'action' => 'index'],
            [1 => 'method']
        ));
        
        $router->addRoute('api_donations', new Yaf_Route_Regex(
            '#^/api/donations/([^/]+)#',
            ['module' => 'Api', 'controller' => 'Donations', 'action' => 'index'],
            [1 => 'method']
        ));
        
        // Webhook для Telegram
        $router->addRoute('telegram_webhook', new Yaf_Route_Static(
            '/webhook/telegram',
            ['module' => 'Api', 'controller' => 'Webhook', 'action' => 'telegram']
        ));
    }
}