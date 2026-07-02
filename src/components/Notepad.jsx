import React, { useState, useEffect } from 'react';
import { getStorage, setStorage } from '../utils/chrome';

export default function Notepad({ onNotesChange, showToast }) {
  const [notes, setNotes] = useState([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tag, setTag] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = () => {
    getStorage(['notes'], (result) => {
      const storedNotes = result.notes || [];
      setNotes(storedNotes);
      onNotesChange(storedNotes.length);
    });
  };

  const handleSaveNote = () => {
    const noteTitle = title.trim();
    const noteContent = content.trim();
    const noteTag = tag.trim() || 'General';

    if (!noteTitle || !noteContent) {
      showToast('Please provide a title and content');
      return;
    }

    const newNote = {
      id: Date.now(),
      title: noteTitle,
      content: noteContent,
      tag: noteTag,
      date: new Date().toLocaleDateString()
    };

    const updated = [newNote, ...notes];
    setStorage({ notes: updated }, () => {
      setTitle('');
      setContent('');
      setTag('');
      setNotes(updated);
      onNotesChange(updated.length);
      showToast('Note saved!');
    });
  };

  const handleCopyNote = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      showToast('Copied note to clipboard!');
    });
  };

  const handleDeleteNote = (id) => {
    const updated = notes.filter(n => n.id !== id);
    setStorage({ notes: updated }, () => {
      setNotes(updated);
      onNotesChange(updated.length);
      showToast('Note deleted');
    });
  };

  const filteredNotes = notes.filter(note => {
    const query = searchQuery.toLowerCase();
    return (
      (note.title && note.title.toLowerCase().includes(query)) ||
      (note.content && note.content.toLowerCase().includes(query)) ||
      (note.tag && note.tag.toLowerCase().includes(query))
    );
  });

  return (
    <div className="tab-panel active">
      <div className="notes-workspace">
        {/* Editor Form */}
        <div className="note-editor section-card">
          <h3>New Note</h3>
          <input 
            type="text" 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Note Title..."
          />
          <textarea 
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your ideas here..." 
            rows="5"
          />
          <div className="editor-row">
            <input 
              type="text" 
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              placeholder="Tag (e.g. Work, Idea, Draft)"
            />
            <button onClick={handleSaveNote} className="btn btn-primary">Save Note</button>
          </div>
        </div>

        {/* Notes Directory */}
        <div className="notes-directory">
          <div className="list-header">
            <h3>My Notes ({notes.length})</h3>
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input" 
              placeholder="Search notes..."
            />
          </div>
          <div className="notes-grid">
            {filteredNotes.length === 0 ? (
              <div className="empty-list-msg">No notes found. Create one to begin.</div>
            ) : (
              filteredNotes.map(note => (
                <div key={note.id} className="note-card">
                  <div className="note-header">
                    <span className="note-title-text">{note.title}</span>
                    <span className="note-tag-badge">{note.tag}</span>
                  </div>
                  <div className="note-content-preview">{note.content}</div>
                  <div className="note-footer">
                    <span className="note-date">{note.date}</span>
                    <div className="note-actions">
                      <button 
                        onClick={() => handleCopyNote(note.content)} 
                        className="btn-small-action btn-restore" 
                        title="Copy Content"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                        </svg>
                      </button>
                      <button 
                        onClick={() => handleDeleteNote(note.id)} 
                        className="btn-small-action" 
                        title="Delete Note"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    </div>
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
