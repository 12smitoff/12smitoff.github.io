// ---------- общее ----------
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
};
const shuffle = a => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const rub = n => Math.round(n).toLocaleString('ru-RU') + ' ₽';
const num = n => n >= 1e6 ? (n / 1e6).toLocaleString('ru-RU', { maximumFractionDigits: 1 }) + ' млн'
  : n >= 1e3 ? (n / 1e3).toLocaleString('ru-RU', { maximumFractionDigits: 1 }) + ' тыс.' : String(Math.round(n));

let toastT;
function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('on');
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), 1800);
}
async function copy(text) {
  try { await navigator.clipboard.writeText(text); }
  catch (e) {
    const ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta);
    ta.select(); document.execCommand('copy'); ta.remove();
  }
  toast('Скопировано ✓');
}
function outItem(i, text, label) {
  const d = document.createElement('div'); d.className = 'out'; d.style.animationDelay = (i * 50) + 'ms';
  const n = document.createElement('span'); n.className = 'n'; n.textContent = String(i + 1).padStart(2, '0');
  const p = document.createElement('p');
  if (label) { const s = document.createElement('small'); s.textContent = label; p.appendChild(s); }
  p.appendChild(document.createTextNode(text));
  const b = document.createElement('button'); b.className = 'copy'; b.type = 'button'; b.textContent = 'Копировать';
  b.onclick = () => copy(text);
  d.append(n, p, b); return d;
}

// ---------- конфетти ----------
function confetti() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const c = $('#confetti'), x = c.getContext('2d');
  c.width = innerWidth; c.height = innerHeight;
  const cols = ['#ff2e3b', '#ff3d8b', '#ff8a3d', '#ffffff', '#3ee08f'];
  const ps = Array.from({ length: 160 }, () => ({
    x: innerWidth / 2, y: innerHeight * .4, r: 4 + Math.random() * 5,
    vx: (Math.random() - .5) * 18, vy: -Math.random() * 16 - 4, a: Math.random() * 6, va: (Math.random() - .5) * .3,
    c: cols[Math.floor(Math.random() * cols.length)]
  }));
  let f = 0;
  (function tick() {
    x.clearRect(0, 0, c.width, c.height);
    ps.forEach(p => {
      p.vy += .45; p.vx *= .99; p.x += p.vx; p.y += p.vy; p.a += p.va;
      x.save(); x.translate(p.x, p.y); x.rotate(p.a); x.fillStyle = p.c; x.fillRect(-p.r, -p.r / 2, p.r * 2, p.r); x.restore();
    });
    if (++f < 150) requestAnimationFrame(tick); else x.clearRect(0, 0, c.width, c.height);
  })();
}

// ---------- шаги ----------
const STEP_KEY = 'shorts-guide-done';
const steps = $$('.step');
let done = store.get(STEP_KEY, []);
function renderSteps() {
  steps.forEach(s => {
    const on = done.includes(s.dataset.step);
    s.classList.toggle('done', on);
    const label = s.querySelector('.check span'); if (label) label.textContent = on ? 'Сделано' : 'Готово';
  });
  const n = done.length, total = steps.length, p = Math.round(n / total * 100);
  $('#count').textContent = n + '/' + total;
  $('#nbar').style.width = p + '%';
  $('#pct').textContent = p + '%';
  $('#ringc').style.strokeDashoffset = 326.7 * (1 - n / total);
  const t = $('#ftitle'), x = $('#ftext');
  if (n === total) { t.textContent = 'Ты прошёл весь путь! 🎉'; x.textContent = 'Теперь — челлендж 30 видео. Следующее видео уже ждёт.'; }
  else if (n >= 5) { t.textContent = 'Больше половины позади 🔥'; x.textContent = 'Осталось ' + (total - n) + ' — ты почти у цели.'; }
  else if (n > 0) { t.textContent = 'Отличное начало 💪'; x.textContent = 'Пройдено ' + n + ' из ' + total + '. Продолжай в том же духе.'; }
  else { t.textContent = 'Твой путь только начинается'; x.textContent = 'Отмечай шаги выше — и следи, как заполняется круг.'; }
}
steps.forEach(s => s.querySelector('.check').addEventListener('click', () => {
  const id = s.dataset.step, was = done.includes(id);
  done = was ? done.filter(v => v !== id) : [...done, id];
  store.set(STEP_KEY, done); renderSteps();
  if (!was) toast(done.length === steps.length ? 'Все 10 шагов пройдены! 🎉' : 'Шаг ' + id + ' пройден ✓');
  if (!was && done.length === steps.length) confetti();
}));
renderSteps();

