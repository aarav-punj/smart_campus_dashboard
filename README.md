# Smart-Campus Energy & Water Dashboard

Course project for 2026CSAE102 Technology and Sustainability, Bennett University (Problem Bank, Section 5 #29, SDG 7 / 12 / 6).

A browser dashboard that shows hourly electricity and water use per campus block and raises alerts with suggested actions when readings look wrong (for example, water flowing at 3 AM).

## Run it
Download or clone the repo and open `index.html` in a browser. No install needed. (Live demo link: _add GitHub Pages link here_)

## Files
| File | Purpose |
|---|---|
| `index.html` | Dashboard UI: block/utility selector, chart, alert list, resolve button, CSV upload |
| `engine.js` | Simulated data generator, the two alert rules, evaluation against injected faults |
| `tests/run_tests.js` | Runs the rules on the sample data and on 200 random seeds (`node tests/run_tests.js`) |
| `tests/test_output.txt` | Saved output of the last test run |
| `data/sample_readings.csv` | The default simulated dataset |
| `CONTRIBUTIONS.md` | Who did what |

## How the alerts work
1. **Night-flow rule:** water between 01:00 and 05:59 above 3x the block's normal night flow (and at least 60 L above it) is flagged as a possible leak or overflow.
2. **Spike rule:** any reading above 1.8x the median of the same hour over the previous days (plus a small margin) is flagged.
3. Consecutive flagged hours are merged into one alert with the extra use and a plain-language suggested action.

## Use your own data
Upload a CSV with the header `timestamp,block,electricity_kwh,water_litres`, one row per block per hour, complete and sorted (see `data/sample_readings.csv`).

## Limitations
- Runs in the browser only: no database or server yet, and alert status resets on reload.
- Rules are fixed thresholds; they have only been tested on simulated data.
- Needs complete hourly data per block.

## AI assistance
An AI assistant (Claude) helped draft the first version of this code and documents. The team reviewed, ran and is responsible for them.

## Team
**WattDrop**

| Member | Role |
|---|---|
| Aarav Punj | Lead, rule engine (`engine.js`) |
| Devansh Jha | Frontend UI and visualizations (`index.html`, GitHub Pages) |
| Pankaj Biswal | Data engineering and simulation (generator, CSV parsing) |
| Shobhit Pandey | QA and automated testing (`tests/run_tests.js`) |
| Md Raiyyan Ali | Architecture, business model canvas and video |
