import React, { useState, useEffect } from 'react';
import { getStorage, setStorage, getActiveDomain, queryActiveTabs } from './utils/chrome';
import Dashboard from './components/Dashboard';
import TabManager from './components/TabManager';
import Notepad from './components/Notepad';
import Analyzer from './components/Analyzer';
import Settings from './components/Settings';

export default function App() {
  const [tab, setTab] = useState('dashboard');
  const [theme, setTheme] = useState('theme-boujee-gold');
  const [activeDomain, setActiveDomain] = useState('loading...');
  const [toast, setToast] = useState({ message: '', visible: false });

  // Stats
  const [openTabsCount, setOpenTabsCount] = useState(0);
  const [sessionsCount, setSessionsCount] = useState(0);
  const [notesCount, setNotesCount] = useState(0);

  // Initialize theme, domain, and counters
  useEffect(() => {
    // Theme load
    getStorage(['theme'], (result) => {
      setTheme(result.theme || 'theme-boujee-gold');
    });

    // Active domain load
    getActiveDomain((domain) => {
      setActiveDomain(domain);
    });

    // Counts load
    refreshStats();
  }, []);

  const refreshStats = () => {
    // Tabs count
    queryActiveTabs((tabs) => {
      setOpenTabsCount(tabs?.length || 0);
    });

    // Sessions & notes count
    getStorage(['sessions', 'notes'], (result) => {
      setSessionsCount(result.sessions?.length || 0);
      setNotesCount(result.notes?.length || 0);
    });
  };

  const showToast = (message) => {
    setToast({ message, visible: true });
    setTimeout(() => {
      setToast({ message: '', visible: false });
    }, 2000);
  };

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    setStorage({ theme: newTheme });
  };

  // Switch tab and load corresponding counters
  const handleTabChange = (newTab) => {
    setTab(newTab);
    refreshStats();
    getActiveDomain((domain) => {
      setActiveDomain(domain);
    });
  };

  const renderActiveTab = () => {
    switch (tab) {
      case 'dashboard':
        return (
          <Dashboard 
            openTabsCount={openTabsCount}
            sessionsCount={sessionsCount}
            notesCount={notesCount}
            setTab={handleTabChange}
            showToast={showToast}
          />
        );
      case 'tabs':
        return (
          <TabManager 
            onSessionsChange={(count) => setSessionsCount(count)}
            showToast={showToast}
          />
        );
      case 'notes':
        return (
          <Notepad 
            onNotesChange={(count) => setNotesCount(count)}
            showToast={showToast}
          />
        );
      case 'analyzer':
        return (
          <Analyzer 
            showToast={showToast}
          />
        );
      case 'settings':
        return (
          <Settings 
            theme={theme}
            onThemeChange={handleThemeChange}
            showToast={showToast}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className={`app-container ${theme}`}>
      {/* Header */}
      <header className="app-header">
        <div className="logo-area">
          <svg className="header-logo" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" />
            <path d="M12 2C8 6 8 18 12 22C16 18 16 6 12 2Z" stroke="currentColor" stroke-width="2" />
            <path d="M2 12H22" stroke="currentColor" stroke-width="2" />
          </svg>
          <h1>Task Boujee</h1>
        </div>
        <div className="header-status">{activeDomain}</div>
      </header>

      {/* Navigation */}
      <nav className="app-nav">
        <button 
          onClick={() => handleTabChange('dashboard')} 
          className={`nav-btn ${tab === 'dashboard' ? 'active' : ''}`}
          title="Dashboard"
        >
          <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          <span>Hub</span>
        </button>
        <button 
          onClick={() => handleTabChange('tabs')} 
          className={`nav-btn ${tab === 'tabs' ? 'active' : ''}`}
          title="Tab Manager"
        >
          <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <line x1="9" y1="3" x2="9" y2="21" />
            <line x1="3" y1="9" x2="21" y2="9" />
          </svg>
          <span>Tabs</span>
        </button>
        <button 
          onClick={() => handleTabChange('notes')} 
          className={`nav-btn ${tab === 'notes' ? 'active' : ''}`}
          title="Quick Notes"
        >
          <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
          <span>Notes</span>
        </button>
        <button 
          onClick={() => handleTabChange('analyzer')} 
          className={`nav-btn ${tab === 'analyzer' ? 'active' : ''}`}
          title="Page Analyzer"
        >
          <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
            <line x1="11" y1="8" x2="11" y2="14" />
            <line x1="8" y1="11" x2="14" y2="11" />
          </svg>
          <span>Analyze</span>
        </button>
        <button 
          onClick={() => handleTabChange('settings')} 
          className={`nav-btn ${tab === 'settings' ? 'active' : ''}`}
          title="Settings"
        >
          <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
          <span>Setup</span>
        </button>
      </nav>

      {/* Main Content */}
      <main className="app-content">
        {renderActiveTab()}
      </main>

      {/* Toast notifications */}
      <div className={`toast ${toast.visible ? '' : 'hidden'}`}>
        {toast.message}
      </div>
    </div>
  );
}
