# KKuTu Static Edition

끄투를 **서버 없이 GitHub Pages에서 바로 실행되는 정적 싱글플레이 게임**으로 전환한 버전입니다.

기존 Render/Node.js/Express/WebSocket/SQLite 런타임은 더 이상 배포 경로에 포함되지 않습니다. `main` 브랜치에 push하면 GitHub Actions가 `static/` 디렉터리를 Pages artifact로 만들어 배포합니다.

## 현재 구조

```text
static/
  index.html   # 정적 UI
  style.css    # 반응형 게임 UI
  app.js       # 게임 규칙, 로봇, 타이머, localStorage
.github/workflows/pages.yml
Server/        # 기존 KKuTu 서버 소스/리소스 (참고용, Pages 실행에는 사용하지 않음)
```

## 정적판 기능

- 한국어 끝말잇기
- 3글자 전용 쿵쿵따
- 앞말잇기
- 타자 대결
- 쉬움 / 보통 / 어려움 로컬 로봇
- 턴 제한시간 15 / 20 / 30초
- 점수, 연속 성공, 플레이 횟수 기록
- 닉네임/난이도/시간 설정 저장
- 브라우저 `localStorage` 기반 기록 저장
- 모바일/데스크톱 반응형 UI
- 외부 API, 계정, DB, WebSocket 없음

> 정적 호스팅 특성상 서버 권한이 필요한 실시간 온라인 멀티플레이, OAuth 로그인, 공용 랭킹/계정 데이터는 제공하지 않습니다.

## GitHub Pages 배포

배포는 `.github/workflows/pages.yml`만 사용합니다.

1. `main` 브랜치에 push
2. Actions가 `static/`을 `_site`로 복사
3. 기존 저장소의 favicon이 있으면 정적 사이트에 포함
4. `actions/upload-pages-artifact`로 업로드
5. `actions/deploy-pages`로 GitHub Pages 배포

워크플로는 Pages enablement도 시도하도록 설정되어 있습니다. 저장소/계정 정책 때문에 자동 활성화가 허용되지 않는 경우 GitHub 저장소 **Settings → Pages → Source → GitHub Actions**를 한 번 선택하면 됩니다.

## 로컬 실행

빌드 단계가 없습니다. `static/`을 아무 정적 HTTP 서버로 열면 됩니다.

예:

```bash
python -m http.server 8080 -d static
```

그 후 `http://localhost:8080`으로 접속합니다.

## 기존 서버 코드

`Server/`는 원본 KKuTu 코드와 리소스를 보존하기 위한 참고 영역입니다. GitHub Pages 워크플로는 이 서버를 실행하거나 Node 패키지를 설치하지 않습니다. 정적판의 런타임 코드는 `static/`만 보면 됩니다.

## 라이선스

- 소스 코드: [GNU GPL-3.0](LICENSE)
- 원본 KKuTu 이미지/사운드 리소스: 기존 저장소 라이선스 고지에 따름
