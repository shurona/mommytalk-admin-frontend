import { useState, useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import type { Channel, TestUser } from '../types';
import { testUserService } from '../services/testUserService';

interface TestUserManagementProps {
  selectedChannel: Channel | null;
}

export default function TestUserManagement({ selectedChannel }: TestUserManagementProps) {
  const [testUsers, setTestUsers] = useState<TestUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // 테스트 유저 목록 로드
  useEffect(() => {
    if (selectedChannel) {
      loadTestUsers();
    }
  }, [selectedChannel]);

  const loadTestUsers = async () => {
    if (!selectedChannel) return;

    try {
      setLoading(true);
      const data = await testUserService.getTestUsers(selectedChannel.channelId);
      setTestUsers(data);
    } catch (error) {
      console.error('테스트 유저 목록 조회 실패:', error);
      alert('테스트 유저 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTestUser = async () => {
    if (!selectedChannel) return;
    if (!phoneNumber.trim()) {
      alert('전화번호를 입력해주세요.');
      return;
    }

    try {
      setIsAdding(true);
      await testUserService.addTestUser(selectedChannel.channelId, {
        phoneNumber: phoneNumber.trim()
      });
      alert('테스트 유저가 추가되었습니다.');
      setPhoneNumber('');
      await loadTestUsers();
    } catch (error: any) {
      console.error('테스트 유저 추가 실패:', error);
      const errorMessage = error.response?.data?.message || '테스트 유저 추가에 실패했습니다.';
      alert(errorMessage);
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteTestUser = async (userId: number, phoneNumber: string) => {
    if (!selectedChannel) return;

    if (!confirm(`${phoneNumber}을(를) 테스트 유저에서 삭제하시겠습니까?`)) {
      return;
    }

    try {
      await testUserService.deleteTestUser(selectedChannel.channelId, userId);
      alert('테스트 유저가 삭제되었습니다.');
      await loadTestUsers();
    } catch (error) {
      console.error('테스트 유저 삭제 실패:', error);
      alert('테스트 유저 삭제에 실패했습니다.');
    }
  };

  if (!selectedChannel) {
    return (
      <div className="p-6">
        <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
          <p className="text-gray-500">채널을 선택해주세요.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* 헤더 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">테스트 발송 대상</h1>
        <p className="text-sm text-gray-500 mt-1">
          테스트 메시지를 발송할 대상을 관리합니다.
        </p>
      </div>

      {/* 테스트 유저 추가 입력 */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">테스트 유저 추가</h2>
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="전화번호 (예: 010-1234-5678)"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !isAdding) {
                handleAddTestUser();
              }
            }}
            className="flex-1 px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isAdding}
          />
          <button
            onClick={handleAddTestUser}
            disabled={isAdding || !phoneNumber.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isAdding ? '추가 중...' : '입력'}
          </button>
        </div>
      </div>

      {/* 테스트 유저 목록 */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          테스트 유저 목록 ({testUsers?.length || 0}명)
        </h2>

        {loading ? (
          <div className="py-12 text-center text-gray-500">로딩 중...</div>
        ) : !testUsers || testUsers.length === 0 ? (
          <div className="py-12 text-center text-gray-500">
            등록된 테스트 유저가 없습니다.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    어드민 전화번호
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    소셜 아이디
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    삭제 요청
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {testUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {user.phoneNumber}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {user.socialId}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleDeleteTestUser(user.id, user.phoneNumber)}
                        className="inline-flex items-center px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        삭제
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
