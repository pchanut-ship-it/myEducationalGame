// =========================================================
// Prompt Library — App logic
// =========================================================

const grid = document.getElementById('grid');
const emptyEl = document.getElementById('empty');
const searchInput = document.getElementById('search');
const filterChips = document.getElementById('filter-chips');
const countBadge = document.getElementById('count-badge');

// Modal refs
const modal = document.getElementById('modal');
const mEmoji = document.getElementById('m-emoji');
const mCat = document.getElementById('m-cat');
const mTitle = document.getElementById('m-title');
const mPrompt = document.getElementById('m-prompt');
const mCopy = document.getElementById('m-copy');
const mDemo = document.getElementById('m-demo');

let currentFilter = 'all';
let currentSearch = '';
let openPromptId = null;

countBadge.textContent = `${prompts.length} Prompts`;

// ---- Category detection ----
function matchesFilter(p, filter) {
  if (filter === 'all') return true;
  const text = (p.category + ' ' + p.title).toLowerCase();
  switch (filter) {
    case 'action':
      return /action|run & gun|bullet|shooter|asteroid/.test(text);
    case 'puzzle':
      return /puzzle|sokoban|pipe|match|slingshot|cross math/.test(text);
    case 'arcade':
      return /arcade|endless|snake|runner|rhythm|beat/.test(text);
    case 'rpg':
      return /rpg|dungeon|idle|card battler/.test(text);
    case '3d':
      return /3d|three\.js|virtual|react|การศึกษา|tense|lab|whack|thai spelling/i.test(text);
    default:
      return true;
  }
}

function previewText(p) {
  // Pull the "เรื่องราว" or first non-role line for preview
  const lines = p.prompt.split('\n').map(l => l.trim()).filter(Boolean);
  const story = lines.find(l => l.startsWith('เรื่องราว:'));
  if (story) return story.replace(/^เรื่องราว:\s*/, '');
  const goal = lines.find(l => l.startsWith('เป้าหมาย:'));
  if (goal) return goal.replace(/^เป้าหมาย:\s*/, '');
  return lines.find(l => !l.startsWith('บทบาท') && !l.startsWith('[')) || '';
}

function render() {
  const q = currentSearch.trim().toLowerCase();
  const filtered = prompts.filter(p => {
    if (!matchesFilter(p, currentFilter)) return false;
    if (!q) return true;
    return (
      p.title.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.prompt.toLowerCase().includes(q)
    );
  });

  grid.innerHTML = filtered.map(p => `
    <article class="card" data-id="${p.id}" tabindex="0">
      <div class="card-head">
        <div class="card-emoji">${p.emoji}</div>
        <div class="card-title-wrap">
          <div class="card-number">PROMPT #${String(p.id).padStart(2, '0')}</div>
          <div class="card-title">${escapeHtml(p.title)}</div>
          <div class="card-cat">${escapeHtml(p.category)}</div>
        </div>
      </div>
      <div class="card-preview">${escapeHtml(previewText(p))}</div>
      <div class="card-foot">
        <button class="card-btn primary" data-action="copy" data-id="${p.id}">
          📋 คัดลอก
        </button>
        <button class="card-btn secondary" data-action="view" data-id="${p.id}">
          เปิดดู
        </button>
      </div>
    </article>
  `).join('');

  emptyEl.hidden = filtered.length !== 0;
}

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

// ---- Copy helpers ----
async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch {}
    document.body.removeChild(ta);
    return ok;
  }
}

const toast = document.getElementById('toast');
let toastTimer;
function showToast(text = 'คัดลอกแล้ว') {
  toast.querySelector('.toast-text').textContent = text;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 1800);
}

async function handleCopy(id, btn) {
  const p = prompts.find(x => x.id === id);
  if (!p) return;
  const ok = await copyText(p.prompt);
  if (ok) {
    showToast(`คัดลอก "${p.title}" แล้ว`);
    if (btn) {
      const original = btn.innerHTML;
      btn.classList.add('copied');
      btn.innerHTML = '✓ คัดลอกแล้ว';
      setTimeout(() => {
        btn.classList.remove('copied');
        btn.innerHTML = original;
      }, 1600);
    }
  } else {
    showToast('คัดลอกไม่สำเร็จ');
  }
}

// ---- Modal ----
function openModal(id) {
  const p = prompts.find(x => x.id === id);
  if (!p) return;
  openPromptId = id;
  mEmoji.textContent = p.emoji;
  mCat.textContent = p.category;
  mTitle.textContent = p.title;
  mPrompt.textContent = p.prompt;
  if (p.demo) {
    mDemo.href = p.demo;
    mDemo.hidden = false;
  } else {
    mDemo.hidden = true;
  }
  mCopy.classList.remove('copied');
  mCopy.innerHTML = '<span class="btn-icon">📋</span> คัดลอก Prompt';
  modal.hidden = false;
  document.body.style.overflow = 'hidden';
}
function closeModal() {
  modal.hidden = true;
  document.body.style.overflow = '';
  openPromptId = null;
}

// ---- Events ----
grid.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-action]');
  if (btn) {
    e.stopPropagation();
    const id = Number(btn.dataset.id);
    if (btn.dataset.action === 'copy') handleCopy(id, btn);
    else if (btn.dataset.action === 'view') openModal(id);
    return;
  }
  const card = e.target.closest('.card');
  if (card) openModal(Number(card.dataset.id));
});

grid.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    const card = e.target.closest('.card');
    if (card) {
      e.preventDefault();
      openModal(Number(card.dataset.id));
    }
  }
});

searchInput.addEventListener('input', (e) => {
  currentSearch = e.target.value;
  render();
});

filterChips.addEventListener('click', (e) => {
  const chip = e.target.closest('.chip');
  if (!chip) return;
  filterChips.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
  chip.classList.add('active');
  currentFilter = chip.dataset.filter;
  render();
});

modal.addEventListener('click', (e) => {
  if (e.target.dataset.close !== undefined) closeModal();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !modal.hidden) closeModal();
});

mCopy.addEventListener('click', async () => {
  if (openPromptId == null) return;
  const p = prompts.find(x => x.id === openPromptId);
  if (!p) return;
  const ok = await copyText(p.prompt);
  if (ok) {
    showToast('คัดลอก Prompt แล้ว');
    mCopy.classList.add('copied');
    mCopy.innerHTML = '<span class="btn-icon">✓</span> คัดลอกแล้ว';
    setTimeout(() => {
      mCopy.classList.remove('copied');
      mCopy.innerHTML = '<span class="btn-icon">📋</span> คัดลอก Prompt';
    }, 1600);
  }
});

// Initial render
render();
