/* Laboratory module helpers (window.Lab). Load after kit.js on lab pages.
 * Radiology pages also load this file for the shared e-signature, reason picker, call log,
 * critical console and dispatch screen builders (both modules belong to the same owner). */
(function () {
  const { db, save, esc, icon, $, $$, R, can, toast, audit, me, nowStamp, uid, field, showErrors, drawer, table, fmtDate } = window.UI;
  const pad = (n) => String(n).padStart(2, '0');
  /* Module-scoped style: keep patient names on one line in work lists. */
  const st = document.createElement('style'); st.textContent = '.tbl .cell-main b{white-space:nowrap}'; document.head.appendChild(st);
  /* Apply the seeded lab workflow fields once to a stored database that was created before data-lab.js was loaded. */
  if (db.labOrderPatch && !db.labOrderPatchDone) {
    (db.orders || []).forEach(o => { const p = db.labOrderPatch[o.id]; if (p && o.type === 'lab') Object.assign(o, JSON.parse(JSON.stringify(p))); });
    db.labOrderPatchDone = true; save();
  }

  /* ---------- Lookups ---------- */
  const test = (code) => (db.labTests || []).find(t => t.code === code) || { code, name: code, section: 'General', container: '', specimen: '', tatHours: 24, price: 0 };
  const orders = () => (db.orders || []).filter(o => o.type === 'lab');
  const acc = (o) => 'L' + String(o.no || o.id).replace(/\D/g, '');
  const meName = () => (me() || {}).displayName || '';
  const isMe = (name) => !!name && name === meName();
  const mins = (a, b) => (a && b ? Math.round((new Date(b.replace(' ', 'T')) - new Date(a.replace(' ', 'T'))) / 60000) : 0);
  const dur = (m) => { m = Math.max(0, Math.round(m)); return m < 60 ? m + ' min' : m < 1440 ? Math.floor(m / 60) + ' h ' + pad(m % 60) + ' m' : Math.floor(m / 1440) + ' d ' + Math.floor((m % 1440) / 60) + ' h'; };
  /* ---------- Demo clock ----------
   * Seeded lab and radiology activity runs to late evening on db.TODAY. Elapsed times (TAT, transit, critical waits) use the real clock but
   * never run past the seeded snapshot (ANCHOR), and records seeded later than the real clock use the snapshot, so values stay realistic
   * at any time of day and on any real date. Records created on the page after the snapshot use the real clock. */
  const ANCHOR = (() => {
    const S = window.SEED || {}, T = db.TODAY; let m = T + ' 12:00';
    const take = (obj) => { if (!obj) return; Object.keys(obj).forEach(k => { const v = obj[k]; if (/At$/.test(k) && typeof v === 'string' && v.slice(0, 10) === T && v > m) m = v; }); };
    (S.orders || []).forEach(o => { if (o.type === 'lab' || o.type === 'rad') { take(o); take(o.report); } });
    Object.values(S.radiologyOrderPatch || {}).forEach(p => { take(p); take(p.report); });
    const d = new Date(m.replace(' ', 'T')); d.setMinutes(d.getMinutes() + 10);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  })();
  function clockMins(start) {
    if (!start) return 0;
    const a = mins(start, ANCHOR), e = Math.round((Date.now() - new Date(String(start).replace(' ', 'T'))) / 60000);
    if (a <= 0) return Math.max(0, e);
    if (e < 0) return a;
    return Math.min(e, a);
  }
  /* Waiting time for alerts (critical values): stays under the cap with a stable value per record when the clock would show hours. */
  function waitMins(start, cap) {
    const m = clockMins(start); cap = cap || 60;
    if (m <= cap) return m;
    let h = 7; String(start).split('').forEach(c => { h = (h * 31 + c.charCodeAt(0)) % 100003; });
    return Math.round(cap * 0.2) + h % Math.round(cap * 0.6);
  }
  const local = (s) => String(s || nowStamp()).replace(' ', 'T');
  const fromLocal = (v) => String(v || '').replace('T', ' ').slice(0, 16);

  /* Where the patient is (OPD, ER area, ward and bed). */
  function location(o) {
    const e = window.Kit.enc(o.encounterId);
    if (!e) return 'OPD';
    if (e.type === 'IPD') { const b = window.Kit.bed(e.bedId); const w = b ? window.Kit.ward(b.wardId) : null; return (w ? w.name : 'Ward') + (b ? ' · ' + b.no : ''); }
    if (e.type === 'ER') return 'ER' + (e.area ? ' · ' + e.area : '');
    return 'OPD';
  }
  const setting = (o) => (window.Kit.enc(o.encounterId) || {}).type || 'OPD';

  /* ---------- Stages ---------- */
  const STAGES = [
    ['new', 'New', 'b-info'], ['accepted', 'To collect', 'b-info'], ['collected', 'Collected', 'b-info'], ['received', 'Received', 'b-ok'],
    ['progress', 'In progress', 'b-info'], ['resulted', 'To verify', 'b-warn'], ['tech', 'To approve', 'b-violet'], ['final', 'Approved', 'b-ok'],
    ['rejected', 'Rejected', 'b-err'], ['cancelled', 'Cancelled', 'b-err'],
  ];
  function stageKey(o) {
    switch (o.status) {
      case 'Ordered': return o.acceptedAt ? 'accepted' : 'new';
      case 'Collected': return 'collected';
      case 'Received': return 'received';
      case 'In progress': return 'progress';
      case 'Resulted': return o.techVerifiedAt ? 'tech' : 'resulted';
      case 'Verified': return 'final';
      case 'Rejected': return 'rejected';
      case 'Cancelled': return 'cancelled';
      default: return 'new';
    }
  }
  function stageBadge(o) { const s = STAGES.find(x => x[0] === stageKey(o)); return `<span class="badge ${s[2]}">${esc(s[1])}</span>${o.sampleRejected && o.status === 'Ordered' ? ' <span class="badge b-err nodot">Recollect</span>' : ''}`; }
  const isOpen = (o) => !/Verified|Rejected|Cancelled/.test(o.status);

  /* TAT: minutes from order to result (or to now when still open) against the test target. */
  function tat(o) {
    const t = test(o.code), target = (t.tatHours || 24) * 60 * (o.priority === 'STAT' ? 0.5 : 1);
    const used = o.resultedAt ? Math.max(0, mins(o.orderedAt, o.resultedAt)) : isOpen(o) ? clockMins(o.orderedAt) : 0;
    return { target, used, done: !!o.resultedAt, pct: used / target, late: used > target };
  }
  function tatCell(o) {
    if (/Rejected|Cancelled/.test(o.status)) return '<span class="mute">-</span>';
    const t = tat(o);
    const tone = t.late ? 'err' : t.pct > 0.75 ? 'warn' : 'ok';
    return `<div style="min-width:104px;white-space:nowrap"><div class="small ${t.late ? 'flag-h' : ''}">${dur(t.used)} <span class="mute">/ ${dur(t.target)}</span></div><div class="progress ${tone}" style="margin-top:4px"><i style="width:${Math.min(100, Math.max(4, Math.round(t.pct * 100)))}%"></i></div></div>`;
  }

  /* ---------- Reference ranges, flags, criticals and delta checks ---------- */
  function range(code, param, p) {
    const list = (db.labRanges || []).filter(r => r.test === code && r.param === param && (r.status || 'Active') === 'Active');
    const ag = p && p.dob ? String(window.UI.ageOf(p.dob)) : '40 y', age = /mo/.test(ag) ? 0 : parseInt(ag, 10) || 0;
    return list.find(r => r.gender === (p || {}).gender && age >= +r.ageFrom && age <= +r.ageTo) || list.find(r => r.gender === 'All') || list[0] || null;
  }
  function evaluate(v, r) {
    const n = parseFloat(v);
    if (v === '' || v == null || isNaN(n) || !r) return { flag: '', critical: false };
    const num = (x) => (x === '' || x == null ? null : Number(x));
    const lo = num(r.low), hi = num(r.high), cl = num(r.critLow), ch = num(r.critHigh);
    const critical = (cl != null && n < cl) || (ch != null && n > ch);
    const flag = hi != null && n > hi ? 'H' : lo != null && n < lo ? 'L' : '';
    return { flag: critical ? (flag || 'H') : flag, critical };
  }
  function flagHtml(flag, critical) {
    if (critical) return `<span class="flag-c" title="Critical value">${esc(flag || 'C')}!</span>`;
    if (flag === 'H') return '<span class="flag-h" title="High">H</span>';
    if (flag === 'L') return '<span class="flag-l" title="Low">L</span>';
    if (flag === 'A') return '<span class="flag-h" title="Abnormal">A</span>';
    return '<span class="mute">-</span>';
  }
  const refText = (lo, hi) => (lo === '' || lo == null) && (hi === '' || hi == null) ? '' : Number(lo) === 0 && hi ? `< ${hi}` : `${lo} - ${hi}`;
  /* Previous result of the same parameter for the patient (earlier lab order or the cumulative history). */
  function prev(o, param) {
    const earlier = orders().filter(x => x.id !== o.id && x.patientId === o.patientId && x.code === o.code && x.results && x.resultedAt && x.resultedAt < (o.resultedAt || o.orderedAt || '9'))
      .sort((a, b) => (a.resultedAt < b.resultedAt ? 1 : -1))[0];
    if (earlier) { const r = earlier.results.find(x => x.name === param); if (r && r.value !== '' && !isNaN(parseFloat(r.value))) return { value: r.value, at: earlier.resultedAt, acc: acc(earlier) }; }
    const h = (db.labHistory || []).filter(x => x.patientId === o.patientId && x.code === o.code && x.values && x.values[param] != null).sort((a, b) => (a.at < b.at ? 1 : -1))[0];
    return h ? { value: h.values[param], at: h.at, acc: h.accession } : null;
  }
  function delta(v, pv, r) {
    const n = parseFloat(v), p = pv ? parseFloat(pv.value) : NaN;
    if (isNaN(n) || isNaN(p) || p === 0) return null;
    const pct = Math.round(100 * (n - p) / Math.abs(p));
    const lim = r && r.deltaPct !== '' && r.deltaPct != null ? Number(r.deltaPct) : null;
    return { pct, fail: lim != null && Math.abs(pct) > lim, lim };
  }

  /* ---------- Containers (order of draw) and barcode labels ---------- */
  const CONTAINERS = {
    'Blood culture bottle': [1, '#475569', '8-10 mL per bottle (aerobic and anaerobic)'], 'Sodium citrate (blue)': [2, '#2F6BC5', '2.7 mL, fill to the line, invert 3-4 times'],
    'SST (gold)': [3, '#D6A100', '5 mL, invert 5 times, clot 30 min'], 'Lithium heparin (green)': [4, '#1C8A4C', '4 mL, invert 8-10 times'],
    'EDTA (lavender)': [5, '#8B5CF6', '3 mL, invert 8-10 times'], 'Fluoride (grey)': [6, '#8794A7', '2 mL, invert 8-10 times'],
    'Urine container': [7, '#E0A100', '20 mL midstream, screw cap tight'], 'Sterile container': [8, '#E0670E', 'Midstream clean-catch, deliver within 2 h'],
  };
  const cont = (name) => CONTAINERS[name] || [9, '#8794A7', ''];
  const tube = (name) => `<span class="row" style="gap:6px;display:inline-flex"><i style="width:10px;height:18px;border-radius:3px 3px 5px 5px;background:${cont(name)[1]};display:inline-block;flex:none"></i>${esc(name)}</span>`;
  const C39 = { 0: 'nnnwwnwnn', 1: 'wnnwnnnnw', 2: 'nnwwnnnnw', 3: 'wnwwnnnnn', 4: 'nnnwwnnnw', 5: 'wnnwwnnnn', 6: 'nnwwwnnnn', 7: 'nnnwnnwnw', 8: 'wnnwnnwnn', 9: 'nnwwnnwnn', A: 'wnnnnwnnw', B: 'nnwnnwnnw', C: 'wnwnnwnnn', D: 'nnnnwwnnw', E: 'wnnnwwnnn', F: 'nnwnwwnnn', G: 'nnnnnwwnw', H: 'wnnnnwwnn', I: 'nnwnnwwnn', J: 'nnnnwwwnn', K: 'wnnnnnnww', L: 'nnwnnnnww', M: 'wnwnnnnwn', N: 'nnnnwnnww', O: 'wnnnwnnwn', P: 'nnwnwnnwn', Q: 'nnnnnnwww', R: 'wnnnnnwwn', S: 'nnwnnnwwn', T: 'nnnnwnwwn', U: 'wwnnnnnnw', V: 'nwwnnnnnw', W: 'wwwnnnnnn', X: 'nwnnwnnnw', Y: 'wwnnwnnnn', Z: 'nwwnwnnnn', '-': 'nwnnnnwnw', '*': 'nwnnwnwnn' };
  /* Code 39 barcode as inline SVG (black bars on white, prints the same in light and dark mode). */
  function barcode(text, h) {
    const s = '*' + String(text).toUpperCase().replace(/[^0-9A-Z-]/g, '') + '*';
    let x = 0; const bars = [];
    s.split('').forEach(ch => { (C39[ch] || C39['-']).split('').forEach((w, i) => { const bw = w === 'w' ? 3 : 1; if (i % 2 === 0) bars.push(`<rect x="${x}" y="0" width="${bw}" height="${h || 34}"/>`); x += bw; }); x += 1; });
    return `<svg viewBox="0 0 ${x} ${h || 34}" preserveAspectRatio="none" style="width:100%;height:${h || 34}px;display:block;background:#fff" role="img" aria-label="Barcode ${esc(text)}"><g fill="#000">${bars.join('')}</g></svg>`;
  }
  /* One sample label (50 x 25 mm style). */
  function labelHtml(o, opts) {
    opts = opts || {};
    const p = window.Kit.pt(o.patientId) || {}, t = test(o.code);
    return `<div style="width:300px;border:1px dashed #999;border-radius:6px;padding:8px 10px;background:#fff;color:#111;font-family:Arial,sans-serif;display:inline-block;margin:0 10px 10px 0;vertical-align:top">
      <div style="display:flex;justify-content:space-between;font-size:11px;font-weight:700"><span>${esc(p.name || '')}</span><span>${esc(p.gender ? p.gender[0] : '')} ${esc(p.dob ? window.UI.ageOf(p.dob) : '')}</span></div>
      <div style="display:flex;justify-content:space-between;font-size:10px;margin-bottom:4px"><span>${esc(p.mrn || '')}</span><span>${esc(opts.at ? opts.at.slice(5) : (o.collectedAt || nowStamp()).slice(5))}</span></div>
      ${barcode(acc(o), 34)}
      <div style="display:flex;justify-content:space-between;font-size:10.5px;margin-top:3px;font-weight:700"><span style="font-family:monospace">${esc(acc(o))}</span><span>${o.priority !== 'Routine' ? esc(o.priority.toUpperCase()) : ''}</span></div>
      <div style="display:flex;justify-content:space-between;font-size:10px;gap:6px"><span>${esc(t.code)} · ${esc(t.name)}</span></div>
      <div style="display:flex;align-items:center;gap:5px;font-size:10px;margin-top:2px"><i style="width:8px;height:8px;border-radius:2px;background:${cont(t.container)[1]};display:inline-block"></i>${esc(t.container)} · ${esc(t.specimen)}</div>
    </div>`;
  }

  /* ---------- Electronic signature (re-enter password) ---------- */
  function esign(o) {
    const u = me() || {};
    const el = document.createElement('div');
    el.className = 'modal'; el.setAttribute('role', 'alertdialog'); el.setAttribute('aria-modal', 'true');
    el.innerHTML = `<div class="m-ico b-info">${icon('signature')}</div><h2>${esc(o.title || 'Electronic signature')}</h2><div class="muted">${o.body || ''}</div>
      <div class="note-box" style="margin-top:12px"><div class="small muted">Signing as</div><b>${esc(u.displayName)}</b> <span class="small muted">(${esc(u.login)})</span>
      <div class="xs muted" style="margin-top:4px">${esc(o.meaning || 'I confirm I have reviewed this report and approve its release.')}</div></div>
      <div class="field" style="margin-top:12px"><label for="esPw">Re-enter your password<span class="req">*</span></label><input class="input" type="password" id="esPw" autocomplete="current-password"><div class="err hidden" data-err="esPw"></div><div class="hint">Demo password: Orbit@2026!</div></div>
      <div class="m-foot"><button class="btn" data-x>Cancel</button><button class="btn primary" data-ok disabled>${icon('signature')} ${esc(o.confirm || 'Sign and approve')}</button></div>`;
    const scrim = document.createElement('div'); scrim.className = 'scrim';
    document.body.appendChild(scrim); document.body.appendChild(el);
    const close = () => { scrim.remove(); el.remove(); document.removeEventListener('keydown', key); };
    const key = (e) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', key);
    scrim.addEventListener('click', close); $('[data-x]', el).addEventListener('click', close);
    const pw = $('#esPw', el), ok = $('[data-ok]', el);
    setTimeout(() => pw.focus(), 30);
    pw.addEventListener('input', () => { ok.disabled = !pw.value; });
    let tries = 0;
    const go = () => {
      if (!pw.value) return;
      if (pw.value !== (u.demoPassword || 'Orbit@2026!')) {
        tries++; showErrors(el, { esPw: tries >= 3 ? 'Wrong password 3 times. Signature blocked for this session attempt.' : 'The password is not correct.' });
        audit('E-signature failed', o.entity || 'Report', { id: o.recordId || '', label: o.label || '' }, [], { outcome: 'Failed' });
        if (tries >= 3) { ok.disabled = true; pw.disabled = true; }
        return;
      }
      close(); o.onOk && o.onOk(`${u.displayName}${o.role ? ', ' + o.role : ''}`);
    };
    ok.addEventListener('click', go);
    pw.addEventListener('keydown', (e) => { if (e.key === 'Enter') go(); });
  }

  /* ---------- Destructive action with a coded reason (master) and free text ---------- */
  function reasonConfirm(o) {
    let code = '';
    window.UI.confirm({ title: o.title, body: o.body || '', impact: o.impact, reason: true, tone: 'danger', confirm: o.confirm || 'Confirm', icon: o.icon,
      extra: `<div class="field" style="margin-top:14px"><label for="rcCode">${esc(o.label || 'Reason code')}<span class="req">*</span></label><select class="input" id="rcCode"><option value="">Select</option>${o.reasons.map(r => `<option value="${esc(r.code)}">${esc(r.name)}</option>`).join('')}</select></div>`,
      onMount: (el) => {
        const sel = $('#rcCode', el), txt = $('[data-reason]', el), ok = $('[data-ok]', el);
        const chk = () => { ok.disabled = !sel.value || txt.value.trim().length < 3; };
        sel.addEventListener('change', () => { code = sel.value; const r = o.reasons.find(x => x.code === code); if (r && !txt.value.trim()) txt.value = r.name; chk(); });
        txt.addEventListener('input', () => setTimeout(chk));
      },
      onConfirm: (text) => { const r = o.reasons.find(x => x.code === code) || {}; o.onConfirm(code, r.name || '', text); } });
  }

  /* ---------- Telephone notification log ---------- */
  function callLog(o) {
    const recips = o.recipients || [];
    drawer({ title: o.title || 'Log telephone notification', sub: o.sub || '',
      body: `${o.summary || ''}<div class="err-summary hidden"></div><div class="form-grid" style="margin-top:12px">
        ${field({ id: 'clBy', label: 'Called by', value: meName(), req: true })}
        ${field({ id: 'clAt', label: 'Call time', type: 'datetime-local', value: local(nowStamp()), req: true })}
        <div class="field"><label for="clTo">Person called<span class="req">*</span></label><input class="input" id="clTo" list="clToList" value="${esc(recips[0] ? recips[0][0] : '')}"><datalist id="clToList">${recips.map(r => `<option value="${esc(r[0])}">${esc(r[1])}</option>`).join('')}</datalist><div class="err hidden" data-err="clTo"></div></div>
        ${field({ id: 'clRole', label: 'Role', type: 'select', options: ['Treating doctor', 'Covering doctor', 'Consultant on call', 'Charge nurse', 'Ward nurse', 'Patient or family'].map(x => [x, x]), value: recips[0] ? recips[0][1] : 'Treating doctor', placeholder: false })}
        ${field({ id: 'clPhone', label: 'Phone or extension', value: o.phone || '', placeholder: 'Ext. 4412 or mobile' })}
        ${field({ id: 'clOut', label: 'Outcome', type: 'select', options: [['Reached', 'Reached, result given'], ['No answer', 'No answer'], ['Busy', 'Line busy'], ['Wrong number', 'Wrong number']], value: 'Reached', placeholder: false, req: true })}
        <label class="check full" id="clRbWrap"><input type="checkbox" id="clRb"> Read-back confirmed: the person repeated the patient name, test and value back to me</label>
        ${field({ id: 'clNotes', label: 'Notes', type: 'textarea', full: true, placeholder: 'Action agreed, for example repeat sample or patient reviewed' })}
      </div>`,
      foot: `<button class="btn" data-close>Cancel</button><button class="btn primary" id="clSave" disabled>${icon('phone')} Save call</button>`,
      onMount: (el, close) => {
        const btn = $('#clSave', el), out = $('#clOut', el), rb = $('#clRb', el), to = $('#clTo', el), wrap = $('#clRbWrap', el);
        const chk = () => { const reached = out.value === 'Reached'; wrap.style.opacity = reached ? 1 : 0.5; rb.disabled = !reached; if (!reached) rb.checked = false; btn.disabled = !to.value.trim() || !$('#clBy', el).value.trim() || !$('#clAt', el).value || (reached && !rb.checked); };
        $$('input,select,textarea', el).forEach(i => { i.addEventListener('input', chk); i.addEventListener('change', chk); });
        chk();
        const role = $('#clRole', el);
        to.addEventListener('change', () => { const r = recips.find(x => x[0] === to.value); if (r) role.value = r[1]; });
        btn.addEventListener('click', () => {
          const errs = {};
          if (!to.value.trim()) errs.clTo = 'Enter who you called.';
          if (!showErrors(el, errs)) return;
          const entry = { id: uid('call'), at: fromLocal($('#clAt', el).value), by: $('#clBy', el).value.trim(), to: to.value.trim(), role: role.value, phone: $('#clPhone', el).value.trim(), outcome: out.value, readBack: rb.checked, notes: $('#clNotes', el).value.trim(), kind: 'Call' };
          close(); o.onSave(entry);
        });
      } });
  }

  /* ---------- Printable lab report ---------- */
  function reportHtml(o) {
    const p = window.Kit.pt(o.patientId) || {}, t = test(o.code), e = window.Kit.enc(o.encounterId) || {};
    const cell = 'padding:5px 6px;border-bottom:1px solid #e3e3e3;text-align:start';
    const fl = (r) => r.critical ? `<b style="background:#C0261B;color:#fff;border-radius:4px;padding:0 4px">${esc(r.flag || 'C')} CRITICAL</b>` : r.flag === 'H' ? '<b style="color:#B42318">H</b>' : r.flag === 'L' ? '<b style="color:#1F5FBF">L</b>' : r.flag === 'A' ? '<b style="color:#B42318">Abnormal</b>' : '';
    const final = o.status === 'Verified';
    const sens = (o.sensitivity || []).map(s => { const a = (db.labAntibiotics || []).find(x => x.code === s.code) || { name: s.code }; return `<tr><td style="${cell}">${esc(a.name)}</td><td style="${cell}"><b style="color:${s.result === 'R' ? '#B42318' : s.result === 'I' ? '#A55A06' : '#1C7A43'}">${esc({ S: 'Sensitive', I: 'Intermediate', R: 'Resistant' }[s.result] || s.result)}</b></td></tr>`; }).join('');
    return `<div style="text-align:center;font-weight:800;font-size:13px;letter-spacing:.12em;margin:-2px 0 10px">DEPARTMENT OF LABORATORY MEDICINE · ${esc(t.section.toUpperCase())}</div>
      <table style="width:100%;border-collapse:collapse;font-size:11.5px;margin-bottom:12px"><tr>
        <td style="padding:3px 0;width:50%"><b>Patient:</b> ${esc(p.name || '')}<br><b>MRN:</b> ${esc(p.mrn || '')} · <b>Civil ID:</b> ${esc(p.civilId || '-')}<br><b>Sex / age:</b> ${esc(window.Kit.sexAge(p))}${p.dob ? ' · DOB ' + esc(fmtDate(p.dob)) : ''}</td>
        <td style="padding:3px 0"><b>Accession:</b> ${esc(acc(o))} · <b>Order:</b> ${esc(o.no)}<br><b>Requested by:</b> ${esc(window.Kit.docName(o.by))} · ${esc(e.type || 'OPD')} ${esc(e.no || '')}<br><b>Collected:</b> ${esc(fmtDate(o.collectedAt || ''))} · <b>Received:</b> ${esc(fmtDate(o.receivedAt || ''))}</td></tr></table>
      <div style="font-weight:800;font-size:13px;margin-bottom:6px">${esc(t.name)} <span style="font-weight:600;color:#666">(${esc(t.specimen)})</span> ${final ? '' : '<span style="color:#A55A06;font-size:11px">PRELIMINARY, NOT APPROVED</span>'}</div>
      <table style="width:100%;border-collapse:collapse;font-size:12px"><thead><tr style="background:#F1F4F9"><th style="${cell}">Test</th><th style="${cell}">Result</th><th style="${cell}">Flag</th><th style="${cell}">Unit</th><th style="${cell}">Reference range</th></tr></thead>
      <tbody>${(o.results || []).map(r => `<tr><td style="${cell}">${esc(r.name)}</td><td style="${cell}"><b>${esc(r.value)}</b></td><td style="${cell}">${fl(r)}</td><td style="${cell}">${esc(r.unit)}</td><td style="${cell}">${esc(refText(r.low, r.high))}</td></tr>`).join('')}</tbody></table>
      ${sens ? `<div style="font-weight:800;margin:12px 0 4px">Antibiotic sensitivity</div><table style="width:60%;border-collapse:collapse;font-size:12px">${sens}</table>` : ''}
      ${o.comments ? `<div style="margin-top:12px"><b>Comments:</b> ${esc(o.comments)}</div>` : ''}
      ${o.attachment ? `<div style="margin-top:6px;font-size:11px;color:#555">Attachment: ${esc(o.attachment.name)}</div>` : ''}
      <div class="doc-sign" style="display:flex;justify-content:space-between;gap:16px;margin-top:22px;padding-top:10px;border-top:1px solid #ccc;font-size:11.5px">
        <div>Performed by: <b>${esc(o.resultedBy || '-')}</b><br>Technically verified by: <b>${esc(o.techVerifiedBy || '-')}</b> ${o.techVerifiedAt ? esc(fmtDate(o.techVerifiedAt)) : ''}</div>
        <div style="text-align:end">${final ? `<span style="font-family:'Brush Script MT',cursive;font-size:20px;color:#16325C">${esc((o.verifiedBy || '').replace(/^Dr\.\s*/, ''))}</span><br>Electronically signed by <b>${esc(o.signature || o.verifiedBy || '')}</b><br>${esc(fmtDate(o.verifiedAt || ''))}` : '<b style="color:#A55A06">Awaiting pathologist approval</b>'}</div></div>
      <div style="margin-top:10px;font-size:10px;color:#777">Results relate only to the sample received. Electronically signed reports are valid without a handwritten signature. H high, L low.</div>`;
  }

  /* ---------- Critical console (shared by Lab and Radiology) ----------
   * criticalPage(host, { opt, kind: 'lab'|'rad', key (calls db key), items(): [{ o, detected, finding, value }], targetMins, history(c): {pt, test} }) */
  function criticalPage(host, cfg) {
    const calls = () => (db[cfg.key] = db[cfg.key] || []);
    const callsOf = (id) => calls().filter(c => c.orderId === id).sort((a, b) => (a.at < b.at ? -1 : 1));
    const state = (it) => {
      const cs = callsOf(it.o.id), ok = cs.find(c => c.kind === 'Call' && c.outcome === 'Reached' && c.readBack);
      const failed = cs.filter(c => c.kind === 'Call' && c.outcome !== 'Reached').length, esc2 = cs.find(c => c.kind === 'Escalation');
      const age = ok ? mins(it.detected, ok.at) : waitMins(it.detected, Math.max(45, (cfg.targetMins || 30) * 2));
      return { cs, ok, failed, escalated: !!esc2, age, due: !ok && (age > cfg.targetMins || failed >= 2) };
    };
    let tab = 'open';
    const draw = () => {
      const all = cfg.items().map(it => Object.assign(it, { st: state(it) }));
      const open = all.filter(x => !x.st.ok).sort((a, b) => b.st.age - a.st.age), done = all.filter(x => x.st.ok);
      const hist = calls().filter(c => c.kind === 'Call' && c.outcome === 'Reached' && c.readBack);
      const times = hist.map(c => { if (c.minsToNotify != null) return c.minsToNotify; const it = all.find(x => x.o.id === c.orderId); return it ? mins(it.detected, c.at) : null; }).filter(x => x != null).sort((a, b) => a - b);
      const median = times.length ? times[Math.floor(times.length / 2)] : 0;
      host.innerHTML = `<div class="grid g4" style="margin-bottom:16px">
          ${window.Kit.kpi('Not acknowledged', open.length, { icon: 'bell-ring', foot: open.filter(x => x.st.due).length + ' need escalation' })}
          ${window.Kit.kpi('Over ' + cfg.targetMins + ' minutes', open.filter(x => x.st.age > cfg.targetMins).length, { icon: 'timer', foot: 'Target: notify within ' + cfg.targetMins + ' min' })}
          ${window.Kit.kpi('Acknowledged', done.length, { icon: 'phone-call', foot: 'Read-back confirmed' })}
          ${window.Kit.kpi('Median time to notify', median, { icon: 'gauge', unit: 'min', foot: times.length + ' notifications on record' })}
        </div>
        <div class="card"><div class="card-head"><div id="crTabs" class="grow"></div><span class="small muted" id="crClock"></span></div><div id="crBody"></div></div>`;
      window.Kit.tabs($('#crTabs', host), [{ id: 'open', label: 'Not acknowledged', count: open.length, icon: 'bell-ring' }, { id: 'done', label: 'Acknowledged', count: done.length, icon: 'circle-check' }, { id: 'log', label: 'Call log', count: calls().length, icon: 'phone' }], tab, (t) => { tab = t; body(); });
      const body = () => {
        const b = $('#crBody', host);
        if (tab === 'log') { logTable(b); return; }
        const list = tab === 'open' ? open : done;
        if (!list.length) { b.innerHTML = `<div class="empty">${icon(tab === 'open' ? 'shield-check' : 'phone-off')}<b>${tab === 'open' ? 'No critical value is waiting for notification' : 'Nothing acknowledged yet'}</b><span>${tab === 'open' ? 'New critical values appear here as soon as they are entered.' : ''}</span></div>`; return; }
        const canAdd = can(cfg.opt, 'add');
        b.innerHTML = `<div class="table-wrap"><table class="tbl"><thead><tr><th>Patient</th><th>${cfg.kind === 'lab' ? 'Critical value' : 'Critical finding'}</th><th>Location and doctor</th><th>Detected</th><th>${tab === 'open' ? 'Waiting' : 'Notified in'}</th><th>Attempts</th><th></th></tr></thead><tbody>
          ${list.map(it => { const s = it.st, p = window.Kit.pt(it.o.patientId);
            return `<tr style="${tab === 'open' && s.due ? 'background:color-mix(in srgb,var(--error-bg) 60%,transparent)' : ''}">
              <td>${window.Kit.patientCell(p)}</td>
              <td><b class="${tab === 'open' ? 'flag-h' : ''}">${esc(it.finding)}</b><div class="small muted">${esc(it.testName)} · <span class="mono">${esc(it.ref)}</span></div></td>
              <td>${esc(location(it.o))}<div class="small muted">${esc(window.Kit.docName(it.o.by))}</div></td>
              <td style="white-space:nowrap">${esc(window.Kit.when(it.detected))}</td>
              <td style="white-space:nowrap">${tab === 'open' ? `<span class="badge ${s.due ? 'b-err' : s.age > cfg.targetMins * 0.6 ? 'b-warn' : 'b-info'}" data-timer="${esc(it.detected)}">${icon('timer')} ${dur(s.age)}</span>${s.escalated ? '<div style="margin-top:4px"><span class="badge b-err">Escalated</span></div>' : s.due ? '<div style="margin-top:4px"><span class="badge b-err nodot">Escalation due</span></div>' : ''}` : `<span class="badge ${s.age > cfg.targetMins ? 'b-warn' : 'b-ok'}">${dur(s.age)}</span><div class="small muted">${esc(s.ok.to)}</div>`}</td>
              <td>${s.cs.filter(c => c.kind === 'Call').length ? s.cs.map(c => `<div class="xs">${c.kind === 'Escalation' ? icon('arrow-up-right') : c.outcome === 'Reached' ? icon('phone-call') : icon('phone-missed')} ${esc(window.Kit.time(c.at))} ${esc(c.kind === 'Escalation' ? 'Escalated to ' + c.to : c.outcome)}</div>`).join('') : '<span class="mute small">None</span>'}</td>
              <td class="actions"><div class="btn-group">${tab === 'open' ? `<button class="btn primary sm" data-call="${it.o.id}" ${canAdd ? '' : 'disabled title="Needs Add permission"'}>${icon('phone')} Log call</button><button class="btn sm ${s.due ? 'danger' : ''}" data-esc="${it.o.id}" ${canAdd ? '' : 'disabled title="Needs Add permission"'}>${icon('arrow-up-right')} Escalate</button>` : ''}<button class="btn sm icon" data-view="${it.o.id}" aria-label="View details" title="View details">${icon('eye')}</button></div></td></tr>`; }).join('')}
          </tbody></table></div>`;
        $$('[data-call]', b).forEach(x => x.addEventListener('click', () => logCall(all.find(i => i.o.id === x.dataset.call))));
        $$('[data-esc]', b).forEach(x => x.addEventListener('click', () => escalate(all.find(i => i.o.id === x.dataset.esc))));
        $$('[data-view]', b).forEach(x => x.addEventListener('click', () => cfg.view(all.find(i => i.o.id === x.dataset.view).o)));
      };
      body();
    };
    function logTable(b) {
      table(b, { columns: [
        { label: 'Time', sort: c => c.at, render: c => esc(fmtDate(c.at)) },
        { label: 'Patient', render: c => { const o = c.orderId ? db.orders.find(x => x.id === c.orderId) : null; const p = window.Kit.pt(o ? o.patientId : c.patientId); return p ? `<b>${esc(p.name)}</b><div class="small mono">${esc(p.mrn)}</div>` : '-'; } },
        { label: cfg.kind === 'lab' ? 'Value' : 'Finding', render: c => `<b>${esc(cfg.kind === 'lab' ? (c.param || '') + ' ' + (c.value || '') : c.finding || '')}</b>` },
        { label: 'Called by', sort: c => c.by, render: c => esc(c.by) },
        { label: 'Person called', sort: c => c.to, render: c => `${esc(c.to)}<div class="small muted">${esc(c.role)}${c.phone ? ' · ' + esc(c.phone) : ''}</div>` },
        { label: 'Outcome', render: c => c.kind === 'Escalation' ? '<span class="badge b-err">Escalated</span>' : `<span class="badge ${c.outcome === 'Reached' ? 'b-ok' : 'b-warn'}">${esc(c.outcome)}</span>` },
        { label: 'Read-back', render: c => c.kind === 'Call' ? (c.readBack ? `<span class="badge b-ok">${icon('check')} Confirmed</span>` : '<span class="mute">No</span>') : '' },
        { label: 'Notes', render: c => `<span class="small">${esc(c.notes || '')}</span>` },
      ], rows: () => calls().slice().sort((a, b) => (a.at < b.at ? 1 : -1)), search: c => [c.by, c.to, c.param, c.finding, c.notes].join(' '), searchPlaceholder: 'Search the call log',
      filters: [{ label: 'Outcome', options: [['Reached', 'Reached'], ['No answer', 'No answer'], ['Busy', 'Busy'], ['Escalation', 'Escalated']], test: (c, v) => v === 'Escalation' ? c.kind === 'Escalation' : c.outcome === v }] });
    }
    function logCall(it) {
      const p = window.Kit.pt(it.o.patientId) || {}, d = window.Kit.doc(it.o.by), e = window.Kit.enc(it.o.encounterId) || {};
      const nurse = e.type === 'IPD' ? (db.nurses || []).find(n => { const b = window.Kit.bed(e.bedId); return b && n.wardId === b.wardId && /Charge/.test(n.grade); }) : null;
      callLog({ title: 'Log telephone notification', sub: esc(p.name + ' · ' + p.mrn),
        summary: `<div class="alert-cdss">${icon('triangle-alert')}<div><div>${esc(it.finding)}</div><div class="small" style="font-weight:600">${esc(it.testName)} · ${esc(it.ref)} · detected ${esc(window.Kit.when(it.detected))}</div></div></div>`,
        recipients: [d ? [d.name, 'Treating doctor'] : null, nurse ? [nurse.name, 'Charge nurse'] : null, ['Dr. Aisha Al-Mansour', 'Covering doctor']].filter(Boolean), phone: d && d.room ? 'Ext. ' + (4000 + (d.id.charCodeAt(4) || 0) * 7) : '',
        onSave: (c) => {
          Object.assign(c, { orderId: it.o.id, param: it.param || '', value: it.value || '', finding: it.finding });
          calls().push(c); save();
          audit(c.outcome === 'Reached' ? 'Critical result notified' : 'Critical notification attempt', cfg.kind === 'lab' ? 'Lab order' : 'Radiology order', { id: it.o.id, label: it.o.no }, [['Called', '', c.to], ['Outcome', '', c.outcome], ['Read-back', '', c.readBack ? 'Confirmed' : 'No']]);
          toast(c.outcome === 'Reached' ? 'Notification logged. Critical value acknowledged.' : 'Attempt logged. Try again or escalate.', c.outcome === 'Reached' ? '' : 'err');
          draw();
        } });
    }
    function escalate(it) {
      window.UI.confirm({ title: 'Escalate this critical value?', tone: 'danger', confirm: 'Escalate', icon: 'arrow-up-right', reason: true,
        body: `${esc(it.finding)} for ${esc(window.Kit.ptName(it.o.patientId))} has not been acknowledged. The next person in the escalation chain is paged and the escalation is recorded.`,
        extra: `<div class="field" style="margin-top:12px"><label for="esTo">Escalate to<span class="req">*</span></label><select class="input" id="esTo">${['Consultant on call', 'Head of department', 'Medical director on duty', 'Nursing supervisor'].map(x => `<option>${x}</option>`).join('')}</select></div>`,
        onMount: (el) => { $('#esTo', el).addEventListener('change', (e) => { el.dataset.to = e.target.value; }); el.dataset.to = 'Consultant on call'; cfgEl = el; },
        onConfirm: (reason) => {
          const to = cfgEl ? cfgEl.dataset.to : 'Consultant on call';
          calls().push({ id: uid('call'), orderId: it.o.id, at: nowStamp(), by: meName(), to, role: to, phone: 'Pager', outcome: 'Escalated', readBack: false, notes: reason, kind: 'Escalation', param: it.param || '', value: it.value || '', finding: it.finding });
          save(); audit('Critical result escalated', cfg.kind === 'lab' ? 'Lab order' : 'Radiology order', { id: it.o.id, label: it.o.no }, [['Escalated to', '', to]], { reason });
          toast('Escalated to ' + to + '. Keep trying to reach the treating team.'); draw();
        } });
    }
    let cfgEl = null;
    draw();
    const tick = setInterval(() => {
      if (!document.body.contains(host)) { clearInterval(tick); return; }
      $$('[data-timer]', host).forEach(b => { b.innerHTML = icon('timer') + ' ' + dur(waitMins(b.dataset.timer, Math.max(45, (cfg.targetMins || 30) * 2))); });
      const c = $('#crClock', host); if (c) c.textContent = 'Live · updated ' + nowStamp().slice(11);
    }, 15000);
    const c = $('#crClock', host); if (c) c.textContent = 'Live · updated ' + nowStamp().slice(11);
    return { redraw: draw };
  }

  /* ---------- Report print and e-send (shared by Lab and Radiology) ----------
   * dispatchPage(host, { opt, kind, key (log key), orders(): released orders, finalAt(o), testName(o), reportHtml(o), title(o) }) */
  function dispatchPage(host, cfg) {
    const log = () => (db[cfg.key] = db[cfg.key] || []);
    const sends = (o) => log().filter(x => x.orderId === o.id);
    const dState = (o) => { const s = sends(o); if (!s.length) return 'Ready'; if (s.some(x => x.status === 'Failed') && !s.some(x => x.status !== 'Failed' && x.channel !== 'Printed' && x.at > s.filter(y => y.status === 'Failed').map(y => y.at).sort().pop())) return 'Failed'; return 'Sent'; };
    let tab = 'Ready';
    const canPrint = can(cfg.opt, 'print');
    host.innerHTML = `<div class="grid g4" style="margin-bottom:16px" id="dKpi"></div><div class="card"><div class="card-head"><div id="dTabs" class="grow"></div></div><div id="dBody"></div></div>`;
    const draw = () => {
      const all = cfg.orders();
      const cnt = (s) => all.filter(o => dState(o) === s).length;
      const today = log().filter(x => x.at && x.at.startsWith(db.TODAY));
      $('#dKpi', host).innerHTML = window.Kit.kpi('Approved reports', all.length, { icon: 'file-check-2', foot: all.filter(o => (cfg.finalAt(o) || '').startsWith(db.TODAY)).length + ' approved today' })
        + window.Kit.kpi('Not sent yet', cnt('Ready'), { icon: 'send', foot: 'Waiting for print or e-send' })
        + window.Kit.kpi('Sent today', today.filter(x => x.status !== 'Failed').length, { icon: 'mail-check', foot: today.filter(x => x.channel === 'Patient app').length + ' to the patient app' })
        + window.Kit.kpi('Failed deliveries', cnt('Failed'), { icon: 'mail-x', foot: 'Resend or print' });
      window.Kit.tabs($('#dTabs', host), [{ id: 'Ready', label: 'Ready to send', count: cnt('Ready') }, { id: 'Failed', label: 'Failed', count: cnt('Failed') }, { id: 'Sent', label: 'Sent', count: cnt('Sent') }, { id: 'Log', label: 'Delivery log', count: log().length }], tab, (t) => { tab = t; body(); });
      body();
    };
    let tb = null;
    const body = () => {
      const b = $('#dBody', host);
      if (tab === 'Log') {
        table(b, { columns: [
          { label: 'Time', sort: x => x.at, render: x => esc(fmtDate(x.at)) },
          { label: 'Report', render: x => { const o = db.orders.find(y => y.id === x.orderId); return o ? `<b>${esc(cfg.testName(o))}</b><div class="small mono">${esc(cfg.ref(o))}</div>` : '-'; } },
          { label: 'Patient', render: x => { const o = db.orders.find(y => y.id === x.orderId); return o ? esc(window.Kit.ptName(o.patientId)) : '-'; } },
          { label: 'Channel', sort: x => x.channel, render: x => `<span class="tag">${icon(chIcon(x.channel))} ${esc(x.channel)}</span>` },
          { label: 'To', render: x => `<span class="small">${esc(x.to)}</span>` },
          { label: 'By', render: x => esc(x.by) },
          { label: 'Status', render: x => window.Kit.status(x.status) + (x.note ? `<div class="xs muted">${esc(x.note)}</div>` : '') },
        ], rows: () => log().slice().sort((a, c) => (a.at < c.at ? 1 : -1)), search: x => [x.channel, x.to, x.by, x.status].join(' '), searchPlaceholder: 'Search the delivery log',
        filters: [{ label: 'Channel', options: ['Email', 'SMS', 'Patient app', 'Referring doctor', 'Printed'].map(x => [x, x]), test: (x, v) => x.channel === v }, { label: 'Status', options: ['Sent', 'Delivered', 'Failed', 'Printed'].map(x => [x, x]), test: (x, v) => x.status === v }] });
        return;
      }
      tb = table(b, { columns: [
        { label: '', render: o => `<input type="checkbox" data-sel="${o.id}" aria-label="Select">` },
        { label: 'Patient', sort: o => window.Kit.ptName(o.patientId), render: o => window.Kit.patientCell(window.Kit.pt(o.patientId)) },
        { label: cfg.kind === 'lab' ? 'Test' : 'Exam', sort: o => cfg.testName(o), render: o => `<b>${esc(cfg.testName(o))}</b><div class="small mono">${esc(cfg.ref(o))}</div>${cfg.flags ? cfg.flags(o) : ''}` },
        { label: 'Requested by', render: o => `${esc(window.Kit.docName(o.by))}<div class="small muted">${esc(location(o))}</div>` },
        { label: 'Approved', sort: o => cfg.finalAt(o), render: o => esc(window.Kit.when(cfg.finalAt(o))) },
        { label: 'Deliveries', render: o => sends(o).map(x => `<div class="xs">${icon(chIcon(x.channel))} ${esc(x.channel)} · ${window.Kit.status(x.status)}</div>`).join('') || '<span class="mute small">None yet</span>' },
        { label: '', cls: 'actions', render: o => `<div class="btn-group"><button class="btn sm" data-pr="${o.id}" ${canPrint ? '' : 'disabled title="Needs Print permission"'}>${icon('printer')} Print</button><button class="btn primary sm" data-send="${o.id}" ${canPrint ? '' : 'disabled title="Needs Print permission"'}>${icon('send')} ${tab === 'Failed' ? 'Resend' : 'E-send'}</button></div>` },
      ], rows: () => cfg.orders().filter(o => dState(o) === tab).sort((a, c) => (cfg.finalAt(a) < cfg.finalAt(c) ? 1 : -1)), search: o => [window.Kit.ptName(o.patientId), (window.Kit.pt(o.patientId) || {}).mrn, cfg.testName(o), cfg.ref(o)].join(' '), searchPlaceholder: 'Patient, MRN, test or accession',
        filters: cfg.filters || [], toolbar: `<button class="btn sm" id="dBatch" ${canPrint ? '' : 'disabled title="Needs Print permission"'}>${icon('send')} Send selected to patient app</button>`,
        onRow: (o) => preview(o),
        afterDraw: (t) => {
          $$('[data-pr]', t).forEach(x => x.addEventListener('click', () => print(db.orders.find(o => o.id === x.dataset.pr))));
          $$('[data-send]', t).forEach(x => x.addEventListener('click', () => send(db.orders.find(o => o.id === x.dataset.send))));
        } });
      const bt = $('#dBatch', b);
      if (bt) bt.addEventListener('click', () => {
        const ids = $$('[data-sel]:checked', b).map(x => x.dataset.sel);
        if (!ids.length) { toast('Select at least one report.', 'err'); return; }
        ids.forEach(id => { const o = db.orders.find(x => x.id === id), p = window.Kit.pt(o.patientId) || {}; log().push({ id: uid('snd'), orderId: id, channel: 'Patient app', to: p.mobile || p.mrn, at: nowStamp(), by: meName(), status: 'Sent', note: 'Batch send' }); });
        save(); audit('Reports sent in batch', cfg.kind === 'lab' ? 'Lab report' : 'Radiology report', { id: 'batch', label: ids.length + ' reports' }, [['Channel', '', 'Patient app']]);
        toast(ids.length + ' report' + (ids.length > 1 ? 's' : '') + ' sent to the patient app'); draw();
      });
    };
    const chIcon = (c) => ({ Email: 'mail', SMS: 'message-square', 'Patient app': 'smartphone', 'Referring doctor': 'stethoscope', Printed: 'printer' }[c] || 'send');
    function print(o) {
      window.Kit.printDoc({ title: cfg.title(o), sub: cfg.kind === 'lab' ? 'Laboratory report' : 'Radiology report', html: cfg.reportHtml(o) });
      log().push({ id: uid('snd'), orderId: o.id, channel: 'Printed', to: 'Printer', at: nowStamp(), by: meName(), status: 'Printed', note: '' }); save();
      audit('Report printed', cfg.kind === 'lab' ? 'Lab report' : 'Radiology report', { id: o.id, label: o.no }, []);
    }
    function preview(o) {
      drawer({ title: cfg.title(o), sub: esc(window.Kit.ptName(o.patientId)), wide: true, body: `<div class="print-sheet">${cfg.reportHtml(o)}</div>`,
        foot: `<button class="btn" data-close>Close</button><span class="grow"></span><button class="btn" id="pvPr" ${canPrint ? '' : 'disabled'}>${icon('printer')} Print</button><button class="btn primary" id="pvSend" ${canPrint ? '' : 'disabled'}>${icon('send')} E-send</button>`,
        onMount: (el, close) => { $('#pvPr', el).addEventListener('click', () => { close(); print(o); }); $('#pvSend', el).addEventListener('click', () => { close(); send(o); }); } });
    }
    function send(o) {
      const p = window.Kit.pt(o.patientId) || {}, d = window.Kit.doc(o.by);
      const ch = [['Patient app', 'smartphone', p.mrn ? 'Tibbi Orbit app · ' + p.mrn : '', true], ['SMS', 'message-square', p.mobile || '', !!p.mobile], ['Email', 'mail', p.email || '', !!p.email], ['Referring doctor', 'stethoscope', d ? d.name + ' (EMR inbox)' : '', !!d]];
      drawer({ title: 'E-send report', sub: esc(cfg.testName(o) + ' · ' + p.name),
        body: `<div class="banner info" style="margin-bottom:12px">${icon('shield-check')}<span>Reports are sent as a secure link (PDF). The link expires after 30 days and needs the patient's date of birth to open.</span></div>
          <div class="list-rows">${ch.map(([c, ic, to, ok], i) => `<div><label class="check grow"><input type="checkbox" data-ch="${i}" ${ok && i === 0 ? 'checked' : ''} ${ok ? '' : 'disabled'}> ${icon(ic)} ${esc(c)}</label><span class="small ${ok ? '' : 'mute'}">${esc(to || 'Not on file')}</span></div>`).join('')}</div>
          <div class="field" style="margin-top:12px"><label for="sdExtra">Other email (optional)</label><input class="input" id="sdExtra" type="email" placeholder="for example insurer or second doctor"><div class="err hidden" data-err="sdExtra"></div></div>
          ${field({ id: 'sdMsg', label: 'Message', type: 'textarea', value: 'Your ' + (cfg.kind === 'lab' ? 'laboratory' : 'radiology') + ' report from Tibbi Orbit is ready.' })}`,
        foot: `<button class="btn" data-close>Cancel</button><button class="btn primary" id="sdGo">${icon('send')} Send</button>`,
        onMount: (el, close) => {
          const go = $('#sdGo', el), ex = $('#sdExtra', el);
          const chk = () => { go.disabled = !$$('[data-ch]:checked', el).length && !ex.value.trim(); };
          $$('[data-ch]', el).forEach(x => x.addEventListener('change', chk)); ex.addEventListener('input', chk); chk();
          go.addEventListener('click', () => {
            if (ex.value.trim() && !window.UI.EMAIL_RE.test(ex.value.trim())) { showErrors(el, { sdExtra: 'Enter a valid email address.' }); return; }
            const sel = $$('[data-ch]:checked', el).map(x => ch[+x.dataset.ch]);
            if (ex.value.trim()) sel.push(['Email', 'mail', ex.value.trim(), true]);
            sel.forEach(([c, , to]) => log().push({ id: uid('snd'), orderId: o.id, channel: c, to, at: nowStamp(), by: meName(), status: 'Sent', note: '' }));
            save(); audit('Report e-sent', cfg.kind === 'lab' ? 'Lab report' : 'Radiology report', { id: o.id, label: o.no }, sel.map(s => ['Channel', '', s[0] + ' · ' + s[2]]));
            close(); toast('Report sent by ' + sel.map(s => s[0]).join(', ')); draw();
          });
        } });
    }
    draw();
    return { preview, print, send };
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
  window.Lab = { ANCHOR, clockMins, waitMins, test, orders, acc, isMe, meName, mins, dur, local, fromLocal, location, setting, STAGES, stageKey, stageBadge, isOpen, tat, tatCell,
    range, evaluate, flagHtml, refText, prev, delta, CONTAINERS, cont, tube, barcode, labelHtml, esign, reasonConfirm, callLog, reportHtml, criticalPage, dispatchPage };
})();
