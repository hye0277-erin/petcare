/* ============================================================
   PetCare+ · 공통 데이터 저장소 (1차 MVP)
   핵심 패러다임: "반복 케어 일정 관리 + 체크 기반 기록"
     care_routines (반복 규칙)
        → care_tasks (오늘 할 일, 루틴에서 생성)
        → records   (체크 결과 자동 기록 + 직접/병원 기록, source 구분)

   - 보호자 1명 / 반려견 1마리. pet_id 는 유지하되 화면은 한 마리만.
   - localStorage 기반. Supabase 연동 시 read/write 만 교체.
   ============================================================ */
(function () {
  "use strict";

  const KEYS = {
    pet: "petcare_pet",
    routines: "petcare_care_routines",
    tasks: "petcare_care_tasks",
    records: "petcare_records",
    hospitals: "petcare_hospitals",
    tests: "petcare_test_results",
  };
  const PET_ID = "pet_1";
  const TODAY = new Date().toISOString().slice(0, 10); // 실제 오늘 날짜

  const read = (k, fb) => { try { const v = JSON.parse(localStorage.getItem(k)); return v ?? fb; } catch (_) { return fb; } };
  const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (_) {} };

  /* 데이터 모델 버전 — 구조가 바뀌면 올려서 이전 시드 데이터를 1회 정리 */
  const SCHEMA_VERSION = "2";
  const SCHEMA_KEY = "petcare_schema_version";
  (function migrate() {
    const cur = localStorage.getItem(SCHEMA_KEY);
    if (cur !== SCHEMA_VERSION) {
      // 일정 중심 구조로 전환: 이전 시드/일정 데이터 정리 후 재시드
      ["petcare_tasks", "petcare_care_tasks", "petcare_care_routines", "petcare_records"].forEach((k) => localStorage.removeItem(k));
      localStorage.setItem(SCHEMA_KEY, SCHEMA_VERSION);
    }
  })();

  /* 유형 메타 (라벨/완료문구) */
  const TYPE_LABEL = {
    med: "약", meal: "식사", water: "물", symptom: "증상 체크", poop: "배변",
    weight: "체중", temp: "체온", breath: "호흡", walk: "산책", hospital: "병원", memo: "메모",
  };

  /* ── 기본(seed) 데이터 ───────────────────────────────── */
  function seed() {
    if (!localStorage.getItem(KEYS.pet)) {
      write(KEYS.pet, {
        id: PET_ID, name: "해피", age: 12, breed: "말티즈",
        gender: "", birthdate: "", weight: "3.8",
        tags: ["심장질환", "신장관리"], photo: "",
        history: "", meds: "", caution: "", next_visit: "2026-06-16",
      });
    }
    if (!localStorage.getItem(KEYS.routines)) {
      write(KEYS.routines, [
        { id: "routine_med_morning", pet_id: PET_ID, type: "med", title: "아침 약", description: "심장약 1정",
          repeat_type: "daily", days_of_week: [], times: ["08:00"], alarm_enabled: true, alarm_before_minutes: 10, active: true },
        { id: "routine_med_evening", pet_id: PET_ID, type: "med", title: "저녁 약", description: "신장 보조 · 1/2 알",
          repeat_type: "daily", days_of_week: [], times: ["20:00"], alarm_enabled: true, alarm_before_minutes: 10, active: true },
        { id: "routine_water", pet_id: PET_ID, type: "water", title: "물 섭취 체크", description: "",
          repeat_type: "daily", days_of_week: [], times: ["09:00", "14:00", "20:00"], alarm_enabled: false, alarm_before_minutes: 0, active: true },
        { id: "routine_walk", pet_id: PET_ID, type: "walk", title: "산책", description: "",
          repeat_type: "daily", days_of_week: [], times: ["16:00"], alarm_enabled: false, alarm_before_minutes: 0, active: true },
        { id: "routine_weight", pet_id: PET_ID, type: "weight", title: "체중 측정", description: "",
          repeat_type: "weekly", days_of_week: ["월"], times: ["09:00"], alarm_enabled: true, alarm_before_minutes: 0, active: true },
        { id: "routine_breath", pet_id: PET_ID, type: "breath", title: "호흡 체크", description: "안정 시 분당 호흡수",
          repeat_type: "daily", days_of_week: [], times: ["21:00"], alarm_enabled: false, alarm_before_minutes: 0, active: true },
      ]);
    }
    if (!localStorage.getItem(KEYS.tasks)) write(KEYS.tasks, []);
    if (!localStorage.getItem(KEYS.records)) {
      write(KEYS.records, [
        { id: "record_seed_1", pet_id: PET_ID, task_id: null, source: "manual", type: "symptom",
          title: "기침", value: "1회", severity: "보통", memo: "산책 후 기침이 있었음",
          photo: true, important: true, fields: { kind: ["기침"], severity: "보통" },
          date: "2026.06.13", time: "16:20", created_at: "2026-06-13T16:20:00" },
        { id: "record_seed_2", pet_id: PET_ID, task_id: null, source: "manual", type: "weight",
          title: "체중", value: "3.8kg", memo: "", photo: false, important: false,
          fields: { weight: "3.8" }, date: "2026.06.11", time: "09:00", created_at: "2026-06-11T09:00:00" },
      ]);
    }
    if (!localStorage.getItem(KEYS.hospitals)) {
      write(KEYS.hospitals, [
        { id: "hospital_1", pet_id: PET_ID, date: "2026-05-20", hospital_name: "서울동물병원",
          doctor_name: "김하늘 수의사", purpose: "정기 진료", content: "신장 검사 · 정기 진료",
          prescriptions: ["심장약 1일 1회 · 아침", "신장 보조제 1일 2회 · 1/2 알"],
          next_visit_date: "2026-06-16", files: [], memo: "" },
        { id: "hospital_2", pet_id: PET_ID, date: "2026-04-18", hospital_name: "해피동물의료센터",
          doctor_name: "", purpose: "검사", content: "심장 초음파",
          prescriptions: [], next_visit_date: "", files: [], memo: "" },
      ]);
    }
    if (!localStorage.getItem(KEYS.tests)) {
      write(KEYS.tests, [
        { id: "test_1", pet_id: PET_ID, date: "2026-06-10", title: "혈액검사", hospital_name: "서울동물병원",
          type: "blood", values: [{ name: "크레아티닌", value: "1.8 mg/dL" }, { name: "BUN", value: "32 mg/dL" }],
          files: [{ name: "혈액검사.pdf", url: "" }], memo: "크레아티닌 수치 포함" },
        { id: "test_2", pet_id: PET_ID, date: "2026-04-18", title: "심장 초음파", hospital_name: "해피동물의료센터",
          type: "image", values: [], files: [{ name: "초음파_1.jpg", url: "" }, { name: "초음파_2.jpg", url: "" }], memo: "초음파 이미지 3장" },
      ]);
    }
  }
  seed();

  /* ── ID 생성기 ─────────────────────────────────────── */
  let _seq = 1000;
  const uid = (p) => `${p}_${++_seq}_${Math.floor(performance.now() % 100000)}`;

  /* ── 날짜 유틸 ─────────────────────────────────────── */
  const DOW = ["일", "월", "화", "수", "목", "금", "토"];
  const dotDate = (iso) => (iso || "").replace(/-/g, ".");
  function dowOf(iso) { const d = new Date(iso); return isNaN(d) ? "" : DOW[d.getDay()]; }
  function routineRunsOn(r, iso) {
    if (!r.active) return false;
    const dow = dowOf(iso);
    switch (r.repeat_type) {
      case "daily": return true;
      case "weekday": return !["일", "토"].includes(dow);
      case "weekend": return ["일", "토"].includes(dow);
      case "weekly":
      case "custom": return (r.days_of_week || []).includes(dow);
      case "once": return r.start_date === iso;
      default: return true;
    }
  }

  /* ── 오늘 일정(care_tasks) 생성/머티리얼라이즈 ────────
     활성 루틴 × times 조합으로 해당 날짜의 task 를 1회 생성.
     이미 만든 task(같은 routine_id+date+time)는 건너뜀.       */
  function materializeTasks(iso) {
    const routines = read(KEYS.routines, []);
    const tasks = read(KEYS.tasks, []);
    let changed = false;
    routines.forEach((r) => {
      if (!routineRunsOn(r, iso)) return;
      (r.times && r.times.length ? r.times : [""]).forEach((time) => {
        const exists = tasks.some((t) => t.routine_id === r.id && t.scheduled_date === iso && t.scheduled_time === time);
        if (exists) return;
        tasks.push({
          id: uid("task"), pet_id: PET_ID, routine_id: r.id, type: r.type,
          title: r.title, description: r.description || "",
          scheduled_date: iso, scheduled_time: time,
          repeat: r.repeat_type, status: "pending", completed_at: null,
          skipped_reason: "", memo: "",
        });
        changed = true;
      });
    });
    if (changed) write(KEYS.tasks, tasks);
    return tasks;
  }

  /* 지난 미완료 일정은 'missed' 로 표시 (오늘 이전 + pending) */
  function markMissed(iso) {
    const tasks = read(KEYS.tasks, []);
    let changed = false;
    tasks.forEach((t) => {
      if (t.status === "pending" && t.scheduled_date < iso) { t.status = "missed"; changed = true; }
    });
    if (changed) write(KEYS.tasks, tasks);
  }

  /* ── 공개 API ──────────────────────────────────────── */
  const PetStore = {
    PET_ID, KEYS, TODAY, TYPE_LABEL, DOW, dotDate,

    /* 반려견 */
    getPet() { return read(KEYS.pet, null); },
    savePet(patch) { const p = Object.assign(this.getPet() || { id: PET_ID }, patch); write(KEYS.pet, p); return p; },
    hasPet() { const p = this.getPet(); return !!(p && p.name); },

    /* 반복 루틴 */
    getRoutines() { return read(KEYS.routines, []); },
    getRoutine(id) { return this.getRoutines().find((x) => x.id === id); },
    addRoutine(r) {
      r.id = r.id || uid("routine"); r.pet_id = PET_ID;
      if (typeof r.active === "undefined") r.active = true;
      const l = this.getRoutines(); l.push(r); write(KEYS.routines, l);
      // 오늘 일정 즉시 반영
      materializeTasks(this.TODAY);
      return r;
    },
    updateRoutine(id, patch) {
      const l = this.getRoutines(); const r = l.find((x) => x.id === id);
      if (!r) return null;
      Object.assign(r, patch); write(KEYS.routines, l);
      // 오늘 아직 미완료(pending)인 해당 루틴 일정에 변경 반영
      const tasks = read(KEYS.tasks, []);
      tasks.forEach((t) => {
        if (t.routine_id === id && t.scheduled_date === this.TODAY && t.status === "pending") {
          if (patch.title) t.title = patch.title;
          if (typeof patch.description !== "undefined") t.description = patch.description;
          if (patch.type) t.type = patch.type;
        }
      });
      write(KEYS.tasks, tasks);
      if (patch.active || patch.times || patch.repeat_type || patch.days_of_week) materializeTasks(this.TODAY);
      return r;
    },
    removeRoutine(id) {
      write(KEYS.routines, this.getRoutines().filter((x) => x.id !== id));
      // 오늘 미완료 일정도 정리
      write(KEYS.tasks, read(KEYS.tasks, []).filter((t) => !(t.routine_id === id && t.status === "pending")));
    },

    /* 오늘 할 일(care_tasks) */
    refresh(iso = this.TODAY) { markMissed(iso); return materializeTasks(iso); },
    getTasks() { return read(KEYS.tasks, []); },
    getTodayTasks(iso = this.TODAY) {
      this.refresh(iso);
      return this.getTasks()
        .filter((t) => t.scheduled_date === iso)
        .sort((a, b) => (a.scheduled_time || "99").localeCompare(b.scheduled_time || "99"));
    },
    getTask(id) { return this.getTasks().find((x) => x.id === id); },
    // 특정 날짜(iso: YYYY-MM-DD)의 일정 — 오늘이면 머티리얼라이즈, 과거/미래는 저장된 것만
    getTasksByDate(iso) {
      if (iso === this.TODAY) this.refresh(iso);
      return this.getTasks()
        .filter((t) => t.scheduled_date === iso)
        .sort((a, b) => (a.scheduled_time || "99").localeCompare(b.scheduled_time || "99"));
    },
    // 특정 날짜의 기록 — record.date 는 점(.) 표기
    getRecordsByDate(iso) {
      const dot = (iso || "").replace(/-/g, ".");
      return this.getRecords()
        .filter((r) => r.date === dot)
        .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
    },
    // 해당 연·월에서 데이터(일정/기록)가 있는 날짜 집합 → 달력 pip 용. {iso: {task, rec, done}}
    monthMarks(year, month1) {
      const prefixDash = `${year}-${String(month1).padStart(2, "0")}-`;
      const prefixDot = `${year}.${String(month1).padStart(2, "0")}.`;
      const marks = {};
      const get = (iso) => (marks[iso] = marks[iso] || { task: false, rec: false, done: false });
      this.getTasks().forEach((t) => {
        if ((t.scheduled_date || "").startsWith(prefixDash)) {
          const m = get(t.scheduled_date); m.task = true; if (t.status === "done") m.done = true;
        }
      });
      this.getRecords().forEach((r) => {
        if ((r.date || "").startsWith(prefixDot)) get(r.date.replace(/\./g, "-")).rec = true;
      });
      return marks;
    },
    // 단발성(루틴 없는) 일정 추가
    addTask(t) {
      t.id = t.id || uid("task"); t.pet_id = PET_ID; t.routine_id = t.routine_id || null;
      t.status = t.status || "pending"; t.completed_at = t.completed_at || null;
      t.skipped_reason = t.skipped_reason || ""; t.memo = t.memo || "";
      const l = this.getTasks(); l.push(t); write(KEYS.tasks, l); return t;
    },
    updateTask(id, patch) { const l = this.getTasks(); const t = l.find((x) => x.id === id); if (t) { Object.assign(t, patch); write(KEYS.tasks, l); } return t; },

    /* 일정 완료 → records 자동 생성 (source: schedule_check) */
    completeTask(id, extra = {}) {
      const t = this.updateTask(id, { status: "done", completed_at: new Date().toISOString(), skipped_reason: "", memo: extra.memo ?? "" });
      if (!t) return null;
      // 같은 task 기존 자동기록 제거 후 재생성 (중복 방지)
      this._removeTaskRecords(id);
      this.addRecord({
        task_id: id, source: "schedule_check", type: t.type,
        title: `${t.title} 완료`, value: "완료", memo: extra.memo || "",
        fields: extra.fields || {}, photo: false, important: false,
        date: dotDate(t.scheduled_date),
        time: (extra.time || (new Date().toTimeString().slice(0, 5))),
      });
      return t;
    },
    /* 일정 건너뜀 → records 자동 생성 */
    skipTask(id, reason = "") {
      const t = this.updateTask(id, { status: "skipped", completed_at: null, skipped_reason: reason });
      if (!t) return null;
      this._removeTaskRecords(id);
      this.addRecord({
        task_id: id, source: "schedule_check", type: t.type,
        title: `${t.title} 건너뜀`, value: "건너뜀", memo: reason || "",
        fields: {}, photo: false, important: false,
        date: dotDate(t.scheduled_date), time: new Date().toTimeString().slice(0, 5),
      });
      return t;
    },
    /* 완료/건너뜀 취소 → pending 으로 되돌리고 자동기록 제거 */
    resetTask(id) {
      const t = this.updateTask(id, { status: "pending", completed_at: null, skipped_reason: "" });
      this._removeTaskRecords(id);
      return t;
    },
    // 하위호환: 기존 호출부 (home.js/schedule.js) 대응
    setTaskStatus(id, status, extra) {
      if (status === "done") return this.completeTask(id, extra || {});
      if (status === "skipped") return this.skipTask(id, extra?.memo || "");
      return this.resetTask(id);
    },
    _removeTaskRecords(taskId) {
      write(KEYS.records, this.getRecords().filter((r) => !(r.task_id === taskId && r.source === "schedule_check")));
    },

    /* 기록(records) */
    getRecords() { return read(KEYS.records, []); },
    addRecord(r) {
      r.id = r.id || uid("record"); r.pet_id = PET_ID;
      r.source = r.source || "manual";
      r.task_id = r.task_id || null;
      r.created_at = r.created_at || (r.date && r.time ? `${(r.date || "").replace(/\./g, "-")}T${r.time}:00` : new Date().toISOString());
      const l = this.getRecords(); l.push(r); write(KEYS.records, l); return r;
    },
    updateRecord(id, patch) { const l = this.getRecords(); const r = l.find((x) => x.id === id); if (r) { Object.assign(r, patch); write(KEYS.records, l); } return r; },
    removeRecord(id) { write(KEYS.records, this.getRecords().filter((x) => x.id !== id)); },
    getRecord(id) { return this.getRecords().find((x) => x.id === id); },

    /* 병원 기록 */
    getHospitals() { return read(KEYS.hospitals, []); },
    getHospital(id) { return this.getHospitals().find((x) => x.id === id); },
    addHospital(h) {
      h.id = h.id || uid("hospital"); h.pet_id = PET_ID;
      h.created_at = h.created_at || new Date().toISOString();
      // 새 필드 기본값
      if (!h.attachments) h.attachments = [];   // [{id,title,kind,date,memo,name,url,type,size}]
      if (!h.values) h.values = [];             // [{id,name,value,unit,date,memo}]
      if (!h.vet_notes) h.vet_notes = "";
      if (!h.diagnosis) h.diagnosis = "";
      if (!h.recommendations) h.recommendations = [];
      if (!h.rx_changes) h.rx_changes = [];
      if (!h.linked_records) h.linked_records = [];
      if (!h.next_visit_memo) h.next_visit_memo = "";
      if (!h.next_visit_time) h.next_visit_time = "";
      if (!h.draft) h.draft = false;
      const l = this.getHospitals(); l.unshift(h); write(KEYS.hospitals, l); return h;
    },
    updateHospital(id, patch) {
      const l = this.getHospitals(); const h = l.find((x) => x.id === id);
      if (!h) return null; Object.assign(h, patch); write(KEYS.hospitals, l); return h;
    },
    removeHospital(id) { write(KEYS.hospitals, this.getHospitals().filter((x) => x.id !== id)); },
    saveDraft(draft) {
      draft.draft = true; draft.id = draft.id || uid("hospital");
      const l = this.getHospitals().filter((x) => !x.draft);
      l.unshift(draft); write(KEYS.hospitals, l); return draft;
    },
    getDraft() { return this.getHospitals().find((x) => x.draft); },
    clearDraft() { write(KEYS.hospitals, this.getHospitals().filter((x) => !x.draft)); },

    /* 검사 결과 */
    getTests() { return read(KEYS.tests, []); },
    addTest(t) { t.id = t.id || uid("test"); t.pet_id = PET_ID; const l = this.getTests(); l.unshift(t); write(KEYS.tests, l); return t; },
    removeTest(id) { write(KEYS.tests, this.getTests().filter((x) => x.id !== id)); },
    getTest(id) { return this.getTests().find((x) => x.id === id); },

    /* 다음 진료 D-day */
    nextVisitDday(today = new Date(this.TODAY)) {
      const dates = [];
      const pet = this.getPet();
      if (pet?.next_visit) dates.push(pet.next_visit);
      this.getHospitals().forEach((h) => { if (h.next_visit_date) dates.push(h.next_visit_date); });
      const t0 = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const future = dates.map((d) => new Date(d)).filter((d) => !isNaN(d) && d >= t0).sort((a, b) => a - b);
      if (!future.length) return null;
      return { date: future[0], dday: Math.round((future[0] - t0) / 86400000) };
    },

    /* 내보내기 */
    exportAll() {
      return {
        exported_at: new Date().toISOString(),
        pet: this.getPet(),
        care_routines: this.getRoutines(),
        care_tasks: this.getTasks(),
        records: this.getRecords(),
        hospitals: this.getHospitals(),
        test_results: this.getTests(),
      };
    },

    resetAll() { Object.values(KEYS).forEach((k) => localStorage.removeItem(k)); seed(); },
  };

  // 페이지 로드 시 오늘 일정 머티리얼라이즈
  PetStore.refresh();

  window.PetStore = PetStore;
})();
