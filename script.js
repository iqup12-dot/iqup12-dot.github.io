const CAT_MAP = {
  '🔬 연구/실험':    { key:'research', cls:'cat-r' },
  '💻 코딩 프로젝트':{ key:'coding',   cls:'cat-c' },
  '📚 학습':         { key:'learning', cls:'cat-l' },
  '🤖 Claude 작업':  { key:'claude',   cls:'cat-c' },
};

let allProjects = [];
let currentFilter = 'all';

// 데이터 로드
async function loadProjects() {
  try {
    const res  = await fetch('data/projects.json');
    const data = await res.json();
    allProjects = data.projects || [];
    renderProjects();
    renderTimeline();
    updateCounts();
    const el = document.getElementById('last-updated');
    if (el && data.updated_at) el.textContent = data.updated_at;
  } catch {
    document.getElementById('projects-grid').innerHTML =
      '<p class="loading-msg">데이터를 불러올 수 없습니다.</p>';
  }
}

// 카테고리별 카운트 업데이트
function updateCounts() {
  const counts = { all: allProjects.length, research:0, coding:0, learning:0 };
  allProjects.forEach(p => {
    const cat = CAT_MAP[p.category];
    if (cat) counts[cat.key] = (counts[cat.key] || 0) + 1;
  });
  ['all','research','coding','learning'].forEach(k => {
    const el = document.getElementById(`cnt-${k}`);
    if (el) el.textContent = counts[k] || 0;
  });
}

// 프로젝트 렌더링
function renderProjects() {
  const grid = document.getElementById('projects-grid');
  const filtered = currentFilter === 'all'
    ? allProjects
    : allProjects.filter(p => CAT_MAP[p.category]?.key === currentFilter);

  if (!filtered.length) {
    grid.innerHTML = '<p class="loading-msg">항목이 없습니다.</p>';
    return;
  }

  const sorted = [...filtered].sort((a, b) => new Date(b.date) - new Date(a.date));
  grid.innerHTML = sorted.map(cardHTML).join('');
  grid.querySelectorAll('.p-card').forEach((card, i) => {
    card.addEventListener('click', () => openModal(sorted[i]));
  });
}

function cardHTML(p) {
  const cat  = CAT_MAP[p.category] || { cls:'cat-c' };
  const tags = (p.tech_stack || []).slice(0, 4).map(t => `<span class="card-tag">${t}</span>`).join('');
  const date = p.date ? p.date.slice(0, 7) : '';

  return `
  <div class="p-card">
    <div class="p-card-top">
      <span class="card-cat ${cat.cls}">${p.category || '기타'}</span>
      <span class="card-status">${p.status || ''}</span>
    </div>
    <h3 class="p-card-title">${p.title}</h3>
    ${p.key_result ? `<div class="p-card-result">${p.key_result}</div>` : ''}
    <div class="card-tags">${tags}</div>
    <div class="p-card-footer">
      <span class="p-card-date">${date}</span>
      <span class="p-card-more">상세 보기 →</span>
    </div>
  </div>`;
}

// 교육 타임라인 렌더링 (📚 학습 항목 중 시간수 포함된 것)
function renderTimeline() {
  const tl = document.getElementById('education-timeline');
  const eduItems = allProjects
    .filter(p => p.category === '📚 학습')
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  if (!eduItems.length) {
    tl.innerHTML = '<p class="loading-msg">교육 데이터가 없습니다.</p>';
    return;
  }

  tl.innerHTML = eduItems.map(p => {
    const hours = extractHours(p.title);
    return `
    <div class="tl-item">
      <div class="tl-header">
        <span class="tl-badge">📚 교육/학습</span>
        <span class="tl-period">${p.date ? p.date.slice(0,7) : ''}</span>
      </div>
      <p class="tl-title">${p.title}</p>
      <p class="tl-meta">${(p.tech_stack || []).join(' · ')}</p>
      ${hours ? `<span class="tl-hours">⏱ ${hours}</span>` : ''}
    </div>`;
  }).join('');
}

function extractHours(title) {
  const m = title.match(/(\d+)h/);
  return m ? `${m[1]}시간` : '';
}

// 모달
function openModal(p) {
  const cat = CAT_MAP[p.category] || { cls:'cat-c' };
  document.getElementById('modal-cat').textContent  = p.category || '';
  document.getElementById('modal-cat').className    = `card-cat ${cat.cls}`;
  document.getElementById('modal-status').textContent = p.status || '';
  document.getElementById('modal-title').textContent  = p.title;
  document.getElementById('modal-date').textContent   = p.date || '';
  document.getElementById('modal-result').textContent = p.key_result || '';
  document.getElementById('modal-tags').innerHTML =
    (p.tech_stack || []).map(t => `<span class="card-tag">${t}</span>`).join('');
  document.getElementById('modal-star').textContent = p.star || '';
  document.getElementById('modal-overlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  document.getElementById('modal-overlay').classList.remove('open');
  document.body.style.overflow = '';
}

document.getElementById('modal-overlay').addEventListener('click', e => {
  if (e.target.id === 'modal-overlay') closeModal();
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeModal();
});

// 탭 필터
document.querySelectorAll('.tab').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.filter;
    renderProjects();
  });
});

loadProjects();
