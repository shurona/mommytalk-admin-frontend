import React, { useState, useEffect } from 'react';

const LineLoginTest = () => {
  const [loginResult, setLoginResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 환경변수에서 LINE 설정값 가져오기
  const LINE_CHANNEL_ID = import.meta.env.VITE_LINE_CHANNEL_ID;
  const CALLBACK_URL = 'http://localhost:5174/line-oauth';
  const STATE = 'test-state-' + Math.random().toString(36).substr(2, 9);

  // 라인 로그인 URL 생성
  const getLineLoginUrl = () => {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: LINE_CHANNEL_ID,
      redirect_uri: CALLBACK_URL,
      state: STATE,
      scope: 'profile openid email'
    });
    
    return `https://access.line.me/oauth2/v2.1/authorize?${params.toString()}`;
  };

  // 라인 로그인 시작
  const handleLineLogin = () => {
    if (!LINE_CHANNEL_ID) {
      setError('VITE_LINE_CHANNEL_ID 환경변수가 설정되지 않았습니다.');
      return;
    }
    
    // state 값을 localStorage에 저장 (CSRF 방지)
    localStorage.setItem('line_login_state', STATE);
    
    // 라인 로그인 페이지로 리다이렉트
    window.location.href = getLineLoginUrl();
  };

  // 로그아웃
  const handleLogout = () => {
    setLoginResult(null);
    setError(null);
    localStorage.removeItem('line_access_token');
    localStorage.removeItem('line_login_state');
  };

  // 컴포넌트 마운트 시 localStorage에서 이전 로그인 결과 확인
  useEffect(() => {
    const savedResult = localStorage.getItem('line_login_result');
    if (savedResult) {
      try {
        setLoginResult(JSON.parse(savedResult));
      } catch (err) {
        console.error('Failed to parse saved login result:', err);
        localStorage.removeItem('line_login_result');
      }
    }
  }, []);

  return (
    <div className="p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">🔗 LINE 로그인 테스트</h1>
        
        {/* 환경변수 확인 */}
        <div className="bg-gray-50 border rounded-lg p-4 mb-6">
          <h3 className="font-medium mb-2">환경변수 설정 상태</h3>
          <div className="text-sm space-y-1">
            <div>Channel ID: {LINE_CHANNEL_ID ? '✅ 설정됨' : '❌ 미설정'}</div>
            <div>Callback URL: {CALLBACK_URL}</div>
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
            <h2 className="text-lg font-medium mb-4">LINE 로그인</h2>
            <p className="text-gray-600 mb-4">
              LINE 계정으로 로그인하여 프로필 정보를 가져올 수 있습니다.
            </p>
            <button
              onClick={handleLineLogin}
              disabled={!LINE_CHANNEL_ID}
              className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.28-.63.626-.63.352 0 .63.285.63.63v4.771z"/>
              </svg>
              <span>LINE으로 로그인</span>
            </button>
            
            {!LINE_CHANNEL_ID && (
              <div className="mt-4 text-sm text-gray-500">
                <p>먼저 .env 파일에 다음을 설정해주세요:</p>
                <pre className="mt-2 bg-gray-100 p-2 rounded text-xs">
                  VITE_LINE_CHANNEL_ID=your_channel_id
                </pre>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium">로그인 성공</h2>
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
                  {loginResult.profile.email && (
                    <div className="col-span-2">
                      <span className="text-gray-500">이메일:</span>
                      <div className="font-medium">{loginResult.profile.email}</div>
                    </div>
                  )}
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

export default LineLoginTest;