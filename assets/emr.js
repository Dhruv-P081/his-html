/* Clinical EMR helpers shared by the emr/ pages (window.EMR).
 * Load after kit.js. Uses UI (ui.js), Kit (kit.js) and the emr* seed keys (data-emr.js). */
(function () {
  const { db, save, esc, icon, $, $$, R, can, toast, audit, me, nowStamp, field, drawer } = window.UI;
  const K = window.Kit;
  const pad = (n, w) => String(n).padStart(w || 2, '0');
  /* Keeps the patient banner on one row on wide screens (avatar, details, flags). */
  document.head.insertAdjacentHTML('beforeend', '<style>.pt-banner > div:nth-child(2){flex:1 1 420px}</style>');

  /* One-time: EMR adds its demo orders (restricted orders waiting for approval, a critical troponin) to the shared orders list. */
  function ensure() {
    if (db.emrBoot) return;
    (db.emrSeedOrders || []).forEach(o => { if (!db.orders.some(x => x.id === o.id)) db.orders.push(JSON.parse(JSON.stringify(o))); });
    db.emrBoot = 1; save();
  }
  ensure();

  /* ---------- Doctors ---------- */
  const clinicalDoctors = () => db.doctors.filter(d => !/Radiology|Pathology/.test(d.specialty));
  const myDoctor = () => { const u = me(); return u ? db.doctors.find(d => d.userId === u.id) || null : null; };
  /* Acting doctor: the logged-in user's doctor record, otherwise the one picked on the page (default dr_01). */
  function actingDoctor() {
    const mine = myDoctor(); if (mine) return mine;
    const id = sessionStorage.getItem('emr.dr') || 'dr_01';
    return K.doc(id) || K.doc('dr_01');
  }
  function doctorPicker(onChange) {
    const mine = myDoctor(), cur = actingDoctor();
    if (mine) return { html: `<span class="chip sel">${icon('stethoscope')} ${esc(mine.name)} · ${esc(mine.specialty)}</span>`, wire: () => {} };
    return {
      html: `<label class="small muted" for="emrDr" style="font-weight:700">Doctor</label><select class="input sm" id="emrDr" style="width:auto;min-width:220px">${clinicalDoctors().map(d => `<option value="${d.id}" ${d.id === cur.id ? 'selected' : ''}>${esc(d.name)} · ${esc(d.specialty)}</option>`).join('')}</select>`,
      wire: () => { const s = $('#emrDr'); if (s) s.addEventListener('change', () => { sessionStorage.setItem('emr.dr', s.value); onChange ? onChange(K.doc(s.value)) : location.reload(); }); },
    };
  }

  /* ---------- Clinical notes and visit status ---------- */
  const noteFor = (encId) => (db.emrNotes || []).find(n => n.encounterId === encId) || null;
  /* Patient tracker: the EMR note drives the clinical status of a visit (Reception owns the encounter record). */
  function visitStatus(e) {
    const n = noteFor(e.id);
    if (n && n.status === 'Signed') return 'Completed';
    if (n && n.status === 'Draft' && /Waiting|Checked in|Booked/.test(e.status)) return 'In consultation';
    return e.status;
  }
  function waitLabel(m) { return m >= 60 ? Math.floor(m / 60) + ' h ' + (m % 60) + ' min' : m + ' min'; }
  /* Demo-safe elapsed minutes: the real clock is used while the value is realistic (recent records); seeded records
   * that would show hours of waiting late in the day (or a negative wait early in the day) get a stable, realistic value under the cap. */
  function hashOf(s) { let h = 7; String(s).split('').forEach(c => { h = (h * 31 + c.charCodeAt(0)) % 100003; }); return h; }
  function elapsedMins(start, cap, key) {
    if (!start) return 0;
    const real = Math.round((Date.now() - new Date(String(start).replace(' ', 'T'))) / 60000);
    if (real >= 0 && real <= cap) return real;
    return Math.round(cap * 0.2) + hashOf(key || start) % Math.max(1, Math.round(cap * 0.6));
  }
  function waitMins(e) {
    if (!/Waiting|Checked in/.test(visitStatus(e))) return 0;
    return elapsedMins(e.start, 75, e.id);
  }

  /* ---------- Vitals ---------- */
  const VITALS = ['temp', 'hr', 'sbp', 'dbp', 'rr', 'spo2', 'pain', 'weight', 'height'];
  const vp = (code) => (db.emrVitalParams || []).find(p => p.code === code) || { code, name: code, unit: '', low: -1e9, high: 1e9 };
  function vitalFlag(code, v) {
    if (v === '' || v == null || isNaN(v)) return '';
    const p = vp(code);
    if ((p.critLow != null && p.critLow !== '' && v < p.critLow && p.critLow > 0) || (p.critHigh != null && p.critHigh !== '' && v > p.critHigh && p.critHigh > 0 && code !== 'spo2')) return 'crit';
    if (code === 'spo2' && v < p.critLow) return 'crit';
    return v < p.low || v > p.high ? 'abn' : '';
  }
  const vitalsOf = (ptId) => (db.vitals || []).filter(v => v.patientId === ptId).sort((a, b) => a.at.localeCompare(b.at));
  function vitalTiles(v) {
    if (!v) return `<div class="empty">${icon('activity')}<b>No vitals recorded</b><span>Capture vitals to see them here.</span></div>`;
    const t = (code, label, val, unit) => { const f = code === 'bp' ? (vitalFlag('sbp', v.sbp) || vitalFlag('dbp', v.dbp)) : vitalFlag(code, v[code]); return `<div class="vital ${f ? 'abn' : ''}"><span>${label}${f === 'crit' ? ' · critical' : ''}</span><b>${val === '' || val == null ? '-' : esc(val)}<small>${unit}</small></b></div>`; };
    const bmi = v.weight && v.height ? (v.weight / Math.pow(v.height / 100, 2)).toFixed(1) : '';
    return `<div class="grid" style="gap:10px;grid-template-columns:repeat(auto-fill,minmax(132px,1fr))">${t('bp', 'Blood pressure', v.sbp ? v.sbp + '/' + v.dbp : '', 'mmHg')}${t('hr', 'Heart rate', v.hr, 'bpm')}${t('temp', 'Temperature', v.temp, '°C')}${t('spo2', 'SpO2', v.spo2, '%')}${t('rr', 'Resp. rate', v.rr, '/min')}${t('pain', 'Pain', v.pain, '/10')}${t('weight', 'Weight', v.weight, 'kg')}<div class="vital"><span>BMI</span><b>${bmi || '-'}<small>kg/m²</small></b></div></div>`;
  }
  /* Trend chart for a patient. kind: bp | hr | temp | spo2 | rr */
  function vitalsChart(ptId, kind) {
    const list = vitalsOf(ptId).slice(-14);
    if (list.length < 2) return `<div class="empty">${icon('chart-line')}<b>Not enough readings for a trend</b><span>At least two readings are needed.</span></div>`;
    const labels = list.map(v => v.at.slice(5, 10).split('-').reverse().join('/') + ' ' + v.at.slice(11, 16));
    const S = { bp: [{ name: 'Systolic', color: '#D23F6A', values: list.map(v => v.sbp) }, { name: 'Diastolic', color: '#2F6BC5', values: list.map(v => v.dbp) }], hr: [{ name: 'Heart rate', color: '#E0670E', values: list.map(v => v.hr) }],
      temp: [{ name: 'Temperature', color: '#D23F6A', values: list.map(v => v.temp) }], spo2: [{ name: 'SpO2', color: '#0891B2', values: list.map(v => v.spo2) }], rr: [{ name: 'Respiratory rate', color: '#7C4DDB', values: list.map(v => v.rr) }] };
    const band = { bp: [vp('dbp').low, vp('sbp').high], hr: [vp('hr').low, vp('hr').high], temp: [vp('temp').low, vp('temp').high], spo2: [vp('spo2').low, 100], rr: [vp('rr').low, vp('rr').high] }[kind];
    return K.lineChart({ labels: labels.map(l => l.slice(0, 5)), series: S[kind], band, title: 'Vitals trend', height: 210 });
  }

  /* ---------- Orders ---------- */
  const TYPE_LABEL = { lab: 'Laboratory', rad: 'Radiology', med: 'Medication', diet: 'Diet', care: 'Care instruction' };
  const TYPE_ICON = { lab: 'flask-conical', rad: 'scan', med: 'pill', diet: 'utensils', care: 'hand-heart' };
  const DONE = /^(Verified|Resulted|Reported|Approved|Dispensed|Done|Completed|Cancelled|Discontinued|Administered)$/;
  const isOpen = (o) => !DONE.test(o.status);
  const ordersOf = (ptId) => db.orders.filter(o => o.patientId === ptId).sort((a, b) => String(b.orderedAt).localeCompare(String(a.orderedAt)));
  const hoursSince = (s) => { if (!s) return 1e9; return (new Date(nowStamp().replace(' ', 'T')) - new Date(String(s).replace(' ', 'T'))) / 36e5; };
  const isCritical = (o) => !!(o.results && o.results.some(r => r.critical));
  const isAbnormal = (o) => !!(o.results && o.results.some(r => r.flag));
  const ackOf = (orderId) => (db.emrResultAcks || []).find(a => a.orderId === orderId) || null;
  const flagHtml = (r) => r.critical ? `<span class="flag-c">C</span>` : r.flag === 'H' ? '<span class="flag-h">H</span>' : r.flag === 'L' ? '<span class="flag-l">L</span>' : '';
  const resultLine = (o) => (o.results || []).map(r => `${esc(r.name)} <b class="${r.critical ? 'flag-h' : r.flag === 'H' ? 'flag-h' : r.flag === 'L' ? 'flag-l' : ''}">${esc(r.value)}</b> ${esc(r.unit)} ${flagHtml(r)}`).join(' · ');
  function restrictedReason(type, ref) {
    if (type === 'med' && ref && ref.schedule) return 'Controlled drug (' + ref.schedule + ')';
    if (type === 'rad' && ref && /CT|MRI/.test(ref.modality)) return 'High-cost imaging (' + ref.modality + ')';
    return '';
  }
  function nextOrderId() { let n = db.orders.reduce((m, o) => { const x = /^or_(\d+)$/.exec(o.id); return x ? Math.max(m, +x[1]) : m; }, 0) + 1; while (db.orders.some(o => o.id === 'or_' + pad(n, 4))) n++; return 'or_' + pad(n, 4); }

  /* CDSS: allergy check of a drug (or contrast exam) against the patient's allergies. */
  function allergyAlerts(p, type, ref) {
    const out = [];
    if (!p || !ref) return out;
    (p.allergies || []).forEach(a => {
      const m = (db.emrAllergies || []).find(x => x.name.toLowerCase() === String(a).toLowerCase());
      if (!m) return;
      const list = (s) => String(s || '').split(',').map(x => x.trim().toLowerCase()).filter(Boolean);
      if (type === 'med') {
        const g = String(ref.generic || ref.name).toLowerCase(), cat = String(ref.category || '').toLowerCase();
        if (list(m.matches).some(x => x === g || x === cat)) out.push({ level: 'err', type: 'Allergy', text: `Allergy: patient is allergic to ${m.name} (${m.severity}). ${ref.generic || ref.name} belongs to this drug class.` });
        else if (list(m.cross).some(x => x === g)) out.push({ level: 'warn', type: 'Allergy', text: `Possible cross-reactivity: ${ref.generic || ref.name} with recorded ${m.name} allergy.` });
      }
      if (type === 'rad' && ref.contrast && list(m.matches).includes('iodinated contrast')) out.push({ level: 'err', type: 'Allergy', text: `Allergy: ${m.name}. ${ref.name} uses contrast.` });
    });
    return out;
  }
  /* CDSS: duplicate order (same test still open, or ordered in the last 24 hours). */
  function duplicateAlerts(ptId, type, code, itemId) {
    const out = [];
    const same = db.orders.filter(o => o.patientId === ptId && o.type === type && o.status !== 'Cancelled' && (type === 'med' ? o.itemId === itemId : o.code === code));
    const open = same.find(o => isOpen(o));
    const recent = same.find(o => hoursSince(o.orderedAt) <= 24);
    if (open) out.push({ level: 'warn', type: 'Duplicate order', text: `Duplicate: ${open.name} is still open (${open.no}, ${open.status}, ordered ${K.when(open.orderedAt)}).` });
    else if (recent) out.push({ level: 'warn', type: 'Duplicate order', text: `Duplicate: ${recent.name} was ordered in the last 24 hours (${recent.no}, ${recent.status}${isCritical(recent) ? ', critical result' : ''}).` });
    return out;
  }
  function logAlert(type, ptId, text, outcome, reason) {
    db.emrAlertLog = db.emrAlertLog || [];
    db.emrAlertLog.unshift({ id: 'ax_' + Math.random().toString(36).slice(2, 7), type, patientId: ptId, text, outcome, reason: reason || '', by: (me() || {}).displayName, at: nowStamp() });
  }

  const DIETS = ['Normal diet', 'Diabetic diet 1800 kcal', 'Low salt diet (2 g sodium)', 'Cardiac diet', 'Renal diet', 'Soft diet', 'Clear fluids', 'Full fluids', 'Nil by mouth', 'Nil by mouth after midnight', 'High protein diet', 'Paediatric diet for age'];
  const CARE = ['Vital signs every 4 hours', 'Vital signs every 1 hour', 'Strict intake and output chart', 'Blood glucose before meals and at bedtime', 'Fall precautions', 'Elevate head of bed 30 degrees', 'Wound check every shift', 'Cardiac monitoring', 'Oxygen to keep SpO2 above 94%', 'Daily weight', 'Mobilise with assistance', 'Pressure area care every 2 hours'];
  const FREQS = ['Once daily', 'Twice daily', 'Three times daily', 'Four times daily', 'Every 6 hours', 'Every 8 hours', 'Every 4 hours as needed', 'At night', 'Once daily before breakfast', 'Stat (once)'];
  const OVERRIDE = ['Clinically indicated, benefit outweighs risk', 'Patient tolerated this drug before', 'Allergy history is doubtful', 'Repeat requested by consultant', 'Previous sample rejected or haemolysed', 'Monitoring of a critical value'];
  const perDay = (f) => /Twice/.test(f) ? 2 : /Three|8 hours/.test(f) ? 3 : /Four|6 hours|4 hours/.test(f) ? 4 : 1;

  /* ---------- CPOE component ----------
   * cpoe(host, enc, { kinds, rx (true = take-home e-prescription), title, onDone(created) }) */
  function cpoe(host, enc, o) {
    o = o || {};
    const p = K.pt(enc.patientId);
    const kinds = o.kinds || ['lab', 'rad', 'med', 'diet', 'care'];
    let kind = o.kind || kinds[0], q = '';
    const basket = [];
    const canAdd = can(o.rx ? 'emr.consult.rx' : 'emr.consult.orders', 'add');
    const setting = o.rx ? 'OPD' : enc.type === 'IPD' ? 'IPD' : 'OPD';
    const narrow = host.clientWidth && host.clientWidth < 860;
    host.innerHTML = `<div class="grid ${narrow ? '' : 'g2'}" style="align-items:start">
      <div class="card"><div class="card-head"><div id="cpKinds"></div></div>
        <div class="card-pad stack tight"><div class="search">${icon('search')}<input class="input" id="cpQ" placeholder="Search by name or code" aria-label="Search catalogue"></div><div id="cpCat"></div><div id="cpNote"></div></div></div>
      <div class="card"><div class="card-head"><h3>${icon('shopping-basket')} ${esc(o.title || 'Order basket')}</h3><div class="actions"><span class="tag" id="cpCnt">0</span></div></div>
        <div id="cpBasket"></div>
        <div class="card-foot"><span class="small muted grow" id="cpHint"></span><button class="btn" id="cpClear">Clear</button><button class="btn primary" id="cpGo" disabled ${canAdd ? '' : 'title="Needs Add permission"'}>${icon('send')} ${o.rx ? 'Sign prescription' : 'Sign and send orders'}</button></div></div>
    </div>`;
    if (kinds.length > 1) K.seg($('#cpKinds', host), kinds.map(k => [k, k === 'care' ? 'Care' : TYPE_LABEL[k], TYPE_ICON[k]]), kind, (v) => { kind = v; q = ''; $('#cpQ', host).value = ''; drawCat(); });
    else $('#cpKinds', host).innerHTML = `<h3>${icon(TYPE_ICON[kind])} ${o.rx ? 'Medicines' : TYPE_LABEL[kind]}</h3>`;
    $('#cpQ', host).addEventListener('input', (e) => { q = e.target.value.trim().toLowerCase(); drawCat(); });
    function catalogue() {
      if (kind === 'lab') return db.labTests.filter(t => t.status !== 'Inactive').map(t => ({ code: t.code, name: t.name, meta: `${t.section} · ${t.specimen} · TAT ${t.tatHours} h`, price: t.price, ref: t }));
      if (kind === 'rad') return db.radExams.filter(t => t.status !== 'Inactive').map(t => ({ code: t.code, name: t.name, meta: `${t.modality} · ${t.bodyPart}${t.contrast ? ' · contrast' : ''}${t.laterality ? ' · needs side' : ''}`, price: t.price, ref: t }));
      if (kind === 'med') return db.items.filter(t => t.type === 'Drug' && t.status !== 'Inactive').map(t => ({ code: t.code, name: t.name, meta: `${t.brand} · ${t.route} · ${t.category}${t.schedule ? ' · ' + t.schedule : ''} · stock ${K.num(K.stockOf(t.id))}`, price: t.price, ref: t }));
      return (kind === 'diet' ? DIETS : CARE).map((n, i) => ({ code: kind.toUpperCase(), name: n, meta: kind === 'diet' ? 'Diet order' : 'Nursing care instruction', ref: { name: n }, key: kind + i }));
    }
    function drawCat() {
      const list = catalogue().filter(c => !q || (c.name + ' ' + c.code + ' ' + (c.ref.generic || '') + ' ' + (c.ref.brand || '')).toLowerCase().includes(q)).slice(0, narrow ? 6 : 9);
      $('#cpCat', host).innerHTML = list.length ? `<div class="list-rows">${list.map((c, i) => {
        const al = kind === 'med' || kind === 'rad' ? allergyAlerts(p, kind, c.ref) : [];
        return `<div><span class="t-lilac" style="width:30px;height:30px;border-radius:8px;display:grid;place-items:center;flex:none;color:var(--ink)">${icon(TYPE_ICON[kind])}</span><div class="grow cell-main"><b>${esc(c.name)} ${al.length ? `<span class="badge ${al[0].level === 'err' ? 'b-err' : 'b-warn'}">Allergy</span>` : ''}</b><span><span class="mono">${esc(c.code)}</span> · ${esc(c.meta)}${c.price ? ' · ' + K.money(c.price) : ''}</span></div><button class="btn sm" data-add="${i}" ${canAdd ? '' : 'disabled title="Needs Add permission"'}>${icon('plus')} Add</button></div>`; }).join('')}</div>`
        : `<div class="empty">${icon('search')}<b>Nothing found</b><span>Try another name or code.</span></div>`;
      $$('[data-add]', host).forEach(b => b.addEventListener('click', () => add(list[+b.dataset.add])));
      $('#cpNote', host).innerHTML = kind === 'med' ? K.phase2('Drug-drug interaction checking is 2nd phase scope (needs a licensed drug knowledge base procured by Tibbi). Allergy and duplicate checks are active.') : kind === 'rad' ? `<div class="hint">CT and MRI orders need approval before they reach Radiology.</div>` : '';
    }
    function add(c) {
      const ref = c.ref;
      const line = { kind, code: c.code, name: c.name, ref, priority: 'Routine', notes: '', reason: '', side: '' };
      if (kind === 'med') Object.assign(line, { itemId: ref.id, dose: ref.strength, route: ref.route, frequency: setting === 'IPD' && !o.rx ? 'Once daily' : 'Three times daily', days: o.rx ? 5 : 3 });
      line.alerts = (kind === 'med' || kind === 'rad' ? allergyAlerts(p, kind, ref) : []).concat(kind === 'lab' || kind === 'rad' || kind === 'med' ? duplicateAlerts(p.id, kind, c.code, ref.id) : [])
        .concat(basket.some(b => b.kind === kind && b.name === c.name) ? [{ level: 'warn', type: 'Duplicate order', text: 'Already in this basket.' }] : []);
      line.restricted = o.rx ? '' : restrictedReason(kind, ref);
      basket.push(line); drawBasket();
      if (line.alerts.some(a => a.level === 'err')) toast('Allergy alert: ' + c.name, 'err');
    }
    function valid(l) {
      if (l.alerts.length && !l.reason) return 'Give an override reason or remove the line';
      if (l.kind === 'med' && (!l.dose || !l.frequency || !(+l.days > 0))) return 'Dose, frequency and days are required';
      if (l.kind === 'rad' && l.ref.laterality && !l.side) return 'Select the side';
      return '';
    }
    function drawBasket() {
      $('#cpCnt', host).textContent = basket.length;
      const b = $('#cpBasket', host);
      b.innerHTML = basket.length ? basket.map((l, i) => `<div style="padding:12px 18px;border-bottom:1px solid var(--line)" data-line="${i}">
        <div class="row">${icon(TYPE_ICON[l.kind], 'mute')}<div class="grow cell-main"><b>${esc(l.name)}</b><span><span class="mono">${esc(l.code)}</span>${l.restricted ? ` · <span class="badge b-violet nodot">${icon('lock')} Needs approval: ${esc(l.restricted)}</span>` : ''}</span></div>
          <select class="input sm" data-k="priority" aria-label="Priority" style="width:110px">${['Routine', 'Urgent', 'STAT'].map(x => `<option ${l.priority === x ? 'selected' : ''}>${x}</option>`).join('')}</select>
          <button class="icon-btn" data-rm="${i}" aria-label="Remove">${icon('x')}</button></div>
        ${l.kind === 'med' ? `<div class="form-grid ${narrow ? '' : 'c4'}" style="margin-top:10px"><div class="field"><label>Dose</label><input class="input sm" data-k="dose" value="${esc(l.dose)}"></div><div class="field"><label>Route</label><select class="input sm" data-k="route">${['Oral', 'Intravenous', 'Intramuscular', 'Subcutaneous', 'Inhaled', 'Topical', 'Rectal'].map(x => `<option ${l.route === x ? 'selected' : ''}>${x}</option>`).join('')}</select></div><div class="field"><label>Frequency</label><select class="input sm" data-k="frequency">${FREQS.map(x => `<option ${l.frequency === x ? 'selected' : ''}>${x}</option>`).join('')}</select></div><div class="field"><label>Days</label><input class="input sm" type="number" min="1" max="90" data-k="days" value="${esc(l.days)}"></div></div>` : ''}
        ${l.kind === 'rad' && l.ref.laterality ? `<div class="row" style="margin-top:8px"><span class="small muted">Side</span>${['Left', 'Right', 'Both'].map(s => `<label class="check small"><input type="radio" name="side${i}" data-k="side" value="${s}" ${l.side === s ? 'checked' : ''}> ${s}</label>`).join('')}</div>` : ''}
        <input class="input sm" style="margin-top:8px" data-k="notes" placeholder="${l.kind === 'lab' || l.kind === 'rad' ? 'Clinical information for the department' : 'Instructions (optional)'}" value="${esc(l.notes)}" aria-label="Notes">
        ${l.alerts.map(a => `<div class="alert-cdss ${a.level === 'warn' ? 'warn' : ''}" style="margin-top:8px">${icon(a.type === 'Allergy' ? 'shield-alert' : 'copy')}<div class="grow">${esc(a.text)}</div></div>`).join('')}
        ${l.alerts.length ? `<div class="field" style="margin-top:8px"><label>Override reason<span class="req">*</span></label><select class="input sm" data-k="reason"><option value="">Select a reason to continue</option>${OVERRIDE.map(x => `<option ${l.reason === x ? 'selected' : ''}>${x}</option>`).join('')}</select></div>` : ''}
      </div>`).join('') : `<div class="empty">${icon('shopping-basket')}<b>No orders yet</b><span>Add tests, exams or medicines from the catalogue.</span></div>`;
      $$('[data-line]', b).forEach(row => {
        const l = basket[+row.dataset.line];
        $$('[data-k]', row).forEach(inp => inp.addEventListener(inp.tagName === 'SELECT' || inp.type === 'radio' ? 'change' : 'input', () => { l[inp.dataset.k] = inp.value; if (inp.dataset.k === 'reason' || inp.type === 'radio') drawBasket(); else upd(); }));
      });
      $$('[data-rm]', b).forEach(x => x.addEventListener('click', () => { const l = basket[+x.dataset.rm]; l.alerts.forEach(a => logAlert(a.type, p.id, a.text.slice(0, 120), 'Order removed')); basket.splice(+x.dataset.rm, 1); save(); drawBasket(); }));
      upd();
    }
    function upd() {
      const errs = basket.map(valid).filter(Boolean);
      $('#cpGo', host).disabled = !canAdd || !basket.length || errs.length > 0;
      $('#cpHint', host).textContent = !basket.length ? '' : errs.length ? errs[0] + '.' : basket.filter(l => l.restricted).length ? basket.filter(l => l.restricted).length + ' line(s) go to approval first.' : 'Ready to send.';
    }
    $('#cpClear', host).addEventListener('click', () => { basket.length = 0; drawBasket(); });
    $('#cpGo', host).addEventListener('click', () => {
      const dr = actingDoctor();
      const rxNo = o.rx || (setting === 'OPD' && basket.some(l => l.kind === 'med')) ? K.nextNo('RX-26-', db.orders, 'rxNo') : '';
      const created = basket.map(l => {
        const base = { id: nextOrderId(), no: K.nextNo('ORD-', db.orders), type: l.kind, encounterId: enc.id, patientId: p.id, code: l.code, name: l.name + (l.side ? ' (' + l.side + ')' : ''), priority: l.priority, orderedAt: nowStamp(), by: dr.id, createdBy: (me() || {}).id, notes: [l.side ? 'Laterality: ' + l.side : '', l.notes].filter(Boolean).join('. ') };
        if (l.kind === 'med') Object.assign(base, { setting, rxNo: setting === 'OPD' ? rxNo : undefined, itemId: l.itemId, dose: l.dose, route: l.route, frequency: l.frequency, days: +l.days, qty: Math.ceil(+l.days * perDay(l.frequency)) });
        if (l.kind === 'med' && setting === 'IPD') delete base.rxNo;
        base.status = l.restricted ? 'Pending approval' : l.kind === 'med' ? 'Pending verification' : l.kind === 'diet' || l.kind === 'care' ? 'Active' : 'Ordered';
        if (l.restricted) Object.assign(base, { restricted: true, restrictReason: l.restricted });
        if (l.alerts.length) { base.cdss = l.alerts.map(a => ({ type: a.type, text: a.text, override: l.reason })); l.alerts.forEach(a => logAlert(a.type, p.id, a.text.slice(0, 120), 'Overridden', l.reason)); }
        db.orders.push(base);
        return base;
      });
      save();
      audit(o.rx ? 'e-Prescription signed' : 'Orders placed', o.rx ? 'Prescription' : 'Order', { id: created[0].id, label: (rxNo || created.map(c => c.no).join(', ')) + ' · ' + p.name }, created.map(c => [c.no, '', c.name + ' · ' + c.status]), { reason: created.some(c => c.cdss) ? 'CDSS override: ' + created.filter(c => c.cdss).map(c => c.cdss[0].override).join('; ') : '' });
      toast(o.rx ? `Prescription ${rxNo} signed and sent to pharmacy` : `${created.length} order${created.length > 1 ? 's' : ''} sent${created.some(c => c.restricted) ? ', some waiting for approval' : ''}`);
      basket.length = 0; drawBasket();
      o.onDone && o.onDone(created, rxNo);
    });
    drawCat(); drawBasket();
  }


  /* Acknowledge a result (critical results need the action taken). */
  function ackResult(o, done) {
    const crit = isCritical(o);
    window.UI.confirm({ title: crit ? 'Acknowledge critical result' : 'Mark result as reviewed', tone: crit ? 'warn' : 'primary', icon: crit ? 'siren' : 'check', confirm: 'Acknowledge',
      body: `<b>${esc(K.ptName(o.patientId))}</b> · ${esc(o.name)}<div style="margin-top:6px">${resultLine(o)}</div>`,
      extra: `<div class="field" style="margin-top:12px"><label for="ackC">Action taken${crit ? '<span class="req">*</span>' : ''}</label><textarea class="input" id="ackC" placeholder="${crit ? 'For example: patient reviewed, ECG repeated, cardiology informed' : 'Optional comment'}"></textarea></div>`,
      onMount: (el) => { const ok = $('[data-ok]', el), c = $('#ackC', el); if (crit) { ok.disabled = true; c.addEventListener('input', () => { ok.disabled = c.value.trim().length < 3; }); } },
      onConfirm: () => {
        const c = ($('#ackC') || {}).value || '';
        db.emrResultAcks.push({ orderId: o.id, by: me().displayName, at: nowStamp(), comment: c });
        if (crit) logAlert('Critical value', o.patientId, o.name + ': ' + (o.results || []).filter(r => r.critical).map(r => r.name + ' ' + r.value + ' ' + r.unit).join(', '), 'Acknowledged', c);
        save(); audit(crit ? 'Critical result acknowledged' : 'Result reviewed', 'Order', { id: o.id, label: o.no + ' · ' + K.ptName(o.patientId) }, [['Review', '', 'Acknowledged']], { reason: c });
        toast('Result acknowledged'); done && done();
      } });
  }

  /* ---------- Orders table (patient or encounter) ---------- */
  function ordersTable(list, opts) {
    opts = opts || {};
    if (!list.length) return `<div class="empty">${icon('list-plus')}<b>${esc(opts.empty || 'No orders yet')}</b></div>`;
    return `<div class="table-wrap"><table class="tbl compact"><thead><tr><th>Order</th><th>Type</th><th>Item</th><th>Priority</th><th>Ordered</th><th>Status</th><th>Result</th></tr></thead><tbody>${list.map(o => `<tr>
      <td><span class="mono">${esc(o.no)}</span>${o.rxNo ? `<div class="xs mute mono">${esc(o.rxNo)}</div>` : ''}</td><td>${icon(TYPE_ICON[o.type] || 'circle', 'mute')} ${esc(TYPE_LABEL[o.type] || o.type)}</td>
      <td><b>${esc(o.name)}</b>${o.type === 'med' ? `<div class="small muted">${esc(o.dose || '')} · ${esc(o.route || '')} · ${esc(o.frequency || '')}${o.days ? ' · ' + o.days + ' days' : ''}</div>` : o.notes ? `<div class="small muted">${esc(o.notes)}</div>` : ''}${o.cdss ? `<div class="xs" style="color:var(--warning);font-weight:700">${icon('shield-alert')} CDSS override: ${esc(o.cdss[0].override)}</div>` : ''}</td>
      <td>${K.priority(o.priority)}</td><td class="small" style="white-space:nowrap">${K.when(o.orderedAt)}<div class="xs mute">${esc(K.docName(o.by))}</div></td><td>${K.status(o.status)}</td><td class="small">${o.results ? resultLine(o) : '<span class="mute">-</span>'}</td></tr>`).join('')}</tbody></table></div>`;
  }

  /* ---------- Printing ---------- */
  function rxLines(rxNo) { return db.orders.filter(o => o.type === 'med' && o.rxNo === rxNo); }
  function printRx(rxNo) {
    const lines = rxLines(rxNo); if (!lines.length) return;
    const p = K.pt(lines[0].patientId), e = K.enc(lines[0].encounterId) || {}, d = K.doc(lines[0].by) || {};
    const live = lines.filter(l => l.status !== 'Cancelled');
    K.printDoc({ title: 'e-Prescription ' + rxNo, sub: 'Outpatient prescription',
      html: `<div style="display:flex;justify-content:space-between;gap:16px;margin-bottom:12px"><div><b style="font-size:15px">${esc(p.name)}</b><div>${esc(p.mrn)} · ${esc(K.sexAge(p))} · Civil ID ${esc(p.civilId || '-')}</div><div>Allergies: <b style="color:#B42318">${esc((p.allergies || []).join(', ') || 'No known allergies')}</b></div></div>
        <div style="text-align:end"><b>${esc(rxNo)}</b><div>${esc(K.day(lines[0].orderedAt))}</div><div>Visit ${esc(e.no || '')}</div><div>${esc(K.payerLabel(p))}</div></div></div>
        <div style="font-size:26px;font-weight:800;font-family:serif;margin:4px 0 6px">℞</div>
        <table><thead><tr><th>#</th><th>Medicine</th><th>Dose</th><th>Route</th><th>Frequency</th><th>Days</th><th>Qty</th></tr></thead><tbody>${live.map((l, i) => `<tr><td>${i + 1}</td><td><b>${esc(l.name)}</b>${l.notes ? `<div style="font-size:11px;color:#555">${esc(l.notes)}</div>` : ''}</td><td>${esc(l.dose)}</td><td>${esc(l.route)}</td><td>${esc(l.frequency)}</td><td>${esc(l.days)}</td><td>${esc(l.qty)}</td></tr>`).join('')}</tbody></table>
        ${lines.length > live.length ? `<div style="margin-top:6px;font-size:11px;color:#555">${lines.length - live.length} cancelled line(s) not printed.</div>` : ''}
        <div class="doc-sign" style="display:flex;justify-content:space-between;margin-top:28px;align-items:flex-end"><div style="font-size:11px;color:#555">Electronically signed. Valid for 7 days from the date of issue.<br>Dispense at any Tibbi pharmacy. Barcode: ${esc(rxNo.replace(/\D/g, ''))}</div><div style="text-align:center"><div style="font-family:cursive;font-size:18px">${esc(d.name || '')}</div><div style="border-top:1px solid #999;padding-top:3px;font-size:11px">${esc(d.name || '')}, ${esc(d.specialty || '')}<br>MOH licence ${esc('KW-MD-' + (10400 + parseInt(String(d.id || '0').replace(/\D/g, ''), 10)))}</div></div></div>` });
    audit('e-Prescription printed', 'Prescription', { id: rxNo, label: rxNo + ' · ' + p.name }, []);
  }
  function noteHtml(n) {
    const e = K.enc(n.encounterId) || {}, p = K.pt(n.patientId) || {}, d = K.doc(n.doctorId) || {};
    const tpl = (db.emrTemplates || []).find(t => t.id === n.templateId);
    const abn = Object.entries(n.exam || {}).filter(([, v]) => v.st === 'A');
    const ords = db.orders.filter(o => o.encounterId === n.encounterId && o.status !== 'Cancelled');
    return `<div style="display:flex;justify-content:space-between;margin-bottom:10px"><div><b style="font-size:15px">${esc(p.name)}</b><div>${esc(p.mrn)} · ${esc(K.sexAge(p))} · Allergies: <b>${esc((p.allergies || []).join(', ') || 'NKA')}</b></div></div><div style="text-align:end"><b>${esc(e.type || '')} ${esc(e.no || '')}</b><div>${esc(K.day(e.start))}</div><div>${esc(d.name || '')}, ${esc(d.specialty || '')}</div></div></div>
      <h3>Consultation note</h3>
      <p><b>Chief complaint:</b> ${esc(n.complaint || '-')}</p><p><b>History of present illness:</b> ${esc(n.hpi || '-')}</p>
      <p><b>Examination (${esc(tpl ? tpl.name : '')} template):</b> ${abn.length ? abn.map(([k, v]) => `${esc(k)}: ${esc(v.text || 'abnormal')}`).join('; ') : 'No abnormal findings recorded.'} ${esc(n.examNote || '')}</p>
      <p><b>S:</b> ${esc(n.subjective || '-')}<br><b>O:</b> ${esc(n.objective || '-')}<br><b>A:</b> ${esc(n.assessment || '-')}<br><b>P:</b> ${esc(n.plan || '-')}</p>
      <p><b>Diagnoses:</b> ${(n.diagnoses || []).map(x => `${esc(x.code)} ${esc(x.name)}${x.primary ? ' (primary)' : ''}`).join('; ') || '-'}</p>
      <p><b>Orders:</b> ${ords.map(o => esc(o.name)).join(', ') || 'None'}</p>
      <p><b>Follow-up:</b> ${n.followUpDays ? 'In ' + esc(n.followUpDays) + ' days' : 'As needed'}. ${esc(n.instructions || '')}</p>
      <div class="doc-sign" style="margin-top:20px;font-size:11px;color:#555">${n.status === 'Signed' ? `Electronically signed by ${esc(n.signedBy)} on ${esc(window.UI.fmtDate(n.signedAt))}` : 'DRAFT, not signed'}</div>`;
  }

  /* Kit charts draw on a fixed 640-unit viewBox, so axis text grows on wide cards. Keep it at about 11px on screen. */
  (function fitCharts() {
    let t;
    const fit = () => document.querySelectorAll('svg.chart').forEach(s => { const w = s.getBoundingClientRect().width, vb = s.viewBox && s.viewBox.baseVal ? s.viewBox.baseVal.width : 0; if (!w || !vb) return; const k = Math.min(1.2, vb / w); s.querySelectorAll('.axis-t').forEach(x => { x.style.fontSize = (11 * k).toFixed(2) + 'px'; }); });
    const later = () => { clearTimeout(t); t = setTimeout(fit, 30); };
    window.addEventListener('resize', later);
    const watch = () => { later(); new MutationObserver(later).observe(document.body, { childList: true, subtree: true }); };
    if (document.body) watch(); else document.addEventListener('DOMContentLoaded', watch);
  })();
  window.EMR = { elapsedMins, ensure, clinicalDoctors, myDoctor, actingDoctor, doctorPicker, noteFor, visitStatus, waitMins, waitLabel, VITALS, vp, vitalFlag, vitalsOf, vitalTiles, vitalsChart,
    TYPE_LABEL, TYPE_ICON, isOpen, ordersOf, hoursSince, isCritical, isAbnormal, ackOf, ackResult, flagHtml, resultLine, restrictedReason, nextOrderId, allergyAlerts, duplicateAlerts, logAlert,
    DIETS, CARE, FREQS, OVERRIDE, cpoe, ordersTable, rxLines, printRx, noteHtml };
})();
