/* Material Symbols FOUT 방지 — 폰트 로드 완료 시 html에 fonts-loaded 추가 */
(function () {
  if (!document.fonts) {
    document.documentElement.classList.add("fonts-loaded");
    return;
  }
  document.fonts.load("300 24px 'Material Symbols Rounded'").then(function () {
    document.documentElement.classList.add("fonts-loaded");
  }).catch(function () {
    document.documentElement.classList.add("fonts-loaded");
  });
  // 최대 2초 대기 후 강제 표시 (네트워크 느린 환경 폴백)
  setTimeout(function () {
    document.documentElement.classList.add("fonts-loaded");
  }, 2000);
})();
