/* Reception and ADT (SOW V4 Module 1) seed data. Loaded after data-core.js.
 * Module keys (prefix reception*):
 *   receptionIdTypes, receptionNationalities, receptionRelations     Patient Master settings
 *   receptionRooms, receptionBedTypes                                Bed, room and ward master (wards and beds are shared keys)
 *   receptionTriage                                                  Triage Master (ESI 1-5, colour codes, targets)
 *   receptionDocTypes, receptionPayModes, receptionTax               Document Types, Payment Mode, Tax and VAT masters
 *   receptionCoverage   { id, patientId, rank: 'Primary'|'Secondary', payerId, planId, policyNo, memberNo, from, to, verified, verifiedBy, verifiedAt, status }
 *   receptionDocs       { id, patientId, typeId, name, ref, expiry, at, by }
 *   receptionLinks      { id, patientId, relatedId, relationId, role: 'Family'|'Guarantor'|'Dependant'|'Corporate', note }
 *   receptionMerges     { id, no, survivorId, mergedId, snapshot, choices, status, requestedBy, requestedAt, decidedBy, decidedAt, reason }
 *   receptionAdmRequests{ id, no, patientId, type, admittingId, attendingId, wardPref, bedType, diagnosis, reason, plannedDate, los, packageCode,
 *                         status: 'Requested'|'Pending clearance'|'Cleared'|'Admitted'|'Cancelled', clearance: { payer, estimate, deposit, preAuth, by, at }, bedId, encounterId, by, at, source }
 *   receptionTransfers  { id, encounterId, kind: 'Bed'|'Care team', from, to, reason, at, by }
 *   receptionLeaves     { id, encounterId, departAt, expectedReturn, returnedAt, reason, status: 'On leave'|'Returned', by }
 *   receptionShifts     { id, no, userId, user, counter, openedAt, float, status: 'Open'|'Closed', closedAt, counted, expected, variance, varianceReason, denoms }
 *   receptionPayments   { id, no, shiftId, invoiceId, patientId, amount, mode, ref, at, by }
 *   receptionRefunds    { id, no, invoiceId, paymentId, patientId, amount, mode, reason, status, requestedBy, requestedAt, decidedBy, decidedAt, shiftId }
 */
