// projects.json 을 읽어서 PROJECTS 섹션을 그립니다.
// 내용을 바꾸려면 이 파일이 아니라 projects.json 을 수정하세요.

const mount = document.querySelector('#project-list');

// JSON 내용이 마크업으로 해석되지 않도록 이스케이프
const esc = (v = '') =>
  String(v).replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
  );

function getYoutubeWatchUrl(idOrUrl) {
  if (!idOrUrl) return '';
  if (idOrUrl.startsWith('http://') || idOrUrl.startsWith('https://')) return idOrUrl;
  return `https://www.youtube.com/watch?v=${idOrUrl}`;
}

function shot(p) {
  if (p.image) {
    return `<img src="${esc(p.image)}" alt="${esc(p.title)} 화면" loading="lazy" width="1200" height="704">`;
  }
  return `<span class="shot-empty">projects.json 의 image 를<br>채우면 여기에 표시됩니다</span>`;
}

function links(p) {
  const map = { ...(p.links || {}) };
  const yt = map.youtube || p.youtube || p.youtubeId;
  if (yt) {
    map.youtube = getYoutubeWatchUrl(yt);
  }

  const label = { demo: '서비스 체험', repo: 'GitHub', docs: '개발 기록', youtube: '시연 영상' };
  return Object.entries(map)
    .filter(([, url]) => url && !url.includes('your-id'))
    .map(([k, url]) =>
      `<a href="${esc(url)}" target="_blank" rel="noopener" aria-label="${esc(p.title)} ${label[k] || esc(k)} (새 탭)">${label[k] || esc(k)} <span aria-hidden="true">↗</span></a>`
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

function card(p, index) {
  const linkHtml = links(p);

  return `<details class="project">
    <summary class="project-summary" aria-label="${esc(p.title)} 상세 내용">
    <div class="project-shot">${shot(p)}</div>
    <div class="project-body">
      <div class="project-meta"><span class="project-number">${String(index + 1).padStart(2, '0')}</span>${p.category ? `<span>${esc(p.category)}</span>` : ''}</div>
      <h3 class="project-title" id="project-title-${index}">${esc(p.title)}</h3>
      ${p.subtitle ? `<p class="project-sub">${esc(p.subtitle)}</p>` : ''}
      ${p.period ? `<p class="project-period">${esc(p.period)}${p.team ? ' · ' + esc(p.team) : ''}</p>` : ''}
      ${p.role || p.outcome ? `<dl class="project-facts">
        ${p.role ? `<div><dt>담당</dt><dd>${esc(p.role)}</dd></div>` : ''}
        ${p.outcome ? `<div><dt>결과</dt><dd>${esc(p.outcome)}</dd></div>` : ''}
      </dl>` : (p.focus ? `<p class="project-focus">${esc(p.focus)}</p>` : '')}
      ${p.tags?.length ? `<div class="project-tech"><span>기술</span><ul class="chips">${p.tags.map(t => `<li>${esc(t)}</li>`).join('')}</ul></div>` : ''}
      ${linkHtml ? `<div class="project-resources"><span>자료</span><div class="project-links">${linkHtml}</div></div>` : ''}
      <span class="project-more" aria-hidden="true"><span class="project-more-label">문제 해결 과정 읽기</span><span class="project-less-label">내용 접기</span><span class="project-chevron">⌄</span></span>
    </div>
    </summary>
    <div class="project-expanded">
      <div class="project-expanded-inner">
      <section class="project-detail-section project-overview">
        <h4>프로젝트 소개</h4>
        <div>${describe(p.overview || p.description)}${p.bullets?.length ? `<ul class="bullets">${p.bullets.map(b => `<li>${esc(b)}</li>`).join('')}</ul>` : ''}</div>
      </section>
      ${(p.details || []).map((section, step) => `<section class="project-detail-section">
        <h4><span class="detail-step" aria-hidden="true">${String(step + 1).padStart(2, '0')}</span>${esc(section.title)}</h4>
        <div class="project-detail-copy">${describe(section.body)}</div>
      </section>`).join('')}
      ${linkHtml ? `<div class="project-resource-links"><p>관련 자료</p><div class="project-links">${linkHtml}</div></div>` : ''}
      <button type="button" class="project-collapse" aria-label="${esc(p.title)} 상세 내용 접기">상세 내용 접기 ↑</button>
      </div>
    </div>
  </details>`;
}

mount.addEventListener('click', event => {
  const trigger = event.target.closest('.project-collapse');
  if (!trigger) return;
  const project = trigger.closest('details');
  project.open = false;
  project.querySelector('summary').focus({ preventScroll: true });
  project.scrollIntoView({
    block: 'start',
    behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
  });
});

async function render() {
  try {
    const res = await fetch('projects.json');
    if (!res.ok) throw new Error(res.status);
    // projects.json의 배열 순서를 그대로 사용합니다. 최신 프로젝트를 위에 배치하세요.
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
}

render();