// ---------- вкладки ----------
$$('.tab').forEach(t => t.addEventListener('click', () => {
  $$('.tab').forEach(x => x.setAttribute('aria-selected', x === t));
  $$('.panel').forEach(p => p.classList.toggle('on', p.id === 'p-' + t.dataset.tab));
  if (t.dataset.tab === 'prompt' && !$('#pText').value.trim()) $('#pText').value = scriptText();
}));

// ---------- генератор идей ----------
const IDEA_TPL = [
  '{t}: 3 ошибки, которые делает каждый новичок',
  '{t} — ожидание vs реальность',
  'Я неделю занимался темой «{t}» — вот что вышло',
  'Тема «{t}»: самый недооценённый совет',
  '{t} без вложений: как начать за 0 рублей',
  '{t}: не начинай, пока не посмотришь это',
  '{t}: что я хотел бы знать в самом начале',
  '{t}: топ-3 бесплатных приложения в помощь',
  '{t} — объясняю за 30 секунд',
  '{t}: почему не получается и как исправить',
  '{t}: 5 вещей, о которых никто не говорит',
  'Пробую впервые: {t} глазами новичка',
  '{t} — до и после 30 дней',
  'Мифы про {t}, в которые все верят',
  '{t}: лайфхак, о котором знают 1%',
  '{t}: самый частый вопрос и честный ответ',
  'Мой день, если ты увлекаешься темой «{t}»',
  '{t}: дешёвый вариант vs дорогой — есть ли разница?',
  '{t}: сколько стоит начать на самом деле',
  '{t}: проверяю популярный совет — работает ли?'
];
const IDEA_PRESETS = ['Спорт', 'Готовка', 'Игры', 'Учёба', 'Деньги', 'Красота', 'Техника', 'Путешествия', 'Музыка', 'Животные'];
function genIdeas() {
  const t = ($('#ideaTopic').value.trim() || 'твоя тема').toLowerCase();
  const out = $('#ideaOut'); out.innerHTML = '';
  shuffle(IDEA_TPL).slice(0, 6).forEach((tpl, i) => {
    let s = tpl.replace('{t}', t); s = s[0].toUpperCase() + s.slice(1);
    out.appendChild(outItem(i, s));
  });
  $('#ideaGo').textContent = 'Ещё идеи ↻';
}
IDEA_PRESETS.forEach(p => {
  const b = document.createElement('button'); b.className = 'chipbtn'; b.type = 'button'; b.textContent = p;
  b.onclick = () => { $('#ideaTopic').value = p; $$('#ideaChips .chipbtn').forEach(x => x.classList.toggle('on', x === b)); genIdeas(); };
  $('#ideaChips').appendChild(b);
});
$('#ideaGo').onclick = genIdeas;
$('#ideaTopic').addEventListener('keydown', e => { if (e.key === 'Enter') genIdeas(); });
genIdeas();

