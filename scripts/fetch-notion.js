// Notion DB → data/projects.json 동기화 스크립트
// 사용: NOTION_TOKEN=secret_xxx node scripts/fetch-notion.js

const https = require('https');
const fs    = require('fs');
const path  = require('path');

const TOKEN       = process.env.NOTION_TOKEN;
const DATABASE_ID = '70452849-f71a-4fcb-bf81-08e9adb701fd';

if (!TOKEN) {
  console.error('❌ NOTION_TOKEN 환경변수가 없습니다');
  process.exit(1);
}

// Notion API POST 요청
function notionPost(endpoint, body = {}) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = https.request({
      hostname: 'api.notion.com',
      path: `/v1/${endpoint}`,
      method: 'POST',
      headers: {
        'Authorization':  `Bearer ${TOKEN}`,
        'Notion-Version': '2022-06-28',
        'Content-Type':   'application/json',
        'Content-Length': Buffer.byteLength(data),
      }
    }, res => {
      let raw = '';
      res.on('data', c => raw += c);
      res.on('end', () => resolve(JSON.parse(raw)));
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

// Notion 속성 → 값 변환
function parse(prop) {
  if (!prop) return null;
  switch (prop.type) {
    case 'title':        return prop.title.map(t => t.plain_text).join('');
    case 'rich_text':    return prop.rich_text.map(t => t.plain_text).join('');
    case 'date':         return prop.date?.start ?? null;
    case 'select':       return prop.select?.name ?? null;
    case 'multi_select': return prop.multi_select.map(s => s.name);
    case 'status':       return prop.status?.name ?? null;
    default:             return null;
  }
}

// 전체 페이지 가져오기 (페이지네이션 처리)
async function fetchAll() {
  const results = [];
  let cursor;
  do {
    const body = { page_size: 100, ...(cursor && { start_cursor: cursor }) };
    const res = await notionPost(`databases/${DATABASE_ID}/query`, body);
    results.push(...res.results);
    cursor = res.has_more ? res.next_cursor : null;
  } while (cursor);
  return results;
}

async function main() {
  console.log('📡 Notion DB 동기화 중...');
  const pages = await fetchAll();
  console.log(`✅ ${pages.length}개 항목 가져옴`);

  const projects = pages.map(page => {
    const p = page.properties;
    return {
      id:         page.id,
      title:      parse(p['제목']    ?? p['Name']       ?? p['title']),
      date:       parse(p['날짜']    ?? p['Date']),
      category:   parse(p['카테고리'] ?? p['Category']),
      tech_stack: parse(p['기술_스택'] ?? p['Tech Stack']) ?? [],
      key_result: parse(p['핵심_성과'] ?? p['Key Result']),
      star:       parse(p['STAR_서술'] ?? p['STAR']),
      status:     parse(p['상태']    ?? p['Status']),
    };
  }).filter(p => p.title);

  const output = {
    updated_at: new Date().toISOString().split('T')[0],
    projects,
  };

  const outPath = path.join(__dirname, '..', 'data', 'projects.json');
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2), 'utf-8');
  console.log(`💾 저장 완료: ${projects.length}개 → data/projects.json`);
}

main().catch(err => { console.error('오류:', err.message); process.exit(1); });
