/* ============================================================
   PetCare+  ·  Landing Page Interactions
   GSAP + ScrollTrigger 기반 스크롤/등장 인터랙션
   (GSAP 로드 실패 / 저감모션 시 graceful fallback)
   ============================================================ */

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src;
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

(async function init() {
  /* ── 1) 네비게이션: 스크롤 시 배경/그림자 ─────────────── */
  const nav = document.getElementById('lpNav');
  const onScrollNav = () => nav.classList.toggle('scrolled', window.scrollY > 40);
  onScrollNav();
  window.addEventListener('scroll', onScrollNav, { passive: true });

  /* ── 2) 부드러운 앵커 스크롤 ──────────────────────────── */
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (id === '#' || id === '#top') {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      const target = document.querySelector(id);
      if (target) {
        e.preventDefault();
        const y = target.getBoundingClientRect().top + window.scrollY - 72;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    });
  });

  /* ── reveal: IntersectionObserver 기반 (기본) ─────────── */
  const revealEls = document.querySelectorAll('[data-reveal]');
  const ioReveal = () => {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12 });
    revealEls.forEach((el) => io.observe(el));
  };

  if (prefersReduced) {
    revealEls.forEach((el) => el.classList.add('in'));
    return;
  }

  /* ── GSAP 로드 ───────────────────────────────────────── */
  try {
    await loadScript('https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js');
    await loadScript('https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/ScrollTrigger.min.js');
  } catch (err) {
    console.warn('GSAP 로드 실패 — fallback 사용', err);
    ioReveal();
    return;
  }

  const { gsap } = window;
  gsap.registerPlugin(window.ScrollTrigger);

  /* data-reveal 은 GSAP 으로 처리 → 초기 CSS 상태 해제 */
  revealEls.forEach((el) => el.classList.add('in'));
  gsap.set(revealEls, { clearProps: 'opacity,transform' });

  /* ── 3) Hero 인트로 ──────────────────────────────────── */
  const heroTl = gsap.timeline({ defaults: { ease: 'power3.out', duration: 0.9 } });
  heroTl
    .from('.lp-hero-bg', { scale: 1.12, duration: 1.6, ease: 'power2.out' })
    .from('.lp-eyebrow', { y: 20, opacity: 0 }, '-=1.2')
    .from('.lp-hero-title', { y: 28, opacity: 0 }, '-=0.6')
    .from('.lp-hero-sub', { y: 22, opacity: 0 }, '-=0.6')
    .from('.lp-hero-actions .btn', { y: 18, opacity: 0, stagger: 0.12 }, '-=0.55');

  /* Hero 배경 살짝 패럴랙스 */
  gsap.to('.lp-hero-bg', {
    yPercent: 12, ease: 'none',
    scrollTrigger: { trigger: '.lp-hero', start: 'top top', end: 'bottom top', scrub: 1 },
  });

  /* ── 4) 섹션 헤드 등장 ───────────────────────────────── */
  gsap.utils.toArray('.lp-section-head').forEach((head) => {
    gsap.from(head.children, {
      y: 26, opacity: 0, stagger: 0.1, duration: 0.7, ease: 'power3.out',
      scrollTrigger: { trigger: head, start: 'top 82%' },
    });
  });

  /* ── 5) 공감 모자이크 ────────────────────────────────── */
  gsap.from('.lp-mosaic > *', {
    y: 36, opacity: 0, stagger: 0.06, duration: 0.6, ease: 'power3.out',
    scrollTrigger: { trigger: '.lp-mosaic', start: 'top 82%' },
  });

  /* ── 6) 솔루션 배너 ──────────────────────────────────── */
  gsap.from('.lp-band-inner', {
    y: 34, opacity: 0, duration: 0.8, ease: 'power3.out',
    scrollTrigger: { trigger: '.lp-band', start: 'top 88%' },
  });

  /* ── 7) Split (텍스트/목업/사진) ─────────────────────── */
  gsap.utils.toArray('.lp-split').forEach((split) => {
    const text = split.querySelector('.lp-split-text');
    const visual = split.querySelector('.lp-split-mock, .lp-target-photo');
    if (text) gsap.from(text.children, {
      x: -30, opacity: 0, stagger: 0.08, duration: 0.7, ease: 'power3.out',
      scrollTrigger: { trigger: split, start: 'top 75%' },
    });
    if (visual) gsap.from(visual, {
      x: 30, opacity: 0, scale: 0.96, duration: 0.9, ease: 'power3.out',
      scrollTrigger: { trigger: split, start: 'top 75%' },
    });
  });

  /* 폰 목업 체크리스트 순차 연출 */
  gsap.from('.lp-mini-check', {
    x: -16, opacity: 0, stagger: 0.12, duration: 0.5, ease: 'power2.out',
    scrollTrigger: { trigger: '.lp-phone', start: 'top 80%' },
  });
  gsap.from('.lp-mini-petcard .progress > i', {
    scaleX: 0, transformOrigin: 'left', duration: 1.0, ease: 'power2.out',
    scrollTrigger: { trigger: '.lp-phone', start: 'top 80%' },
  });

  /* ── 8) 기능 카드 stagger + 아이콘 hover ─────────────── */
  gsap.from('.lp-feat', {
    y: 40, opacity: 0, stagger: 0.1, duration: 0.7, ease: 'power3.out',
    scrollTrigger: { trigger: '.lp-feat-grid', start: 'top 80%' },
  });
  gsap.utils.toArray('.lp-feat-ic').forEach((ic) => {
    const card = ic.closest('.lp-feat');
    card.addEventListener('mouseenter', () => gsap.to(ic, { scale: 1.12, rotate: -6, duration: 0.4, ease: 'back.out(2)' }));
    card.addEventListener('mouseleave', () => gsap.to(ic, { scale: 1, rotate: 0, duration: 0.4, ease: 'power2.out' }));
  });

  /* ── 9) 사용법 스텝 ──────────────────────────────────── */
  gsap.from('.lp-step', {
    y: 50, opacity: 0, stagger: 0.18, duration: 0.7, ease: 'back.out(1.3)',
    scrollTrigger: { trigger: '.lp-steps', start: 'top 78%' },
  });
  gsap.from('.lp-step-arrow', {
    scale: 0, opacity: 0, stagger: 0.18, duration: 0.5, ease: 'back.out(2)',
    scrollTrigger: { trigger: '.lp-steps', start: 'top 78%' }, delay: 0.3,
  });

  /* ── 10) 안심 문구 ───────────────────────────────────── */
  gsap.from('.lp-notice', {
    y: 26, opacity: 0, duration: 0.7, ease: 'power3.out',
    scrollTrigger: { trigger: '.lp-notice', start: 'top 88%' },
  });

  /* ── 11) Final CTA ───────────────────────────────────── */
  gsap.from('.lp-cta-inner', {
    scale: 0.92, opacity: 0, y: 40, duration: 0.9, ease: 'power3.out',
    scrollTrigger: { trigger: '.lp-cta', start: 'top 85%' },
  });
  gsap.to('.lp-cta-paw', { y: -10, duration: 1.4, ease: 'sine.inOut', repeat: -1, yoyo: true });

  /* ── 12) 버튼 호버 ───────────────────────────────────── */
  gsap.utils.toArray('.btn-primary, .lp-cta-btn, .lp-band-btn').forEach((btn) => {
    btn.addEventListener('mouseenter', () => gsap.to(btn, { y: -3, duration: 0.25, ease: 'power2.out' }));
    btn.addEventListener('mouseleave', () => gsap.to(btn, { y: 0, duration: 0.25, ease: 'power2.out' }));
  });

  window.addEventListener('load', () => window.ScrollTrigger.refresh());
})();
