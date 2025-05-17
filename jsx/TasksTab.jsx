const { useCallback } = React;

function TasksTab({ user, setUser, dailyTasks, regularTasks, setNotification, onGoHome }) {
  return (
    <div className="p-4 text-center">
      <h2 className="text-xl mb-4">Задания</h2>
      <p className="mb-6">Раздел заданий находится в разработке</p>
      <button 
        className="blob-btn"
        style={{
          width: '100%',
          maxWidth: 340,
          minWidth: 180,
          padding: '16px 0',
          fontSize: '1.1rem',
          fontWeight: 600,
          borderRadius: '32px',
          background: '#23232a',
          color: '#f3f4f6',
          border: '2px solid #333',
          outline: 'none',
          boxShadow: '0 2px 8px #0004',
          margin: '0 auto',
          display: 'block',
          position: 'relative',
          transition: 'all 0.2s',
        }}
        onClick={onGoHome}
      >
        Вернуться на главную
      </button>
    </div>
  );
}

window.TasksTab = TasksTab; 