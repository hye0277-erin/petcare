/* ============================================================
   PetCare+ · 알람 스케줄러
   - 루틴의 alarm_enabled=true 인 항목에 대해 Web Notification 발송
   - 1분마다 현재 시각과 루틴 시각(± alarm_before_minutes)을 비교
   - 같은 알람을 하루에 한 번만 발송 (localStorage로 중복 방지)
   ============================================================ */
(function () {
  "use strict";
  if (!window.PetStore) return;
  if (!("Notification" in window)) return;

  const S = window.PetStore;
  const FIRED_KEY = "petcare_alarm_fired";

  function pad(n) { return String(n).padStart(2, "0"); }
  function todayIso() {
    const d = new Date();
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }
  function nowHHMM() {
    const d = new Date();
    return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  // 발송한 알람 ID 목록 (당일만 유지)
  function loadFired() {
    try {
      const raw = JSON.parse(localStorage.getItem(FIRED_KEY) || "{}");
      // 날짜가 바뀌면 초기화
      if (raw.date !== todayIso()) return {};
      return raw.ids || {};
    } catch { return {}; }
  }
  function saveFired(ids) {
    localStorage.setItem(FIRED_KEY, JSON.stringify({ date: todayIso(), ids }));
  }

  // HH:MM 문자열을 분(minutes)으로 변환
  function toMinutes(hhmm) {
    if (!hhmm) return -1;
    const [h, m] = hhmm.split(":").map(Number);
    return h * 60 + m;
  }

  let alarmTimer = null;
  function startScheduler() {
    if (alarmTimer) return;
    checkAlarms();
    alarmTimer = setInterval(checkAlarms, 60 * 1000);
    window.addEventListener("beforeunload", () => { clearInterval(alarmTimer); alarmTimer = null; }, { once: true });
  }

  function requestAndSchedule() {
    Notification.requestPermission().then((perm) => {
      if (perm !== "granted") return;
      startScheduler();
    });
  }

  const DOW = ["일", "월", "화", "수", "목", "금", "토"];
  function routineRunsToday(r) {
    if (!r.active) return false;
    const dow = DOW[new Date().getDay()];
    switch (r.repeat_type) {
      case "daily":   return true;
      case "weekday": return !["일", "토"].includes(dow);
      case "weekend": return ["일", "토"].includes(dow);
      case "weekly":
      case "custom":  return (r.days_of_week || []).includes(dow);
      case "once":    return r.start_date === todayIso();
      default:        return true;
    }
  }

  function fireOne(alarmId, title, description, beforeMinutes, fired) {
    if (fired[alarmId]) return false;
    fired[alarmId] = true;
    const pet = S.getPet ? S.getPet() : null;
    const petName = pet ? pet.name : "반려견";
    const beforeMsg = beforeMinutes > 0 ? ` (${beforeMinutes}분 전 알림)` : "";
    const body = `${petName}의 ${title}${description ? " · " + description : ""}${beforeMsg}`;
    new Notification("PetCare+ 케어 알림", { body, icon: "images/icon-192.png", tag: alarmId });
    localStorage.setItem("petcare_noti_read_all", "0");
    return true;
  }

  function checkAlarms() {
    const now = toMinutes(nowHHMM());
    const today = todayIso();
    const fired = loadFired();
    let changed = false;

    // 반복 루틴 알람
    const routines = S.getRoutines ? S.getRoutines() : [];
    routines.forEach((r) => {
      if (!r.active || !r.alarm_enabled) return;
      if (!routineRunsToday(r)) return;
      (r.times || []).forEach((time) => {
        const fireAt = toMinutes(time) - (r.alarm_before_minutes || 0);
        if (now < fireAt || now > fireAt + 1) return;
        if (fireOne(`r_${r.id}_${today}_${time}`, r.title, r.description, r.alarm_before_minutes || 0, fired)) changed = true;
      });
    });

    // 한 번만(once) Task 알람
    const tasks = S.getTasks ? S.getTasks() : [];
    tasks.forEach((t) => {
      if (!t.alarm_enabled) return;
      if (t.scheduled_date !== today) return;
      if (!t.scheduled_time) return;
      const fireAt = toMinutes(t.scheduled_time) - (t.alarm_before_minutes || 0);
      if (now < fireAt || now > fireAt + 1) return;
      if (fireOne(`t_${t.id}_${today}`, t.title, t.description, t.alarm_before_minutes || 0, fired)) changed = true;
    });

    if (changed) saveFired(fired);
  }

  // 알림 권한 요청 및 스케줄 시작
  if (Notification.permission === "granted") {
    startScheduler();
  } else if (Notification.permission !== "denied") {
    // 사용자 제스처 없이는 권한 요청이 막히는 브라우저를 위해
    // 첫 클릭 시 권한 요청
    document.addEventListener("click", function onFirstClick() {
      document.removeEventListener("click", onFirstClick);
      requestAndSchedule();
    }, { once: true });
  }
})();
