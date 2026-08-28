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
- 서버 DB/랭킹/상점 구매
- 서버 사전 API

대신 로컬 방, 로컬 로봇 대전, 채팅 UI, 사전 검색, 점수/기록, 설정은 브라우저에서 처리하며 `localStorage`에 저장합니다.

현재 로컬 플레이 모드:

- 한국어 끝말잇기
- 쿵쿵따
- 앞말잇기
- 타자 대결

## 구조

```text
Server/lib/Web/public/   # 원본 KKuTu 프론트엔드 리소스 — 그대로 사용
static/
  index.html             # 원본 DOM 구조를 정적 HTML로 옮긴 진입점
  static.css             # 정적화에 필요한 최소 보정만 포함
  app.js                 # WebSocket 대신 실행되는 로컬 게임 런타임
.github/workflows/pages.yml
```

`static.css`는 새 테마/디자인 파일이 아닙니다. 원본 CSS를 우선 사용하고 정적 상태 전환 및 GitHub Pages 실행에 필요한 보정만 담당합니다.

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
