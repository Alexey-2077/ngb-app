const { useState, useEffect } = React;

function FrensTab({ user }) {
  const [tab, setTab] = useState('tasks');
  const [show, setShow] = useState(false);
  const [completed, setCompleted] = useState([]);
  useEffect(() => { setShow(true); }, []);

  const tasks = [
    { id: 3, label: 'Пригласить 3 друзей', reward: 50 },
    { id: 5, label: 'Пригласить 5 друзей', reward: 100 },
    { id: 10, label: 'Пригласить 10 друзей', reward: 150 }
  ];
  const totalTickets = user?.tickets ?? 2271;
  const myFriends = user?.referrals?.length ?? 40;
  const totalEarned = 4598;

  const handleComplete = (id) => {
    setCompleted(prev => [...prev, id]);
  };

  // Определяем, является ли устройство мобильным
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 480);
  
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 480);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-2">
      <div className="frens-main">
        {/* Top bar */}
        <div className="frens-top">
          <div className="frens-tickets">
            <span className="frens-ticket-icon"></span>
            <span className="frens-ticket-count">{totalTickets}</span>
          </div>
          <button className="frens-copy-btn" title="Скопировать" aria-label="Скопировать ссылку">
            <svg width="22" height="22" fill="none" stroke="#fff" strokeWidth="2"><rect x="5" y="5" width="12" height="12" rx="3"/><path d="M9 1h8a2 2 0 0 1 2 2v8"/></svg>
          </button>
        </div>
        <div className="frens-title">Увеличь свои тикеты!</div>
        <div className="frens-subtitle">Приглашай друзей и выполняй задания, чтобы получать больше тикетов</div>
        {/* Tabs */}
        <div className="frens-tabs">
          <button 
            className={tab === 'tasks' ? 'active' : ''} 
            onClick={() => setTab('tasks')}
            style={{ touchAction: 'manipulation' }}
          >
            Задания
          </button>
          <button 
            className={tab === 'friends' ? 'active' : ''} 
            onClick={() => setTab('friends')}
            style={{ touchAction: 'manipulation' }}
          >
            Друзья
          </button>
        </div>
        {/* Tab content с оптимизированной анимацией */}
        <div className={`tab-content ${show ? 'show' : ''}`} style={{ opacity: show ? 1 : 0, transition: 'opacity 0.3s' }}>
          {tab === 'tasks' ? (
            <div className="frens-card">
              <div className="frens-card-title">Ограниченные задания</div>
              {tasks.map((t, idx) => {
                const isDone = completed.includes(t.id);
                return (
                  <div 
                    className="frens-task-row" 
                    key={t.id} 
                    style={{ 
                      animation: `fadeIn 0.3s ${idx * 0.1}s both`,
                      opacity: isDone ? 0.7 : 1,
                    }}
                  >
                    <div className="frens-task-left">
                      <div className="frens-task-icon-bg">
                        <span className="frens-task-icon"></span>
                      </div>
                      <span className="frens-task-label">{t.label}</span>
                    </div>
                    <div className="frens-task-right">
                      {isDone ? (
                        <span className="frens-task-done">Выполнено</span>
                      ) : (
                        <span className="frens-task-reward">
                          {t.reward} <span className="frens-task-reward-icon"></span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <>
              <div className="frens-card frens-how-card">
                <div className="frens-card-title">Как это работает</div>
                <div className="frens-how-list">
                  <div className="frens-how-row">
                    <span className="frens-how-num">1</span>
                    <span>5 тикетов <span className="frens-task-reward-icon"></span> за приглашённого друга</span>
                  </div>
                  <div className="frens-how-row">
                    <span className="frens-how-num">2</span>
                    <span>15 тикетов <span className="frens-task-reward-icon"></span> за друга с <b>Telegram Premium</b></span>
                  </div>
                  <div className="frens-how-row">
                    <span className="frens-how-num">3</span>
                    <span>2% бонуса <span className="frens-task-reward-icon"></span> от фарминга приглашённых</span>
                  </div>
                </div>
              </div>
              <div className="frens-card frens-card-stats">
                <div className="frens-stats-row">
                  <span>Мои друзья</span>
                  <span className="frens-stats-value">{myFriends}</span>
                </div>
                <div className="frens-stats-row">
                  <span>Всего заработано</span>
                  <span className="frens-stats-value">{totalEarned}</span>
                </div>
              </div>
              <button 
                className="frens-invite-btn" 
                style={{ touchAction: 'manipulation' }}
              >
                Пригласить друзей
              </button>
            </>
          )}
        </div>
      </div>
      <style>{`
.frens-bg { min-height: 100vh; background: #111; display: flex; justify-content: center; align-items: flex-start; }
.frens-main { width: 100%; max-width: 420px; margin: 0 auto; padding: 0 0 32px 0; }
.frens-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px; margin-top: 18px; }
.frens-tickets { display: flex; align-items: center; background: #23232a; color: #fff; border-radius: 14px; padding: 7px 18px; font-size: 18px; font-weight: 700; box-shadow: 0 2px 8px #0002; }
.frens-ticket-icon { display: inline-block; width: 20px; height: 20px; background: #fff; border-radius: 50%; margin-right: 8px; }
.frens-ticket-count { font-weight: 800; }
.frens-copy-btn { width: 40px; height: 40px; background: #23232a; border-radius: 12px; border: none; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 2px 8px #0002; transition: background 0.2s; }
.frens-copy-btn:hover { background: #2a2a32; }
.frens-title { font-size: 26px; font-weight: 900; margin-bottom: 2px; letter-spacing: -1px; color: #fff; }
.frens-subtitle { color: #bbb; font-size: 16px; margin-bottom: 22px; font-weight: 500; }
.frens-tabs { display: flex; background: #18181b; border-radius: 16px; margin-bottom: 22px; overflow: hidden; }
.frens-tabs button { flex: 1; padding: 13px 0; background: none; border: none; color: #bbb; font-size: 17px; font-weight: 700; border-radius: 16px; transition: background 0.2s, color 0.2s, box-shadow 0.2s; position: relative; z-index: 1; outline: none; -webkit-tap-highlight-color: transparent; }
.frens-tabs button.active { background: #23232a; color: #fff; box-shadow: 0 2px 8px #0002; z-index: 2; }
.frens-card { background: #23232a; border-radius: 20px; padding: 18px 22px 12px 22px; margin-bottom: 22px; box-shadow: 0 2px 8px #0002; border: 1px solid #333; }
.frens-card-title { color: #bbb; font-size: 16px; font-weight: 700; margin-bottom: 16px; }
.frens-task-row { display: flex; justify-content: space-between; align-items: center; background: #18181b; border-radius: 16px; padding: 10px 16px; margin-bottom: 14px; border: 1px solid #333; }
.frens-task-left { display: flex; align-items: center; }
.frens-task-icon-bg { width: 32px; height: 32px; background: #23232a; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 12px; }
.frens-task-icon { display: inline-block; width: 16px; height: 16px; background: #fff; border-radius: 50%; }
.frens-task-label { color: #fff; font-weight: 600; font-size: 16px; }
.frens-task-right { display: flex; align-items: center; }
.frens-task-reward { color: #fff; font-weight: 700; font-size: 16px; display: flex; align-items: center; }
.frens-task-reward-icon { display: inline-block; width: 14px; height: 14px; background: #fff; border-radius: 50%; margin-left: 6px; }
.frens-task-done { background: #18181b; color: #bbb; font-weight: 600; font-size: 14px; padding: 6px 12px; border-radius: 12px; min-width: 90px; text-align: center; border: 1px solid #333; }
.frens-how-card { padding-bottom: 8px; }
.frens-how-list { display: flex; flex-direction: column; gap: 12px; }
.frens-how-row { display: flex; align-items: center; margin-bottom: 12px; font-size: 16px; color: #fff; font-weight: 600; }
.frens-how-num { width: 28px; height: 28px; background: #23232a; color: #fff; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 800; margin-right: 14px; font-size: 16px; box-shadow: 0 1px 4px #0001; }
.frens-card-stats { padding-bottom: 8px; }
.frens-stats-row { display: flex; align-items: center; justify-content: space-between; font-size: 16px; margin-bottom: 10px; color: #fff; font-weight: 700; }
.frens-stats-icon { font-size: 18px; margin-right: 8px; }
.frens-stats-value { font-size: 18px; font-weight: 900; color: #fff; margin-left: 8px; }
.frens-invite-btn { 
  width: 100%; 
  background: #23232a; 
  color: #fff; 
  font-weight: 800; 
  font-size: 18px; 
  border-radius: 16px; 
  padding: 16px 0; 
  border: 2px solid #444; 
  margin-top: 18px; 
  box-shadow: 0 2px 8px #0001; 
  transition: background 0.2s, color 0.2s, transform 0.1s; 
  -webkit-tap-highlight-color: transparent;
}
.frens-invite-btn:active { background: #18181b; color: #fff; transform: scale(0.97);}

/* Оптимизированные стили для мобильных устройств */
@media (max-width: 480px) {
  .frens-bg { align-items: stretch; overscroll-behavior: contain; }
  .frens-main { max-width: 100vw; padding: 0 0 24px 0; }
  .frens-card { 
    padding: 12px 3vw 6px 3vw; 
    margin-bottom: 14px; 
    box-shadow: none; 
    border-width: 1px;
    border-radius: 18px;
  }
  .frens-title { font-size: 18px; margin-bottom: 2px; }
  .frens-subtitle { font-size: 13px; margin-bottom: 14px; }
  .frens-card-title { font-size: 14px; margin-bottom: 10px; }
  .frens-task-label, .frens-how-row { font-size: 12px; }
  .frens-task-row { 
    padding: 8px 3vw; 
    margin-bottom: 10px; 
    border-radius: 14px; 
    border-width: 1px;
    animation-duration: 0.3s;
  }
  .frens-task-icon-bg { width: 26px; height: 26px; margin-right: 8px; }
  .frens-task-icon { width: 12px; height: 12px; }
  .frens-task-reward { font-size: 13px; }
  .frens-task-reward-icon { width: 10px; height: 10px; margin-left: 4px; }
  .frens-task-done { font-size: 11px; padding: 4px 8px; border-radius: 10px; min-width: 70px; }
  .frens-tabs { border-radius: 12px; margin-bottom: 14px; }
  .frens-tabs button { font-size: 14px; padding: 9px 0; border-radius: 12px; }
  .frens-how-num { width: 22px; height: 22px; font-size: 13px; margin-right: 8px; }
  .frens-stats-row { font-size: 13px; margin-bottom: 6px; }
  .frens-stats-value { font-size: 15px; }
  .frens-invite-btn { font-size: 14px; padding: 10px 0; border-radius: 12px; margin-top: 10px; }
  .frens-top { margin-bottom: 10px; margin-top: 10px; }
  .frens-tickets { padding: 5px 10px; font-size: 14px; border-radius: 10px; }
  .frens-copy-btn { width: 32px; height: 32px; border-radius: 10px; }
}

/* Анимации */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
.tab-content { transition: opacity 0.3s ease; }
.tab-content.show { opacity: 1; }
      `}</style>
    </div>
  );
}
window.FrensTab = FrensTab;

