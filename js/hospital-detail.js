/* ============================================================
   PetCare+ · 병원 기록 상세 (hospital-detail.html)
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

  const params = new URLSearchParams(location.search);
  const id = params.get("id");

  function isImage(f) {
    return (f.type && f.type.startsWith("image/")) ||
           (f.url && f.url.startsWith("data:image/")) ||
           /\.(png|jpe?g|gif|webp)$/i.test(f.name || "");
  }

  function previewImage(f) {
    const modal = $("#img-preview-modal");
    $("#img-preview-img").src = f.url;
    const dlBtn = $("#img-preview-dl");
    if (dlBtn) { dlBtn.onclick = () => { const a = document.createElement("a"); a.href = f.url; a.download = f.name; a.click(); }; }
    modal.style.display = "flex";
  }

  function openFile(f) {
    if (!f || !f.url) { toast("파일을 불러올 수 없어요", "info"); return; }
    if (isImage(f)) previewImage(f);
    else { const a = document.createElement("a"); a.href = f.url; a.download = f.name; a.click(); }
  }

  /* ── 상세 렌더링 ── */
  function render() {
    const h = S.getHospital(id);
    if (!h) {
      $("#detail-body").innerHTML = `<div style="text-align:center;padding:60px 20px;color:var(--color-text-light)">기록을 찾을 수 없어요.</div>`;
      return;
    }

    const dday = h.next_visit_date ? Math.round((new Date(h.next_visit_date) - new Date(S.TODAY)) / 86400000) : null;

    let html = `
    <!-- 요약 카드 -->
    <div style="padding:12px 0 0">
      <div class="detail-summary-card">
        <div style="font-size:11px;opacity:.65;margin-bottom:4px">${dot(h.date)} (${dowOf(h.date)})${h.time ? " · " + h.time : ""}</div>
        <div style="font-size:20px;font-weight:800;margin-bottom:6px">${esc(h.hospital_name || "병원")}</div>
        ${h.doctor_name ? `<div style="font-size:13px;opacity:.75">${esc(h.doctor_name)}</div>` : ""}
        ${h.purpose ? `<div style="display:inline-block;margin-top:8px;background:rgba(255,255,255,.2);border-radius:99px;padding:4px 12px;font-size:12px;font-weight:600">${esc(h.purpose)}</div>` : ""}
        ${dday !== null ? `<div style="margin-top:12px;font-size:12px;opacity:.75">다음 진료 ${dday === 0 ? "D-DAY" : dday > 0 ? `D-${dday}` : `D+${Math.abs(dday)}`} · ${dot(h.next_visit_date)}</div>` : ""}
      </div>
    </div>`;

    /* 진료 내용 */
    const hasContent = h.content || h.vet_notes || h.diagnosis;
    if (hasContent) {
      html += `<div class="detail-section"><div class="detail-section-title">진료 내용</div>`;
      if (h.content) html += `<div class="detail-row"><div class="detail-row-label">진료 내용</div><div class="detail-row-value">${esc(h.content)}</div></div>`;
      if (h.vet_notes) html += `<div class="detail-row"><div class="detail-row-label">수의사 설명</div><div class="detail-row-value">${esc(h.vet_notes)}</div></div>`;
      if (h.diagnosis) html += `<div class="detail-row"><div class="detail-row-label">진단/소견</div><div class="detail-row-value">${esc(h.diagnosis)}</div></div>`;
      html += `</div>`;
    }

    /* 처방 */
    const rxList = h.prescriptions || [];
    if (rxList.length) {
      html += `<div class="detail-section"><div class="detail-section-title">처방 내역</div>`;
      rxList.forEach((p, idx) => {
        const [name, ...rest] = p.split(/\s+/);
        html += `<div class="detail-row" style="align-items:center">
          <div class="detail-row-label">${esc(name)}</div>
          <div class="detail-row-value">${esc(rest.join(" ") || "복용 정보 없음")}</div>
          <div style="display:flex;gap:2px;flex-shrink:0">
            <button class="hosp-icon-btn" data-rx-edit="${idx}" aria-label="수정"><span class="material-symbols-rounded">edit</span></button>
            <button class="hosp-icon-btn danger" data-rx-del="${idx}" aria-label="삭제"><span class="material-symbols-rounded">delete</span></button>
          </div>
        </div>`;
      });
      html += `</div>`;
    }

    /* 첨부 자료 */
    const attachments = (h.attachments || []).concat(h.files ? h.files.filter(f => f.url) : []);
    if (attachments.length) {
      const kindIcon = { "혈액검사": "science", "소변검사": "water_drop", "엑스레이": "radiology",
        "초음파": "radiology", "처방전": "description", "영수증": "receipt_long", "진료 안내문": "info" };
      html += `<div class="detail-section"><div class="detail-section-title">첨부 자료</div>`;
      attachments.forEach((a, i) => {
        const isImg = a.url && isImage(a);
        const icon = isImg ? "photo" : (kindIcon[a.kind] || "attach_file");
        const title = a.title || a.name || "파일";
        html += `<div class="detail-row" style="align-items:center">
          <div style="width:32px;height:32px;border-radius:8px;background:${isImg ? "var(--c-photo-bg)" : "var(--c-hospital-bg)"};display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-right:0">
            <span class="material-symbols-rounded" style="font-size:17px;color:${isImg ? "var(--c-photo)" : "var(--c-hospital)"}">${icon}</span>
          </div>
          <div class="detail-row-value" style="margin-left:12px;overflow:hidden">
            <div style="font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(title)}</div>
            ${a.kind ? `<div style="font-size:12px;color:var(--color-text-sub);margin-top:2px">${esc(a.kind)}${a.date ? " · " + dot(a.date) : ""}</div>` : ""}
          </div>
          <div style="display:flex;gap:2px;flex-shrink:0">
            ${a.url ? `<button class="hosp-icon-btn" data-attach-view="${i}" aria-label="보기"><span class="material-symbols-rounded">visibility</span></button>` : ""}
            <button class="hosp-icon-btn" data-attach-edit="${i}" aria-label="교체"><span class="material-symbols-rounded">upload_file</span></button>
            <button class="hosp-icon-btn danger" data-attach-del="${i}" aria-label="삭제"><span class="material-symbols-rounded">delete</span></button>
          </div>
        </div>`;
      });
      html += `</div>`;
    }

    /* 다음 진료 */
    if (h.next_visit_date || h.next_visit_memo) {
      html += `<div class="detail-section"><div class="detail-section-title">다음 진료 일정</div>`;
      if (h.next_visit_date) html += `<div class="detail-row"><div class="detail-row-label">날짜</div><div class="detail-row-value">${dot(h.next_visit_date)} (${dowOf(h.next_visit_date)})${h.next_visit_time ? " · " + h.next_visit_time : ""}</div></div>`;
      if (h.next_visit_memo) html += `<div class="detail-row"><div class="detail-row-label">준비 메모</div><div class="detail-row-value">${esc(h.next_visit_memo)}</div></div>`;
      html += `</div>`;
    }

    /* 보호자 메모 */
    if (h.memo) {
      html += `<div class="detail-section"><div class="detail-section-title">보호자 메모</div>
        <div class="detail-row"><div class="detail-row-value">${esc(h.memo)}</div></div>
      </div>`;
    }

    /* 하단 여백 */
    html += `<div style="height:24px"></div>`;

    $("#detail-body").innerHTML = html;
  }

  /* ── 처방 인라인 수정/삭제 ── */
  let rxEditIdx = null;

  document.addEventListener("click", (e) => {

    // 더보기 메뉴
    if (e.target.closest("#btn-more")) { $("#more-sheet").classList.add("show"); return; }
    if (e.target.closest("#btn-edit")) {
      location.href = `hospital-add.html?edit=${id}&from=detail`; return;
    }
    if (e.target.closest("#btn-delete")) {
      $("#more-sheet").classList.remove("show");
      const h = S.getHospital(id);
      const msg = `병원 기록을 삭제할까요?\n\n진료 내용, 첨부 자료, 처방 정보가 함께 삭제됩니다.\n연결된 복약 일정은 삭제되지 않아요.`;
      if (!confirm(msg)) return;
      S.removeHospital(id);
      toast("병원 기록을 삭제했어요", "delete");
      location.href = "hospital.html";
      return;
    }
    if (e.target.closest("#btn-share")) {
      $("#more-sheet").classList.remove("show");
      const h = S.getHospital(id); if (!h) return;
      const text = `[${S.getPet()?.name || "반려견"} 병원 기록]\n병원: ${h.hospital_name}\n날짜: ${dot(h.date)}\n목적: ${h.purpose}\n${h.content ? "\n진료: " + h.content : ""}${h.vet_notes ? "\n설명: " + h.vet_notes : ""}`;
      if (navigator.share) navigator.share({ title: `${h.hospital_name} 진료 기록`, text }).catch(() => {});
      else if (navigator.clipboard) navigator.clipboard.writeText(text).then(() => toast("요약 텍스트를 복사했어요", "content_copy")).catch(() => {});
      return;
    }

    // 뒤로 가기
    if (e.target.closest("#btn-back")) {
      location.replace("hospital.html"); return;
    }

    // 처방 수정
    const rxEditBtn = e.target.closest("[data-rx-edit]");
    if (rxEditBtn) {
      rxEditIdx = parseInt(rxEditBtn.dataset.rxEdit, 10);
      const h = S.getHospital(id);
      const val = (h?.prescriptions || [])[rxEditIdx] || "";
      const newVal = prompt("처방 내용을 수정하세요:", val);
      if (newVal === null) return;
      if (!newVal.trim()) { toast("처방 내용을 입력해 주세요", "info"); return; }
      const hospitals = S.getHospitals();
      const hi = hospitals.findIndex(x => x.id === id);
      if (hi !== -1) {
        hospitals[hi].prescriptions[rxEditIdx] = newVal.trim();
        localStorage.setItem("petcare_hospitals", JSON.stringify(hospitals));
        render(); toast("처방을 수정했어요");
      }
      return;
    }

    // 처방 삭제
    const rxDelBtn = e.target.closest("[data-rx-del]");
    if (rxDelBtn) {
      if (!confirm("이 처방을 삭제할까요?")) return;
      const idx = parseInt(rxDelBtn.dataset.rxDel, 10);
      const hospitals = S.getHospitals();
      const hi = hospitals.findIndex(x => x.id === id);
      if (hi !== -1) {
        hospitals[hi].prescriptions.splice(idx, 1);
        localStorage.setItem("petcare_hospitals", JSON.stringify(hospitals));
        render(); toast("처방을 삭제했어요", "delete");
      }
      return;
    }

    // 첨부 자료 보기
    const attachView = e.target.closest("[data-attach-view]");
    if (attachView) {
      const h = S.getHospital(id);
      const all = (h?.attachments || []).concat((h?.files || []).filter(f => f.url));
      const f = all[parseInt(attachView.dataset.attachView, 10)];
      if (f) openFile(f);
      return;
    }

    // 첨부 자료 교체
    const attachEdit = e.target.closest("[data-attach-edit]");
    if (attachEdit) {
      const inp = $("#file-replace-input");
      inp.dataset.attachIdx = attachEdit.dataset.attachEdit;
      inp.value = ""; inp.click();
      return;
    }

    // 첨부 자료 삭제
    const attachDel = e.target.closest("[data-attach-del]");
    if (attachDel) {
      const idx = parseInt(attachDel.dataset.attachDel, 10);
      const h = S.getHospital(id);
      const all = (h?.attachments || []).concat((h?.files || []).filter(f => f.url));
      const title = all[idx]?.title || all[idx]?.name || "이 파일";
      if (!confirm(`'${title}' 파일을 삭제할까요?`)) return;
      // attachments에서 먼저 제거 시도
      const hospitals = S.getHospitals();
      const hi = hospitals.findIndex(x => x.id === id);
      if (hi !== -1) {
        const attLen = (hospitals[hi].attachments || []).length;
        if (idx < attLen) {
          hospitals[hi].attachments.splice(idx, 1);
        } else {
          // legacy files
          const fIdx = idx - attLen;
          hospitals[hi].files = (hospitals[hi].files || []).filter((_, i) => i !== fIdx);
        }
        localStorage.setItem("petcare_hospitals", JSON.stringify(hospitals));
        render(); toast("첨부 자료를 삭제했어요", "delete");
      }
      return;
    }

    // 시트 닫기
    const ov = e.target.closest(".sheet-overlay");
    if (ov && e.target === ov) ov.classList.remove("show");
  });

  /* ── 파일 교체 ── */
  const fileReplaceInput = $("#file-replace-input");
  if (fileReplaceInput) {
    fileReplaceInput.addEventListener("change", async () => {
      const file = fileReplaceInput.files && fileReplaceInput.files[0]; if (!file) return;
      if (file.size > 5 * 1024 * 1024) { toast("파일 용량이 너무 커요. 5MB 이하 파일을 선택해 주세요.", "info"); return; }
      const dataUrl = await readFileAsDataURL(file);
      if (!dataUrl) { toast("파일을 읽을 수 없어요", "info"); return; }
      const idx = parseInt(fileReplaceInput.dataset.attachIdx, 10);
      const hospitals = S.getHospitals();
      const hi = hospitals.findIndex(x => x.id === id);
      if (hi === -1) return;
      const attLen = (hospitals[hi].attachments || []).length;
      if (idx < attLen) {
        hospitals[hi].attachments[idx] = { ...hospitals[hi].attachments[idx], name: file.name, url: dataUrl, type: file.type };
      } else {
        const fIdx = idx - attLen;
        (hospitals[hi].files || [])[fIdx] = { ...(hospitals[hi].files || [])[fIdx], name: file.name, url: dataUrl, type: file.type };
      }
      localStorage.setItem("petcare_hospitals", JSON.stringify(hospitals));
      render(); toast("파일을 교체했어요", "upload_file");
    });
  }

  function readFileAsDataURL(file) {
    return new Promise((resolve) => {
      const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = () => resolve(null); reader.readAsDataURL(file);
    });
  }

  if (!id) { location.href = "hospital.html"; return; }
  render();
})();
