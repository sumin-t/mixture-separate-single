/* ===== 수민T의 과학 실험실 · 교사용 결과 모아보기 ===== */
(function () {
  'use strict';
  const C = window.MixCore;
  const API = (window.MIXLAB_CONFIG && window.MIXLAB_CONFIG.API_URL) || '';
  const $ = function (id) { return document.getElementById(id); };
  const PAL = ['#2a6fb0', '#e07b00', '#2e9d6a', '#8e44ad', '#c0392b', '#16a2b8', '#7f8c8d', '#c9a000'];
  const FONT = '13px "IBM Plex Sans KR","Noto Sans KR",sans-serif';
  const qs = new URLSearchParams(location.search);
  let ROWS = [], PW = '', DEMO = false;

  /* ---------- 불러오기 ---------- */
  function num(v) { return v === '' || v == null ? null : Number(v); }
  function clean(rows) {
    return rows.map(function (r) {
      return { cls: +r['반'], num: +r['번호'], exp: r['실험'], id: String(r.id),
        T: num(r.T), inK: num(r.inK), inCu: num(r.inCu), sK: num(r.sK), sCu: num(r.sCu), precK: num(r.precK), precCu: num(r.precCu),
        tubeT: num(r.tubeT), melted: +r.melted ? 1 : 0, film: +r.film ? 1 : 0,
        tube: num(r.tube), E: num(r.E), W: num(r.W), vol: num(r.vol), eth: num(r.eth), avgT: num(r.avgT),
        pw: num(r.pw), ch: num(r.ch), co: num(r.co), au: num(r.au) };
    }).filter(function (r) { return r.cls >= 1 && r.num >= 1 && /^[ABC]$/.test(r.exp); });
  }
  function load() {
    $('upd').textContent = '불러오는 중…';
    if (DEMO) { ROWS = demoRows(); $('upd').textContent = '예시 데이터'; refresh(); return Promise.resolve(); }
    if (!API) { $('upd').textContent = 'config.js에 API_URL이 비어 있어요.'; return Promise.resolve(); }
    return fetch(API + '?d=' + encodeURIComponent(JSON.stringify({ action: 'read', pw: PW })))
      .then(function (r) { return r.json(); })
      .then(function (j) {
        if (!j.ok) throw new Error(j.err || 'fail');
        ROWS = clean(j.rows);
        const d = new Date(); $('upd').textContent = d.getHours() + ':' + ('0' + d.getMinutes()).slice(-2) + ' 기준 · 기록 ' + ROWS.length + '건';
        refresh();
      });
  }

  /* ---------- 예시 데이터(?demo=1) ---------- */
  function demoRows() {
    let seed = 7; const rnd = function () { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    const out = []; let id = 0;
    [1, 2, 3].forEach(function (cls) {
      const n = 10 + Math.floor(rnd() * 8);
      for (let num = 1; num <= n; num++) {
        const base = { cls: cls, num: num, id: 'd' + (id++) };
        for (let k = 0; k < 3; k++) {
          const inK = [20, 25, 30, 35, 40][Math.floor(rnd() * 5)], inCu = [0, 1, 5, 10, 20, 25][Math.floor(rnd() * 6)], T = [10, 15, 20, 25, 30, 35][Math.floor(rnd() * 6)];
          const a = C.calcA(inK, inCu, T);
          out.push(Object.assign({}, base, { id: 'a' + (id++), exp: 'A', inK: inK, inCu: inCu, T: T, sK: +a.sK.toFixed(1), sCu: +a.sCu.toFixed(1), precK: +a.precK.toFixed(1), precCu: +a.precCu.toFixed(1) }));
        }
        for (let k = 0; k < 3; k++) {
          const T = [40, 50, 60, 65, 70, 75, 80][Math.floor(rnd() * 7)], tubeT = [5, 25, 50][Math.floor(rnd() * 3)];
          const m = T >= C.STEARIC_MP ? 1 : 0;
          out.push(Object.assign({}, base, { id: 'b' + (id++), exp: 'B', T: T, tubeT: tubeT, melted: m, film: m && tubeT < C.STEARIC_MP ? 1 : 0 }));
        }
        const pw = [60, 100, 150][Math.floor(rnd() * 3)], co = rnd() < .85 ? 1 : 0, E = [10, 20, 30][Math.floor(rnd() * 3)], W = [10, 20, 30, 40][Math.floor(rnd() * 4)];
        for (let t = 1; t <= 4; t++) {
          const eth = Math.max(0, Math.min(100, Math.round(92 - t * 17 + (rnd() - .5) * 14 - (pw === 150 ? 8 : 0))));
          out.push(Object.assign({}, base, { id: 'c' + (id++), exp: 'C', tube: t, E: E, W: W, vol: 5, eth: eth, avgT: +(78.5 + t * 3 + rnd()).toFixed(1), pw: pw, ch: 1, co: co, au: 5 }));
        }
      }
    });
    return out;
  }

  /* ---------- 그리기 도구 ---------- */
  function hd(cv, w, h) {
    const S = Math.max(2, Math.min(3, window.devicePixelRatio || 1));
    cv.width = w * S; cv.height = h * S;
    const ctx = cv.getContext('2d'); ctx.setTransform(S, 0, 0, S, 0, 0); return ctx;
  }
  function axes(ctx, W, H, o) {
    const L = 62, R = W - 16, Tp = 18, Bt = H - 48;
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H);
    const X = function (x) { return L + (R - L) * (x - o.x0) / (o.x1 - o.x0); }, Y = function (y) { return Bt - (Bt - Tp) * (y - o.y0) / (o.y1 - o.y0); };
    ctx.font = FONT; ctx.lineWidth = 1;
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    (o.xt || []).forEach(function (x) { ctx.strokeStyle = '#D3DCE1'; ctx.beginPath(); ctx.moveTo(X(x), Tp); ctx.lineTo(X(x), Bt); ctx.stroke(); ctx.fillStyle = '#13232C'; ctx.fillText(o.xl ? o.xl(x) : x, X(x), Bt + 6); });
    ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    (o.yt || []).forEach(function (y) { ctx.strokeStyle = '#D3DCE1'; ctx.beginPath(); ctx.moveTo(L, Y(y)); ctx.lineTo(R, Y(y)); ctx.stroke(); ctx.fillStyle = '#13232C'; ctx.fillText(y, L - 6, Y(y)); });
    ctx.strokeStyle = '#13232C'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(L, Tp); ctx.lineTo(L, Bt); ctx.lineTo(R, Bt); ctx.stroke();
    ctx.fillStyle = '#13232C'; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom'; ctx.fillText(o.xn || '', (L + R) / 2, H - 4);
    ctx.save(); ctx.translate(14, (Tp + Bt) / 2); ctx.rotate(-Math.PI / 2); ctx.textBaseline = 'top'; ctx.fillText(o.yn || '', 0, 0); ctx.restore();
    return { X: X, Y: Y, L: L, R: R, Tp: Tp, Bt: Bt };
  }
  function dot(ctx, x, y, col, r) { ctx.fillStyle = col; ctx.globalAlpha = .6; ctx.beginPath(); ctx.arc(x, y, r || 5.5, 0, 6.283); ctx.fill(); ctx.globalAlpha = 1; ctx.strokeStyle = col; ctx.lineWidth = 1; ctx.stroke(); }
  function jit(i, amp) { return ((i * 2654435761 % 1000) / 1000 - .5) * amp; }
  function empty(ctx, W, H) { ctx.fillStyle = '#6b7c86'; ctx.font = '15px "IBM Plex Sans KR",sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('아직 기록이 없어요', W / 2, H / 2); }
  function colorOf(r, mode) { return mode === 'cls' ? PAL[(r.cls - 1) % PAL.length] : '#2a6fb0'; }
  function legend(el, sel, rows) {
    if (sel !== 'all') { $(el).innerHTML = ''; return; }
    const cs = Array.from(new Set(rows.map(function (r) { return r.cls; }))).sort(function (a, b) { return a - b; });
    $(el).innerHTML = cs.map(function (c) { return '<i style="background:' + PAL[(c - 1) % PAL.length] + '"></i>' + c + '반'; }).join('');
  }
  const mean = function (a) { return a.length ? a.reduce(function (s, v) { return s + v; }, 0) / a.length : null; };
  const f1 = function (v) { return v == null ? '-' : (Math.round(v * 10) / 10).toString(); };
  const pct = function (a, b) { return b ? Math.round(100 * a / b) + '%' : '-'; };

  /* ---------- 화면 갱신 ---------- */
  function sel() { return $('cls').value; }
  function pick(exp) { const s = sel(); return ROWS.filter(function (r) { return r.exp === exp && (s === 'all' || String(r.cls) === s); }); }

  function fillClassSelect() {
    const cs = Array.from(new Set(ROWS.map(function (r) { return r.cls; }))).sort(function (a, b) { return a - b; });
    const cur = $('cls').value || 'all';
    $('cls').innerHTML = '<option value="all">전체(반별 색 구분)</option>' + cs.map(function (c) { return '<option value="' + c + '">' + c + '반</option>'; }).join('');
    $('cls').value = cs.map(String).concat('all').indexOf(cur) >= 0 ? cur : 'all';
  }

  function statCards() {
    const s = sel(), rows = ROWS.filter(function (r) { return s === 'all' || String(r.cls) === s; });
    const stu = new Set(rows.map(function (r) { return r.cls + '-' + r.num; }));
    const by = function (e) { return rows.filter(function (r) { return r.exp === e; }).length; };
    const byStu = function (e) { return new Set(rows.filter(function (r) { return r.exp === e; }).map(function (r) { return r.cls + '-' + r.num; })).size; };
    let h = '<div><b>' + stu.size + '명</b>참여 학생</div>';
    [['A', '① 용해도'], ['C', '② 끓는점'], ['B', '③ 녹는점']].forEach(function (p) { h += '<div><b>' + by(p[0]) + '건</b>' + p[1] + ' 기록 (' + byStu(p[0]) + '명)</div>'; });
    $('stat').innerHTML = h;
    if (s === 'all') {
      const cs = Array.from(new Set(ROWS.map(function (r) { return r.cls; }))).sort(function (a, b) { return a - b; });
      if (cs.length > 1) {
        let t = '<table style="margin-top:10px"><tr><th>반</th><th>참여 학생</th><th>① 기록</th><th>② 기록</th><th>③ 기록</th></tr>';
        cs.forEach(function (c) {
          const rr = ROWS.filter(function (r) { return r.cls === c; });
          t += '<tr><td style="color:' + PAL[(c - 1) % PAL.length] + ';font-weight:700">' + c + '반</td><td>' + new Set(rr.map(function (r) { return r.num; })).size + '명</td>' +
            ['A', 'C', 'B'].map(function (e) { return '<td>' + rr.filter(function (r) { return r.exp === e; }).length + '</td>'; }).join('') + '</tr>';
        });
        $('stat').insertAdjacentHTML('beforeend', '<div style="flex-basis:100%;border:0;padding:0;background:none">' + t + '</table></div>');
      }
    }
  }

  function drawA() {
    const rows = pick('A'), mode = sel() === 'all' ? 'cls' : 'one'; legend('lg-a', sel(), rows);
    /* 1) 온도-용해도 점 + 교과서 곡선 */
    let W = 680, H = 340, ctx = hd($('g-a1'), W, H);
    let a = axes(ctx, W, H, { x0: 0, x1: 60, y0: 0, y1: 120, xt: [0, 10, 20, 30, 40, 50, 60], yt: [0, 20, 40, 60, 80, 100, 120], xn: '온도(℃)', yn: '질산 칼륨 용해도(g/물 100 g)' });
    ctx.strokeStyle = '#13232C'; ctx.lineWidth = 2; ctx.beginPath();
    for (let t = 0; t <= 60; t += 1) { const x = a.X(t), y = a.Y(C.S_K(t)); if (t === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); }
    ctx.stroke();
    ctx.fillStyle = '#13232C'; ctx.textAlign = 'left'; ctx.textBaseline = 'bottom'; ctx.fillText('교과서 곡선', a.X(38), a.Y(C.S_K(38)) - 8);
    rows.forEach(function (r, i) { dot(ctx, a.X(r.T), a.Y(r.sK), colorOf(r, mode)); });
    if (!rows.length) empty(ctx, W, H);
    /* 2) 질산 칼륨 넣은 양-온도 별 석출량 (온도 구간별 평균 석출량) */
    W = 480; H = 320; ctx = hd($('g-a2'), W, H);
    a = axes(ctx, W, H, { x0: 5, x1: 40, y0: 0, y1: 40, xt: [10, 15, 20, 25, 30, 35, 40], yt: [0, 10, 20, 30, 40], xn: '온도(℃)', yn: '질산 칼륨 석출량(g)' });
    rows.forEach(function (r) { dot(ctx, a.X(r.T) + jit(Math.round(r.inK * 7 + r.inCu), 8), a.Y(Math.min(40, r.precK)), colorOf(r, mode), 4.5); });
    if (!rows.length) empty(ctx, W, H);
    /* 3) 황산 구리 넣은 양 vs 황산 구리 석출량 */
    ctx = hd($('g-a3'), W, H);
    a = axes(ctx, W, H, { x0: 0, x1: 25, y0: 0, y1: 25, xt: [0, 5, 10, 15, 20, 25], yt: [0, 5, 10, 15, 20, 25], xn: '황산 구리 넣은 양(g)', yn: '황산 구리 석출량(g)' });
    rows.forEach(function (r) { dot(ctx, a.X(r.inCu) + jit(Math.round(r.T * 3 + r.inK), 8), a.Y(Math.min(25, r.precCu)), r.precCu > 0 ? '#c0392b' : '#2e9d6a', 4.5); });
    if (!rows.length) empty(ctx, W, H);
    const pure = rows.filter(function (r) { return r.precK > 0 && r.precCu === 0; }).length, kp = rows.filter(function (r) { return r.precK > 0; }).length;
    $('msg-a').innerHTML = rows.length ? '질산 칼륨 결정이 생긴 기록 <b>' + kp + '건</b> 중 푸른 황산 구리 결정이 섞이지 않은 기록은 <b>' + pure + '건(' + pct(pure, kp) + ')</b>이에요. 오른쪽 아래 그래프에서 <span style="color:#2e9d6a;font-weight:700">초록 점</span>은 황산 구리가 석출되지 않은 경우, <span style="color:#c0392b;font-weight:700">빨간 점</span>은 푸른 결정이 섞인 경우예요. 황산 구리를 많이 넣고 너무 낮은 온도까지 식히면 빨간 점이 나타나요.' : '아직 이 실험의 기록이 없어요.';
  }

  function drawC() {
    const rows = pick('C'), mode = sel() === 'all' ? 'cls' : 'one'; legend('lg-c', sel(), rows);
    const W = 680, H = 340, ctx = hd($('g-c1'), W, H);
    const maxT = Math.max(4, rows.reduce(function (m, r) { return Math.max(m, r.tube || 0); }, 0));
    const xt = []; for (let i = 1; i <= maxT; i++) xt.push(i);
    const a = axes(ctx, W, H, { x0: .5, x1: maxT + .5, y0: 0, y1: 100, xt: xt, yt: [0, 20, 40, 60, 80, 100], xl: function (x) { return x + '번 시험관'; }, xn: '받은 순서(시험관 번호)', yn: '에탄올 함량(부피 %)' });
    rows.forEach(function (r) { if (r.tube != null) dot(ctx, a.X(r.tube) + jit(r.num * 31 + r.cls, 34), a.Y(r.eth), colorOf(r, mode), 5); });
    ctx.strokeStyle = '#13232C'; ctx.lineWidth = 2.5; ctx.beginPath(); let first = true;
    xt.forEach(function (t) { const v = mean(rows.filter(function (r) { return r.tube === t; }).map(function (r) { return r.eth; })); if (v != null) { const x = a.X(t), y = a.Y(v); if (first) { ctx.moveTo(x, y); first = false; } else ctx.lineTo(x, y); } });
    ctx.stroke();
    xt.forEach(function (t) { const v = mean(rows.filter(function (r) { return r.tube === t; }).map(function (r) { return r.eth; })); if (v != null) { ctx.fillStyle = '#13232C'; ctx.beginPath(); ctx.arc(a.X(t), a.Y(v), 5, 0, 6.283); ctx.fill(); } });
    if (!rows.length) empty(ctx, W, H);
    /* 조건별 표: 1번 시험관 평균 에탄올 % */
    const first1 = rows.filter(function (r) { return r.tube === 1; });
    const grp = function (name, key, labels) {
      let h = '<tr><th colspan="3" style="text-align:left">' + name + '</th></tr>';
      labels.forEach(function (p) { const g = first1.filter(function (r) { return String(r[key]) === String(p[0]); }); h += '<tr><td>' + p[1] + '</td><td>' + g.length + '명</td><td>' + (g.length ? f1(mean(g.map(function (r) { return r.eth; }))) + ' %' : '-') + '</td></tr>'; });
      return h;
    };
    $('tb-c').innerHTML = '<p class="hint" style="margin-bottom:0">조건에 따라 1번 시험관(가장 먼저 받은 액체)의 에탄올 평균이 어떻게 달라지는지 비교해 보세요.</p><table><tr><th>학생이 고른 조건</th><th>기록 수</th><th>1번 시험관 평균</th></tr>' +
      grp('가열 세기', 'pw', [[60, '약'], [100, '중'], [150, '강']]) + grp('냉각수', 'co', [[1, '흘려 줌'], [0, '끔']]) + grp('끓임쪽', 'ch', [[1, '넣음'], [0, '안 넣음']]) + '</table>';
    const m1 = mean(first1.map(function (r) { return r.eth; })), last = xt[xt.length - 1], ml = mean(rows.filter(function (r) { return r.tube === last; }).map(function (r) { return r.eth; }));
    $('msg-c').innerHTML = rows.length ? '1번 시험관 평균 에탄올 <b>' + f1(m1) + ' %</b>, ' + last + '번 시험관 평균 <b>' + f1(ml) + ' %</b>예요. 끓는점이 낮은 에탄올이 먼저 많이 나오므로 번호가 커질수록 에탄올 비율이 줄어드는 경향이 나타나야 해요. 점이 넓게 흩어져 있다면 학생들이 고른 처음 에탄올·물의 양이나 가열 세기 때문일 수 있어요.' : '아직 이 실험의 기록이 없어요.';
  }

  function drawB() {
    const rows = pick('B');
    let W = 680, H = 320, ctx = hd($('g-b1'), W, H);
    const Ts = Array.from(new Set(rows.map(function (r) { return r.T; }))).sort(function (a, b) { return a - b; });
    const lo = Ts.length ? Math.min(40, Ts[0]) : 40, hi = Ts.length ? Math.max(80, Ts[Ts.length - 1]) : 80;
    const xt = []; for (let t = Math.ceil(lo / 10) * 10; t <= hi; t += 10) xt.push(t);
    let maxN = 1; const bins = {};
    rows.forEach(function (r) { const k = Math.round(r.T / 5) * 5; bins[k] = bins[k] || [0, 0]; bins[k][r.melted ? 0 : 1]++; maxN = Math.max(maxN, bins[k][0] + bins[k][1]); });
    maxN = Math.ceil(maxN / 5) * 5 || 5;
    const step = maxN > 20 ? 10 : 5, yt = []; for (let y = 0; y <= maxN; y += step) yt.push(y);
    let a = axes(ctx, W, H, { x0: lo - 2.5, x1: hi + 2.5, y0: 0, y1: maxN, xt: xt, yt: yt, xn: '물 온도(℃)', yn: '기록 수' });
    const bw = (a.X(5) - a.X(0)) * .8;
    Object.keys(bins).forEach(function (k) {
      const x = a.X(+k) - bw / 2, m = bins[k][0], n = bins[k][1];
      ctx.fillStyle = '#e07b00'; ctx.fillRect(x, a.Y(m), bw, a.Bt - a.Y(m));
      ctx.fillStyle = '#9db3c0'; ctx.fillRect(x, a.Y(m + n), bw, a.Y(m) - a.Y(m + n));
    });
    const mpx = a.X(C.STEARIC_MP); ctx.setLineDash([6, 4]); ctx.strokeStyle = '#13232C'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(mpx, a.Tp); ctx.lineTo(mpx, a.Bt); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = '#13232C'; ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText('스테아르산 녹는점 약 ' + C.STEARIC_MP + ' ℃', mpx + 6, a.Tp + 4);
    ctx.fillStyle = '#e07b00'; ctx.fillRect(a.L + 10, a.Tp + 6, 12, 12); ctx.fillStyle = '#13232C'; ctx.fillText('녹음', a.L + 28, a.Tp + 5);
    ctx.fillStyle = '#9db3c0'; ctx.fillRect(a.L + 10, a.Tp + 26, 12, 12); ctx.fillStyle = '#13232C'; ctx.fillText('녹지 않음', a.L + 28, a.Tp + 25);
    if (!rows.length) empty(ctx, W, H);

    /* 학생별 경계 온도 히스토그램 */
    W = 480; H = 300; ctx = hd($('g-b2'), W, H);
    const per = {}; rows.forEach(function (r) { const k = r.cls + '-' + r.num; (per[k] = per[k] || []).push({ T: r.T, melted: r.melted }); });
    const bs = []; Object.keys(per).forEach(function (k) { const b = C.learnBoundary(per[k]); if (b) bs.push(b.boundary); });
    const hist = {}; let hm = 1; bs.forEach(function (b) { const k = Math.round(b / 5) * 5; hist[k] = (hist[k] || 0) + 1; hm = Math.max(hm, hist[k]); });
    hm = Math.max(5, Math.ceil(hm / 5) * 5);
    const yt2 = []; for (let y = 0; y <= hm; y += hm > 10 ? 5 : 1) yt2.push(y);
    a = axes(ctx, W, H, { x0: 37.5, x1: 82.5, y0: 0, y1: hm, xt: [40, 50, 60, 70, 80], yt: yt2, xn: '학생이 찾은 경계 온도(℃)', yn: '학생 수' });
    const bw2 = (a.X(5) - a.X(0)) * .8;
    Object.keys(hist).forEach(function (k) { ctx.fillStyle = '#8e44ad'; ctx.fillRect(a.X(+k) - bw2 / 2, a.Y(hist[k]), bw2, a.Bt - a.Y(hist[k])); });
    ctx.setLineDash([6, 4]); ctx.strokeStyle = '#13232C'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(a.X(C.STEARIC_MP), a.Tp); ctx.lineTo(a.X(C.STEARIC_MP), a.Bt); ctx.stroke(); ctx.setLineDash([]);
    if (!bs.length) empty(ctx, W, H);

    /* 시험관 물 온도별 표 */
    const melted = rows.filter(function (r) { return r.melted; });
    let t = '<p class="hint" style="margin:0">녹은 기록에서, 시험관 속 물 온도에 따라 시험관 벽에 스테아르산이 붙은 비율</p><table><tr><th>시험관 물 온도</th><th>녹은 기록</th><th>벽에 고체가 붙음</th></tr>';
    Array.from(new Set(melted.map(function (r) { return r.tubeT; }))).sort(function (x, y) { return x - y; }).forEach(function (tt) {
      const g = melted.filter(function (r) { return r.tubeT === tt; });
      t += '<tr><td>' + tt + ' ℃</td><td>' + g.length + '</td><td>' + pct(g.filter(function (r) { return r.film; }).length, g.length) + '</td></tr>';
    });
    $('tb-b').innerHTML = melted.length ? t + '</table>' : '<p class="hint">녹은 기록이 아직 없어요.</p>';
    const ok = bs.filter(function (b) { return Math.abs(b - C.STEARIC_MP) <= 5; }).length;
    $('msg-b').innerHTML = rows.length ? '두 가지 상태를 모두 기록해서 경계 온도를 찾은 학생은 <b>' + bs.length + '명</b>이고, 그중 <b>' + ok + '명(' + pct(ok, bs.length) + ')</b>이 녹는점(약 ' + C.STEARIC_MP + ' ℃)과 ±5 ℃ 안에 들어왔어요. 학생마다 고른 온도가 달라서 경계가 넓게 퍼질 수 있어요. 녹는점 가까이를 더 촘촘히 확인하도록 안내하면 좋아요.' : '아직 이 실험의 기록이 없어요.';
  }

  function refresh() { fillClassSelect(); statCards(); drawA(); drawC(); drawB(); }

  /* ---------- 시작 ---------- */
  function enter() {
    $('gate').hidden = true; $('main').hidden = false;
    if (DEMO) $('demo-note').hidden = false;
    load().catch(function () { $('upd').textContent = '불러오지 못했어요. 인터넷 연결과 주소를 확인하세요.'; });
  }
  function tryLogin() {
    const v = $('pw').value.trim();
    if (!v) return;
    if (qs.get('demo') === '1') { DEMO = true; enter(); return; }
    if (!API) { $('gmsg').textContent = 'config.js의 API_URL이 비어 있어요. 배포 안내서를 확인하세요.'; return; }
    $('gmsg').textContent = '확인 중…';
    PW = v;
    fetch(API + '?d=' + encodeURIComponent(JSON.stringify({ action: 'read', pw: PW }))).then(function (r) { return r.json(); }).then(function (j) {
      if (j.ok) { try { sessionStorage.setItem('mixlab_t_pw', PW); } catch (e) { /* 무시 */ } ROWS = clean(j.rows); $('gate').hidden = true; $('main').hidden = false; $('upd').textContent = '기록 ' + ROWS.length + '건'; refresh(); }
      else { $('gmsg').textContent = '비밀번호가 맞지 않아요.'; }
    }).catch(function () { $('gmsg').textContent = '서버에 연결하지 못했어요.'; });
  }
  $('go').addEventListener('click', tryLogin);
  $('pw').addEventListener('keydown', function (e) { if (e.key === 'Enter') tryLogin(); });
  $('cls').addEventListener('change', function () { statCards(); drawA(); drawC(); drawB(); });
  $('reload').addEventListener('click', function () { load().catch(function () { $('upd').textContent = '불러오지 못했어요.'; }); });
  window.addEventListener('resize', function () { /* 캔버스는 CSS로 맞춤 */ });
  try { const sp = sessionStorage.getItem('mixlab_t_pw'); if (sp && qs.get('demo') !== '1') { $('pw').value = sp; if (API) tryLogin(); } } catch (e) { /* 무시 */ }
})();
