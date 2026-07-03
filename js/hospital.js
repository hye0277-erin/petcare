/* ============================================================
   PetCare+ · 병원 기록 메인 (hospital.html)
   ============================================================ */
(function () {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const S = window.PetStore;
  const toast = (m, i) => (window.toast ? window.toast(m, i) : null);
  const dot = (iso) => (iso || "").replace(/-/g, ".");
  const DOW = ["일", "월", "화", "수", "목", "금", "토"];
  function dowOf(iso) { const d = new Date(iso); return isNaN(d) ? "" : DOW[d.getDay()]; }

  const PURPOSE_COLOR = {
    "정기검진": "t-weight", "재검": "t-temp", "증상 진료": "t-symptom",
    "처방 상담": "t-med", "예방접종": "t-water", "응급진료": "t-symptom",
    "정기 진료": "t-weight", "검사": "t-temp", "응급": "t-symptom", "기타": "t-memo",
  };

  /* ── 이미지 판별 ── */
  function isImage(f) {
    return (f.type && f.type.startsWith("image/")) ||
           (f.url && f.url.startsWith("data:image/")) ||
           /\.(png|jpe?g|gif|webp)$/i.test(f.name || "");
  }

  /* ── 이미지 미리보기 ── */
  function previewImage(f) {
    const modal = $("#img-preview-modal");
    $("#img-preview-img").src = f.url;
    const dlBtn = $("#img-preview-dl");
    if (dlBtn) { dlBtn.onclick = () => { const a = document.createElement("a"); a.href = f.url; a.download = f.name; a.click(); }; }
    modal.style.display = "flex"; modal.style.flexDirection = "column";
  }

  /* ── 임시 저장 카드 ── */
  function renderDraft() {
    const host = $("#draft-card"); if (!host) return;
    const draft = S.getDraft && S.getDraft();
    if (!draft) { host.classList.remove("show"); return; }
    host.classList.add("show");
    host.innerHTML = `<div class="hosp-draft-card">
      <span class="material-symbols-rounded hosp-draft-ic">edit_note</span>
      <div class="hosp-draft-body">
        <div class="hosp-draft-title">작성 중인 병원 기록</div>
        <div class="hosp-draft-meta">${draft.hospital_name ? esc(draft.hospital_name) : "병원 미입력"} · ${dot(draft.date) || "날짜 미입력"}</div>
      </div>
      <div class="hosp-draft-actions">
        <button class="btn btn-ghost hosp-draft-cont-btn" id="btn-draft-continue">계속 작성</button>
        <button class="hosp-icon-btn danger" id="btn-draft-del" aria-label="임시저장 삭제"><span class="material-symbols-rounded">delete</span></button>
      </div>
    </div>`;
  }

  /* ── 다음 진료 카드 ── */
  function renderNextVisit() {
    const host = $("#next-visit-card"); if (!host) return;
    const nv = S.nextVisitDday();
    if (!nv) {
      host.innerHTML = `<div class="hosp-next-card" style="text-align:center">
        <div style="font-size:13px;opacity:.75;margin-bottom:10px">예정된 다음 진료가 없어요.</div>
        <a href="hospital-add.html" class="btn" style="background:rgba(255,255,255,.2);color:#fff;font-size:13px;padding:9px 20px;border-radius:10px;display:inline-flex;align-items:center;gap:6px"><span class="material-symbols-rounded" style="font-size:16px">add</span>병원 기록 추가</a>
      </div>`;
      return;
    }
    const dd = nv.dday === 0 ? "D-DAY" : `D-${nv.dday}`;
    const iso = `${nv.date.getFullYear()}-${String(nv.date.getMonth()+1).padStart(2,"0")}-${String(nv.date.getDate()).padStart(2,"0")}`;
    const info = S.getHospitals().find((h) => h.next_visit_date === iso) || S.getHospitals()[0];
    host.innerHTML = `<div class="hosp-next-card">
      <div style="font-size:11px;opacity:.65;display:flex;align-items:center;justify-content:space-between">
        <span>다음 진료까지</span>
        <a href="${info ? `hospital-add.html?edit=${esc(info.id)}&from=next` : "hospital-add.html"}" style="font-size:11px;font-weight:600;color:rgba(255,255,255,.8);background:rgba(255,255,255,.15);border-radius:99px;padding:3px 10px;text-decoration:none">일정 수정</a>
      </div>
      <div class="hosp-dday">${dd}</div>
      ${info ? `<div class="hosp-next-info">
        <div class="hosp-next-hospital-ic"><span class="material-symbols-rounded">local_hospital</span></div>
        <div>
          <div style="font-size:14px;font-weight:700">${esc(info.hospital_name || "병원")}</div>
          <div style="font-size:11px;opacity:.65;margin-top:2px">${dot(iso)} (${dowOf(iso)})${info.purpose ? " · " + esc(info.purpose) : ""}</div>
        </div>
      </div>` : ""}
    </div>`;
  }

  /* ── 방문 기록 목록 ── */
  function renderVisits(filterText = "") {
    const host = $("#visit-list"); if (!host) return;
    let list = S.getHospitals().filter((h) => !h.draft);
    if (filterText) {
      const q = filterText.toLowerCase();
      list = list.filter((h) =>
        (h.hospital_name || "").toLowerCase().includes(q) ||
        (h.purpose || "").toLowerCase().includes(q) ||
        (h.content || "").toLowerCase().includes(q) ||
        (h.doctor_name || "").toLowerCase().includes(q) ||
        (h.memo || "").toLowerCase().includes(q)
      );
    }
    if (!list.length) {
      host.innerHTML = `<div class="hosp-empty"><span class="hosp-empty-icon">local_hospital</span>${filterText ? "검색 결과가 없어요." : "아직 등록된 병원 방문 기록이 없어요."}</div>`;
      return;
    }
    host.innerHTML = list.map((h) => {
      const receipt = (h.files || []).concat(h.attachments || []).find(f => f.url);
      const attCount = (h.attachments || []).length;
      const rxCount = (h.prescriptions || []).length;
      const colorClass = PURPOSE_COLOR[h.purpose] || "t-weight";
      return `<div class="hosp-visit-card" data-visit-id="${esc(h.id)}">
        <div class="hosp-visit-header">
          <div class="hosp-visit-icon ${colorClass}"><span class="material-symbols-rounded">local_hospital</span></div>
          <div class="hosp-visit-body">
            <div class="hosp-visit-name">${esc(h.hospital_name || "병원")}</div>
            <div class="hosp-visit-meta">${dot(h.date)} (${dowOf(h.date)})${h.doctor_name ? " · " + esc(h.doctor_name) : ""}</div>
            ${h.content ? `<div class="hosp-visit-content">${esc(h.content)}</div>` : ""}
          </div>
          <div style="display:flex;flex-direction:column;gap:2px;flex-shrink:0">
            <button class="hosp-icon-btn" data-edit-id="${esc(h.id)}" aria-label="수정"><span class="material-symbols-rounded">edit</span></button>
            <button class="hosp-icon-btn danger" data-del-id="${esc(h.id)}" aria-label="삭제"><span class="material-symbols-rounded">delete</span></button>
          </div>
        </div>
        <div class="hosp-visit-footer">
          <div class="hosp-visit-tags">
            ${h.purpose ? `<span class="hosp-tag">${esc(h.purpose)}</span>` : ""}
            ${attCount ? `<span class="hosp-tag blue">자료 ${attCount}개</span>` : ""}
            ${rxCount ? `<span class="hosp-tag orange">처방 ${rxCount}건</span>` : ""}
            ${h.next_visit_date ? `<span class="hosp-tag">다음 진료 D-${Math.max(0, Math.round((new Date(h.next_visit_date) - new Date(S.TODAY)) / 86400000))}</span>` : ""}
          </div>
          ${receipt ? `<button class="hosp-icon-btn" data-receipt-id="${esc(h.id)}" aria-label="영수증 보기"><span class="material-symbols-rounded">receipt_long</span></button>` : ""}
        </div>
      </div>`;
    }).join("");
  }

  /* ── 검사 자료 목록 ── */
  function renderTests(filterText = "") {
    const host = $("#test-list"); if (!host) return;
    // 검사 자료: 기존 tests + 각 병원 기록의 attachments에서 검사 종류만
    let list = S.getTests();
    if (filterText) {
      const q = filterText.toLowerCase();
      list = list.filter((t) => (t.title || "").toLowerCase().includes(q) || (t.hospital_name || "").toLowerCase().includes(q));
    }
    if (!list.length) {
      host.innerHTML = `<div class="hosp-empty"><span class="hosp-empty-icon">lab_profile</span>${filterText ? "검색 결과가 없어요." : "첨부한 검사 자료가 없어요."}</div>`;
      return;
    }
    const kindIcon = { blood: "science", image: "radiology", urine: "water_drop" };
    host.innerHTML = list.map((t) => {
      const file = (t.files || [])[0];
      const icon = kindIcon[t.type] || "description";
      const isImg = file && isImage(file);
      return `<div class="hosp-test-card">
        <div class="hosp-test-header">
          <div class="hosp-test-icon${isImg ? " img" : ""}"><span class="material-symbols-rounded">${icon}</span></div>
          <div style="flex:1;min-width:0">
            <div class="hosp-test-title">${esc(t.title || (file ? file.name : ""))}</div>
            <div class="hosp-test-meta">${dot(t.date)}${t.hospital_name ? " · " + esc(t.hospital_name) : ""}</div>
          </div>
          <button class="hosp-icon-btn danger" data-test-del="${esc(t.id)}" aria-label="삭제"><span class="material-symbols-rounded">delete</span></button>
        </div>
        <div class="hosp-test-btns">
          <button class="btn btn-ghost" style="flex:1;padding:8px;font-size:12px" data-test-open="${esc(t.id)}"><span class="material-symbols-rounded" style="font-size:16px">visibility</span> 보기</button>
          <button class="btn btn-ghost" style="flex:1;padding:8px;font-size:12px" data-test-dl="${esc(t.id)}" ${!file || !file.url ? "disabled" : ""}><span class="material-symbols-rounded" style="font-size:16px">download</span> 다운로드</button>
        </div>
      </div>`;
    }).join("");
  }

  /* ── 처방 내역 ── */
  function renderRx() {
    const host = $("#rx-list"); if (!host) return;
    const seen = new Set(); const list = [];
    S.getHospitals().filter(h => !h.draft).forEach((h) =>
      (h.prescriptions || []).forEach((p, idx) => {
        if (!seen.has(p)) { seen.add(p); list.push({ text: p, hospitalId: h.id, idx }); }
      })
    );
    if (!list.length) {
      host.innerHTML = `<div class="hosp-empty"><span class="hosp-empty-icon">medication</span>등록된 처방 내역이 없어요.</div>`;
      return;
    }
    host.innerHTML = list.map(({ text: p, hospitalId, idx }) => {
      const [name, ...rest] = p.split(/\s+/);
      return `<div class="hosp-rx-card">
        <div class="hosp-rx-icon"><span class="material-symbols-rounded">medication</span></div>
        <div class="hosp-rx-body">
          <div class="hosp-rx-name">${esc(name)}</div>
          <div class="hosp-rx-desc">${esc(rest.join(" ") || "복용 정보 없음")}</div>
        </div>
        <div class="hosp-rx-actions">
          <button class="btn btn-ghost" style="padding:6px 10px;font-size:12px" data-rx="${esc(p)}"><span class="material-symbols-rounded" style="font-size:15px">add_alarm</span> 복약</button>
          <button class="hosp-icon-btn" data-rx-edit="${esc(p)}" data-rx-hospital="${esc(hospitalId)}" data-rx-idx="${idx}" aria-label="수정"><span class="material-symbols-rounded">edit</span></button>
          <button class="hosp-icon-btn danger" data-rx-del="${esc(p)}" data-rx-hospital="${esc(hospitalId)}" data-rx-idx="${idx}" aria-label="삭제"><span class="material-symbols-rounded">delete</span></button>
        </div>
      </div>`;
    }).join("");
  }

  /* ── 검사 결과 상세 시트 ── */
  function openTest(id) {
    const t = S.getTest(id); if (!t) return;
    $("#t-title").textContent = t.title || "검사 자료";
    const typeLabel = { blood: "혈액검사", image: "영상 검사", urine: "소변검사" }[t.type] || "기타";
    let html = `<div class="card" style="margin-top:0">`;
    [["검사명", t.title], ["검사 날짜", dot(t.date)], ["병원명", t.hospital_name], ["검사 종류", typeLabel]].forEach(([k, v]) => {
      if (v) html += `<div class="row"><div class="row-body"><div class="row-desc">${esc(k)}</div><div class="row-title">${esc(v)}</div></div></div>`;
    });
    html += `</div>`;
    if ((t.values || []).length) {
      html += `<div class="card-label">주요 수치</div><div class="card">` +
        t.values.map((v) => `<div class="row"><div class="row-body"><div class="row-title">${esc(v.name)}</div><div class="row-desc">${esc(v.value)}</div></div></div>`).join("") + `</div>`;
    }
    html += `<div class="card-label">첨부 파일</div><div class="card">`;
    if ((t.files || []).length) {
      html += t.files.map((f, i) => `
        <div class="row">
          <span class="row-ic t-temp"><span class="material-symbols-rounded">attach_file</span></span>
          <div class="row-body" style="min-width:0;overflow:hidden"><div class="row-title" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(f.name)}</div></div>
          <span style="display:flex;gap:4px">
            ${f.url ? `<button class="icon-btn" data-test-preview="${i}" aria-label="보기"><span class="material-symbols-rounded">visibility</span></button>
              <button class="icon-btn" data-test-file-dl="${i}" aria-label="다운로드"><span class="material-symbols-rounded">download</span></button>` :
              `<button class="icon-btn" disabled aria-label="미리보기"><span class="material-symbols-rounded">visibility</span></button>`}
            <button class="icon-btn" data-test-file-replace="${i}" style="color:var(--color-primary)" aria-label="교체"><span class="material-symbols-rounded">upload_file</span></button>
            <button class="icon-btn" data-test-file-del="${i}" style="color:#ef4444" aria-label="삭제"><span class="material-symbols-rounded">delete</span></button>
          </span>
        </div>`).join("");
    } else {
      html += `<div class="row" style="flex-direction:column;gap:8px">
        <div class="row-body"><div class="row-desc">첨부 파일이 없어요.</div></div>
        <button class="btn btn-ghost" data-test-file-add style="font-size:12px;padding:8px"><span class="material-symbols-rounded" style="font-size:16px">upload_file</span> 파일 첨부하기</button>
      </div>`;
    }
    html += `</div>`;
    if (t.memo) html += `<div class="card-label">메모</div><div class="card"><div class="row"><div class="row-body"><div class="row-desc">${esc(t.memo)}</div></div></div></div>`;
    $("#t-body").innerHTML = html;
    $("#test-sheet").dataset.testId = id;
    $("#test-sheet").classList.add("show");
  }

  function readFileAsDataURL(file) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    });
  }

  function makeMedRoutine(p) {
    const [name, ...rest] = p.split(/\s+/);
    S.addRoutine({ type: "med", title: name || "복약", description: rest.join(" "),
      repeat_type: "daily", days_of_week: [], times: ["08:00"],
      alarm_enabled: true, alarm_before_minutes: 10, active: true });
  }

  function renderAll(filter = "") {
    renderDraft();
    renderNextVisit();
    renderVisits(filter);
    renderTests(filter);
    renderRx();
  }

  /* ── 검색 ── */
  let searchOpen = false;
  function toggleSearch(open) {
    searchOpen = open;
    const bar = $("#search-bar");
    bar.classList.toggle("open", open);
    if (open) { $("#search-input").focus(); renderAll(""); }
    else { $("#search-input").value = ""; renderAll(""); }
  }

  /* ── 이벤트 ── */
  document.addEventListener("click", async (e) => {

    // 검색
    if (e.target.closest("#btn-search")) { toggleSearch(!searchOpen); return; }
    if (e.target.closest("#btn-search-close")) { toggleSearch(false); return; }

    // 병원 기록 추가
    if (e.target.closest("#btn-add") || e.target.closest("#btn-add-bottom")) {
      location.href = "hospital-add.html"; return;
    }

    // 임시 저장 계속 작성
    if (e.target.closest("#btn-draft-continue")) {
      const draft = S.getDraft && S.getDraft();
      if (draft) location.href = `hospital-add.html?draft=${draft.id}`;
      return;
    }
    // 임시 저장 삭제
    if (e.target.closest("#btn-draft-del")) {
      if (!confirm("임시 저장된 기록을 삭제할까요?")) return;
      S.clearDraft && S.clearDraft();
      renderDraft(); return;
    }

    // 방문 기록 카드 클릭 → 상세
    const visitCard = e.target.closest(".hosp-visit-card");
    if (visitCard && !e.target.closest("[data-edit-id]") && !e.target.closest("[data-del-id]") && !e.target.closest("[data-receipt-id]")) {
      location.href = `hospital-detail.html?id=${visitCard.dataset.visitId}`; return;
    }

    // 방문 기록 수정
    const editBtn = e.target.closest("[data-edit-id]");
    if (editBtn) { location.href = `hospital-add.html?edit=${editBtn.dataset.editId}`; return; }

    // 방문 기록 삭제
    const delBtn = e.target.closest("[data-del-id]");
    if (delBtn) {
      if (!confirm("이 병원 기록을 삭제할까요?")) return;
      const hospitals = S.getHospitals().filter((x) => x.id !== delBtn.dataset.delId);
      localStorage.setItem("petcare_hospitals", JSON.stringify(hospitals));
      renderAll(); toast("기록을 삭제했어요", "delete"); return;
    }

    // 영수증 보기
    const receiptBtn = e.target.closest("[data-receipt-id]");
    if (receiptBtn) {
      const h = S.getHospitals().find((x) => x.id === receiptBtn.dataset.receiptId);
      const f = (h && ((h.files || []).concat(h.attachments || [])).find(f => f.url));
      if (f) { isImage(f) ? previewImage(f) : (() => { const a = document.createElement("a"); a.href = f.url; a.download = f.name; a.click(); })(); }
      return;
    }

    // 검사 자료 보기
    const testOpen = e.target.closest("[data-test-open]");
    if (testOpen) { openTest(testOpen.dataset.testOpen); return; }

    // 검사 자료 다운로드 (목록)
    const testDl = e.target.closest("[data-test-dl]");
    if (testDl) {
      const t = S.getTest(testDl.dataset.testDl);
      const f = t && (t.files || [])[0];
      if (f && f.url) { const a = document.createElement("a"); a.href = f.url; a.download = f.name; a.click(); }
      return;
    }

    // 검사 자료 삭제 (목록)
    const testDelBtn = e.target.closest("[data-test-del]");
    if (testDelBtn) {
      if (!confirm("이 검사 기록을 삭제할까요?")) return;
      S.removeTest(testDelBtn.dataset.testDel);
      renderAll(); toast("검사 기록을 삭제했어요", "delete"); return;
    }

    // ── 검사 결과 시트 내부 ──
    // 파일 보기 (시트)
    const previewBtn = e.target.closest("[data-test-preview]");
    if (previewBtn) {
      const t = S.getTest($("#test-sheet").dataset.testId);
      const f = t && (t.files || [])[parseInt(previewBtn.dataset.testPreview, 10)];
      if (f && f.url) { isImage(f) ? previewImage(f) : (() => { const a = document.createElement("a"); a.href = f.url; a.download = f.name; a.click(); })(); }
      else toast("파일을 불러올 수 없어요", "info");
      return;
    }
    // 파일 다운로드 (시트)
    const fileDlBtn = e.target.closest("[data-test-file-dl]");
    if (fileDlBtn) {
      const t = S.getTest($("#test-sheet").dataset.testId);
      const f = t && (t.files || [])[parseInt(fileDlBtn.dataset.testFileDl, 10)];
      if (f && f.url) { const a = document.createElement("a"); a.href = f.url; a.download = f.name; a.click(); }
      return;
    }
    // 파일 삭제 (시트)
    const fileDelBtn = e.target.closest("[data-test-file-del]");
    if (fileDelBtn) {
      if (!confirm("이 파일을 삭제할까요?")) return;
      const testId = $("#test-sheet").dataset.testId;
      const tests = S.getTests();
      const ti = tests.findIndex((x) => x.id === testId);
      if (ti !== -1) {
        tests[ti].files = (tests[ti].files || []).filter((_, i) => i !== parseInt(fileDelBtn.dataset.testFileDel, 10));
        localStorage.setItem("petcare_test_results", JSON.stringify(tests));
        toast("파일을 삭제했어요", "delete"); openTest(testId);
      }
      return;
    }
    // 파일 교체 (시트)
    const fileReplaceBtn = e.target.closest("[data-test-file-replace]");
    if (fileReplaceBtn) {
      const inp = $("#test-file-replace-input");
      inp.dataset.replaceTestId = $("#test-sheet").dataset.testId;
      inp.dataset.replaceIdx = fileReplaceBtn.dataset.testFileReplace;
      inp.dataset.replaceMode = "replace";
      inp.value = ""; inp.click(); return;
    }
    // 파일 추가 (시트)
    if (e.target.closest("[data-test-file-add]")) {
      const inp = $("#test-file-replace-input");
      inp.dataset.replaceTestId = $("#test-sheet").dataset.testId;
      inp.dataset.replaceMode = "add";
      inp.value = ""; inp.click(); return;
    }
    // 시트 내 기록 삭제
    if (e.target.closest("#t-delete")) {
      const testId = $("#test-sheet").dataset.testId;
      if (!testId || !confirm("이 검사 기록을 삭제할까요?")) return;
      S.removeTest(testId);
      document.querySelectorAll(".sheet-overlay").forEach(o => o.classList.remove("show"));
      renderAll(); toast("검사 기록을 삭제했어요", "delete"); return;
    }
    // 공유
    if (e.target.closest("#t-share")) {
      const t = S.getTest($("#test-sheet").dataset.testId); if (!t) return;
      const text = `[${S.getPet()?.name || "반려견"} 검사 결과]\n검사명: ${t.title}\n날짜: ${dot(t.date)}\n병원: ${t.hospital_name}\n` +
        (t.values || []).map((v) => `- ${v.name}: ${v.value}`).join("\n");
      if (navigator.share) navigator.share({ title: t.title, text }).catch(() => {});
      else if (navigator.clipboard) navigator.clipboard.writeText(text).then(() => toast("요약 텍스트를 복사했어요", "content_copy")).catch(() => {});
      return;
    }

    // 복약
    const rxBtn = e.target.closest("[data-rx]:not([data-rx-edit]):not([data-rx-del])");
    if (rxBtn) { makeMedRoutine(rxBtn.dataset.rx); toast("복약 일정으로 추가했어요", "add_alarm"); return; }

    // 처방 수정
    const rxEditBtn = e.target.closest("[data-rx-edit]");
    if (rxEditBtn) {
      const { rxEdit, rxHospital, rxIdx } = rxEditBtn.dataset;
      $("#rx-edit-input").value = rxEdit;
      const sheet = $("#rx-sheet");
      sheet.dataset.rxHospital = rxHospital;
      sheet.dataset.rxIdx = rxIdx;
      sheet.classList.add("show");
      setTimeout(() => $("#rx-edit-input").focus(), 100);
      return;
    }
    // 처방 삭제
    const rxDelBtn = e.target.closest("[data-rx-del]");
    if (rxDelBtn) {
      if (!confirm("이 처방을 삭제할까요?")) return;
      const hospitals = S.getHospitals();
      const hi = hospitals.findIndex((x) => x.id === rxDelBtn.dataset.rxHospital);
      if (hi !== -1) {
        hospitals[hi].prescriptions = (hospitals[hi].prescriptions || []).filter((_, i) => i !== parseInt(rxDelBtn.dataset.rxIdx, 10));
        localStorage.setItem("petcare_hospitals", JSON.stringify(hospitals));
        renderAll(); toast("처방을 삭제했어요", "delete");
      }
      return;
    }
    // 처방 수정 저장
    if (e.target.closest("#rx-edit-save")) {
      const newText = $("#rx-edit-input").value.trim();
      if (!newText) { toast("처방 내용을 입력해 주세요", "info"); return; }
      const sheet = $("#rx-sheet");
      const hospitals = S.getHospitals();
      const hi = hospitals.findIndex((x) => x.id === sheet.dataset.rxHospital);
      if (hi !== -1) {
        hospitals[hi].prescriptions[parseInt(sheet.dataset.rxIdx, 10)] = newText;
        localStorage.setItem("petcare_hospitals", JSON.stringify(hospitals));
        sheet.classList.remove("show"); renderAll(); toast("처방을 수정했어요");
      }
      return;
    }
    if (e.target.closest("#rx-edit-cancel")) { $("#rx-sheet").classList.remove("show"); return; }

    // 오버레이 닫기
    const ov = e.target.closest(".sheet-overlay");
    if (ov && e.target === ov) ov.classList.remove("show");
    if (e.target.closest("[data-h-close]")) {
      document.querySelectorAll(".sheet-overlay").forEach(o => o.classList.remove("show"));
    }
  });

  // 검색 입력
  const searchInput = $("#search-input");
  if (searchInput) {
    searchInput.addEventListener("input", () => renderAll(searchInput.value.trim()));
  }

  // 파일 교체 input change
  const replaceInput = $("#test-file-replace-input");
  if (replaceInput) {
    replaceInput.addEventListener("change", async () => {
      const file = replaceInput.files && replaceInput.files[0]; if (!file) return;
      const testId = replaceInput.dataset.replaceTestId;
      const mode = replaceInput.dataset.replaceMode;
      const dataUrl = await readFileAsDataURL(file);
      if (!dataUrl) { toast("파일을 읽을 수 없어요", "info"); return; }
      const tests = S.getTests();
      const ti = tests.findIndex((x) => x.id === testId); if (ti === -1) return;
      if (mode === "replace") {
        const idx = parseInt(replaceInput.dataset.replaceIdx, 10);
        tests[ti].files[idx] = { name: file.name, url: dataUrl, type: file.type };
        toast("파일을 교체했어요", "upload_file");
      } else {
        tests[ti].files = [...(tests[ti].files || []), { name: file.name, url: dataUrl, type: file.type }];
        toast("파일을 추가했어요", "upload_file");
      }
      localStorage.setItem("petcare_test_results", JSON.stringify(tests));
      openTest(testId);
    });
  }

  // 반려견 이름 반영
  const pet = S.getPet();
  if (pet) { const sub = $("[data-pet-sub]"); if (sub) sub.textContent = `${pet.name}의 진료 기록을 모아봤어요.`; }

  renderAll();
})();
