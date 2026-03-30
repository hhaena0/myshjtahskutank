/**
 * app.js - 명탐정 코난 시청 트래커
 * 한국어판 시즌 기반 메인 로직
 */

import Storage from './storage.js';
import { loadKoreanEpisodes } from './api.js';
import {
  updateProgressUI,
  renderEpisodeList,
  updateCardState,
  openModal,
  closeModal,
  setupTagInput,
  showToast,
  renderTagFilters,
  renderSeasonSelector,
} from './ui.js';

// ── 전역 상태 ──────────────────────────────────
let allEpisodes = [];
let allSeasons = [];
let currentFilter = 'all';   // all | watched | unwatched | bookmarked
let currentTagFilter = null;
let searchQuery = '';
let currentSeasonFilter = null; // null = 전체, 또는 seasonNumber

// ── 필터링 ─────────────────────────────────────
function getFilteredEpisodes() {
  let result = allEpisodes;

  // 시즌 필터
  if (currentSeasonFilter !== null) {
    result = result.filter(function(ep) {
      return ep.seasonId === currentSeasonFilter;
    });
  }

  // 상태 필터
  if (currentFilter === 'watched') {
    result = result.filter(function(ep) { return Storage.getEpisodeData(ep.id).watched; });
  } else if (currentFilter === 'unwatched') {
    result = result.filter(function(ep) { return !Storage.getEpisodeData(ep.id).watched; });
  } else if (currentFilter === 'bookmarked') {
    result = result.filter(function(ep) { return Storage.getEpisodeData(ep.id).bookmarked; });
  } else if (currentFilter === 'memo') {
    result = result.filter(function(ep) {
      var d = Storage.getEpisodeData(ep.id);
      return d.memo && d.memo.trim().length > 0;
    });
  }

  // 태그 필터
  if (currentTagFilter) {
    result = result.filter(function(ep) {
      return Storage.getEpisodeData(ep.id).tags.includes(currentTagFilter);
    });
  }

  // 검색
  if (searchQuery) {
    var q = searchQuery.toLowerCase();
    result = result.filter(function(ep) {
      return ep.title.toLowerCase().includes(q) ||
             String(ep.japan_id).includes(q) ||
             String(ep.originalIdString).includes(q);
    });
  }

  // 전체 정렬: 일본화수 기준 (japan_id)
  result.sort(function(a, b) {
      return a.japan_id - b.japan_id;
  });

  return result;
}

// ── 목록 렌더 ──────────────────────────────────
function renderList() {
  var filtered = getFilteredEpisodes();
  var container = document.getElementById('episodes-list');
  var countEl = document.getElementById('episode-count');
  if (countEl) countEl.textContent = filtered.length + '화';

  renderEpisodeList(filtered, container, {
    onCardClick: function(ep) {
      openModal(ep, function() {
        updateProgressUI(allEpisodes);
        refreshTagFilters();
        updateCardState(ep.id);
      });
      setupTagInput(ep.id);
    },
    onCheckClick: function(epId, card) {
      var isWatched = Storage.toggleWatched(epId);
      updateCardState(epId);
      updateProgressUI(allEpisodes);
      showToast(isWatched ? '✓ 시청 완료!' : '시청 취소됨');
    },
    onBookmarkClick: function(epId, card) {
      var isBookmarked = Storage.toggleBookmark(epId);
      updateCardState(epId);
      updateProgressUI(allEpisodes);
      showToast(isBookmarked ? '⭐ 북마크 추가!' : '북마크 해제');
    },
  });
}

// ── 태그 필터 새로고침 ─────────────────────────
function refreshTagFilters() {
  var tags = Storage.getAllUsedTags();
  renderTagFilters(tags, currentTagFilter, function(tag) {
    currentTagFilter = tag;
    refreshTagFilters();
    renderList();
  });
}

// ── 시청 기록 초기 마이그레이션 (1회만 실행) ───
function runWatchedMigration() {
  var MIGRATION_KEY = 'conan_watched_migration_v1';
  if (localStorage.getItem(MIGRATION_KEY)) return;

  allEpisodes.forEach(function(ep) {
    var sNum = ep.seasonNumber;
    // 시즌 1, 2, 3 전체 시청 완료
    if (sNum >= 1 && sNum <= 3) {
      Storage.setEpisodeData(ep.id, { watched: true });
    }
    // 시즌 4의 1화~38화 시청 완료
    else if (sNum === 4 && ep.episodeInSeason <= 38) {
      Storage.setEpisodeData(ep.id, { watched: true });
    }
  });

  localStorage.setItem(MIGRATION_KEY, '1');
  console.log('[마이그레이션] 시즌1~3 전체 + 시즌4 38화까지 시청 완료 처리됨');
}

