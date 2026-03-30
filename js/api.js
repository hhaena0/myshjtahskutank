/**
 * api.js
 * 로컬 JSON 데이터 로드 (나무위키 파싱 데이터)
 */

// 에피소드 데이터 로드
export async function loadKoreanEpisodes() {
  try {
    const response = await fetch('./data/korean_episodes.json');
    if (!response.ok) throw new Error('데이터 파일 로드 실패');
    const data = await response.json();
    
    // 앱에서 사용할 형식으로 변환
    // 앱에서 사용할 형식으로 변환
    const episodes = [];
    for (var i = 0; i < data.seasons.length; i++) {
      var season = data.seasons[i];
      for (var j = 0; j < season.episodes.length; j++) {
        var ep = season.episodes[j];
        episodes.push({
          id: season.seasonId + '_e' + ep.japan_id,
          seasonId: season.seasonId,             // S1, 2021, x-투니버스-1
          seasonName: season.seasonName,
          seasonNumber: season.seasonNumber,
          isXFile: season.isXFile,
          isOriginal: ep.isOriginal,
          episodeInSeason: ep.episodeInSeason,
          originalIdString: ep.originalIdString, // 2025-25 등
          japan_id: ep.japan_id,
          title: ep.title,
          num: ep.japan_id,                      // 전체에서의 번호 기준 (일본판)
        });
      }
    }
    
    return { episodes, seasons: data.seasons, totalEpisodes: data.totalEpisodes };
  } catch (err) {
    console.error('에피소드 데이터 로드 오류:', err);
    throw err;
  }
}
