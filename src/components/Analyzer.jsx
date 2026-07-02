import React, { useState } from 'react';
import { analyzePage } from '../utils/chrome';

export default function Analyzer({ showToast }) {
  const [loading, setLoading] = useState(false);
  const [analysisData, setAnalysisData] = useState(null);
  const [linksQuery, setLinksQuery] = useState('');

  const handleAnalyze = () => {
    setLoading(true);
    showToast('Injecting analyzer...');

    analyzePage((response) => {
      setLoading(false);
      if (response && response.success) {
        setAnalysisData(response.data);
        showToast('Analysis complete!');
      } else {
        showToast(response?.error || 'Analysis failed. Reload page.');
      }
    });
  };

  const handleCopyLink = (url) => {
    navigator.clipboard.writeText(url).then(() => {
      showToast('Link copied!');
    });
  };

  const handleOpenLink = (url) => {
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.create({ url });
    } else {
      window.open(url, '_blank');
    }
  };

  // Filter links
  const filteredLinks = analysisData?.links 
    ? analysisData.links.filter(link => {
        const query = linksQuery.toLowerCase();
        return (
          (link.text && link.text.toLowerCase().includes(query)) ||
          (link.url && link.url.toLowerCase().includes(query))
        );
      })
    : [];

  return (
    <div className="tab-panel active">
      <div className="analyzer-action-bar">
        <p className="helper-text">Extract insights, structural headings, and links from your active webpage.</p>
        <button 
          onClick={handleAnalyze} 
          disabled={loading} 
          className="btn btn-primary btn-large"
        >
          <svg className="btn-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style={{width: '18px', height: '18px'}}>
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
          {loading ? 'Analyzing page...' : 'Analyze Current Page'}
        </button>
      </div>

      {!analysisData ? (
        <div className="analyzer-placeholder">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
          <p>No analysis performed yet. Click the button above to analyze the active tab.</p>
        </div>
      ) : (
        <div className="analysis-results">
          {/* Metadata Grid */}
          <div className="metadata-grid">
            <div className="meta-card">
              <span className="meta-label">Title</span>
              <span className="meta-value" title={analysisData.title}>{analysisData.title}</span>
            </div>
            <div className="meta-card">
              <span class="meta-label">Estimated Reading Time</span>
              <span className="meta-value">{analysisData.readingTime} min</span>
            </div>
            <div className="meta-card">
              <span class="meta-label">Word Count</span>
              <span className="meta-value">{analysisData.wordCount.toLocaleString()} words</span>
            </div>
          </div>

          <div className="meta-card description-card">
            <span className="meta-label">Description</span>
            <span className="meta-value">{analysisData.description}</span>
          </div>

          {/* Outline and Links List */}
          <div className="analyzer-details-row">
            {/* Outline */}
            <div className="details-column">
              <h3>Heading Outline</h3>
              <div className="headings-tree">
                {analysisData.headers.length === 0 ? (
                  <div className="empty-list-msg">No headings (H1-H4) found.</div>
                ) : (
                  analysisData.headers.map((h, i) => (
                    <div key={i} className={`heading-node ${h.tag}`}>
                      {h.tag.toUpperCase()}: {h.text}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Links */}
            <div className="details-column">
              <div className="links-header">
                <h3>Extracted Links ({analysisData.links.length})</h3>
                <input 
                  type="text" 
                  value={linksQuery}
                  onChange={(e) => setLinksQuery(e.target.value)}
                  className="search-input" 
                  placeholder="Filter links..."
                />
              </div>
              <div className="links-list">
                {filteredLinks.length === 0 ? (
                  <div className="empty-list-msg">No matching links.</div>
                ) : (
                  filteredLinks.map((link, i) => (
                    <div key={i} className="link-node">
                      <div className="link-node-info">
                        <span className="link-node-text">{link.text}</span>
                        <span className="link-node-url" title={link.url}>{link.url}</span>
                      </div>
                      <div className="note-actions">
                        <button 
                          onClick={() => handleCopyLink(link.url)} 
                          className="btn-small-action btn-restore" 
                          title="Copy Link URL"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                          </svg>
                        </button>
                        <button 
                          onClick={() => handleOpenLink(link.url)} 
                          className="btn-small-action" 
                          title="Open Link"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                            <polyline points="15 3 21 3 21 9" />
                            <line x1="10" y1="14" x2="21" y2="3" />
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
      )}
    </div>
  );
}
