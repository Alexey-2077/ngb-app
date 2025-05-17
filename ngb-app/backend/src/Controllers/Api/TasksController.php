<?php
namespace Controllers\Api;

use Models\Task;
use Models\User;

/**
 * Контроллер для управления заданиями
 */
class TasksController extends BaseApiController
{
    /**
     * Обработка запросов по заданиям
     */
    public function indexAction()
    {
        // Проверка аутентификации
        if (!$this->isAuthenticated()) {
            return $this->jsonError('Unauthorized', 401);
        }
        
        $method = $this->getRequest()->getParam('method');
        
        switch ($method) {
            case 'list':
                return $this->getTasksList();
            case 'complete':
                return $this->completeTask();
            case 'progress':
                return $this->getTaskProgress();
            default:
                return $this->jsonError('Invalid method', 400);
        }
    }
    
    /**
     * Получение списка заданий
     */
    protected function getTasksList()
    {
        $userId = $this->getUserId();
        $type = $this->getRequest()->getQuery('type', 'all');
        
        $taskModel = new Task();
        
        if ($type === 'daily') {
            $tasks = $taskModel->getDailyTasks($userId);
        } elseif ($type === 'regular') {
            $tasks = $taskModel->getRegularTasks($userId);
        } else {
            $daily = $taskModel->getDailyTasks($userId);
            $regular = $taskModel->getRegularTasks($userId);
            $tasks = [
                'daily' => $daily,
                'regular' => $regular
            ];
        }
        
        return $this->jsonSuccess(['tasks' => $tasks]);
    }
    
    /**
     * Выполнение задания
     */
    protected function completeTask()
    {
        $userId = $this->getUserId();
        $data = $this->getRequestData();
        
        if (!isset($data['task_id'])) {
            return $this->jsonError('Task ID is required', 400);
        }
        
        $taskId = $data['task_id'];
        
        // Проверяем существование задания
        $taskModel = new Task();
        $task = $taskModel->findById($taskId);
        
        if (!$task) {
            return $this->jsonError('Task not found', 404);
        }
        
        // Проверяем, не выполнено ли уже задание
        $userTaskModel = new \Models\UserTask();
        $userTask = $userTaskModel->findByUserAndTask($userId, $taskId);
        
        if ($userTask && $userTask['completed']) {
            return $this->jsonError('Task already completed', 400);
        }
        
        // Начинаем транзакцию
        $db = Yaf_Registry::get('db');
        $db->beginTransaction();
        
        try {
            // Отмечаем задание как выполненное
            if ($userTask) {
                $userTaskModel->update($userTask['id'], [
                    'completed' => 1,
                    'completed_at' => date('Y-m-d H:i:s')
                ]);
            } else {
                $userTaskModel->create([
                    'user_id' => $userId,
                    'task_id' => $taskId,
                    'completed' => 1,
                    'completed_at' => date('Y-m-d H:i:s')
                ]);
            }
            
            // Начисляем награду пользователю
            $userModel = new \Models\User();
            $user = $userModel->findById($userId);
            
            if (!$user) {
                throw new \Exception('User not found');
            }
            
            // Обновляем баланс пользователя
            $userModel->update($userId, [
                'crystals' => $user['crystals'] + $task['reward'],
                'xp' => $user['xp'] + ($task['xp_reward'] ?? 0)
            ]);
            
            $db->commit();
            
            return $this->jsonSuccess([
                'message' => 'Task completed',
                'reward' => $task['reward'],
                'xp_reward' => $task['xp_reward'] ?? 0
            ]);
        } catch (\Exception $e) {
            $db->rollback();
            $logger = Yaf_Registry::get('logger');
            $logger->error('Failed to complete task: ' . $e->getMessage());
            return $this->jsonError('Failed to complete task', 500);
        }
    }
}
