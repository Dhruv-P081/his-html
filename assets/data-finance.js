/* Finance and Accounts (SOW V4 Module 11) seed data. Dummy data only.
 * Loaded after data-core.js. Every key is prefixed `finance`.
 * Journals are generated so that every voucher balances; the Trial Balance, P&L and Balance Sheet are computed from them.
 *   financeAccounts      chart of accounts (multi-branch), extends the admin `accounts` key
 *   financeCostCenters   cost centers (department / clinic level)
 *   financePeriods       fiscal periods FY2026 (state: Closed | Open | Future)
 *   financeJournals      journal vouchers (manual, recurring, auto-posted)
 *   financeBatches       auto-posting batches by source and day
 *   financeChargeMap     posting rules (service category, pharmacy group, warehouse cost center, payment mode)
 *   financeReceipts, financePayments, financeBills, financePayRuns, financeCreditNotes, financeWriteOffs,
 *   financeDiscountReqs, financeSchemes, financeArOpening, financeRecurring, financeCloseTasks, financeCloseRequests,
 *   financeCurrencies, financeRates, financeVoucherSeries, financeBanks, financeBooks, financeSettings */
(function () {
  const S = window.SEED;
  const TODAY = S.TODAY;
  let seed = 11252026;
  const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
  const int = (a, b) => a + Math.floor(rnd() * (b - a + 1));
  const pick = (a) => a[Math.floor(rnd() * a.length)];
  const pad = (n, w) => String(n).padStart(w || 2, '0');
  const r3 = (n) => Math.round(n * 1000) / 1000;
  const addDays = (d, n) => { const x = new Date(d + 'T00:00:00'); x.setDate(x.getDate() + n); return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}`; };
  const noise = (p) => 1 + (rnd() * 2 - 1) * (p || 0.03);

  const STAFF = { acc: 'Nadia Al-Sabah', ap: 'Vinod Menon', bill: 'Hessa Al-Kandari', fm: 'Tariq Al-Mulla', cash: 'Fatima Al-Kandari', sys: 'Auto-posting service' };

  /* ---------- Chart of accounts ---------- */
  const adminIds = {}; (S.accounts || []).filter(a => a.companyId === 'co_01').forEach(a => { adminIds[a.code] = a.id; });
  const coa = [
    ['1000', 'Assets', 'Asset', 'Header', false, 'Dr', 'All'],
    ['1010', 'Cash on hand, Salmiya main cashier', 'Asset', 'Cash and bank', true, 'Dr', 'SAL'],
    ['1011', 'Cash on hand, Hawalli cashier', 'Asset', 'Cash and bank', true, 'Dr', 'HAW'],
    ['1020', 'Petty cash', 'Asset', 'Cash and bank', true, 'Dr', 'All'],
    ['1110', 'NBK current account', 'Asset', 'Cash and bank', true, 'Dr', 'All'],
    ['1120', 'KFH current account', 'Asset', 'Cash and bank', true, 'Dr', 'All'],
    ['1130', 'KNET card clearing', 'Asset', 'Cash and bank', true, 'Dr', 'All'],
    ['1140', 'Visa and Mastercard clearing', 'Asset', 'Cash and bank', true, 'Dr', 'All'],
    ['1210', 'Patient receivables', 'Asset', 'Receivables', true, 'Dr', 'All'],
    ['1220', 'Insurance receivables', 'Asset', 'Receivables', true, 'Dr', 'All'],
    ['1230', 'Corporate receivables', 'Asset', 'Receivables', true, 'Dr', 'All'],
    ['1290', 'Allowance for doubtful debts', 'Asset', 'Receivables', true, 'Cr', 'All'],
    ['1310', 'Pharmacy inventory', 'Asset', 'Inventory', true, 'Dr', 'All'],
    ['1320', 'Medical consumables inventory', 'Asset', 'Inventory', true, 'Dr', 'All'],
    ['1330', 'Laboratory reagents inventory', 'Asset', 'Inventory', true, 'Dr', 'All'],
    ['1410', 'Prepaid expenses', 'Asset', 'Other current assets', true, 'Dr', 'All'],
    ['1510', 'Medical equipment, cost', 'Asset', 'Non-current assets', true, 'Dr', 'All'],
    ['1520', 'Accumulated depreciation, medical equipment', 'Asset', 'Non-current assets', true, 'Cr', 'All'],
    ['2000', 'Liabilities', 'Liability', 'Header', false, 'Cr', 'All'],
    ['2010', 'Trade payables', 'Liability', 'Current liabilities', true, 'Cr', 'All'],
    ['2020', 'Goods received not invoiced', 'Liability', 'Current liabilities', true, 'Cr', 'All'],
    ['2110', 'Patient advances and deposits', 'Liability', 'Current liabilities', true, 'Cr', 'All'],
    ['2120', 'Salaries payable', 'Liability', 'Current liabilities', true, 'Cr', 'All'],
    ['2130', 'Accrued expenses', 'Liability', 'Current liabilities', true, 'Cr', 'All'],
    ['2140', 'End of service benefits provision', 'Liability', 'Non-current liabilities', true, 'Cr', 'All'],
    ['2150', 'Refunds payable to patients', 'Liability', 'Current liabilities', true, 'Cr', 'All'],
    ['3000', 'Equity', 'Equity', 'Header', false, 'Cr', 'All'],
    ['3010', 'Share capital', 'Equity', 'Equity', true, 'Cr', 'All'],
    ['3020', 'Statutory reserve', 'Equity', 'Equity', true, 'Cr', 'All'],
    ['3100', 'Retained earnings', 'Equity', 'Equity', true, 'Cr', 'All'],
    ['4000', 'Operating revenue', 'Revenue', 'Header', false, 'Cr', 'All'],
    ['4100', 'OPD consultation revenue', 'Revenue', 'Patient revenue', true, 'Cr', 'All'],
    ['4110', 'OPD procedure revenue', 'Revenue', 'Patient revenue', true, 'Cr', 'All'],
    ['4120', 'Emergency revenue', 'Revenue', 'Patient revenue', true, 'Cr', 'SAL'],
    ['4200', 'IPD room and board revenue', 'Revenue', 'Patient revenue', true, 'Cr', 'SAL'],
    ['4210', 'IPD surgical revenue', 'Revenue', 'Patient revenue', true, 'Cr', 'SAL'],
    ['4300', 'Laboratory revenue', 'Revenue', 'Ancillary revenue', true, 'Cr', 'All'],
    ['4310', 'Radiology revenue', 'Revenue', 'Ancillary revenue', true, 'Cr', 'All'],
    ['4400', 'Pharmacy sales', 'Revenue', 'Ancillary revenue', true, 'Cr', 'All'],
    ['4500', 'Package revenue', 'Revenue', 'Patient revenue', true, 'Cr', 'SAL'],
    ['4900', 'Discounts allowed', 'Revenue', 'Contra revenue', true, 'Dr', 'All'],
    ['5000', 'Operating expenses', 'Expense', 'Header', false, 'Dr', 'All'],
    ['5100', 'OPD clinical supplies', 'Expense', 'Direct costs', true, 'Dr', 'All'],
    ['5110', 'OPD staff cost', 'Expense', 'Direct costs', true, 'Dr', 'All'],
    ['5200', 'IPD consumables', 'Expense', 'Direct costs', true, 'Dr', 'SAL'],
    ['5210', 'IPD nursing cost', 'Expense', 'Direct costs', true, 'Dr', 'SAL'],
    ['5300', 'Cost of drugs sold', 'Expense', 'Direct costs', true, 'Dr', 'All'],
    ['5310', 'Laboratory reagents consumed', 'Expense', 'Direct costs', true, 'Dr', 'All'],
    ['5400', 'Administrative salaries', 'Expense', 'Overheads', true, 'Dr', 'All'],
    ['5410', 'Rent', 'Expense', 'Overheads', true, 'Dr', 'All'],
    ['5420', 'Utilities', 'Expense', 'Overheads', true, 'Dr', 'All'],
    ['5430', 'Depreciation', 'Expense', 'Overheads', true, 'Dr', 'All'],
    ['5440', 'Bad debts written off', 'Expense', 'Overheads', true, 'Dr', 'All'],
    ['5450', 'Repairs and maintenance', 'Expense', 'Overheads', true, 'Dr', 'All'],
    ['5460', 'Bank and card charges', 'Expense', 'Overheads', true, 'Dr', 'All'],
    ['5470', 'Exchange differences', 'Expense', 'Overheads', true, 'Dr', 'All'],
  ];
  const parentOf = (code) => code[0] + '000';
  const financeAccounts = coa.map(([code, name, type, group, posting, normal, branch]) => ({ id: 'fa_' + code, code, name, type, group, parent: posting ? parentOf(code) : '', normal, posting, branch, currency: 'KWD', adminRef: adminIds[code] || '', status: 'Active' }));

  /* ---------- Cost centers ---------- */
  const financeCostCenters = [
    ['cc_card', 'CC-CARD', 'Cardiology', 'br_01', 'dp_01', 'cl_01', 'Revenue'], ['cc_im', 'CC-IM', 'Internal Medicine', 'br_01', 'dp_01', 'cl_05', 'Revenue'],
    ['cc_ped', 'CC-PED', 'Paediatrics', 'br_01', 'dp_02', 'cl_02', 'Revenue'], ['cc_orth', 'CC-ORTH', 'Orthopaedics', 'br_01', 'dp_01', 'cl_03', 'Revenue'],
    ['cc_obg', 'CC-OBG', 'Obstetrics and Gynaecology', 'br_01', 'dp_01', 'cl_06', 'Revenue'], ['cc_ent', 'CC-ENT', 'ENT', 'br_01', 'dp_01', 'cl_07', 'Revenue'],
    ['cc_gs', 'CC-GS', 'General Surgery', 'br_01', 'dp_01', 'cl_08', 'Revenue'], ['cc_er', 'CC-ER', 'Emergency', 'br_01', 'dp_01', '', 'Revenue'],
    ['cc_ipd', 'CC-IPD', 'Inpatient wards', 'br_01', 'dp_03', '', 'Revenue'], ['cc_lab', 'CC-LAB', 'Laboratory', 'br_01', 'dp_06', '', 'Revenue'],
    ['cc_rad', 'CC-RAD', 'Radiology', 'br_01', 'dp_10', '', 'Revenue'], ['cc_pha', 'CC-PHA', 'Pharmacy', 'br_01', 'dp_04', '', 'Revenue'],
    ['cc_adm', 'CC-ADM', 'Administration and support', 'br_01', 'dp_05', '', 'Support'], ['cc_hopd', 'CC-HOPD', 'Hawalli outpatient clinics', 'br_02', 'dp_07', 'cl_04', 'Revenue'],
    ['cc_hadm', 'CC-HADM', 'Hawalli front office', 'br_02', 'dp_08', '', 'Support'],
  ].map(([id, code, name, branchId, deptId, clinicId, type]) => ({ id, code, name, branch: branchId === 'br_01' ? 'SAL' : 'HAW', branchId, deptId, clinicId, type, owner: '', status: 'Active' }));

  /* ---------- Periods ---------- */
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const lastDay = (y, m) => new Date(y, m, 0).getDate();
  const financePeriods = MONTHS.map((n, i) => {
    const code = `2026-${pad(i + 1)}`;
    const state = i < 9 ? 'Closed' : i < 11 ? 'Open' : 'Future';
    return { id: 'fp_' + code, code, name: `${n} 2026`, fy: 'FY2026', from: `${code}-01`, to: `${code}-${pad(lastDay(2026, i + 1))}`, state, closedBy: state === 'Closed' ? STAFF.fm : '', closedAt: state === 'Closed' ? `${addDays(`${code}-${pad(lastDay(2026, i + 1))}`, 9)} 16:${pad(10 + i)}` : '', status: 'Active' };
  });

  /* ---------- Journal builder ---------- */
  const journals = [];
  const acc = (c) => 'fa_' + c;
  function J(o, drs, crs) {
    const lines = [];
    const ln = (c, cc, d, k, m) => { const l = { accountId: acc(c), debit: d, credit: k }; if (cc) l.ccId = cc; if (m) l.memo = m; return l; };
    drs.forEach(([c, a, cc, m]) => { a = r3(a); if (a > 0) lines.push(ln(c, cc, a, 0, m)); });
    crs.forEach(([c, a, cc, m]) => { a = r3(a); if (a > 0) lines.push(ln(c, cc, 0, a, m)); });
    const d = r3(lines.reduce((s, l) => s + l.debit, 0)), c = r3(lines.reduce((s, l) => s + l.credit, 0)), diff = r3(d - c);
    if (diff !== 0) {
      const side = diff > 0 ? 'credit' : 'debit';
      const cand = lines.filter(l => l[side] > 0 && !['fa_2120', 'fa_2010', 'fa_2130'].includes(l.accountId)); const big = (cand.length ? cand : lines.filter(l => l[side] > 0)).sort((a, b) => b[side] - a[side])[0];
      big[side] = r3(big[side] + Math.abs(diff));
    }
    const j = Object.assign({ id: 'jv_' + pad(journals.length + 1, 4), no: '', branchId: 'br_01', type: 'Auto', source: 'Manual', narration: '', status: 'Posted', by: STAFF.sys, at: '', approvedBy: '', approvedAt: '', postedAt: '', attachments: [], batchId: '', templateId: '', currency: 'KWD', rate: 1, ref: '' }, o, { lines });
    j.period = j.date.slice(0, 7);
    if (!j.at) j.at = j.date + ' 23:' + pad(int(10, 50));
    if (j.status === 'Posted' && !j.postedAt) j.postedAt = j.at;
    journals.push(j);
    return j;
  }

  /* ---------- Opening balances 1 Jan 2026 (company level, booked on Salmiya) ---------- */
  const ob = [['1010', 18450], ['1020', 500], ['1110', 1254300], ['1120', 642800], ['1130', 11900], ['1140', 6200], ['1210', 24600], ['1220', 1418750], ['1230', 121400], ['1310', 308600], ['1320', 144900], ['1330', 61750], ['1410', 48000], ['1510', 4825000]];
  const obCr = [['1290', 96500], ['1520', 1652000], ['2010', 518900], ['2020', 61200], ['2110', 34800], ['2130', 41600], ['2140', 684300], ['3010', 3000000], ['3020', 450000]];
  const re = r3(ob.reduce((s, x) => s + x[1], 0) - obCr.reduce((s, x) => s + x[1], 0));
  J({ date: '2026-01-01', type: 'Opening', source: 'Opening', narration: 'Opening balances FY2026 carried forward from the legacy ledger (audited 31 Dec 2025)', by: STAFF.fm, approvedBy: 'Layla Hussain', approvedAt: '2026-01-04 10:20', at: '2026-01-04 09:40', attachments: [{ name: 'Audited TB 31-Dec-2025.xlsx', size: '212 KB' }] },
    ob.map(([c, a]) => [c, a]), obCr.map(([c, a]) => [c, a]).concat([['3100', re]]));

  /* ---------- Branch operating profiles (monthly base, KWD) ---------- */
  const SAL = {
    branchId: 'br_01', cash: '1010', admCc: 'cc_adm', pharmacy: 141000, adminSalaries: 112000,
    rev: [['cc_card', '4100', 62000], ['cc_card', '4110', 58000], ['cc_im', '4100', 48000], ['cc_im', '4110', 22000], ['cc_ped', '4100', 38000], ['cc_ped', '4110', 17000], ['cc_orth', '4100', 26000], ['cc_orth', '4110', 34000],
      ['cc_obg', '4100', 30000], ['cc_obg', '4500', 45000], ['cc_ent', '4100', 18000], ['cc_ent', '4110', 12000], ['cc_gs', '4100', 20000], ['cc_gs', '4210', 65000], ['cc_er', '4120', 65000], ['cc_ipd', '4200', 210000],
      ['cc_lab', '4300', 95000], ['cc_rad', '4310', 80000]],
    cost: { cc_card: ['5110', 0.30, '5100', 0.07], cc_im: ['5110', 0.34, '5100', 0.05], cc_ped: ['5110', 0.36, '5100', 0.06], cc_orth: ['5110', 0.30, '5200', 0.10], cc_obg: ['5110', 0.28, '5200', 0.12], cc_ent: ['5110', 0.33, '5100', 0.06],
      cc_gs: ['5110', 0.26, '5200', 0.16], cc_er: ['5110', 0.42, '5100', 0.09], cc_ipd: ['5210', 0.38, '5200', 0.14], cc_lab: ['5110', 0.18, '5310', 0.24], cc_rad: ['5110', 0.22, '5100', 0.05], cc_pha: ['5110', 0.06, null, 0] },
  };
  const HAW = {
    branchId: 'br_02', cash: '1011', admCc: 'cc_hadm', pharmacy: 0, adminSalaries: 9500,
    rev: [['cc_hopd', '4100', 46000], ['cc_hopd', '4110', 32000]],
    cost: { cc_hopd: ['5110', 0.32, '5100', 0.06] },
  };
  const MF = [0.97, 0.95, 0.88, 1.0, 1.02, 0.96, 0.84, 0.86, 1.01, 1.05, 1.06];

  /* Revenue, cost and cash journals for one branch over a span (a month or a day). f = scale factor vs the monthly base. */
  function billing(B, date, f, o) {
    const crs = [], drs = [], byCc = {};
    B.rev.forEach(([cc, a, base]) => { const v = r3(base * f * noise(0.05)); crs.push([a, v, cc]); byCc[cc] = (byCc[cc] || 0) + v; });
    const gross = crs.reduce((s, x) => s + x[1], 0);
    let disc = 0; Object.entries(byCc).forEach(([cc, v]) => { const d = r3(v * 0.015); disc += d; drs.push(['4900', d, cc, 'Scheme discounts']); });
    const net = gross - disc;
    drs.push([B.cash, net * 0.20], ['1130', net * 0.16], ['1140', net * 0.05], ['1220', net * 0.49], ['1230', net * 0.04], ['1210', net * 0.06]);
    return { j: J(Object.assign({ date, branchId: B.branchId, source: 'Billing', narration: 'Patient billing auto-posting' }, o), drs, crs), gross, net, byCc };
  }
  function pharmacy(B, date, f, o) {
    const P = r3(B.pharmacy * f * noise(0.05));
    return { j: J(Object.assign({ date, branchId: B.branchId, source: 'Pharmacy', narration: 'Pharmacy sales and cost of drugs sold' }, o),
      [[B.cash, P * 0.30], ['1130', P * 0.15], ['1220', P * 0.55], ['5300', P * 0.62, 'cc_pha', 'Cost of drugs sold']],
      [['4400', P, 'cc_pha', 'Pharmacy sales'], ['1310', P * 0.62, '', 'Stock issued']]), P };
  }
  function mmis(B, date, revByCc, P, o) {
    const drs = [], crs = []; let cons = 0, reag = 0;
    Object.entries(B.cost).forEach(([cc, [, , sa, sp]]) => { if (!sa) return; const v = r3((revByCc[cc] || 0) * sp * noise(0.06)); drs.push([sa, v, cc, 'Store issues']); if (sa === '5310') reag += v; else cons += v; });
    crs.push(['1320', cons, '', 'Consumables issued'], ['1330', reag, '', 'Reagents issued']);
    const buy = [['1310', P * 0.62 * noise(0.04)], ['1320', cons * noise(0.04)], ['1330', reag * noise(0.04)]].map(x => [x[0], r3(x[1]), '', 'Goods received (GRN)']);
    const tot = buy.reduce((s, x) => s + x[1], 0);
    return { j: J(Object.assign({ date, branchId: B.branchId, source: 'MMIS', narration: 'Store issues to cost centers and goods received' }, o), drs.concat(buy), crs.concat([['2020', tot, '', 'GRN accrual']])), purchases: tot };
  }
  function payroll(B, date, revByCc, P, o) {
    const drs = []; let tot = 0;
    Object.entries(B.cost).forEach(([cc, [sa, sp]]) => { const base = cc === 'cc_pha' ? P : (revByCc[cc] || 0); const v = r3(base * sp * noise(0.02)); drs.push([sa, v, cc, 'Salaries and allowances']); tot += v; });
    const adm = r3(B.adminSalaries * noise(0.02)); drs.push(['5400', adm, B.admCc, 'Administrative salaries']); tot += adm;
    const eosb = r3(tot * 0.045); drs.push(['5400', eosb, B.admCc, 'End of service benefit provision']);
    const j = J(Object.assign({ date, branchId: B.branchId, type: 'Manual', source: 'Payroll', narration: 'Monthly payroll and EOSB provision (from HR payroll run)', by: STAFF.acc }, o), drs, [['2120', tot, '', 'Net salaries payable'], ['2140', eosb, '', 'EOSB provision']]);
    return { j, tot: j.lines.find(l => l.accountId === 'fa_2120').credit };
  }
  function cashBank(B, date, s, o) {
    const cashIn = s.net * 0.20 + s.P * 0.30 + s.net * 0.06 * 0.98;
    const knet = s.net * 0.16 + s.P * 0.15, visa = s.net * 0.05;
    const ins = (s.net * 0.49 + s.P * 0.55) * 0.95;
    const drs = [['1110', cashIn * 0.97, '', 'Cash deposited'], [B.cash, s.net * 0.06 * 0.98, '', 'Patient balances collected'], ['1110', knet * 0.992, '', 'KNET settlement'], ['5460', knet * 0.008, B.admCc, 'KNET fees'],
      ['1110', visa * 0.978, '', 'Card settlement'], ['5460', visa * 0.022, B.admCc, 'Card commission'], ['1120', ins, '', 'Insurer remittances'], ['1110', s.net * 0.04 * 0.9, '', 'Corporate collections'],
      ['1110', ins * 0.7, '', 'Transfer from KFH']];
    const crs = [[B.cash, cashIn * 0.97], ['1210', s.net * 0.06 * 0.98], ['1130', knet], ['1140', visa], ['1220', ins], ['1230', s.net * 0.04 * 0.9], ['1120', ins * 0.7, '', 'Transfer to NBK']];
    if (s.payroll) { drs.push(['2120', s.payroll, '', 'Salaries paid (WPS)']); crs.push(['1110', s.payroll, '', 'Salaries paid (WPS)']); }
    if (s.ap) { drs.push(['2010', s.ap, '', 'Vendor payments']); crs.push(['1110', s.ap, '', 'Vendor payments']); }
    if (s.accr) { drs.push(['2130', s.accr, '', 'Accrued expenses paid']); crs.push(['1110', s.accr, '', 'Accrued expenses paid']); }
    return J(Object.assign({ date, branchId: B.branchId, type: 'Manual', source: 'Cash and bank', narration: 'Bank deposits, card settlements, collections and payments', by: STAFF.acc }, o), drs, crs);
  }

  /* ---------- Recurring voucher templates ---------- */
  const financeRecurring = [
    { id: 'rc_01', code: 'REC-RENT-SAL', name: 'Salmiya building rent accrual', branchId: 'br_01', frequency: 'Monthly', day: 28, lines: [['5410', 'cc_adm', 28000, 0], ['2130', '', 0, 28000]], lastPeriod: '2026-10', status: 'Active', by: STAFF.acc, note: 'Lease with Al-Salem Real Estate, renews Mar 2028' },
    { id: 'rc_02', code: 'REC-DEP-MED', name: 'Depreciation, medical equipment', branchId: 'br_01', frequency: 'Monthly', day: 28, lines: [['5430', 'cc_adm', 55000, 0], ['1520', '', 0, 55000]], lastPeriod: '2026-10', status: 'Active', by: STAFF.acc, note: 'Straight line, from the fixed asset register (manual until phase 2)' },
    { id: 'rc_03', code: 'REC-UTIL-SAL', name: 'Electricity and water accrual (MEW), Salmiya', branchId: 'br_01', frequency: 'Monthly', day: 28, lines: [['5420', 'cc_adm', 18000, 0], ['2130', '', 0, 18000]], lastPeriod: '2026-10', status: 'Active', by: STAFF.acc, note: '' },
    { id: 'rc_04', code: 'REC-AMC', name: 'Equipment maintenance contract amortisation', branchId: 'br_01', frequency: 'Monthly', day: 28, lines: [['5450', 'cc_adm', 4000, 0], ['1410', '', 0, 4000]], lastPeriod: '2026-10', status: 'Active', by: STAFF.acc, note: 'Boodai AMC prepaid for 12 months' },
    { id: 'rc_05', code: 'REC-RENT-HAW', name: 'Hawalli clinic rent accrual', branchId: 'br_02', frequency: 'Monthly', day: 28, lines: [['5410', 'cc_hadm', 6000, 0], ['2130', '', 0, 6000]], lastPeriod: '2026-10', status: 'Active', by: STAFF.acc, note: '' },
    { id: 'rc_06', code: 'REC-UTIL-HAW', name: 'Hawalli utilities accrual', branchId: 'br_02', frequency: 'Monthly', day: 28, lines: [['5420', 'cc_hadm', 1800, 0], ['2130', '', 0, 1800]], lastPeriod: '2026-10', status: 'Active', by: STAFF.acc, note: '' },
    { id: 'rc_07', code: 'REC-INS-PRE', name: 'Malpractice insurance prepaid release', branchId: 'br_01', frequency: 'Quarterly', day: 28, lines: [['5450', 'cc_adm', 2500, 0], ['1410', '', 0, 2500]], lastPeriod: '2026-09', status: 'Inactive', by: STAFF.acc, note: 'Replaced by annual policy from Oct 2026' },
  ];
  function recurring(t, period, o) {
    const date = `${period}-${pad(Math.min(t.day, 28))}`;
    return J(Object.assign({ date, branchId: t.branchId, type: 'Recurring', source: 'Recurring', templateId: t.id, narration: t.name + ', ' + MONTHS[+period.slice(5) - 1] + ' 2026', by: STAFF.acc, approvedBy: STAFF.fm, approvedAt: date + ' 12:00', at: date + ' 10:05' }, o),
      t.lines.filter(l => l[2] > 0).map(l => [l[0], l[2], l[1]]), t.lines.filter(l => l[3] > 0).map(l => [l[0], l[3], l[1]]));
  }

  /* ---------- January to October: monthly summaries ---------- */
  for (let m = 1; m <= 10; m++) {
    const p = `2026-${pad(m)}`, end = `${p}-${pad(lastDay(2026, m))}`, f = MF[m - 1];
    [SAL, HAW].forEach(B => {
      const meta = { approvedBy: '', at: end + ' 23:40' };
      const b = billing(B, end, f, Object.assign({ narration: 'Patient billing auto-posting, monthly summary ' + MONTHS[m - 1] }, meta));
      const ph = B.pharmacy ? pharmacy(B, end, f, Object.assign({ narration: 'Pharmacy sales and cost of drugs sold, monthly summary ' + MONTHS[m - 1] }, meta)) : { P: 0 };
      const mm = mmis(B, end, b.byCc, ph.P, Object.assign({ narration: 'MMIS store issues and goods received, monthly summary ' + MONTHS[m - 1] }, meta));
      const ap = r3(mm.purchases * 0.985);
      J({ date: end, branchId: B.branchId, source: 'AP', narration: 'Vendor bills matched to GRN, ' + MONTHS[m - 1], at: end + ' 23:45' }, [['2020', ap, '', 'GRN cleared']], [['2010', ap, '', 'Vendor bills']]);
      const pr = payroll(B, `${p}-27`, b.byCc, ph.P, { approvedBy: STAFF.fm, approvedAt: `${p}-27 15:20`, at: `${p}-27 11:30` });
      financeRecurring.filter(t => t.branchId === B.branchId && t.frequency === 'Monthly').forEach(t => recurring(t, p));
      const accr = financeRecurring.filter(t => t.branchId === B.branchId && /2130/.test(JSON.stringify(t.lines)) && t.frequency === 'Monthly').reduce((s, t) => s + t.lines[0][2], 0);
      cashBank(B, end, { net: b.net, P: ph.P, payroll: pr.tot, ap: r3(ap * 0.97), accr }, { approvedBy: STAFF.fm, approvedAt: end + ' 18:00', at: end + ' 16:30', narration: 'Bank deposits, settlements, collections and payments, ' + MONTHS[m - 1] });
    });
  }

  /* ---------- November: daily auto-posting batches ---------- */
  const financeBatches = [];
  const dayF = (d) => { const w = new Date(d + 'T00:00:00').getDay(); return w === 5 ? 0.55 : w === 6 ? 0.8 : 1.07; };
  const nov = { SAL: { net: 0, P: 0 }, HAW: { net: 0, P: 0 } };
  const weekly = {};
  for (let d = 1; d <= 24; d++) {
    const date = `2026-11-${pad(d)}`, f = MF[10] / 30 * dayF(date), dd = pad(d);
    const run = date + ' 23:' + pad(5 + (d % 9));
    const wk = d <= 7 ? 'w1' : d <= 14 ? 'w2' : 'w3';
    weekly[wk] = weekly[wk] || { SAL: { net: 0, P: 0 }, HAW: { net: 0, P: 0 } };
    const bb = billing(SAL, date, f, { at: run });
    financeBatches.push({ id: 'pb_' + dd + 'b', no: `APB-11${dd}-BIL-SAL`, source: 'Billing', branchId: 'br_01', date, docs: Math.round(bb.gross / 38), amount: r3(bb.gross), status: 'Posted', journalId: bb.j.id, runAt: run, by: STAFF.sys, entries: [], log: [] });
    bb.j.batchId = 'pb_' + dd + 'b'; bb.j.narration = 'Patient billing auto-posting' + ', ' + dd + ' Nov 2026';
    const ph = pharmacy(SAL, date, f, { at: run });
    financeBatches.push({ id: 'pb_' + dd + 'p', no: `APB-11${dd}-PHA-SAL`, source: 'Pharmacy', branchId: 'br_01', date, docs: Math.round(ph.P / 9.5), amount: r3(ph.P), status: 'Posted', journalId: ph.j.id, runAt: run, by: STAFF.sys, entries: [], log: [] });
    ph.j.batchId = 'pb_' + dd + 'p'; ph.j.narration = 'Pharmacy sales and cost of drugs sold' + ', ' + dd + ' Nov 2026';
    if (d !== 24) {
      const mm = mmis(SAL, date, bb.byCc, ph.P, { at: run });
      financeBatches.push({ id: 'pb_' + dd + 'm', no: `APB-11${dd}-MMS-SAL`, source: 'MMIS', branchId: 'br_01', date, docs: int(14, 48), amount: r3(mm.purchases), status: 'Posted', journalId: mm.j.id, runAt: run, by: STAFF.sys, entries: [], log: [] });
      mm.j.batchId = 'pb_' + dd + 'm'; mm.j.narration = 'MMIS store issues and goods received' + ', ' + dd + ' Nov 2026';
    }
    nov.SAL.net += bb.net; nov.SAL.P += ph.P; weekly[wk].SAL.net += bb.net; weekly[wk].SAL.P += ph.P;
    if (new Date(date + 'T00:00:00').getDay() !== 5) {
      const hb = billing(HAW, date, MF[10] / 26, { at: run });
      financeBatches.push({ id: 'pb_' + dd + 'h', no: `APB-11${dd}-BIL-HAW`, source: 'Billing', branchId: 'br_02', date, docs: Math.round(hb.gross / 31), amount: r3(hb.gross), status: 'Posted', journalId: hb.j.id, runAt: run, by: STAFF.sys, entries: [], log: [] });
      hb.j.batchId = 'pb_' + dd + 'h'; hb.j.narration = 'Patient billing auto-posting' + ', ' + dd + ' Nov 2026';
      nov.HAW.net += hb.net; weekly[wk].HAW.net += hb.net;
    }
  }
  // Failed MMIS batch 24 Nov: Ward 3 Sub Store has no cost center mapping
  financeBatches.push({ id: 'pb_24m', no: 'APB-1124-MMS-SAL', source: 'MMIS', branchId: 'br_01', date: '2026-11-24', docs: 31, amount: 6418.75, status: 'Failed', journalId: '', runAt: '2026-11-24 23:09', by: STAFF.sys,
    entries: [
      { side: 'Dr', accountId: 'fa_5100', ccId: 'cc_card', amount: 1184.250, memo: 'Store issues, Cardiology clinic' },
      { side: 'Dr', accountId: 'fa_5200', ccId: 'cc_ipd', amount: 1907.400, memo: 'Store issues, Ward 4 (main store)' },
      { side: 'Dr', accountId: 'fa_5200', ccMap: { kind: 'Warehouse cost center', key: 'W3SUB' }, amount: 842.600, memo: 'Store issues, Ward 3 Sub Store (W3SUB)' },
      { side: 'Dr', accountId: 'fa_5310', ccId: 'cc_lab', amount: 2484.500, memo: 'Reagent issues, Laboratory' },
      { side: 'Cr', accountId: 'fa_1320', amount: 3934.250, memo: 'Consumables issued' },
      { side: 'Cr', accountId: 'fa_1330', amount: 2484.500, memo: 'Reagents issued' },
    ], log: [{ at: '2026-11-24 23:09', text: 'Run failed: 1 error' }] });
  // Failed pharmacy batch today: new item group without a sales account
  financeBatches.push({ id: 'pb_25p', no: 'APB-1125-PHA-SAL', source: 'Pharmacy', branchId: 'br_01', date: TODAY, docs: 412, amount: 4987.360, status: 'Failed', journalId: '', runAt: TODAY + ' 14:00', by: STAFF.sys,
    entries: [
      { side: 'Dr', accountId: 'fa_1010', amount: 1496.208, memo: 'Cash sales' }, { side: 'Dr', accountId: 'fa_1130', amount: 748.104, memo: 'KNET sales' }, { side: 'Dr', accountId: 'fa_1220', amount: 2743.048, memo: 'Insured prescriptions' },
      { side: 'Cr', map: { kind: 'Pharmacy sales group', key: 'Prescription drugs' }, ccId: 'cc_pha', amount: 3921.110, memo: 'Prescription drugs' },
      { side: 'Cr', map: { kind: 'Pharmacy sales group', key: 'OTC drugs' }, ccId: 'cc_pha', amount: 684.900, memo: 'OTC drugs' },
      { side: 'Cr', map: { kind: 'Pharmacy sales group', key: 'Medical nutrition' }, ccId: 'cc_pha', amount: 381.350, memo: 'Medical nutrition (new item group)' },
      { side: 'Dr', accountId: 'fa_5300', ccId: 'cc_pha', amount: 3092.163, memo: 'Cost of drugs sold' }, { side: 'Cr', accountId: 'fa_1310', amount: 3092.163, memo: 'Stock issued' },
    ], log: [{ at: TODAY + ' 14:00', text: 'Intraday run failed: 1 error' }] });
  // Billing today: waiting for the night run (built from today's finalized invoices when run)
  financeBatches.push({ id: 'pb_25b', no: 'APB-1125-BIL-SAL', source: 'Billing', branchId: 'br_01', date: TODAY, docs: 0, amount: 0, status: 'Pending', journalId: '', runAt: '', scheduled: TODAY + ' 23:00', by: STAFF.sys, entries: [], log: [], live: true });

  // November AP summary, weekly cash and bank
  ['w1', 'w2', 'w3'].forEach((wk, i) => {
    const date = ['2026-11-07', '2026-11-14', '2026-11-21'][i];
    cashBank(SAL, date, { net: weekly[wk].SAL.net, P: weekly[wk].SAL.P }, { at: date + ' 16:10', approvedBy: STAFF.fm, approvedAt: date + ' 17:00', narration: 'Bank deposits, settlements and collections, week ' + (i + 1) + ' November' });
    cashBank(HAW, date, { net: weekly[wk].HAW.net, P: 0 }, { at: date + ' 16:20', approvedBy: STAFF.fm, approvedAt: date + ' 17:05', narration: 'Bank deposits, settlements and collections, week ' + (i + 1) + ' November' });
  });

  /* ---------- Vendor bills and payment runs ---------- */
  const V = S.vendors || [];
  const vend = (i) => V[i % V.length];
  const billRows = [
    // vendor idx, date, amount, status, grn, po, match, account, paidRun
    [1, '2026-09-08', 18420.500, 'Paid', 'GRN-26-0812', 'PO-26-0451', '3-way matched', '2020', 'PR-26-0040'],
    [0, '2026-09-21', 6240.000, 'Paid', 'GRN-26-0855', 'PO-26-0466', '3-way matched', '2020', 'PR-26-0040'],
    [3, '2026-09-30', 11870.250, 'Approved', 'GRN-26-0871', 'PO-26-0470', '3-way matched', '2020', ''],
    [2, '2026-10-04', 22315.800, 'Paid', 'GRN-26-0902', 'PO-26-0481', '3-way matched', '2020', 'PR-26-0041'],
    [6, '2026-10-12', 9480.000, 'Approved', 'GRN-26-0934', 'PO-26-0490', 'Price variance accepted', '2020', ''],
    [7, '2026-10-15', 3125.400, 'Paid', 'GRN-26-0941', 'PO-26-0494', '3-way matched', '2020', 'PR-26-0041'],
    [4, '2026-10-19', 845.250, 'Approved', 'GRN-26-0950', 'PO-26-0497', '3-way matched', '2020', ''],
    [1, '2026-10-26', 27640.000, 'Approved', 'GRN-26-0977', 'PO-26-0503', '3-way matched', '2020', ''],
    [5, '2026-10-29', 4200.000, 'Approved', '', 'PO-26-0506', 'Service bill (no GRN)', '5450', ''],
    [3, '2026-11-02', 8960.700, 'Approved', 'GRN-26-1004', 'PO-26-0511', '3-way matched', '2020', ''],
    [0, '2026-11-05', 5310.000, 'Approved', 'GRN-26-1012', 'PO-26-0514', '3-way matched', '2020', ''],
    [6, '2026-11-09', 14775.300, 'Pending approval', 'GRN-26-1031', 'PO-26-0520', 'Quantity variance', '2020', ''],
    [2, '2026-11-12', 19240.000, 'Approved', 'GRN-26-1040', 'PO-26-0523', '3-way matched', '2020', ''],
    [7, '2026-11-16', 2687.500, 'Pending approval', 'GRN-26-1055', 'PO-26-0529', '3-way matched', '2020', ''],
    [4, '2026-11-19', 512.000, 'Approved', 'GRN-26-1063', 'PO-26-0531', '3-way matched', '2020', ''],
    [1, '2026-11-22', 31205.900, 'Pending approval', 'GRN-26-1078', 'PO-26-0536', '3-way matched', '2020', ''],
  ];
  const financeBills = billRows.map(([vi, date, amount, status, grn, po, match, account, run], i) => {
    const v = vend(vi);
    return { id: 'bl_' + pad(i + 1), no: 'PB-26-' + (3301 + i), vendorId: v.id, vendorInvNo: v.code.replace('VEN-', 'INV') + '-' + (7100 + i * 13), date, dueDate: addDays(date, v.paymentTerms || 30), amount, paid: status === 'Paid' ? amount : 0, status, grnRef: grn, poRef: po, match, accountId: 'fa_' + account, ccId: account === '5450' ? 'cc_adm' : '', branchId: 'br_01', runNo: run,
      by: STAFF.ap, at: addDays(date, 2) + ' 10:' + pad(10 + i), approvedBy: /Approved|Paid/.test(status) ? STAFF.fm : '', approvedAt: /Approved|Paid/.test(status) ? addDays(date, 3) + ' 12:00' : '', narration: (v.category || '') + ' supply' };
  });
  // make one pending bill created by the demo user (self-approval blocked) and one by someone else
  financeBills[13].by = 'Hospital Demo';
  // partial payment
  financeBills[7].paid = 12000; financeBills[7].status = 'Partially paid';
  const financePayRuns = [
    { id: 'prn_40', no: 'PR-26-0040', date: '2026-10-08', billIds: ['bl_01', 'bl_02'], amount: r3(18420.5 + 6240), bankId: 'bk_nbk', status: 'Paid', by: STAFF.ap, at: '2026-10-07 11:00', approvedBy: STAFF.fm, approvedAt: '2026-10-07 15:30', paidAt: '2026-10-08 09:15', note: '' },
    { id: 'prn_41', no: 'PR-26-0041', date: '2026-11-05', billIds: ['bl_04', 'bl_06', 'bl_08'], amount: r3(22315.8 + 3125.4 + 12000), bankId: 'bk_nbk', status: 'Paid', by: STAFF.ap, at: '2026-11-04 10:40', approvedBy: STAFF.fm, approvedAt: '2026-11-04 16:05', paidAt: '2026-11-05 09:30', note: 'Partial payment of PB-26-3308 agreed with vendor' },
    { id: 'prn_42', no: 'PR-26-0042', date: '2026-11-26', billIds: ['bl_03', 'bl_05', 'bl_07'], amount: r3(11870.25 + 9480 + 845.25), bankId: 'bk_nbk', status: 'Pending approval', by: STAFF.ap, at: '2026-11-24 15:20', approvedBy: '', approvedAt: '', paidAt: '', note: 'Overdue bills, end of month run' },
  ];
  J({ date: '2026-11-05', branchId: 'br_01', type: 'Manual', source: 'AP', narration: 'Payment run PR-26-0041 (3 vendor bills)', by: STAFF.ap, approvedBy: STAFF.fm, approvedAt: '2026-11-04 16:05', at: '2026-11-05 09:30', ref: 'PR-26-0041' }, [['2010', 37441.2, '', 'Vendor bills paid']], [['1110', 37441.2, '', 'NBK transfer']]);
  J({ date: '2026-11-20', branchId: 'br_01', source: 'AP', narration: 'Vendor bills matched to GRN, 1 to 20 November', at: '2026-11-20 23:45' }, [['2020', 68420.6, '', 'GRN cleared']], [['2010', 68420.6, '', 'Vendor bills']]);

  /* ---------- Manual journals in progress (November) ---------- */
  const runRate = {}; SAL.rev.forEach(([cc, , base]) => { runRate[cc] = (runRate[cc] || 0) + base * MF[10]; });
  payroll(SAL, '2026-11-25', runRate, SAL.pharmacy * MF[10], { status: 'Pending approval', by: STAFF.acc, at: '2026-11-25 09:20', narration: 'November 2026 payroll and EOSB provision (HR payroll run PR-2026-11)', attachments: [{ name: 'Payroll register Nov 2026.pdf', size: '318 KB' }] });
  J({ date: '2026-11-25', branchId: 'br_01', type: 'Manual', source: 'Manual', status: 'Draft', narration: 'Accrual for November electricity and water (MEW estimate)', by: STAFF.acc, at: '2026-11-25 10:02', postedAt: '' }, [['5420', 16500, 'cc_adm', 'MEW estimate']], [['2130', 16500, '', 'Accrued utilities']]);
  J({ date: '2026-11-23', branchId: 'br_01', type: 'Manual', source: 'Manual', status: 'Pending approval', narration: 'Reclass reagent cost booked to Radiology in error', by: 'Hospital Demo', at: '2026-11-23 12:40', postedAt: '', attachments: [{ name: 'Reclass memo LAB-RAD.pdf', size: '84 KB' }] }, [['5310', 2340.5, 'cc_lab', 'Correct cost center']], [['5100', 2340.5, 'cc_rad', 'Reverse wrong cost center']]);
  J({ date: '2026-11-22', branchId: 'br_01', type: 'Manual', source: 'Manual', status: 'Approved', narration: 'Provision for insurer rejections, Q3 2026 claims', by: STAFF.ap, at: '2026-11-22 09:10', approvedBy: STAFF.fm, approvedAt: '2026-11-22 14:45', postedAt: '', attachments: [{ name: 'Rejection analysis Q3.xlsx', size: '61 KB' }] }, [['5440', 12800, 'cc_adm', 'Q3 rejection provision']], [['1290', 12800, '', 'Allowance for doubtful debts']]);
  J({ date: '2026-11-18', branchId: 'br_02', type: 'Manual', source: 'Manual', status: 'Pending approval', narration: 'Hawalli petty cash replenishment, receipts 18-41', by: STAFF.cash, at: '2026-11-18 13:15', postedAt: '', attachments: [{ name: 'Petty cash vouchers.pdf', size: '1.2 MB' }] }, [['5450', 86.75, 'cc_hadm', 'Minor repairs'], ['5420', 42.5, 'cc_hadm', 'Water dispenser']], [['1020', 129.25, '', 'Petty cash']]);
  J({ date: '2026-11-16', branchId: 'br_01', type: 'Manual', source: 'Manual', status: 'Rejected', narration: 'Write back of old GRNI balances before 2025', by: STAFF.ap, at: '2026-11-16 11:00', postedAt: '', rejectReason: 'Needs vendor confirmation for each GRN before write back.', approvedBy: STAFF.fm, approvedAt: '2026-11-17 09:30' }, [['2020', 4120, '', 'Old GRNI']], [['5450', 4120, 'cc_adm', 'Write back']]);
  J({ date: '2026-10-30', branchId: 'br_01', type: 'Manual', source: 'Manual', status: 'Posted', narration: 'Exchange difference on USD equipment invoice (Siemens service)', by: STAFF.acc, at: '2026-10-30 11:20', approvedBy: STAFF.fm, approvedAt: '2026-10-30 15:00', currency: 'USD', rate: 0.3072, attachments: [{ name: 'Siemens invoice USD.pdf', size: '140 KB' }] }, [['5470', 186.4, 'cc_adm', 'USD 12,400 at 0.3072 vs 0.3057']], [['2010', 186.4, '', 'Vendor revaluation']]);
  J({ date: '2026-11-10', branchId: 'br_01', type: 'Manual', source: 'Manual', status: 'Cancelled', narration: 'Duplicate entry of November rent', by: STAFF.acc, at: '2026-11-10 09:00', postedAt: '', cancelReason: 'Duplicate. Rent comes from the recurring template.' }, [['5410', 28000, 'cc_adm']], [['2130', 28000]]);

  /* number the vouchers by date */
  journals.sort((a, b) => (a.date + a.at).localeCompare(b.date + b.at));
  let nJ = 0, nA = 0;
  journals.forEach(j => { if (j.type === 'Auto') j.no = 'AJ-26-' + pad(++nA, 5); else j.no = 'JV-26-' + pad(++nJ, 4); });

  /* ---------- Posting rules ---------- */
  const financeChargeMap = [
    ['Service category', 'Consultation', '4100', ''], ['Service category', 'Emergency', '4120', 'CC-ER'], ['Service category', 'Procedure', '4110', ''], ['Service category', 'Room', '4200', 'CC-IPD'],
    ['Service category', 'Package', '4500', ''], ['Service category', 'Laboratory', '4300', 'CC-LAB'], ['Service category', 'Radiology', '4310', 'CC-RAD'],
    ['Pharmacy sales group', 'Prescription drugs', '4400', 'CC-PHA'], ['Pharmacy sales group', 'OTC drugs', '4400', 'CC-PHA'], ['Pharmacy sales group', 'Controlled drugs', '4400', 'CC-PHA'], ['Pharmacy sales group', 'Consumables', '4400', 'CC-PHA'],
    ['Warehouse cost center', 'MAIN', '', 'CC-ADM'], ['Warehouse cost center', 'PHIP', '', 'CC-IPD'], ['Warehouse cost center', 'PHOP', '', 'CC-PHA'], ['Warehouse cost center', 'GEN', '', 'CC-HOPD'], ['Warehouse cost center', 'LABST', '', 'CC-LAB'],
    ['Payment mode', 'Cash', '1010', ''], ['Payment mode', 'KNET', '1130', ''], ['Payment mode', 'Visa or Mastercard', '1140', ''], ['Payment mode', 'Bank transfer', '1110', ''], ['Payment mode', 'Cheque', '1110', ''],
    ['Receivable', 'Patient', '1210', ''], ['Receivable', 'Insurer', '1220', ''], ['Receivable', 'Corporate', '1230', ''], ['Receivable', 'Advance', '2110', ''],
  ].map(([kind, key, account, cc], i) => ({ id: 'cm_' + pad(i + 1), code: 'MAP-' + pad(i + 1, 3), kind, key, account, cc, status: 'Active' }));

  /* ---------- Receipts ---------- */
  const INV = S.invoices || [];
  const modes = ['Cash', 'KNET', 'KNET', 'Visa or Mastercard', 'Cash'];
  const financeReceipts = [];
  INV.filter(v => v.paid > 0).forEach((v, i) => {
    financeReceipts.push({ id: 'rv_' + pad(i + 1, 3), no: 'RV-26-' + (41200 + i), date: v.date, time: pad(8 + (i % 10)) + ':' + pad((i * 7) % 60), kind: 'Invoice', invoiceId: v.id, patientId: v.patientId, payerId: '', amount: v.paid, mode: pick(modes), bankId: '', ref: '', by: i % 3 ? STAFF.cash : STAFF.bill, branchId: 'br_01', status: 'Posted', narration: 'Patient share ' + v.no });
  });
  const ipdPts = (S.encounters || []).filter(e => e.type === 'IPD').map(e => e.patientId);
  [[0, 500, 'KNET'], [2, 300, 'Cash'], [5, 1000, 'Bank transfer'], [8, 250, 'Cash']].forEach(([k, amt, mode], i) => financeReceipts.push({ id: 'rv_adv' + (i + 1), no: 'RV-26-' + (41300 + i), date: addDays(TODAY, -(i + 1)), time: '1' + i + ':20', kind: 'Advance', invoiceId: '', patientId: ipdPts[k] || 'pt_001', payerId: '', amount: amt, mode, bankId: mode === 'Bank transfer' ? 'bk_nbk' : '', ref: mode === 'Bank transfer' ? 'NBK-TT-' + (88120 + i) : '', by: STAFF.bill, branchId: 'br_01', status: 'Posted', narration: 'Admission deposit' }));
  [['py_01', 48250.75, '2026-11-12', 'GIG-REM-2611-04'], ['py_02', 31480.2, '2026-11-17', 'WRB-REM-1117'], ['py_04', 66210, '2026-11-19', 'AFYA-PAY-0931'], ['py_05', 9870.5, '2026-11-23', 'KOC-CHQ-554120']].forEach(([payerId, amount, date, ref], i) =>
    financeReceipts.push({ id: 'rv_ins' + (i + 1), no: 'RV-26-' + (41400 + i), date, time: '11:' + pad(i * 9), kind: 'Insurer', invoiceId: '', patientId: '', payerId, amount, mode: payerId === 'py_05' ? 'Cheque' : 'Bank transfer', bankId: 'bk_kfh', ref, by: STAFF.acc, branchId: 'br_01', status: 'Posted', narration: 'Claim remittance' }));
  financeReceipts.push({ id: 'rv_can1', no: 'RV-26-41399', date: addDays(TODAY, -2), time: '17:42', kind: 'Advance', invoiceId: '', patientId: 'pt_011', payerId: '', amount: 150, mode: 'Cash', bankId: '', ref: '', by: STAFF.cash, branchId: 'br_01', status: 'Cancelled', cancelReason: 'Wrong patient selected, re-issued as RV-26-41302', narration: 'Admission deposit' });

  // Morning cashier shift posted to the ledger today (patient receipts against invoices)
  const todayR = financeReceipts.filter(r => r.date === TODAY && r.kind === 'Invoice');
  const byMode = {}; todayR.forEach(r => { byMode[r.mode] = (byMode[r.mode] || 0) + r.amount; });
  const modeAcc = { Cash: '1010', KNET: '1130', 'Visa or Mastercard': '1140', 'Bank transfer': '1110', Cheque: '1110' };
  if (todayR.length) {
    const sj = J({ date: TODAY, branchId: 'br_01', type: 'Auto', source: 'Cash and bank', narration: 'Cashier shift CS-SAL-1125-M closed, patient receipts', at: TODAY + ' 14:05', by: STAFF.cash, approvedBy: 'System rule', ref: 'CS-SAL-1125-M' },
      Object.entries(byMode).map(([m, a]) => [modeAcc[m], a, '', m + ' receipts']), [['1210', todayR.reduce((a, r) => a + r.amount, 0), '', 'Patient shares collected']]);
    sj.no = 'AJ-26-' + pad(++nA, 5);
  }

  /* ---------- Payment vouchers ---------- */
  const financePayments = [
    { id: 'pv_01', no: 'PV-26-2201', date: '2026-10-08', payee: vend(1).name, vendorId: vend(1).id, kind: 'Payment run', runId: 'prn_40', amount: 18420.5, mode: 'Bank transfer', bankId: 'bk_nbk', ref: 'NBK-TT-77012', accountId: 'fa_2010', ccId: '', narration: 'PB-26-3301', status: 'Paid', by: STAFF.ap, approvedBy: STAFF.fm, branchId: 'br_01' },
    { id: 'pv_02', no: 'PV-26-2202', date: '2026-10-08', payee: vend(0).name, vendorId: vend(0).id, kind: 'Payment run', runId: 'prn_40', amount: 6240, mode: 'Bank transfer', bankId: 'bk_nbk', ref: 'NBK-TT-77013', accountId: 'fa_2010', ccId: '', narration: 'PB-26-3302', status: 'Paid', by: STAFF.ap, approvedBy: STAFF.fm, branchId: 'br_01' },
    { id: 'pv_03', no: 'PV-26-2215', date: '2026-11-05', payee: vend(2).name, vendorId: vend(2).id, kind: 'Payment run', runId: 'prn_41', amount: 22315.8, mode: 'Bank transfer', bankId: 'bk_nbk', ref: 'NBK-TT-78110', accountId: 'fa_2010', ccId: '', narration: 'PB-26-3304', status: 'Paid', by: STAFF.ap, approvedBy: STAFF.fm, branchId: 'br_01' },
    { id: 'pv_04', no: 'PV-26-2216', date: '2026-11-05', payee: vend(7).name, vendorId: vend(7).id, kind: 'Payment run', runId: 'prn_41', amount: 3125.4, mode: 'Bank transfer', bankId: 'bk_nbk', ref: 'NBK-TT-78111', accountId: 'fa_2010', ccId: '', narration: 'PB-26-3306', status: 'Paid', by: STAFF.ap, approvedBy: STAFF.fm, branchId: 'br_01' },
    { id: 'pv_05', no: 'PV-26-2217', date: '2026-11-05', payee: vend(1).name, vendorId: vend(1).id, kind: 'Payment run', runId: 'prn_41', amount: 12000, mode: 'Bank transfer', bankId: 'bk_nbk', ref: 'NBK-TT-78112', accountId: 'fa_2010', ccId: '', narration: 'PB-26-3308 (part)', status: 'Paid', by: STAFF.ap, approvedBy: STAFF.fm, branchId: 'br_01' },
    { id: 'pv_06', no: 'PV-26-2224', date: '2026-11-18', payee: 'Dana Al-Hajri (patient refund)', vendorId: '', kind: 'Patient refund', runId: '', amount: 45, mode: 'Cash', bankId: '', ref: 'Refund of advance RV-26-41120', accountId: 'fa_2150', ccId: '', narration: 'Refund after insurance approval', status: 'Paid', by: STAFF.bill, approvedBy: STAFF.fm, branchId: 'br_01' },
    { id: 'pv_07', no: 'PV-26-2229', date: '2026-11-24', payee: 'Kuwait Ministry of Electricity and Water', vendorId: '', kind: 'Expense', runId: '', amount: 17640.25, mode: 'Bank transfer', bankId: 'bk_nbk', ref: 'MEW-OCT-2026', accountId: 'fa_2130', ccId: '', narration: 'October electricity and water', status: 'Pending approval', by: STAFF.acc, approvedBy: '', branchId: 'br_01' },
    { id: 'pv_08', no: 'PV-26-2230', date: '2026-11-25', payee: 'Petty cash custodian, Salmiya', vendorId: '', kind: 'Petty cash', runId: '', amount: 300, mode: 'Cash', bankId: '', ref: '', accountId: 'fa_1020', ccId: '', narration: 'Petty cash top-up', status: 'Pending approval', by: 'Hospital Demo', approvedBy: '', branchId: 'br_01' },
  ];

  /* ---------- AR: migrated open items, credit notes, write-offs, discounts ---------- */
  const P = S.patients || [];
  /* Migrated and summarised open items. Amounts are sized so that the AR sub-ledger agrees with the GL control accounts (1210, 1220, 1230). */
  const glBal = (codes) => r3(journals.filter(j => j.status === 'Posted').reduce((s, j) => s + j.lines.filter(l => codes.includes(l.accountId.slice(3))).reduce((a, l) => a + l.debit - l.credit, 0), 0));
  const liveInv = INV.filter(v => !['Draft', 'Cancelled', 'Interim'].includes(v.status));
  const invPt = liveInv.reduce((s, v) => s + Math.max(0, v.patientAmount - v.paid), 0);
  const invPy = liveInv.filter(v => v.payerId && v.claimStatus !== 'Paid').reduce((s, v) => s + v.payerAmount, 0);
  const AGE = [11, 44, 77, 128, 236];
  const SHARE = [0.33, 0.25, 0.17, 0.16, 0.09];
  const PW = { py_01: 0.30, py_02: 0.22, py_03: 0.12, py_04: 0.28, py_05: 0.08 };
  const MON = (d) => MONTHS[+d.slice(5, 7) - 1].slice(0, 3) + ' ' + d.slice(0, 4);
  const financeArOpening = [];
  const insTarget = glBal(['1220', '1230']) - invPy + 420;   // + approved credit note already applied to an item
  Object.entries(PW).forEach(([payerId, w]) => AGE.forEach((age, k) => {
    const d = addDays(TODAY, -age - int(0, 6));
    const code = ((S.payers || []).find(x => x.id === payerId) || {}).code || 'INS';
    financeArOpening.push({ id: `ao_${payerId.slice(3)}${k}`, no: `CLM-${code}-${d.slice(2, 4)}${d.slice(5, 7)}`, party: 'Insurer', partyId: payerId, date: d, amount: r3(insTarget * w * SHARE[k]), settled: 0, desc: `Claim batch ${MON(d)}, submitted`, status: 'Open' });
  }));
  const ptIds = (S.patients || []).slice(4, 40).filter((p, i) => i % 3 !== 1).map(p => p.id);
  const ptTarget = glBal(['1210']) - invPt + 60 + 250;
  const wts = ptIds.map(() => 0.4 + rnd() * 2.6), wsum = wts.reduce((a, b) => a + b, 0);
  ptIds.forEach((id, i) => {
    const age = [6, 19, 33, 52, 70, 95, 140, 200, 320][i % 9] + int(0, 8), d = addDays(TODAY, -age);
    financeArOpening.push({ id: 'ao_p' + pad(i + 1), no: 'PBL-' + d.slice(2, 4) + '-' + (5100 + i * 7), party: 'Patient', partyId: id, date: d, amount: r3(ptTarget * wts[i] / wsum), settled: 0, desc: i % 4 === 0 ? 'Inpatient self-pay balance' : i % 4 === 1 ? 'Rejected claim, billed to patient' : i % 4 === 2 ? 'Co-payment balance' : 'Outpatient balance (legacy HIS)', status: 'Open' });
  });
  const aoP = (k) => financeArOpening.filter(x => x.party === 'Patient')[k];
  const pendingIpd = INV.filter(v => v.status === 'Interim');
  const unpaidOpd = INV.filter(v => v.status === 'Unpaid' && v.type === 'OPD');
  const financeCreditNotes = [
    { id: 'cn_01', no: 'CN-26-0118', date: '2026-11-03', party: 'Insurer', partyId: 'py_02', invoiceId: '', openItemId: 'ao_021', amount: 420, reason: 'Tariff difference agreed with Warba (contract rate)', status: 'Approved', by: STAFF.bill, at: '2026-11-03 10:20', approvedBy: STAFF.fm, approvedAt: '2026-11-03 15:00' },
    { id: 'cn_02', no: 'CN-26-0121', date: '2026-11-11', party: 'Patient', partyId: aoP(4).partyId, invoiceId: '', openItemId: aoP(4).id, amount: 60, reason: 'Duplicate dressing charge', status: 'Approved', by: STAFF.bill, at: '2026-11-11 12:05', approvedBy: STAFF.fm, approvedAt: '2026-11-11 16:40' },
    { id: 'cn_03', no: 'CN-26-0126', date: '2026-11-21', party: 'Insurer', partyId: 'py_01', invoiceId: '', openItemId: 'ao_011', amount: 1150.5, reason: 'Package price applied after pre-authorization', status: 'Pending approval', by: STAFF.bill, at: '2026-11-21 09:45', approvedBy: '', approvedAt: '' },
    { id: 'cn_04', no: 'CN-26-0127', date: '2026-11-24', party: 'Patient', partyId: aoP(2).partyId, invoiceId: '', openItemId: aoP(2).id, amount: 20, reason: 'Goodwill after long waiting time', status: 'Rejected', by: STAFF.cash, at: '2026-11-24 11:00', approvedBy: STAFF.fm, approvedAt: '2026-11-24 13:20', rejectReason: 'Use a discount scheme, not a credit note.' },
  ];
  const financeWriteOffs = [
    { id: 'wo_01', no: 'WO-26-0031', date: '2026-10-28', party: 'Patient', partyId: aoP(8).partyId, openItemId: aoP(8).id, invoiceId: '', amount: 250, reason: 'Patient left the country, collection agency returned the file', status: 'Approved', by: STAFF.bill, at: '2026-10-28 10:00', approvedBy: STAFF.fm, approvedAt: '2026-10-29 09:00' },
    { id: 'wo_02', no: 'WO-26-0034', date: '2026-11-19', party: 'Insurer', partyId: 'py_03', openItemId: 'ao_034', invoiceId: '', amount: 1645.3, reason: 'Claims older than the KIC submission window, final rejection received', status: 'Pending approval', by: STAFF.bill, at: '2026-11-19 14:30', approvedBy: '', approvedAt: '' },
    { id: 'wo_03', no: 'WO-26-0035', date: '2026-11-24', party: 'Patient', partyId: aoP(7).partyId, openItemId: aoP(7).id, invoiceId: '', amount: r3(Math.min(640, aoP(7).amount)), reason: 'Small balance, three reminders sent, patient deceased', status: 'Pending approval', by: 'Hospital Demo', at: '2026-11-24 16:00', approvedBy: '', approvedAt: '' },
  ];
  const financeDiscountReqs = [
    pendingIpd[0] ? { id: 'dr_01', invoiceId: pendingIpd[0].id, schemeId: 'sc_03', pct: 50, amount: r3(pendingIpd[0].total * 0.5), reason: 'Zakat committee referral ZK-2611-08', status: 'Pending approval', by: STAFF.bill, at: '2026-11-24 12:10', approvedBy: '', approvedAt: '' } : null,
    unpaidOpd[0] ? { id: 'dr_02', invoiceId: unpaidOpd[0].id, schemeId: '', pct: 25, amount: r3(unpaidOpd[0].total * 0.25), reason: 'Manual goodwill discount, complaint CMP-2611-14', status: 'Pending approval', by: 'Hospital Demo', at: '2026-11-25 08:40', approvedBy: '', approvedAt: '' } : null,
  ].filter(Boolean);

  /* ---------- Schemes ---------- */
  const CATS = ['Consultation', 'Emergency', 'Procedure', 'Room', 'Package', 'Laboratory', 'Radiology'];
  const financeSchemes = [
    { id: 'sc_01', code: 'DS-STAFF', name: 'Staff and dependants discount', kind: 'Discount', value: 20, categories: CATS.slice(), payerId: '', patientCat: 'Staff', from: '2026-01-01', to: '2026-12-31', approvalLimit: 25, status: 'Active', by: STAFF.bill, at: '2025-12-20 10:00', approvedBy: STAFF.fm, approvedAt: '2025-12-22 11:00', notes: 'HR policy 4.12. Not for cosmetic procedures.' },
    { id: 'sc_02', code: 'DS-SENIOR', name: 'Senior citizen discount', kind: 'Discount', value: 10, categories: ['Consultation', 'Procedure', 'Laboratory'], payerId: '', patientCat: 'Senior citizen', from: '2026-01-01', to: '2026-12-31', approvalLimit: 20, status: 'Active', by: STAFF.bill, at: '2025-12-20 10:10', approvedBy: STAFF.fm, approvedAt: '2025-12-22 11:05', notes: 'Age 60 and over, cash patients only.' },
    { id: 'sc_03', code: 'DS-ZAKAT', name: 'Zakat committee charity case', kind: 'Discount', value: 50, categories: CATS.slice(), payerId: '', patientCat: 'Charity', from: '2026-01-01', to: '2026-12-31', approvalLimit: 0, status: 'Active', by: STAFF.bill, at: '2026-01-05 09:00', approvedBy: STAFF.fm, approvedAt: '2026-01-06 10:00', notes: 'Every use needs Finance Manager approval.' },
    { id: 'sc_04', code: 'DS-CHK-NOV', name: 'Executive health check, November campaign', kind: 'Discount', value: 15, categories: ['Package'], payerId: '', patientCat: 'All', from: '2026-11-01', to: '2026-12-15', approvalLimit: 30, status: 'Active', by: STAFF.bill, at: '2026-10-25 12:00', approvedBy: STAFF.fm, approvedAt: '2026-10-26 09:30', notes: 'Marketing campaign MC-26-11.' },
    { id: 'sc_05', code: 'DS-VIP', name: 'VIP courtesy consultation', kind: 'Discount', value: 100, categories: ['Consultation'], payerId: '', patientCat: 'VIP', from: '2026-12-01', to: '2027-11-30', approvalLimit: 0, status: 'Pending approval', by: STAFF.bill, at: '2026-11-20 15:00', approvedBy: '', approvedAt: '', notes: 'Requested by the CEO office.' },
    { id: 'sc_06', code: 'DS-KOC-LAB', name: 'KOC lab tariff discount', kind: 'Discount', value: 12, categories: ['Laboratory'], payerId: 'py_05', patientCat: 'All', from: '2026-12-01', to: '2027-11-30', approvalLimit: 50, status: 'Draft', by: 'Hospital Demo', at: '2026-11-24 10:00', approvedBy: '', approvedAt: '', notes: 'Contract renewal 2027.' },
    { id: 'mk_01', code: 'MK-KOC-ROOM', name: 'KOC corporate room upgrade markup', kind: 'Markup', value: 10, categories: ['Room'], payerId: 'py_05', patientCat: 'All', from: '2026-01-01', to: '2026-12-31', approvalLimit: 0, status: 'Active', by: STAFF.bill, at: '2025-12-28 09:00', approvedBy: STAFF.fm, approvedAt: '2025-12-29 10:00', notes: 'As per KOC agreement schedule B.' },
    { id: 'mk_02', code: 'MK-INTL', name: 'International (non-resident) patient markup', kind: 'Markup', value: 15, categories: CATS.slice(), payerId: '', patientCat: 'International', from: '2026-12-01', to: '2027-12-31', approvalLimit: 0, status: 'Pending approval', by: 'Hospital Demo', at: '2026-11-23 11:30', approvedBy: '', approvedAt: '', notes: 'Medical tourism price list.' },
    { id: 'mk_03', code: 'MK-AFYA-PKG', name: 'Afya package handling markup', kind: 'Markup', value: 5, categories: ['Package'], payerId: 'py_04', patientCat: 'All', from: '2026-01-01', to: '2026-06-30', approvalLimit: 0, status: 'Inactive', by: STAFF.bill, at: '2025-12-28 09:30', approvedBy: STAFF.fm, approvedAt: '2025-12-29 10:10', notes: 'Expired. Afya contract revised in July.' },
  ];

  /* ---------- Period close ---------- */
  const MANUAL = [['bankNbk', 'NBK bank reconciliation signed off'], ['bankKfh', 'KFH bank reconciliation signed off'], ['cash', 'Cashier shifts closed and cash counted'], ['accruals', 'Accruals and prepayments reviewed'], ['inventory', 'Inventory valuation agreed with stores'], ['ar', 'AR ageing and provisions reviewed'], ['ap', 'AP ageing and GRNI reviewed']];
  const financeCloseTasks = [];
  financePeriods.forEach((p, i) => MANUAL.forEach(([key, label], k) => {
    if (i > 10) return;
    const done = i < 10;
    financeCloseTasks.push({ id: `ct_${p.code}_${key}`, period: p.code, key, label, done, by: done ? (k % 2 ? STAFF.acc : STAFF.ap) : '', at: done ? `${addDays(p.to, 3 + k)} 1${k}:00` : '', note: done ? '' : '' });
  }));
  const financeCloseRequests = [
    { id: 'cr_01', period: '2026-08', action: 'Close', reason: 'August 2026 month end', status: 'Approved', by: STAFF.acc, at: '2026-09-08 10:00', approvedBy: STAFF.fm, approvedAt: '2026-09-09 16:18' },
    { id: 'cr_02', period: '2026-08', action: 'Reopen', reason: 'Late Afya remittance advice needed in August', status: 'Approved', by: STAFF.acc, at: '2026-09-15 09:00', approvedBy: STAFF.fm, approvedAt: '2026-09-15 11:30' },
    { id: 'cr_03', period: '2026-08', action: 'Close', reason: 'Re-close after Afya adjustment', status: 'Approved', by: STAFF.acc, at: '2026-09-16 12:00', approvedBy: STAFF.fm, approvedAt: '2026-09-16 15:00' },
    { id: 'cr_04', period: '2026-09', action: 'Close', reason: 'September 2026 month end', status: 'Approved', by: STAFF.acc, at: '2026-10-09 10:00', approvedBy: STAFF.fm, approvedAt: '2026-10-10 16:19' },
    { id: 'cr_05', period: '2026-10', action: 'Close', reason: 'October 2026 month end. KFH reconciliation signed off 23 Nov, stock valuation agreed with stores.', status: 'Pending approval', by: STAFF.acc, at: '2026-11-24 17:10', approvedBy: '', approvedAt: '' },
  ];

  /* ---------- Masters ---------- */
  const financeCurrencies = [
    ['KWD', 'Kuwaiti dinar', 'KD', 3, 1, true], ['USD', 'US dollar', '$', 2, 0.3068, false], ['EUR', 'Euro', '€', 2, 0.3321, false], ['GBP', 'Pound sterling', '£', 2, 0.3894, false],
    ['SAR', 'Saudi riyal', 'SR', 2, 0.0818, false], ['AED', 'UAE dirham', 'AED', 2, 0.0835, false], ['INR', 'Indian rupee', '₹', 2, 0.00362, false], ['EGP', 'Egyptian pound', 'E£', 2, 0.0062, false],
  ].map(([code, name, symbol, decimals, rate, base], i) => ({ id: 'cu_' + code, code, name, symbol, decimals, rate, rateDate: base ? '' : '2026-11-24', base, status: i === 7 ? 'Inactive' : 'Active' }));
  const financeRates = [];
  [['USD', [0.3061, 0.3065, 0.3068]], ['EUR', [0.3302, 0.3315, 0.3321]], ['GBP', [0.3880, 0.3889, 0.3894]], ['SAR', [0.0816, 0.0817, 0.0818]], ['AED', [0.0833, 0.0834, 0.0835]], ['INR', [0.00365, 0.00363, 0.00362]]].forEach(([cur, list]) =>
    list.forEach((rate, i) => financeRates.push({ id: `fx_${cur}_${i}`, code: `${cur}-${['1110', '1117', '1124'][i]}`, currency: cur, date: ['2026-11-10', '2026-11-17', '2026-11-24'][i], rate, source: 'CBK published rate (manual entry)', enteredBy: STAFF.acc, status: 'Active' })));
  const financeVoucherSeries = [
    ['JV', 'Journal voucher', 'JV-26-', 'Journal book', 'Yearly', 'Manual journals, recurring vouchers'], ['AJ', 'Auto journal', 'AJ-26-', 'Journal book', 'Yearly', 'Auto-posting from Billing, Pharmacy, MMIS'],
    ['RV', 'Receipt voucher', 'RV-26-', 'Cash book', 'Yearly', 'Cash and bank receipts'], ['PV', 'Payment voucher', 'PV-26-', 'Bank book', 'Yearly', 'Payments, refunds, petty cash'],
    ['CN', 'Credit note', 'CN-26-', 'Sales book', 'Yearly', 'Patient and insurer credit notes'], ['WO', 'Write-off', 'WO-26-', 'Journal book', 'Yearly', 'Receivable write-offs'],
    ['PB', 'Purchase bill', 'PB-26-', 'Purchase book', 'Yearly', 'Vendor bills'], ['PR', 'Payment run', 'PR-26-', 'Bank book', 'Yearly', 'Vendor payment runs'],
    ['INV', 'Patient invoice', 'INV-26-', 'Sales book', 'Yearly', 'Patient bills (shared with Reception cashier)'],
  ].map(([code, name, prefix, book, reset, use], i) => ({ id: 'vs_' + code, code, name, prefix, book, reset, use, branch: 'All', status: 'Active' }));
  const financeBanks = [
    ['bk_nbk', 'NBK-CUR', 'National Bank of Kuwait, current', 'Bank account', '1110', 'KW81NBOK0000000000001234560101', 'All', 0],
    ['bk_kfh', 'KFH-CUR', 'Kuwait Finance House, current', 'Bank account', '1120', 'KW23KFHO0000000000000987650012', 'All', 0],
    ['bk_bur', 'BUR-DEP', 'Burgan Bank, deposit', 'Bank account', '1110', 'KW55BRGN0000000000000044331100', 'All', 0],
    ['bk_kn1', 'KNET-SAL-01', 'KNET terminal, Salmiya main cashier', 'Card terminal', '1130', 'TID 30041871', 'SAL', 0.8],
    ['bk_kn2', 'KNET-SAL-ER', 'KNET terminal, Salmiya ER', 'Card terminal', '1130', 'TID 30041872', 'SAL', 0.8],
    ['bk_kn3', 'KNET-HAW-01', 'KNET terminal, Hawalli reception', 'Card terminal', '1130', 'TID 30052210', 'HAW', 0.8],
    ['bk_vm1', 'VM-SAL-01', 'Visa and Mastercard POS, Salmiya', 'Card terminal', '1140', 'MID 7720019', 'SAL', 2.2],
  ].map(([id, code, name, kind, accountCode, iban, branch, commission], i) => ({ id, code, name, kind, accountCode, iban, branch, commission, status: i === 2 ? 'Inactive' : 'Active' }));
  const financeBooks = [
    ['CB-SAL', 'Cash book, Salmiya', 'Cash book', '1010', 'RV'], ['CB-HAW', 'Cash book, Hawalli', 'Cash book', '1011', 'RV'], ['PC', 'Petty cash book', 'Cash book', '1020', 'PV'],
    ['BB-NBK', 'Bank book, NBK', 'Bank book', '1110', 'PV'], ['BB-KFH', 'Bank book, KFH', 'Bank book', '1120', 'RV'], ['SB', 'Sales book', 'Sales book', '1210', 'INV'],
    ['PUR', 'Purchase book', 'Purchase book', '2010', 'PB'], ['JB', 'Journal book', 'Journal book', '', 'JV'],
  ].map(([code, name, type, accountCode, series]) => ({ id: 'bk_' + code.toLowerCase(), code, name, type, accountCode, series, branch: code.endsWith('HAW') ? 'HAW' : 'All', status: 'Active' }));
  const financeSettings = { discountLimit: 25, writeOffLimit: 0, fy: 'FY2026' };

  Object.assign(S, { financeAccounts, financeCostCenters, financePeriods, financeJournals: journals, financeBatches, financeChargeMap, financeReceipts, financePayments, financeBills, financePayRuns,
    financeCreditNotes, financeWriteOffs, financeDiscountReqs, financeSchemes, financeArOpening, financeRecurring, financeCloseTasks, financeCloseRequests, financeCurrencies, financeRates,
    financeVoucherSeries, financeBanks, financeBooks, financeSettings });
})();
