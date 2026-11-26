# Tibbi Orbit: staff web portal (UI prototype)

A clickable design prototype of the Tibbi Orbit Hospital Information System staff portal. It covers all 13 SOW V4 modules: Administration, Reception, Appointments, EMR, Nursing, Laboratory, Radiology, Pharmacy, Incident Reporting, Insurance, Material Management, Finance and HR/Payroll.

- Plain HTML, CSS and JavaScript. No build step and no backend.
- Demo data is generated in the browser and saved in `localStorage`. Clear the site data to reset it.
- Sign in with any password using the demo user (`demo`).

## Open it

- Hosted: GitLab Pages. The `pages` job in `.gitlab-ci.yml` publishes the site on every push to `main`.
- Locally: run `python3 -m http.server 8765` in this folder, then open <http://localhost:8765/index.html>.

`index.html` is the screen map, and `home.html` is the portal launchpad.
