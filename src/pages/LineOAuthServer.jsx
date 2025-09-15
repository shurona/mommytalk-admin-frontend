import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';

const LineOAuthServer = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

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
      const savedState = localStorage.getItem('line_server_state');
      if (!savedState || savedState !== state) {
        setStatus('error');
        setError('Invalid state parameter. CSRF 공격 시도로 의심됩니다.');
        return;
      }
    

      try {
        // ✅ 서버 API 호출 (Code를 서버로 전달)
        const response = await api.post('/admin/v1/line/callback', {
          code: code,
          state: state,
          redirectUri: 'http://localhost:5174/line-oauth-server'
        });

        if (response.data.message === 'Success') {
          const loginResult = {
            profile: response.data.data.lineUser,
            serverResponse: response.data.data,
            loginTime: new Date().toISOString(),
            method: '서버 통합 방식'
          };

          // localStorage에 결과 저장
          localStorage.setItem('line_login_result', JSON.stringify(loginResult));
          localStorage.removeItem('line_login_state');

          setStatus('success');
          setResult(loginResult);

          // 3초 후 테스트 페이지로 리다이렉트
          setTimeout(() => {
            navigate('/line-login-test');
          }, 3000);
        } else {
          throw new Error(response.data.message);
        }

      } catch (err) {
        setStatus('error');
        if (err.response?.data?.message) {
          setError(`서버 에러: ${err.response.data.message}`);
        } else {
          setError(`네트워크 에러: ${err.message}`);
        }
        console.error('LINE OAuth Server Error:', err);
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
        {status === 'loading' && (
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
            <h2 className="text-lg font-medium text-gray-900 mb-2">서버에서 LINE 로그인 처리 중...</h2>
            <p className="text-sm text-gray-600">Authorization Code를 서버로 전달하고 있습니다.</p>
          </div>
        )}

        {status === 'success' && (
          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-lg font-medium text-gray-900 mb-2">서버 통합 로그인 성공! ✅</h2>
            <p className="text-sm text-gray-600 mb-4">3초 후 테스트 페이지로 이동합니다.</p>
            
            {result?.profile && (
              <div className="bg-gray-50 rounded-lg p-4 text-left">
                <h3 className="text-sm font-medium text-gray-700 mb-2">서버에서 저장된 사용자 정보</h3>
                <div className="space-y-1 text-sm">
                  <div>이름: {result.profile.displayName}</div>
                  <div>ID: {result.profile.lineUserId || result.profile.userId}</div>
                  {result.profile.email && <div>이메일: {result.profile.email}</div>}
                  <div className="text-green-600 font-medium">
                    ✅ 서버 DB에 저장 완료
                  </div>
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
            <h2 className="text-lg font-medium text-gray-900 mb-2">서버 통합 로그인 실패</h2>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
            
            {/* 디버깅 정보 */}
            <details className="mt-4 text-left">
              <summary className="cursor-pointer text-sm text-gray-500">디버깅 정보</summary>
              <div className="mt-2 text-xs bg-gray-100 p-2 rounded">
                <div>Code: {searchParams.get('code')?.substring(0, 20)}...</div>
                <div>State: {searchParams.get('state')}</div>
                <div>Expected API: POST /admin/v1/line/callback</div>
              </div>
            </details>
            
            <button
              onClick={() => navigate('/line-login-test')}
              className="mt-4 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm"
            >
              다시 시도하기
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LineOAuthServer;