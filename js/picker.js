/* ============================================================
   PetCare+ · 커스텀 날짜/시간 피커
   - <input data-picker="date"> / <input data-picker="time"> 를
     숨김 입력 + 트리거 버튼으로 바꿔 바텀시트 피커를 띄웁니다.
   - 숨김 입력의 value 는 기존과 동일한 표준값을 유지:
       date -> "YYYY-MM-DD",  time -> "HH:MM"
     그래서 기존 JS(input.value 읽기/change 리스너)와 호환됩니다.
   - 외부 의존성 없음. 동적으로 추가된 입력은 PetPicker.bind(el) 로 연결.
   ============================================================ */
(function () {
  "use strict";
  const DOW = ["일", "월", "화", "수", "목", "금", "토"];
  const pad = (n) => String(n).padStart(2, "0");

  /* ── 표시 포맷 ──────────────────────────────────────── */
  function fmtDate(v) {
    if (!v) return "";
    const [y, m, d] = v.split("-").map(Number);
    const dt = new Date(y, m - 1, d);
    if (isNaN(dt)) return v;
    return `${y}.${pad(m)}.${pad(d)}`;
  }
  function fmtTime(v) {
    if (!v) return "";
    const [h, mi] = v.split(":").map(Number);
    return `${h < 12 ? "오전" : "오후"} ${h % 12 || 12}:${pad(mi)}`;
  }

  /* ── 공유 오버레이 ─────────────────────────────────── */
  let overlay, sheet, active = null, draft = {};
  function ensureOverlay() {
    if (overlay) return;
    overlay = document.createElement("div");
    overlay.className = "pk-overlay";
    overlay.innerHTML = `<div class="pk-sheet"><div class="pk-handle"></div><div class="pk-title"></div><div class="pk-body"></div>
      <div class="pk-foot">
        <button type="button" class="pk-btn ghost" data-pk-cancel>취소</button>
        <button type="button" class="pk-btn primary" data-pk-ok>확인</button>
      </div></div>`;
    document.body.appendChild(overlay);
    sheet = overlay.querySelector(".pk-sheet");

    /* 오버레이를 .app 프레임 영역으로 제한 (PC 데스크톱 대응) */
    function alignOverlay() {
      const appEl = document.querySelector(".app");
      if (!appEl) return;
      const r = appEl.getBoundingClientRect();
      overlay.style.left   = r.left + "px";
      overlay.style.right  = (window.innerWidth - r.right) + "px";
      overlay.style.top    = r.top + "px";
      overlay.style.bottom = (window.innerHeight - r.bottom) + "px";
      overlay.style.inset  = "unset"; /* inset shorthand 초기화 */
    }
    alignOverlay();
    window.addEventListener("resize", alignOverlay);

    overlay.addEventListener("click", (e) => {
      if (e.target === overlay || e.target.closest("[data-pk-cancel]")) return close();
      if (e.target.closest("[data-pk-ok]")) return confirm();
      handleBodyClick(e);
    });
  }
  function close() { overlay.classList.remove("show"); active = null; }

  function open(input) {
    ensureOverlay();
    active = input;
    const kind = input.dataset.picker;
    const title = input.dataset.pickerTitle || (kind === "time" ? "시간 선택" : "날짜 선택");
    overlay.querySelector(".pk-title").textContent = title;
    if (kind === "time") buildTime(input.value);
    else buildDate(input.value);
    overlay.classList.add("show");
  }

  function confirm() {
    if (!active) return;
    const kind = active.dataset.picker;
    const val = kind === "time"
      ? `${pad(draft.h)}:${pad(draft.mi)}`
      : `${draft.y}-${pad(draft.m)}-${pad(draft.d)}`;
    setValue(active, val);
    close();
  }

  function setValue(input, val) {
    input.value = val;
    const trig = input._pkTrigger;
    if (trig) updateTrigger(input, trig);
    input.dispatchEvent(new Event("change", { bubbles: true }));
    input.dispatchEvent(new Event("input", { bubbles: true }));
  }

  /* ── 날짜 빌더 ─────────────────────────────────────── */
  function buildDate(value) {
    const today = new Date();
    let base = value ? new Date(value + "T00:00:00") : new Date(today);
    if (isNaN(base)) base = new Date(today);
    draft = { y: base.getFullYear(), m: base.getMonth() + 1, d: base.getDate(), view: { y: base.getFullYear(), m: base.getMonth() + 1 }, yearMode: false };
    renderCal();
  }
  function renderCal() {
    const { y, m } = draft.view;
    if (draft.yearMode) { renderYearPicker(); return; }
    const first = new Date(y, m - 1, 1).getDay();
    const days = new Date(y, m, 0).getDate();
    const today = new Date();
    const dowRow = DOW.map((d, i) => `<div class="pk-dow ${i === 0 ? "sun" : ""}">${d}</div>`).join("");
    let cells = "";
    for (let i = 0; i < first; i++) cells += `<div class="pk-cell empty"></div>`;
    for (let d = 1; d <= days; d++) {
      const isSel = draft.y === y && draft.m === m && draft.d === d;
      const isToday = today.getFullYear() === y && today.getMonth() + 1 === m && today.getDate() === d;
      cells += `<div class="pk-cell ${isSel ? "sel" : ""} ${isToday ? "today" : ""}" data-pk-day="${d}"><span>${d}</span></div>`;
    }
    overlay.querySelector(".pk-body").innerHTML = `
      <div class="pk-cal-head">
        <button type="button" class="pk-nav" data-pk-mon="-1"><span class="material-symbols-rounded">chevron_left</span></button>
        <button type="button" class="pk-month-btn" data-pk-year-toggle>${y}년 ${m}월 <span class="material-symbols-rounded pk-month-arrow">expand_more</span></button>
        <button type="button" class="pk-nav" data-pk-mon="1"><span class="material-symbols-rounded">chevron_right</span></button>
      </div>
      <div class="pk-dow-row">${dowRow}</div>
      <div class="pk-grid">${cells}</div>`;
  }
  function renderYearPicker() {
    const curY = draft.view.y;
    const today = new Date();
    const thisY = today.getFullYear();
    const years = Array.from({ length: 41 }, (_, i) => thisY - 30 + i);
    const opts = years.map(y =>
      `<button type="button" class="pk-year-opt ${y === curY ? "sel" : ""}" data-pk-year="${y}">${y}년</button>`
    ).join("");
    overlay.querySelector(".pk-body").innerHTML = `
      <div class="pk-cal-head">
        <button type="button" class="pk-nav" data-pk-mon="-1" style="visibility:hidden"></button>
        <button type="button" class="pk-month-btn" data-pk-year-toggle>${curY}년 <span class="material-symbols-rounded pk-month-arrow open">expand_less</span></button>
        <button type="button" class="pk-nav" data-pk-mon="1" style="visibility:hidden"></button>
      </div>
      <div class="pk-year-grid">${opts}</div>`;
    requestAnimationFrame(() => {
      const sel = overlay.querySelector(".pk-year-opt.sel");
      if (sel) sel.scrollIntoView({ block: "center" });
    });
  }

  /* ── 시간 빌더 ─────────────────────────────────────── */
  function buildTime(value) {
    let h = 9, mi = 0;
    if (value && /^\d{1,2}:\d{2}/.test(value)) { const [a, b] = value.split(":").map(Number); h = a; mi = b; }
    draft = { h, mi };
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const mins = Array.from({ length: 12 }, (_, i) => i * 5);
    const optList = (arr, key, fmt) => arr.map((v) =>
      `<div class="pk-opt ${draft[key] === v ? "sel" : ""}" data-pk-${key}="${v}">${fmt(v)}</div>`).join("");
    overlay.querySelector(".pk-body").innerHTML = `
      <div class="pk-time-wrap">
        <div class="pk-time">
          <div class="pk-col" data-col="h">${optList(hours, "h", (v) => `${v < 12 ? "오전" : "오후"} ${v % 12 || 12}시`)}</div>
          <div class="pk-col" data-col="mi">${optList(mins, "mi", (v) => `${pad(v)}분`)}</div>
        </div>
        <div class="pk-time-mid"></div>
      </div>
      `;
    // 각 컬럼에 상하 패딩 추가해 첫/끝 항목도 중앙에 올 수 있게 함
    requestAnimationFrame(() => {
      overlay.querySelectorAll(".pk-col").forEach((col) => {
        const optH = col.querySelector(".pk-opt")?.offsetHeight || 44;
        const pad = (col.clientHeight / 2) - (optH / 2);
        col.style.paddingTop = pad + "px";
        col.style.paddingBottom = pad + "px";
      });
      overlay.querySelectorAll(".pk-opt.sel").forEach((o) => o.scrollIntoView({ block: "center" }));
    });
  }

  /* ── 시트 내부 클릭 처리 ───────────────────────────── */
  function handleBodyClick(e) {
    if (e.target.closest("[data-pk-year-toggle]")) {
      draft.yearMode = !draft.yearMode; renderCal(); return;
    }
    const yearOpt = e.target.closest("[data-pk-year]");
    if (yearOpt) {
      draft.view.y = Number(yearOpt.dataset.pkYear);
      draft.yearMode = false; renderCal(); return;
    }
    const mon = e.target.closest("[data-pk-mon]");
    if (mon) {
      let { y, m } = draft.view;
      m += Number(mon.dataset.pkMon);
      if (m < 1) { m = 12; y--; } else if (m > 12) { m = 1; y++; }
      draft.view = { y, m }; renderCal(); return;
    }
    const day = e.target.closest("[data-pk-day]");
    if (day) {
      draft.y = draft.view.y; draft.m = draft.view.m; draft.d = Number(day.dataset.pkDay);
      renderCal(); return;
    }
    const hOpt = e.target.closest("[data-pk-h]");
    if (hOpt) { draft.h = Number(hOpt.dataset.pkH); selectCol("h", hOpt); return; }
    const miOpt = e.target.closest("[data-pk-mi]");
    if (miOpt) { draft.mi = Number(miOpt.dataset.pkMi); selectCol("mi", miOpt); return; }
    const q = e.target.closest("[data-pk-quick]");
    if (q) { const [a, b] = q.dataset.pkQuick.split(":").map(Number); draft.h = a; draft.mi = b; confirm(); return; }
  }
  function selectCol(col, el) {
    el.closest(".pk-col").querySelectorAll(".pk-opt").forEach((o) => o.classList.remove("sel"));
    el.classList.add("sel"); el.scrollIntoView({ block: "center", behavior: "smooth" });
  }

  /* ── 입력 → 트리거 버튼 변환 ───────────────────────── */
  function updateTrigger(input, trig) {
    const kind = input.dataset.picker;
    const txt = kind === "time" ? fmtTime(input.value) : fmtDate(input.value);
    const ph = input.dataset.pickerPlaceholder || (kind === "time" ? "시간 선택" : "날짜 선택");
    trig.classList.toggle("empty", !input.value);
    trig.querySelector(".pk-val").textContent = txt || ph;
  }

  function bind(input) {
    if (input._pkTrigger) return;
    const kind = input.dataset.picker;
    input.type = "hidden";
    const trig = document.createElement("button");
    trig.type = "button";
    trig.className = "pk-trigger empty";
    trig.innerHTML = `<span class="pk-ic">${kind === "time" ? "schedule" : "calendar_today"}</span><span class="pk-val"></span>`;
    input.insertAdjacentElement("afterend", trig);
    input._pkTrigger = trig;
    trig.addEventListener("click", () => open(input));
    updateTrigger(input, trig);
  }

  function bindAll(root = document) {
    root.querySelectorAll("input[data-picker]").forEach(bind);
  }

  window.PetPicker = { bind, bindAll, fmtDate, fmtTime, setValue };
  document.addEventListener("DOMContentLoaded", () => bindAll());
  if (document.readyState !== "loading") bindAll();
})();
