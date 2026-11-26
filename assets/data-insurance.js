/* Insurance and Claims (SOW V4 Module 9) seed data. Loaded after data-core.js.
 * Keys (all owned by the Insurance module):
 *   insuranceContracts     payer contracts with coverage rules (by plan, department, category, service, package, item)
 *   insuranceRules         claim validation rule set for one local authority (authority and rules to be confirmed)
 *   insuranceClaimData     claim overlay per invoice: diagnosis, pre-auth no, batch, rejection, payment
 *   insuranceBatches       claim batches (original and resubmission)
 *   insuranceRemittances   manually uploaded remittances with reconciliation lines
 *   insurancePreauths      pre-authorization requests with attachments, history and queries
 *   insuranceRejectReasons Claim Rejection Reason master
 *   insurancePaStatuses    Pre-Authorization Status master
 * Invoices keep their shared shape; Insurance only sets invoice.claimStatus. */
(function () {
  const S = window.SEED;
  const T = S.TODAY;
  const pad = (n, w) => String(n).padStart(w || 2, '0');
  const addDays = (d, n) => { const x = new Date(d + 'T00:00:00'); x.setDate(x.getDate() + n); return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}`; };
  const r3 = (n) => Math.round(n * 1000) / 1000;

  /* ---------- Masters ---------- */
  const insuranceRejectReasons = [
    ['CR-01', 'Principal diagnosis missing or invalid', 'Coding', 'Add a valid ICD-10 code and resubmit'],
    ['CR-02', 'Service not covered under the policy', 'Coverage', 'Check contract exclusions; bill the patient if confirmed'],
    ['CR-03', 'Pre-authorization missing', 'Authorization', 'Attach the approved pre-authorization number'],
    ['CR-04', 'Policy expired on the date of service', 'Eligibility', 'Confirm cover with the payer or bill the patient'],
    ['CR-05', 'Member not found', 'Eligibility', 'Check the policy number and Civil ID'],
    ['CR-06', 'Duplicate claim', 'Administrative', 'Check if the claim was paid in an earlier batch'],
    ['CR-07', 'Late submission', 'Administrative', 'Attach the justification for late submission'],
    ['CR-08', 'Amount above the contracted tariff', 'Pricing', 'Correct the price to the contract tariff'],
    ['CR-09', 'Medical necessity not established', 'Clinical', 'Attach clinical notes and resubmit'],
    ['CR-10', 'Diagnosis does not support the service', 'Coding', 'Review coding with the doctor'],
  ].map(([code, name, category, action], i) => ({ id: 'irr_' + pad(i + 1), code, name, category, action, status: 'Active' }));

  const insurancePaStatuses = [
    ['DRAFT', 'Draft', false, 'Request being prepared; not sent to the payer'],
    ['SUB', 'Submitted', false, 'Sent to the payer or TPA, waiting for a decision'],
    ['QRY', 'Query', false, 'Payer asked for more information'],
    ['APR', 'Approved', true, 'Approved in full'],
    ['PAP', 'Partially approved', true, 'Approved for part of the requested services or amount'],
    ['DEN', 'Denied', true, 'Request denied by the payer'],
    ['EXP', 'Expired', true, 'Approval validity ended before the service'],
    ['CAN', 'Cancelled', true, 'Withdrawn by the hospital'],
  ].map(([code, name, final, description], i) => ({ id: 'ips_' + pad(i + 1), code, name, final, description, status: 'Active' }));

  const insuranceRules = [
    ['V01', 'Policy number present', 'Error', 'Eligibility'],
    ['V02', 'Policy valid on the date of service', 'Error', 'Eligibility'],
    ['V03', 'Principal diagnosis is a valid ICD-10 code', 'Error', 'Coding'],
    ['V04', 'Active payer contract on the date of service', 'Error', 'Contract'],
    ['V05', 'Approved pre-authorization for services that need one', 'Error', 'Authorization'],
    ['V06', 'No excluded services on the claim', 'Error', 'Coverage'],
    ['V07', 'Line amount within the contract limit', 'Warning', 'Pricing'],
    ['V08', 'No duplicate claim for the same patient, date and payer', 'Warning', 'Administrative'],
    ['V09', 'Submitted within 90 days of service', 'Warning', 'Administrative'],
    ['V10', 'Civil ID present with 12 digits', 'Error', 'Eligibility'],
    ['V11', 'Patient co-pay collected', 'Warning', 'Billing'],
  ].map(([code, name, severity, group], i) => ({ id: 'irl_' + pad(i + 1), code, name, severity, group, active: true }));

  /* ---------- Contracts ---------- */
  const R = (level, target, label, o) => Object.assign({ level, target, label, planId: '', coveragePct: 100, copayPct: '', deductible: '', limit: '', excluded: false, preauth: false, note: '' }, o || {});
  const common = () => [
    R('Category', 'Consultation', 'All consultations'),
    R('Category', 'Laboratory', 'Laboratory tests', { limit: 150, note: 'Per visit' }),
    R('Category', 'Radiology', 'Radiology exams', { limit: 400 }),
    R('Service', 'SRV-ECHO', 'Echocardiography', { preauth: true }),
    R('Service', 'RAD-CT-AB', 'CT abdomen and pelvis with contrast', { preauth: true }),
    R('Service', 'RAD-CT-CA', 'CT coronary angiography', { preauth: true }),
    R('Service', 'RAD-MR-KN', 'MRI knee', { preauth: true }),
    R('Service', 'RAD-MR-BR', 'MRI brain', { preauth: true }),
    R('Package', 'PKG-APP', 'Appendectomy package', { preauth: true }),
    R('Package', 'PKG-CHK', 'Executive health check', { excluded: true, coveragePct: 0, note: 'Preventive check-ups not covered' }),
    R('Category', 'Room', 'Room and board', { limit: 120, note: 'Per day; ICU needs pre-authorization', preauth: false }),
    R('Service', 'SRV-BED-I', 'ICU bed, per day', { preauth: true }),
    R('Item', 'DRG-011', 'Insulin glargine pen', { coveragePct: 80 }),
  ];
  const insuranceContracts = [
    { id: 'ic_01', no: 'CTR-26-101', payerId: 'py_01', tpa: 'NAS Kuwait', planIds: ['pl_01', 'pl_02'], name: 'GIG hospital agreement 2026', from: '2026-01-01', to: '2026-12-31', defaultCoverage: 100, discountPct: 10, status: 'Active', version: 3, createdBy: 'Layla Hussain', createdAt: '2025-12-10 10:20', approvedBy: 'Sara Al-Mutairi', approvedAt: '2025-12-15 12:00',
      rules: common().concat([R('Category', 'Pharmacy', 'Outpatient medicines', { planId: 'pl_02', coveragePct: 80, copayPct: 20 }), R('Department', 'dp_02', 'Paediatrics', { copayPct: 0, note: 'No co-pay for children under 12' })]) },
    { id: 'ic_02', no: 'CTR-26-102', payerId: 'py_02', tpa: 'Globemed Kuwait', planIds: ['pl_03', 'pl_04'], name: 'Warba provider agreement', from: '2026-03-01', to: '2027-02-28', defaultCoverage: 100, discountPct: 12, status: 'Active', version: 2, createdBy: 'Bilal Qureshi', createdAt: '2026-02-10 09:00', approvedBy: 'Sara Al-Mutairi', approvedAt: '2026-02-18 11:30', rules: common() },
    { id: 'ic_03', no: 'CTR-26-103', payerId: 'py_03', tpa: '', planIds: ['pl_05'], name: 'KIC family plan agreement', from: '2026-01-01', to: '2026-12-31', defaultCoverage: 90, discountPct: 8, status: 'Active', version: 1, createdBy: 'Layla Hussain', createdAt: '2025-12-20 13:40', approvedBy: 'Sara Al-Mutairi', approvedAt: '2025-12-28 10:00',
      rules: common().concat([R('Service', 'LAB-VITD', 'Vitamin D (25-OH)', { excluded: true, coveragePct: 0, note: 'Screening tests excluded' })]) },
    { id: 'ic_04', no: 'CTR-26-104', payerId: 'py_04', tpa: 'Gulf Insurance Group', planIds: ['pl_06'], name: 'Afya retiree scheme', from: '2025-07-01', to: '2026-06-30', defaultCoverage: 100, discountPct: 0, status: 'Expired', version: 1, createdBy: 'Layla Hussain', createdAt: '2025-06-01 09:00', approvedBy: 'Sara Al-Mutairi', approvedAt: '2025-06-10 09:00', rules: common() },
    { id: 'ic_05', no: 'CTR-26-105', payerId: 'py_04', tpa: 'Gulf Insurance Group', planIds: ['pl_06'], name: 'Afya retiree scheme (renewal)', from: '2026-07-01', to: '2027-06-30', defaultCoverage: 100, discountPct: 0, status: 'Active', version: 2, createdBy: 'Layla Hussain', createdAt: '2026-06-05 10:00', approvedBy: 'Sara Al-Mutairi', approvedAt: '2026-06-20 10:00', rules: common() },
    { id: 'ic_06', no: 'CTR-26-106', payerId: 'py_05', tpa: '', planIds: ['pl_07'], name: 'KOC corporate account', from: '2026-01-01', to: '2026-12-31', defaultCoverage: 100, discountPct: 15, status: 'Active', version: 1, createdBy: 'Bilal Qureshi', createdAt: '2025-12-01 10:00', approvedBy: 'Sara Al-Mutairi', approvedAt: '2025-12-05 10:00',
      rules: common().filter(r => r.level !== 'Package' || r.target !== 'PKG-CHK').concat([R('Package', 'PKG-CHK', 'Executive health check', { note: 'Annual check for employees' })]) },
    { id: 'ic_07', no: 'CTR-27-107', payerId: 'py_01', tpa: 'NAS Kuwait', planIds: ['pl_01', 'pl_02'], name: 'GIG hospital agreement 2027', from: '2027-01-01', to: '2027-12-31', defaultCoverage: 100, discountPct: 11, status: 'Pending approval', version: 4, createdBy: 'Layla Hussain', createdAt: '2026-11-20 11:15', submittedBy: 'Layla Hussain', submittedAt: '2026-11-21 09:30',
      rules: common().concat([R('Category', 'Pharmacy', 'Outpatient medicines', { planId: 'pl_02', coveragePct: 85, copayPct: 15 }), R('Service', 'SRV-NEB', 'Nebulization', { limit: 6 })]) },
    { id: 'ic_08', no: 'CTR-27-108', payerId: 'py_03', tpa: '', planIds: ['pl_05'], name: 'KIC family plan 2027 (draft)', from: '2027-01-01', to: '2027-12-31', defaultCoverage: 90, discountPct: 9, status: 'Draft', version: 2, createdBy: 'Bilal Qureshi', createdAt: '2026-11-22 14:00', rules: common().slice(0, 6) },
  ];
  insuranceContracts.forEach(c => c.rules.forEach((r, i) => { r.id = c.id + '_r' + pad(i + 1); }));

  /* ---------- Claims, batches and remittances (derived from the shared invoices) ---------- */
  const dxPool = ['J06.9', 'I10', 'E11.9', 'J02.9', 'R07.9', 'M54.5', 'N39.0', 'L20.9', 'H66.90', 'K21.9'];
  const insuranceClaimData = [], insuranceBatches = [], insuranceRemittances = [];
  const ins = (S.invoices || []).filter(i => i.payerId);
  const enc = (id) => (S.encounters || []).find(e => e.id === id) || {};
  ins.forEach((inv, i) => {
    const e = enc(inv.encounterId);
    const cd = { id: 'icd_' + inv.id, invoiceId: inv.id, diagnosis: '', preauthNo: '', notes: '', batchId: '', rejectCode: '', rejectNote: '', rejectedAt: '', paidAmount: 0, shortAmount: 0, resubmitCount: 0, corrected: false };
    if (!e.diagnosis && (inv.claimStatus !== 'Not submitted' && inv.claimStatus !== 'In batch' || i % 2 === 0)) cd.diagnosis = dxPool[i % dxPool.length];
    insuranceClaimData.push(cd);
  });
  const cdOf = (id) => insuranceClaimData.find(c => c.invoiceId === id);
  let bn = 1040, rn = 510;
  const byPayer = (st) => ins.filter(i => st.includes(i.claimStatus)).reduce((m, x) => { (m[x.payerId] = m[x.payerId] || []).push(x); return m; }, {});
  const mkBatch = (payerId, list, status, by) => {
    const dates = list.map(x => x.date).sort();
    const at = dates[dates.length - 1];
    const b = { id: 'icb_' + (bn + 1), no: 'CB-26-' + (++bn), payerId, type: 'Original', from: dates[0], to: at, invoiceIds: list.map(x => x.id), status, format: 'CSV', createdBy: by, createdAt: at + ' 10:15',
      validatedAt: status !== 'Draft' ? at + ' 10:40' : '', exportedAt: status !== 'Draft' ? at + ' 11:00' : '', exportedBy: status !== 'Draft' ? by : '', submittedAt: status !== 'Draft' ? at + ' 11:20' : '', submittedBy: status !== 'Draft' ? by : '' };
    list.forEach(x => { cdOf(x.id).batchId = b.id; });
    insuranceBatches.push(b);
    return b;
  };
  Object.entries(byPayer(['Paid', 'Rejected'])).forEach(([py, list], k) => {
    const b = mkBatch(py, list, 'Remitted', k % 2 ? 'Bilal Qureshi' : 'Layla Hussain');
    const at = b.to;
    const lines = list.map((inv, j) => {
      const cd = cdOf(inv.id);
      if (inv.claimStatus === 'Paid') { cd.paidAmount = inv.payerAmount; return { invoiceNo: inv.no, invoiceId: inv.id, claimed: inv.payerAmount, paid: inv.payerAmount, denialCode: '', remark: '', status: 'Paid' }; }
      const code = ['CR-01', 'CR-03', 'CR-09', 'CR-02'][(k + j) % 4];
      Object.assign(cd, { rejectCode: code, rejectNote: (insuranceRejectReasons.find(r => r.code === code) || {}).name, rejectedAt: at + ' 12:00' });
      if (code === 'CR-01') cd.diagnosis = '';
      return { invoiceNo: inv.no, invoiceId: inv.id, claimed: inv.payerAmount, paid: 0, denialCode: code, remark: 'Denied by payer', status: 'Denied' };
    });
    const rid = 'ira_' + (rn + 1);
    list.forEach(inv => { cdOf(inv.id).remittanceId = rid; });
    insuranceRemittances.push({ id: rid, no: 'RA-26-' + (++rn), payerId: py, batchId: b.id, payerRef: (S.payers.find(p => p.id === py) || {}).code + '-RA-' + (8800 + rn), receivedAt: at + ' 15:00', fileName: 'remit_' + py + '_' + at.replace(/-/g, '') + '.csv', lines,
      claimed: r3(lines.reduce((s, l) => s + l.claimed, 0)), paid: r3(lines.reduce((s, l) => s + l.paid, 0)), status: 'Posted', uploadedBy: 'Bilal Qureshi', uploadedAt: at + ' 15:05', postedBy: 'Layla Hussain', postedAt: at + ' 16:10' });
  });
  Object.entries(byPayer(['Submitted'])).forEach(([py, list], k) => mkBatch(py, list, 'Submitted', k % 2 ? 'Layla Hussain' : 'Bilal Qureshi'));
  Object.entries(byPayer(['In batch'])).forEach(([py, list], k) => mkBatch(py, list, 'Draft', k % 2 ? 'Layla Hussain' : 'Bilal Qureshi'));
  // A remittance waiting to be reconciled and posted (uploaded by another user).
  const waiting = insuranceBatches.filter(b => b.status === 'Submitted').sort((a, b) => b.invoiceIds.length - a.invoiceIds.length)[0];
  if (waiting) {
    const lines = waiting.invoiceIds.map((id, j) => {
      const inv = ins.find(x => x.id === id);
      const kind = j % 4;
      const paid = kind === 1 ? r3(inv.payerAmount * 0.8) : kind === 2 ? 0 : inv.payerAmount;
      return { invoiceNo: inv.no, invoiceId: inv.id, claimed: inv.payerAmount, paid, denialCode: kind === 2 ? 'CR-09' : kind === 1 ? 'CR-08' : '', remark: kind === 1 ? 'Paid at contract tariff' : kind === 2 ? 'Clinical notes not attached' : '', status: paid >= inv.payerAmount ? 'Paid' : paid > 0 ? 'Short-paid' : 'Denied' };
    });
    insuranceRemittances.push({ id: 'ira_' + (rn + 1), no: 'RA-26-' + (++rn), payerId: waiting.payerId, batchId: waiting.id, payerRef: (S.payers.find(p => p.id === waiting.payerId) || {}).code + '-RA-' + (8800 + rn), receivedAt: addDays(T, -1) + ' 13:20', fileName: 'remittance_' + waiting.no + '.csv', lines,
      claimed: r3(lines.reduce((s, l) => s + l.claimed, 0)), paid: r3(lines.reduce((s, l) => s + l.paid, 0)), status: 'Uploaded', uploadedBy: 'Bilal Qureshi', uploadedAt: addDays(T, -1) + ' 13:25', postedBy: '', postedAt: '' });
  }

  /* ---------- Pre-authorizations ---------- */
  const pts = S.patients;
  const ipdIns = (S.encounters || []).filter(e => e.type === 'IPD' && (pts.find(p => p.id === e.patientId) || {}).planId);
  const opdIns = (S.encounters || []).filter(e => e.type === 'OPD' && e.start.startsWith(T) && (pts.find(p => p.id === e.patientId) || {}).planId);
  const svc = (code) => {
    const s = S.services.find(x => x.code === code); if (s) return { code: s.code, desc: s.name, qty: 1, price: s.price };
    const r = S.radExams.find(x => 'RAD-' + x.code === code); if (r) return { code, desc: r.name, qty: 1, price: r.price };
    const l = S.labTests.find(x => 'LAB-' + x.code === code); if (l) return { code, desc: l.name, qty: 1, price: l.price };
    return { code, desc: code, qty: 1, price: 0 };
  };
  const paPlan = [
    [ipdIns[0], ['SRV-ECHO', 'RAD-CT-CA'], 'Approved', 'I20.9', -2],
    [ipdIns[1], ['SRV-BED-W', 'SRV-NUR'], 'Approved', 'J18.9', -2],
    [ipdIns[2], ['SRV-BED-I'], 'Partially approved', 'I21.4', -2],
    [ipdIns[3], ['PKG-APP'], 'Approved', 'K35.80', -1],
    [ipdIns[4], ['RAD-MR-BR'], 'Query', 'R51.9', -1],
    [ipdIns[5], ['RAD-CT-AB'], 'Submitted', 'N39.0', 0],
    [opdIns[0], ['RAD-MR-KN'], 'Submitted', 'M17.11', 0],
    [opdIns[1], ['SRV-ECHO'], 'Draft', 'I48.91', 0],
    [opdIns[2], ['PKG-CHK'], 'Denied', 'Z00.00', -3],
    [opdIns[3] || ipdIns[6], ['RAD-CT-HD'], 'Draft', 'R51.9', 0],
  ].filter(x => x[0]);
  const insurancePreauths = paPlan.map(([e, codes, st, dx, off], i) => {
    const p = pts.find(x => x.id === e.patientId);
    const lines = codes.map(svc);
    if (codes[0] === 'SRV-BED-I' || codes[0] === 'SRV-BED-W') lines.forEach(l => { l.qty = 3; });
    const amount = r3(lines.reduce((s, l) => s + l.qty * l.price, 0));
    const day = addDays(T, off), by = i % 2 ? 'Layla Hussain' : 'Bilal Qureshi';
    const hist = [{ at: day + ' 09:' + pad(10 + i), by, status: 'Draft', note: 'Request created' }];
    if (st !== 'Draft') hist.push({ at: day + ' 09:' + pad(30 + i), by, status: 'Submitted', note: 'Sent to ' + ((S.payers.find(x => x.id === p.payerId) || {}).tpa || 'payer') });
    const queries = [];
    if (st === 'Query') { hist.push({ at: day + ' 13:05', by: 'Payer', status: 'Query', note: 'Clinical justification requested' }); queries.push({ at: day + ' 13:05', from: 'Payer', text: 'Please attach neurological examination findings and the reason MRI is needed before CT.', response: '', respondedAt: '', respondedBy: '' }); }
    let approved = 0;
    if (/Approved|Partially|Denied/.test(st)) {
      approved = st === 'Approved' ? amount : st === 'Partially approved' ? r3(amount * 2 / 3) : 0;
      hist.push({ at: day + ' 14:2' + (i % 10), by: 'Payer', status: st, note: st === 'Denied' ? 'Preventive check-up not covered' : st === 'Partially approved' ? 'Approved 2 of 3 ICU days' : 'Approved as requested' });
    }
    return { id: 'ipa_' + pad(i + 1), no: 'PA-26-' + (4100 + i), patientId: p.id, encounterId: e.id, payerId: p.payerId, planId: p.planId, policyNo: p.policyNo, diagnosis: [dx], lines, amount, approvedAmount: approved,
      status: st, payerRef: /Approved|Partially/.test(st) ? 'AUTH-' + (720300 + i * 17) : '', validTo: /Approved|Partially/.test(st) ? addDays(day, 30) : '', denialReason: st === 'Denied' ? 'CR-02' : '',
      attachments: [
        { type: 'Diagnosis', name: 'Diagnosis summary (ICD-10 ' + dx + ')', included: true },
        { type: 'Orders', name: 'Orders: ' + lines.map(l => l.desc).join(', '), included: true },
        { type: 'Notes', name: e.type === 'IPD' ? 'Admission note and progress notes' : 'Consultation note', included: st !== 'Query' },
        { type: 'Results', name: 'Recent laboratory results', included: i % 3 === 0 },
      ],
      clinicalNote: e.reason || e.complaint || '', urgency: e.type === 'IPD' && i % 2 === 0 ? 'Urgent' : 'Routine', history: hist, queries, createdBy: by, createdAt: hist[0].at };
  });
  // Link approved pre-auths to the matching claims
  insurancePreauths.filter(a => a.payerRef).forEach(a => { const inv = ins.find(x => x.encounterId === a.encounterId); if (inv) cdOf(inv.id).preauthNo = a.payerRef; });

  Object.assign(S, { insuranceContracts, insuranceRules, insuranceClaimData, insuranceBatches, insuranceRemittances, insurancePreauths, insuranceRejectReasons, insurancePaStatuses });
})();
