import React, { useState, useEffect } from 'react';
import { queryActiveTabs, closeTab, focusTab, saveSession, restoreSession, getStorage, setStorage } from '../utils/chrome';

export default function TabManager({ onSessionsChange, showToast }) {
  const [activeTabs, setActiveTabs] = useState([]);
  const [savedSessions, setSavedSessions] = useState([]);
  const [sessionName, setSessionName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Initial load
  useEffect(() => {
    loadActiveTabs();
    loadSavedSessions();
  }, []);

  const loadActiveTabs = () => {
    queryActiveTabs((tabs) => {
      setActiveTabs(tabs || []);
    });
  };

  const loadSavedSessions = () => {
    getStorage(['sessions'], (result) => {
      const sessions = result.sessions || [];
      setSavedSessions(sessions);
      onSessionsChange(sessions.length);
    });
  };

  const handleCloseTab = (tabId, e) => {
    e.stopPropagation();
    closeTab(tabId, () => {
      loadActiveTabs();
      showToast('Tab closed');
    });
  };

  const handleFocusTab = (tabId, windowId) => {
    focusTab(tabId, windowId);
  };

  const handleSaveSession = () => {
    const name = sessionName.trim();
    if (!name) {
      showToast('Please enter a session name');
      return;
    }

    saveSession(name, (response) => {
      if (response && response.success) {
        setSessionName('');
        showToast('Session saved!');
        loadSavedSessions();
      } else {
        showToast('Failed to save session');
      }
    });
  };

  const handleRestoreSession = (tabs) => {
    restoreSession(tabs, (response) => {
      if (response && response.success) {
        showToast('Session restored!');
      } else {
        showToast('Failed to restore session');
      }
    });
  };

  const handleDeleteSession = (id) => {
    const updated = savedSessions.filter(s => s.id !== id);
    setStorage({ sessions: updated }, () => {
      setSavedSessions(updated);
      onSessionsChange(updated.length);
      showToast('Session deleted');
    });
  };

  // Filters active tabs
  const filteredTabs = activeTabs.filter(tab => {
    const query = searchQuery.toLowerCase();
    return (
      (tab.title && tab.title.toLowerCase().includes(query)) ||
      (tab.url && tab.url.toLowerCase().includes(query))
    );
  });

  return (
    <div className="tab-panel active">
      {/* Save Session Card */}
      <div className="section-card">
        <h3>Save Active Window Session</h3>
        <div className="input-group">
          <input 
            type="text" 
            value={sessionName}
            onChange={(e) => setSessionName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSaveSession()}
            placeholder="e.g., Work Setup, Reference Links"
          />
          <button onClick={handleSaveSession} className="btn btn-primary">Save Session</button>
        </div>
      </div>

      {/* Tab Lists Container */}
      <div className="tab-columns">
        {/* Active Tabs List */}
        <div className="tabs-list-wrapper">
          <div className="list-header">
            <h3>Active Tabs ({activeTabs.length})</h3>
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input" 
              placeholder="Filter tabs..."
            />
          </div>
          <div className="list-container">
            {filteredTabs.length === 0 ? (
              <div className="empty-list-msg">No active tabs match.</div>
            ) : (
              filteredTabs.map(tab => {
                const hostname = tab.url ? new URL(tab.url).hostname : '';
                return (
                  <div key={tab.id} className="tab-item">
                    <div className="tab-info-row" onClick={() => handleFocusTab(tab.id, tab.windowId)}>
                      {tab.favIconUrl && tab.favIconUrl.startsWith('http') ? (
                        <img 
                          className="tab-fav" 
                          src={tab.favIconUrl} 
                          alt="" 
                          onError={(e) => {
                            e.target.style.display = 'none';
                            // Show placeholder fallback
                          }}
                        />
                      ) : (
                        <span className="tab-fav-placeholder" />
                      )}
                      <div className="tab-meta-col">
                        <span className="tab-title-text">{tab.title || 'Untitled'}</span>
                        <span className="tab-domain-text">{hostname || tab.url}</span>
                      </div>
                    </div>
                    <button 
                      onClick={(e) => handleCloseTab(tab.id, e)} 
                      className="btn-small-action" 
                      title="Close Tab"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Saved Sessions List */}
        <div className="sessions-list-wrapper">
          <div className="list-header">
            <h3>Saved Sessions ({savedSessions.length})</h3>
          </div>
          <div className="list-container">
            {savedSessions.length === 0 ? (
              <div className="empty-list-msg">No saved sessions yet.</div>
            ) : (
              savedSessions.map(session => (
                <div key={session.id} className="session-item">
                  <div className="session-info-row">
                    <svg className="session-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                    </svg>
                    <div className="tab-meta-col">
                      <span className="session-name-text">{session.name}</span>
                      <span className="session-meta-text">{session.tabs.length} tabs • {session.date}</span>
                    </div>
                  </div>
                  <div className="session-actions">
                    <button 
                      onClick={() => handleRestoreSession(session.tabs)} 
                      className="btn-small-action btn-restore" 
                      title="Restore Session"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                        <polyline points="15 3 21 3 21 9" />
                        <line x1="10" y1="14" x2="21" y2="3" />
                      </svg>
                    </button>
                    <button 
                      onClick={() => handleDeleteSession(session.id)} 
                      className="btn-small-action" 
                      title="Delete Session"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
