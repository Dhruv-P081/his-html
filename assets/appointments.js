/* Appointments and Call Centre helpers (window.Appt), shared by the pages in appointments/.
 * Load after kit.js. Reads and writes the appointments* keys and adds OPD encounters on check-in. */
(function () {

  /* Right-align the header of numeric columns (UI.table only sets the class on body cells). */
  if (!UI.table.numHeads) { const t0 = UI.table; UI.table = function (host, o) { const r = t0.apply(this, arguments); ((o && o.columns) || []).forEach((c, i) => { if (/\bnum\b/.test(c.cls || '')) { const th = host.querySelector('th[data-c="' + i + '"]'); if (th) th.classList.add('num'); } }); return r; }; UI.table.numHeads = true; }
  const { db, save, esc, icon, $, $$, R, can, toast, audit, drawer, confirm, field, showErrors, me, nowStamp, fmtDate } = window.UI;
  const T = db.TODAY;
  const NOW = '11:00';                       // prototype clock for today's slots
  const pad = (n, w) => String(n).padStart(w || 2, '0');
  const toMin = (t) => +t.slice(0, 2) * 60 + +t.slice(3, 5);
  const toHM = (m) => pad(Math.floor(m / 60)) + ':' + pad(m % 60);
  const dow = (d) => new Date(d + 'T00:00:00').getDay();
  const DOW = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const DOW3 = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const STATUSES = ['Booked', 'Confirmed', 'Arrived', 'Completed', 'No-show', 'Cancelled'];
  const ACTIVE = (a) => a.status !== 'Cancelled';
  const meName = () => (me() || {}).displayName || 'User';
  const stamp = () => T + ' ' + nowStamp().slice(11, 16);
  const dayLabel = (d) => `${DOW3[dow(d)]} ${fmtDate(d)}`;

  /* ---------- Lookups ---------- */
  const list = (k) => db[k] || [];
  const type = (code) => list('appointmentsTypes').find(t => t.code === code);
  const typeName = (code) => (type(code) || {}).name || code;
  const shift = (code) => list('appointmentsShifts').find(s => s.code === code);
  const slotDef = (code) => list('appointmentsSlots').find(s => s.code === code);
  const resource = (code) => list('appointmentsResources').find(r => r.code === code);
  const reason = (code) => list('appointmentsCancelReasons').find(r => r.code === code);
  const tpl = (code) => list('appointmentsTemplates').find(t => t.code === code);
  const appt = (id) => list('appointmentsBookings').find(a => a.id === id);
  const bookDoctors = () => db.doctors.filter(d => d.clinicId && list('appointmentsSessions').some(s => s.doctorId === d.id));
  const statusCls = (s) => ({ Booked: 'a-booked', Confirmed: 'a-booked', Arrived: 'a-arrived', Completed: 'a-done', 'No-show': 'a-cancel', Cancelled: 'a-cancel' }[s] || 'a-booked');
  const statusBadge = (s) => Kit.status(s, s === 'Confirmed' ? 'violet' : null);
  const typeTag = (code) => `<span class="tag" title="${esc(typeName(code))}">${esc(code)}</span>`;

  /* Keep appointment status in step with the OPD encounter after check-in. */
  (function sync() {
    let changed = false;
    list('appointmentsBookings').forEach(a => {
      if (!a.encounterId || a.status !== 'Arrived') return;
      const e = Kit.enc(a.encounterId);
      if (e && e.status === 'Completed') { a.status = 'Completed'; a.history.push([e.end || stamp(), 'System', 'Completed', 'Visit ' + e.no + ' completed']); changed = true; }
    });
    if (changed) save();
  })();

  /* ---------- Sessions, overrides and slots ---------- */
  function sessionsFor(doctorId, date) { return list('appointmentsSessions').filter(s => s.doctorId === doctorId && s.status !== 'Inactive' && s.weekday === dow(date)); }
  function overrideFor(doctorId, date, time) {
    const d = Kit.doc(doctorId) || {};
    return list('appointmentsOverrides').find(o => o.status === 'Approved' && date >= o.from && date <= o.to &&
      ((o.kind === 'Holiday closure' && (!o.branchId || o.branchId === d.branchId)) || (o.doctorId && o.doctorId === doctorId)) &&
      (!o.start || !time || (time >= o.start && time < o.end))) || null;
  }
  function resourceBlocked(code, date, time) {
    return list('appointmentsOverrides').find(o => o.status === 'Approved' && o.resourceCode === code && date >= o.from && date <= o.to && (!o.start || (time >= o.start && time < o.end))) || null;
  }
  /* slots(doctorId, date) -> [{ time, dur, appts, block, past }] */
  function slots(doctorId, date) {
    const out = {};
    sessionsFor(doctorId, date).forEach(s => {
      const sh = shift(s.shiftCode), sd = slotDef(s.slotCode); if (!sh || !sd) return;
      for (let m = toMin(sh.start); m + sd.duration <= toMin(sh.end); m += sd.duration) { const t = toHM(m); out[t] = out[t] || { time: t, dur: sd.duration, session: s }; }
    });
    const bk = list('appointmentsBookings').filter(a => a.doctorId === doctorId && a.date === date);
    bk.forEach(a => { if (!out[a.time]) out[a.time] = { time: a.time, dur: a.duration || 20, extra: true }; });
    // Walk-in OPD visits today occupy the slot too.
    const walk = date === T ? db.encounters.filter(e => e.type === 'OPD' && e.doctorId === doctorId && e.start.slice(0, 10) === T && e.source !== 'Appointment') : [];
    return Object.values(out).sort((a, b) => a.time.localeCompare(b.time)).map(s => Object.assign(s, {
      appts: bk.filter(a => a.time === s.time), walkIn: walk.find(e => e.start.slice(11, 16) === s.time) || null,
      block: overrideFor(doctorId, date, s.time), past: date < T || (date === T && s.time < NOW),
    }));
  }
  const isFree = (s) => !s.block && !s.past && !s.walkIn && !s.appts.some(ACTIVE);
  function freeSlots(doctorId, date) { return slots(doctorId, date).filter(isFree); }
  function nextFree(doctorId, from, days) {
    for (let i = 0; i < (days || 14); i++) { const d = Kit.addDays(from || T, i); const f = freeSlots(doctorId, d); if (f.length) return { date: d, time: f[0].time, count: f.length }; }
    return null;
  }
  function freeCount(doctorId, from, days) { let n = 0; for (let i = 0; i < days; i++) n += freeSlots(doctorId, Kit.addDays(from, i)).length; return n; }

  /* ---------- Messages ---------- */
  function fill(body, a) {
    const p = Kit.pt(a.patientId) || {}, d = Kit.doc(a.doctorId) || {};
    const map = { patient: p.name || '', doctor: d.name || '', clinic: UI.L.clName(a.clinicId), branch: UI.L.bName(a.branchId), date: fmtDate(a.date), time: a.time, ref: a.no, type: typeName(a.type).toLowerCase() };
    return String(body || '').replace(/\{(\w+)\}/g, (m, k) => (k in map ? map[k] : m));
  }
  function templateFor(event, a, channel) {
    const p = Kit.pt(a.patientId) || {};
    const lang = p.lang === 'Arabic' ? 'Arabic' : 'English';
    const all = list('appointmentsTemplates').filter(t => t.event === event && t.status !== 'Inactive' && t.channel === (channel || 'SMS'));
    return all.find(t => t.language === lang) || all[0] || null;
  }
  function previewHtml(event, a, channel) {
    const t = templateFor(event, a, channel);
    if (!t) return `<div class="banner warn">${icon('message-square-warning')}<span>No active ${esc(event.toLowerCase())} template for ${esc(channel || 'SMS')}. Add one in Appointment Masters.</span></div>`;
    const p = Kit.pt(a.patientId) || {};
    return `<div class="card" style="background:var(--soft)"><div class="card-pad">
      <div class="row small" style="margin-bottom:6px">${icon(t.channel === 'Email' ? 'mail' : 'message-square')}<b>${esc(t.channel)} ${esc(event.toLowerCase())}</b><span class="mono muted">${esc(t.code)}</span><span class="grow"></span><span class="muted">To ${esc(t.channel === 'Email' ? (p.email || 'no email on file') : (p.mobile || 'no mobile on file'))}</span></div>
      <div style="white-space:pre-wrap;font-size:13px;line-height:1.5" ${t.language === 'Arabic' ? 'dir="rtl"' : ''}>${esc(fill(t.body, a))}</div>
      <div style="margin-top:8px">${Kit.scopeNote('SMS and email delivery depends on the agreed gateway scope. Until then messages are queued and shown here.')}</div></div></div>`;
  }
  function logMessage(event, a, channel) {
    const t = templateFor(event, a, channel); if (!t) return;
    const p = Kit.pt(a.patientId) || {};
    db.appointmentsMessages.unshift({ id: UI.uid('ms'), apptId: a.id, at: stamp(), event, channel: t.channel, templateCode: t.code, to: t.channel === 'Email' ? p.email : p.mobile, status: 'Queued' });
  }

  /* ---------- Patient search (inline, used inside drawers) ---------- */
  function patientPicker(host, onPick, preset) {
    let cur = preset ? Kit.pt(preset) : null;
    const draw = () => {
      if (cur) {
        const up = list('appointmentsBookings').filter(a => a.patientId === cur.id && a.date >= T && /Booked|Confirmed/.test(a.status));
        host.innerHTML = `<div class="row" style="gap:10px;padding:10px 12px;border:1px solid var(--line);border-radius:10px">${Kit.patientCell(cur, esc(cur.mobile || ''))}<span class="grow"></span><button class="btn xs" type="button" data-chg>${icon('repeat')} Change</button></div>
          ${up.length ? `<div style="margin-top:10px"><div class="xs muted b" style="margin-bottom:4px">${icon('calendar-check')} Upcoming appointments</div>${up.slice(0, 3).map(a => `<div class="row small" style="gap:8px;padding:3px 0"><b style="min-width:150px">${esc(dayLabel(a.date))}, ${esc(a.time)}</b><span class="grow">${esc(Kit.docName(a.doctorId))}</span><span class="mono xs muted">${esc(a.no)}</span></div>`).join('')}</div>` : ''}`;
        $('[data-chg]', host).addEventListener('click', () => { cur = null; onPick(null); draw(); });
        return;
      }
      host.innerHTML = `<div class="search">${icon('search')}<input class="input" id="apPtQ" placeholder="Name, MRN, Civil ID or mobile" autocomplete="off" aria-label="Find patient"></div><div class="card" style="margin-top:8px;max-height:220px;overflow:auto" id="apPtL"></div>`;
      const q = $('#apPtQ', host), l = $('#apPtL', host);
      const run = () => {
        const s = q.value.trim().toLowerCase(), sd = s.replace(/\D/g, '');
        const res = !s ? [] : db.patients.filter(p => [p.name, p.mrn, p.civilId, p.nameAr].join(' ').toLowerCase().includes(s) || (sd.length >= 4 && String(p.mobile || '').replace(/\D/g, '').includes(sd))).slice(0, 8);
        l.innerHTML = !s ? `<div class="small muted" style="padding:10px 12px">Type at least 2 characters.</div>` : res.length ? `<div class="list-rows pad">${res.map(p => `<div data-p="${p.id}" style="cursor:pointer">${Kit.patientCell(p)}<span class="grow"></span><span class="small muted">${esc(p.mobile || '')}</span></div>`).join('')}</div>` : `<div class="empty" style="padding:18px">${icon('search')}<b>No patient found</b><span>Register the patient at Reception first.</span></div>`;
        $$('[data-p]', l).forEach(r => r.addEventListener('click', () => { cur = Kit.pt(r.dataset.p); onPick(cur); draw(); }));
      };
      q.addEventListener('input', run); run();
    };
    draw();
    if (cur) onPick(cur);
  }

  /* ---------- Slot picker (doctor, date, free time chips) ---------- */
  function slotPicker(el, st, onChange, opts) {
    opts = opts || {};
    const docs = bookDoctors();
    $('#apDoc', el).innerHTML = `<option value="">Select doctor</option>` + docs.map(d => `<option value="${d.id}" ${d.id === st.doctorId ? 'selected' : ''}>${esc(d.name)} · ${esc(d.specialty)}${d.branchId !== 'br_01' ? ' · ' + esc((UI.L.branch(d.branchId) || {}).code || '') : ''}</option>`).join('');
    const drawTimes = () => {
      const host = $('#apTimes', el);
      if (!st.doctorId || !st.date) { host.innerHTML = '<div class="small muted">Choose a doctor and date.</div>'; return; }
      const ov = overrideFor(st.doctorId, st.date);
      const all = slots(st.doctorId, st.date);
      const free = all.filter(s => isFree(s) || (opts.keep && s.appts.some(a => a.id === opts.keep)));
      if (!all.length) host.innerHTML = `<div class="banner warn">${icon('calendar-x')}<span>No clinic session on ${esc(DOW[dow(st.date)])}.${(() => { const n = nextFree(st.doctorId, st.date, 14); return n ? ` Next free slot: ${esc(dayLabel(n.date))} at ${esc(n.time)}.` : ''; })()}</span></div>`;
      else if (!free.length) host.innerHTML = `<div class="banner warn">${icon('calendar-x')}<span>${ov && !ov.start ? esc(ov.kind + ': ' + ov.reason) + '.' : 'No free slots on this date.'}${(() => { const n = nextFree(st.doctorId, Kit.addDays(st.date, 1), 14); return n ? ` Next free slot: ${esc(dayLabel(n.date))} at ${esc(n.time)}.` : ''; })()}</span></div>`;
      else host.innerHTML = `<div class="chips">${free.map(s => `<button type="button" class="chip ${s.time === st.time ? 'sel' : ''}" data-tm="${s.time}">${esc(s.time)}</button>`).join('')}</div><div class="xs muted" style="margin-top:6px">${free.length} free of ${all.length} slots · ${all[0].dur} minutes each</div>`;
      if (st.time && !free.some(s => s.time === st.time)) { st.time = ''; }
      $$('[data-tm]', host).forEach(b => b.addEventListener('click', () => { st.time = b.dataset.tm; drawTimes(); onChange(); }));
    };
    $('#apDoc', el).addEventListener('change', (e) => { st.doctorId = e.target.value; st.time = ''; drawTimes(); onChange(); });
    $('#apDate', el).addEventListener('change', (e) => { st.date = e.target.value; st.time = ''; drawTimes(); onChange(); });
    drawTimes();
    return drawTimes;
  }

  /* ---------- Book ---------- */
  /* bookDrawer({ doctorId, date, time, patientId, source, onDone(appt) }) */
  function bookDrawer(o) {
    o = o || {};
    if (!can('appointments.book.slot', 'add')) { toast('You need Add permission on Appointment Book.', 'err'); return; }
    const st = { patientId: o.patientId || '', doctorId: o.doctorId || '', date: o.date || T, time: o.time || '', type: 'CON', resourceCode: '', channel: 'SMS', send: true };
    const types = list('appointmentsTypes').filter(t => t.status !== 'Inactive');
    drawer({ title: 'Book appointment', sub: 'Pick the patient, doctor and a free slot.', wide: true,
      body: `<div class="err-summary hidden"></div>
        <div class="form-grid">
          <div class="section-t full">Patient</div>
          <div class="full" id="apPt"></div>
          <div class="section-t full">Doctor and slot</div>
          <div class="field"><label for="apDoc">Doctor<span class="req">*</span></label><select class="input" id="apDoc"></select><div class="err hidden" data-err="apDoc"></div></div>
          ${field({ id: 'apDate', label: 'Date', type: 'date', value: st.date, req: true, attrs: `min="${T}"` })}
          <div class="field full"><label>Time<span class="req">*</span></label><div id="apTimes"></div><div class="err hidden" data-err="apTime"></div></div>
          <div class="section-t full">Visit</div>
          ${field({ id: 'apType', label: 'Appointment type', type: 'select', req: true, value: st.type, placeholder: false, options: types.map(t => [t.code, `${t.name} (${t.code})`]), hint: 'Type labels are to be confirmed with Tibbi.' })}
          <div class="field" id="apResWrap"><label for="apRes">Resource<span class="req">*</span></label><select class="input" id="apRes"></select><div class="hint">Technician or machine for this visit.</div><div class="err hidden" data-err="apRes"></div></div>
          ${field({ id: 'apSrc', label: 'Booked through', type: 'select', placeholder: false, value: o.source || 'Front desk', options: ['Front desk', 'Call centre', 'Patient app', 'Doctor referral'].map(x => [x, x]) })}
          ${field({ id: 'apReason', label: 'Reason for visit', max: 160, placeholder: 'For example: knee pain for 2 weeks' })}
          <div class="section-t full">Confirmation message</div>
          <div class="full row wrap" style="gap:14px"><label class="check"><input type="checkbox" id="apSend" checked> Send confirmation</label>
            <div class="seg" id="apCh"><button type="button" class="on" data-ch="SMS">${icon('message-square')}SMS</button><button type="button" data-ch="Email">${icon('mail')}Email</button></div></div>
          <div class="full" id="apPrev"></div>
        </div>`,
      foot: `<button class="btn" data-close>Cancel</button><span class="grow"></span><button class="btn primary" id="apGo" disabled>${icon('calendar-check')} Book appointment</button>`,
      onMount: (el, close) => {
        const go = $('#apGo', el);
        const resOpts = () => {
          const t = type(st.type) || {}, d = Kit.doc(st.doctorId) || {};
          const wrap = $('#apResWrap', el); wrap.style.display = t.needsResource ? '' : 'none';
          if (!t.needsResource) { st.resourceCode = ''; return; }
          const rs = list('appointmentsResources').filter(r => r.status !== 'Inactive' && (!d.clinicId || r.clinicId === d.clinicId || st.type === 'HOM'));
          const sel = $('#apRes', el);
          sel.innerHTML = `<option value="">Select resource</option>` + rs.map(r => { const b = st.date && st.time ? resourceBlocked(r.code, st.date, st.time) : null; const busy = st.date && st.time && list('appointmentsBookings').some(a => a.resourceCode === r.code && a.date === st.date && a.time === st.time && ACTIVE(a)); return `<option value="${r.code}" ${r.code === st.resourceCode ? 'selected' : ''} ${b || busy ? 'disabled' : ''}>${esc(r.name)}${b ? ' (unavailable)' : busy ? ' (booked at this time)' : ''}</option>`; }).join('');
          if (!rs.some(r => r.code === st.resourceCode)) st.resourceCode = '';
        };
        const sync = () => {
          resOpts();
          const t = type(st.type) || {};
          go.disabled = !(st.patientId && st.doctorId && st.date && st.time && st.type && (!t.needsResource || st.resourceCode));
          const a = { no: 'APT-26-xxxxx', patientId: st.patientId, doctorId: st.doctorId, clinicId: (Kit.doc(st.doctorId) || {}).clinicId, branchId: (Kit.doc(st.doctorId) || {}).branchId, date: st.date, time: st.time || '--:--', type: st.type };
          $('#apPrev', el).innerHTML = st.send ? (st.patientId && st.doctorId ? previewHtml('Confirmation', a, st.channel) : '<div class="small muted">The preview appears after you pick the patient and doctor.</div>') : '<div class="small muted">No confirmation will be sent.</div>';
        };
        patientPicker($('#apPt', el), (p) => { st.patientId = p ? p.id : ''; sync(); }, st.patientId);
        slotPicker(el, st, sync);
        $('#apType', el).addEventListener('change', (e) => { st.type = e.target.value; sync(); });
        $('#apRes', el).addEventListener('change', (e) => { st.resourceCode = e.target.value; sync(); });
        $('#apSend', el).addEventListener('change', (e) => { st.send = e.target.checked; sync(); });
        $$('[data-ch]', el).forEach(b => b.addEventListener('click', () => { st.channel = b.dataset.ch; $$('[data-ch]', el).forEach(x => x.classList.toggle('on', x === b)); sync(); }));
        sync();
        go.addEventListener('click', () => {
          const errs = {};
          const dup = list('appointmentsBookings').find(a => a.patientId === st.patientId && a.doctorId === st.doctorId && a.date === st.date && /Booked|Confirmed|Arrived/.test(a.status));
          if (dup) errs.apDoc = `This patient already has ${dup.no} with this doctor on ${fmtDate(st.date)} at ${dup.time}.`;
          if (!st.time) errs.apTime = 'Choose a free time.';
          if (!showErrors(el, errs)) return;
          const d = Kit.doc(st.doctorId), t = type(st.type);
          const a = { id: UI.uid('ap'), no: Kit.nextNo('APT-26-', db.appointmentsBookings), patientId: st.patientId, doctorId: st.doctorId, clinicId: d.clinicId, branchId: d.branchId, date: st.date, time: st.time,
            duration: t.duration, type: st.type, resourceCode: st.resourceCode, status: 'Booked', source: $('#apSrc', el).value, reason: $('#apReason', el).value.trim(), encounterId: '', rescheduled: 0,
            createdBy: meName(), createdAt: stamp(), history: [[stamp(), meName(), 'Booked', $('#apSrc', el).value]] };
          db.appointmentsBookings.push(a);
          if (st.send) logMessage('Confirmation', a, st.channel);
          save(); audit('Appointment booked', 'Appointment', { id: a.id, label: a.no }, [['Patient', '', Kit.ptName(a.patientId)], ['Doctor', '', d.name], ['Slot', '', a.date + ' ' + a.time], ['Type', '', t.name]]);
          close(); toast(`Booked ${a.no} for ${fmtDate(a.date)} at ${a.time}`);
          o.onDone && o.onDone(a);
        });
      } });
  }

  /* ---------- Reschedule ---------- */
  function rescheduleDrawer(a, onDone) {
    if (!can('appointments.book.slot', 'edit')) { toast('You need Edit permission on Appointment Book.', 'err'); return; }
    const st = { doctorId: a.doctorId, date: a.date >= T ? a.date : T, time: '' };
    drawer({ title: 'Reschedule ' + a.no, sub: `${esc(Kit.ptName(a.patientId))} · now ${esc(dayLabel(a.date))} at ${esc(a.time)} with ${esc(Kit.docName(a.doctorId))}`, wide: true,
      body: `<div class="err-summary hidden"></div><div class="form-grid">
          <div class="field"><label for="apDoc">Doctor<span class="req">*</span></label><select class="input" id="apDoc"></select></div>
          ${field({ id: 'apDate', label: 'New date', type: 'date', value: st.date, req: true, attrs: `min="${T}"` })}
          <div class="field full"><label>New time<span class="req">*</span></label><div id="apTimes"></div></div>
          ${field({ id: 'apWhy', label: 'Reason for the change', type: 'textarea', req: true, full: true, max: 300 })}
          <div class="section-t full">Message preview</div><div class="full" id="apPrev"></div></div>`,
      foot: `<button class="btn" data-close>Cancel</button><span class="grow"></span><button class="btn primary" id="apGo" disabled>${icon('calendar-sync')} Reschedule</button>`,
      onMount: (el, close) => {
        const go = $('#apGo', el), why = $('#apWhy', el);
        const sync = () => {
          go.disabled = !(st.doctorId && st.date && st.time && why.value.trim().length >= 3 && !(st.doctorId === a.doctorId && st.date === a.date && st.time === a.time));
          const d = Kit.doc(st.doctorId) || {};
          $('#apPrev', el).innerHTML = previewHtml('Reschedule', Object.assign({}, a, { doctorId: st.doctorId, clinicId: d.clinicId, branchId: d.branchId, date: st.date, time: st.time || '--:--' }));
        };
        slotPicker(el, st, sync);
        why.addEventListener('input', sync); sync();
        go.addEventListener('click', () => {
          const before = `${a.date} ${a.time} ${Kit.docName(a.doctorId)}`;
          const d = Kit.doc(st.doctorId);
          Object.assign(a, { doctorId: st.doctorId, clinicId: d.clinicId, branchId: d.branchId, date: st.date, time: st.time, status: 'Booked', rescheduled: (a.rescheduled || 0) + 1 });
          a.history.push([stamp(), meName(), 'Rescheduled', `From ${before}. ${why.value.trim()}`]);
          logMessage('Reschedule', a);
          save(); audit('Appointment rescheduled', 'Appointment', { id: a.id, label: a.no }, [['Slot', before, `${a.date} ${a.time} ${d.name}`]], { reason: why.value.trim() });
          close(); toast(`${a.no} moved to ${fmtDate(a.date)} at ${a.time}`); onDone && onDone(a);
        });
      } });
  }

  /* ---------- Cancel, confirm, check in, no-show ---------- */
  function cancelAppt(a, onDone) {
    let code = '';
    const rs = list('appointmentsCancelReasons').filter(r => r.status !== 'Inactive');
    confirm({ title: 'Cancel ' + a.no + '?', body: `${esc(Kit.ptName(a.patientId))} with ${esc(Kit.docName(a.doctorId))}, ${esc(dayLabel(a.date))} at ${esc(a.time)}.`,
      impact: ['The slot becomes free for other patients.', 'A cancellation message is queued for the patient.'], confirm: 'Cancel appointment', cancel: 'Keep', reason: true,
      extra: `<div class="field" style="margin-top:14px"><label for="cxR">Cancellation reason<span class="req">*</span></label><select class="input" id="cxR"><option value="">Select reason</option>${rs.map(r => `<option value="${r.code}">${esc(r.name)} (${esc(r.initiatedBy)})</option>`).join('')}</select></div>`,
      onMount: (el) => {
        const ok = $('[data-ok]', el), r = $('[data-reason]', el), s = $('#cxR', el);
        const chk = () => { code = s.value; ok.disabled = !code || r.value.trim().length < 3; };
        s.addEventListener('change', chk); r.addEventListener('input', chk); chk();
      },
      onConfirm: (why) => {
        const rr = reason(code);
        Object.assign(a, { status: 'Cancelled', cancelReasonCode: code, cancelNote: why, cancelledAt: stamp(), cancelledBy: meName() });
        a.history.push([stamp(), meName(), 'Cancelled', `${rr ? rr.name : code}: ${why}`]);
        logMessage('Cancellation', a);
        save(); audit('Appointment cancelled', 'Appointment', { id: a.id, label: a.no }, [['Status', 'Booked', 'Cancelled'], ['Cancellation reason', '', rr ? rr.name : code]], { reason: why });
        toast(a.no + ' cancelled'); onDone && onDone(a);
      } });
  }
  function confirmAppt(a, onDone) {
    const before = a.status;
    a.status = 'Confirmed'; a.history.push([stamp(), meName(), 'Confirmed', 'Patient confirmed attendance']);
    save(); audit('Appointment confirmed', 'Appointment', { id: a.id, label: a.no }, [['Status', before, 'Confirmed']]);
    toast(a.no + ' confirmed'); onDone && onDone(a);
  }
  function nextEncId() { const max = db.encounters.reduce((m, e) => Math.max(m, parseInt(String(e.id).replace(/\D/g, ''), 10) || 0), 0); return 'en_' + pad(max + 1, 4); }
  function nextToken() { const max = db.encounters.filter(e => e.type === 'OPD' && e.start.slice(0, 10) === T && /^C\d+$/.test(e.token || '')).reduce((m, e) => Math.max(m, +e.token.slice(1)), 0); return 'C' + pad(max + 1, 3); }
  function checkIn(a, onDone) {
    if (a.date !== T) { toast('Only today’s appointments can be checked in.', 'err'); return; }
    const p = Kit.pt(a.patientId) || {}, d = Kit.doc(a.doctorId) || {};
    confirm({ title: 'Check in ' + Kit.ptName(a.patientId) + '?', tone: 'primary', icon: 'log-in', confirm: 'Check in',
      body: `Creates an OPD visit with ${esc(d.name)} (${esc(UI.L.clName(a.clinicId))}) and sends the patient to the clinic queue.`,
      impact: [`Payer: ${esc(Kit.payerLabel(p))}`, `Token ${esc(nextToken())}`],
      onConfirm: () => {
        const e = { id: nextEncId(), no: Kit.nextNo('OP-26-', db.encounters), type: 'OPD', patientId: a.patientId, doctorId: a.doctorId, clinicId: a.clinicId, deptId: d.deptId, branchId: a.branchId,
          start: stamp(), end: '', status: 'Checked in', token: nextToken(), visitType: a.type === 'FOL' ? 'Follow-up' : 'New', payer: p.payerId ? 'Insurance' : 'Cash', complaint: a.reason || typeName(a.type), source: 'Appointment' };
        db.encounters.push(e);
        const before = a.status;
        Object.assign(a, { status: 'Arrived', encounterId: e.id, arrivedAt: stamp() });
        a.history.push([stamp(), meName(), 'Checked in', `OPD visit ${e.no}, token ${e.token}`]);
        save(); audit('Appointment checked in', 'Appointment', { id: a.id, label: a.no }, [['Status', before, 'Arrived'], ['Encounter', '', e.no]]);
        toast(`Checked in. Visit ${e.no}, token ${e.token}`); onDone && onDone(a, e);
      } });
  }
  function noShow(a, onDone) {
    confirm({ title: 'Mark ' + a.no + ' as no-show?', body: `${esc(Kit.ptName(a.patientId))} did not attend ${esc(dayLabel(a.date))} at ${esc(a.time)}.`, confirm: 'Mark no-show', reason: true,
      impact: ['The appointment counts in the no-show report.'],
      onConfirm: (why) => {
        const before = a.status;
        a.status = 'No-show'; a.history.push([stamp(), meName(), 'Marked no-show', why]);
        save(); audit('Appointment marked no-show', 'Appointment', { id: a.id, label: a.no }, [['Status', before, 'No-show']], { reason: why });
        toast(a.no + ' marked as no-show'); onDone && onDone(a);
      } });
  }

  /* ---------- Print slip ---------- */
  function printSlip(a) {
    const p = Kit.pt(a.patientId) || {}, d = Kit.doc(a.doctorId) || {};
    Kit.printDoc({ title: 'Appointment slip ' + a.no, sub: 'Appointment confirmation',
      html: `<table><tbody>
        <tr><th>Reference</th><td><b>${esc(a.no)}</b></td><th>Status</th><td>${esc(a.status)}</td></tr>
        <tr><th>Patient</th><td>${esc(p.name)}</td><th>MRN</th><td>${esc(p.mrn)}</td></tr>
        <tr><th>Civil ID</th><td>${esc(p.civilId || '')}</td><th>Mobile</th><td>${esc(p.mobile || '')}</td></tr>
        <tr><th>Doctor</th><td>${esc(d.name)}</td><th>Clinic</th><td>${esc(UI.L.clName(a.clinicId))}, ${esc(d.room || '')}</td></tr>
        <tr><th>Date</th><td><b>${esc(dayLabel(a.date))}</b></td><th>Time</th><td><b>${esc(a.time)}</b> (${esc(a.duration || 20)} min)</td></tr>
        <tr><th>Type</th><td>${esc(typeName(a.type))}</td><th>Payer</th><td>${esc(Kit.payerLabel(p))}</td></tr>
        ${a.resourceCode ? `<tr><th>Resource</th><td colspan="3">${esc((resource(a.resourceCode) || {}).name || a.resourceCode)}</td></tr>` : ''}
      </tbody></table><p style="margin-top:14px;font-size:11.5px">Please arrive 15 minutes early with your Civil ID and insurance card. To change or cancel call 1880088.</p>` });
  }

  /* ---------- Detail drawer ---------- */
  function actionButtons(a, onChange) {
    const b = [];
    const open = /Booked|Confirmed/.test(a.status);
    const edT = can('appointments.track', 'edit'), cxT = can('appointments.track', 'cancel') || can('appointments.book.slot', 'cancel'), edB = can('appointments.book.slot', 'edit');
    if (a.status === 'Booked') b.push(`<button class="btn sm" data-act="confirm" ${edT || edB ? '' : 'disabled title="Needs Edit permission"'}>${icon('check')} Confirm</button>`);
    if (open && a.date === T) b.push(`<button class="btn sm primary" data-act="checkin" ${edT ? '' : 'disabled title="Needs Edit permission on Appointment Tracking"'}>${icon('log-in')} Check in</button>`);
    if (open) b.push(`<button class="btn sm" data-act="resched" ${edB ? '' : 'disabled title="Needs Edit permission on Appointment Book"'}>${icon('calendar-sync')} Reschedule</button>`);
    if (open && a.date <= T) b.push(`<button class="btn sm danger" data-act="noshow" ${edT ? '' : 'disabled title="Needs Edit permission on Appointment Tracking"'}>${icon('user-x')} No-show</button>`);
    if (open) b.push(`<button class="btn sm danger" data-act="cancel" ${cxT ? '' : 'disabled title="Needs Cancel permission"'}>${icon('calendar-x')} Cancel</button>`);
    b.push(`<button class="btn sm" data-act="print" ${can('appointments.track', 'print') || can('appointments.book.slot', 'print') ? '' : 'disabled title="Needs Print permission"'}>${icon('printer')} Slip</button>`);
    return b.join('');
  }
  function wireActions(root, a, onChange, closeFirst) {
    $$('[data-act]', root).forEach(btn => btn.addEventListener('click', (ev) => {
      ev.stopPropagation();
      const act = btn.dataset.act;
      if (closeFirst && act !== 'print') closeFirst();
      if (act === 'confirm') confirmAppt(a, onChange);
      if (act === 'checkin') checkIn(a, onChange);
      if (act === 'resched') rescheduleDrawer(a, onChange);
      if (act === 'noshow') noShow(a, onChange);
      if (act === 'cancel') cancelAppt(a, onChange);
      if (act === 'print') printSlip(a);
    }));
  }
  function detailDrawer(a, onChange) {
    const p = Kit.pt(a.patientId), d = Kit.doc(a.doctorId) || {}, e = a.encounterId ? Kit.enc(a.encounterId) : null;
    const msgs = list('appointmentsMessages').filter(m => m.apptId === a.id);
    const calls = list('appointmentsCalls').filter(c => c.apptId === a.id);
    const rr = a.cancelReasonCode ? reason(a.cancelReasonCode) : null;
    drawer({ title: a.no, sub: `${statusBadge(a.status)} ${typeTag(a.type)} ${esc(typeName(a.type))}`, wide: true,
      body: `${Kit.patientBanner(p, e)}
        <div class="grid g2" style="margin-top:14px">
          <div class="card card-pad"><dl class="kv tight">
            <dt>Doctor</dt><dd>${esc(d.name)}<div class="small muted">${esc(d.specialty)} · ${esc(d.grade || '')}</div></dd>
            <dt>Clinic</dt><dd>${esc(UI.L.clName(a.clinicId))} · ${esc(d.room || '')}<div class="small muted">${esc(UI.L.bName(a.branchId))}</div></dd>
            <dt>When</dt><dd>${esc(dayLabel(a.date))} at ${esc(a.time)} <span class="muted small">(${esc(a.duration || 20)} min)</span></dd>
            <dt>Type</dt><dd>${esc(typeName(a.type))}</dd>
            ${a.resourceCode ? `<dt>Resource</dt><dd>${esc((resource(a.resourceCode) || {}).name || a.resourceCode)}</dd>` : ''}
            <dt>Reason</dt><dd>${esc(a.reason || '-')}</dd>
            <dt>Booked</dt><dd>${esc(a.source)}${a.createdBy && a.createdBy !== a.source ? ' · ' + esc(a.createdBy) : ''}<div class="small muted">${esc(fmtDate(a.createdAt))}</div></dd>
            ${a.rescheduled ? `<dt>Rescheduled</dt><dd>${a.rescheduled} time${a.rescheduled > 1 ? 's' : ''}</dd>` : ''}
            ${rr ? `<dt>Cancelled</dt><dd>${esc(rr.name)}<div class="small muted">${esc(a.cancelNote || '')}</div></dd>` : ''}
            ${e ? `<dt>OPD visit</dt><dd><span class="mono">${esc(e.no)}</span> · token ${esc(e.token)} · ${Kit.status(e.status)}</dd>` : ''}
          </dl></div>
          <div class="card"><div class="card-head"><h3>${icon('history')} History</h3></div><div class="card-pad"><div class="timeline">${(a.history || []).slice().reverse().map(h => `<div class="tl-item ${/Cancel|no-show/i.test(h[2]) ? 'err' : /Checked|Complet|Confirm/.test(h[2]) ? 'ok' : ''}"><b>${esc(h[2])}</b><div class="meta">${esc(fmtDate(h[0]))} · ${esc(h[1])}</div>${h[3] && h[3] !== h[1] ? `<div class="small">${esc(h[3])}</div>` : ''}</div>`).join('')}</div></div></div>
        </div>
        <div class="card" style="margin-top:14px"><div class="card-head"><h3>${icon('message-square')} Messages</h3><div class="actions"><span class="small muted">${msgs.length} logged</span></div></div>
          ${msgs.length ? `<div class="table-wrap"><table class="tbl compact"><thead><tr><th>When</th><th>Event</th><th>Channel</th><th>Template</th><th>To</th><th>Status</th></tr></thead><tbody>${msgs.map(m => `<tr><td>${esc(Kit.when(m.at))}</td><td>${esc(m.event)}</td><td>${esc(m.channel)}</td><td class="mono">${esc(m.templateCode)}</td><td>${esc(m.to || '')}</td><td>${Kit.status(m.status, m.status === 'Queued' ? 'info' : null)}</td></tr>`).join('')}</tbody></table></div>` : '<div class="card-pad small muted">No messages logged for this appointment.</div>'}
          <div class="card-pad" style="border-top:1px solid var(--line)"><div class="small b" style="margin-bottom:8px">${a.status === 'Cancelled' ? 'Cancellation' : a.date > T ? 'Reminder' : 'Confirmation'} preview</div>${previewHtml(a.status === 'Cancelled' ? 'Cancellation' : a.date > T ? 'Reminder' : 'Confirmation', a)}</div></div>
        ${calls.length ? `<div class="card card-pad" style="margin-top:14px"><div class="small b">${icon('headset')} Linked calls</div>${calls.map(c => `<div class="small" style="margin-top:6px"><span class="mono">${esc(c.no)}</span> · ${esc(fmtDate(c.at))} · ${esc(c.agent)} · ${esc(c.purpose)}</div>`).join('')}</div>` : ''}`,
      foot: `<div class="btn-group row wrap" style="gap:8px">${actionButtons(a)}</div><span class="grow"></span><button class="btn" data-close>Close</button>`,
      onMount: (el, close) => wireActions(el, a, onChange, close) });
  }

  window.Appt = { T, NOW, DOW, DOW3, STATUSES, ACTIVE, toMin, toHM, dow, dayLabel, type, typeName, typeTag, shift, slotDef, resource, reason, tpl, appt, bookDoctors, statusCls, statusBadge,
    sessionsFor, overrideFor, resourceBlocked, slots, isFree, freeSlots, nextFree, freeCount, fill, templateFor, previewHtml, logMessage, patientPicker,
    bookDrawer, rescheduleDrawer, cancelAppt, confirmAppt, checkIn, noShow, printSlip, detailDrawer, actionButtons, wireActions, meName, stamp };
})();