// ---------- крючки ----------
const HOOKS = {
  'Интрига': ['Я не верил, что «{t}» так работает, пока не попробовал', 'Никто не говорит об этом, но в теме «{t}»…', 'Досмотри до конца — последний совет про «{t}» самый важный', '«{t}» — совсем не то, что ты думаешь'],
  'Ошибка': ['Ты 100% делаешь эту ошибку в теме «{t}»', '«{t}»: перестань так делать', '90% новичков в теме «{t}» ошибаются вот здесь', 'Эта ошибка в теме «{t}» стоила мне месяца'],
  'Польза': ['«{t}» — всего 5 минут в день, и вот результат', 'Один приём, который изменил для меня «{t}»', 'Сохрани, чтобы не потерять: лучший совет в теме «{t}»', '«{t}»: 3 шага, чтобы стало в разы проще'],
  'Вызов': ['Спорим, ты не знал этого про «{t}»?', 'Попробуй повторить: «{t}», уровень «сложно»', 'Проверь себя: в теме «{t}» ты новичок или профи?', '24 часа на «{t}». Вот что вышло']
};
let hookType = 'Интрига';
function genHooks() {
  const t = ($('#hookTopic').value.trim() || 'твоя тема').toLowerCase();
  const out = $('#hookOut'); out.innerHTML = '';
  HOOKS[hookType].forEach((h, i) => out.appendChild(outItem(i, h.replace('{t}', t), hookType)));
}
Object.keys(HOOKS).forEach((k, i) => {
  const b = document.createElement('button'); b.className = 'chipbtn' + (i === 0 ? ' on' : ''); b.type = 'button'; b.textContent = k;
  b.onclick = () => { hookType = k; $$('#hookTypes .chipbtn').forEach(x => x.classList.toggle('on', x === b)); genHooks(); };
  $('#hookTypes').appendChild(b);
});
$('#hookTopic').addEventListener('input', genHooks);
genHooks();

// ---------- сценарий ----------
const S_KEY = 'shorts-script';
const sFields = ['sHook', 'sBody', 'sCta'];
const sSaved = store.get(S_KEY, {});
sFields.forEach(id => { $('#' + id).value = sSaved[id] || ''; $('#' + id).addEventListener('input', updScript); });
function scriptText() { return sFields.map(id => $('#' + id).value.trim()).filter(Boolean).join('\n\n'); }
function updScript() {
  const data = {}; sFields.forEach(id => data[id] = $('#' + id).value); store.set(S_KEY, data);
  const words = scriptText().split(/\s+/).filter(Boolean).length;
  const sec = Math.round(words / 2.5); // ~150 слов в минуту
  $('#sWords').textContent = words; $('#sSec').textContent = sec + ' сек';
  const v = $('#sVerdict');
  if (!words) { v.className = 'dur good'; v.textContent = 'Начни писать'; }
  else if (sec <= 45) { v.className = 'dur good'; v.textContent = 'Идеальная длина'; }
  else if (sec <= 70) { v.className = 'dur warn'; v.textContent = 'Можно короче'; }
  else { v.className = 'dur bad'; v.textContent = 'Слишком длинно — сократи'; }
}
updScript();
$('#sCopy').onclick = () => { const t = scriptText(); t ? copy(t) : toast('Сначала напиши сценарий'); };
$('#sClear').onclick = () => { sFields.forEach(id => $('#' + id).value = ''); updScript(); toast('Очищено'); };
$('#sPrompt').onclick = () => { const t = scriptText(); if (!t) return toast('Сначала напиши сценарий'); openPrompter(t); };

