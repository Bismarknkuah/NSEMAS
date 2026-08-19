/* NSEMAS — small reusable UI helpers (no framework, just DOM strings + helpers) */

const SEAL_SVG = `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="46"/><path d="M50 14 L58 40 L86 40 L63 56 L71 82 L50 66 L29 82 L37 56 L14 40 L42 40 Z"/></svg>`;

// Leadership photos are drop-in assets (frontend/assets/leadership/) — see
// the README.txt there. Extensions are per-file since not every official
// photo comes as the same format.
const LEADERSHIP_PEOPLE = [
  { file: 'president.png', name: 'H.E. John Dramani Mahama', title: 'President of the Republic of Ghana' },
  { file: 'vp.png', name: 'H.E. Prof. Naana Jane Opoku-Agyemang', title: 'Vice President of the Republic of Ghana' },
  { file: 'minister.jpg', name: 'Hon. Haruna Iddrisu', title: 'Minister of Education' },
];

function el(html) {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}

function toast(message, type = 'default') {
  const root = document.getElementById('toast-root');
  const node = el(`<div class="toast ${type === 'error' ? 'error' : type === 'success' ? 'success' : ''}">${escapeHtml(message)}</div>`);
  root.appendChild(node);
  setTimeout(() => { node.style.opacity = '0'; node.style.transition = 'opacity .3s'; setTimeout(() => node.remove(), 300); }, 3200);
}

function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function fmtDate(d) {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }); }
  catch { return d; }
}
function fmtDateTime(d) {
  if (!d) return '—';
  try { return new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }); }
  catch { return d; }
}

function badge(text, kind = 'grey') {
  return `<span class="badge badge-${kind}">${escapeHtml(text)}</span>`;
}

function statusBadge(status) {
  const map = {
    PRESENT: 'green', LATE: 'gold', ABSENT: 'red', NOT_RECORDED: 'grey',
    PROMOTED: 'green', GRADUATED: 'green', REPEAT: 'red', CONDITIONAL_PROMOTION: 'gold',
    WITHDRAWN: 'grey', DEFERRED: 'gold', PENDING_ASSESSMENT: 'grey',
    SUBMITTED: 'gold', UNDER_REVIEW: 'gold', APPROVED: 'green', COMPLETED: 'green', REJECTED: 'red',
    ACTIVE: 'green', ON_TIME: 'green', ON_HOLD:'grey',
  };
  return badge(status.replace(/_/g, ' '), map[status] || 'grey');
}

function riskBar(score) {
  return `<span class="risk-bar"><div style="width:${Math.min(100, score)}%"></div></span> <span class="mono" style="font-size:11px">${score}</span>`;
}

function card(title, innerHtml, meta = '') {
  return `<div class="card"><div class="card-header"><h3>${escapeHtml(title)}</h3>${meta ? `<span class="meta">${meta}</span>` : ''}</div>${innerHtml}</div>`;
}

function statCard(label, value, sub = '', subClass = '') {
  return `<div class="card stat-card">
    <div class="label">${escapeHtml(label)}</div>
    <div class="value">${value}</div>
    ${sub ? `<div class="sub ${subClass}">${sub}</div>` : ''}
  </div>`;
}

function emptyState(message) {
  return `<div class="empty-state">
    <div class="seal-mark">${SEAL_SVG}</div>
    <div>${escapeHtml(message)}</div>
  </div>`;
}

function modal(innerHtml) {
  const backdrop = el(`<div class="modal-backdrop"><div class="modal relative">${innerHtml}</div></div>`);
  backdrop.addEventListener('click', (e) => { if (e.target === backdrop) backdrop.remove(); });
  document.body.appendChild(backdrop);
  return backdrop;
}

function closeModal(btn) {
  const m = btn.closest('.modal-backdrop');
  if (m) m.remove();
}

// Drop-in export button for any list page. `getData()` returns
// { title, columns: [{key,label}], rows } computed fresh at click time
// (not baked in at render time), so it always exports what's currently on
// screen — including any filters the user has applied.
function exportButton(id) {
  return `<div class="export-btn-wrap" style="position:relative; display:inline-block">
    <button class="btn btn-outline btn-sm" id="${id}-toggle">⬇ Export</button>
    <div class="export-menu" id="${id}-menu" style="display:none">
      <button data-export-format="csv">CSV</button>
      <button data-export-format="excel">Excel (.xlsx)</button>
      <button data-export-format="pdf">PDF</button>
      <button data-export-format="word">Word (.docx)</button>
    </div>
  </div>`;
}

function wireExportButton(id, getData) {
  const toggle = document.getElementById(`${id}-toggle`);
  const menu = document.getElementById(`${id}-menu`);
  if (!toggle || !menu) return;
  toggle.addEventListener('click', (e) => {
    e.stopPropagation();
    menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
  });
  document.addEventListener('click', () => { menu.style.display = 'none'; }, { once: false });
  menu.querySelectorAll('[data-export-format]').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      menu.style.display = 'none';
      const { title, columns, rows } = getData();
      if (!rows.length) { toast('Nothing to export', 'error'); return; }
      try {
        await downloadExport(btn.dataset.exportFormat, title, columns, rows);
        toast('Download started', 'success');
      } catch (err) { toast(err.message, 'error'); }
    });
  });
}

/** Attach a submit handler to a form by id, calling fn(dataObject) on submit */
function onForm(id, fn) {
  const form = document.getElementById(id);
  if (!form) return;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());
    const btn = form.querySelector('button[type=submit]');
    if (btn) { btn.disabled = true; btn.dataset.origText = btn.textContent; btn.textContent = 'Working…'; }
    try {
      await fn(data, form);
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = btn.dataset.origText; }
    }
  });
}

function initial(name) {
  return (name || '?').trim().split(/\s+/).map((p) => p[0]).slice(0, 2).join('').toUpperCase();
}

/** Render a stylized fingerprint: concentric ridge arcs (decorative) plus the
 * actual minutiae points returned by the biometric engine, drawn as small
 * ticks oriented by their angle — a genuine (if simplified) visualization
 * of what the matching algorithm is actually comparing. */
function fingerprintSVG(points, { color = 'var(--forest)', dim = false } = {}) {
  const ridges = [];
  for (let r = 8; r < 48; r += 4) {
    ridges.push(`<ellipse cx="50" cy="52" rx="${r}" ry="${r * 1.25}" fill="none" stroke="${color}" stroke-width="0.6" opacity="${dim ? 0.12 : 0.22}" />`);
  }
  const minutiae = (points || []).map((p) => {
    const cx = 12 + p.x * 76;
    const cy = 10 + p.y * 84;
    const rad = (p.angle * Math.PI) / 180;
    const x2 = cx + Math.cos(rad) * 4.5;
    const y2 = cy + Math.sin(rad) * 4.5;
    const shape = p.type === 'ending'
      ? `<circle cx="${cx}" cy="${cy}" r="1.4" fill="${color}" />`
      : `<circle cx="${cx}" cy="${cy}" r="1.4" fill="none" stroke="${color}" stroke-width="0.9" />`;
    return `<line x1="${cx}" y1="${cy}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="0.8" opacity="0.85" />${shape}`;
  }).join('');
  return `<svg viewBox="0 0 100 100" style="width:100%; height:100%">${ridges.join('')}${minutiae}</svg>`;
}
