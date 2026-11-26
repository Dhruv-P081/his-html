/* Laboratory (LIS, SOW V4 Module 5) seed data. Loaded after data-core.js.
 * Own keys (prefix lab): labPanels, labRanges, labOrganisms, labAntibiotics, labRejectReasons, labOutsourceLabs,
 *   labHistory (previous results for delta checks), labSampleRejects, labCalls (critical call log), labDispatch (print / e-send log).
 * Shared keys it works on (as data-core.js allows): orders (type 'lab') status, results and lab workflow fields:
 *   acceptedAt/By, collectedAt/By, collectSite, receivedAt/By, rack, techVerifiedAt/By, verifiedAt/By (pathologist approval),
 *   comments, attachment, sensitivity, rejectReason, cancelReason. */
(function () {
  const S = window.SEED, T = S.TODAY;
  let seed = 52026;
  const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
  const pad = (n, w) => String(n).padStart(w || 2, '0');
  const addDays = (d, n) => { const x = new Date(d + 'T00:00:00'); x.setDate(x.getDate() + n); return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}`; };
  const plusMin = (s, m) => { const d = new Date(s.replace(' ', 'T')); d.setMinutes(d.getMinutes() + m); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`; };

  /* ---------- Reference ranges, critical limits and delta rules ---------- */
  const crit = { Potassium: [2.8, 6.0], Sodium: [120, 160], Glucose: [2.5, 25], Haemoglobin: [7, null], Platelets: [20, 1000], WBC: [1.0, 50], 'Troponin I': [null, 100], INR: [null, 5], Creatinine: [null, 600], CRP: [null, null], ALT: [null, 1000], 'Bilirubin, total': [null, 300] };
  const deltaPct = { Potassium: 20, Sodium: 6, Haemoglobin: 20, Platelets: 50, Creatinine: 30, 'Troponin I': 50, INR: 30, Glucose: 50, HbA1c: 15 };
  const abbr = (n) => n.replace(/[^A-Za-z0-9]/g, '').slice(0, 6).toUpperCase();
  const labRanges = [];
  Object.entries(S.labParams).forEach(([code, params]) => params.forEach(([name, unit, lo, hi]) => {
    const c = crit[name] || [null, null];
    if (name === 'Haemoglobin') {
      labRanges.push({ id: 'lr_' + pad(labRanges.length + 1, 3), code: `${code}-HB-M`, test: code, param: name, unit, gender: 'Male', ageFrom: 13, ageTo: 120, low: 13.0, high: 17.0, critLow: 7, critHigh: 20, deltaPct: 20, status: 'Active' });
      labRanges.push({ id: 'lr_' + pad(labRanges.length + 1, 3), code: `${code}-HB-F`, test: code, param: name, unit, gender: 'Female', ageFrom: 13, ageTo: 120, low: 12.0, high: 15.5, critLow: 7, critHigh: 20, deltaPct: 20, status: 'Active' });
    }
    labRanges.push({ id: 'lr_' + pad(labRanges.length + 1, 3), code: `${code}-${abbr(name)}`, test: code, param: name, unit, gender: 'All', ageFrom: 0, ageTo: 120, low: lo, high: hi, critLow: c[0], critHigh: c[1], deltaPct: deltaPct[name] || '', status: 'Active' });
  }));

  const labPanels = [
    ['PNL-DIAB', 'Diabetic profile', 'HBA1C, GLU, LIPID, BMP', 'Chemistry', 22],
    ['PNL-CARD', 'Cardiac profile', 'TROP, BMP, LIPID', 'Chemistry', 28],
    ['PNL-PREOP', 'Pre-operative screen', 'CBC, PT, BMP', 'General', 18],
    ['PNL-ANC', 'Antenatal booking profile', 'CBC, TSH, UA, GLU', 'General', 19],
    ['PNL-FEVER', 'Fever work-up', 'CBC, CRP, UA, BCS', 'General', 32],
    ['PNL-LIVER', 'Liver profile with coagulation', 'LFT, PT', 'Chemistry', 14],
    ['PNL-EXEC', 'Executive health check', 'CBC, BMP, LFT, LIPID, HBA1C, TSH, VITD, UA', 'General', 55],
    ['PNL-ANAEM', 'Anaemia profile', 'CBC, FER', 'Haematology', 14],
  ].map(([code, name, tests, section, price], i) => ({ id: 'lp_' + pad(i + 1), code, name, tests, section, price, status: 'Active' }));

  const labOrganisms = [
    ['ECOL', 'Escherichia coli', 'Gram negative', 'Bacterium'], ['KPNE', 'Klebsiella pneumoniae', 'Gram negative', 'Bacterium'],
    ['PAER', 'Pseudomonas aeruginosa', 'Gram negative', 'Bacterium'], ['PMIR', 'Proteus mirabilis', 'Gram negative', 'Bacterium'],
    ['SAUR', 'Staphylococcus aureus (MSSA)', 'Gram positive', 'Bacterium'], ['MRSA', 'Staphylococcus aureus (MRSA)', 'Gram positive', 'Bacterium'],
    ['EFAE', 'Enterococcus faecalis', 'Gram positive', 'Bacterium'], ['SPYO', 'Streptococcus pyogenes (Group A)', 'Gram positive', 'Bacterium'],
    ['CALB', 'Candida albicans', 'Not applicable', 'Fungus'], ['ABAU', 'Acinetobacter baumannii', 'Gram negative', 'Bacterium'],
  ].map(([code, name, gram, kind], i) => ({ id: 'lo_' + pad(i + 1), code, name, gram, kind, alert: /MRSA|ABAU/.test(code) ? 'Infection control alert' : '', status: 'Active' }));

  const labAntibiotics = [
    ['AMP', 'Ampicillin', 'Penicillins', 'Oral / IV', 'Urine, General'], ['AMC', 'Amoxicillin-clavulanate', 'Penicillins', 'Oral / IV', 'Urine, General'],
    ['CXM', 'Cefuroxime', 'Cephalosporins (2nd gen)', 'Oral / IV', 'Urine, General'], ['CRO', 'Ceftriaxone', 'Cephalosporins (3rd gen)', 'IV', 'Blood, General'],
    ['CIP', 'Ciprofloxacin', 'Fluoroquinolones', 'Oral / IV', 'Urine, General'], ['GEN', 'Gentamicin', 'Aminoglycosides', 'IV', 'Blood, Urine'],
    ['NIT', 'Nitrofurantoin', 'Nitrofurans', 'Oral', 'Urine'], ['SXT', 'Trimethoprim-sulfamethoxazole', 'Folate inhibitors', 'Oral', 'Urine, General'],
    ['TZP', 'Piperacillin-tazobactam', 'Penicillins + inhibitor', 'IV', 'Blood, General'], ['MEM', 'Meropenem', 'Carbapenems', 'IV', 'Blood, General'],
    ['VAN', 'Vancomycin', 'Glycopeptides', 'IV', 'Blood (Gram positive)'], ['OXA', 'Oxacillin', 'Penicillins (anti-staphylococcal)', 'IV', 'Blood (Gram positive)'],
  ].map(([code, name, cls, route, panel], i) => ({ id: 'la_' + pad(i + 1), code, name, cls, route, panel, status: 'Active' }));

  const labRejectReasons = [
    ['HAEM', 'Haemolysed sample', 'Sample', 'Recollect'], ['CLOT', 'Clotted sample', 'Sample', 'Recollect'],
    ['QNS', 'Insufficient quantity (QNS)', 'Sample', 'Recollect'], ['MISLBL', 'Mislabelled or unlabelled sample', 'Sample', 'Recollect'],
    ['WRTUBE', 'Wrong container or tube', 'Sample', 'Recollect'], ['LEAK', 'Leaking or broken container', 'Sample', 'Recollect'],
    ['STAB', 'Stability exceeded (delayed in transit)', 'Sample', 'Recollect'], ['LIPAEM', 'Grossly lipaemic sample', 'Sample', 'Recollect'],
    ['DUP', 'Duplicate order', 'Order', 'Cancel order'], ['NOIND', 'Not clinically indicated (lab review)', 'Order', 'Cancel order'],
    ['NOINFO', 'Insufficient clinical information', 'Order', 'Return to doctor'], ['REFUSE', 'Patient refused the test', 'Both', 'Cancel order'],
  ].map(([code, name, appliesTo, action], i) => ({ id: 'lj_' + pad(i + 1), code, name, appliesTo, action, status: 'Active' }));

  const labOutsourceLabs = [
    ['PHL-MOH', 'Public Health Laboratory (MOH)', 'Sulaibikhat, Kuwait', 'TB culture, notifiable disease confirmation', 5, '+965 2481 0000', 'MOH reference laboratory'],
    ['MEDLAB', 'Medlab Kuwait', 'Salmiya, Kuwait', 'Allergy panels, special chemistry', 3, '+965 2575 4400', 'CAP accredited'],
    ['ALBORG', 'Al Borg Diagnostics', 'Hawalli, Kuwait', 'Genetics, hormone panels', 4, '+965 2266 8800', 'ISO 15189'],
    ['MAYO', 'Mayo Clinic Laboratories', 'Rochester, USA', 'Rare metabolic and molecular tests', 14, 'intl@mcl.example', 'CAP, CLIA'],
    ['UNILABS', 'Unilabs Dubai', 'Dubai, UAE', 'Histopathology second opinion, cytogenetics', 7, '+971 4 000 1234', 'CAP accredited'],
    ['KCCC', 'Kuwait Cancer Control Centre Laboratory', 'Shuwaikh, Kuwait', 'Tumour markers, flow cytometry', 6, '+965 2484 9800', 'MOH'],
  ].map(([code, name, location, tests, tatDays, contact, accreditation], i) => ({ id: 'lx_' + pad(i + 1), code, name, location, tests, tatDays, contact, accreditation, status: i === 4 ? 'Inactive' : 'Active' }));

  /* ---------- Workflow fields on the seeded lab orders ---------- */
  const labOrders = S.orders.filter(o => o.type === 'lab');
  const snap = {}; labOrders.forEach(o => { snap[o.id] = JSON.parse(JSON.stringify(o)); });
  const find = (pt, code) => labOrders.find(o => o.patientId === pt && o.code === code);
  const techs = ['Bilal Qureshi', 'Hassan Bukhari', 'Mariam Al-Hajri', 'Joseph Thomas'];
  const phleb = ['Rose Mathew', 'Nadia Al-Saleh', 'Joseph Thomas'];
  const racks = { Chemistry: 'CH', Haematology: 'HE', Coagulation: 'CO', Immunology: 'IM', Microbiology: 'MI', 'Clinical Pathology': 'CP' };
  const order = ['Ordered', 'Collected', 'Received', 'In progress', 'Resulted', 'Verified'];
  labOrders.forEach((o, i) => {
    const t = S.labTests.find(x => x.code === o.code) || {};
    const k = order.indexOf(o.status);
    if (k >= 1 || (k === 0 && i % 5 !== 0)) { o.acceptedAt = plusMin(o.orderedAt, 4); o.acceptedBy = 'Mariam Al-Hajri'; }
    if (k >= 1) { o.collectedAt = plusMin(o.orderedAt, 15 + (i % 4) * 5); o.collectedBy = phleb[i % 3]; o.collectSite = i % 2 ? 'Left antecubital' : 'Right antecubital'; }
    if (k >= 2) { o.receivedAt = plusMin(o.collectedAt, 18 + (i % 3) * 6); o.receivedBy = techs[(i + 1) % 4]; o.rack = `${racks[t.section] || 'GN'}-${pad(1 + (i % 6))} / ${'ABCDE'[i % 5]}${1 + (i % 8)}`; }
    if (k >= 4) { o.resultedBy = techs[(i + 1) % 2]; if (!o.resultedAt) o.resultedAt = plusMin(o.receivedAt, 50); if (o.resultedAt < o.receivedAt) o.resultedAt = plusMin(o.receivedAt, 40); }
    if (k === 5) { o.techVerifiedBy = o.resultedBy === 'Bilal Qureshi' ? 'Mariam Al-Hajri' : 'Bilal Qureshi'; o.techVerifiedAt = plusMin(o.resultedAt, 12); o.verifiedBy = 'Dr. Lina Haddad'; o.verifiedAt = plusMin(o.resultedAt, 30); o.signature = 'Dr. Lina Haddad, Consultant Pathologist'; }
  });
  // Two resulted orders already checked by a technologist, waiting for the pathologist
  labOrders.filter(o => o.status === 'Resulted').slice(0, 2).forEach(o => { o.techVerifiedBy = o.resultedBy === 'Bilal Qureshi' ? 'Mariam Al-Hajri' : 'Bilal Qureshi'; o.techVerifiedAt = plusMin(o.resultedAt, 10); });

  // Critical results for the alert console
  const mk = (code, values) => (S.labParams[code] || []).map(([name, unit, lo, hi]) => {
    const v = values[name] != null ? values[name] : +(lo + (hi - lo) * 0.5).toFixed(hi > 50 ? 0 : 1);
    const c = crit[name] || [null, null];
    return { name, value: v, unit, low: lo, high: hi, flag: v > hi ? 'H' : v < lo ? 'L' : '', critical: (c[0] != null && v < c[0]) || (c[1] != null && v > c[1]) };
  });
  const trop = find('pt_001', 'TROP');
  if (trop) Object.assign(trop, { status: 'Verified', collectedAt: T + ' 07:12', receivedAt: T + ' 07:24', resultedAt: T + ' 08:05', resultedBy: 'Hassan Bukhari', techVerifiedBy: 'Bilal Qureshi', techVerifiedAt: T + ' 08:09', verifiedBy: 'Dr. Lina Haddad', verifiedAt: T + ' 08:20', signature: 'Dr. Lina Haddad, Consultant Pathologist', priority: 'STAT', results: mk('TROP', { 'Troponin I': 412 }), comments: 'Markedly raised troponin. Suggest serial measurement at 3 hours and clinical correlation.' });
  const plt = labOrders.find(o => o.patientId === 'pt_013' && o.code === 'CBC');
  if (plt) Object.assign(plt, { resultedAt: plusMin(plt.receivedAt, 35), results: mk('CBC', { WBC: 3.1, Haemoglobin: 9.8, Platelets: 18, Neutrophils: 38 }), comments: 'Platelet clumping excluded on smear review.' });
  const kk = find('pt_023', 'K');
  if (kk) Object.assign(kk, { resultedAt: plusMin(kk.receivedAt, 30), techVerifiedAt: plusMin(kk.receivedAt, 38), verifiedAt: plusMin(kk.receivedAt, 46), results: mk('K', { Potassium: 6.6 }), comments: 'Sample not haemolysed. Repeat on a fresh sample recommended.' });
  const tr2 = find('pt_047', 'TROP');
  if (tr2) Object.assign(tr2, { resultedAt: plusMin(tr2.receivedAt, 40), results: mk('TROP', { 'Troponin I': 64 }) });
  // Microbiology results (organism, colony count and sensitivity)
  const ucs = find('pt_022', 'UCS');
  if (ucs) Object.assign(ucs, { results: [{ name: 'Organism', value: 'Escherichia coli', unit: '', low: '', high: '', flag: 'A', critical: false }, { name: 'Colony count', value: '>100,000 CFU/mL', unit: '', low: '', high: '', flag: 'A', critical: false }],
    sensitivity: [['AMP', 'R'], ['AMC', 'S'], ['CXM', 'S'], ['CIP', 'R'], ['NIT', 'S'], ['SXT', 'R'], ['GEN', 'S']].map(([code, r]) => ({ code, result: r })), comments: 'Significant growth. Ampicillin and ciprofloxacin resistant.' });
  labOrders.filter(o => o.code === 'BCS' && o.status === 'Verified').forEach(o => { o.results = [{ name: 'Culture', value: 'No growth after 5 days', unit: '', low: '', high: '', flag: '', critical: false }]; });
  labOrders.filter(o => o.code === 'UA' && o.results).forEach(o => { o.results.forEach(r => { if (r.name === 'Protein') { r.value = 'Negative'; r.low = ''; r.high = ''; r.flag = ''; } }); });

  // One duplicate order rejected and one cancelled by the lab
  const dup = find('pt_041', 'K');
  if (dup && dup.status === 'Ordered') Object.assign(dup, { status: 'Rejected', rejectReason: 'Duplicate order: potassium already included in the BMP of the same visit', rejectCode: 'DUP', rejectedBy: 'Mariam Al-Hajri', rejectedAt: T + ' 14:10' });
  const can = labOrders.find(o => o.patientId === 'pt_029' && o.code === 'VITD');
  if (can && can.status === 'Ordered') Object.assign(can, { status: 'Cancelled', cancelReason: 'Patient refused the test (counselled by the doctor)', cancelCode: 'REFUSE', cancelledBy: 'Mariam Al-Hajri', cancelledAt: T + ' 19:05' });

  /* ---------- Previous results (cumulative history for delta checks) ---------- */
  const labHistory = [];
  labOrders.forEach((o, i) => {
    const params = S.labParams[o.code]; if (!params || i % 4 === 3) return;
    const at = `${addDays(T, -(20 + (i * 13) % 160))} ${pad(8 + i % 9)}:${pad((i * 7) % 60)}`;
    const values = {};
    params.forEach(([name, , lo, hi]) => { if (lo === hi) return; values[name] = +(lo + (hi - lo) * (0.25 + rnd() * 0.5)).toFixed(hi > 50 ? 0 : 1); });
    if (o.code === 'K' && o.patientId === 'pt_023') values.Potassium = 4.6;
    if (o.code === 'CBC' && o.patientId === 'pt_013') { values.Platelets = 210; values.Haemoglobin = 12.6; }
    if (o.code === 'TROP' && o.patientId === 'pt_001') values['Troponin I'] = 9;
    labHistory.push({ id: 'lh_' + pad(labHistory.length + 1, 3), patientId: o.patientId, code: o.code, at, accession: 'L' + (60000 + i * 37), values });
  });

  /* ---------- Sample rejections, critical call log and dispatch log ---------- */
  const recol = labOrders.find(o => o.status === 'Ordered' && o.acceptedAt && o.code === 'BMP');
  const labSampleRejects = [];
  if (recol) { recol.sampleRejected = { code: 'HAEM', reason: 'Haemolysed sample', at: plusMin(recol.orderedAt, 45), by: 'Bilal Qureshi', note: 'Gross haemolysis, potassium unreliable. Ward informed for recollection.' }; labSampleRejects.push(Object.assign({ id: 'lsr_01', orderId: recol.id }, recol.sampleRejected)); }
  [['CLOT', 'Clotted sample', -1, 'pt_031', 'CBC'], ['MISLBL', 'Mislabelled or unlabelled sample', -2, 'pt_012', 'LFT'], ['QNS', 'Insufficient quantity (QNS)', -3, 'pt_027', 'PT'], ['STAB', 'Stability exceeded (delayed in transit)', -6, 'pt_018', 'GLU']]
    .forEach(([code, reason, d, pt, test], i) => labSampleRejects.push({ id: 'lsr_' + pad(i + 2), orderId: null, patientId: pt, test, code, reason, at: `${addDays(T, d)} ${pad(9 + i * 2)}:${pad(10 + i * 9)}`, by: techs[i % 4], note: '' }));

  const labCalls = [];
  if (trop) labCalls.push({ id: 'lc_01', orderId: trop.id, param: 'Troponin I', value: '412 ng/L', at: T + ' 08:24', by: 'Bilal Qureshi', to: 'Dr. Khalid Al-Rashidi', role: 'Treating doctor', phone: 'Ext. 4412', outcome: 'Reached', readBack: true, notes: 'Doctor repeated the value back. Patient moved to CCU monitoring.', kind: 'Call' });
  if (kk) {
    labCalls.push({ id: 'lc_02', orderId: kk.id, param: 'Potassium', value: '6.6 mmol/L', at: plusMin(kk.verifiedAt, 4), by: 'Mariam Al-Hajri', to: 'Ward 3 charge nurse', role: 'Charge nurse', phone: 'Ext. 3300', outcome: 'No answer', readBack: false, notes: 'Line busy, will retry.', kind: 'Call' });
    labCalls.push({ id: 'lc_03', orderId: kk.id, param: 'Potassium', value: '6.6 mmol/L', at: plusMin(kk.verifiedAt, 12), by: 'Mariam Al-Hajri', to: (S.doctors.find(d => d.id === kk.by) || {}).name || 'Treating doctor', role: 'Treating doctor', phone: 'Mobile', outcome: 'No answer', readBack: false, notes: 'Voicemail. No message left (policy).', kind: 'Call' });
  }
  [[-1, 'Glucose', '1.9 mmol/L', 'Dr. Aisha Al-Mansour', 'Treating doctor'], [-2, 'Haemoglobin', '6.1 g/dL', 'Dr. Hanan Al-Sabah', 'Treating doctor'], [-3, 'INR', '6.2', 'Dr. Khalid Al-Rashidi', 'Treating doctor'], [-5, 'Sodium', '118 mmol/L', 'Huda Al-Azmi', 'Charge nurse']]
    .forEach(([d, param, value, to, role], i) => labCalls.push({ id: 'lc_' + pad(i + 4), orderId: null, patientId: ['pt_015', 'pt_024', 'pt_001', 'pt_033'][i], test: { Glucose: 'GLU', Haemoglobin: 'CBC', INR: 'PT', Sodium: 'BMP' }[param], param, value, at: `${addDays(T, d)} ${pad(10 + i)}:${pad(5 + i * 11)}`, by: techs[i % 4], to, role, phone: 'Ext. ' + (4100 + i * 37), outcome: 'Reached', readBack: true, notes: '', kind: 'Call', minsToNotify: [8, 14, 22, 11][i] }));

  const labDispatch = [];
  labOrders.filter(o => o.status === 'Verified').forEach((o, i) => {
    const p = S.patients.find(x => x.id === o.patientId) || {};
    if (i % 3 === 2) return;
    labDispatch.push({ id: 'ld_' + pad(labDispatch.length + 1, 3), orderId: o.id, channel: 'Patient app', to: p.mobile || p.mrn, at: plusMin(o.verifiedAt, 2), by: 'System (auto-release)', status: 'Delivered', note: '' });
    if (i % 3 === 0) labDispatch.push({ id: 'ld_' + pad(labDispatch.length + 1, 3), orderId: o.id, channel: p.email ? 'Email' : 'SMS', to: p.email || p.mobile, at: plusMin(o.verifiedAt, 6), by: 'Mariam Al-Hajri', status: i === 3 ? 'Failed' : 'Sent', note: i === 3 ? 'Mailbox unavailable (bounce 550)' : '' });
  });

  /* The stored database may be created by a page without this file, so the order changes are also kept as a patch
   * that lab.js applies once (labOrderPatch). */
  const labOrderPatch = {};
  labOrders.forEach(o => { const b = snap[o.id], d = {}; Object.keys(o).forEach(k => { if (JSON.stringify(o[k]) !== JSON.stringify(b[k])) d[k] = o[k]; }); if (Object.keys(d).length) labOrderPatch[o.id] = d; });
  Object.assign(S, { labOrderPatch, labPanels, labRanges, labOrganisms, labAntibiotics, labRejectReasons, labOutsourceLabs, labHistory, labSampleRejects, labCalls, labDispatch });
})();
