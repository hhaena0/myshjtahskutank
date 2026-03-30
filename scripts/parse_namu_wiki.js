/**
 * 나무위키 파서 v5 - 라인 번호 기반 + 패턴 개선
 * 
 * 구조:
 * - 199번 줄부터 1기 에피소드 시작  
 * - "N기(YYYY년" 패턴: 2~5기
 * - "시즌 N(YYYY년" 패턴: 6~26기
 * - 3.2.26 서브섹션: X파일 관련 추가 내용
 * - 3.3.x: 미공개 X파일 시즌들
 */

const fs = require('fs');
const path = require('path');

const WIKI_CONTENT_PATH = 'C:\\Users\\nick\\.gemini\\antigravity\\brain\\78d486ce-2c51-4b5f-a8d9-8b4da9c52155\\.system_generated\\steps\\100\\content.md';

function parseWikiData(content) {
  const lines = content.split('\n');
  const seasons = [];
  let currentSeason = null;
  let seenTitles = new Set();
  
  // 파일에서 url-encoded 한글이 포함된 나무위키 링크에서 에피소드 제목 추출
  // 형식: [제목](https://namu.wiki/w/encoded_url)
  const isNamuEpisodeLink = (line) => {
    if (!line.startsWith('[')) return null;
    if (!line.includes('](https://namu.wiki/w/')) return null;
    if (line.includes('namu.wiki/edit/')) return null;
    if (line.includes('namu.wiki/history/')) return null;
    const match = line.match(/^\[([^\]]+)\]\(https:\/\/namu\.wiki\/w\//);
    return match ? match[1] : null;
  };

  const NON_EPISODE_TITLES = new Set([
    '투니버스', 'TVING', 'OTT', 'CJ ENM', '안기준', '본명', '한인숙', '고뭉치', '브라운 박사',
    '여사님', '추석', '삼일절', '에스에스애니멘트', '명탐정 코난 VS 괴도 키드',
    '타 채널에서의 꼼수편성', '디지털 리마스터 관계', '명탐정 코난 극장판',
    '9월 13일', '10월 2일', '12월 3일', '12월 25일', '1월 1일', '한국어', '더빙',
    '영어권 코난 위키', 'ytv 공식 시이트', '교체됐다.',
  ]);

  const isValidTitle = (title) => {
    if (!title || title.length < 2) return false;
    if (NON_EPISODE_TITLES.has(title)) return false;
    if (/^\d+(\.\d+)*\.?$/.test(title)) return false;
    if (/^\d+$/.test(title)) return false;
    if (/^\[\d+\]$/.test(title)) return false;
    if (/^\d+\.\d+$/.test(title)) return false;
    const skipWords = ['편집', 'X파일', '총집편', 'HD', '투니버스', '제목더빙', '자막방영',
      '제목더빙&투니버스', '투니버스&제목더빙'];
    if (skipWords.includes(title)) return false;
    return true;
  };

  // 시즌 헤더 패턴 분석
  // 헤더 라인들은 "section=N)" 이 들어있는 긴 줄
  // 그 줄에서 기수/시즌 정보를 추출
  const getSeasonFromHeader = (line) => {
    // 미공개 X파일 패턴들
    if (line.includes('X파일') || line.includes('미공개')) {
      const xMatch = line.match(/X파일\s+시즌\s+(\d+)/i) ||
                     line.match(/미공개\s+사건\s+시즌\s+(\d+)/i) ||
                     line.match(/미공개\s+X파일\s+시즌\s+(\d+)/i);
      if (xMatch) return { number: 100 + parseInt(xMatch[1]), isXFile: true };
      // 일반 "X파일" 섹션 참조만 있는 경우 스킵
      return null;
    }
    
    // "N기(YYYY년" 패턴 (2~5기)
    const kisuuMatch = line.match(/(\d+)기\s*\((\d{4})년/);
    if (kisuuMatch) {
      return { number: parseInt(kisuuMatch[1]), isXFile: false };
    }
    
    // "시즌 N(YYYY년" 패턴 (6기~)
    const seasonMatch = line.match(/시즌\s+(\d+)\s*\((\d{4})년/);
    if (seasonMatch) {
      return { number: parseInt(seasonMatch[1]), isXFile: false };
    }
    
    return null;
  };

  let lineNum = 0;
  let season1Started = false;

  for (let i = 0; i < lines.length; i++) {
    lineNum = i + 1;
    const line = lines[i].trim();
    if (!line) continue;

    // 각주 섹션 감지 (파싱 종료)
    if (line.match(/\[\[투니\d+화\]\]\(https%3A%2F%2F/) ||
        line.match(/\[\[투니\d+화\]\]\(https:\/\/.*rfn-/)) {
      console.log('각주 섹션 감지 (라인 ' + lineNum + '), 파싱 종료');
      break;
    }

    // 섹션 헤더 라인 감지
    if (line.includes('section=') && line.includes('편집')) {
      // 1기 시작: section=4 (3.1 섹션 = KBS/투니버스 1기)
      if (line.includes('section=4)') && !season1Started) {
        if (currentSeason) seasons.push(currentSeason);
        currentSeason = { seasonNumber: 1, seasonName: '시즌 1', isXFile: false, episodes: [] };
        seenTitles = new Set();
        season1Started = true;
        console.log('[라인 ' + lineNum + '] 시즌 1 시작');
        continue;
      }

      // X파일/미공개 시즌 패턴
      const xfileMatch =
        line.match(/X파일\s+시즌\s+(\d+)\((\d{4})년/i) ||
        line.match(/미공개\s+사건\s+시즌\s+(\d+)\((\d{4})년/i) ||
        line.match(/미공개\s+X파일\s+시즌\s+(\d+)\((\d{4})년/i);

      if (xfileMatch) {
        const xNum = parseInt(xfileMatch[1]);
        if (currentSeason) seasons.push(currentSeason);
        currentSeason = {
          seasonNumber: 100 + xNum,
          seasonName: '미공개 X파일 ' + xNum,
          isXFile: true,
          episodes: []
        };
        seenTitles = new Set();
        continue;
      }

      // 3.2.26 서브섹션 패턴: "3.2.26.N." - 이 섹션들도 X파일 관련 (자막판 방영분)
      // section=38 ~ section=41 해당
      const sub26Match = line.match(/3\.2\.26\.(\d+)\..*section/);
      if (sub26Match) {
        const subNum = parseInt(sub26Match[1]);
        if (currentSeason) seasons.push(currentSeason);
        currentSeason = {
          seasonNumber: 200 + subNum,
          seasonName: '자막판 시즌 ' + subNum,
          isXFile: false,
          isSubtitle: true,
          episodes: []
        };
        seenTitles = new Set();
        continue;
      }

      // 3.3.1 ~ 3.3.N 서브섹션 = 미공개 X파일 추가 방영분
      const sub33Match = line.match(/3\.3\.(\d+)\..*section/);
      if (sub33Match) {
        const subNum = parseInt(sub33Match[1]);
        if (currentSeason) seasons.push(currentSeason);
        currentSeason = {
          seasonNumber: 300 + subNum,
          seasonName: '미공개 X파일 추가 ' + subNum,
          isXFile: true,
          episodes: []
        };
        seenTitles = new Set();
        continue;
      }

      // 정규 기수 패턴 (2기~5기): "N기(YYYY년"
      const kisuuMatch = line.match(/(\d+)기\((\d{4})년/);
      if (kisuuMatch && !line.includes('X파일') && !line.includes('미공개')) {
        const kisuu = parseInt(kisuuMatch[1]);
        if (currentSeason) seasons.push(currentSeason);
        currentSeason = {
          seasonNumber: kisuu,
          seasonName: '시즌 ' + kisuu,
          isXFile: false,
          episodes: []
        };
        seenTitles = new Set();
        continue;
      }

      // 시즌 번호 패턴 (6기~): "시즌 N(YYYY년"
      const seasonNumMatch = line.match(/시즌\s+(\d+)\((\d{4})년/);
      if (seasonNumMatch && !xfileMatch) {
        const sNum = parseInt(seasonNumMatch[1]);
        if (currentSeason) seasons.push(currentSeason);
        currentSeason = {
          seasonNumber: sNum,
          seasonName: '시즌 ' + sNum,
          isXFile: false,
          episodes: []
        };
        seenTitles = new Set();
        continue;
      }
    }

    // 에피소드 추출
    if (!currentSeason) continue;

    const title = isNamuEpisodeLink(line);
    if (!title) continue;
    if (!isValidTitle(title)) continue;
    if (seenTitles.has(title)) continue;
    seenTitles.add(title);

    currentSeason.episodes.push({
      episodeInSeason: currentSeason.episodes.length + 1,
      title,
      globalNumber: 0
    });
  }

  if (currentSeason && currentSeason.episodes.length > 0) {
    seasons.push(currentSeason);
  }

  // globalNumber 재계산
  let globalNum = 1;
  for (const season of seasons) {
    for (const ep of season.episodes) {
      ep.globalNumber = globalNum++;
    }
  }

  return { seasons, totalEpisodes: globalNum - 1, generatedAt: new Date().toISOString() };
}

console.log('namuWiki 파서 v5 시작...');
try {
  const content = fs.readFileSync(WIKI_CONTENT_PATH, 'utf-8');
  const data = parseWikiData(content);

  console.log(`\n✅ 파싱 결과:`);
  console.log(`   총 시즌: ${data.seasons.length}`);
  console.log(`   총 에피소드: ${data.totalEpisodes}`);

  data.seasons.forEach(s => {
    const mark = s.isXFile ? 'X' : '-';
    const first = s.episodes.length > 0 ? s.episodes[0].title : '(없음)';
    const last = s.episodes.length > 0 ? s.episodes[s.episodes.length-1].title : '(없음)';
    console.log(`  ${mark} ${s.seasonName}: ${s.episodes.length}화 | 첫="${first}" | 마지막="${last}"`);
  });

  const dataDir = path.join(__dirname, '..', 'data');
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  const outputPath = path.join(dataDir, 'korean_episodes.json');
  fs.writeFileSync(outputPath, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`\n💾 저장: ${outputPath}`);
} catch (err) {
  console.error('오류:', err.message, err.stack);
}
