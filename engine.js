// Smart-Campus Dashboard: data generator, CSV parser and exporter.
// Authored by Pankaj
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

  var API = { 
    generate: generate, 
    toCSV: toCSV, 
    parseCSV: parseCSV, 
    FAULTS: FAULTS 
  };

  if (typeof module !== 'undefined') module.exports = API; 
  else root.Engine = API;
})(this);