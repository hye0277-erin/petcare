// ===== Pet Care+ Web App (MVP 1.5) =====
// 데이터 모델 + localStorage + 화면 전환 + 일정 체크 + 빠른 기록 폼/타임라인

const STORE_KEY = 'petcareplus_v1';

// ---- 반려견 정보 ----
let pet = {
  name: '코코',
  breed: '말티즈',
  age: 12,
  tags: ['심장질환', '신장질환', '췌장염'],
};

// ---- 오늘의 케어 일정 데이터 ----
// isTimeSensitive: 예정 시간이 중요한 일정(약/체크 등) / false면 "오늘 중" 일정
let tasks = [
  { id: 1,  icon: '💊', name: '아침약',     category: 'medicine', isTimeSensitive: true,  scheduledTime: '08:00', bg: 'bg-blue',  done: true,  doneTime: '08:05', memo: '' },
  { id: 2,  icon: '🍚', name: '아침 식사',   category: 'meal',     isTimeSensitive: true,  scheduledTime: '08:30', bg: 'bg-amber', done: true,  doneTime: '08:30', memo: '' },
  { id: 3,  icon: '💧', name: '물 섭취 확인', category: 'water',    isTimeSensitive: false, scheduledTime: '',      bg: '__water',  done: true,  doneTime: '09:00', memo: '' },
  { id: 4,  icon: '💊', name: '점심약',     category: 'medicine', isTimeSensitive: true,  scheduledTime: '12:00', bg: 'bg-blue',  done: true,  doneTime: '12:05', memo: '' },
  { id: 5,  icon: '🍚', name: '점심 식사',   category: 'meal',     isTimeSensitive: true,  scheduledTime: '12:30', bg: 'bg-amber', done: true,  doneTime: '12:30', memo: '' },
  { id: 6,  icon: '🚶', name: '산책',       category: 'walk',     isTimeSensitive: false, scheduledTime: '',      bg: 'bg-sage',  done: true,  doneTime: '15:00', memo: '' },
  { id: 7,  icon: '🦠', name: '유산균',     category: 'supplement', isTimeSensitive: false, scheduledTime: '',    bg: '__probiotic', done: true, doneTime: '16:00', memo: '' },
  { id: 8,  icon: '💊', name: '저녁약',     category: 'medicine', isTimeSensitive: true,  scheduledTime: '18:00', bg: 'bg-blue',  done: false, doneTime: null, memo: '' },
  { id: 9,  icon: '🍚', name: '저녁 식사',   category: 'meal',     isTimeSensitive: true,  scheduledTime: '19:00', bg: 'bg-amber', done: false, doneTime: null, memo: '' },
  { id: 10, icon: '🫁', name: '호흡 체크',  category: 'check',    isTimeSensitive: true,  scheduledTime: '21:00', bg: '__water',  done: false, doneTime: null, memo: '' },
  { id: 11, icon: '🌿', name: '취침 전 약', category: 'medicine', isTimeSensitive: true,  scheduledTime: '22:00', bg: 'bg-sage',  done: false, doneTime: null, memo: '' },
  { id: 12, icon: '⚖️', name: '체중 측정',  category: 'weight',   isTimeSensitive: false, scheduledTime: '',      bg: 'bg-sage',  done: false, doneTime: null, memo: '' },
];

// 일부 배경색은 인라인 처리 (유틸 클래스에 없는 색상)
const customBg = { '__water': '#E6F9F0', '__probiotic': '#FFF4E6' };

function bgStyle(bg) {
  if (customBg[bg]) return `style="background:${customBg[bg]}"`;
  return `class="detail-task-icon-wrap ${bg}"`;
}

// 시간 표시 헬퍼: 시간 중요 일정은 예정시간, 아니면 "오늘 중"
function taskTimeLabel(t) {
  return t.isTimeSensitive ? t.scheduledTime : '오늘 중';
}

