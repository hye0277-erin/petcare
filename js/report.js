(function () {
  "use strict";

  const reports = {
    weekly: {
      periodLabel: "최근 7일 기준",
      medication: { complete: 92, missed: 5, late: 3 },
      summary:
        "최근 7일 동안 기침 기록이 3회 있었고 식사량 감소 기록이 2회 있었어요. 복약은 대부분 완료되었으며, 다음 진료 때 기침 빈도와 식사량 변화를 함께 확인해보세요.",
      metrics: {
        medication: ["92%", "지난 7일 기준"],
        symptoms: ["3회", "기침 기록 중심"],
        meal: ["식사량 감소", "2회", "평소보다 적음"],
        next: ["다음 진료", "D-3", "서울동물병원"],
      },
      symptoms: [
        { label: "기침", count: 3 },
        { label: "무기력", count: 1 },
        { label: "식욕저하", count: 2 },
      ],
      meals: [
        { label: "완식", count: 3 },
        { label: "대부분 먹음", count: 2 },
        { label: "절반 정도", count: 1 },
        { label: "조금 먹음", count: 1 },
        { label: "먹지 않음", count: 0 },
      ],
      weight: { current: "4.8kg", change: "-0.2kg", rangeText: "직전 기록 대비" },
      copy: {
        medication: "최근 7일 동안 복약 기록은 안정적으로 유지되고 있어요. 놓친 기록은 1회 있었어요.",
        symptom: "기침 기록이 가장 많이 남겨졌어요. 다음 진료 때 기침이 있었던 날짜를 함께 확인해보세요.",
        meal: "최근 7일 동안 식사량 감소 기록이 2회 있었어요. 식사량이 줄어든 날짜는 병원 상담 때 참고할 수 있어요.",
        weight: "최근 기록 기준 체중은 4.8kg이에요. 이전 기록과 비교해 0.2kg 감소했어요. 흐름을 이어서 확인해보세요.",
      },
      visitSummary: [
        "기침 기록 3회",
        "식사량 감소 2회",
        "복약 완료율 92%",
        "체중 4.8kg",
        "검사 결과 업로드 1건",
      ],
      modal:
        "최근 7일 동안 기침 기록이 3회 있었고 식사량 감소 기록이 2회 있었어요.\n복약 완료율은 92%이며, 체중은 최근 기록 기준 4.8kg입니다.\n다음 진료 때 해당 내용을 함께 확인해보세요.",
    },
    monthly: {
      periodLabel: "최근 30일 기준",
      medication: { complete: 89, missed: 7, late: 4 },
      summary:
        "최근 30일 동안 병원 방문 기록이 2회, 검사 결과 업로드가 1건 있었어요. 체중은 큰 변화 없이 유지되고 있으며, 반복된 증상 기록은 다음 진료 때 참고할 수 있어요.",
      metrics: {
        medication: ["89%", "최근 30일 기준"],
        symptoms: ["11회", "기침 / 무기력 포함"],
        meal: ["병원 방문", "2회", "진료 기록 저장됨"],
        next: ["검사 결과", "1건", "혈액검사 업로드"],
      },
      symptoms: [
        { label: "기침", count: 8 },
        { label: "무기력", count: 3 },
        { label: "식욕저하", count: 5 },
        { label: "구토", count: 1 },
      ],
      meals: [
        { label: "완식", count: 14 },
        { label: "대부분 먹음", count: 9 },
        { label: "절반 정도", count: 4 },
        { label: "조금 먹음", count: 2 },
        { label: "먹지 않음", count: 1 },
      ],
      weight: { current: "4.8kg", change: "-0.3kg", rangeText: "30일 전 대비" },
      copy: {
        medication: "최근 30일 기준 복약 완료율은 89%예요. 놓친 기록과 일부 복용 기록을 함께 확인할 수 있어요.",
        symptom: "기침과 식욕저하 기록이 반복해서 남겨졌어요. 다음 진료 때 증상이 있었던 날짜를 함께 확인해보세요.",
        meal: "월간 식사 기록은 대부분 유지되었지만 식사량이 적었던 날도 있었어요. 반복되는 날짜가 있는지 확인해보세요.",
        weight: "최근 30일 기준 체중은 4.8kg이며 30일 전과 비교해 0.3kg 감소했어요. 추세가 이어지는지 기록을 확인해보세요.",
      },
      visitSummary: [
        "기침 기록 8회",
        "식욕저하 기록 5회",
        "병원 방문 2회",
        "복약 완료율 89%",
        "혈액검사 결과 1건",
      ],
      modal:
        "최근 30일 동안 병원 방문 기록이 2회, 검사 결과 업로드가 1건 있었어요.\n복약 완료율은 89%이며, 반복된 기침과 식욕저하 기록이 있습니다.\n다음 진료 때 월간 흐름을 함께 확인해보세요.",
    },
  };

  let activePeriod = "weekly";
  let customRange = null; // { start: "YYYY-MM-DD", end: "YYYY-MM-DD" }

  const $ = (selector) => document.querySelector(selector);
  const S = window.PetStore;

  /* ── 직접 지정 기간 리포트 (store 기록 기반 집계) ────── */
  function buildCustomReport(startIso, endIso) {
    const inRange = (dotDate) => {
      const iso = (dotDate || "").replace(/\./g, "-");
      return iso >= startIso && iso <= endIso;
    };
    const recs = (S ? S.getRecords() : []).filter((r) => inRange(r.date));
    const tasks = (S ? S.getTasks() : []).filter((t) => t.scheduled_date >= startIso && t.scheduled_date <= endIso);

    // 복약 완료율
    const medTasks = tasks.filter((t) => t.type === "med");
    const medResolved = medTasks.filter((t) => t.status !== "pending");
    const medDone = medResolved.filter((t) => t.status === "done").length;
    const medSkip = medResolved.filter((t) => t.status === "skipped").length;
    const medMiss = medResolved.filter((t) => t.status === "missed").length;
    const tot = medResolved.length || 1;
    const completePct = Math.round((medDone / tot) * 100);

    // 증상 집계
    const symRecs = recs.filter((r) => r.type === "symptom");
    const symMap = {};
    symRecs.forEach((r) => { (r.fields?.kind || [r.title]).flat().forEach((k) => { if (k) symMap[k] = (symMap[k] || 0) + 1; }); });
    const symptoms = Object.entries(symMap).map(([label, count]) => ({ label, count }));

    // 식사 완료율 집계
    const mealRecs = recs.filter((r) => r.type === "meal");
    const mealLabels = ["완식", "75%", "50%", "25%"];
    const meals = mealLabels.map((label) => ({ label, count: mealRecs.filter((r) => (r.fields?.complete || "") === label).length }));

    // 체중
    const weightRecs = recs.filter((r) => r.type === "weight" && r.fields?.weight)
      .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
    let weightCur = "-", weightChange = "기록 없음";
    if (weightRecs.length) {
      weightCur = `${weightRecs[0].fields.weight}kg`;
      if (weightRecs.length > 1) {
        const diff = (parseFloat(weightRecs[0].fields.weight) - parseFloat(weightRecs[weightRecs.length - 1].fields.weight)).toFixed(1);
        weightChange = `${diff > 0 ? "+" : ""}${diff}kg`;
      } else weightChange = "변화 없음";
    }

    const doneAll = tasks.filter((t) => t.status === "done").length;
    const resolvedAll = tasks.filter((t) => t.status !== "pending").length || 1;
    const carePct = Math.round((doneAll / resolvedAll) * 100);
    const label = `${startIso.replace(/-/g, ".")} ~ ${endIso.replace(/-/g, ".")}`;

    return {
      periodLabel: label,
      medication: { complete: completePct, missed: Math.round((medMiss / tot) * 100), late: Math.round((medSkip / tot) * 100) },
      summary: `${label} 기간 동안 케어 일정 ${tasks.length}건 중 ${doneAll}건을 완료했어요(완료율 ${carePct}%). 증상 기록은 ${symRecs.length}건, 식사 기록은 ${mealRecs.length}건이에요.`,
      metrics: {
        medication: [`${completePct}%`, "선택 기간 기준"],
        symptoms: [`${symRecs.length}회`, "선택 기간 증상 기록"],
        meal: ["식사 기록", `${mealRecs.length}회`, "선택 기간"],
        next: ["다음 진료", "-", "병원 화면 참고"],
      },
      symptoms: symptoms.length ? symptoms : [{ label: "기록 없음", count: 0 }],
      meals,
      weight: { current: weightCur, change: weightChange, rangeText: "기간 내 변화" },
      copy: {
        medication: `선택 기간 복약 완료율은 ${completePct}%예요. 놓침 ${medMiss}건, 건너뜀 ${medSkip}건이 있었어요.`,
        symptom: symRecs.length ? "선택 기간에 기록된 증상이에요. 다음 진료 때 함께 확인해보세요." : "선택 기간에 기록된 증상이 없어요.",
        meal: mealRecs.length ? "선택 기간의 식사 완료율 분포예요." : "선택 기간에 식사 기록이 없어요.",
        weight: weightRecs.length ? `선택 기간 체중은 ${weightCur}이고, 기간 내 변화는 ${weightChange}예요.` : "선택 기간에 체중 기록이 없어요.",
      },
      visitSummary: [
        `케어 완료 ${doneAll}건 / 완료율 ${carePct}%`,
        `증상 기록 ${symRecs.length}건`,
        `식사 기록 ${mealRecs.length}건`,
        `복약 완료율 ${completePct}%`,
        `체중 ${weightCur}`,
      ],
      modal: `${label} 기간 요약\n케어 완료율 ${carePct}%, 복약 완료율 ${completePct}%\n증상 ${symRecs.length}건, 식사 ${mealRecs.length}건, 체중 ${weightCur}\n다음 진료 때 함께 확인해보세요.`,
    };
  }

  /* ── 반려견 정보(해피) 렌더 ─────────────────────────── */
  function renderPet() {
    if (!S) return;
    const p = S.getPet(); if (!p) return;
    const line = [p.name, p.age ? `${p.age}살` : "", p.breed].filter(Boolean).join(" · ");
    const lineEl = document.querySelector("[data-pet-line]"); if (lineEl) lineEl.textContent = line;
    const initEl = document.querySelector("[data-pet-initial]"); if (initEl) initEl.textContent = (p.name || "해")[0];
    document.querySelectorAll("[data-pet-name]").forEach((e) => (e.textContent = p.name));
  }

  /* ── 저장된 기록 기반 라이브 지표 보정 ──────────────── */
  function applyLiveMetrics(data) {
    if (!S) return data;
    const recs = S.getRecords();
    const d = JSON.parse(JSON.stringify(data));

    // 복약 완료율 — 처리된(done/skipped/missed) 복약 일정 기준
    const medTasks = S.getTasks().filter((t) => t.type === "med");
    const medResolved = medTasks.filter((t) => t.status !== "pending");
    if (medResolved.length) {
      const done = medResolved.filter((t) => t.status === "done").length;
      const skipped = medResolved.filter((t) => t.status === "skipped").length;
      const missed = medResolved.filter((t) => t.status === "missed").length;
      const tot = medResolved.length;
      const pct = Math.round((done / tot) * 100);
      d.medication.complete = pct;
      d.medication.missed = Math.round((missed / tot) * 100);
      d.medication.late = Math.round((skipped / tot) * 100);
      d.metrics.medication = [`${pct}%`, d.metrics.medication[1]];
    }

    // 전체 일정 완료율 (다음 진료 지표 자리 보조 텍스트로 노출)
    const allResolved = S.getTasks().filter((t) => t.status !== "pending");
    if (allResolved.length) {
      const doneAll = allResolved.filter((t) => t.status === "done").length;
      const skipAll = allResolved.filter((t) => t.status === "skipped").length;
      const pctAll = Math.round((doneAll / allResolved.length) * 100);
      d.summary = `등록한 케어 일정 ${allResolved.length}건 중 ${doneAll}건을 완료했고 ${skipAll}건을 건너뛰었어요(완료율 ${pctAll}%). ` + d.summary;
    }

    // 증상 기록 횟수
    const symCount = recs.filter((r) => r.type === "symptom").length;
    if (symCount) d.metrics.symptoms = [`${symCount}회`, d.metrics.symptoms[1]];

    // 체중 (가장 최근 기록)
    const w = recs.filter((r) => r.type === "weight" && r.fields?.weight)
      .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
    if (w.length) {
      d.weight.current = `${w[0].fields.weight}kg`;
      if (w.length > 1) {
        const diff = (parseFloat(w[0].fields.weight) - parseFloat(w[1].fields.weight)).toFixed(1);
        d.weight.change = `${diff > 0 ? "+" : ""}${diff}kg`;
      }
    }

    // 다음 진료 D-day
    const nv = S.nextVisitDday(new Date("2026-06-13"));
    if (nv) d.metrics.next = [d.metrics.next[0], nv.dday === 0 ? "D-DAY" : `D-${nv.dday}`, d.metrics.next[2]];

    return d;
  }

  function setText(selector, value) {
    const el = $(selector);
    if (el) el.textContent = value;
  }

  function renderMedication(data) {
    setText("#medication-chip", `완료 ${data.medication.complete}%`);
    setText("#med-complete", `${data.medication.complete}%`);
    setText("#med-missed", `${data.medication.missed}%`);
    setText("#med-late", `${data.medication.late}%`);
    $("#med-complete-bar").style.width = `${data.medication.complete}%`;
    $("#med-missed-bar").style.width = `${data.medication.missed}%`;
    $("#med-late-bar").style.width = `${data.medication.late}%`;
  }

  function renderBars(selector, rows) {
    const target = $(selector);
    if (!target) return;
    const max = Math.max(...rows.map((row) => row.count), 1);
    target.innerHTML = rows.map((row) => {
      const width = Math.max((row.count / max) * 100, row.count ? 12 : 0);
      return `
        <div class="${selector === "#symptom-list" ? "bar-row" : "meal-row"}">
          <span>${row.label}</span>
          <span class="${selector === "#symptom-list" ? "bar-track" : "meal-track"}"><i style="width:${width}%"></i></span>
          <span class="${selector === "#symptom-list" ? "bar-count" : "meal-count"}">${row.count}회</span>
        </div>`;
    }).join("");
  }

  function renderVisitSummary(items) {
    const target = $("#visit-summary");
    if (!target) return;
    target.innerHTML = items.map((item) => `<li>${item}</li>`).join("");
  }

  function ensureCustomRange() {
    if (customRange) return customRange;
    const end = (S && S.TODAY) || "2026-06-13"; // 기본: 최근 7일
    const d = new Date(end); d.setDate(d.getDate() - 6);
    const start = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    customRange = { start, end };
    return customRange;
  }

  function renderReport() {
    let data;
    if (activePeriod === "custom") {
      ensureCustomRange();
      data = buildCustomReport(customRange.start, customRange.end);
    } else {
      data = applyLiveMetrics(reports[activePeriod]);
    }
    setText("#summary-period", data.periodLabel);
    setText("#summary-text", data.summary);
    setText("#metric-medication", data.metrics.medication[0]);
    setText("#metric-medication-sub", data.metrics.medication[1]);
    setText("#metric-symptoms", data.metrics.symptoms[0]);
    setText("#metric-symptoms-sub", data.metrics.symptoms[1]);
    setText("#metric-meal-label", data.metrics.meal[0]);
    setText("#metric-meal", data.metrics.meal[1]);
    setText("#metric-meal-sub", data.metrics.meal[2]);
    setText("#metric-next-label", data.metrics.next[0]);
    setText("#metric-next", data.metrics.next[1]);
    setText("#metric-next-sub", data.metrics.next[2]);
    setText("#medication-copy", data.copy.medication);
    setText("#symptom-copy", data.copy.symptom);
    setText("#meal-copy", data.copy.meal);
    setText("#weight-current", data.weight.current);
    setText("#weight-change", data.weight.change);
    setText("#weight-copy", data.copy.weight);
    setText("#visit-modal-copy", data.modal);
    renderMedication(data);
    renderBars("#symptom-list", data.symptoms);
    renderBars("#meal-list", data.meals);
    renderVisitSummary(data.visitSummary);
  }

  function openModal() {
    const modal = $("#visit-modal");
    if (!modal) return;
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
  }

  function closeModal() {
    const modal = $("#visit-modal");
    if (!modal) return;
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
  }

  document.addEventListener("click", (event) => {
    const tab = event.target.closest("[data-period]");
    if (tab) {
      activePeriod = tab.dataset.period;
      document.querySelectorAll("[data-period]").forEach((button) => {
        const selected = button.dataset.period === activePeriod;
        button.classList.toggle("active", selected);
        button.setAttribute("aria-selected", selected ? "true" : "false");
      });
      // 직접 선택 탭에서만 기간 입력 노출
      const range = $("#report-range");
      if (range) {
        range.style.display = activePeriod === "custom" ? "" : "none";
        if (activePeriod === "custom") {
          ensureCustomRange();
          if (window.PetPicker) {
            window.PetPicker.setValue($("#rr-start"), customRange.start);
            window.PetPicker.setValue($("#rr-end"), customRange.end);
          }
        }
      }
      renderReport();
      return;
    }

    if (event.target.closest("#rr-apply")) {
      const start = $("#rr-start")?.value;
      const end = $("#rr-end")?.value;
      if (!start || !end) { if (window.toast) window.toast("시작일과 종료일을 선택해 주세요.", "info"); return; }
      if (start > end) { if (window.toast) window.toast("종료일이 시작일보다 빨라요.", "info"); return; }
      customRange = { start, end };
      renderReport();
      if (window.toast) window.toast("선택 기간으로 조회했어요.");
      return;
    }

    if (event.target.closest("#open-visit-modal")) {
      openModal();
      return;
    }

    if (event.target.closest("[data-close-modal]")) {
      closeModal();
      return;
    }

    if (event.target.closest("#prepare-share") || event.target.closest("#report-share")) {
      shareSummary();
      return;
    }

    if (event.target.closest("#report-print")) {
      window.print();
      return;
    }
  });

  /* 리포트 요약 텍스트 — 공유 API → 클립보드 복사 순으로 */
  function summaryText() {
    const data = applyLiveMetrics(reports[activePeriod]);
    const petName = (S && S.getPet()?.name) || "반려견";
    return `[${petName} 건강 기록 요약 · ${data.periodLabel}]\n` +
      `${data.summary}\n\n` +
      `· 복약 완료율: ${data.medication.complete}%\n` +
      `· 증상 기록: ${data.metrics.symptoms[0]}\n` +
      `· 현재 체중: ${data.weight.current} (${data.weight.change})\n` +
      `· 다음 진료: ${data.metrics.next[1]}\n\n` +
      `※ 입력된 기록을 기준으로 정리한 요약이며, 다음 진료 때 병원 상담 시 참고할 수 있어요.`;
  }

  function shareSummary() {
    const text = summaryText();
    if (navigator.share) {
      navigator.share({ title: "PetCare+ 건강 요약", text }).catch(() => {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(text)
        .then(() => { if (window.toast) window.toast("요약 텍스트를 복사했어요. 병원 상담 시 참고하세요.", "content_copy"); })
        .catch(() => { if (window.toast) window.toast("복사에 실패했어요. 인쇄/저장을 이용해 주세요.", "info"); });
    } else if (window.toast) {
      window.toast("공유를 지원하지 않는 환경이에요. 인쇄/저장을 이용해 주세요.", "info");
    }
  }

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeModal();
  });

  renderPet();
  renderReport();
})();
