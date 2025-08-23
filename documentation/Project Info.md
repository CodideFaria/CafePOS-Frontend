Using Python 3.13, Tornado, PostgreSQL 17, and a React \+ Tailwind front-end is perfectly workable for your café POS: Python 3.13 reached its fourth maintenance release on 3 June 2025 ([python.org](https://www.python.org/downloads/release/python-3134/?utm_source=chatgpt.com)), Tornado 6.5 explicitly advertises experimental—but functioning—support for Python 3.13’s new free-threaded mode ([tornadoweb.org](https://www.tornadoweb.org/en/branch6.5/releases/v6.5.0.html?utm_source=chatgpt.com)), PostgreSQL 17 has been GA since September 2024 and is now at 17.5 ([postgresql.org](https://www.postgresql.org/about/news/postgresql-17-rc1-released-2926/?utm_source=chatgpt.com), [postgresql.org](https://www.postgresql.org/about/news/postgresql-17-released-2936/?utm_source=chatgpt.com)), and React projects commonly pair with Tailwind under current best-practice guides published in 2025 ([codeparrot.ai](https://codeparrot.ai/blogs/nextjs-and-tailwind-css-2025-guide-setup-tips-and-best-practices?utm_source=chatgpt.com), [medium.com](https://medium.com/%40the-expert-developer/%EF%B8%8F-supercharge-your-react-apps-with-tailwind-css-the-ultimate-guide-for-2025-%EF%B8%8F-5c396acb7697?utm_source=chatgpt.com)).

## **Python 3.13 in Production**

Python 3.13 introduces a bundled experimental JIT compiler and cleaner error messages while keeping CPython’s familiar workflow ([docs.python.org](https://docs.python.org/3/whatsnew/3.13.html?utm_source=chatgpt.com)).  
 The 3.13.4 point-release fixes \~300 bugs and several CVEs, giving you a stable foundation for the semester timeframe ([python.org](https://www.python.org/downloads/release/python-3134/?utm_source=chatgpt.com)).  
 Roughly half of PyPI’s top 360 packages already declare 3.13 support, and the list grows weekly ([pyreadiness.org](https://pyreadiness.org/3.13/?utm_source=chatgpt.com)).  
 Be aware that JIT performance is still marked “early” by community testers ([reddit.com](https://www.reddit.com/r/learnpython/comments/1fyf5zj/has_anyone_seen_any_speedup_in_practice_in_313/?utm_source=chatgpt.com)), so keep `PYTHONENABLEJIT=0` in production until more benchmarks appear.

## **Tornado 6.5 Compatibility**

Tornado is an async-first web framework ideal for WebSockets and long-lived connections ([pypi.org](https://pypi.org/project/tornado/?utm_source=chatgpt.com)).  
 Version 6.5 runs on Python ≥ 3.9 and adds initial support for the free-threaded interpreter in 3.13; you may need to build wheels from source for that mode ([tornadoweb.org](https://www.tornadoweb.org/en/branch6.5/releases/v6.5.0.html?utm_source=chatgpt.com)).  
 Its GitHub project already lists “Programming Language :: Python :: 3.13” in the classifiers, so official support is under active CI ([github.com](https://github.com/tornadoweb/tornado/blob/master/setup.py?utm_source=chatgpt.com)).

## **PostgreSQL 17**

Postgres 17 shipped GA on 26 Sep 2024 with SQL/JSON features and improved logical replication ([postgresql.org](https://www.postgresql.org/about/news/postgresql-17-rc1-released-2926/?utm_source=chatgpt.com)); minor release 17.5 landed in May 2025 and is the current patch train ([postgresql.org](https://www.postgresql.org/about/news/postgresql-17-released-2936/?utm_source=chatgpt.com)).  
 Tornado talks to Postgres cleanly via async drivers such as `asyncpg`, which already build on Python 3.13 according to package readiness dashboards.

## **React \+ Tailwind**

Tailwind 4 tutorials for React in 2025 emphasise component-centric styling and tree-shaking for small bundles ([codeparrot.ai](https://codeparrot.ai/blogs/nextjs-and-tailwind-css-2025-guide-setup-tips-and-best-practices?utm_source=chatgpt.com)), while Dev blogs show step-by-step integration for current CRA/Vite setups ([medium.com](https://medium.com/%40the-expert-developer/%EF%B8%8F-supercharge-your-react-apps-with-tailwind-css-the-ultimate-guide-for-2025-%EF%B8%8F-5c396acb7697?utm_source=chatgpt.com)).  
 Running React as a separate SPA or embedding it into Tornado templates (served from `/static`) both work—choose based on how much real-time interactivity you need.

## **Updated Project Snapshot**

| Aspect | Choice |
| ----- | ----- |
| **Title** | **CafePOS Async – Tornado & React Edition** |
| **Back end** | Python 3.13.4, Tornado 6.5, `asyncpg` ORM |
| **Database** | PostgreSQL 17 |
| **Front end** | React 19 with Tailwind CSS 4 |
| **Device I/O** | `python-escpos` for USB/LAN receipt printers |
| **DevOps** | Docker Compose; GitHub Actions CI |

**3-line description:**  
 CafePOS Async lets baristas ring up orders, print thermal receipts, and sync inventory in real time—all over an async Tornado API backed by Postgres 17\.  
 A React \+ Tailwind UI provides instant search and theme-ready layouts for touch screens.  
 The stack ships a usable MVP (order → pay → print) in Sprint 1 and scales to WebSocket dashboards and loyalty modules in later iterations.

A coffee-shop Point-of-Sale (POS) system is an excellent candidate for a three-month Scrum project in Python: real cafés have clear pain-points (speed, stock accuracy, receipts) and there is plenty of open-source starter code plus published Agile case-studies to show that the scope can be nailed in just a few short sprints. Below I explain *why* it fits, outline an achievable sprint roadmap, list the key backlog items, suggest a lightweight tech stack, and flag the main risks so you can plan mitigations early.

---

## **1 · Why a POS Fits a ≤ 3-Month Scrum Window**

* **Real-world precedent.** Two university teams built café POS solutions with Scrum in under a semester (InHome Café 2021 and Super Mama Frozen Food 2023), reporting \> 95 % functional test pass-rates and happy owners([journal.maranatha.edu](https://journal.maranatha.edu/index.php/ice/article/download/3321/1780/11470), [wjaets.com](https://wjaets.com/sites/default/files/WJAETS-2023-0212.pdf)).

* **Plenty of Python examples.** GitHub hosts small but functional POS apps written in Django (grocery POS, online retail POS) and pure-Tkinter desktop versions; you can fork one as a Sprint-0 spike, then replace code slice-by-slice to meet your own definition of “Done”([github.com](https://github.com/betofleitass/django_point_of_sale), [github.com](https://github.com/virajkothari7/OnlineRetailPOS), [github.com](https://github.com/neesarg123/PocketBiz)).

* **Hardware integration is solvable.** The `python-escpos` library (and related posts) show how to drive USB or LAN receipt printers directly from Python, so printing receipts won’t blow the schedule([python-escpos.readthedocs.io](https://python-escpos.readthedocs.io/?utm_source=chatgpt.com), [stackoverflow.com](https://stackoverflow.com/questions/75296177/printing-to-a-pos-thermal-printer-using-python?utm_source=chatgpt.com)).

* **Scrum cadence aligns with café feedback loops.** You can demo a working order-entry screen or receipt print every 1–2 weeks, exactly the short, iterative model Scrum endorses (Sprint ≤ 1 month, ideally 1–2 weeks)([scrum.org](https://www.scrum.org/resources/blog/how-long-sprint-should-be?utm_source=chatgpt.com), [atlassian.com](https://www.atlassian.com/agile/scrum/sprints?utm_source=chatgpt.com)).

---

## **2 · Four-Sprint Plan (2 weeks each)**

| Sprint | Goal (Potentially Shippable Increment) | Typical Stories |
| ----- | ----- | ----- |
| **0 – Setup** | Repo, Docker dev-container, CI, seed Django/FastAPI skeleton. | “As a Dev I have CI that runs tests on every PR.” |
| **1 – Order Entry MVP** | Cashier can create a sale, add menu items, hit **Pay** → receipt shown on screen. | CRUD menu items; subtotal & tax calc; simple SQLite. |
| **2 – Receipts & Inventory** | Prints thermal receipt; decrements stock; daily sales report. | Integrate `python-escpos`; adjust stock model; PDF/CSV export. |
| **3 – User Roles & Dashboards** | Barista login, sales graph, low-stock alert e-mails. | Auth with Django/DRF or FastAPI; Plotly/Dash sales chart; alert task. |
| **4 – Nice-to-haves** | Loyalty points, offline mode, or QR code ordering if time permits. | WebSocket order feed; mobile PWA stub. |

Short, fixed-length iterations give you 8–10 reviewable increments—perfect for stakeholder demos and retrospectives.

---

## **3 · Backlog Starter Pack**

| Epic | Sample User Stories (“INVEST”) |
| ----- | ----- |
| **Menu & Pricing** | “As a manager I can create a drink size & price so that the till is always up-to-date.” |
| **Sales Workflow** | “As a barista I can hit one button to reprint the last receipt when the customer loses it.” |
| **Inventory** | “As stockist I see a red badge when any bean type \< 500 g so I can reorder in time.” |
| **Reporting** | “As owner I receive a daily e-mail PDF of net sales, tax and tips.” |
| **Hardware** | “As cashier I can scan a barcode and have the item auto-added.” |
| **Security** | “As admin I reset a forgotten password without accessing raw hashes.” |

Each story slices vertically—UI \+ logic \+ persistence—so every sprint ends with something usable.

---

## **4 · Recommended Python Tech Stack**

| Concern | Lean option | Why |
| ----- | ----- | ----- |
| **Web or API layer** | **Django** for batteries-included admin, or **FastAPI** for minimal async endpoints with auto-docs ⁄ /swagger([fastapi.tiangolo.com](https://fastapi.tiangolo.com/tutorial/first-steps/), [kinsta.com](https://kinsta.com/blog/fastapi/)) | Huge community; quick scaffolding. |
| **DB** | SQLite for dev, switch to Postgres if you need concurrency. |  |
| **Front end** | Plain HTMX/Alpine for small scope, or React/Vue if you want drag-and-drop tables. |  |
| **Desktop fallback** | Tkinter-based UI (see PocketBiz) for single-machine cafés([github.com](https://github.com/neesarg123/PocketBiz)). |  |
| **Receipt printer** | `python-escpos` \+ USB/Ethernet printers (Star, Epson etc.)([python-escpos.readthedocs.io](https://python-escpos.readthedocs.io/?utm_source=chatgpt.com)). |  |
| **Charts / Reports** | Plotly Dash or Matplotlib backend to generate PNG/PDF. |  |
| **Deployment** | Docker Compose → VPS or Raspberry Pi 4; café projects in the wild run fine on a Pi with USB printer([github.com](https://github.com/betofleitass/django_point_of_sale)). |  |

All libraries are PyPI-friendly and have MIT/BSD licences, so no legal headaches.

---

## **5 · Key Risks & Mitigations**

| Risk | Impact | Mitigation |
| ----- | ----- | ----- |
| **Receipt printer drivers** | Block printing & thus cash-drawer ops | Order the exact model in Sprint 0; print a test slip with `python-escpos` during your first spike([stackoverflow.com](https://stackoverflow.com/questions/75296177/printing-to-a-pos-thermal-printer-using-python?utm_source=chatgpt.com)). |
| **Scope creep (loyalty, online ordering)** | Timeline busts | Time-box spikes; keep Product Backlog ordered; defer nice-to-haves to a post-semester release. |
| **Data loss** | Sales data corruption | Daily SQLite dump; add a Postgres container by Sprint 2\. |
| **PCI/Payments** | Compliance hurdles | Stick to “cash only” in MVP; integrate Stripe Terminal or SumUp only if time remains, using tokenised client SDKs. |

---

## **6 · Why Scrum Adds Extra Value Here**

Scrum’s inspection-and-adapt loop mirrors the realities of a busy café: baristas will discover missing shortcuts or mis-priced items the moment they touch the till. Rapid sprint reviews let you fold that feedback into the very next backlog slice, just as the InHome Café team did, delivering eight increments and hitting 96 % test success in a single term([journal.maranatha.edu](https://journal.maranatha.edu/index.php/ice/article/download/3321/1780/11470)). A POS’s clear definition-of-done (ring sale, print receipt, update stock) also makes Velocity easy to track and demo to tutors.

---

### **Bottom line**

**Yes—building a coffee-shop POS in Python is squarely achievable in \< 3 months using Scrum.** Use an open-source Django/FastAPI starter, define a razor-thin MVP, and deliver vertical slices in 4–5 two-week sprints. You’ll finish with a production-ready tool that your favourite café can actually run—and a glowing Agile case study for your module.