// ---------- суфлёр ----------
const P_KEY = 'shorts-prompter';
const pSet = store.get(P_KEY, { speed: 40, size: 44, mirror: false });
$('#pSpeed').value = pSet.speed; $('#pSize').value = pSet.size; $('#pMirror').checked = pSet.mirror;
let pY = 0, pPlaying = false, pLast = 0;
function pSave() { store.set(P_KEY, { speed: +$('#pSpeed').value, size: +$('#pSize').value, mirror: $('#pMirror').checked }); }
function pApply() {
  const t = $('#ptext'); t.style.fontSize = $('#pSize').value + 'px';
  t.classList.toggle('mirror', $('#pMirror').checked); t.style.top = pY + 'px';
}
function pLoop(ts) {
  if (!pPlaying) return;
  const dt = pLast ? (ts - pLast) / 1000 : 0; pLast = ts;
  pY -= $('#pSpeed').value * dt; pApply();
  if (-pY > $('#ptext').offsetHeight + 40) { pPlaying = false; $('#pPlay').textContent = '▶ Дальше'; return; }
  requestAnimationFrame(pLoop);
}
function pPlay(on) { pPlaying = on; pLast = 0; $('#pPlay').textContent = on ? '⏸ Пауза' : '▶ Дальше'; if (on) requestAnimationFrame(pLoop); }
function openPrompter(text) {
  $('#ptext').textContent = text;
  $('#prompter').classList.add('on'); document.body.style.overflow = 'hidden';
  pY = $('#pview').offsetHeight * .38; pApply();
  setTimeout(() => pPlay(true), 600);
}
function closePrompter() { pPlay(false); $('#prompter').classList.remove('on'); document.body.style.overflow = ''; }
$('#pStart').onclick = () => { const t = $('#pText').value.trim(); if (!t) return toast('Вставь текст для чтения'); openPrompter(t); };
$('#pPlay').onclick = () => pPlay(!pPlaying);
$('#pRestart').onclick = () => { pY = $('#pview').offsetHeight * .38; pApply(); pPlay(true); };
$('#pClose').onclick = closePrompter;
['pSpeed', 'pSize', 'pMirror'].forEach(id => $('#' + id).addEventListener('input', () => { pSave(); pApply(); }));
addEventListener('keydown', e => {
  if (!$('#prompter').classList.contains('on')) return;
  if (e.key === 'Escape') closePrompter();
  if (e.code === 'Space') { e.preventDefault(); pPlay(!pPlaying); }
});

// ---------- описание и хэштеги ----------
function genTags() {
  const raw = $('#tagTopic').value.trim();
  if (!raw) return toast('Напиши тему видео');
  const t = raw.toLowerCase();
  const T = raw[0].toUpperCase() + raw.slice(1);
  const words = t.replace(/[^a-zа-яё0-9 ]/gi, ' ').split(/\s+/).filter(w => w.length > 3).slice(0, 3);
  const tags = ['#shorts', '#reels', ...words.map(w => '#' + w), '#' + t.replace(/[^a-zа-яё0-9]/gi, ''), '#советы', '#лайфхак'];
  const uniq = [...new Set(tags)].filter(x => x.length > 2).slice(0, 8);
  const out = $('#tagOut'); out.innerHTML = '';
  [
    ['Название', T + ' — ты точно не знал этого 😳'],
    ['Название', T + ': 3 совета, которые реально работают'],
    ['Название', '«' + T + '» с первого раза — как у меня получилось'],
    ['Описание', T + ' — коротко и по делу. Сохрани, чтобы не потерять, и напиши в комментариях, что снять дальше 👇\n\n' + uniq.join(' ')],
    ['Хэштеги', uniq.join(' ')]
  ].forEach(([l, s], i) => out.appendChild(outItem(i, s, l)));
}
$('#tagGo').onclick = genTags;
$('#tagTopic').addEventListener('keydown', e => { if (e.key === 'Enter') genTags(); });

// ---------- проверка перед публикацией ----------
const PRE = [
  'Крючок в первые 3 секунды — без «Всем привет»',
  'Видео вертикальное (9:16) и не размытое',
  'Звук чистый, без шума и эха',
  'Вырезаны паузы и неудачные дубли',
  'Добавлены субтитры',
  'Музыка — из библиотеки платформы',
  'Короткое интригующее название',
  'Описание и 3–5 хэштегов',
  'Выбрана понятная обложка',
  'В конце есть призыв: подписка или вопрос'
];
const PRE_KEY = 'shorts-precheck';
let pre = store.get(PRE_KEY, []);
PRE.forEach((txt, i) => {
  const l = document.createElement('label'); l.className = 'ci';
  const inp = document.createElement('input'); inp.type = 'checkbox'; inp.checked = pre.includes(i);
  const bx = document.createElement('span'); bx.className = 'bx';
  const s = document.createElement('span'); s.textContent = txt;
  inp.onchange = () => { pre = inp.checked ? [...pre, i] : pre.filter(v => v !== i); store.set(PRE_KEY, pre); updPre(true); };
  l.append(inp, bx, s); $('#preList').appendChild(l);
});
function updPre(fromClick) {
  const r = $('#preReady'), all = pre.length === PRE.length;
  r.classList.toggle('go', all);
  r.textContent = all ? '🚀 Всё готово — публикуй!' : 'Отмечено ' + pre.length + ' из ' + PRE.length;
  if (all && fromClick) confetti();
}
$('#preReset').onclick = () => { pre = []; store.set(PRE_KEY, pre); $$('#preList input').forEach(i => i.checked = false); updPre(); toast('Чек-лист сброшен'); };
updPre();

