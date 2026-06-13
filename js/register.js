/* ============================================================
   PetCare+ · 반려견 등록/수정 — 1차 MVP (등록·수정 겸용)
   - 반려견 정보가 이미 있으면 수정 모드(기존 값 채움), 없으면 등록 모드
   - 저장 후: 신규 등록 → index.html, 수정 → settings.html
   ============================================================ */
(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const S = window.PetStore; if (!S) return;

  const existing = S.hasPet() ? S.getPet() : null;
  const isEdit = !!existing;

  // 사진 상태 (data URL 문자열로 보관)
  let photoData = "";
  const preview = $("r-photo-preview");
  const clearBtn = $("r-photo-clear");

  function showPreview(url) {
    photoData = url || "";
    if (photoData) {
      preview.innerHTML = `<img src="${photoData}" alt="반려견 사진" />`;
      clearBtn.style.display = "";
    } else {
      preview.textContent = "🐶";
      clearBtn.style.display = "none";
    }
  }

  $("r-photo").addEventListener("change", (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { if (window.toast) window.toast("이미지 파일만 등록할 수 있어요", "info"); return; }
    const reader = new FileReader();
    reader.onload = () => { showPreview(reader.result); if (window.toast) window.toast("사진을 등록했어요", "photo_camera"); };
    reader.readAsDataURL(file);
  });

  clearBtn.addEventListener("click", () => { $("r-photo").value = ""; showPreview(""); });

  // 모드별 타이틀/버튼
  $("reg-title").textContent = isEdit ? "반려견 정보 수정" : "반려견 등록";
  $("r-submit").textContent = isEdit ? "수정 완료" : "등록 완료";

  // 수정 모드: 기존 값 채우기
  if (isEdit) {
    $("r-name").value = existing.name || "";
    $("r-age").value = existing.age || "";
    $("r-weight").value = existing.weight || "";
    $("r-breed").value = existing.breed || "";
    const setPick = (id, v) => { const el = $(id); if (!el) return; if (window.PetPicker) window.PetPicker.setValue(el, v || ""); else el.value = v || ""; };
    setPick("r-birth", existing.birthdate);
    setPick("r-next", existing.next_visit);
    $("r-history").value = existing.history || "";
    $("r-meds").value = existing.meds || "";
    $("r-caution").value = existing.caution || "";
    if (existing.photo) showPreview(existing.photo);
    if (existing.gender) {
      const g = document.querySelector(`input[name="gender"][value="${existing.gender}"]`);
      if (g) g.checked = true;
    }
    const tags = existing.tags || [];
    document.querySelectorAll('#r-tags input[type="checkbox"]').forEach((c) => {
      c.checked = tags.includes(c.value);
    });
    const known = [...document.querySelectorAll('#r-tags input')].map((c) => c.value);
    const etc = tags.filter((t) => !known.includes(t));
    if (etc.length) $("r-tag-etc").value = etc.join(", ");
  }

  $("r-submit").addEventListener("click", () => {
    const name = $("r-name").value.trim();
    if (!name) { if (window.toast) window.toast("반려견 이름을 입력해 주세요", "info"); $("r-name").focus(); return; }

    const tags = [...document.querySelectorAll('#r-tags input:checked')].map((c) => c.value);
    const etc = $("r-tag-etc").value.split(",").map((s) => s.trim()).filter(Boolean);

    S.savePet({
      id: S.PET_ID,
      name,
      age: $("r-age").value ? Number($("r-age").value) : "",
      birthdate: $("r-birth").value || "",
      weight: $("r-weight").value || "",
      next_visit: $("r-next").value || "",
      gender: document.querySelector('input[name="gender"]:checked')?.value || "",
      breed: $("r-breed").value.trim(),
      tags: [...tags, ...etc],
      history: $("r-history").value.trim(),
      meds: $("r-meds").value.trim(),
      caution: $("r-caution").value.trim(),
      photo: photoData,
    });

    if (window.toast) window.toast(isEdit ? `${name}의 정보를 수정했어요` : `${name}의 정보가 등록되었어요`);
    setTimeout(() => { location.href = isEdit ? "settings.html" : "index.html"; }, 700);
  });
})();
