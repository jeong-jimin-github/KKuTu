# KKuTu Static Edition

https://jeong-jimin-github.github.io/Static-KKuTu/

원본 KKuTu의 **UI, CSS, 이미지, 캐릭터/Moremi 리소스, 폰트, BGM 및 효과음 시스템을 그대로 사용하는** GitHub Pages용 정적 로컬 플레이 버전입니다.

Render/Node.js/Express/WebSocket/SQLite 같은 서버 런타임만 배포 경로에서 제거했습니다. 화면을 새 디자인으로 다시 만든 것이 아니라, 원본 `Server/lib/Web/public` 리소스를 Pages 빌드에 그대로 포함하고 서버 통신 부분만 브라우저 로컬 게임 로직으로 대체합니다.

## 보존되는 원본 요소

- `Server/lib/Web/public/css/style.css`
- `Server/lib/Web/public/css/in_game_kkutu.css` 및 관련 KKuTu CSS
- `Server/lib/Web/public/img/**` 전체
  - `intro.png`, `gamebg.png`, 손/표시판 이미지
  - JJo 눈/코 이미지
  - Moremi, 로봇, 레벨 스프라이트, 상점 이미지 등
- `Server/lib/Web/public/media/**` 전체
  - 원본 나눔바른고딕/Font Awesome 폰트
  - `LobbyBGM`, `JaqwiBGM`, `game_start`, `round_start`, `success`, `fail`, `timeout`, `kung` 등
  - 원본 `T0~T10`, `K0~K10`, `As0~As10` 사운드 세트
- 원본 Product/Room/Game/Chat/Me 레이아웃과 `jjoriping` 게임 표시판 구조

정적 런타임에서도 원본 사운드 키 체계와 게임 표시 효과를 사용합니다.

## 정적판에서 바뀌는 부분

서버가 필요한 다음 기능은 브라우저 로컬 동작으로 치환하거나 비활성화됩니다.

- 로그인/OAuth 및 공용 계정
- WebSocket 실시간 멀티플레이
- 서버 DB 쓰기/랭킹/상점 구매
- 서버 사전 API 호출(한국어·일본어 게임 사전은 정적 데이터로 변환)

대신 로컬 방, 로컬 로봇 대전, 채팅 UI, 사전 검색, 점수/기록, 설정은 브라우저에서 처리하며 `localStorage`에 저장합니다. 한국어 게임 사전은 원본 `JJoriping/KKuTu`의 `db.sql`에서 게임 대상 품사 358,998개 단어와 어인정/외래어/깐깐 판정 메타데이터를 추출합니다. 일본어 끝말잇기는 원본 서버와 동일한 JMdict/EDICT 소스를 사용해 읽기(reading)와 표기 별칭을 `static/word-data.js`에 함께 포함합니다.

현재 로컬 플레이 모드:

- 한국어 끝말잇기
- 쿵쿵따
- 앞말잇기
- 타자 대결
- 일본어 끝말잇기 (JMdict/EDICT 읽기 기준, `ん` 종결 금지)

방 만들기/설정에서는 원본 규칙에 맞춰 **매너, 어인정, 미션, 우리말, 깐깐, 3232, 속담** 옵션을 게임 모드별로 선택할 수 있습니다.

## 구조

```text
Server/lib/Web/public/   # 원본 KKuTu 프론트엔드 리소스 — 그대로 사용
static/
  index.html             # 원본 DOM 구조를 정적 HTML로 옮긴 진입점
  static.css             # 정적화에 필요한 최소 보정만 포함
  app.js                 # WebSocket 대신 실행되는 로컬 게임 런타임
  word-data.js           # 원본 db.sql + JMdict/EDICT에서 생성한 한국어·일본어 정적 사전
tools/
  build_static_words.py  # 원본 db.sql + JMdict/EDICT → word-data.js 변환기
.github/workflows/pages.yml
```

`static.css`는 새 테마/디자인 파일이 아닙니다. 원본 CSS를 우선 사용하고 정적 상태 전환 및 GitHub Pages 실행에 필요한 보정만 담당합니다.


## 정적 단어 데이터 갱신

원본 최신 `db.sql`과 JMdict/EDICT에서 한국어·일본어 정적 사전을 다시 만들려면 저장소 루트에서 다음을 실행합니다.

```bash
python tools/build_static_words.py
```

로컬에 받은 `db.sql` 또는 JMdict 파일을 사용하려면 `--input db.sql`, `--jmdict-input JMdict_e.gz` 옵션을 사용할 수 있습니다. 생성 결과에는 한국어 게임 단어/판정용 최소 플래그와 일본어 표기·읽기 데이터가 포함됩니다.

## GitHub Pages 배포

`main`에 push하면 Actions가 다음 순서로 배포합니다.

1. `Server/lib/Web/public/` 전체를 `_site/`로 복사
2. `static/`의 정적 진입점/로컬 런타임을 그 위에 덮어쓰기
3. GitHub Pages 프로젝트 경로에서 깨지지 않도록 원본 CSS의 `/img/...` 참조만 상대 경로로 변환
4. Pages artifact 업로드 및 배포

저장소에서 Pages가 아직 활성화되지 않았다면 **Settings → Pages → Source → GitHub Actions**를 한 번 선택해야 합니다.

## 라이선스

- 소스 코드: [GNU GPL-3.0](LICENSE)
- 원본 KKuTu 이미지/사운드 및 기타 리소스: 저장소의 기존 라이선스 고지에 따름
