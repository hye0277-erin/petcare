/* ============================================================
   PetCare+ · 일정(schedule) — 반복 케어 관리 화면 (1차 MVP)
   ============================================================ */
(function () {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const S = window.PetStore;
  const TODAY = S.TODAY;

  const TYPES = {
    med: ["약", "medication", "t-med"], meal: ["식사", "restaurant", "t-meal"],
    water: ["물", "water_drop", "t-water"], symptom: ["증상 체크", "sick", "t-symptom"],
    poop: ["배변", "pets", "t-poop"], weight: ["체중", "monitor_weight", "t-weight"],
    temp: ["체온", "thermostat", "t-temp"], breath: ["호흡", "air", "t-breath"],
    walk: ["산책", "directions_walk", "t-walk"], hospital: ["병원", "local_hospital", "t-hospital"],
    memo: ["메모", "sticky_note_2", "t-memo"],
  };

  function fmtTime(t) {
    if (!t) return { period: "", hm: "종일" };
    const [h, m] = t.split(":").map(Number);
    return { period: h < 12 ? "오전" : "오후", hm: `${h % 12 || 12}:${String(m).padStart(2, "0")}` };
  }
  function ampm(t) {
    if (!t) return "";
    const [h, m] = t.split(":").map(Number);
    return `${h < 12 ? "오전" : "오후"} ${h % 12 || 12}:${String(m).padStart(2, "0")}`;
  }
  const DOW = ["일", "월", "화", "수", "목", "금", "토"];
  const DOW_SHORT = ["일", "월", "화", "수", "목", "금", "토"];
  const pad = (n) => String(n).padStart(2, "0");
  const dot = (iso) => (iso || "").replace(/-/g, ".");
  function isoDate(d) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }

  /* 선택 상태: 기본은 오늘 */
  const [ty, tm, td] = TODAY.split("-").map(Number);
  let selDate = TODAY;
  let viewY = ty, viewM = tm;
  let calOpen = false;

  /* ── 오늘 요약 ──────────────────────────────────────── */
  function renderToday(tasks) {
    const host = $("#sched-today"); if (!host) return;
    const done = tasks.filter((t) => t.status === "done").length;
    const pending = tasks.filter((t) => t.status === "pending").length;
    const skipped = tasks.filter((t) => t.status === "skipped").length;
    host.innerHTML = `
      <div class="st-pill"><div class="st-num">${tasks.length}</div><div class="st-lab">오늘 전체</div></div>
      <div class="st-pill"><div class="st-num done">${done}</div><div class="st-lab">완료</div></div>
      <div class="st-pill"><div class="st-num">${pending}</div><div class="st-lab">예정</div></div>
      <div class="st-pill"><div class="st-num skip">${skipped}</div><div class="st-lab">건너뜀</div></div>`;
  }

  /* ── 월간 날짜 바 (좌우 스크롤, 기본은 이번 주 위치) ──── */
  function renderWeekBar(smooth) {
    const bar = $("#week-bar"); if (!bar) return;

    const sel = new Date(selDate);
    const y = sel.getFullYear(), mo = sel.getMonth();
    const first = new Date(y, mo, 1);
    const last = new Date(y, mo + 1, 0);

    const monthLabel = $("#week-bar-month");
    if (monthLabel) monthLabel.textContent = `${y}년 ${mo + 1}월`;

    const marks = S.monthMarks(y, mo + 1);
    let html = "";
    for (let day = 1; day <= last.getDate(); day++) {
      const d = new Date(y, mo, day);
      const iso = isoDate(d);
      const isToday = iso === TODAY;
      const isSel = iso === selDate;
      const m = marks[iso] || {};
      let pip = "";
      if (m.done) pip = `<i class="wb-pip green"></i>`;
      else if (m.task) pip = `<i class="wb-pip orange"></i>`;
      else if (m.rec) pip = `<i class="wb-pip blue"></i>`;

      html += `<button class="wb-day${isSel ? " sel" : ""}${isToday ? " today" : ""}" data-date="${iso}">
        <span class="wb-dow">${DOW_SHORT[d.getDay()]}</span>
        <span class="wb-num">${d.getDate()}</span>
        ${pip}
      </button>`;
    }
    bar.innerHTML = html;

    // 선택 날짜(기본: 이번 주 범위)를 중앙으로 스크롤
    const selEl = bar.querySelector(".wb-day.sel");
    if (selEl) selEl.scrollIntoView({ inline: "center", behavior: smooth ? "smooth" : "auto", block: "nearest" });
  }

  /* ── 선택 날짜의 일정 목록 ──────────────────────────── */
  function renderList() {
    const host = $("#day-list"); if (!host) return;
    const isToday = selDate === TODAY;
    const isPast = selDate < TODAY;
    const items = S.getTasksByDate(selDate);

    const [yy, mm, dd] = selDate.split("-").map(Number);
    const dow = DOW[new Date(yy, mm - 1, dd).getDay()];
    const titleEl = $("#day-title");
    if (titleEl) {
      const pill = isToday ? "오늘" : `${mm}월 ${dd}일`;
      titleEl.innerHTML = `${isToday ? "오늘의 일정" : `${mm}월 ${dd}일 (${dow})`} <span class="today-pill">${pill}</span>`;
    }

    const summaryHost = $("#sched-today");
    if (summaryHost) summaryHost.style.display = isToday ? "" : "none";
    if (isToday) renderToday(items);

    if (!items.length) {
      host.innerHTML = `<div class="card timeline-card"><div style="padding:22px;text-align:center;color:var(--color-text-light)">${isToday ? '오늘 등록된 일정이 없어요.<br><a href="schedule-add.html" style="color:var(--color-primary);font-weight:700">케어 일정 추가하기</a>' : "이 날에는 등록된 일정이 없어요."}</div></div>`;
      return;
    }
    host.innerHTML = `<div class="card timeline-card">` + items.map((it) => {
      const [label, icon, cls] = TYPES[it.type] || TYPES.memo;
      const { period, hm } = fmtTime(it.scheduled_time);
      const done = it.status === "done", skipped = it.status === "skipped", missed = it.status === "missed";
      const stateCls = done ? "done" : skipped ? "skipped" : missed ? "missed" : "";

      let right;
      if (done) right = `<span class="tl-state done">완료</span>`;
      else if (skipped) right = `<span class="tl-state skipped">건너뜀</span>`;
      else if (missed) right = `<span class="tl-state missed">놓침</span>`;
      else if (isPast) right = `<span class="tl-state">예정</span>`;
      else right = `<span class="tl-actions">
        <button class="tl-act done-act" data-done="${it.id}">완료</button>
        <button class="tl-act" data-skip="${it.id}">건너뜀</button>
      </span>`;

      return `<div class="tl-item ${stateCls}">
        <div class="tl-time">${period ? `<b>${period}</b>` : ""}${hm}</div>
        <span class="tl-ic ${cls}"><span class="material-symbols-rounded">${icon}</span></span>
        <div class="tl-body">
          <div class="tl-name">${esc(it.title || label)}</div>
          <div class="tl-desc">${esc(it.description || label)}${missed ? " · 놓침" : ""}</div>
        </div>
        ${right}
      </div>`;
    }).join("") + `</div>`;

    if (sessionStorage.getItem("sched_added")) {
      sessionStorage.removeItem("sched_added");
      setTimeout(() => { if (window.toast) window.toast("새 케어 루틴을 추가했어요"); }, 150);
    }
  }

  /* ── 선택 날짜의 기록(records) ─────────────────────── */
  function renderDayRecords() {
    const host = $("#day-records"); if (!host) return;
    const recs = S.getRecordsByDate(selDate).filter((r) => r.source !== "schedule_check");
    if (!recs.length) { host.innerHTML = ""; return; }
    const SRC = { manual: ["edit", "직접"], hospital: ["local_hospital", "병원"] };
    host.innerHTML = `<div class="card-label" style="margin-top:18px">${dot(selDate)} 기록 <span style="font-weight:500;color:var(--color-text-light)">${recs.length}건</span></div>
      <div class="card timeline-card">` +
      recs.map((r) => {
        const [, icon, cls] = TYPES[r.type] || TYPES.memo;
        const isManual = (r.source || "manual") === "manual";
        const src = SRC[r.source || "manual"] || SRC.manual;
        const badge = isManual
          ? `<button class="src-badge src-manual" data-edit-rec="${r.id}" aria-label="기록 편집"><span class="material-symbols-rounded">edit</span>직접</button>`
          : `<span class="src-badge src-${r.source}"><span class="material-symbols-rounded">${src[0]}</span>${src[1]}</span>`;
        return `<div class="tl-item">
          <div class="tl-time">${ampm(r.time)}</div>
          <span class="tl-ic ${cls}"><span class="material-symbols-rounded">${icon}</span></span>
          <div class="tl-body">
            <div class="tl-name">${esc(r.title || (TYPES[r.type] || TYPES.memo)[0])}${r.value ? ` · ${esc(r.value)}` : ""}</div>
            <div class="tl-desc">${esc(r.memo || src[1] + " 기록")}</div>
          </div>
          ${badge}
        </div>`;
      }).join("") + `</div>`;
  }

  function refreshDay() { renderList(); renderDayRecords(); }

  /* ── 날짜 선택 공통 처리 ─────────────────────────────── */
  function selectDate(iso) {
    selDate = iso;
    // 선택 날짜가 속한 달로 뷰 이동
    const [y, m] = iso.split("-").map(Number);
    viewY = y; viewM = m;
    renderWeekBar();
    if (calOpen) renderCalendar();
    refreshDay();
    $("#day-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  /* ── 월간 캘린더 토글 ───────────────────────────────── */
  function toggleCal() {
    calOpen = !calOpen;
    const wrap = $("#full-cal-wrap");
    const btn = $("#btn-cal-toggle");
    if (!wrap || !btn) return;
    wrap.style.display = calOpen ? "" : "none";
    wrap.setAttribute("aria-hidden", String(!calOpen));
    btn.setAttribute("aria-expanded", String(calOpen));
    btn.innerHTML = calOpen
      ? `전체 접기<span class="material-symbols-rounded">expand_less</span>`
      : `전체 보기<span class="material-symbols-rounded">expand_more</span>`;
    if (calOpen) renderCalendar();
  }

  /* ── 월간 캘린더 렌더 ───────────────────────────────── */
  function renderCalendar() {
    const grid = $("#cal-grid"); if (!grid) return;
    $("#cal-month").textContent = `${viewY}년 ${viewM}월`;
    const marks = S.monthMarks(viewY, viewM);
    const first = new Date(viewY, viewM - 1, 1).getDay();
    const days = new Date(viewY, viewM, 0).getDate();

    let html = DOW.map((d, i) => `<div class="dow${i === 0 ? " sun" : ""}">${d}</div>`).join("");
    for (let i = 0; i < first; i++) html += `<div class="cell muted"></div>`;
    for (let d = 1; d <= days; d++) {
      const iso = `${viewY}-${pad(viewM)}-${pad(d)}`;
      const m = marks[iso] || {};
      const isToday = iso === TODAY;
      const isSel = iso === selDate;
      let pip = "";
      if (m.done) pip = `<i class="pip green"></i>`;
      else if (m.task) pip = `<i class="pip orange"></i>`;
      else if (m.rec) pip = `<i class="pip blue"></i>`;
      html += `<button type="button" class="cell${isToday ? " today" : ""}${isSel ? " sel" : ""}" data-date="${iso}">
        <span class="mark">${d}</span>${pip}</button>`;
    }
    grid.innerHTML = html;
  }

  /* ── 이벤트 ─────────────────────────────────────────── */
  document.addEventListener("click", (e) => {
    // 완료
    const d = e.target.closest("[data-done]");
    if (d) { S.completeTask(d.dataset.done); if (window.toast) window.toast("완료했어요. 기록에 저장됐어요."); refreshDay(); renderWeekBar(); if (calOpen) renderCalendar(); return; }
    // 건너뜀
    const sk = e.target.closest("[data-skip]");
    if (sk) { S.skipTask(sk.dataset.skip, ""); if (window.toast) window.toast("건너뜀으로 기록했어요."); refreshDay(); renderWeekBar(); if (calOpen) renderCalendar(); return; }
    // 기록 편집
    const editRec = e.target.closest("[data-edit-rec]");
    if (editRec) { location.href = `record.html?id=${encodeURIComponent(editRec.dataset.editRec)}`; return; }
    // 주간 바 날짜 클릭
    const wbDay = e.target.closest(".wb-day[data-date]");
    if (wbDay) { selectDate(wbDay.dataset.date); return; }
    // 월간 캘린더 셀 클릭
    const cell = e.target.closest("#cal-grid [data-date]");
    if (cell) { selectDate(cell.dataset.date); return; }
    // 전체 보기 토글
    if (e.target.closest("#btn-cal-toggle")) { toggleCal(); return; }
    // 월 이동
    if (e.target.closest("#cal-prev")) { viewM--; if (viewM < 1) { viewM = 12; viewY--; } renderCalendar(); return; }
    if (e.target.closest("#cal-next")) { viewM++; if (viewM > 12) { viewM = 1; viewY++; } renderCalendar(); return; }
  });

  /* ── 추가 폼 (schedule-add.html) ───────────────────── */
  function initForm() {
    const form = $("#sched-form"); if (!form) return;
    const dateInput = $("#s-date");
    if (dateInput && !dateInput.value) dateInput.value = TODAY;

    const daysField = $("#days-field");
    function syncDays() {
      const r = $('input[name="repeat"]:checked')?.value;
      daysField.style.display = (r === "custom" || r === "weekly") ? "" : "none";
    }
    $$('input[name="repeat"]').forEach((r) => r.addEventListener("change", syncDays));
    syncDays();

    const alarmField = $("#alarm-before-field");
    const alarmChk = $("#s-alarm");
    if (alarmChk && alarmField) {
      const syncAlarm = () => { alarmField.style.display = alarmChk.checked ? "" : "none"; };
      alarmChk.addEventListener("change", syncAlarm); syncAlarm();
    }

    /* ── 시간 picker 동적 추가/삭제 ── */
    const timeList = $("#s-time-list");
    const timeAddBtn = $("#s-time-add");

    function addTimeRow(defaultVal) {
      const row = document.createElement("div");
      row.style.cssText = "display:flex;gap:8px;align-items:center";

      const inp = document.createElement("input");
      inp.className = "input";
      inp.setAttribute("data-picker", "time");
      inp.placeholder = "시간 선택";
      if (defaultVal) inp.value = defaultVal;

      const del = document.createElement("button");
      del.type = "button";
      del.innerHTML = '<span class="material-symbols-rounded" style="font-size:20px;color:#C0392B">remove_circle</span>';
      del.style.cssText = "flex-shrink:0;padding:4px";
      del.addEventListener("click", () => {
        if (timeList.children.length > 1) row.remove();
        else if (window.toast) window.toast("시간은 최소 1개 필요해요", "info");
      });

      row.appendChild(inp);
      row.appendChild(del);
      timeList.appendChild(row);

      // DOM 삽입 후 bind — bind()가 input을 hidden으로 바꾸고 trig 버튼을 afterend에 삽입
      if (window.PetPicker) {
        PetPicker.bind(inp);
        // trig 버튼이 inp 바로 뒤, del 앞에 위치하므로 flex:1 지정
        if (inp._pkTrigger) {
          inp._pkTrigger.style.flex = "1";
        }
      }
    }

    // 기본 시간 1개 추가
    addTimeRow("09:00");

    timeAddBtn.addEventListener("click", () => addTimeRow(""));

    function getSelectedTimes() {
      return Array.from(timeList.querySelectorAll("input")).map((i) => i.value.trim()).filter(Boolean);
    }

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const type = $('input[name="type"]:checked')?.value || "memo";
      const title = $("#s-title").value.trim();
      const description = $("#s-desc").value.trim();
      const repeat = $('input[name="repeat"]:checked')?.value || "daily";
      const days = $$('input[name="day"]:checked').map((d) => d.value);
      const times = getSelectedTimes();
      const start = $("#s-date").value || TODAY;
      const end = $("#s-end")?.value || "";
      const alarm = $("#s-alarm")?.checked || false;
      const before = Number($("#s-alarm-before")?.value || 0);
      const memo = $("#s-memo").value.trim();

      if (!title) { if (window.toast) window.toast("일정 제목을 입력해 주세요", "info"); $("#s-title").focus(); return; }
      if (times.length === 0) { if (window.toast) window.toast("시간을 1개 이상 선택해 주세요", "info"); return; }

      if (repeat === "once") {
        times.forEach((t) => {
          S.addTask({
            routine_id: null, type, title, description,
            scheduled_date: start, scheduled_time: t, repeat: "once", memo,
            alarm_enabled: alarm, alarm_before_minutes: before,
          });
        });
      } else {
        S.addRoutine({
          type, title, description,
          repeat_type: repeat,
          days_of_week: (repeat === "custom" || repeat === "weekly") ? days : [],
          times,
          start_date: start, end_date: end,
          alarm_enabled: alarm, alarm_before_minutes: before,
          active: true,
        });
      }

      sessionStorage.setItem("sched_added", "1");
      location.href = "schedule.html";
    });
  }

  /* 초기화 */
  const calWrap = $("#full-cal-wrap");
  if (calWrap) calWrap.style.display = "none";
  renderWeekBar();
  refreshDay();
  initForm();
})();