// ---- 기록(타임라인) 데이터 ----
let records = [
  { time: '08:05', icon: '💊', name: '아침약',     badge: '복용',   color: 'accent', memo: '' },
  { time: '08:30', icon: '🍚', name: '아침 식사',   badge: '완식',   color: 'amber',  memo: '' },
  { time: '09:00', icon: '💧', name: '물 섭취 확인', badge: '100ml', color: 'water',  memo: '' },
  { time: '12:05', icon: '💊', name: '점심약',     badge: '복용',   color: 'accent', memo: '' },
  { time: '12:30', icon: '🍚', name: '점심 식사',   badge: '완식',   color: 'amber',  memo: '' },
  { time: '14:10', icon: '🤒', name: '기침',       badge: '증상',   color: 'rose',   memo: '' },
  { time: '15:00', icon: '🚶', name: '산책',       badge: '20분',   color: 'sage',   memo: '' },
];

const badgeColors = {
  accent: { bg: 'var(--accent-soft)', fg: 'var(--accent)' },
  amber:  { bg: 'var(--amber-soft)',  fg: 'var(--amber)'  },
  sage:   { bg: 'var(--sage-soft)',   fg: 'var(--sage)'   },
  rose:   { bg: 'var(--rose-soft)',   fg: 'var(--rose)'   },
  water:  { bg: '#E6F9F0',            fg: '#00A86B'        },
};

const dotBg = { accent: 'bg-blue', amber: 'bg-amber', sage: 'bg-sage', rose: 'bg-rose', water: '__water' };

const pageLinks = [
  { title: '홈', href: 'index.html', description: '대시보드 및 반려견 요약' },
  { title: '기록', href: 'record.html', description: '빠른 기록과 타임라인 보기' },
  { title: '오늘의 케어', href: 'schedule.html', description: '오늘 일정 전체 보기 및 체크' },
  { title: '병원', href: 'hospital.html', description: '병원 방문 기록 및 검사 결과' },
  { title: '리포트', href: 'report.html', description: '건강 리포트 및 분석' },
  { title: '반려견 등록', href: 'register.html', description: '새 반려견 정보를 입력' },
  { title: '설정', href: 'settings.html', description: '앱 설정 관리' },
];

// ===== localStorage =====
function saveState() {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify({ pet, tasks, records }));
  } catch (e) { /* 저장 불가 환경 무시 */ }
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return;
    const s = JSON.parse(raw);
    if (s.pet) pet = s.pet;
    if (Array.isArray(s.tasks) && s.tasks.length) tasks = s.tasks;
    if (Array.isArray(s.records)) records = s.records;
  } catch (e) { /* 손상된 데이터 무시 */ }
}

// ===== 시간 헬퍼 =====
function nowHM() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

// ===== 화면 전환 (SPA용 - 멀티페이지에서는 미사용) =====
function goTo(tab) {
  document.querySelectorAll('.view').forEach(v => v.classList.toggle('active', v.dataset.tab === tab));
  document.querySelectorAll('.bottom-nav .nav-item').forEach(n =>
    n.classList.toggle('active', n.dataset.goto === tab));
  const scroll = document.querySelector(`#view-${tab} .screen-scroll`);
  if (scroll) scroll.scrollTop = 0;
}

document.addEventListener('click', (e) => {
  const goEl = e.target.closest('[data-goto]');
  if (goEl) goTo(goEl.dataset.goto);
});

// ===== 일정 체크 토글 =====
function toggleTask(id) {
  const t = tasks.find(x => x.id === id);
  if (!t) return;
  t.done = !t.done;
  if (t.done) {
    if (!t.doneTime) t.doneTime = nowHM(); // 완료 시간 자동 저장
  } else {
    t.doneTime = null;
  }
  saveState();
  renderAll();
  showToast(t.done ? `✅ ${t.name} 완료` : `${t.name} 완료 취소`);
}

document.addEventListener('click', (e) => {
  if (window.CARE_TASKS_OVERRIDE) return; // 홈 일정은 care_tasks 모듈이 처리
  const taskEl = e.target.closest('[data-task]');
  if (taskEl) toggleTask(Number(taskEl.dataset.task));
});

