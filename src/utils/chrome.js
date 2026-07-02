// Chrome API abstraction layer with mock fallbacks for local browser development

const isChromeExtension = typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local;

// Mock data for local testing in browser
const mockTabs = [
  { id: 1, title: 'Google Search', url: 'https://www.google.com', favIconUrl: 'https://www.google.com/favicon.ico', windowId: 1 },
  { id: 2, title: 'GitHub: Let\'s build from here', url: 'https://github.com', favIconUrl: 'https://github.githubassets.com/favicons/favicon.svg', windowId: 1 },
  { id: 3, title: 'React Documentation', url: 'https://react.dev', favIconUrl: 'https://react.dev/favicon.ico', windowId: 1 },
  { id: 4, title: 'Vite | Next Generation Frontend Tooling', url: 'https://vite.dev', favIconUrl: 'https://vite.dev/logo.svg', windowId: 1 },
  { id: 5, title: 'MDN Web Docs', url: 'https://developer.mozilla.org', favIconUrl: 'https://developer.mozilla.org/favicon-48x48.png', windowId: 1 }
];

const mockAnalysis = {
  title: 'React Documentation',
  url: 'https://react.dev',
  description: 'The library for web and native user interfaces. Build user interfaces out of individual pieces called components.',
  wordCount: 1420,
  readingTime: 7,
  headers: [
    { tag: 'h1', text: 'React: The library for web and native user interfaces' },
    { tag: 'h2', text: 'Create user interfaces from components' },
    { tag: 'h3', text: 'Write components with code and markup' },
    { tag: 'h2', text: 'Add interactivity where you need it' },
    { tag: 'h4', text: 'Manage state and user input' }
  ],
  links: [
    { text: 'Getting Started', url: 'https://react.dev/learn' },
    { text: 'API Reference', url: 'https://react.dev/reference/react' },
    { text: 'GitHub Repository', url: 'https://github.com/facebook/react' },
    { text: 'Community Forum', url: 'https://react.dev/community' }
  ]
};

// --- Storage API Wrapper ---
export function getStorage(keys, callback) {
  if (isChromeExtension) {
    chrome.storage.local.get(keys, callback);
  } else {
    const result = {};
    const keyArray = Array.isArray(keys) ? keys : [keys];
    keyArray.forEach(key => {
      const val = localStorage.getItem(key);
      try {
        result[key] = val ? JSON.parse(val) : undefined;
      } catch (e) {
        result[key] = val;
      }
    });
    setTimeout(() => callback(result), 50);
  }
}

export function setStorage(items, callback) {
  if (isChromeExtension) {
    chrome.storage.local.set(items, callback);
  } else {
    Object.keys(items).forEach(key => {
      localStorage.setItem(key, JSON.stringify(items[key]));
    });
    if (callback) setTimeout(callback, 50);
  }
}

export function clearStorage(callback) {
  if (isChromeExtension) {
    chrome.storage.local.clear(callback);
  } else {
    localStorage.clear();
    if (callback) setTimeout(callback, 50);
  }
}

// --- Tabs API Wrapper ---
export function queryActiveTabs(callback) {
  if (isChromeExtension) {
    chrome.tabs.query({ currentWindow: true }, callback);
  } else {
    // Get mock tabs from local storage if edited, otherwise defaults
    const storedMockTabs = localStorage.getItem('_mock_tabs');
    const tabs = storedMockTabs ? JSON.parse(storedMockTabs) : mockTabs;
    setTimeout(() => callback(tabs), 50);
  }
}

export function focusTab(tabId, windowId) {
  if (isChromeExtension) {
    chrome.tabs.update(tabId, { active: true });
    chrome.windows.update(windowId, { focused: true });
  } else {
    console.log(`Mock: Focusing tab ${tabId} in window ${windowId}`);
  }
}

export function closeTab(tabId, callback) {
  if (isChromeExtension) {
    chrome.tabs.remove(tabId, callback);
  } else {
    const storedMockTabs = localStorage.getItem('_mock_tabs');
    const tabs = storedMockTabs ? JSON.parse(storedMockTabs) : [...mockTabs];
    const updated = tabs.filter(t => t.id !== tabId);
    localStorage.setItem('_mock_tabs', JSON.stringify(updated));
    setTimeout(callback, 50);
  }
}

export function getActiveDomain(callback) {
  if (isChromeExtension) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0] && tabs[0].url) {
        try {
          const urlObj = new URL(tabs[0].url);
          callback(urlObj.protocol.startsWith('http') ? urlObj.hostname : 'System Page');
        } catch (e) {
          callback('Task Boujee');
        }
      } else {
        callback('Task Boujee');
      }
    });
  } else {
    setTimeout(() => callback('react.dev (Mock Mode)'), 50);
  }
}

// --- Session Management ---
export function saveSession(sessionName, callback) {
  if (isChromeExtension) {
    chrome.runtime.sendMessage({ action: 'saveSession', sessionName }, callback);
  } else {
    queryActiveTabs((tabs) => {
      const tabData = tabs.map(tab => ({
        title: tab.title,
        url: tab.url,
        favIconUrl: tab.favIconUrl
      }));

      getStorage(['sessions'], (result) => {
        const sessions = result.sessions || [];
        const newSession = {
          id: Date.now(),
          name: sessionName || `Session ${sessions.length + 1}`,
          date: new Date().toLocaleString(),
          tabs: tabData
        };
        sessions.push(newSession);
        setStorage({ sessions }, () => {
          callback({ success: true, session: newSession });
        });
      });
    });
  }
}

export function restoreSession(sessionTabs, callback) {
  if (isChromeExtension) {
    chrome.runtime.sendMessage({ action: 'restoreSession', tabs: sessionTabs }, callback);
  } else {
    console.log('Mock: Restoring session tabs:', sessionTabs);
    // Open in separate windows / logs
    sessionTabs.forEach(t => {
      window.open(t.url, '_blank');
    });
    setTimeout(() => callback({ success: true }), 100);
  }
}

// --- Page Scraper API ---
export function analyzePage(callback) {
  if (isChromeExtension) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0];
      if (!activeTab || !activeTab.id) {
        callback({ success: false, error: 'No active tab found' });
        return;
      }

      if (!activeTab.url || !activeTab.url.startsWith('http')) {
        callback({ success: false, error: 'Cannot scrape system pages' });
        return;
      }

      // Try sending message to content script
      chrome.tabs.sendMessage(activeTab.id, { action: 'analyzePage' }, (response) => {
        if (chrome.runtime.lastError || !response) {
          // Script not injected, let's inject it programmatically
          chrome.scripting.executeScript({
            target: { tabId: activeTab.id },
            files: ['content.js']
          }, () => {
            setTimeout(() => {
              chrome.tabs.sendMessage(activeTab.id, { action: 'analyzePage' }, (retryResponse) => {
                if (retryResponse) {
                  callback(retryResponse);
                } else {
                  callback({ success: false, error: 'Failed to scrape page.' });
                }
              });
            }, 150);
          });
        } else {
          callback(response);
        }
      });
    });
  } else {
    // Return mock analysis
    setTimeout(() => callback({ success: true, data: mockAnalysis }), 800);
  }
}
