/* Shared UI for the Tibbi Orbit staff web prototype.
 * Pure HTML/CSS/JS, no build step. Data lives in localStorage (seeded from data.js). */
(function () {
  /* Pages live in docs/html/ and in one folder per module (docs/html/<module>/).
   * ROOT is the docs/html/ URL, worked out from this script's own address. */
  const ROOT = ((document.currentScript && document.currentScript.src) || '').replace(/assets\/ui\.js(\?.*)?$/, '');
  const R = (p) => ROOT + p;
  const relPath = () => location.href.split('#')[0].split('?')[0].replace(ROOT, '');
  const STORE_KEY = 'orbit.proto.db.v2';
  const SESSION_KEY = 'orbit.proto.session.v1';
  const PREF_KEY = 'orbit.proto.prefs.v1';

  /* ---------- Data store ---------- */
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function loadDb() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        // New seed keys (for example a module added later) are added; saved keys are kept.
        let added = false;
        Object.keys(window.SEED).forEach(k => { if (!(k in saved)) { saved[k] = clone(window.SEED[k]); added = true; } });
        saved.modules = clone(window.SEED.modules);   // the screen catalogue always follows the code
        // Protected roles (system administrator, demo) cannot be edited, so they always follow the code.
        (window.SEED.roles || []).filter(sr => sr.protected).forEach(sr => {
          const i = saved.roles.findIndex(x => x.id === sr.id);
          if (i < 0) { saved.roles.push(clone(sr)); added = true; }
          else if (JSON.stringify(saved.roles[i].perms) !== JSON.stringify(sr.perms)) { saved.roles[i].perms = clone(sr.perms); added = true; }
        });
        // Screens added after the data was saved: give seed roles their default rights on them.
        const known = new Set(); saved.roles.forEach(r => Object.keys(r.perms || {}).forEach(k => known.add(k)));
        (window.SEED.roles || []).forEach(sr => {
          const r = saved.roles.find(x => x.id === sr.id); if (!r) return;
          Object.entries(sr.perms || {}).forEach(([opt, acts]) => { if (!known.has(opt) && !(opt in (r.perms || {}))) { r.perms = r.perms || {}; r.perms[opt] = acts.slice(); added = true; } });
        });
        // App Settings changed shape: take the new seed but keep the saved appearance.
        if (window.SEED.appSettings && (saved.appSettings || {}).schema !== window.SEED.appSettings.schema) {
          const theme = (saved.appSettings || {}).theme;
          saved.appSettings = clone(window.SEED.appSettings);
          if (theme) saved.appSettings.theme = theme;
          added = true;
        }
        if (added) localStorage.setItem(STORE_KEY, JSON.stringify(saved));
        return saved;
      }
    } catch (e) { /* ignore */ }
    const db = clone(window.SEED);
    localStorage.setItem(STORE_KEY, JSON.stringify(db));
    return db;
  }
  const db = loadDb();
  function save() { localStorage.setItem(STORE_KEY, JSON.stringify(db)); }

  /* ---------- Branding: colours, corners, logo (Administration > App Settings) ---------- */
  const THEMES = {
    navy: { name: 'Tibbi Navy', primary: '#16325C', light: '#24508F', hover: '#1E4378', rail: '#0E2141', rail2: '#13294F', railInk: '#A9BCD8', sel: '#EAF2FD' },
    teal: { name: 'Clinical Teal', primary: '#0F5E63', light: '#17828A', hover: '#0C4F53', rail: '#0A3B3F', rail2: '#0E4A4F', railInk: '#9FCFD2', sel: '#E3F4F4' },
    indigo: { name: 'Royal Indigo', primary: '#3730A3', light: '#4F46E5', hover: '#312E81', rail: '#1E1B4B', rail2: '#272465', railInk: '#B4B2E6', sel: '#EEF0FF' },
    emerald: { name: 'Care Green', primary: '#116149', light: '#16805F', hover: '#0D4F3B', rail: '#0B3B2D', rail2: '#0F4A39', railInk: '#A3D3C1', sel: '#E4F5EE' },
    maroon: { name: 'Desert Maroon', primary: '#7A1F3D', light: '#9E2A52', hover: '#651933', rail: '#3D0F1F', rail2: '#4D1428', railInk: '#DDB0BF', sel: '#FBEAF0' },
    graphite: { name: 'Graphite', primary: '#1F2937', light: '#374151', hover: '#111827', rail: '#111827', rail2: '#1F2937', railInk: '#A5AFBE', sel: '#EEF1F5' },
  };
  const RADII = { sharp: ['8px', '6px', '6px'], default: ['14px', '9px', '9px'], rounded: ['20px', '12px', '12px'] };
  const hexMix = (a, b, t) => { const p = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)); const x = p(a), y = p(b); return '#' + x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, '0')).join(''); };
  /* Colours for a theme setting: a preset, or a custom primary and sidebar colour. */
  function themeColours(t) {
    t = t || {};
    if (t.preset === 'custom' && /^#[0-9a-f]{6}$/i.test(t.primary || '') && /^#[0-9a-f]{6}$/i.test(t.rail || '')) {
      return { primary: t.primary, light: hexMix(t.primary, '#ffffff', 0.22), hover: hexMix(t.primary, '#000000', 0.15), rail: t.rail, rail2: hexMix(t.rail, '#ffffff', 0.07), railInk: hexMix(t.rail, '#ffffff', 0.62), sel: hexMix(t.primary, '#ffffff', 0.9) };
    }
    return THEMES[t.preset] || THEMES.navy;
  }
  function applyBrand(t) {
    t = t || (db.appSettings || {}).theme || {};
    const st = document.documentElement.style, c = themeColours(t), r = RADII[t.radius] || RADII.default;
    st.setProperty('--r-card', r[0]); st.setProperty('--r-ctl', r[1]); st.setProperty('--r-btn', r[2]);
    const vars = { '--primary': c.primary, '--primary-light': c.light, '--primary-hover': c.hover, '--btn-start': c.primary, '--btn-end': c.primary, '--sel': c.sel, '--sel-ink': c.primary, '--rail': c.rail, '--rail-2': c.rail2, '--rail-ink': c.railInk, '--focus': c.light + '38' };
    const dark = document.documentElement.getAttribute('data-theme') === 'dark';
    Object.entries(vars).forEach(([k, v]) => {
      if (!dark) st.setProperty(k, v);
      else if (/rail/.test(k)) st.setProperty(k, k === '--rail-ink' ? v : hexMix(v, '#000000', 0.45));   // dark mode keeps its own palette, only the sidebar follows the brand
      else st.removeProperty(k);
    });
  }
  /* Logo and product name shown in the sidebar, login and print headers. */
  const brandLogo = () => ((db.appSettings || {}).theme || {}).logo || R('assets/brand/app_icon.png');
  const brandName = () => ((db.appSettings || {}).theme || {}).name || 'Tibbi Orbit';

  /* ---------- Maintenance mode ---------- */
  const localStamp = () => { const d = new Date(), p = n => String(n).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`; };
  /* { status: 'off' | 'scheduled' | 'active' | 'ended', m } for the web portal channel. */
  function maintState(channel) {
    const m = (db.appSettings || {}).maintenance;
    if (!m || !m.on || !(m.scope || []).includes(channel || 'web')) return { status: 'off', m };
    const now = localStamp();
    if (m.from && now < m.from) return { status: 'scheduled', m };
    if (m.to && now > m.to) return { status: 'ended', m };
    return { status: 'active', m };
  }
  const fmtLocal = (v) => v ? fmtDate(v.replace('T', ' ')) : 'further notice';
  function resetDb() { localStorage.removeItem(STORE_KEY); localStorage.removeItem(SESSION_KEY); location.href = R('login.html'); }
  const by = (list, id) => (db[list] || []).find(x => x.id === id);
  const nowStamp = () => { const d = new Date(); const p = n => String(n).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`; };
  const today = () => nowStamp().slice(0, 10);
  const uid = (p) => p + '_' + Math.random().toString(36).slice(2, 8);

  /* ---------- Prefs (theme, favourites, recents) ---------- */
  const prefs = (() => { try { return JSON.parse(localStorage.getItem(PREF_KEY)) || {}; } catch (e) { return {}; } })();
  function savePrefs() { localStorage.setItem(PREF_KEY, JSON.stringify(prefs)); }
  document.documentElement.setAttribute('data-theme', prefs.theme || 'light');
  applyBrand();
  new MutationObserver(() => applyBrand()).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  /* ---------- Helpers ---------- */
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const ALIAS = { filter: 'funnel', help: 'circle-question-mark' };
  function icon(name, cls) {
    const I = window.ICONS || {}, A = window.ICON_ALIAS || {};
    const inner = I[ALIAS[name] || name] || I[A[name]] || I['circle'] || '';
    return `<span class="ico ${cls || ''}" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${inner}</svg></span>`;
  }
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.from((root || document).querySelectorAll(sel)); }
  function initials(name) { return String(name || '?').replace(/^Dr\.?\s*/i, '').split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase(); }
  function param(name) { return new URLSearchParams(location.search).get(name); }
  function fmtDate(s) {
    if (!s) return '';
    const d = new Date(s.length <= 10 ? s + 'T00:00:00' : s.replace(' ', 'T'));
    if (isNaN(d)) return s;
    const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const out = String(d.getDate()).padStart(2, '0') + ' ' + MON[d.getMonth()] + ' ' + d.getFullYear();
    return s.length > 10 ? out + ', ' + s.slice(11, 16) : out;
  }

  const STATUS_TONE = {
    'Active': 'ok', 'Success': 'ok', 'Completed': 'ok', 'Logout': 'neutral',
    'Inactive': 'neutral', 'Superseded': 'neutral', 'Draft': 'neutral',
    'Pending activation': 'info', 'Scheduled': 'info', 'Pending separation': 'warn',
    'Locked': 'warn', 'Expiring': 'warn', 'Future': 'info', 'No access': 'warn',
    'Blocked': 'err', 'Failure': 'err', 'Denied': 'err', 'Expired': 'err', 'Separated': 'err', 'Revoked': 'neutral',
  };
  function badge(status, label) {
    const tone = STATUS_TONE[status] || 'neutral';
    return `<span class="badge b-${tone}">${esc(label || status)}</span>`;
  }

  /* ---------- Lookups ---------- */
  const L = {
    company: id => by('companies', id),
    branch: id => by('branches', id),
    dept: id => by('departments', id),
    wh: id => by('warehouses', id),
    clinic: id => by('clinics', id),
    role: id => by('roles', id),
    user: id => by('users', id),
    emp: id => by('employees', id),
    account: id => by('accounts', id),
    cName: id => (by('companies', id) || {}).name || '',
    bName: id => (by('branches', id) || {}).name || '',
    dName: id => (by('departments', id) || {}).name || '',
    wName: id => (by('warehouses', id) || {}).name || '',
    clName: id => (by('clinics', id) || {}).name || '',
    rName: id => (by('roles', id) || {}).name || '',
    uName: id => (by('users', id) || {}).displayName || '',
  };
  function tupleText(a, short) {
    const parts = [short ? (L.company(a.companyId) || {}).code : L.cName(a.companyId), short ? (L.branch(a.branchId) || {}).code : L.bName(a.branchId), L.dName(a.deptId)];
    if (a.clinicId) parts.push(L.clName(a.clinicId));
    parts.push(a.warehouseId ? L.wName(a.warehouseId) : 'No warehouse');
    return parts.join(' / ');
  }

  /* ---------- Authorization (Section 11) ---------- */
  function isActiveOn(a, day) {
    day = day || today();
    return a.status === 'Active' && a.from <= day && (!a.to || a.to >= day);
  }
  function assignmentUsable(a) {
    const u = L.user(a.userId), c = L.company(a.companyId), b = L.branch(a.branchId), d = L.dept(a.deptId), r = L.role(a.roleId);
    const w = a.warehouseId ? L.wh(a.warehouseId) : null, cl = a.clinicId ? L.clinic(a.clinicId) : null;
    if (!u || u.status !== 'Active' || u.blocked) return { ok: false, why: 'User is not active' };
    if (!c || c.status !== 'Active') return { ok: false, why: 'Company inactive' };
    if (!b || b.status !== 'Active') return { ok: false, why: 'Branch inactive' };
    if (!d || d.status !== 'Active') return { ok: false, why: 'Department inactive' };
    if (a.warehouseId && (!w || w.status !== 'Active')) return { ok: false, why: 'Warehouse inactive' };
    if (a.clinicId && (!cl || cl.status !== 'Active')) return { ok: false, why: 'Clinic inactive' };
    if (!r || r.status !== 'Active') return { ok: false, why: 'Role inactive' };
    if (a.status !== 'Active') return { ok: false, why: 'Assignment revoked' };
    if (a.from > today()) return { ok: false, why: 'Starts ' + fmtDate(a.from) };
    if (a.to && a.to < today()) return { ok: false, why: 'Expired ' + fmtDate(a.to) };
    return { ok: true, why: 'Active' };
  }
  const ctxKey = c => [c.companyId, c.branchId, c.deptId, c.clinicId || '', c.warehouseId || ''].join('|');
  function contextsFor(userId) {
    const seen = {};
    db.assignments.filter(a => a.userId === userId && assignmentUsable(a).ok).forEach(a => {
      const k = ctxKey(a);
      if (!seen[k]) seen[k] = { companyId: a.companyId, branchId: a.branchId, deptId: a.deptId, clinicId: a.clinicId, warehouseId: a.warehouseId, isDefault: false, roles: [] };
      seen[k].roles.push(a.roleId);
      if (a.isDefault) seen[k].isDefault = true;
    });
    return Object.values(seen);
  }
  /* MAP-05: combine permissions only for assignments with the exact same context tuple. */
  function permsFor(userId, ctx) {
    const out = {};
    if (!ctx) return out;
    db.assignments.filter(a => a.userId === userId && ctxKey(a) === ctxKey(ctx) && assignmentUsable(a).ok).forEach(a => {
      const r = L.role(a.roleId);
      Object.entries(r.perms || {}).forEach(([opt, acts]) => {
        const o = optionById(opt);
        if (o && o.warehouse && !a.warehouseId) return; // MAP-06
        out[opt] = Array.from(new Set((out[opt] || []).concat(acts)));
      });
    });
    return out;
  }
  function optionById(id) {
    for (const m of db.modules) for (const s of m.subs) for (const o of s.opts) if (o.id === id) return Object.assign({ moduleId: m.id, subId: s.id }, o);
    return null;
  }
  function can(optId, action) {
    const s = session();
    if (!s || !s.ctx) return false;
    const p = permsFor(s.userId, s.ctx)[optId] || [];
    return p.includes(action || 'view');
  }

  /* ---------- Session ---------- */
  function session() { try { return JSON.parse(sessionStorage.getItem(SESSION_KEY) || localStorage.getItem(SESSION_KEY)); } catch (e) { return null; } }
  function setSession(s) { localStorage.setItem(SESSION_KEY, JSON.stringify(s)); }
  function clearSession() { localStorage.removeItem(SESSION_KEY); }
  function me() { const s = session(); return s ? L.user(s.userId) : null; }

  function audit(action, entity, rec, changes, extra) {
    const s = session();
    const u = me();
    const ev = Object.assign({
      id: 'ev_' + (1049 + db.audit.length + Math.floor(Math.random() * 10)),
      at: nowStamp() + ':' + String(new Date().getSeconds()).padStart(2, '0'),
      actor: u ? u.displayName : 'Anonymous', action, entity, recordId: rec.id, record: rec.label,
      scope: s && s.ctx ? [(L.company(s.ctx.companyId) || {}).code, (L.branch(s.ctx.branchId) || {}).code].join(' / ') : '',
      outcome: 'Success', reason: '', source: 'Web 10.20.4.18', changes: changes || [],
    }, extra || {});
    db.audit.unshift(ev); save();
    return ev;
  }

  /* ---------- Toasts ---------- */
  function toast(msg, kind) {
    let host = $('.toasts');
    if (!host) { host = document.createElement('div'); host.className = 'toasts'; document.body.appendChild(host); }
    const t = document.createElement('div');
    t.className = 'toast' + (kind === 'err' ? ' err' : '');
    t.innerHTML = icon(kind === 'err' ? 'circle-alert' : 'circle-check') + `<span>${esc(msg)}</span>`;
    host.appendChild(t);
    setTimeout(() => t.remove(), 3600);
  }

  /* ---------- Overlays ---------- */
  function overlay(el, onClose) {
    const scrim = document.createElement('div'); scrim.className = 'scrim';
    document.body.appendChild(scrim); document.body.appendChild(el);
    const close = () => { scrim.remove(); el.remove(); document.removeEventListener('keydown', key); onClose && onClose(); };
    const key = (e) => { if (e.key === 'Escape') close(); };
    scrim.addEventListener('click', close);
    document.addEventListener('keydown', key);
    setTimeout(() => { const f = el.querySelector('input:not([type=hidden]):not([readonly]), select, textarea, button.primary'); f && f.focus(); }, 30);
    return close;
  }
  /* drawer({title, sub, body (html), foot (html), wide, onMount(el, close)}) */
  function drawer(o) {
    const el = document.createElement('aside');
    el.className = 'drawer' + (o.wide ? ' wide' : '') + (o.narrow ? ' narrow' : '');
    el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true');
    el.innerHTML = `<div class="drawer-head"><div><h2>${esc(o.title)}</h2>${o.sub ? `<div class="muted small">${o.sub}</div>` : ''}</div>
      <button class="icon-btn x" data-close aria-label="Close">${icon('x')}</button></div>
      <div class="drawer-body">${o.body || ''}</div>${o.foot ? `<div class="drawer-foot">${o.foot}</div>` : ''}`;
    const close = overlay(el, o.onClose);
    $$('[data-close]', el).forEach(b => b.addEventListener('click', close));
    o.onMount && o.onMount(el, close);
    return { el, close };
  }
  /* confirm({title, body, impact:[...], tone:'danger'|'primary', confirm, reason:true, onConfirm(reason)}) */
  function confirm(o) {
    const el = document.createElement('div');
    el.className = 'modal' + (o.wide ? ' wide' : '');
    el.setAttribute('role', 'alertdialog'); el.setAttribute('aria-modal', 'true');
    const tone = o.tone || 'danger';
    const tileCls = tone === 'danger' ? 'b-err' : tone === 'warn' ? 'b-warn' : 'b-info';
    el.innerHTML = `<div class="m-ico ${tileCls}">${icon(o.icon || (tone === 'danger' ? 'triangle-alert' : 'info'))}</div>
      <h2>${esc(o.title)}</h2><div class="muted">${o.body || ''}</div>
      ${o.impact && o.impact.length ? `<div class="impact"><b>Impact</b><ul>${o.impact.map(i => `<li>${i}</li>`).join('')}</ul></div>` : ''}
      ${o.extra || ''}
      ${o.reason ? `<div class="field" style="margin-top:14px"><label>Reason<span class="req">*</span></label><textarea class="input" data-reason maxlength="500" placeholder="Why is this change needed?"></textarea></div>` : ''}
      <div class="m-foot"><button class="btn" data-cancel>${esc(o.cancel || 'Cancel')}</button>
      <button class="btn ${tone === 'danger' ? 'destructive' : 'primary'}" data-ok ${o.reason ? 'disabled' : ''}>${esc(o.confirm || 'Confirm')}</button></div>`;
    const close = overlay(el);
    const ok = $('[data-ok]', el), r = $('[data-reason]', el);
    if (r) r.addEventListener('input', () => { ok.disabled = r.value.trim().length < 3; });
    $('[data-cancel]', el).addEventListener('click', close);
    ok.addEventListener('click', () => { const reason = r ? r.value.trim() : ''; close(); o.onConfirm && o.onConfirm(reason); });
    o.onMount && o.onMount(el, close);
    return close;
  }

  /* ---------- Shell ---------- */
  const ADMIN_OPTS = ['admin.org.company', 'admin.org.rules', 'admin.masters.dept', 'admin.masters.wh', 'admin.security.roles', 'admin.security.users', 'admin.security.mapping', 'admin.reports.view', 'admin.reports.audit', 'admin.system.settings'];
  function hasAnyAdmin() { return ADMIN_OPTS.some(o => can(o, 'view')); }
  /* Screens of a module the user may open (HOM-01: built from permissions, default deny). */
  function moduleScreens(m) {
    return m.subs.map(sb => ({ sub: sb, opts: sb.opts.filter(o => o.page && can(o.id, 'view')) })).filter(g => g.opts.length);
  }
  function visibleModules() { return db.modules.filter(m => moduleScreens(m).length); }
  function moduleOf(o) {
    if (o.module) return db.modules.find(m => m.id === o.module) || null;
    if (o.opt) { const x = optionById(o.opt); if (x) return db.modules.find(m => m.id === x.moduleId) || null; }
    if (o.active) return db.modules.find(m => m.home === o.active || m.subs.some(sb => sb.opts.some(x => x.page === o.active))) || null;
    return null;
  }

  function maintenanceScreen(m) {
    document.body.innerHTML = `<div class="maint-screen"><div class="maint-card">
      <img src="${esc(brandLogo())}" alt="" class="maint-logo">
      <div class="m-ico b-warn">${icon('construction')}</div>
      <h1>Under maintenance</h1>
      <p>${esc(m.msgEn || 'The system is under maintenance.')}</p>
      ${m.msgAr ? `<p dir="rtl" lang="ar" class="maint-ar">${esc(m.msgAr)}</p>` : ''}
      <div class="maint-when">${icon('clock')}<span>Expected back: <b>${esc(fmtLocal(m.to))}</b></span></div>
      <div><button class="btn" id="maintOut">${icon('log-out')} Sign out</button></div>
      <div class="xs muted" style="margin-top:14px">${esc(brandName())} · Contact the IT helpdesk if this is urgent.</div>
    </div></div>`;
    document.title = 'Under maintenance · ' + brandName();
    $('#maintOut').addEventListener('click', () => { clearSession(); location.href = R('login.html'); });
  }

  /* page({ title, subtitle, opt (required option id), module, active, crumbs, actions (html), body (html), wide, noSide }) */
  function page(o) {
    const s = session();
    const here = relPath();
    if (!s) { location.replace(R('login.html?next=' + encodeURIComponent(here + location.search))); return false; }
    if (!s.ctx) { location.replace(R('context.html')); return false; }
    const u = me();
    if (!u || u.status !== 'Active' || u.blocked) { clearSession(); location.replace(R('login.html?ended=1')); return false; }
    // HOM-06: context may have become invalid during the session.
    const valid = contextsFor(u.id).some(c => ctxKey(c) === ctxKey(s.ctx));
    if (!valid) { s.ctx = null; setSession(s); location.replace(R('context.html?invalid=1')); return false; }
    // Maintenance mode: only exempt roles keep working; everybody else sees the maintenance screen.
    const ms = maintState('web');
    const myRoles = (contextsFor(u.id).find(c => ctxKey(c) === ctxKey(s.ctx)) || {}).roles || [];
    const exempt = myRoles.some(r => (ms.m && ms.m.exemptRoles || []).includes(r));
    if (ms.status === 'active' && !exempt) { maintenanceScreen(ms.m); return false; }
    const maintBanner = ms.status === 'active'
      ? `<div class="banner warn" style="margin-bottom:14px">${icon('construction')}<span><b>Maintenance mode is on</b> until ${esc(fmtLocal(ms.m.to))}. Other users see the maintenance screen; your role is exempt.</span>${can('admin.system.settings', 'view') ? `<a class="btn sm" href="${R('settings.html?tab=maint')}">Manage</a>` : ''}</div>`
      : ms.status === 'scheduled' ? `<div class="banner info" style="margin-bottom:14px">${icon('calendar-clock')}<span><b>Planned maintenance</b> from ${esc(fmtLocal(ms.m.from))} to ${esc(fmtLocal(ms.m.to))}. Save your work before it starts.</span></div>` : '';
    const mod = moduleOf(o);
    // HOM-05: never rely on a hidden menu; check the option on the page itself.
    if (o.opt && !can(o.opt, 'view')) { location.replace(R('access-denied.html?from=' + encodeURIComponent(o.title))); return false; }
    if (!o.opt && mod && !moduleScreens(mod).length) { location.replace(R('access-denied.html?from=' + encodeURIComponent(o.title))); return false; }
    if (o.opt) trackRecent(o.title, here + location.search);

    const ctx = s.ctx;
    const mods = visibleModules();
    const onHome = !mod;
    const rail = `<nav class="rail" aria-label="Modules">
        <a class="logo" href="${R('home.html')}" title="${esc(brandName())} home"><img src="${esc(brandLogo())}" alt="${esc(brandName())}"></a>
        <a href="${R('home.html')}" class="${onHome && /home\.html$/.test(here) ? 'on' : ''}" data-tip="Home">${icon('house')}</a>
        <div class="sep"></div>
        ${mods.map(m => `<a href="${R(m.home || 'module.html?m=' + m.id)}" class="${mod && mod.id === m.id ? 'on' : ''}" data-tip="${esc(m.name)}">${icon(m.icon)}</a>`).join('')}
        <div class="spacer"></div>
        <button id="railTheme" data-tip="Light or dark">${icon(prefs.theme === 'dark' ? 'sun' : 'moon')}</button>
        <a href="${R('index.html')}" data-tip="Screen map">${icon('map')}</a>
      </nav>`;
    let side = '';
    if (mod) {
      const groups = moduleScreens(mod);
      const activeKey = o.active || here;
      const overview = mod.home ? `<nav class="nav"><a href="${R(mod.home)}" class="${mod.home === activeKey || (mod.home === here && !o.opt) ? 'on' : ''}">${icon('layout-dashboard')}<span>Overview</span></a></nav>` : '';
      side = `<aside class="side">
        <div class="side-head"><span class="tile ${mod.tile}">${icon(mod.icon)}</span><div class="grow"><b>${esc(mod.name)}</b><span>${esc(mod.sow || '')}</span></div></div>
        ${overview}
        ${groups.map(g => {
          const opts = g.opts.filter(x => x.nav !== false);
          if (!opts.length) return '';
          return `<div class="nav-label">${esc(g.sub.name)}</div><nav class="nav">${opts.map(x => `<a href="${R(x.page)}" class="${x.page === activeKey || x.id === o.opt ? 'on' : ''}">${icon(x.icon || 'circle')}<span>${esc(x.name)}</span></a>`).join('')}</nav>`;
        }).join('')}
        <div class="side-foot">Prototype · dummy data only${(() => { const w = ((db.appSettings || {}).channels || []).find(c => c.id === 'web'); return w ? ' · v' + esc(w.current) : ''; })()}<br><button class="link-btn" id="resetDb">Reset demo data</button></div>
      </aside>`;
    }
    const co = L.company(ctx.companyId) || {}, br = L.branch(ctx.branchId) || {};
    const crumbs = o.crumbs ? o.crumbs.map(([t, h]) => [t, h ? (/^(https?:|\.\.|\/)/.test(h) ? h : R(h)) : null])
      : [['Home', R('home.html')]].concat(mod ? [[mod.name, mod.home && mod.home !== here ? R(mod.home) : null]] : []).concat(mod && mod.home === here ? [] : [[o.title, null]]);
    document.body.innerHTML = `
    <div class="shell ${side ? '' : 'no-sub'}">
      ${rail}
      ${side}
      <div class="main">
        <header class="top">
          <button class="icon-btn menu-toggle" id="menuToggle" aria-label="Menu">${icon('menu')}</button>
          <button class="gsearch" id="gsearch" aria-label="Search patients and screens">${icon('search')}<span class="gs-t">Search patients, MRN, Civil ID or screens</span><kbd class="kbd">⌘K</kbd></button>
          <div class="grow"></div>
          <button class="ctx-pill" id="ctxBtn" title="Switch context">
            <span class="avatar">${icon('building-2')}</span>
            <span class="ctx-txt"><b>${esc(co.code)} · ${esc(br.name)}</b><span>${esc(L.dName(ctx.deptId))}${ctx.clinicId ? ' · ' + esc(L.clName(ctx.clinicId)) : ''} · ${ctx.warehouseId ? esc(L.wName(ctx.warehouseId)) : 'No warehouse'}</span></span>
            ${icon('chevron-down', 'mute')}
          </button>
          <button class="icon-btn" id="themeBtn" aria-label="Switch light or dark">${icon(prefs.theme === 'dark' ? 'sun' : 'moon')}</button>
          <button class="icon-btn" aria-label="Notifications" id="bellBtn">${icon('bell')}${prefs.notifSeen ? '' : '<span class="dot"></span>'}</button>
          <button class="me" id="meBtn" aria-haspopup="menu"><span class="avatar">${initials(u.displayName)}</span><span class="me-txt"><b>${esc(u.displayName)}</b><span>${esc(rolesLabel(u.id, ctx))}</span></span>${icon('chevron-down', 'mute')}</button>
        </header>
        <main class="content ${o.wide ? 'full' : ''}" id="content">
          <div class="page-head"><div class="grow">
            <div class="crumbs">${crumbs.map(([t, h]) => h ? `<a href="${h}">${esc(t)}</a>` : `<span>${esc(t)}</span>`).join(icon('chevron-right', 'mute'))}</div>
            <h1>${esc(o.title)}</h1>${o.subtitle ? `<div class="muted" style="margin-top:3px">${o.subtitle}</div>` : ''}</div>
            <div class="actions">${o.actions || ''}</div></div>
          ${maintBanner}<div id="page">${o.body || ''}</div>
        </main>
      </div>
    </div>`;
    const rs = $('#resetDb'); if (rs) rs.addEventListener('click', () => confirm({ title: 'Reset demo data?', body: 'All changes you made in this prototype are removed and you are signed out.', confirm: 'Reset', onConfirm: resetDb }));
    $('#ctxBtn').addEventListener('click', openContextSwitcher);
    const flip = () => { prefs.theme = prefs.theme === 'dark' ? 'light' : 'dark'; savePrefs(); document.documentElement.setAttribute('data-theme', prefs.theme); $('#themeBtn').innerHTML = icon(prefs.theme === 'dark' ? 'sun' : 'moon'); $('#railTheme').innerHTML = icon(prefs.theme === 'dark' ? 'sun' : 'moon'); };
    $('#themeBtn').addEventListener('click', flip); $('#railTheme').addEventListener('click', flip);
    $('#menuToggle').addEventListener('click', () => document.body.classList.toggle('nav-open'));
    $('#bellBtn').addEventListener('click', openNotifications);
    $('#meBtn').addEventListener('click', (e) => openUserMenu(e.currentTarget));
    $('#gsearch').addEventListener('click', openPalette);
    document.addEventListener('keydown', (e) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); openPalette(); } });
    startIdleTimer();
    return true;
  }

  /* Global search: patients (by name, MRN, Civil ID, mobile) and permitted screens. */
  function patientHref(p) {
    if (can('reception.reg.patient', 'view')) return R('reception/patient.html?id=' + p.id);
    if (can('emr.summary', 'view')) return R('emr/summary.html?pt=' + p.id);
    return null;
  }
  function openPalette() {
    if ($('.palette')) return;
    const el = document.createElement('div');
    el.className = 'palette'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true');
    el.innerHTML = `<div class="p-in">${icon('search')}<input placeholder="Search patients, MRN, Civil ID, mobile or screens" aria-label="Search"><span class="kbd">Esc</span></div><div class="p-list"></div>
      <div class="p-foot"><span><span class="kbd">↑</span> <span class="kbd">↓</span> to move</span><span><span class="kbd">Enter</span> to open</span><span class="grow"></span><span>Results are limited to your permissions</span></div>`;
    const close = overlay(el);
    const input = $('input', el), list = $('.p-list', el);
    let items = [], cur = 0;
    const screens = visibleModules().reduce((acc, m) => acc.concat(moduleScreens(m).reduce((a, g) => a.concat(g.opts.filter(x => x.nav !== false).map(x => ({ t: x.name, s: m.name, href: R(x.page), ic: x.icon || m.icon }))), [])), [{ t: 'Home', s: 'Tibbi Orbit', href: R('home.html'), ic: 'house' }]);
    function draw() {
      const q = input.value.trim().toLowerCase();
      const pts = (db.patients && patientHref({ id: '' }) !== null) ? db.patients.filter(p => !q || [p.name, p.mrn, p.civilId, p.mobile, p.nameAr].join(' ').toLowerCase().includes(q)).slice(0, q ? 7 : 4) : [];
      const recent = (prefs.recent || []).slice(0, 4).map(r => ({ t: r.title, s: 'Recent', href: R(r.href), ic: 'history' }));
      const scr = q ? screens.filter(x => (x.t + ' ' + x.s).toLowerCase().includes(q)).slice(0, 8) : recent.concat(screens.filter(x => !recent.some(r => r.t === x.t))).slice(0, 6);
      items = pts.map(p => ({ href: patientHref(p), html: `<span class="avatar sm ${p.gender === 'Female' ? 'av-f' : 'av-m'}">${initials(p.name)}</span><div class="grow"><b>${esc(p.name)}</b><small>${esc(p.mrn)} · ${esc(p.gender || '')}${p.dob ? ' · ' + ageOf(p.dob) : ''} · ${esc(p.mobile || 'no mobile')}</small></div>${p.allergies && p.allergies.length ? '<span class="badge b-err">Allergy</span>' : ''}` }))
        .concat(scr.map(x => ({ href: x.href, html: `${icon(x.ic)}<div class="grow"><b>${esc(x.t)}</b><small>${esc(x.s)}</small></div>${icon('arrow-right', 'mute')}` })));
      cur = Math.min(cur, Math.max(0, items.length - 1));
      list.innerHTML = (pts.length ? `<div class="p-group">Patients</div>` + items.slice(0, pts.length).map((it, i) => `<div class="p-item ${i === cur ? 'on' : ''}" data-i="${i}">${it.html}</div>`).join('') : '')
        + (scr.length ? `<div class="p-group">Screens</div>` + items.slice(pts.length).map((it, i) => `<div class="p-item ${i + pts.length === cur ? 'on' : ''}" data-i="${i + pts.length}">${it.html}</div>`).join('') : '')
        + (!items.length ? `<div class="empty">${icon('search')}<b>Nothing found</b><span>Try a name, MRN, Civil ID or a screen name.</span></div>` : '');
      $$('.p-item', list).forEach(n => n.addEventListener('click', () => { location.href = items[+n.dataset.i].href; }));
    }
    input.addEventListener('input', () => { cur = 0; draw(); });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown') { cur = Math.min(items.length - 1, cur + 1); draw(); e.preventDefault(); }
      if (e.key === 'ArrowUp') { cur = Math.max(0, cur - 1); draw(); e.preventDefault(); }
      if (e.key === 'Enter' && items[cur]) { location.href = items[cur].href; close(); }
    });
    draw(); setTimeout(() => input.focus(), 20);
  }
  function ageOf(dob) {
    if (!dob) return '';
    const d = new Date(dob + 'T00:00:00'), t = new Date(today() + 'T00:00:00');
    let y = t.getFullYear() - d.getFullYear(); if (t < new Date(t.getFullYear(), d.getMonth(), d.getDate())) y--;
    if (y < 2) { const mths = (t.getFullYear() - d.getFullYear()) * 12 + t.getMonth() - d.getMonth(); return mths + ' mo'; }
    return y + ' y';
  }
  function openNotifications() {
    // Only items whose screen the user may open (default deny).
    const list = (db.notifications || []).filter(n => !n.opt || can(n.opt, 'view')).slice(0, 8);
    prefs.notifSeen = true; savePrefs();
    const dot = $('#bellBtn .dot'); if (dot) dot.remove();
    drawer({ title: 'Notifications', sub: 'Work items for your role in this context.', narrow: true,
      body: list.length ? `<div class="list-rows">${list.map(n => `<a href="${n.href ? R(n.href) : '#'}" class="row" style="color:var(--ink);padding:10px 4px;gap:12px;align-items:flex-start;border-radius:8px">${icon(n.icon || 'bell')}<div class="grow"><b>${esc(n.title)}</b><div class="small muted">${esc(n.text || '')}</div></div><span class="small mute" style="white-space:nowrap">Today ${esc(n.at || '')}</span></a>`).join('')}</div>`
        : `<div class="empty">${icon('bell')}<b>No new notifications</b><span>Critical results, approvals and alerts for your role appear here.</span></div>` });
  }
  function rolesLabel(userId, ctx) {
    const r = db.assignments.filter(a => a.userId === userId && ctxKey(a) === ctxKey(ctx) && assignmentUsable(a).ok).map(a => L.rName(a.roleId));
    return r.length ? r.join(' + ') : 'No role';
  }

  function openUserMenu(anchor) {
    const old = $('.menu'); if (old) { old.remove(); return; }
    const r = anchor.getBoundingClientRect();
    const m = document.createElement('div');
    m.className = 'menu'; m.setAttribute('role', 'menu');
    m.style.top = (r.bottom + 8 + window.scrollY) + 'px';
    m.style.right = Math.max(12, window.innerWidth - r.right) + 'px';
    const u = me();
    m.innerHTML = `<div style="padding:10px 12px"><b>${esc(u.displayName)}</b><div class="muted small">${esc(u.login)} · ${esc(u.email || '')}</div></div><hr>
      <button data-a="profile">${icon('user')} My profile and preferences</button>
      <button data-a="ctx">${icon('arrow-right-left')} Switch context</button>
      <button data-a="pwd">${icon('key-round')} Change password</button><hr>
      <button data-a="logout" class="danger">${icon('log-out')} Log out</button>`;
    document.body.appendChild(m);
    setTimeout(() => document.addEventListener('click', function off(e) { if (!m.contains(e.target)) { m.remove(); document.removeEventListener('click', off); } }), 0);
    m.addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return; m.remove();
      if (b.dataset.a === 'logout') confirmLogout();
      if (b.dataset.a === 'pwd') openChangePassword();
      if (b.dataset.a === 'ctx') openContextSwitcher();
      if (b.dataset.a === 'profile') openMyProfile();
    });
  }
  function confirmLogout() {
    confirm({ title: 'Log out?', body: 'Your session ends on this device. Unsaved changes are lost.', confirm: 'Log out', icon: 'log-out', onConfirm: () => {
      audit('Logout', 'Session', { id: me().id, label: me().login }, []);
      clearSession(); location.href = R('login.html?out=1');
    } });
  }

  /* USR-07: self-service display preferences and permitted contact fields only. */
  function openMyProfile() {
    const u = me();
    drawer({ title: 'My profile', sub: 'You can change your display preferences and contact details. Roles, status and access are managed by an administrator.',
      body: `<div class="row" style="margin-bottom:18px"><span class="avatar lg">${initials(u.displayName)}</span><div><b style="font-size:16px">${esc(u.displayName)}</b><div class="muted">${esc(u.login)}</div></div></div>
      <div class="form-grid">
        <div class="field"><label>Mobile</label><input class="input" id="pMobile" value="${esc(u.mobile)}"></div>
        <div class="field"><label>Email</label><input class="input" id="pEmail" value="${esc(u.email)}"></div>
        <div class="field"><label>Theme</label><select class="input" id="pTheme"><option value="light">Light</option><option value="dark" ${prefs.theme === 'dark' ? 'selected' : ''}>Dark</option></select></div>
        <div class="field"><label>Home layout</label><select class="input" id="pLayout"><option value="tiles">Tiles</option><option value="list" ${prefs.layout === 'list' ? 'selected' : ''}>List</option></select></div>
        <div class="full banner info">${icon('info')}<span>Changing the email used for password recovery needs verification before it is used (USR-03).</span></div>
      </div>`,
      foot: `<button class="btn" data-close>Cancel</button><button class="btn primary" id="pSave">Save</button>`,
      onMount: (el, close) => $('#pSave', el).addEventListener('click', () => {
        u.mobile = $('#pMobile', el).value.trim(); u.email = $('#pEmail', el).value.trim(); save();
        prefs.theme = $('#pTheme', el).value; prefs.layout = $('#pLayout', el).value; savePrefs();
        document.documentElement.setAttribute('data-theme', prefs.theme);
        audit('Profile self-service update', 'User', { id: u.id, label: u.login }, [['Contact details', '', 'Updated']]);
        close(); toast('Profile saved'); setTimeout(() => location.reload(), 400);
      }) });
  }

  /* HOM-09 */
  function passwordRules(pw, u) {
    return [
      { ok: pw.length >= 12, t: 'At least 12 characters' },
      { ok: !/^(password|orbit|tibbi|12345|qwerty)/i.test(pw) && !/(.)\1{3,}/.test(pw), t: 'Not a common or easily guessed password' },
      { ok: !u || !pw.toLowerCase().includes(String(u.login).split('.')[0].toLowerCase()), t: 'Does not contain your name or login' },
    ];
  }
  function pwField(id, label, auto) {
    return `<div class="field"><label for="${id}">${label}<span class="req">*</span></label><div class="input-wrap"><input class="input" type="password" id="${id}" autocomplete="${auto}"><button type="button" class="in-btn" data-eye="${id}" aria-label="Show password">${icon('eye')}</button></div><div class="err hidden" data-err="${id}"></div></div>`;
  }
  function bindEyes(root) {
    $$('[data-eye]', root).forEach(b => b.addEventListener('click', () => { const i = $('#' + b.dataset.eye, root); i.type = i.type === 'password' ? 'text' : 'password'; b.innerHTML = icon(i.type === 'password' ? 'eye' : 'eye-off'); }));
  }
  function openChangePassword() {
    const u = me();
    if (u.authSource !== 'Local') { confirm({ title: 'Change password with your provider', body: 'Your account uses an external identity provider. Change your password there.', tone: 'primary', confirm: 'OK' }); return; }
    drawer({ title: 'Change password', sub: 'After the change, your other sessions are signed out.',
      body: `<div class="stack">${pwField('cpCur', 'Current password', 'current-password')}${pwField('cpNew', 'New password', 'new-password')}
        <ul class="rules" id="cpRules"></ul>${pwField('cpConf', 'Confirm new password', 'new-password')}</div>`,
      foot: `<span class="grow"></span><button class="btn" data-close>Cancel</button><button class="btn primary" id="cpSave" disabled>Change password</button>`,
      onMount: (el, close) => {
        bindEyes(el);
        const cur = $('#cpCur', el), nw = $('#cpNew', el), cf = $('#cpConf', el), btn = $('#cpSave', el);
        const upd = () => {
          const rules = passwordRules(nw.value, u);
          $('#cpRules', el).innerHTML = rules.map(r => `<li class="${r.ok ? 'ok' : ''}">${icon(r.ok ? 'circle-check' : 'minus')}${r.t}</li>`).join('');
          const match = cf.value && cf.value === nw.value;
          const e = $('[data-err=cpConf]', el); e.textContent = cf.value && !match ? 'Passwords do not match.' : ''; e.classList.toggle('hidden', !(cf.value && !match));
          btn.disabled = !(cur.value && rules.every(r => r.ok) && match);
        };
        [cur, nw, cf].forEach(i => i.addEventListener('input', upd)); upd();
        btn.addEventListener('click', () => {
          const e = $('[data-err=cpCur]', el);
          if (cur.value !== u.demoPassword) { e.textContent = 'The current password is not correct.'; e.classList.remove('hidden'); cur.classList.add('bad'); audit('Password change failed', 'User', { id: u.id, label: u.login }, [], { outcome: 'Failure', reason: 'Wrong current password' }); return; }
          u.demoPassword = nw.value; save();
          audit('Password changed', 'User', { id: u.id, label: u.login }, [['Other sessions', '', 'Signed out']]);
          close(); toast('Password changed. Other sessions were signed out.');
        });
      } });
  }

  /* LOG-03, HOM-04: context switcher */
  function contextPicker(userId, initial, onPick, opts) {
    opts = opts || {};
    const ctxs = contextsFor(userId);
    const uniq = (arr, f) => Array.from(new Set(arr.map(f))).filter(Boolean);
    const state = Object.assign({ companyId: '', branchId: '', deptId: '', clinicId: '', warehouseId: '' }, initial || {});
    const root = document.createElement('div');
    root.className = 'stack';
    function render() {
      const cos = uniq(ctxs, c => c.companyId);
      if (cos.length === 1) state.companyId = cos[0];
      const brs = uniq(ctxs.filter(c => c.companyId === state.companyId), c => c.branchId);
      if (brs.length === 1) state.branchId = brs[0];
      if (!brs.includes(state.branchId)) state.branchId = '';
      const dps = uniq(ctxs.filter(c => c.companyId === state.companyId && c.branchId === state.branchId), c => c.deptId);
      if (dps.length === 1) state.deptId = dps[0];
      if (!dps.includes(state.deptId)) state.deptId = '';
      const base = ctxs.filter(c => c.companyId === state.companyId && c.branchId === state.branchId && c.deptId === state.deptId);
      const cls = Array.from(new Set(base.map(c => c.clinicId || '')));
      if (cls.length === 1) state.clinicId = cls[0];
      if (!cls.includes(state.clinicId || '')) state.clinicId = cls.length === 1 ? cls[0] : null;
      const base2 = base.filter(c => (c.clinicId || '') === (state.clinicId || ''));
      const whs = Array.from(new Set(base2.map(c => c.warehouseId || '')));
      if (whs.length === 1) state.warehouseId = whs[0];
      if (!whs.includes(state.warehouseId || '')) state.warehouseId = whs.length === 1 ? whs[0] : null;
      const sel = (id, label, list, val, name, opt) => `<div class="field"><label for="${id}">${label}${opt ? '' : '<span class="req">*</span>'}</label><select class="input" id="${id}" ${list.length <= 1 ? 'disabled' : ''}>
        ${list.length > 1 ? `<option value="__">Select ${label.toLowerCase()}</option>` : ''}${list.map(v => `<option value="${v}" ${(val || '') === v ? 'selected' : ''}>${v ? esc(name(v)) : 'None'}</option>`).join('')}</select></div>`;
      root.innerHTML = `
        ${sel('cxCo', 'Company', cos, state.companyId, L.cName)}
        ${state.companyId ? sel('cxBr', 'Branch', brs, state.branchId, L.bName) : ''}
        ${state.branchId ? sel('cxDp', 'Department', dps, state.deptId, L.dName) : ''}
        ${state.deptId && (cls.length > 1 || cls[0]) ? sel('cxCl', 'Clinic or specialty', cls, state.clinicId, v => L.clName(v), true) : ''}
        ${state.deptId && state.clinicId !== null ? sel('cxWh', 'Warehouse', whs, state.warehouseId, v => L.wName(v), true) : ''}
        ${state.deptId && state.clinicId !== null && state.warehouseId !== null ? `<div class="banner ok">${icon('shield-check')}<span>Roles in this context: ${esc(base2.find(c => (c.warehouseId || '') === (state.warehouseId || '')).roles.map(L.rName).join(', '))}</span></div>` : ''}`;
      const on = (id, key, resets) => { const s = $('#' + id, root); if (s) s.addEventListener('change', () => { state[key] = s.value === '__' ? '' : s.value; resets.forEach(r => state[r] = ''); render(); }); };
      on('cxCo', 'companyId', ['branchId', 'deptId', 'clinicId', 'warehouseId']);
      on('cxBr', 'branchId', ['deptId', 'clinicId', 'warehouseId']);
      on('cxDp', 'deptId', ['clinicId', 'warehouseId']);
      on('cxCl', 'clinicId', ['warehouseId']);
      on('cxWh', 'warehouseId', []);
      const ready = !!(state.companyId && state.branchId && state.deptId && state.clinicId !== null && state.warehouseId !== null);
      onPick(ready ? { companyId: state.companyId, branchId: state.branchId, deptId: state.deptId, clinicId: state.clinicId || null, warehouseId: state.warehouseId || null } : null);
    }
    render();
    return root;
  }
  function openContextSwitcher() {
    const s = session(); let picked = null;
    drawer({ title: 'Switch context', narrow: true, sub: 'Only the companies, branches and departments you are authorized for are listed.',
      body: `<div id="cxHost"></div><div class="banner warn" style="margin-top:16px">${icon('triangle-alert')}<span>Switching reloads your modules and permissions and clears filters and cached data. Unsaved edits are lost.</span></div>`,
      foot: `<button class="btn" data-close>Cancel</button><button class="btn primary" id="cxGo" disabled>Switch</button>`,
      onMount: (el, close) => {
        $('#cxHost', el).appendChild(contextPicker(s.userId, s.ctx, c => { picked = c; $('#cxGo', el).disabled = !c || ctxKey(c) === ctxKey(s.ctx); }));
        $('#cxGo', el).addEventListener('click', () => {
          const old = s.ctx; s.ctx = picked; setSession(s);
          audit('Context switched', 'Session', { id: s.userId, label: me().login }, [['Context', tupleText(old, true), tupleText(picked, true)]]);
          close(); location.href = R('home.html');
        });
      } });
  }

  /* LOG-07: idle expiry with a warning one minute before. Prototype uses the effective rule value. */
  function effectiveRule(key, branchId) {
    const rule = db.rules.find(r => r.key === key);
    const br = L.branch(branchId) || {};
    const act = v => v.status === 'Active' && v.from <= today() && (!v.to || v.to >= today());
    const b = db.ruleVersions.find(v => v.key === key && v.scope === 'branch' && v.scopeId === branchId && act(v));
    if (b) return { value: b.value, source: 'Branch', version: b };
    const c = db.ruleVersions.find(v => v.key === key && v.scope === 'company' && v.scopeId === br.companyId && act(v));
    if (c) return { value: c.value, source: 'Company', version: c };
    return { value: rule ? rule.sysDefault : null, source: 'System', version: null };
  }
  let idleT, warnT;
  function startIdleTimer() {
    const s = session(); if (!s || !s.ctx) return;
    const mins = Number(effectiveRule('idle_timeout', s.ctx.branchId).value) || 15;
    const reset = () => {
      clearTimeout(idleT); clearTimeout(warnT);
      warnT = setTimeout(() => {
        confirm({ title: 'Are you still there?', body: `For your security, you will be signed out in 1 minute because of inactivity (${mins} minutes, Entity Rule).`, tone: 'warn', icon: 'clock', confirm: 'Stay signed in', cancel: 'Log out', onConfirm: reset,
          onMount: (el) => $('[data-cancel]', el).addEventListener('click', () => { clearSession(); location.href = R('login.html?idle=1'); }) });
      }, (mins - 1) * 60000);
      idleT = setTimeout(() => { clearSession(); location.href = R('login.html?idle=1'); }, mins * 60000);
    };
    ['click', 'keydown', 'mousemove'].forEach(e => document.addEventListener(e, debounce(reset, 1500)));
    reset();
  }
  function debounce(fn, ms) { let t; return () => { clearTimeout(t); t = setTimeout(fn, ms); }; }

  function trackRecent(title, href) {
    prefs.recent = (prefs.recent || []).filter(r => r.href !== href);
    prefs.recent.unshift({ title, href, at: nowStamp() });
    prefs.recent = prefs.recent.slice(0, 6); savePrefs();
  }

  /* ---------- Data table ---------- */
  /* table(host, {columns:[{key,label,render,sort}], rows, pageSize, empty, onRow, filters:[...], search:fn, toolbar}) */
  function table(host, o) {
    const st = { q: '', page: 1, sort: o.sort || null, dir: 1, filters: {} };
    const size = o.pageSize || 10;
    host.innerHTML = `<div class="card">
      <div class="filters">
        <div class="search grow" style="max-width:340px">${icon('search')}<input class="input" placeholder="${esc(o.searchPlaceholder || 'Search')}" aria-label="Search"></div>
        ${(o.filters || []).map((f, i) => `<select class="input" data-f="${i}" aria-label="${esc(f.label)}"><option value="">${esc(f.label)}: All</option>${f.options.map(op => `<option value="${esc(op[0])}">${esc(op[1])}</option>`).join('')}</select>`).join('')}
        <div class="grow"></div>${o.toolbar || ''}
      </div>
      <div class="table-wrap"><table class="tbl"><thead><tr>${o.columns.map((c, i) => `<th class="${c.sort ? 'sortable' : ''} ${/\bnum\b/.test(c.cls || '') ? 'num' : ''}" data-c="${i}">${esc(c.label)}${c.sort ? ' ' + icon('chevron-down', 'mute') : ''}</th>`).join('')}</tr></thead><tbody></tbody></table></div>
      <div class="pager"><span class="cnt"></span><div class="grow"></div><button class="btn sm" data-p="-1">${icon('chevron-left')} Previous</button><span class="pg"></span><button class="btn sm" data-p="1">Next ${icon('chevron-right')}</button></div>
    </div>`;
    const tb = $('tbody', host);
    function rows() {
      let r = (typeof o.rows === 'function' ? o.rows() : o.rows).slice();
      if (st.q) r = r.filter(x => o.search(x).toLowerCase().includes(st.q.toLowerCase()));
      (o.filters || []).forEach((f, i) => { const v = st.filters[i]; if (v) r = r.filter(x => f.test(x, v)); });
      if (st.sort != null) { const c = o.columns[st.sort]; r.sort((a, b) => String(c.sort(a)).localeCompare(String(c.sort(b)), undefined, { numeric: true }) * st.dir); }
      return r;
    }
    function draw() {
      const all = rows(); const pages = Math.max(1, Math.ceil(all.length / size));
      st.page = Math.min(st.page, pages);
      const slice = all.slice((st.page - 1) * size, st.page * size);
      tb.innerHTML = slice.length ? slice.map((x, i) => `<tr class="${o.onRow ? 'click' : ''}" data-i="${i}">${o.columns.map(c => `<td class="${c.cls || ''}">${c.render(x)}</td>`).join('')}</tr>`).join('')
        : `<tr><td colspan="${o.columns.length}"><div class="empty">${icon(o.emptyIcon || 'search')}<b>${esc(o.empty || 'No records found')}</b>${st.q || Object.values(st.filters).some(Boolean) ? '<span>Try a different search or clear the filters.</span> <button class="link-btn" data-clear>Clear search and filters</button>' : ''}</div></td></tr>`;
      $('.cnt', host).textContent = `${all.length} record${all.length === 1 ? '' : 's'}`;
      $('.pg', host).textContent = `Page ${st.page} of ${pages}`;
      $('[data-p="-1"]', host).disabled = st.page <= 1; $('[data-p="1"]', host).disabled = st.page >= pages;
      if (o.onRow) $$('tr.click', tb).forEach(tr => tr.addEventListener('click', (e) => { if (e.target.closest('button,a,input,select')) return; o.onRow(slice[+tr.dataset.i]); }));
      const clr = $('[data-clear]', tb); if (clr) clr.addEventListener('click', () => { st.q = ''; st.filters = {}; $('.search input', host).value = ''; $$('[data-f]', host).forEach(s => s.value = ''); draw(); });
      o.afterDraw && o.afterDraw(tb, slice);
    }
    $('.search input', host).addEventListener('input', debounce(() => { st.q = $('.search input', host).value.trim(); st.page = 1; draw(); }, 150));
    $$('[data-f]', host).forEach(s => s.addEventListener('change', () => { st.filters[s.dataset.f] = s.value; st.page = 1; draw(); }));
    $$('th.sortable', host).forEach(th => th.addEventListener('click', () => { const c = +th.dataset.c; st.dir = st.sort === c ? -st.dir : 1; st.sort = c; draw(); }));
    $$('[data-p]', host).forEach(b => b.addEventListener('click', () => { st.page += +b.dataset.p; draw(); }));
    draw();
    return { redraw: draw, state: st };
  }

  /* ---------- Form helpers ---------- */
  function field(o) {
    const req = o.req ? '<span class="req">*</span>' : '';
    const hint = o.hint ? `<div class="hint">${o.hint}</div>` : '';
    const err = `<div class="err hidden" data-err="${o.id}"></div>`;
    const cls = o.full ? 'field full' : 'field';
    const dis = o.disabled ? 'disabled' : '';
    const ro = o.readonly ? 'readonly' : '';
    if (o.type === 'select') return `<div class="${cls}"><label for="${o.id}">${o.label}${req}</label><select class="input" id="${o.id}" ${dis}>${o.placeholder !== false ? `<option value="">${esc(o.placeholder || 'Select')}</option>` : ''}${o.options.map(op => `<option value="${esc(op[0])}" ${String(o.value) === String(op[0]) ? 'selected' : ''} ${op[2] ? 'disabled' : ''}>${esc(op[1])}</option>`).join('')}</select>${hint}${err}</div>`;
    if (o.type === 'textarea') return `<div class="${cls}"><label for="${o.id}">${o.label}${req}</label><textarea class="input" id="${o.id}" maxlength="${o.max || 500}" ${dis} ${ro}>${esc(o.value || '')}</textarea>${hint}${err}</div>`;
    return `<div class="${cls}"><label for="${o.id}">${o.label}${req}</label><input class="input" id="${o.id}" type="${o.type || 'text'}" value="${esc(o.value == null ? '' : o.value)}" ${o.max ? `maxlength="${o.max}"` : ''} ${o.placeholder ? `placeholder="${esc(o.placeholder)}"` : ''} ${dis} ${ro} ${o.attrs || ''}>${hint}${err}</div>`;
  }
  function showErrors(root, errs) {
    $$('[data-err]', root).forEach(e => { e.classList.add('hidden'); e.textContent = ''; });
    $$('.input.bad', root).forEach(i => i.classList.remove('bad'));
    Object.entries(errs).forEach(([id, msg]) => { const e = $(`[data-err="${id}"]`, root); if (e) { e.textContent = msg; e.classList.remove('hidden'); } const i = $('#' + id, root); if (i) i.classList.add('bad'); });
    const sum = $('.err-summary', root);
    const list = Object.values(errs);
    if (sum) { sum.classList.toggle('hidden', !list.length); sum.innerHTML = list.length ? `Please fix ${list.length} field${list.length > 1 ? 's' : ''}:<ul>${list.map(m => `<li>${esc(m)}</li>`).join('')}</ul>` : ''; }
    return !list.length;
  }
  const CODE_RE = /^[A-Za-z0-9_-]{1,30}$/;
  const normCode = c => String(c || '').trim().toUpperCase();
  function validUrl(u) { try { const x = new URL(u); return x.protocol === 'https:' || x.protocol === 'http:'; } catch (e) { return false; } }
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const PHONE_RE = /^\+?[0-9 ()-]{6,20}$/;

  /* ---------- Audit drawer (AUD-05) ---------- */
  function historyDrawer(recordId, title) {
    const ev = db.audit.filter(e => e.recordId === recordId);
    if (!can('admin.reports.audit', 'view') && !can('admin.security.users', 'admin') && !can('admin.org.company', 'admin')) {
      toast('You do not have View Audit permission for this record.', 'err'); return;
    }
    drawer({ title: 'History', sub: esc(title) + ' · read-only audit trail (AUD-05)',
      body: ev.length ? `<div class="timeline">${ev.map(e => `<div class="tl-item"><b>${esc(e.action)}</b> ${badge(e.outcome)}<div class="meta">${fmtDate(e.at)} · ${esc(e.actor)} · ${esc(e.source)} · ${esc(e.id)}</div>${e.reason ? `<div class="small" style="margin-top:4px">Reason: ${esc(e.reason)}</div>` : ''}${e.changes.length ? `<div class="diff" style="margin-top:8px"><div class="h">Field</div><div class="h">Before</div><div class="h">After</div>${e.changes.map(c => `<div>${esc(c[0])}</div><div class="old">${esc(c[1] || '(empty)')}</div><div class="new">${esc(c[2])}</div>`).join('')}</div>` : ''}</div>`).join('')}</div>`
        : `<div class="empty">${icon('history')}<b>No history yet</b><span>Changes to this record will appear here.</span></div>` });
  }

  /* Shared: deactivate / activate with impact (ADM-05, ADM-11) */
  function statusToggle(o) {
    const deact = o.record.status === 'Active';
    confirm({ title: (deact ? 'Deactivate ' : 'Activate ') + o.label + '?',
      body: deact ? 'The record stays in history but cannot be used for new assignments. Existing contexts that depend on it stop authorizing on the next request.' : 'The record becomes available for new selections. Children that were disabled on their own stay disabled (ADM-06).',
      impact: deact ? o.impact : null, reason: true, tone: deact ? 'danger' : 'primary', confirm: deact ? 'Deactivate' : 'Activate',
      onConfirm: (reason) => {
        const before = o.record.status;
        o.record.status = deact ? 'Inactive' : 'Active';
        if (deact) { o.record.deactivationReason = reason; o.record.deactivatedAt = today(); } else { delete o.record.deactivationReason; delete o.record.deactivatedAt; }
        o.record.updatedBy = me().displayName; o.record.updatedAt = nowStamp(); o.record.version = (o.record.version || 1) + 1;
        save();
        audit((deact ? 'Deactivated' : 'Reactivated') + ' ' + o.entity.toLowerCase(), o.entity, { id: o.record.id, label: o.label }, [['Status', before, o.record.status]], { reason });
        toast(`${o.label} ${deact ? 'deactivated' : 'activated'}`);
        o.done && o.done();
      } });
  }

  function lastUpdated(r) { return `<span class="small muted">${esc(r.updatedBy || '')}<br>${fmtDate(r.updatedAt)}</span>`; }
  function codeName(code, name, sub) { return `<div class="cell-main"><b>${esc(name)}</b><span class="mono">${esc(code)}</span>${sub ? ` · <span>${sub}</span>` : ''}</div>`; }

  window.UI = { THEMES, themeColours, applyBrand, brandLogo, brandName, maintState, fmtLocal, ROOT, R, relPath, ageOf, moduleScreens, visibleModules, openPalette, db, save, resetDb, by, L, uid, today, nowStamp, esc, icon, $, $$, initials, param, fmtDate, badge, tupleText, ctxKey, contextsFor, permsFor, optionById, can, assignmentUsable, isActiveOn,
    session, setSession, clearSession, me, audit, toast, drawer, confirm, page, table, field, showErrors, CODE_RE, normCode, validUrl, EMAIL_RE, PHONE_RE,
    historyDrawer, statusToggle, lastUpdated, codeName, prefs, savePrefs, contextPicker, effectiveRule, passwordRules, pwField, bindEyes, hasAnyAdmin, ADMIN_OPTS, rolesLabel };
})();
