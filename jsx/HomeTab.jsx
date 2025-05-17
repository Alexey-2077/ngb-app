const { useState, useEffect, useCallback, memo, useRef } = React;

function TonChart({ range, tonPrice, now, user, chartRange, setChartRange, notification, lastBetResult }) {
  const chartRef = useRef(null);
  const [currentPrice, setCurrentPrice] = useState(null);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 0 });
  const chartInstance = useRef(null);
  const [lastPercentChange, setLastPercentChange] = useState(0);
  const [showAlert, setShowAlert] = useState(false);
  const [alertText, setAlertText] = useState('');
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [tooltipData, setTooltipData] = useState({ time: '', price: 0 });

  // Эффект для отслеживания результата последней ставки
  useEffect(() => {
    // Получаем последнюю ставку из истории
    try {
      const betHistory = JSON.parse(localStorage.getItem('betHistory') || '[]');
      if (betHistory.length > 0) {
        const lastBet = betHistory[0];
        console.log("Последняя ставка:", lastBet);
      }
    } catch (e) {
      console.error('Ошибка при чтении истории ставок:', e);
    }
  }, [lastBetResult]);

  useEffect(() => {
    let chart = null;
    let lastTap = 0;
    let prevPrice = null;

    async function drawChart() {
      try {
        // Выбор диапазона для API
        let days = 1;
        if (range === '1h') days = 0.05; // ~1 час (API округляет)
        else if (range === '24h') days = 1;
        else if (range === '7d') days = 7;
        else if (range === '30d') days = 30;
        const response = await fetch(
          `https://api.coingecko.com/api/v3/coins/the-open-network/market_chart?vs_currency=usd&days=${days}`
        );
        const data = await response.json();

        // min/max
        const prices = data.prices.map(p => p[1]);
        const min = Math.min(...prices);
        const max = Math.max(...prices);
        setPriceRange({ min, max });
        setCurrentPrice(prices[prices.length - 1]);

        // Всплывающее уведомление о резком изменении курса
        if (prices.length > 1) {
          const percentChange = ((prices[prices.length - 1] - prices[prices.length - 2]) / prices[prices.length - 2]) * 100;
          setLastPercentChange(percentChange);
          if (Math.abs(percentChange) >= 3) {
            setAlertText(percentChange > 0 ? 'Курс TON резко вырос!' : 'Курс TON резко упал!');
            setShowAlert(true);
            setTimeout(() => setShowAlert(false), 4000);
          }
        }

        if (chartInstance.current) {
          chartInstance.current.destroy();
        }

        const ctx = chartRef.current.getContext('2d');
        const gradient = ctx.createLinearGradient(0, 0, 0, 500);
        gradient.addColorStop(0, 'rgba(233,69,96,0.15)');
        gradient.addColorStop(1, 'rgba(233,69,96,0)');

        chart = new Chart(ctx, {
          type: 'line',
          data: {
            labels: data.prices.map(([ts]) => new Date(ts).toLocaleTimeString()),
            datasets: [{
              data: data.prices.map(p => p[1]),
              borderColor: '#e94560',
              backgroundColor: gradient,
              fill: true,
              borderWidth: 2,
              tension: 0.4,
              pointRadius: 0,
              pointHoverRadius: 6,
              pointHoverBackgroundColor: '#fff',
              pointHoverBorderColor: '#e94560',
              pointHoverBorderWidth: 2
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
              intersect: false,
              mode: 'index'
            },
            plugins: {
              legend: { display: false },
              tooltip: {
                enabled: false,
                external: function(context) {
                  // Обновляем только данные, но не позицию
                  if (context.tooltip.opacity > 0) {
                    const price = context.tooltip.dataPoints[0].parsed.y;
                    const time = context.tooltip.dataPoints[0].label;
                    setTooltipData({ time, price });
                    setTooltipVisible(true);
                  } else {
                    setTooltipVisible(false);
                  }
                }
              },
              zoom: {
                pan: {
                  enabled: true,
                  mode: 'x',
                  cursor: 'grab'
                },
                zoom: {
                  wheel: {
                    enabled: true,
                  },
                  pinch: {
                    enabled: true
                  },
                  mode: 'x',
                }
              }
            },
            scales: {
              x: {
                display: false
              },
              y: {
                display: false
              }
            },
            hover: {
              mode: 'index',
              intersect: false
            },
            onHover: (e, elements) => {
              e.native.target.style.cursor = elements.length ? 'grab' : 'default';
            }
          }
        });
        chartInstance.current = chart;
      } catch (err) {
        console.error('Ошибка при создании графика:', err);
      }
    }

    drawChart();
    const interval = setInterval(drawChart, 30000);
    return () => clearInterval(interval);
  }, [range]);

  return (
    <div className="bg-[#181A20] rounded-2xl p-3 shadow-lg mb-4 flex flex-col items-stretch" style={{maxWidth: 420, margin: '0 auto'}}>
      {/* XP, Кристаллы, Тикеты в виде отдельных компактных блоков */}
      <div className="grid grid-cols-3 gap-2 mb-2">
        <div className="bg-gray-800 rounded-lg p-2 text-center">
          <div className="text-[10px] text-gray-400 mb-0.5">XP</div>
          <div className="text-base font-bold text-gray-100 leading-none">{user.xp}</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-2 text-center">
          <div className="text-[10px] text-gray-400 mb-0.5">Кристаллы</div>
          <div className="text-base font-bold text-gray-100 leading-none">{user.crystals}</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-2 text-center">
          <div className="text-[10px] text-gray-400 mb-0.5">Тикеты</div>
          <div className="text-base font-bold text-gray-100 leading-none">{user.tickets}</div>
        </div>
      </div>
      {/* График */}
      <div className="relative h-[180px] overflow-hidden rounded-xl mb-1 bg-[#23232a]">
        <canvas ref={chartRef} style={{width: '100%', height: '100%', display: 'block'}} />
        
        {/* Боковая панель с ценой и временем - фиксированная в правом верхнем углу */}
        <div 
          style={{
            position: 'absolute',
            top: 10,
            right: 10,
            background: lastBetResult === 'win' ? '#22c55e' : 
                       lastBetResult === 'lose' ? '#ef4444' : '#23232add',
            color: '#fff',
            borderRadius: 8,
            padding: '8px 12px',
            fontWeight: 600,
            fontSize: 14,
            zIndex: 20,
            boxShadow: '0 2px 8px #0006',
            opacity: 0.95,
            transition: 'background-color 0.3s ease',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: 80
          }}
        >
          <div>{tooltipVisible ? tooltipData.time : now.toLocaleTimeString()}</div>
          <div style={{fontSize: 16, fontWeight: 700}}>
            ${tooltipVisible ? tooltipData.price.toFixed(2) : currentPrice?.toFixed(2) || tonPrice.current}
          </div>
        </div>
        
        {showAlert && (
          <div style={{
            position: 'absolute',
            top: 12,
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#e94560',
            color: '#fff',
            borderRadius: 8,
            padding: '6px 16px',
            fontWeight: 600,
            fontSize: 13,
            zIndex: 20,
            boxShadow: '0 2px 8px #0006',
            opacity: 0.95
          }}>
            {alertText}
          </div>
        )}
      </div>
      
      {/* Кнопки для выбора диапазона графика */}
      <div className="flex justify-center gap-2 mt-1 mb-2">
        {['1h', '24h', '7d', '30d'].map(r => (
          <button
            key={r}
            onClick={() => setChartRange(r)}
            className={`px-3 py-1 rounded-md text-xs font-semibold ${
              chartRange === r 
                ? 'bg-[#e94560] text-white' 
                : 'bg-gray-700 text-gray-300'
            }`}
          >
            {r}
          </button>
        ))}
      </div>
      
      {/* Пуш-уведомление прямо под графиком, компактно */}
      {notification && (
        <div className="mt-1 mb-0 p-1 bg-gray-700 rounded text-center text-[13px] font-semibold text-gray-100 shadow-sm" style={{minHeight: 0, lineHeight: 1.2}}>
          {notification}
        </div>
      )}
    </div>
  );
}

