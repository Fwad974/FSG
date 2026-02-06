/**
 * DSCC 2026 - Attendee Notes Feature v3
 * Covers: Talks, Workshops, Industry Symposiums, Keynotes — anything with a bookmark.
 * Add before </body>:  <script src="notes-feature.js"></script>
 */
(function () {
  'use strict';

  /* =============================================
     1. CSS
     ============================================= */
  const css = document.createElement('style');
  css.textContent = `
    /* --- speaker-line wrap for inline notes --- */
    .speaker-line[data-talk-id]{ flex-wrap:wrap!important; }

    /* --- inline notes area (talks) --- */
    .inline-notes-area{
      display:none; flex-basis:100%!important; width:100%!important;
      order:99; margin-top:12px; padding-top:12px;
      border-top:1px solid rgba(201,169,98,.1);
    }
    .inline-notes-area.show{ display:block!important; }

    /* --- session / workshop notes area (inside timeline-card or workshop-card) --- */
    .card-notes-area{
      display:none; width:100%; margin-top:14px; padding-top:14px;
      border-top:1px solid rgba(201,169,98,.1); position:relative; z-index:5;
    }
    .card-notes-area.show{ display:block!important; animation:fadeInUp .25s ease; }

    /* --- shared textarea styles --- */
    .inline-notes-area textarea,
    .card-notes-area textarea{
      width:100%; min-height:80px; max-height:200px; padding:12px 14px;
      border-radius:10px; background:rgba(0,0,0,.3);
      border:1px solid rgba(201,169,98,.2); color:#fff;
      font-family:'Inter',sans-serif; font-size:.82rem; line-height:1.6;
      resize:vertical; outline:none; transition:border-color .3s ease;
    }
    .inline-notes-area textarea:focus,
    .card-notes-area textarea:focus{
      border-color:#c9a962; box-shadow:0 0 0 2px rgba(201,169,98,.1);
    }
    .inline-notes-area textarea::placeholder,
    .card-notes-area textarea::placeholder{ color:rgba(255,255,255,.25); }

    .notes-status{
      font-size:.65rem; color:rgba(255,255,255,.3);
      margin-top:5px; text-align:right; transition:color .3s ease;
    }
    .notes-status.just-saved{ color:#2ecc71; }

    /* --- talk actions (pencil + bookmark) --- */
    .talk-actions{
      display:flex!important; gap:6px; align-items:center;
      flex-shrink:0; margin-left:auto; order:10;
    }

    /* --- pencil button (shared style for talks + cards) --- */
    .talk-notes-btn, .card-notes-btn{
      background:rgba(255,255,255,.06); border:1px solid rgba(201,169,98,.15);
      cursor:pointer; border-radius:10px; transition:all .3s ease;
      display:flex; align-items:center; justify-content:center; flex-shrink:0;
    }
    .talk-notes-btn{ padding:9px; width:38px; height:38px; }
    .card-notes-btn{
      position:absolute; top:15px; right:58px; width:38px; height:38px; z-index:10;
    }
    .talk-notes-btn svg, .card-notes-btn svg{
      width:16px; height:16px; stroke:rgba(255,255,255,.4); fill:none; transition:all .3s ease;
    }
    .talk-notes-btn:hover, .card-notes-btn:hover{
      background:rgba(201,169,98,.15); border-color:rgba(201,169,98,.35);
    }
    .talk-notes-btn:hover svg, .card-notes-btn:hover svg{ stroke:#c9a962; }

    .talk-notes-btn.has-notes, .card-notes-btn.has-notes{
      background:rgba(201,169,98,.18); border-color:rgba(201,169,98,.4);
    }
    .talk-notes-btn.has-notes svg, .card-notes-btn.has-notes svg{
      stroke:#c9a962; fill:rgba(201,169,98,.3);
    }
    .talk-notes-btn.open, .card-notes-btn.open{
      background:rgba(201,169,98,.25); border-color:#c9a962;
    }
    .talk-notes-btn.open svg, .card-notes-btn.open svg{ stroke:#c9a962; }

    /* --- workshop card overrides --- */
    .workshop-card .card-notes-btn{
      top:20px; right:70px; width:44px; height:44px; border-radius:12px;
    }
    .workshop-card .card-notes-btn svg{ width:18px; height:18px; }
    .workshop-card .card-notes-area{
      padding:0 24px 20px; margin-top:0; border-top:none;
    }

    /* --- timeline-card notes button position (next to bookmark) --- */
    .timeline-card .card-notes-btn{
      top:15px; right:58px;
    }

    /* --- panel saved-item notes --- */
    .saved-item-notes{
      margin-top:12px; padding-top:12px; border-top:1px solid rgba(201,169,98,.1);
    }
    .saved-item-notes-label{
      font-size:.7rem; color:#c9a962; text-transform:uppercase;
      letter-spacing:1px; margin-bottom:8px; display:flex; align-items:center; gap:6px;
    }
    .saved-item-notes-label svg{ width:12px; height:12px; stroke:#c9a962; fill:none; }
    .saved-item-notes textarea{
      width:100%; min-height:80px; max-height:200px; padding:12px;
      border-radius:10px; background:rgba(0,0,0,.25);
      border:1px solid rgba(201,169,98,.2); color:#fff;
      font-family:'Inter',sans-serif; font-size:.82rem; line-height:1.6;
      resize:vertical; outline:none; transition:border-color .3s ease;
    }
    .saved-item-notes textarea:focus{ border-color:#c9a962; }
    .saved-item-notes textarea::placeholder{ color:rgba(255,255,255,.2); }
    .saved-item-notes .notes-status{
      font-size:.65rem; color:rgba(255,255,255,.3);
      margin-top:5px; text-align:right; transition:color .3s ease;
    }
    .saved-item-notes .notes-status.just-saved{ color:#2ecc71; }

    /* --- export button --- */
    .export-notes-btn{
      background:rgba(255,255,255,.1); border:none; border-radius:50%;
      width:40px; height:40px; display:flex; align-items:center; justify-content:center;
      cursor:pointer; transition:all .3s ease;
    }
    .export-notes-btn:hover{ background:rgba(201,169,98,.2); }
    .export-notes-btn svg{ width:20px; height:20px; stroke:#c9a962; fill:none; }

    /* --- mobile --- */
    @media(max-width:768px){
      .card-notes-btn{ right:54px; width:36px; height:36px; }
      .card-notes-btn svg{ width:14px; height:14px; }
      .timeline-card .card-notes-btn{ top:12px; right:54px; }
      .workshop-card .card-notes-btn{ top:14px; right:58px; width:38px; height:38px; border-radius:10px; }
      .workshop-card .card-notes-area{ padding:0 18px 16px; }
    }
    @media(max-width:600px){
      .speaker-line[data-talk-id]{ grid-template-columns:auto 1fr auto!important; }
      .talk-actions{
        grid-column:3!important; grid-row:1/3!important;
        align-self:center!important; flex-direction:column!important; gap:4px!important;
      }
      .talk-notes-btn{ width:34px; height:34px; padding:7px; }
      .talk-notes-btn svg{ width:14px; height:14px; }
      .inline-notes-area{ grid-column:1/-1!important; grid-row:auto!important; }
      .card-notes-btn{ right:52px; width:34px; height:34px; }
      .card-notes-btn svg{ width:14px; height:14px; }
      .timeline-card .card-notes-btn{ top:12px; right:52px; }
      .workshop-card .card-notes-btn{ top:14px; right:54px; width:34px; height:34px; }
    }
    @media(max-width:380px){
      .workshop-card .card-notes-btn{ top:12px; right:50px; width:30px; height:30px; }
      .workshop-card .card-notes-btn svg{ width:12px; height:12px; }
    }
  `;
  document.head.appendChild(css);

  /* =============================================
     2. DATA STORE
     ============================================= */
  const NOTES_KEY = 'dscc2026_notes';
  let allNotes = JSON.parse(localStorage.getItem(NOTES_KEY) || '{}');

  function save() { localStorage.setItem(NOTES_KEY, JSON.stringify(allNotes)); }
  function getNote(id) { return allNotes[id] || ''; }
  function setNote(id, t) { if (t.trim() === '') delete allNotes[id]; else allNotes[id] = t; save(); }

  const timers = {};
  function debounceSave(id, t) {
    clearTimeout(timers[id]);
    timers[id] = setTimeout(() => { setNote(id, t); flash(id); }, 400);
  }
  function flash(id) {
    document.querySelectorAll('.notes-status[data-talk="' + id + '"]').forEach(el => {
      el.textContent = '\u2713 Saved'; el.classList.add('just-saved');
      setTimeout(() => { el.textContent = 'Auto-saved'; el.classList.remove('just-saved'); }, 1500);
    });
  }

  const pencilSVG = '<svg viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>';

  /* =============================================
     3. HELPER: extract ID from bookmark onclick
     ============================================= */
  function extractId(btn) {
    const s = btn.getAttribute('onclick') || '';
    const m = s.match(/toggleBookmark\('([^']+)'/);
    return m ? m[1] : null;
  }

  /* =============================================
     4A. INIT NOTES ON SPEAKER LINES (individual talks)
     ============================================= */
  function initTalkNotes() {
    document.querySelectorAll('.speaker-line').forEach(line => {
      const bm = line.querySelector('.talk-bookmark-btn');
      if (!bm) return;
      const id = extractId(bm);
      if (!id) return;
      if (line.getAttribute('data-talk-id') === id && line.querySelector('.talk-notes-btn')) return;
      line.setAttribute('data-talk-id', id);

      // Wrap in .talk-actions
      const actions = document.createElement('div');
      actions.className = 'talk-actions';
      const nb = mkPencil(id, 'talk-notes-btn');
      actions.appendChild(nb);
      bm.parentNode.insertBefore(actions, bm);
      actions.appendChild(bm);

      // Inline notes area
      if (!document.getElementById('inl-' + id)) {
        line.appendChild(mkNotesArea(id, 'inline-notes-area', 'inl-'));
      }
    });
  }

  /* =============================================
     4B. INIT NOTES ON TIMELINE CARDS (sessions, symposiums, keynote)
     ============================================= */
  function initCardNotes() {
    document.querySelectorAll('.timeline-item:not(.break)').forEach(item => {
      const card = item.querySelector('.timeline-card');
      if (!card) return;
      const bm = card.querySelector(':scope > .bookmark-btn');
      if (!bm) return;
      const id = extractId(bm);
      if (!id) return;
      if (card.querySelector('.card-notes-btn[data-for="' + id + '"]')) return;

      // Add pencil button
      const nb = mkPencil(id, 'card-notes-btn');
      nb.setAttribute('data-for', id);
      card.appendChild(nb);

      // Add notes area at end of card
      if (!document.getElementById('crd-' + id)) {
        card.appendChild(mkNotesArea(id, 'card-notes-area', 'crd-'));
      }
    });
  }

  /* =============================================
     4C. INIT NOTES ON WORKSHOP CARDS
     ============================================= */
  function initWorkshopNotes() {
    document.querySelectorAll('.workshop-card').forEach(card => {
      const bm = card.querySelector(':scope > .bookmark-btn');
      if (!bm) return;
      const id = extractId(bm);
      if (!id) return;
      if (card.querySelector('.card-notes-btn[data-for="' + id + '"]')) return;

      // Add pencil button
      const nb = mkPencil(id, 'card-notes-btn');
      nb.setAttribute('data-for', id);
      card.appendChild(nb);

      // Notes area — insert before the workshop-speaker footer for better flow
      if (!document.getElementById('crd-' + id)) {
        const area = mkNotesArea(id, 'card-notes-area', 'crd-');
        const footer = card.querySelector('.workshop-speaker');
        if (footer) card.insertBefore(area, footer);
        else card.appendChild(area);
      }
    });
  }

  /* =============================================
     5. BUILDERS
     ============================================= */
  function mkPencil(id, cls) {
    const btn = document.createElement('button');
    btn.className = cls + (getNote(id) ? ' has-notes' : '');
    btn.title = 'Take notes';
    btn.innerHTML = pencilSVG;
    btn.addEventListener('click', e => {
      e.stopPropagation();
      e.preventDefault();
      toggleNotes(id, btn);
    });
    return btn;
  }

  function mkNotesArea(id, cls, prefix) {
    const wrap = document.createElement('div');
    wrap.className = cls;
    wrap.id = prefix + id;

    const ta = document.createElement('textarea');
    ta.placeholder = 'Write your notes here\u2026';
    ta.value = getNote(id);
    ta.addEventListener('input', function () {
      debounceSave(id, this.value);
      updateHasNotes(id, this.value);
      syncOther(id, this.value, ta);
    });
    ta.addEventListener('click', e => e.stopPropagation());

    const st = document.createElement('div');
    st.className = 'notes-status';
    st.setAttribute('data-talk', id);
    st.textContent = 'Auto-saved';

    wrap.appendChild(ta);
    wrap.appendChild(st);
    return wrap;
  }

  /* =============================================
     6. TOGGLE & SYNC
     ============================================= */
  function toggleNotes(id, btn) {
    // Find the notes area for this id (could be inl- or crd- prefix)
    const area = document.getElementById('inl-' + id) || document.getElementById('crd-' + id);
    if (!area) return;
    const isOpen = area.classList.contains('show');

    // Close all others
    document.querySelectorAll('.inline-notes-area.show, .card-notes-area.show').forEach(a => {
      if (a !== area) a.classList.remove('show');
    });
    document.querySelectorAll('.talk-notes-btn.open, .card-notes-btn.open').forEach(b => b.classList.remove('open'));

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
  window.toggleInlineNotes = function (id, btn) { toggleNotes(id, btn); };

  function updateHasNotes(id, text) {
    const has = text.trim().length > 0;
    document.querySelectorAll('.talk-notes-btn, .card-notes-btn').forEach(btn => {
      // Match by data-for or by parent speaker-line data-talk-id
      const forId = btn.getAttribute('data-for');
      const line = btn.closest('.speaker-line');
      const lineId = line ? line.getAttribute('data-talk-id') : null;
      if (forId === id || lineId === id) {
        btn.classList.toggle('has-notes', has);
      }
    });
  }

  function syncOther(id, text, source) {
    // Sync between inline, card, and panel textareas
    const targets = [
      document.querySelector('#inl-' + id + ' textarea'),
      document.querySelector('#crd-' + id + ' textarea'),
      document.querySelector('textarea[data-panel-notes="' + id + '"]')
    ];
    targets.forEach(ta => {
      if (ta && ta !== source && ta !== document.activeElement) ta.value = text;
    });
  }

  window._dsccNotes = {
    onPanelInput: function (id, ta) {
      debounceSave(id, ta.value);
      updateHasNotes(id, ta.value);
      syncOther(id, ta.value, ta);
    }
  };

  /* =============================================
     7. PANEL PATCHES
     ============================================= */
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

  // Patch createSavedItemHTML to include notes
  const _orig = window.createSavedItemHTML;
  if (typeof _orig === 'function') {
    window.createSavedItemHTML = function (item) {
      let html = _orig(item);
      const note = getNote(item.id);
      const esc = note.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
      const extra =
        '<div class="saved-item-notes">' +
          '<div class="saved-item-notes-label">' +
            '<svg viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
              '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>' +
              '<path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>' +
            '</svg>My Notes' +
          '</div>' +
          '<textarea placeholder="Add your notes\u2026" data-panel-notes="' + item.id + '" ' +
            'oninput="window._dsccNotes.onPanelInput(\'' + item.id + '\',this)">' + esc + '</textarea>' +
          '<div class="notes-status" data-talk="' + item.id + '">Auto-saved</div>' +
        '</div>';
      const idx = html.lastIndexOf('</div>');
      return html.slice(0, idx) + extra + html.slice(idx);
    };
  }

  /* =============================================
     8. EXPORT
     ============================================= */
  function exportAllNotes() {
    const notes = JSON.parse(localStorage.getItem(NOTES_KEY) || '{}');
    const saved = JSON.parse(localStorage.getItem('dscc2026_saved') || '{}');
    if (!Object.values(notes).some(n => n.trim())) {
      if (typeof showToast === 'function') showToast('No notes to export');
      return;
    }
    let md = '# Dubai Stem Cell Congress 2026 \u2014 My Notes\n> Exported ' + new Date().toLocaleString() + '\n\n';
    const d1 = [], d2 = [], ot = [];
    Object.entries(notes).forEach(([id, text]) => {
      if (!text.trim()) return;
      const s = saved[id];
      const e = { title: s ? s.title : id, time: s ? s.time : '', day: s ? s.day : '', text: text };
      if (e.day.includes('1')) d1.push(e);
      else if (e.day.includes('2')) d2.push(e);
      else ot.push(e);
    });
    function r(arr, h) {
      if (!arr.length) return '';
      let s = '## ' + h + '\n\n';
      arr.forEach(e => { s += '### ' + e.title + (e.time ? ' (' + e.time + ')' : '') + '\n\n' + e.text.trim() + '\n\n---\n\n'; });
      return s;
    }
    md += r(d1, 'Day 1 \u2014 Saturday, Feb 7') + r(d2, 'Day 2 \u2014 Sunday, Feb 8') + r(ot, 'Other Notes');

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'DSCC2026_My_Notes.md';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
    if (typeof showToast === 'function') showToast('Notes exported!');
  }
  window.exportAllNotes = exportAllNotes;

  /* =============================================
     9. INIT
     ============================================= */
  function initAll() {
    initTalkNotes();
    initCardNotes();
    initWorkshopNotes();
    addExportButton();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initAll);
  else initAll();

  // Re-init on day switch
  const _origSD = window.switchDay;
  if (typeof _origSD === 'function') {
    window.switchDay = function (day) {
      _origSD(day);
      setTimeout(initAll, 150);
    };
  }
})();