// ---------- калькулятор дохода ----------
const viewsFromSlider = v => { const raw = 100 * Math.pow(10, v / 25); const m = Math.pow(10, Math.floor(Math.log10(raw)) - 1); return Math.round(raw / m) * m; };
function calc() {
  const avg = viewsFromSlider(+$('#cViews').value), vids = +$('#cVids').value, deals = +$('#cDeals').value;
  const monthly = avg * vids;
  $('#oViews').textContent = num(avg); $('#oVids').textContent = vids; $('#oDeals').textContent = deals;
  const ads = [monthly / 1000 * 1, monthly / 1000 * 5];
  const dl = [deals * avg * .3, deals * avg * 1.5];
  const range = a => a[1] < 1 ? '0 ₽' : rub(a[0]) + ' – ' + rub(a[1]);
  $('#rViews').textContent = num(monthly);
  $('#rAds').textContent = range(ads);
  $('#rDeals').textContent = deals ? range(dl) : '—';
  $('#rTotal').textContent = range([ads[0] + dl[0], ads[1] + dl[1]]);
}
['cViews', 'cVids', 'cDeals'].forEach(id => $('#' + id).addEventListener('input', calc));
calc();

// ---------- челлендж 30 видео ----------
const CH_KEY = 'shorts-challenge';
let ch = store.get(CH_KEY, []);
const MSG = [[0, 'Нажми на первую клетку, когда выложишь первое видео'], [1, 'Первое видео есть! Самое сложное позади 💪'], [5, 'Уже 5 — ты входишь в ритм'],
  [10, 'Десятка! Посмотри статистику — что зашло лучше?'], [20, '20 видео — ты уже не новичок 🔥'], [30, 'Челлендж пройден! Ты сделал то, что не делает почти никто 🏆']];
for (let i = 1; i <= 30; i++) {
  const b = document.createElement('button'); b.type = 'button'; b.className = 'day' + ([5, 10, 20, 30].includes(i) ? ' mile' : ''); b.textContent = i;
  b.setAttribute('aria-label', 'Видео ' + i);
  b.onclick = () => {
    const was = ch.includes(i); ch = was ? ch.filter(v => v !== i) : [...ch, i]; store.set(CH_KEY, ch); renderCh();
    if (!was && [5, 10, 20, 30].includes(ch.length)) { confetti(); toast(ch.length + ' видео! 🎉'); }
  };
  $('#days').appendChild(b);
}
function renderCh() {
  $$('.day').forEach((b, i) => b.classList.toggle('on', ch.includes(i + 1)));
  $('#chCount').textContent = ch.length;
  $('#chMsg').textContent = MSG.filter(m => ch.length >= m[0]).pop()[1];
}
renderCh();

