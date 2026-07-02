// ZenFlow Service Worker (Background Script)

chrome.runtime.onInstalled.addListener(() => {
  console.log('ZenFlow extension installed successfully!');
  // Initialize default settings if not already present
  chrome.storage.local.get(['theme', 'notes', 'sessions', 'dailyFocus'], (result) => {
    if (!result.theme) {
      chrome.storage.local.set({ theme: 'dark-velvet' });
    }
    if (!result.notes) {
      chrome.storage.local.set({ notes: [] });
    }
    if (!result.sessions) {
      chrome.storage.local.set({ sessions: [] });
    }
    if (!result.dailyFocus) {
      chrome.storage.local.set({ dailyFocus: '' });
    }
  });
});

// Listener for messages from popup or content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'saveSession') {
    // Save current window's tabs
    chrome.tabs.query({ currentWindow: true }, (tabs) => {
      const tabData = tabs.map(tab => ({
        title: tab.title,
        url: tab.url,
        favIconUrl: tab.favIconUrl
      }));
      
      chrome.storage.local.get(['sessions'], (result) => {
        const sessions = result.sessions || [];
        const newSession = {
          id: Date.now(),
          name: request.sessionName || `Session ${sessions.length + 1}`,
          date: new Date().toLocaleString(),
          tabs: tabData
        };
        
        sessions.push(newSession);
        chrome.storage.local.set({ sessions }, () => {
          sendResponse({ success: true, session: newSession });
        });
      });
    });
    return true; // Keep message channel open for async response
  }

  if (request.action === 'restoreSession') {
    // Open all tabs from a saved session
    const sessionTabs = request.tabs || [];
    if (sessionTabs.length === 0) {
      sendResponse({ success: false, error: 'No tabs in this session' });
      return;
    }
    
    // Open first tab in a new window, then add the rest
    chrome.windows.create({ url: sessionTabs[0].url }, (window) => {
      const tabPromises = [];
      for (let i = 1; i < sessionTabs.length; i++) {
        tabPromises.push(
          new Promise((resolve) => {
            chrome.tabs.create({ windowId: window.id, url: sessionTabs[i].url }, resolve);
          })
        );
      }
      Promise.all(tabPromises).then(() => {
        sendResponse({ success: true });
      });
    });
    return true;
  }
});
