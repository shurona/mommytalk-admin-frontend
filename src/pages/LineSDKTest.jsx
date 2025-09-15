import React, { useState, useEffect } from 'react';
import api from '../services/api';

const LineSDKTest = () => {
  const [loginResult, setLoginResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [serverIntegration, setServerIntegration] = useState(true); // 서버 통합 모드

  const LINE_CHANNEL_ID = import.meta.env.VITE_LINE_CHANNEL_ID;

  // 초기화 및 저장된 로그인 결과 확인
  useEffect(() => {
    // 저장된 로그인 결과 확인
    const savedResult = localStorage.getItem('line_server_result');
    if (savedResult) {
      try {
        setLoginResult(JSON.parse(savedResult));
      } catch (err) {
        console.error('저장된 결과 파싱 실패:', err);
        localStorage.removeItem('line_server_result');
      }
    }
  }, []);

  // 사용하지 않는 함수 (참고용으로 남김)
  const initializeLiff = async () => {
    // LIFF는 LINE 앱 내에서만 동작
    // 일반 웹사이트에서는 사용할 수 없음
    return;
  };

  // 서버 통합 방식 LINE 로그인
  const handleServerLineLogin = async () => {
    if (!LINE_CHANNEL_ID) {
      setError('VITE_LINE_CHANNEL_ID 환경변수가 설정되지 않았습니다.');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);

      const CALLBACK_URL = 'http://localhost:5174/line-server-callback';

      // CSRF 방지를 위한 state 생성
      const state = 'server-state-' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('line_server_state', state);
      
      // LINE OAuth 인증 URL 생성 (서버 콜백용)
      const params = new URLSearchParams({
        response_type: 'code',
        client_id: LINE_CHANNEL_ID,
        redirect_uri: CALLBACK_URL,
        state: state,
        scope: 'profile openid email'
      });
      
      // LINE 인증 페이지로 리다이렉트
      window.location.href = `https://access.line.me/oauth2/v2.1/authorize?${params.toString()}`;
      
    } catch (err) {
      setError(`로그인 준비 실패: ${err.message}`);
      setLoading(false);
    }
  };

  // 서버로 토큰 전송 (실제 구현 부분)
  const sendTokenToServer = async (accessToken, profile) => {
    try {
      // 📤 실제로는 이 부분에서 백엔드 API 호출
      const response = await fetch('/admin/v1/line/verify-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}` // 관리자 토큰
        },
        body: JSON.stringify({
          lineAccessToken: accessToken,
          clientProfile: profile // 클라이언트에서 받은 프로필 (참고용)
        })
      });

      if (!response.ok) {
        throw new Error('서버 토큰 검증 실패');
      }

      const result = await response.json();
      console.log('서버 검증 결과:', result);
      
    } catch (err) {
      console.warn('서버 토큰 검증 실패 (테스트 환경):', err.message);
      // 테스트 환경에서는 에러를 무시하고 계속 진행
    }
  };

  // 로그아웃
  const handleLogout = () => {
    setLoginResult(null);
    setError(null);
    localStorage.removeItem('line_server_result');
    localStorage.removeItem('line_server_state');
  };

  // 기존 사용자 정보 서버에서 조회
  const fetchCurrentLineUser = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/v1/line/profile');
      
      if (response.data.message === 'Success' && response.data.data) {
        const result = {
          profile: response.data.data.lineUser,
          serverData: response.data.data,
          loginTime: response.data.data.linkedAt,
          method: '서버에서 조회'
        };
        
        setLoginResult(result);
        localStorage.setItem('line_server_result', JSON.stringify(result));
      }
    } catch (err) {
      console.log('기존 LINE 사용자 정보 없음:', err.response?.data?.message);
      // 에러는 무시 (로그인되지 않은 상태가 정상)
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">🔗 LINE 서버 통합 테스트</h1>
        
        {/* 서버 통합 상태 */}
        <div className="bg-gray-50 border rounded-lg p-4 mb-6">
          <h3 className="font-medium mb-2">서버 통합 상태</h3>
          <div className="text-sm space-y-1">
            <div>Channel ID: {LINE_CHANNEL_ID ? '✅ 설정됨' : '❌ 미설정'}</div>
            <div>서버 통합 모드: {serverIntegration ? '✅ 활성화' : '❌ 비활성화'}</div>
            <div>콜백 URL: http://localhost:5174/line-server-callback</div>
            <div>필요한 서버 API: POST /admin/v1/line/callback</div>
          </div>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="text-red-800">{error}</div>
          </div>
        )}

        {/* 로그인 상태에 따른 UI */}
        {!loginResult ? (
          <div className="bg-white border rounded-lg p-6">
            <h2 className="text-lg font-medium mb-4">LINE 서버 통합 로그인</h2>
            
            {/* 서버 통합 플로우 설명 */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <h3 className="font-medium text-blue-900 mb-2">🔄 서버 통합 플로우</h3>
              <ol className="text-sm text-blue-800 space-y-1">
                <li>1️⃣ 프론트: LINE 인증 페이지로 리다이렉트</li>
                <li>2️⃣ 사용자: LINE에서 로그인 및 권한 동의</li>
                <li>3️⃣ LINE: Authorization Code를 콜백으로 전달</li>
                <li>4️⃣ 프론트: Code를 서버 API로 전달</li>
                <li>5️⃣ 서버: Code → Token 교환 및 사용자 정보 저장</li>
                <li>6️⃣ 프론트: 서버 응답으로 로그인 완료</li>
              </ol>
            </div>
            
            {/* 필요한 백엔드 API */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
              <h3 className="font-medium text-gray-900 mb-2">📋 필요한 백엔드 API</h3>
              <div className="text-sm text-gray-700 space-y-1">
                <div><code className="bg-gray-200 px-2 py-1 rounded">POST /admin/v1/line/callback</code> - OAuth 콜백 처리</div>
                <div><code className="bg-gray-200 px-2 py-1 rounded">GET /admin/v1/line/profile</code> - 연결된 LINE 사용자 조회</div>
                <div><code className="bg-gray-200 px-2 py-1 rounded">DELETE /admin/v1/line/unlink</code> - LINE 계정 연결 해제</div>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={handleServerLineLogin}
                disabled={loading || !LINE_CHANNEL_ID}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>처리 중...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755z"/>
                    </svg>
                    <span>서버 통합 로그인</span>
                  </>
                )}
              </button>
              
              <button
                onClick={fetchCurrentLineUser}
                disabled={loading}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>기존 정보 조회</span>
              </button>
            </div>
            
            {!LINE_CHANNEL_ID && (
              <div className="mt-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded p-3">
                <p>⚠️ VITE_LINE_CHANNEL_ID 환경변수가 설정되지 않았습니다.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium">로그인 성공 ✅</h2>
              <button
                onClick={handleLogout}
                className="text-red-600 hover:text-red-800 text-sm"
              >
                로그아웃
              </button>
            </div>
            
            {/* 사용자 정보 표시 */}
            {loginResult.profile && (
              <div className="space-y-3">
                {loginResult.profile.pictureUrl && (
                  <div className="flex justify-center">
                    <img
                      src={loginResult.profile.pictureUrl}
                      alt="프로필 사진"
                      className="w-16 h-16 rounded-full"
                    />
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">이름:</span>
                    <div className="font-medium">{loginResult.profile.displayName}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">사용자 ID:</span>
                    <div className="font-mono text-xs">{loginResult.profile.userId}</div>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-500">로그인 방식:</span>
                    <div className="font-medium">{loginResult.method}</div>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-500">Access Token:</span>
                    <div className="font-mono text-xs bg-gray-100 p-2 rounded break-all">
                      {loginResult.accessToken?.substring(0, 50)}...
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* 원시 데이터 표시 */}
            <details className="mt-4">
              <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                원시 데이터 보기
              </summary>
              <pre className="mt-2 bg-gray-100 p-3 rounded text-xs overflow-x-auto">
                {JSON.stringify(loginResult, null, 2)}
              </pre>
            </details>
          </div>
        )}
      </div>
    </div>
  );
};

export default LineSDKTest;