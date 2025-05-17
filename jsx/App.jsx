const { useState, useCallback, memo, useEffect } = React;

// Memoized navigation button component with improved mobile styles
const NavButton = memo(({ label, isActive, onClick }) => (
  <button
    onClick={onClick}
    data-tab={label.toLowerCase()}
    className={`nav-blob-btn blob-btn ${isActive ? "text-blue-500" : ""}`}
    style={{
      touchAction: 'manipulation',
      WebkitTapHighlightColor: 'transparent'
    }}
  >
    {label}
    <span className="blob-btn__inner">
      <span className="blob-btn__blobs">
        <span className="blob-btn__blob"></span>
        <span className="blob-btn__blob"></span>
        <span className="blob-btn__blob"></span>
        <span className="blob-btn__blob"></span>
      </span>
    </span>
  </button>
));

// Optimized NavIconButton with improved mobile touch handling
const NavIconButton = memo(({ icon, isActive, onClick, notification }) => (
  <button
    onClick={onClick}
    className={`nav-icon-btn${isActive ? ' active' : ''}`}
    style={{
      position: 'relative',
      background: 'none',
      border: 'none',
      outline: 'none',
      padding: 0,
      margin: 0,
      borderRadius: '50%',
      width: 'clamp(48px, 14vw, 56px)',
      height: 'clamp(48px, 14vw, 56px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      touchAction: 'manipulation',
      WebkitTapHighlightColor: 'transparent',
      cursor: 'pointer'
    }}
  >
    {icon}
    {notification ? (
      <span style={{
        position: 'absolute',
        top: 'clamp(4px, 2vw, 6px)',
        right: 'clamp(8px, 3vw, 10px)',
        background: '#fff',
        color: '#111',
        borderRadius: '50%',
        fontSize: 'clamp(12px, 3.5vw, 14px)',
        fontWeight: 700,
        width: 'clamp(18px, 5.5vw, 22px)',
        height: 'clamp(18px, 5.5vw, 22px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 1px 4px #0003',
        border: '2px solid #23232a'
      }}>{notification}</span>
    ) : null}
  </button>
));

function App() {
  const [user, setUser] = useState(window.initialUser);
  const [tonPrice, setTonPrice] = useState(window.mockTonPrice);
  const [currentTab, setCurrentTab] = useState("home");
  const [bet, setBet] = useState(null);
  const [betPercentage, setBetPercentage] = useState(25);
  const [notification, setNotification] = useState("");
  const [donated, setDonated] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // Add viewport meta tag and initialize Telegram WebApp
  useEffect(() => {
    const meta = document.createElement('meta');
    meta.name = 'viewport';
    meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
    document.head.appendChild(meta);
    
    // Initialize Telegram WebApp
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.ready();
      window.Telegram.WebApp.expand();
    }
  }, []);

  // Handle window resize for mobile detection
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Memoized tab change handlers
  const handleTabChange = useCallback((tab) => {
    setCurrentTab(tab);
    // Vibrate on mobile devices when changing tabs
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
  }, []);

  // Memoized tab content
  const renderTabContent = useCallback(() => {
    switch (currentTab) {
      case "home":
        return (
          <window.HomeTab
            user={user}
            setUser={setUser}
            tonPrice={tonPrice}
            setTonPrice={setTonPrice}
            bet={bet}
            setBet={setBet}
            betPercentage={betPercentage}
            setBetPercentage={setBetPercentage}
            notification={notification}
            setNotification={setNotification}
            donated={donated}
            setDonated={setDonated}
            isMobile={isMobile}
          />
        );
      case "frens":
        return <window.FrensTab user={user} setNotification={setNotification} isMobile={isMobile} />;
      case "tasks":
        return (
          <window.TasksTab
            user={user}
            setUser={setUser}
            dailyTasks={window.dailyTasks}
            regularTasks={window.regularTasks}
            setNotification={setNotification}
            onGoHome={() => handleTabChange("home")}
            isMobile={isMobile}
          />
        );
      case "farm":
        return <window.FarmTab isMobile={isMobile} />;
      default:
        return null;
    }
  }, [currentTab, user, tonPrice, bet, betPercentage, notification, donated, isMobile]);

  return (
    <div className="max-w-md mx-auto min-h-screen flex flex-col bg-gray-100" style={{
      WebkitOverflowScrolling: 'touch',
      overscrollBehavior: 'contain'
    }}>
      <div className="flex-1">
        {renderTabContent()}
      </div>
      <div style={{
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'transparent',
        margin: 0,
        padding: 0,
        position: 'sticky',
        bottom: 0,
        zIndex: 1000
      }}>
        <div style={{
          background: '#23232a',
          borderRadius: '24px',
          padding: '6px 8px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          margin: 0,
          marginBottom: '10px',
          width: 'calc(100vw - 32px)',
          maxWidth: 380,
          minWidth: 220,
          transition: 'all 0.2s',
        }}>
          <NavIconButton
            icon={<svg width="28" height="28" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12L14 4l10 8v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/></svg>}
            isActive={currentTab === "home"}
            onClick={() => handleTabChange("home")}
          />
          <NavIconButton
            icon={<svg width="28" height="28" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="14" cy="10" r="6"/><path d="M4 24v-2a8 8 0 0 1 16 0v2"/></svg>}
            isActive={currentTab === "frens"}
            onClick={() => handleTabChange("frens")}
          />
          <NavIconButton
            icon={<svg width="28" height="28" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="20" height="20" rx="5"/><path d="M9 12h6M9 16h6"/></svg>}
            isActive={currentTab === "tasks"}
            onClick={() => handleTabChange("tasks")}
            notification={null}
          />
        </div>
      </div>
    </div>
  );
}

window.App = App;
ReactDOM.render(<App />, document.getElementById("root"));