// ===== 렌더링: 홈 =====
function renderHome() {
  const homeRemaining = document.getElementById('home-remaining');
  if (!homeRemaining) return;

  if (!window.CARE_TASKS_OVERRIDE) {
  const pending = tasks.filter(t => !t.done);
  const doneCount = tasks.length - pending.length;
  const pct = Math.round(doneCount / tasks.length * 100);

  homeRemaining.textContent = pending.length;
  document.getElementById('home-progress-text').textContent = `완료 ${doneCount} / ${tasks.length}`;
  document.getElementById('home-progress-pct').textContent = `${pct}%`;
  document.getElementById('home-progress-fill').style.width = `${pct}%`;

  // 가장 가까운 다음 일정 (시간 중요 일정 우선)
  const next = pending.find(t => t.isTimeSensitive) || pending[0];
  if (next) {
    document.getElementById('home-next-icon').textContent = next.icon;
    document.getElementById('home-next-name').textContent = next.name;
    document.getElementById('home-next-time').textContent = taskTimeLabel(next);
  } else {
    document.getElementById('home-next-icon').textContent = '✅';
    document.getElementById('home-next-name').textContent = '모두 완료!';
    document.getElementById('home-next-time').textContent = '🎉';
  }

  const list = document.getElementById('home-task-list');
  const show = pending.slice(0, 3);
  const moreCount = pending.length - show.length;
  list.innerHTML = (show.map(t => {
    const label = taskTimeLabel(t);
    return `
    <div class="task-item" data-task="${t.id}">
      <div class="task-check"></div>
      <span class="task-icon">${t.icon}</span>
      <span class="task-name">${t.name}</span>
      <span class="task-time"${!t.isTimeSensitive ? ' style="color:var(--amber)"' : ''}>${label}</span>
    </div>`;
  }).join('')
    || '<div style="padding:14px;text-align:center;color:var(--ink-muted);font-size:13px;">오늘 일정을 모두 마쳤어요 🎉</div>')
    + (moreCount > 0 ? `<a class="task-more" href="schedule.html">+${moreCount}개 더보기</a>` : '');
  } // end !CARE_TASKS_OVERRIDE

  // 반려견 정보 반영
  const nameEl = document.getElementById('home-pet-name');
  if (nameEl) nameEl.textContent = pet.name;
  const breedEl = document.getElementById('home-pet-breed');
  if (breedEl) breedEl.textContent = `${pet.age}세 · ${pet.breed}`;
}

// ===== 렌더링: 오늘의 케어 상세 =====
function renderSchedule() {
  const heroDone = document.getElementById('hero-done');
  if (!heroDone) return;

  // 시간순 정렬 (시간 중요 일정 먼저, 시간 비중요는 뒤)
  const sorted = [...tasks].sort((a, b) => {
    const ta = a.isTimeSensitive ? a.scheduledTime : '99:99';
    const tb = b.isTimeSensitive ? b.scheduledTime : '99:99';
    return ta.localeCompare(tb);
  });
  const done = sorted.filter(t => t.done);
  const pending = sorted.filter(t => !t.done);
  const pct = Math.round(done.length / tasks.length * 100);

  heroDone.textContent = done.length;
  document.getElementById('hero-total').textContent = tasks.length;
  document.getElementById('hero-remaining').textContent = pending.length;
  document.getElementById('hero-fill').style.width = `${pct}%`;

  const detailItem = (t) => {
    let timeText;
    if (t.done) {
      timeText = t.isTimeSensitive
        ? `예정 ${t.scheduledTime} · 완료 ${t.doneTime}`
        : `오늘 중 · 완료 ${t.doneTime}`;
    } else {
      timeText = t.isTimeSensitive ? `예정 ${t.scheduledTime}` : '오늘 중';
    }
    let badge;
    if (t.done) badge = `<div class="detail-task-badge badge-done">완료</div>`;
    else if (!t.isTimeSensitive) badge = `<div class="detail-task-badge" style="background:var(--amber-soft);color:var(--amber)">미정</div>`;
    else badge = `<div class="detail-task-badge badge-pending">예정</div>`;
    return `
      <div class="detail-task-item${t.done ? ' done' : ''}" data-task="${t.id}">
        <div ${bgStyle(t.bg)} ${customBg[t.bg] ? 'class="detail-task-icon-wrap"' : ''}>${t.icon}</div>
        <div class="detail-task-info">
          <div class="detail-task-name">${t.name}</div>
          <div class="detail-task-time"${(!t.done && !t.isTimeSensitive) ? ' style="color:var(--amber)"' : ''}>${timeText}</div>
        </div>
        ${badge}
      </div>`;
  };

  document.getElementById('done-task-list').innerHTML =
    done.map(detailItem).join('') || '<div style="padding:8px 4px;color:var(--ink-muted);font-size:12px;">완료한 일정이 없어요.</div>';
  document.getElementById('pending-task-list').innerHTML =
    pending.map(detailItem).join('') || '<div style="padding:8px 4px;color:var(--sage);font-size:12px;">남은 일정이 없어요 🎉</div>';
}

