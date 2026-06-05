const CAT_MAP = {
  '🔬 연구/실험':    { key:'research', cls:'cat-r', card:'cat-r' },
  '💻 코딩 프로젝트':{ key:'coding',   cls:'cat-c', card:'cat-c' },
  '📚 학습':         { key:'learning', cls:'cat-l', card:'cat-l' },
  '🤖 Claude 작업':  { key:'coding',   cls:'cat-c', card:'cat-c' },
};

let allProjects = [];
let currentFilter = 'all';

// ── 숫자 카운터 애니메이션 ──
function animateCounters() {
  document.querySelectorAll('.stat-num[data-target]').forEach(el => {
    const target = +el.dataset.target;
    const duration = 1800;
    const step = target / (duration / 16);
    let current = 0;
    const timer = setInterval(() => {
      current = Math.min(current + step, target);
      el.textContent = Math.floor(current).toLocaleString();
      if (current >= target) clearInterval(timer);
    }, 16);
  });
}

// ── 스크롤 리빌 ──
function initReveal() {
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } });
  }, { threshold: 0.12 });
  document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
}

// 히어로 카운터: 히어로 섹션 보이면 실행
const heroObs = new IntersectionObserver(([e]) => {
  if (e.isIntersecting) { animateCounters(); heroObs.disconnect(); }
}, { threshold: 0.3 });
heroObs.observe(document.getElementById('hero'));

// ── 데이터 로드 ──
async function loadProjects() {
  try {
    const res  = await fetch('data/projects.json');
    const data = await res.json();
    allProjects = data.projects || [];
    renderResearch();
    renderProjects();
    renderEducation();
    updateCounts();
    const el = document.getElementById('last-updated');
    if (el && data.updated_at) el.textContent = data.updated_at;
  } catch {
    document.getElementById('projects-grid').innerHTML =
      '<p class="loading-msg">데이터를 불러올 수 없습니다.</p>';
  }
}

// ── Research 섹션 ──
const ANALYSIS_FLOW = {
  '정품/모조품 식별 분석': ['X-ray', 'FE-SEM+EDS', 'VHX-7000', 'De-cap', '판정'],
  '불량 원인 분석':        ['VI Curve', 'EMMI', 'SAT', 'FE-SEM', '원인 확정'],
  '신규 반도체 입고 평가': ['외관검사', 'X-ray', 'SAT', 'VI Curve', 'FE-SEM', '종합판정'],
};

function renderResearch() {
  const grid = document.getElementById('research-grid');
  if (!grid) return;
  const items = allProjects
    .filter(p => p.category === '🔬 연구/실험' && !p.title.includes('배터리'))
    .sort((a,b) => new Date(b.date) - new Date(a.date));
  if (!items.length) { grid.innerHTML = ''; return; }

  grid.innerHTML = items.map(p => {
    const flowKey = Object.keys(ANALYSIS_FLOW).find(k => p.title.includes(k));
    const steps   = flowKey ? ANALYSIS_FLOW[flowKey] : [];
    const flowHTML = steps.map((s,i) => `
      <span class="fa-step">${s}</span>
      ${i < steps.length-1 ? '<span class="fa-arrow">→</span>' : ''}
    `).join('');
    const idx = allProjects.indexOf(p);
    return `
    <div class="research-card reveal" data-idx="${idx}">
      <div class="rc-header">
        <span class="rc-badge">🔬 Failure Analysis</span>
        <span class="rc-date">${p.date ? p.date.slice(0,7) : ''}</span>
      </div>
      <h3 class="rc-title">${p.title}</h3>
      <p class="rc-result">${p.key_result || ''}</p>
      ${steps.length ? `<div class="fa-flow">${flowHTML}</div>` : ''}
      <div class="rc-tags">${(p.tech_stack||[]).map(t=>`<span class="card-tag">${t}</span>`).join('')}</div>
      <button class="rc-more" onclick="openModal(allProjects[${idx}])">STAR 스토리 보기 →</button>
    </div>`;
  }).join('');
}

function updateCounts() {
  const c = { all: allProjects.length, research:0, coding:0, learning:0 };
  allProjects.forEach(p => {
    const k = CAT_MAP[p.category]?.key;
    if (k) c[k] = (c[k]||0) + 1;
  });
  ['all','research','coding','learning'].forEach(k => {
    const el = document.getElementById(`cnt-${k}`);
    if (el) el.textContent = c[k] || 0;
  });
}

// ── 프로젝트 렌더링 ──
function renderProjects() {
  const grid = document.getElementById('projects-grid');
  const filtered = currentFilter === 'all'
    ? allProjects
    : allProjects.filter(p => CAT_MAP[p.category]?.key === currentFilter);

  if (!filtered.length) { grid.innerHTML = '<p class="loading-msg">항목이 없습니다.</p>'; return; }

  const sorted = [...filtered].sort((a,b) => new Date(b.date) - new Date(a.date));
  grid.innerHTML = sorted.map(cardHTML).join('');
  grid.querySelectorAll('.p-card').forEach((card,i) => {
    card.addEventListener('click', () => openModal(sorted[i]));
  });
}

