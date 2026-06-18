/* ============================================================
   PetCare+  ·  main.js
   공통 인터랙션 (네비게이션 / 체크 / 칩 / 토스트 / FAB 시트)
   데이터는 하드코딩이지만, 나중에 Supabase로 교체하기 쉽도록
   js/data.js 의 store 객체를 통해서만 접근합니다.
   ============================================================ */

(function () {
  "use strict";

  /* ── Toast ─────────────────────────────────────────── */
  function toast(message, icon = "check_circle") {
    let el = document.querySelector(".toast");
    if (!el) {
      el = document.createElement("div");
      el.className = "toast";
      (document.querySelector(".app") || document.body).appendChild(el);
    }
    el.innerHTML =
      `<span class="material-symbols-rounded">${icon}</span>${message}`;
    el.classList.add("show");
    clearTimeout(el._t);
    el._t = setTimeout(() => el.classList.remove("show"), 1900);
  }
  window.toast = toast;

  /* ── Checklist / timeline toggle ───────────────────── */
  document.addEventListener("click", function (e) {
    // 더보기 / 접기
    const more = e.target.closest("[data-care-more]");
    if (more) {
      const list = more.closest(".checklist");
      list.dataset.expanded = list.dataset.expanded === "1" ? "" : "1";
      applyCare(list, true);
      return;
    }

    const item = e.target.closest("[data-check]");
    if (!item) return;
    const wasDone = item.classList.toggle("done");

    // 진행률 갱신 (홈 화면)
    updateProgress(item.closest(".scroll"));

    // 상태 라벨 갱신 (홈 체크리스트)
    const status = item.querySelector(".check-status");
    if (status) {
      status.innerHTML = item.classList.contains("done")
        ? '<span class="material-symbols-rounded">check</span>완료'
        : (status.dataset.time
            ? `<span class="material-symbols-rounded">schedule</span>${status.dataset.time}`
            : "");
    }

    // 완료 항목은 아래로, 다음 일정은 위로 (홈 체크리스트만)
    const list = item.closest(".checklist");
    if (list) applyCare(list, true);

    toast(wasDone ? "기록을 완료했어요" : "완료를 취소했어요");
  });

  /* ── 케어 체크리스트 정렬 + 개수 제한 ──────────────────
     · 미완료(다음 일정) 위로, 완료 항목 아래로 (안정 정렬)
     · 최대 CARE_MAX개만 노출, 나머지는 "더보기"로 펼침
     · FLIP 기법으로 부드럽게 이동                         */
  const CARE_MAX = 6;

  function ensureMoreBtn(list) {
    let btn = list.querySelector(".check-more");
    if (!btn) {
      btn = document.createElement("button");
      btn.className = "check-more";
      btn.setAttribute("data-care-more", "");
    }
    list.appendChild(btn); // 항상 맨 아래로
    return btn;
  }

  function applyCare(list, animate) {
    const items = [...list.querySelectorAll(".check-item")];
    if (!items.length) return;

    // FLIP: 이동 전 위치 기록
    const firstTop = animate ? new Map(items.map((it) => [it, it.getBoundingClientRect().top])) : null;

    // 안정 정렬: 미완료 → 완료
    const pending = items.filter((it) => !it.classList.contains("done"));
    const done = items.filter((it) => it.classList.contains("done"));
    const ordered = [...pending, ...done];
    ordered.forEach((it) => list.appendChild(it));

    // 개수 제한
    const expanded = list.dataset.expanded === "1";
    const limit = expanded ? ordered.length : CARE_MAX;
    ordered.forEach((it, i) => it.classList.toggle("is-hidden", i >= limit));

    // 마지막으로 보이는 항목은 구분선 제거
    ordered.forEach((it) => it.classList.remove("no-divider"));
    const visible = ordered.filter((it) => !it.classList.contains("is-hidden"));
    if (visible.length) visible[visible.length - 1].classList.add("no-divider");

    // 더보기 버튼
    const btn = ensureMoreBtn(list);
    if (ordered.length > CARE_MAX) {
      const hidden = ordered.length - CARE_MAX;
      btn.style.display = "";
      btn.innerHTML = expanded
        ? '접기 <span class="material-symbols-rounded">expand_less</span>'
        : `${hidden}개 더보기 <span class="material-symbols-rounded">expand_more</span>`;
    } else {
      btn.style.display = "none";
    }

    // FLIP: 이동 후 위치로 애니메이션
    if (animate && firstTop) {
      ordered.forEach((it) => {
        if (it.classList.contains("is-hidden")) return;
        const f = firstTop.get(it);
        if (f == null) return;
        const dy = f - it.getBoundingClientRect().top;
        if (Math.abs(dy) < 1) return;
        it.style.transition = "none";
        it.style.transform = `translateY(${dy}px)`;
        requestAnimationFrame(() => {
          it.style.transition = "transform 0.32s ease";
          it.style.transform = "";
        });
      });
    }
  }

  function updateProgress(scope) {
    if (!scope) return;
    const items = scope.querySelectorAll(".checklist [data-check]");
    if (!items.length) return;
    const done = scope.querySelectorAll(".checklist [data-check].done").length;
    const total = items.length;
    const pct = Math.round((done / total) * 100);

    const fill = scope.querySelector("[data-progress-fill]");
    const count = scope.querySelector("[data-progress-count]");
    if (fill) fill.style.width = pct + "%";
    if (count) count.innerHTML = `<b>${done}</b> / ${total} 완료`;
  }

  /* ── Symptom chips (multi-select) ──────────────────── */
  document.addEventListener("click", function (e) {
    const chip = e.target.closest("[data-chip]");
    if (!chip) return;
    chip.classList.toggle("active");
  });

  /* ── Report segment tabs ───────────────────────────── */
  document.addEventListener("click", function (e) {
    const seg = e.target.closest("[data-segment] button");
    if (!seg) return;
    seg.parentElement
      .querySelectorAll("button")
      .forEach((b) => b.classList.remove("active"));
    seg.classList.add("active");
  });

  /* ── Save buttons ──────────────────────────────────── */
  document.addEventListener("click", function (e) {
    const save = e.target.closest("[data-save]");
    if (!save) return;
    e.preventDefault();
    toast(save.dataset.save || "저장했어요");
  });

  /* ── Char counter (textarea) ───────────────────────── */
  document.querySelectorAll("[data-counter]").forEach((ta) => {
    const out = document.querySelector(ta.dataset.counter);
    const max = ta.getAttribute("maxlength") || 300;
    const sync = () => { if (out) out.textContent = `${ta.value.length} / ${max}`; };
    ta.addEventListener("input", sync);
    sync();
  });

  /* ── Photo remove ──────────────────────────────────── */
  document.addEventListener("click", function (e) {
    const rm = e.target.closest(".photo-thumb .remove");
    if (!rm) return;
    rm.closest(".photo-thumb").remove();
  });

  /* ── FAB → record sheet ────────────────────────────── */
  const overlay = document.querySelector("[data-sheet]");
  document.addEventListener("click", function (e) {
    if (e.target.closest("[data-fab]") && overlay) {
      overlay.classList.add("show");
      return;
    }
    if (overlay && overlay.classList.contains("show")) {
      if (e.target === overlay || e.target.closest("[data-sheet-close]")) {
        overlay.classList.remove("show");
      }
    }
  });

  /* ── 케어 체크리스트 초기 정렬/제한 + 진행률 동기화 ── */
  document.querySelectorAll(".checklist").forEach((list) => {
    applyCare(list, false);
    updateProgress(list.closest(".scroll"));
  });

  /* ── 외부(home.js 등)에서 동적 렌더 후 재적용용 ────── */
  window.PetCareApplyCare = function (list) {
    if (!list) return;
    applyCare(list, false);
    updateProgress(list.closest(".scroll"));
  };

  /* ── Entrance animation (staggered) ────────────────── */
  document.querySelectorAll("[data-rise]").forEach((el, i) => {
    el.classList.add("rise");
    el.style.animationDelay = i * 0.05 + "s";
  });

  /* ── Material Symbols FOUT 방지 ── */
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
      document.documentElement.classList.add("fonts-loaded");
    });
  } else {
    document.documentElement.classList.add("fonts-loaded");
  }
})();
