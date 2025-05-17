<?php
namespace Controllers\Api;

use Services\PriceService;

/**
 * Контроллер для работы с ценами TON
 */
class PricesController extends BaseApiController
{
    /**
     * Обработка запросов по ценам
     */
    public function indexAction()
    {
        $method = $this->getRequest()->getParam('method');
        
        switch ($method) {
            case 'current':
                return $this->getCurrentPrice();
            case 'history':
                return $this->getPriceHistory();
            case 'prediction':
                return $this->getPricePrediction();
            default:
                return $this->jsonError('Invalid method', 400);
        }
    }
    
    /**
     * Получение текущей цены TON
     */
    protected function getCurrentPrice()
    {
        $priceService = new PriceService();
        $price = $priceService->getCurrentPrice();
        
        return $this->jsonSuccess([
            'price' => $price,
            'timestamp' => time(),
            'currency' => 'USD'
        ]);
    }
    
    /**
     * Получение истории цен TON
     */
    protected function getPriceHistory()
    {
        $period = $this->getRequest()->getQuery('period', '24h');
        
        $validPeriods = ['1h', '24h', '7d', '30d'];
        if (!in_array($period, $validPeriods)) {
            return $this->jsonError('Invalid period', 400);
        }
        
        $priceService = new PriceService();
        $history = $priceService->getPriceHistory($period);
        
        return $this->jsonSuccess([
            'history' => $history,
            'period' => $period,
            'currency' => 'USD'
        ]);
    }
    
    /**
     * Получение прогноза цены TON
     */
    protected function getPricePrediction()
    {
        // Проверка аутентификации для доступа к прогнозам
        if (!$this->isAuthenticated()) {
            return $this->jsonError('Unauthorized', 401);
        }
        
        $priceService = new PriceService();
        $prediction = $priceService->getPricePrediction();
        
        return $this->jsonSuccess([
            'prediction' => $prediction,
            'timestamp' => time(),
            'currency' => 'USD'
        ]);
    }
}