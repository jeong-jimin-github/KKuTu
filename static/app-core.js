(() => {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));
  const STORAGE_KEY = 'kkutu-static-original-ui-v2';

  const FALLBACK_WORDS = [
    '가게','가방','가수','가족','가지','가위','가을','가정','가치','간식','갈비','감자','감정','강물','강아지','개나리','개구리','거울','거미','거리','건물','건전지','겨울','겨울잠','게임','결과','경기','경찰관','계단','고기','고래','고양이','고추','고드름','고속도로','공기','공원','공책','공중전화','과자','과일','과학자','관계','광장','교실','교과서','구두','구름','구슬','구급차','국수','국어','군인','귀신','그림','기차','기억','기회','기념일','김밥','김치찌개',
    '까치','꼬리','꽃잎','나라','나무','나비','나침반','낙엽','날개','냄비','냉면','노래','노을','노트','농구','놀이공원','눈물','눈사람','다리','다람쥐','단어','단풍잎','달력','달빛','당근','대나무','대문','대화','도로','도서관','도시','도자기','도토리','독서','동물','동생','두부','드라마','등산로','라디오','라면','마음','마을','마차','마법사','마요네즈','만두','모래성','모자','목걸이','목도리','무지개','문어','문장','문화','물고기','물방울','미소','미끄럼틀',
    '바구니','바나나','바다','바람','바람개비','바위','박물관','박하사탕','반지','발걸음','발자국','방울','배추','버스','벚꽃','별빛','병원','보리','보물상자','보석','봄날','부엌','불꽃','비누','비둘기','비빔국수','비행기','사과','사과나무','사람','사랑','사진','산책','상자','새벽','생각','서랍','선물','설탕','세탁기','소나기','소리','소방차','소설','소풍','손가락','수박','수도꼭지','수영','숟가락','시간','시계','시장','신문','신발','신호등',
    '아기','아이스크림','아침','안경','안전벨트','야구','약속','양말','어깨','얼음','여름','여름방학','여행','연필','열쇠','영화','오리','오징어','오토바이','우산','우유','운동','운동화','원숭이','유리창','의자','이불','이야기','인형','자동차','자전거','자판기','장갑','장난감','저녁','전구','전화','전기자동차','점심','정원','종이','종이비행기','주머니','지갑','지구','지우개','지하철','창문','책상','참기름','체육관','초콜릿','친구','칫솔','카메라','카네이션','커피','컴퓨터','코끼리','콩나물','쿠키','태권도','태양','텔레비전','토끼','토마토','파도','포도','풍선','피아노','학교','하늘','하루','해바라기','햇빛','호두과자','호수','호랑이','화분','휴대전화','휴지',
    '고슴도치','나무늘보','달맞이꽃','도깨비불','무궁화꽃','바닷가재','방울토마토','사슴벌레','사탕수수','소방서','아지랑이','어린이집','우체국','유치원','자장면','종달새','초등학교','팽이버섯','해수욕장','호박고구마',
    '고추장','금요일','노란색','마지막','보라색','분홍색','사자자리','손목시계','수요일','연두색','월요일','주말여행','초승달','토요일','파란색','화요일',
    '가로수','강냉이','기러기','기차역','기찻길','길거리','리본','리듬','리어카','마라톤','마이크','마지막','바가지','비디오','사이다','아파트','오디오','이발소','자두','카드','타이어','파리','하모니카'
  ];
  const STATIC_DB = window.KKUTU_STATIC_DB || null;
  const WORDS = STATIC_DB?.words ? STATIC_DB.words.split(String.fromCharCode(10)) : FALLBACK_WORDS;
  const WORD_META_DIGITS = STATIC_DB?.meta?.length === WORDS.length ? STATIC_DB.meta : '4'.repeat(WORDS.length);
  const WORD_META = new Map(), WORD_SET = new Set(), WORDS_BY_FIRST = new Map(), WORDS_BY_LAST = new Map();
  const FALLBACK_JA_WORDS = ['ねこ','ことば','ばしょ','よぞら','らっぱ','ぱんだ','だるま','まくら','らじお','おかし'];
  const JA_WORDS = STATIC_DB?.jaWords ? STATIC_DB.jaWords.split(String.fromCharCode(10)) : FALLBACK_JA_WORDS;
  const JA_READING_ROWS = STATIC_DB?.jaReadings ? STATIC_DB.jaReadings.split(String.fromCharCode(10)) : [];
  const JA_WORD_INDEX = new Map(), JA_WORDS_BY_FIRST = new Map(), JA_PLAYABLE_WORDS = [];
  const JA_SMALL={'ぁ':'あ','ぃ':'い','ぅ':'う','ぇ':'え','ぉ':'お','ゃ':'や','ゅ':'ゆ','ょ':'よ','ゎ':'わ','っ':'つ','ゕ':'か','ゖ':'け'};
  const JA_VOWEL={
    'あ':'あ','か':'あ','が':'あ','さ':'あ','ざ':'あ','た':'あ','だ':'あ','な':'あ','は':'あ','ば':'あ','ぱ':'あ','ま':'あ','や':'あ','ゃ':'あ','ら':'あ','わ':'あ','ゎ':'あ',
    'い':'い','き':'い','ぎ':'い','し':'い','じ':'い','ち':'い','ぢ':'い','に':'い','ひ':'い','び':'い','ぴ':'い','み':'い','り':'い','ゐ':'い',
    'う':'う','く':'う','ぐ':'う','す':'う','ず':'う','つ':'う','づ':'う','ぬ':'う','ふ':'う','ぶ':'う','ぷ':'う','む':'う','ゆ':'う','ゅ':'う','る':'う','ゔ':'う',
    'え':'え','け':'え','げ':'え','せ':'え','ぜ':'え','て':'え','で':'え','ね':'え','へ':'え','べ':'え','ぺ':'え','め':'え','れ':'え','ゑ':'え',
    'お':'お','こ':'お','ご':'お','そ':'お','ぞ':'お','と':'お','ど':'お','の':'お','ほ':'お','ぼ':'お','ぽ':'お','も':'お','よ':'お','ょ':'お','ろ':'お','を':'お','ん':'ん'};
  function addWordIndex(index,key,word){if(!key)return;const bucket=index.get(key);if(bucket)bucket.push(word);else index.set(key,[word]);}
  function toHiragana(text){return String(text||'').normalize('NFKC').replace(/[ァ-ヶ]/g,ch=>String.fromCharCode(ch.charCodeAt(0)-0x60));}
  function normalizeJaWord(text){return toHiragana(text).replace(/[ 　\t\r\n・･=＝\-‐‑‒–—―、。,.，．/／()（）［］\[\]{}｛｝<>＜＞「」『』【】"'＂＇]/g,'').replace(/[^ぁ-ゖ一-龯々〆〇ー]/g,'');}
  function getJaStart(text){const ch=normalizeJaWord(text).charAt(0);return JA_SMALL[ch]||ch;}
  function getJaChar(text){const word=normalizeJaWord(text);for(let i=word.length-1;i>=0;i--){const ch=word.charAt(i);if(ch==='ー')continue;if(word.charAt(i+1)==='ー')return JA_VOWEL[ch]||JA_SMALL[ch]||ch;return JA_SMALL[ch]||ch;}return '';}
  WORDS.forEach((word,i)=>{WORD_SET.add(word);WORD_META.set(word,Number(WORD_META_DIGITS[i]||0));addWordIndex(WORDS_BY_FIRST,word[0],word);addWordIndex(WORDS_BY_LAST,word.at(-1),word);});
  JA_WORDS.forEach((word,i)=>{const reading=normalizeJaWord(JA_READING_ROWS[i]||word);if(!word||reading.length<2)return;JA_WORD_INDEX.set(word,{word,reading});if(getJaChar(reading)!=='ん'){JA_PLAYABLE_WORDS.push(word);addWordIndex(JA_WORDS_BY_FIRST,getJaStart(reading),word);}});
  const TYPING = [
    '아름다운 우리말을 빠르게 입력하세요','오늘도 즐겁게 끄투 한 판','끝말잇기는 어휘력과 순발력의 대결','친구와 함께 걷는 저녁 산책길',
    '반짝이는 별빛 아래 조용한 마을','빠르고 정확하게 문장을 입력해 보세요','여름 바다에서 시원한 바람이 분다','컴퓨터 앞에서 새로운 게임을 만든다'
  ];
  const PROVERBS = [
    '가는 말이 고와야 오는 말이 곱다','고래 싸움에 새우 등 터진다','낮말은 새가 듣고 밤말은 쥐가 듣는다','등잔 밑이 어둡다',
    '백지장도 맞들면 낫다','세 살 버릇 여든까지 간다','원숭이도 나무에서 떨어진다','티끌 모아 태산'
  ];
  const MISSION_KO = ['가','나','다','라','마','바','사','아','자','차','카','타','파','하'];
  const MISSION_JA = ['あ','い','う','え','お','か','き','く','け','こ','さ','し','す','せ','そ','た','ち','つ','て','と','な','に','ぬ','ね','の','は','ひ','ふ','へ','ほ','ま','み','む','め','も','や','ゆ','よ','ら','り','る','れ','ろ','わ'];
  const MODE_OPTIONS = {
    classic:['manner','injeong','mission','loanword','strict'],
    three:['manner','injeong','mission','loanword','strict','sami'],
    reverse:['manner','injeong','mission','loanword','strict'],
    typing:['proverb'],
    japanese:['manner','injeong','mission']
  };
  const DEFAULT_ROOM_OPTIONS = {manner:false,injeong:false,mission:false,loanword:false,strict:false,sami:false,proverb:false};
  const MODES = {
    classic: { code: 'KSH', title: '한국어 끝말잇기', desc: '한국어 끝말잇기' },
    three: { code: 'KKT', title: '쿵쿵따', desc: '쿵쿵따 / 3글자' },
    reverse: { code: 'KAP', title: '앞말잇기', desc: '앞말잇기' },
    typing: { code: 'KTY', title: '타자 대결', desc: '타자 대결' },
    japanese: { code: 'JSH', title: '일본어 끝말잇기', desc: '일본어 끝말잇기' }
  };
  const defaultStore = { nickname:'플레이어', botLevel:2, muteBGM:false, muteEffect:false, bestScore:0, bestChain:0, totalGames:0, totalWords:0 };

  let store = loadStore();
  let view = 'lobby';
  let room = { id:1, title:'로컬 연습방', mode:'classic', rounds:5, roundTime:60, turnTime:15, options:{...DEFAULT_ROOM_OPTIONS} };
  let game = null;
  let audioUnlocked = false;
  const sounds = {}, activeSounds = {};
  let currentBGM = null;

  const SOUND_LIST = [
    ['k','k.mp3'],['lobby','LobbyBGM.mp3'],['jaqwi','JaqwiBGM.mp3'],['jaqwiF','JaqwiFastBGM.mp3'],
    ['game_start','game_start.mp3'],['round_start','round_start.mp3'],['fail','fail.mp3'],['timeout','timeout.mp3'],
    ['lvup','lvup.mp3'],['Al','Al.mp3'],['success','success.mp3'],['missing','missing.mp3'],['mission','mission.mp3'],['kung','kung.mp3'],['horr','horr.mp3']
  ];
  for (let i=0;i<=10;i++) SOUND_LIST.push([`T${i}`,`T${i}.mp3`],[`K${i}`,`K${i}.mp3`],[`As${i}`,`As${i}.mp3`]);

  function loadStore(){ try{return {...defaultStore,...JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}')}}catch(_){return {...defaultStore}} }
  function saveStore(){ localStorage.setItem(STORAGE_KEY,JSON.stringify(store)); updateMe(); }
  function loadSounds(){ SOUND_LIST.forEach(([key,file])=>{ const a=new Audio(`./media/kkutu/${file}`); a.preload='auto'; sounds[key]=a; }); }
  function playSound(key,bgm=false){
    const base=sounds[key]||sounds.missing; if(!base)return null;
    try{ const a=base.cloneNode(true); a.loop=!!bgm; a.volume=(bgm?store.muteBGM:store.muteEffect)?0:1; activeSounds[key]?.pause?.(); activeSounds[key]=a; const p=a.play(); p?.catch?.(()=>{}); return a; }catch(_){return null;}
  }
  function stopSound(key){ const a=activeSounds[key]; if(!a)return; try{a.pause();a.currentTime=0}catch(_){} delete activeSounds[key]; }
  function stopAllSounds(){ Object.keys(activeSounds).forEach(stopSound); currentBGM=null; }
  function playBGM(key){ if(currentBGM===key&&activeSounds[key]&&!activeSounds[key].paused)return; if(currentBGM)stopSound(currentBGM); currentBGM=key; playSound(key,true); }
  function refreshVolumes(){ Object.entries(activeSounds).forEach(([key,a])=>a.volume=((key===currentBGM)?store.muteBGM:store.muteEffect)?0:1); }
  function unlockAudio(){ if(audioUnlocked)return; audioUnlocked=true; if(view!=='game')playBGM('lobby'); }

  function escapeHTML(v){ return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function commify(n){ return Number(n||0).toLocaleString('ko-KR'); }
  function levelFromScore(s){ return Math.max(1,Math.min(360,Math.floor(Math.sqrt(Math.max(0,s)/320))+1)); }
  function scoreGoal(s){ const l=levelFromScore(s); return l*l*1000; }
  function setLevelSprite(el,score){ if(!el)return; const l=levelFromScore(score)-1; el.style.backgroundImage="url('./img/kkutu/lv/newlv.png')"; el.style.backgroundPosition=`${(l%25)*-100}% ${Math.floor(l/25)*-100}%`; el.style.backgroundSize='2560%'; }

  function setMenu(state){ const cls=state==='lobby'?'for-lobby':state==='room'?'for-master':'for-gaming'; $$('.kkutu-menu button').forEach(b=>b.classList.toggle('static-on',b.classList.contains(cls))); }
  function showView(next){
    view=next; $('LobbyView').classList.toggle('static-hidden',next!=='lobby'); $('RoomView').classList.toggle('static-hidden',next!=='room'); $('GameView').classList.toggle('static-hidden',next!=='game'); setMenu(next); closeDialogs();
    if(next==='lobby'){renderLobby();if(audioUnlocked)playBGM('lobby')} else if(next==='room'){renderRoom();if(audioUnlocked)playBGM('lobby')} else if(currentBGM){stopSound(currentBGM);currentBGM=null;}
  }

  function renderLobby(){
    $('UserList').innerHTML=`<div class="users-item"><div class="jt-image users-image" style="background-image:url('./img/kkutu/moremi/body.png')"></div><div class="users-level level-sprite"></div><div class="users-name ellipse">${escapeHTML(store.nickname)}</div></div><div class="users-item"><div class="jt-image users-image" style="background-image:url('./img/kkutu/robot.png')"></div><div class="users-level level-sprite"></div><div class="users-name ellipse">로컬 로봇</div></div>`;
    $$('#UserList .level-sprite').forEach((el,i)=>setLevelSprite(el,i?2800:store.bestScore));
    const p=[['classic','로컬 끝말잇기'],['three','로컬 쿵쿵따'],['reverse','로컬 앞말잇기'],['typing','로컬 타자 대결'],['japanese','로컬 일본어 끝말잇기']];
    $('RoomList').innerHTML=p.map(([m,t],i)=>roomCard(i+1,t,m)).join('');
    $$('#RoomList .rooms-item').forEach(el=>el.onclick=()=>{room={...room,id:+el.dataset.room,title:el.dataset.title,mode:el.dataset.mode};showView('room');notice(`${room.title}에 입장했습니다.`)}); updateMe();
  }
  function roomCard(id,title,mode){ return `<div class="rooms-item" data-room="${id}" data-title="${escapeHTML(title)}" data-mode="${mode}"><div class="rooms-channel channel-${((id-1)%4)+1}"></div><div class="rooms-number">${id}</div><div class="rooms-title ellipse">${escapeHTML(title)}</div><div class="rooms-limit">2 / 8</div><div class="rooms-info"><div class="rooms-mode">${MODES[mode].desc} / 로봇 연습</div><div class="rooms-round">라운드 ${room.rounds}</div><div class="rooms-time">${room.roundTime}초</div></div><div class="rooms-lock"><i class="fa fa-unlock"></i></div></div>`; }
  function renderRoomTitle(target){ target.innerHTML=`<h5 class="room-head-number">[${room.id}]</h5><h5 class="room-head-title">${escapeHTML(room.title)}</h5><h5 class="room-head-mode">${escapeHTML(MODES[room.mode].title)} / 로봇 연습</h5><h5 class="room-head-limit">2 / 8</h5><h5 class="room-head-round">라운드 ${room.rounds}</h5><h5 class="room-head-time">${room.roundTime}초</h5>`; }
  function renderRoom(){ renderRoomTitle($('RoomTitleBar')); $('RoomUsers').innerHTML=roomUser('me',store.nickname,false)+roomUser('bot',`Lv.${store.botLevel} 로봇`,true); $$('#RoomUsers .room-user-level').forEach((el,i)=>setLevelSprite(el,i?2800+store.botLevel*1800:store.bestScore)); }
  function roomUser(id,name,bot){ const body=bot?'./img/kkutu/moremi/robot.png':'./img/kkutu/moremi/body.png'; return `<div class="room-user" id="room-user-${id}"><div class="moremi room-user-image"><img class="moremies moremi-body" src="${body}" alt=""></div><div class="room-user-stat"><div class="room-user-ready room-user-readied">${id==='me'?'방장':'준비'}</div><div class="room-user-team team-0">개인</div></div><div class="room-user-title"><div class="room-user-level"></div><div class="room-user-name">${escapeHTML(name)}</div></div></div>`; }
  function updateMe(){ $('my-name').textContent=store.nickname; $('my-record').textContent=`최고 ${commify(store.bestScore)}점 / ${store.bestChain}연속`; const lv=levelFromScore(store.bestScore),goal=scoreGoal(store.bestScore); $('my-level').textContent=`LEVEL ${lv}`; $('my-gauge-text').textContent=`${commify(store.bestScore)} / ${commify(goal)}`; $('my-gauge-bar').style.width=`${Math.min(100,store.bestScore/goal*100)}%`; setLevelSprite(document.querySelector('.my-stat-level'),store.bestScore); }

  function showDialog(id){ closeDialogs(); const d=$(id); if(!d)return; d.style.display='block'; d.classList.add('dialog-front'); d.style.left=`${Math.max(5,(innerWidth-d.offsetWidth)/2)}px`; d.style.top=`${Math.max(45,(innerHeight-d.offsetHeight)/2)}px`; }
  function closeDialogs(){ $$('.dialog').forEach(d=>{d.style.display='none';d.classList.remove('dialog-front')}); }
  function addChat(boxId,name,text,noticeFlag=false){ const box=$(boxId); if(!box)return; const item=document.createElement('div'); item.className=`chat-item${noticeFlag?' chat-notice':''}`; item.innerHTML=`<div class="chat-head ellipse">${escapeHTML(name)}</div><div class="chat-body">${escapeHTML(text)}</div><div class="chat-stamp">${new Date().toLocaleTimeString('ko-KR')}</div>`; box.appendChild(item); while(box.children.length>100)box.firstElementChild.remove(); box.scrollTop=box.scrollHeight; playSound('k'); }
  function notice(text){ addChat(view==='lobby'?'Chat':view==='room'?'RoomChat':'GameChat','알림',text,true); }
  function bindChat(inputId,buttonId,boxId){ const send=()=>{const input=$(inputId),v=input.value.trim();if(!v)return;addChat(boxId,store.nickname,v);input.value='';}; $(buttonId).onclick=send; $(inputId).addEventListener('keydown',e=>{if(e.key==='Enter')send()}); }

  function clearGameTimers(){ if(!game)return; clearInterval(game.turnInterval);clearInterval(game.roundInterval);clearTimeout(game.botTimer);(game.fxTimers||[]).forEach(clearTimeout);game.turnInterval=game.roundInterval=game.botTimer=null;game.fxTimers=[];if(game.turnSound){try{game.turnSound.pause();game.turnSound.currentTime=0}catch(_){}game.turnSound=null;} }
  function startGame(){
    clearGameTimers(); game={mode:room.mode,score:{me:0,bot:0},used:new Set(),history:[],chain:0,bestChain:0,round:0,required:'',turn:'me',turnTime:room.turnTime*1000,roundTime:room.roundTime*1000,turnRemain:room.turnTime*1000,roundRemain:room.roundTime*1000,turnInterval:null,roundInterval:null,botTimer:null,fxTimers:[],turnSound:null,over:false,typingIndex:0,typingPrompt:'',wordLength:room.mode==='three'?3:0,mission:''};
    if(roomOptionOn('mission')) game.mission=randomMission();
    showView('game');renderRoomTitle($('GameTitleBar'));$('GameUsers').innerHTML=gameUser('me',store.nickname,false)+gameUser('bot',`Lv.${store.botLevel} 로봇`,true);$$('#GameUsers .game-user-level').forEach((el,i)=>setLevelSprite(el,i?2800+store.botLevel*1800:store.bestScore));updateScores();$('History').innerHTML='';$('Chain').textContent='0';updateMissionItem();playSound('game_start');notice(`${MODES[room.mode].title} 게임을 시작합니다.`);setTimeout(startRound,900);
  }
  function gameUser(id,name,bot){ const body=bot?'./img/kkutu/moremi/robot.png':'./img/kkutu/moremi/body.png'; return `<div class="game-user ${bot?'game-user-bot':''}" id="game-user-${id}"><div class="moremi game-user-image"><img class="moremies moremi-body" src="${body}" alt=""></div><div class="game-user-title"><div class="game-user-level"></div><div class="game-user-name ellipse">${escapeHTML(name)}</div></div><div class="game-user-score" id="game-score-${id}"></div></div>`; }
  function drawScore(el,score){ const v=score>99999?`${String(Math.round(score/1000)).padStart(4,'0')}k`:String(Math.max(0,Math.round(score))).padStart(5,'0'); el.innerHTML=Array.from(v).map(c=>`<div class="game-user-score-char">${c}</div>`).join(''); }
  function updateScores(){ drawScore($('game-score-me'),game?.score.me||0);drawScore($('game-score-bot'),game?.score.bot||0); }
  function drawRounds(){ $('Rounds').innerHTML=Array.from({length:room.rounds},(_,i)=>`<label class="${i+1===game.round?'rounds-current':''}">${i+1}</label>`).join(''); }
  function startRound(){ if(!game||game.over)return;game.round++;if(game.round>room.rounds)return finishGame('모든 라운드가 끝났습니다.');game.required='';game.chain=0;if(game.mode==='three')game.wordLength=3;if(roomOptionOn('mission'))game.mission=randomMission();$('Chain').textContent='0';drawRounds();updateMissionItem();game.roundStartedAt=performance.now();game.roundRemain=game.roundTime;playSound('round_start');$('GameDisplay').textContent=game.mode==='typing'?'타자 대결':'자유';startRoundTimer();game.mode==='typing'?startTypingTurn():startPlayerTurn(); }
  function startRoundTimer(){ clearInterval(game.roundInterval);game.roundInterval=setInterval(()=>{if(!game||game.over)return;game.roundRemain=Math.max(0,game.roundTime-(performance.now()-game.roundStartedAt));$('RoundBar').style.width=`${game.roundRemain/game.roundTime*100}%`;$('RoundBar').textContent=`${(game.roundRemain/1000).toFixed(1)}초`;$('RoundBar').parentElement.classList.toggle('round-extreme',game.roundRemain<=5000);if(game.roundRemain<=0){clearInterval(game.roundInterval);endRound('라운드 시간이 끝났습니다.')}},50); }
  function setCurrent(id){ $$('.game-user').forEach(el=>el.classList.remove('game-user-current'));$(`game-user-${id}`)?.classList.add('game-user-current'); }
  function stopTurnTimer(){ clearInterval(game.turnInterval);game.turnInterval=null;if(game.turnSound){try{game.turnSound.pause();game.turnSound.currentTime=0}catch(_){}game.turnSound=null;} }
  function startTurnTimer(id){ stopTurnTimer();game.turnStartedAt=performance.now();game.turnRemain=game.turnTime;const speed=Math.min(10,Math.max(0,2+store.botLevel));game.turnSound=playSound(`T${speed}`);game.turnInterval=setInterval(()=>{if(!game||game.over||game.turn!==id)return;game.turnRemain=Math.max(0,game.turnTime-(performance.now()-game.turnStartedAt));$('TurnBar').style.width=`${game.turnRemain/game.turnTime*100}%`;$('TurnBar').textContent=`${(game.turnRemain/1000).toFixed(1)}초`;if(game.turnRemain<=0){stopTurnTimer();bombUser(id);playSound('timeout');id==='me'?loseRound('제한시간을 초과했습니다.'):winRoundByBotFail();}},30); }
  function startPlayerTurn(){ if(!game||game.over)return;game.turn='me';setCurrent('me');$('GameInputWrap').classList.add('static-active');const input=$('game-input');input.readOnly=false;input.value='';input.placeholder='당신의 차례입니다. 단어를 입력하세요.';$('GameDisplay').textContent=game.required||'자유';input.focus({preventScroll:true});startTurnTimer('me'); }
  function startTypingTurn(){ if(!game||game.over)return;game.turn='me';setCurrent('me');$('GameInputWrap').classList.add('static-active');const input=$('game-input');input.readOnly=false;input.value='';const source=roomOptionOn('proverb')?PROVERBS:TYPING;game.typingPrompt=source[game.typingIndex++%source.length];$('GameDisplay').textContent=game.typingPrompt;input.placeholder='제시된 문장을 그대로 입력하세요.';input.focus({preventScroll:true});startTurnTimer('me'); }

  function roomOptionOn(key,mode=room.mode){ return Boolean(room.options?.[key]&&(MODE_OPTIONS[mode]||[]).includes(key)); }
  function randomMission(){ const list=game?.mode==='japanese'?MISSION_JA:MISSION_KO;return list[Math.floor(Math.random()*list.length)]; }
  function currentWordLength(){ return game?.mode==='three'?(roomOptionOn('sami')?game.wordLength:3):0; }
  function nextWordLength(){ const now=currentWordLength();return game?.mode==='three'&&roomOptionOn('sami')?(now===3?2:3):now; }
  function advanceWordLength(){ if(game?.mode==='three'&&roomOptionOn('sami'))game.wordLength=nextWordLength();updateMissionItem(); }
  function updateMissionItem(){ if(!game)return;const parts=[];if(game.mode==='three')parts.push(`${currentWordLength()}글자`);if(roomOptionOn('mission')&&game.mission)parts.push(`미션 ${game.mission}`);$('MissionItem').textContent=parts.join(' · '); }
  function isJapaneseMode(){ return (game?.mode||room.mode)==='japanese'; }
  function japaneseEntry(word){ return JA_WORD_INDEX.get(word); }
  function ruleText(word){ return isJapaneseMode()?(japaneseEntry(word)?.reading||normalizeJaWord(word)):word; }
  function wordAllowed(word,lengthOverride=0){
    if(isJapaneseMode()){ const entry=japaneseEntry(word);return !!entry&&entry.reading.length>=2&&getJaChar(entry.reading)!=='ん'; }
    const meta=WORD_META.get(word);if(meta===undefined)return false;if(!roomOptionOn('injeong')&&(meta&1))return false;if(roomOptionOn('loanword')&&(meta&2))return false;if(roomOptionOn('strict')&&!(meta&4))return false;const wanted=lengthOverride||currentWordLength();return !wanted||word.length===wanted;
  }
  function wordBucket(required=game?.required||''){ if(isJapaneseMode())return required?(JA_WORDS_BY_FIRST.get(required)||[]):JA_PLAYABLE_WORDS;if(!required)return WORDS;return (game?.mode==='reverse'?WORDS_BY_LAST:WORDS_BY_FIRST).get(required)||[]; }
  function continuationBucket(required){ return isJapaneseMode()?(JA_WORDS_BY_FIRST.get(required)||[]):((game.mode==='reverse'?WORDS_BY_LAST:WORDS_BY_FIRST).get(required)||[]); }
  function hasContinuation(word){ const required=nextRequired(word),wanted=nextWordLength(),bucket=continuationBucket(required);return bucket.some(w=>w!==word&&!game.used.has(w)&&wordAllowed(w,wanted)); }
  function missionBonus(word,base){ if(!roomOptionOn('mission')||!game.mission)return 0;const count=ruleText(word).split(game.mission).length-1;return count?Math.round(base*.5*count):0; }
  function scoreAcceptedWord(word){ const base=scoreWord(word),bonus=missionBonus(word,base);if(bonus){playSound('mission');game.mission=randomMission();}return base+bonus; }

  function handleGameInput(){
    if(!game||game.over||game.turn!=='me')return;const input=$('game-input'),raw=input.value.trim();if(!raw)return;
    if(game.mode==='typing'){if(raw!==game.typingPrompt){playSound('fail');flashFail('문장이 일치하지 않습니다.');return;}stopTurnTimer();const gain=Math.round(40+60*(game.turnRemain/game.turnTime));game.score.me+=gain;game.chain++;game.bestChain=Math.max(game.bestChain,game.chain);pushHistory(raw,'me');updateScores();playSound('mission');setTimeout(startTypingTurn,250);return;}
    const word=isJapaneseMode()?normalizeJaWord(raw):raw.replace(/\s+/g,''),error=validateWord(word);if(error){playSound('fail');flashFail(error);return;}stopTurnTimer();game.used.add(word);game.score.me+=scoreAcceptedWord(word);game.chain++;game.bestChain=Math.max(game.bestChain,game.chain);game.required=nextRequired(word);advanceWordLength();$('Chain').textContent=String(game.chain);pushDisplay(word,()=>{pushHistory(word,'me');updateScores();startBotTurn();});
  }
  function validateWord(word){
    if(isJapaneseMode()){
      const entry=japaneseEntry(word);if(!entry)return '원본 일본어(JMdict) 사전에 없는 단어입니다.';if(entry.reading.length<2)return '두 글자 이상의 일본어 어휘를 입력하세요.';if(game.used.has(word))return '이미 사용한 단어입니다.';if(getJaChar(entry.reading)==='ん')return 'ん으로 끝나는 단어는 사용할 수 없습니다.';if(game.required&&getJaStart(entry.reading)!==game.required)return `'${game.required}'로 시작하는 읽기의 단어를 입력하세요.`;if(roomOptionOn('manner')&&!hasContinuation(word))return '매너 규칙에서는 이어갈 수 없는 한방 단어를 사용할 수 없습니다.';return '';
    }
    if(word.length<2)return '두 글자 이상의 단어를 입력하세요.';const meta=WORD_META.get(word);if(meta===undefined)return '원본 KKuTu 사전에 없는 단어입니다.';if(game.used.has(word))return '이미 사용한 단어입니다.';if(game.required){if(game.mode==='reverse'&&word.at(-1)!==game.required)return `'${game.required}'(으)로 끝나는 단어를 입력하세요.`;if(game.mode!=='reverse'&&word[0]!==game.required)return `'${game.required}'(으)로 시작하는 단어를 입력하세요.`;}if(!roomOptionOn('injeong')&&(meta&1))return '어인정 단어입니다. 방 설정에서 어인정을 켜 주세요.';if(roomOptionOn('loanword')&&(meta&2))return '우리말 규칙에서는 외래어를 사용할 수 없습니다.';if(roomOptionOn('strict')&&!(meta&4))return '깐깐 규칙에서 사용할 수 없는 단어입니다.';const wanted=currentWordLength();if(wanted&&word.length!==wanted)return `${wanted}글자 단어를 입력하세요.`;if(roomOptionOn('manner')&&!hasContinuation(word))return '매너 규칙에서는 이어갈 수 없는 한방 단어를 사용할 수 없습니다.';return '';
  }
  function nextRequired(word){ if(isJapaneseMode())return getJaChar(japaneseEntry(word)?.reading||word);return game.mode==='reverse'?word[0]:word.at(-1); }
  function scoreWord(word){ return Math.round(ruleText(word).length*12+45*(game.turnRemain/game.turnTime)); }
  function pushDisplay(word,done){ $('GameDisplay').innerHTML='';const speed=Math.min(10,Math.max(0,2+Math.floor(word.length/2))),soundKey=word.length>=10?'Al':`As${speed}`;Array.from(word).forEach((ch,i)=>{const t=setTimeout(()=>{const el=document.createElement('div');el.className='display-text';el.textContent=ch;el.style.fontSize='36px';el.style.marginTop='-6px';$('GameDisplay').appendChild(el);playSound(soundKey);requestAnimationFrame(()=>{el.style.transition='all 100ms ease';el.style.fontSize='20px';el.style.marginTop='0';});},i*80);game.fxTimers.push(t);});game.fxTimers.push(setTimeout(()=>{if(game.mode==='three')playSound('kung');playSound(`K${speed}`);done?.();},Math.max(180,word.length*80+80))); }
  function pushHistory(word,who){ game.history.push({word,who,at:Date.now()});const item=document.createElement('div');item.className='ellipse history-item';item.style.width='0';item.innerHTML=`${escapeHTML(word)}<div class="history-mean ellipse">${who==='me'?escapeHTML(store.nickname):'로컬 로봇'}</div>`;$('History').prepend(item);requestAnimationFrame(()=>{item.style.transition='width 300ms ease';item.style.width='200px';});while($('History').children.length>6)$('History').lastElementChild.remove(); }
  function botPool(){ return wordBucket().filter(w=>!game.used.has(w)&&wordAllowed(w)&&(!roomOptionOn('manner')||hasContinuation(w))); }
  function botFutureCount(word){ const required=nextRequired(word),wanted=nextWordLength(),bucket=continuationBucket(required);let count=0;for(const w of bucket)if(w!==word&&!game.used.has(w)&&wordAllowed(w,wanted))count++;return count; }
  function startBotTurn(){ if(!game||game.over)return;game.turn='bot';setCurrent('bot');$('GameInputWrap').classList.remove('static-active');$('GameDisplay').textContent=game.required||'...';startTurnTimer('bot');const delay=[2200,1700,1100,650,350][store.botLevel]||1100;game.botTimer=setTimeout(()=>{if(!game||game.over||game.turn!=='bot')return;const pool=botPool();if(!pool.length){stopTurnTimer();bombUser('bot');playSound('timeout');winRoundByBotFail();return;}const candidates=pool.sort((a,b)=>store.botLevel>=3?botFutureCount(b)-botFutureCount(a):Math.random()-.5),word=candidates[Math.floor(Math.random()*Math.min(candidates.length,store.botLevel>=3?3:candidates.length))];stopTurnTimer();game.used.add(word);game.score.bot+=scoreAcceptedWord(word);game.chain++;game.required=nextRequired(word);advanceWordLength();$('Chain').textContent=String(game.chain);pushDisplay(word,()=>{pushHistory(word,'bot');updateScores();startPlayerTurn();});},delay); }
  function bombUser(id){ const el=$(`game-user-${id}`);el?.classList.add('game-user-bomb','static-bomb');setTimeout(()=>el?.classList.remove('static-bomb'),800); }
  function winRoundByBotFail(){ if(!game||game.over)return;game.score.me+=150;updateScores();playSound('success');$('GameDisplay').textContent='라운드 승리!';endRound('로봇이 단어를 잇지 못했습니다.'); }
  function loseRound(reason){ if(!game||game.over)return;game.score.bot+=150;updateScores();$('GameDisplay').textContent='라운드 패배';endRound(reason); }
  function endRound(reason){ stopTurnTimer();clearInterval(game.roundInterval);game.roundInterval=null;notice(reason);if(game.round>=room.rounds)finishGame(reason);else setTimeout(()=>{$$('#GameUsers .game-user').forEach(el=>el.classList.remove('game-user-bomb'));startRound();},1100); }
  function flashFail(text){ const display=$('GameDisplay');display.innerHTML=`<label class="game-fail-text">${escapeHTML(text)}</label>`;setTimeout(()=>{if(game&&!game.over&&game.turn==='me')display.textContent=game.mode==='typing'?game.typingPrompt:(game.required||'자유');},1100); }
  function finishGame(reason){
    if(!game||game.over)return;game.over=true;clearGameTimers();$('GameInputWrap').classList.remove('static-active');$$('.game-user').forEach(el=>el.classList.remove('game-user-current'));$('GameDisplay').textContent='게임 종료';playSound('horr');store.totalGames++;store.totalWords+=game.history.filter(h=>h.who==='me').length;store.bestScore=Math.max(store.bestScore,game.score.me);store.bestChain=Math.max(store.bestChain,game.bestChain);saveStore();
    const meRank=game.score.me>=game.score.bot?1:2,botRank=meRank===1?2:1;$('ResultBoard').innerHTML=resultRow(meRank,store.nickname,game.score.me,true)+resultRow(botRank,`Lv.${store.botLevel} 로봇`,game.score.bot,false)+`<div style="float:left;width:100%;padding:8px;text-align:center;color:#777">${escapeHTML(reason)}</div>`;$('ResultScoreGain').textContent=`이번 게임 +${commify(game.score.me)}`;$('ResultLevel').textContent=String(levelFromScore(store.bestScore));$('ResultScoreText').textContent=`${commify(store.bestScore)} / ${commify(scoreGoal(store.bestScore))}`;$('ResultGauge').style.width=`${Math.min(100,store.bestScore/scoreGoal(store.bestScore)*100)}%`;setTimeout(()=>showDialog('ResultDiag'),500);
  }
  function resultRow(rank,name,score,me){ return `<div class="result-board-item ${me?'result-board-me':''}"><div class="result-board-rank">${rank}</div><div class="result-board-level level-sprite" style="width:20px;height:20px"></div><div class="result-board-name">${escapeHTML(name)}</div><div class="result-board-score">${commify(score)}점</div><div class="result-board-reward">${me?'+'+commify(score):'-'}</div><div class="result-board-lvup"></div></div>`; }
  function saveReplay(){ if(!game)return;const data={version:'static-original-ui-v2',time:Date.now(),room:{...room},players:[{id:'me',title:store.nickname},{id:'bot',title:`Lv.${store.botLevel} 로봇`,robot:true}],score:{...game.score},history:game.history};const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a'),d=new Date();a.download=`KKuTu-${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}-${d.getHours()}-${d.getMinutes()}.kkt`;a.href=url;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000); }

  function refreshRoomOptions(){ const available=new Set(MODE_OPTIONS[$('room-mode').value]||[]);Object.keys(DEFAULT_ROOM_OPTIONS).forEach(key=>{$(`room-${key}-panel`)?.classList.toggle('static-hidden',!available.has(key));}); }
  function openRoomDialog(edit=false){ $('RoomDiag').querySelector('.dialog-title').textContent=edit?'방 설정':'방 만들기';$('room-title').value=room.title;$('room-mode').value=room.mode;$('room-round').value=room.rounds;$('room-time').value=room.roundTime;$('turn-time').value=room.turnTime;Object.keys(DEFAULT_ROOM_OPTIONS).forEach(key=>{const input=$(`room-${key}`);if(input)input.checked=Boolean(room.options?.[key]);});refreshRoomOptions();showDialog('RoomDiag'); }
  function applyRoomDialog(){ room.title=$('room-title').value.trim()||'로컬 연습방';room.mode=$('room-mode').value;room.rounds=Math.max(1,Math.min(10,+$('room-round').value||5));room.roundTime=+$('room-time').value||60;room.turnTime=+$('turn-time').value||15;room.options={...DEFAULT_ROOM_OPTIONS};Object.keys(DEFAULT_ROOM_OPTIONS).forEach(key=>{room.options[key]=Boolean($(`room-${key}`)?.checked);});closeDialogs();if(view==='lobby')showView('room');else renderRoom(); }
  function openSettings(){ $('nickname').value=store.nickname;$('mute-bgm').checked=store.muteBGM;$('mute-effect').checked=store.muteEffect;showDialog('SettingDiag'); }
  function saveSettings(){ store.nickname=($('nickname').value.trim()||'플레이어').slice(0,14);store.muteBGM=$('mute-bgm').checked;store.muteEffect=$('mute-effect').checked;saveStore();refreshVolumes();closeDialogs();if(view==='lobby')renderLobby();if(view==='room')renderRoom(); }
  function searchDictionary(){
    const raw=$('dict-input').value.trim(),out=$('dict-output');if(!raw){out.innerHTML='<div class="dict-no">검색할 단어를 입력하세요.</div>';return;}
    const jq=normalizeJaWord(raw),jaMode=room.mode==='japanese'||/[ぁ-ゖァ-ヶ一-龯々〆〇ー]/.test(raw);
    if(jaMode){
      const exact=JA_WORD_INDEX.get(jq),related=JA_WORDS.filter(w=>w.includes(jq)||(JA_WORD_INDEX.get(w)?.reading||'').includes(jq)).slice(0,30);
      if(!exact&&!related.length){out.innerHTML=`<div class="dict-no">'${escapeHTML(raw)}'은(는) 일본어 로컬 사전에 없습니다.</div>`;return;}
      out.innerHTML=(exact?[`<div class="dict-hit"><b>${escapeHTML(exact.word)}</b><br>읽기: ${escapeHTML(exact.reading)} / JMdict 정적 사전에 등록된 단어입니다.</div>`]:[]).concat(related.filter(w=>w!==jq).map(w=>{const e=JA_WORD_INDEX.get(w);return `<div class="dict-hit">${escapeHTML(w)}${e&&e.reading!==w?` <small>(${escapeHTML(e.reading)})</small>`:''}</div>`;})).join('');return;
    }
    const q=raw.replace(/\s+/g,''),exact=WORD_SET.has(q),related=WORDS.filter(w=>w.includes(q)).slice(0,30);if(!exact&&!related.length){out.innerHTML=`<div class="dict-no">'${escapeHTML(q)}'은(는) 로컬 사전에 없습니다.</div>`;return;}out.innerHTML=(exact?[`<div class="dict-hit"><b>${escapeHTML(q)}</b><br>원본 KKuTu 정적 사전에 등록된 단어입니다.</div>`]:[]).concat(related.filter(w=>w!==q).map(w=>`<div class="dict-hit">${escapeHTML(w)}</div>`)).join('');
  }
  function initDragDialogs(){ $$('.dialog-title').forEach(title=>title.addEventListener('mousedown',e=>{const d=title.closest('.dialog');if(!d)return;d.classList.add('dialog-front');const r=d.getBoundingClientRect(),dx=e.clientX-r.left,dy=e.clientY-r.top,move=ev=>{d.style.left=`${Math.max(0,ev.clientX-dx)}px`;d.style.top=`${Math.max(30,ev.clientY-dy)}px`;},up=()=>{removeEventListener('mousemove',move);removeEventListener('mouseup',up)};addEventListener('mousemove',move);addEventListener('mouseup',up);})); }
  function bind(){
    $('NewRoomBtn').onclick=()=>openRoomDialog(false);$('QuickRoomBtn').onclick=()=>{const modes=Object.keys(MODES);room={...room,id:Math.floor(Math.random()*4)+1,mode:modes[Math.floor(Math.random()*modes.length)],title:'빠른 로컬 연습방'};showView('room');notice('빠른 입장으로 로컬 연습방에 들어왔습니다.');};$('SetRoomBtn').onclick=()=>openRoomDialog(true);$('room-mode').onchange=refreshRoomOptions;$('PracticeBtn').onclick=()=>{$('practice-level').value=String(store.botLevel);showDialog('PracticeDiag')};$('StartBtn').onclick=startGame;
    $('ExitBtn').onclick=()=>{if(view==='game'){if(!confirm('게임을 종료하고 방으로 돌아가시겠습니까?'))return;clearGameTimers();stopAllSounds();audioUnlocked=true;showView('room')}else showView('lobby')};$('SettingBtn').onclick=openSettings;$('HelpBtn').onclick=()=>showDialog('HelpDiag');$('DictionaryBtn').onclick=()=>showDialog('DictionaryDiag');$('room-ok').onclick=applyRoomDialog;$('practice-ok').onclick=()=>{store.botLevel=+$('practice-level').value;saveStore();closeDialogs();if(view==='room')renderRoom()};$('setting-ok').onclick=saveSettings;
    $('reset-record').onclick=()=>{if(confirm('로컬 기록을 초기화하시겠습니까?')){store.bestScore=store.bestChain=store.totalGames=store.totalWords=0;saveStore()}};$('dict-search').onclick=searchDictionary;$('dict-input').addEventListener('keydown',e=>{if(e.key==='Enter')searchDictionary()});$('result-ok').onclick=()=>{closeDialogs();stopAllSounds();audioUnlocked=true;showView('room')};$('result-save').onclick=saveReplay;$$('.closeBtn[data-close]').forEach(b=>b.onclick=()=>$(b.dataset.close).style.display='none');bindChat('Talk','ChatBtn','Chat');bindChat('RoomTalk','RoomChatBtn','RoomChat');bindChat('GameTalk','GameChatBtn','GameChat');$('game-input').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();handleGameInput();}});
  }
  function init(){ loadSounds();bind();initDragDialogs();updateMe();renderLobby();setMenu('lobby');$('Loading').style.display='none';addChat('Chat','알림',`정적 로컬 모드입니다. 한국어 ${commify(WORDS.length)}개 + 일본어 ${commify(JA_WORDS.length)}개 사전 항목을 사용합니다.`,true);setTimeout(()=>{const intro=$('Intro');intro.style.transition='opacity 800ms ease';intro.style.opacity='0';setTimeout(()=>intro.style.display='none',850);},900);addEventListener('pointerdown',unlockAudio,{once:true});addEventListener('keydown',unlockAudio,{once:true}); }
  init();
})();
