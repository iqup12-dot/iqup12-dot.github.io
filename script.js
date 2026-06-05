const CAT_MAP = {
  '🔬 소재·분석 연구': { key:'mat',   cls:'cat-mat',   card:'cat-mat' },
  '⚡ 회로·IC 설계':   { key:'ic',    cls:'cat-ic',    card:'cat-ic'  },
  '💻 SW·자동화':      { key:'sw',    cls:'cat-sw',    card:'cat-sw'  },
  '🏭 공정·장비':      { key:'proc',  cls:'cat-proc',  card:'cat-proc'},
  '📚 교육·학습':      { key:'edu',   cls:'cat-edu',   card:'cat-edu' },
  '🎓 학부 교과과정':  { key:'ugrad', cls:'cat-ugrad', card:'cat-ugrad'},
  // 구버전 호환
  '🔬 연구/실험':      { key:'mat',   cls:'cat-mat',   card:'cat-mat' },
  '💻 코딩 프로젝트':  { key:'ic',    cls:'cat-ic',    card:'cat-ic'  },
  '📚 학습':           { key:'edu',   cls:'cat-edu',   card:'cat-edu' },
};

let allProjects = [];
let currentFilter = 'all';

// ── 스크롤 리빌 ──
function initReveal() {
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); }
    });
  }, { threshold: 0.08 });
  document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
}

// ── 스크롤 스파이 (사이드 nav 활성화) ──
function initScrollSpy() {
  const sections  = document.querySelectorAll('section[id]');
  const navLinks  = document.querySelectorAll('.pl-nav-link');
  if (!navLinks.length) return;

  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        navLinks.forEach(a => a.classList.remove('active'));
        const a = document.querySelector(`.pl-nav-link[href="#${e.target.id}"]`);
        if (a) a.classList.add('active');
      }
    });
  }, { threshold: 0.25, rootMargin: '-15% 0px -60% 0px' });

  sections.forEach(s => obs.observe(s));
}

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
    const g = document.getElementById('projects-grid');
    if (g) g.innerHTML = '<p class="loading-msg">데이터를 불러올 수 없습니다.</p>';
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
    .filter(p => p.category === '🔬 소재·분석 연구'
      && !p.title.includes('배터리')
      && !p.title.includes('졸업논문')
      && !p.title.includes('CABON'))
    .sort((a,b) => new Date(b.date) - new Date(a.date));
  if (!items.length) { grid.innerHTML = ''; return; }

  grid.innerHTML = items.map(p => {
    const flowKey  = Object.keys(ANALYSIS_FLOW).find(k => p.title.includes(k));
    const steps    = flowKey ? ANALYSIS_FLOW[flowKey] : [];
    const flowHTML = steps.map((s,i) =>
      `<span class="fa-step">${s}</span>${i < steps.length-1 ? '<span class="fa-arrow">→</span>' : ''}`
    ).join('');
    const idx = allProjects.indexOf(p);
    return `
    <div class="research-card">
      <div class="rc-header">
        <span class="rc-badge">🔬 Failure Analysis</span>
        <span class="rc-date">${p.date ? p.date.slice(0,7) : ''}</span>
      </div>
      <h3 class="rc-title">${p.title}</h3>
      <p class="rc-result">${p.key_result || ''}</p>
      ${steps.length ? `<div class="fa-flow">${flowHTML}</div>` : ''}
      <div class="rc-tags">${(p.tech_stack||[]).map(t=>`<span class="card-tag">${t}</span>`).join('')}</div>
      <a class="rc-more" href="detail.html?idx=${idx}">자세히 보기 →</a>
    </div>`;
  }).join('');
}

// ── 카운트 업데이트 ──
function updateCounts() {
  const c = { all:0, mat:0, ic:0, sw:0, proc:0 };
  allProjects.forEach(p => {
    const k = CAT_MAP[p.category]?.key;
    if (!k || k === 'ugrad') return;
    c.all++;
    if (c[k] !== undefined) c[k]++;
  });
  Object.entries(c).forEach(([k, v]) => {
    const el = document.getElementById(`cnt-${k}`);
    if (el) el.textContent = v;
  });
}

