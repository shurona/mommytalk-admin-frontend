import React, { useMemo, useState } from "react";

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

/** 8개 조합(아이=1, 엄마=3 제외) */
const COMBOS_8 = Array.from({ length: 3 }, (_, c) =>
  Array.from({ length: 3 }, (_, m) => ({ child: c + 1, mom: m + 1 }))
)
  .flat()
  .filter((k) => !(k.child === 1 && k.mom === 3));

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

export default function ContentGeneration({ country = "KOR" }) {
  const isJP = country === "JPN";
  const audioButtonLabelDefaultMom = isJP ? "ママの発音🔈" : "엄마발음🔈";
  const audioButtonLabelDefaultChild = isJP ? "キッズの発音🔈" : "아이발음🔈";
  const vocaDefaultLabel = isJP ? "デジタルフラッシュカード" : "마미보카📩";
  const diaryDefaultLabel = isJP ? "今日の一文を作る✏️" : "오늘의 문장 만들기✏️";
  const audioGenerateLabel = isJP ? "AI音声生成" : "AI음성 생성";
  const DIARY_DEFAULT_URL = "https://mamitalk.example.com/diary"; // (1) 기본 URL 자동 삽입

  const [contentTheme, setContentTheme] = useState("");
  const [contentDate, setContentDate] = useState("2024-03-22");

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

  /** 생성: 2개 상품 × 8조합 → 16카드 */
  const generate = () => {
    const msg = {};
    const tgt = {};
    const audio = {};
    const voca = {};
    const diary = {};

    PRODUCTS.forEach((p) => {
      COMBOS_8.forEach(({ child, mom }) => {
        const key = `${p.id}|${child}_${mom}`;
        const base = seedText(child, mom);
        msg[key] = base;
        tgt[key] = "전체 사용자";

        audio[key] = {
          mom: {
            editableLabel: audioButtonLabelDefaultMom,
            editingLabel: false,
            voice: VOICES[0].id,
            speed: 1.0,
            text: base, // 자동 입력
            status: "idle", // idle | generating | success
            url: "",
          },
          child: {
            editableLabel: audioButtonLabelDefaultChild,
            editingLabel: false,
            voice: VOICES[2].id,
            speed: 1.0,
            text: base,
            status: "idle",
            url: "",
          },
        };

        if (p.hasVoca) {
          voca[key] = {
            label: vocaDefaultLabel,
            editingLabel: false,
            url: "",
          };
        }

        diary[key] = {
          label: diaryDefaultLabel,
          url: DIARY_DEFAULT_URL, // (1) 기본 URL 주입
          editingLabel: false,
          editingUrl: false, // 오른쪽 버튼으로 URL 수정 토글
        };
      });
    });

    setMessages(msg);
    setGroupTargets(tgt);
    setAudioConfig(audio);
    setVocaConfigs(voca);
    setDiaryConfigs(diary);
    setApprovedKeys(new Set()); // 카운터 리셋
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
      const url = `https://cdn.example.com/tts/${encodeURIComponent(key)}-${role}.mp3`;
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

  /** 승인/예약 */
  const approveAndSchedule = (key, title) => {
    setApprovedKeys((prev) => {
      if (prev.has(key)) return prev;
      const next = new Set(prev);
      next.add(key);
      return next;
    });
    alert(`승인 및 예약 등록 완료: ${title}`);
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

  /** 상단 가로형 설정 바 */
  const TopBar = (
    <div className="bg-white border rounded-xl shadow-sm p-4 mb-4">
      <div className="grid gap-4 md:grid-cols-12">
        <div className="md:col-span-6">
          <label className="block text-[12px] text-slate-600 mb-1 font-medium">주제</label>
          <input
            type="text"
            value={contentTheme}
            onChange={(e) => setContentTheme(e.target.value)}
            placeholder="예: 아침 인사, 놀이 시간"
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          />
        </div>
        <div className="md:col-span-3">
          <label className="block text-[12px] text-slate-600 mb-1 font-medium">발송 날짜</label>
          <input
            type="date"
            value={contentDate}
            onChange={(e) => setContentDate(e.target.value)}
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          />
        </div>
        <div className="md:col-span-3 flex items-end">
          <button onClick={generate} className={`${BTN_PRIMARY} w-full`}>
            AI 콘텐츠 생성하기 (16개)
          </button>
        </div>
      </div>
      <div className="text-[12px] text-slate-500 mt-2">
        * 국가 설정은 상단 어드민 탑바 글로벌 옵션을 따릅니다. (현재: <b>{country}</b>)
      </div>
    </div>
  );

  /** 상단 인디케이터 */
  const Indicator = messages && (
    <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-3">
      <div className="bg-white border rounded-xl shadow-sm px-4 py-3">
        <div className="text-[12px] text-slate-500">생성된 콘텐츠</div>
        <div className="text-[20px] font-extrabold text-slate-900 mt-0.5">{items.length}</div>
      </div>
      <div className="bg-white border rounded-xl shadow-sm px-4 py-3">
        <div className="text-[12px] text-slate-500">승인·예약된 콘텐츠</div>
        <div className="text-[20px] font-extrabold text-slate-900 mt-0.5">{approvedKeys.size}</div>
      </div>
    </div>
  );

  return (
    <div className="p-6">
      <div className="mb-4">
        <h1 className="text-[22px] font-extrabold text-slate-900 tracking-tight">AI 콘텐츠 생성</h1>
        <p className="text-[12px] text-slate-600 mt-1">
          주제/날짜 설정 후 두 상품(마미톡 365 / 365+보카)의 8개 조합씩 총 16개 카드를 생성·편집하세요.
        </p>
      </div>

      {TopBar}
      {Indicator}

      {!messages ? (
        <div className="bg-white rounded-xl shadow-sm border p-12 text-center text-sm text-slate-600">
          상단 설정을 입력하고 ‘AI 콘텐츠 생성하기’를 눌러 주세요.
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

                    {/* (D) 발송 그룹 + CTA */}
                    <section className="border rounded-lg md:col-span-2">
                      <header className="px-3 py-2 border-b bg-gray-50 text-[12px] font-semibold text-slate-700">
                        발송 설정
                      </header>
                      <div className="p-3">
                        <label className="block text-[12px] text-slate-600 mb-1">발송 그룹 지정</label>
                        <select
                          className="w-full border rounded-lg p-2 text-[12px]"
                          value={groupTargets[key] || "전체 사용자"}
                          onChange={(e) => updateTarget(key, e.target.value)}
                        >
                          <option>전체 사용자</option>
                          <option>프리미엄 구매자</option>
                          <option>테스트 그룹</option>
                        </select>

                        <div className="mt-3 grid grid-cols-2 gap-2">
                          <button
                            onClick={() => alert(`[테스트 발송] ${row.title}`)}
                            className={BTN_SECONDARY}
                          >
                            테스트 발송
                          </button>

                          {isApproved ? (
                            <button className={`${BTN_NEUTRAL} cursor-default`} disabled>
                              예약됨
                            </button>
                          ) : (
                            <button
                              onClick={() => approveAndSchedule(key, row.title)}
                              className={BTN_APPROVE}
                              style={{ backgroundColor: "#F65159", borderColor: "#F65159" }}
                            >
                              승인 → 예약
                            </button>
                          )}
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
