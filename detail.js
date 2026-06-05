const CAT_COLORS = {
  '🔬 소재·분석 연구': { bg: 'rgba(34,211,238,.12)',  color: '#0891b2' },
  '⚡ 회로·IC 설계':   { bg: 'rgba(167,139,250,.15)', color: '#7c3aed' },
  '💻 SW·자동화':      { bg: 'rgba(59,130,246,.12)',  color: '#1d4ed8' },
  '🏭 공정·장비':      { bg: 'rgba(251,191,36,.12)',  color: '#b45309' },
  '📚 교육·학습':      { bg: 'rgba(148,163,184,.12)', color: '#475569' },
  '🎓 학부 교과과정':  { bg: 'rgba(251,146,60,.12)',  color: '#c2410c' },
  '🔬 연구/실험':      { bg: 'rgba(34,211,238,.12)',  color: '#0891b2' },
  '💻 코딩 프로젝트':  { bg: 'rgba(167,139,250,.15)', color: '#7c3aed' },
  '📚 학습':           { bg: 'rgba(148,163,184,.12)', color: '#475569' },
};

async function loadDetail() {
  const params = new URLSearchParams(window.location.search);
  const idx    = parseInt(params.get('idx'), 10);
  const el     = document.getElementById('detail-content');

  try {
    const res      = await fetch('data/projects.json');
    const data     = await res.json();
    const projects = data.projects || [];
    const p        = projects[idx];

    if (!p) { el.innerHTML = '<p class="loading-msg">항목을 찾을 수 없습니다.</p>'; return; }

    document.title = `${p.title} | YUNTAE LEE`;

    const cat  = CAT_COLORS[p.category] || { bg:'rgba(14,165,233,.12)', color:'#0284c7' };
    const tags = (p.tech_stack||[]).map(t => `<span class="card-tag">${t}</span>`).join('');

    const starHTML = (p.star||'')
      .replace(/\[상황\]/g, '<strong class="star-label">[상황]</strong>')
      .replace(/\[과제\]/g, '<strong class="star-label">[과제]</strong>')
      .replace(/\[행동\]/g, '<strong class="star-label">[행동]</strong>')
      .replace(/\[결과\]/g, '<strong class="star-label">[결과]</strong>')
      .replace(/\n/g, '<br>');

    el.innerHTML = `
      <div class="detail-header">
        <div class="detail-meta">
          <span class="detail-cat" style="background:${cat.bg};color:${cat.color}">${p.category||''}</span>
          ${p.status ? `<span class="detail-status">${p.status}</span>` : ''}
          ${p.date   ? `<span class="detail-date">${p.date}</span>`   : ''}
        </div>
        <h1 class="detail-title">${p.title}</h1>
        ${p.key_result ? `<div class="detail-result">📌 ${p.key_result}</div>` : ''}
      </div>

      ${tags ? `
      <div class="detail-section">
        <h3>기술 스택</h3>
        <div class="detail-tags">${tags}</div>
      </div>` : ''}

      ${p.star ? `
      <div class="detail-section">
        <h3>STAR 스토리</h3>
        <div class="detail-star">${starHTML}</div>
      </div>` : ''}
    `;
  } catch {
    el.innerHTML = '<p class="loading-msg">데이터를 불러올 수 없습니다.</p>';
  }
}

loadDetail();
