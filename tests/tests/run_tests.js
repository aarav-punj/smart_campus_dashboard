// Run with: node tests/run_tests.js
const fs = require('fs'), E = require('../engine.js');
const rows = E.generate(7), alerts = E.detect(rows), ev = E.evaluate(alerts);
let out = `Default sample (seed 7): ${rows.length} hourly rows, ${alerts.length} alerts\n`;
ev.faults.forEach(f => out += `  ${f.caught ? 'CAUGHT ' : 'MISSED '} ${f.label} | ${f.block} | day ${f.day}\n`);
out += `Caught ${ev.caught}/${ev.total}, extra (false) alerts: ${ev.falseAlerts}\n`;
let caught = 0, total = 0, fa = 0, clean = 0; const N = 200;
for (let s = 1; s <= N; s++) { const e = E.evaluate(E.detect(E.generate(s))); caught += e.caught; total += e.total; fa += e.falseAlerts; if (e.caught === e.total && !e.falseAlerts) clean++; }
out += `\nRobustness over ${N} random seeds: ${caught}/${total} faults caught (${(100 * caught / total).toFixed(1)}%), ${fa} false alerts total, ${clean}/${N} runs perfect\n`;
fs.writeFileSync(__dirname + '/../data/sample_readings.csv', E.toCSV(rows));
fs.writeFileSync(__dirname + '/test_output.txt', out);
try { fs.writeFileSync('/home/claude/results.json', JSON.stringify({ ev, alerts: alerts.length, N, caught, total, fa, clean })); } catch (e) {}
console.log(out);
