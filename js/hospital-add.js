/* ============================================================
   PetCare+ · 병원 기록 추가/수정 (hospital-add.html)
   ============================================================ */
(function () {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const S = window.PetStore;
  const toast = (m, i) => (window.toast ? window.toast(m, i) : null);

  /* ── URL 파라미터 ── */
  const params = new URLSearchParams(location.search);
  const editId = params.get("edit");
  const draftId = params.get("draft");
  const isEdit = !!editId;

  /* ── 첨부 자료 임시 목록 ── */
  let attachments = []; // [{id, title, kind, date, memo, name, url, type}]
  let pendingFile = null; // 모달에서 처리 중인 File 객체
  let pendingEditIdx = null; // 수정 중인 첨부 자료 인덱스

  /* ── 페이지 초기화 ── */
  function init() {
    // 날짜 기본값 = 오늘
    const dateInput = $("#f-date");
    if (dateInput && !dateInput.value) {
      dateInput.value = S.TODAY;
      if (window.PetPicker) window.PetPicker.bind(dateInput);
    }

    if (isEdit) {
      // 수정 모드: 기존 데이터 채우기
      const h = S.getHospital(editId);
      if (h) loadForm(h);
      $("#page-title").textContent = "병원 기록 수정";
      $("#btn-save").textContent = "수정 완료";
    } else if (draftId) {
      // 임시 저장 이어쓰기
      const draft = S.getDraft && S.getDraft();
      if (draft && draft.id === draftId) loadForm(draft);
    }
  }

  function loadForm(h) {
    if (h.date) { const el = $("#f-date"); if (el) { el.value = h.date; if (el._pkTrigger) window.PetPicker?.updateTrigger?.(el, el._pkTrigger); } }
    if (h.time) { const el = $("#f-time"); if (el) { el.value = h.time; if (el._pkTrigger) window.PetPicker?.updateTrigger?.(el, el._pkTrigger); } }
    val("#f-hospital", h.hospital_name);
    val("#f-doctor", h.doctor_name);
    val("#f-content", h.content);
    val("#f-vet-notes", h.vet_notes);
    val("#f-diagnosis", h.diagnosis);
    val("#f-rx", (h.prescriptions || []).join("\n"));
    val("#f-next-date", h.next_visit_date);
    val("#f-next-time", h.next_visit_time);
    val("#f-next-memo", h.next_visit_memo);
    val("#f-memo", h.memo);

    // 방문 목적 칩
    if (h.purpose) {
      const chip = document.querySelector(`[data-val="${CSS.escape(h.purpose)}"]`);
      if (chip) setChip(chip, "#purpose-chips");
      else {
        const other = document.querySelector('[data-val="기타"]');
        if (other) { setChip(other, "#purpose-chips"); $("#f-purpose-other").classList.add("show"); $("#f-purpose-other").value = h.purpose; }
      }
    }

    // 첨부 자료
    attachments = (h.attachments || []).map((a, i) => ({ ...a, id: a.id || `at_${i}` }));
    renderAttachments();
    updateClearTimeButton();
  }

  function val(sel, v) { const el = $(sel); if (el && v != null) el.value = v; }

  /* ── 방문 목적 칩 ── */
  document.getElementById("purpose-chips")?.addEventListener("click", (e) => {
    const chip = e.target.closest(".hosp-chip"); if (!chip) return;
    setChip(chip, "#purpose-chips");
    const isOther = chip.dataset.val === "기타";
    const other = $("#f-purpose-other");
    other.classList.toggle("show", isOther);
    if (!isOther) other.value = "";
  });

  document.getElementById("attach-kind-chips")?.addEventListener("click", (e) => {
    const chip = e.target.closest(".hosp-chip"); if (!chip) return;
    setChip(chip, "#attach-kind-chips");
  });

  function setChip(chip, groupSel) {
    document.querySelectorAll(`${groupSel} .hosp-chip`).forEach(c => c.classList.remove("active"));
    chip.classList.add("active");
  }

  function getActiveChip(groupSel) {
    return document.querySelector(`${groupSel} .hosp-chip.active`)?.dataset.val || "";
  }

  function updateClearTimeButton() {
    const v = document.getElementById("f-time")?.value;
    document.getElementById("btn-clear-time")?.classList.toggle("show", !!v);
  }

  /* ── 시간 지우기 ── */
  document.getElementById("btn-clear-time")?.addEventListener("click", () => {
    const el = $("#f-time"); if (el) { el.value = ""; if (el._pkTrigger) el._pkTrigger.querySelector(".pk-val").textContent = "시간을 선택하세요"; }
    updateClearTimeButton();
  });

  // f-time 변경 시 지우기 버튼 표시
  document.getElementById("f-time")?.addEventListener("change", updateClearTimeButton);

  /* ── 첨부 자료 렌더링 ── */
  function renderAttachments() {
    const host = $("#attachment-list"); if (!host) return;
    if (!attachments.length) { host.innerHTML = ""; return; }
    const kindIcon = { "혈액검사": "science", "소변검사": "water_drop", "엑스레이": "radiology", "초음파": "radiology",
      "처방전": "description", "영수증": "receipt_long", "진료 안내문": "info", "기타": "attach_file" };
    host.innerHTML = attachments.map((a, i) => {
      const isImg = (a.type && a.type.startsWith("image/")) || (a.url && a.url.startsWith("data:image/")) || /\.(png|jpe?g|gif|webp)$/i.test(a.name || "");
      const icon = isImg ? "photo" : (kindIcon[a.kind] || "attach_file");
      return `<div class="hosp-attach-card">
        <div class="hosp-attach-icon${isImg ? " img" : ""}"><span class="material-symbols-rounded">${icon}</span></div>
        <div class="hosp-attach-info">
          <div class="hosp-attach-title">${esc(a.title)}</div>
          <div class="hosp-attach-meta">${esc(a.kind || "")}${a.date ? " · " + a.date.replace(/-/g, ".") : ""}</div>
          ${a.memo ? `<div style="font-size:11px;color:var(--color-text-light);margin-top:2px">${esc(a.memo)}</div>` : ""}
        </div>
        <div class="hosp-attach-actions">
          ${a.url ? `<button class="hosp-icon-btn" data-at-preview="${i}" aria-label="보기"><span class="material-symbols-rounded">visibility</span></button>` : ""}
          <button class="hosp-icon-btn" data-at-edit="${i}" aria-label="정보 수정"><span class="material-symbols-rounded">edit</span></button>
          <button class="hosp-icon-btn danger" data-at-del="${i}" aria-label="삭제"><span class="material-symbols-rounded">delete</span></button>
        </div>
      </div>`;
    }).join("");
  }

  /* ── 파일 첨부 플로우 ── */
  const attachInput = $("#attach-input");
  document.getElementById("btn-attach")?.addEventListener("click", () => {
    pendingEditIdx = null; attachInput.value = ""; attachInput.click();
  });

  attachInput?.addEventListener("change", async () => {
    const file = attachInput.files && attachInput.files[0]; if (!file) return;
    // 용량 체크 (5MB)
    if (file.size > 5 * 1024 * 1024) { toast("파일 용량이 너무 커요. 5MB 이하 파일을 선택해 주세요.", "info"); return; }
    pendingFile = file;
    // 자료 정보 모달 열기
    $("#at-title").value = "";
    document.querySelectorAll("#attach-kind-chips .hosp-chip").forEach(c => c.classList.remove("active"));
    $("#at-date").value = "";
    if ($("#at-date")._pkTrigger) $("#at-date")._pkTrigger.querySelector(".pk-val").textContent = "날짜를 선택하세요";
    $("#at-memo").value = "";
    $("#attach-sheet-title").textContent = "첨부 자료 정보";
    $("#at-save").textContent = "첨부 완료";
    $("#attach-sheet").classList.add("show");
    setTimeout(() => $("#at-title").focus(), 150);
  });

  // 모달 취소
  document.getElementById("at-cancel")?.addEventListener("click", () => {
    pendingFile = null; pendingEditIdx = null;
    $("#attach-sheet").classList.remove("show");
  });

  // 모달 저장
  document.getElementById("at-save")?.addEventListener("click", async () => {
    const title = $("#at-title").value.trim();
    if (!title) { toast("자료 제목을 입력해 주세요", "info"); $("#at-title").focus(); return; }
    const kind = getActiveChip("#attach-kind-chips");
    if (!kind) { toast("자료 종류를 선택해 주세요", "info"); return; }

    if (pendingEditIdx !== null) {
      // 정보 수정만
      attachments[pendingEditIdx] = { ...attachments[pendingEditIdx], title, kind,
        date: $("#at-date").value || "", memo: $("#at-memo").value.trim() };
    } else {
      // 새 파일
      const dataUrl = pendingFile ? await readFileAsDataURL(pendingFile) : null;
      attachments.push({ id: `at_${Date.now()}`, title, kind,
        date: $("#at-date").value || "", memo: $("#at-memo").value.trim(),
        name: pendingFile?.name || "", url: dataUrl || "", type: pendingFile?.type || "" });
    }
    pendingFile = null; pendingEditIdx = null;
    renderAttachments();
    $("#attach-sheet").classList.remove("show");
    toast(pendingEditIdx !== null ? "자료 정보를 수정했어요" : "자료를 첨부했어요", "upload_file");
  });

  /* ── 첨부 자료 카드 이벤트 ── */
  document.getElementById("attachment-list")?.addEventListener("click", (e) => {
    const previewBtn = e.target.closest("[data-at-preview]");
    if (previewBtn) {
      const a = attachments[parseInt(previewBtn.dataset.atPreview, 10)];
      if (!a || !a.url) return;
      const isImg = (a.type && a.type.startsWith("image/")) || a.url.startsWith("data:image/") || /\.(png|jpe?g|gif|webp)$/i.test(a.name || "");
      if (isImg) { $("#img-preview-img").src = a.url; $("#img-preview-modal").style.display = "flex"; }
      else { const link = document.createElement("a"); link.href = a.url; link.download = a.name; link.click(); }
      return;
    }
    const editBtn = e.target.closest("[data-at-edit]");
    if (editBtn) {
      pendingEditIdx = parseInt(editBtn.dataset.atEdit, 10);
      const a = attachments[pendingEditIdx];
      $("#at-title").value = a.title || "";
      document.querySelectorAll("#attach-kind-chips .hosp-chip").forEach(c => c.classList.toggle("active", c.dataset.val === a.kind));
      $("#at-date").value = a.date || "";
      $("#at-memo").value = a.memo || "";
      $("#attach-sheet-title").textContent = "자료 정보 수정";
      $("#at-save").textContent = "수정 완료";
      $("#attach-sheet").classList.add("show");
      return;
    }
    const delBtn = e.target.closest("[data-at-del]");
    if (delBtn) {
      const idx = parseInt(delBtn.dataset.atDel, 10);
      const title = attachments[idx]?.title || "이 자료";
      if (!confirm(`'${title}' 파일을 삭제할까요?`)) return;
      attachments.splice(idx, 1);
      renderAttachments();
      toast("첨부 자료를 삭제했어요", "delete");
    }
  });

  /* ── 저장 ── */
  document.getElementById("btn-save")?.addEventListener("click", save);

  async function save() {
    const date = $("#f-date").value;
    const hospital = $("#f-hospital").value.trim();
    let purpose = getActiveChip("#purpose-chips");
    if (purpose === "기타") purpose = $("#f-purpose-other").value.trim() || "기타";

    // 유효성
    if (!date) { toast("방문 날짜를 선택해 주세요", "info"); return; }
    if (!hospital) { toast("병원명을 입력해 주세요", "info"); $("#f-hospital").focus(); return; }
    if (!purpose) { toast("방문 목적을 선택해 주세요", "info"); return; }

    const prescriptions = ($("#f-rx").value || "").split("\n").map(s => s.trim()).filter(Boolean);

    const data = {
      date, time: $("#f-time").value || "",
      hospital_name: hospital,
      doctor_name: $("#f-doctor").value.trim(),
      purpose,
      content: $("#f-content").value.trim(),
      vet_notes: $("#f-vet-notes").value.trim(),
      diagnosis: $("#f-diagnosis").value.trim(),
      prescriptions,
      attachments,
      next_visit_date: $("#f-next-date").value || "",
      next_visit_time: $("#f-next-time").value || "",
      next_visit_memo: $("#f-next-memo").value.trim(),
      memo: $("#f-memo").value.trim(),
      draft: false,
    };

    const saveBtn = $("#btn-save");
    saveBtn.disabled = true; saveBtn.textContent = "저장 중...";

    if (isEdit) {
      // 수정 모드: files도 유지
      const existing = S.getHospital(editId);
      S.updateHospital(editId, { ...data, files: existing?.files || [] });
      // 다음 진료일 갱신
      if (data.next_visit_date) S.savePet({ next_visit: data.next_visit_date });
      toast("병원 기록을 수정했어요");
      // 처방으로 복약 루틴
      if ($("#f-make-routine").checked && prescriptions.length) prescriptions.forEach(makeMedRoutine);
      location.replace(`hospital-detail.html?id=${editId}&saved=1`);
    } else {
      // 신규
      if (S.getDraft && S.getDraft()) S.clearDraft();
      const h = S.addHospital(data);
      if (data.next_visit_date) S.savePet({ next_visit: data.next_visit_date });
      if ($("#f-make-routine").checked && prescriptions.length) prescriptions.forEach(makeMedRoutine);
      toast("병원 기록을 저장했어요");
      location.replace(`hospital-detail.html?id=${h.id}&saved=1`);
    }
  }

  /* ── 임시 저장 ── */
  document.getElementById("btn-draft")?.addEventListener("click", () => {
    const data = collectForm();
    data.draft = true;
    if (draftId) data.id = draftId;
    S.saveDraft && S.saveDraft(data);
    toast("임시 저장했어요", "save");
  });

  function collectForm() {
    let purpose = getActiveChip("#purpose-chips");
    if (purpose === "기타") purpose = $("#f-purpose-other").value.trim() || "기타";
    return {
      date: $("#f-date").value || S.TODAY,
      time: $("#f-time").value || "",
      hospital_name: $("#f-hospital").value.trim(),
      doctor_name: $("#f-doctor").value.trim(),
      purpose,
      content: $("#f-content").value.trim(),
      vet_notes: $("#f-vet-notes").value.trim(),
      diagnosis: $("#f-diagnosis").value.trim(),
      prescriptions: ($("#f-rx").value || "").split("\n").map(s => s.trim()).filter(Boolean),
      attachments: [...attachments],
      next_visit_date: $("#f-next-date").value || "",
      next_visit_time: $("#f-next-time").value || "",
      next_visit_memo: $("#f-next-memo").value.trim(),
      memo: $("#f-memo").value.trim(),
    };
  }

  /* ── 취소 / 뒤로 ── */
  document.getElementById("btn-cancel")?.addEventListener("click", goBack);
  document.getElementById("btn-back")?.addEventListener("click", goBack);

  function goBack() {
    if (confirm("작성 중인 내용을 나갈까요?\n저장하지 않은 내용은 사라질 수 있어요.")) {
      history.length > 1 ? history.back() : (location.href = "hospital.html");
    }
  }

  /* ── 시트 오버레이 닫기 ── */
  document.addEventListener("click", (e) => {
    const ov = e.target.closest(".sheet-overlay");
    if (ov && e.target === ov) ov.classList.remove("show");
  });

  /* ── 유틸 ── */
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

  // 피커 바인딩 후 초기화
  document.addEventListener("DOMContentLoaded", () => {
    if (window.PetPicker) window.PetPicker.bindAll();
    init();
  });
  if (document.readyState !== "loading") { if (window.PetPicker) window.PetPicker.bindAll(); init(); }
})();
