# STRANGE

**CREATE SOMETHING STRANGE.**

검은 화면에서 시작해, 거대한 글자가 무너지고, 금속 조각 안으로 들어가면 작은 픽셀 세계가 열리는 짧은 인터랙티브 디지털 작품입니다. 메뉴나 게임 조작 없이 스크롤로 감상합니다.

## 설치와 실행

Python 3.9 이상이 필요합니다. 압축을 풀었다면 `app.py`와 `requirements.txt`가 들어 있는 `strange` 폴더에서 터미널을 여세요.

```powershell
python -m venv .venv
```

Windows PowerShell:

```powershell
.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python app.py
```

Windows에서 가상환경 활성화가 차단된다면 아래 명령으로도 바로 설치·실행할 수 있습니다. 실행 정책을 바꿀 필요가 없습니다.

```powershell
.venv\Scripts\python.exe -m pip install -r requirements.txt
.venv\Scripts\python.exe app.py
```

macOS / Linux:

```bash
source .venv/bin/activate
python -m pip install -r requirements.txt
python app.py
```

브라우저에서 **http://127.0.0.1:5000** 을 엽니다. 서버를 끄려면 터미널에서 `Ctrl+C`를 누르세요. 이미 Flask가 설치되어 있으면 `python app.py`만 실행하면 됩니다.

5000 포트가 사용 중이면 PowerShell에서 `$env:PORT="5001"`을 실행한 뒤 서버를 시작하고 http://127.0.0.1:5001 을 여세요.

## 감상 방법

1. 검은 화면에서 잠시 기다리면 무작위 문자가 세 줄의 문장으로 정착합니다.
2. `scroll ↓`가 나타나면 아래로 스크롤합니다. 글자들이 서로 부딪히고 회전하며 바닥에 쌓입니다.
3. 낙하와 정적을 감상하면 자동으로 암전되고 금속 오브젝트가 나타납니다.
4. 다시 아래로 스크롤하면 카메라가 전진합니다. 이 장면에서는 위로 스크롤해 물러날 수도 있습니다.
5. 안으로 진입하면 픽셀 풍경이 열립니다. 구름, 물결, 새, 풀, 굴뚝 연기와 작은 여행자가 계속 움직입니다.
6. 오른쪽 아래 `again ↺`를 누르면 풍경의 픽셀이 커지고 암전된 뒤 처음으로 돌아갑니다. 페이지를 새로고침하지 않습니다.

모바일은 위로 스와이프하세요. 키보드의 `↓`, `PageDown`, `Space`도 사용할 수 있습니다. `again`은 Tab으로 이동해 Enter로 실행할 수 있습니다. 장면 전환 중 입력은 버려 빠른 스크롤로 낙하나 암전을 건너뛰지 않습니다.

## 기술

- **Flask 3.1.3**: `/`에서 Jinja HTML 제공. 로그인, DB, 외부 API 없음.
- **HTML / CSS / JavaScript ES modules**: 별도 프론트엔드 프레임워크 및 빌드 과정 없음.
- **Matter.js 0.20.0**: 23개의 글자를 독립된 직사각형 강체로 계산. 중력, 회전, 반발, 마찰, 글자 간 충돌과 바닥·벽 충돌 적용. 글자 외곽선 자체의 정밀 충돌은 아닌, 글자 크기에 맞춘 충돌 상자 방식입니다.
- **Three.js 0.170.0**: 비대칭 torus knot, 금속 재질, Canvas로 직접 만든 스튜디오 반사 환경, 세 개의 조명. 스크롤은 오브젝트 스케일이 아니라 perspective camera 위치를 변경합니다.
- **Canvas 2D**: 직접 작성한 절차적 픽셀 아트와 깊이별 패럴랙스. 외부 이미지나 3D 모델 파일 없음.
- **Anton**: 프로젝트에 포함된 글꼴. 글꼴과 라이브러리 라이선스는 `static/vendor/`에 있습니다.

모든 브라우저 리소스는 로컬로 제공됩니다. **최초 Python 패키지 설치 후에는 인터넷 연결 없이 작동합니다.**

## 프로젝트 구조

```text
strange/
├── app.py
├── requirements.txt
├── README.md
├── VERIFICATION.md
├── templates/
│   └── index.html
└── static/
    ├── css/style.css
    ├── js/
    │   ├── main.js          # 상태 전환, scramble, 입력, 재시작
    │   ├── gravity-text.js  # Matter.js 물리 시뮬레이션
    │   ├── three-scene.js   # 크롬 오브젝트와 카메라
    │   └── pixel-world.js   # 살아 움직이는 픽셀 풍경
    └── vendor/             # 라이브러리, 글꼴, 라이선스
```

## 성능과 접근성

- 하나의 `requestAnimationFrame` 루프가 현재 장면만 갱신합니다. 백그라운드 탭에서는 장면 시간과 시뮬레이션을 멈춥니다.
- 물리는 초당 60회 고정 간격으로 계산하고, 안정된 강체는 sleep 상태로 전환합니다.
- WebGL DPR을 최대 1.6으로 제한하고 픽셀 풍경은 세로 270픽셀로 그립니다.
- 화면 크기가 바뀌면 글자, 물리 경계, 카메라, 캔버스를 다시 맞춥니다.
- 시스템의 `prefers-reduced-motion` 설정에서는 무작위 문자 노출을 줄이고 낙하·카메라 돌진을 페이드로 대체합니다. 픽셀 움직임도 느려집니다. 설정은 페이지를 열 때 반영됩니다.
- 화면 읽기 도구에는 장면 상태를 짧게 알리고, 임의 문자는 읽히지 않게 합니다.
- WebGL을 사용할 수 없으면 CSS 금속 형태와 전환으로 끝까지 감상할 수 있습니다. 완전한 3D 표현은 WebGL 지원 브라우저에서 제공됩니다.
- 로컬 감상을 위한 서버이며 debug 모드는 꺼져 있습니다.
