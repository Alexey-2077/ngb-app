async function fetchTonPriceFromStonFi() {
  try {
    const response = await fetch('https://api.ston.fi/v1/swap/price?fromCurrency=TON&toCurrency=USDT&amount=1');
    const data = await response.json();
    
    if (data && data.success && data.result) {
      return {
        price: parseFloat(data.result.price),
        timestamp: new Date().getTime(),
        source: 'ston.fi'
      };
    }
    throw new Error('Некорректный ответ от API ston.fi');
  } catch (error) {
    console.error('Ошибка при получении курса TON через ston.fi:', error);
        try {
      const fallbackResponse = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=the-open-network&vs_currencies=usd');
      const fallbackData = await fallbackResponse.json();
      return {
        price: fallbackData['the-open-network'].usd,
        timestamp: new Date().getTime(),
        source: 'coingecko'
      };
    } catch (fallbackError) {
      console.error('Ошибка при получении курса TON через запасной API:', fallbackError);
      throw new Error('Не удалось получить курс TON');
    }
  }
}

// Оптимизированная функция для размещения ставки с быстрым результатом
function placeBet(direction, user, setUser, betPercentage, setBet, setNotification, tonPrice) {
  if (user.crystals === 0) {
    setNotification("Недостаточно кристаллов для ставки!");
    return;
  }
  
  const betAmount = Math.floor((betPercentage / 100) * user.crystals);
  if (betAmount === 0) {
    setNotification("Слишком маленькая ставка!");
    return;
  }
  
  // Получаем текущий курс TON перед размещением ставки
  fetchTonPriceFromStonFi().then(priceData => {
    // Списываем кристаллы сразу
    setUser({ ...user, crystals: user.crystals - betAmount });
    
    // Сохраняем ставку с точным курсом и временем
    const newBet = { 
      direction, 
      amount: betAmount, 
      priceAtBet: priceData.price, 
      time: new Date(),
      priceSource: priceData.source,
      priceTimestamp: priceData.timestamp
    };
    
    setBet(newBet);
    
    // Сохраняем ставку в локальное хранилище для восстановления при перезагрузке
    try {
      localStorage.setItem('currentBet', JSON.stringify({
        ...newBet,
        time: new Date().toISOString()
      }));
      
      // Добавляем ставку в историю сразу с пометкой "в процессе"
      let betHistory = [];
      try {
        betHistory = JSON.parse(localStorage.getItem('betHistory') || '[]');
      } catch (e) {
        console.error('Ошибка при чтении истории ставок:', e);
        betHistory = [];
      }
      
      // Создаем запись для истории ставок с временным статусом
      const historyEntry = {
        amount: betAmount,
        direction: direction,
        priceAtBet: priceData.price,
        result: 'pending',
        message: 'Ожидание результата...',
        time: new Date().toISOString()
      };
      
      // Добавляем запись в историю ставок
      betHistory.unshift(historyEntry);
      
      // Сохраняем историю ставок (только 5 последних)
      localStorage.setItem('betHistory', JSON.stringify(betHistory.slice(0, 5)));
      
      // Обновляем UI с новой историей
      window.dispatchEvent(new CustomEvent('betHistoryUpdated', { detail: betHistory }));
      
    } catch (e) {
      console.error('Ошибка при сохранении ставки в localStorage:', e);
    }
    
    setNotification(`Ставка на ${direction === "up" ? "повышение" : "понижение"} (${betAmount} кристаллов) принята!`);
    
    // Не устанавливаем таймер здесь, так как он теперь управляется в компоненте HomeTab
    // Таймер будет запущен автоматически при обновлении истории ставок
  }).catch(error => {
    console.error('Ошибка при получении курса TON:', error);
    setNotification("Не удалось получить текущий курс TON. Попробуйте позже.");
  });
}

