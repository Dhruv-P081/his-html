/* Pharmacy module seed (SOW V4 Module 7). Loaded after data-core.js on pharmacy pages.
 * Keys (all prefixed "pharmacy"):
 *   pharmacyExtraItems, pharmacyExtraStock   generic-equivalent products, merged into db.items / db.stock by assets/pharmacy.js
 *   pharmacyDispenses                         dispensing records (OPD prescriptions and IPD supplies) with batch picks
 *   pharmacySales                             counter sales (walk-in, OTC)
 *   pharmacyReturns                           returns and refunds (maker-checker)
 *   pharmacyCdRegister                        controlled drug register movements (balance is computed)
 *   pharmacyQuarantine                        expired batches moved out of usable stock
 *   pharmacyInterventions                     pharmacist interventions (holds, overrides, substitutions)
 *   pharmacyGenericBrand, pharmacyCategories, pharmacySchedules, pharmacyForms, pharmacyRoutes,
 *   pharmacyFrequencies, pharmacyManufacturers, pharmacySubstitutions   masters
 * Shared keys read: items, stock, orders (type 'med'), patients, encounters, invoices. Pharmacy deducts stock by batch.
 */
(function () {
  const S = window.SEED;
  const T = S.TODAY;
  const pad = (n, w) => String(n).padStart(w || 2, '0');
  const addDays = (d, n) => { const x = new Date(d + 'T00:00:00'); x.setDate(x.getDate() + n); return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}`; };
  const addMin = (s, m) => { const d = new Date(s.replace(' ', 'T')); d.setMinutes(d.getMinutes() + m); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`; };
  let seed = 7072026;
  const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
  const int = (a, b) => a + Math.floor(rnd() * (b - a + 1));

  /* ---------- Generic-equivalent products (merged into shared items and stock) ---------- */
  const extra = [
    ['it_201', 'DRG-101', 'Amlodipine', 'Amlor', 'Tablet', '5 mg', 'Oral', 'Cardiovascular', 0.07, 'Julphar', 'it_001'],
    ['it_202', 'DRG-102', 'Atorvastatin', 'Atorva', 'Tablet', '20 mg', 'Oral', 'Lipid lowering', 0.14, 'SPIMACO', 'it_003'],
    ['it_203', 'DRG-103', 'Amoxicillin', 'Julmox', 'Capsule', '500 mg', 'Oral', 'Antibiotic', 0.06, 'Julphar', 'it_004'],
    ['it_204', 'DRG-104', 'Omeprazole', 'Gastrazole', 'Capsule', '20 mg', 'Oral', 'Gastrointestinal', 0.08, 'Hikma', 'it_009'],
    ['it_205', 'DRG-105', 'Paracetamol', 'Adol', 'Tablet', '500 mg', 'Oral', 'Analgesic', 0.015, 'Julphar', 'it_007'],
    ['it_206', 'DRG-106', 'Metformin', 'Glucare', 'Tablet', '500 mg', 'Oral', 'Antidiabetic', 0.04, 'KSPICO', 'it_002'],
    ['it_207', 'DRG-107', 'Salbutamol', 'Butalin', 'Inhaler', '100 mcg', 'Inhaled', 'Respiratory', 1.40, 'Julphar', 'it_010'],
    ['it_208', 'DRG-108', 'Ceftriaxone', 'Triaxone', 'Injection', '1 g', 'Intravenous', 'Antibiotic', 1.20, 'Hikma', 'it_013'],
    ['it_209', 'DRG-109', 'Cetirizine', 'Cetrine', 'Tablet', '10 mg', 'Oral', 'Antihistamine', 0.05, 'KSPICO', 'it_021'],
  ];
  const pharmacyExtraItems = extra.map(([id, code, generic, brand, form, strength, route, category, cost, mfr]) => ({
    id, code, type: 'Drug', name: `${generic} ${strength} ${form.toLowerCase()}`, generic, brand, form, strength, route, category, schedule: '',
    uom: form === 'Inhaler' ? 'Each' : form === 'Injection' ? 'Vial' : 'Tablet', cost, price: Math.round(cost * 1.45 * 1000) / 1000,
    min: int(60, 200), max: int(600, 1500), reorder: 0, manufacturer: mfr, status: 'Active' }));
  const pharmacyExtraStock = [];
  pharmacyExtraItems.forEach((it, i) => ['wh_01', 'wh_02', 'wh_03'].forEach((wh) => {
    const n = wh === 'wh_03' ? 2 : 1;
    for (let b = 0; b < n; b++) pharmacyExtraStock.push({ id: 'sk_p' + pad(pharmacyExtraStock.length + 1, 3), itemId: it.id, warehouseId: wh,
      batch: `G${int(2501, 2612)}-${int(10, 99)}`, expiry: addDays(T, i === 4 && b === 0 && wh === 'wh_03' ? 61 : int(120, 700)), qty: wh === 'wh_01' ? int(400, 1600) : int(60, 320), cost: it.cost });
  }));

  const allItems = S.items.concat(pharmacyExtraItems);
  const allStock = S.stock.concat(pharmacyExtraStock);
  const itemOf = (id) => allItems.find(x => x.id === id) || {};
  const firstBatch = (itemId, wh) => allStock.filter(s => s.itemId === itemId && s.warehouseId === wh && s.expiry > T && s.qty > 0).sort((a, b) => a.expiry.localeCompare(b.expiry))[0];

  /* ---------- Dispensing records ---------- */
  const pharmacyDispenses = [];
  const addDisp = (o) => { pharmacyDispenses.push(Object.assign({ id: 'pd_' + pad(pharmacyDispenses.length + 1, 3), no: 'DSP-26-' + (10400 + pharmacyDispenses.length), status: 'Dispensed', witness: '', invoiceId: '' }, o)); };
  const lineOf = (o, qty, wh) => { const it = itemOf(o.itemId), b = firstBatch(o.itemId, wh) || {}; return { orderId: o.id, itemId: o.itemId, prescribedItemId: o.itemId, qty, price: it.price, batches: [{ stockId: b.id, batch: b.batch, expiry: b.expiry, qty }], substituted: false, reason: '' }; };
  const opdMed = S.orders.filter(o => o.type === 'med' && o.setting === 'OPD');
  const rxNos = Array.from(new Set(opdMed.map(o => o.rxNo)));
  rxNos.forEach((rx) => {
    const os = opdMed.filter(o => o.rxNo === rx);
    if (os[0].status !== 'Dispensed') return;
    const lines = os.map(o => lineOf(o, itemOf(o.itemId).uom === 'Tablet' ? o.qty : 1, 'wh_03'));
    addDisp({ setting: 'OPD', rxNo: rx, patientId: os[0].patientId, encounterId: os[0].encounterId, at: addMin(os[0].orderedAt, int(12, 38)), by: 'Ahmed Farouk', verifiedBy: 'Ahmed Farouk', lines, total: +lines.reduce((s, l) => s + l.qty * l.price, 0).toFixed(3) });
  });
  // Earlier supplies, so the duplicate therapy check has something to find
  rxNos.filter(rx => opdMed.find(o => o.rxNo === rx).status === 'Pending verification').slice(0, 2).forEach((rx, i) => {
    const o = opdMed.find(x => x.rxNo === rx);
    const l = lineOf(o, itemOf(o.itemId).uom === 'Tablet' ? o.qty : 1, 'wh_03');
    addDisp({ setting: 'OPD', rxNo: 'RX-26-' + (29870 + i), patientId: o.patientId, encounterId: '', at: `${addDays(T, -12 - i * 3)} 11:${pad(10 + i * 7)}`, by: 'Ahmed Farouk', verifiedBy: 'Ahmed Farouk', lines: [Object.assign(l, { orderId: '' })], total: +(l.qty * l.price).toFixed(3), days: o.days });
  });
  // IPD supplies made this morning for part of the active orders
  S.orders.filter(o => o.type === 'med' && o.setting === 'IPD' && o.status === 'Active').forEach((o, i) => {
    if (i % 2) return;
    const l = lineOf(o, 1, 'wh_02');
    addDisp({ setting: 'IPD', rxNo: '', orderIds: [o.id], patientId: o.patientId, encounterId: o.encounterId, at: `${T} 07:${pad(10 + (i % 40))}`, by: i % 4 ? 'Ahmed Farouk' : 'Night pharmacist (Rania Haddad)', verifiedBy: 'Ahmed Farouk', lines: [l], total: +l.price.toFixed(3) });
  });

  /* ---------- Counter sales (walk-in) ---------- */
  const otc = ['it_007', 'it_008', 'it_009', 'it_021', 'it_023', 'it_024', 'it_205', 'it_209'];
  const custs = ['', 'Walk-in customer', 'Ahmad Al-Kandari', '', 'Sunita Rao', '', 'Mishari Al-Azmi', 'Grace Joseph', '', 'Dana Al-Hajri'];
  const modes = ['Cash', 'KNET', 'Card', 'KNET', 'Cash', 'KNET'];
  const pharmacySales = [];
  for (let i = 0; i < 16; i++) {
    const d = i < 6 ? T : addDays(T, -Math.ceil((i - 5) / 2));
    const lines = [];
    const k = 1 + (i % 3);
    for (let j = 0; j < k; j++) {
      const itemId = otc[(i * 3 + j * 5) % otc.length]; if (lines.some(l => l.itemId === itemId)) continue;
      const it = itemOf(itemId), b = firstBatch(itemId, 'wh_03') || {}; const qty = it.uom === 'Tablet' ? [10, 20, 24, 30][j % 4] : 1;
      lines.push({ itemId, stockId: b.id, batch: b.batch, expiry: b.expiry, qty, price: it.price });
    }
    const total = +lines.reduce((s, l) => s + l.qty * l.price, 0).toFixed(3);
    const mode = modes[i % modes.length];
    pharmacySales.push({ id: 'ps_' + pad(i + 1, 3), no: 'CS-26-' + (5200 + i), at: `${d} ${pad(9 + (i % 9))}:${pad((i * 17) % 60)}`, customer: custs[i % custs.length], mobile: i % 3 === 0 ? '+965 6' + int(100, 999) + ' ' + int(1000, 9999) : '', lines, total, payMode: mode, payRef: mode === 'Cash' ? '' : (mode === 'KNET' ? 'KN' : 'CC') + int(100000, 999999), tendered: mode === 'Cash' ? Math.ceil(total) : total, by: i % 3 ? 'Ahmed Farouk' : 'Rania Haddad', status: i === 9 ? 'Voided' : 'Completed', voidReason: i === 9 ? 'Duplicate sale entered in error' : '' });
  }

  /* ---------- Returns and refunds ---------- */
  const sl = (i) => pharmacySales[i];
  const dp = pharmacyDispenses[0];
  const retLine = (l, qty, cond) => ({ itemId: l.itemId, stockId: l.stockId || (l.batches && l.batches[0].stockId), batch: l.batch || (l.batches && l.batches[0].batch), expiry: l.expiry || (l.batches && l.batches[0].expiry), qty, price: l.price, condition: cond, toStock: cond === 'Unopened' });
  const pharmacyReturns = [
    { id: 'pr_001', no: 'RET-26-801', source: 'Counter sale', refId: sl(7).id, refNo: sl(7).no, patientId: '', customer: sl(7).customer || 'Walk-in customer', lines: [retLine(sl(7).lines[0], Math.min(10, sl(7).lines[0].qty), 'Unopened')], reason: 'Customer bought the wrong strength', refundMode: sl(7).payMode, status: 'Approved', requestedBy: 'Rania Haddad', requestedAt: `${addDays(T, -1)} 12:40`, approvedBy: 'Ahmed Farouk', approvedAt: `${addDays(T, -1)} 13:05` },
    { id: 'pr_002', no: 'RET-26-802', source: 'Counter sale', refId: sl(2).id, refNo: sl(2).no, patientId: '', customer: sl(2).customer || 'Walk-in customer', lines: [retLine(sl(2).lines[0], 1 + Math.min(9, sl(2).lines[0].qty - 1), 'Unopened')], reason: 'Duplicate purchase, item not needed', refundMode: sl(2).payMode, status: 'Pending approval', requestedBy: 'Ahmed Farouk', requestedAt: `${T} 11:20` },
    dp ? { id: 'pr_003', no: 'RET-26-803', source: 'Dispense', refId: dp.id, refNo: dp.no, patientId: dp.patientId, customer: '', lines: [retLine(dp.lines[0], Math.min(10, dp.lines[0].qty), 'Opened')], reason: 'Doctor stopped the medicine after review', refundMode: 'Credit to invoice', status: 'Pending approval', requestedBy: 'Rania Haddad', requestedAt: `${T} 10:05` } : null,
    { id: 'pr_004', no: 'RET-26-799', source: 'Counter sale', refId: sl(11).id, refNo: sl(11).no, patientId: '', customer: sl(11).customer || 'Walk-in customer', lines: [retLine(sl(11).lines[0], 1, 'Damaged')], reason: 'Pack seal broken by customer', refundMode: sl(11).payMode, status: 'Rejected', requestedBy: 'Rania Haddad', requestedAt: `${addDays(T, -3)} 16:10`, approvedBy: 'Ahmed Farouk', approvedAt: `${addDays(T, -3)} 16:30`, decisionReason: 'Opened and damaged packs cannot be refunded under pharmacy policy' },
  ].filter(Boolean);

  /* ---------- Controlled drug register ---------- */
  const pharmacyCdRegister = [];
  const witnesses = ['Maria Santos', 'Huda Al-Azmi', 'Grace Fernandes', 'Rania Haddad'];
  const ipdPts = S.encounters.filter(e => e.type === 'IPD');
  S.items.filter(it => it.schedule).forEach((it, ii) => ['wh_02', 'wh_03'].forEach((wh, wi) => {
    const bal = allStock.filter(s => s.itemId === it.id && s.warehouseId === wh).reduce((n, s) => n + s.qty, 0);
    const moves = [];
    const receipt = 50 + ii * 10;
    moves.push(['Receipt', receipt, -9, 'Transfer from Main Store', '']);
    for (let k = 0; k < 6; k++) { const e = ipdPts[(ii * 5 + k * 3 + wi) % ipdPts.length]; moves.push(['Issue', wh === 'wh_02' ? int(1, 4) : int(5, 15), -8 + k, wh === 'wh_02' ? `Ward supply, ${e.no}` : `OPD prescription RX-26-${30100 + k + ii * 10}`, e.patientId]); }
    if (ii === 1) moves.push(['Wastage', 1, -2, 'Ampoule broken during preparation', '']);
    const issued = moves.filter(m => m[0] !== 'Receipt').reduce((n, m) => n + m[1], 0);
    const opening = Math.max(0, bal - receipt + issued);
    pharmacyCdRegister.push({ id: 'cd_' + pad(pharmacyCdRegister.length + 1, 3), itemId: it.id, warehouseId: wh, at: `${addDays(T, -10)} 08:00`, type: 'Opening balance', qty: opening, ref: 'Register carried forward', patientId: '', by: 'Ahmed Farouk', witness: 'Rania Haddad', verifiedBy: 'Rania Haddad', verifiedAt: `${addDays(T, -10)} 08:10` });
    moves.forEach((m, k) => {
      const d = addDays(T, m[2]);
      const recent = m[2] >= -3;
      pharmacyCdRegister.push({ id: 'cd_' + pad(pharmacyCdRegister.length + 1, 3), itemId: it.id, warehouseId: wh, at: `${d} ${pad(9 + (k % 8))}:${pad((k * 13 + ii * 7) % 60)}`, type: m[0], qty: m[1], ref: m[3], patientId: m[4], by: k % 2 ? 'Rania Haddad' : 'Ahmed Farouk', witness: witnesses.filter(w => w !== (k % 2 ? 'Rania Haddad' : 'Ahmed Farouk'))[(k + ii) % 3], verifiedBy: recent && k % 2 === 0 ? '' : (k % 2 ? 'Ahmed Farouk' : 'Rania Haddad'), verifiedAt: recent && k % 2 === 0 ? '' : `${d} 18:00` });
    });
  }));

  const pharmacyInterventions = [
    { id: 'pi_001', at: `${T} 09:12`, type: 'Allergy override', ref: 'RX-26-30406', patientId: '', detail: 'Cross-sensitivity warning reviewed with prescriber; benefit outweighs risk.', by: 'Ahmed Farouk' },
    { id: 'pi_002', at: `${addDays(T, -1)} 15:30`, type: 'Substitution', ref: 'RX-26-30388', patientId: '', detail: 'Ventolin inhaler replaced by Butalin inhaler (generic equivalent): brand out of stock.', by: 'Rania Haddad' },
    { id: 'pi_003', at: `${addDays(T, -2)} 10:44`, type: 'Hold', ref: 'RX-26-30361', patientId: '', detail: 'Dose of metformin unclear, prescriber contacted.', by: 'Ahmed Farouk' },
  ];

  /* ---------- Masters ---------- */
  const pharmacyGenericBrand = allItems.filter(it => it.type === 'Drug').map((it, i) => ({ id: 'gb_' + pad(i + 1, 3), code: 'GB-' + pad(i + 1, 3), generic: it.generic, brand: it.brand, strength: it.strength, form: it.form, itemCode: it.code, manufacturer: it.manufacturer, preferred: !/^it_2/.test(it.id), status: 'Active' }));
  const cats = [['CAT-CV', 'Cardiovascular', false], ['CAT-DM', 'Antidiabetic', false], ['CAT-LIP', 'Lipid lowering', false], ['CAT-ABX', 'Antibiotic', false], ['CAT-ANL', 'Analgesic', true], ['CAT-NSD', 'NSAID', true],
    ['CAT-GI', 'Gastrointestinal', true], ['CAT-RES', 'Respiratory', false], ['CAT-ACG', 'Anticoagulant', false], ['CAT-FLD', 'Fluids', false], ['CAT-OPI', 'Opioid analgesic', false], ['CAT-ANX', 'Anxiolytic', false],
    ['CAT-THY', 'Thyroid', false], ['CAT-APL', 'Antiplatelet', false], ['CAT-AH', 'Antihistamine', true], ['CAT-AEM', 'Antiemetic', false], ['CAT-DRM', 'Dermatological', true], ['CAT-DIU', 'Diuretic', false]];
  const pharmacyCategories = cats.map(([code, name, otcOk], i) => ({ id: 'pc_' + pad(i + 1), code, name, otc: otcOk, controlled: /Opioid|Anxiolytic/.test(name), status: 'Active' }));
  const pharmacySchedules = [['SCH-II', 'Schedule II', 'High potential for abuse (for example morphine). Double-locked cabinet.', true, 7], ['SCH-III', 'Schedule III', 'Moderate potential for abuse.', true, 14], ['SCH-IV', 'Schedule IV', 'Lower potential for abuse (for example tramadol, diazepam).', true, 30], ['SCH-V', 'Schedule V', 'Low potential for abuse, preparations with limited narcotic content.', false, 30]]
    .map(([code, name, description, witness, maxDays], i) => ({ id: 'sc_' + pad(i + 1), code, name, description, witness, maxDays, status: 'Active' }));
  const pharmacyForms = [['TAB', 'Tablet'], ['CAP', 'Capsule'], ['SYR', 'Syrup'], ['INJ', 'Injection'], ['INF', 'Infusion'], ['INH', 'Inhaler'], ['CRM', 'Cream'], ['PEN', 'Pen'], ['DRP', 'Drops'], ['SUP', 'Suppository']].map(([code, name], i) => ({ id: 'pf_' + pad(i + 1), code, name, status: 'Active' }));
  const pharmacyRoutes = [['PO', 'Oral'], ['IV', 'Intravenous'], ['IM', 'Intramuscular'], ['SC', 'Subcutaneous'], ['INH', 'Inhaled'], ['TOP', 'Topical'], ['PR', 'Rectal'], ['OPH', 'Ophthalmic']].map(([code, name], i) => ({ id: 'pt_r' + pad(i + 1), code, name, status: 'Active' }));
  const pharmacyFrequencies = [['OD', 'Once daily', 1], ['BD', 'Twice daily', 2], ['TDS', 'Three times daily', 3], ['QID', 'Four times daily', 4], ['Q4H', 'Every 4 hours', 6], ['Q6H', 'Every 6 hours', 4], ['Q8H', 'Every 8 hours', 3], ['HS', 'At night', 1], ['PRN', 'As needed', 0], ['STAT', 'Immediately, once', 1]]
    .map(([code, name, perDay], i) => ({ id: 'fq_' + pad(i + 1), code, name, perDay, status: 'Active' }));
  const pharmacyManufacturers = [['MF-PFZ', 'Pfizer', 'United States', 'MOH-IMP-1182'], ['MF-GSK', 'GSK', 'United Kingdom', 'MOH-IMP-1045'], ['MF-NOV', 'Novartis', 'Switzerland', 'MOH-IMP-1120'], ['MF-SAN', 'Sanofi', 'France', 'MOH-IMP-1201'], ['MF-JUL', 'Julphar', 'United Arab Emirates', 'MOH-IMP-2210'],
    ['MF-HIK', 'Hikma', 'Jordan', 'MOH-IMP-2034'], ['MF-SPI', 'SPIMACO', 'Saudi Arabia', 'MOH-IMP-2160'], ['MF-AZ', 'AstraZeneca', 'United Kingdom', 'MOH-IMP-1077'], ['MF-KSP', 'KSPICO', 'Kuwait', 'MOH-LOC-0012']]
    .map(([code, name, country, licence], i) => ({ id: 'mf_' + pad(i + 1), code, name, country, licence, status: 'Active' }));
  const pharmacySubstitutions = extra.map((x, i) => ({ id: 'sb_' + pad(i + 1), code: 'SUB-' + pad(i + 1, 3), fromCode: itemOf(x[10]).code, toCode: x[1], type: 'Generic equivalent', twoWay: true, prescriberOk: false, note: 'Same molecule, strength and form.', status: 'Active' }))
    .concat([{ id: 'sb_20', code: 'SUB-020', fromCode: 'DRG-008', toCode: 'DRG-007', type: 'Therapeutic', twoWay: false, prescriberOk: true, note: 'Use when NSAIDs are not suitable. Prescriber approval needed.', status: 'Active' },
      { id: 'sb_21', code: 'SUB-021', fromCode: 'DRG-025', toCode: 'DRG-001', type: 'Therapeutic', twoWay: false, prescriberOk: true, note: 'Antihypertensive class switch, prescriber approval needed.', status: 'Inactive' }]);

  Object.assign(S, { pharmacyExtraItems, pharmacyExtraStock, pharmacyDispenses, pharmacySales, pharmacyReturns, pharmacyCdRegister, pharmacyQuarantine: [], pharmacyInterventions,
    pharmacyGenericBrand, pharmacyCategories, pharmacySchedules, pharmacyForms, pharmacyRoutes, pharmacyFrequencies, pharmacyManufacturers, pharmacySubstitutions });
})();
