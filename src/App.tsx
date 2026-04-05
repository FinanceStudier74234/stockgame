import React, { useEffect } from 'react';
import { useGameStore } from './store/gameStore';

// Layout
import TopBar from './components/layout/TopBar';
import Sidebar from './components/layout/Sidebar';
import ActionBar from './components/layout/ActionBar';
import NotificationsPanel from './components/layout/NotificationsPanel';

// Pages
import StartPage from './pages/StartPage';

// Screens
import Dashboard from './components/dashboard/Dashboard';
import MarketScreen from './components/market/MarketScreen';
import StockDetail from './components/market/StockDetail';
import PortfolioScreen from './components/portfolio/PortfolioScreen';
import TradingScreen from './components/trading/TradingScreen';
import OptionsScreen from './components/options/OptionsScreen';
import CareerScreen from './components/career/CareerScreen';
import SkillsScreen from './components/skills/SkillsScreen';
import BusinessScreen from './components/business/BusinessScreen';
import TeamScreen from './components/team/TeamScreen';
import FundScreen from './components/fund/FundScreen';
import LifestyleScreen from './components/lifestyle/LifestyleScreen';
import EconomyScreen from './components/economy/EconomyScreen';
import AchievementsScreen from './components/achievements/AchievementsScreen';
import SettingsScreen from './components/settings/SettingsScreen';
import RivalsScreen from './components/rivals/RivalsScreen';
import QuantScreen from './components/quant/QuantScreen';
import MilestonesScreen from './components/milestones/MilestonesScreen';
import InsiderScreen from './components/insider/InsiderScreen';

// Events
import EventModal from './components/events/EventModal';
import YearEndModal from './components/rivals/YearEndModal';

function GameContent() {
  const { ui, player } = useGameStore();
  const { currentScreen, selectedStock } = ui;

  const renderScreen = () => {
    if (selectedStock && (currentScreen === 'market' || currentScreen === 'trading' || currentScreen === 'portfolio')) {
      return <StockDetail ticker={selectedStock} onClose={() => useGameStore.getState().selectStock(null)} />;
    }
    switch (currentScreen) {
      case 'dashboard': return <Dashboard />;
      case 'market': return <MarketScreen />;
      case 'portfolio': return <PortfolioScreen />;
      case 'trading': return <TradingScreen />;
      case 'options': return <OptionsScreen />;
      case 'career': return <CareerScreen />;
      case 'skills': return <SkillsScreen />;
      case 'business': return <BusinessScreen />;
      case 'team': return <TeamScreen />;
      case 'fund': return <FundScreen />;
      case 'lifestyle': return <LifestyleScreen />;
      case 'economy': return <EconomyScreen />;
      case 'rivals': return <RivalsScreen />;
      case 'quant': return <QuantScreen />;
      case 'milestones': return <MilestonesScreen />;
      case 'achievements': return <AchievementsScreen />;
      case 'settings': return <SettingsScreen />;
      case 'insider': return <InsiderScreen />;
      default: return <Dashboard />;
    }
  };

  if (!player) return <StartPage />;

  return (
    <div className="h-screen w-screen overflow-hidden" style={{
      display: 'grid',
      gridTemplateColumns: '220px 1fr',
      gridTemplateRows: '48px 1fr 44px',
    }}>
      <div style={{ gridColumn: '1 / -1', gridRow: '1 / 2' }}>
        <TopBar />
      </div>
      <div style={{ gridColumn: '1 / 2', gridRow: '2 / 4', overflow: 'hidden' }}>
        <Sidebar />
      </div>
      <div style={{ gridColumn: '2 / 3', gridRow: '2 / 3', overflow: 'hidden' }} className="bg-dark-900">
        {renderScreen()}
      </div>
      <div style={{ gridColumn: '2 / 3', gridRow: '3 / 4' }}>
        <ActionBar />
      </div>
      <NotificationsPanel />
      <EventModal />
      <YearEndModal />
    </div>
  );
}

export default function App() {
  const { isNewGame } = useGameStore();

  useEffect(() => {
    const interval = setInterval(() => {
      const state = useGameStore.getState();
      if (!state.isNewGame && state.player && state.config.autoSave) {
        useGameStore.setState({ saveDate: Date.now() });
      }
    }, 120000);
    return () => clearInterval(interval);
  }, []);

  if (isNewGame) return <StartPage />;
  return <GameContent />;
}
