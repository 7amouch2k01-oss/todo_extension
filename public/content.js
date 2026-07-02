// ZenFlow Content Script - Web Page Scraper & Analyzer

// Listen for messages from popup.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'analyzePage') {
    try {
      const pageInfo = analyzeWebPage();
      sendResponse({ success: true, data: pageInfo });
    } catch (error) {
      sendResponse({ success: false, error: error.message });
    }
  }
  return true; // async support
});

// Function to gather page details
function analyzeWebPage() {
  const result = {
    title: document.title || 'Untitled Page',
    url: window.location.href,
    description: getMetaContent('description') || getMetaContent('og:description') || 'No description meta-tag found.',
    wordCount: 0,
    readingTime: 0,
    headers: [],
    links: []
  };

  // Word count & reading time estimation (200 WPM average)
  const bodyText = document.body ? document.body.innerText : '';
  const cleanText = bodyText.trim().replace(/\s+/g, ' ');
  const wordCount = cleanText ? cleanText.split(' ').length : 0;
  result.wordCount = wordCount;
  result.readingTime = Math.max(1, Math.ceil(wordCount / 200));

  // Extract Heading Structure (first 15 headings for overview)
  const headingElements = document.querySelectorAll('h1, h2, h3, h4');
  headingElements.forEach((h, index) => {
    if (index < 15) {
      result.headers.push({
        tag: h.tagName.toLowerCase(),
        text: h.innerText.trim().substring(0, 80)
      });
    }
  });

  // Extract Links (first 100 links to prevent performance issues)
  const linkElements = document.querySelectorAll('a[href]');
  const uniqueUrls = new Set();
  
  for (let i = 0; i < linkElements.length; i++) {
    if (uniqueUrls.size >= 100) break;
    
    const a = linkElements[i];
    let href = a.getAttribute('href');
    const text = a.innerText.trim();
    
    // Resolve relative URLs to absolute
    if (href && !href.startsWith('javascript:') && !href.startsWith('#')) {
      try {
        const absoluteUrl = new URL(href, window.location.href).href;
        if (!uniqueUrls.has(absoluteUrl)) {
          uniqueUrls.add(absoluteUrl);
          result.links.push({
            text: text || '[Empty Link Text]',
            url: absoluteUrl
          });
        }
      } catch (e) {
        // Skip invalid URLs
      }
    }
  }

  return result;
}

// Helper to extract meta tag content
function getMetaContent(nameOrProperty) {
  const element = document.querySelector(
    `meta[name="${nameOrProperty}"], meta[property="${nameOrProperty}"]`
  );
  return element ? element.getAttribute('content') : null;
}
