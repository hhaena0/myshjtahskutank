/**
 * ui.js - UI 렌더링 함수들 (한국어판 시즌 기반)
 */

import Storage from './storage.js';

// ── 태그 색상 매핑 ──────────────────────────
const TAG_CLASS_MAP = {
  '검은조직': 'tag-org',
  '괴도키드': 'tag-kid',
  '어린이탐정단': 'tag-detective',
  '쿠도 신이치': 'tag-shinichi',
  '핫토리 헤이지': 'tag-heiji',
  '아카이 슈이치': 'tag-akai'
};

const TAG_ORDER = ['검은조직', '괴도키드', '어린이탐정단', '쿠도 신이치', '핫토리 헤이지', '아카이 슈이치'];

export function sortTags(tags) {
  if (!tags || !tags.length) return [];
  return [...tags].sort((a, b) => {
    let ia = TAG_ORDER.indexOf(a);
    let ib = TAG_ORDER.indexOf(b);
    if (ia === -1) ia = 999;
    if (ib === -1) ib = 999;
    return ia - ib;
  });
}

function getTagClass(tag) {
  return TAG_CLASS_MAP[tag] || 'tag-default';
}

// ── 진행률 업데이트 ──────────────────────────
export function updateProgressUI(episodes) {
  const stats = Storage.getStats(episodes);

  const fillEl = document.getElementById('progress-bar-fill');
  const countEl = document.getElementById('progress-count');
  const totalEl = document.getElementById('progress-total');
  const percentEl = document.getElementById('progress-percent');
  const watchedStatEl = document.getElementById('stat-watched');
  const bookmarkStatEl = document.getElementById('stat-bookmarked');

  if (fillEl) fillEl.style.width = stats.percent + '%';
  if (countEl) countEl.textContent = stats.watched.toLocaleString();
  if (totalEl) totalEl.textContent = stats.total.toLocaleString();
  if (percentEl) percentEl.textContent = stats.percent + '%';
  if (watchedStatEl) watchedStatEl.textContent = stats.watched + '화 완료';
  if (bookmarkStatEl) bookmarkStatEl.textContent = '북마크 ' + stats.bookmarked + '개';
}

// ── 에피소드 카드 렌더링 ──────────────────────
export function renderEpisodeCard(ep, onCardClick, onCheckClick, onBookmarkClick) {
  const ud = Storage.getEpisodeData(ep.id);
  const card = document.createElement('div');
  card.className = 'episode-card' + (ud.watched ? ' watched' : '') + (ud.bookmarked ? ' bookmarked' : '');
  card.dataset.epId = ep.id;

  // 태그 HTML
  const sortedTags = sortTags(ud.tags);
  const tagsHtml = sortedTags.length
    ? '<div class="episode-tags">' + sortedTags.map(function(t) {
        return '<span class="tag ' + getTagClass(t) + '">' + t + '</span>';
      }).join('') + '</div>'
    : '';

  // X파일 배지 -> 오리지널 배지
  const originalBadge = ep.isOriginal
    ? '<span class="tag tag-default" style="font-size:0.65rem;padding:2px 7px;">오리지널</span>'
    : '';

  // 에피소드 번호 표시: "시즌1 1화" (또는 미방영분)
  let sName = ep.seasonName;
  if (ep.seasonId !== "unreleased" && ep.seasonId !== "other" && ep.episodeInSeason && ep.episodeInSeason !== '-') {
      sName += ' ' + ep.episodeInSeason + '화';
  }
  
  const hasMemoIndicator = (ud.memo && ud.memo.trim().length > 0) ? '<span class="memo-icon" title="메모 존재">✏️</span>' : '';
  const epLabel = ep.japan_id + '화 <span class="tag tag-default" style="font-size: 0.75rem; color: var(--text-muted); background: transparent; padding: 0; border: none; font-weight: 500; margin-left:6px;">' + sName + '</span>';

  card.innerHTML =
    '<div class="check-btn-wrapper">' +
      '<button class="check-btn" data-ep-id="' + ep.id + '" title="시청 체크">' +
        '<svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg>' +
      '</button>' +
    '</div>' +
    '<div class="episode-info">' +
      '<div class="episode-meta">' +
        '<div class="episode-num">' + epLabel + '</div>' +
        originalBadge +
      '</div>' +
      '<h3 class="episode-title">' + ep.title + '</h3>' +
    tagsHtml +
    '</div>' +
    '<div class="episode-actions">' +
      '<button class="bookmark-btn" data-ep-id="' + ep.id + '" title="북마크">' +
      (ud.bookmarked ? '⭐' : '☆') +
      '</button>' +
      hasMemoIndicator +
    '</div>';

  // 이벤트
  card.querySelector('.check-btn').addEventListener('click', function(e) {
    e.stopPropagation();
    onCheckClick(ep.id, card);
  });

  card.querySelector('.bookmark-btn').addEventListener('click', function(e) {
    e.stopPropagation();
    onBookmarkClick(ep.id, card);
  });

  card.addEventListener('click', function() { onCardClick(ep); });

  return card;
}

