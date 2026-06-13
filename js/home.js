/* ============================================================
   PetCare+ · 홈(index) — 오늘의 케어 대시보드 (핵심 화면)
   - 오늘 할 일(care_tasks)을 확인/체크/건너뜀 → records 자동 생성
   - 진행률 / 남은 일정 / 다음 일정 / 최근 특이사항 / 최근 상태
   ============================================================ */
(function () {
  "use strict";
  if (!window.PetStore) return;
  const S = window.PetStore;
  const $ = (s, r = document) => r.querySelector(s);
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const toast = (m, i) => (window.toast ? window.toast(m, i) : null);
  const TODAY = S.TODAY;

  const CARE_IC = {
    med: ["medication", "t-med"], meal: ["restaurant", "t-meal"], water: ["water_drop", "t-water"],
    symptom: ["sick", "t-symptom"], poop: ["pets", "t-poop"], weight: ["monitor_weight", "t-weight"],
    temp: ["thermostat", "t-temp"], breath: ["air", "t-breath"], walk: ["directions_walk", "t-walk"],
    hospital: ["local_hospital", "t-hospital"], memo: ["sticky_note_2", "t-memo"], photo: ["photo_camera", "t-photo"],
  };

  function ampm(hhmm) {
    if (!hhmm) return "";
    const [h, m] = hhmm.split(":").map(Number);
    return `${h < 12 ? "오전" : "오후"} ${h % 12 || 12}:${String(m).padStart(2, "0")}`;
  }
  const dateKo = (d) => `${d.getMonth() + 1}/${d.getDate()}`;

  /* ── 반려견 요약 카드 ───────────────────────────────── */
  function renderPet() {
    const p = S.getPet(); if (!p) return;
    const nameEl = $("[data-pet-name]");
    if (nameEl) nameEl.innerHTML = `${p.name}<span class="material-symbols-rounded">chevron_right</span>`;
    const metaEl = $("[data-pet-meta]");
    if (metaEl) metaEl.textContent = [p.age ? `${p.age}살` : "", p.breed].filter(Boolean).join(" · ");
    const tagsEl = $("[data-pet-tags]");
    if (tagsEl) tagsEl.innerHTML = (p.tags || []).map((t) => `<span class="tag">${t}</span>`).join("");

    const photoBox = $("[data-pet-photo]");
    if (photoBox && p.photo) {
      photoBox.style.background = "transparent";
      photoBox.innerHTML = `<img src="${p.photo}" alt="${esc(p.name)}" style="width:100%;height:100%;object-fit:cover" />`;
    }

    const ddayEl = $("[data-next-dday]");
    const dateEl = $("[data-next-date]");
    const nv = S.nextVisitDday();
    if (ddayEl) ddayEl.textContent = nv ? (nv.dday === 0 ? "D-DAY" : `D-${nv.dday}`) : "예정 없음";
    if (dateEl && nv) {
      const dow = S.DOW[nv.date.getDay()];
      dateEl.textContent = `${nv.date.getFullYear()}.${String(nv.date.getMonth() + 1).padStart(2, "0")}.${String(nv.date.getDate()).padStart(2, "0")} (${dow})`;
    } else if (dateEl) dateEl.textContent = "";
  }

  /* ── 진행률 + 요약 pill ─────────────────────────────── */
  function renderSummary(tasks) {
    const total = tasks.length;
    const done = tasks.filter((t) => t.status === "done").length;
    const pct = total ? Math.round((done / total) * 100) : 0;

    const fill = $("[data-progress-fill]"); if (fill) fill.style.width = pct + "%";
    const cnt = $("[data-progress-count]"); if (cnt) cnt.innerHTML = `<b>${done}</b> / ${total} 완료`;

    const pending = tasks.filter((t) => t.status === "pending");
    const next = pending.sort((a, b) => (a.scheduled_time || "99").localeCompare(b.scheduled_time || "99"))[0];
    const host = $("#care-summary"); if (!host) return;
    host.innerHTML = `
      <div class="cs-pill">
        <span class="cs-label">남은 케어</span>
        <span class="cs-value"><b>${pending.length}</b>개 남음</span>
      </div>
      <div class="cs-pill">
        <span class="cs-label">다음 일정</span>
        <span class="cs-value">${next ? `${esc(next.title)}${next.scheduled_time ? " · " + ampm(next.scheduled_time) : ""}` : "모두 완료 🎉"}</span>
      </div>`;
  }

  /* ── 오늘의 케어 목록 ───────────────────────────────── */
  function statusLabel(t) {
    if (t.status === "done") return `<span class="check-status">완료${t.completed_at ? " " + ampm(t.completed_at.slice(11, 16)) : ""}</span>`;
    if (t.status === "skipped") return `<span class="check-status st-skipped">건너뜀</span>`;
    if (t.status === "missed") return `<span class="check-status st-missed">놓침</span>`;
    return `<span class="check-status">${t.scheduled_time ? `<span class="material-symbols-rounded">schedule</span>${ampm(t.scheduled_time)}` : ""}</span>`;
  }

  const CARE_LIMIT = 6; // 홈에는 최대 6개만 노출

  function renderCare(tasks) {
    const host = $("#care-list"); if (!host) return;
    if (!tasks.length) {
      host.innerHTML = `<div style="padding:18px;text-align:center;color:var(--color-text-light)">오늘 등록된 케어가 없어요.<br><a href="schedule-add.html" style="color:var(--color-primary);font-weight:700">케어 일정 추가하기</a></div>`;
      return;
    }
    // 정렬: 미완료(예정/놓침) 위로, 완료/건너뜀 아래로. 같은 그룹은 시간순.
    const rank = (t) => (t.status === "done" || t.status === "skipped") ? 1 : 0;
    const sorted = [...tasks].sort((a, b) => {
      const r = rank(a) - rank(b);
      if (r !== 0) return r;
      return (a.scheduled_time || "99").localeCompare(b.scheduled_time || "99");
    });

    const shown = sorted.slice(0, CARE_LIMIT);
    const rest = sorted.length - shown.length;

    const rows = shown.map((t) => {
      const done = t.status === "done", skipped = t.status === "skipped";
      const cls = done ? "done" : skipped ? "skipped" : "";
      // 미완료 항목: 행(글)을 누르면 완료. 버튼은 '건너뜀'만 노출.
      const actions = (!done && !skipped)
        ? `<span class="check-actions">
             <button class="check-act skip" data-care-skip="${t.id}">건너뜀</button>
           </span>`
        : statusLabel(t);
      const clickable = (!done && !skipped) ? ` data-care-toggle="${t.id}" role="button" tabindex="0"` : "";
      return `<div class="check-item ${cls}" data-care-item="${t.id}"${clickable}>
        <span class="check-box"><span class="material-symbols-rounded">check</span></span>
        <span class="check-label">${esc(t.title)}${t.description ? ` <span style="color:var(--color-text-light);font-weight:400">· ${esc(t.description)}</span>` : ""}</span>
        ${actions}
      </div>`;
    }).join("");

    const moreBtn = rest > 0
      ? `<a class="care-more" href="schedule.html"><span>오늘 일정 ${rest}개 더 보기</span><span class="material-symbols-rounded">chevron_right</span></a>`
      : "";

    host.innerHTML = rows + moreBtn;
  }

  /* ── 최근 특이사항 (직접 기록 manual) ───────────────── */
  function renderNotable() {
    const host = $("#recent-notable"); if (!host) return;
    const items = S.getRecords()
      .filter((r) => r.source === "manual")
      .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
      .slice(0, 3);
    if (!items.length) {
      host.innerHTML = `<div class="notable-empty">예정 외 특이사항이 아직 없어요.</div>`;
      return;
    }
    host.innerHTML = items.map((r) => {
      const [ic, cls] = CARE_IC[r.type] || ["edit_note", "ic-blue"];
      const d = new Date(r.created_at);
      return `<a class="notable-item" href="record.html">
        <span class="ni-ic ${cls}"><span class="material-symbols-rounded">${ic}</span></span>
        <span class="ni-body">
          <span class="ni-title">${esc(r.title)}${r.value ? ` · ${esc(r.value)}` : ""}</span>
          <span class="ni-meta">${dateKo(d)} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")} · 직접 기록</span>
        </span>
        <span class="material-symbols-rounded" style="color:var(--color-text-light)">chevron_right</span>
      </a>`;
    }).join("");
  }

  /* ── 최근 상태 요약 ─────────────────────────────────── */
  function latest(type) {
    return S.getRecords().filter((r) => r.type === type).sort((a, b) => (a.created_at < b.created_at ? 1 : -1))[0];
  }
  function renderStatus() {
    const host = $("#status-grid"); if (!host) return;
    const meal = latest("meal"), poop = latest("poop"), breath = latest("breath"), weight = latest("weight");
    const cards = [
      { label: "식욕", ic: "sentiment_satisfied", value: meal?.fields?.complete || meal?.value || "기록 없음", rec: meal },
      { label: "배변", ic: "sentiment_very_satisfied", value: poop ? (poop.fields?.stool || poop.value || "정상") : "기록 없음", rec: poop },
      { label: "호흡", ic: "air", value: breath?.fields?.state || (breath ? `${breath.fields?.rate || "-"}회/분` : "기록 없음"), rec: breath },
      { label: "체중", ic: "monitor_weight", value: weight ? `${weight.fields?.weight || "-"} kg` : "기록 없음", rec: weight },
    ];
    host.innerHTML = cards.map((c) => {
      let time = "기록 없음";
      if (c.rec) { const d = new Date(c.rec.created_at); time = `${dateKo(d)} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`; }
      return `<div class="status-card">
        <div class="label">${c.label}</div>
        <div class="value-row"><span class="value-ic"><span class="material-symbols-rounded">${c.ic}</span></span><span class="value">${esc(c.value)}</span></div>
        <div class="time">${time}</div>
      </div>`;
    }).join("");
  }

  /* ── 전체 렌더 ──────────────────────────────────────── */
  function renderAll() {
    const tasks = S.getTodayTasks();
    renderPet();
    renderSummary(tasks);
    renderCare(tasks);
    renderNotable();
    renderStatus();
  }

  /* ── 케어 완료 / 건너뜀 ─────────────────────────────── */
  document.addEventListener("click", (e) => {
    const doneBtn = e.target.closest("[data-care-done]");
    if (doneBtn) {
      S.completeTask(doneBtn.dataset.careDone);
      toast("케어를 완료했어요. 기록에 저장됐어요.", "check_circle");
      renderAll();
      return;
    }
    const skipBtn = e.target.closest("[data-care-skip]");
    if (skipBtn) {
      S.skipTask(skipBtn.dataset.careSkip, "");
      toast("건너뜀으로 기록했어요.", "remove_done");
      renderAll();
      return;
    }
    // 행(텍스트/체크박스) 클릭 → 완료 (건너뜀 버튼 제외)
    const toggleRow = e.target.closest("[data-care-toggle]");
    if (toggleRow) {
      S.completeTask(toggleRow.dataset.careToggle);
      toast("케어를 완료했어요. 기록에 저장됐어요.", "check_circle");
      renderAll();
      return;
    }
    // 다음 진료 영역 → 병원 화면 (반려견 카드의 settings 이동보다 우선)
    const nextVisit = e.target.closest("#next-visit");
    if (nextVisit) {
      e.preventDefault();
      e.stopPropagation();
      location.href = "hospital.html";
      return;
    }
  });

  // 키보드 접근성: Enter/Space
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    if (e.target.closest("#next-visit")) {
      e.preventDefault();
      location.href = "hospital.html";
      return;
    }
    const row = e.target.closest("[data-care-toggle]");
    if (row) {
      e.preventDefault();
      S.completeTask(row.dataset.careToggle);
      toast("케어를 완료했어요. 기록에 저장됐어요.", "check_circle");
      renderAll();
    }
  });

  renderAll();
})();