// ── 시즌 선택기 초기화 ─────────────────────────
function initSeasonSelector() {
  renderSeasonSelector(allSeasons, currentSeasonFilter, function(seasonNum) {
    currentSeasonFilter = seasonNum;

    // 시즌 변경 시 스크롤 맨 위로
    window.scrollTo({ top: 0, behavior: 'instant' });

    // 시즌 선택 시 현재 시즌 안내 업데이트
    var seasonInfoEl = document.getElementById('current-season-info');
    if (seasonInfoEl) {
      if (seasonNum === null) {
        seasonInfoEl.textContent = '전체 에피소드';
      } else {
        var season = allSeasons.find(function(s) { return s.seasonId === seasonNum; });
        seasonInfoEl.textContent = season ? season.seasonName : ('시즌 ' + seasonNum);
      }
    }

    renderList();

    // 시즌 버튼 업데이트
    document.querySelectorAll('.season-btn').forEach(function(btn) {
      var bNum = btn.dataset.season === 'all' ? null : btn.dataset.season;
      btn.classList.toggle('active', bNum === seasonNum);
    });
  });
}

// ── 로딩 화면 ──────────────────────────────────
function showLoading(visible) {
  var el = document.getElementById('loading-screen');
  if (el) el.style.display = visible ? 'flex' : 'none';
}

// ── 에피소드 데이터 로드 ───────────────────────
async function loadEpisodes() {
  showLoading(true);

  try {
    var data = await loadKoreanEpisodes();
    allEpisodes = data.episodes;
    allSeasons = data.seasons;
  } catch (err) {
    console.error('에피소드 로드 실패:', err);
    var el = document.getElementById('loading-text');
    if (el) el.textContent = '❌ 데이터 로드 실패. 인터넷 연결을 확인해주세요.';
    showLoading(false);
    return;
  }

  showLoading(false);
}

// ── 초기화 ─────────────────────────────────────
async function init() {
  // PWA Service Worker 등록
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(console.warn);
  }

  await loadEpisodes();

  if (allEpisodes.length === 0) return;

  // 태그 마이그레이션
  const allowedTags = ["검은조직", "괴도키드", "어린이 탐정단", "쿠도 신이치", "핫토리 헤이지", "아카이 슈이치"];
  allEpisodes.forEach(function(ep) {
      var d = Storage.getEpisodeData(ep.id);
      if (d.tags && d.tags.length > 0) {
          var filtered = d.tags.filter(function(t) { return allowedTags.includes(t); });
          if (filtered.length !== d.tags.length) {
              Storage.setEpisodeData(ep.id, { tags: filtered });
          }
      }
  });

  // 시청 기록 마이그레이션 (최초 1회)
  runWatchedMigration();

  // 진행률 업데이트
  updateProgressUI(allEpisodes);

  // 시즌 선택기 초기화
  initSeasonSelector();

  // 첫 렌더
  renderList();

  // 태그 필터 초기화
  refreshTagFilters();

  // ── 이벤트 리스너 ──

  // 상태 필터 탭
  document.querySelectorAll('.filter-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.filter-btn').forEach(function(b) {
        b.classList.remove('active');
      });
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      renderList();
    });
  });

  // 검색창
  var searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.addEventListener('input', function(e) {
      searchQuery = e.target.value.trim();
      renderList();
    });
  }

  // 모달 닫기
  var modalOverlay = document.getElementById('modal-overlay');
  if (modalOverlay) {
    modalOverlay.addEventListener('click', function(e) {
      if (e.target === modalOverlay) closeModal();
    });
  }

  var modalCloseBtn = document.getElementById('modal-close-btn');
  if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeModal);

  // 맨 위로 버튼
  var scrollBtn = document.getElementById('scroll-top-btn');
  if (scrollBtn) {
    window.addEventListener('scroll', function() {
      scrollBtn.classList.toggle('visible', window.scrollY > 400);
    });
    scrollBtn.addEventListener('click', function() {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
}

// 시작
init();