// ===== 렌더링: 기록 타임라인 =====
function renderTimeline() {
  const tl = document.getElementById('timeline');
  if (!tl) return;
  if (!records.length) {
    tl.innerHTML = '<div class="timeline-empty">오늘 기록이 아직 없어요.</div>';
    return;
  }

  tl.innerHTML = records.map(r => {
    const c = badgeColors[r.color] || badgeColors.accent;
    const dot = dotBg[r.color];
    const dotAttr = customBg[dot]
      ? `style="background:${customBg[dot]};border-radius:50%"`
      : `class="timeline-dot ${dot}" style="border-radius:50%"`;
    const memoHtml = r.memo ? `<div class="timeline-card-memo">${r.memo}</div>` : '';
    return `
      <div class="timeline-item">
        <div class="timeline-time">${r.time}</div>
        <div ${customBg[dot] ? 'class="timeline-dot"' : ''} ${dotAttr}>${r.icon}</div>
        <div class="timeline-card">
          <div class="timeline-card-name">${r.name}</div>
          <div class="timeline-card-badge" style="background:${c.bg};color:${c.fg}">${r.badge}</div>
          ${memoHtml}
        </div>
      </div>`;
  }).join('');
}

// ===== 렌더링: 페이지 관리 =====
function renderPages() {
  const container = document.getElementById('page-link-list');
  if (!container) return;
  container.innerHTML = pageLinks.map(page => `
    <a class="page-link-item" href="${page.href}">
      <div class="page-link-title">${page.title}</div>
      <div class="page-link-desc">${page.description}</div>
    </a>`).join('');
}

function renderAll() {
  renderHome();
  renderSchedule();
  renderTimeline();
  renderPages();
  renderReport();
}

/* =========================================================
   빠른 기록 폼 (바텀 시트)
   ========================================================= */

// 기록 타입별 폼 정의
const recordForms = {
  '약': {
    icon: '💊', color: 'accent', title: '💊 약 기록',
    fields: [
      { key: 'medName', label: '약 이름', type: 'text', placeholder: '예: 심장약' },
      { key: 'status', label: '복용 여부', type: 'choice', options: ['복용', '절반 복용', '거부'], default: '복용' },
      { key: 'scheduled', label: '예정 시간', type: 'time' },
      { key: 'actual', label: '실제 복용 시간', type: 'time', now: true },
      { key: 'memo', label: '메모', type: 'text', placeholder: '선택 입력' },
    ],
    build: (v) => ({
      name: (v.medName ? v.medName : '약') + ' 복용',
      badge: v.status || '복용',
      time: v.actual || nowHM(),
      memo: v.memo,
    }),
  },
  '식사': {
    icon: '🍚', color: 'amber', title: '🍚 식사 기록',
    fields: [
      { key: 'status', label: '식사량', type: 'choice', options: ['완식', '절반', '거의 안 먹음', '거부'], default: '완식' },
      { key: 'time', label: '시간', type: 'time', now: true },
      { key: 'memo', label: '메모', type: 'text', placeholder: '선택 입력' },
    ],
    build: (v) => ({ name: '식사', badge: v.status || '완식', time: v.time || nowHM(), memo: v.memo }),
  },
  '물': {
    icon: '💧', color: 'water', title: '💧 물 기록',
    fields: [
      { key: 'time', label: '시간', type: 'time', now: true },
      { key: 'amount', label: '섭취량 (선택)', type: 'choice', options: ['50ml', '100ml', '150ml', '200ml'], optional: true },
      { key: 'memo', label: '메모', type: 'text', placeholder: '선택 입력' },
    ],
    build: (v) => ({ name: '물 섭취 확인', badge: v.amount || '확인', time: v.time || nowHM(), memo: v.memo }),
  },
  '증상': {
    icon: '🤒', color: 'rose', title: '🤒 증상 기록',
    fields: [
      { key: 'symptoms', label: '증상 (복수 선택)', type: 'multi', options: ['기침', '구토', '식욕 감소', '무기력', '호흡 이상'] },
      { key: 'custom', label: '직접 입력', type: 'text', placeholder: '기타 증상' },
      { key: 'time', label: '발생 시간', type: 'time', now: true },
      { key: 'memo', label: '메모', type: 'text', placeholder: '선택 입력' },
    ],
    build: (v) => {
      const all = [...(v.symptoms || [])];
      if (v.custom) all.push(v.custom);
      return { name: all.length ? all.join(', ') : '증상', badge: '증상', time: v.time || nowHM(), memo: v.memo };
    },
  },
  '배변': {
    icon: '💩', color: 'sage', title: '💩 배변 기록',
    fields: [
      { key: 'status', label: '상태', type: 'choice', options: ['정상', '묽음', '설사', '변비'], default: '정상' },
      { key: 'time', label: '시간', type: 'time', now: true },
      { key: 'memo', label: '메모', type: 'text', placeholder: '선택 입력' },
    ],
    build: (v) => ({ name: '배변', badge: v.status || '정상', time: v.time || nowHM(), memo: v.memo }),
  },
  '체중': {
    icon: '⚖️', color: 'sage', title: '⚖️ 체중 기록',
    fields: [
      { key: 'weight', label: '체중 (kg)', type: 'number', placeholder: '예: 5.0' },
      { key: 'time', label: '기록 시간', type: 'time', now: true },
      { key: 'memo', label: '메모', type: 'text', placeholder: '선택 입력' },
    ],
    build: (v) => ({
      name: v.weight ? `체중 ${v.weight}kg` : '체중',
      badge: v.weight ? `${v.weight}kg` : '기록',
      time: v.time || nowHM(),
      memo: v.memo,
    }),
  },
};

