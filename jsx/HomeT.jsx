const { useState, useEffect, useRef } = React;

function TonChart() {
  const chartRef = useRef(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Функция для загрузки Google Charts
    const initGoogleCharts = () => {
      return new Promise((resolve, reject) => {
        try {
          const script = document.createElement('script');
          script.src = 'https://www.gstatic.com/charts/loader.js';
          script.async = true;
          script.onload = () => {
            google.charts.load('current', { packages: ['corechart'] });
            google.charts.setOnLoadCallback(() => resolve());
          };
          script.onerror = () => reject(new Error('Не удалось загрузить Google Charts'));
          document.head.appendChild(script);
        } catch (err) {
          reject(err);
        }
      });
    };

    const drawChart = async () => {
      try {
        // Проверяем, загружен ли Google Charts
        if (!window.google?.visualization?.LineChart) {
          await initGoogleCharts();
        }

        const response = await fetch(
          'https://api.coingecko.com/api/v3/coins/the-open-network/market_chart?vs_currency=usd&days=1'
        );
        const data = await response.json();

        const chartData = new google.visualization.DataTable();
        chartData.addColumn('datetime', 'Time');
        chartData.addColumn('number', 'TON Price');

        const rows = data.prices.map(([timestamp, price]) => [
          new Date(timestamp),
          price
        ]);
        chartData.addRows(rows);

        const options = {
          backgroundColor: { fill: 'transparent' },
          colors: ['#e94560'],
          fontName: 'Open Sans',
          focusTarget: 'category',
          chartArea: {
            left: 50,
            top: 20,
            width: '90%',
            height: '80%'
          },
          hAxis: {
            format: 'HH:mm',
            textStyle: { fontSize: 11 },
            gridlines: { color: '#DDD', count: -1 }
          },
          vAxis: {
            baselineColor: '#DDD',
            gridlines: { color: '#DDD', count: 5 },
            textStyle: { fontSize: 11 }
          },
          legend: { position: 'none' },
          animation: {
            duration: 1000,
            easing: 'out',
            startup: true
          },
          tooltip: { 
            isHtml: true,
            format: 'HH:mm'
          },
          curveType: 'function',
          lineWidth: 2,
          pointSize: 4
        };

        const chart = new google.visualization.LineChart(chartRef.current);
        chart.draw(chartData, options);
        setError(null);
      } catch (err) {
        console.error('Ошибка при отрисовке графика:', err);
        setError('Не удалось загрузить график');
      }
    };

    drawChart();
    const interval = setInterval(drawChart, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 2px 16px #0001', maxWidth: 800, margin: '0 auto 24px auto', height: 340 }}>
      {error ? (
        <div style={{ textAlign: 'center', color: '#e94560', padding: '20px' }}>{error}</div>
      ) : (
        <div ref={chartRef} style={{ width: '100%', height: '300px' }}></div>
      )}
    </div>
  );
}

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
  setDonated
}) {
  const [time, setTime] = useState(new Date());

  // Обновление текущего времени
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Получение текущего курса TON через API каждые 30 секунд
  useEffect(() => {
    const fetchTonPrice = async () => {
      try {
        const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=the-open-network&vs_currencies=usd');
        const data = await response.json();
        const newPrice = data['the-open-network'].usd;
        setTonPrice(prev => ({
          current: newPrice,
          previous: prev.current,
          lastUpdated: new Date()
        }));
      } catch (error) {
        console.error('Ошибка при получении курса TON:', error);
        setNotification('Не удалось обновить курс TON. Используются последние известные данные.');
      }
    };
    fetchTonPrice();
    const interval = setInterval(fetchTonPrice, 30000);
    return () => clearInterval(interval);
  }, []);

  // Проверка результатов ставки в 03:00 по МСК
  useEffect(() => {
    const checkPriceUpdate = () => {
      const now = new Date();
      const mskOffset = 3 * 60 * 60 * 1000;
      const mskTime = new Date(now.getTime() + mskOffset);
      if (mskTime.getHours() === 3 && mskTime.getMinutes() === 0) {
        if (bet) {
          const result = tonPrice.current > tonPrice.previous ? "up" : tonPrice.current < tonPrice.previous ? "down" : "nochange";
          window.handleBetResult(result, bet, user, setUser, setBet, setNotification);
        }
      }
    };
    const interval = setInterval(checkPriceUpdate, 60000);
    return () => clearInterval(interval);
  }, [bet, tonPrice, user]);

  const handlePlaceBet = (direction) => {
    window.placeBet(direction, user, setUser, betPercentage, setBet, setNotification);
  };

  const makeDonation = () => {
    setDonated(true);
    setNotification("Пожертвование принято! Ставки доступны до 22:00 МСК.");
  };

  return (
    <div className="p-4">
      <TonChart />
      <div className="flex justify-between mb-4">
        <div>XP: {user.xp}</div>
        <div>Кристаллы: {user.crystals}</div>
        <div>Тикеты: {user.tickets}</div>
      </div>
      <div className="text-center mb-4">
        <h2 className="text-xl">Курс TON: ${tonPrice.current}</h2>
        <p>Обновлено: {tonPrice.lastUpdated.toLocaleString()}</p>
      </div>
      {window.canBet(time, donated) && !bet ? (
        <div className="text-center">
          <h3 className="mb-2">Сделать выбор</h3>
          <div className="mb-2">
            <label>Размер ставки: </label>
            <select
              value={betPercentage}
              onChange={(e) => setBetPercentage(parseInt(e.target.value))}
              className="border p-1"
            >
              <option value={25}>25%</option>
              <option value={50}>50%</option>
              <option value={100}>100%</option>
            </select>
          </div>
          <div className="buttons">
            <button className="blob-btn" onClick={() => handlePlaceBet("up")}>Повысится
              <span className="blob-btn__inner">
                <span className="blob-btn__blobs">
                  <span className="blob-btn__blob"></span>
                  <span className="blob-btn__blob"></span>
                  <span className="blob-btn__blob"></span>
                  <span className="blob-btn__blob"></span>
                </span>
              </span>
            </button>
            <button className="blob-btn" onClick={() => handlePlaceBet("down")}>Понизится
              <span className="blob-btn__inner">
                <span className="blob-btn__blobs">
                  <span className="blob-btn__blob"></span>
                  <span className="blob-btn__blob"></span>
                  <span className="blob-btn__blob"></span>
                  <span className="blob-btn__blob"></span>
                </span>
              </span>
            </button>
          </div>
        </div>
      ) : bet ? (
        <div className="text-center">
          <p>Ваша ставка: {bet.direction === "up" ? "Повысится" : "Понизится"} ({bet.amount} кристаллов)</p>
          <p>Ожидание результата до 03:00 МСК</p>
        </div>
      ) : (
        <div className="text-center">
          <p>Ставки закрыты. Ожидание результата до 03:00 МСК.</p>
          {time.getHours() >= 19 && time.getHours() < 22 && !donated && (
            <div className="buttons">
              <button className="blob-btn" onClick={makeDonation}>
                Пожертвовать 50 Stars для ставок до 22:00
                <span className="blob-btn__inner">
                  <span className="blob-btn__blobs">
                    <span className="blob-btn__blob"></span>
                    <span className="blob-btn__blob"></span>
                    <span className="blob-btn__blob"></span>
                    <span className="blob-btn__blob"></span>
                  </span>
                </span>
              </button>
            </div>
          )}
        </div>
      )}
      {notification && (
        <div className="mt-4 p-2 bg-gray-100 rounded">{notification}</div>
      )}
    </div>
  );
}

window.HomeTab = HomeTab;