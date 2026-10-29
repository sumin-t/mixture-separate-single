/* ===== 수민T의 과학 실험실 · 혼합물 분리 가상 실험실 : 계산 모듈 =====
   (브라우저/노드 공용, DOM에 의존하지 않음) */
(function (root) {
  'use strict';

  /* ---------- 단조 3차 보간(PCHIP) ---------- */
  function pchip(xs, ys) {
    const n = xs.length, h = [], d = [], m = new Array(n);
    for (let i = 0; i < n - 1; i++) { h[i] = xs[i + 1] - xs[i]; d[i] = (ys[i + 1] - ys[i]) / h[i]; }
    m[0] = d[0]; m[n - 1] = d[n - 2];
    for (let i = 1; i < n - 1; i++) {
      if (d[i - 1] * d[i] <= 0) m[i] = 0;
      else { const w1 = 2 * h[i] + h[i - 1], w2 = h[i] + 2 * h[i - 1]; m[i] = (w1 + w2) / (w1 / d[i - 1] + w2 / d[i]); }
    }
    return function (x) {
      if (x <= xs[0]) return ys[0];
      if (x >= xs[n - 1]) return ys[n - 1];
      let i = 0; while (x > xs[i + 1]) i++;
      const t = (x - xs[i]) / h[i], t2 = t * t, t3 = t2 * t;
      return (2 * t3 - 3 * t2 + 1) * ys[i] + (t3 - 2 * t2 + t) * h[i] * m[i] +
             (-2 * t3 + 3 * t2) * ys[i + 1] + (t3 - t2) * h[i] * m[i + 1];
    };
  }

  /* ---------- 용해도 자료 (g / 물 100 g) ---------- */
  const SOL_T = [0, 10, 20, 30, 40, 50, 60];
  const SOL_KNO3 = [13.3, 20.9, 31.6, 45.8, 63.9, 85.5, 110.0];   // 질산 칼륨
  const SOL_CUSO4 = [14.3, 17.4, 20.7, 25.0, 28.5, 33.3, 40.0];   // 황산 구리(Ⅱ), 무수물 기준
  const S_K = pchip(SOL_T, SOL_KNO3);
  const S_CU = pchip(SOL_T, SOL_CUSO4);

  // 용질 amount g 이 물 100 g 에서 포화되는 온도(냉각할 때 첫 결정이 생기는 온도). 0 ℃ 이하까지 포화되지 않으면 null
  function satTemp(fn, amount, Tmax) {
    Tmax = Tmax == null ? 60 : Tmax;
    if (amount <= 0) return null;
    if (fn(0) >= amount) return null;
    if (fn(Tmax) < amount) return Infinity;
    let lo = 0, hi = Tmax;
    for (let i = 0; i < 60; i++) { const mid = (lo + hi) / 2; if (fn(mid) < amount) lo = mid; else hi = mid; }
    return (lo + hi) / 2;
  }

  function calcA(inK, inCu, T) {
    const sK = S_K(T), sCu = S_CU(T);
    const precK = Math.max(0, inK - sK), precCu = Math.max(0, inCu - sCu);
    return {
      T: T, sK: sK, sCu: sCu, inK: inK, inCu: inCu,
      precK: precK, precCu: precCu,
      dissK: inK - precK, dissCu: inCu - precCu,
      purity: (precK + precCu) > 0 ? precK / (precK + precCu) : null,
      satK: satTemp(S_K, inK, 40), satCu: satTemp(S_CU, inCu, 40)
    };
  }

  /* ---------- 다항 회귀 (AI '학습') ---------- */
  function solveLinear(A, b) {
    const n = b.length;
    for (let i = 0; i < n; i++) {
      let p = i;
      for (let r = i + 1; r < n; r++) if (Math.abs(A[r][i]) > Math.abs(A[p][i])) p = r;
      [A[i], A[p]] = [A[p], A[i]]; [b[i], b[p]] = [b[p], b[i]];
      const piv = A[i][i] || 1e-12;
      for (let r = i + 1; r < n; r++) {
        const f = A[r][i] / piv;
        for (let c = i; c < n; c++) A[r][c] -= f * A[i][c];
        b[r] -= f * b[i];
      }
    }
    const x = new Array(n).fill(0);
    for (let i = n - 1; i >= 0; i--) {
      let s = b[i];
      for (let c = i + 1; c < n; c++) s -= A[i][c] * x[c];
      x[i] = s / (A[i][i] || 1e-12);
    }
    return x;
  }
  function polyfit(xs, ys, deg, scale) {
    scale = scale || 60;
    deg = Math.max(0, Math.min(deg, xs.length - 1));
    const n = deg + 1, A = [], b = [];
    for (let i = 0; i < n; i++) { A.push(new Array(n).fill(0)); b.push(0); }
    for (let k = 0; k < xs.length; k++) {
      const u = xs[k] / scale; const pw = [1];
      for (let i = 1; i < 2 * n; i++) pw[i] = pw[i - 1] * u;
      for (let i = 0; i < n; i++) { b[i] += pw[i] * ys[k]; for (let j = 0; j < n; j++) A[i][j] += pw[i + j]; }
    }
    const c = solveLinear(A, b);
    const f = function (x) { const u = x / scale; let s = 0, p = 1; for (let i = 0; i < c.length; i++) { s += c[i] * p; p *= u; } return s; };
    f.degree = deg; f.coef = c;
    return f;
  }
  function rmse(f, truth, xs) { let s = 0; xs.forEach(function (x) { const e = f(x) - truth(x); s += e * e; }); return Math.sqrt(s / xs.length); }

  /* ---------- 상태 경계 학습 (스테아르산) ---------- */
  const STEARIC_MP = 69; // 교과서: 약 69 ℃
  function learnBoundary(rows) { // rows: {T, melted(0/1)}
    const solid = rows.filter(function (r) { return !r.melted; }).map(function (r) { return r.T; });
    const liquid = rows.filter(function (r) { return r.melted; }).map(function (r) { return r.T; });
    if (!solid.length || !liquid.length) return null;
    const hiSolid = Math.max.apply(null, solid), loLiquid = Math.min.apply(null, liquid);
    const separable = hiSolid < loLiquid;
    return { hiSolid: hiSolid, loLiquid: loLiquid, boundary: (hiSolid + loLiquid) / 2, separable: separable, n: rows.length };
  }

  /* ---------- 물-에탄올 증류 모델 ---------- */
  // 1기압 물-에탄올 기-액 평형(에탄올 몰분율). 문헌의 대표 자료를 보간해 사용(정성적 표현 목적)
  const VX = [0, 0.019, 0.0721, 0.0966, 0.1238, 0.1661, 0.2337, 0.2608, 0.3273, 0.3965, 0.5079, 0.5198, 0.5732, 0.6763, 0.7472, 0.8943, 1.0];
  const VT = [100, 95.5, 89.0, 86.7, 85.3, 84.1, 82.7, 82.3, 81.5, 80.7, 79.8, 79.7, 79.3, 78.74, 78.41, 78.15, 78.3];
  const VY = [0, 0.170, 0.3891, 0.4375, 0.4704, 0.5089, 0.5445, 0.5580, 0.5826, 0.6122, 0.6564, 0.6599, 0.6841, 0.7385, 0.7815, 0.8943, 1.0];
  const Tbub = pchip(VX, VT), Yvap = pchip(VX, VY);
  const M_E = 46.07, M_W = 18.015, RHO_E = 0.789, RHO_W = 0.998;
  const volOf = function (nE, nW) { return nE * M_E / RHO_E + nW * M_W / RHO_W; };
  const ethVolPct = function (nE, nW) { const v = volOf(nE, nW); return v > 0 ? 100 * (nE * M_E / RHO_E) / v : 0; };

  function makeStill(opt) {
    const s = {
      nE: opt.mlE * RHO_E / M_E, nW: opt.mlW * RHO_W / M_W,
      power: opt.power || 100,       // W (가열 세기)
      chips: opt.chips !== false, cooling: opt.cooling !== false,
      autoVol: opt.autoVol || 0,
      t: 0, T: 20, boiling: false, bumped: false, done: false, msg: [],
      tubes: [{ nE: 0, nW: 0, Tsum: 0, steps: 0 }], cur: 0, lost: { nE: 0, nW: 0 },
      curve: [{ t: 0, T: 20 }], _nextLog: 10
    };
    s.step = function (dt) {
      if (s.done) return;
      const nTot = s.nE + s.nW;
      if (volOf(s.nE, s.nW) < 3) { s.done = true; s.msg.push('플라스크의 액체가 거의 남지 않아 가열을 멈췄습니다. (실제 실험에서도 플라스크를 말리면 위험합니다.)'); return; }
      const x = s.nE / nTot, Tb = Tbub(x);
      const C = (s.nE * M_E) * 2.44 + (s.nW * M_W) * 4.18 + 50;   // J/K (액체 + 유리)
      let Q = s.power * 0.7 * dt;                                    // J
      const lim = s.chips ? Tb : Tb + 3;                              // 끓임쪽이 없으면 과열 후 돌비
      if (!s.boiling) {
        if (s.T < lim) {
          const need = C * (lim - s.T);
          if (Q < need) { s.T += Q / C; Q = 0; } else { Q -= need; s.T = lim; }
        }
        if (s.T >= lim) {
          s.boiling = true;
          if (!s.chips && !s.bumped) {
            s.bumped = true;
            const f = Math.min(0.5, 1.5 / volOf(s.nE, s.nW));
            const dE = s.nE * f, dW = s.nW * f; s.nE -= dE; s.nW -= dW;
            const tb = s.tubes[s.cur]; tb.nE += dE; tb.nW += dW; tb.bump = true;
            s.msg.push('끓임쪽이 없어서 액체가 갑자기 끓어 넘쳤습니다(돌비)! 끓은 액체가 시험관으로 튀어 증류액이 오염되고 위험합니다.');
            s.T = Tbub(s.nE / (s.nE + s.nW));
          }
        }
      }
      if (s.boiling && Q > 0) {
        const xx = s.nE / (s.nE + s.nW), y = Yvap(xx);
        const dH = y * 38600 + (1 - y) * 40700;              // J/mol (증발 엔탈피)
        let dn = Math.min(Q / dH, 0.4 * (s.nE + s.nW));
        const dE = Math.min(y * dn, s.nE), dW = Math.min((1 - y) * dn, s.nW);
        s.nE -= dE; s.nW -= dW;
        if (s.cooling) {
          const tb = s.tubes[s.cur]; tb.nE += dE; tb.nW += dW; tb.Tsum += s.T; tb.steps++;
          if (s.autoVol > 0 && volOf(tb.nE, tb.nW) >= s.autoVol && s.cur < 11) { s.tubes.push({ nE: 0, nW: 0, Tsum: 0, steps: 0 }); s.cur++; }
        } else {
          s.lost.nE += dE; s.lost.nW += dW;
          if (!s._warnCool) { s._warnCool = true; s.msg.push('냉각수가 없어 증기가 액체로 되지 못하고 밖으로 빠져나갑니다! 에탄올 증기는 불이 붙기 쉬워 위험합니다.'); }
        }
        s.T = Tbub(s.nE / (s.nE + s.nW));
      }
      s.t += dt;
      while (s.t >= s._nextLog) { s.curve.push({ t: s._nextLog, T: s.T }); s._nextLog += 10; }
    };
    s.newTube = function () { if (s.tubes[s.cur].nE + s.tubes[s.cur].nW > 0 && s.cur < 11) { s.tubes.push({ nE: 0, nW: 0, Tsum: 0, steps: 0 }); s.cur++; return true; } return false; };
    s.flask = function () { return { vol: volOf(s.nE, s.nW), eth: ethVolPct(s.nE, s.nW), x: s.nE / (s.nE + s.nW) }; };
    return s;
  }

  // 가열 곡선을 기울기에 따라 구간으로 나누기 (AI가 하는 '데이터 분석')
  function segmentCurve(curve) {
    const W = 6, out = [];                                   // 60 가상초 창
    const pts = curve.filter(function (_, i) { return i % 1 === 0; });
    const lab = [];
    for (let i = 0; i < pts.length; i++) {
      const a = pts[Math.max(0, i - W / 2)], b = pts[Math.min(pts.length - 1, i + W / 2)];
      const sl = (b.T - a.T) / Math.max(1e-9, (b.t - a.t) / 60);   // ℃/분
      lab.push(sl > 3 ? 'rise' : (sl > 0.12 ? 'slow' : 'flat'));
    }
    let start = 0;
    for (let i = 1; i <= pts.length; i++) {
      if (i === pts.length || lab[i] !== lab[start]) {
        if (i - start >= 3) out.push({ type: lab[start], t0: pts[start].t, t1: pts[i - 1].t, T0: pts[start].T, T1: pts[i - 1].T });
        start = i;
      }
    }
    // 이웃한 같은 종류 병합
    const merged = [];
    out.forEach(function (g) {
      if (g.type === 'slow' && g.T0 >= 97) g.type = 'flat';          // 100 ℃ 에 가까워지는 마지막 구간은 '일정' 구간에 포함
      const l = merged[merged.length - 1];
      if (l && l.type === g.type) { l.t1 = g.t1; l.T1 = g.T1; } else merged.push(g);
    });
    return merged;
  }

  const api = {
    pchip: pchip, S_K: S_K, S_CU: S_CU, SOL_T: SOL_T, SOL_KNO3: SOL_KNO3, SOL_CUSO4: SOL_CUSO4,
    satTemp: satTemp, calcA: calcA, polyfit: polyfit, rmse: rmse, learnBoundary: learnBoundary, STEARIC_MP: STEARIC_MP,
    Tbub: Tbub, Yvap: Yvap, makeStill: makeStill, volOf: volOf, ethVolPct: ethVolPct, segmentCurve: segmentCurve,
    M_E: M_E, M_W: M_W, RHO_E: RHO_E, RHO_W: RHO_W
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.MixCore = api;
})(typeof window !== 'undefined' ? window : globalThis);
