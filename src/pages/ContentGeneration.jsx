import React, { useMemo, useState } from "react";

/** 카카오/라인 근사 스타일 (가독성 위주) */
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

/** 버튼 프리셋: 중요도별 컬러 체계 */
const BTN_BASE = "w-full py-2 rounded text-[12px] transition border";
const BTN_NEUTRAL = `${BTN_BASE} bg-[#F5F6F7] border-[#E9EAEB] text-[#111827] hover:bg-[#ECEDEF]`;
const BTN_PRIMARY = `${BTN_BASE} bg-[#2563EB] border-[#1E40AF] text-white hover:bg-[#1D4ED8]`;
const BTN_SECONDARY = `${BTN_BASE} bg-white border-[#E5E7EB] text-[#111827] hover:bg-gray-50`;

/** 부모 탑바에서 country 내려줄 수 있음 (기본 KOR) */
export default function ContentGeneration({ country = "KOR" }) {
  const audioButtonLabel = country === "JPN" ? "ネイティブの発音を聞く" : "음성 재생 버튼";
  const vocaLabel = country === "JPN" ? "デジタルフラッシュカード" : "마미보카📩";
  const audioGenerateLabel = "AI음성 생성";

  const [contentTheme, setContentTheme] = useState("");
  const [contentDate, setContentDate] = useState("2024-03-22");

  // 생성 결과(레벨 메시지)
  // key: `${productId}|${child}_${mom}`
  const [messages, setMessages] = useState(null);

  // 레벨별 상태
  const [audioStatus, setAudioStatus] = useState({}); // generating | success
  const [audioUrls, setAudioUrls] = useState({});
  const [audioTexts, setAudioTexts] = useState({});
  const [vocaUrls, setVocaUrls] = useState({});
  const [groupTargets, setGroupTargets] = useState({});

  // 승인/예약 인디케이터용 상태
  const [approvedKeys, setApprovedKeys] = useState(new Set()); // 예약 완료된 카드 키 집합

  /** 생성: 2개 상품 × 8조합 → 16카드 */
  const generate = () => {
    const msg = {};
    const aTxt = {};
    const voc = {};
    const tgt = {};

    PRODUCTS.forEach((p) => {
      COMBOS_8.forEach(({ child, mom }) => {
        const key = `${p.id}|${child}_${mom}`;
        const base = seedText(child, mom);
        msg[key] = base;
        aTxt[key] = base;
        tgt[key] = "전체 사용자";
        if (p.hasVoca) voc[key] = ""; // 보카 상품만 개별 URL 사용
      });
    });

    setMessages(msg);
    setAudioTexts(aTxt);
    setAudioStatus({});
    setAudioUrls({});
    setVocaUrls(voc);
    setGroupTargets(tgt);
    setApprovedKeys(new Set()); // 새로 생성하면 카운터 리셋
  };

  const updateMessage = (key, val) => setMessages((p) => ({ ...p, [key]: val }));
  const updateAudioText = (key, val) => setAudioTexts((p) => ({ ...p, [key]: val }));
  const updateVoca = (key, val) => setVocaUrls((p) => ({ ...p, [key]: val }));
  const updateTarget = (key, val) => setGroupTargets((p) => ({ ...p, [key]: val }));

  const generateAudio = (key) => {
    setAudioStatus((p) => ({ ...p, [key]: "generating" }));
    setTimeout(() => {
      const url = `https://cdn.example.com/tts/${encodeURIComponent(key)}.mp3`;
      setAudioUrls((p) => ({ ...p, [key]: url }));
      setAudioStatus((p) => ({ ...p, [key]: "success" }));
    }, 1200);
  };

  const attachAudioUrlToButton = (key) => {
    if (!audioUrls[key]) {
      alert("먼저 AI음성 생성으로 URL을 확보해 주세요.");
      return;
    }
    alert("미리보기 메시지의 [음성 재생 버튼]에 URL이 연결되었습니다.");
  };

  const approveAndSchedule = (key, title) => {
    // 중복 승인 방지
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

    // 상품 레이블/보카 가능 여부 맵
    const productMap = Object.fromEntries(PRODUCTS.map((p) => [p.id, p]));
    // 상품별 번호(1~8) 부여를 위한 카운터
    const counters = { 365: 0, combo: 0 };

    // 정렬 기준: 상품 라벨(문자열) ↑ → child ↑ → mom ↑
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

    // 동일 상품 내 번호 부여
    return rows.map((r) => {
      counters[r.productId] += 1;
      const number = counters[r.productId];
      return {
        ...r,
        number,
        title: `${r.productLabel} ${number}. 아이${r.child} × 엄마${r.mom}`,
      };
    });
  }, [messages]);

  /** 미리보기: 배경 #84A1D0, 버튼들은 메시지 박스 내부 */
  const PreviewBubble = ({ playLabel, vocaLabelText, audioUrl, vocaUrl, bodyText }) => (
    <div className="rounded-lg p-3" style={{ backgroundColor: "#84A1D0" }}>
      <div className="bg-white rounded-lg w-[300px] min-h-[320px] shadow-sm border border-gray-200 mx-auto">
        {/* 상단 앱 바 */}
        <div className="bg-[#1E88E5] text-white px-4 py-2 rounded-t-lg flex items-center justify-between">
          <span className="text-[12px] font-medium">마미톡 잉글리시 ({country})</span>
          <span className="text-[10px] opacity-90">Preview</span>
        </div>

        <div className="p-4">
          {/* 메시지 카드 (버튼 포함) */}
          <div className="rounded-xl border border-gray-200 bg-[#FAFAFA] px-3 py-3 space-y-3">
            {/* 상단: 음성 재생 버튼 */}
            <button
              className={BTN_NEUTRAL}
              onClick={() => {
                if (audioUrl) alert(`[재생] ${audioUrl}`);
                else alert("오디오 URL이 아직 없습니다.");
              }}
            >
              {playLabel}
            </button>

            {/* 본문 */}
            <p className={`${MSG_STYLE.main} whitespace-pre-line`}>{bodyText}</p>

            {/* 하단: 마미보카 (있을 때만) */}
            {!!vocaUrl && (
              <button
                className={BTN_NEUTRAL}
                onClick={() => alert(`[링크 이동] ${vocaUrl}`)}
              >
                {vocaLabelText}
              </button>
            )}
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
        * 국가 설정은 상단 어드민 탑바의 글로벌 옵션을 따릅니다. (현재: <b>{country}</b>)
      </div>
    </div>
  );

  /** 상단 인디케이터: "생성된 콘텐츠 n | 승인·예약된 콘텐츠 m" */
  const Indicator = messages && (
    <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-3">
      <div className="bg-white border rounded-xl shadow-sm px-4 py-3">
        <div className="text-[12px] text-slate-500">생성된 콘텐츠</div>
        <div className="text-[20px] font-extrabold text-slate-900 mt-0.5">
          {items.length}
        </div>
      </div>
      <div className="bg-white border rounded-xl shadow-sm px-4 py-3">
        <div className="text-[12px] text-slate-500">승인·예약된 콘텐츠</div>
        <div className="text-[20px] font-extrabold text-slate-900 mt-0.5">
          {approvedKeys.size}
        </div>
      </div>
      {/* 여유 슬롯: 추후 "TTS 생성 완료", "보카 URL 입력됨" 등 확장 가능 */}
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
        <div className="grid grid-cols-1 2xl:grid-cols-2 gap-6">
          {items.map((row) => {
            const key = row.key;
            const text = messages[key] || "";
            const audioUrl = audioUrls[key] || "";
            const vocaUrl = row.hasVoca ? (vocaUrls[key] || "") : ""; // 365는 항상 공백 처리
            const isApproved = approvedKeys.has(key);

            return (
              <div key={key} className="bg-white rounded-xl shadow-sm border p-4">
                {/* 카드 헤더 */}
                <div className="flex items-center justify-between mb-3 pb-2 border-b">
                  <div className="font-semibold text-slate-800">{row.title}</div>
                  <div className="text-[12px] text-slate-500">
                    {contentTheme || "주제 미지정"} · {contentDate}
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* 좌측: 3 섹션 (메시지/음성/보카[상품별]) */}
                  <div className="space-y-4">
                    {/* 1) 메시지 */}
                    <section className="border rounded-lg">
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

                    {/* 2) AI 음성 생성 */}
                    <section className="border rounded-lg">
                      <header className="px-3 py-2 border-b bg-gray-50 text-[12px] font-semibold text-slate-700">
                        [{audioButtonLabel}] : {audioGenerateLabel}
                      </header>
                      <div className="p-3 space-y-3">
                        <div>
                          <label className="block text-[12px] text-slate-600 mb-1">
                            음성 생성용 텍스트
                          </label>
                          <textarea
                            rows={4}
                            className="w-full border rounded-lg p-3 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            value={audioTexts[key] || ""}
                            onChange={(e) => updateAudioText(key, e.target.value)}
                            placeholder="TTS에 사용할 텍스트를 입력/수정하세요"
                          />
                        </div>

                        <button onClick={() => generateAudio(key)} className={BTN_PRIMARY}>
                          {audioGenerateLabel}
                          {audioStatus[key] === "generating" ? " (생성중…)" : ""}
                        </button>

                        {audioStatus[key] === "success" && (
                          <div className="border rounded-lg p-3 space-y-2 bg-gray-50/60">
                            <div className="text-[12px] text-slate-600">오디오 URL</div>
                            <input
                              className="w-full border rounded p-2 text-[12px]"
                              value={audioUrl}
                              onChange={(e) =>
                                setAudioUrls((p) => ({ ...p, [key]: e.target.value }))
                              }
                            />
                            <button onClick={() => attachAudioUrlToButton(key)} className={BTN_NEUTRAL}>
                              버튼에 넣기
                            </button>
                          </div>
                        )}
                      </div>
                    </section>

                    {/* 3) 마미보카 버튼 설정 (보카 상품에만 노출) */}
                    {row.hasVoca && (
                      <section className="border rounded-lg">
                        <header className="px-3 py-2 border-b bg-gray-50 text-[12px] font-semibold text-slate-700">
                          마미보카 버튼 설정
                        </header>
                        <div className="p-3 space-y-3">
                          <input
                            className="w-full p-2.5 border rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            placeholder="https://voca.example.com/..."
                            value={vocaUrl}
                            onChange={(e) => updateVoca(key, e.target.value)}
                          />
                          <div className="text-[12px] text-slate-600">
                            * 미리보기 메시지 박스 하단에 <b>{vocaLabel}</b>로 노출됩니다. (실서비스: 365+보카 구매자 한정)
                          </div>
                        </div>
                      </section>
                    )}
                  </div>

                  {/* 우측: 미리보기 + 발송그룹 + CTA */}
                  <div>
                    <h4 className="text-[12px] font-semibold text-slate-700 mb-2">미리보기</h4>
                    <PreviewBubble
                      playLabel={audioButtonLabel}
                      vocaLabelText={vocaLabel}
                      audioUrl={audioUrl}
                      vocaUrl={vocaUrl}
                      bodyText={text}
                    />

                    {/* 미리보기와 승인 버튼 사이: 발송 그룹 지정 */}
                    <div className="mt-3">
                      <label className="block text-[12px] text-slate-600 mb-1">
                        발송 그룹 지정
                      </label>
                      <select
                        className="w-full border rounded-lg p-2 text-[12px]"
                        value={groupTargets[key] || "전체 사용자"}
                        onChange={(e) => updateTarget(key, e.target.value)}
                      >
                        <option>전체 사용자</option>
                        <option>프리미엄 구매자</option>
                        <option>테스트 그룹</option>
                      </select>
                    </div>

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
                          className={BTN_PRIMARY}
                        >
                          승인 → 예약
                        </button>
                      )}
                    </div>
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