// Оптимизированная функция для проверки результата ставки
async function handleBetResult(bet, user, setUser, setBet, setNotification) {
  try {
    // Получаем актуальный курс TON
    const currentPriceData = await fetchTonPriceFromStonFi();
    
    // Определяем результат ставки
    let result;
    const priceDifference = ((currentPriceData.price - bet.priceAtBet) / bet.priceAtBet) * 100;
    
    // Используем порог в 0.05% для определения "без изменений"
    if (Math.abs(priceDifference) < 0.05) {
      result = "nochange";
    } else if (currentPriceData.price > bet.priceAtBet) {
      result = "up";
    } else {
      result = "down";
    }
    
    // Обновляем пользователя и определяем сообщение о результате
    const newUser = { ...user };
    let resultMessage = "";
    
    // Находим текущую ставку в истории и обновляем её статус
    let betHistory = [];
    try {
      betHistory = JSON.parse(localStorage.getItem('betHistory') || '[]');
    } catch (e) {
      console.error('Ошибка при чтении истории ставок:', e);
      betHistory = [];
    }
    
    // Находим текущую ставку в истории и обновляем её статус
    const updatedHistory = betHistory.map(historyBet => {
      // Ищем ставку по времени и сумме
      if (historyBet.time === bet.time && historyBet.amount === bet.amount) {
        // Обновляем статус ставки
        return {
          ...historyBet,
          finalPrice: currentPriceData.price,
          result: result === bet.direction ? 'win' : result === "nochange" ? 'draw' : 'lose',
          message: result === bet.direction ? `Вы выиграли! +${bet.amount * 2} кристаллов, +${bet.amount} XP` :
                  result === "nochange" ? "Курс практически не изменился. Кристаллы возвращены." :
                  "Вы проиграли. Кристаллы сгорели."
        };
      }
      return historyBet;
    });
    
    // Сохраняем обновленную историю
    localStorage.setItem('betHistory', JSON.stringify(updatedHistory.slice(0, 10)));
    
    // Обновляем UI с новой историей
    window.dispatchEvent(new CustomEvent('betHistoryUpdated', {
      detail: updatedHistory
    }));
    
    if (result === bet.direction) {
      // Выигрыш: возвращаем ставку + выигрыш
      const winAmount = bet.amount * 2;
      newUser.crystals += winAmount;
      newUser.xp += bet.amount;
      resultMessage = `Вы выиграли! +${winAmount} кристаллов, +${bet.amount} XP`;
    } else if (result === "nochange") {
      // Возврат при отсутствии изменений
      newUser.crystals += bet.amount;
      resultMessage = "Курс практически не изменился. Кристаллы возвращены.";
    } else {
      // Проигрыш
      resultMessage = "Вы проиграли. Кристаллы сгорели.";
    }
    
    // Обновляем данные пользователя
    setUser(newUser);
    setNotification(resultMessage);
    setBet(null);
    
    // Удаляем текущую ставку из localStorage
    localStorage.removeItem('currentBet');
    
    return { result, message: resultMessage };
  } catch (error) {
    console.error('Ошибка при проверке результата ставки:', error);
    setNotification("Ошибка при проверке результата ставки. Попробуйте позже.");
    return { error: true };
  }
}

// Функция для проверки возможности делать ставки
function canBet(time, donated) {
  const mskTime = new Date(time.getTime() + 3 * 60 * 60 * 1000);
  return mskTime.getHours() < 19 || (mskTime.getHours() < 22 && donated);
}

// Функция для восстановления ставки после перезагрузки страницы
function restoreBet(setUser, setBet, setNotification) {
  try {
    const savedBet = localStorage.getItem('currentBet');
    if (savedBet) {
      const parsedBet = JSON.parse(savedBet);
      parsedBet.time = new Date(parsedBet.time); // Преобразуем строку в объект Date
      setBet(parsedBet);
      return true;
    }
    return false;
  } catch (e) {
    console.error('Ошибка при восстановлении ставки:', e);
    return false;
  }
}

window.fetchTonPriceFromStonFi = fetchTonPriceFromStonFi;
window.placeBet = placeBet;
window.handleBetResult = handleBetResult;
window.canBet = canBet;
window.restoreBet = restoreBet;















