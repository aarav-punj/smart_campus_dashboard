// Smart-Campus Dashboard: data generator, CSV parser and exporter.
// Authored by Aarav (rules, evaluation) and Pankaj (generator, CSV)
(function (root) {
  function rng(a) { 
    return function () { 
      a |= 0; a = a + 0x6D2B79F5 | 0; 
      var t = Math.imul(a ^ a >>> 15, 1 | a); 
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; 
      return ((t ^ t >>> 14) >>> 0) / 4294967296; 
    }; 
  }

  var BLOCKS = [
    { name: 'Hostel A', type: 'h' }, 
    { name: 'Hostel B', type: 'h' }, 
    { name: 'Academic Block', type: 'a' }
  ];

  var START = Date.UTC(2026, 9, 5), DAYS = 14; // Mon 5 Oct 2026, 14 days of hourly data

  // u: 'e' electricity (kWh/h), 'w' water (L/h)
  var FAULTS = [
    { block: 'Hostel B', util: 'w', day: 4, h0: 0, h1: 5, add: 380, label: 'Night water leak' },
    { block: 'Hostel A', util: 'w', day: 8, h0: 1, h1: 4, add: 600, label: 'Tank overflow at night' },
    { block: 'Academic Block', util: 'e', day: 9, h0: 0, h1: 6, add: 50, label: 'Equipment left on overnight' },
    { block: 'Hostel B', util: 'e', day: 11, h0: 13, h1: 16, mult: 2.6, label: 'Afternoon power spike' },
    { block: 'Academic Block', util: 'w', day: 10, h0: 0, h1: 4, add: 250, label: 'Night water leak' }
  ];

  function base(type, h, dow, u) {
    var wk = dow >= 1 && dow <= 5, night = h < 6;
    if (type === 'h') {
      if (u === 'w') return night ? 20 : h < 10 ? 450 : h < 17 ? 150 : h < 23 ? 400 : 80;
      return night ? 18 : h < 9 ? 35 : h < 18 ? 25 : 55;
    }
    if (u === 'w') return (h >= 8 && h < 18) ? (wk ? 220 : 40) : (night ? 8 : 15);
    return (h >= 8 && h < 18) ? (wk ? 90 : 15) : (night ? 12 : (wk ? 40 : 14));
  }

  function generate(seed) {
    var r = rng(seed || 7), rows = [];
    for (var d = 0; d < DAYS; d++) {
      for (var h = 0; h < 24; h++) {
        var t = new Date(START + (d * 24 + h) * 3600000), dow = t.getUTCDay();
        BLOCKS.forEach(function (b) {
          var row = { ts: t.toISOString().slice(0, 13) + ':00', block: b.name, e: 0, w: 0 };
          ['e', 'w'].forEach(function (u) {
            var v = base(b.type, h, dow, u) * (0.88 + 0.24 * r());
            FAULTS.forEach(function (f) {
              if (f.block === b.name && f.util === u && f.day === d && h >= f.h0 && h <= f.h1) {
                v = f.mult ? v * f.mult : v + f.add;
              }
            });
            row[u] = Math.round(v * 10) / 10;
          });
          rows.push(row);
        });
      }
    }
    return rows;
  }

  function med(a) { var s = a.slice().sort(function (x, y) { return x - y; }), m = s.length >> 1; return s.length ? (s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2) : 0; }
  function action(a) {
    var h = +a.startTs.slice(11, 13);
    if (a.util === 'w') return (a.rule === 'night' ? 'Water flowing at night: possible leak or overflow. Check pipes, taps and the overhead tank in ' : 'Unusually high water use: check for a burst pipe, running tap or tank overflow in ') + a.block + '.';
    return (h < 6 || h >= 22 ? 'High electricity use after hours: check AC, lights and lab equipment left on in ' : 'Unusual electricity spike: check for a faulty or overloaded appliance in ') + a.block + '.';
  }
  // Rule 1 (night flow): water at 01:00-05:59 far above that block's normal night flow.
  // Rule 2 (spike): any reading above 1.8x the median of the same hour over the previous days (+ a small margin).
  // Needs complete hourly data per block, sorted by time.
  function detect(rows) {
    var by = {}, alerts = [];
    rows.forEach(function (x) { (by[x.block] = by[x.block] || []).push(x); });
    Object.keys(by).forEach(function (name) {
      var s = by[name].slice().sort(function (a, b) { return a.ts < b.ts ? -1 : 1; });
      var night = med(s.filter(function (x) { var h = +x.ts.slice(11, 13); return h >= 1 && h <= 5; }).map(function (x) { return x.w; }));
      var flags = [];
      s.forEach(function (x, i) {
        var h = +x.ts.slice(11, 13);
        ['w', 'e'].forEach(function (u) {
          if (u === 'w' && h >= 1 && h <= 5 && x.w > Math.max(3 * night, night + 60)) { flags.push({ u: u, i: i, rule: 'night', base: night, v: x.w }); return; }
          var prev = [];
          for (var k = 1; k <= 7; k++) if (i - 24 * k >= 0) prev.push(s[i - 24 * k][u]);
          if (prev.length < 3) return;
          var m = med(prev);
          if (x[u] > 1.8 * m + (u === 'w' ? 50 : 10)) flags.push({ u: u, i: i, rule: 'spike', base: m, v: x[u] });
        });
      });
      ['w', 'e'].forEach(function (u) {
        var cur = null;
        flags.filter(function (x) { return x.u === u; }).forEach(function (x) {
          if (cur && x.i === cur.end + 1) { cur.end = x.i; cur.extra += x.v - x.base; if (x.rule === 'night') cur.rule = 'night'; }
          else { cur = { block: name, util: u, start: x.i, end: x.i, startTs: s[x.i].ts, rule: x.rule, extra: x.v - x.base }; alerts.push(cur); }
        });
      });
      alerts.forEach(function (a) { if (a.block === name) a.endTs = s[a.end].ts; });
    });
    alerts.forEach(function (a) { a.extra = Math.round(a.extra * 10) / 10; a.action = action(a); });
    return alerts.sort(function (a, b) { return a.startTs < b.startTs ? -1 : 1; });
  }
  function hit(a, f) { return a.block === f.block && a.util === f.util && a.start <= f.day * 24 + f.h1 && a.end >= f.day * 24 + f.h0; }
  function evaluate(alerts) {
    var res = FAULTS.map(function (f) { return { label: f.label, block: f.block, util: f.util, day: f.day + 1, caught: alerts.some(function (a) { return hit(a, f); }) }; });
    return { faults: res, total: FAULTS.length, caught: res.filter(function (x) { return x.caught; }).length,
      falseAlerts: alerts.filter(function (a) { return !FAULTS.some(function (f) { return hit(a, f); }); }).length };
  }

  function toCSV(rows) { 
    return 'timestamp,block,electricity_kwh,water_litres\n' + 
      rows.map(function (r) { return [r.ts, r.block, r.e, r.w].join(','); }).join('\n') + '\n'; 
  }

  function parseCSV(text) {
    return text.trim().split(/\r?\n/).slice(1).map(function (l) { 
      var c = l.split(','); 
      return { ts: c[0].trim().replace(' ', 'T').slice(0, 13) + ':00', block: (c[1] || '').trim(), e: +c[2], w: +c[3] }; 
    }).filter(function (r) { 
      return r.block && !isNaN(r.e) && !isNaN(r.w); 
    });
  }

  var API = { generate: generate, detect: detect, evaluate: evaluate, toCSV: toCSV, parseCSV: parseCSV, FAULTS: FAULTS };

  if (typeof module !== 'undefined') module.exports = API; 
  else root.Engine = API;
})(this);
