# Tibbi Orbit: staff web portal (UI prototype)

A clickable design prototype of the Tibbi Orbit Hospital Information System staff portal. It covers all 13 SOW V4 modules: Administration, Reception, Appointments, EMR, Nursing, Laboratory, Radiology, Pharmacy, Incident Reporting, Insurance, Material Management, Finance and HR/Payroll.

- Plain HTML, CSS and JavaScript. No build step and no backend.
- Demo data is generated in the browser and saved in `localStorage`. Clear the site data to reset it.
- Sign in as `demo` with the password `Orbit@2026!` to see every module. The sign-in page lists the other demo accounts.
- English and Arabic: the EN / ع button switches language; Arabic shows every screen right-to-left.
- Administration > App Settings: patient app versions and update prompts, maintenance mode, colours and logo, and language.
- Documents print on A4, with signatures at the bottom of the page.

## Open it

- Hosted: GitHub Pages from the `main` branch root: <https://dhruv-p081.github.io/his-html/>
- Locally: run `python3 -m http.server 8765` in this folder, then open <http://localhost:8765/index.html>.

`index.html` is the screen map, and `home.html` is the portal launchpad.
