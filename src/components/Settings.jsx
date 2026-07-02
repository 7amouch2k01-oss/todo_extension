import React from 'react';
import { getStorage, setStorage, clearStorage } from '../utils/chrome';

export default function Settings({ theme, onThemeChange, showToast }) {
  const themes = [
    { id: 'theme-boujee-gold', name: 'Boujee Dark', background: 'linear-gradient(135deg, #0A0A0C, #1B1B22)', accent: '#E5C158' },
    { id: 'theme-light-glass', name: 'Boujee Light', background: 'linear-gradient(135deg, #F0F2F5, #E3E7ED)', accent: '#C5A028' }
  ];

  const handleExport = () => {
    getStorage(['notes', 'sessions', 'dailyFocus', 'dailyFocusChecked', 'tasks'], (result) => {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(result));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `task_boujee_backup_${Date.now()}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      showToast('Backup downloaded!');
    });
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target.result);
        setStorage(imported, () => {
          showToast('Import successful! Reloading...');
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        });
      } catch (err) {
        showToast('Invalid backup file format');
      }
    };
    reader.readAsText(file);
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to delete all notes, saved sessions, and settings? This cannot be undone.')) {
      clearStorage(() => {
        setStorage({
          theme: 'theme-dark-velvet',
          notes: [],
          sessions: [],
          dailyFocus: '',
          dailyFocusChecked: false,
          tasks: []
        }, () => {
          showToast('Data reset complete. Reloading...');
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        });
      });
    }
  };

  return (
    <div className="tab-panel active">
      {/* Themes swatch selector */}
      <div className="section-card">
        <h3>Personalization</h3>
        <p className="setting-desc">Choose a design theme for your Task Boujee interface.</p>
        <div className="theme-selector-grid">
          {themes.map(t => (
            <button 
              key={t.id}
              onClick={() => onThemeChange(t.id)}
              className={`theme-swatch ${theme === t.id ? 'active' : ''}`}
              style={{ background: t.background }}
            >
              <span className="theme-name">{t.name}</span>
              <span className="theme-accent" style={{ background: t.accent }}></span>
            </button>
          ))}
        </div>
      </div>

      {/* Backup tools */}
      <div className="section-card">
        <h3>Data Management</h3>
        <p className="setting-desc">Backup or migrate your Task Boujee notes, sessions, and preferences.</p>
        <div className="settings-actions">
          <button onClick={handleExport} className="btn btn-secondary">Export Backup (JSON)</button>
          <label htmlFor="import-file" className="btn btn-secondary label-btn">
            Import Backup
            <input 
              type="file" 
              id="import-file" 
              accept=".json" 
              onChange={handleImport}
              style={{ display: 'none' }}
            />
          </label>
          <button onClick={handleReset} className="btn btn-danger">Reset All Settings</button>
        </div>
      </div>

      {/* Brand card */}
      <div className="section-card about-card">
        <h3>Task Boujee v1.0.0</h3>
        <p>Created with premium design principles. Experience smooth productivity flows in every tab.</p>
      </div>
    </div>
  );
}
