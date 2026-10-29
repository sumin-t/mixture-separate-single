/* ===== 수민T의 과학 실험실 · 혼합물 분리 가상 실험실 (화면/조작) ===== */
(function () {
  'use strict';
  const C = window.MixCore;
  const $ = function (id) { return document.getElementById(id); };
  const f1 = function (v) { return Number(v).toFixed(1); };
  const NS = 'http://www.w3.org/2000/svg';
  function el(tag, attrs, parent) {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }

  /* ---------- 데이터 기록(LOG) ---------- */
  const KEY = 'sumin_mixlab_log_v1';
  let LOG = [];
  try { LOG = JSON.parse(localStorage.getItem(KEY) || '[]'); } catch (e) { LOG = []; }
  function saveLog() { try { localStorage.setItem(KEY, JSON.stringify(LOG)); } catch (e) { /* 저장 불가 환경에서도 동작 */ } }
  function addLog(rec) { rec.id = Date.now() + Math.random(); LOG.push(rec); saveLog(); renderAI(); }

  /* ---------- 탭 ---------- */
  function showTab(name) {
    document.querySelectorAll('.tab').forEach(function (b) { b.classList.toggle('on', b.dataset.tab === name); });
    document.querySelectorAll('.panel').forEach(function (p) { p.classList.toggle('on', p.id === 'tab-' + name); });
    if (name === 'ai') renderAI();
    if (name === 'c') drawGraphC();
  }
  document.querySelectorAll('.tab').forEach(function (b) { b.addEventListener('click', function () { showTab(b.dataset.tab); }); });

  /* =========================================================
     ① 용해도 차
     ========================================================= */
  const A = { stage: 0, reveal: false, filtered: false, auto: null };
  const dotsK = [], dotsC = [];
  (function seed() {
    for (let i = 0; i < 60; i++) dotsK.push({ x: 30 + Math.random() * 360, y: 20 + Math.random() * 190, vx: (Math.random() - .5) * 1.6, vy: (Math.random() - .5) * 1.6 });
    for (let i = 0; i < 26; i++) dotsC.push({ x: 30 + Math.random() * 360, y: 20 + Math.random() * 190, vx: (Math.random() - .5) * 1.6, vy: (Math.random() - .5) * 1.6 });
  })();

  function aVals() { return { k: +$('a-k').value, cu: +$('a-cu').value, T: A.stage >= 1 ? +$('a-temp').value : 40 }; }
  function aCalc() { const v = aVals(); return C.calcA(v.k, v.cu, v.T); }

  function aRender() {
    const v = aVals(), r = aCalc();
    $('a-kv').textContent = v.k; $('a-cv').textContent = v.cu; $('a-tv').textContent = v.T;
    // 온도계, 수조
    $('a-tempnum').textContent = (A.stage ? v.T : 40) + ' ℃';
    const h = 20 + (A.stage ? v.T : 40) * 2.2;
    $('a-mercury').setAttribute('y', 178 - h); $('a-mercury').setAttribute('height', h);
    const warm = (A.stage ? v.T : 40) / 40;
    const mix = function (a, b) { return Math.round(a * warm + b * (1 - warm)); };
    $('a-bath').setAttribute('fill', 'rgb(' + mix(255, 200) + ',' + mix(217, 232) + ',' + mix(199, 255) + ')');
    $('a-bathlabel').textContent = (A.stage >= 1 && v.T < 40) ? '얼음물 수조' : '가열 중 (40 ℃)';
    // 용액 색
    const dissCu = A.stage >= 1 ? r.dissCu : 0;
    $('a-liquid').setAttribute('fill', A.stage >= 1 ? 'rgba(30,120,230,' + (0.08 + 0.55 * dissCu / 25).toFixed(2) + ')' : 'rgba(150,190,240,.12)');
    // 바닥의 결정(거시)
    const g = $('a-crystals'); while (g.firstChild) g.removeChild(g.firstChild);
    const pK = A.stage >= 1 ? r.precK : v.k, pC = A.stage >= 1 ? r.precCu : v.cu;
    let yy = 231;
    const hK = Math.min(60, pK * 1.4), hC = Math.min(40, pC * 1.4);
    if (hK > 0.5) { el('rect', { x: 100, y: yy - hK, width: 90, height: hK, fill: '#fff', stroke: '#9aa', 'stroke-width': 1.5, rx: 3 }, g); yy -= hK; }
    if (hC > 0.5) { el('rect', { x: 106, y: yy - hC, width: 78, height: hC, fill: '#3b8cf0', stroke: '#1e5fb5', 'stroke-width': 1.5, rx: 3 }, g); }
    // 거름 장치
    $('a-filterbox').style.display = A.filtered ? 'block' : 'none';
    if (A.filtered) {
      const tot = r.precK + r.precCu, rh = Math.min(18, tot * 1.0);
      $('a-residue').setAttribute('y', 102 - rh + 14); $('a-residue').setAttribute('height', rh);
      const fb = tot > 0 ? r.precCu / tot : 0;
      $('a-residue').setAttribute('fill', 'rgb(' + Math.round(255 - 150 * fb) + ',' + Math.round(255 - 90 * fb) + ',255)');
      $('a-filtrate').setAttribute('fill', 'rgba(30,120,230,' + (0.08 + 0.55 * r.dissCu / 25).toFixed(2) + ')');
    }
    // 표
    let t = '<table><tr><th>물질</th><th>40 ℃에서<br>녹아 있던 양(g)</th><th>' + v.T + ' ℃, 물 100 g에<br>녹을 수 있는 양(g)</th><th>석출량(g)</th></tr>';
    t += '<tr><td>질산 칼륨</td><td>' + v.k + '</td><td>' + f1(r.sK) + '</td><td>' + (A.reveal ? f1(r.precK) : '?') + '</td></tr>';
    t += '<tr><td>황산 구리(Ⅱ)</td><td>' + v.cu + '</td><td>' + f1(r.sCu) + '</td><td>' + (A.reveal ? f1(r.precCu) : '?') + '</td></tr></table>';
    $('a-table').innerHTML = A.stage >= 1 ? t : '';
    aMessage(r, v);
    aAI(r, v);
  }

  function aAI(r, v) {
    const box = $('a-ai'), rows = rowsOf('A');
    box.className = 'msg ai';
    if (A.stage < 1) { box.innerHTML = '🤖 <b>AI 도우미</b> 용해도 데이터를 3개 이상 📋기록하면, AI가 지금 조건에서 석출될 질산 칼륨의 양을 미리 예측해요.'; return; }
    if (rows.length < 3) { box.innerHTML = '🤖 <b>AI 도우미</b> 온도를 바꿔 가며 📋기록해 보세요. 3개 이상 모이면 AI가 석출량을 예측해요. (지금 ' + rows.length + '개)'; return; }
    const xs = rows.map(function (q) { return q.T; }), fit = C.polyfit(xs, rows.map(function (q) { return q.sK; }), Math.min(2, rows.length - 1));
    const predP = Math.max(0, v.k - fit(v.T));
    let s = '🤖 <b>AI 예측</b> (내가 기록한 ' + rows.length + '개 데이터로 학습): ' + v.T + ' ℃에서 질산 칼륨 약 <b>' + f1(predP) + ' g</b> 석출';
    if (A.reveal || A.filtered) s += ' / 실제 <b>' + f1(r.precK) + ' g</b> (차이 ' + f1(Math.abs(predP - r.precK)) + ' g)'; else s += ' <small>— 직접 계산하거나 거른 뒤 실제와 비교해 보세요.</small>';
    if (v.T < Math.min.apply(null, xs) || v.T > Math.max.apply(null, xs)) s += '<br>⚠ 기록하지 않은 온도 범위라 AI가 <b>추측</b>한 값이에요.';
    box.innerHTML = s;
  }

  function aMessage(r, v) {
    const m = $('a-msg'); m.className = 'msg'; let s = '';
    if (A.stage === 0) s = '먼저 혼합물의 양을 정하고 [물에 넣고 저어 녹이기]를 눌러 보세요.';
    else {
      s = '용액의 온도: ' + v.T + ' ℃. ';
      if (v.cu > 0) s += '용액이 <b>푸른색</b>인 것은 황산 구리(Ⅱ)가 녹아 있기 때문입니다. ';
      if (r.precK > 0) {
        s += '<b>흰색 결정(질산 칼륨)</b>이 석출되고 있어요. ' + (r.satK != null && isFinite(r.satK) ? '(처음 결정이 생기는 온도는 약 ' + Math.round(r.satK) + ' ℃)' : '');
      } else s += '아직 석출되는 고체가 없어요. 온도를 더 낮춰 보세요.';
      if (r.precCu > 0) { s += '<br>⚠ <b>푸른색 결정(황산 구리(Ⅱ))도 함께 석출</b>되었어요! 황산 구리(Ⅱ)가 너무 많으면 질산 칼륨만 따로 분리할 수 없습니다. (재결정은 불순물이 적을 때 알맞은 방법)'; m.className = 'msg warn'; }
    }
    m.innerHTML = s;
  }

  $('a-k').addEventListener('input', aSettingsChanged);
  $('a-cu').addEventListener('input', aSettingsChanged);
  function aSettingsChanged() { if (A.stage >= 1) { aReset(true); } aRender(); }
  function aReset(keep) {
    if (A.auto) { clearInterval(A.auto); A.auto = null; }
    A.stage = 0; A.reveal = false; A.filtered = false;
    $('a-temp').value = 40; $('a-temp').disabled = true; $('a-auto').disabled = true; $('a-filter').disabled = true; $('a-record').disabled = true;
    $('a-fb').textContent = ''; $('a-ans').value = '';
    if (!keep) { $('a-k').value = 30; $('a-cu').value = 1; }
  }
  $('a-reset').addEventListener('click', function () { aReset(false); aRender(); });
  $('a-dissolve').addEventListener('click', function () {
    A.stage = 1; A.filtered = false; A.reveal = false; $('a-temp').value = 40;
    $('a-temp').disabled = false; $('a-auto').disabled = false; $('a-filter').disabled = false; $('a-record').disabled = false;
    aRender();
  });
  $('a-temp').addEventListener('input', function () { A.reveal = false; A.filtered = false; $('a-fb').textContent = ''; aRender(); });
  $('a-auto').addEventListener('click', function () {
    if (A.auto) return;
    $('a-temp').value = 40; A.filtered = false; A.reveal = false;
    A.auto = setInterval(function () {
      const t = +$('a-temp').value - 1; $('a-temp').value = Math.max(0, t); aRender();
      if (t <= 0) { clearInterval(A.auto); A.auto = null; }
    }, 140);
  });
  $('a-filter').addEventListener('click', function () { A.filtered = true; aRender(); aFilterText(); });
  function aFilterText() {
    const r = aCalc(), m = $('a-msg');
    let s = '<b>거르기 결과</b><br>• 거름종이 위: ';
    if (r.precK + r.precCu <= 0) s += '남는 고체가 없습니다(아직 석출되지 않음).';
    else {
      s += '<b>흰색 고체</b> 질산 칼륨 ' + f1(r.precK) + ' g';
      if (r.precCu > 0) s += ' + <b>푸른색 고체</b> 황산 구리(Ⅱ) ' + f1(r.precCu) + ' g';
      s += ' (질산 칼륨의 비율 ' + Math.round(100 * r.purity) + ' %)';
    }
    s += '<br>• 거른 용액(' + (r.dissCu > 0 ? '<b>푸른색</b>' : '무색') + '): 질산 칼륨 ' + f1(r.dissK) + ' g' + (r.dissCu > 0 ? ' + 황산 구리(Ⅱ) ' + f1(r.dissCu) + ' g' : '') + '이 녹아 있음';
    m.className = 'msg ' + (r.precCu > 0 ? 'warn' : 'ok'); m.innerHTML = s;
  }
  $('a-check').addEventListener('click', function () {
    const r = aCalc(), ans = parseFloat($('a-ans').value);
    A.reveal = true;
    const fb = $('a-fb');
    if (isNaN(ans)) { fb.textContent = '값을 입력해 보세요.'; A.reveal = false; return; }
    if (Math.abs(ans - r.precK) <= 0.15) fb.innerHTML = '✅ 정답! 석출량 = 녹아 있던 양 − 녹을 수 있는 양 = ' + r.inK + ' − ' + f1(r.sK) + ' = <b>' + f1(r.precK) + ' g</b>';
    else fb.innerHTML = '❌ 다시 생각해 보세요. <b>석출량 = 처음 녹아 있던 양 − 냉각한 온도에서 최대로 녹을 수 있는 양</b> (녹을 수 있는 양보다 적게 녹아 있으면 석출되지 않아요.)';
    aRender();
  });
  $('a-record').addEventListener('click', function () {
    const r = aCalc();
    addLog({ exp: 'A', inK: r.inK, inCu: r.inCu, T: r.T, sK: +f1(r.sK), sCu: +f1(r.sCu), precK: +f1(r.precK), precCu: +f1(r.precCu) });
    $('a-msg').className = 'msg ok'; $('a-msg').innerHTML = '📋 기록했어요! (' + r.T + ' ℃ 데이터) 온도를 바꿔 가며 여러 번 기록하면 AI가 예측하고, ④ AI 분석실에서 곡선을 학습해요.';
    aAI(r, aVals());
  });

  /* ---- 입자 모형 애니메이션 ---- */
  function drawParticles() {
    const cv = $('a-canvas'); if (!cv || !$('tab-a').classList.contains('on')) return;
    const ctx = cv.getContext('2d'), W = cv.width, H = cv.height;
    ctx.clearRect(0, 0, W, H);
    if (!$('a-pm').checked) { ctx.fillStyle = '#789'; ctx.font = '14px sans-serif'; ctx.fillText('입자 모형 보기를 켜 보세요', 130, 130); return; }
    const v = aVals(), r = aCalc();
    // 액체 영역
    ctx.fillStyle = A.stage >= 1 ? 'rgba(30,120,230,' + (0.06 + 0.3 * r.dissCu / 25).toFixed(2) + ')' : 'rgba(150,190,240,.10)';
    ctx.fillRect(10, 10, W - 20, H - 20);
    ctx.strokeStyle = '#789'; ctx.strokeRect(10, 10, W - 20, H - 20);
    const nK = A.stage >= 1 ? Math.round(r.dissK) : 0, nC = A.stage >= 1 ? Math.round(r.dissCu) : 0;
    const pK = Math.round(A.stage >= 1 ? r.precK : v.k), pC = Math.round(A.stage >= 1 ? r.precCu : v.cu);
    const mv = function (d) {
      d.x += d.vx; d.y += d.vy; d.vx += (Math.random() - .5) * .3; d.vy += (Math.random() - .5) * .3;
      d.vx = Math.max(-1.6, Math.min(1.6, d.vx)); d.vy = Math.max(-1.6, Math.min(1.6, d.vy));
      if (d.x < 20 || d.x > W - 20) d.vx *= -1; if (d.y < 20 || d.y > H - 62) d.vy *= -1;
      d.x = Math.max(20, Math.min(W - 20, d.x)); d.y = Math.max(20, Math.min(H - 62, d.y));
    };
    ctx.fillStyle = '#9aa5b1'; ctx.strokeStyle = '#6c7885';
    for (let i = 0; i < Math.min(nK, dotsK.length); i++) { const d = dotsK[i]; mv(d); ctx.beginPath(); ctx.arc(d.x, d.y, 6, 0, 6.283); ctx.fill(); ctx.stroke(); }
    ctx.fillStyle = '#1e78e6'; ctx.strokeStyle = '#0d47a1';
    for (let i = 0; i < Math.min(nC, dotsC.length); i++) { const d = dotsC[i]; mv(d); ctx.beginPath(); ctx.arc(d.x, d.y, 6, 0, 6.283); ctx.fill(); ctx.stroke(); }
    // 바닥에 쌓인 결정(규칙적으로 배열)
    const cols = 24; let idx = 0;
    const place = function (n, fill, stroke) {
      ctx.fillStyle = fill; ctx.strokeStyle = stroke;
      for (let i = 0; i < n; i++, idx++) {
        const col = idx % cols, row = Math.floor(idx / cols);
        ctx.beginPath(); ctx.arc(24 + col * 16, H - 20 - row * 14, 6, 0, 6.283); ctx.fill(); ctx.stroke();
      }
    };
    place(pK, '#e9edf2', '#6c7885');
    place(pC, '#3b8cf0', '#0d47a1');
    $('a-pmsum').textContent = A.stage ? ('용액 속 입자: 질산 칼륨 ' + nK + '개 · 황산 구리(Ⅱ) ' + nC + '개 / 바닥의 결정: 질산 칼륨 ' + pK + '개 · 황산 구리(Ⅱ) ' + pC + '개') : '아직 녹이지 않은 고체 혼합물이에요.';
  }
  (function loop() { drawParticles(); requestAnimationFrame(loop); })();

  /* =========================================================
     ③ 녹는점 차 (스테아르산)
     ========================================================= */
  const B = { mixed: false, dipped: false, melted: false, film: false };
  function bSafetyOK() {
    const ppe = Array.prototype.every.call(document.querySelectorAll('.ppe'), function (c) { return c.checked; });
    const bad = Array.prototype.some.call(document.querySelectorAll('.unsafe'), function (c) { return c.checked; });
    return ppe && !bad;
  }
  function bRender() {
    const T = +$('b-T').value, tubeT = +$('b-tubeT').value;
    $('b-tv').textContent = T; $('b-temp').textContent = '물 ' + T + ' ℃'; $('b-tubelabel').textContent = '시험관 물 ' + tubeT + ' ℃';
    const fl = $('b-flakes'); while (fl.firstChild) fl.removeChild(fl.firstChild);
    $('b-oil').setAttribute('height', 0); $('b-oil').setAttribute('y', 130);
    if (B.mixed) {
      if (B.melted) { $('b-oil').setAttribute('y', 114); $('b-oil').setAttribute('height', 16); }
      else for (let i = 0; i < 38; i++) el('ellipse', { cx: 120 + Math.random() * 134, cy: 124 + Math.random() * 6, rx: 4 + Math.random() * 2, ry: 2.4, fill: '#fffdf5', stroke: '#b9b09a', 'stroke-width': .8 }, fl);
    }
    $('b-film').setAttribute('y', 108); $('b-film').setAttribute('height', B.film ? 30 : 0);
    bAI();
  }
  function bAI() {
    const box = $('b-ai'), T = +$('b-T').value;
    const bd = C.learnBoundary(rowsOf('B').map(function (r) { return { T: r.T, melted: r.melted }; }));
    if (!bd || !bd.separable) { box.innerHTML = '🤖 <b>AI 도우미</b> 물 온도를 바꿔 가며 <b>녹은 경우와 녹지 않은 경우를 모두</b> 📋기록하면, AI가 섞기 전에 결과를 예측해요.'; return; }
    let pred, sure = true;
    if (T <= bd.hiSolid) pred = false; else if (T >= bd.loLiquid) pred = true; else { pred = T >= bd.boundary; sure = false; }
    let s = '🤖 <b>AI 예측</b>: 물 ' + T + ' ℃에서 스테아르산은 <b>' + (pred ? '녹을' : '녹지 않을') + '</b> 것 같아요 ' + (sure ? '(기록한 데이터 범위 안)' : '(<b>데이터가 없는 구간</b>이라 추측)');
    if (B.mixed) s += ' → 실제: <b>' + (B.melted ? '녹음' : '녹지 않음') + '</b> ' + (pred === B.melted ? '✅ 맞았어요' : '❌ 틀렸어요');
    box.innerHTML = s;
  }
  function bMsg(s, cls) { const m = $('b-msg'); m.className = 'msg ' + (cls || ''); m.innerHTML = s; }
  $('b-T').addEventListener('input', function () { B.mixed = false; B.dipped = false; B.film = false; $('b-dip').disabled = true; $('b-record').disabled = true; $('b-tube').style.transform = 'translateY(-130px)'; bRender(); bMsg(''); });
  $('b-tubeT').addEventListener('change', function () { B.dipped = false; B.film = false; $('b-record').disabled = true; bRender(); });
  $('b-mix').addEventListener('click', function () {
    if (!bSafetyOK()) { bMsg('⚠ 안전 점검을 다시 확인하세요. 뜨거운 물을 다룰 때는 보안경·내열장갑·실험복을 착용하고, 맨손으로 뜨거운 비커를 잡으면 안 됩니다.', 'warn'); return; }
    const T = +$('b-T').value; B.mixed = true; B.dipped = false; B.film = false; B.melted = T >= C.STEARIC_MP;
    $('b-dip').disabled = false; $('b-record').disabled = true; bRender();
    bMsg(B.melted
      ? '스테아르산 0.5 g이 <b>녹아서 물 위에 뜹니다</b>(액체 상태). 물과 잘 섞이지 않고 물보다 밀도가 작아 위에 떠 있어요.'
      : '스테아르산이 <b>녹지 않고 흰색 고체 알갱이</b>로 물 위에 떠 있어요. (물 온도가 스테아르산의 녹는점보다 낮아요.)');
  });
  $('b-dip').addEventListener('click', function () {
    const tubeT = +$('b-tubeT').value, tube = $('b-tube');
    $('b-dip').disabled = true; tube.style.transform = 'translateY(0px)';
    setTimeout(function () {
      B.dipped = true;
      B.film = B.melted && tubeT < C.STEARIC_MP;
      tube.style.transform = 'translateY(-130px)'; bRender();
      if (!B.mixed) return;
      if (B.film) bMsg('시험관 표면에 <b>흰색 고체(스테아르산)</b>가 붙었어요! 녹아 있던 스테아르산이 찬 시험관에 닿아 <b>응고</b>했기 때문입니다. 물은 응고하지 않고 그대로예요 → 녹는점(어는점)이 높은 스테아르산이 먼저 굳어 분리됩니다.', 'ok');
      else if (!B.melted) bMsg('시험관에 붙는 것이 거의 없어요. 스테아르산이 아직 녹지 않은 고체 알갱이라서 <b>응고 과정</b>이 일어나지 않았어요. 물 온도를 69 ℃ 이상으로 높여 보세요.', 'warn');
      else bMsg('시험관이 뜨거워서(' + tubeT + ' ℃) 스테아르산이 굳지 않고 <b>액체 상태로 흘러내려요</b>. 스테아르산이 응고하려면 녹는점(약 69 ℃)보다 낮은 온도의 표면이 필요해요.', 'warn');
      $('b-record').disabled = false; $('b-dip').disabled = false;
    }, 1400);
  });
  $('b-record').addEventListener('click', function () {
    addLog({ exp: 'B', T: +$('b-T').value, tubeT: +$('b-tubeT').value, melted: B.melted ? 1 : 0, film: B.film ? 1 : 0 });
    bMsg('📋 기록했어요! 물 온도를 바꿔 가며 더 기록하면 AI가 결과를 예측하고, ④ AI 분석실에서 녹는 온도의 경계를 학습해요.', 'ok');
    bAI();
  });
  $('b-tube').style.transform = 'translateY(-130px)';
  bRender();

  /* =========================================================
     ② 끓는점 차 (증류)
     ========================================================= */
  const D = { still: null, timer: null, ui: [], segs: null, bandsOn: false };
  function cRead() {
    return { mlE: +$('c-e').value, mlW: +$('c-w').value, power: +$('c-power').value, chips: $('c-chip').checked, cooling: $('c-cool').checked, autoVol: +$('c-auto').value };
  }
  function cInfo() {
    const o = cRead(), nE = o.mlE * C.RHO_E / C.M_E, nW = o.mlW * C.RHO_W / C.M_W;
    $('c-ev').textContent = o.mlE; $('c-wv').textContent = o.mlW;
    $('c-info').innerHTML = '혼합물: 에탄올 ' + o.mlE + ' mL + 물 ' + o.mlW + ' mL (에탄올 약 ' + Math.round(100 * o.mlE / (o.mlE + o.mlW)) + ' %). 물의 끓는점은 100 ℃, 에탄올의 끓는점은 약 78 ℃예요.';
  }
  ['c-e', 'c-w'].forEach(function (id) { $(id).addEventListener('input', function () { if (!D.still) cInfo(); else { $(id).value = (id === 'c-e' ? D.init.mlE : D.init.mlW); } }); });
  $('c-cool').addEventListener('change', function () { if (D.still) { D.still.cooling = $('c-cool').checked; $('c-coollabel').textContent = D.still.cooling ? '냉각수 ON ❄' : '냉각수 OFF'; } });
  $('c-chip').addEventListener('change', function () { if (D.still && !D.still.boiling) D.still.chips = $('c-chip').checked; else if (D.still) $('c-chip').checked = D.still.chips; });
  $('c-auto').addEventListener('change', function () { if (D.still) D.still.autoVol = +$('c-auto').value; });
  $('c-power').addEventListener('change', function () { if (D.still) D.still.power = +$('c-power').value; });

  function cStart() {
    if (D.timer) { clearInterval(D.timer); D.timer = null; $('c-start').textContent = '▶ 가열 계속'; $('c-heat').setAttribute('fill', '#444'); return; }
    if (!D.still) {
      D.init = cRead(); D.still = C.makeStill(D.init); D.ui = [{ an: false, fl: null }]; D.segs = null; $('c-segout').innerHTML = '';
      $('c-e').disabled = true; $('c-w').disabled = true;
    }
    if (D.still.done) return;
    $('c-tube').disabled = false;
    $('c-start').textContent = '⏸ 가열 멈춤';
    D.timer = setInterval(cTick, 100);
  }
  function cTick() {
    const s = D.still, n = Math.max(1, Math.round(+$('c-speed').value * 0.1 / 2));
    for (let i = 0; i < n; i++) s.step(2);
    while (D.ui.length < s.tubes.length) D.ui.push({ an: false, fl: null });
    if (s.msg.length) { alert_(s.msg.splice(0).join('\n')); }
    cRender();
    if (s.done) { clearInterval(D.timer); D.timer = null; $('c-start').textContent = '▶ 가열 시작'; $('c-start').disabled = true; $('c-seg').disabled = false; $('c-heat').setAttribute('fill', '#444'); }
  }
  function alert_(t) { const m = $('c-info'); m.innerHTML = '<span style="color:#c62828"><b>' + t.replace(/\n/g, '<br>') + '</b></span>'; }
  $('c-start').addEventListener('click', cStart);
  $('c-tube').addEventListener('click', function () { if (D.still && D.still.newTube()) { D.ui.push({ an: false, fl: null }); cRender(true); } });
  $('c-reset').addEventListener('click', function () {
    if (D.timer) clearInterval(D.timer); D.timer = null; D.still = null; D.ui = []; D.segs = null; D.bandsOn = false;
    $('c-start').textContent = '▶ 가열 시작'; $('c-start').disabled = false; $('c-tube').disabled = true; $('c-seg').disabled = true;
    $('c-e').disabled = false; $('c-w').disabled = false; $('c-segout').innerHTML = ''; $('c-tubes').innerHTML = ''; cInfo(); cRender(true);
  });

  const bubbleG = $('c-bubbles');
  for (let i = 0; i < 9; i++) { const c = el('circle', { cx: 85 + Math.random() * 100, cy: 255, r: 2 + Math.random() * 2, fill: '#fff', stroke: '#9bd', class: 'bub' }, bubbleG); c.style.animationDelay = (Math.random() * 1).toFixed(2) + 's'; c.style.display = 'none'; }

  function cRender(force) {
    const s = D.still, rack = $('c-rack');
    const T = s ? s.T : 20, fl = s ? s.flask() : { vol: +$('c-e').value + +$('c-w').value };
    $('c-tnum').textContent = f1(T) + ' ℃';
    const h = 18 + (T - 20) / 80 * 130;
    $('c-merc').setAttribute('y', 188 - h); $('c-merc').setAttribute('height', h);
    const lh = Math.max(4, Math.min(130, 6 + 1.6 * fl.vol));
    $('c-liq').setAttribute('y', 262 - lh); $('c-liq').setAttribute('height', lh + 4);
    const boil = s && s.boiling && !s.done;
    bubbleG.childNodes.forEach(function (c) { c.style.display = boil ? 'block' : 'none'; });
    $('c-vapor').setAttribute('opacity', boil && s.cooling ? 0.9 : 0);
    $('c-chips').style.display = (s ? s.chips : $('c-chip').checked) ? 'block' : 'none';
    $('c-heat').setAttribute('fill', D.timer ? '#ff7043' : '#444');
    $('c-jacket').setAttribute('opacity', (s ? s.cooling : $('c-cool').checked) ? 0.55 : 0);
    // 시험관 걸이
    while (rack.firstChild) rack.removeChild(rack.firstChild);
    const tubes = s ? s.tubes : [{ nE: 0, nW: 0 }];
    tubes.forEach(function (tb, i) {
      const x = 330 + i * 36, vol = C.volOf(tb.nE, tb.nW), fh = Math.min(66, vol * 9);
      const cur = s && i === s.cur;
      el('rect', { x: x, y: 230, width: 22, height: 74, rx: 9, fill: '#fff', stroke: cur ? '#1565c0' : '#789', 'stroke-width': cur ? 3 : 1.5 }, rack);
      if (fh > 0.5) el('rect', { x: x + 2, y: 302 - fh, width: 18, height: fh, fill: 'rgba(110,170,240,.45)', rx: 7 }, rack);
      const tx = el('text', { x: x + 11, y: 322, 'text-anchor': 'middle', 'font-size': 11, fill: '#345' }, rack); tx.textContent = (i + 1);
      if (cur) { const ar = el('text', { x: x + 11, y: 224, 'text-anchor': 'middle', 'font-size': 13, fill: '#1565c0' }, rack); ar.textContent = '▼'; }
    });
    cTubesUI(force); drawGraphC();
    if (s && s.done && !D.timer) $('c-tube').disabled = true;
  }

  function cTubesUI(force) {
    const s = D.still, box = $('c-tubes'); if (!s) { if (force) box.innerHTML = '<p class="hint">[가열 시작]을 누르면 증류액이 시험관에 모여요.</p>'; return; }
    const key = s.tubes.length + '|' + D.ui.map(function (u) { return (u.an ? 1 : 0) + '' + (u.fl ? 1 : 0); }).join('') + '|' + s.done;
    if (D.uiKey !== key || force) {
      D.uiKey = key; let h = '';
      s.tubes.forEach(function (tb, i) {
        const vol = C.volOf(tb.nE, tb.nW); if (vol <= 0 && i !== s.cur) return;
        const eth = C.ethVolPct(tb.nE, tb.nW), u = D.ui[i];
        h += '<div class="tube"><b>시험관 ' + (i + 1) + '</b> <span id="tv' + i + '">' + f1(vol) + '</span> mL' + (tb.bump ? ' <span style="color:#c62828">⚠ 돌비</span>' : '') + '<br>';
        h += '<button class="btn small ghost" data-an="' + i + '">에탄올 분석</button> <button class="btn small ghost" data-fl="' + i + '">불꽃 확인</button>';
        if (u && u.an) { h += '<div>에탄올 <b>' + Math.round(eth) + ' %</b> · 물 ' + (100 - Math.round(eth)) + ' % <small>(부피)</small></div>'; h += '<div class="flame">🤖 AI 점검: ' + (eth >= 99 ? '거의 순수한 에탄올이에요.' : '순수한 에탄올(100 %)이 아니에요. 물이 ' + (100 - Math.round(eth)) + ' % 섞여 있어요.') + '</div>'; }
        if (u && u.fl) h += '<div class="flame">🔥 ' + u.fl + '</div>';
        h += '</div>';
      });
      box.innerHTML = h || '<p class="hint">아직 모인 증류액이 없어요.</p>';
    } else s.tubes.forEach(function (tb, i) { const e = $('tv' + i); if (e) e.textContent = f1(C.volOf(tb.nE, tb.nW)); });
  }
  $('c-tubes').addEventListener('click', function (e) {
    const s = D.still; if (!s) return;
    const a = e.target.getAttribute('data-an'), f = e.target.getAttribute('data-fl');
    if (a !== null) {
      const i = +a, tb = s.tubes[i], eth = C.ethVolPct(tb.nE, tb.nW);
      if (!D.ui[i].an) { D.ui[i].an = true; addLog({ exp: 'C', tube: i + 1, vol: +f1(C.volOf(tb.nE, tb.nW)), eth: Math.round(eth), avgT: tb.steps ? +f1(tb.Tsum / tb.steps) : null, E: D.init.mlE, W: D.init.mlW }); }
      D.uiKey = null; cTubesUI(true);
    }
    if (f !== null) {
      const i = +f, tb = s.tubes[i], eth = C.ethVolPct(tb.nE, tb.nW);
      D.ui[i].fl = eth >= 60 ? '푸른 불꽃을 내며 잘 탄다' : (eth >= 30 ? '불꽃이 약하고 쉽게 꺼진다' : '불이 붙지 않는다');
      D.uiKey = null; cTubesUI(true);
    }
  });

  function drawGraphC() {
    const cv = $('c-graph'); if (!cv) return; const ctx = cv.getContext('2d'), W = cv.width, H = cv.height;
    ctx.clearRect(0, 0, W, H);
    const L = 48, R = W - 12, Tp = 14, Bt = H - 38;
    const curve = D.still ? D.still.curve : [{ t: 0, T: 20 }];
    const tmax = Math.max(600, Math.ceil((curve[curve.length - 1].t + 60) / 120) * 120);
    const X = function (t) { return L + (R - L) * t / tmax; }, Y = function (T) { return Bt - (Bt - Tp) * (T - 20) / 85; };
    ctx.strokeStyle = '#e1e8f0'; ctx.fillStyle = '#456'; ctx.font = '12px sans-serif'; ctx.lineWidth = 1;
    for (let T = 20; T <= 100; T += 20) { ctx.beginPath(); ctx.moveTo(L, Y(T)); ctx.lineTo(R, Y(T)); ctx.stroke(); ctx.fillText(T, 20, Y(T) + 4); }
    for (let t = 0; t <= tmax; t += 120) { ctx.fillText(t / 60, X(t) - 4, Bt + 16); }
    ctx.fillText('가열 시간(분)', (L + R) / 2 - 30, H - 6); ctx.save(); ctx.translate(12, 110); ctx.rotate(-Math.PI / 2); ctx.fillText('온도(℃)', 0, 0); ctx.restore();
    ctx.setLineDash([5, 4]); ctx.strokeStyle = '#c62828'; ctx.beginPath(); ctx.moveTo(L, Y(100)); ctx.lineTo(R, Y(100)); ctx.stroke();
    ctx.strokeStyle = '#2e7d32'; ctx.beginPath(); ctx.moveTo(L, Y(78)); ctx.lineTo(R, Y(78)); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = '#c62828'; ctx.fillText('물 약 100 ℃', R - 76, Y(100) - 4); ctx.fillStyle = '#2e7d32'; ctx.fillText('에탄올 약 78 ℃', R - 88, Y(78) + 14);
    if (D.segs && D.bandsOn) {
      const col = { rise: 'rgba(255,152,0,.18)', slow: 'rgba(46,125,50,.18)', flat: 'rgba(21,101,192,.18)' };
      D.segs.forEach(function (g, i) { ctx.fillStyle = col[g.type]; ctx.fillRect(X(g.t0), Tp, X(g.t1) - X(g.t0), Bt - Tp); ctx.fillStyle = '#234'; ctx.fillText(String.fromCharCode(65 + i), (X(g.t0) + X(g.t1)) / 2 - 3, Tp + 14); });
    }
    ctx.strokeStyle = '#1565c0'; ctx.lineWidth = 2.5; ctx.beginPath();
    curve.forEach(function (p, i) { if (i) ctx.lineTo(X(p.t), Y(p.T)); else ctx.moveTo(X(p.t), Y(p.T)); }); ctx.stroke();
  }
  $('c-seg').addEventListener('click', function () {
    const segs = C.segmentCurve(D.still.curve); D.segs = segs; D.bandsOn = true;
    const txt = { rise: '온도가 빠르게 올라감', slow: '온도가 완만하게 올라감(일정하지 않음)', flat: '온도가 거의 일정함(약 100 ℃)' };
    let h = '<b>🤖 AI가 기울기(℃/분)로 나눈 구간</b><ul>';
    segs.forEach(function (g, i) { h += '<li><b>' + String.fromCharCode(65 + i) + '</b> ' + f1(g.t0 / 60) + '~' + f1(g.t1 / 60) + '분, ' + f1(g.T0) + '→' + f1(g.T1) + ' ℃ : ' + txt[g.type] + '</li>'; });
    h += '</ul>학습지의 A~D 구간과 비교해 보세요. 에탄올이 주로 끓어 나오는 구간은 어디일까요? AI의 구간 나누기가 틀린 곳은 없나요?';
    $('c-segout').innerHTML = h; drawGraphC();
  });

  /* =========================================================
     ④ AI 분석실
     ========================================================= */
  function rowsOf(exp) { return LOG.filter(function (r) { return r.exp === exp; }); }
  function renderAI() {
    if (!$('tab-ai')) return;
    $('ai-count').textContent = '(모두 ' + LOG.length + '개)';
    renderTable(); renderReg(); renderCls();
  }
  function renderTable() {
    const flt = $('ai-filter').value; let rows = LOG.filter(function (r) { return flt === 'all' || r.exp === flt; });
    let h = '<table>';
    if (flt === 'A') {
      h += '<tr><th>#</th><th>온도(℃)</th><th>질산 칼륨<br>넣은 양</th><th>황산 구리<br>넣은 양</th><th>용해도<br>질산 칼륨</th><th>용해도<br>황산 구리</th><th>석출량<br>질산 칼륨</th><th>석출량<br>황산 구리</th><th></th></tr>';
      rows.forEach(function (r, i) { h += '<tr><td>' + (i + 1) + '</td><td>' + r.T + '</td><td>' + r.inK + '</td><td>' + r.inCu + '</td><td>' + r.sK + '</td><td>' + r.sCu + '</td><td>' + r.precK + '</td><td>' + r.precCu + '</td><td><button class="btn small ghost" data-del="' + r.id + '">✖</button></td></tr>'; });
    } else if (flt === 'B') {
      h += '<tr><th>#</th><th>물 온도(℃)</th><th>시험관 물 온도(℃)</th><th>스테아르산</th><th>시험관 표면</th><th></th></tr>';
      rows.forEach(function (r, i) { h += '<tr><td>' + (i + 1) + '</td><td>' + r.T + '</td><td>' + r.tubeT + '</td><td>' + (r.melted ? '녹음' : '녹지 않음') + '</td><td>' + (r.film ? '고체가 붙음' : '거의 없음') + '</td><td><button class="btn small ghost" data-del="' + r.id + '">✖</button></td></tr>'; });
    } else if (flt === 'C') {
      h += '<tr><th>#</th><th>시험관</th><th>에탄올/물(mL)</th><th>부피(mL)</th><th>에탄올(부피 %)</th><th>평균 온도(℃)</th><th></th></tr>';
      rows.forEach(function (r, i) { h += '<tr><td>' + (i + 1) + '</td><td>' + r.tube + '</td><td>' + r.E + '/' + r.W + '</td><td>' + r.vol + '</td><td>' + r.eth + '</td><td>' + (r.avgT == null ? '-' : r.avgT) + '</td><td><button class="btn small ghost" data-del="' + r.id + '">✖</button></td></tr>'; });
    } else {
      h += '<tr><th>#</th><th>실험</th><th>조건</th><th>결과</th><th></th></tr>';
      rows.forEach(function (r, i) {
        let cond, res, nm;
        if (r.exp === 'A') { nm = '① 용해도 차'; cond = '질산 칼륨 ' + r.inK + ' g, 황산 구리 ' + r.inCu + ' g, ' + r.T + ' ℃'; res = '질산 칼륨 석출 ' + r.precK + ' g, 황산 구리 석출 ' + r.precCu + ' g'; }
        else if (r.exp === 'B') { nm = '③ 녹는점 차'; cond = '물 ' + r.T + ' ℃, 시험관 ' + r.tubeT + ' ℃'; res = (r.melted ? '녹음' : '녹지 않음') + ' / ' + (r.film ? '시험관에 고체가 붙음' : '붙지 않음'); }
        else { nm = '② 끓는점 차'; cond = '에탄올 ' + r.E + ' mL + 물 ' + r.W + ' mL, 시험관 ' + r.tube; res = '에탄올 ' + r.eth + ' % (' + r.vol + ' mL)'; }
        h += '<tr><td>' + (i + 1) + '</td><td>' + nm + '</td><td>' + cond + '</td><td>' + res + '</td><td><button class="btn small ghost" data-del="' + r.id + '">✖</button></td></tr>';
      });
    }
    h += '</table>';
    $('ai-table').innerHTML = rows.length ? h : '<p class="hint">아직 기록된 데이터가 없어요. ①②③ 탭에서 실험하고 [기록]을 눌러 보세요.</p>';
  }
  $('ai-filter').addEventListener('change', renderTable);
  $('ai-table').addEventListener('click', function (e) { const d = e.target.getAttribute('data-del'); if (d) { LOG = LOG.filter(function (r) { return String(r.id) !== d; }); saveLog(); renderAI(); } });
  $('ai-clear').addEventListener('click', function () { if (window.confirm('기록한 데이터를 모두 지울까요?')) { LOG = []; saveLog(); renderAI(); } });
  $('ai-csv').addEventListener('click', function () {
    const cols = ['exp', 'T', 'inK', 'inCu', 'sK', 'sCu', 'precK', 'precCu', 'tubeT', 'melted', 'film', 'tube', 'E', 'W', 'vol', 'eth', 'avgT'];
    let s = '﻿' + cols.join(',') + '\n';
    LOG.forEach(function (r) { s += cols.map(function (c) { return r[c] == null ? '' : r[c]; }).join(',') + '\n'; });
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([s], { type: 'text/csv;charset=utf-8' })); a.download = '혼합물분리_실험데이터.csv'; a.click();
  });

  /* ---- 회귀 ---- */
  function axes(ctx, W, H, L, R, Tp, Bt, xmin, xmax, ymin, ymax, xl, yl) {
    ctx.clearRect(0, 0, W, H); ctx.strokeStyle = '#e1e8f0'; ctx.fillStyle = '#456'; ctx.font = '12px sans-serif'; ctx.lineWidth = 1;
    const X = function (x) { return L + (R - L) * (x - xmin) / (xmax - xmin); }, Y = function (y) { return Bt - (Bt - Tp) * (y - ymin) / (ymax - ymin); };
    for (let x = xmin; x <= xmax; x += 10) { ctx.beginPath(); ctx.moveTo(X(x), Tp); ctx.lineTo(X(x), Bt); ctx.stroke(); ctx.fillText(x, X(x) - 6, Bt + 15); }
    const ys = (ymax - ymin) / 6;
    for (let y = ymin; y <= ymax + 0.1; y += ys) { ctx.beginPath(); ctx.moveTo(L, Y(y)); ctx.lineTo(R, Y(y)); ctx.stroke(); ctx.fillText(Math.round(y), 14, Y(y) + 4); }
    ctx.fillText(xl, (L + R) / 2 - 30, H - 4); ctx.save(); ctx.translate(10, Tp + 60); ctx.rotate(-Math.PI / 2); ctx.fillText(yl, 0, 0); ctx.restore();
    return { X: X, Y: Y };
  }
  $('ai-deg').addEventListener('input', renderReg); $('ai-truth').addEventListener('change', renderReg);
  let curFit = null;
  function renderReg() {
    const rows = rowsOf('A'), cv = $('ai-canvas'), ctx = cv.getContext('2d');
    $('ai-degv').textContent = $('ai-deg').value;
    const a = axes(ctx, cv.width, cv.height, 48, cv.width - 14, 14, cv.height - 36, 0, 60, 0, 120, '온도(℃)', '용해도(g/물 100 g)');
    if ($('ai-truth').checked) { ctx.strokeStyle = '#2e7d32'; ctx.setLineDash([6, 4]); ctx.lineWidth = 2; ctx.beginPath(); for (let T = 0; T <= 60; T += 1) { if (T) ctx.lineTo(a.X(T), a.Y(C.S_K(T))); else ctx.moveTo(a.X(T), a.Y(C.S_K(T))); } ctx.stroke(); ctx.setLineDash([]); ctx.fillStyle = '#2e7d32'; ctx.fillText('교과서 곡선(정답)', a.X(30), a.Y(110)); }
    const msg = $('ai-reg'); curFit = null;
    if (rows.length < 2) { msg.className = 'msg'; msg.innerHTML = '① 탭에서 여러 온도로 [기록]해 보세요. 데이터가 <b>2개 이상</b>이면 AI가 곡선을 학습할 수 있어요. (지금 ' + rows.length + '개)'; rows.forEach(function (r) { drawPt(ctx, a, r.T, r.sK); }); return; }
    const xs = rows.map(function (r) { return r.T; }), ys = rows.map(function (r) { return r.sK; });
    const want = +$('ai-deg').value, fit = C.polyfit(xs, ys, want); curFit = fit;
    ctx.strokeStyle = '#1565c0'; ctx.lineWidth = 2.5; ctx.beginPath();
    for (let T = 0; T <= 60; T += 1) { const y = Math.max(-20, Math.min(160, fit(T))); if (T) ctx.lineTo(a.X(T), a.Y(y)); else ctx.moveTo(a.X(T), a.Y(y)); } ctx.stroke();
    rows.forEach(function (r) { drawPt(ctx, a, r.T, r.sK); });
    const grid = []; for (let T = 0; T <= 60; T++) grid.push(T);
    const err = C.rmse(fit, C.S_K, grid), uniq = {}; xs.forEach(function (x) { uniq[x] = 1; });
    let s = '학습 데이터 <b>' + rows.length + '개</b>(서로 다른 온도 ' + Object.keys(uniq).length + '개, ' + Math.min.apply(null, xs) + '~' + Math.max.apply(null, xs) + ' ℃). 사용한 차수: <b>' + fit.degree + '</b>';
    if (fit.degree < want) s += ' (데이터가 부족해 ' + want + '차 대신 ' + fit.degree + '차만 쓸 수 있어요)';
    s += '<br>0~60 ℃ 전체에서 AI 곡선과 교과서 곡선의 평균 차이(RMSE): <b>' + f1(err) + ' g</b>';
    const lo = Math.min.apply(null, xs), hi = Math.max.apply(null, xs);
    if (lo > 5 || hi < 55) s += '<br>⚠ 측정하지 않은 온도 범위(' + (lo > 5 ? '0~' + lo : '') + (hi < 55 ? ' ' + hi + '~60' : '') + ' ℃)는 AI가 <b>추측</b>한 값이라 틀리기 쉬워요.';
    if (Object.keys(uniq).length <= fit.degree + 1 && fit.degree >= 3) s += '<br>⚠ 차수가 높고 데이터가 적으면 점은 정확히 지나지만 점 사이에서 곡선이 이상하게 휘어질 수 있어요.';
    if (fit.degree === 1) s += '<br>직선은 너무 단순해서 휘어진 용해도 곡선을 잘 설명하지 못할 수 있어요.';
    msg.className = 'msg'; msg.innerHTML = s;
  }
  function drawPt(ctx, a, x, y) { ctx.fillStyle = '#e53935'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(a.X(x), a.Y(y), 5, 0, 6.283); ctx.fill(); ctx.stroke(); }
  $('ai-ask').addEventListener('click', function () {
    const T = +$('ai-q').value; if (!curFit) { $('ai-pred').textContent = ' AI가 아직 학습하지 못했어요(데이터 2개 이상 필요).'; return; }
    const p = curFit(T), t = C.S_K(T);
    $('ai-pred').innerHTML = ' AI 예측 <b>' + f1(p) + ' g</b> / 교과서 곡선 ' + f1(t) + ' g (차이 ' + f1(Math.abs(p - t)) + ' g)';
  });

  /* ---- 분류 ---- */
  let curBd = null;
  function renderCls() {
    const rows = rowsOf('B'), cv = $('ai-canvas2'), ctx = cv.getContext('2d'), W = cv.width, H = cv.height;
    ctx.clearRect(0, 0, W, H); const L = 40, R = W - 14, xmin = 20, xmax = 95;
    const X = function (x) { return L + (R - L) * (x - xmin) / (xmax - xmin); };
    ctx.fillStyle = '#456'; ctx.font = '12px sans-serif'; ctx.strokeStyle = '#e1e8f0';
    for (let x = 20; x <= 95; x += 10) { ctx.beginPath(); ctx.moveTo(X(x), 10); ctx.lineTo(X(x), 88); ctx.stroke(); ctx.fillText(x, X(x) - 6, 104); }
    ctx.fillText('물의 온도(℃)', W / 2 - 30, 118); ctx.fillText('녹지 않음', 2, 36); ctx.fillText('녹음', 2, 72);
    const bd = C.learnBoundary(rows.map(function (r) { return { T: r.T, melted: r.melted }; })); curBd = bd;
    if (bd && bd.separable) { ctx.fillStyle = 'rgba(255,193,7,.25)'; ctx.fillRect(X(bd.hiSolid), 10, X(bd.loLiquid) - X(bd.hiSolid), 78); }
    ctx.setLineDash([5, 4]); ctx.strokeStyle = '#2e7d32'; ctx.beginPath(); ctx.moveTo(X(C.STEARIC_MP), 8); ctx.lineTo(X(C.STEARIC_MP), 90); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = '#2e7d32'; ctx.fillText('교과서 약 69 ℃', X(C.STEARIC_MP) + 4, 20);
    if (bd && bd.separable) { ctx.strokeStyle = '#1565c0'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(X(bd.boundary), 8); ctx.lineTo(X(bd.boundary), 90); ctx.stroke(); ctx.lineWidth = 1; }
    rows.forEach(function (r) { ctx.fillStyle = r.melted ? '#ff8f00' : '#9aa5b1'; ctx.strokeStyle = '#345'; ctx.beginPath(); ctx.arc(X(r.T), r.melted ? 68 : 32, 6, 0, 6.283); ctx.fill(); ctx.stroke(); });
    const m = $('ai-cls');
    if (!rows.length) { m.className = 'msg'; m.innerHTML = '③ 탭에서 물 온도를 바꿔 가며 [기록]해 보세요. <b>녹은 경우와 녹지 않은 경우가 모두</b> 있어야 AI가 경계를 학습할 수 있어요.'; return; }
    if (!bd) { m.className = 'msg'; m.innerHTML = '지금은 한쪽 결과만 있어요(' + rows.length + '개). 다른 쪽 온도에서도 실험해 보세요.'; return; }
    if (!bd.separable) { m.className = 'msg warn'; m.innerHTML = '녹지 않은 온도(' + bd.hiSolid + ' ℃)가 녹은 온도(' + bd.loLiquid + ' ℃)보다 높거나 같은 기록이 있어요. 기록이 잘못되었는지 확인해 보세요(데이터 정제).'; return; }
    m.className = 'msg'; m.innerHTML = 'AI가 학습한 경계: <b>약 ' + f1(bd.boundary) + ' ℃</b> (녹지 않은 가장 높은 온도 ' + bd.hiSolid + ' ℃ ~ 녹은 가장 낮은 온도 ' + bd.loLiquid + ' ℃ 사이). 노란 구간이 좁을수록 AI가 더 확신해요. 교과서의 녹는점(약 69 ℃)과 비교해 보세요. 데이터를 더 모으면 구간이 어떻게 달라지나요?';
  }
  $('ai-ask2').addEventListener('click', function () {
    const T = +$('ai-q2').value, bd = curBd, o = $('ai-pred2');
    if (!bd || !bd.separable) { o.textContent = ' AI가 아직 학습하지 못했어요.'; return; }
    if (T <= bd.hiSolid) o.innerHTML = ' → <b>녹지 않은 고체</b>일 것 (확실)';
    else if (T >= bd.loLiquid) o.innerHTML = ' → <b>녹은 액체</b>일 것 (확실)';
    else o.innerHTML = ' → 경계(약 ' + f1(bd.boundary) + ' ℃) 기준으로 <b>' + (T < bd.boundary ? '녹지 않음' : '녹음') + '</b>이라고 추측하지만 <b>데이터가 없는 구간</b>이라 확실하지 않아요!';
  });

  /* ---- 분리법 추천 AI (규칙 기반 추론) ---- */
  const RULES = [
    '고체 + 고체이고 둘 다 물에 녹으며, 온도에 따른 용해도 변화의 차이가 크면(0.5 g/℃ 이상) → <b>용해도 차</b> 이용(재결정)',
    '액체 + 액체이고 서로 섞이며 끓는점 차이가 10 ℃ 이상이면 → <b>끓는점 차</b> 이용(증류)',
    '액체 + 액체이고 서로 섞이지 않으면 → <b>밀도 차</b> 이용(분별 깔때기)',
    '고체 + 액체가 서로 섞이지 않고, 고체의 녹는점이 액체의 끓는점보다 낮으면 → <b>녹는점 차</b> 이용(녹였다가 냉각해 응고)',
    '고체 + 고체이고 물에 녹지 않으며 밀도 차가 있으면 → <b>밀도 차</b> 이용(두 밀도의 중간인 액체에 넣기)',
    '위 규칙에 해당하지 않으면 → <b>추천할 수 없음</b>'
  ];
  const CASES = [
    { name: '질산 칼륨 + 황산 구리(Ⅱ)', kind: 'ss', dissolve: true, slope: 0.9, info: '둘 다 물에 녹는 고체. 0~40 ℃에서 용해도 변화: 질산 칼륨 약 1.3 g/℃, 황산 구리(Ⅱ) 약 0.35 g/℃',
      tb: '용해도 차(재결정) — 교과서 34~35쪽', verify: '황산 구리(Ⅱ)의 양을 아주 많이 넣으면 어떻게 될까요? ① 탭에서 확인해 보세요.' },
    { name: '질산 칼륨 + 염화 나트륨', kind: 'ss', dissolve: true, slope: 1.25, info: '둘 다 물에 녹는 고체. 염화 나트륨은 온도에 따른 용해도 변화가 매우 작음(교과서 그림 15)',
      tb: '용해도 차(재결정) — 교과서 35쪽 그림 15', verify: '염화 나트륨은 냉각해도 석출되지 않는 까닭을 용해도 곡선으로 설명해 보세요.' },
    { name: '물 + 에탄올', kind: 'll', miscible: true, bp: 22, info: '두 액체는 서로 잘 섞임. 끓는점: 물 100 ℃, 에탄올 약 78 ℃(차이 약 22 ℃)',
      tb: '끓는점 차(증류) — 교과서 36~37쪽', verify: '② 탭에서 증류한 시험관 1번의 에탄올은 몇 %였나요? AI의 추천만으로 "순수한 에탄올을 얻는다"고 말할 수 있을까요? (교과서 37쪽 오개념 바로잡기)' },
    { name: '물 + 식용유', kind: 'll', miscible: false, dens: 0.08, info: '두 액체는 서로 섞이지 않음. 밀도: 물 1.0 g/mL, 식용유 약 0.92 g/mL',
      tb: '밀도 차(분별 깔때기) — 교과서 32~33쪽', verify: '분별 깔때기에서 먼저 나오는 액체는 어느 쪽일까요?' },
    { name: '스테아르산 + 물', kind: 'sl', immiscible: true, mpLow: true, info: '스테아르산(고체, 녹는점 약 69 ℃)은 물에 거의 녹지 않음. 물의 끓는점 100 ℃',
      tb: '녹는점 차 — 교과서 38쪽', verify: '③ 탭에서 시험관이 뜨거울 때(80 ℃)는 어떻게 되었나요? AI의 추천에 필요한 조건은 무엇일까요?' },
    { name: '쭉정이 + 좋은 볍씨', kind: 'ss', dissolve: false, dens: 0.1, info: '물에 녹지 않는 고체 두 가지. 쭉정이 < 소금물 < 좋은 볍씨 (밀도)',
      tb: '밀도 차(소금물에 넣기) — 교과서 32쪽', verify: '이때 소금물의 밀도는 두 고체의 밀도와 어떤 관계여야 할까요?' },
    { name: '모래 + 소금', kind: 'ss', dissolve: 'one', info: '모래는 물에 녹지 않고, 소금은 물에 녹음',
      tb: '물에 녹는 성질을 이용(물에 녹인 뒤 거르고 증발) — 초등학교 5~6학년 과정', verify: 'AI가 추천하지 못한 까닭은? 이 규칙에 어떤 규칙을 더 추가하면 좋을까요?' }
  ];
  function recommend(c) {
    if (c.kind === 'ss' && c.dissolve === true && c.slope >= 0.5) return { m: '용해도 차 이용(재결정)', why: '규칙 1: 둘 다 물에 녹는 고체이고, 온도에 따른 용해도 변화 차이가 ' + c.slope + ' g/℃(0.5 이상)입니다.' };
    if (c.kind === 'll' && c.miscible && c.bp >= 10) return { m: '끓는점 차 이용(증류)', why: '규칙 2: 두 액체가 서로 섞이고 끓는점 차이가 약 ' + c.bp + ' ℃(10 이상)입니다. 끓는점이 낮은 물질이 먼저 끓어 나옵니다.' };
    if (c.kind === 'll' && c.miscible === false) return { m: '밀도 차 이용(분별 깔때기)', why: '규칙 3: 두 액체가 서로 섞이지 않고 밀도 차이(' + c.dens + ' g/mL)가 있습니다.' };
    if (c.kind === 'sl' && c.immiscible && c.mpLow) return { m: '녹는점 차 이용', why: '규칙 4: 고체가 물에 섞이지 않고, 고체의 녹는점이 물의 끓는점보다 낮습니다. 녹인 뒤 냉각하면 먼저 응고합니다.' };
    if (c.kind === 'ss' && c.dissolve === false && c.dens) return { m: '밀도 차 이용', why: '규칙 5: 물에 녹지 않는 고체이고 밀도 차이가 있습니다.' };
    return { m: '추천할 수 없음', why: '어떤 규칙에도 해당하지 않아요. (한 성분만 물에 녹는 경우는 규칙에 없어요.)' };
  }
  (function buildRules() {
    $('ai-rules').innerHTML = RULES.map(function (r) { return '<li>' + r + '</li>'; }).join('');
    let h = '';
    CASES.forEach(function (c, i) {
      h += '<div class="case" id="case' + i + '"><h3>사례 ' + (i + 1) + '. ' + c.name + '</h3><div class="why">' + c.info + '</div>' +
        '<button class="btn small" data-rec="' + i + '">🤖 AI에게 추천받기</button><div class="out"></div></div>';
    });
    $('ai-cases').innerHTML = h;
  })();
  $('ai-cases').addEventListener('click', function (e) {
    const t = e.target, r = t.getAttribute('data-rec'), v = t.getAttribute('data-ver'), g = t.getAttribute('data-go');
    if (r !== null) {
      const c = CASES[+r], a = recommend(c), box = document.querySelector('#case' + r + ' .out');
      box.innerHTML = '<div class="ai"><b>AI 추천:</b> ' + a.m + '<br><span class="why">근거 — ' + a.why + '</span></div>' +
        '<div>이 추천을 교과서와 비교하면?</div><label class="inline"><input type="radio" name="v' + r + '" data-ver="' + r + '"> 교과서와 일치</label>' +
        '<label class="inline"><input type="radio" name="v' + r + '" data-ver="' + r + '"> 일치하지만 빠진 설명이 있다</label>' +
        '<label class="inline"><input type="radio" name="v' + r + '" data-ver="' + r + '"> 교과서와 다르다 / AI가 답하지 못했다</label><div class="vbox"></div>';
    }
    if (v !== null) {
      const c = CASES[+v], box = document.querySelector('#case' + v + ' .vbox');
      box.innerHTML = '<div class="msg ok"><b>교과서 확인:</b> ' + c.tb + '<br><b>생각해 보기:</b> ' + c.verify + (c.kind === 'll' && c.miscible ? ' <button class="btn small ghost" data-go="c">② 탭으로 가기</button>' : '') + '</div>';
    }
    if (g) showTab(g);
  });

  /* ---------- 시작 ---------- */
  aReset(false); aRender(); cInfo(); cRender(true); renderAI();
})();
