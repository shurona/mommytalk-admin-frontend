import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const LineOAuth = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const LINE_CHANNEL_ID = import.meta.env.VITE_LINE_CHANNEL_ID;
  const LINE_CHANNEL_SECRET = import.meta.env.VITE_LINE_CHANNEL_SECRET;

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const error_code = searchParams.get('error');
      const error_description = searchParams.get('error_description');

      // 에러가 있는 경우
      if (error_code) {
        setStatus('error');
        setError(`${error_code}: ${error_description}`);
        return;
      }

      // 필수 파라미터 확인
      if (!code || !state) {
        setStatus('error');
        setError('Authorization code 또는 state 파라미터가 없습니다.');
        return;
      }

      // State 검증 (CSRF 방지)
      const savedState = localStorage.getItem('line_login_state');
      if (!savedState || savedState !== state) {
        setStatus('error');
        setError('Invalid state parameter. CSRF 공격 시도로 의심됩니다.');
        return;
      }

      try {
        // 1. Access Token 요청
        const tokenResponse = await fetch('https://api.line.me/oauth2/v2.1/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: 'http://localhost:5174/line-oauth',
            client_id: LINE_CHANNEL_ID,
            client_secret: LINE_CHANNEL_SECRET,
          }),
        });

        if (!tokenResponse.ok) {
          const errorData = await tokenResponse.text();
          // 토큰 발급 실패 시 에러 처리
          throw new Error(`Token request failed: ${errorData}`);
        }

        const tokenData = await tokenResponse.json();
        
        // 2. 프로필 정보 요청 (토큰으로 검증 겸)
        const profileResponse = await fetch('https://api.line.me/v2/profile', {
          headers: {
            'Authorization': `Bearer ${tokenData.access_token}`,
          },
        });

        if (!profileResponse.ok) {
          const errorData = await profileResponse.text();
          throw new Error(`Profile request failed: ${errorData}`);
        }

        const profileData = await profileResponse.json();

        // 3. ID Token 검증 (있는 경우)
        let idTokenData = null;
        if (tokenData.id_token) {
          try {
            const payload = tokenData.id_token.split('.')[1];
            const decoded = JSON.parse(atob(payload));
            idTokenData = decoded;
          } catch (err) {
            console.warn('ID Token 파싱 실패:', err);
          }
        }

        const loginResult = {
          profile: profileData,
          tokens: tokenData,
          idToken: idTokenData,
          loginTime: new Date().toISOString(),
          // ✅ 실제로는 이 토큰을 서버에 전달해서 검증받아야 함
          note: '실제 구현시에는 access_token을 서버로 전달하여 검증받아야 합니다.'
        };

        // localStorage에 결과 저장
        localStorage.setItem('line_login_result', JSON.stringify(loginResult));
        localStorage.setItem('line_access_token', tokenData.access_token);
        localStorage.removeItem('line_login_state');

        setStatus('success');
        setResult(loginResult);

        // 3초 후 테스트 페이지로 리다이렉트
        setTimeout(() => {
          navigate('/line-login-test');
        }, 3000);

      } catch (err) {
        setStatus('error');
        setError(err.message);
        console.error('LINE OAuth Error:', err);
      }
    };
    

    handleCallback();
  }, [searchParams, navigate, LINE_CHANNEL_ID, LINE_CHANNEL_SECRET]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
        {status === 'loading' && (
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
            <h2 className="text-lg font-medium text-gray-900 mb-2">LINE 로그인 처리 중...</h2>
            <p className="text-sm text-gray-600">사용자 정보를 가져오고 있습니다.</p>
          </div>
        )}

        {status === 'success' && (
          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-lg font-medium text-gray-900 mb-2">로그인 성공!</h2>
            <p className="text-sm text-gray-600 mb-4">3초 후 테스트 페이지로 이동합니다.</p>
            
            {result?.profile && (
              <div className="bg-gray-50 rounded-lg p-4 text-left">
                <h3 className="text-sm font-medium text-gray-700 mb-2">사용자 정보</h3>
                <div className="space-y-1 text-sm">
                  <div>이름: {result.profile.displayName}</div>
                  <div>ID: {result.profile.userId}</div>
                  {result.profile.email && <div>이메일: {result.profile.email}</div>}
                </div>
              </div>
            )}
            
            <button
              onClick={() => navigate('/line-login-test')}
              className="mt-4 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm"
            >
              지금 이동하기
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-lg font-medium text-gray-900 mb-2">로그인 실패</h2>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
            <button
              onClick={() => navigate('/line-login-test')}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm"
            >
              다시 시도하기
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LineOAuth;