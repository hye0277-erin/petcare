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
  const items = [];

  // 1) 오늘 예정/놓침 케어 → 복약·케어 알림
  S.getTodayTasks().forEach((t) => {
    if (t.status === "pending") {
      items.push({ unread: true, ic: "medication", bg: "var(--c-med-bg)", fg: "var(--c-med)",
        title: `${t.title} 시간이에요`, desc: `${name}의 ${t.title}${t.description ? " (" + t.description + ")" : ""} 시간이에요.`, time: ampm(t.scheduled_time) || "오늘" });
    } else if (t.status === "missed") {
      items.push({ unread: true, ic: "notifications_active", bg: "var(--c-symptom-bg)", fg: "var(--c-symptom)",
        title: `${t.title}을(를) 놓쳤어요`, desc: `예정된 ${t.title} 케어가 완료되지 않았어요.`, time: ampm(t.scheduled_time) || "오늘" });
    }
  });

  // 2) 최근 증상(직접 기록) → 주의 알림
  S.getRecords().filter((r) => r.source === "manual" && r.type === "symptom")
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1)).slice(0, 2)
    .forEach((r) => {
      items.push({ unread: false, ic: "sick", bg: "var(--c-symptom-bg)", fg: "var(--c-symptom)",
        title: "증상 기록 알림", desc: `${name}의 ${r.title} 증상이 기록되었어요. 다음 진료 때 확인해보세요.`, time: (r.date || "") + " " + ampm(r.time) });
    });

  // 3) 다음 진료 D-day
  const nv = S.nextVisitDday();
  if (nv) {
    items.push({ unread: false, ic: "local_hospital", bg: "var(--c-hospital-bg)", fg: "var(--c-hospital)",
      title: `다음 진료 D-${nv.dday === 0 ? "DAY" : nv.dday}`, desc: `예정된 진료가 다가오고 있어요. 준비물을 확인해 보세요.`, time: `${nv.date.getMonth() + 1}.${nv.date.getDate()}` });
  }

  // 4) 완료 케어 요약
  const doneCount = S.getTodayTasks().filter((t) => t.status === "done").length;
  if (doneCount) {
    items.push({ unread: false, ic: "check_circle", bg: "var(--color-primary-soft)", fg: "var(--color-primary)",
      title: "오늘 케어 진행 중", desc: `오늘 케어 ${doneCount}건을 완료했어요. 잘하고 있어요!`, time: "오늘" });
  }

  let readAllFlag = false;
  function render() {
    if (!items.length) { $("noti-list").innerHTML = `<div class="noti-empty">새로운 알림이 없어요.</div>`; return; }
    $("noti-today").innerHTML = `<div class="noti-sec">최근 알림</div>`;
    $("noti-list").innerHTML = items.map((n) => {
      const unread = n.unread && !readAllFlag;
      return `<div class="noti ${unread ? "unread" : ""}">
        <span class="ni-ic" style="background:${n.bg};color:${n.fg}"><span class="material-symbols-rounded">${n.ic}</span></span>
        <span class="ni-body">
          <span class="ni-title">${esc(n.title)}</span>
          <span class="ni-desc">${esc(n.desc)}</span>
          <span class="ni-time">${esc(n.time)}</span>
        </span>
        ${unread ? '<span class="ni-dot"></span>' : ''}
      </div>`;
    }).join("");
  }
  $("read-all").addEventListener("click", () => { readAllFlag = true; render(); });
  render();
})();