(function () {
  const S = window.SEED;
  const T = S.TODAY;
  const pad = (n, w) => String(n).padStart(w || 2, '0');
  const addDays = (d, n) => { const x = new Date(d + 'T00:00:00'); x.setDate(x.getDate() + n); return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}`; };
  const Y = addDays(T, -1);

  /* ---------- Patient Master settings ---------- */
  const receptionIdTypes = [
    ['CIVIL', 'Kuwait Civil ID', '12 digits', 'Kuwaiti citizens and residents'],
    ['PASS', 'Passport', '6 to 12 letters and digits', 'Visitors and residents without Civil ID'],
    ['GCC', 'GCC national ID', '10 to 12 digits', 'GCC nationals'],
    ['BIRTH', 'Birth notification', 'MOH notification number', 'Newborns before Civil ID'],
    ['DIPL', 'Diplomatic ID', 'Issued by MOFA', 'Diplomatic staff'],
    ['ALIAS', 'Temporary ER alias', 'System generated', 'Unidentified emergency patients'],
  ].map(([code, name, format, usedFor], i) => ({ id: 'idt_' + pad(i + 1), code, name, format, usedFor, status: 'Active' }));
  const receptionNationalities = [
    ['KWT', 'Kuwaiti', true], ['SAU', 'Saudi', true], ['BHR', 'Bahraini', true], ['EGY', 'Egyptian', false], ['IND', 'Indian', false], ['PHL', 'Filipino', false],
    ['SYR', 'Syrian', false], ['JOR', 'Jordanian', false], ['PAK', 'Pakistani', false], ['LBN', 'Lebanese', false], ['GBR', 'British', false], ['BGD', 'Bangladeshi', false],
  ].map(([code, name, gcc], i) => ({ id: 'nat_' + pad(i + 1), code, name, gcc, status: 'Active' }));
  const receptionRelations = [
    ['SPO', 'Spouse', 'Family', 'Spouse'], ['FAT', 'Father', 'Guarantor', 'Son or daughter'], ['MOT', 'Mother', 'Guarantor', 'Son or daughter'], ['SON', 'Son', 'Dependant', 'Father or mother'],
    ['DAU', 'Daughter', 'Dependant', 'Father or mother'], ['BRO', 'Brother', 'Family', 'Brother or sister'], ['SIS', 'Sister', 'Family', 'Brother or sister'], ['GUA', 'Legal guardian', 'Guarantor', 'Ward'],
    ['EMP', 'Employer (corporate)', 'Corporate', 'Employee'], ['SPN', 'Sponsor (kafeel)', 'Guarantor', 'Sponsored person'],
  ].map(([code, name, role, reciprocal], i) => ({ id: 'rel_' + pad(i + 1), code, name, role, reciprocal, status: 'Active' }));

  /* ---------- Bed, room and ward ---------- */
  const roomMap = {};
  S.beds.forEach(b => { const k = b.wardId + '|' + b.room; (roomMap[k] = roomMap[k] || { wardId: b.wardId, room: b.room, beds: 0, type: b.type, gender: b.gender }).beds++; });
  const amen = { 'Ward bed': 'Shared bathroom, TV, nurse call', 'Paediatric bed': 'Parent recliner, play area access', 'ICU bed': 'Monitor, ventilator point, central gases', 'Private room': 'En-suite, sofa bed, TV, fridge' };
  const receptionRooms = Object.values(roomMap).map((r, i) => ({ id: 'rm_' + pad(i + 1, 3), code: r.room, wardId: r.wardId, roomType: r.beds > 1 ? 'Shared (' + r.beds + ' beds)' : 'Single', beds: r.beds, gender: r.gender, amenities: amen[r.type] || '', status: 'Active' }));
  const receptionBedTypes = [
    ['BT-WARD', 'Ward bed', 'SRV-BED-W', 60, amen['Ward bed']], ['BT-PED', 'Paediatric bed', 'SRV-BED-W', 60, amen['Paediatric bed']], ['BT-ICU', 'ICU bed', 'SRV-BED-I', 350, amen['ICU bed']],
    ['BT-PVT', 'Private room', 'SRV-BED-P', 120, amen['Private room']], ['BT-ISO', 'Isolation room', 'SRV-BED-P', 140, 'Negative pressure, ante-room'], ['BT-DAY', 'Day-care recliner', 'SRV-BED-W', 25, 'Recliner, curtain screen'],
  ].map(([code, name, serviceCode, rate, amenities], i) => ({ id: 'bt_' + pad(i + 1), code, name, serviceCode, rate, nursing: i === 2 ? 80 : 25, amenities, status: 'Active' }));

  /* ---------- Triage (ESI) ---------- */
  const receptionTriage = [
    [1, 'Resuscitation', 'Red', '#C0261B', 0, 'Resuscitation', 'Immediate life-saving intervention'],
    [2, 'Emergent', 'Orange', '#E0670E', 10, 'Resuscitation', 'High risk, confused or severe pain'],
    [3, 'Urgent', 'Yellow', '#D6A100', 30, 'Acute bay', 'Two or more resources expected'],
    [4, 'Less urgent', 'Green', '#1C8A4C', 60, 'Minor treatment', 'One resource expected'],
    [5, 'Non-urgent', 'Blue', '#2F6BC5', 120, 'Fast track', 'No resources expected'],
  ].map(([level, name, colour, hex, targetMins, area, rule]) => ({ id: 'tr_' + level, code: 'ESI-' + level, level, name, colour, hex, targetMins, alertMins: Math.max(5, Math.round(targetMins * 1.5)), area, rule, status: 'Active' }));

  /* ---------- Documents, payment modes, tax ---------- */
  const receptionDocTypes = [
    ['DOC-CID', 'Civil ID copy', 'Identity', true], ['DOC-PAS', 'Passport copy', 'Identity', true], ['DOC-INS', 'Insurance card', 'Insurance', true], ['DOC-REF', 'Referral letter', 'Clinical', false],
    ['DOC-CON', 'Signed consent form', 'Consent', false], ['DOC-LAB', 'External lab report', 'Clinical', false], ['DOC-RAD', 'External imaging report', 'Clinical', false], ['DOC-COR', 'Corporate authorization letter', 'Administrative', true],
    ['DOC-BRT', 'Birth notification', 'Identity', false], ['DOC-POL', 'Police report (RTA)', 'Administrative', false],
  ].map(([code, name, category, expiry], i) => ({ id: 'dt_' + pad(i + 1), code, name, category, expiry, status: 'Active' }));
  const receptionPayModes = [
    ['CASH', 'Cash', 'Cash', false, true, '1010 Cash on hand'], ['KNET', 'KNET debit card', 'Card', true, true, '1020 KNET clearing'], ['CARD', 'Credit card (Visa, Mastercard)', 'Card', true, true, '1021 Card clearing'],
    ['CREDIT', 'Credit (corporate or guarantor)', 'Credit', true, false, '1210 Corporate receivables'], ['LINK', 'KNET payment link', 'Online', true, true, '1022 Online clearing'], ['CHQ', 'Cheque', 'Bank', true, false, '1030 Cheques in hand'],
  ].map(([code, name, type, refRequired, refundable, gl], i) => ({ id: 'pm_' + pad(i + 1), code, name, type, refRequired, refundable, gl, status: i === 5 ? 'Inactive' : 'Active' }));
  const receptionTax = [
    ['VAT-STD', 'VAT standard rate', 0, 'Taxable services and goods', '2026-01-01', 'Kuwait has no VAT in force. Rate kept at 0% until the law applies.'],
    ['VAT-EXM', 'Healthcare services, exempt', 0, 'Consultations, procedures, room charges', '2026-01-01', 'Exempt supply'],
    ['VAT-ZR', 'Medicines, zero rated', 0, 'Pharmacy items on the MOH list', '2026-01-01', 'Zero rated'],
    ['VAT-COS', 'Cosmetic services', 0, 'Elective cosmetic procedures', '2026-01-01', 'Planned standard rate when VAT applies'],
  ].map(([code, name, rate, appliesTo, from, note], i) => ({ id: 'tx_' + pad(i + 1), code, name, rate, appliesTo, from, note, status: 'Active' }));

  /* ---------- Coverage, documents and links ---------- */
  const receptionCoverage = [];
  S.patients.filter(p => p.payerId).forEach((p, i) => receptionCoverage.push({ id: 'cv_' + pad(receptionCoverage.length + 1, 3), patientId: p.id, rank: 'Primary', payerId: p.payerId, planId: p.planId, policyNo: p.policyNo, memberNo: 'M' + (400100 + i * 7), from: addDays(p.policyTo, -365), to: p.policyTo, verified: i % 3 !== 2, verifiedBy: i % 3 !== 2 ? 'Fatima Al-Kandari' : '', verifiedAt: i % 3 !== 2 ? addDays(T, -(i % 40)) + ' 09:' + pad(10 + i % 40) : '', status: 'Active' }));
  receptionCoverage.push({ id: 'cv_sec1', patientId: 'pt_001', rank: 'Secondary', payerId: 'py_05', planId: 'pl_07', policyNo: 'KOC-EMP-22871', memberNo: 'KOC-22871', from: '2026-01-01', to: '2026-12-31', verified: true, verifiedBy: 'Fatima Al-Kandari', verifiedAt: addDays(T, -12) + ' 10:05', status: 'Active' });
  const receptionDocs = [];
  S.patients.slice(0, 24).forEach((p, i) => {
    receptionDocs.push({ id: 'pd_' + pad(receptionDocs.length + 1, 3), patientId: p.id, typeId: p.nationality === 'Kuwaiti' ? 'dt_01' : 'dt_02', name: (p.nationality === 'Kuwaiti' ? 'civil-id-' : 'passport-') + p.mrn.toLowerCase() + '.pdf', ref: p.nationality === 'Kuwaiti' ? p.civilId : 'P' + (5100200 + i * 31), expiry: addDays(T, 200 + i * 23), at: p.registeredAt, by: 'Fatima Al-Kandari' });
    if (p.payerId) receptionDocs.push({ id: 'pd_' + pad(receptionDocs.length + 1, 3), patientId: p.id, typeId: 'dt_03', name: 'insurance-card-' + p.mrn.toLowerCase() + '.jpg', ref: p.policyNo, expiry: p.policyTo, at: p.registeredAt, by: 'Fatima Al-Kandari' });
  });
  receptionDocs.push({ id: 'pd_ref1', patientId: 'pt_001', typeId: 'dt_04', name: 'referral-mubarak-hospital.pdf', ref: 'MAK-REF-5521', expiry: '', at: addDays(T, -3) + ' 11:20', by: 'Ahmed Farouk' });
  const receptionLinks = [
    { id: 'lk_01', patientId: 'pt_004', relatedId: 'pt_007', relationId: 'rel_02', role: 'Guarantor', note: 'Father, pays for paediatric visits' },
    { id: 'lk_02', patientId: 'pt_007', relatedId: 'pt_004', relationId: 'rel_05', role: 'Dependant', note: '' },
    { id: 'lk_03', patientId: 'pt_001', relatedId: 'pt_002', relationId: 'rel_01', role: 'Family', note: 'Emergency contact on file' },
    { id: 'lk_04', patientId: 'pt_002', relatedId: 'pt_001', relationId: 'rel_01', role: 'Family', note: '' },
  ];

  /* ---------- Merges ---------- */
  const receptionMerges = [
    { id: 'mg_001', no: 'MRG-26-0012', survivorId: 'pt_021', mergedId: null, snapshot: { name: 'Abdulla Al Ajmi', mrn: 'MRN-098812', civilId: '', mobile: '+965 9001 2210' }, choices: {}, status: 'Approved', requestedBy: 'Fatima Al-Kandari', requestedAt: '2026-11-10 09:40', decidedBy: 'Omar Haddad', decidedAt: '2026-11-10 12:15', reason: 'Same Civil ID found on the scanned card. Legacy record from 2019.' },
    { id: 'mg_002', no: 'MRG-26-0013', survivorId: 'pt_012', mergedId: null, snapshot: { name: 'Leah Hussain', mrn: 'MRN-100427', civilId: '', mobile: '' }, choices: {}, status: 'Rejected', requestedBy: 'Ahmed Farouk', requestedAt: '2026-11-18 15:02', decidedBy: 'Omar Haddad', decidedAt: '2026-11-18 16:30', reason: 'Different date of birth and Civil ID. Two different patients with the same name.' },
  ];

  /* ---------- Admission requests, transfers, leave ---------- */
  const receptionAdmRequests = [
    { id: 'ar_01', no: 'ADR-26-0441', patientId: 'pt_051', type: 'Elective', admittingId: 'dr_05', attendingId: 'dr_05', wardPref: 'wd_02', bedType: 'Ward bed', diagnosis: 'M17.11', reason: 'Right total knee replacement', plannedDate: T, los: 4, packageCode: '', status: 'Requested', clearance: null, bedId: null, encounterId: null, by: 'Dr. Tariq Mahmoud', at: addDays(T, -6) + ' 12:30', source: 'OPD' },
    { id: 'ar_02', no: 'ADR-26-0442', patientId: 'pt_057', type: 'Elective', admittingId: 'dr_08', attendingId: 'dr_08', wardPref: 'wd_02', bedType: 'Ward bed', diagnosis: 'K35.80', reason: 'Laparoscopic appendectomy', plannedDate: T, los: 2, packageCode: 'PKG-APP', status: 'Pending clearance', clearance: null, bedId: null, encounterId: null, by: 'Dr. Sameh Youssef', at: addDays(T, -1) + ' 16:10', source: 'OPD' },
    { id: 'ar_03', no: 'ADR-26-0443', patientId: 'pt_060', type: 'Elective', admittingId: 'dr_04', attendingId: 'dr_04', wardPref: 'wd_01', bedType: 'Ward bed', diagnosis: 'E11.9', reason: 'Insulin initiation and diabetes education', plannedDate: T, los: 3, packageCode: '', status: 'Cleared', clearance: { payer: 'Cash (self-pay)', estimate: 380, deposit: 150, preAuth: '', by: 'Fatima Al-Kandari', at: T + ' 08:20' }, bedId: 'bd_W3_08', encounterId: null, by: 'Dr. Hanan Al-Sabah', at: addDays(T, -2) + ' 10:00', source: 'OPD' },
    { id: 'ar_04', no: 'ADR-26-0444', patientId: 'pt_unk1', type: 'Emergency', admittingId: 'dr_09', attendingId: 'dr_08', wardPref: 'wd_04', bedType: 'ICU bed', diagnosis: 'R07.9', reason: 'Road traffic accident, abdominal trauma for observation', plannedDate: T, los: 3, packageCode: '', status: 'Cleared', clearance: { payer: 'Emergency waiver (clearance after admission)', estimate: 1050, deposit: 0, preAuth: '', by: 'Ahmed Farouk', at: T + ' 11:40' }, bedId: 'bd_ICU_02', encounterId: null, by: 'Dr. Aisha Al-Mansour', at: T + ' 11:32', source: 'ER' },
    { id: 'ar_05', no: 'ADR-26-0445', patientId: 'pt_013', type: 'Emergency', admittingId: 'dr_09', attendingId: 'dr_04', wardPref: 'wd_01', bedType: 'Ward bed', diagnosis: 'N39.0', reason: 'Pyelonephritis, IV antibiotics', plannedDate: T, los: 3, packageCode: '', status: 'Requested', clearance: null, bedId: null, encounterId: null, by: 'Dr. Aisha Al-Mansour', at: T + ' 09:05', source: 'ER' },
  ];
  const ipd = S.encounters.filter(e => e.type === 'IPD');
  const receptionTransfers = [
    { id: 'tf_01', encounterId: (ipd[3] || {}).id, kind: 'Bed', from: 'ICU-03', to: 'W3-05', reason: 'Step down from ICU, rate controlled', at: addDays(T, -1) + ' 15:20', by: 'Ahmed Farouk' },
    { id: 'tf_02', encounterId: (ipd[2] || {}).id, kind: 'Care team', from: 'Dr. Khalid Al-Rashidi', to: 'Dr. Hanan Al-Sabah', reason: 'Primary problem is endocrine', at: addDays(T, -4) + ' 10:10', by: 'Fatima Al-Kandari' },
  ];
  const receptionLeaves = [
    { id: 'lv_01', encounterId: (ipd[2] || {}).id, departAt: addDays(T, -2) + ' 17:00', expectedReturn: addDays(T, -2) + ' 21:00', returnedAt: addDays(T, -2) + ' 20:40', reason: 'Family event, approved by attending doctor', status: 'Returned', by: 'Fatima Al-Kandari' },
  ];

  /* ---------- Cashier ---------- */
  const receptionShifts = [
    { id: 'sh_01', no: 'SH-26-0318', userId: 'us_08', user: 'Fatima Al-Kandari', counter: 'Main reception, counter 1', openedAt: Y + ' 07:00', float: 100, status: 'Closed', closedAt: Y + ' 15:05', expected: 1412.5, counted: 1412.5, variance: 0, varianceReason: '', totals: { Cash: 1312.5, 'KNET debit card': 2140.75, 'Credit card (Visa, Mastercard)': 615, 'Credit (corporate or guarantor)': 220 }, refunds: 0 },
    { id: 'sh_02', no: 'SH-26-0319', userId: 'us_06', user: 'Ahmed Farouk', counter: 'Main reception, counter 2', openedAt: Y + ' 15:00', float: 100, status: 'Closed', closedAt: Y + ' 23:10', expected: 948.25, counted: 946.25, variance: -2, varianceReason: 'Short by 2 KWD, cash change error at 21:30. Reported to supervisor.', totals: { Cash: 868.25, 'KNET debit card': 1210.5, 'Credit card (Visa, Mastercard)': 340, 'Credit (corporate or guarantor)': 0 }, refunds: 20 },
    { id: 'sh_03', no: 'SH-26-0320', userId: 'us_08', user: 'Fatima Al-Kandari', counter: 'Main reception, counter 1', openedAt: T + ' 07:00', float: 100, status: 'Open', closedAt: '', expected: 0, counted: 0, variance: 0, varianceReason: '', totals: null, refunds: 0 },
  ];
  const modes = ['Cash', 'KNET debit card', 'KNET debit card', 'Credit card (Visa, Mastercard)', 'Cash'];
  const receptionPayments = [];
  S.invoices.filter(iv => iv.date === T && iv.paid > 0).forEach((iv, i) => {
    const e = S.encounters.find(x => x.id === iv.encounterId) || {};
    const mode = modes[i % modes.length];
    receptionPayments.push({ id: 'py_r' + pad(i + 1, 3), no: 'RCP-26-' + (88100 + i), shiftId: 'sh_03', invoiceId: iv.id, patientId: iv.patientId, amount: iv.paid, mode, ref: mode === 'Cash' ? '' : (mode.startsWith('KNET') ? 'KNET ' : 'AUTH ') + (602100 + i * 37), at: (e.start || T + ' 08:00').slice(0, 16), by: 'Fatima Al-Kandari' });
  });
  const firstPaid = receptionPayments.find(p => p.mode === 'Cash') || receptionPayments[0];
  const receptionRefunds = [
    { id: 'rf_01', no: 'RFD-26-0091', invoiceId: firstPaid ? firstPaid.invoiceId : null, paymentId: firstPaid ? firstPaid.id : null, patientId: firstPaid ? firstPaid.patientId : null, amount: 6, mode: 'Cash', reason: 'ECG not performed, patient left before the test', status: 'Pending approval', requestedBy: 'Fatima Al-Kandari', requestedAt: T + ' 10:42', decidedBy: '', decidedAt: '', shiftId: 'sh_03' },
    { id: 'rf_02', no: 'RFD-26-0090', invoiceId: null, paymentId: null, patientId: 'pt_017', amount: 20, mode: 'Cash', reason: 'Duplicate consultation charge', status: 'Approved', requestedBy: 'Ahmed Farouk', requestedAt: Y + ' 19:12', decidedBy: 'Omar Haddad', decidedAt: Y + ' 19:40', shiftId: 'sh_02' },
  ];

  Object.assign(S, { receptionIdTypes, receptionNationalities, receptionRelations, receptionRooms, receptionBedTypes, receptionTriage, receptionDocTypes, receptionPayModes, receptionTax,
    receptionCoverage, receptionDocs, receptionLinks, receptionMerges, receptionAdmRequests, receptionTransfers, receptionLeaves, receptionShifts, receptionPayments, receptionRefunds });
})();
