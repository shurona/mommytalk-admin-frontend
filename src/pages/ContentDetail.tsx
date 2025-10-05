import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Trash2 } from "lucide-react";
import type {
  ContentDetail,
  Channel,
  MessageLogDetail
} from "../types";
import { statusLabels, statusStyles, sendStatusLabels, sendStatusStyles } from "../types/contentList";
import { getContentDetail, getMessageDetails, deleteContent } from "../services/contentDetailService";

interface ContentDetailProps {
  selectedChannel: Channel | null;
}


export default function ContentDetail({ selectedChannel }: ContentDetailProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [content, setContent] = useState<ContentDetail | null>(null);
  const [loading, setLoading] = useState(true);

  // 선택된 레벨 조합 (기본값: 1_1)
  const [selectedLevel, setSelectedLevel] = useState<keyof typeof content.contentInfo | '1_1'>('1_1');

  // 메시지 로그 페이징 상태
  const [messageLogs, setMessageLogs] = useState<MessageLogDetail[]>([]);
  const [logPage, setLogPage] = useState(0);
  const [logPageSize] = useState(20);
  const [logTotalPages, setLogTotalPages] = useState(0);
  const [logTotalElements, setLogTotalElements] = useState(0);
  const [logsLoading, setLogsLoading] = useState(false);

  // 콘텐츠 상세 조회
  useEffect(() => {
    if (id && selectedChannel) {
      loadContentDetail();
    }
  }, [id, selectedChannel]);

  // 메시지 로그 로드
  useEffect(() => {
    if (content && selectedChannel) {
      loadMessageLogs(logPage);
    }
  }, [content, logPage, selectedChannel]);

  const loadContentDetail = async () => {
    if (!id || !selectedChannel) return;

    try {
      setLoading(true);
      const data = await getContentDetail(selectedChannel.channelId, Number(id));
      setContent(data);
    } catch (error) {
      console.error('콘텐츠 조회 실패:', error);
      alert('콘텐츠를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const loadMessageLogs = async (page: number) => {
    if (!content || !selectedChannel) return;

    try {
      setLogsLoading(true);
      const response = await getMessageDetails(
        selectedChannel.channelId,
        content.id,
        page,
        logPageSize
      );
      setMessageLogs(response.content);
      setLogTotalPages(response.totalPages);
      setLogTotalElements(response.totalElements);
    } catch (error) {
      console.error('메시지 로그 조회 실패:', error);
    } finally {
      setLogsLoading(false);
    }
  };

  const handleBack = () => {
    navigate("/content-list");
  };

  const handleDelete = async () => {
    if (!content || !selectedChannel) return;

    if (confirm("정말 발송을 취소하시겠습니까?")) {
      try {
        await deleteContent(selectedChannel.channelId, content.id);
        alert("발송이 취소되었습니다.");
        navigate("/content-list");
      } catch (error) {
        console.error('발송 취소 실패:', error);
        alert("발송 취소에 실패했습니다.");
      }
    }
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleLogPageChange = (newPage: number) => {
    if (newPage >= 0 && newPage < logTotalPages) {
      setLogPage(newPage);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
          <p className="text-gray-500">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="p-6">
        <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
          <p className="text-gray-500">콘텐츠를 찾을 수 없습니다.</p>
          <button
            onClick={handleBack}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            목록으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={handleBack}
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          목록으로
        </button>
        <h1 className="text-2xl font-bold text-gray-900">콘텐츠 상세 정보</h1>
        <div className="w-24"></div>
      </div>

      {/* 기본 정보 */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">📌 기본 정보</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <div className="text-xs text-gray-500 mb-1">ID</div>
            <div className="font-medium">#{content.id}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">주제</div>
            <div className="font-medium">{content.theme}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">상태</div>
            <span className={`px-2 py-1 text-xs rounded-full ${statusStyles[content.status]}`}>
              {statusLabels[content.status]}
            </span>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">발송 예정일</div>
            <div className="font-medium">{content.deliveryDate}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">생성일시</div>
            <div className="font-medium">{formatDate(content.createdAt)}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">수정일시</div>
            <div className="font-medium">{formatDate(content.updatedAt)}</div>
          </div>
        </div>
      </div>

      {/* 메시지 미리보기 */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">💬 메시지 미리보기</h2>

        <div className="flex gap-6">
          {/* 왼쪽: 레벨 선택 바둑판 (30%) */}
          <div className="w-[30%] flex-shrink-0">
            <div className="text-sm font-medium text-gray-700 mb-3">레벨 조합 선택</div>
            <table className="border-collapse border border-gray-300 rounded-lg overflow-hidden">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 px-2 py-3 text-xs font-medium text-gray-600"></th>
                  <th className="border border-gray-300 px-2 py-3 text-xs font-medium text-gray-600">자녀 Lv1</th>
                  <th className="border border-gray-300 px-2 py-3 text-xs font-medium text-gray-600">자녀 Lv2</th>
                  <th className="border border-gray-300 px-2 py-3 text-xs font-medium text-gray-600">자녀 Lv3</th>
                </tr>
              </thead>
              <tbody>
                {[1, 2, 3].map((userLevel) => (
                  <tr key={userLevel}>
                    <td className="border border-gray-300 px-2 py-3 text-xs font-medium text-gray-600 bg-gray-50">
                      사용자 Lv{userLevel}
                    </td>
                    {[1, 2, 3].map((childLevel) => {
                      const levelKey = `${userLevel}_${childLevel}` as keyof typeof content.contentInfo;
                      const isSelected = selectedLevel === levelKey;
                      return (
                        <td key={levelKey} className="border border-gray-300 p-0">
                          <button
                            onClick={() => setSelectedLevel(levelKey)}
                            className={`w-full h-full px-2 py-3 text-base font-medium transition-colors ${
                              isSelected
                                ? 'bg-blue-500 text-white hover:bg-blue-600'
                                : 'bg-white text-gray-700 hover:bg-blue-50'
                            }`}
                          >
                            {userLevel}×{childLevel}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 오른쪽: 선택된 레벨의 메시지 (70%) */}
          <div className="w-[70%] flex-shrink-0">
            <div className="text-sm font-medium text-gray-700 mb-3">
              선택된 레벨: 사용자 Lv{selectedLevel.split('_')[0]} × 자녀 Lv{selectedLevel.split('_')[1]}
            </div>
            <div className="bg-gradient-to-b from-blue-50 to-white rounded-lg p-6 border border-blue-100 min-h-[300px]">
              <div className="bg-white rounded-lg shadow p-4 border">
                <div className="whitespace-pre-wrap text-sm leading-relaxed">
                  {content.contentInfo[selectedLevel] || '메시지가 없습니다.'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 발송 정보 (메시지 로그) */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">📤 발송 정보</h2>
          <div className="text-sm text-gray-600">
            총 {logTotalElements.toLocaleString()}건
          </div>
        </div>

        {/* 메시지 로그 테이블 */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">SNS ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">사용자 레벨</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">자녀 레벨</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">발송 상태</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">발송 시간</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {logsLoading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    로딩 중...
                  </td>
                </tr>
              ) : messageLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    발송 기록이 없습니다.
                  </td>
                </tr>
              ) : (
                messageLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">{log.id}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{log.snsId}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">Lv {log.userLevel}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">Lv {log.childLevel}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs rounded-full ${sendStatusStyles[log.sendStatus]}`}>
                        {sendStatusLabels[log.sendStatus]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {log.sentAt ? formatDate(log.sentAt) : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 페이지네이션 */}
        {logTotalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50 mt-4">
            <div className="text-sm text-gray-700">
              페이지 {logPage + 1} / {logTotalPages}
            </div>
            <div className="flex items-center space-x-1">
              <button
                onClick={() => handleLogPageChange(logPage - 1)}
                disabled={logPage === 0}
                className="px-3 py-1 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
              >
                이전
              </button>

              {Array.from({ length: Math.min(10, logTotalPages) }, (_, i) => {
                const startPage = Math.floor(logPage / 10) * 10;
                const pageNum = startPage + i;
                if (pageNum >= logTotalPages) return null;
                return (
                  <button
                    key={pageNum}
                    onClick={() => handleLogPageChange(pageNum)}
                    className={`px-3 py-1 text-sm border rounded hover:bg-gray-100 ${
                      logPage === pageNum ? 'bg-blue-500 text-white hover:bg-blue-600' : ''
                    }`}
                  >
                    {pageNum + 1}
                  </button>
                );
              })}

              <button
                onClick={() => handleLogPageChange(logPage + 1)}
                disabled={logPage >= logTotalPages - 1}
                className="px-3 py-1 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
              >
                다음
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 액션 버튼 */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">🛠️ 액션</h2>
        <div className="flex gap-3">
          <button
            onClick={handleDelete}
            className="flex items-center px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            발송 취소
          </button>
        </div>
      </div>
    </div>
  );
}
