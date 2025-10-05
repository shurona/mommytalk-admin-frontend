import React, { useMemo, useState, useEffect } from "react";
import { contentGenerationService } from "../services/contentGenerationService";
import { messageTypeService } from "../services/messageTypeService";

/** 텍스트 스타일 (가독성 위주) */
const MSG_STYLE = {
  main: "text-[14px] leading-[20px] text-[#191919]",
  note: "text-[12px] leading-[18px] text-[#5B6570]",
};

/** 제품 정의 */
const PRODUCTS = [
  { id: "365", label: "마미톡 365", hasVoca: false },
  { id: "combo", label: "마미톡 365+마미보카", hasVoca: true },
];


const seedText = (c, m) =>
  `Good day! (아이 Lv${c} × 엄마 Lv${m})\n오늘도 우리 아이와 짧게 영어로 이야기해요.`;

/** 버튼 프리셋 */
const BTN_BASE = "w-full py-2 rounded text-[12px] transition border";
const BTN_NEUTRAL = `${BTN_BASE} bg-[#F5F6F7] border-[#E9EAEB] text-[#111827] hover:bg-[#ECEDEF]`; // 회색
const BTN_PRIMARY = `${BTN_BASE} bg-[#2563EB] border-[#1E40AF] text-white hover:bg-[#1D4ED8]`; // 파랑
const BTN_SECONDARY = `${BTN_BASE} bg-white border-[#E5E7EB] text-[#111827] hover:bg-gray-50`; // 흰색
const BTN_APPROVE = `${BTN_BASE} text-white hover:opacity-90`; // 승인 버튼(#F65159)

/** TTS 보이스 프리셋 (예시) */
const VOICES = [
  { id: "sarah_f", name: "Sarah (여성)" },
  { id: "olivia_f", name: "Olivia (여성)" },
  { id: "matt_m", name: "Matt (남성)" },
  { id: "junko_f", name: "Junko (JP 여성)" },
];

