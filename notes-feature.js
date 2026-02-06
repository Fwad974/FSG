/**
 * DSCC 2026 - Attendee Notes Feature v2 (Fixed Layout)
 * Add before </body>:  <script src="notes-feature.js"></script>
 */
(function() {
  'use strict';

  const notesCSS = document.createElement('style');
  notesCSS.textContent = `
    /* Force speaker-line to wrap so notes go below */
    .speaker-line[data-talk-id] {
      flex-wrap: wrap !important;
    }

    /* Inline notes — full width below speaker info */
    .inline-notes-area {
      display: none;
      flex-basis: 100% !important;
      width: 100% !important;
      order: 99;
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid rgba(201,169,98,0.1);
    }
    .inline-notes-area.show { display: block !important; }
    .inline-notes-area textarea {
      width: 100%; min-height: 80px; max-height: 200px; padding: 12px 14px;
      border-radius: 10px; background: rgba(0,0,0,0.3);
      border: 1px solid rgba(201,169,98,0.2); color: #fff;
      font-family: 'Inter', sans-serif; font-size: 0.82rem; line-height: 1.6;
      resize: vertical; outline: none; transition: border-color 0.3s ease;
    }
    .inline-notes-area textarea:focus {
      border-color: #c9a962; box-shadow: 0 0 0 2px rgba(201,169,98,0.1);
    }
    .inline-notes-area textarea::placeholder { color: rgba(255,255,255,0.25); }
    .inline-notes-area .notes-status {
      font-size: 0.65rem; color: rgba(255,255,255,0.3);
      margin-top: 5px; text-align: right; transition: color 0.3s ease;
    }
    .inline-notes-area .notes-status.just-saved { color: #2ecc71; }

    /* Talk actions wrapper */
    .talk-actions {
      display: flex !important; gap: 6px; align-items: center;
      flex-shrink: 0; margin-left: auto; order: 10;
    }

    /* Notes pencil button */
    .talk-notes-btn {
      background: rgba(255,255,255,0.06); border: 1px solid rgba(201,169,98,0.15);
      cursor: pointer; padding: 9px; border-radius: 10px; transition: all 0.3s ease;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0; width: 38px; height: 38px;
    }
    .talk-notes-btn svg {
      width: 16px; height: 16px; stroke: rgba(255,255,255,0.4); fill: none; transition: all 0.3s ease;
    }
    .talk-notes-btn:hover { background: rgba(201,169,98,0.15); border-color: rgba(201,169,98,0.35); }
    .talk-notes-btn:hover svg { stroke: #c9a962; }
    .talk-notes-btn.has-notes { background: rgba(201,169,98,0.18); border-color: rgba(201,169,98,0.4); }
    .talk-notes-btn.has-notes svg { stroke: #c9a962; fill: rgba(201,169,98,0.3); }
    .talk-notes-btn.open { background: rgba(201,169,98,0.25); border-color: #c9a962; }
    .talk-notes-btn.open svg { stroke: #c9a962; }

    /* Panel saved item notes */
    .saved-item-notes {
      margin-top: 12px; padding-top: 12px; border-top: 1px solid rgba(201,169,98,0.1);
    }
    .saved-item-notes-label {
      font-size: 0.7rem; color: #c9a962; text-transform: uppercase;
      letter-spacing: 1px; margin-bottom: 8px; display: flex; align-items: center; gap: 6px;
    }
    .saved-item-notes-label svg { width: 12px; height: 12px; stroke: #c9a962; fill: none; }
    .saved-item-notes textarea {
      width: 100%; min-height: 80px; max-height: 200px; padding: 12px;
      border-radius: 10px; background: rgba(0,0,0,0.25);
      border: 1px solid rgba(201,169,98,0.2); color: #fff;
      font-family: 'Inter', sans-serif; font-size: 0.82rem; line-height: 1.6;
      resize: vertical; outline: none; transition: border-color 0.3s ease;
    }
    .saved-item-notes textarea:focus { border-color: #c9a962; }
    .saved-item-notes textarea::placeholder { color: rgba(255,255,255,0.2); }
    .saved-item-notes .notes-status {
      font-size: 0.65rem; color: rgba(255,255,255,0.3);
      margin-top: 5px; text-align: right; transition: color 0.3s ease;
    }
    .saved-item-notes .notes-status.just-saved { color: #2ecc71; }

    /* Export button */
    .export-notes-btn {
      background: rgba(255,255,255,0.1); border: none; border-radius: 50%;
      width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;
      cursor: pointer; transition: all 0.3s ease;
    }
    .export-notes-btn:hover { background: rgba(201,169,98,0.2); }
    .export-notes-btn svg { width: 20px; height: 20px; stroke: #c9a962; fill: none; }

    /* Mobile grid overrides */
    @media (max-width: 600px) {
      .speaker-line[data-talk-id] { grid-template-columns: auto 1fr auto !important; }
      .talk-actions {
        grid-column: 3 !important; grid-row: 1 / 3 !important;
        align-self: center !important; flex-direction: column !important; gap: 4px !important;
      }
      .talk-notes-btn { width: 34px; height: 34px; padding: 7px; }
      .talk-notes-btn svg { width: 14px; height: 14px; }
      .inline-notes-area { grid-column: 1 / -1 !important; grid-row: auto !important; }
    }
  `;
  document.head.appendChild(notesCSS);

  // Notes data store
  const NOTES_KEY = 'dscc2026_notes';
  let allNotes = JSON.parse(localStorage.getItem(NOTES_KEY) || '{}');

  function saveNotesToStorage() { localStorage.setItem(NOTES_KEY, JSON.stringify(allNotes)); }
  function getNote(id) { return allNotes[id] || ''; }
  function setNote(id, text) {
    if (text.trim() === '') delete allNotes[id]; else allNotes[id] = text;
    saveNotesToStorage();
  }

  const debounceTimers = {};
  function debounceSave(id, text) {
    clearTimeout(debounceTimers[id]);
    debounceTimers[id] = setTimeout(() => { setNote(id, text); flashSaved(id); }, 400);
  }
  function flashSaved(id) {
    document.querySelectorAll('.notes-status[data-talk="' + id + '"]').forEach(el => {
      el.textContent = '\u2713 Saved'; el.classList.add('just-saved');
      setTimeout(() => { el.textContent = 'Auto-saved'; el.classList.remove('just-saved'); }, 1500);
    });
  }

  // SVG for pencil icon
  const pencilSVG = '<svg viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>';

  function initSpeakerLineNotes() {
    document.querySelectorAll('.speaker-line').forEach(line => {
      const bookmarkBtn = line.querySelector('.talk-bookmark-btn');
      if (!bookmarkBtn) return;

      const onclickStr = bookmarkBtn.getAttribute('onclick') || '';
      const match = onclickStr.match(/toggleBookmark\('([^']+)'/);
      if (!match) return;
      const talkId = match[1];

      // Skip if already initialized
      if (line.getAttribute('data-talk-id') === talkId && line.querySelector('.talk-notes-btn')) return;
      line.setAttribute('data-talk-id', talkId);

      // Build actions wrapper with pencil + bookmark
      const actionsDiv = document.createElement('div');
      actionsDiv.className = 'talk-actions';

      const notesBtn = document.createElement('button');
      notesBtn.className = 'talk-notes-btn' + (getNote(talkId) ? ' has-notes' : '');
      notesBtn.title = 'Take notes';
      notesBtn.innerHTML = pencilSVG;
      notesBtn.addEventListener('click', e => { e.stopPropagation(); toggleInlineNotes(talkId, notesBtn); });

      actionsDiv.appendChild(notesBtn);
      bookmarkBtn.parentNode.insertBefore(actionsDiv, bookmarkBtn);
      actionsDiv.appendChild(bookmarkBtn);

      // Notes area
      if (!document.getElementById('inline-notes-' + talkId)) {
        const notesArea = document.createElement('div');
        notesArea.className = 'inline-notes-area';
        notesArea.id = 'inline-notes-' + talkId;

        const ta = document.createElement('textarea');
        ta.placeholder = 'Write your notes here\u2026';
        ta.value = getNote(talkId);
        ta.addEventListener('input', function() {
          debounceSave(talkId, this.value);
          const btn = line.querySelector('.talk-notes-btn');
          if (btn) btn.classList.toggle('has-notes', this.value.trim().length > 0);
          syncToPanel(talkId, this.value);
        });
        ta.addEventListener('click', e => e.stopPropagation());

        const status = document.createElement('div');
        status.className = 'notes-status';
        status.setAttribute('data-talk', talkId);
        status.textContent = 'Auto-saved';

        notesArea.appendChild(ta);
        notesArea.appendChild(status);
        line.appendChild(notesArea);
      }
    });
  }

  function toggleInlineNotes(talkId, btn) {
    const area = document.getElementById('inline-notes-' + talkId);
    if (!area) return;
    const isOpen = area.classList.contains('show');

    // Close all others
    document.querySelectorAll('.inline-notes-area.show').forEach(a => { if (a.id !== area.id) a.classList.remove('show'); });
    document.querySelectorAll('.talk-notes-btn.open').forEach(b => b.classList.remove('open'));

    if (!isOpen) {
      area.classList.add('show');
      if (btn) btn.classList.add('open');
      const ta = area.querySelector('textarea');
      if (ta) setTimeout(() => ta.focus(), 50);
    } else {
      area.classList.remove('show');
      if (btn) btn.classList.remove('open');
    }
  }
  window.toggleInlineNotes = toggleInlineNotes;

  // Sync
  function syncToPanel(id, text) {
    const el = document.querySelector('textarea[data-panel-notes="' + id + '"]');
    if (el && el !== document.activeElement) el.value = text;
  }
  function syncToInline(id, text) {
    const area = document.getElementById('inline-notes-' + id);
    if (!area) return;
    const ta = area.querySelector('textarea');
    if (ta && ta !== document.activeElement) ta.value = text;
    const line = area.closest('.speaker-line');
    if (line) { const b = line.querySelector('.talk-notes-btn'); if (b) b.classList.toggle('has-notes', text.trim().length > 0); }
  }
  window._dsccNotes = {
    onPanelInput: function(id, ta) { debounceSave(id, ta.value); syncToInline(id, ta.value); }
  };

  // Patch panel
  function addExportButton() {
    const ha = document.querySelector('.panel-header-actions');
    if (!ha || ha.querySelector('.export-notes-btn')) return;
    const btn = document.createElement('button');
    btn.className = 'export-notes-btn';
    btn.title = 'Export All Notes';
    btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>';
    btn.addEventListener('click', exportAllNotes);
    ha.insertBefore(btn, ha.firstChild);
  }

  const _orig = window.createSavedItemHTML;
  if (typeof _orig === 'function') {
    window.createSavedItemHTML = function(item) {
      let html = _orig(item);
      const note = getNote(item.id);
      const escaped = note.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
      const extra = '<div class="saved-item-notes"><div class="saved-item-notes-label"><svg viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>My Notes</div><textarea placeholder="Add your notes\u2026" data-panel-notes="' + item.id + '" oninput="window._dsccNotes.onPanelInput(\'' + item.id + '\', this)">' + escaped + '</textarea><div class="notes-status" data-talk="' + item.id + '">Auto-saved</div></div>';
      const idx = html.lastIndexOf('</div>');
      return html.slice(0, idx) + extra + html.slice(idx);
    };
  }

  // Export
  function exportAllNotes() {
    const notes = JSON.parse(localStorage.getItem(NOTES_KEY) || '{}');
    const saved = JSON.parse(localStorage.getItem('dscc2026_saved') || '{}');
    if (!Object.values(notes).some(n => n.trim())) { if (typeof showToast === 'function') showToast('No notes to export'); return; }

    let md = '# Dubai Stem Cell Congress 2026 \u2014 My Notes\n> Exported ' + new Date().toLocaleString() + '\n\n';
    const d1 = [], d2 = [], ot = [];
    Object.entries(notes).forEach(([id, text]) => {
      if (!text.trim()) return;
      const s = saved[id];
      const e = { title: s ? s.title : id, time: s ? s.time : '', day: s ? s.day : '', text };
      if (e.day.includes('1')) d1.push(e); else if (e.day.includes('2')) d2.push(e); else ot.push(e);
    });
    function r(arr, h) { if (!arr.length) return ''; let s = '## ' + h + '\n\n'; arr.forEach(e => { s += '### ' + e.title + (e.time ? ' (' + e.time + ')' : '') + '\n\n' + e.text.trim() + '\n\n---\n\n'; }); return s; }
    md += r(d1, 'Day 1 \u2014 Saturday, Feb 7') + r(d2, 'Day 2 \u2014 Sunday, Feb 8') + r(ot, 'Other Notes');

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'DSCC2026_My_Notes.md';
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    if (typeof showToast === 'function') showToast('Notes exported!');
  }
  window.exportAllNotes = exportAllNotes;

  // Init
  function init() { initSpeakerLineNotes(); addExportButton(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();

  const _origSD = window.switchDay;
  if (typeof _origSD === 'function') {
    window.switchDay = function(day) { _origSD(day); setTimeout(initSpeakerLineNotes, 150); };
  }
})();
