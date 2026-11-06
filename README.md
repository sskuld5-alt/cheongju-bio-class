# 중학교 3학년 생명기술 연구노트

청주여자중학교 3학년을 위한 2026학년도 기술·가정 생명기술 수업. 45분, 개인 기기와 3~4인 모둠 활동으로 운영합니다.

## 사용

학습 → 과정 배열 → 모둠 연구 제안 → 퀴즈·개인 성찰 → PDF 저장 순서입니다. 답안은 브라우저 localStorage에만 저장되며 서버에 전송되지 않습니다. 공유 기기는 PDF 저장 후 ‘이 기기의 답안 지우기’를 사용합니다. 별도 교사 수합 서버나 로그인은 없습니다.

자료실에는 학습자료 2쪽+활동지 2쪽, 교사용 지도자료 3쪽, 현재 답안 PDF 생성 기능이 있습니다. `pdf-lib`와 `fontkit`, NanumGothic 글꼴을 로컬로 제공합니다. 글꼴이 지원하지 않는 특수문자는 답안 PDF에 유니코드 코드로 보존합니다.

## 교육과정

2015 개정 `[9기가04-08]`, `[9기가04-09]` 중심입니다. 교육부 별책 10 원문 PDF 26~27쪽(인쇄 22~23쪽)을 대조했습니다. 설치된 교육과정 MCP는 2022 개정 자료이므로 `[9기가04-10]`, `[9기가04-11]`은 후속 연결로 구분했습니다. 중3은 2027학년도부터 2022 개정이 적용됩니다.

오송의 실제 바이오 연구 기반과 수업용 가상 의뢰를 구분합니다. 인슐린 생산을 특정 오송 기관의 실제 사업으로 표현하지 않습니다. 교과서 본문 및 기관 로고는 복제하지 않았습니다.

## 개발 및 검증

```sh
npm ci
npm test
npm run test:browser
python -m pip install reportlab pypdf pymupdf
python scripts/build_pdfs.py
python scripts/check_pdfs.py
python -m http.server 4173 --bind 127.0.0.1
```

브라우저 검수는 설치된 Chrome을 Playwright의 독립된 임시 세션으로 실행합니다. 기본 대상은 배포 페이지이며 `REVIEW_URL` 환경 변수로 다른 주소를 지정할 수 있습니다. 화면 캡처, 내려받은 PDF, 결과 JSON은 Git에서 제외된 `tmp/browser-review`에 저장됩니다. 검수 범위는 [VERIFICATION.md](VERIFICATION.md)를 참고하세요.

`lesson.json`은 웹·PDF의 공통 문항 원본입니다. `app.js`는 화면·저장·퀴즈, `pdf.js`는 답안 PDF 생성을 담당합니다. 수정 후 고정 PDF를 다시 생성해야 합니다. GitHub Pages는 `main`의 루트(`/`)를 게시합니다. 상대 경로를 사용하므로 프로젝트 하위 URL에서도 동작합니다.

## 자료와 라이선스

출처는 `lesson.json` 및 웹 자료 출처에서 확인할 수 있습니다. `assets/FONT-LICENSE.txt`는 NanumGothic의 SIL OFL, `assets/PDF-LIB-LICENSE.txt`와 `assets/FONTKIT-LICENSE.txt`는 포함한 라이브러리의 MIT 라이선스입니다. 연구실 일러스트는 이 수업을 위해 제작한 SVG입니다.

공개 저장소에는 학생 답안과 개인 자료를 올리지 않습니다. 교사용 자료도 공개 자료이므로 정답 비공개 시험 운영에는 사용하지 않습니다.