export default function ContentGeneration({ country = "KOR", selectedChannel }) {
  const isJP = country === "JPN";
  const audioButtonLabelDefaultMom = isJP ? "ママの発音🔈" : "엄마발음🔈";
  const audioButtonLabelDefaultChild = isJP ? "キッズの発音🔈" : "아이발음🔈";
  const vocaDefaultLabel = isJP ? "デジタルフラッシュカード" : "마미보카📩";
  const diaryDefaultLabel = isJP ? "今日の一文を作る✏️" : "오늘의 문장 만들기✏️";
  const audioGenerateLabel = isJP ? "AI音声生成" : "AI음성 생성";
  const DIARY_DEFAULT_URL = "https://mamitalk.example.com/diary"; // (1) 기본 URL 자동 삽입

  const [contentTheme, setContentTheme] = useState("");
  const [contentContext, setContentContext] = useState("");
  const [contentDate, setContentDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0]; // YYYY-MM-DD 형식
  });
  const [childLevel, setChildLevel] = useState(1);
  const [momLevel, setMomLevel] = useState(1);
  const [selectedLanguage, setSelectedLanguage] = useState("KOR");

  /** API 상태 관리 */
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentContent, setCurrentContent] = useState(null);

  /** 9개 레벨별 콘텐츠 생성 상태 */
  const [levelContentInfo, setLevelContentInfo] = useState({});

  /** MessageType 상태 관리 */
  const [messageTypeExists, setMessageTypeExists] = useState(false);
  const [messageTypeLoading, setMessageTypeLoading] = useState(true);
  const [editingMessageType, setEditingMessageType] = useState(false);
  const [messageTypeId, setMessageTypeId] = useState(null);

  /** 생성 결과(카드별 본문 메시지) */
  // key: `${productId}|${child}_${mom}`
  const [messages, setMessages] = useState(null);

  /** 카드별 상태들 */
  const [groupTargets, setGroupTargets] = useState({});
  const [approvedKeys, setApprovedKeys] = useState(new Set());

  /** 오디오(엄마/아이) 및 부가 버튼(보카/다이어리) 상태 */
  const [audioConfig, setAudioConfig] = useState({}); // { key: { mom:{...}, child:{...} } }
  const [vocaConfigs, setVocaConfigs] = useState({}); // { key: { label, url, editingLabel } } (보카 상품만)
  const [diaryConfigs, setDiaryConfigs] = useState({}); // { key: { label, url, editingLabel, editingUrl } }

  // MessageType 조회 함수 (9개 레벨 contentInfo 포함)
  const loadMessageType = async (channelId, date) => {
    try {
      setMessageTypeLoading(true);
      setError(""); // 에러 초기화

      // YYYY-MM-DD -> YYYYMMDD 형식으로 변환
      const dateInfo = date.replace(/-/g, '');

      const messageTypeInfo = await messageTypeService.getMessageTypeByDate(channelId, dateInfo);

      if (messageTypeInfo) {
        // 데이터 있음
        setMessageTypeId(messageTypeInfo.id);
        setContentTheme(messageTypeInfo.theme);
        setContentContext(messageTypeInfo.context);
        setLevelContentInfo(messageTypeInfo.contentInfo || {});
        setMessageTypeExists(true);
      } else {
        // 데이터 없음 (정상 상황 - 백엔드에서 null 반환)
        setMessageTypeId(null);
        setContentTheme("");
        setContentContext("");
        setLevelContentInfo({});
        setMessageTypeExists(false);
      }
    } catch (error) {
      // 실제 에러만 처리 (네트워크 오류, 500 등)
      console.error('MessageType 조회 실패:', error);
      setError(error.response?.data?.message || 'MessageType 정보를 불러오는데 실패했습니다.');
      setMessageTypeExists(false);
      setLevelContentInfo({});
    } finally {
      setMessageTypeLoading(false);
    }
  };

  // 페이지 로드시 MessageType 조회
  useEffect(() => {
    if (!selectedChannel) return;
    loadMessageType(selectedChannel.channelId, contentDate);
  }, [selectedChannel, contentDate]);

  /** 조회 및 생성: 없으면 생성 */
  const generateOrRetrieve = async (regenerate = false) => {
    if (!selectedChannel) {
      alert("채널을 선택해주세요.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const request = {
        theme: contentTheme,
        context: contentContext,
        deliveryDate: contentDate,
        childLevel: childLevel,
        userLevel: momLevel,
        language: selectedLanguage,
        regenerate: regenerate
      };

      const response = await contentGenerationService.generateContent(
        selectedChannel.channelId,
        request
      );

      const content = response.content;
      setCurrentContent(content);

      // UI 상태 업데이트
      const selectedProduct = "365";
      const selectedProductObj = PRODUCTS.find(p => p.id === selectedProduct);
      const key = `${selectedProduct}|${childLevel}_${momLevel}`;

      const msg = { [key]: content.messageText };
      const tgt = { [key]: "전체 사용자" };

      const audio = {
        [key]: {
          mom: {
            editableLabel: selectedLanguage === "JPN" ? "ママの発音🔈" : "엄마발음🔈",
            editingLabel: false,
            voice: VOICES[0].id,
            speed: 1.0,
            text: content.messageText,
            status: "idle",
            url: content.momAudioUrl || "https://cdn.example.com/mock-mom-audio.mp3",
          },
          child: {
            editableLabel: selectedLanguage === "JPN" ? "キッズの発音🔈" : "아이발음🔈",
            editingLabel: false,
            voice: VOICES[2].id,
            speed: 1.0,
            text: content.messageText,
            status: "idle",
            url: content.childAudioUrl || "https://cdn.example.com/mock-child-audio.mp3",
          },
        }
      };

      const voca = {};
      if (selectedProductObj?.hasVoca && content.vocaUrl) {
        voca[key] = {
          label: selectedLanguage === "JPN" ? "デジタルフラッシュカード" : "마미보카📩",
          editingLabel: false,
          url: content.vocaUrl,
        };
      }

      const diary = {
        [key]: {
          label: selectedLanguage === "JPN" ? "今日の一文を作る✏️" : "오늘의 문장 만들기✏️",
          url: content.diaryUrl || DIARY_DEFAULT_URL,
          editingLabel: false,
          editingUrl: false,
        }
      };

      setMessages(msg);
      setGroupTargets(tgt);
      setAudioConfig(audio);
      setVocaConfigs(voca);
      setDiaryConfigs(diary);
      setApprovedKeys(content.status === 'approved' ? new Set([key]) : new Set());

      // 9개 레벨 상태 다시 조회
      await loadMessageType(selectedChannel.channelId, contentDate);

    } catch (error) {
      console.error('콘텐츠 생성/조회 실패:', error);
      setError(error.response?.data?.message || '콘텐츠 생성에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  /** 업데이트 헬퍼 */
  const updateMessage = (key, val) => setMessages((p) => ({ ...p, [key]: val }));
  const updateTarget = (key, val) => setGroupTargets((p) => ({ ...p, [key]: val }));

  const updateAudioField = (key, role, patch) =>
    setAudioConfig((p) => ({ ...p, [key]: { ...p[key], [role]: { ...p[key][role], ...patch } } }));

  const resetAudio = (key, role, baseText) =>
    setAudioConfig((p) => ({
      ...p,
      [key]: {
        ...p[key],
        [role]: {
          ...p[key][role],
          editableLabel: role === "mom" ? audioButtonLabelDefaultMom : audioButtonLabelDefaultChild,
          voice: role === "mom" ? VOICES[0].id : VOICES[2].id,
          speed: 1.0,
          text: baseText,
          status: "idle",
          url: "",
        },
      },
    }));

  const updateVoca = (key, patch) => setVocaConfigs((p) => ({ ...p, [key]: { ...p[key], ...patch } }));
  const updateDiary = (key, patch) => setDiaryConfigs((p) => ({ ...p, [key]: { ...p[key], ...patch } }));

  /** 오디오 생성/미리듣기/버튼에 넣기 */
  const generateAudio = (key, role) => {
    updateAudioField(key, role, { status: "generating" });
    setTimeout(() => {
      // Mock URL 반환
      const url = role === "mom" ? "https://cdn.example.com/mock-mom-audio.mp3" : "https://cdn.example.com/mock-child-audio.mp3";
      updateAudioField(key, role, { url, status: "success" });
    }, 900);
  };
  const previewAudio = (url) => {
    if (!url) alert("오디오 URL이 아직 없습니다. 먼저 생성해주세요.");
    else alert(`[재생] ${url}`);
  };
  const attachAudioUrlToButton = (key, role) => {
    const url = audioConfig?.[key]?.[role]?.url || "";
    if (!url) {
      alert("먼저 AI음성 생성으로 URL을 확보해 주세요.");
      return;
    }
    alert("미리보기의 버튼에 오디오 URL이 연결되었습니다.");
  };

  /** 테스트 발송 */
  const testContent = async (key, title) => {
    if (!selectedChannel) {
      alert("채널을 선택해주세요.");
      return;
    }

    const messageText = messages?.[key];
    if (!messageText || messageText.trim() === "") {
      alert("메시지 내용을 입력해주세요.");
      return;
    }

    setIsLoading(true);
    try {
      const request = {
        content: messageText
        // 추후 추가: diary, momAudioUrl, childAudioUrl 등
      };

      await contentGenerationService.testContent(
        selectedChannel.channelId,
        request
      );
      alert(`테스트 발송 완료: ${title}`);
    } catch (error) {
      console.error('테스트 발송 실패:', error);
      alert(error.response?.data?.message || '테스트 발송에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  /** 수정하기 */
  const updateContent = async (key, title) => {
    if (!selectedChannel) {
      alert("채널을 선택해주세요.");
      return;
    }

    if (!messageTypeId) {
      alert("MessageType 정보가 없습니다. 주제와 맥락을 먼저 저장해주세요.");
      return;
    }

    const messageText = messages?.[key];
    if (!messageText || messageText.trim() === "") {
      alert("메시지 내용을 입력해주세요.");
      return;
    }

    setIsLoading(true);
    try {
      const request = {
        messageTypeId: messageTypeId,
        userLevel: momLevel,
        childLevel: childLevel,
        content: messageText
        // 추후 추가: diary, momAudioUrl, childAudioUrl 등
      };

      await contentGenerationService.updateContent(
        selectedChannel.channelId,
        request
      );

      // 9개 레벨 상태 다시 조회
      await loadMessageType(selectedChannel.channelId, contentDate);

      alert(`수정 완료: ${title}`);
    } catch (error) {
      console.error('수정 실패:', error);
      alert(error.response?.data?.message || '수정에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  /** 승인 */
  const approveContent = async (key, title) => {
    if (!selectedChannel || !currentContent) {
      alert("콘텐츠를 먼저 생성해주세요.");
      return;
    }

    setIsLoading(true);
    try {
      await contentGenerationService.approveContent(
        selectedChannel.channelId,
        currentContent.id
      );

      setApprovedKeys((prev) => {
        const next = new Set(prev);
        next.add(key);
        return next;
      });

      alert(`승인 완료: ${title}`);
    } catch (error) {
      console.error('승인 실패:', error);
      alert(error.response?.data?.message || '승인에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  /** MessageType 저장/수정 */
  const saveMessageType = async () => {
    if (!selectedChannel) {
      alert("채널을 선택해주세요.");
      return;
    }

    if (!contentTheme.trim() || !contentContext.trim()) {
      alert("주제와 맥락을 모두 입력해주세요.");
      return;
    }

    // 승인된 콘텐츠가 있고 기존 MessageType을 수정하는 경우 경고
    if (messageTypeExists && approvedCount > 0) {
      const confirmed = window.confirm(
        `승인된 콘텐츠가 ${approvedCount}개 있습니다.\n주제/맥락을 수정하면 해당 날짜의 모든 메시지 승인이 취소됩니다.\n계속하시겠습니까?`
      );
      if (!confirmed) return;
    }

    setIsLoading(true);
    setError("");

    try {
      const request = {
        localDate: contentDate,
        theme: contentTheme.trim(),
        context: contentContext.trim()
      };

      const wasUpdating = messageTypeExists; // 수정인지 생성인지 기록

      if (messageTypeExists) {
        // 수정
        const response = await messageTypeService.updateMessageType(selectedChannel.channelId, request);
        setMessageTypeId(response.id); // ID 업데이트
        alert("주제/맥락이 수정되었습니다.");
      } else {
        // 생성
        const response = await messageTypeService.createMessageType(selectedChannel.channelId, request);
        setMessageTypeId(response.id); // 생성된 ID 저장
        setMessageTypeExists(true);
        alert("주제/맥락이 저장되었습니다.");
      }
    } catch (error) {
      console.error('MessageType 저장 실패:', error);
      setError(error.response?.data?.message || 'MessageType 저장에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  /** 수정 취소 */
  const cancelEditMessageType = () => {
    setEditingMessageType(false);
    // 원래 값으로 복원
    loadMessageType(selectedChannel.channelId, contentDate);
  };

  /** 타이틀/정렬용 메타 계산 */
  const items = useMemo(() => {
    if (!messages) return [];
    const productMap = Object.fromEntries(PRODUCTS.map((p) => [p.id, p]));
    const counters = { 365: 0, combo: 0 };

    const rows = Object.entries(messages).map(([key, text]) => {
      const [productId, lv] = key.split("|");
      const [child, mom] = lv.split("_").map(Number);
      const product = productMap[productId];
      return {
        key,
        productId,
        productLabel: product.label,
        hasVoca: product.hasVoca,
        child,
        mom,
        text,
      };
    });

    rows.sort((a, b) => {
      const nameCmp = a.productLabel.localeCompare(b.productLabel, "ko");
      if (nameCmp !== 0) return nameCmp;
      if (a.child !== b.child) return a.child - b.child;
      return a.mom - b.mom;
    });

    return rows.map((r) => {
      counters[r.productId] += 1;
      const number = counters[r.productId];
      return { ...r, number, title: `${r.productLabel} ${number}. 아이${r.child} × 엄마${r.mom}` };
    });
  }, [messages]);

  /** 미리보기 컴포넌트 (우측 1/4~1/3 세로 모바일 화면) */
  const PreviewBubble = ({
    momBtnLabel,
    childBtnLabel,
    momUrl,
    childUrl,
    vocaLabelText,
    vocaUrl,
    diaryLabelText,
    diaryUrl,
    bodyText,
  }) => (
    <div className="rounded-lg p-3" style={{ backgroundColor: "#84A1D0" }}>
      <div className="bg-white rounded-lg w-[320px] min-h-[560px] shadow-sm border border-gray-200 mx-auto">
        {/* 상단 앱 바 */}
        <div className="bg-[#1E88E5] text-white px-4 py-2 rounded-t-lg flex items-center justify-between">
          <span className="text-[12px] font-medium">마미톡 잉글리시 ({country})</span>
          <span className="text-[10px] opacity-90">Preview</span>
        </div>

        <div className="p-4">
          <div className="rounded-xl border border-gray-200 bg-[#FAFAFA] px-3 py-3 space-y-3">
            {/* 상단: 엄마/아이 발음 버튼 2열 */}
            <div className="grid grid-cols-2 gap-2">
              <button
                className={BTN_NEUTRAL}
                onClick={() => (momUrl ? alert(`[재생] ${momUrl}`) : alert("오디오 URL이 없습니다."))}
              >
                {momBtnLabel}
              </button>
              <button
                className={BTN_NEUTRAL}
                onClick={() =>
                  childUrl ? alert(`[재생] ${childUrl}`) : alert("오디오 URL이 없습니다.")
                }
              >
                {childBtnLabel}
              </button>
            </div>

            {/* 본문 */}
            <p className={`${MSG_STYLE.main} whitespace-pre-line`}>{bodyText}</p>

            {/* 마미보카 (있으면) */}
            {!!vocaUrl && (
              <button className={BTN_NEUTRAL} onClick={() => alert(`[링크 이동] ${vocaUrl}`)}>
                {vocaLabelText}
              </button>
            )}

            {/* 오늘의 문장 만들기 */}
            <button
              className={BTN_NEUTRAL}
              onClick={() =>
                diaryUrl ? alert(`[페이지 이동] ${diaryUrl}`) : alert("연결 URL이 설정되지 않았습니다.")
              }
            >
              {diaryLabelText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  /** 상단 설정 바 */
  const TopBar = (
    <div className="bg-white border rounded-xl shadow-sm p-6 mb-4">
      <div className="flex gap-6">
        {/* 왼쪽: 주제와 맥락 */}
        <div className="flex-1">
          {messageTypeLoading ? (
            <div className="p-8 text-center text-gray-500">
              MessageType 정보를 불러오는 중...
            </div>
          ) : (
            <>
              {/* 주제 */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-1">
                  <div className="text-[12px] text-slate-600 font-medium">주제</div>
                  {messageTypeExists && (
                    <button
                      onClick={() => setEditingMessageType(true)}
                      className="text-[12px] text-blue-600 hover:underline"
                    >
                      수정
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={contentTheme}
                  onChange={(e) => setContentTheme(e.target.value)}
                  placeholder="예: 아침 인사, 놀이 시간"
                  className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                />
              </div>

              {/* 맥락 */}
              <div className="mb-4">
                <div className="text-[12px] text-slate-600 mb-1 font-medium">맥락</div>
                <textarea
                  rows={5}
                  value={contentContext}
                  onChange={(e) => setContentContext(e.target.value)}
                  placeholder="예: 아이가 일어나서 엄마와 인사하는 상황"
                  className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 resize-none"
                />
              </div>

              {/* MessageType 액션 버튼 */}
              <div className="flex gap-2 mb-4">
                <button
                  onClick={saveMessageType}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-[12px]"
                  disabled={isLoading}
                >
                  {isLoading ? "처리 중..." : messageTypeExists ? "수정" : "저장"}
                </button>
                {editingMessageType && (
                  <button
                    onClick={cancelEditMessageType}
                    className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-[12px]"
                    disabled={isLoading}
                  >
                    취소
                  </button>
                )}
              </div>

              {/* MessageType 상태 안내 */}
              {!messageTypeExists && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                  <p className="text-[12px] text-yellow-800">
                    💡 해당 날짜의 MessageType이 없습니다. 주제와 맥락을 입력한 후 "저장" 버튼을 눌러주세요.
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* 오른쪽: 블록 형태 설정들 */}
        <div className="flex-1">
          {/* 첫 번째 행: 발송 날짜 */}
          <div className="mb-4">
            <div className="text-[12px] text-slate-600 mb-1 font-medium">발송 날짜</div>
            <input
              type="date"
              value={contentDate}
              onChange={(e) => setContentDate(e.target.value)}
              className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            />
          </div>

          {/* 두 번째 행: 부모, 아이 */}
          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <div className="text-[12px] text-slate-600 mb-1 font-medium">부모</div>
              <select
                value={momLevel}
                onChange={(e) => setMomLevel(Number(e.target.value))}
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              >
                <option value={1}>레벨 1</option>
                <option value={2}>레벨 2</option>
                <option value={3}>레벨 3</option>
              </select>
            </div>
            <div className="flex-1">
              <div className="text-[12px] text-slate-600 mb-1 font-medium">아이</div>
              <select
                value={childLevel}
                onChange={(e) => setChildLevel(Number(e.target.value))}
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              >
                <option value={1}>레벨 1</option>
                <option value={2}>레벨 2</option>
                <option value={3}>레벨 3</option>
              </select>
            </div>
          </div>

          {/* 세 번째 행: 언어 */}
          <div className="mb-4">
            <div className="text-[12px] text-slate-600 mb-1 font-medium">언어</div>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            >
              <option value="KOR">한국어</option>
              <option value="JPN">일본어</option>
            </select>
          </div>

          {/* 네 번째 행: 생성 버튼들 */}
          <div className="flex gap-3">
            <button
              onClick={() => generateOrRetrieve(false)}
              className={`${BTN_PRIMARY} flex-1 py-3 text-[14px] font-semibold`}
              disabled={isLoading}
            >
              {isLoading ? "처리중..." : "조회 및 생성"}
            </button>
            <button
              onClick={() => generateOrRetrieve(true)}
              className={`${BTN_SECONDARY} flex-1 py-3 text-[14px] font-semibold`}
              disabled={isLoading}
            >
              {isLoading ? "처리중..." : "AI 재생성"}
            </button>
          </div>
        </div>
      </div>

      <div className="text-[12px] text-slate-500 mt-3">
        * 국가 설정은 상단 어드민 탑바 글로벌 옵션을 따릅니다. (현재: <b>{selectedLanguage}</b>)
      </div>
    </div>
  );

  /** 상단 인디케이터 */
  const Indicator = (
    <div className="mb-6">
      {/* 레벨별 생성 현황 */}
      <div className="bg-white border rounded-xl shadow-sm px-6 py-5">
        <div className="text-[14px] font-semibold text-slate-700 mb-3">레벨별 생성 현황</div>
        <table className="border-collapse border border-gray-300 w-full max-w-md">
          <thead>
            <tr className="bg-gray-50">
              <th className="border border-gray-300 px-3 py-2 text-[12px] font-medium text-gray-600"></th>
              <th className="border border-gray-300 px-3 py-2 text-[12px] font-medium text-gray-600">자녀1</th>
              <th className="border border-gray-300 px-3 py-2 text-[12px] font-medium text-gray-600">자녀2</th>
              <th className="border border-gray-300 px-3 py-2 text-[12px] font-medium text-gray-600">자녀3</th>
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3].map((userLevel) => (
              <tr key={userLevel}>
                <td className="border border-gray-300 px-3 py-2 text-[12px] font-medium text-gray-600 bg-gray-50">
                  부모{userLevel}
                </td>
                  {[1, 2, 3].map((childLv) => {
                    const levelKey = `${userLevel}_${childLv}`;
                    const hasContent = levelContentInfo[levelKey] && levelContentInfo[levelKey].trim() !== '';
                    const isSelected = childLevel === childLv && momLevel === userLevel;

                    return (
                      <td
                        key={levelKey}
                        className="border border-gray-300 p-0"
                      >
                        <button
                          onClick={() => {
                            setChildLevel(childLv);
                            setMomLevel(userLevel);

                            const selectedProduct = "365";
                            const key = `${selectedProduct}|${userLevel}_${childLv}`;
                            const messageText = hasContent ? levelContentInfo[levelKey] : "";

                            // 메시지 및 UI 상태 설정 (빈 값이어도 표시)
                            setMessages({ [key]: messageText });
                            setGroupTargets({ [key]: "전체 사용자" });

                            // 오디오 설정
                            setAudioConfig({
                              [key]: {
                                mom: {
                                  editableLabel: selectedLanguage === "JPN" ? "ママの発音🔈" : "엄마발음🔈",
                                  editingLabel: false,
                                  voice: VOICES[0].id,
                                  speed: 1.0,
                                  text: messageText,
                                  status: "idle",
                                  url: "",
                                },
                                child: {
                                  editableLabel: selectedLanguage === "JPN" ? "キッズの発音🔈" : "아이발음🔈",
                                  editingLabel: false,
                                  voice: VOICES[2].id,
                                  speed: 1.0,
                                  text: messageText,
                                  status: "idle",
                                  url: "",
                                },
                              }
                            });

                            // 다이어리 설정
                            setDiaryConfigs({
                              [key]: {
                                label: selectedLanguage === "JPN" ? "今日の一文を作る✏️" : "오늘의 문장 만들기✏️",
                                url: DIARY_DEFAULT_URL,
                                editingLabel: false,
                                editingUrl: false,
                              }
                            });

                            setVocaConfigs({});
                            setApprovedKeys(new Set());
                          }}
                          className={`w-full h-full px-3 py-3 text-[13px] font-medium transition-colors ${
                            isSelected
                              ? 'bg-blue-500 text-white'
                              : hasContent
                              ? 'bg-white text-gray-700 hover:bg-gray-50'
                              : 'bg-white text-gray-400 hover:bg-gray-50'
                          }`}
                          style={{
                            border: isSelected
                              ? 'none'
                              : hasContent
                              ? '2px solid #22c55e'
                              : '2px solid #ef4444',
                            margin: '-1px'
                          }}
                        >
                          {userLevel}×{childLv}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="p-6">
      <div className="mb-4">
        <h1 className="text-[22px] font-extrabold text-slate-900 tracking-tight">AI 콘텐츠 생성</h1>
        <p className="text-[12px] text-slate-600 mt-1">
          주제/날짜/레벨/언어/상품을 선택하여 1개 콘텐츠를 생성하고 편집해보세요.
        </p>
      </div>

      {TopBar}
      {Indicator}

      {/* 에러 메시지 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
          <div className="text-red-800 text-sm">{error}</div>
        </div>
      )}

      {/* MessageType이 없으면 콘텐츠 카드 숨기기 */}
      {!messageTypeExists ? (
        <div className="bg-white rounded-xl shadow-sm border p-12 text-center text-sm text-slate-600">
          해당 날짜의 MessageType이 없습니다. 주제와 맥락을 입력한 후 '저장' 버튼을 눌러주세요.
        </div>
      ) : !messages ? (
        <div className="bg-white rounded-xl shadow-sm border p-12 text-center text-sm text-slate-600">
          상단 설정을 입력하고 '조회 및 생성' 또는 'AI 재생성'을 눌러 주세요.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {items.map((row) => {
            const key = row.key;
            const text = messages[key] || "";
            const hasVoca = row.hasVoca;

            const mom = audioConfig?.[key]?.mom || {};
            const child = audioConfig?.[key]?.child || {};

            const voca = hasVoca ? vocaConfigs?.[key] : null;
            const diary = diaryConfigs?.[key];

            const isApproved = approvedKeys.has(key);

            return (
              // 콘텐츠 박스 border 2px, #707070
              <div
                key={key}
                className="bg-white rounded-xl shadow-sm p-4"
                style={{ border: "2px solid #707070" }}
              >
                {/* 카드 헤더 */}
                <div className="flex items-center justify-between mb-3 pb-2 border-b">
                  <div className="font-semibold text-slate-800">{row.title}</div>
                  <div className="text-[12px] text-slate-500">
                    {contentTheme || "주제 미지정"} · {contentDate}
                  </div>
                </div>

                {/* (2) 좌우 분할: 좌(편집 2컬럼) / 우(모바일 미리보기) */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* 좌측: col-span-2, 내부 2컬럼 폼 배치 */}
                  <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* (A) 메시지 섹션 */}
                    <section className="border rounded-lg md:col-span-2">
                      <header className="px-3 py-2 border-b bg-gray-50 text-[12px] font-semibold text-slate-700">
                        메시지 (자동 생성·수정)
                      </header>
                      <div className="p-3">
                        <textarea
                          rows={6}
                          className={`w-full border rounded-lg p-3 ${MSG_STYLE.main} focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                          value={text}
                          onChange={(e) => updateMessage(key, e.target.value)}
                          placeholder="메시지를 입력/수정하세요 (영문+한글 포함 가능)"
                        />
                        <div className={`${MSG_STYLE.note} mt-2`}>
                          본문 14px / #191919 · 섹션 간 구분선으로 가독성 향상
                        </div>
                      </div>
                    </section>

                    {/* (B-1) AI 음성 생성 - 엄마 */}
                    <section className="border rounded-lg">
                      <header className="px-3 py-2 border-b bg-gray-50 text-[12px] font-semibold text-slate-700">
                        {mom.editingLabel ? (
                          <div className="flex items-center gap-2">
                            <input
                              className="border rounded px-2 py-1 text-[12px]"
                              value={mom.editableLabel || ""}
                              onChange={(e) =>
                                updateAudioField(key, "mom", { editableLabel: e.target.value })
                              }
                            />
                            <button
                              className={BTN_SECONDARY}
                              onClick={() => updateAudioField(key, "mom", { editingLabel: false })}
                            >
                              완료
                            </button>
                          </div>
                        ) : (
                          <button
                            className="text-[13px] font-semibold text-slate-800 underline underline-offset-4"
                            onClick={() => updateAudioField(key, "mom", { editingLabel: true })}
                            title="클릭하여 버튼명을 수정할 수 있습니다."
                          >
                            {mom.editableLabel || audioButtonLabelDefaultMom}
                          </button>
                        )}
                      </header>

                      <div className="p-3 space-y-3">
                        <label className="block text-[12px] text-slate-600 mb-1">
                          음성 생성용 텍스트
                        </label>
                        <textarea
                          rows={4}
                          className="w-full border rounded-lg p-3 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                          value={mom.text || ""}
                          onChange={(e) => updateAudioField(key, "mom", { text: e.target.value })}
                        />

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[12px] text-slate-600 mb-1">캐릭터</label>
                            <select
                              className="w-full border rounded-lg p-2 text-[12px]"
                              value={mom.voice || VOICES[0].id}
                              onChange={(e) => updateAudioField(key, "mom", { voice: e.target.value })}
                            >
                              {VOICES.map((v) => (
                                <option key={v.id} value={v.id}>
                                  {v.name}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-[12px] text-slate-600 mb-1">속도</label>
                            <input
                              type="range"
                              min="0.5"
                              max="2"
                              step="0.1"
                              className="w-full"
                              value={mom.speed || 1.0}
                              onChange={(e) =>
                                updateAudioField(key, "mom", { speed: Number(e.target.value) })
                              }
                            />
                            <div className="text-[12px] text-slate-600 mt-1">
                              {(mom.speed || 1.0).toFixed(1)}x
                            </div>
                          </div>
                        </div>

                        {/* (3) 버튼색: 생성/미리듣기=회색, 버튼에 넣기=파랑, 오른쪽 🔄 */}
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => generateAudio(key, "mom")}
                            className={BTN_NEUTRAL}
                          >
                            {audioGenerateLabel}
                            {mom.status === "generating" ? " (생성중…)" : ""}
                          </button>
                          <button onClick={() => previewAudio(mom.url)} className={BTN_NEUTRAL}>
                            미리 듣기
                          </button>
                          <button
                            onClick={() => attachAudioUrlToButton(key, "mom")}
                            className={`${BTN_PRIMARY} col-span-1`}
                          >
                            버튼에 넣기
                          </button>
                          <button
                            title="리셋"
                            onClick={() => resetAudio(key, "mom", text)}
                            className={`${BTN_SECONDARY} col-span-1`}
                          >
                            🔄
                          </button>
                        </div>

                        {mom.status === "success" && (
                          <div className="grid grid-cols-3 gap-2 items-center">
                            <label className="text-[12px] text-slate-600 col-span-1">오디오 URL</label>
                            <input
                              className="border rounded px-2 py-1 text-[12px] col-span-2"
                              value={mom.url || ""}
                              onChange={(e) => updateAudioField(key, "mom", { url: e.target.value })}
                            />
                          </div>
                        )}
                      </div>
                    </section>

                    {/* (B-2) AI 음성 생성 - 아이 */}
                    <section className="border rounded-lg">
                      <header className="px-3 py-2 border-b bg-gray-50 text-[12px] font-semibold text-slate-700">
                        {child.editingLabel ? (
                          <div className="flex items-center gap-2">
                            <input
                              className="border rounded px-2 py-1 text-[12px]"
                              value={child.editableLabel || ""}
                              onChange={(e) =>
                                updateAudioField(key, "child", { editableLabel: e.target.value })
                              }
                            />
                            <button
                              className={BTN_SECONDARY}
                              onClick={() => updateAudioField(key, "child", { editingLabel: false })}
                            >
                              완료
                            </button>
                          </div>
                        ) : (
                          <button
                            className="text-[13px] font-semibold text-slate-800 underline underline-offset-4"
                            onClick={() => updateAudioField(key, "child", { editingLabel: true })}
                            title="클릭하여 버튼명을 수정할 수 있습니다."
                          >
                            {child.editableLabel || audioButtonLabelDefaultChild}
                          </button>
                        )}
                      </header>

                      <div className="p-3 space-y-3">
                        <label className="block text-[12px] text-slate-600 mb-1">
                          음성 생성용 텍스트
                        </label>
                        <textarea
                          rows={4}
                          className="w-full border rounded-lg p-3 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                          value={child.text || ""}
                          onChange={(e) => updateAudioField(key, "child", { text: e.target.value })}
                        />

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[12px] text-slate-600 mb-1">캐릭터</label>
                            <select
                              className="w-full border rounded-lg p-2 text-[12px]"
                              value={child.voice || VOICES[2].id}
                              onChange={(e) => updateAudioField(key, "child", { voice: e.target.value })}
                            >
                              {VOICES.map((v) => (
                                <option key={v.id} value={v.id}>
                                  {v.name}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-[12px] text-slate-600 mb-1">속도</label>
                            <input
                              type="range"
                              min="0.5"
                              max="2"
                              step="0.1"
                              className="w-full"
                              value={child.speed || 1.0}
                              onChange={(e) =>
                                updateAudioField(key, "child", { speed: Number(e.target.value) })
                              }
                            />
                            <div className="text-[12px] text-slate-600 mt-1">
                              {(child.speed || 1.0).toFixed(1)}x
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => generateAudio(key, "child")}
                            className={BTN_NEUTRAL}
                          >
                            {audioGenerateLabel}
                            {child.status === "generating" ? " (생성중…)" : ""}
                          </button>
                          <button onClick={() => previewAudio(child.url)} className={BTN_NEUTRAL}>
                            미리 듣기
                          </button>
                          <button
                            onClick={() => attachAudioUrlToButton(key, "child")}
                            className={`${BTN_PRIMARY} col-span-1`}
                          >
                            버튼에 넣기
                          </button>
                          <button
                            title="리셋"
                            onClick={() => resetAudio(key, "child", text)}
                            className={`${BTN_SECONDARY} col-span-1`}
                          >
                            🔄
                          </button>
                        </div>

                        {child.status === "success" && (
                          <div className="grid grid-cols-3 gap-2 items-center">
                            <label className="text-[12px] text-slate-600 col-span-1">오디오 URL</label>
                            <input
                              className="border rounded px-2 py-1 text-[12px] col-span-2"
                              value={child.url || ""}
                              onChange={(e) => updateAudioField(key, "child", { url: e.target.value })}
                            />
                          </div>
                        )}
                      </div>
                    </section>

                    {/* (C) 부가 버튼: 보카 / 오늘의 문장 (URL 우측 '수정' 토글) */}
                    {hasVoca && (
                      <section className="border rounded-lg">
                        <header className="px-3 py-2 border-b bg-gray-50 text-[12px] font-semibold text-slate-700">
                          {voca?.editingLabel ? (
                            <div className="flex items-center gap-2">
                              <input
                                className="border rounded px-2 py-1 text-[12px]"
                                value={voca?.label || ""}
                                onChange={(e) => updateVoca(key, { label: e.target.value })}
                              />
                              <button
                                className={BTN_SECONDARY}
                                onClick={() => updateVoca(key, { editingLabel: false })}
                              >
                                완료
                              </button>
                            </div>
                          ) : (
                            <button
                              className="text-[13px] font-semibold text-slate-800 underline underline-offset-4"
                              onClick={() => updateVoca(key, { editingLabel: true })}
                              title="클릭하여 버튼명을 수정할 수 있습니다."
                            >
                              {voca?.label || vocaDefaultLabel}
                            </button>
                          )}
                        </header>
                        <div className="p-3">
                          <label className="block text-[12px] text-slate-600 mb-1">URL</label>
                          <div className="flex gap-2">
                            <input
                              className="flex-1 p-2.5 border rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                              placeholder="https://voca.example.com/..."
                              value={voca?.url || ""}
                              onChange={(e) => updateVoca(key, { url: e.target.value })}
                            />
                          </div>
                        </div>
                      </section>
                    )}

                    <section className="border rounded-lg">
                      <header className="px-3 py-2 border-b bg-gray-50 text-[12px] font-semibold text-slate-700">
                        {diary?.editingLabel ? (
                          <div className="flex items-center gap-2">
                            <input
                              className="border rounded px-2 py-1 text-[12px]"
                              value={diary?.label || ""}
                              onChange={(e) => updateDiary(key, { label: e.target.value })}
                            />
                            <button
                              className={BTN_SECONDARY}
                              onClick={() => updateDiary(key, { editingLabel: false })}
                            >
                              완료
                            </button>
                          </div>
                        ) : (
                          <button
                            className="text-[13px] font-semibold text-slate-800 underline underline-offset-4"
                            onClick={() => updateDiary(key, { editingLabel: true })}
                            title="클릭하여 버튼명을 수정할 수 있습니다."
                          >
                            {diary?.label || diaryDefaultLabel}
                          </button>
                        )}
                      </header>
                      <div className="p-3">
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[12px] text-slate-600">URL</label>
                          {/* (1) 오른쪽 ‘수정/완료’ 버튼으로 URL 수정 토글 */}
                          {!diary?.editingUrl ? (
                            <button
                              className="text-[12px] text-blue-600 hover:underline"
                              onClick={() => updateDiary(key, { editingUrl: true })}
                            >
                              수정
                            </button>
                          ) : (
                            <button
                              className="text-[12px] text-blue-600 hover:underline"
                              onClick={() => updateDiary(key, { editingUrl: false })}
                            >
                              완료
                            </button>
                          )}
                        </div>
                        <input
                          className="w-full p-2.5 border rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:bg-gray-50"
                          value={diary?.url || ""}
                          onChange={(e) => updateDiary(key, { url: e.target.value })}
                          disabled={!diary?.editingUrl}
                        />
                        <div className="text-[12px] text-slate-600 mt-1">
                          * 기본 URL이 자동 입력됩니다. 필요 시 ‘수정’으로 변경 후 ‘완료’를 눌러 반영하세요.
                        </div>
                      </div>
                    </section>

                    {/* (D) 액션 버튼 */}
                    <section className="border rounded-lg md:col-span-2">
                      <header className="px-3 py-2 border-b bg-gray-50 text-[12px] font-semibold text-slate-700">
                        콘텐츠 액션
                      </header>
                      <div className="p-3">
                        <div className="grid grid-cols-3 gap-3">
                          <button
                            onClick={() => updateContent(key, row.title)}
                            className={BTN_SECONDARY}
                            disabled={isLoading}
                          >
                            수정하기
                          </button>

                          <button
                            onClick={() => testContent(key, row.title)}
                            className={BTN_SECONDARY}
                            disabled={isLoading}
                          >
                            테스트 발송
                          </button>

                          {isApproved ? (
                            <button className={`${BTN_NEUTRAL} cursor-default`} disabled>
                              승인됨 ✓
                            </button>
                          ) : (
                            <button
                              onClick={() => approveContent(key, row.title)}
                              className={BTN_APPROVE}
                              style={{ backgroundColor: "#F65159", borderColor: "#F65159" }}
                              disabled={isLoading}
                            >
                              승인하기
                            </button>
                          )}
                        </div>
                        <div className="text-[12px] text-slate-500 mt-2">
                          * 그룹 지정 및 발송 예약은 '콘텐츠 발송 및 그룹 설정' 페이지에서 진행합니다.
                        </div>
                      </div>
                    </section>
                  </div>

                  {/* 우측: 미리보기 (≈ 1/3) */}
                  <div className="lg:col-span-1">
                    <h4 className="text-[12px] font-semibold text-slate-700 mb-2">미리보기</h4>
                    <PreviewBubble
                      momBtnLabel={mom.editableLabel || audioButtonLabelDefaultMom}
                      childBtnLabel={child.editableLabel || audioButtonLabelDefaultChild}
                      momUrl={mom.url || ""}
                      childUrl={child.url || ""}
                      vocaLabelText={voca?.label || vocaDefaultLabel}
                      vocaUrl={hasVoca ? voca?.url || "" : ""}
                      diaryLabelText={diary?.label || diaryDefaultLabel}
                      diaryUrl={diary?.url || ""}
                      bodyText={text}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