// ── 프로젝트 렌더링 ──
function renderProjects() {
  const grid = document.getElementById('projects-grid');
  if (!grid) return;
  const filtered = currentFilter === 'all'
    ? allProjects.filter(p => CAT_MAP[p.category]?.key !== 'ugrad')
    : allProjects.filter(p => CAT_MAP[p.category]?.key === currentFilter);
  if (!filtered.length) { grid.innerHTML = '<p class="loading-msg">항목이 없습니다.</p>'; return; }
  const sorted = [...filtered].sort((a,b) => new Date(b.date) - new Date(a.date));
  grid.innerHTML = sorted.map(p => cardHTML(p, allProjects.indexOf(p))).join('');
}

function cardHTML(p, idx) {
  const m    = CAT_MAP[p.category] || { cls:'', card:'' };
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
      <a class="p-card-more" href="detail.html?idx=${idx}">Learn More →</a>
    </div>
  </div>`;
}

// ── 교육 타임라인 ──
function renderEducation() {
  const wrap = document.getElementById('education-timeline');
  if (!wrap) return;

  const mainItems = allProjects
    .filter(p => ['📚 교육·학습','📚 학습'].includes(p.category))
    .sort((a,b) => new Date(b.date) - new Date(a.date));

  const ugradItems = allProjects
    .filter(p => p.category === '🎓 학부 교과과정')
    .sort((a,b) => new Date(a.date) - new Date(b.date));

  if (!mainItems.length && !ugradItems.length) {
    wrap.innerHTML = '<p class="loading-msg">교육 데이터 없음</p>'; return;
  }

  const mainHTML = mainItems.map(p => {
    const hours = (p.title.match(/(\d+)h/)||[])[1];
    const place = p.star ? extractPlace(p.star) : '';
    const idx   = allProjects.indexOf(p);
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

  const ugGroups = {};
  ugradItems.forEach(p => {
    const m   = p.title.match(/^\[학부\s+([^\]]+)\]/);
    const tag = m ? m[1] : '기타';
    if (!ugGroups[tag]) ugGroups[tag] = [];
    ugGroups[tag].push(p);
  });

  const ugGroupHTML = Object.entries(ugGroups).map(([tag, items]) => {
    const cards = items.map(p => {
      const cleanTitle = p.title.replace(/^\[[^\]]+\]\s*/, '');
      const idx = allProjects.indexOf(p);
      return `<div class="sub-item tl-clickable" data-idx="${idx}">
        <p class="sub-item-title">${cleanTitle}</p>
        <div class="sub-item-tags">${(p.tech_stack||[]).slice(0,3).map(t=>`<span class="tl-tag">${t}</span>`).join('')}</div>
      </div>`;
    }).join('');
    return `<div class="sub-group">
      <div class="sub-group-header">
        <span class="sub-group-label">${tag}</span>
        <span class="sub-count">${items.length}</span>
      </div>
      <div class="sub-group-items">${cards}</div>
    </div>`;
  }).join('');

  const ugradSection = ugGroupHTML ? `
    <div class="sub-lineup-section ugrad-section">
      <div class="sub-lineup-title">🎓 학부 교과과정 — 중앙대 융합공학부 나노소재공학 (2019–2025)</div>
      <div class="sub-lineup-groups">${ugGroupHTML}</div>
    </div>` : '';

  wrap.innerHTML = mainHTML + ugradSection;

  wrap.querySelectorAll('.tl-clickable').forEach(el => {
    const idx = +el.dataset.idx;
    el.addEventListener('click', () => {
      if (allProjects[idx]) window.location.href = `detail.html?idx=${idx}`;
    });
  });
}

function extractPlace(star) {
  const m = star.match(/([가-힣A-Za-z]+대학교|[가-힣A-Za-z]+에듀|[가-힣A-Za-z]+협동조합|한국전자산업협동조합)/);
  return m ? m[1] : '';
}

// ── 탭 ──
document.querySelectorAll('.tab').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.filter;
    renderProjects();
  });
});

initReveal();
initScrollSpy();
loadProjects();
