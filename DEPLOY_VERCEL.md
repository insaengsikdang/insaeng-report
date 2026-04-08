# Vercel 배포 전환 가이드

## 1) 환경변수 (Vercel Project Settings)

- `GA4_PROPERTY_ID`
- `GA4_SERVICE_ACCOUNT_JSON` (권장)
- `GA4_KEY_FILE` (선택: 파일 경로 방식 사용할 때만)
- `GEMINI_API_KEY`
- `GEMINI_MODEL` (선택, 기본: `gemini-2.0-flash`)
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY` (`\n` 포함 문자열로 저장)
- `CRON_SECRET` (선택, 설정 시 Cron 요청에 Bearer 인증 필요)

## 2) GA4 서비스 계정 키 파일

`GA4_SERVICE_ACCOUNT_JSON`을 권장합니다. 서비스 계정 JSON 전체를 문자열로 넣으면 파일 없이 동작합니다.
(`GA4_KEY_FILE`은 로컬 개발용 파일 경로 방식으로 사용 가능)

## 3) Vercel Cron

- 설정 파일: `vercel.json`
- 스케줄: `"0 9 * * *"` (UTC 09:00 = KST 18:00)
- 호출 경로: `/api/cron/daily-report`

## 4) Firestore 저장 위치

- 컬렉션: `dailyReports`
- 문서 ID: `YYYY-MM-DD-HH` (18시 윈도우 시작 기준)
