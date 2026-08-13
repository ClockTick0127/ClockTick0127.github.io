// projects.json 을 읽어서 PROJECTS 섹션을 그립니다.
// 내용을 바꾸려면 이 파일이 아니라 projects.json 을 수정하세요.

const mount = document.querySelector('#project-list');

// JSON 내용이 마크업으로 해석되지 않도록 이스케이프
const esc = (v = '') =>
  String(v).replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
  );

function getYoutubeEmbedUrl(idOrUrl) {
  if (!idOrUrl) return '';
  const match = idOrUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
  if (match) return `https://www.youtube.com/embed/${match[1]}`;
  return `https://www.youtube.com/embed/${esc(idOrUrl)}`;
}

function shot(p) {
  if (p.youtubeId) {
    return `<iframe src="${getYoutubeEmbedUrl(p.youtubeId)}"
      title="${esc(p.title)} 데모 영상" loading="lazy"
      allow="accelerometer; clipboard-write; encrypted-media; picture-in-picture"
      allowfullscreen></iframe>`;
  }
  if (p.image) {
    return `<img src="${esc(p.image)}" alt="${esc(p.title)} 화면" loading="lazy">`;
  }
  return `<span class="shot-empty">projects.json 의 image 또는<br>youtubeId 를 채우면 여기에 표시됩니다</span>`;
}

// 칩 텍스트 → style.css 의 data-tech 키 ("Node.js" → "node-js")
const techKey = (s = '') =>
  s.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

// 페이지의 모든 칩(SKILLS·CAREER·프로젝트 태그)에 기술별 색을 입힙니다.
function paintChips() {
  document.querySelectorAll('.chips li').forEach(li => {
    li.dataset.tech = techKey(li.textContent);
  });
}

function links(map = {}) {
  const label = { demo: 'View Project', repo: 'GitHub', docs: '기술 문서' };
  return Object.entries(map)
    .filter(([, url]) => url)
    .map(([k, url]) =>
      `<a href="${esc(url)}" target="_blank" rel="noopener">${label[k] || esc(k)} →</a>`
    ).join('');
}

// description 의 각 줄을 문단으로, "•" 로 시작하는 줄은 불릿 목록으로 묶습니다.
function describe(desc) {
  const lines = (Array.isArray(desc) ? desc : [desc])
    .map(s => String(s ?? '').trim())
    .filter(Boolean);

  const out = [];
  let bullets = [];
  const flush = () => {
    if (bullets.length) out.push(`<ul class="bullets">${bullets.join('')}</ul>`);
    bullets = [];
  };

  lines.forEach(line => {
    const bullet = line.match(/^[•·*-]\s+(.+)$/);
    if (bullet) {
      bullets.push(`<li>${esc(bullet[1])}</li>`);
    } else {
      flush();
      out.push(`<p class="project-desc">${esc(line)}</p>`);
    }
  });
  flush();

  return out.join('');
}

function card(p) {
  const linkHtml = links(p.links);
  const descContent = describe(p.description);

  return `<article class="card project reveal">
    <div class="project-shot">${shot(p)}</div>
    <div class="project-body">
      ${p.tags?.length ? `<ul class="chips">${p.tags.map(t => `<li>${esc(t)}</li>`).join('')}</ul>` : ''}
      <h3 class="project-title">${esc(p.title)}</h3>
      ${p.subtitle ? `<p class="project-sub">${esc(p.subtitle)}</p>` : ''}
      ${p.period ? `<p class="project-period">${esc(p.period)}${p.team ? ' · ' + esc(p.team) : ''}</p>` : ''}
      ${descContent}
      ${p.bullets?.length
      ? `<ul class="bullets">${p.bullets.map(b => `<li>${esc(b)}</li>`).join('')}</ul>`
      : ''}
      ${linkHtml ? `<div class="project-links">${linkHtml}</div>` : ''}
    </div>
  </article>`;
}

function observeReveals() {
  const targets = document.querySelectorAll('.reveal');
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    targets.forEach(el => el.classList.add('in'));
    return;
  }
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    });
  }, { threshold: 0.1 });
  targets.forEach(el => io.observe(el));
}

async function render() {
  try {
    const res = await fetch('projects.json');
    if (!res.ok) throw new Error(res.status);
    const projects = await res.json();

    mount.innerHTML = projects.length
      ? projects.map(card).join('')
      : `<p class="state">아직 등록된 프로젝트가 없습니다. projects.json 에 항목을 추가하세요.</p>`;
  } catch (err) {
    mount.innerHTML = `<p class="state">
      projects.json 을 불러오지 못했습니다.<br>
      로컬에서 확인 중이라면 파일을 직접 열지 말고 서버로 실행하세요 —
      <code>python3 -m http.server 8000</code>
    </p>`;
    console.error(err);
  }
  paintChips();
  observeReveals();
}

render();