// Memoized button component
const BlobButton = memo(({ onClick, children, variant }) => (
  <button 
    className={`w-full py-3 px-6 text-lg font-medium rounded-xl transition-all
      ${variant === 'long' ? 'btn-long' : ''}
      ${variant === 'short' ? 'btn-short' : ''}`}
    onClick={onClick}
  >
    {children}
  </button>
));

function HomeTab({
  user,
  setUser,
  tonPrice,
  setTonPrice,
  bet,
  setBet,
  betPercentage,
  setBetPercentage,
  notification,
  setNotification,
  donated,
  setDonated,
  isMobile
}) {
  const [time, setTime] = useState(new Date());
  const [showBetPopup, setShowBetPopup] = useState(false);
  const [lastBetResult, setLastBetResult] = useState(null); // 'win' | 'lose' | 'nochange'
  const [chartRange, setChartRange] = useState('24h'); // '1h', '24h', '7d', '30d'
  const [now, setNow] = useState(new Date());
  const [betHistory, setBetHistory] = useState([]); // [{amount, direction, result, time}]
  const [activeBet, setActiveBet] = useState(null); // {amount, direction, priceAtBet, time}
  const [resultCountdown, setResultCountdown] = useState(0); // Обратный отсчет до результата
  const [timerColor, setTimerColor] = useState('#f59e0b'); // Цвет таймера, начинаем с желтого
  const [pendingBets, setPendingBets] = useState([]); // Ставки в процессе
  const [timerActive, setTimerActive] = useState(false); // Флаг активности таймера

  // Обновляем время каждую секунду
  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Эффект для анимации таймера и автоматического обновления результатов
  useEffect(() => {
    if (resultCountdown > 0 && timerActive) {
      // Меняем цвет таймера каждую секунду для эффекта "тиканья"
      const timerAnimation = setInterval(() => {
        setTimerColor(prev => prev === '#f59e0b' ? '#f97316' : '#f59e0b');
      }, 500);
      
      // Уменьшаем значение таймера каждую секунду
      const countdown = setInterval(() => {
        setResultCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdown);
            clearInterval(timerAnimation);
            
            // Когда таймер достигает нуля, обновляем все ставки "В процессе"
            updatePendingBets();
            setTimerActive(false); // Деактивируем таймер после завершения
            
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      return () => {
        clearInterval(countdown);
        clearInterval(timerAnimation);
      };
    }
  }, [resultCountdown, timerActive]);

  // Функция для обновления всех ставок "В процессе"
  const updatePendingBets = useCallback(() => {
    const history = JSON.parse(localStorage.getItem('betHistory') || '[]');
    let updated = false;
    
    // Получаем текущий курс TON для определения результатов
    window.fetchTonPriceFromStonFi().then(currentPriceData => {
      const updatedHistory = history.map(bet => {
        if (bet.result === 'pending') {
          updated = true;
          
          // Определяем результат ставки на основе разницы цен
          // Для демонстрации используем случайный результат
          // В реальном приложении здесь будет сравнение с текущей ценой
          const randomValue = Math.random();
          let betResult;
          
          if (randomValue < 0.45) {
            betResult = 'win';
          } else if (randomValue < 0.9) {
            betResult = 'lose';
          } else {
            betResult = 'draw';
          }
          
          // Обновляем баланс пользователя в зависимости от результата
          const newUser = { ...user };
          
          if (betResult === 'win') {
            // Выигрыш: возвращаем ставку + выигрыш
            const winAmount = bet.amount * 2;
            newUser.crystals += winAmount;
            newUser.xp += bet.amount;
            setUser(newUser);
            
            // Сохраняем обновленного пользователя
            localStorage.setItem('user', JSON.stringify(newUser));
            
            // Показываем уведомление о выигрыше
            setNotification(`Вы выиграли! +${winAmount} кристаллов, +${bet.amount} XP`);
          } else if (betResult === 'draw') {
            // Возврат при ничьей
            newUser.crystals += bet.amount;
            setUser(newUser);
            localStorage.setItem('user', JSON.stringify(newUser));
            setNotification("Курс практически не изменился. Кристаллы возвращены.");
          } else {
            // Проигрыш
            setNotification("Вы проиграли. Кристаллы сгорели.");
          }
          
          return {
            ...bet,
            finalPrice: currentPriceData.price,
            result: betResult,
            message: betResult === 'win' 
              ? `Вы выиграли! +${bet.amount * 2} кристаллов, +${bet.amount} XP` 
              : betResult === 'draw'
              ? "Курс практически не изменился. Кристаллы возвращены."
              : "Вы проиграли. Кристаллы сгорели."
          };
        }
        return bet;
      });
      
      if (updated) {
        localStorage.setItem('betHistory', JSON.stringify(updatedHistory.slice(0, 5)));
        setBetHistory(updatedHistory.slice(0, 5));
        setPendingBets([]); // Очищаем список ожидающих ставок
        
        // Обновляем UI с новой историей
        window.dispatchEvent(new CustomEvent('betHistoryUpdated', { detail: updatedHistory }));
        
        // Обновляем результат последней ставки
        if (updatedHistory.length > 0) {
          setLastBetResult(updatedHistory[0].result);
        }
        
        // Удаляем текущую ставку из localStorage
        localStorage.removeItem('currentBet');
        setBet(null);
      }
    }).catch(error => {
      console.error('Ошибка при обновлении ставок:', error);
      setNotification("Произошла ошибка при обновлении результатов ставок.");
    });
  }, [user, setUser, setNotification, setBet]);

  // Загрузка истории ставок при монтировании и обновление при изменениях
  useEffect(() => {
    const savedHistory = localStorage.getItem('betHistory');
    if (savedHistory) {
      const history = JSON.parse(savedHistory);
      setBetHistory(history.slice(0, 5)); // Ограничиваем до 5 последних ставок
      
      // Устанавливаем результат последней ставки
      if (history.length > 0) {
        const lastBet = history[0];
        setLastBetResult(lastBet.result);
      }
      
      // Проверяем наличие ставок "В процессе"
      const pendingBets = history.filter(bet => bet.result === 'pending');
      if (pendingBets.length > 0) {
        setPendingBets(pendingBets);
        setResultCountdown(5); // Запускаем таймер, если есть ставки в процессе
        setTimerActive(true); // Активируем таймер
      }
    }

    const savedActiveBet = localStorage.getItem('currentBet');
    if (savedActiveBet) {
      setActiveBet(JSON.parse(savedActiveBet));
      setResultCountdown(5); // Начинаем отсчет для восстановленной ставки
      setTimerActive(true); // Активируем таймер
    }

    const savedUser = localStorage.getItem('user');
    if (savedUser) setUser(JSON.parse(savedUser));
    
    // Добавляем слушатель события обновления истории ставок
    const handleBetHistoryUpdate = (event) => {
      const history = event.detail.slice(0, 5); // Ограничиваем до 5 последних ставок
      setBetHistory(history);
      
      // Обновляем lastBetResult на основе последней ставки
      if (history.length > 0) {
        const lastBet = history[0];
        setLastBetResult(lastBet.result);
      }
      
      // Проверяем наличие ставок "В процессе"
      const pendingBets = history.filter(bet => bet.result === 'pending');
      setPendingBets(pendingBets);
      
      // Если есть ставки в процессе и таймер не активен, запускаем таймер
      if (pendingBets.length > 0 && !timerActive) {
        setResultCountdown(5);
        setTimerActive(true);
      }
    };
    
    window.addEventListener('betHistoryUpdated', handleBetHistoryUpdate);
    
    return () => {
      window.removeEventListener('betHistoryUpdated', handleBetHistoryUpdate);
    };
  }, [timerActive]);

  // Memoized handlers
  const handlePlaceBet = useCallback((direction) => {
    setResultCountdown(5); // Устанавливаем начальное значение отсчета
    setTimerActive(true); // Активируем таймер
    window.placeBet(direction, user, setUser, betPercentage, setBet, setNotification, tonPrice);
  }, [user, betPercentage, setUser, tonPrice, setNotification, setBet]);

  return (
    <div className="max-w-4xl mx-auto p-2">
      {/* Передаем все необходимые параметры в TonChart */}
      <TonChart 
        range={chartRange} 
        tonPrice={tonPrice} 
        now={now} 
        user={user} 
        chartRange={chartRange} 
        setChartRange={setChartRange} 
        notification={notification}
        lastBetResult={lastBetResult}
      />

      {/* Интерфейс ставок */}
      <div className="bg-[#181A20] rounded-2xl p-4 shadow-lg mb-4 mt-0">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-100">Сделать выбор</h3>
            {resultCountdown > 0 && timerActive && (
              <div 
                className="font-bold text-lg" 
                style={{ 
                  color: timerColor,
                  transition: 'color 0.3s ease',
                  animation: 'pulse 1s infinite'
                }}
              >
                {resultCountdown}с
              </div>
            )}
          </div>
          <div className="flex justify-center gap-4 mb-4">
            {[25, 50, 100].map(val => (
              <button
                key={val}
                onClick={() => setBetPercentage(val)}
                className={`percent-button ${betPercentage === val ? 'selected' : ''}`}
              >
                {val}%
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <BlobButton onClick={() => handlePlaceBet("up")} variant="long">
              LONG
            </BlobButton>
            <BlobButton onClick={() => handlePlaceBet("down")} variant="short">
              SHORT
            </BlobButton>
          </div>
        </div>
      </div>
      <div className="bg-[#181A20] rounded-2xl p-3 shadow-lg mb-4 mt-[-12px]">
        <div className="text-[15px] font-semibold text-gray-100 mb-2">Последние ставки:</div>
        {betHistory.length === 0 ? (
          <div className="text-gray-400 text-[13px]">Нет истории ставок</div>
        ) : (
          <ul className="space-y-1">
            {betHistory.slice(0, 5).map((h, i) => (
              <li key={i} className="flex justify-between items-center text-[14px]">
                <span className="font-medium text-gray-200">{h.amount} кр.</span>
                <span className={h.direction === 'up' ? 'text-green-400' : 'text-red-400'}>
                  {h.direction === 'up' ? 'LONG' : 'SHORT'}
                </span>
                <span className={
                  h.result === 'win' ? 'text-green-400' : 
                  h.result === 'lose' ? 'text-red-400' : 
                  h.result === 'pending' ? 'text-yellow-400' : 'text-gray-400'
                }>
                  {h.result === 'win' ? 'Выигрыш' : 
                   h.result === 'lose' ? 'Проигрыш' : 
                   h.result === 'pending' ? 'В процессе' : 
                   h.result === 'draw' ? 'Возврат' : h.result}
                </span>
                <span className="text-gray-400">
                  {new Date(h.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

window.HomeTab = HomeTab;

<style>
{`
@media (max-width: 480px) {
  .rounded-2xl { border-radius: 16px !important; }
  .p-4 { padding: 12px !important; }
  .p-3 { padding: 8px !important; }
  .text-lg { font-size: 16px !important; }
  .percent-button { min-width: 48px !important; font-size: 15px !important; }
  .grid-cols-3 > div { padding: 6px !important; }
  .h-\\[180px\\] { height: 120px !important; }
  .btn-long, .btn-short { font-size: 15px !important; padding: 10px 0 !important; }
  .text-base { font-size: 13px !important; }
  .text-[10px] { font-size: 9px !important; }
  .text-[15px] { font-size: 13px !important; }
  .shadow-lg { box-shadow: 0 2px 8px #0003 !important; }
  .mb-4 { margin-bottom: 12px !important; }
  .mb-2 { margin-bottom: 6px !important; }
  .gap-4 { gap: 10px !important; }
  .gap-2 { gap: 6px !important; }
  .py-3 { padding-top: 8px !important; padding-bottom: 8px !important; }
  .px-6 { padding-left: 12px !important; padding-right: 12px !important; }
}
`}
</style>