function cardHTML(p) {
  const m   = CAT_MAP[p.category] || { cls:'cat-c', card:'cat-c' };
  const tags = (p.tech_stack||[]).slice(0,4).map(t=>`<span class="card-tag">${t}</span>`).join('');
  const date = p.date ? p.date.slice(0,7) : '';
  return `
  <div class="p-card ${m.card}">
    <div class="p-card-top">
      <span class="card-cat ${m.cls}">${p.category||'기타'}</span>
      <span class="card-status">${p.status||''}</span>
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

// ── 교육 타임라인 (서브 라인업 지원) ──
function renderEducation() {
  const wrap = document.getElementById('education-timeline');
  const items = allProjects
    .filter(p => p.category === '📚 학습')
    .sort((a,b) => new Date(b.date) - new Date(a.date));

  if (!items.length) { wrap.innerHTML = '<p class="loading-msg">교육 데이터 없음</p>'; return; }

  // 메인 항목과 서브 라인업 항목 분리
  const mainItems = items.filter(p => !/^\[/.test(p.title));
  const subItems  = items.filter(p =>  /^\[/.test(p.title));

  // 서브 항목 그룹화 (태그 기준)
  const groups = {};
  subItems.forEach(p => {
    const m = p.title.match(/^\[([^\]]+)\]/);
    if (m) {
      const tag = m[1];
      if (!groups[tag]) groups[tag] = [];
      groups[tag].push(p);
    }
  });

  // 메인 카드 렌더링
  const mainHTML = mainItems.map(p => {
    const hours = (p.title.match(/(\d+)h/)||[])[1];
    const place = p.star ? extractPlace(p.star) : '';
    const idx = allProjects.indexOf(p);
    return `
    <div class="tl-card tl-clickable" data-idx="${idx}">
      <div class="tl-top">
        <span class="tl-period">${p.date ? p.date.slice(0,7) : ''}</span>
        ${hours ? `<span class="tl-hours">⏱ ${hours}시간</span>` : ''}
      </div>
      <p class="tl-title">${p.title}</p>
      ${place ? `<p class="tl-place">📍 ${place}</p>` : ''}
      <div class="tl-tags">${(p.tech_stack||[]).map(t=>`<span class="tl-tag">${t}</span>`).join('')}</div>
    </div>`;
  }).join('');

  // 서브 그룹 렌더링
  const subGroupHTML = Object.entries(groups).map(([tag, groupItems]) => {
    const label = tag.replace(/^\d+h\s+/, '');
    const subCards = groupItems.map(p => {
      const cleanTitle = p.title.replace(/^\[[^\]]+\]\s*/, '');
      const idx = allProjects.indexOf(p);
      return `<div class="sub-item tl-clickable" data-idx="${idx}">
        <p class="sub-item-title">${cleanTitle}</p>
        <div class="sub-item-tags">${(p.tech_stack||[]).slice(0,3).map(t=>`<span class="tl-tag">${t}</span>`).join('')}</div>
      </div>`;
    }).join('');
    return `
    <div class="sub-group">
      <div class="sub-group-header">
        <span class="sub-group-label">${label}</span>
        <span class="sub-count">${groupItems.length}</span>
      </div>
      <div class="sub-group-items">${subCards}</div>
    </div>`;
  }).join('');

  const sublineupSection = subGroupHTML ? `
    <div class="sub-lineup-section">
      <div class="sub-lineup-title">📖 세부 학습 내역 — 장비사교육 · 장비제어SW · 공정기초</div>
      <div class="sub-lineup-groups">${subGroupHTML}</div>
    </div>` : '';

  wrap.innerHTML = mainHTML + sublineupSection;

  wrap.querySelectorAll('.tl-clickable').forEach(el => {
    const idx = +el.dataset.idx;
    el.addEventListener('click', () => { if (allProjects[idx]) openModal(allProjects[idx]); });
  });
}

function extractPlace(star) {
  const m = star.match(/([가-힣A-Za-z]+대학교|[가-힣A-Za-z]+에듀|[가-힣A-Za-z]+협동조합|한국전자산업협동조합)/);
  return m ? m[1] : '';
}

// ── 모달 ──
function openModal(p) {
  const m = CAT_MAP[p.category] || { cls:'cat-c' };
  document.getElementById('modal-cat').textContent  = p.category||'';
  document.getElementById('modal-cat').className    = `card-cat ${m.cls}`;
  document.getElementById('modal-status').textContent = p.status||'';
  document.getElementById('modal-title').textContent  = p.title;
  document.getElementById('modal-date').textContent   = p.date||'';
  document.getElementById('modal-result').textContent = p.key_result||'';
  document.getElementById('modal-tags').innerHTML =
    (p.tech_stack||[]).map(t=>`<span class="card-tag">${t}</span>`).join('');
  document.getElementById('modal-star').textContent = p.star||'';
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
document.addEventListener('keydown', e => { if (e.key==='Escape') closeModal(); });

// ── 탭 ──
document.querySelectorAll('.tab').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.filter;
    renderProjects();
  });
});

initReveal();
loadProjects();
