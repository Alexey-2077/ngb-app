const initialUser = {
  xp: 1000,
  crystals: 500,
  tickets: 0,
  referrals: [
    { id: 1, username: "friend1", xpEarned: 150 },
    { id: 2, username: "friend2", xpEarned: 200 }
  ],
  tasksCompleted: []
};

// Начальные данные курса TON (будут обновляться через API)
const mockTonPrice = {
  current: 5.20,
  previous: 5.15,
  lastUpdated: new Date()
};

const dailyTasks = [
  { id: "daily_login", name: "Ежедневный вход", xp: 20 },
  { id: "daily_bet", name: "Совершить ставку", xp: 50 },
  { id: "visit_channel", name: "Посетить канал проекта", xp: 10 },
  { id: "boost_channel", name: "Буст канала проекта", xp: 25 }
];

const regularTasks = [
  { id: "subscribe_channel", name: "Подписка на канал проекта", xp: 100 },
  { id: "invite_5_friends", name: "Пригласить 5 друзей", xp: 100 },
  { id: "invite_25_friends", name: "Пригласить 25 друзей", xp: 500, crystals: 100 }
];

// Мок-данные истории курса TON для графика (7 дней)
const tonPriceHistory = [
  { date: "2025-04-27", price: 5.10 },
  { date: "2025-04-28", price: 5.15 },
  { date: "2025-04-29", price: 5.12 },
  { date: "2025-04-30", price: 5.18 },
  { date: "2025-05-01", price: 5.22 },
  { date: "2025-05-02", price: 5.19 },
  { date: "2025-05-03", price: 5.20 }
];

window.initialUser = initialUser;
window.mockTonPrice = mockTonPrice;
window.dailyTasks = dailyTasks;
window.regularTasks = regularTasks;
window.tonPriceHistory = tonPriceHistory;