import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { LoginModal } from './components/LoginModal';
import { HomePage } from './pages/HomePage';
import { SearchPage } from './pages/SearchPage';
import { MapPage } from './pages/MapPage';
import { GraveDetailPage } from './pages/GraveDetailPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { MausoleumsPage } from './pages/MausoleumsPage';

export function AppContent() {
  const [activePage, setActivePage] = useState({ name: 'home' });
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const renderCurrentPage = () => {
    switch (activePage.name) {
      case 'home':
        return <HomePage setActivePage={setActivePage} />;
      case 'search':
        return <SearchPage initialQuery={activePage.query} setActivePage={setActivePage} />;
      case 'map':
        return <MapPage initialGraveId={activePage.selectedGraveId} initialPatioId={activePage.selectedPatioId} initialOpenEditor={activePage.openEditor} setActivePage={setActivePage} />;
      case 'detail':
        return <GraveDetailPage graveId={activePage.id} setActivePage={setActivePage} />;
      case 'admin':
        return <AdminDashboard initialTab={activePage.tab} setActivePage={setActivePage} />;
      case 'mausoleos':
        return <MausoleumsPage setActivePage={setActivePage} />;
      default:
        return <HomePage setActivePage={setActivePage} />;
    }
  };

  return (
    <div className={`app-container ${activePage.name === 'map' ? 'map-screen' : ''}`}>
      <Navbar
        activePage={activePage}
        setActivePage={setActivePage}
        openLoginModal={() => setIsLoginModalOpen(true)}
      />

      <main className="main-content">
        {renderCurrentPage()}
      </main>

      {activePage.name !== 'map' && <Footer />}

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onSuccess={() => {
          // Stay or route to admin if logging in
          setActivePage({ name: 'admin' });
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