// 바텀 시트 DOM 생성 (모든 페이지 공통, 1회)
function ensureSheet() {
  if (document.getElementById('sheet-overlay')) return;
  const overlay = document.createElement('div');
  overlay.className = 'sheet-overlay';
  overlay.id = 'sheet-overlay';
  overlay.innerHTML = `
    <div class="sheet" id="sheet" role="dialog" aria-modal="true">
      <div class="sheet-handle"></div>
      <div class="sheet-header">
        <span class="sheet-title" id="sheet-title"></span>
        <button class="sheet-close" id="sheet-close" aria-label="닫기">✕</button>
      </div>
      <div class="sheet-body" id="sheet-body"></div>
      <button class="sheet-save" id="sheet-save">저장</button>
    </div>`;
  (document.querySelector('.phone-frame') || document.body).appendChild(overlay);

  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeSheet(); });
  document.getElementById('sheet-close').addEventListener('click', closeSheet);
  document.getElementById('sheet-save').addEventListener('click', submitSheet);

  // 칩 선택 토글
  overlay.addEventListener('click', (e) => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    const group = chip.closest('.chip-group');
    const multi = group.dataset.multi !== undefined;
    const optional = group.dataset.optional !== undefined;
    if (multi) {
      chip.classList.toggle('active');
    } else {
      const wasActive = chip.classList.contains('active');
      group.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
      if (!(wasActive && optional)) chip.classList.add('active'); // optional이면 재클릭 시 해제
    }
  });
}

let activeFormType = null;

function fieldHtml(f) {
  if (f.type === 'text') {
    return `<input class="input-text" type="text" data-key="${f.key}" placeholder="${f.placeholder || ''}">`;
  }
  if (f.type === 'number') {
    return `<input class="input-text" type="number" step="0.1" data-key="${f.key}" placeholder="${f.placeholder || ''}">`;
  }
  if (f.type === 'time') {
    return `<input class="input-text" type="time" data-key="${f.key}" value="${f.now ? nowHM() : ''}">`;
  }
  if (f.type === 'choice' || f.type === 'multi') {
    const multiAttr = f.type === 'multi' ? ' data-multi' : '';
    const optAttr = f.optional ? ' data-optional' : '';
    const chips = f.options.map(o =>
      `<button type="button" class="chip${f.default === o ? ' active' : ''}" data-val="${o}">${o}</button>`
    ).join('');
    return `<div class="chip-group" data-key="${f.key}"${multiAttr}${optAttr}>${chips}</div>`;
  }
  return '';
}

