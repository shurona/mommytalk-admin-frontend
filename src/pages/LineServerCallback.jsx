import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';

const LineServerCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  useEffect(() => {
    const handleServerCallback = async () => {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const error_code = searchParams.get('error');
      const error_description = searchParams.get('error_description');

      console.log("코드 : " + code + " 스테이트 : " + state);
      // 에러가 있는 경우
      if (error_code) {
        setStatus('error');
        setError(`LINE 인증 실패: ${error_code} - ${error_description}`);
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
        setError('Invalid state parameter. 보안 검증에 실패했습니다.');
        return;
      }

      try {
        // 🚀 서버 API 호출 - Authorization Code를 서버로 전달
        const response = await api.post('/admin/v1/line/callback', {
          code: code,
          state: state,
          redirectUri: 'http://localhost:5174/line-server-callback'
        }, {
          headers: {
            'Content-Type': 'application/json'  // 명시적 설정
          }
        });

        if (response.data.message === 'Success') {
          const loginResult = {
            profile: response.data.data.lineUser,
            serverData: response.data.data,
            loginTime: new Date().toISOString(),
            method: '서버 통합 방식',
            isNewUser: response.data.data.isNewUser
          };

          // localStorage에 결과 저장
          localStorage.setItem('line_server_result', JSON.stringify(loginResult));
          localStorage.removeItem('line_server_state');

          setStatus('success');
          setResult(loginResult);

          // 3초 후 테스트 페이지로 리다이렉트
          setTimeout(() => {
            navigate('/line-sdk-test');
          }, 3000);
        } else {
          throw new Error(response.data.message || '서버 응답 오류');
        }

      } catch (err) {
        setStatus('error');
        
        // 에러 타입별 메시지 처리
        if (err.response?.status === 401) {
          setError('관리자 인증이 필요합니다. 로그인을 다시 해주세요.');
        } else if (err.response?.status === 400) {
          setError(`요청 오류: ${err.response.data?.message || '잘못된 요청입니다.'}`);
        } else if (err.response?.status === 500) {
          setError('서버 내부 오류가 발생했습니다. 개발팀에 문의해주세요.');
        } else if (err.code === 'NETWORK_ERROR') {
          setError('네트워크 연결을 확인해주세요.');
        } else {
          setError(`알 수 없는 오류: ${err.message}`);
        }
        
        console.error('LINE Server Callback Error:', err);
      }
    };

    handleServerCallback();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
        {status === 'loading' && (
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
            <h2 className="text-lg font-medium text-gray-900 mb-2">서버에서 LINE 로그인 처리 중...</h2>
            <div className="text-sm text-gray-600 space-y-1">
              <p>• Authorization Code를 서버로 전달</p>
              <p>• 서버에서 Access Token 교환</p>
              <p>• 사용자 정보 조회 및 DB 저장</p>
            </div>
          </div>
        )}

        {status === 'success' && (
          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-lg font-medium text-gray-900 mb-2">
              {result?.isNewUser ? '새 사용자 등록 완료! 🎉' : '로그인 성공! ✅'}
            </h2>
            <p className="text-sm text-gray-600 mb-4">3초 후 테스트 페이지로 이동합니다.</p>
            
            {result?.profile && (
              <div className="bg-gray-50 rounded-lg p-4 text-left mb-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  서버에서 {result.isNewUser ? '저장된' : '업데이트된'} 사용자 정보
                </h3>
                <div className="space-y-1 text-sm">
                  <div>이름: {result.profile.displayName}</div>
                  <div>LINE ID: {result.profile.lineUserId || result.profile.userId}</div>
                  {result.profile.email && <div>이메일: {result.profile.email}</div>}
                  <div className="text-green-600 font-medium">
                    ✅ 서버 DB에 {result.isNewUser ? '신규 저장' : '정보 업데이트'} 완료
                  </div>
                </div>
              </div>
            )}
            
            <button
              onClick={() => navigate('/line-sdk-test')}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm"
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
              <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                디버깅 정보 보기
              </summary>
              <div className="mt-2 text-xs bg-gray-100 p-3 rounded space-y-1">
                <div><strong>Code:</strong> {searchParams.get('code')?.substring(0, 30)}...</div>
                <div><strong>State:</strong> {searchParams.get('state')}</div>
                <div><strong>Expected API:</strong> POST /admin/v1/line/callback</div>
                <div><strong>Callback URL:</strong> http://localhost:5174/line-server-callback</div>
                <div><strong>Required Headers:</strong> Authorization: Bearer [admin_token]</div>
              </div>
            </details>
            
            <button
              onClick={() => navigate('/line-sdk-test')}
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

export default LineServerCallback;