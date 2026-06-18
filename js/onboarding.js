/* ============================================================
   PetCare+ · 온보딩 슬라이드 로직
   - 스플래시 자동 페이드아웃 → 3개 소개 슬라이드 → 로그인 진입
   ============================================================ */
(function () {
  "use strict";
  var slides = [
    { badge: "CARE", emoji: "🐶", bg: "linear-gradient(160deg,var(--color-primary-soft),#FDF0E4)",
      h: "매일의 케어를<br>빠짐없이 기록해요",
      p: "복약·식사·산책 같은 반복 케어를 일정으로 등록하고,<br>홈에서 체크만 하면 자동으로 기록이 쌓여요." },
    { badge: "HOSPITAL", emoji: "🏥", bg: "linear-gradient(160deg,#FDF0E4,#E4F2F1)",
      h: "병원 기록을<br>한 곳에 모아요",
      p: "진료 기록·검사 결과·처방 내역을 모아서 관리하고<br>다음 진료 때 참고할 수 있어요." },
    { badge: "REPORT", emoji: "📊", bg: "linear-gradient(160deg,#E4F2F1,#F0ECF8)",
      h: "건강 변화를<br>한눈에 살펴봐요",
      p: "주간·월간 리포트로 케어 완료율과 건강 흐름을<br>정리해 병원 상담 시 참고할 수 있어요." },
  ];
  var i = 0;
  var $ = function (id) { return document.getElementById(id); };

  function render() {
    var s = slides[i];
    $("ob-badge").textContent = s.badge;
    $("ob-emoji").textContent = s.emoji;
    $("ob-bg").style.background = s.bg;
    $("ob-h").innerHTML = s.h;
    $("ob-p").innerHTML = s.p;
    document.querySelectorAll("[data-dot]").forEach(function (d) {
      d.classList.toggle("on", Number(d.dataset.dot) === i);
    });
    $("ob-next").textContent = i === slides.length - 1 ? "시작하기" : "다음";
    $("ob-skip").style.visibility = i === slides.length - 1 ? "hidden" : "visible";
  }
  function finish() {
    try { localStorage.setItem("petcare_onboarded", "1"); } catch (e) {}
    location.href = "index.html";
  }
  $("ob-next").addEventListener("click", function () {
    if (i < slides.length - 1) { i++; render(); } else finish();
  });
  $("ob-skip").addEventListener("click", finish);

  // 스플래시 1.4초 후 페이드아웃
  setTimeout(function () { $("splash").classList.add("hide"); }, 1400);
  render();
})();
