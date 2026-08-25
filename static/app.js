(() => {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const STORAGE_KEY = 'kkutu-static-v1';

  const WORDS = [
    '가방','가수','가족','가지','가게','가위','가을','가정','가치','각도','간식','갈비','감자','감정','강물','강아지','개나리','거울','거미','거리','건물','겨울','게임','결과','경기','계단','고기','고래','고양이','고추','공기','공원','공책','과자','과일','관계','광장','교실','구두','구름','구슬','국수','국어','군인','귀신','그림','기차','기억','기회','김밥','까치','꼬리','꽃잎','나라','나무','나비','낙엽','날개','냄비','냉면','노래','노을','노트','농구','눈물','다리','단어','달력','달빛','당근','대문','대화','도로','도서관','도시','도자기','독서','동물','동생','두부','드라마','라디오','마음','마을','마차','만두','모자','목걸이','무지개','문어','문장','문화','물고기','미소','바구니','바나나','바다','바람','바위','박물관','반지','발자국','방울','배추','버스','벚꽃','별빛','병원','보리','보석','봄날','부엌','불꽃','비누','비행기','사과','사람','사랑','사진','산책','상자','새벽','생각','서랍','선물','설탕','소나기','소리','소설','소풍','수박','수영','숟가락','시간','시계','시장','신문','신발','아기','아침','안경','야구','약속','양말','어깨','얼음','여름','여행','연필','열쇠','영화','오리','오징어','우산','우유','운동','원숭이','의자','이불','이야기','인형','자동차','자전거','장갑','저녁','전구','전화','점심','정원','종이','주머니','지갑','지구','지우개','창문','책상','초콜릿','친구','카메라','커피','컴퓨터','코끼리','쿠키','태양','토끼','토마토','파도','포도','풍선','피아노','학교','하늘','하루','햇빛','호수','호랑이','화분','휴지',
    '가로등','가로수','가족사진','간장게장','강의실','개구리','건전지','겨울잠','경찰관','고드름','고속도로','공중전화','과학자','교과서','구급차','기념일','기상청','김치찌개','나침반','낚시터','놀이공원','눈사람','다람쥐','단풍잎','대나무','도토리','등산로','마법사','마요네즈','모래성','목도리','물방울','미끄럼틀','바람개비','박하사탕','발걸음','보물상자','비둘기','사슴벌레','사탕수수','세탁기','손가락','수도꼭지','스케이트','신호등','아이스크림','안전벨트','여름방학','오토바이','운동화','유리창','자판기','장난감','전기자동차','종이비행기','지하철','참기름','체육관','칫솔','카네이션','콩나물','태권도','텔레비전','해바라기','호두과자','휴대전화',
    '개나리꽃','고슴도치','나무늘보','달맞이꽃','도깨비불','무궁화꽃','바닷가재','방울토마토','비빔국수','사과나무','소방차','아지랑이','어린이집','우체국','유치원','자장면','종달새','초등학교','카페라테','팽이버섯','해수욕장','호박고구마',
    '개미핥기','고추장','금요일','노란색','도서대출','라면국물','마지막','보라색','분홍색','사자자리','손목시계','수요일','여자친구','연두색','월요일','주말여행','초승달','토요일','파란색','화요일'
  ];

  const TYPING_WORDS = [
    '아름다운 우리말을 빠르게 입력하세요','오늘도 즐겁게 끄투 한 판','서버 없이 브라우저에서 바로 시작','끝말잇기는 어휘력과 순발력의 대결','GitHub Pages에서 실행되는 정적 게임','고양이가 창가에서 하품을 한다','무지개 너머로 파란 하늘이 보인다','따뜻한 커피와 재미있는 이야기','여름 바다에서 시원한 바람이 분다','친구와 함께 걷는 저녁 산책길','반짝이는 별빛 아래 조용한 마을','컴퓨터 앞에서 새로운 게임을 만든다','빠르고 정확하게 문장을 입력해 보세요','오늘의 최고 점수에 도전해 보세요','끝까지 집중하면 기록을 바꿀 수 있어요'
  ];

  const MODE_META = {
    classic: { label: 'CLASSIC', title: '한국어 끝말잇기' },
    three: { label: 'KUNGKUNGTA', title: '쿵쿵따' },
    reverse: { label: 'REVERSE', title: '앞말잇기' },
    typing: { label: 'TYPING', title: '타자 대결' }
  };

  const defaultStats = {
    bestScore: 0,
    bestStreak: 0,
    totalGames: 0,
    totalWords: 0,
    nickname: '플레이어',
    difficulty: 'normal',
    turnTime: 20,
    sound: true
  };

  let stats = loadStats();
  let selectedMode = 'classic';
  let game = null;
  let audioCtx = null;

  function loadStats() {
    try {
      return { ...defaultStats, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') };
    } catch (_) {
      return { ...defaultStats };
    }
  }

  function saveStats() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
    renderStats();
  }

  function renderStats() {
    $('bestScore').textContent = stats.bestScore.toLocaleString();
    $('bestStreak').textContent = stats.bestStreak.toLocaleString();
    $('totalGames').textContent = stats.totalGames.toLocaleString();
    $('totalWords').textContent = stats.totalWords.toLocaleString();
    $('soundBtn').textContent = stats.sound ? '🔊' : '🔇';
  }

  function hydrateSettings() {
    $('nickname').value = stats.nickname || '플레이어';
    $('difficulty').value = stats.difficulty || 'normal';
    $('turnTime').value = String(stats.turnTime || 20);
  }

  function persistSettings() {
    stats.nickname = ($('nickname').value.trim() || '플레이어').slice(0, 14);
    stats.difficulty = $('difficulty').value;
    stats.turnTime = Number($('turnTime').value);
    saveStats();
  }

  function beep(kind = 'ok') {
    if (!stats.sound) return;
    try {
      audioCtx ||= new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      const now = audioCtx.currentTime;
      const table = { ok: 620, bot: 390, bad: 180, start: 520, win: 760 };
      osc.frequency.setValueAtTime(table[kind] || 440, now);
      gain.gain.setValueAtTime(0.045, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc.connect(gain).connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.13);
    } catch (_) {}
  }

  function switchView(name) {
    $('homeView').classList.toggle('active', name === 'home');
    $('gameView').classList.toggle('active', name === 'game');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function clearGameAsync() {
    if (!game) return;
    cancelAnimationFrame(game.rafId);
    clearTimeout(game.botTimer);
    game.rafId = null;
    game.botTimer = null;
  }

  function startGame() {
    persistSettings();
    clearGameAsync();
    const turnTime = Number($('turnTime').value) * 1000;
    game = {
      mode: selectedMode,
      score: 0,
      streak: 0,
      maxStreak: 0,
      round: 1,
      used: new Set(),
      history: [],
      required: '',
      turn: 'player',
      over: false,
      turnTime,
      timerStarted: 0,
      rafId: null,
      botTimer: null,
      typingPrompt: ''
    };

    const meta = MODE_META[selectedMode];
    $('gameModeLabel').textContent = meta.label;
    $('gameModeTitle').textContent = meta.title;
    $('resultModal').classList.add('hidden');
    $('feedback').className = 'feedback';
    $('feedback').textContent = selectedMode === 'typing' ? '제시된 문장을 그대로 입력하세요.' : '첫 단어는 자유롭게 입력할 수 있습니다.';
    $('wordHistory').innerHTML = '';
    $('wordCount').textContent = '0';
    $('requiredWrap').classList.toggle('hidden', selectedMode === 'typing');
    $('typingPrompt').classList.toggle('hidden', selectedMode !== 'typing');
    $('wordInput').placeholder = selectedMode === 'typing' ? '제시 문장을 입력하세요' : '단어를 입력하세요';
    switchView('game');
    updateScoreboard();
    beep('start');

    if (selectedMode === 'typing') startTypingRound();
    else startPlayerTurn();
  }

  function startPlayerTurn() {
    if (!game || game.over) return;
    game.turn = 'player';
    $('turnOwner').textContent = '내 차례';
    $('turnOwner').classList.remove('bot');
    $('wordInput').disabled = false;
    $('wordForm').querySelector('button').disabled = false;
    $('requiredChar').textContent = game.required || '자유';
    $('wordInput').value = '';
    $('wordInput').focus({ preventScroll: true });
    startTimer();
  }

  function startTypingRound() {
    if (!game || game.over) return;
    game.turn = 'player';
    const candidates = TYPING_WORDS.filter((word) => !game.used.has(word));
    if (!candidates.length) {
      game.used.clear();
    }
    const pool = TYPING_WORDS.filter((word) => !game.used.has(word));
    game.typingPrompt = pool[Math.floor(Math.random() * pool.length)];
    game.used.add(game.typingPrompt);
    $('typingPrompt').textContent = game.typingPrompt;
    $('turnOwner').textContent = '입력 차례';
    $('turnOwner').classList.remove('bot');
    $('wordInput').disabled = false;
    $('wordForm').querySelector('button').disabled = false;
    $('wordInput').value = '';
    $('wordInput').focus({ preventScroll: true });
    startTimer();
  }

  function startTimer() {
    cancelAnimationFrame(game.rafId);
    game.timerStarted = performance.now();
    const tick = (now) => {
      if (!game || game.over || game.turn !== 'player') return;
      const elapsed = now - game.timerStarted;
      const remain = Math.max(0, game.turnTime - elapsed);
      const ratio = remain / game.turnTime;
      $('timerBar').style.width = `${ratio * 100}%`;
      $('timerBar').classList.toggle('warn', ratio <= .4 && ratio > .2);
      $('timerBar').classList.toggle('danger', ratio <= .2);
      $('timerText').textContent = `${(remain / 1000).toFixed(1)}초`;
      if (remain <= 0) {
        endGame(false, '제한시간을 초과했습니다.');
        return;
      }
      game.rafId = requestAnimationFrame(tick);
    };
    game.rafId = requestAnimationFrame(tick);
  }

  function elapsedRatio() {
    return Math.min(1, (performance.now() - game.timerStarted) / game.turnTime);
  }

  function normalizeWord(value) {
    return value.trim().replace(/\s+/g, '');
  }

  function isHangulWord(word) {
    return /^[가-힣]{2,10}$/.test(word);
  }

  function checkChain(word) {
    if (!game.required) return true;
    if (game.mode === 'reverse') return word.at(-1) === game.required;
    return word[0] === game.required;
  }

  function nextRequired(word) {
    return game.mode === 'reverse' ? word[0] : word.at(-1);
  }

  function validatePlayerWord(word) {
    if (!isHangulWord(word)) return '한글 2~10글자 단어를 입력하세요.';
    if (game.mode === 'three' && word.length !== 3) return '쿵쿵따에서는 정확히 3글자 단어만 사용할 수 있습니다.';
    if (game.used.has(word)) return '이미 사용한 단어입니다.';
    if (!checkChain(word)) {
      return game.mode === 'reverse'
        ? `단어의 마지막 글자가 “${game.required}”이어야 합니다.`
        : `“${game.required}”으로 시작하는 단어가 필요합니다.`;
    }
    return '';
  }

  function submitWord(event) {
    event.preventDefault();
    if (!game || game.over || game.turn !== 'player') return;
    const word = normalizeWord($('wordInput').value);
    if (!word) return;

    if (game.mode === 'typing') {
      if (word !== game.typingPrompt.replace(/\s+/g, '')) {
        setFeedback('제시 문장과 다릅니다. 띄어쓰기는 무시되지만 글자는 정확해야 합니다.', false);
        beep('bad');
        return;
      }
      cancelAnimationFrame(game.rafId);
      const bonus = Math.max(0, Math.round((1 - elapsedRatio()) * 400));
      game.score += 150 + bonus;
      game.streak += 1;
      game.maxStreak = Math.max(game.maxStreak, game.streak);
      game.history.push({ word: game.typingPrompt, who: stats.nickname });
      game.round += 1;
      appendHistory(game.typingPrompt, stats.nickname, false);
      setFeedback(`정확합니다! +${150 + bonus}점`, true);
      beep('ok');
      updateScoreboard();
      setTimeout(() => startTypingRound(), 280);
      return;
    }

    const error = validatePlayerWord(word);
    if (error) {
      setFeedback(error, false);
      beep('bad');
      return;
    }

    cancelAnimationFrame(game.rafId);
    game.used.add(word);
    game.history.push({ word, who: stats.nickname });
    appendHistory(word, stats.nickname, false);
    const timeBonus = Math.max(0, Math.round((1 - elapsedRatio()) * 180));
    const earned = 80 + word.length * 25 + timeBonus + game.streak * 5;
    game.score += earned;
    game.streak += 1;
    game.maxStreak = Math.max(game.maxStreak, game.streak);
    game.required = nextRequired(word);
    setFeedback(`${word} · +${earned}점`, true);
    beep('ok');
    updateScoreboard();
    startBotTurn();
  }

  function setFeedback(message, good) {
    $('feedback').textContent = message;
    $('feedback').className = `feedback ${good ? 'good' : 'bad'}`;
  }

  function startBotTurn() {
    game.turn = 'bot';
    $('turnOwner').textContent = '로봇이 생각 중…';
    $('turnOwner').classList.add('bot');
    $('wordInput').disabled = true;
    $('wordForm').querySelector('button').disabled = true;
    $('requiredChar').textContent = game.required;
    $('timerBar').style.width = '100%';
    $('timerBar').className = 'timer-bar';
    $('timerText').textContent = '로봇 차례';

    const difficulty = $('difficulty').value;
    const delay = difficulty === 'easy' ? rand(1200, 2300) : difficulty === 'hard' ? rand(360, 760) : rand(700, 1400);
    game.botTimer = setTimeout(() => {
      if (!game || game.over) return;
      const word = chooseBotWord(difficulty);
      if (!word) {
        endGame(true, `로봇이 “${game.required}”에 이어지는 단어를 찾지 못했습니다.`);
        return;
      }
      game.used.add(word);
      game.history.push({ word, who: '로봇' });
      appendHistory(word, '로봇', true);
      game.required = nextRequired(word);
      game.round += 1;
      $('requiredChar').textContent = game.required;
      setFeedback(`로봇: ${word}`, true);
      beep('bot');
      updateScoreboard();
      setTimeout(() => startPlayerTurn(), 360);
    }, delay);
  }

  function chooseBotWord(difficulty) {
    let candidates = WORDS.filter((word) => {
      if (game.used.has(word)) return false;
      if (game.mode === 'three' && word.length !== 3) return false;
      if (game.mode === 'reverse') return word.at(-1) === game.required;
      return word[0] === game.required;
    });
    if (!candidates.length) return null;

    if (difficulty === 'easy') {
      if (Math.random() < .12 && candidates.length > 2) return null;
      return candidates[Math.floor(Math.random() * candidates.length)];
    }
    if (difficulty === 'normal') {
      candidates.sort((a, b) => b.length - a.length || Math.random() - .5);
      return candidates[Math.floor(Math.random() * Math.min(5, candidates.length))];
    }

    candidates = candidates.map((word) => ({ word, replies: countReplies(word) }));
    candidates.sort((a, b) => a.replies - b.replies || b.word.length - a.word.length);
    return candidates[0].word;
  }

  function countReplies(word) {
    const required = game.mode === 'reverse' ? word[0] : word.at(-1);
    return WORDS.reduce((count, candidate) => {
      if (game.used.has(candidate) || candidate === word) return count;
      if (game.mode === 'three' && candidate.length !== 3) return count;
      const match = game.mode === 'reverse' ? candidate.at(-1) === required : candidate[0] === required;
      return count + (match ? 1 : 0);
    }, 0);
  }

  function appendHistory(word, who, bot) {
    const li = document.createElement('li');
    if (bot) li.classList.add('bot');
    const n = document.createElement('span');
    n.className = 'num';
    n.textContent = String(game.history.length).padStart(2, '0');
    const w = document.createElement('span');
    w.className = 'word';
    w.textContent = word;
    const p = document.createElement('span');
    p.className = 'who';
    p.textContent = who;
    li.append(n, w, p);
    $('wordHistory').prepend(li);
    $('wordCount').textContent = game.history.length;
  }

  function updateScoreboard() {
    if (!game) return;
    $('scoreValue').textContent = game.score.toLocaleString();
    $('streakValue').textContent = game.streak.toLocaleString();
    $('roundValue').textContent = game.round.toLocaleString();
  }

  function endGame(win, reason) {
    if (!game || game.over) return;
    game.over = true;
    clearGameAsync();
    $('wordInput').disabled = true;
    $('wordForm').querySelector('button').disabled = true;
    $('timerBar').style.width = '0%';
    $('timerText').textContent = '종료';

    stats.totalGames += 1;
    stats.totalWords += game.history.filter((item) => item.who !== '로봇').length;
    stats.bestScore = Math.max(stats.bestScore, game.score);
    stats.bestStreak = Math.max(stats.bestStreak, game.maxStreak);
    saveStats();

    $('resultBadge').textContent = win ? 'YOU WIN' : 'GAME OVER';
    $('resultTitle').textContent = win ? '승리!' : '게임 종료';
    $('resultReason').textContent = reason;
    $('resultScore').textContent = game.score.toLocaleString();
    $('resultStreak').textContent = game.maxStreak.toLocaleString();
    $('resultWords').textContent = game.history.length.toLocaleString();
    $('resultModal').classList.remove('hidden');
    beep(win ? 'win' : 'bad');
  }

  function exitGame() {
    clearGameAsync();
    if (game) game.over = true;
    $('resultModal').classList.add('hidden');
    switchView('home');
    renderStats();
  }

  function rand(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  $('modeCards').addEventListener('click', (event) => {
    const card = event.target.closest('.mode-card');
    if (!card) return;
    selectedMode = card.dataset.mode;
    document.querySelectorAll('.mode-card').forEach((el) => el.classList.toggle('selected', el === card));
  });

  $('startBtn').addEventListener('click', startGame);
  $('restartBtn').addEventListener('click', startGame);
  $('exitBtn').addEventListener('click', exitGame);
  $('wordForm').addEventListener('submit', submitWord);
  $('resultRetryBtn').addEventListener('click', startGame);
  $('resultHomeBtn').addEventListener('click', exitGame);
  $('soundBtn').addEventListener('click', () => {
    stats.sound = !stats.sound;
    saveStats();
    if (stats.sound) beep('start');
  });
  $('resetBtn').addEventListener('click', () => {
    if (!confirm('이 브라우저에 저장된 KKuTu 기록과 설정을 모두 초기화할까요?')) return;
    stats = { ...defaultStats };
    saveStats();
    hydrateSettings();
  });
  $('nickname').addEventListener('change', persistSettings);
  $('difficulty').addEventListener('change', persistSettings);
  $('turnTime').addEventListener('change', persistSettings);

  window.addEventListener('beforeunload', clearGameAsync);

  hydrateSettings();
  renderStats();
})();
