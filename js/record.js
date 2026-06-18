/* ============================================================
   PetCare+ 1차 MVP · 기록 화면 로직
   - 데이터는 공통 저장소 window.PetStore (localStorage 기반)를 사용합니다.
   - 단일 반려견(해피) 기준. 저장 시 created_at 포함.
   - URL ?type=symptom|meal|water|poop|weight|photo|... 로 진입하면
     해당 기록 작성 시트가 자동으로 열립니다.
   ============================================================ */
(function () {
  "use strict";

  /* ── 0. 유틸 ─────────────────────────────────────────── */
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const el = (html) => { const t = document.createElement("template"); t.innerHTML = html.trim(); return t.content.firstElementChild; };
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  function toast(msg, icon = "check_circle") {
    let t = $(".toast");
    if (!t) { t = el(`<div class="toast"></div>`); $(".app").appendChild(t); }
    t.innerHTML = `<span class="material-symbols-rounded">${icon}</span>${esc(msg)}`;
    t.classList.add("show");
    clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove("show"), 1900);
  }

  function ampm(hhmm) {
    if (!hhmm) return "";
    const [h, m] = hhmm.split(":").map(Number);
    const am = h < 12;
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return `${am ? "오전" : "오후"} ${h12}:${String(m).padStart(2, "0")}`;
  }

  /* ── 1. 기록 유형 설정 ──────────────────────────────────
     color: [배경, 아이콘색] / fields: 유형 고유 입력         */
  const TYPES = {
    symptom: {
      label: "증상", icon: "sick", color: ["#FBEAEA", "#D26A6A"], tagClass: "warn",
      q: "어떤 증상이 있었나요?",
      fields: [
        { key: "kind", label: "증상 선택", chips: ["기침", "구토", "설사", "무기력", "식욕저하", "호흡 이상", "통증 반응", "피부 이상", "눈/귀 이상", "기타"], multi: true },
        { key: "severity", label: "심각도", chips: ["가벼움", "보통", "심각"], sev: true },
      ],
    },
    med: {
      label: "복약", icon: "medication", color: ["#FDF0E4", "#E08A4B"], tagClass: "",
      fields: [
        { key: "name", label: "약 이름", input: "text", ph: "예: 심장약" },
        { key: "status", label: "복용 여부", chips: ["복용 완료", "거부", "깜빡함", "일부 복용"] },
        { key: "timing", label: "식전 / 식후", chips: ["식전", "식후", "무관"] },
        { key: "dose", label: "용량", input: "text", ph: "예: 1/2 알" },
      ],
    },
    meal: {
      label: "식사", icon: "restaurant", color: ["#FAF2DD", "#D2A03C"], tagClass: "ghost",
      fields: [
        { key: "kind", label: "식사 종류", chips: ["처방식", "일반 사료", "습식", "화식", "간식", "기타"] },
        { key: "amount", label: "식사량", input: "text", ph: "예: 40g" },
        { key: "complete", label: "완료율", chips: ["25%", "50%", "75%", "완식"] },
      ],
    },
    water: {
      label: "물", icon: "water_drop", color: ["#E6F1F7", "#4E8FB3"], tagClass: "neutral",
      fields: [
        { key: "amount", label: "섭취량 (ml)", input: "number", ph: "예: 100" },
      ],
    },
    poop: {
      label: "배변", icon: "pets", color: ["#F5ECE0", "#B08355"], tagClass: "ghost",
      fields: [
        { key: "stool", label: "상태", chips: ["정상", "묽음", "설사", "변비", "혈변"] },
        { key: "count", label: "횟수", input: "number", ph: "회" },
      ],
    },
    weight: {
      label: "체중", icon: "monitor_weight", color: ["#E6F3EC", "#5BA081"], tagClass: "",
      fields: [
        { key: "weight", label: "체중 (kg)", input: "number", ph: "예: 3.8" },
      ],
    },
    temp: {
      label: "체온", icon: "thermostat", color: ["#FBEBE4", "#D9785C"], tagClass: "warn",
      note: "강아지 정상 체온은 약 38.0 ~ 39.2 ℃ 예요.",
      fields: [
        { key: "temp", label: "체온 (℃)", input: "number", ph: "예: 38.5" },
      ],
    },
    breath: {
      label: "호흡", icon: "air", color: ["#E4F2F1", "#5A9E9E"], tagClass: "",
      note: "안정 시 분당 호흡수는 보통 30회 이하예요.",
      fields: [
        { key: "rate", label: "분당 호흡수", input: "number", ph: "예: 24" },
        { key: "state", label: "상태", chips: ["안정", "주의"] },
      ],
    },
    walk: {
      label: "산책", icon: "directions_walk", color: ["#EAF3E6", "#6BA368"], tagClass: "ghost",
      fields: [
        { key: "duration", label: "산책 시간", input: "text", ph: "예: 30분" },
        { key: "distance", label: "산책 거리", input: "text", ph: "예: 1.2km" },
        { key: "poop", label: "배변 여부", chips: ["함", "안 함"] },
        { key: "condition", label: "컨디션", chips: ["좋음", "보통", "지침"] },
      ],
    },
    photo: {
      label: "사진", icon: "photo_camera", color: ["#F0ECF8", "#927CD8"], tagClass: "neutral",
      fields: [
        { key: "title", label: "제목", input: "text", ph: "예: 피부 상태" },
      ],
    },
    hospital: {
      label: "병원", icon: "local_hospital", color: ["#E9F0F7", "#5B86B0"], tagClass: "neutral",
      fields: [{ key: "place", label: "병원", input: "text", ph: "예: 서울동물병원" }],
    },
    memo: {
      label: "메모", icon: "sticky_note_2", color: ["#F0ECF8", "#8C7BB8"], tagClass: "ghost",
      fields: [{ key: "title", label: "제목", input: "text", ph: "제목" }],
    },
  };

  // 빠른 기록 버튼 — 예정 외 직접 기록 중심(증상/사진/메모/식사/배변) + 더보기에 나머지
  const QUICK_MAIN = ["symptom", "photo", "memo", "meal"];
  const QUICK_MORE = ["poop", "med", "water", "weight", "temp", "breath", "walk"];

  // 카테고리 필터
  const FILTERS = [
    { key: "all", label: "전체" }, { key: "symptom", label: "증상" }, { key: "med", label: "복약" },
    { key: "meal", label: "식사" }, { key: "water", label: "물" }, { key: "poop", label: "배변" },
    { key: "weight", label: "체중" }, { key: "temp", label: "체온" }, { key: "breath", label: "호흡" },
    { key: "walk", label: "산책" }, { key: "hospital", label: "병원" }, { key: "photo", label: "사진" }, { key: "memo", label: "메모" },
  ];

  /* ── 2. 데이터 저장소 (공통 PetStore) ───────────────────
     PetStore 의 record 는 store.js 의 구조를 그대로 사용:
       { id, pet_id, type, date(YYYY.MM.DD), time(HH:MM),
         summary, tag, tagType, memo, photo, important, fields, created_at } */
  const S = window.PetStore;
  const store = {
    get records() { return S.getRecords(); },
    add(r) { return S.addRecord(r); },
    update(id, patch) { return S.updateRecord(id, patch); },
    remove(id) { return S.removeRecord(id); },
    get(id) { return S.getRecord(id); },
  };

  const _todayDate = new Date();
  const _pad = (n) => String(n).padStart(2, "0");
  const TODAY = `${_todayDate.getFullYear()}.${_pad(_todayDate.getMonth() + 1)}.${_pad(_todayDate.getDate())}`;
  const _yd = new Date(_todayDate); _yd.setDate(_yd.getDate() - 1);
  const YESTERDAY = `${_yd.getFullYear()}.${_pad(_yd.getMonth() + 1)}.${_pad(_yd.getDate())}`;
  const relLabel = (d) => (d === TODAY ? "오늘" : d === YESTERDAY ? "어제" : "");

  /* ── 3. 화면 상태 ────────────────────────────────────── */
  let activeFilter = "all";
  let search = { keyword: "", period: "all", type: "all", importantOnly: false, photoOnly: false };
  let editingId = null;

  /* ── 4. 요약 카드 ────────────────────────────────────── */
  function renderSummary() {
    const today = store.records.filter((r) => r.date === TODAY);
    const count = today.length;
    const last = today.reduce((a, r) => (r.time > a ? r.time : a), "00:00");
    $("#sm-count").innerHTML = `오늘 기록 <b>${count}개</b>`;
    $("#sm-last").textContent = count ? `마지막 기록 ${ampm(last)}` : "기록 없음";
  }

  /* ── 5. 빠른 기록 버튼 ───────────────────────────────── */
  function quickBtn(typeKey) {
    const t = TYPES[typeKey];
    return `<button class="quick-btn" data-open-form="${typeKey}" aria-label="${t.label} 기록">
      <span class="quick-ic" style="background:${t.color[0]};color:${t.color[1]}">
        <span class="material-symbols-rounded">${t.icon}</span></span>
      <span>${t.label}</span></button>`;
  }
  function renderQuick() {
    $("#quick-main").innerHTML = QUICK_MAIN.map(quickBtn).join("");
    $("#quick-more").innerHTML = QUICK_MORE.map(quickBtn).join("");
  }

  /* ── 6. 필터 칩 ──────────────────────────────────────── */
  function renderFilters() {
    $("#filters").innerHTML = FILTERS.map((f) =>
      `<button class="filter-chip ${f.key === activeFilter ? "active" : ""}" data-filter="${f.key}"
        aria-pressed="${f.key === activeFilter}">${f.label}</button>`).join("");
  }

  /* ── 유형별 동의어/관련어 맵 ──────────────────────────
     키워드가 기록 내용에 없어도 유형 연관어가 일치하면 표시 */
  const TYPE_ALIASES = {
    symptom: ["증상", "아픔", "아파", "기침", "구토", "설사", "무기력", "식욕저하", "호흡이상", "호흡 이상", "통증", "피부", "눈", "귀", "이상", "sick", "컨디션"],
    med:     ["복약", "약", "투약", "복용", "심장약", "신장", "처방", "medicine", "알약"],
    meal:    ["식사", "밥", "사료", "먹이", "간식", "습식", "화식", "처방식", "먹었", "먹음", "식욕", "food"],
    water:   ["물", "수분", "음수", "water", "마셨", "마심"],
    poop:    ["배변", "대변", "소변", "변", "설사", "변비", "혈변", "배설", "용변"],
    weight:  ["체중", "몸무게", "무게", "kg", "살쪘", "빠졌"],
    temp:    ["체온", "온도", "열", "발열", "temperature"],
    breath:  ["호흡", "숨", "헐떡", "호흡수", "breath"],
    walk:    ["산책", "걷기", "운동", "walk", "산책함"],
    photo:   ["사진", "photo", "사진첨부", "이미지"],
    hospital:["병원", "진료", "의사", "검사", "치료", "수술", "hospital"],
    memo:    ["메모", "노트", "기록", "memo"],
  };

  function keywordMatchesType(kw, type) {
    const aliases = TYPE_ALIASES[type] || [];
    return aliases.some((a) => a.includes(kw) || kw.includes(a));
  }

  /* ── 7. 타임라인 ─────────────────────────────────────── */
  function passesFilter(r) {
    if (activeFilter !== "all" && r.type !== activeFilter) return false;
    if (search.type !== "all" && r.type !== search.type) return false;
    if (search.importantOnly && !r.important) return false;
    if (search.photoOnly && !r.photo) return false;
    if (search.keyword) {
      const kw = search.keyword.toLowerCase();
      const hay = (r.summary + " " + (r.memo || "") + " " + (TYPES[r.type]?.label || "") + " " + JSON.stringify(r.fields || {})).toLowerCase();
      // 직접 텍스트 매칭 OR 유형 동의어 매칭
      if (!hay.includes(kw) && !keywordMatchesType(kw, r.type)) return false;
    }
    // 기간 필터
    if (search.period !== "all") {
      const recIso = r.date.replace(/\./g, "-");  // YYYY-MM-DD
      const todayIso = TODAY.replace(/\./g, "-");
      const todayMs = new Date(todayIso).getTime();
      const recMs = new Date(recIso).getTime();
      if (search.period === "today" && recIso !== todayIso) return false;
      if (search.period === "7d" && recMs < todayMs - 6 * 86400000) return false;
      if (search.period === "30d" && recMs < todayMs - 29 * 86400000) return false;
      if (search.period === "month") {
        const [ty, tm] = todayIso.split("-");
        if (!recIso.startsWith(`${ty}-${tm}`)) return false;
      }
      if (search.period === "custom" && search.customFrom && search.customTo) {
        if (recIso < search.customFrom || recIso > search.customTo) return false;
      }
    }
    return true;
  }

  const SRC_META = {
    schedule_check: ["자동 기록", "src-schedule_check"],
    manual: ["직접 기록", "src-manual"],
    hospital: ["병원 기록", "src-hospital"],
  };

  function recordCard(r) {
    const t = TYPES[r.type] || TYPES.memo;
    const tags = [];
    const src = SRC_META[r.source || "manual"];
    // 아이콘 없이 통일된 알약(pill) 버튼 스타일로 표기
    tags.push(`<span class="rec-tag ${src[1]}">${src[0]}</span>`);
    if (r.tag) tags.push(`<span class="rec-tag ${r.tagType || ""}">${esc(r.tag)}</span>`);
    if (r.photo) tags.push(`<span class="rec-tag ghost">사진 1장</span>`);
    const summary = r.summary || [r.title, r.value].filter(Boolean).join(" · ") || t.label;
    return `<button class="rec-card" data-detail="${r.id}">
      <span class="rec-card-ic" style="background:${t.color[0]};color:${t.color[1]}">
        <span class="material-symbols-rounded">${t.icon}</span></span>
      <span class="rec-card-body">
        <span class="rec-card-head">
          <span class="rec-type">${t.label}</span>
          <span class="rec-time">${ampm(r.time)}</span>
          <span class="rec-star ${r.important ? "on" : ""}"><span class="material-symbols-rounded">star</span></span>
        </span>
        <span class="rec-summary">${esc(summary)}</span>
        <span class="rec-tags">${tags.join("")}</span>
      </span></button>`;
  }

  function renderTimeline() {
    const list = store.records.filter(passesFilter)
      .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : b.time.localeCompare(a.time)));
    const wrap = $("#timeline");

    if (!list.length) { wrap.innerHTML = ""; $("#empty").classList.add("show"); return; }
    $("#empty").classList.remove("show");

    const groups = {};
    list.forEach((r) => (groups[r.date] = groups[r.date] || []).push(r));
    wrap.innerHTML = Object.keys(groups).sort((a, b) => (a < b ? 1 : -1)).map((date) => {
      const rel = relLabel(date);
      return `<div class="day-group">
        <div class="day-label">${date}${rel ? ` <span class="rel">${rel}</span>` : ""}<span class="line"></span></div>
        ${groups[date].map(recordCard).join("")}
      </div>`;
    }).join("");
  }

  function renderAll() { renderSummary(); renderQuick(); renderFilters(); renderTimeline(); }

  /* ── 8. 기록 작성 / 수정 시트 ───────────────────────── */
  let formType = "symptom";
  let formPhoto = false;
  let formImportant = false;

  function renderTypeTabs() {
    $("#type-row").innerHTML = Object.keys(TYPES).map((k) =>
      `<button class="type-tab ${k === formType ? "active" : ""}" data-type="${k}">
        <span class="material-symbols-rounded">${TYPES[k].icon}</span>${TYPES[k].label}</button>`).join("");
  }

  function prevWeight() {
    const w = store.records.filter((r) => r.type === "weight" && r.fields?.weight)
      .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))[0];
    return w ? parseFloat(w.fields.weight) : null;
  }

  function renderFormFields(preset) {
    const t = TYPES[formType];
    const f = preset?.fields || {};
    let html = "";
    if (t.q) html += `<div class="form-q">${t.q}</div>`;
    if (t.note) html += `<div class="summary-note" style="margin:0 0 12px"><span class="material-symbols-rounded">info</span><span>${t.note}</span></div>`;

    t.fields.forEach((fl) => {
      html += `<div class="field" data-field="${fl.key}">
        <div class="field-label">${fl.label}</div>`;
      if (fl.chips) {
        const sel = f[fl.key];
        html += `<div class="opt-row" data-opts="${fl.key}" data-multi="${!!fl.multi}">` +
          fl.chips.map((c) => {
            const on = fl.multi ? Array.isArray(sel) && sel.includes(c) : sel === c;
            const sevCls = fl.sev ? ` sev-${c}` : "";
            return `<button class="opt-chip${sevCls} ${on ? "active" : ""}" data-val="${c}">${c}</button>`;
          }).join("") + `</div>`;
      } else {
        html += `<input class="input" data-input="${fl.key}" type="${fl.input === "number" ? "number" : "text"}"
          inputmode="${fl.input === "number" ? "decimal" : "text"}" placeholder="${fl.ph || ""}"
          value="${esc(f[fl.key] ?? "")}" />`;
      }
      html += `</div>`;
    });

    // 체중: 이전 기록 대비 증감 안내
    if (formType === "weight") {
      const pw = prevWeight();
      if (pw != null) {
        html += `<div class="summary-note" id="weight-delta" style="margin:0 0 12px"><span class="material-symbols-rounded">trending_flat</span><span>이전 기록 ${pw}kg 와 비교해서 입력하면 증감을 보여드려요.</span></div>`;
      }
    }

    // 공통: 날짜 / 시간 (커스텀 피커 — 날짜값은 내부적으로 YYYY-MM-DD 로 보관)
    const dateIso = (preset?.date || TODAY).replace(/\./g, "-");
    html += `<div class="field-2" style="margin-top:16px">
      <div class="field"><div class="field-label">날짜</div>
        <input id="f-date" data-picker="date" value="${esc(dateIso)}" /></div>
      <div class="field"><div class="field-label">시간</div>
        <input id="f-time" data-picker="time" value="${esc(preset?.time || nowTime())}" /></div>
    </div>`;

    // 공통: 메모 (메모 유형은 "내용"으로 라벨 변경)
    const memoLabel = formType === "memo" ? "내용" : "메모 <span class=\"opt\">선택</span>";
    html += `<div class="field"><div class="field-label">${memoLabel}</div>
      <textarea class="textarea" id="f-memo" placeholder="자유롭게 적어주세요. 병원 상담 시 참고할 수 있어요.">${esc(preset?.memo || "")}</textarea></div>`;

    // 공통: 사진 첨부
    formPhoto = !!preset?.photo;
    html += `<div class="field"><div class="field-label">사진 첨부 <span class="opt">선택</span></div>
      <div class="photo-row" id="f-photos"></div></div>`;

    // 공통: 중요 표시
    formImportant = !!preset?.important;
    html += `<div class="switch-field">
      <span class="lab"><span class="material-symbols-rounded">star</span>중요 기록으로 표시</span>
      <button class="switch ${formImportant ? "on" : ""}" id="f-important" role="switch" aria-checked="${formImportant}"></button>
    </div>`;

    $("#form-fields").innerHTML = html;
    if (window.PetPicker) window.PetPicker.bindAll($("#form-fields"));
    renderPhotos();
    if (formType === "weight") bindWeightDelta();
  }

  function bindWeightDelta() {
    const inp = $('#form-fields [data-input="weight"]');
    const note = $("#weight-delta");
    if (!inp || !note) return;
    const pw = prevWeight();
    const sync = () => {
      const v = parseFloat(inp.value);
      if (isNaN(v) || pw == null) { note.querySelector("span:last-child").textContent = `이전 기록 ${pw}kg 와 비교해서 입력하면 증감을 보여드려요.`; return; }
      const d = (v - pw).toFixed(1);
      const sign = d > 0 ? "+" : "";
      note.querySelector("span:last-child").textContent = `이전 기록 ${pw}kg 대비 ${sign}${d}kg`;
    };
    inp.addEventListener("input", sync);
  }

  function renderPhotos() {
    const wrap = $("#f-photos");
    // formPhoto: data URL 문자열(첨부됨) | true(기존 mock 데이터) | 빈값(없음)
    const thumbInner = typeof formPhoto === "string" && formPhoto.startsWith("data:")
      ? `<img src="${formPhoto}" alt="첨부 사진" style="width:100%;height:100%;object-fit:cover;border-radius:inherit" />`
      : `<div class="ph">🐶</div>`;
    wrap.innerHTML =
      (formPhoto ? `<div class="photo-thumb">${thumbInner}<button class="rm" data-rm-photo aria-label="사진 삭제"><span class="material-symbols-rounded">close</span></button></div>` : "") +
      `<button class="photo-add" id="f-add-photo"><span class="material-symbols-rounded">add_a_photo</span>사진</button>
       <input type="file" id="f-photo-input" accept="image/*" hidden />`;
  }

  function nowTime() { return "09:30"; }

  function openForm(typeKey, preset) {
    formType = TYPES[typeKey] ? typeKey : "symptom";
    editingId = preset?.id ?? null;
    $("#form-title").textContent = editingId ? `${TYPES[formType].label} 기록 수정` : "기록하기";
    $("#form-save").textContent = editingId ? "수정 완료" : "저장";
    renderTypeTabs();
    renderFormFields(preset);
    openOverlay("#form-sheet");
  }

  function collectForm() {
    const fields = {};
    $$("#form-fields [data-opts]").forEach((box) => {
      const key = box.dataset.opts;
      const multi = box.dataset.multi === "true";
      const vals = $$(".opt-chip.active", box).map((c) => c.dataset.val);
      fields[key] = multi ? vals : vals[0] || "";
    });
    $$("#form-fields [data-input]").forEach((inp) => { fields[inp.dataset.input] = inp.value.trim(); });

    // 피커 값은 YYYY-MM-DD → 타임라인 표시/그룹용 점(.) 표기로 변환
    const rawDate = ($("#f-date").value || "").trim();
    const date = rawDate ? rawDate.replace(/-/g, ".") : TODAY;
    const time = $("#f-time").value || nowTime();
    const memo = $("#f-memo").value.trim();
    const created_at = isoFromDateTime(date, time);

    const title = TYPES[formType].label;
    const summary = buildSummary(formType, fields, memo);
    return { type: formType, source: "manual", task_id: null, date, time, memo,
      photo: formPhoto, important: formImportant, fields, created_at,
      title, value: summary, summary, ...buildTag(formType, fields) };
  }

  // "2026.06.13" + "16:20" → ISO
  function isoFromDateTime(dateDot, time) {
    const d = dateDot.replace(/\./g, "-");
    return `${d}T${(time || "00:00")}:00`;
  }

  function buildSummary(type, f, memo) {
    switch (type) {
      case "symptom": return `${(f.kind || []).join(", ") || "증상"}${f.severity ? ` · ${f.severity}` : ""}`;
      case "med": return `${f.name || "약"} ${f.status || ""}`.trim();
      case "meal": return `${f.kind || "식사"} · 완료율 ${f.complete || "-"}`;
      case "water": return `물 ${f.amount ? f.amount + "ml" : "-"}`;
      case "poop": return `배변 ${f.stool || "정상"}${f.count ? ` · ${f.count}회` : ""}`;
      case "weight": return `체중 ${f.weight || "-"}kg`;
      case "temp": return `체온 ${f.temp || "-"}℃`;
      case "breath": return `호흡 ${f.rate || "-"}회/분${f.state ? ` · ${f.state}` : ""}`;
      case "walk": return `산책 ${f.duration || "-"}${f.distance ? ` · ${f.distance}` : ""}`;
      case "photo": return `${f.title || "사진"}`;
      case "hospital": return `${f.place || "병원"} 방문`;
      case "memo": return f.title || (memo ? memo.slice(0, 20) : "메모");
      default: return TYPES[type].label;
    }
  }

  function buildTag(type, f) {
    const T = TYPES[type];
    if (type === "symptom") {
      const sev = f.severity;
      if (sev === "심각") return { tag: "주의", tagType: "warn" };
      return { tag: "증상", tagType: "warn" };
    }
    if (type === "med") return { tag: f.status === "복용 완료" ? "완료" : (f.status || "복약"), tagType: f.status === "복용 완료" ? "done" : "ghost" };
    if (type === "meal") return { tag: f.complete || "보통", tagType: "ghost" };
    if (type === "water") return { tag: f.amount ? `${f.amount}ml` : "물", tagType: "neutral" };
    if (type === "poop") return { tag: f.stool || "정상", tagType: f.stool && f.stool !== "정상" ? "warn" : "done" };
    if (type === "weight") return { tag: `${f.weight || "-"}kg`, tagType: "neutral" };
    if (type === "temp") return { tag: `${f.temp || "-"}℃`, tagType: "warn" };
    if (type === "breath") return { tag: f.state || "안정", tagType: f.state === "주의" ? "warn" : "done" };
    return { tag: T.label, tagType: T.tagClass || "neutral" };
  }

  function saveForm() {
    const data = collectForm();
    if (editingId) { store.update(editingId, data); toast("기록을 수정했어요"); }
    else { store.add(data); toast("기록을 저장했어요"); }
    editingId = null;
    closeOverlay("#form-sheet");
    renderAll();
  }

  /* ── 9. 기록 상세 모달 ──────────────────────────────── */
  let detailId = null;
  function openDetail(id) {
    const r = store.get(id); if (!r) return;
    detailId = id;
    const t = TYPES[r.type] || TYPES.memo;

    $("#d-ic").style.background = t.color[0];
    $("#d-ic").style.color = t.color[1];
    $("#d-ic-symbol").textContent = t.icon;
    $("#d-type").textContent = `${t.label} 기록`;
    $("#d-date").textContent = `${r.date} · ${ampm(r.time)}`;

    const rows = [];
    const srcLabel = { schedule_check: "일정 완료로 자동 저장", manual: "직접 입력", hospital: "병원 메뉴에서 저장" }[r.source || "manual"];
    rows.push(["기록 출처", srcLabel]);
    // 자동 기록(요약 필드 없음)은 제목/값을 노출
    if (r.source === "schedule_check") {
      if (r.title) rows.push(["내용", r.title]);
      if (r.value) rows.push(["상태", r.value]);
    }
    t.fields.forEach((fl) => {
      let v = r.fields?.[fl.key];
      if (Array.isArray(v)) v = v.join(", ");
      if (v) rows.push([fl.label, v]);
    });
    if (r.memo) rows.push([r.type === "memo" ? "내용" : "메모", r.memo]);
    $("#d-rows").innerHTML = rows.map(([k, v]) =>
      `<div class="detail-row"><span class="k">${esc(k)}</span><span class="v">${esc(v)}</span></div>`).join("")
      || `<div class="detail-row"><span class="v">기록된 상세 내용이 없어요.</span></div>`;

    const dPhoto = $("#d-photo");
    dPhoto.style.display = r.photo ? "flex" : "none";
    if (typeof r.photo === "string" && r.photo.startsWith("data:")) {
      dPhoto.innerHTML = `<img src="${r.photo}" alt="첨부 사진" style="width:100%;height:100%;object-fit:cover;border-radius:inherit" />`;
    } else {
      dPhoto.textContent = "🐶";
    }
    $("#d-star").classList.toggle("on", !!r.important);
    // 병원 연결은 증상 기록에서만 의미 있게 노출
    $("#d-link-hospital").style.display = r.type === "symptom" ? "" : "none";

    openOverlay("#detail-modal");
  }

  /* ── 10. 검색 / 필터 시트 ───────────────────────────── */
  function openSearch() {
    $("#s-keyword").value = search.keyword;
    $$("#search-sheet [data-period]").forEach((b) => b.classList.toggle("active", b.dataset.period === search.period));
    $$("#search-sheet [data-stype]").forEach((b) => b.classList.toggle("active", b.dataset.stype === search.type));
    $("#s-important").classList.toggle("on", search.importantOnly);
    $("#s-photo").classList.toggle("on", search.photoOnly);
    // 직접 선택 기간 복원
    const range = $("#custom-range");
    if (range) {
      const isCustom = search.period === "custom";
      range.style.display = isCustom ? "" : "none";
      if (isCustom) {
        if (window.PetPicker) window.PetPicker.bindAll(range);
        if (search.customFrom && $("#s-from")) window.PetPicker?.setValue($("#s-from"), search.customFrom);
        if (search.customTo && $("#s-to")) window.PetPicker?.setValue($("#s-to"), search.customTo);
      }
    }
    openOverlay("#search-sheet");
  }
  /* ── 검색 결과 뷰 ────────────────────────────────────── */
  function buildSearchLabel() {
    const parts = [];
    if (search.keyword) parts.push(`"${search.keyword}"`);
    const periodMap = { today: "오늘", "7d": "최근 7일", "30d": "최근 30일", month: "이번 달", custom: "직접 선택" };
    if (search.period !== "all") parts.push(periodMap[search.period] || search.period);
    if (search.type !== "all") parts.push(TYPES[search.type]?.label || search.type);
    if (search.importantOnly) parts.push("중요");
    if (search.photoOnly) parts.push("사진 있음");
    return parts.length ? parts.join(" · ") : "전체 기록";
  }

  function renderSearchView() {
    const list = store.records.filter(passesFilter)
      .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : b.time.localeCompare(a.time)));

    $("#search-view-query").textContent = buildSearchLabel();
    $("#search-view-count").textContent = `검색 결과 ${list.length}건`;

    const wrap = $("#search-timeline");
    if (!list.length) {
      let hint = "";
      if (search.keyword) {
        const kw = search.keyword.toLowerCase();
        const matched = Object.keys(TYPE_ALIASES).filter((t) => keywordMatchesType(kw, t));
        if (matched.length) {
          const labels = matched.map((t) => TYPES[t]?.label).filter(Boolean).join(", ");
          hint = `<div style="font-size:13px;color:var(--sub);margin-top:8px">"${search.keyword}"은 <b>${labels}</b> 기록과 관련이 있어요.<br/>해당 기간에 기록이 없거나 다른 조건을 확인해보세요.</div>`;
        }
      }
      wrap.innerHTML = `<div class="empty show" style="position:static">
        <div class="empty-ic"><span class="material-symbols-rounded">search_off</span></div>
        <div class="empty-text"><b>검색 결과가 없어요.</b><br />다른 키워드나 조건으로 검색해보세요.${hint}</div>
      </div>`;
      return;
    }
    const groups = {};
    list.forEach((r) => (groups[r.date] = groups[r.date] || []).push(r));
    wrap.innerHTML = Object.keys(groups).sort((a, b) => (a < b ? 1 : -1)).map((date) => {
      const rel = relLabel(date);
      return `<div class="day-group">
        <div class="day-label">${date}${rel ? ` <span class="rel">${rel}</span>` : ""}<span class="line"></span></div>
        ${groups[date].map(recordCard).join("")}
      </div>`;
    }).join("");
  }

  function openSearchView() {
    renderSearchView();
    const sv = $("#search-view");
    sv.style.display = "flex";
    sv.scrollTop = 0;
  }

  function closeSearchView() {
    $("#search-view").style.display = "none";
    search = { keyword: "", period: "all", type: "all", importantOnly: false, photoOnly: false, customFrom: "", customTo: "" };
    renderTimeline();
  }

  function applySearch() {
    search.keyword = $("#s-keyword").value.trim();
    search.period = $("#search-sheet [data-period].active")?.dataset.period || "all";
    search.type = $("#search-sheet [data-stype].active")?.dataset.stype || "all";
    search.importantOnly = $("#s-important").classList.contains("on");
    search.photoOnly = $("#s-photo").classList.contains("on");
    search.customFrom = ($("#s-from")?.value || "").replace(/\./g, "-");
    search.customTo = ($("#s-to")?.value || "").replace(/\./g, "-");
    closeOverlay("#search-sheet");
    openSearchView();
  }

  function resetSearch() {
    search = { keyword: "", period: "all", type: "all", importantOnly: false, photoOnly: false, customFrom: "", customTo: "" };
    $("#s-keyword").value = "";
    $$("#search-sheet [data-period]").forEach((b) => b.classList.toggle("active", b.dataset.period === "all"));
    $$("#search-sheet [data-stype]").forEach((b) => b.classList.toggle("active", b.dataset.stype === "all"));
    $("#s-important").classList.remove("on");
    $("#s-photo").classList.remove("on");
    const range = $("#custom-range");
    if (range) range.style.display = "none";
  }

  /* ── 11. 오버레이 헬퍼 ──────────────────────────────── */
  function openOverlay(sel) { $(sel).classList.add("show"); }
  function closeOverlay(sel) { $(sel).classList.remove("show"); }

  /* ── 12. 이벤트 위임 ────────────────────────────────── */
  document.addEventListener("click", (e) => {
    const t = e.target;

    const open = t.closest("[data-open-form]");
    if (open) return openForm(open.dataset.openForm);

    if (t.closest("#quick-toggle")) {
      $("#quick-toggle").classList.toggle("open");
      $("#quick-more").classList.toggle("open");
      const on = $("#quick-more").classList.contains("open");
      $("#quick-toggle-label").textContent = on ? "접기" : "더보기";
      return;
    }

    const fc = t.closest("[data-filter]");
    if (fc) { activeFilter = fc.dataset.filter; renderFilters(); renderTimeline(); return; }

    const card = t.closest("[data-detail]");
    if (card) return openDetail(card.dataset.detail);

    if (t.closest("#btn-search")) return openSearch();
    if (t.closest("#search-back")) return closeSearchView();
    if (t.closest("#search-edit")) { openSearch(); return; }
    if (t.closest("#btn-calendar")) return (location.href = "schedule.html");

    const tt = t.closest("[data-type]");
    if (tt) {
      const preset = { date: $("#f-date")?.value, time: $("#f-time")?.value, memo: $("#f-memo")?.value, photo: formPhoto, important: formImportant };
      formType = tt.dataset.type;
      renderTypeTabs(); renderFormFields(preset); return;
    }

    const opt = t.closest("[data-opts] .opt-chip");
    if (opt) {
      const box = opt.closest("[data-opts]");
      const multi = box.dataset.multi === "true";
      if (multi) opt.classList.toggle("active");
      else { $$(".opt-chip", box).forEach((c) => c.classList.remove("active")); opt.classList.add("active"); }
      return;
    }

    if (t.closest("#f-add-photo")) { $("#f-photo-input")?.click(); return; }
    if (t.closest("[data-rm-photo]")) { formPhoto = false; renderPhotos(); return; }

    if (t.closest("#f-important")) { formImportant = !formImportant; $("#f-important").classList.toggle("on", formImportant); $("#f-important").setAttribute("aria-checked", formImportant); return; }

    if (t.closest("#form-save")) return saveForm();

    if (t.closest("#d-edit")) { const r = store.get(detailId); closeOverlay("#detail-modal"); openForm(r.type, r); return; }
    if (t.closest("#d-star-btn")) {
      const r = store.get(detailId); store.update(detailId, { important: !r.important });
      $("#d-star").classList.toggle("on", !r.important);
      toast(!r.important ? "중요 기록으로 표시했어요" : "중요 표시를 해제했어요", "star");
      renderTimeline(); return;
    }
    if (t.closest("#d-link-hospital")) return toast("병원 기록에 연결했어요", "link");
    if (t.closest("#d-delete")) { openOverlay("#confirm-modal"); return; }

    if (t.closest("#confirm-yes")) {
      store.remove(detailId); closeOverlay("#confirm-modal"); closeOverlay("#detail-modal");
      toast("기록을 삭제했어요", "delete"); renderAll(); return;
    }
    if (t.closest("#confirm-no")) return closeOverlay("#confirm-modal");

    const per = t.closest("[data-period]");
    if (per) {
      $$("#search-sheet [data-period]").forEach((b) => b.classList.remove("active"));
      per.classList.add("active");
      const isCustom = per.dataset.period === "custom";
      const range = $("#custom-range");
      if (range) {
        range.style.display = isCustom ? "" : "none";
        if (isCustom && window.PetPicker) window.PetPicker.bindAll(range);
      }
      return;
    }
    const st = t.closest("[data-stype]");
    if (st) { $$("#search-sheet [data-stype]").forEach((b) => b.classList.remove("active")); st.classList.add("active"); return; }
    if (t.closest("#s-important")) { $("#s-important").classList.toggle("on"); return; }
    if (t.closest("#s-photo")) { $("#s-photo").classList.toggle("on"); return; }
    if (t.closest("#s-apply")) return applySearch();
    if (t.closest("#s-reset")) return resetSearch();

    if (t.closest("#empty-cta")) return openForm("symptom");

    const ov = t.closest(".overlay");
    if (ov && (t === ov || t.closest("[data-close]"))) ov.classList.remove("show");
  });

  // 사진 파일 선택 → data URL 로 읽어 미리보기/저장
  document.addEventListener("change", (e) => {
    const input = e.target.closest("#f-photo-input");
    if (!input || !input.files || !input.files[0]) return;
    const file = input.files[0];
    if (!file.type.startsWith("image/")) { toast("이미지 파일만 첨부할 수 있어요", "info"); return; }
    const reader = new FileReader();
    reader.onload = () => { formPhoto = reader.result; renderPhotos(); toast("사진을 첨부했어요", "photo_camera"); };
    reader.readAsDataURL(file);
  });

  /* ── 13. 반려견 칩 / 초기화 ─────────────────────────── */
  function renderPetChip() {
    const p = S.getPet(); if (!p) return;
    const chip = $("[data-pet-chip]");
    if (chip) chip.textContent = [p.name, p.age ? `${p.age}살` : "", p.breed].filter(Boolean).join(" · ");
    const avatar = document.querySelector(".pet-chip .avatar");
    if (avatar) {
      if (p.photo) {
        avatar.innerHTML = `<img src="${p.photo}" alt="${p.name || ""}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
      } else {
        avatar.textContent = "🐶";
      }
    }
  }

  renderPetChip();
  renderAll();
  $$("[data-rise]").forEach((n, i) => { n.classList.add("rise"); n.style.animationDelay = i * 0.05 + "s"; });

  // URL ?type= 진입 시 해당 작성 시트 자동 오픈
  const params = new URLSearchParams(location.search);
  const qType = params.get("type");
  if (qType && TYPES[qType]) openForm(qType);
  // URL ?id= 진입 시 해당 기록 상세(거기서 수정 가능) 자동 오픈
  const qId = params.get("id");
  if (qId && store.get(qId)) openDetail(qId);
})();
