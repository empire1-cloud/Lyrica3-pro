import { useState } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import LyricaPublicLanding from './LyricaPublicLanding';
import ProStudio, { LoginGate } from './pages/ProStudio';
import PricingPage from './PricingPage';

function AppShell() {
  const [showStudio, setShowStudio] = useState(false);
  const location = useLocation();

  if (location.pathname === '/pricing') {
    return <PricingPage />;
  }

  if (showStudio) {
    return (
      <LoginGate onBack={() => setShowStudio(false)}>
        <ProStudio onLogout={() => {
          localStorage.removeItem('e1_token');
          setShowStudio(false);
        }} />
      </LoginGate>
    );
  }

  return <LyricaPublicLanding onEnterStudio={() => setShowStudio(true)} />;
}

export default function App() {
  return <AppShell />;
}
