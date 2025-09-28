import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, Clock, Users, Send, AlertCircle } from "lucide-react";
import { Channel, UserGroup, UserGroupType, GroupOption, Message, GroupId, AvailableDateResponse } from "../types";
import { userGroupService } from "../services/userGroupService";
import { contentDeliveryService } from "../services/contentDeliveryService";

interface ContentGroupSettingsProps {
  selectedChannel: Channel | null;
}

export default function ContentGroupSettings({ selectedChannel }: ContentGroupSettingsProps) {
  const navigate = useNavigate();

  // 기본 상태
  const [loading, setLoading] = useState(false);
  const [availableDates, setAvailableDates] = useState<AvailableDateResponse[]>([]);
  const [userGroups, setUserGroups] = useState<UserGroup[]>([]);

  // 발송 설정 상태
  const [deliveryDate, setDeliveryDate] = useState<string>("");
  const [deliveryHour, setDeliveryHour] = useState<string>("09");
  const [deliveryMinute, setDeliveryMinute] = useState<string>("00");
  const [messageTarget, setMessageTarget] = useState<'all' | 'groups'>('all');
  const [includedGroupIds, setIncludedGroupIds] = useState<GroupId[]>([]);
  const [excludedGroupIds, setExcludedGroupIds] = useState<GroupId[]>([]);

  // 메시지 정보
  const [selectedDateMessages, setSelectedDateMessages] = useState<Message[]>([]);

  // 데이터 로드
  useEffect(() => {
    if (!selectedChannel) return;

    loadInitialData();
  }, [selectedChannel]);

  const loadInitialData = async () => {
    if (!selectedChannel) return;

    setLoading(true);
    try {
      // 병렬로 데이터 로드
      const [dates, groups] = await Promise.all([
        contentDeliveryService.getAvailableDeliveryDates(selectedChannel.channelId),
        userGroupService.getUserGroups(selectedChannel.channelId)
      ]);

      setAvailableDates(dates);
      setUserGroups(groups);

      // 첫 번째 사용 가능한 날짜를 기본 선택
      if (dates.length > 0) {
        setDeliveryDate(dates[0].date);
        loadMessagesForDate(dates[0].date);
      }
    } catch (error) {
      console.error('Failed to load initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  // 날짜별 메시지 로드
  const loadMessagesForDate = async (date: string) => {
    if (!selectedChannel) return;

    try {
      const messages = await contentDeliveryService.getMessagesByDate(selectedChannel.channelId, date);
      setSelectedDateMessages(messages);
    } catch (error) {
      console.error('Failed to load messages for date:', error);
      setSelectedDateMessages([]);
    }
  };

  // 날짜 변경 핸들러
  const handleDateChange = (date: string) => {
    setDeliveryDate(date);
    loadMessagesForDate(date);
  };

  // 그룹 옵션 생성
  const getGroupOptions = (): GroupOption[] => {
    return userGroups.map(group => ({
      group,
      memberCount: group.memberCount,
      friendCount: group.friendCount,
      canInclude: group.type === UserGroupType.AUTO_ACTIVE || group.type === UserGroupType.CUSTOM,
      canExclude: group.type === UserGroupType.AUTO_ENDED || group.type === UserGroupType.CUSTOM
    }));
  };

  // 그룹 선택 핸들러
  const handleIncludeGroupChange = (groupId: GroupId, checked: boolean) => {
    if (checked) {
      setIncludedGroupIds(prev => [...prev, groupId]);
    } else {
      setIncludedGroupIds(prev => prev.filter(id => id !== groupId));
    }
  };

  const handleExcludeGroupChange = (groupId: GroupId, checked: boolean) => {
    if (checked) {
      setExcludedGroupIds(prev => [...prev, groupId]);
    } else {
      setExcludedGroupIds(prev => prev.filter(id => id !== groupId));
    }
  };

  // 예상 발송 대상 계산
  const calculateEstimatedRecipients = (): number => {
    if (messageTarget === 'all') {
      const allGroup = userGroups.find(g => g.type === UserGroupType.AUTO_ACTIVE);
      return allGroup?.friendCount || 0;
    }

    const includedCount = includedGroupIds.reduce((sum, id) => {
      const group = userGroups.find(g => g.id === id);
      return sum + (group?.friendCount || 0);
    }, 0);

    const excludedCount = excludedGroupIds.reduce((sum, id) => {
      const group = userGroups.find(g => g.id === id);
      return sum + (group?.friendCount || 0);
    }, 0);

    return Math.max(0, includedCount - excludedCount);
  };

  // 발송 설정 저장
  const handleScheduleDelivery = async () => {
    if (!selectedChannel) return;

    setLoading(true);
    try {
      const request = {
        deliveryDate,
        deliveryTime: `${deliveryHour}:${deliveryMinute}`,
        messageTarget: messageTarget === 'all' ? 'ALL' : 'GROUP',
        includeGroup: includedGroupIds,
        excludeGroup: excludedGroupIds
      };

      await contentDeliveryService.scheduleContentDelivery(selectedChannel.channelId, request);

      // 성공시 콘텐츠 목록으로 리다이렉트
      alert(`🎉 발송 예약이 완료되었습니다!\n\n📊 예약 정보:\n• 발송 날짜: ${deliveryDate}\n• 발송 시간: ${deliveryHour}:${deliveryMinute}\n\n콘텐츠 목록 페이지로 이동합니다.`);

      navigate('/content-list');

    } catch (error) {
      console.error('Failed to schedule delivery:', error);

      let errorMessage = '❌ 발송 예약에 실패했습니다.';
      if (error instanceof Error) {
        errorMessage += `\n\n🔍 오류 상세:\n${error.message}`;
      }
      errorMessage += '\n\n다시 시도해주세요.';

      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!selectedChannel) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">콘텐츠 발송 및 그룹 설정</h1>
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-lg">
          <AlertCircle className="h-5 w-5 inline mr-2" />
          채널을 선택해주세요.
        </div>
      </div>
    );
  }

  const groupOptions = getGroupOptions();
  const estimatedRecipients = calculateEstimatedRecipients();

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">콘텐츠 발송 및 그룹 설정</h1>
        <p className="text-sm text-gray-600 mt-1">
          생성된 콘텐츠의 발송 일정과 대상 그룹을 설정합니다.
        </p>
      </div>

      {loading && (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-lg mb-6">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
            데이터를 불러오는 중...
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 좌측: 발송 설정 */}
        <div className="space-y-6">
          {/* 발송 날짜 선택 */}
          <div className="bg-white border rounded-lg shadow-sm p-4">
            <div className="flex items-center mb-3">
              <Calendar className="h-5 w-5 text-blue-600 mr-2" />
              <h3 className="text-lg font-semibold">발송 날짜 선택</h3>
            </div>

            <select
              className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              value={deliveryDate}
              onChange={(e) => handleDateChange(e.target.value)}
            >
              <option value="">날짜를 선택하세요</option>
              {availableDates.map(dateInfo => (
                <option key={dateInfo.date} value={dateInfo.date}>
                  {new Date(dateInfo.date).toLocaleDateString('ko-KR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    weekday: 'short'
                  })}
                </option>
              ))}
            </select>

{(() => {
              const selectedDateInfo = availableDates.find(d => d.date === deliveryDate);
              const messageTheme = selectedDateInfo?.theme || "주제가 없습니다.";

              return messageTheme != null ? (
                <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">
                    선택된 날짜의 주제는  <strong>{messageTheme}</strong> 입니다.
                  </p>
                </div>
              ) : null;
            })()}
          </div>

          {/* 발송 시간 설정 */}
          <div className="bg-white border rounded-lg shadow-sm p-4">
            <div className="flex items-center mb-3">
              <Clock className="h-5 w-5 text-blue-600 mr-2" />
              <h3 className="text-lg font-semibold">발송 시간</h3>
            </div>

            <div className="flex items-center space-x-2">
              <select
                className="flex-1 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                value={deliveryHour}
                onChange={(e) => setDeliveryHour(e.target.value)}
              >
                {Array.from({ length: 24 }, (_, i) => {
                  const hour = i.toString().padStart(2, '0');
                  return (
                    <option key={hour} value={hour}>
                      {hour}시
                    </option>
                  );
                })}
              </select>

              <span className="text-gray-500">:</span>

              <select
                className="flex-1 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                value={deliveryMinute}
                onChange={(e) => setDeliveryMinute(e.target.value)}
              >
                {['00', '10', '20', '30', '40', '50'].map(minute => (
                  <option key={minute} value={minute}>
                    {minute}분
                  </option>
                ))}
              </select>
            </div>

            <p className="text-xs text-gray-500 mt-2">
              * 한국 시간 기준으로 입력하시면 자동으로 UTC로 변환됩니다.
            </p>
          </div>
        </div>

        {/* 우측: 메시지 타겟 설정 */}
        <div className="bg-white border rounded-lg shadow-sm p-4">
          <div className="flex items-center mb-4">
            <Users className="h-5 w-5 text-blue-600 mr-2" />
            <h3 className="text-lg font-semibold">메시지 타겟</h3>
          </div>

          {/* 타겟 선택 라디오 버튼 */}
          <div className="space-y-3 mb-4">
            <label className="flex items-center space-x-3">
              <input
                type="radio"
                name="messageTarget"
                value="all"
                checked={messageTarget === 'all'}
                onChange={(e) => setMessageTarget(e.target.value as 'all' | 'groups')}
                className="w-4 h-4 text-blue-600"
              />
              <span className="text-sm font-medium">전체 친구 발송</span>
            </label>

            <label className="flex items-center space-x-3">
              <input
                type="radio"
                name="messageTarget"
                value="groups"
                checked={messageTarget === 'groups'}
                onChange={(e) => setMessageTarget(e.target.value as 'all' | 'groups')}
                className="w-4 h-4 text-blue-600"
              />
              <span className="text-sm font-medium">포함할 친구 그룹</span>
            </label>
          </div>

          {/* 그룹별 타겟팅 */}
          {messageTarget === 'groups' && (
            <div className="grid grid-cols-2 gap-4">
              {/* 포함할 그룹 */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">포함할 친구 그룹 ({includedGroupIds.length})</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto border rounded-lg p-2">
                  {groupOptions.length === 0 ? (
                    <p className="text-xs text-gray-500 p-2">그룹을 불러오는 중...</p>
                  ) : (
                    groupOptions
                      .filter(option => option.canInclude)
                      .map(option => (
                        <label key={`include-${option.group.id}`} className="flex items-center space-x-2 text-xs">
                          <input
                            type="checkbox"
                            checked={includedGroupIds.includes(option.group.id)}
                            onChange={(e) => handleIncludeGroupChange(option.group.id, e.target.checked)}
                            className="w-3 h-3 text-blue-600"
                          />
                          <span className="flex-1">
                            {option.group.title}
                            <span className="text-gray-400 ml-1">({option.friendCount})</span>
                          </span>
                        </label>
                      ))
                  )}
                  {groupOptions.length > 0 && groupOptions.filter(option => option.canInclude).length === 0 && (
                    <p className="text-xs text-gray-500 p-2">포함 가능한 그룹이 없습니다.</p>
                  )}
                </div>
              </div>

              {/* 제외할 그룹 */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">제외할 친구 그룹 ({excludedGroupIds.length})</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto border rounded-lg p-2">
                  {groupOptions.length === 0 ? (
                    <p className="text-xs text-gray-500 p-2">그룹을 불러오는 중...</p>
                  ) : (
                    groupOptions
                      .filter(option => option.canExclude)
                      .map(option => (
                        <label key={`exclude-${option.group.id}`} className="flex items-center space-x-2 text-xs">
                          <input
                            type="checkbox"
                            checked={excludedGroupIds.includes(option.group.id)}
                            onChange={(e) => handleExcludeGroupChange(option.group.id, e.target.checked)}
                            className="w-3 h-3 text-red-600"
                          />
                          <span className="flex-1">
                            {option.group.title}
                            <span className="text-gray-400 ml-1">({option.friendCount})</span>
                          </span>
                        </label>
                      ))
                  )}
                  {groupOptions.length > 0 && groupOptions.filter(option => option.canExclude).length === 0 && (
                    <p className="text-xs text-gray-500 p-2">제외 가능한 그룹이 없습니다.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 예상 발송 대상 */}
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm text-blue-700">예상 발송 대상</span>
              <span className="text-lg font-bold text-blue-900">
                {estimatedRecipients.toLocaleString()}명
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 하단: 발송 예약 버튼 */}
      <div className="mt-6 flex justify-end">
        {(() => {
          const selectedDateInfo = availableDates.find(d => d.date === deliveryDate);
          const messageCount = selectedDateInfo?.messageCount || 0;
          const isDisabled = loading || !deliveryDate || messageCount === 0;

          return (
            <button
              onClick={handleScheduleDelivery}
              disabled={isDisabled}
              className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium ${
                isDisabled
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>처리중...</span>
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  <span>발송 예약하기</span>
                </>
              )}
            </button>
          );
        })()}
      </div>
    </div>
  );
}