# Smart-Campus Energy & Water Dashboard

Course project for **2026CSAE102 Technology and Sustainability**, Bennett University (Problem Bank, Section 5 #29, SDG 7 / 12 / 6).

A lightweight browser dashboard that displays hourly electricity and water consumption per campus block and raises automated alerts with actionable recommendations when anomalies are detected (such as nocturnal pipe leaks or unapproved equipment use).

---

## Live Demo & Running Instructions

* **Live Demo:** https://aarav-punj.github.io/smart_campus_dashboard/
* **Local Run:** Clone or download the repository and open `index.html` directly in any web browser. No installation, build step, or server setup is required.

---

## Repository Structure

| File / Folder | Purpose |
|---|---|
| `index.html` | Dashboard UI: block/utility selectors, SVG consumption charts, alert panel with resolution controls, CSV uploader |
| `engine.js` | Core logic: seeded synthetic telemetry generator, dual anomaly detection rules, alert grouping, fault verification |
| `data/sample_readings.csv` | Default simulated benchmark dataset (1,008 hourly readings across 3 blocks over 14 days) |
| `tests/run_tests.js` | Automated test runner verifying detection rules across default data and a 200-seed robustness suite |
| `tests/test_output.txt` | Recorded terminal execution output confirming 100% fault catch rate |
| `docs/` | System architecture, alert workflow, and dashboard layout wireframe diagrams |
| `CONTRIBUTIONS.md` | Detailed individual contribution breakdown and Git commit log |

---

## How the Detection Engine Works

1. **Night-Flow Rule:** Nocturnal water consumption between 01:00 and 05:59 that exceeds $3\times$ the block's baseline night median (and exceeds it by at least 60 Litres) is flagged as a probable plumbing leak or overhead tank overflow.
2. **Spike-vs-Baseline Rule:** Any hourly reading exceeding $1.8\times$ the median consumption of the identical hourly slot over previous benchmark days (plus a tolerance margin of 10 kWh or 50 L) is flagged.
3. **Alert Merging & Action Guidance:** Consecutive anomalous hours are merged into a unified incident record showing total excess utility use alongside plain-language diagnostic instructions for campus facilities technicians.

---

## Limitations (Milestone 2 Prototype)

* **Client-Side In-Memory Execution:** Operates entirely within the browser without a persistent backend database; resolved alert states reset upon hard page refresh.
* **Deterministic Thresholds:** Rules currently use fixed statistical multipliers calibrated against synthetic baseline data.
* **Data Requirements:** Requires complete, continuous hourly telemetry per block for baseline calculation.

---

## AI Assistance Disclosure

An AI assistant (Claude) helped draft early versions of the modular code structure and documentation templates. The team reviewed, tested, calibrated, and is fully responsible for all deliverables.

---

## Team WattDrop

| Member | ID | Role | Key Deliverables |
|---|---|---|---|
| **Aarav Punj** | S26CSEU3304 | Lead, Rule Engine Architect | Anomaly rules, alert merging, repo coordination, documentation |
| **Devansh Jha** | S26CSEU3323 | Frontend UI & Visualizations | Dashboard layout, dynamic SVG graphs, GitHub Pages deployment |
| **Pankaj Biswal** | S26CSEU3318 | Data Engineering & Simulation | Synthetic telemetry generator, CSV parser, baseline dataset |
| **Shobhit Pandey** | S26CSEU3246 | QA & Automated Testing | Test harness, fault injection verification, 200-seed test run |
| **Md Raiyyan Ali** | S26CSEU3287 | Architecture, BMC & Media | Architecture/workflow diagrams, Business Model Canvas, video |
