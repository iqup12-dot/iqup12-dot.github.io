// 카테고리 → CSS 클래스 매핑
const CAT_MAP = {
  '🔬 연구/실험':    { key: 'research', cls: 'cat-research' },
  '💻 코딩 프로젝트': { key: 'coding',   cls: 'cat-coding'   },
  '📚 학습':         { key: 'learning', cls: 'cat-learning'  },
  '🤖 Claude 작업':  { key: 'claude',   cls: 'cat-claude'    },
};

let allProjects = [];
let currentFilter = 'all';

// 데이터 로딩
async function loadProjects() {
  const grid = document.getElementById('projects-grid');
  try {
    const res = await fetch('data/projects.json');
    const data = await res.json();
    allProjects = data.projects || [];
    renderProjects();
    const el = document.getElementById('last-updated');
    if (el && data.updated_at) el.textContent = data.updated_at;
  } catch {
    grid.innerHTML = '<p class="loading">프로젝트 데이터를 불러올 수 없습니다.</p>';
  }
}

// 카드 렌더링
function renderProjects() {
  const grid = document.getElementById('projects-grid');

  const filtered = currentFilter === 'all'
    ? allProjects
    : allProjects.filter(p => CAT_MAP[p.category]?.key === currentFilter);

  if (filtered.length === 0) {
    grid.innerHTML = '<p class="loading">항목이 없습니다.</p>';
    return;
  }

  // 날짜 내림차순
  const sorted = [...filtered].sort((a, b) => new Date(b.date) - new Date(a.date));

  grid.innerHTML = sorted.map(cardHTML).join('');
  grid.querySelectorAll('.project-card').forEach((card, i) => {
    card.addEventListener('click', () => openModal(sorted[i]));
  });
}

function cardHTML(p) {
  const cat = CAT_MAP[p.category] || { cls: 'cat-claude' };
  const tags = (p.tech_stack || []).slice(0, 4)
    .map(t => `<span class="card-tag">${t}</span>`).join('');
  return `
  <div class="project-card">
    <div class="card-header">
      <span class="card-category ${cat.cls}">${p.category || '기타'}</span>
      <span class="card-status">${p.status || ''}</span>
    </div>
    <h3 class="card-title">${p.title}</h3>
    ${p.key_result ? `<div class="card-result">📊 ${p.key_result}</div>` : ''}
    <div class="card-tags">${tags}</div>
    <div class="card-date">${p.date || ''}</div>
  </div>`;
}

// 모달 열기
function openModal(p) {
  const cat = CAT_MAP[p.category] || { cls: 'cat-claude' };
  document.getElementById('modal-category').textContent = p.category || '';
  document.getElementById('modal-category').className = `card-category ${cat.cls}`;
  document.getElementById('modal-status').textContent  = p.status || '';
  document.getElementById('modal-title').textContent   = p.title;
  document.getElementById('modal-date').textContent    = p.date || '';
  document.getElementById('modal-result').textContent  = p.key_result ? `📊 ${p.key_result}` : '';
  document.getElementById('modal-tags').innerHTML = (p.tech_stack || [])
    .map(t => `<span class="card-tag">${t}</span>`).join('');
  document.getElementById('modal-star').textContent = p.star || '';
  document.getElementById('modal-overlay').classList.add('open');
}

function closeModal() {
  document.getElementById('modal-overlay').classList.remove('open');
}

// 모달 바깥 클릭 시 닫기
document.getElementById('modal-overlay').addEventListener('click', e => {
  if (e.target.id === 'modal-overlay') closeModal();
});

// 필터 버튼
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.filter;
    renderProjects();
  });
});

loadProjects();
