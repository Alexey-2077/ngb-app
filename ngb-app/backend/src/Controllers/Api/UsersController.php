<?php
namespace Controllers\Api;

use Models\User;
use Models\Referral;

/**
 * Контроллер для управления пользователями
 */
class UsersController extends BaseApiController
{
    /**
     * Обработка запросов по пользователям
     */
    public function indexAction()
    {
        // Проверка аутентификации
        if (!$this->isAuthenticated()) {
            return $this->jsonError('Unauthorized', 401);
        }
        
        $method = $this->getRequest()->getParam('method');
        
        switch ($method) {
            case 'profile':
                return $this->getProfile();
            case 'update':
                return $this->updateProfile();
            case 'balance':
                return $this->getBalance();
            case 'referrals':
                return $this->getReferrals();
            case 'add_referral':
                return $this->addReferral();
            default:
                return $this->jsonError('Invalid method', 400);
        }
    }
    
    /**
     * Получение профиля пользователя
     */
    protected function getProfile()
    {
        $userId = $this->getUserId();
        
        $userModel = new User();
        $user = $userModel->findById($userId);
        
        if (!$user) {
            return $this->jsonError('User not found', 404);
        }
        
        // Получаем баланс пользователя
        $balance = $userModel->getBalance($userId);
        
        // Формируем ответ
        $response = [
            'id' => $user['id'],
            'telegram_id' => $user['telegram_id'],
            'username' => $user['username'],
            'first_name' => $user['first_name'],
            'last_name' => $user['last_name'],
            'photo_url' => $user['photo_url'],
            'is_premium' => (bool)$user['is_premium'],
            'created_at' => $user['created_at'],
            'last_login' => $user['last_login'],
            'balance' => $balance
        ];
        
        return $this->jsonSuccess($response);
    }
    
    /**
     * Обновление профиля пользователя
     */
    protected function updateProfile()
    {
        $userId = $this->getUserId();
        $data = $this->getRequestData();
        
        // Разрешаем обновлять только определенные поля
        $allowedFields = ['username', 'first_name', 'last_name', 'photo_url'];
        $updateData = array_intersect_key($data, array_flip($allowedFields));
        
        if (empty($updateData)) {
            return $this->jsonError('No valid fields to update', 400);
        }
        
        $userModel = new User();
        $result = $userModel->update($userId, $updateData);
        
        if (!$result) {
            return $this->jsonError('Failed to update profile', 500);
        }
        
        return $this->jsonSuccess(['updated' => true]);
    }
    
    /**
     * Получение баланса пользователя
     */
    protected function getBalance()
    {
        $userId = $this->getUserId();
        
        $userModel = new User();
        $balance = $userModel->getBalance($userId);
        
        if (!$balance) {
            return $this->jsonError('Balance not found', 404);
        }
        
        return $this->jsonSuccess($balance);
    }
    
    /**
     * Получение рефералов пользователя
     */
    protected function getReferrals()
    {
        $userId = $this->getUserId();
        
        $referralModel = new Referral();
        $referrals = $referralModel->getUserReferrals($userId);
        $stats = $referralModel->getUserReferralStats($userId);
        
        return $this->jsonSuccess([
            'referrals' => $referrals,
            'stats' => $stats
        ]);
    }
    
    /**
     * Добавление реферала
     */
    protected function addReferral()
    {
        $userId = $this->getUserId();
        $data = $this->getRequestData();
        
        if (!isset($data['referral_code'])) {
            return $this->jsonError('Referral code is required', 400);
        }
        
        // Декодируем реферальный код
        $referralCode = $data['referral_code'];
        try {
            $referrerId = base64_decode(str_pad(strtr($referralCode, '-_', '+/'), strlen($referralCode) % 4, '=', STR_PAD_RIGHT));
        } catch (\Exception $e) {
            return $this->jsonError('Invalid referral code', 400);
        }
        
        // Проверяем, что пользователь не добавляет сам себя
        if ($referrerId == $userId) {
            return $this->jsonError('Cannot add yourself as referral', 400);
        }
        
        // Проверяем существование реферера
        $userModel = new User();
        $referer = $userModel->findById($referrerId);
        
        if (!$referer) {
            return $this->jsonError('Referrer not found', 404);
        }
        
        // Добавляем реферала
        $referralModel = new Referral();
        $result = $referralModel->addReferral($referrerId, $userId);
        
        if (!$result) {
            return $this->jsonError('Failed to add referral', 500);
        }
        
        // Начисляем бонусы обоим пользователям
        $config = Yaf_Registry::get('config');
        $referrerBonus = $config->app->referrer_bonus ?? 100;
        $referralBonus = $config->app->referral_bonus ?? 50;
        
        $userModel->updateBalance($referrerId, [
            'xp' => ['increment' => $referrerBonus]
        ]);
        
        $userModel->updateBalance($userId, [
            'xp' => ['increment' => $referralBonus]
        ]);
        
        return $this->jsonSuccess([
            'success' => true,
            'referrer' => [
                'id' => $referer['id'],
                'username' => $referer['username'],
                'bonus_received' => $referrerBonus
            ],
            'bonus_received' => $referralBonus
        ]);
    }
}