/* ============================================================
   PetCare+ · 일정(schedule) — 반복 케어 관리 화면 (1차 MVP)
   - 오늘의 일정(care_tasks) 우선 노출 + 완료/건너뜀 처리
   - 체크 시 store 가 records(source: schedule_check) 자동 생성
   - schedule-add.html 제출 시 반복 루틴(care_routine) 생성
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
  const pad = (n) => String(n).padStart(2, "0");
  const dot = (iso) => (iso || "").replace(/-/g, ".");

  /* 선택 상태: 기본은 오늘 */
  const [ty, tm, td] = TODAY.split("-").map(Number);
  let selDate = TODAY;                 // YYYY-MM-DD
  let viewY = ty, viewM = tm;          // 캘린더가 보여주는 연/월

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

  /* ── 선택 날짜의 일정 목록 ──────────────────────────── */
  function renderList() {
    const host = $("#day-list"); if (!host) return;
    const isToday = selDate === TODAY;
    const isPast = selDate < TODAY;
    const items = S.getTasksByDate(selDate);

    // 헤더 타이틀
    const [yy, mm, dd] = selDate.split("-").map(Number);
    const dow = DOW[new Date(yy, mm - 1, dd).getDay()];
    const titleEl = $("#day-title");
    if (titleEl) {
      const pill = isToday ? "오늘" : `${mm}월 ${dd}일`;
      titleEl.innerHTML = `${isToday ? "오늘의 일정" : `${mm}월 ${dd}일 (${dow})`} <span class="today-pill">${pill}</span>`;
    }

    // 오늘만 요약 pill 노출, 과거/미래는 숨김
    const summaryHost = $("#sched-today");
    if (summaryHost) summaryHost.style.display = isToday ? "" : "none";
    if (isToday) renderToday(items);

    if (!items.length) {
      host.innerHTML = `<div style="padding:22px;text-align:center;color:var(--color-text-light)">${isToday ? '오늘 등록된 일정이 없어요.<br><a href="schedule-add.html" style="color:var(--color-primary);font-weight:700">케어 일정 추가하기</a>' : "이 날에는 등록된 일정이 없어요."}</div>`;
      return;
    }
    host.innerHTML = items.map((it) => {
      const [label, icon, cls] = TYPES[it.type] || TYPES.memo;
      const { period, hm } = fmtTime(it.scheduled_time);
      const done = it.status === "done", skipped = it.status === "skipped", missed = it.status === "missed";
      const stateCls = done ? "done" : skipped ? "skipped" : missed ? "missed" : "";

      let right;
      // 과거 날짜는 읽기 전용(상태만), 오늘/미래는 완료/건너뜀 가능
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
    }).join("");

    if (sessionStorage.getItem("sched_added")) {
      sessionStorage.removeItem("sched_added");
      setTimeout(() => { if (window.toast) window.toast("새 케어 루틴을 추가했어요"); }, 150);
    }
  }

  /* ── 선택 날짜의 기록(records) ──────────────────────────
     일정 목록(위)에 이미 나오는 자동 완료/건너뜀(schedule_check)은
     중복이라 제외하고, 직접/병원 기록만 노출한다.            */
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
        // 직접 기록은 배지를 누르면 편집(record.html 상세→수정), 병원 기록은 정적 배지
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

  /* 완료 / 건너뜀 (오늘/미래만 버튼 노출) */
  document.addEventListener("click", (e) => {
    const d = e.target.closest("[data-done]");
    if (d) { S.completeTask(d.dataset.done); if (window.toast) window.toast("완료했어요. 기록에 저장됐어요."); refreshDay(); renderCalendar(); return; }
    const s = e.target.closest("[data-skip]");
    if (s) { S.skipTask(s.dataset.skip, ""); if (window.toast) window.toast("건너뜀으로 기록했어요."); refreshDay(); renderCalendar(); return; }

    // 직접 기록 편집 → 기록 화면에서 상세/수정
    const editRec = e.target.closest("[data-edit-rec]");
    if (editRec) { location.href = `record.html?id=${encodeURIComponent(editRec.dataset.editRec)}`; return; }

    // 달력 셀 클릭 → 날짜 선택
    const cell = e.target.closest("[data-date]");
    if (cell) {
      selDate = cell.dataset.date;
      renderCalendar();
      refreshDay();
      $("#day-title")?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    if (e.target.closest("#cal-prev")) { viewM--; if (viewM < 1) { viewM = 12; viewY--; } renderCalendar(); return; }
    if (e.target.closest("#cal-next")) { viewM++; if (viewM > 12) { viewM = 1; viewY++; } renderCalendar(); return; }
  });

  /* ── 캘린더 렌더 ───────────────────────────────────── */
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
      html += `<div class="cell${isToday ? " today" : ""}${isSel ? " sel" : ""}" data-date="${iso}" role="button" tabindex="0">
        <span class="mark">${d}</span>${pip}</div>`;
    }
    grid.innerHTML = html;
  }

  /* ── 추가 폼 (schedule-add.html) → 반복 루틴 생성 ───── */
  function initForm() {
    const form = $("#sched-form"); if (!form) return;

    const daysField = $("#days-field");
    function syncDays() {
      const r = $('input[name="repeat"]:checked')?.value;
      daysField.style.display = (r === "custom" || r === "weekly") ? "" : "none";
    }
    $$('input[name="repeat"]').forEach((r) => r.addEventListener("change", syncDays));
    syncDays();

    // 알림 토글에 따라 사전 알림시간 노출
    const alarmField = $("#alarm-before-field");
    const alarmChk = $("#s-alarm");
    if (alarmChk && alarmField) {
      const syncAlarm = () => { alarmField.style.display = alarmChk.checked ? "" : "none"; };
      alarmChk.addEventListener("change", syncAlarm); syncAlarm();
    }

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const type = $('input[name="type"]:checked')?.value || "memo";
      const title = $("#s-title").value.trim();
      const description = $("#s-desc").value.trim();
      const repeat = $('input[name="repeat"]:checked')?.value || "daily";
      const days = $$('input[name="day"]:checked').map((d) => d.value);
      // 시간: 콤마/공백 구분으로 여러 번 허용
      const times = ($("#s-time").value || "").split(/[, ]+/).map((s) => s.trim()).filter(Boolean);
      const start = $("#s-date").value || TODAY;
      const end = $("#s-end")?.value || "";
      const alarm = $("#s-alarm")?.checked || false;
      const before = Number($("#s-alarm-before")?.value || 0);
      const memo = $("#s-memo").value.trim();

      if (!title) { if (window.toast) window.toast("일정 제목을 입력해 주세요", "info"); $("#s-title").focus(); return; }

      if (repeat === "once") {
        // 단발성: 루틴 없이 해당 날짜 task 직접 생성
        (times.length ? times : [""]).forEach((t) => {
          S.addTask({ routine_id: null, type, title, description, scheduled_date: start, scheduled_time: t, repeat: "once", memo });
        });
      } else {
        S.addRoutine({
          type, title, description,
          repeat_type: repeat,
          days_of_week: (repeat === "custom" || repeat === "weekly") ? days : [],
          times: times.length ? times : ["09:00"],
          start_date: start, end_date: end,
          alarm_enabled: alarm, alarm_before_minutes: before,
          active: true,
        });
      }

      sessionStorage.setItem("sched_added", "1");
      location.href = "schedule.html";
    });
  }

  renderCalendar();
  refreshDay();
  initForm();
})();
