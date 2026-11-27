/* Reception and ADT helpers shared by the reception/*.html pages (window.Reception).
 * Load after kit.js. Writes only keys Reception owns: patients, encounters, beds, invoices and reception*. */
(function () {

  /* Right-align the header of numeric columns (UI.table only sets the class on body cells). */
  if (!UI.table.numHeads) { const t0 = UI.table; UI.table = function (host, o) { const r = t0.apply(this, arguments); ((o && o.columns) || []).forEach((c, i) => { if (/\bnum\b/.test(c.cls || '')) { const th = host.querySelector('th[data-c="' + i + '"]'); if (th) th.classList.add('num'); } }); return r; }; UI.table.numHeads = true; }
  const { db, save, esc, icon, $, $$, R, can, toast, audit, drawer, confirm, field, showErrors, me, nowStamp, uid, fmtDate } = UI;
  const pad = (n, w) => String(n).padStart(w || 2, '0');
  const AREAS = ['Resuscitation', 'Acute bay', 'Minor treatment', 'Fast track'];
  const DISCHARGE_TYPES = ['Routine discharge', 'Against medical advice (AMA)', 'Transfer to another facility', 'Death'];
  const LANGS = ['Arabic', 'English', 'Hindi', 'Urdu', 'Malayalam', 'Tagalog', 'French', 'Bengali'];
  const BLOOD = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];
  const myName = () => (me() || {}).displayName || '';
  const myId = () => (me() || {}).id || '';
  const list = (k) => (db[k] = db[k] || []);

  /* Disabled attribute for an action the user may not perform. */
  const ACT = { add: 'Add', edit: 'Edit', cancel: 'Cancel', approve: 'Approve', print: 'Print', verify: 'Verify', view: 'View' };
  function gate(opt, act) { return can(opt, act) ? '' : `disabled title="Needs ${ACT[act] || act} permission"`; }
  /* Prototype clock: real time of day on the prototype date. */
  function now() { const t = nowStamp(); return db.TODAY + t.slice(10); }
  function mins(from, to) { if (!from) return 0; const a = new Date(from.replace(' ', 'T')), b = new Date((to || now()).replace(' ', 'T')); return Math.max(0, Math.round((b - a) / 60000)); }
  function dur(m) { if (m == null || isNaN(m)) return ''; if (m < 60) return m + ' min'; const h = Math.floor(m / 60); return h + ' h ' + pad(m % 60) + ' m'; }
  /* Queue start for waiting time: check-in time, or for seeded visits without one a stable recent time. */
  function qStart(e) {
    if (e.checkedInAt) return e.checkedInAt;
    if (/Checked in|Waiting/.test(e.status) && e.start.startsWith(db.TODAY)) { const h = String(e.id).split('').reduce((a, c) => a + c.charCodeAt(0), 0); const n = now(); const d = new Date(n.replace(' ', 'T')); d.setMinutes(d.getMinutes() - (6 + h % 38)); const st = new Date(e.start.replace(' ', 'T')); const x = d < st ? st : d; return db.TODAY + ' ' + pad(x.getHours()) + ':' + pad(x.getMinutes()); }
    return e.start;
  }
  function isMerged(p) { return p && p.status === 'Merged'; }
  const activePatients = () => db.patients.filter(p => !isMerged(p));

  /* ---------- Coverage ---------- */
  function coverage(pid) { return list('receptionCoverage').filter(c => c.patientId === pid && c.status !== 'Inactive').sort((a, b) => (a.rank === 'Primary' ? -1 : 1) - (b.rank === 'Primary' ? -1 : 1)); }
  function primary(pid) { return coverage(pid).find(c => c.rank === 'Primary'); }
  function syncPrimary(pid) {
    const p = Kit.pt(pid); if (!p) return;
    const c = primary(pid);
    Object.assign(p, c ? { payerId: c.payerId, planId: c.planId, policyNo: c.policyNo, policyTo: c.to } : { payerId: null, planId: null, policyNo: '', policyTo: '' });
  }
  function covState(c) { if (!c) return ['Cash (self-pay)', 'neutral']; if (c.to && c.to < db.TODAY) return ['Expired', 'err']; if (!c.verified) return ['Not verified', 'warn']; if (c.to && c.to <= Kit.addDays(db.TODAY, 30)) return ['Expiring', 'warn']; return ['Verified', 'ok']; }
  /* Split a charge into payer and patient shares using the plan co-pay rules (same rule as the shared invoice seed). */
  function share(total, planId) {
    const pl = planId ? Kit.plan(planId) : null;
    if (!pl) return { payer: 0, patient: +total.toFixed(3) };
    const pat = Math.min(total * pl.copayPct / 100 + pl.deductible, pl.maxCopay || total, total);
    return { payer: +(total - pat).toFixed(3), patient: +pat.toFixed(3) };
  }

  /* ---------- Duplicates ---------- */
  const digits = (s) => String(s || '').replace(/\D/g, '');
  function matches(v, excludeId) {
    const cid = digits(v.civilId), mob = digits(v.mobile).slice(-8), pass = String(v.passportNo || '').trim().toUpperCase();
    return activePatients().filter(p => p.id !== excludeId && ((cid && digits(p.civilId) === cid) || (mob.length >= 8 && digits(p.mobile).slice(-8) === mob) || (pass && String(p.passportNo || '').toUpperCase() === pass)))
      .map(p => ({ p, on: [cid && digits(p.civilId) === cid ? 'Civil ID' : '', mob.length >= 8 && digits(p.mobile).slice(-8) === mob ? 'Mobile' : '', pass && String(p.passportNo || '').toUpperCase() === pass ? 'Passport' : ''].filter(Boolean) }));
  }
  function nextMrn() { const max = db.patients.reduce((m, p) => { const n = parseInt(String(p.mrn || '').replace(/\D/g, ''), 10); return /^MRN-\d+$/.test(p.mrn) && n > m ? n : m; }, 0); return 'MRN-' + (max + 1); }

  /* ---------- Print documents ---------- */
  function barcode(text) {
    let x = 0; const bars = String(text).split('').map((c, i) => { const w = 1 + (c.charCodeAt(0) + i) % 3; const r = `<rect x="${x}" y="0" width="${w}" height="34" fill="#111"/>`; x += w + 1 + (c.charCodeAt(0) % 2); return r; }).join('');
    return `<svg width="${x}" height="34" viewBox="0 0 ${x} 34" aria-label="Barcode ${esc(text)}">${bars}</svg>`;
  }
  function printWristband(p, e) {
    if (!p) return;
    const al = (p.allergies || []).length ? `<div style="background:#C0261B;color:#fff;font-weight:800;padding:2px 8px;border-radius:4px;display:inline-block">ALLERGY: ${esc(p.allergies.join(', '))}</div>` : '';
    const tr = e && e.triage ? (list('receptionTriage').find(t => t.level === e.triage) || {}) : null;
    Kit.printDoc({ title: 'Patient wristband', sub: 'Wristband 25 x 280 mm', html: `
      <div style="display:flex;align-items:center;gap:16px;border:2px solid #16325C;border-radius:30px;padding:10px 22px;max-width:640px;${tr && tr.hex ? 'border-left:14px solid ' + tr.hex : ''}">
        <div style="flex:1"><div style="font-size:16px;font-weight:800">${esc(p.name)}</div>
        <div style="font-size:12px">${esc(p.mrn)} · ${esc(Kit.sexAge(p))}${p.dob ? ' · DOB ' + esc(fmtDate(p.dob)) : ''}</div>
        <div style="font-size:12px">${e ? esc(e.type + ' ' + e.no) : ''}${e && e.bedId ? ' · Bed ' + esc((Kit.bed(e.bedId) || {}).no) : ''}${tr && tr.level ? ' · ESI ' + tr.level + ' ' + esc(tr.colour) : ''}</div>${al}</div>
        <div style="text-align:center">${barcode(p.mrn)}<div style="font-size:10px;font-family:monospace">${esc(p.mrn)}</div></div></div>` });
    audit('Printed wristband', 'Patient', { id: p.id, label: p.mrn });
  }
  function printCard(p) {
    if (!p) return;
    const c = primary(p.id);
    Kit.printDoc({ title: 'Patient card', sub: 'ID-1 card 85.6 x 54 mm', html: `
      <div style="width:340px;height:214px;border-radius:14px;padding:16px;background:linear-gradient(135deg,#16325C,#2F6BC5);color:#fff;display:flex;flex-direction:column;justify-content:space-between">
        <div style="display:flex;justify-content:space-between"><b style="font-size:13px;letter-spacing:.05em">TIBBI ORBIT HOSPITAL</b><span style="font-size:11px">Patient card</span></div>
        <div><div style="font-size:17px;font-weight:800">${esc(p.name)}</div>${p.nameAr ? `<div dir="rtl" style="font-size:13px">${esc(p.nameAr)}</div>` : ''}
        <div style="font-size:12px;margin-top:4px">${esc(p.mrn)} · ${p.dob ? 'DOB ' + esc(fmtDate(p.dob)) : ''} · ${esc(p.bloodGroup || '')}</div>
        <div style="font-size:11px">${c ? esc((Kit.payer(c.payerId) || {}).name + ' · ' + c.policyNo) : 'Self-pay'}</div></div>
        <div style="background:#fff;border-radius:6px;padding:4px 8px;display:flex;justify-content:space-between;align-items:center">${barcode(p.mrn)}<span style="color:#111;font-size:10px;font-family:monospace">${esc(p.civilId || '')}</span></div></div>` });
    audit('Printed patient card', 'Patient', { id: p.id, label: p.mrn });
  }
  function printToken(e) {
    const p = Kit.pt(e.patientId) || {};
    Kit.printDoc({ title: 'Queue token', sub: 'Thermal slip 80 mm', html: `<div style="width:260px;text-align:center;border:1px dashed #999;padding:14px;border-radius:8px">
      <div style="font-size:12px">${esc(e.type === 'ER' ? 'Emergency department' : UI.L.clName(e.clinicId) + ' clinic')}</div>
      <div style="font-size:44px;font-weight:800;letter-spacing:.04em">${esc(e.token)}</div>
      <div style="font-size:13px;font-weight:700">${esc(p.name || '')}</div><div style="font-size:11px">${esc(p.mrn || '')} · ${esc(e.no)}</div>
      <div style="font-size:11px;margin-top:6px">${e.doctorId ? esc(Kit.docName(e.doctorId)) + ' · ' + esc((Kit.doc(e.doctorId) || {}).room || '') : ''}</div>
      <div style="font-size:11px;margin-top:6px">${esc(fmtDate(e.start))}</div><div style="font-size:10px;color:#555;margin-top:6px">Please wait until your number is called.</div></div>` });
  }
  function printReceipt(pay) {
    const iv = (db.invoices || []).find(x => x.id === pay.invoiceId) || {}; const p = Kit.pt(pay.patientId) || {};
    Kit.printDoc({ title: 'Payment receipt ' + pay.no, sub: 'Cash receipt', html: `
      <div style="display:flex;justify-content:space-between;margin-bottom:10px"><div><b style="font-size:15px">Receipt ${esc(pay.no)}</b><div>${esc(fmtDate(pay.at))}</div></div><div style="text-align:end"><b>${esc(p.name || '')}</b><div>${esc(p.mrn || '')}</div></div></div>
      <table><thead><tr><th>Invoice</th><th>Description</th><th style="text-align:end">Amount</th></tr></thead><tbody>
      ${(iv.lines || []).map(l => `<tr><td>${esc(iv.no)}</td><td>${esc(l.desc)} x ${l.qty}</td><td style="text-align:end">${Kit.money(l.qty * l.price)}</td></tr>`).join('')}</tbody></table>
      <table style="margin-top:10px"><tr><td>Invoice total</td><td style="text-align:end">${Kit.money(iv.total)}</td></tr><tr><td>Payer share</td><td style="text-align:end">${Kit.money(iv.payerAmount)}</td></tr><tr><td>Patient share</td><td style="text-align:end">${Kit.money(iv.patientAmount)}</td></tr>
      <tr><td><b>Paid now (${esc(pay.mode)}${pay.ref ? ', ' + esc(pay.ref) : ''})</b></td><td style="text-align:end"><b>${Kit.money(pay.amount)}</b></td></tr><tr><td>Balance due</td><td style="text-align:end">${Kit.money(balance(iv))}</td></tr></table>
      <div style="margin-top:14px;font-size:11px;color:#555">Cashier: ${esc(pay.by)}. Kuwait has no VAT in force; tax shown as 0.000.</div>${Kit.signBlock('Cashier', 'Received by')}` });
  }

  /* ---------- Invoices and cashier ---------- */
  function balance(iv) { return Math.max(0, +((iv.patientAmount || 0) - (iv.paid || 0)).toFixed(3)); }
  function setInvStatus(iv) { if (iv.status === 'Interim' && !iv.final) return; const b = balance(iv); iv.status = b <= 0.0005 ? 'Paid' : iv.paid > 0 ? 'Partially paid' : 'Unpaid'; }
  function myShift() { return list('receptionShifts').find(s => s.userId === myId() && s.status === 'Open'); }
  function payModes() { return list('receptionPayModes').filter(m => m.status !== 'Inactive'); }
  function shiftTotals(sh) {
    const pays = list('receptionPayments').filter(p => p.shiftId === sh.id);
    const by = {}; pays.forEach(p => { by[p.mode] = (by[p.mode] || 0) + p.amount; });
    const ref = list('receptionRefunds').filter(r => r.shiftId === sh.id && r.status === 'Approved');
    const cashRef = Kit.sumBy(ref.filter(r => r.mode === 'Cash'), r => r.amount);
    return { pays, by, total: Kit.sumBy(pays, p => p.amount), cash: by['Cash'] || 0, refunds: Kit.sumBy(ref, r => r.amount), cashRef, expected: +(sh.float + (by['Cash'] || 0) - cashRef).toFixed(3) };
  }
  /* collect(invoice, onDone): take a payment against an invoice in the user's open shift. */
  function collect(iv, onDone) {
    if (!can('reception.cashier', 'add')) { toast('You need Add permission on Cashier and Shift to collect payments.', 'err'); return; }
    const sh = myShift();
    if (!sh) { confirm({ title: 'Open a cashier shift first', body: 'Payments are recorded against your open shift so the cash can be counted at shift close.', tone: 'primary', confirm: 'Go to cashier', onConfirm: () => { location.href = R('reception/cashier.html?open=1'); } }); return; }
    const p = Kit.pt(iv.patientId); const bal = balance(iv);
    const modes = payModes();
    drawer({ title: 'Collect payment', sub: `${esc(iv.no)} · ${esc(p ? p.name : '')} · shift ${esc(sh.no)}`,
      body: `${Kit.patientBanner(p)}
        <div class="grid g3" style="margin-bottom:14px">${Kit.kpi('Invoice total', Kit.money(iv.total))}${Kit.kpi('Payer share', Kit.money(iv.payerAmount), { foot: iv.payerId ? (Kit.payer(iv.payerId) || {}).name : 'No payer' })}${Kit.kpi('Balance due', Kit.money(bal), { foot: 'Paid so far ' + Kit.money(iv.paid) })}</div>
        <div class="err-summary hidden"></div>
        <div class="form-grid">
          ${field({ id: 'cAmt', label: 'Amount (KWD)', type: 'number', value: bal.toFixed(3), req: true, attrs: 'step="0.001" min="0"' })}
          ${field({ id: 'cMode', label: 'Payment mode', type: 'select', options: modes.map(m => [m.name, m.name]), value: 'Cash', req: true, placeholder: false })}
          ${field({ id: 'cRef', label: 'Reference', hint: 'KNET or card approval code, or the corporate authorization number', max: 40 })}
          ${field({ id: 'cTender', label: 'Cash tendered (KWD)', type: 'number', attrs: 'step="0.001" min="0"' })}
          <div class="full small muted" id="cChange"></div>
        </div>`,
      foot: `<button class="btn" data-close>Cancel</button><button class="btn primary" id="cGo" disabled>${icon('banknote')} Collect and print receipt</button>`,
      onMount: (el, close) => {
        const amt = $('#cAmt', el), mode = $('#cMode', el), ref = $('#cRef', el), ten = $('#cTender', el), go = $('#cGo', el);
        const needRef = () => { const m = modes.find(x => x.name === mode.value); return m && m.refRequired; };
        const chk = () => {
          const a = Number(amt.value);
          ten.closest('.field').style.display = mode.value === 'Cash' ? '' : 'none';
          ref.closest('.field').querySelector('label').innerHTML = 'Reference' + (needRef() ? '<span class="req">*</span>' : '');
          const ch = mode.value === 'Cash' && ten.value ? Number(ten.value) - a : null;
          $('#cChange', el).innerHTML = ch != null ? (ch >= 0 ? `Change to return: <b>${Kit.money(ch)}</b>` : `<span style="color:var(--error)">Tendered is less than the amount.</span>`) : '';
          go.disabled = !(a > 0 && a <= bal + 0.0005 && (!needRef() || ref.value.trim().length >= 3) && (ch == null || ch >= 0));
        };
        [amt, mode, ref, ten].forEach(i => i.addEventListener('input', chk)); mode.addEventListener('change', chk); chk();
        go.addEventListener('click', () => {
          const a = +Number(amt.value).toFixed(3);
          const errs = {}; if (!(a > 0)) errs.cAmt = 'Enter an amount above zero.'; if (a > bal + 0.0005) errs.cAmt = 'Amount is more than the balance due.';
          if (!showErrors(el, errs)) return;
          const pay = { id: uid('pyr'), no: Kit.nextNo('RCP-26-', list('receptionPayments')), shiftId: sh.id, invoiceId: iv.id, patientId: iv.patientId, amount: a, mode: mode.value, ref: ref.value.trim(), at: now(), by: myName() };
          list('receptionPayments').push(pay);
          const before = iv.status; iv.paid = +((iv.paid || 0) + a).toFixed(3); setInvStatus(iv);
          save(); audit('Collected payment', 'Invoice', { id: iv.id, label: iv.no }, [['Paid', '', Kit.money(iv.paid)], ['Status', before, iv.status], ['Mode', '', pay.mode]]);
          close(); toast('Payment ' + pay.no + ' recorded'); printReceipt(pay); onDone && onDone(pay);
        });
      } });
  }

  /* ---------- Register / edit patient ---------- */
  /* registerDrawer(patient|null, { onSave(p), alias: true when completing an ER alias }) */
  function registerDrawer(p, o) {
    o = o || {};
    const isNew = !p;
    const opt = 'reception.reg.patient';
    if (!can(opt, isNew ? 'add' : 'edit')) { toast(`You need ${isNew ? 'Add' : 'Edit'} permission on Patient Registration.`, 'err'); return; }
    const v = Object.assign({ idType: 'Kuwait Civil ID', civilId: '', passportNo: '', nationality: 'Kuwaiti', name: '', nameAr: '', gender: '', dob: '', bloodGroup: '', marital: '', mobile: '+965 ', email: '', lang: 'Arabic', address: '', emergency: { name: '', relation: '', phone: '' }, hasPhoto: false, vip: false }, p ? JSON.parse(JSON.stringify(p)) : {});
    if (p && p.alias) { v.name = ''; v.idType = 'Kuwait Civil ID'; }
    if (!v.lang) v.lang = 'Arabic';
    if (!v.mobile) v.mobile = '+965 ';
    if (!v.emergency) v.emergency = { name: '', relation: '', phone: '' };
    const cov = p ? coverage(p.id).map(c => Object.assign({}, c)) : [];
    const links = p ? list('receptionLinks').filter(l => l.patientId === p.id).map(l => Object.assign({}, l)) : [];
    const docs = p ? list('receptionDocs').filter(d => d.patientId === p.id).map(d => Object.assign({}, d)) : [];
    const nats = list('receptionNationalities').filter(n => n.status !== 'Inactive').map(n => [n.name, n.name]);
    const idTypes = list('receptionIdTypes').filter(n => n.status !== 'Inactive' && n.code !== 'ALIAS').map(n => [n.name, n.name]);
    const rels = list('receptionRelations').filter(r => r.status !== 'Inactive');
    const dts = list('receptionDocTypes').filter(r => r.status !== 'Inactive');
    const payerOpts = db.payers.filter(x => x.status === 'Active').map(x => [x.id, x.name]);
    let dupAck = false;
    drawer({ title: isNew ? 'Register patient' : (p.alias ? 'Complete profile of ' + p.name : 'Edit patient ' + p.mrn), wide: true,
      sub: isNew ? 'Search first. A new MRN is created when you save.' : esc(p.name) + ' · ' + esc(p.mrn),
      body: `<div class="err-summary hidden" style="margin-bottom:12px"></div><div id="dupBox"></div>
        <div class="row" style="gap:18px;align-items:flex-start">
          <div style="width:150px;flex:none;text-align:center" class="stack tight">
            <div id="photo" style="width:120px;height:140px;border-radius:12px;border:1px dashed var(--line-strong);display:grid;place-items:center;background:var(--soft);margin:auto"></div>
            <button class="btn sm" id="phBtn" type="button" style="white-space:nowrap;width:100%">${icon('camera')} <span>Capture photo</span></button>
            <div class="xs muted">${Kit.scopeNote('Biometric lookup where agreed')}</div>
          </div>
          <div class="grow form-grid c3">
            <div class="section-t">Identity</div>
            ${field({ id: 'rIdType', label: 'Primary ID type', type: 'select', options: idTypes, value: v.idType, placeholder: false })}
            ${field({ id: 'rCivil', label: 'Civil ID', value: v.civilId, max: 12, placeholder: '12 digits', hint: 'Required for Kuwaiti nationals' })}
            ${field({ id: 'rPass', label: 'Passport number', value: v.passportNo || '', max: 12 })}
            ${field({ id: 'rName', label: 'Full name (English)', value: v.name, req: true, max: 80 })}
            ${field({ id: 'rNameAr', label: 'Full name (Arabic)', value: v.nameAr, max: 80, attrs: 'dir="rtl"' })}
            ${field({ id: 'rNat', label: 'Nationality', type: 'select', options: nats, value: v.nationality, req: true })}
            ${field({ id: 'rGender', label: 'Gender', type: 'select', options: [['Male', 'Male'], ['Female', 'Female']], value: v.gender, req: true })}
            ${field({ id: 'rDob', label: 'Date of birth', type: 'date', value: v.dob, req: true, attrs: `max="${db.TODAY}"` })}
            ${field({ id: 'rBlood', label: 'Blood group', type: 'select', options: BLOOD.map(b => [b, b]), value: v.bloodGroup })}
            ${field({ id: 'rMarital', label: 'Marital status', type: 'select', options: ['Single', 'Married', 'Divorced', 'Widowed'].map(x => [x, x]), value: v.marital })}
            ${field({ id: 'rLang', label: 'Preferred language', type: 'select', options: LANGS.map(x => [x, x]), value: v.lang, req: true })}
            <label class="check" style="align-self:end;padding-bottom:8px"><input type="checkbox" id="rVip" ${v.vip ? 'checked' : ''}> VIP patient</label>
            <div class="section-t">Contact</div>
            ${field({ id: 'rMobile', label: 'Mobile', value: v.mobile, req: true, max: 20, placeholder: '+965 5xxx xxxx' })}
            ${field({ id: 'rEmail', label: 'Email', type: 'email', value: v.email, max: 80 })}
            ${field({ id: 'rAddr', label: 'Address', value: v.address, max: 120, placeholder: 'Block, street, house, area' })}
            <div class="section-t">Emergency contact</div>
            ${field({ id: 'rEName', label: 'Name', value: v.emergency.name, max: 60 })}
            ${field({ id: 'rERel', label: 'Relation', type: 'select', options: rels.map(r => [r.name, r.name]).concat([['Spouse', 'Spouse'], ['Friend', 'Friend']]).filter((x, i, a) => a.findIndex(y => y[0] === x[0]) === i), value: v.emergency.relation })}
            ${field({ id: 'rEPhone', label: 'Phone', value: v.emergency.phone, max: 20 })}
          </div>
        </div>
        <div class="section-t" style="margin:18px 0 8px">Financial mapping</div>
        <div id="covBox"></div>
        <div class="row wrap" style="margin-top:8px"><button class="btn sm" id="covAdd" type="button">${icon('plus')} Add payer</button>${Kit.scopeNote('Loyalty points, corporate discounts and coupons are 2nd phase')}</div>
        <div class="g2 grid" style="margin-top:18px">
          <div><div class="section-t" style="margin-bottom:8px">Family, guarantor and dependants</div><div id="lnkBox"></div>
            <div class="row" style="margin-top:8px"><button class="btn sm" id="lnkAdd" type="button">${icon('link')} Link a patient</button></div></div>
          <div><div class="section-t" style="margin-bottom:8px">Documents</div><div id="docBox"></div>
            <div class="row" style="margin-top:8px"><button class="btn sm" id="docAdd" type="button">${icon('scan-line')} Scan or upload</button></div></div>
        </div>`,
      foot: `<span class="small muted" id="rHint"></span><span class="grow"></span><button class="btn" data-close>Cancel</button><button class="btn primary" id="rSave" disabled>${icon('check')} ${isNew ? 'Register patient' : 'Save changes'}</button>`,
      onMount: (el, close) => {
        const g = (id) => $('#' + id, el);
        const drawPhoto = () => { g('photo').innerHTML = v.hasPhoto ? `<div class="stack tight" style="text-align:center">${Kit.avatar({ name: g('rName').value || 'New', gender: g('rGender').value }, 'lg')}<span class="xs muted">Photo captured</span></div>` : `<div style="text-align:center" class="mute">${icon('user-round')}<div class="xs">No photo</div></div>`; $('#phBtn span:not(.ico)', el).textContent = v.hasPhoto ? 'Retake photo' : 'Capture photo'; };
        g('phBtn').addEventListener('click', () => { v.hasPhoto = true; drawPhoto(); toast('Photo captured from the desk camera'); });
        const drawCov = () => {
          g('covBox').innerHTML = cov.length ? `<div class="table-wrap"><table class="tbl compact"><thead><tr><th>Rank</th><th>Payer</th><th>Plan</th><th>Policy no.</th><th>Member no.</th><th>Valid from</th><th>Valid to</th><th>Eligibility</th><th></th></tr></thead><tbody>
            ${cov.map((c, i) => `<tr><td><select class="input" data-cv="rank" data-i="${i}" aria-label="Rank" style="min-width:110px"><option ${c.rank === 'Primary' ? 'selected' : ''}>Primary</option><option ${c.rank === 'Secondary' ? 'selected' : ''}>Secondary</option></select></td>
              <td><select class="input" data-cv="payerId" data-i="${i}" aria-label="Payer" style="min-width:160px"><option value="">Select</option>${payerOpts.map(o2 => `<option value="${o2[0]}" ${c.payerId === o2[0] ? 'selected' : ''}>${esc(o2[1])}</option>`).join('')}</select></td>
              <td><select class="input" data-cv="planId" data-i="${i}" aria-label="Plan" style="min-width:130px"><option value="">Select</option>${db.plans.filter(x => x.payerId === c.payerId).map(x => `<option value="${x.id}" ${c.planId === x.id ? 'selected' : ''}>${esc(x.name)}</option>`).join('')}</select></td>
              <td><input class="input" data-cv="policyNo" data-i="${i}" value="${esc(c.policyNo)}" aria-label="Policy number" style="min-width:110px"></td>
              <td><input class="input" data-cv="memberNo" data-i="${i}" value="${esc(c.memberNo || '')}" aria-label="Member number" style="min-width:90px"></td>
              <td><input class="input" type="date" data-cv="from" data-i="${i}" value="${esc(c.from || '')}" aria-label="Valid from"></td>
              <td><input class="input" type="date" data-cv="to" data-i="${i}" value="${esc(c.to || '')}" aria-label="Valid to"></td>
              <td>${(() => { const s = covState(c); return Kit.status(s[0], s[1]); })()}<div><button class="link-btn" type="button" data-ver="${i}" ${gate(opt, 'verify')}>Verify now</button></div></td>
              <td><button class="btn xs ghost" type="button" data-cdel="${i}" aria-label="Remove payer">${icon('trash-2')}</button></td></tr>`).join('')}</tbody></table></div>`
            : `<div class="note-box small">${icon('wallet')} Cash (self-pay). Add a payer to map insurance, a TPA scheme or a corporate account.</div>`;
          $$('[data-cv]', el).forEach(i => i.addEventListener('change', () => { const c = cov[+i.dataset.i]; c[i.dataset.cv] = i.value; if (i.dataset.cv === 'payerId') c.planId = ''; if (['payerId', 'planId', 'policyNo', 'from', 'to'].includes(i.dataset.cv)) { c.verified = false; } drawCov(); chk(); }));
          $$('[data-cdel]', el).forEach(b => b.addEventListener('click', () => { cov.splice(+b.dataset.cdel, 1); drawCov(); chk(); }));
          $$('[data-ver]', el).forEach(b => b.addEventListener('click', () => {
            const c = cov[+b.dataset.ver];
            if (!c.payerId || !c.planId || !c.policyNo) { toast('Choose payer, plan and policy number first.', 'err'); return; }
            if (c.to && c.to < db.TODAY) { toast('Policy has expired. Eligibility not confirmed.', 'err'); return; }
            Object.assign(c, { verified: true, verifiedBy: myName(), verifiedAt: now() }); drawCov(); toast('Eligibility confirmed with ' + ((Kit.payer(c.payerId) || {}).tpa || (Kit.payer(c.payerId) || {}).name));
          }));
        };
        g('covAdd').addEventListener('click', () => { cov.push({ id: uid('cv'), patientId: p ? p.id : null, rank: cov.some(c => c.rank === 'Primary') ? 'Secondary' : 'Primary', payerId: '', planId: '', policyNo: '', memberNo: '', from: db.TODAY, to: Kit.addDays(db.TODAY, 364), verified: false, status: 'Active' }); drawCov(); chk(); });
        const drawLinks = () => {
          g('lnkBox').innerHTML = links.length ? `<div class="list-rows card" style="padding:0 14px">${links.map((l, i) => `<div>${Kit.patientCell(Kit.pt(l.relatedId))}<span class="grow"></span><span class="tag">${esc((rels.find(r => r.id === l.relationId) || {}).name || '')}</span><span class="badge b-info nodot">${esc(l.role)}</span><button class="btn xs ghost" type="button" data-ldel="${i}" aria-label="Remove link">${icon('x')}</button></div>`).join('')}</div>`
            : `<div class="note-box small muted">No linked family members, guarantors or dependants.</div>`;
          $$('[data-ldel]', el).forEach(b => b.addEventListener('click', () => { links.splice(+b.dataset.ldel, 1); drawLinks(); }));
        };
        g('lnkAdd').addEventListener('click', () => {
          drawer({ title: 'Link a patient', sub: 'Family member, guarantor, dependant or corporate employee', body: `<div class="form-grid">
              <div class="field full"><label>Patient<span class="req">*</span></label><div class="row"><div class="grow" id="lkP"><span class="muted small">No patient selected</span></div><button class="btn sm" type="button" id="lkPick">${icon('search')} Find</button></div></div>
              ${field({ id: 'lkRel', label: 'Relationship', type: 'select', options: rels.map(r => [r.id, r.name + ' (' + r.role + ')']), req: true })}
              ${field({ id: 'lkNote', label: 'Note', max: 80 })}</div>`,
            foot: `<button class="btn" data-close>Cancel</button><button class="btn primary" id="lkGo" disabled>Add link</button>`,
            onMount: (el2, close2) => {
              let pick = null; const ok = () => { $('#lkGo', el2).disabled = !(pick && $('#lkRel', el2).value); };
              $('#lkPick', el2).addEventListener('click', () => Kit.pickPatient({ title: 'Find the related patient', filter: (x) => !isMerged(x) && (!p || x.id !== p.id), onPick: (x) => { pick = x; $('#lkP', el2).innerHTML = Kit.patientCell(x); ok(); } }));
              $('#lkRel', el2).addEventListener('change', ok);
              $('#lkGo', el2).addEventListener('click', () => { const r = rels.find(x => x.id === $('#lkRel', el2).value); links.push({ id: uid('lk'), patientId: p ? p.id : null, relatedId: pick.id, relationId: r.id, role: r.role, note: $('#lkNote', el2).value.trim() }); close2(); drawLinks(); });
            } });
        });
        const drawDocs = () => {
          g('docBox').innerHTML = docs.length ? `<div class="list-rows card" style="padding:0 14px">${docs.map((d, i) => `<div>${icon('file-text', 'mute')}<div class="grow cell-main"><b>${esc((dts.find(t => t.id === d.typeId) || {}).name || 'Document')}</b><span>${esc(d.name)}${d.expiry ? ' · expires ' + esc(fmtDate(d.expiry)) : ''}</span></div>${d.expiry && d.expiry < db.TODAY ? Kit.status('Expired') : ''}<button class="btn xs ghost" type="button" data-ddel="${i}" aria-label="Remove document">${icon('x')}</button></div>`).join('')}</div>`
            : `<div class="note-box small muted">No documents yet. Scan the Civil ID and insurance card.</div>`;
          $$('[data-ddel]', el).forEach(b => b.addEventListener('click', () => { docs.splice(+b.dataset.ddel, 1); drawDocs(); }));
        };
        g('docAdd').addEventListener('click', () => docDrawer(null, (d) => { docs.push(d); drawDocs(); }));
        const dupBox = g('dupBox');
        const drawDup = () => {
          const m = matches({ civilId: g('rCivil').value, mobile: g('rMobile').value, passportNo: g('rPass').value }, p ? p.id : null);
          dupBox.innerHTML = m.length ? `<div class="banner warn" style="margin-bottom:12px">${icon('triangle-alert')}<div class="grow"><b>Possible duplicate.</b> ${m.length} existing record${m.length > 1 ? 's match' : ' matches'} this ${esc([...new Set(m.flatMap(x => x.on))].join(' and '))}.
            <div class="list-rows" style="margin-top:6px">${m.slice(0, 3).map(x => `<div style="padding:6px 0">${Kit.patientCell(x.p, esc(x.p.mobile || ''))}<span class="grow"></span><span class="tag">${esc(x.on.join(', '))}</span><a class="btn xs" href="${R('reception/patient.html?id=' + x.p.id)}">Open record</a></div>`).join('')}</div>
            <label class="check small" style="margin-top:6px"><input type="checkbox" id="dupOk" ${dupAck ? 'checked' : ''}> I checked the matches. This is a different person (the match goes to the merge review list).</label></div></div>` : '';
          const ack = $('#dupOk', el); if (ack) ack.addEventListener('change', () => { dupAck = ack.checked; chk(); });
          return m;
        };
        const errsOf = () => {
          const e = {}; const nm = g('rName').value.trim(); const civ = g('rCivil').value.trim(); const pass = g('rPass').value.trim();
          if (nm.length < 3) e.rName = 'Enter the full name (at least 3 letters).';
          if (!g('rGender').value) e.rGender = 'Choose the gender.';
          if (!g('rDob').value) e.rDob = 'Enter the date of birth.'; else if (g('rDob').value > db.TODAY) e.rDob = 'Date of birth cannot be in the future.';
          if (!g('rNat').value) e.rNat = 'Choose the nationality.';
          if (civ && !/^\d{12}$/.test(civ)) e.rCivil = 'Civil ID must be 12 digits.';
          if (g('rNat').value === 'Kuwaiti' && !civ) e.rCivil = 'Civil ID is required for Kuwaiti nationals.';
          if (!civ && !pass) e.rPass = 'Enter a Civil ID or a passport number.';
          if (!UI.PHONE_RE.test(g('rMobile').value.trim()) || digits(g('rMobile').value).length < 11) e.rMobile = 'Enter a mobile number with country code, for example +965 5123 4567.';
          if (g('rEmail').value.trim() && !UI.EMAIL_RE.test(g('rEmail').value.trim())) e.rEmail = 'Email address is not valid.';
          if (!g('rLang').value) e.rLang = 'Choose the preferred language.';
          if (cov.some(c => !c.payerId || !c.planId || !c.policyNo)) e.cov = 'Complete payer, plan and policy number for every payer row, or remove the row.';
          if (cov.filter(c => c.rank === 'Primary').length > 1) e.cov = 'Only one payer can be primary.';
          if (cov.length && !cov.some(c => c.rank === 'Primary')) e.cov = 'Mark one payer as primary.';
          if (cov.some(c => c.from && c.to && c.to < c.from)) e.cov = 'Coverage end date is before the start date.';
          return e;
        };
        let touched = false;
        const chk = () => {
          const m = drawDup(); const e = errsOf();
          g('rSave').disabled = !!Object.keys(e).length || (m.length > 0 && !dupAck);
          g('rHint').textContent = Object.keys(e).length ? Object.keys(e).length + ' field' + (Object.keys(e).length > 1 ? 's' : '') + ' to complete' : m.length && !dupAck ? 'Review the duplicate warning' : 'Ready to save';
          if (touched) showErrors(el, e);
        };
        $$('input,select', el).forEach(i => { if (!i.closest('#covBox')) { i.addEventListener('input', chk); i.addEventListener('change', chk); i.addEventListener('blur', () => { touched = true; }); } });
        g('rSave').addEventListener('click', () => {
          touched = true; const e = errsOf(); if (!showErrors(el, e)) return;
          const vals = { idType: g('rIdType').value, civilId: g('rCivil').value.trim(), passportNo: g('rPass').value.trim().toUpperCase(), name: g('rName').value.trim(), nameAr: g('rNameAr').value.trim(), nationality: g('rNat').value, gender: g('rGender').value, dob: g('rDob').value,
            bloodGroup: g('rBlood').value, marital: g('rMarital').value, lang: g('rLang').value, vip: g('rVip').checked, mobile: g('rMobile').value.trim(), email: g('rEmail').value.trim(), address: g('rAddr').value.trim(),
            emergency: { name: g('rEName').value.trim(), relation: g('rERel').value, phone: g('rEPhone').value.trim() }, hasPhoto: v.hasPhoto };
          const dups = matches(vals, p ? p.id : null);
          let rec = p; const changes = [];
          if (isNew) {
            rec = Object.assign({ id: uid('pt'), mrn: nextMrn(), allergies: [], chronic: [], payerId: null, planId: null, policyNo: '', policyTo: '', status: 'Active', registeredAt: now(), branchId: (UI.session().ctx || {}).branchId || 'br_01', registeredBy: myName() }, vals);
            db.patients.push(rec);
          } else {
            ['name', 'civilId', 'passportNo', 'mobile', 'dob', 'gender', 'nationality', 'lang', 'address'].forEach(k => { if (String(p[k] || '') !== String(vals[k] || '')) changes.push([k, String(p[k] || ''), String(vals[k] || '')]); });
            if (p.alias) { vals.alias = false; vals.status = 'Active'; vals.mrn = nextMrn(); vals.aliasOf = p.mrn; vals.aliasName = p.name; changes.push(['MRN', p.mrn, vals.mrn], ['Status', 'Temporary alias', 'Active']); }
            Object.assign(p, vals, { updatedBy: myName(), updatedAt: now() });
          }
          if (dups.length) rec.dupFlag = dups.map(x => x.p.id); else delete rec.dupFlag;
          db.receptionCoverage = list('receptionCoverage').filter(c => c.patientId !== rec.id).concat(cov.map(c => Object.assign(c, { patientId: rec.id })));
          db.receptionLinks = list('receptionLinks').filter(l => l.patientId !== rec.id).concat(links.map(l => Object.assign(l, { patientId: rec.id })));
          db.receptionDocs = list('receptionDocs').filter(d => d.patientId !== rec.id).concat(docs.map(d => Object.assign(d, { patientId: rec.id })));
          syncPrimary(rec.id);
          save();
          audit(isNew ? 'Registered patient' : p.alias === false && changes.some(c => c[0] === 'MRN') ? 'Completed alias profile' : 'Updated patient', 'Patient', { id: rec.id, label: rec.mrn + ' ' + rec.name }, isNew ? [['MRN', '', rec.mrn]] : changes, dups.length ? { reason: 'Duplicate warning acknowledged: ' + dups.map(x => x.p.mrn).join(', ') } : undefined);
          close(); toast(isNew ? `Registered ${rec.name}, ${rec.mrn}` : 'Patient saved');
          o.onSave && o.onSave(rec);
        });
        drawPhoto(); drawCov(); drawLinks(); drawDocs(); chk();
      } });
  }
  /* Add a document (scan or upload placeholder). */
  function docDrawer(pid, onAdd) {
    const dts = list('receptionDocTypes').filter(r => r.status !== 'Inactive');
    drawer({ title: 'Scan or upload document', sub: 'Identity documents, insurance cards and clinical attachments',
      body: `<div class="err-summary hidden"></div><div class="form-grid">
        ${field({ id: 'dType', label: 'Document type', type: 'select', options: dts.map(d => [d.id, d.name + ' (' + d.category + ')']), req: true })}
        ${field({ id: 'dRef', label: 'Document number', max: 30 })}
        ${field({ id: 'dExp', label: 'Expiry date', type: 'date', hint: 'Required for identity and insurance documents' })}
        <div class="field full"><label>File<span class="req">*</span></label><div class="row"><button class="btn sm" type="button" id="dScan">${icon('scan-line')} Scan</button><button class="btn sm" type="button" id="dUp">${icon('upload')} Choose file</button><span class="small muted grow" id="dFile">No file</span></div><div class="err hidden" data-err="dFileE"></div></div></div>`,
      foot: `<button class="btn" data-close>Cancel</button><button class="btn primary" id="dGo" disabled>Add document</button>`,
      onMount: (el, close) => {
        let file = '';
        const ok = () => { const t = dts.find(d => d.id === $('#dType', el).value); $('#dGo', el).disabled = !($('#dType', el).value && file && (!t || !t.expiry || $('#dExp', el).value)); };
        const setF = (n) => { file = n; $('#dFile', el).textContent = n; ok(); };
        $('#dScan', el).addEventListener('click', () => setF('scan-' + db.TODAY.replace(/-/g, '') + '-' + Math.floor(Math.random() * 900 + 100) + '.pdf'));
        $('#dUp', el).addEventListener('click', () => setF('upload-' + Math.floor(Math.random() * 9000 + 1000) + '.jpg'));
        $$('input,select', el).forEach(i => { i.addEventListener('input', ok); i.addEventListener('change', ok); });
        $('#dGo', el).addEventListener('click', () => { onAdd({ id: uid('pd'), patientId: pid, typeId: $('#dType', el).value, name: file, ref: $('#dRef', el).value.trim(), expiry: $('#dExp', el).value, at: now(), by: myName() }); close(); });
      } });
  }

  /* ---------- New OPD visit ---------- */
  function newVisit(p0, onDone) {
    const opt = 'reception.visit.opd';
    if (!can(opt, 'add')) { toast('You need Add permission on OPD Visits.', 'err'); return; }
    let p = p0;
    const clinics = db.clinics.filter(c => c.status === 'Active' && db.doctors.some(d => d.clinicId === c.id));
    const svcs = db.services.filter(s => s.status === 'Active' && ['Procedure', 'Package'].includes(s.category));
    drawer({ title: 'New OPD visit', wide: true, sub: 'Create the visit, generate the consultation invoice and collect payment',
      body: `<div id="vPt"></div><div class="err-summary hidden" style="margin-bottom:12px"></div>
        <div class="grid g-side" style="align-items:start"><div class="form-grid">
          ${field({ id: 'vClinic', label: 'Clinic', type: 'select', options: clinics.map(c => [c.id, c.name]), req: true })}
          ${field({ id: 'vDoc', label: 'Doctor', type: 'select', options: [], req: true })}
          ${field({ id: 'vType', label: 'Visit type', type: 'select', options: [['New', 'New'], ['Follow-up', 'Follow-up'], ['Review with results', 'Review with results']], value: 'New', placeholder: false })}
          ${field({ id: 'vSource', label: 'Source', type: 'select', options: [['Walk-in', 'Walk-in'], ['Appointment', 'Appointment'], ['Referral', 'Referral']], value: 'Walk-in', placeholder: false })}
          ${field({ id: 'vComplaint', label: 'Reason for visit', full: true, max: 120, req: true })}
          <div class="field full"><label>Services and packages</label><div class="chips" id="vSvc">${svcs.map(s => `<label class="chip"><input type="checkbox" value="${s.code}"> ${esc(s.name)} <span class="mono xs">${Kit.money(s.price, false)}</span></label>`).join('')}</div></div>
          ${field({ id: 'vPayer', label: 'Bill to', type: 'select', options: [], req: true, placeholder: false })}
        </div>
        <div class="card"><div class="card-head"><h3>${icon('receipt')} Consultation invoice</h3></div><div class="card-pad" id="vInv"></div></div></div>`,
      foot: `<span class="small muted" id="vHint"></span><span class="grow"></span><button class="btn" data-close>Cancel</button><button class="btn" id="vSave" disabled>${icon('check')} Create visit</button><button class="btn primary" id="vPay" disabled>${icon('banknote')} Create and collect</button>`,
      onMount: (el, close) => {
        const g = (id) => $('#' + id, el);
        const drawPt = () => { g('vPt').innerHTML = p ? `<div class="row" style="margin-bottom:12px"><div class="grow">${Kit.patientBanner(p)}</div></div><div class="row" style="margin:-8px 0 12px"><button class="btn sm" id="vChange" type="button">${icon('repeat')} Change patient</button>${p.alias ? Kit.scopeNote('Temporary alias: complete the profile before billing insurance') : ''}</div>`
            : `<div class="banner info" style="margin-bottom:12px">${icon('user-search')}<span class="grow">Choose the patient first.</span><button class="btn sm primary" id="vChange" type="button">${icon('search')} Find patient</button></div>`;
          g('vChange').addEventListener('click', () => Kit.pickPatient({ title: 'Patient for the visit', filter: (x) => !isMerged(x), onPick: (x) => { p = x; drawPt(); drawPayer(); calc(); } }));
        };
        const drawDocs = () => { const docs = db.doctors.filter(d => d.clinicId === g('vClinic').value); g('vDoc').innerHTML = `<option value="">Select</option>` + docs.map(d => `<option value="${d.id}">${esc(d.name)} · ${esc(d.grade)} · ${Kit.money(d.fee)}</option>`).join(''); if (docs.length === 1) g('vDoc').value = docs[0].id; };
        const drawPayer = () => { const cs = p ? coverage(p.id).filter(c => !(c.to && c.to < db.TODAY)) : []; g('vPayer').innerHTML = cs.map(c => `<option value="${c.id}">${esc((Kit.payer(c.payerId) || {}).name)} · ${esc((Kit.plan(c.planId) || {}).name || '')} (${esc(c.rank)})</option>`).join('') + `<option value="cash">Cash (self-pay)</option>`; };
        let lines = [], sh = { payer: 0, patient: 0 }, cv = null;
        const calc = () => {
          const d = Kit.doc(g('vDoc').value);
          lines = [];
          if (d) { const code = g('vType').value === 'Follow-up' ? 'SRV-CON-F' : d.grade === 'Consultant' ? 'SRV-CON-C' : 'SRV-CON-S'; const s = db.services.find(x => x.code === code); lines.push({ code, desc: s.name + ' · ' + d.name, qty: 1, price: s.price }); }
          $$('#vSvc input:checked', el).forEach(i => { const s = db.services.find(x => x.code === i.value); lines.push({ code: s.code, desc: s.name, qty: 1, price: s.price }); });
          $$('#vSvc label', el).forEach(l => l.classList.toggle('sel', l.querySelector('input').checked));
          const total = Kit.sumBy(lines, l => l.qty * l.price);
          cv = g('vPayer').value && g('vPayer').value !== 'cash' ? list('receptionCoverage').find(c => c.id === g('vPayer').value) : null;
          sh = share(total, cv ? cv.planId : null);
          g('vInv').innerHTML = lines.length ? `<table class="tbl compact"><tbody>${lines.map(l => `<tr><td>${esc(l.desc)}<div class="xs mono muted">${esc(l.code)}</div></td><td class="num" style="text-align:end">${Kit.money(l.price)}</td></tr>`).join('')}</tbody></table>
            <dl class="kv tight" style="margin-top:12px"><dt>Total</dt><dd class="num">${Kit.money(total)}</dd><dt>Payer share</dt><dd class="num">${Kit.money(sh.payer)}${cv ? ` <span class="small muted">${esc((Kit.plan(cv.planId) || {}).name)}, co-pay ${(Kit.plan(cv.planId) || {}).copayPct}%</span>` : ''}</dd><dt>Patient pays</dt><dd class="num" style="font-size:16px">${Kit.money(sh.patient)}</dd><dt>VAT</dt><dd class="num">${Kit.money(0)} <span class="small muted">exempt</span></dd></dl>
            ${cv && !cv.verified ? `<div class="banner warn" style="margin-top:10px">${icon('shield-alert')}<span>Eligibility not verified for this policy. Verify on the patient record before the visit.</span></div>` : ''}`
            : `<div class="empty" style="padding:24px">${icon('receipt')}<b>No charges yet</b><span>Choose the clinic and doctor.</span></div>`;
          const ok = p && g('vDoc').value && g('vComplaint').value.trim().length >= 3;
          g('vSave').disabled = !ok; g('vPay').disabled = !ok || sh.patient <= 0; g('vPay').style.display = lines.length && sh.patient <= 0 ? 'none' : ''; g('vSave').classList.toggle('primary', !!lines.length && sh.patient <= 0);
          g('vHint').textContent = !p ? 'Choose the patient' : !g('vDoc').value ? 'Choose the clinic and doctor' : g('vComplaint').value.trim().length < 3 ? 'Enter the reason for the visit' : 'Ready';
        };
        g('vClinic').addEventListener('change', () => { drawDocs(); calc(); });
        ['vDoc', 'vType', 'vPayer'].forEach(id => g(id).addEventListener('change', calc));
        g('vComplaint').addEventListener('input', calc);
        $$('#vSvc input', el).forEach(i => i.addEventListener('change', calc));
        const create = (pay) => {
          const d = Kit.doc(g('vDoc').value);
          const todays = db.encounters.filter(e => e.type === 'OPD' && e.start.startsWith(db.TODAY) && /^C\d+$/.test(e.token || ''));
          const tok = 'C' + pad(todays.reduce((m, e) => Math.max(m, parseInt(e.token.slice(1), 10)), 0) + 1, 3);
          const e = { id: uid('en'), no: Kit.nextNo('OP-26-', db.encounters), type: 'OPD', patientId: p.id, doctorId: d.id, clinicId: d.clinicId, deptId: d.deptId, branchId: (UI.session().ctx || {}).branchId || 'br_01', start: now(), end: '', status: 'Checked in', checkedInAt: now(), token: tok, visitType: g('vType').value, payer: cv ? 'Insurance' : 'Cash', complaint: g('vComplaint').value.trim(), source: g('vSource').value, createdBy: myName() };
          db.encounters.push(e);
          const iv = { id: uid('iv'), no: Kit.nextNo('INV-26-', db.invoices), encounterId: e.id, patientId: p.id, date: db.TODAY, type: 'OPD', lines, total: +Kit.sumBy(lines, l => l.qty * l.price).toFixed(3), payerId: cv ? cv.payerId : null, planId: cv ? cv.planId : null, payerAmount: sh.payer, patientAmount: sh.patient, paid: 0, status: sh.patient > 0 ? 'Unpaid' : 'Paid', claimStatus: cv ? 'Not submitted' : '', by: myName() };
          db.invoices.push(iv); e.invoiceId = iv.id;
          save(); audit('Created OPD visit', 'Encounter', { id: e.id, label: e.no + ' ' + p.name }, [['Token', '', tok], ['Doctor', '', d.name], ['Invoice', '', iv.no]]);
          close(); toast(`Visit ${e.no} created. Token ${tok}`);
          if (pay) setTimeout(() => collect(iv, () => onDone && onDone(e)), 50); else printToken(e);
          onDone && onDone(e);
        };
        g('vSave').addEventListener('click', () => create(false));
        g('vPay').addEventListener('click', () => create(true));
        drawPt(); drawPayer(); drawDocs(); calc();
      } });
  }

  /* ---------- Admission request ---------- */
  function admitRequest(p0, onDone, pre) {
    const opt = 'reception.visit.adm';
    if (!can(opt, 'add')) { toast('You need Add permission on Admissions and Discharge.', 'err'); return; }
    let p = p0; pre = pre || {};
    const adm = db.doctors.filter(d => d.admitting);
    drawer({ title: 'New admission request', sub: 'Elective or emergency admission. Financial clearance and bed allocation follow.',
      body: `<div id="aPt"></div><div class="err-summary hidden" style="margin-bottom:12px"></div><div class="form-grid">
        <div class="field full"><label>Admission type<span class="req">*</span></label><div id="aType"></div></div>
        ${field({ id: 'aAdm', label: 'Admitting doctor', type: 'select', options: adm.map(d => [d.id, d.name + ' · ' + d.specialty]), req: true, value: pre.admittingId || '' })}
        ${field({ id: 'aAtt', label: 'Attending doctor', type: 'select', options: adm.map(d => [d.id, d.name + ' · ' + d.specialty]), req: true, value: pre.attendingId || '' })}
        ${field({ id: 'aWard', label: 'Preferred ward', type: 'select', options: db.wards.map(w => [w.id, w.name]), req: true })}
        ${field({ id: 'aBedT', label: 'Bed type', type: 'select', options: list('receptionBedTypes').filter(b => b.status !== 'Inactive').map(b => [b.name, b.name + ' · ' + Kit.money(b.rate) + '/day']), req: true })}
        ${field({ id: 'aDx', label: 'Provisional diagnosis (ICD-10)', type: 'select', options: db.icd10.map(c => [c.code, c.code + ' ' + c.name]), req: true, full: true })}
        ${field({ id: 'aReason', label: 'Reason for admission', full: true, req: true, max: 160, value: pre.reason || '' })}
        ${field({ id: 'aDate', label: 'Planned admission date', type: 'date', value: db.TODAY, req: true, attrs: `min="${db.TODAY}"` })}
        ${field({ id: 'aLos', label: 'Expected stay (days)', type: 'number', value: 2, attrs: 'min="1" max="60"' })}
        ${field({ id: 'aPkg', label: 'Package', type: 'select', options: db.services.filter(s => s.category === 'Package').map(s => [s.code, s.name + ' · ' + Kit.money(s.price)]), placeholder: 'No package', full: true })}
      </div>`,
      foot: `<button class="btn" data-close>Cancel</button><button class="btn primary" id="aGo" disabled>${icon('send')} Submit request</button>`,
      onMount: (el, close) => {
        const g = (id) => $('#' + id, el); let type = pre.type || 'Elective';
        Kit.seg(g('aType'), [['Elective', 'Elective', 'calendar-check'], ['Emergency', 'Emergency', 'siren']], type, (v) => { type = v; chk(); });
        const drawPt = () => { g('aPt').innerHTML = p ? Kit.patientBanner(p) : `<div class="banner info" style="margin-bottom:12px">${icon('user-search')}<span class="grow">Choose the patient.</span><button class="btn sm primary" type="button" id="aPick">${icon('search')} Find patient</button></div>`; const b = $('#aPick', el); if (b) b.addEventListener('click', () => Kit.pickPatient({ filter: (x) => !isMerged(x) && !db.encounters.some(e => e.type === 'IPD' && e.patientId === x.id && e.status !== 'Discharged'), onPick: (x) => { p = x; drawPt(); chk(); } })); };
        const chk = () => { g('aGo').disabled = !(p && g('aAdm').value && g('aAtt').value && g('aWard').value && g('aBedT').value && g('aDx').value && g('aReason').value.trim().length >= 3 && g('aDate').value); };
        $$('input,select', el).forEach(i => { i.addEventListener('input', chk); i.addEventListener('change', chk); });
        g('aWard').addEventListener('change', () => { const w = Kit.ward(g('aWard').value); const map = { ICU: 'ICU bed', Private: 'Private room', Paediatric: 'Paediatric bed' }; g('aBedT').value = map[w && w.type] || 'Ward bed'; chk(); });
        g('aGo').addEventListener('click', () => {
          const already = db.encounters.find(e => e.type === 'IPD' && e.patientId === p.id && e.status !== 'Discharged');
          if (already) { toast('Patient is already admitted (' + already.no + ').', 'err'); return; }
          const r = { id: uid('ar'), no: Kit.nextNo('ADR-26-', list('receptionAdmRequests')), patientId: p.id, type, admittingId: g('aAdm').value, attendingId: g('aAtt').value, wardPref: g('aWard').value, bedType: g('aBedT').value, diagnosis: g('aDx').value, reason: g('aReason').value.trim(), plannedDate: g('aDate').value, los: +g('aLos').value || 1, packageCode: g('aPkg').value, status: 'Pending clearance', clearance: null, bedId: null, encounterId: null, by: myName(), at: now(), source: pre.source || 'Reception', erEncounterId: pre.erEncounterId || null };
          list('receptionAdmRequests').push(r); save();
          audit('Created admission request', 'Admission request', { id: r.id, label: r.no + ' ' + p.name }, [['Type', '', type], ['Ward', '', (Kit.ward(r.wardPref) || {}).name]]);
          close(); toast('Admission request ' + r.no + ' sent for financial clearance'); onDone && onDone(r);
        });
        drawPt(); chk();
      } });
  }

  /* Consent form (admission or surgical) generated from the record. */
  function consentForm(p, e, kind) {
    const b = e && e.bedId ? Kit.bed(e.bedId) : null;
    const surg = kind === 'Surgical';
    Kit.printDoc({ title: (surg ? 'Surgical' : 'Admission') + ' consent form', sub: 'Consent form, ' + (p.lang === 'Arabic' ? 'Arabic and English' : 'English'), html: `
      <h3 style="margin:0 0 6px">${surg ? 'Consent for surgery or procedure' : 'Consent for admission and treatment'}</h3>
      <table><tr><td><b>Patient</b></td><td>${esc(p.name)} ${p.nameAr ? '· ' + esc(p.nameAr) : ''}</td><td><b>MRN</b></td><td>${esc(p.mrn)}</td></tr>
      <tr><td><b>Civil ID</b></td><td>${esc(p.civilId || p.passportNo || '')}</td><td><b>Date of birth</b></td><td>${esc(fmtDate(p.dob))}</td></tr>
      <tr><td><b>Admission</b></td><td>${esc(e ? e.no : '')}</td><td><b>Ward / bed</b></td><td>${esc(b ? ((Kit.ward(b.wardId) || {}).name + ' / ' + b.no) : '')}</td></tr>
      <tr><td><b>Doctor</b></td><td>${esc(e ? Kit.docName(e.attendingId || e.doctorId) : '')}</td><td><b>Diagnosis</b></td><td>${esc(e ? e.reason || '' : '')}</td></tr></table>
      <p style="margin-top:12px">${surg ? 'I consent to the operation or procedure named above. The doctor explained the nature, the expected benefits, the material risks including bleeding, infection and anaesthesia risks, and the alternatives. I consent to anaesthesia and to blood transfusion if needed, unless I state otherwise below.' : 'I consent to admission to the hospital and to routine investigations, nursing care and treatment that the treating team considers necessary. I was told about the room rates, the payer coverage and my estimated share, and I agree to pay amounts not covered by my payer.'}</p>
      <p>Exceptions or refusals: ______________________________________________</p>
      <table class="doc-sign" style="margin-top:18px"><tr><td style="height:46px;vertical-align:bottom">Patient or guardian signature</td><td style="vertical-align:bottom">Relation</td><td style="vertical-align:bottom">Doctor signature</td><td style="vertical-align:bottom">Witness</td></tr>
      <tr><td>Date and time: ____________</td><td></td><td>${esc(e ? Kit.docName(e.attendingId || e.doctorId) : '')}</td><td>${esc(myName())}</td></tr></table>`,
      extra: `<span class="grow"></span><span class="scope-note">${icon('info')} E-signature capture and email are subject to agreement</span>` });
    audit('Generated ' + (surg ? 'surgical' : 'admission') + ' consent', 'Encounter', { id: e ? e.id : p.id, label: (e ? e.no + ' ' : '') + p.name });
  }

  /* Module styles shared by the reception pages. */
  (function () { const st = document.createElement('style'); st.textContent = '.tbl .num{white-space:nowrap}.tbl td .cell-main{min-width:150px}.tbl td .mono{white-space:nowrap}'; document.head.appendChild(st); })();

  /* One-time data completion: today's seeded OPD visits that are already checked in get their consultation
   * invoice and the payment taken by the morning cashier, so the queue and the cashier totals agree. */
  (function () {
    if (db.receptionInit) return;
    const T = db.TODAY; const sh = list('receptionShifts').find(s => s.id === 'sh_03');
    db.encounters.filter(e => e.type === 'OPD' && e.start.startsWith(T) && /Checked in|Waiting for doctor|In consultation/.test(e.status) && !db.invoices.some(i => i.encounterId === e.id)).forEach((e, k) => {
      const p = Kit.pt(e.patientId) || {}; const d = Kit.doc(e.doctorId) || {};
      const code = e.visitType === 'Follow-up' ? 'SRV-CON-F' : d.grade === 'Consultant' ? 'SRV-CON-C' : 'SRV-CON-S'; const sv = db.services.find(x => x.code === code) || { name: 'Consultation', price: 20 };
      const cv = primary(p.id); const ok = cv && !(cv.to && cv.to < T); const sh2 = share(sv.price, ok ? cv.planId : null);
      const unpaid = k % 5 === 3;
      const iv = { id: 'iv_rc' + pad(k + 1, 3), no: Kit.nextNo('INV-26-', db.invoices), encounterId: e.id, patientId: p.id, date: T, type: 'OPD', lines: [{ code, desc: sv.name + ' · ' + d.name, qty: 1, price: sv.price }], total: sv.price, payerId: ok ? cv.payerId : null, planId: ok ? cv.planId : null, payerAmount: sh2.payer, patientAmount: sh2.patient, paid: unpaid ? 0 : sh2.patient, status: unpaid && sh2.patient > 0 ? 'Unpaid' : 'Paid', claimStatus: ok ? 'Not submitted' : '', by: 'Fatima Al-Kandari' };
      db.invoices.push(iv); e.invoiceId = iv.id;
      if (!unpaid && sh2.patient > 0 && sh) { const mode = ['Cash', 'KNET debit card', 'Credit card (Visa, Mastercard)'][k % 3]; list('receptionPayments').push({ id: 'py_rc' + pad(k + 1, 3), no: Kit.nextNo('RCP-26-', list('receptionPayments')), shiftId: sh.id, invoiceId: iv.id, patientId: p.id, amount: sh2.patient, mode, ref: mode === 'Cash' ? '' : 'AUTH ' + (604100 + k * 13), at: e.start, by: 'Fatima Al-Kandari' }); }
    });
    db.receptionInit = true; save();
  })();

  window.Reception = { AREAS, qStart, DISCHARGE_TYPES, LANGS, gate, now, mins, dur, isMerged, activePatients, coverage, primary, syncPrimary, covState, share, matches, nextMrn,
    printWristband, printCard, printToken, printReceipt, barcode, balance, setInvStatus, myShift, payModes, shiftTotals, collect, registerDrawer, docDrawer, newVisit, admitRequest, consentForm, myName, myId };
})();
