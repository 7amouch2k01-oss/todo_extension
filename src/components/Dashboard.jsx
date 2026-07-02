import React, { useState, useEffect } from 'react';
import { getStorage, setStorage } from '../utils/chrome';

export default function Dashboard({ openTabsCount, sessionsCount, notesCount, setTab, showToast }) {
  const [time, setTime] = useState('');
  const [dateStr, setDateStr] = useState('');
  const [greeting, setGreeting] = useState('Hello there,');
  
  // Daily Focus (single primary target)
  const [focusInput, setFocusInput] = useState('');
  const [focusText, setFocusText] = useState('');
  const [focusChecked, setFocusChecked] = useState(false);

  // Task Checklist
  const [tasks, setTasks] = useState([]);
  const [taskInput, setTaskInput] = useState('');
  const [taskDate, setTaskDate] = useState('');
  const [showOptions, setShowOptions] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all' | 'todo' | 'done'

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      let hours = now.getHours();
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      setTime(`${hours}:${minutes} ${ampm}`);

      const options = { weekday: 'long', month: 'long', day: 'numeric' };
      setDateStr(now.toLocaleDateString('en-US', options));

      const hr = now.getHours();
      if (hr < 12) setGreeting('Good morning,');
      else if (hr < 18) setGreeting('Good afternoon,');
      else setGreeting('Good evening,');
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);

    getStorage(['dailyFocus', 'dailyFocusChecked'], (result) => {
      if (result.dailyFocus) {
        setFocusText(result.dailyFocus);
        setFocusChecked(result.dailyFocusChecked || false);
      }
    });

    getStorage(['tasks'], (result) => {
      if (result.tasks) setTasks(result.tasks);
    });

    return () => clearInterval(interval);
  }, []);

  // --- Daily Focus Handlers ---
  const handleSaveFocus = () => {
    const val = focusInput.trim();
    if (val) {
      setStorage({ dailyFocus: val, dailyFocusChecked: false }, () => {
        setFocusText(val);
        setFocusChecked(false);
        setFocusInput('');
        showToast('Daily focus set!');
      });
    }
  };

  const handleFocusCheckToggle = (e) => {
    const checked = e.target.checked;
    setFocusChecked(checked);
    setStorage({ dailyFocusChecked: checked });
  };

  const handleClearFocus = () => {
    setStorage({ dailyFocus: '', dailyFocusChecked: false }, () => {
      setFocusText('');
      setFocusChecked(false);
      showToast('Daily focus cleared');
    });
  };

  // --- Tasks Checklist Handlers ---
  const handleAddTask = () => {
    const val = taskInput.trim();
    if (!val) return;

    const newTask = {
      id: Date.now(),
      text: val,
      completed: false,
      dueDate: taskDate || null,
    };

    const updated = [...tasks, newTask];
    setStorage({ tasks: updated }, () => {
      setTasks(updated);
      setTaskInput('');
      setTaskDate('');
      setShowOptions(false);
      showToast('Task added!');
    });
  };

  const handleToggleTask = (id) => {
    const updated = tasks.map(t =>
      t.id === id ? { ...t, completed: !t.completed } : t
    );
    setStorage({ tasks: updated }, () => setTasks(updated));
  };

  const handleDeleteTask = (id) => {
    const updated = tasks.filter(t => t.id !== id);
    setStorage({ tasks: updated }, () => {
      setTasks(updated);
      showToast('Task deleted');
    });
  };

  // Filter logic
  const filteredTasks = tasks.filter(t => {
    if (filter === 'todo') return !t.completed;
    if (filter === 'done') return t.completed;
    return true;
  });

  // Due-date helpers
  const today = new Date().toISOString().split('T')[0];
  const formatDue = (d) => {
    if (!d) return null;
    if (d === today) return { label: 'Today', overdue: false, today: true };
    const diff = Math.ceil((new Date(d) - new Date(today)) / 86400000);
    if (diff < 0) return { label: `${Math.abs(diff)}d overdue`, overdue: true, today: false };
    if (diff === 1) return { label: 'Tomorrow', overdue: false, today: false };
    return { label: new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), overdue: false, today: false };
  };

  const doneCnt = tasks.filter(t => t.completed).length;

  return (
    <div className="tab-panel active">
      {/* Welcome greeting card */}
      <div className="welcome-card">
        <div className="greeting-container">
          <h2>{greeting}</h2>
          <p>{dateStr}</p>
        </div>
        <div className="clock-display">{time}</div>
      </div>

      {/* Two columns: Focus and Checklist */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        
        {/* Daily Focus Card */}
        <div className="focus-card" style={{ marginBottom: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <h3>Daily Focus</h3>
          {!focusText ? (
            <div className="focus-input-group">
              <input 
                type="text" 
                value={focusInput}
                onChange={(e) => setFocusInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveFocus()}
                placeholder="What is your main focus today?"
              />
              <button onClick={handleSaveFocus} className="btn btn-primary">Set</button>
            </div>
          ) : (
            <div className="focus-display-group">
              <label className="focus-checkbox-container">
                <input 
                  type="checkbox" 
                  checked={focusChecked} 
                  onChange={handleFocusCheckToggle}
                />
                <span className="checkmark"></span>
                <span id="focus-text" style={{ textDecoration: focusChecked ? 'line-through' : 'none' }}>
                  {focusText}
                </span>
              </label>
              <button onClick={handleClearFocus} className="btn btn-icon" title="Clear focus">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width: '16px', height: '16px'}}>
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* Tasks Checklist Card */}
        <div className="focus-card tasks-checklist-card" style={{ marginBottom: 0 }}>
          {/* Header row with count + filter pills */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <h3 style={{ margin: 0 }}>
              Tasks
              <span style={{
                marginLeft: '8px',
                fontSize: '0.68rem',
                fontWeight: 500,
                color: 'var(--text-muted)',
                background: 'var(--item-bg)',
                padding: '2px 8px',
                borderRadius: '20px',
                border: '1px solid var(--border-color)'
              }}>
                {doneCnt}/{tasks.length}
              </span>
            </h3>

            {/* Filter Pills */}
            <div className="task-filter-pills">
              {['all', 'todo', 'done'].map(f => (
                <button
                  key={f}
                  className={`task-filter-pill ${filter === f ? 'active' : ''}`}
                  onClick={() => setFilter(f)}
                >
                  {f === 'all' ? 'All' : f === 'todo' ? 'To Do' : 'Done'}
                </button>
              ))}
            </div>
          </div>

          {/* Input + Options */}
          <div style={{ marginBottom: '10px' }}>
            <div className="focus-input-group" style={{ marginBottom: '6px' }}>
              <input 
                type="text" 
                value={taskInput}
                onChange={(e) => setTaskInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
                placeholder="Add a task..."
                style={{ padding: '7px 10px', fontSize: '0.8rem' }}
              />
              {/* Options toggle */}
              <button
                className={`btn btn-icon task-options-btn ${showOptions ? 'active' : ''}`}
                onClick={() => setShowOptions(p => !p)}
                title="Options"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width: '15px', height: '15px'}}>
                  <circle cx="12" cy="5" r="1" fill="currentColor"/>
                  <circle cx="12" cy="12" r="1" fill="currentColor"/>
                  <circle cx="12" cy="19" r="1" fill="currentColor"/>
                </svg>
              </button>
              <button onClick={handleAddTask} className="btn btn-primary" style={{ padding: '7px 12px', fontSize: '0.8rem' }}>Add</button>
            </div>

            {/* Expandable Options Panel */}
            {showOptions && (
              <div className="task-options-panel">
                <label className="task-option-label">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width: '13px', height: '13px', flexShrink: 0}}>
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                  Due date <span style={{color:'var(--text-muted)',fontSize:'0.7rem'}}>(optional)</span>
                </label>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <input
                    type="date"
                    value={taskDate}
                    min={today}
                    onChange={(e) => setTaskDate(e.target.value)}
                    style={{ padding: '5px 8px', fontSize: '0.78rem', flex: 1 }}
                  />
                  {taskDate && (
                    <button
                      className="btn btn-icon"
                      onClick={() => setTaskDate('')}
                      title="Clear date"
                      style={{ padding: '5px 7px' }}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width: '12px', height: '12px'}}>
                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Task List */}
          <div className="checklist-items-list" style={{ maxHeight: '130px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '5px' }}>
            {filteredTasks.length === 0 ? (
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center', padding: '12px 0' }}>
                {filter === 'done' ? 'No completed tasks yet.' : filter === 'todo' ? 'All tasks done! 🎉' : 'No tasks yet. Add one above!'}
              </div>
            ) : (
              filteredTasks.map(task => {
                const due = formatDue(task.dueDate);
                return (
                  <div
                    key={task.id}
                    className={`focus-display-group task-item ${task.completed ? 'task-done' : ''} ${due?.overdue ? 'task-overdue' : ''}`}
                    style={{ padding: '6px 10px', borderLeftWidth: '2px', borderLeftColor: task.completed ? 'var(--text-muted)' : due?.overdue ? 'var(--danger-color, #FF4D4D)' : 'var(--accent)' }}
                  >
                    {/* Checkbox + text */}
                    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
                      <label className="focus-checkbox-container" style={{ fontSize: '0.8rem', paddingLeft: '22px', margin: 0 }}>
                        <input 
                          type="checkbox" 
                          checked={task.completed} 
                          onChange={() => handleToggleTask(task.id)}
                        />
                        <span className="checkmark" style={{ width: '14px', height: '14px', borderRadius: '3px' }}></span>
                        <span style={{
                          textDecoration: task.completed ? 'line-through' : 'none',
                          color: task.completed ? 'var(--text-muted)' : 'var(--text-main)',
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '120px'
                        }}>
                          {task.text}
                        </span>
                      </label>
                      {/* Due date badge */}
                      {due && (
                        <span style={{
                          marginLeft: '22px',
                          marginTop: '2px',
                          fontSize: '0.62rem',
                          fontWeight: 600,
                          color: due.overdue ? 'var(--danger-color, #FF4D4D)' : due.today ? 'var(--accent)' : 'var(--text-muted)',
                          letterSpacing: '0.2px'
                        }}>
                          {due.overdue ? '⚠ ' : due.today ? '📅 ' : '🗓 '}{due.label}
                        </span>
                      )}
                    </div>
                    <button 
                      onClick={() => handleDeleteTask(task.id)} 
                      className="btn-small-action" 
                      title="Delete task"
                      style={{ padding: '2px', flexShrink: 0 }}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width: '12px', height: '12px'}}>
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Stats Counter Cards */}
      <div className="stats-grid">
        <div className="stat-box" onClick={() => setTab('tabs')}>
          <span className="stat-val">{openTabsCount}</span>
          <span className="stat-lbl">Active Tabs</span>
        </div>
        <div className="stat-box" onClick={() => setTab('tabs')}>
          <span className="stat-val">{sessionsCount}</span>
          <span className="stat-lbl">Saved Sessions</span>
        </div>
        <div className="stat-box" onClick={() => setTab('notes')}>
          <span className="stat-val">{notesCount}</span>
          <span className="stat-lbl">Quick Notes</span>
        </div>
      </div>
    </div>
  );
}