function openSheet(type) {
  ensureSheet();
  const form = recordForms[type];
  if (!form) return;
  activeFormType = type;

  document.getElementById('sheet-title').textContent = form.title;
  document.getElementById('sheet-body').innerHTML = form.fields.map(f => `
    <div class="sheet-field">
      <div class="sheet-field-label">${f.label}</div>
      ${fieldHtml(f)}
    </div>`).join('');

  document.getElementById('sheet-overlay').classList.add('show');
}

function closeSheet() {
  const ov = document.getElementById('sheet-overlay');
  if (ov) ov.classList.remove('show');
  activeFormType = null;
}

function readSheet() {
  const body = document.getElementById('sheet-body');
  const data = {};
  body.querySelectorAll('[data-key]').forEach(el => {
    const key = el.dataset.key;
    if (el.classList.contains('chip-group')) {
      const actives = [...el.querySelectorAll('.chip.active')].map(c => c.dataset.val);
      data[key] = el.dataset.multi !== undefined ? actives : (actives[0] || '');
    } else {
      data[key] = el.value.trim();
    }
  });
  return data;
}

function submitSheet() {
  if (!activeFormType) return;
  const form = recordForms[activeFormType];
  const values = readSheet();
  const built = form.build(values);

  records.unshift({
    time: built.time,
    icon: form.icon,
    name: built.name,
    badge: built.badge,
    color: form.color,
    memo: built.memo || '',
  });
  saveState();
  renderTimeline();
  closeSheet();
  showToast(`📝 "${activeFormTypeLabel(form)}" 기록이 추가되었어요`);
}

function activeFormTypeLabel(form) {
  return form.title.replace(/^[^\s]+\s/, '').replace(' 기록', '');
}

// 빠른 기록 버튼 → 폼 열기
document.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-record]');
  if (!btn) return;
  openSheet(btn.dataset.record);
});

// ===== 토스트 =====
let toastTimer;
function showToast(msg) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 1800);
}

// 일반 안내 토스트 (설정/병원 등)
document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-toast]');
  if (el) { e.preventDefault(); showToast(el.dataset.toast); }
});

/* =========================================================
   리포트 (AI 요약 + 주간/월간 토글)
   ========================================================= */
const reportData = {
  weekly: {
    petName: '코코', period: '최근 7일',
    medicationRate: 92, coughCount: 2, vomitingCount: 0, appetiteDecreaseCount: 1,
    weightPrevious: 5.2, weightCurrent: 5.0, mealRate: 95, waterRecordDays: 6, totalDays: 7,
  },
  monthly: {
    petName: '코코', period: '최근 30일',
    medicationRate: 88, coughCount: 5, vomitingCount: 1, appetiteDecreaseCount: 3,
    weightPrevious: 5.4, weightCurrent: 5.0, mealRate: 90, waterRecordDays: 25, totalDays: 30,
  },
};
let reportPeriod = 'weekly';

function analyzeReportData(data) {
  const analysis = {};

  if (data.medicationRate >= 90) analysis.medication = '약 복용이 꾸준했어요.';
  else if (data.medicationRate >= 70) analysis.medication = '일부 복약 기록이 누락되었어요.';
  else analysis.medication = '복약 기록이 빠진 날이 있었어요.';

  const symptomTexts = [];
  if (data.coughCount === 0) symptomTexts.push('기침 기록이 없어요');
  else symptomTexts.push(`기침이 ${data.coughCount}회 기록되었어요`);
  if (data.vomitingCount > 0) symptomTexts.push(`구토가 ${data.vomitingCount}회 기록되었어요`);
  if (data.appetiteDecreaseCount > 0) symptomTexts.push(`식욕 감소가 ${data.appetiteDecreaseCount}회 기록되었어요`);
  analysis.symptom = symptomTexts.join(', ');

  const weightDiff = data.weightCurrent - data.weightPrevious;
  if (Math.abs(weightDiff) <= 0.1) { analysis.weight = '체중 변화가 크지 않아요.'; analysis.weightArrow = '→'; }
  else if (weightDiff < -0.1) { analysis.weight = '체중이 소폭 감소했어요.'; analysis.weightArrow = '↓'; }
  else { analysis.weight = '체중이 소폭 증가했어요.'; analysis.weightArrow = '↑'; }

  if (data.mealRate >= 90) analysis.meal = '식사 기록이 꾸준했어요.';
  else if (data.mealRate >= 70) analysis.meal = '식사 기록이 부분적으로 있었어요.';
  else analysis.meal = '식사 기록이 부족했어요.';

  if (data.waterRecordDays / data.totalDays >= 0.8) analysis.water = '물 섭취 확인이 잘 이루어졌어요.';
  else if (data.waterRecordDays / data.totalDays >= 0.5) analysis.water = '물 기록이 대부분 있었어요.';
  else analysis.water = '물 기록이 부족했어요.';

  return analysis;
}

