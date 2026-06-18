/* ============================================================
   PetCare+ · 알림 목록 로직
   - 오늘 예정/놓친 케어, 증상 기록, 다음 진료 D-day, 완료 요약을
     store 데이터에서 만들어 보여준다.
   ============================================================ */
(function () {
  "use strict";
  if (!window.PetStore) return;
  const S = window.PetStore;
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const ampm = (t) => { if (!t) return ""; const [h, m] = t.split(":").map(Number); return `${h < 12 ? "오전" : "오후"} ${h % 12 || 12}:${String(m).padStart(2, "0")}`; };

  const pet = S.getPet();
  const name = pet ? pet.name : "반려견";

  // 읽은 알림 ID 저장소
  const READ_KEY = "petcare_noti_read_ids";
  const ALL_READ_KEY = "petcare_noti_read_all";

  function loadReadIds() {
    try { return new Set(JSON.parse(localStorage.getItem(READ_KEY) || "[]")); } catch { return new Set(); }
  }
  function saveReadIds(readSet) {
    localStorage.setItem(READ_KEY, JSON.stringify([...readSet]));
    const hasUnread = items.some((n) => n.unread);
    localStorage.setItem(ALL_READ_KEY, hasUnread ? "0" : "1");
  }

  const readIds = loadReadIds();
  const items = [];

  // 1) 오늘 예정/놓침 케어 → 복약·케어 알림
  S.getTodayTasks().forEach((t) => {
    if (t.status === "pending") {
      const id = `pending_${t.id || t.title}`;
      items.push({ id, unread: !readIds.has(id), ic: "medication", bg: "var(--c-med-bg)", fg: "var(--c-med)",
        title: `${t.title} 시간이에요`, desc: `${name}의 ${t.title}${t.description ? " (" + t.description + ")" : ""} 시간이에요.`, time: ampm(t.scheduled_time) || "오늘" });
    } else if (t.status === "missed") {
      const id = `missed_${t.id || t.title}`;
      items.push({ id, unread: !readIds.has(id), ic: "notifications_active", bg: "var(--c-symptom-bg)", fg: "var(--c-symptom)",
        title: `${t.title}을(를) 놓쳤어요`, desc: `예정된 ${t.title} 케어가 완료되지 않았어요.`, time: ampm(t.scheduled_time) || "오늘" });
    }
  });

  // 2) 최근 증상(직접 기록) → 주의 알림
  S.getRecords().filter((r) => r.source === "manual" && r.type === "symptom")
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1)).slice(0, 2)
    .forEach((r) => {
      const id = `symptom_${r.id}`;
      items.push({ id, unread: !readIds.has(id), ic: "sick", bg: "var(--c-symptom-bg)", fg: "var(--c-symptom)",
        title: "증상 기록 알림", desc: `${name}의 ${r.title} 증상이 기록되었어요. 다음 진료 때 확인해보세요.`, time: (r.date || "") + " " + ampm(r.time) });
    });

  // 3) 다음 진료 D-day
  const nv = S.nextVisitDday();
  if (nv) {
    const id = `visit_${nv.date.toISOString().slice(0, 10)}`;
    items.push({ id, unread: !readIds.has(id), ic: "local_hospital", bg: "var(--c-hospital-bg)", fg: "var(--c-hospital)",
      title: `다음 진료 D-${nv.dday === 0 ? "DAY" : nv.dday}`, desc: `예정된 진료가 다가오고 있어요. 준비물을 확인해 보세요.`, time: `${nv.date.getMonth() + 1}.${nv.date.getDate()}` });
  }

  // 4) 완료 케어 요약
  const doneCount = S.getTodayTasks().filter((t) => t.status === "done").length;
  if (doneCount) {
    const today = S.TODAY || new Date().toISOString().slice(0, 10);
    const id = `done_${today}`;
    items.push({ id, unread: !readIds.has(id), ic: "check_circle", bg: "var(--color-primary-soft)", fg: "var(--color-primary)",
      title: "오늘 케어 진행 중", desc: `오늘 케어 ${doneCount}건을 완료했어요. 잘하고 있어요!`, time: "오늘" });
  }

  function render() {
    if (!items.length) { $("noti-list").innerHTML = `<div class="noti-empty">새로운 알림이 없어요.</div>`; return; }
    $("noti-today").innerHTML = `<div class="noti-sec">최근 알림</div>`;
    $("noti-list").innerHTML = items.map((n, i) => {
      return `<div class="noti ${n.unread ? "unread" : ""}" data-idx="${i}" role="button" tabindex="0">
        <span class="ni-ic" style="background:${n.bg};color:${n.fg}"><span class="material-symbols-rounded">${n.ic}</span></span>
        <span class="ni-body">
          <span class="ni-title">${esc(n.title)}</span>
          <span class="ni-desc">${esc(n.desc)}</span>
          <span class="ni-time">${esc(n.time)}</span>
        </span>
        ${n.unread ? '<span class="ni-dot"></span>' : ''}
      </div>`;
    }).join("");
    // 현재 읽음 상태 저장
    const currentReadIds = new Set(items.filter((n) => !n.unread).map((n) => n.id));
    saveReadIds(currentReadIds);
  }

  // 개별 읽음 처리
  $("noti-list").addEventListener("click", (e) => {
    const el = e.target.closest("[data-idx]");
    if (!el) return;
    const idx = Number(el.dataset.idx);
    if (items[idx].unread) {
      items[idx].unread = false;
      render();
    }
  });

  $("read-all").addEventListener("click", () => {
    items.forEach((n) => { n.unread = false; });
    render();
  });

  render();
})();
