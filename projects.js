// Projects Hub — data/projects.json 기반 갤러리 (검색·필터·상세연결)
const CAT_MAP = {
  '🔬 소재·분석 연구': { key:'mat',   cls:'cat-mat'  },
  '⚡ 회로·IC 설계':   { key:'ic',    cls:'cat-ic'   },
  '💻 SW·자동화':      { key:'sw',    cls:'cat-sw'   },
  '🏭 공정·장비':      { key:'proc',  cls:'cat-proc' },
  '📚 교육·학습':      { key:'edu',   cls:'cat-edu'  },
  '🎓 학부 교과과정':  { key:'ugrad', cls:'cat-ugrad'},
  // 구버전 호환
  '🔬 연구/실험':      { key:'mat',   cls:'cat-mat'  },
  '💻 코딩 프로젝트':  { key:'ic',    cls:'cat-ic'   },
  '📚 학습':           { key:'edu',   cls:'cat-edu'  },
};

let allProjects = [];
let currentFilter = 'all';
let searchTerm = '';

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c =>
    ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
}

async function load() {
  try {
    const res  = await fetch('data/projects.json');
    const data = await res.json();
    allProjects = data.projects || [];
    updateCounts();
    render();
    loadPaperCount();
  } catch {
    document.getElementById('projects-grid').innerHTML =
      '<p class="loading-msg">데이터를 불러올 수 없습니다.</p>';
  }
}

async function loadPaperCount() {
  try {
    const res  = await fetch('data/papers.json');
    const data = await res.json();
    const el = document.getElementById('stat-papers');
    if (el) el.textContent = (data.nodes || []).filter(n => n.id !== '__doe__').length + '편';
  } catch { /* papers.json 없으면 통계만 생략 */ }
}

function updateCounts() {
  const c = { all:0, mat:0, ic:0, sw:0, proc:0, edu:0, ugrad:0 };
  allProjects.forEach(p => {
    const k = CAT_MAP[p.category]?.key;
    if (!k) return;
    c.all++; c[k]++;
  });
  Object.entries(c).forEach(([k, v]) => {
    const el = document.getElementById(`cnt-${k}`);
    if (el) el.textContent = v;
  });
  document.getElementById('stat-total').textContent = c.all;
  document.getElementById('stat-research').textContent = c.mat;
}

function matches(p) {
  if (currentFilter !== 'all' && CAT_MAP[p.category]?.key !== currentFilter) return false;
  if (!searchTerm) return true;
  const hay = [p.title, p.key_result, ...(p.tech_stack || [])].join(' ').toLowerCase();
  return hay.includes(searchTerm);
}

function render() {
  const grid = document.getElementById('projects-grid');
  const items = allProjects.filter(matches)
    .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
  if (!items.length) {
    grid.innerHTML = '<p class="loading-msg">일치하는 항목이 없습니다.</p>';
    return;
  }
  grid.innerHTML = items.map(p => {
    const m    = CAT_MAP[p.category] || { cls:'' };
    const tags = (p.tech_stack || []).slice(0, 4)
      .map(t => `<span class="card-tag">${esc(t)}</span>`).join('');
    return `
    <div class="p-card ${m.cls}">
      <div class="p-card-top">
        <span class="card-cat ${m.cls}">${esc(p.category || '기타')}</span>
        <span class="card-status">${esc(p.status || '')}</span>
      </div>
      <h3 class="p-card-title">${esc(p.title)}</h3>
      ${p.key_result ? `<div class="p-card-result">${esc(p.key_result)}</div>` : ''}
      <div class="card-tags">${tags}</div>
      <div class="p-card-footer">
        <span class="p-card-date">${p.date ? esc(p.date.slice(0, 7)) : ''}</span>
        <a class="p-card-more" href="detail.html?id=${encodeURIComponent(p.id)}">Learn More →</a>
      </div>
    </div>`;
  }).join('');
}

document.querySelectorAll('#hub-tabs .tab').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#hub-tabs .tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.filter;
    render();
  });
});

document.getElementById('hub-search').addEventListener('input', e => {
  searchTerm = e.target.value.trim().toLowerCase();
  render();
});

load();
