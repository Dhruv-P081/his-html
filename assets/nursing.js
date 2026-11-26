/* Nursing and Wards module helpers (window.Nursing). Loaded after kit.js on nursing pages. */
(function () {
  const { db, esc, icon, $, $$, me } = window.UI;
  const pad = (n) => String(n).padStart(2, '0');
  const WARD_KEY = 'orbit.nursing.ward';

  /* ---------- Clock and shifts ----------
   * The prototype date is db.TODAY. Seeded ward activity stops at 07:00 (start of the morning shift), so the ward clock follows
   * the real clock only during the early morning shift (07:15 to 09:00) and otherwise holds at 08:25. That keeps "due now",
   * "overdue" and waiting times realistic at any time of day, and records made on the page never land in the future. */
  const CLOCK_FROM = '07:15', CLOCK_TO = '09:00', CLOCK_HOLD = '08:25';
  function nowTime() { const d = new Date(), t = pad(d.getHours()) + ':' + pad(d.getMinutes()); return t >= CLOCK_FROM && t <= CLOCK_TO ? t : CLOCK_HOLD; }
  function now() { return db.TODAY + ' ' + nowTime(); }
  const SHIFTS = [['Morning', '07:00', '15:00'], ['Evening', '15:00', '23:00'], ['Night', '23:00', '07:00']];
  function shiftOf(stamp) { const h = +String(stamp || now()).slice(11, 13); return h >= 7 && h < 15 ? 'Morning' : h >= 15 && h < 23 ? 'Evening' : 'Night'; }
  /* The nursing day runs 07:00 to 07:00: a night entry at 03:00 belongs to the previous day. */
  function shiftDay(stamp) { const s = stamp || now(); return +s.slice(11, 13) < 7 ? Kit.addDays(s.slice(0, 10), -1) : s.slice(0, 10); }
  function nextShift(sh) { return sh === 'Morning' ? 'Evening' : sh === 'Evening' ? 'Night' : 'Morning'; }
  function shiftRange(day, sh) { return sh === 'Morning' ? [day + ' 07:00', day + ' 15:00'] : sh === 'Evening' ? [day + ' 15:00', day + ' 23:00'] : [day + ' 23:00', Kit.addDays(day, 1) + ' 07:00']; }
  function addMin(stamp, m) { const d = new Date(stamp.replace(' ', 'T')); d.setMinutes(d.getMinutes() + m); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`; }
  function minsBetween(a, b) { return Math.round((new Date(b.replace(' ', 'T')) - new Date(a.replace(' ', 'T'))) / 60000); }
  function myName() { return (me() || {}).displayName || 'Nurse'; }

  /* ---------- Ward and inpatients ---------- */
  function defaultWard() { const n = (db.nurses || []).find(x => x.userId === (me() || {}).id); return n ? n.wardId : 'wd_01'; }
  function getWard() { const p = window.UI.param('ward'); if (p && Kit.ward(p)) return p; const e = window.UI.param('enc') && Kit.enc(window.UI.param('enc')); if (e && e.bedId) return Kit.bed(e.bedId).wardId; return localStorage.getItem(WARD_KEY) || defaultWard(); }
  function setWard(id) { localStorage.setItem(WARD_KEY, id); }
  function wardSelect(id) { const w = getWard(); return `<label class="sr" for="${id || 'wardSel'}">Ward</label><select class="input" id="${id || 'wardSel'}" style="width:auto;min-width:200px">${db.wards.map(x => `<option value="${x.id}" ${x.id === w ? 'selected' : ''}>${esc(x.name)} (${inpatients(x.id).length})</option>`).join('')}</select>`; }
  function bindWard(onChange, id) { const s = $('#' + (id || 'wardSel')); if (s) s.addEventListener('change', () => { setWard(s.value); onChange(s.value); }); }
  function inpatients(wardId) {
    return db.encounters.filter(e => e.type === 'IPD' && !/Discharged|Cancelled/.test(e.status) && e.bedId && (!wardId || (Kit.bed(e.bedId) || {}).wardId === wardId))
      .sort((a, b) => String((Kit.bed(a.bedId) || {}).no).localeCompare(String((Kit.bed(b.bedId) || {}).no), undefined, { numeric: true }));
  }
  function bedNo(e) { return (Kit.bed(e && e.bedId) || {}).no || ''; }
  function losDays(e) { return Math.max(1, Math.round((new Date(db.TODAY) - new Date(e.start.slice(0, 10))) / 864e5) + 1); }
  function wardOf(e) { return Kit.ward((Kit.bed(e.bedId) || {}).wardId) || {}; }

  /* ---------- Vitals ---------- */
  const RULES = { temp: [36.0, 37.9], hr: [50, 100], sbp: [90, 159], rr: [10, 24], spo2: [94, 100] };
  function vitalFlag(k, v) { if (v == null || v === '') return ''; const r = RULES[k]; if (!r) return ''; return v > r[1] ? 'h' : v < r[0] ? 'l' : ''; }
  function vitalAbn(v) { return v ? ['temp', 'hr', 'sbp', 'rr', 'spo2'].filter(k => vitalFlag(k, v[k])) : []; }
  function vitalsOf(encId) { const n = now(); return db.vitals.filter(v => v.encounterId === encId && v.at <= n).sort((a, b) => a.at.localeCompare(b.at)); }
  function latestVitals(encId) { const l = vitalsOf(encId); return l[l.length - 1] || null; }
  const VLABEL = { temp: 'Temp', hr: 'HR', sbp: 'BP', rr: 'RR', spo2: 'SpO2' };
  function abnText(v) { return vitalAbn(v).map(k => k === 'sbp' ? `BP ${v.sbp}/${v.dbp}` : k === 'temp' ? `Temp ${v.temp}` : `${VLABEL[k]} ${v[k]}${k === 'spo2' ? '%' : ''}`).join(', '); }

  /* ---------- Frequencies and medication ---------- */
  function freq(name) { return (db.nursingFrequencies || []).find(f => f.name === name || f.code === name) || null; }
  function timesOf(name) { const f = freq(name); return f && f.times ? f.times.split(',').map(s => s.trim()).filter(Boolean) : []; }
  function isPrn(o) { const f = freq(o.frequency); return f ? !!f.prn : /as needed/i.test(o.frequency || ''); }
  function isHighAlert(it) { return !!it && (/Opioid|Anticoagulant/i.test(it.category || '') || /insulin|heparin/i.test(it.name || '')); }
  function highAlertKind(it) { return !it ? '' : /Opioid/i.test(it.category) ? 'Opioid' : /insulin/i.test(it.name) ? 'Insulin' : /Anticoagulant|heparin/i.test(it.category + it.name) ? 'Anticoagulant' : ''; }
  function medOrders(e, all) { return db.orders.filter(o => o.type === 'med' && o.setting === 'IPD' && o.encounterId === e.id && (all ? !/Cancelled/.test(o.status) : o.status === 'Active')); }
  function orderEnd(o) { return Kit.addDays(o.orderedAt.slice(0, 10), (o.days || 5)); }
  function doseState(due, rec) {
    if (rec) return rec.status;
    const n = now(), m = minsBetween(due, n);
    return m > 60 ? 'Overdue' : m >= -60 ? 'Due' : 'Upcoming';
  }
  /* Scheduled doses of one encounter for a date. */
  function marDoses(e, day, includePending) {
    const out = [];
    medOrders(e, includePending).forEach(o => {
      if (isPrn(o)) return;
      if (day < o.orderedAt.slice(0, 10) || day > orderEnd(o)) return;
      timesOf(o.frequency).forEach(t => {
        const due = day + ' ' + t;
        if (due < o.orderedAt) return;
        const rec = db.nursingMar.find(m => m.orderId === o.id && m.due === due);
        out.push({ order: o, item: Kit.item(o.itemId), due, rec, state: o.status === 'Active' ? doseState(due, rec) : 'Awaiting pharmacy' });
      });
    });
    return out.sort((a, b) => a.due.localeCompare(b.due));
  }

  /* ---------- Order execution worklist ---------- */
  function careTimes(name) { return /every 4 hours/i.test(name) ? timesOf('Every 4 hours') : /glucose/i.test(name) ? timesOf('Before meals and at bedtime') : /intake and output/i.test(name) ? ['06:00', '14:00', '22:00'] : timesOf('Every shift'); }
  const TYPE_LABEL = { care: 'Care', diet: 'Diet', lab: 'Lab collection', rad: 'Radiology prep', nursing: 'Nursing order' };
  /* Tasks for a list of encounters: recurring tasks for today plus pending one-off tasks. */
  function tasks(encs, day) {
    day = day || db.TODAY;
    const out = [];
    const logOf = (key) => db.nursingTaskLog.find(l => l.key === key);
    const add = (e, o, src, type, name, due, extra) => {
      const key = o.id + '|' + due, rec = logOf(key);
      out.push(Object.assign({ key, e, order: o, src, type, name, due, rec, state: rec ? rec.outcome : taskState(due) }, extra || {}));
    };
    encs.forEach(e => {
      db.orders.filter(o => o.encounterId === e.id).forEach(o => {
        if (o.type === 'care' && o.status === 'Active') careTimes(o.name).forEach(t => { const due = day + ' ' + t; if (due >= o.orderedAt) add(e, o, 'Doctor', 'care', o.name, due); });
        if (o.type === 'diet' && o.status === 'Active') (/Nil by mouth/.test(o.name) ? ['22:00'] : ['08:00', '13:00', '19:00']).forEach(t => { const due = day + ' ' + t; if (due >= o.orderedAt) add(e, o, 'Doctor', 'diet', (/Nil by mouth/.test(o.name) ? 'Start and confirm: ' : 'Serve meal: ') + o.name, due); });
        if (o.type === 'lab') {
          const key = o.id + '|' + o.orderedAt, rec = logOf(key);
          if (o.status === 'Ordered' || rec) add(e, o, 'Doctor', 'lab', 'Collect sample: ' + o.name, o.orderedAt, { oneOff: true });
        }
        if (o.type === 'rad' && /Ordered|Scheduled/.test(o.status)) add(e, o, 'Doctor', 'rad', 'Prepare and send to Radiology: ' + o.name, o.orderedAt, { oneOff: true });
      });
      (db.nursingNurseOrders || []).filter(n => n.encounterId === e.id && n.status === 'Active').forEach(n => timesOf(n.frequency).forEach(t => { const due = day + ' ' + t; if (due >= n.at) add(e, n, 'Nursing', 'nursing', n.name, due); }));
    });
    return out.sort((a, b) => a.due.localeCompare(b.due));
  }
  function taskState(due) { const m = minsBetween(due, now()); return m > 30 ? 'Overdue' : m >= -60 ? 'Due' : 'Upcoming'; }

  /* ---------- Fluid balance ---------- */
  function ioOf(encId, day) { return db.nursingIO.filter(x => x.encounterId === encId && !x.voided && (!day || shiftDay(x.at) === day)).sort((a, b) => a.at.localeCompare(b.at)); }
  function ioTotals(list) { const i = Kit.sumBy(list.filter(x => x.kind === 'Intake'), x => x.volume), o = Kit.sumBy(list.filter(x => x.kind === 'Output'), x => x.volume); return { intake: i, output: o, balance: i - o }; }
  function signed(n) { return (n > 0 ? '+' : '') + Kit.num(n) + ' mL'; }

  /* ---------- Assessment scores ---------- */
  function morseLevel(s) { return s >= 45 ? ['High risk', 'err'] : s >= 25 ? ['Moderate risk', 'warn'] : ['Low risk', 'ok']; }
  function bradenLevel(s) { return s <= 9 ? ['Very high risk', 'err'] : s <= 12 ? ['High risk', 'err'] : s <= 14 ? ['Moderate risk', 'warn'] : s <= 18 ? ['Mild risk', 'warn'] : ['No risk', 'ok']; }
  function painLevel(s) { return s >= 7 ? ['Severe', 'err'] : s >= 4 ? ['Moderate', 'warn'] : s >= 1 ? ['Mild', 'info'] : ['No pain', 'ok']; }
  function lastWith(encId, key) { return db.nursingAssessments.filter(a => a.encounterId === encId && a.status === 'Completed' && a[key] != null).sort((a, b) => b.at.localeCompare(a.at))[0] || null; }
  function admissionDone(encId) { return db.nursingAssessments.some(a => a.encounterId === encId && a.status === 'Completed' && /^nt_0[12]$/.test(a.templateId)); }
  function scoreBadge(label, score, lvl) { return `<span class="badge b-${lvl[1]}" title="${esc(label)}: ${esc(lvl[0])}">${esc(label)} ${score}</span>`; }

  /* ---------- Patient list pane (split layout) ----------
   * patientList(host, { encs, selected, onPick(e), meta(e) -> html, title }) */
  function patientList(host, o) {
    let q = '';
    const draw = () => {
      const list = o.encs().filter(e => { const p = Kit.pt(e.patientId) || {}; return !q || [p.name, p.mrn, bedNo(e)].join(' ').toLowerCase().includes(q); });
      $('.pl-body', host).innerHTML = list.length ? list.map(e => { const p = Kit.pt(e.patientId); return `<div class="qitem ${e.id === o.selected() ? 'on' : ''}" data-enc="${e.id}" tabindex="0" role="button" aria-label="${esc(p.name)}">
          <span class="token">${esc(bedNo(e).split('-').pop())}</span>
          <div class="grow" style="min-width:0"><b style="font-size:13px">${esc(p.name)}</b><div class="xs muted">${esc(p.mrn)} · ${esc(Kit.sexAge(p))} · Day ${losDays(e)}</div>${o.meta ? `<div class="row wrap" style="gap:4px;margin-top:4px">${o.meta(e)}</div>` : ''}</div></div>`; }).join('')
        : `<div class="empty">${icon('bed')}<b>No inpatients</b><span>No admitted patients match in this ward.</span></div>`;
      $$('[data-enc]', host).forEach(n => { const go = () => o.onPick(Kit.enc(n.dataset.enc)); n.addEventListener('click', go); n.addEventListener('keydown', ev => { if (ev.key === 'Enter') go(); }); });
    };
    host.innerHTML = `<div class="card-head"><h3>${icon('bed-double')} ${esc(o.title || 'Patients')}</h3><span class="tag">${o.encs().length}</span></div>
      <div style="padding:10px 12px;border-bottom:1px solid var(--line)"><div class="search">${icon('search')}<input class="input" placeholder="Name, MRN or bed" aria-label="Search patients"></div></div><div class="pl-body"></div>`;
    $('input', host).addEventListener('input', (ev) => { q = ev.target.value.trim().toLowerCase(); draw(); });
    draw();
    return { redraw: draw };
  }

  /* Choose the current encounter: ?enc= or the first inpatient of the ward. */
  function pickEnc(encs) { const id = window.UI.param('enc'); return (id && encs.find(e => e.id === id)) || encs[0] || null; }
  function setEncParam(id) { const u = new URL(location.href); u.searchParams.set('enc', id); history.replaceState(null, '', u.toString()); }

  /* Patient-level page: ward patient list on the left, the selected patient on the right.
   * patientPage({ meta(e) -> html, render(e, host, api) }) returns api { refresh(), enc() } */
  function patientPage(o) {
    const root = o.host || $('#page');
    root.innerHTML = `<div class="split"><div class="card list-pane" id="plist"></div><div id="pbody" style="min-width:0"></div></div>`;
    let ward = getWard(), cur = pickEnc(inpatients(ward)), list;
    const api = { refresh: () => { list.redraw(); draw(); }, redrawList: () => list.redraw(), enc: () => cur };
    const mount = () => { list = patientList($('#plist'), { encs: () => inpatients(ward), selected: () => cur && cur.id, title: (Kit.ward(ward) || {}).name, meta: o.meta, onPick: (e) => { cur = e; setEncParam(e.id); list.redraw(); draw(); } }); };
    const draw = () => {
      const b = $('#pbody');
      if (!cur) { b.innerHTML = `<div class="card"><div class="empty">${icon('bed')}<b>No inpatients in this ward</b><span>Choose another ward at the top of the page.</span></div></div>`; return; }
      o.render(cur, b, api);
    };
    if (!o.noBind) bindWard((w) => { ward = w; cur = inpatients(w)[0] || null; if (cur) setEncParam(cur.id); mount(); draw(); });
    api.setWard = (w) => { ward = w; cur = inpatients(w)[0] || null; if (cur) setEncParam(cur.id); mount(); draw(); };
    api.select = (e) => { cur = e; setEncParam(e.id); list.redraw(); draw(); };
    mount(); draw();
    return api;
  }
  function stampOf(el, dId, tId) { const d = $('#' + dId, el).value, t = $('#' + tId, el).value; return d && t ? d + ' ' + t : ''; }
  function whenFields(dId, tId, label) {
    return window.UI.field({ id: dId, label: (label || 'Date'), type: 'date', value: db.TODAY, req: true, attrs: `max="${db.TODAY}"` }) + window.UI.field({ id: tId, label: 'Time', type: 'time', value: nowTime(), req: true });
  }

  /* Second-nurse check for high-alert medicines (manual verification). */
  function secondNurseFields(prefix) {
    const mine = myName();
    return `<div class="form-grid" style="margin-top:8px">${window.UI.field({ id: prefix + 'Wit', label: 'Second nurse', type: 'select', req: true, options: db.nurses.filter(n => n.name !== mine).map(n => [n.name, `${n.name} (${n.grade})`]), placeholder: 'Select nurse' })}
      ${window.UI.field({ id: prefix + 'Pin', label: 'Second nurse PIN', type: 'password', req: true, max: 4, hint: 'Prototype: any 4 digits', attrs: 'inputmode="numeric" autocomplete="off"' })}</div>`;
  }
  function secondNurseOk(el, prefix) { const w = $('#' + prefix + 'Wit', el), p = $('#' + prefix + 'Pin', el); return !!(w && w.value && p && /^\d{4}$/.test(p.value)); }

  /* Kit charts draw on a fixed 640-unit viewBox, so axis text grows on wide cards. Keep it at about 11px on screen. */
  (function fitCharts() {
    let t;
    const fit = () => document.querySelectorAll('svg.chart').forEach(s => { const w = s.getBoundingClientRect().width, vb = s.viewBox && s.viewBox.baseVal ? s.viewBox.baseVal.width : 0; if (!w || !vb) return; const k = Math.min(1.2, vb / w); s.querySelectorAll('.axis-t').forEach(x => { x.style.fontSize = (11 * k).toFixed(2) + 'px'; }); });
    const later = () => { clearTimeout(t); t = setTimeout(fit, 30); };
    window.addEventListener('resize', later);
    const watch = () => { later(); new MutationObserver(later).observe(document.body, { childList: true, subtree: true }); };
    if (document.body) watch(); else document.addEventListener('DOMContentLoaded', watch);
  })();
  window.Nursing = { now, nowTime, SHIFTS, shiftOf, shiftDay, nextShift, shiftRange, addMin, minsBetween, myName, getWard, setWard, wardSelect, bindWard, inpatients, bedNo, losDays, wardOf,
    RULES, vitalFlag, vitalAbn, vitalsOf, latestVitals, abnText, freq, timesOf, isPrn, isHighAlert, highAlertKind, medOrders, orderEnd, doseState, marDoses, careTimes, TYPE_LABEL, tasks, taskState,
    ioOf, ioTotals, signed, morseLevel, bradenLevel, painLevel, lastWith, admissionDone, scoreBadge, patientList, pickEnc, setEncParam, patientPage, stampOf, whenFields, secondNurseFields, secondNurseOk };
})();
