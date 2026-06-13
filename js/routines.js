/* ============================================================
   PetCare+ · 반복 루틴 관리 (routines.html)
   - 루틴 목록 / 활성·비활성 토글 / 수정 / 삭제
   - 수정 시 오늘의 미완료 일정에도 반영 (store.updateRoutine)
   ============================================================ */
(function () {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const S = window.PetStore;
  const toast = (m, i) => (window.toast ? window.toast(m, i) : null);

  const TYPES = {
    med: ["약", "medication", "t-med"], meal: ["식사", "restaurant", "t-meal"],
    water: ["물", "water_drop", "t-water"], symptom: ["증상 체크", "sick", "t-symptom"],
    poop: ["배변", "pets", "t-poop"], weight: ["체중", "monitor_weight", "t-weight"],
    temp: ["체온", "thermostat", "t-temp"], breath: ["호흡", "air", "t-breath"],
    walk: ["산책", "directions_walk", "t-walk"], hospital: ["병원", "local_hospital", "t-hospital"],
    memo: ["메모", "sticky_note_2", "t-memo"],
  };
  const REPEAT_LABEL = { daily: "매일", weekday: "평일", weekend: "주말", weekly: "매주", custom: "특정 요일", once: "한 번만" };

  function repeatText(r) {
    let base = REPEAT_LABEL[r.repeat_type] || r.repeat_type;
    if ((r.repeat_type === "weekly" || r.repeat_type === "custom") && (r.days_of_week || []).length)
      base += " " + r.days_of_week.join("·");
    const times = (r.times || []).join(", ");
    return [base, times].filter(Boolean).join(" · ");
  }

  let editId = null;

  function render() {
    const host = $("#routine-list");
    const list = S.getRoutines();
    if (!list.length) { host.innerHTML = `<div class="notable-empty">등록된 루틴이 없어요.</div>`; return; }
    host.innerHTML = list.map((r) => {
      const [label, icon, cls] = TYPES[r.type] || TYPES.memo;
      return `<div class="routine-card ${r.active ? "" : "off"}">
        <span class="rc-ic ${cls}"><span class="material-symbols-rounded">${icon}</span></span>
        <div class="rc-body">
          <div class="rc-title">${esc(r.title)} <span class="rc-type">${label}</span></div>
          <div class="rc-meta">${esc(repeatText(r))}</div>
          <div class="rc-meta">알림 ${r.alarm_enabled ? "ON" : "OFF"} · ${r.active ? "활성" : "비활성"}</div>
        </div>
        <div class="rc-actions">
          <button class="switch ${r.active ? "on" : ""}" role="switch" aria-checked="${r.active}" data-toggle="${r.id}" aria-label="활성 토글"></button>
          <button class="icon-btn" data-edit="${r.id}" aria-label="수정"><span class="material-symbols-rounded">edit</span></button>
          <button class="icon-btn" data-del="${r.id}" aria-label="삭제"><span class="material-symbols-rounded">delete</span></button>
        </div>
      </div>`;
    }).join("");
  }

  function openEdit(id) {
    const r = S.getRoutine(id); if (!r) return;
    editId = id;
    $("#e-title").value = r.title || "";
    $("#e-desc").value = r.description || "";
    $("#e-times").value = (r.times || []).join(", ");
    $("#e-alarm").checked = !!r.alarm_enabled;
    const rep = document.querySelector(`input[name="e-repeat"][value="${r.repeat_type}"]`);
    if (rep) rep.checked = true; else document.querySelector('input[name="e-repeat"][value="daily"]').checked = true;
    $$('input[name="e-day"]').forEach((c) => (c.checked = (r.days_of_week || []).includes(c.value)));
    syncDays();
    $("#routine-sheet").classList.add("show");
  }
  function closeSheet() { $("#routine-sheet").classList.remove("show"); }

  function syncDays() {
    const v = document.querySelector('input[name="e-repeat"]:checked')?.value;
    $("#e-days-field").style.display = (v === "weekly" || v === "custom") ? "" : "none";
  }

  function saveEdit() {
    if (!editId) return;
    const repeat = document.querySelector('input[name="e-repeat"]:checked')?.value || "daily";
    const days = $$('input[name="e-day"]:checked').map((c) => c.value);
    const times = $("#e-times").value.split(/[, ]+/).map((s) => s.trim()).filter(Boolean);
    S.updateRoutine(editId, {
      title: $("#e-title").value.trim() || "케어",
      description: $("#e-desc").value.trim(),
      times: times.length ? times : ["09:00"],
      repeat_type: repeat,
      days_of_week: (repeat === "weekly" || repeat === "custom") ? days : [],
      alarm_enabled: $("#e-alarm").checked,
    });
    toast("루틴을 수정했어요. 앞으로의 일정에 반영돼요.");
    closeSheet(); render();
  }

  document.addEventListener("click", (e) => {
    const tg = e.target.closest("[data-toggle]");
    if (tg) { const r = S.getRoutine(tg.dataset.toggle); S.updateRoutine(tg.dataset.toggle, { active: !r.active }); render(); return; }
    const ed = e.target.closest("[data-edit]");
    if (ed) return openEdit(ed.dataset.edit);
    const dl = e.target.closest("[data-del]");
    if (dl) { if (confirm("이 루틴을 삭제할까요? 오늘의 미완료 일정도 함께 정리됩니다.")) { S.removeRoutine(dl.dataset.del); toast("루틴을 삭제했어요", "delete"); render(); } return; }
    if (e.target.closest("#e-save")) return saveEdit();
    if (e.target.closest("[data-r-close]")) return closeSheet();
    const ov = e.target.closest(".sheet-overlay");
    if (ov && e.target === ov) ov.classList.remove("show");
  });
  document.addEventListener("change", (e) => { if (e.target.closest('input[name="e-repeat"]')) syncDays(); });

  render();
})();
