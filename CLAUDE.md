# CLAUDE.md

이 파일은 이 repository에서 코드 작업 시 Claude Code (claude.ai/code)에 대한 가이드를 제공합니다.

## 개발 명령어

```bash
# 개발 서버 시작
npm run dev
# 또는
npm start

# 프로덕션 빌드
npm run build

# 프로덕션 빌드 미리보기
npm run preview
```

개발 서버는 5174 포트에서 실행됩니다.

## 프로젝트 아키텍처

Vite와 최신 도구들로 구축된 마미톡잉글리시 서비스용 React 기반 관리자 패널입니다.

### 핵심 구조

- **단일 페이지 애플리케이션**: `App.jsx:16`에서 탭 상태 관리를 통한 클라이언트 사이드 라우팅 사용
- **탭 기반 네비게이션**: `activeTab` 상태에 따라 모든 페이지가 조건부로 렌더링됨
- **국가/지역 지원**: `App.jsx:17`에서 관리되는 글로벌 국가 선택(한국/일본) 및 컴포넌트 간 전달

### 주요 컴포넌트

- **App.jsx**: 전역 상태(activeTab, selectedCountry) 관리 및 라우팅 로직을 담당하는 메인 애플리케이션 컨테이너
- **Sidebar.jsx**: 계층 구조(메인 카테고리 + 서브메뉴)를 가진 접을 수 있는 네비게이션 메뉴
- **Topbar.jsx**: 국가 선택기와 날짜 표시가 있는 글로벌 헤더

### 페이지 카테고리

1. **AI 콘텐츠 생성·관리** (`content-*` 탭)
   - 다단계 사용자 조합(자녀/엄마 레벨)을 통한 콘텐츠 생성
   - 콘텐츠 목록 및 관리
   - 그룹 설정 및 배포
   - AI 생성을 위한 프롬프트 관리

2. **회원 관리** (`*-users`, `purchasers`, `service-groups` 탭)
   - 전체 회원 개요 및 관리
   - 구매자별 관리
   - 회원 그룹 조직

3. **판매 관리** (`order-*`, `purchase-*` 탭)
   - 주문 목록 및 관리
   - 구매 이벤트 설정

### 기술 세부사항

- **상태 관리**: App 컴포넌트에서 로컬 React 상태 사용, 외부 상태 라이브러리 없음
- **스타일링**: 커스텀 디자인 시스템을 가진 Tailwind CSS v4
- **아이콘**: 일관된 아이콘을 위한 Lucide React
- **빌드 도구**: React 플러그인 및 TypeScript 지원을 가진 Vite

### 개발 패턴

- 모든 페이지는 `src/pages/`의 함수형 컴포넌트
- 컴포넌트는 일관된 명명법 사용: 컴포넌트는 PascalCase, 탭 ID는 kebab-case
- Tailwind 클래스는 특정 색상 팔레트를 가진 일관된 디자인 시스템을 따름
- 탭 기반 라우팅: React Router 대신 `activeTab` 상태 수정

### 설정 파일

- **tailwind.config.js**: HTML 및 JSX 파일을 스캔하는 기본 Tailwind v4 설정
- **postcss.config.js**: autoprefixer와 함께 Tailwind v4용으로 구성됨
- **package.json**: ESM 모듈, 5174 포트에서 개발

### 콘텐츠 생성 기능

ContentGeneration 컴포넌트는 정교한 기능들을 포함합니다:
- 다단계 사용자 조합 (자녀 레벨 1-3, 엄마 레벨 1-3, 자녀=1과 엄마=3 조합 제외)
- 상품 변형 (마미톡 365, 마미톡 365+마미보카)
- 카카오톡/라인 인터페이스를 모방한 메시지 스타일링
- 우선순위 기반 색상 시스템을 가진 버튼 프리셋

## 인증 시스템

이 애플리케이션은 Spring 백엔드 연동을 통한 JWT 기반 인증을 구현합니다.

### 인증 아키텍처

- **JWT 토큰**: Refresh token 없는 단일 토큰 (Redis 미사용)
- **역할**: 모든 관리자를 위한 단일 "ADMIN" 역할
- **저장소**: 토큰 및 사용자 데이터를 위한 localStorage
- **자동 로그아웃**: 401 응답 시 자동 로그아웃 및 페이지 새로고침

### API 엔드포인트

Spring 서버에서 구현해야 할 엔드포인트들:
```
POST /admin/v1/auth/login   - 사용자 로그인
POST /admin/v1/auth/logout  - 사용자 로그아웃 (로깅 목적)
GET  /admin/v1/auth/me      - 현재 사용자 정보 조회
```

### 로그인 요청 형식
```json
{
  "username": "admin",
  "password": "password123"
}
```

### 예상 로그인 응답
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "username": "admin",
    "name": "관리자",
    "email": "admin@mommytalk.com",
    "role": "ADMIN"
  }
}
```

### 주요 인증 파일들

- `src/services/api.js`: 자동 토큰 첨부가 있는 Axios 설정
- `src/services/authService.js`: 인증 서비스 레이어
- `src/contexts/AuthContext.jsx`: 인증 상태 관리를 위한 React context
- `src/components/ProtectedRoute.jsx`: 라우트 보호 컴포넌트
- `src/components/LoginForm.jsx`: 로그인 UI 컴포넌트

### 토큰 관리

- 모든 API 요청은 자동으로 `Authorization: Bearer {token}` 헤더 포함
- 토큰은 localStorage에 'accessToken'으로 저장
- 사용자 정보는 localStorage에 'user'로 저장 (JSON 문자열)
- Refresh token 메커니즘 없음 - 토큰 만료 시 사용자는 재로그인 필요
- Spring 기반의 서버를 사용해서 REST API 통신을 진행합니다