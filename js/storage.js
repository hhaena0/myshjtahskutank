/**
 * storage.js
 * LocalStorage 기반 데이터 관리
 */

const KEYS = {
  EPISODES_CACHE: 'conan_episodes_cache',
  EPISODES_CACHE_DATE: 'conan_episodes_cache_date',
  USER_DATA: 'conan_user_data',    // { [epId]: { watched, bookmarked, rating, memo, tags } }
  CUSTOM_TAGS: 'conan_custom_tags',
};

const Storage = {
  // ── 에피소드 캐시 ──────────────────────────
  getEpisodesCache() {
    try {
      const raw = localStorage.getItem(KEYS.EPISODES_CACHE);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  },

  setEpisodesCache(episodes) {
    localStorage.setItem(KEYS.EPISODES_CACHE, JSON.stringify(episodes));
    localStorage.setItem(KEYS.EPISODES_CACHE_DATE, Date.now().toString());
  },

  isCacheStale(days = 7) {
    const date = localStorage.getItem(KEYS.EPISODES_CACHE_DATE);
    if (!date) return true;
    return Date.now() - parseInt(date) > days * 86400000;
  },

  // ── 유저 데이터 ────────────────────────────
  getUserData() {
    try {
      const raw = localStorage.getItem(KEYS.USER_DATA);
      let data = raw ? JSON.parse(raw) : {};
      
      // '어린이 탐정단' -> '어린이탐정단' 마이그레이션
      let migrated = false;
      Object.keys(data).forEach(epId => {
        if (data[epId].tags && data[epId].tags.includes('어린이 탐정단')) {
          data[epId].tags = data[epId].tags.map(t => t === '어린이 탐정단' ? '어린이탐정단' : t);
          migrated = true;
        }
      });
      if (migrated) {
        localStorage.setItem(KEYS.USER_DATA, JSON.stringify(data));
      }

      return data;
    } catch { return {}; }
  },

  getEpisodeData(epId) {
    const all = this.getUserData();
    return all[epId] || { watched: false, bookmarked: false, rating: 0, memo: '', tags: [] };
  },

  setEpisodeData(epId, data) {
    const all = this.getUserData();
    all[epId] = { ...this.getEpisodeData(epId), ...data };
    localStorage.setItem(KEYS.USER_DATA, JSON.stringify(all));
  },

  toggleWatched(epId) {
    const d = this.getEpisodeData(epId);
    this.setEpisodeData(epId, { watched: !d.watched });
    return !d.watched;
  },

  toggleBookmark(epId) {
    const d = this.getEpisodeData(epId);
    this.setEpisodeData(epId, { bookmarked: !d.bookmarked });
    return !d.bookmarked;
  },

  addTag(epId, tag) {
    if (tag === '어린이 탐정단') tag = '어린이탐정단';
    const d = this.getEpisodeData(epId);
    if (!d.tags.includes(tag)) {
      this.setEpisodeData(epId, { tags: [...d.tags, tag] });
    }
    // 커스텀 태그 목록에도 추가
    this.addCustomTag(tag);
  },

  removeTag(epId, tag) {
    const d = this.getEpisodeData(epId);
    this.setEpisodeData(epId, { tags: d.tags.filter((t) => t !== tag) });
  },

  // ── 커스텀 태그 목록 ───────────────────────
  getCustomTags() {
    try {
      const raw = localStorage.getItem(KEYS.CUSTOM_TAGS);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  },

  addCustomTag(tag) {
    const tags = this.getCustomTags();
    if (!tags.includes(tag)) {
      localStorage.setItem(KEYS.CUSTOM_TAGS, JSON.stringify([...tags, tag]));
    }
  },

  // ── 통계 ───────────────────────────────────
  getStats(episodes) {
    const userData = this.getUserData();
    const watched = Object.values(userData).filter((d) => d.watched).length;
    const bookmarked = Object.values(userData).filter((d) => d.bookmarked).length;
    const total = episodes.length;
    const percent = total > 0 ? Math.round((watched / total) * 100) : 0;
    return { watched, bookmarked, total, percent };
  },

  // ── 모든 사용된 태그 ───────────────────────
  getAllUsedTags() {
    const userData = this.getUserData();
    const tagSet = new Set();
    Object.values(userData).forEach((d) => {
      (d.tags || []).forEach((t) => tagSet.add(t));
    });
    return [...tagSet];
  },
};

export default Storage;
