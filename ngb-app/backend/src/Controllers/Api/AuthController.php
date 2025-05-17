<?php
namespace Controllers\Api;

use Models\User;
use Services\TelegramService;
use Services\JwtService;

/**
 * Контроллер для аутентификации пользователей
 */
class AuthController extends BaseApiController
{
    /**
     * Обработка запросов аутентификации
     */
    public function indexAction()
    {
        $method = $this->getRequest()->getParam('method');
        
        switch ($method) {
            case 'telegram':
                return $this->telegramAuth();
            case 'verify':
                return $this->verifyToken();
            default:
                return $this->jsonError('Invalid authentication method', 400);
        }
    }
    
    /**
     * Аутентификация через Telegram
     */
    protected function telegramAuth()
    {
        $data = $this->getRequestData();
        
        if (!isset($data['id'], $data['first_name'], $data['auth_date'], $data['hash'])) {
            return $this->jsonError('Invalid authentication data', 400);
        }
        
        // Проверка данных от Telegram
        $telegramService = new TelegramService(Yaf_Registry::get('config')->telegram->bot_token);
        if (!$telegramService->checkTelegramAuthorization($data)) {
            return $this->jsonError('Invalid authentication data', 400);
        }
        
        // Получаем или создаем пользователя
        $userModel = new User();
        $user = $userModel->findByTelegramId($data['id']);
        
        if (!$user) {
            // Создаем нового пользователя
            $userData = [
                'telegram_id' => $data['id'],
                'username' => $data['username'] ?? null,
                'first_name' => $data['first_name'],
                'last_name' => $data['last_name'] ?? null,
                'photo_url' => $data['photo_url'] ?? null,
                'is_premium' => !empty($data['is_premium']),
                'created_at' => date('Y-m-d H:i:s'),
            ];
            
            $userId = $userModel->create($userData);
            
            if (!$userId) {
                return $this->jsonError('Failed to create user', 500);
            }
            
            // Инициализируем баланс пользователя
            $userModel->initializeBalance($userId, 1000, 500, 0);
            
            $user = $userModel->findById($userId);
        } else {
            // Обновляем информацию о пользователе
            $userData = [
                'username' => $data['username'] ?? $user['username'],
                'first_name' => $data['first_name'],
                'last_name' => $data['last_name'] ?? $user['last_name'],
                'photo_url' => $data['photo_url'] ?? $user['photo_url'],
                'is_premium' => !empty($data['is_premium']),
                'last_login' => date('Y-m-d H:i:s'),
            ];
            
            $userModel->update($user['id'], $userData);
        }
        
        // Создаем JWT токен
        $jwtService = new JwtService();
        $token = $jwtService->generateToken([
            'id' => $user['id'],
            'telegram_id' => $user['telegram_id'],
            'username' => $user['username'],
        ]);
        
        // Сохраняем токен в Redis для быстрой проверки
        $redis = Yaf_Registry::get('redis');
        $redis->setex('auth:' . $user['id'], 86400, $token);
        
        return $this->jsonSuccess([
            'token' => $token,
            'user' => [
                'id' => $user['id'],
                'telegram_id' => $user['telegram_id'],
                'username' => $user['username'],
                'first_name' => $user['first_name'],
                'photo_url' => $user['photo_url'],
                'is_premium' => (bool)$user['is_premium'],
            ],
        ]);
    }
    
    /**
     * Проверка JWT токена
     */
    protected function verifyToken()
    {
        $data = $this->getRequestData();
        
        if (!isset($data['token'])) {
            return $this->jsonError('Token is required', 400);
        }
        
        $jwtService = new JwtService();
        $payload = $jwtService->verifyToken($data['token']);
        
        if (!$payload) {
            return $this->jsonError('Invalid token', 401);
        }
        
        // Проверяем, существует ли токен в Redis
        $redis = Yaf_Registry::get('redis');
        $storedToken = $redis->get('auth:' . $payload['id']);
        
        if (!$storedToken || $storedToken !== $data['token']) {
            return $this->jsonError('Token expired or revoked', 401);
        }
        
        return $this->jsonSuccess(['valid' => true]);
    }
}