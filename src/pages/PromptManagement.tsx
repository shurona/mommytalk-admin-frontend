import { useState, useEffect } from "react";
import { History, Plus, Trash2 } from "lucide-react";
import { promptService } from "../services/promptService";
import type { Channel } from "../types";
import {
  PromptType,
  type PromptHistoryItem,
  type InsertPromptRequest,
  type UpdatePromptRequest
} from "../types/prompt";

interface PromptManagementProps {
  selectedChannel: Channel | null;
}

export default function PromptManagement({ selectedChannel }: PromptManagementProps) {
  // BASIC 프롬프트 상태
  const [basicPromptId, setBasicPromptId] = useState<number | null>(null);
  const [basicPrompt, setBasicPrompt] = useState<string>("");
  const [basicLabel, setBasicLabel] = useState<string>("");
  const [basicHistory, setBasicHistory] = useState<PromptHistoryItem[]>([]);
  const [selectedBasicHistory, setSelectedBasicHistory] = useState<number | null>(null);

  // ADVANCE 프롬프트 상태
  const [advancePromptId, setAdvancePromptId] = useState<number | null>(null);
  const [advancePrompt, setAdvancePrompt] = useState<string>("");
  const [advanceLabel, setAdvanceLabel] = useState<string>("");
  const [advanceHistory, setAdvanceHistory] = useState<PromptHistoryItem[]>([]);
  const [selectedAdvanceHistory, setSelectedAdvanceHistory] = useState<number | null>(null);

  // 모달 상태
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [createType, setCreateType] = useState<PromptType>(PromptType.BASIC);
  const [createLabel, setCreateLabel] = useState<string>("");
  const [createPrompt, setCreatePrompt] = useState<string>("");

  // API 상태 관리
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // 채널별 데이터 로드
  useEffect(() => {
    if (selectedChannel?.channelId) {
      loadPromptData();
    }
  }, [selectedChannel]);

  // 프롬프트 목록 및 히스토리 조회
  const loadPromptData = async () => {
    if (!selectedChannel?.channelId) return;

    try {
      setLoading(true);
      setError(null);

      const [prompts, history] = await Promise.all([
        promptService.getPrompts(selectedChannel.channelId),
        promptService.getPromptHistory(selectedChannel.channelId)
      ]);

      // BASIC 프롬프트 초기화
      const basicPromptData = prompts.find(p => p.type === PromptType.BASIC);
      if (basicPromptData) {
        setBasicPromptId(basicPromptData.id);
        setBasicPrompt(basicPromptData.prompt);
        // 히스토리에서 selected=true인 항목의 label 찾기
        const selectedItem = history.basicPrompt.find(h => h.selected);
        setBasicLabel(selectedItem?.label || "");
      } else {
        setBasicPromptId(null);
        setBasicPrompt("");
        setBasicLabel("");
      }

      // ADVANCE 프롬프트 초기화
      const advancePromptData = prompts.find(p => p.type === PromptType.ADVANCE);
      if (advancePromptData) {
        setAdvancePromptId(advancePromptData.id);
        setAdvancePrompt(advancePromptData.prompt);
        const selectedItem = history.advancePrompt.find(h => h.selected);
        setAdvanceLabel(selectedItem?.label || "");
      } else {
        setAdvancePromptId(null);
        setAdvancePrompt("");
        setAdvanceLabel("");
      }

      // 히스토리 초기화
      setBasicHistory(history.basicPrompt);
      setAdvanceHistory(history.advancePrompt);

      // 선택된 히스토리 초기화 (등록된 항목으로)
      const selectedBasic = history.basicPrompt.find(h => h.selected);
      if (selectedBasic) {
        setSelectedBasicHistory(selectedBasic.id);
      }
      const selectedAdvance = history.advancePrompt.find(h => h.selected);
      if (selectedAdvance) {
        setSelectedAdvanceHistory(selectedAdvance.id);
      }

    } catch (err: any) {
      console.error('프롬프트 로드 실패:', err);
      setError(err.response?.data?.message || '프롬프트를 불러오는데 실패했습니다.');
      // 에러 발생 시 초기화
      setBasicPrompt("");
      setBasicLabel("");
      setAdvancePrompt("");
      setAdvanceLabel("");
    } finally {
      setLoading(false);
    }
  };

  // 히스토리 항목 클릭
  const handleHistoryClick = async (type: PromptType, item: PromptHistoryItem) => {
    if (!selectedChannel?.channelId) return;

    try {
      setLoading(true);
      // 프롬프트 상세 조회
      const promptData = await promptService.getPromptById(selectedChannel.channelId, item.id);

      if (type === PromptType.BASIC) {
        setSelectedBasicHistory(item.id);
        setBasicPromptId(promptData.id);
        setBasicLabel(item.label);
        setBasicPrompt(promptData.prompt || "");
      } else {
        setSelectedAdvanceHistory(item.id);
        setAdvancePromptId(promptData.id);
        setAdvanceLabel(item.label);
        setAdvancePrompt(promptData.prompt || "");
      }
    } catch (err: any) {
      console.error('프롬프트 상세 조회 실패:', err);
      alert(err.response?.data?.message || '프롬프트를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 프롬프트 생성 모달 열기
  const handleOpenCreateModal = (type: PromptType) => {
    setCreateType(type);
    setCreateLabel("");
    setCreatePrompt("");
    setShowCreateModal(true);
  };

  // 프롬프트 생성
  const handleCreatePrompt = async () => {
    if (!selectedChannel?.channelId || !createLabel.trim() || !createPrompt.trim()) {
      alert('라벨과 프롬프트를 입력해주세요.');
      return;
    }

    try {
      setLoading(true);
      const request: InsertPromptRequest = {
        label: createLabel.trim(),
        prompt: createPrompt.trim(),
        type: createType
      };

      const promptId = await promptService.insertPrompt(selectedChannel.channelId, request);

      // 생성 성공 시 모달 닫고 데이터 새로고침
      setShowCreateModal(false);
      await loadPromptData();

      // 생성된 프롬프트를 현재 선택으로 표시
      if (createType === PromptType.BASIC) {
        setBasicPromptId(promptId);
        setBasicPrompt(createPrompt.trim());
        setBasicLabel(createLabel.trim());
      } else {
        setAdvancePromptId(promptId);
        setAdvancePrompt(createPrompt.trim());
        setAdvanceLabel(createLabel.trim());
      }

      alert('프롬프트가 생성되었습니다.');
    } catch (err: any) {
      console.error('프롬프트 생성 실패:', err);
      alert(err.response?.data?.message || '프롬프트 생성에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 프롬프트 수정
  const handleUpdatePrompt = async (type: PromptType) => {
    if (!selectedChannel?.channelId) return;

    const promptId = type === PromptType.BASIC ? basicPromptId : advancePromptId;
    const label = type === PromptType.BASIC ? basicLabel : advanceLabel;
    const prompt = type === PromptType.BASIC ? basicPrompt : advancePrompt;

    if (!promptId) {
      alert('수정할 프롬프트를 선택해주세요.');
      return;
    }

    if (!label.trim() || !prompt.trim()) {
      alert('라벨과 프롬프트를 입력해주세요.');
      return;
    }

    try {
      setLoading(true);
      const request: UpdatePromptRequest = {
        label: label.trim(),
        prompt: prompt.trim()
      };

      await promptService.updatePrompt(selectedChannel.channelId, promptId, request);
      await loadPromptData();

      alert('프롬프트가 수정되었습니다.');
    } catch (err: any) {
      console.error('프롬프트 수정 실패:', err);
      alert(err.response?.data?.message || '프롬프트 수정에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 프롬프트 등록 (선택/활성화)
  const handleRegisterPrompt = async (type: PromptType) => {
    if (!selectedChannel?.channelId) return;

    const promptId = type === PromptType.BASIC ? basicPromptId : advancePromptId;

    if (!promptId) {
      alert('등록할 프롬프트를 선택해주세요.');
      return;
    }

    try {
      setLoading(true);
      await promptService.registerPrompt(selectedChannel.channelId, promptId);
      await loadPromptData();

      alert('프롬프트가 등록되었습니다.');
    } catch (err: any) {
      console.error('프롬프트 등록 실패:', err);
      alert(err.response?.data?.message || '프롬프트 등록에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 프롬프트 삭제
  const handleDeletePrompt = async (type: PromptType, item: PromptHistoryItem, e: React.MouseEvent) => {
    e.stopPropagation(); // 히스토리 클릭 이벤트 방지

    if (!selectedChannel?.channelId) return;

    const history = type === PromptType.BASIC ? basicHistory : advanceHistory;
    const typeName = type === PromptType.BASIC ? "콘텐츠 생성" : "응용표현";

    // 검증 1: 현재 등록된 프롬프트는 삭제 불가
    if (item.selected) {
      alert('현재 등록된 프롬프트는 삭제할 수 없습니다.');
      return;
    }

    // 검증 2: 최소 1개는 남겨두기
    if (history.length <= 1) {
      alert(`${typeName} 프롬프트는 최소 1개 이상 유지되어야 합니다.`);
      return;
    }

    // 확인 대화상자
    if (!confirm(`버전 '${item.label}'을(를) 삭제하시겠습니까?`)) {
      return;
    }

    try {
      setLoading(true);
      await promptService.deletePrompt(selectedChannel.channelId, item.id);
      await loadPromptData();

      alert('프롬프트가 삭제되었습니다.');
    } catch (err: any) {
      console.error('프롬프트 삭제 실패:', err);
      alert(err.response?.data?.message || '프롬프트 삭제에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">🔧 프롬프트 관리</h1>

      {/* 에러 메시지 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {/* 채널 미선택 */}
      {!selectedChannel && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
          <p className="text-yellow-800 text-sm">채널을 선택해주세요.</p>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* BASIC 프롬프트 */}
        <div className="bg-white border rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold">콘텐츠 생성 프롬프트 (BASIC)</h2>
            <button
              onClick={() => handleOpenCreateModal(PromptType.BASIC)}
              className="flex items-center px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
              disabled={loading}
            >
              <Plus className="h-4 w-4 mr-1" />
              생성
            </button>
          </div>

          {loading ? (
            <div className="w-full border rounded p-3 text-sm h-48 flex items-center justify-center bg-gray-50">
              <p className="text-gray-500">프롬프트를 불러오는 중...</p>
            </div>
          ) : (
            <textarea
              className="w-full border rounded p-3 text-sm h-48 resize-none"
              value={basicPrompt}
              onChange={(e) => setBasicPrompt(e.target.value)}
              placeholder="채널을 선택하면 프롬프트가 표시됩니다"
            />
          )}

          <div className="mt-2">
            <input
              className="w-full border rounded p-2 text-sm"
              placeholder="버전 라벨"
              value={basicLabel}
              onChange={(e) => setBasicLabel(e.target.value)}
            />
          </div>

          <div className="flex items-center space-x-2 mt-2">
            <button
              onClick={() => handleUpdatePrompt(PromptType.BASIC)}
              className="flex-1 px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
              disabled={loading || !basicPromptId}
            >
              수정
            </button>
            <button
              onClick={() => handleRegisterPrompt(PromptType.BASIC)}
              className="flex-1 px-3 py-2 bg-purple-600 text-white rounded text-sm hover:bg-purple-700"
              disabled={loading || !basicPromptId}
            >
              등록
            </button>
          </div>

          <div className="mt-4">
            <div className="flex items-center mb-2 text-sm text-gray-700">
              <History className="w-4 h-4 mr-1" /> 등록된 버전 히스토리
            </div>
            <div className="space-y-2 max-h-64 overflow-auto">
              {basicHistory.length === 0 ? (
                <p className="text-xs text-gray-500 p-2">등록된 히스토리가 없습니다.</p>
              ) : (
                basicHistory.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleHistoryClick(PromptType.BASIC, item)}
                    className={`border rounded p-2 cursor-pointer hover:bg-gray-50 ${
                      selectedBasicHistory === item.id ? 'bg-blue-50 border-blue-500' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium flex-1">{item.label}</div>
                      <div className="flex items-center gap-2">
                        {item.selected && (
                          <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full">
                            현재 등록됨
                          </span>
                        )}
                        <button
                          onClick={(e) => handleDeletePrompt(PromptType.BASIC, item, e)}
                          disabled={item.selected || basicHistory.length <= 1 || loading}
                          className={`p-1 rounded hover:bg-red-50 ${
                            item.selected || basicHistory.length <= 1
                              ? 'opacity-30 cursor-not-allowed'
                              : 'text-red-600 hover:text-red-700'
                          }`}
                          title={
                            item.selected
                              ? '현재 등록된 프롬프트는 삭제할 수 없습니다'
                              : basicHistory.length <= 1
                              ? '최소 1개 이상 유지되어야 합니다'
                              : '삭제'
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(item.createdAt).toLocaleString('ko-KR')}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* ADVANCE 프롬프트 */}
        <div className="bg-white border rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold">응용표현 프롬프트 (ADVANCE)</h2>
            <button
              onClick={() => handleOpenCreateModal(PromptType.ADVANCE)}
              className="flex items-center px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
              disabled={loading}
            >
              <Plus className="h-4 w-4 mr-1" />
              생성
            </button>
          </div>

          {loading ? (
            <div className="w-full border rounded p-3 text-sm h-48 flex items-center justify-center bg-gray-50">
              <p className="text-gray-500">프롬프트를 불러오는 중...</p>
            </div>
          ) : (
            <textarea
              className="w-full border rounded p-3 text-sm h-48 resize-none"
              value={advancePrompt}
              onChange={(e) => setAdvancePrompt(e.target.value)}
              placeholder="채널을 선택하면 프롬프트가 표시됩니다"
            />
          )}

          <div className="mt-2">
            <input
              className="w-full border rounded p-2 text-sm"
              placeholder="버전 라벨"
              value={advanceLabel}
              onChange={(e) => setAdvanceLabel(e.target.value)}
            />
          </div>

          <div className="flex items-center space-x-2 mt-2">
            <button
              onClick={() => handleUpdatePrompt(PromptType.ADVANCE)}
              className="flex-1 px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
              disabled={loading || !advancePromptId}
            >
              수정
            </button>
            <button
              onClick={() => handleRegisterPrompt(PromptType.ADVANCE)}
              className="flex-1 px-3 py-2 bg-purple-600 text-white rounded text-sm hover:bg-purple-700"
              disabled={loading || !advancePromptId}
            >
              등록
            </button>
          </div>

          <div className="mt-4">
            <div className="flex items-center mb-2 text-sm text-gray-700">
              <History className="w-4 h-4 mr-1" /> 등록된 버전 히스토리
            </div>
            <div className="space-y-2 max-h-64 overflow-auto">
              {advanceHistory.length === 0 ? (
                <p className="text-xs text-gray-500 p-2">등록된 히스토리가 없습니다.</p>
              ) : (
                advanceHistory.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleHistoryClick(PromptType.ADVANCE, item)}
                    className={`border rounded p-2 cursor-pointer hover:bg-gray-50 ${
                      selectedAdvanceHistory === item.id ? 'bg-blue-50 border-blue-500' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium flex-1">{item.label}</div>
                      <div className="flex items-center gap-2">
                        {item.selected && (
                          <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full">
                            현재 등록됨
                          </span>
                        )}
                        <button
                          onClick={(e) => handleDeletePrompt(PromptType.ADVANCE, item, e)}
                          disabled={item.selected || advanceHistory.length <= 1 || loading}
                          className={`p-1 rounded hover:bg-red-50 ${
                            item.selected || advanceHistory.length <= 1
                              ? 'opacity-30 cursor-not-allowed'
                              : 'text-red-600 hover:text-red-700'
                          }`}
                          title={
                            item.selected
                              ? '현재 등록된 프롬프트는 삭제할 수 없습니다'
                              : advanceHistory.length <= 1
                              ? '최소 1개 이상 유지되어야 합니다'
                              : '삭제'
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(item.createdAt).toLocaleString('ko-KR')}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 프롬프트 생성 모달 */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full m-4">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">
                  {createType === PromptType.BASIC ? "콘텐츠 생성" : "응용표현"} 프롬프트 생성
                </h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                  disabled={loading}
                >
                  ✕
                </button>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  버전 라벨
                </label>
                <input
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  placeholder="예: v2_엄마레벨규칙보강"
                  value={createLabel}
                  onChange={(e) => setCreateLabel(e.target.value)}
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  프롬프트 내용
                </label>
                <textarea
                  className="w-full border rounded-lg px-3 py-2 text-sm h-48 resize-none"
                  placeholder="프롬프트 내용을 입력하세요"
                  value={createPrompt}
                  onChange={(e) => setCreatePrompt(e.target.value)}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-gray-600 border rounded hover:bg-gray-50"
                  disabled={loading}
                >
                  취소
                </button>
                <button
                  onClick={handleCreatePrompt}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                  disabled={loading || !createLabel.trim() || !createPrompt.trim()}
                >
                  {loading ? '생성 중...' : '생성'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
