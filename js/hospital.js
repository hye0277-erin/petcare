/* ============================================================
   PetCare+ · 병원 — 다음 진료 준비 중심 화면 (1차 MVP)
   - 공통 저장소 window.PetStore (petcare_hospitals / petcare_test_results)
   - 다음 진료 D-day / 최근 방문 / 검사 결과(보기·다운로드) / 처방(복약 일정 연결) / 병원 메모
   - 파일은 브라우저 제한상 파일명 + object URL 로 보관(미리보기/다운로드)
   ============================================================ */
(function () {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const S = window.PetStore;
  const toast = (m, i) => (window.toast ? window.toast(m, i) : null);
  const PAGE = ""; /* .scroll 이 이미 좌우 패딩(var(--space-page))을 주므로 래퍼는 패딩 없음 */
  const dot = (iso) => (iso || "").replace(/-/g, ".");
  const DOW = ["일", "월", "화", "수", "목", "금", "토"];
  function dowOf(iso) { const d = new Date(iso); return isNaN(d) ? "" : DOW[d.getDay()]; }

  const PURPOSE_T = {
    "정기 진료": "t-weight", "검사": "t-temp", "응급": "t-symptom",
    "예방접종": "t-water", "처방 갱신": "t-hospital", "기타": "t-memo",
  };

  /* ── 다음 진료 카드 ─────────────────────────────────── */
  function renderNextVisit() {
    const host = $("#next-visit-card"); if (!host) return;
    const nv = S.nextVisitDday();
    // 다음 진료가 등록된 병원 기록(있으면 가장 가까운 미래) 찾기
    let info = null;
    if (nv) {
      const iso = `${nv.date.getFullYear()}-${String(nv.date.getMonth() + 1).padStart(2, "0")}-${String(nv.date.getDate()).padStart(2, "0")}`;
      info = S.getHospitals().find((h) => h.next_visit_date === iso) || S.getHospitals()[0] || null;
    }
    if (!nv) {
      host.innerHTML = `<div style="${PAGE}"><div class="card" style="text-align:center;color:var(--color-text-light);padding:22px">
        예정된 다음 진료가 없어요.<br><span style="color:var(--color-primary);font-weight:700;cursor:pointer" id="nv-add">병원 기록 추가하기</span></div></div>`;
      return;
    }
    const dd = nv.dday === 0 ? "D-DAY" : `D-${nv.dday}`;
    host.innerHTML = `<div style="${PAGE}">
      <div class="card" style="background:var(--color-primary);color:#fff;position:relative;overflow:hidden">
        <div style="position:absolute;width:140px;height:140px;border-radius:50%;background:rgba(255,255,255,.07);top:-40px;right:-30px"></div>
        <div style="font-size:11px;color:rgba(255,255,255,.6);margin-bottom:4px">다음 진료까지</div>
        <div style="font-size:30px;font-weight:800;letter-spacing:-1px;margin-bottom:12px">${dd}</div>
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px">
          <div style="width:38px;height:38px;border-radius:12px;background:rgba(255,255,255,.15);display:flex;align-items:center;justify-content:center"><span class="material-symbols-rounded">local_hospital</span></div>
          <div style="flex:1">
            <div style="font-size:14px;font-weight:700">${esc(info?.hospital_name || "병원")}${info?.doctor_name ? ` · ${esc(info.doctor_name)}` : ""}</div>
            <div style="font-size:11px;color:rgba(255,255,255,.65);margin-top:2px">${dot(info?.next_visit_date || "")} (${dowOf(info?.next_visit_date || "")})${info?.purpose ? " · " + esc(info.purpose) : ""}</div>
          </div>
        </div>
        <a href="report.html" style="display:flex;align-items:center;justify-content:center;gap:6px;padding:11px;border-radius:var(--radius-sm);background:rgba(255,255,255,.16);color:#fff;font-size:13px;font-weight:700;text-decoration:none">
          <span class="material-symbols-rounded" style="font-size:18px">description</span>진료 전 요약 보기</a>
      </div>
    </div>`;
  }

  /* ── 최근 방문 기록 ─────────────────────────────────── */
  function renderVisits() {
    const host = $("#visit-list");
    const list = S.getHospitals();
    if (!list.length) { host.innerHTML = `<div style="${PAGE}"><div class="card" style="color:var(--color-text-light);padding:18px;text-align:center">아직 병원 방문 기록이 없어요.</div></div>`; return; }
    host.innerHTML = `<div style="${PAGE}display:flex;flex-direction:column;gap:9px">` + list.map((h) => `
      <div class="card" style="display:flex;align-items:flex-start;gap:12px;margin:0;padding:14px 16px">
        <span class="row-ic ${PURPOSE_T[h.purpose] || "t-weight"}" style="flex-shrink:0"><span class="material-symbols-rounded">local_hospital</span></span>
        <div style="flex:1;min-width:0">
          <div style="font-size:14px;font-weight:700">${esc(h.hospital_name || "병원")}</div>
          <div style="font-size:12px;color:var(--color-text-sub);margin-top:2px">${esc([h.purpose, h.doctor_name].filter(Boolean).join(" · "))}</div>
          ${h.content || h.memo ? `<div style="font-size:12px;color:var(--color-text-light);margin-top:6px;line-height:1.5">${esc(h.content || h.memo)}</div>` : ""}
        </div>
        <span style="font-size:11px;color:var(--color-text-light);flex-shrink:0">${dot(h.date)}</span>
      </div>`).join("") + `</div>`;
  }

  /* ── 검사 결과 (보기 / 다운로드) ────────────────────── */
  function renderTests() {
    const host = $("#test-list");
    const list = S.getTests();
    const typeLabel = (t) => ({ blood: "혈액검사", image: "영상 검사", urine: "소변검사" }[t.type] || "기타");
    if (!list.length) { host.innerHTML = `<div style="${PAGE}"><div class="card" style="color:var(--color-text-light);padding:18px;text-align:center">업로드된 검사 결과가 없어요.</div></div>`; return; }
    host.innerHTML = `<div style="${PAGE}display:flex;flex-direction:column;gap:9px">` + list.map((t) => {
      const file = (t.files || [])[0];
      return `<div class="card" style="margin:0;padding:14px 16px">
        <div style="display:flex;align-items:flex-start;gap:12px">
          <span class="row-ic ${t.type === "image" ? "t-photo" : "t-temp"}" style="flex-shrink:0"><span class="material-symbols-rounded">${t.type === "image" ? "photo_library" : "description"}</span></span>
          <div style="flex:1;min-width:0">
            <div style="font-size:14px;font-weight:700">${esc(file ? file.name : t.title)}</div>
            <div style="font-size:12px;color:var(--color-text-sub);margin-top:2px">${esc(typeLabel(t))} · ${dot(t.date)}</div>
            ${t.memo ? `<div style="font-size:11px;color:var(--color-text-light);margin-top:4px">${esc(t.memo)}</div>` : ""}
          </div>
        </div>
        <div style="display:flex;gap:8px;margin-top:12px">
          <button class="btn btn-ghost" style="flex:1;padding:9px;font-size:12px" data-test="${t.id}"><span class="material-symbols-rounded" style="font-size:16px">visibility</span> 보기</button>
          ${file && file.url
            ? `<a class="btn btn-ghost" style="flex:1;padding:9px;font-size:12px" href="${file.url}" download="${esc(file.name)}"><span class="material-symbols-rounded" style="font-size:16px">download</span> 다운로드</a>`
            : `<button class="btn btn-ghost" style="flex:1;padding:9px;font-size:12px" data-test-dl><span class="material-symbols-rounded" style="font-size:16px">download</span> 다운로드</button>`}
        </div>
      </div>`;
    }).join("") + `</div>`;
  }

  /* ── 처방 내역 (복약 일정으로 추가) ─────────────────── */
  function renderRx() {
    const host = $("#rx-list");
    // 처방을 {text, hospitalId} 로 수집 (중복 텍스트 제거)
    const seen = new Set(); const list = [];
    S.getHospitals().forEach((h) => (h.prescriptions || []).forEach((p) => { if (!seen.has(p)) { seen.add(p); list.push(p); } }));
    if (!list.length) { host.innerHTML = `<div style="${PAGE}"><div class="card" style="color:var(--color-text-light);padding:18px;text-align:center">등록된 처방 내역이 없어요.</div></div>`; return; }
    host.innerHTML = `<div style="${PAGE}display:flex;flex-direction:column;gap:9px">` + list.map((p) => {
      const [name, ...rest] = p.split(/\s+/);
      return `<div class="card" style="display:flex;align-items:center;gap:12px;margin:0;padding:13px 16px">
        <span class="row-ic t-med" style="flex-shrink:0"><span class="material-symbols-rounded">medication</span></span>
        <div style="flex:1;min-width:0">
          <div style="font-size:14px;font-weight:700">${esc(name)}</div>
          <div style="font-size:12px;color:var(--color-text-sub);margin-top:2px">${esc(rest.join(" ") || "복용 정보 없음")}</div>
        </div>
        <button class="btn btn-ghost" style="padding:8px 12px;font-size:12px;flex-shrink:0" data-rx="${esc(p)}"><span class="material-symbols-rounded" style="font-size:16px">add_alarm</span> 복약</button>
      </div>`;
    }).join("") + `</div>`;
  }

  /* ── 병원 메모 ──────────────────────────────────────── */
  function renderMemo() {
    const host = $("#memo-card"); if (!host) return;
    // 가장 최근 병원 기록의 메모를 다음 진료 때 확인할 내용으로 노출
    const memos = S.getHospitals().filter((h) => h.memo).map((h) => ({ memo: h.memo, date: h.date }));
    host.innerHTML = `<div style="${PAGE}">
      <div class="card" style="margin:0">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:${memos.length ? "10px" : "0"}">
          <span class="material-symbols-rounded" style="color:var(--color-orange)">sticky_note_2</span>
          <span style="font-size:13px;font-weight:700">다음 진료 때 확인할 내용</span>
        </div>
        ${memos.length
          ? memos.map((m) => `<div style="font-size:12px;color:var(--color-text-sub);line-height:1.6;padding:8px 0;border-top:1px solid var(--color-border)">${esc(m.memo)} <span style="color:var(--color-text-light)">· ${dot(m.date)}</span></div>`).join("")
          : `<div style="font-size:12px;color:var(--color-text-light)">병원 기록 추가 시 메모를 남기면 여기에 모여요.</div>`}
      </div>
    </div>`;
  }

  function renderAll() { renderNextVisit(); renderVisits(); renderTests(); renderRx(); renderMemo(); }

  /* ── 병원 기록 추가 ─────────────────────────────────── */
  function openHospitalSheet() { $("#hospital-sheet").classList.add("show"); }
  function closeSheets() { $$(".sheet-overlay").forEach((o) => o.classList.remove("show")); }

  function saveHospital() {
    const name = $("#h-name").value.trim();
    if (!name) { toast("병원명을 입력해 주세요", "info"); $("#h-name").focus(); return; }

    const files = [];
    const fileInput = $("#h-file");
    if (fileInput.files && fileInput.files[0]) { const f = fileInput.files[0]; files.push({ name: f.name, url: URL.createObjectURL(f) }); }

    const prescriptions = $("#h-rx").value.split("\n").map((s) => s.trim()).filter(Boolean);
    const next = $("#h-next").value || "";
    const date = $("#h-date").value || S.TODAY;

    S.addHospital({
      date, hospital_name: name,
      doctor_name: $("#h-doctor").value.trim(),
      purpose: $('input[name="h-purpose"]:checked')?.value || "정기 진료",
      content: $("#h-content").value.trim(),
      prescriptions, next_visit_date: next, files,
      memo: $("#h-memo").value.trim(),
    });
    if (next) S.savePet({ next_visit: next }); // 홈/병원 D-day 반영

    // 검사 결과 파일 → 검사 결과 목록에 추가
    const testInput = $("#h-test-file");
    if (testInput && testInput.files && testInput.files[0]) {
      const tf = testInput.files[0];
      const isImg = /image\//.test(tf.type);
      S.addTest({
        date, title: $("#h-test-name").value.trim() || tf.name,
        hospital_name: name, type: isImg ? "image" : "blood",
        values: [], files: [{ name: tf.name, url: URL.createObjectURL(tf) }], memo: "",
      });
    }

    // 처방 약물로 복약 일정(루틴) 생성
    if ($("#h-make-task").checked && prescriptions.length) {
      prescriptions.forEach((p) => makeMedRoutine(p));
      toast("병원 기록과 복약 일정을 저장했어요");
    } else {
      toast("병원 기록을 저장했어요");
    }
    closeSheets();
    renderAll();
  }

  // 처방 문자열 → 복약 루틴 생성
  function makeMedRoutine(p) {
    const [name, ...rest] = p.split(/\s+/);
    S.addRoutine({
      type: "med", title: name || "복약", description: rest.join(" "),
      repeat_type: "daily", days_of_week: [], times: ["08:00"],
      alarm_enabled: true, alarm_before_minutes: 10, active: true,
    });
  }

  /* ── 검사 결과 상세 ─────────────────────────────────── */
  function openTest(id) {
    const t = S.getTest(id); if (!t) return;
    $("#t-title").textContent = t.title;
    const typeLabel = { blood: "혈액검사", image: "영상 검사", urine: "소변검사" }[t.type] || "기타";
    const rows = [["검사명", t.title], ["검사 날짜", dot(t.date)], ["병원명", t.hospital_name], ["검사 종류", typeLabel]];
    let html = `<div class="card" style="margin-top:0">` +
      rows.map(([k, v]) => `<div class="row"><div class="row-body"><div class="row-desc">${esc(k)}</div><div class="row-title">${esc(v || "-")}</div></div></div>`).join("") + `</div>`;
    if ((t.values || []).length) {
      html += `<div class="card-label">주요 수치</div><div class="card">` +
        t.values.map((v) => `<div class="row"><div class="row-body"><div class="row-title">${esc(v.name)}</div><div class="row-desc">${esc(v.value)}</div></div></div>`).join("") + `</div>`;
    }
    html += `<div class="card-label">첨부 파일</div><div class="card">`;
    if ((t.files || []).length) {
      html += t.files.map((f, i) => `
        <div class="row">
          <span class="row-ic t-temp"><span class="material-symbols-rounded">attach_file</span></span>
          <div class="row-body"><div class="row-title">${esc(f.name)}</div></div>
          <span style="display:flex;gap:6px">
            ${f.url ? `<a class="icon-btn" href="${f.url}" target="_blank" rel="noopener" aria-label="파일 보기"><span class="material-symbols-rounded">visibility</span></a>
            <a class="icon-btn" href="${f.url}" download="${esc(f.name)}" aria-label="다운로드"><span class="material-symbols-rounded">download</span></a>`
            : `<button class="icon-btn" data-test-preview="${i}" aria-label="미리보기"><span class="material-symbols-rounded">visibility</span></button>`}
          </span>
        </div>`).join("");
    } else { html += `<div class="row"><div class="row-body"><div class="row-desc">첨부 파일이 없어요.</div></div></div>`; }
    html += `</div>`;
    if (t.memo) html += `<div class="card-label">메모</div><div class="card"><div class="row"><div class="row-body"><div class="row-desc">${esc(t.memo)}</div></div></div></div>`;

    $("#t-body").innerHTML = html;
    $("#test-sheet").dataset.testId = id;
    $("#test-sheet").classList.add("show");
  }

  function shareTest() {
    const id = $("#test-sheet").dataset.testId;
    const t = S.getTest(id); if (!t) return;
    const text = `[${S.getPet()?.name || "반려견"} 검사 결과]\n검사명: ${t.title}\n날짜: ${dot(t.date)}\n병원: ${t.hospital_name}\n` +
      (t.values || []).map((v) => `- ${v.name}: ${v.value}`).join("\n") +
      (t.memo ? `\n메모: ${t.memo}` : "") +
      `\n\n※ 입력된 기록 기준 요약이며, 다음 진료 때 함께 확인해보세요.`;
    if (navigator.share) navigator.share({ title: `${t.title} 검사 결과`, text }).catch(() => {});
    else if (navigator.clipboard) navigator.clipboard.writeText(text).then(() => toast("요약 텍스트를 복사했어요", "content_copy")).catch(() => toast("복사에 실패했어요", "info"));
    else toast("공유를 지원하지 않는 환경이에요", "info");
  }

  /* ── 이벤트 ─────────────────────────────────────────── */
  document.addEventListener("click", (e) => {
    if (e.target.closest("#btn-add-hospital") || e.target.closest("#btn-add-hospital-2") || e.target.closest("#nv-add")) return openHospitalSheet();
    if (e.target.closest("#h-save")) return saveHospital();
    if (e.target.closest("#t-share")) return shareTest();

    const rxBtn = e.target.closest("[data-rx]");
    if (rxBtn) { makeMedRoutine(rxBtn.dataset.rx); toast("복약 일정으로 추가했어요", "add_alarm"); return; }

    const testBtn = e.target.closest("[data-test]");
    if (testBtn) return openTest(testBtn.dataset.test);

    if (e.target.closest("[data-test-dl]") || e.target.closest("[data-test-preview]")) return toast("업로드한 파일에서만 보기·다운로드할 수 있어요", "info");

    if (e.target.closest("[data-h-close]")) return closeSheets();
    const ov = e.target.closest(".sheet-overlay");
    if (ov && e.target === ov) ov.classList.remove("show");
  });

  // 반려견 이름 반영
  const pet = S.getPet();
  if (pet) { const sub = $("[data-pet-sub]"); if (sub) sub.textContent = `${pet.name}의 진료 기록을 모아봤어요.`; }

  renderAll();
})();