// ── 에피소드 목록 렌더링 ──────────────────────
export function renderEpisodeList(episodes, container, callbacks) {
  container.innerHTML = '';
  if (episodes.length === 0) {
    container.innerHTML =
      '<div class="empty-state">' +
      '<span class="empty-icon">🔍</span>' +
      '<p>결과가 없어요.<br>검색어나 필터를 바꿔보세요.</p>' +
      '</div>';
    return;
  }
  const fragment = document.createDocumentFragment();
  episodes.forEach(function(ep) {
    fragment.appendChild(renderEpisodeCard(ep, callbacks.onCardClick, callbacks.onCheckClick, callbacks.onBookmarkClick));
  });
  container.appendChild(fragment);
}

// ── 에피소드 카드 상태 업데이트 ──
export function updateCardState(epId) {
  const card = document.querySelector('.episode-card[data-ep-id="' + epId + '"]');
  if (!card) return;
  const ud = Storage.getEpisodeData(epId);

  card.classList.toggle('watched', ud.watched);
  card.classList.toggle('bookmarked', ud.bookmarked);

  const bookmarkBtn = card.querySelector('.bookmark-btn');
  if (bookmarkBtn) bookmarkBtn.textContent = ud.bookmarked ? '⭐' : '☆';

  // 메모 아이콘 업데이트
  const actionsEl = card.querySelector('.episode-actions');
  let memoEl = actionsEl.querySelector('.memo-icon');
  const hasMemo = (ud.memo && ud.memo.trim().length > 0);
  
  if (hasMemo && !memoEl) {
      memoEl = document.createElement('span');
      memoEl.className = 'memo-icon';
      memoEl.title = '메모 존재';
      memoEl.textContent = '✏️';
      actionsEl.appendChild(memoEl);
  } else if (!hasMemo && memoEl) {
      memoEl.remove();
  }

  // 태그 업데이트
  const infoEl = card.querySelector('.episode-info');
  const existingTags = infoEl.querySelector('.episode-tags');
  if (existingTags) existingTags.remove();

  if (ud.tags.length) {
    const sortedTags = sortTags(ud.tags);
    const tagsDiv = document.createElement('div');
    tagsDiv.className = 'episode-tags';
    tagsDiv.innerHTML = sortedTags.map(function(t) {
      return '<span class="tag ' + getTagClass(t) + '">' + t + '</span>';
    }).join('');
    infoEl.appendChild(tagsDiv);
  }
}

// ── 모달 열기 ──────────────────────────────────
export function openModal(ep, onSave) {
  const overlay = document.getElementById('modal-overlay');
  const ud = Storage.getEpisodeData(ep.id);

  const epLabel = ep.seasonName + ' ' + ep.episodeInSeason + '화';

  document.getElementById('modal-ep-num').textContent = epLabel;
  document.getElementById('modal-ep-title').textContent = ep.title;
  document.getElementById('modal-ep-date').textContent = ep.isOriginal ? ' · 오리지널 에피소드' : '';

  // 메모
  document.getElementById('modal-memo').value = ud.memo || '';

  // 현재 태그
  renderModalTags(ep.id);

  // 시청 버튼
  const watchBtn = document.getElementById('modal-watch-btn');
  watchBtn.textContent = ud.watched ? '✓ 시청 완료됨' : '시청 완료로 표시';
  watchBtn.className = 'btn-primary' + (ud.watched ? ' watched-active' : '');

  watchBtn.onclick = function() {
    const isNowWatched = Storage.toggleWatched(ep.id);
    watchBtn.textContent = isNowWatched ? '✓ 시청 완료됨' : '시청 완료로 표시';
    watchBtn.className = 'btn-primary' + (isNowWatched ? ' watched-active' : '');
    updateCardState(ep.id);
    onSave();
  };

  // 저장 + 닫기
  document.getElementById('modal-save-btn').onclick = function() {
    Storage.setEpisodeData(ep.id, { memo: document.getElementById('modal-memo').value });
    closeModal();
    updateCardState(ep.id);
    onSave();
    showToast('저장됐어요 ✓');
  };

  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}