// AI 요약: 진단/치료/응급 표현 없이 기록 요약 + 부드러운 안내
function generateAISummary(data, analysis) {
  const lines = [];
  lines.push(`${data.period} 동안 ${data.petName}의 약 복용과 식사 기록은 ${data.medicationRate >= 90 && data.mealRate >= 90 ? '꾸준했어요' : '대체로 유지되었어요'}.`);

  const notes = [];
  if (data.coughCount > 0) notes.push(`기침이 ${data.coughCount}회 기록되었`);
  if (data.vomitingCount > 0) notes.push(`구토가 ${data.vomitingCount}회 기록되었`);
  if (Math.abs(data.weightCurrent - data.weightPrevious) > 0.1) {
    const dir = data.weightCurrent < data.weightPrevious ? '소폭 감소' : '소폭 증가';
    notes.push(`체중이 ${dir}했`);
  }
  if (notes.length) lines.push(notes.join('고, ') + '어요.');
  else lines.push('특별한 변화는 보이지 않아요.');

  lines.push('다음 진료 시 최근 기록을 함께 확인해보세요.');
  return lines.join('\n');
}

function renderReport() {
  const summaryEl = document.getElementById('ai-summary-text');
  if (!summaryEl) return;

  const data = reportData[reportPeriod];
  const analysis = analyzeReportData(data);

  summaryEl.textContent = generateAISummary(data, analysis);

  const periodEl = document.getElementById('ai-summary-period');
  if (periodEl) periodEl.textContent = data.period;

  document.getElementById('med-rate').textContent = data.medicationRate;
  document.getElementById('med-bar').style.width = data.medicationRate + '%';
  document.getElementById('med-desc').textContent = analysis.medication;

  document.getElementById('weight-prev').textContent = data.weightPrevious;
  document.getElementById('weight-curr').textContent = data.weightCurrent;
  document.getElementById('weight-direction').textContent = analysis.weightArrow;
  document.getElementById('weight-desc').textContent = analysis.weight;

  document.getElementById('meal-rate').textContent = data.mealRate;
  document.getElementById('meal-desc').textContent = analysis.meal;

  // 증상 추이 막대 (최대 5칸 기준)
  const symptomGrid = document.getElementById('symptom-grid');
  if (symptomGrid) {
    const rows = [
      { label: '기침', count: data.coughCount },
      { label: '구토', count: data.vomitingCount },
      { label: '식욕 감소', count: data.appetiteDecreaseCount },
    ];
    symptomGrid.innerHTML = rows.map(r => {
      const bars = Array(5).fill(0).map((_, i) =>
        `<span class="symptom-bar${i < r.count ? ' filled' : ''}"></span>`).join('');
      return `<div class="symptom-row"><div class="symptom-label">${r.label}</div><div class="symptom-bars">${bars}</div></div>`;
    }).join('');
  }

  document.getElementById('water-days').textContent = data.waterRecordDays;
  const waterIcons = document.getElementById('water-icons');
  if (waterIcons) {
    const cap = Math.min(data.totalDays, 7);
    const activeCount = Math.round((data.waterRecordDays / data.totalDays) * cap);
    waterIcons.innerHTML = Array(cap).fill(null).map((_, i) =>
      `<span class="water-icon ${i < activeCount ? 'active' : ''}">💧</span>`).join('');
  }
  document.getElementById('water-desc').textContent = analysis.water;
}

// 주간/월간 토글
document.addEventListener('click', (e) => {
  const seg = e.target.closest('[data-period]');
  if (!seg) return;
  reportPeriod = seg.dataset.period;
  document.querySelectorAll('[data-period]').forEach(s =>
    s.classList.toggle('active', s.dataset.period === reportPeriod));
  renderReport();
});

// ===== 초기화 =====
loadState();
renderAll();
