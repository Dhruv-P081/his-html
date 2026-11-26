/* Insurance module helpers (window.Insurance): coverage lookup, claim validation, claim overlay and status badges.
 * Loaded after kit.js on insurance pages. */
(function () {
  const { db, save, esc, icon } = window.UI;
  const K = window.Kit;
  const r3 = (n) => Math.round(Number(n || 0) * 1000) / 1000;

  /* Right-align table headers over numeric columns (UI.table only sets the class on the cells). */
  (function alignNumHeads() {
    const fix = () => document.querySelectorAll('table.tbl').forEach(t => {
      const row = t.tBodies[0] && [...t.tBodies[0].rows].find(r => r.cells.length > 1); const head = t.tHead && t.tHead.rows[0];
      if (!row || !head || head.cells.length !== row.cells.length) return;
      [...row.cells].forEach((td, i) => { const on = td.classList.contains('num'); if (head.cells[i].classList.contains('num') !== on) head.cells[i].classList.toggle('num', on); });
    });
    new MutationObserver(fix).observe(document.documentElement, { childList: true, subtree: true });
  })();

  if (!document.getElementById('insStyle')) { const st = document.createElement('style'); st.id = 'insStyle'; st.textContent = '.tbl td .mono, .tbl td.mono { white-space: nowrap; }'; document.head.appendChild(st); }
  ['insuranceContracts', 'insuranceRules', 'insuranceClaimData', 'insuranceBatches', 'insuranceRemittances', 'insurancePreauths', 'insuranceRejectReasons', 'insurancePaStatuses'].forEach(k => { if (!db[k]) db[k] = []; });

  /* Extra status tones used by this module (Kit.status covers the common ones). */
  const EXTRA = { 'Partially approved': 'warn', 'Partially paid': 'warn', 'Short-paid': 'warn', 'Superseded': 'neutral', 'Remitted': 'ok', 'Exported': 'info', 'Validated': 'info', 'Uploaded': 'info',
    'Unmatched': 'err', 'Corrected': 'violet', 'Resubmitted': 'info', 'Final denial': 'err', 'Pending approval': 'warn', 'Draft': 'neutral', 'Resubmission': 'violet', 'Original': 'neutral', 'Duplicate': 'err' };
  const status = (s) => K.status(s, EXTRA[s]);

  const insured = () => db.invoices.filter(i => i.payerId);
  const inv = (id) => db.invoices.find(i => i.id === id);
  /* Claim overlay (created on first use). */
  function cd(invoiceId) {
    let c = db.insuranceClaimData.find(x => x.invoiceId === invoiceId);
    if (!c) { c = { id: 'icd_' + invoiceId, invoiceId, diagnosis: '', preauthNo: '', notes: '', batchId: '', rejectCode: '', rejectNote: '', rejectedAt: '', paidAmount: 0, shortAmount: 0, resubmitCount: 0, corrected: false }; db.insuranceClaimData.push(c); }
    return c;
  }
  const dx = (i) => { const c = db.insuranceClaimData.find(x => x.invoiceId === i.id); return (c && c.diagnosis) || (K.enc(i.encounterId) || {}).diagnosis || ''; };
  const icdName = (code) => ((db.icd10 || []).find(x => x.code === code) || {}).name || '';
  const reason = (code) => (db.insuranceRejectReasons || []).find(r => r.code === code) || null;
  const batch = (id) => db.insuranceBatches.find(b => b.id === id);
  const payerName = (id) => (K.payer(id) || {}).name || '';
  const payerCode = (id) => (K.payer(id) || {}).code || '';
  const deptName = (id) => window.UI.L.dName(id);

  /* ---------- Coverage ---------- */
  function contractFor(payerId, date) {
    return db.insuranceContracts.find(c => c.payerId === payerId && c.status === 'Active' && c.from <= date && c.to >= date) || null;
  }
  function lineCategory(l) {
    const c = String(l.code || '');
    if (c.startsWith('LAB-')) return 'Laboratory';
    if (c.startsWith('RAD-')) return 'Radiology';
    if (c.startsWith('PHM-')) return 'Pharmacy';
    const s = (db.services || []).find(x => x.code === c);
    return s ? s.category : 'Other';
  }
  const LEVEL_RANK = { Service: 1, Package: 1, Item: 1, Category: 2, Department: 3 };
  function ruleFor(contract, line, invoice) {
    if (!contract) return null;
    const code = String(line.code || ''), cat = lineCategory(line), e = K.enc(invoice && invoice.encounterId) || {};
    const planId = invoice && invoice.planId;
    const hits = (contract.rules || []).filter(r => (!r.planId || r.planId === planId) && (
      ((r.level === 'Service' || r.level === 'Package') && code === r.target) ||
      (r.level === 'Item' && (code === r.target || code === 'PHM-' + r.target)) ||
      (r.level === 'Category' && cat === r.target) ||
      (r.level === 'Department' && e.deptId === r.target)));
    hits.sort((a, b) => (LEVEL_RANK[a.level] - LEVEL_RANK[b.level]) || ((b.planId ? 1 : 0) - (a.planId ? 1 : 0)));
    return hits[0] || null;
  }
  function needsPreauth(contract, line, invoice) { const r = ruleFor(contract, line, invoice); return !!(r && r.preauth) || ((contract && contract.rules) || []).some(x => x.preauth && x.target === line.code); }
  function approvedPreauth(invoice) {
    const c = db.insuranceClaimData.find(x => x.invoiceId === invoice.id);
    return (db.insurancePreauths || []).find(a => /Approved|Partially approved/.test(a.status) && ((c && c.preauthNo && a.payerRef === c.preauthNo) || (a.encounterId === invoice.encounterId && a.payerRef))) || null;
  }

  /* ---------- Validation (one local authority; rule set to be confirmed) ---------- */
  function ruleOn(code) { const r = (db.insuranceRules || []).find(x => x.code === code); return !r || r.active; }
  function validate(i) {
    const out = [];
    const add = (code, msg, fix) => { if (!ruleOn(code)) return; const r = (db.insuranceRules || []).find(x => x.code === code) || {}; out.push({ code, sev: r.severity || 'Error', msg, fix: fix || '' }); };
    const p = K.pt(i.patientId) || {};
    const c = db.insuranceClaimData.find(x => x.invoiceId === i.id) || {};
    if (!p.policyNo) add('V01', 'Policy number is missing on the patient record.', 'Update the policy at Reception');
    else if (p.policyTo && p.policyTo < i.date) add('V02', `Policy expired on ${K.day(p.policyTo)}, before the service date ${K.day(i.date)}.`, 'Confirm cover with the payer');
    const d = dx(i);
    if (!d) add('V03', 'Principal diagnosis (ICD-10) is missing.', 'Add the diagnosis');
    else if (!icdName(d)) add('V03', `Diagnosis code ${d} is not in the ICD-10 list.`, 'Correct the diagnosis');
    const ct = contractFor(i.payerId, i.date);
    if (!ct) add('V04', `No active contract with ${payerCode(i.payerId)} on ${K.day(i.date)}.`, 'Set up or approve the payer contract');
    (i.lines || []).forEach(l => {
      const r = ruleFor(ct, l, i);
      if (r && r.excluded) add('V06', `${l.desc} is excluded under ${ct.no}${r.note ? ' (' + r.note + ')' : ''}.`, 'Remove the line or bill the patient');
      if (ct && needsPreauth(ct, l, i) && !approvedPreauth(i)) add('V05', `${l.desc} needs an approved pre-authorization.`, 'Add the pre-authorization number');
      if (r && r.limit && l.qty * l.price > Number(r.limit) * (r.note && /day/i.test(r.note) ? l.qty : 1)) add('V07', `${l.desc}: ${K.money(l.qty * l.price)} is above the contract limit of ${K.money(r.limit)}${r.note ? ' ' + r.note.toLowerCase() : ''}.`, 'Check the tariff');
    });
    const dup = db.invoices.find(x => x.id !== i.id && x.patientId === i.patientId && x.payerId === i.payerId && x.date === i.date && x.type === i.type && x.claimStatus && x.claimStatus !== 'Not submitted');
    if (dup) add('V08', `Possible duplicate of ${dup.no} (same patient, date and payer).`, 'Check the earlier claim');
    const age = Math.round((new Date(db.TODAY) - new Date(i.date)) / 864e5);
    if (age > 90) add('V09', `Service date is ${age} days ago (limit 90 days).`, 'Attach the late submission reason');
    if (!/^\d{12}$/.test(String(p.civilId || ''))) add('V10', 'Civil ID is missing or not 12 digits.', 'Update the patient record');
    if (Number(i.paid || 0) + 0.0005 < Number(i.patientAmount || 0) && i.type !== 'IPD') add('V11', `Co-pay of ${K.money(i.patientAmount)} not fully collected (paid ${K.money(i.paid)}).`, 'Collect at the cashier');
    return out;
  }
  const errs = (list) => list.filter(x => x.sev === 'Error').length;
  const warns = (list) => list.filter(x => x.sev === 'Warning').length;
  function vBadge(list) {
    const e = errs(list), w = warns(list);
    if (!e && !w) return `<span class="badge b-ok">${icon('circle-check')} Valid</span>`;
    return `${e ? `<span class="badge b-err">${e} error${e > 1 ? 's' : ''}</span> ` : ''}${w ? `<span class="badge b-warn">${w} warning${w > 1 ? 's' : ''}</span>` : ''}`;
  }
  function issuesHtml(list) {
    if (!list.length) return `<div class="banner ok">${icon('circle-check')}<span>All active rules passed.</span></div>`;
    return `<div class="stack tight">${list.map(x => `<div class="alert-cdss ${x.sev === 'Warning' ? 'warn' : ''}">${icon(x.sev === 'Warning' ? 'triangle-alert' : 'circle-x')}<div class="grow"><span class="req-ref">${esc(x.code)}</span> ${esc(x.msg)}${x.fix ? `<div class="xs" style="font-weight:600;opacity:.85;margin-top:2px">Fix: ${esc(x.fix)}</div>` : ''}</div></div>`).join('')}</div>`;
  }

  /* Claim fix drawer: diagnosis, pre-auth number and claim note. onDone() after save. */
  function fixDrawer(i, onDone, o) {
    o = o || {};
    const c = cd(i.id), p = K.pt(i.patientId);
    const pas = (db.insurancePreauths || []).filter(a => a.patientId === i.patientId && a.payerRef);
    window.UI.drawer({ title: (o.title || 'Fix claim') + ' ' + i.no, sub: esc(payerName(i.payerId)) + ' · ' + esc(K.day(i.date)), wide: true,
      body: `${K.patientBanner(p, K.enc(i.encounterId))}
        <div class="section-t" style="margin-top:14px">Validation</div><div id="fxIss">${issuesHtml(validate(i))}</div>
        ${o.extra || ''}
        <div class="section-t" style="margin-top:14px">Claim lines</div>
        <div class="table-wrap"><table class="tbl compact"><thead><tr><th>Code</th><th>Description</th><th>Category</th><th class="num">Qty</th><th class="num">Amount</th></tr></thead><tbody>${(i.lines || []).map(l => `<tr><td class="mono">${esc(l.code)}</td><td>${esc(l.desc)}</td><td>${esc(lineCategory(l))}</td><td class="num">${l.qty}</td><td class="num">${K.money(l.qty * l.price, false)}</td></tr>`).join('')}</tbody></table></div>
        <div class="section-t" style="margin-top:14px">Corrections</div>
        <div class="err-summary hidden"></div>
        <div class="form-grid">
          ${window.UI.field({ id: 'fxDx', label: 'Principal diagnosis (ICD-10)', type: 'select', options: db.icd10.map(x => [x.code, x.code + ' · ' + x.name]), value: dx(i), req: true })}
          ${window.UI.field({ id: 'fxPa', label: 'Pre-authorization number', type: 'select', options: pas.map(a => [a.payerRef, a.payerRef + ' · ' + a.status + ' · ' + a.lines.map(l => l.desc).join(', ')]), value: c.preauthNo, placeholder: 'None' })}
          ${window.UI.field({ id: 'fxNote', label: 'Claim note to payer', type: 'textarea', value: c.notes, full: true, hint: 'Sent with the claim, for example a late submission reason.' })}
        </div>`,
      foot: `<button class="btn" data-close>Cancel</button><button class="btn" id="fxCheck">${icon('refresh-cw')} Re-validate</button><button class="btn primary" id="fxSave">${icon('save')} ${esc(o.saveLabel || 'Save and re-validate')}</button>`,
      onMount: (el, close) => {
        const apply = () => { const before = [c.diagnosis || dx(i), c.preauthNo, c.notes]; c.diagnosis = window.UI.$('#fxDx', el).value; c.preauthNo = window.UI.$('#fxPa', el).value; c.notes = window.UI.$('#fxNote', el).value.trim(); return before; };
        window.UI.$('#fxCheck', el).addEventListener('click', () => { const keep = [c.diagnosis, c.preauthNo, c.notes]; apply(); window.UI.$('#fxIss', el).innerHTML = issuesHtml(validate(i)); [c.diagnosis, c.preauthNo, c.notes] = keep; });
        window.UI.$('#fxSave', el).addEventListener('click', () => {
          if (!window.UI.showErrors(el, window.UI.$('#fxDx', el).value ? {} : { fxDx: 'Diagnosis is required.' })) return;
          const before = apply();
          if (o.markCorrected) c.corrected = true;
          save();
          window.UI.audit(o.auditAction || 'Claim corrected', 'Claim', { id: i.id, label: i.no }, [['Diagnosis', before[0], c.diagnosis], ['Pre-authorization', before[1], c.preauthNo], ['Note', before[2], c.notes]].filter(x => String(x[1] || '') !== String(x[2] || '')));
          const v = validate(i);
          close(); window.UI.toast(errs(v) ? `Saved. ${errs(v)} error(s) remain.` : 'Saved. Claim passes validation.', errs(v) ? 'err' : undefined);
          onDone && onDone();
        });
      } });
  }

  /* Claim export rows in the agreed file format (one row per claim line). */
  const EXPORT_HEAD = ['batch_no', 'claim_no', 'payer_code', 'policy_no', 'civil_id', 'patient_name', 'service_date', 'encounter_type', 'icd10', 'preauth_no', 'line_no', 'service_code', 'description', 'qty', 'unit_price', 'gross', 'patient_share', 'net_claimed'];
  function exportRows(b) {
    const rows = [];
    b.invoiceIds.map(inv).filter(Boolean).forEach(i => {
      const p = K.pt(i.patientId) || {}, c = db.insuranceClaimData.find(x => x.invoiceId === i.id) || {};
      (i.lines || []).forEach((l, n) => {
        const gross = l.qty * l.price, share = i.total ? r3(gross * i.patientAmount / i.total) : 0;
        rows.push([b.no, i.no, payerCode(i.payerId), p.policyNo || '', p.civilId || '', p.name || '', i.date, i.type, dx(i), c.preauthNo || '', n + 1, l.code, l.desc, l.qty, r3(l.price).toFixed(3), r3(gross).toFixed(3), share.toFixed(3), r3(gross - share).toFixed(3)]);
      });
    });
    return rows;
  }

  window.Insurance = { status, insured, inv, cd, dx, icdName, reason, batch, payerName, payerCode, deptName, contractFor, lineCategory, ruleFor, needsPreauth, approvedPreauth, validate, errs, warns, vBadge, issuesHtml, fixDrawer, EXPORT_HEAD, exportRows, r3 };
})();