// ---------- словарь ----------
const GLOSS = [
  ['Хук (крючок)', 'Первые 1–3 секунды видео, которые цепляют зрителя и не дают пролистать.'],
  ['Удержание', 'Какую часть видео в среднем досматривают. Главная цифра для роста.'],
  ['CTA', 'Призыв к действию: «подпишись», «напиши в комментах», «сохрани».'],
  ['Ниша', 'Тема канала и аудитория, для которой ты снимаешь.'],
  ['Алгоритм', 'Система платформы, которая решает, кому показать твоё видео.'],
  ['Охват', 'Сколько разных людей увидели видео.'],
  ['Вовлечённость (ER)', 'Сколько зрителей лайкают, комментируют и делятся — в процентах от просмотров.'],
  ['CTR', 'Процент людей, которые кликнули на видео после того, как увидели обложку.'],
  ['Интеграция', 'Реклама продукта внутри твоего видео за деньги.'],
  ['Медиакит', 'Презентация канала для рекламодателей: тема, цифры, аудитория, цены.'],
  ['CPM / RPM', 'Сколько платят за 1000 просмотров: CPM — платит рекламодатель, RPM — получает автор.'],
  ['Монетизация', 'Когда платформа начинает платить тебе за рекламу в твоих видео.'],
  ['Тренд', 'Популярный звук, формат или тема, которую сейчас повторяют многие.'],
  ['Залёт', 'Видео, которое неожиданно набрало намного больше обычного.'],
  ['Теневой бан', 'Когда платформа без уведомления перестаёт показывать твои видео новым людям.'],
  ['B-roll', 'Дополнительные кадры поверх речи: руки, предметы, процесс. Делают видео динамичнее.'],
  ['Джамп-кат', 'Резкая склейка, вырезающая паузы. Стандарт для коротких видео.'],
  ['Кросспостинг', 'Публикация одного видео сразу на нескольких платформах.']
];
function renderGloss() {
  const q = $('#gSearch').value.trim().toLowerCase(), g = $('#gloss'); g.innerHTML = '';
  const list = GLOSS.filter(([a, b]) => !q || a.toLowerCase().includes(q) || b.toLowerCase().includes(q));
  if (!list.length) { const e = document.createElement('div'); e.className = 'empty'; e.textContent = 'Ничего не нашлось 🤷'; g.appendChild(e); return; }
  list.forEach(([a, b]) => {
    const d = document.createElement('div'); d.className = 'term';
    const t = document.createElement('b'); t.textContent = a; const s = document.createElement('span'); s.textContent = b;
    d.append(t, s); g.appendChild(d);
  });
}
$('#gSearch').addEventListener('input', renderGloss);
renderGloss();

// ---------- сброс ----------
$('#reset').onclick = () => {
  if (!confirm('Сбросить все отметки, сценарий и челлендж?')) return;
  [STEP_KEY, S_KEY, PRE_KEY, CH_KEY].forEach(k => { try { localStorage.removeItem(k); } catch (e) {} });
  location.reload();
};

// ---------- скролл: появление, линия, навигация, «наверх» ----------
const io = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
}), { threshold: .1, rootMargin: '0px 0px -40px 0px' });
$$('.reveal').forEach(el => io.observe(el));

const tl = $('#timeline'), rail = $('#rail');
const navLinks = $$('.navlinks a'), sections = navLinks.map(a => $(a.getAttribute('href')));
function onScroll() {
  const r = tl.getBoundingClientRect(), mid = innerHeight * .55;
  rail.style.height = Math.max(0, Math.min(r.height - 40, mid - r.top - 20)) + 'px';
  let cur = -1; sections.forEach((s, i) => { if (s && s.getBoundingClientRect().top < innerHeight * .35) cur = i; });
  navLinks.forEach((a, i) => a.classList.toggle('active', i === cur));
  $('#totop').classList.toggle('on', scrollY > 900);
}
addEventListener('scroll', onScroll, { passive: true });
addEventListener('resize', onScroll);
onScroll();
$('#totop').onclick = () => scrollTo({ top: 0, behavior: 'smooth' });

// подсветка рамки карточки за курсором
$$('.card').forEach(c => c.addEventListener('pointermove', e => {
  const r = c.getBoundingClientRect();
  c.style.setProperty('--mx', (e.clientX - r.left) + 'px');
  c.style.setProperty('--my', (e.clientY - r.top) + 'px');
}));
