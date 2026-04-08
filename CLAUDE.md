# CLAUDE.md

## 프로젝트 개요

이 프로젝트는 GA4 데이터를 기반으로 이커머스 성과를 시각화하고, 일간 리포트를 자동 생성하는 웹 애플리케이션입니다.

- 프론트엔드에서 KPI/트렌드/채널/페이지 지표를 대시보드로 제공합니다.
- 일간 리포트 탭은 매일 18시 기준 데이터 윈도우를 기반으로 자동 생성된 리포트를 보여줍니다.
- 서버 API는 Vercel Serverless Functions 구조로 전환되었습니다.

배포/저장소:

- 배포: `https://insaeng-report.vercel.app`
- GitHub: `https://github.com/insaengsikdang/insaeng-report`

## 기술 스택

- Frontend
  - React 18
  - Vite 5
  - Recharts
  - Axios
  - Day.js
  - Lucide React
- Backend/API
  - Vercel Serverless Functions (`api/**`)
  - Node.js (ESM)
  - Google Analytics Data API (`googleapis`)
  - Gemini API (`@google/generative-ai`)
  - Firebase Admin SDK (`firebase-admin`) - Firestore 저장용
- 배포/운영
  - Vercel
  - Vercel Cron (KST 18:00 실행용, UTC 09:00)

## 환경변수 목록

### GA4

- `GA4_PROPERTY_ID`
- `GA4_SERVICE_ACCOUNT_JSON` (권장)
- `GA4_KEY_FILE` (로컬 파일 경로 방식, 선택)

### Gemini

- `GEMINI_API_KEY`
- `GEMINI_MODEL` (선택, 기본값 있음)

### Firebase

- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`

### 기타

- `CRON_SECRET` (선택, Cron 엔드포인트 보호용)
- `PORT` (로컬 Express 실행 시 사용)

## 현재 완료된 것

- 상단 탭 네비게이션 구성
  - `일간 리포트` (기본 탭)
  - `대시보드`
- 대시보드 탭에서 AI 분석 영역 분리(제거) 및 GA4 지표 전용 화면 유지
- 일간 리포트 화면 구성
  - 리포트 구간/생성 시각 표시
  - 저장된 GA4 대시보드 요약(카드/차트/테이블) 표시
  - AI 분석 섹션 표시(성공/실패 UI)
- Gemini 쿼터 초과 시 사용자 친화 문구 처리
- Vercel Serverless Functions 구조 추가 (`api/**`)
  - `/api/analytics/*`
  - `/api/gemini/analyze`
  - `/api/daily-report/current`
  - `/api/cron/daily-report`
- Vercel Cron 설정(`vercel.json`) 추가
- 민감파일 Git 제외 설정
  - `.env`
  - `ga4-service-account.json`

## 현재 미완료된 것

- Firebase 연결 (개발자 허락 후 진행)
- 일간 리포트 AI 분석

## 메모

- 비밀정보(API 키/서비스 계정 키)는 코드 하드코딩 금지, 환경변수로만 관리합니다.
- 민감정보는 채팅/문서/커밋에 원문 노출하지 않습니다.
