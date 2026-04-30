# Open Design 집 컴퓨터 설치/실행 지침

이 문서는 집 컴퓨터에서 Codex에게 그대로 맡기기 위한 작업 지침입니다.

Codex에게 이렇게 말하면 됩니다.

```text
HOME_SETUP.ko.md 읽어보고 Open Design을 사용할 수 있게 설치하고 실행해줘.
가능하면 WSL2 Ubuntu 안의 홈 디렉터리에 설치하고, 실행 URL까지 확인해줘.
```

## 목표

- GitHub 저장소 `https://github.com/nexu-io/open-design`를 설치한다.
- 로컬에서 Open Design web UI를 사용할 수 있게 실행한다.
- 실행 후 브라우저에서 접속 가능한 URL을 알려준다.
- 가능하면 로컬 에이전트 CLI, 특히 `codex`, `gemini`, `opencode` 중 사용 가능한 것을 앱이 감지하게 한다.

## 권장 환경

Windows라면 Windows 네이티브보다 WSL2 Ubuntu를 권장한다.

이 프로젝트는 `better-sqlite3` 네이티브 모듈을 사용한다. Windows 네이티브 Node 24에서는 Visual Studio C++ Build Tools가 없으면 설치가 막힐 수 있다. 회사 컴퓨터에서는 WSL2 + Node 22 조합으로 설치와 실행을 완료했다.

가능하면 저장소는 `C:\...` 경로가 아니라 WSL 홈 디렉터리 아래에 둔다.

추천 위치:

```bash
~/open-design
```

## WSL2 Ubuntu 준비

Windows PowerShell에서 WSL이 있는지 확인한다.

```powershell
wsl -l -v
```

Ubuntu가 없으면 설치한다.

```powershell
wsl --install -d Ubuntu
```

설치 후 재부팅이 필요할 수 있다.

## WSL 안에서 기본 도구 설치

Ubuntu 터미널에서 실행한다.

```bash
sudo apt update
sudo apt install -y git curl
```

## 저장소 클론

WSL 홈 디렉터리에서 진행한다.

```bash
cd ~
git clone https://github.com/nexu-io/open-design.git
cd open-design
```

이미 클론되어 있다면:

```bash
cd ~/open-design
git pull
```

## Node / pnpm 준비

`nvm`이 없으면 설치한다.

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
source ~/.nvm/nvm.sh
```

회사 컴퓨터에서 성공한 조합은 Node 22였다.

```bash
nvm install 22
nvm use 22
corepack enable
corepack pnpm --version
```

`corepack pnpm --version`은 프로젝트의 `packageManager` 설정에 따라 `10.33.2`가 나오는 것이 정상이다.

참고: 저장소의 `package.json`은 Node `~24`를 요구하지만, Windows/WSL 환경에서는 Node 24에서 `better-sqlite3` 사전 빌드 바이너리가 없을 수 있다. 빌드 도구가 없다면 Node 22 + engine strict 해제 방식이 더 잘 통과한다.

## 의존성 설치

Node 22를 쓰는 경우 엔진 경고가 뜰 수 있으므로 아래처럼 설치한다.

```bash
COREPACK_ENABLE_STRICT=0 corepack pnpm install --config.engine-strict=false --child-concurrency=1
```

성공 기준:

- `better-sqlite3 install: Done`
- `Done in ... using pnpm v10.33.2`

## 기본 실행

먼저 공식 실행 경로를 시도한다.

```bash
COREPACK_ENABLE_STRICT=0 corepack pnpm tools-dev start web
```

정상이라면 출력에 web URL이 표시된다. 보통 `http://127.0.0.1:3000` 또는 비어 있는 다른 포트다.

## 타임아웃이 날 때 수동 실행

WSL의 Windows 마운트 경로나 느린 파일 시스템에서는 다음 오류가 날 수 있다.

```text
daemon did not expose status in time
```

그 경우 터미널 2개를 열어 수동으로 실행한다.

터미널 1:

```bash
cd ~/open-design
nvm use 22
node apps/daemon/dist/cli.js --no-open --port 7456
```

daemon이 정상이라면 다음처럼 나온다.

```text
[od] listening on http://127.0.0.1:7456
```

터미널 2:

```bash
cd ~/open-design/apps/web
nvm use 22
OD_PORT=7456 PORT=3001 COREPACK_ENABLE_STRICT=0 corepack pnpm exec next dev -H 0.0.0.0 -p 3001
```

web이 정상이라면 다음처럼 나온다.

```text
Next.js ...
Local:   http://localhost:3001
Ready in ...
```

브라우저에서 연다.

```text
http://127.0.0.1:3001
```

## 정상 동작 확인

다른 터미널에서 확인한다.

```bash
curl http://127.0.0.1:7456/api/health
curl http://127.0.0.1:3001/api/health
```

둘 다 아래처럼 나오면 daemon과 web 프록시가 정상이다.

```json
{"ok":true,"version":"0.1.0"}
```

에이전트 감지는 아래로 확인한다.

```bash
curl http://127.0.0.1:3001/api/agents
```

`codex`, `gemini`, `opencode` 중 하나라도 `"available": true`이면 로컬 CLI 모드로 사용할 수 있다.

## 에이전트 CLI 관련

Open Design은 자체 에이전트를 포함하지 않고, 로컬에 설치된 CLI를 감지해 사용한다.

우선 확인:

```bash
command -v codex
command -v gemini
command -v opencode
```

하나도 없으면 앱 안에서 BYOK API 모드를 쓰거나, 사용하는 에이전트 CLI를 설치한 뒤 daemon/web을 다시 시작한다.

## 포트 충돌

3000번 포트가 이미 사용 중이면 3001을 쓴다.

```bash
OD_PORT=7456 PORT=3001 COREPACK_ENABLE_STRICT=0 corepack pnpm exec next dev -H 0.0.0.0 -p 3001
```

7456번이 충돌하면 daemon 포트를 바꾸고, web의 `OD_PORT`도 같은 값으로 바꾼다.

예:

```bash
node apps/daemon/dist/cli.js --no-open --port 7460
```

```bash
OD_PORT=7460 PORT=3001 COREPACK_ENABLE_STRICT=0 corepack pnpm exec next dev -H 0.0.0.0 -p 3001
```

## 회사 컴퓨터에서 확인된 사항

- 저장소: `nexu-io/open-design`
- WSL2 Ubuntu 사용
- Node 22.22.0 + pnpm 10.33.2로 설치 성공
- Node 24는 설치 가능했지만 `better-sqlite3`가 네이티브 빌드를 시도해 C++ Build Tools 없이 실패할 수 있음
- daemon health: `http://127.0.0.1:7456/api/health`
- web URL: `http://127.0.0.1:3001`
- web health: `http://127.0.0.1:3001/api/health`
- 감지된 에이전트 예: Codex CLI, Gemini CLI, OpenCode

## Codex가 마무리할 때 사용자에게 알려줄 것

- 설치가 완료됐는지
- 실행 중인 daemon URL
- 실행 중인 web URL
- 감지된 로컬 에이전트 CLI
- 실패했다면 어느 단계에서 막혔고 어떤 추가 설치가 필요한지
