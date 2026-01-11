# 🧪 Browser Memory Benchmark Lab

![Linux](https://img.shields.io/badge/Linux-Ubuntu%2020.04%2B-informational)
![Node.js](https://img.shields.io/badge/Node.js-18%2B-green)
![Playwright](https://img.shields.io/badge/Playwright-Automation-blue)
![Benchmark](https://img.shields.io/badge/Benchmark-OS--level%20RSS-critical)

A technical research lab that measures **real RAM usage per browser tab**
in modern browsers using **Playwright**, **Node.js**, and direct **RSS inspection via `/proc`** on Linux.

This project focuses on **defensible, system-level benchmarking**
aligned with **SRE / Performance Engineering standards** —
avoiding UI abstractions and shallow review metrics.

---

# 🎯 Goals

* Measure the browser’s **true memory baseline**
* Calculate **incremental memory cost per tab**
* Compare **Chromium-based browsers vs Firefox**
* Produce **reproducible and auditable benchmarks**
* Export results to **CSV** and **JSON**

---

# 🧠 How It Works

* Browsers are launched using Playwright `launchServer()`
* The **real root PID** is identified
* Memory usage is calculated by summing the **entire process tree**
* Metrics are based on **OS-level RSS**
* The **baseline (0 tabs)** is automatically subtracted

Results reflect what actually appears in:
`top`, `htop`, Linux cgroups, and container memory limits.

---

# 🛠️ Requirements

Linux (Ubuntu 20.04+ or compatible)  
Node.js 18+  
npm  

---

# 📦 Installation

```bash
npm install playwright
npx playwright install --with-deps


📊 Output

results.csv — tab-by-tab memory usage

results.json — structured benchmark data for further analysis

🔬 Intended Audience

*Site Reliability Engineers (SREs)

*Performance Engineers

*Browser and OS researchers

*Anyone interested in real memory behavior, not marketing numbers

⚠️ Notes

Measurements are Linux-specific due to /proc usage

Results may vary by kernel, distro, and browser version

Always run benchmarks on an idle system for best accuracy
