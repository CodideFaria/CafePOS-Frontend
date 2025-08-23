![][image1]

***CafePOS*** is a modern, Python 3.13 \- powered point-of-sale that will let independent coffee shops ring up orders, print thermal receipts, and track inventory in real time through a slick React \+ Tailwind touchscreen. By the end of a 3-month Agile delivery window the system will be live on PostgreSQL 17, served by Tornado 6.5, and ready for baristas to cut queues and owners to see sales at a glance.

## **Vision Details**

**1\. Name of the product**  
The project is called **“CafePOS Async – Tornado & React Edition.”** It emphasises the asynchronous Tornado API layer and the fast front-end stack but the product name is **“CafePOS”**.

**2\. Who it is for**  
It targets small, independent coffee shops that need an affordable, cafe-specific POS to streamline orders and reduce human error without paying enterprise licence fees.

**3\. When it will be done**  
Development will run for **five Sprints** of **two weeks** each, concluding **10 weeks** from kick-off (end roughly by 30 August 2025). Short, time-boxed iterations follow Scrum best practice on product-vision alignment.

**4\. What it will do**  
Running on **Python 3.13** with **Tornado 6.5**’s new free-threaded support, the back-end exposes async REST and WebSocket endpoints.  
Data is stored in **PostgreSQL 17** for ACID-compliant sales and inventory records.  
Baristas use a **React 19** and **Tailwind 4** touch UI for ultra-fast item search and modifiers.  
When the cashier hits *Pay*, the app sends ESC/POS commands to print a branded receipt and open the cash drawer.

**5\. What it will *not* do**  
The MVP will **not** attempt integrated card processing, multi-branch inventory sync, or advanced fiscal-printer compliance; these features add significant scope risk and are planned for a future roadmap. Industry guides say that over-customisation is a common pitfall for small-venue POS projects.

**6\. Benefit to the business (the student team)**  
Building on the latest **Python 3.13** gives the team hands-on experience with the language’s new JIT and free-threaded interpreter, while Tornado showcases high-performance async design.  
**PostgreSQL 17** and **React 19** / **Tailwind 4** align with the 2025 “full-stack” hiring trend, enhancing graduate employability.

**7\. Benefit to the customer (cafe owner)**  
Owners gain real-time sales dashboards, automated stock decrements, and accurate daily reports \- features shown to cut waste and increase upsell revenue in cafe environments.

**Summary**  
*In three months we will deliver CafePOS: a lightning-fast, touchscreen till that lets baristas tap drinks, print receipts, and keep bean stock updated instantly, all powered by the newest Python and a rock-solid Postgres database \- so coffee shops can serve customers quicker and owners can see exactly how their business is brewing.*
