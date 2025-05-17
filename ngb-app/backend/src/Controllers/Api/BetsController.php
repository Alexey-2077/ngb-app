<?php
namespace Controllers\Api;

use Models\Bet;
use Models\User;
use Services\PriceService;

/**
 * Контроллер для управления ставками
 */
class BetsController extends BaseApiController
{
    /**
     * Обработка запросов по ставкам
     */
    public function indexAction()
    {
        // Проверка аутентификации
        if (!$this->isAuthenticated()) {
            return $this->jsonError('Unauthorized', 401);
        }
        
        $method = $this->getRequest()->getParam('method');
        
        switch ($method) {
            case 'place':
                return $this->placeBet();
            case 'history':
                return $this->getBetHistory();
            case 'stats':
                return $this->getBetStats();
            default:
                return $this->jsonError('Invalid method', 400);
        }
    }
    
    /**
     * Размещение ставки
     */
    protected function placeBet()
    {
        $data = $this->getRequestData();
        $userId = $this->getUserId();
        
        // Проверка параметров
        if (!isset($data['direction']) || !isset($data['percentage'])) {
            return $this->jsonError('Direction and percentage are required', 400);
        }
        
        // Проверка валидности направления
        if ($data['direction'] !== 'up' && $data['direction'] !== 'down') {
            return $this->jsonError('Invalid direction', 400);
        }
        
        // Проверка валидности процента
        if (!in_array($data['percentage'], [25, 50, 100])) {
            return $this->jsonError('Invalid percentage', 400);
        }
        
        // Проверка времени для ставок
        $config = Yaf_Registry::get('config');
        $betCloseTime = $config->app->bet_close_time;
        $currentTime = date('H:i');
        
        if ($currentTime > $betCloseTime && !isset($data['donation'])) {
            // Проверяем, находимся ли мы в окне для пожертвований
            $donationStart = $config->app->donation_window_start;
            $donationEnd = $config->app->donation_window_end;
            $lateBetTime = $config->app->late_bet_time;
            
            if ($currentTime >= $donationStart && $currentTime <= $donationEnd) {
                return $this->jsonError('Betting is closed. You can make a donation to place a bet until ' . $lateBetTime, 403, [
                    'can_donate' => true,
                    'donation_end' => $lateBetTime
                ]);
            } else {
                return $this->jsonError('Betting is closed for today', 403);
            }
        }
        
        // Получаем текущий баланс пользователя
        $userModel = new User();
        $balance = $userModel->getBalance($userId);
        
        if (!$balance) {
            return $this->jsonError('User balance not found', 404);
        }
        
        $currentCrystals = $balance['crystals'];
        $betAmount = floor(($data['percentage'] / 100) * $currentCrystals);
        
        if ($betAmount <= 0) {
            return $this->jsonError('Insufficient crystals', 400);
        }
        
        // Получаем текущий курс TON
        $priceService = new PriceService();
        $tonPrice = $priceService->getCurrentPrice();
        
        // Начинаем транзакцию
        $db = Yaf_Registry::get('db');
        $db->beginTransaction();
        
        try {
            // Списываем кристаллы
            $userModel->updateBalance($userId, [
                'crystals' => $currentCrystals - $betAmount
            ]);
            
            // Создаем запись о ставке
            $betModel = new Bet();
            $betId = $betModel->create([
                'user_id' => $userId,
                'direction' => $data['direction'],
                'amount' => $betAmount,
                'price_at_bet' => $tonPrice,
                'created_at' => date('Y-m-d H:i:s'),
                'status' => 'pending',
                'is_donation' => isset($data['donation']) ? 1 : 0
            ]);
            
            // Если это пожертвование, записываем его
            if (isset($data['donation']) && $data['donation']) {
                $donationModel = new \Models\Donation();
                $donationModel->create([
                    'user_id' => $userId,
                    'bet_id' => $betId,
                    'amount' => $data['donation_amount'] ?? 0,
                    'created_at' => date('Y-m-d H:i:s')
                ]);
            }
            
            $db->commit();
            
            // Добавляем задачу в планировщик для проверки результата
            $scheduler = Yaf_Registry::get('scheduler');
            $scheduler->addTask('check_bet_result', [
                'bet_id' => $betId,
                'user_id' => $userId
            ], $config->app->result_time);
            
            return $this->jsonSuccess([
                'bet_id' => $betId,
                'direction' => $data['direction'],
                'amount' => $betAmount,
                'price_at_bet' => $tonPrice,
                'remaining_crystals' => $currentCrystals - $betAmount
            ]);
        } catch (\Exception $e) {
            $db->rollback();
            $logger = Yaf_Registry::get('logger');
            $logger->error('Failed to place bet: ' . $e->getMessage());
            return $this->jsonError('Failed to place bet', 500);
        }
    }
    
    /**
     * Получение истории ставок пользователя
     */
    protected function getBetHistory()
    {
        $userId = $this->getUserId();
        $limit = $this->getRequest()->getQuery('limit', 10);
        $offset = $this->getRequest()->getQuery('offset', 0);
        
        $betModel = new Bet();
        $bets = $betModel->getUserBets($userId, $limit, $offset);
        $total = $betModel->countUserBets($userId);
        
        return $this->jsonSuccess([
            'bets' => $bets,
            'pagination' => [
                'total' => $total,
                'limit' => $limit,
                'offset' => $offset
            ]
        ]);
    }
    
    /**
     * Получение статистики ставок пользователя
     */
    protected function getBetStats()
    {
        $userId = $this->getUserId();
        
        $betModel = new Bet();
        $stats = $betModel->getUserStats($userId);
        
        return $this->jsonSuccess($stats);
    }
}