export function closeModal() {
  document.getElementById('modal-overlay').classList.remove('open');
  document.body.style.overflow = '';
}



function renderModalTags(epId) {
  const ud = Storage.getEpisodeData(epId);
  const container = document.getElementById('modal-current-tags');
  container.innerHTML = '';
  const sortedTags = sortTags(ud.tags);
  sortedTags.forEach(function(tag) {
    const span = document.createElement('span');
    span.className = 'tag ' + getTagClass(tag);
    span.innerHTML = tag + ' <span class="remove-tag">✕</span>';
    span.querySelector('.remove-tag').addEventListener('click', function() {
      Storage.removeTag(epId, tag);
      renderModalTags(epId);
    });
    container.appendChild(span);
  });
}

// 모달에서 태그 추가 처리
export function setupTagInput(epId) {
  // 퀵 태그
  document.querySelectorAll('.quick-tag-btn').forEach(function(btn) {
    btn.onclick = function() {
      Storage.addTag(epId, btn.dataset.tag);
      renderModalTags(epId);
    };
  });
}

// ── 토스트 메시지 ─────────────────────────────
export function showToast(msg, duration) {
  duration = duration || 2000;
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(function() { toast.classList.remove('show'); }, duration);
}

// ── 태그 필터 버튼 렌더링 ─────────────────────
export function renderTagFilters(allTags, activeTag, onTagClick) {
  const container = document.getElementById('tag-filter-scroll');
  container.innerHTML = '';

  const allBtn = document.createElement('button');
  allBtn.className = 'tag tag-default' + (!activeTag ? ' active' : '');
  allBtn.textContent = '전체 태그';
  allBtn.addEventListener('click', function() { onTagClick(null); });
  container.appendChild(allBtn);

  allTags.forEach(function(tag) {
    const btn = document.createElement('button');
    btn.className = 'tag ' + getTagClass(tag) + (activeTag === tag ? ' active' : '');
    btn.textContent = tag;
    btn.addEventListener('click', function() { onTagClick(tag); });
    container.appendChild(btn);
  });
}

// ── 시즌 선택기 렌더링 ─────────────────────────
export function renderSeasonSelector(seasons, activeSeasonNum, onSeasonClick) {
  const container = document.getElementById('season-selector');
  if (!container) return;
  container.innerHTML = '';

  // 전체 버튼
  const allBtn = document.createElement('button');
  allBtn.className = 'season-btn' + (activeSeasonNum === null ? ' active' : '');
  allBtn.dataset.season = 'all';
  allBtn.textContent = '전체';
  allBtn.addEventListener('click', function() { onSeasonClick(null); });
  container.appendChild(allBtn);

  // 정규 시즌
  const regularSeasons = seasons.filter(function(s) { return !s.isXFile; });
  regularSeasons.forEach(function(season) {
    const btn = document.createElement('button');
    btn.className = 'season-btn' + (activeSeasonNum === season.seasonId ? ' active' : '');
    btn.dataset.season = season.seasonId;
    btn.textContent = season.seasonName.replace('자막판 ', '');
    btn.title = season.seasonName + ' (' + season.episodes.length + '화)';
    btn.addEventListener('click', function() { onSeasonClick(season.seasonId); });
    container.appendChild(btn);
  });

  // X파일 구분선 + 버튼들
  const xfileSeasons = seasons.filter(function(s) { return s.isXFile; });
  if (xfileSeasons.length > 0) {
    const divider = document.createElement('span');
    divider.className = 'season-divider';
    divider.textContent = '|';
    container.appendChild(divider);

    xfileSeasons.forEach(function(season) {
      const btn = document.createElement('button');
      btn.className = 'season-btn xfile-btn' + (activeSeasonNum === season.seasonId ? ' active' : '');
      btn.dataset.season = season.seasonId;
      btn.textContent = season.seasonName.replace('X파일 (', '').replace(')', '');
      btn.title = season.seasonName + ' (' + season.episodes.length + '화)';
      btn.addEventListener('click', function() { onSeasonClick(season.seasonId); });
      container.appendChild(btn);
    });
  }
}
