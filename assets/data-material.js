/* Material Management (SOW V4 Module 10) seed data. Loaded after data-core.js.
 * Keys (all prefixed "material"):
 *   materialSettings      valuation method (FIFO or WAVG), match tolerances, approval levels
 *   materialCategories    Item Category master          materialUoms      UOM master
 *   materialReorder       Reorder Level (Min/Max) per item and store
 *   materialReceipts      receipt cost layers (opening stock and GRN postings), used for FIFO and weighted average
 *   materialPRs, materialPOs, materialGRNs, materialInvoices, materialReturns
 *   materialRequests, materialTransfers (type Transfer or Issue), materialCounts, materialAdjustments
 * Shared keys used: items, stock (batches by warehouse), vendors, warehouses (Administration), departments, wards. */
(function () {
  const S = window.SEED;
  const T = S.TODAY;
  const pad = (n, w) => String(n).padStart(w || 2, '0');
  const addDays = (d, n) => { const x = new Date(d + 'T00:00:00'); x.setDate(x.getDate() + n); return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}`; };
  const D = (n) => addDays(T, n);
  const it = (code) => S.items.find(x => x.code === code);
  const id = (code) => (it(code) || {}).id;
  /* First seeded batch of an item in a store (data-core stock is deterministic). */
  const bt = (code, wh) => S.stock.find(s => s.itemId === id(code) && s.warehouseId === (wh || 'wh_01')) || {};
  const line = (code, qty, price, extra) => Object.assign({ id: 'ln_' + code.replace('-', '').toLowerCase(), itemId: id(code), qty, price: price != null ? price : it(code).cost }, extra || {});

  const materialSettings = {
    valuation: 'FIFO',            // FIFO or WAVG (configurable; both are always computed)
    priceTolPct: 2,               // invoice price tolerance per line, percent
    qtyTolPct: 0,                 // invoice quantity tolerance per line, percent
    amtTol: 5,                    // total invoice tolerance, KWD
    prLevels: [
      { level: 1, name: 'Head of department', from: 0 },
      { level: 2, name: 'Supply chain manager', from: 500 },
      { level: 3, name: 'Medical director', from: 5000 },
    ],
    poLevels: [
      { level: 1, name: 'Procurement manager', from: 0 },
      { level: 2, name: 'Finance controller', from: 2000 },
    ],
  };

  const materialCategories = [
    ['MED', 'Medicines', 'Drug', '510100', true, true], ['CON', 'Medical consumables', 'Consumable', '510200', true, false], ['SUR', 'Surgical supplies', 'Consumable', '510210', true, true],
    ['REA', 'Laboratory reagents', 'Reagent', '510300', true, true], ['GEN', 'General supplies', 'General', '520100', false, false], ['STA', 'Stationery and printing', 'General', '520110', false, false],
    ['LIN', 'Linen and uniforms', 'General', '520200', false, false], ['CLN', 'Cleaning and housekeeping', 'General', '520300', false, false],
  ].map(([code, name, itemType, glAccount, batchTracked, expiryTracked], i) => ({ id: 'mcat_' + pad(i + 1), code, name, itemType, glAccount, batchTracked, expiryTracked, status: 'Active' }));

  const materialUoms = [
    ['EA', 'Each', 'Each', 1], ['TAB', 'Tablet', 'Tablet', 1], ['STRIP', 'Strip of 10', 'Tablet', 10], ['VIAL', 'Vial', 'Vial', 1],
    ['BOX', 'Box', 'Each', 1], ['BOX100', 'Box of 100', 'Each', 100], ['PACK', 'Pack', 'Each', 1], ['KIT', 'Kit', 'Each', 1], ['REAM', 'Ream (500 sheets)', 'Sheet', 500], ['CTN', 'Carton of 12 boxes', 'Box', 12],
  ].map(([code, name, baseUom, factor], i) => ({ id: 'muom_' + pad(i + 1), code, name, baseUom, factor, status: 'Active' }));

  /* Reorder levels per store. Some are set just above the current stock so the demo shows alerts. */
  const onHand = (code, wh) => S.stock.filter(s => s.itemId === id(code) && s.warehouseId === wh).reduce((n, s) => n + s.qty, 0);
  const rl = [
    ['CON-001', 'wh_04', 150, 600], ['CON-002', 'wh_04', 80, 300], ['CON-009', 'wh_04', 60, 240], ['CON-004', 'wh_04', 30, 120], ['CON-003', 'wh_04', 20, 80],
    ['DRG-014', 'wh_02', 120, 500], ['DRG-013', 'wh_02', 80, 300], ['DRG-010', 'wh_03', 20, 80], ['DRG-007', 'wh_03', 300, 1200],
    ['CON-005', 'wh_01', null, null], ['DRG-011', 'wh_01', null, null], ['GEN-002', 'wh_01', null, null],
  ];
  const materialReorder = rl.map(([code, wh, min, max], i) => {
    const q = onHand(code, wh);
    // Unset levels are placed so that the current stock is just below the minimum (a live reorder alert).
    const mn = min != null ? Math.max(min, i % 3 === 0 ? q + 15 : min) : Math.max(50, Math.round(q * 1.2));
    const mx = max != null ? Math.max(max, mn * 3) : mn * 3;
    const w = S.warehouses.find(x => x.id === wh);
    return { id: 'mrl_' + pad(i + 1), code: 'RL-' + pad(i + 1, 3), item: code, store: w.name, min: mn, max: mx, reorderQty: mx - mn, leadDays: [7, 10, 14, 21][i % 4], status: 'Active' };
  });

  /* Receipt cost layers: one per seeded batch (opening stock) plus older consumed receipts.
   * FIFO values each batch at its own receipt price; weighted average uses all receipts of the item. */
  const materialReceipts = [];
  S.stock.forEach((s, i) => {
    const f = 0.93 + ((i * 37) % 15) / 100;            // 0.93 .. 1.07
    materialReceipts.push({ id: 'mrc_' + pad(i + 1, 4), date: D(-40 - (i % 90)), itemId: s.itemId, warehouseId: s.warehouseId, batch: s.batch, qty: s.qty + (i % 4) * 40, price: Math.round(s.cost * f * 1000) / 1000, source: 'Opening balance' });
  });
  S.items.forEach((x, i) => {
    materialReceipts.push({ id: 'mrc_h' + pad(i + 1, 3), date: D(-150 - i), itemId: x.id, warehouseId: 'wh_01', batch: x.code.split('-')[0] + '2504-' + pad(10 + i), qty: 100 + (i % 5) * 60, price: Math.round(x.cost * (0.88 + (i % 6) / 50) * 1000) / 1000, source: 'GRN (consumed)' });
  });

  const ap = (level, by, at, note) => ({ level, by, at, decision: 'Approved', note: note || '' });

  const materialPRs = [
    { id: 'mpr_01', no: 'PR-26-1041', date: D(-22), deptId: 'dp_05', warehouseId: 'wh_01', priority: 'Routine', needBy: D(-10), justification: 'Monthly replenishment of ward consumables for Main Store.', createdBy: 'Rajesh Kumar', createdAt: D(-22) + ' 09:15', status: 'PO raised', poNo: 'PO-26-2051',
      approvals: [ap(1, 'Sara Al-Mutairi', D(-21) + ' 11:02'), ap(2, 'Omar Haddad', D(-21) + ' 15:40')], lines: [line('CON-003', 200, 2.2), line('CON-005', 150, 1.5), line('CON-002', 1000, 0.35)] },
    { id: 'mpr_02', no: 'PR-26-1042', date: D(-13), deptId: 'dp_04', warehouseId: 'wh_01', priority: 'Urgent', needBy: D(3), justification: 'Antibiotic and anticoagulant cover for winter admissions.', createdBy: 'Ahmed Farouk', createdAt: D(-13) + ' 10:20', status: 'PO raised', poNo: 'PO-26-2053',
      approvals: [ap(1, 'Dr. Khalid Al-Rashidi', D(-12) + ' 08:45'), ap(2, 'Sara Al-Mutairi', D(-11) + ' 09:30')], lines: [line('DRG-013', 500, 1.8), line('DRG-012', 200, 3.4)] },
    { id: 'mpr_03', no: 'PR-26-1043', date: D(-5), deptId: 'dp_03', warehouseId: 'wh_04', priority: 'Routine', needBy: D(9), justification: 'Ward 3 dressing and catheter stock below minimum.', createdBy: 'Maria Santos', createdAt: D(-5) + ' 07:50', status: 'Pending approval',
      approvals: [], lines: [line('CON-009', 300, 0.25), line('CON-010', 80, 0.9), line('CON-004', 60, 1.1)] },
    { id: 'mpr_04', no: 'PR-26-1044', date: D(-3), deptId: 'dp_06', warehouseId: 'wh_01', priority: 'Routine', needBy: D(14), justification: 'Haematology and chemistry reagents for December runs.', createdBy: 'Bilal Qureshi', createdAt: D(-3) + ' 12:05', status: 'Pending approval',
      approvals: [ap(1, 'Hassan Bukhari', D(-2) + ' 10:10', 'Volumes checked against November workload.')], lines: [line('REA-001', 6, 85), line('REA-002', 4, 140)] },
    { id: 'mpr_05', no: 'PR-26-1045', date: D(-1), deptId: 'dp_04', warehouseId: 'wh_01', priority: 'Routine', needBy: D(12), justification: 'Insulin pens for diabetic clinic, three months cover.', createdBy: 'Hospital Demo', createdAt: D(-1) + ' 14:30', status: 'Pending approval',
      approvals: [], lines: [line('DRG-011', 100, 9.5)] },
    { id: 'mpr_06', no: 'PR-26-1046', date: D(-1), deptId: 'dp_05', warehouseId: 'wh_01', priority: 'Routine', needBy: D(10), justification: 'Stationery and patient wristbands.', createdBy: 'Rajesh Kumar', createdAt: D(-1) + ' 09:00', status: 'Approved',
      approvals: [ap(1, 'Sara Al-Mutairi', D(0) + ' 08:20')], lines: [line('GEN-001', 120, 1.3), line('GEN-002', 3000, 0.04)] },
    { id: 'mpr_07', no: 'PR-26-1047', date: D(0), deptId: 'dp_02', warehouseId: 'wh_03', priority: 'Routine', needBy: D(14), justification: 'Paediatric syrup stock for outpatient pharmacy.', createdBy: 'Layla Hussain', createdAt: D(0) + ' 08:10', status: 'Draft',
      approvals: [], lines: [line('DRG-024', 120, 1.2)] },
    { id: 'mpr_08', no: 'PR-26-1039', date: D(-28), deptId: 'dp_04', warehouseId: 'wh_01', priority: 'Routine', needBy: D(-14), justification: 'Paracetamol tablets top-up.', createdBy: 'Ahmed Farouk', createdAt: D(-28) + ' 11:00', status: 'Rejected',
      approvals: [{ level: 1, by: 'Sara Al-Mutairi', at: D(-27) + ' 10:00', decision: 'Rejected', note: 'Duplicate of PR-26-1036; stock already on order.' }], lines: [line('DRG-007', 4000, 0.02)] },
    { id: 'mpr_09', no: 'PR-26-1048', date: D(0), deptId: 'dp_03', warehouseId: 'wh_01', priority: 'Urgent', needBy: D(2), justification: 'IV fluids, surge in ER admissions.', createdBy: 'Maria Santos', createdAt: D(0) + ' 07:35', status: 'Pending approval',
      approvals: [], lines: [line('DRG-014', 400, 0.9)] },
    { id: 'mpr_10', no: 'PR-26-1040', date: D(-24), deptId: 'dp_01', warehouseId: 'wh_01', priority: 'Routine', needBy: D(-10), justification: 'Cardiology clinic aspirin stock.', createdBy: 'Dr. Khalid Al-Rashidi', createdAt: D(-24) + ' 13:00', status: 'Cancelled', cancelReason: 'Raised under the wrong department.',
      approvals: [], lines: [line('DRG-020', 2000, 0.03)] },
    { id: 'mpr_11', no: 'PR-26-1038', date: D(-6), deptId: 'dp_04', warehouseId: 'wh_01', priority: 'Routine', needBy: D(8), justification: 'Cardiovascular tablets, reorder alert.', createdBy: 'Ahmed Farouk', createdAt: D(-6) + ' 09:40', status: 'Approved',
      approvals: [ap(1, 'Dr. Khalid Al-Rashidi', D(-5) + ' 12:00')], lines: [line('DRG-001', 2000, 0.12), line('DRG-019', 1500, 0.14)] },
  ];

  const rcv = (l, n) => Object.assign(l, { received: n });
  const materialPOs = [
    { id: 'mpo_01', no: 'PO-26-2051', date: D(-20), vendorId: 'vn_01', prIds: ['mpr_01'], warehouseId: 'wh_01', deliveryDate: D(-10), paymentTerms: 30, deliveryTerms: 'Delivered to store (DDP)', notes: '', createdBy: 'Fatima Al-Kandari', createdAt: D(-20) + ' 10:00', status: 'Received',
      approvals: [ap(1, 'Sara Al-Mutairi', D(-20) + ' 13:00')], lines: [rcv(line('CON-003', 200, 2.2), 200), rcv(line('CON-005', 150, 1.5), 150), rcv(line('CON-002', 1000, 0.35), 1000)] },
    { id: 'mpo_02', no: 'PO-26-2052', date: D(-15), vendorId: 'vn_02', prIds: [], warehouseId: 'wh_01', deliveryDate: D(-5), paymentTerms: 60, deliveryTerms: 'Delivered to store (DDP)', notes: 'Direct PO against annual rate contract RC-2026-014.', createdBy: 'Fatima Al-Kandari', createdAt: D(-15) + ' 09:30', status: 'Partially received',
      approvals: [ap(1, 'Sara Al-Mutairi', D(-15) + ' 12:10')], lines: [rcv(line('DRG-007', 5000, 0.02), 5000), rcv(line('DRG-004', 2000, 0.1), 1000), rcv(line('DRG-009', 1500, 0.15), 0)] },
    { id: 'mpo_03', no: 'PO-26-2053', date: D(-10), vendorId: 'vn_07', prIds: ['mpr_02'], warehouseId: 'wh_01', deliveryDate: D(3), paymentTerms: 60, deliveryTerms: 'Delivered to store (DDP)', notes: '', createdBy: 'Fatima Al-Kandari', createdAt: D(-10) + ' 11:00', status: 'Partially received',
      approvals: [ap(1, 'Sara Al-Mutairi', D(-10) + ' 14:20')], lines: [rcv(line('DRG-013', 500, 1.75), 300), rcv(line('DRG-012', 200, 3.35), 0)] },
    { id: 'mpo_04', no: 'PO-26-2054', date: D(-2), vendorId: 'vn_04', prIds: [], warehouseId: 'wh_01', deliveryDate: D(12), paymentTerms: 45, deliveryTerms: 'Delivered to laboratory, cold chain', notes: 'Cold chain 2 to 8 C.', createdBy: 'Fatima Al-Kandari', createdAt: D(-2) + ' 10:40', status: 'Pending approval',
      approvals: [], lines: [rcv(line('REA-001', 6, 85), 0), rcv(line('REA-002', 4, 140), 0)] },
    { id: 'mpo_05', no: 'PO-26-2055', date: D(-1), vendorId: 'vn_08', prIds: [], warehouseId: 'wh_01', deliveryDate: D(7), paymentTerms: 30, deliveryTerms: 'Delivered to store (DDP)', notes: '', createdBy: 'Hospital Demo', createdAt: D(-1) + ' 16:00', status: 'Pending approval',
      approvals: [], lines: [rcv(line('CON-001', 5000, 0.05), 0), rcv(line('CON-006', 2000, 0.08), 0), rcv(line('CON-007', 3000, 0.07), 0), rcv(line('CON-008', 3000, 0.09), 0)] },
    { id: 'mpo_06', no: 'PO-26-2056', date: D(0), vendorId: 'vn_03', prIds: [], warehouseId: 'wh_01', deliveryDate: D(10), paymentTerms: 45, deliveryTerms: 'Delivered to store (DDP)', notes: '', createdBy: 'Fatima Al-Kandari', createdAt: D(0) + ' 09:10', status: 'Draft',
      approvals: [], lines: [rcv(line('DRG-025', 1000, 0.18), 0)] },
    { id: 'mpo_07', no: 'PO-26-2050', date: D(-26), vendorId: 'vn_05', prIds: [], warehouseId: 'wh_01', deliveryDate: D(-19), paymentTerms: 30, deliveryTerms: 'Delivered to store (DDP)', notes: '', createdBy: 'Fatima Al-Kandari', createdAt: D(-26) + ' 10:00', status: 'Cancelled', cancelReason: 'Vendor could not meet the delivery date.',
      approvals: [ap(1, 'Sara Al-Mutairi', D(-26) + ' 12:00')], lines: [rcv(line('GEN-001', 300, 1.25), 0)] },
    { id: 'mpo_08', no: 'PO-26-2049', date: D(-36), vendorId: 'vn_02', prIds: [], warehouseId: 'wh_01', deliveryDate: D(-28), paymentTerms: 60, deliveryTerms: 'Delivered to store (DDP)', notes: '', createdBy: 'Fatima Al-Kandari', createdAt: D(-36) + ' 09:00', status: 'Closed',
      approvals: [ap(1, 'Sara Al-Mutairi', D(-36) + ' 11:00')], lines: [rcv(line('DRG-002', 3000, 0.06), 3000), rcv(line('DRG-003', 2000, 0.24), 2000)] },
    { id: 'mpo_09', no: 'PO-26-2057', date: D(-4), vendorId: 'vn_01', prIds: [], warehouseId: 'wh_01', deliveryDate: D(6), paymentTerms: 30, deliveryTerms: 'Delivered to store (DDP)', notes: 'Quarterly gloves and gauze contract call-off.', createdBy: 'Fatima Al-Kandari', createdAt: D(-4) + ' 13:15', status: 'Pending approval',
      approvals: [ap(1, 'Sara Al-Mutairi', D(-3) + ' 09:05')], lines: [rcv(line('CON-003', 1000, 2.15), 0), rcv(line('CON-004', 500, 1.1), 0)] },
  ];

  const gl = (code, qty, cost, wh) => { const b = bt(code, wh); return { lineId: 'ln_' + code.replace('-', '').toLowerCase(), itemId: id(code), qty, batch: b.batch, expiry: b.expiry, cost }; };
  const materialGRNs = [
    { id: 'mgr_01', no: 'GRN-26-3071', date: D(-11), poId: 'mpo_01', vendorId: 'vn_01', warehouseId: 'wh_01', deliveryNote: 'AMS-DN-55120', status: 'Posted', receivedBy: 'Rajesh Kumar', postedBy: 'Rajesh Kumar', postedAt: D(-11) + ' 11:40',
      lines: [gl('CON-003', 200, 2.2), gl('CON-005', 150, 1.5), gl('CON-002', 1000, 0.35)] },
    { id: 'mgr_02', no: 'GRN-26-3072', date: D(-7), poId: 'mpo_02', vendorId: 'vn_02', warehouseId: 'wh_01', deliveryNote: 'GPD-DN-90871', status: 'Posted', receivedBy: 'Rajesh Kumar', postedBy: 'Rajesh Kumar', postedAt: D(-7) + ' 10:15',
      lines: [gl('DRG-007', 5000, 0.02), gl('DRG-004', 1000, 0.1)] },
    { id: 'mgr_03', no: 'GRN-26-3068', date: D(-30), poId: 'mpo_08', vendorId: 'vn_02', warehouseId: 'wh_01', deliveryNote: 'GPD-DN-89002', status: 'Posted', receivedBy: 'Rajesh Kumar', postedBy: 'Rajesh Kumar', postedAt: D(-30) + ' 12:00',
      lines: [gl('DRG-002', 3000, 0.06), gl('DRG-003', 2000, 0.24)] },
    { id: 'mgr_04', no: 'GRN-26-3073', date: D(0), poId: 'mpo_03', vendorId: 'vn_07', warehouseId: 'wh_01', deliveryNote: 'YMC-DN-7781', status: 'Posted', receivedBy: 'Rajesh Kumar', postedBy: 'Rajesh Kumar', postedAt: D(0) + ' 08:50',
      lines: [gl('DRG-013', 300, 1.75)] },
    { id: 'mgr_05', no: 'GRN-26-3074', date: D(0), poId: 'mpo_02', vendorId: 'vn_02', warehouseId: 'wh_01', deliveryNote: 'GPD-DN-91230', status: 'Draft', receivedBy: 'Rajesh Kumar', postedBy: '', postedAt: '',
      lines: [{ lineId: 'ln_drg009', itemId: id('DRG-009'), qty: 1500, batch: 'DRG2611-42', expiry: D(700), cost: 0.15 }] },
  ];

  const il = (code, qty, price) => ({ lineId: 'ln_' + code.replace('-', '').toLowerCase(), itemId: id(code), qty, price });
  const materialInvoices = [
    { id: 'mvi_01', no: 'VIN-26-501', vendorInvNo: 'AMS/INV/88231', vendorId: 'vn_01', poId: 'mpo_01', grnIds: ['mgr_01'], date: D(-9), dueDate: D(21), createdBy: 'Fatima Al-Kandari', createdAt: D(-9) + ' 10:00', status: 'Pending',
      lines: [il('CON-003', 200, 2.2), il('CON-005', 150, 1.5), il('CON-002', 1000, 0.35)] },
    { id: 'mvi_02', no: 'VIN-26-502', vendorInvNo: 'GPD-114502', vendorId: 'vn_02', poId: 'mpo_02', grnIds: ['mgr_02'], date: D(-5), dueDate: D(55), createdBy: 'Fatima Al-Kandari', createdAt: D(-5) + ' 11:30', status: 'Pending',
      lines: [il('DRG-007', 5000, 0.021), il('DRG-004', 1000, 0.1)] },
    { id: 'mvi_03', no: 'VIN-26-499', vendorInvNo: 'GPD-113877', vendorId: 'vn_02', poId: 'mpo_08', grnIds: ['mgr_03'], date: D(-28), dueDate: D(32), createdBy: 'Fatima Al-Kandari', createdAt: D(-28) + ' 09:00', status: 'Approved', approvedBy: 'Sara Al-Mutairi', approvedAt: D(-27) + ' 10:00',
      lines: [il('DRG-002', 3000, 0.06), il('DRG-003', 2000, 0.24)] },
    { id: 'mvi_04', no: 'VIN-26-503', vendorInvNo: 'YMC/26/7781', vendorId: 'vn_07', poId: 'mpo_03', grnIds: ['mgr_04'], date: D(0), dueDate: D(60), createdBy: 'Fatima Al-Kandari', createdAt: D(0) + ' 10:30', status: 'On hold', holdReason: 'Vendor invoiced 320 vials, 300 received. Credit note requested.',
      lines: [il('DRG-013', 320, 1.75)] },
  ];

  const rlx = (code, qty, wh) => { const b = bt(code, wh); return { stockId: b.id, itemId: id(code), batch: b.batch, expiry: b.expiry, qty, cost: b.cost }; };
  const materialReturns = [
    { id: 'mrt_01', no: 'PRN-26-401', date: D(-6), vendorId: 'vn_01', grnId: 'mgr_01', warehouseId: 'wh_01', reason: 'Damaged in transit', note: 'Crushed cartons on pallet 2.', status: 'Approved', debitNote: 'DN-26-401', createdBy: 'Rajesh Kumar', createdAt: D(-6) + ' 09:30', approvedBy: 'Sara Al-Mutairi', approvedAt: D(-6) + ' 12:00',
      lines: [rlx('CON-005', 20)] },
    { id: 'mrt_02', no: 'PRN-26-402', date: D(-1), vendorId: 'vn_02', grnId: 'mgr_02', warehouseId: 'wh_01', reason: 'Quality issue', note: 'Broken blister seals found at put-away.', status: 'Pending approval', debitNote: '', createdBy: 'Rajesh Kumar', createdAt: D(-1) + ' 15:10',
      lines: [rlx('DRG-004', 50)] },
    { id: 'mrt_03', no: 'PRN-26-400', date: D(-17), vendorId: 'vn_03', grnId: '', warehouseId: 'wh_01', reason: 'Near expiry', note: 'Under 3 months shelf life on receipt.', status: 'Approved', debitNote: 'DN-26-400', createdBy: 'Rajesh Kumar', createdAt: D(-17) + ' 10:00', approvedBy: 'Sara Al-Mutairi', approvedAt: D(-16) + ' 09:00',
      lines: [rlx('DRG-021', 40)] },
  ];

  const ml = (code, qty, approvedQty, issuedQty) => ({ itemId: id(code), qty, approvedQty: approvedQty != null ? approvedQty : null, issuedQty: issuedQty || 0 });
  const materialRequests = [
    { id: 'mmr_01', no: 'MR-26-5101', date: D(0), at: D(0) + ' 08:40', reqType: 'Ward', wardId: 'wd_01', deptId: 'dp_03', forWarehouseId: 'wh_04', fromWarehouseId: 'wh_01', priority: 'Routine', requestedBy: 'Maria Santos', status: 'Pending approval', note: 'Weekly top-up for Ward 3 sub store.',
      lines: [ml('CON-001', 200), ml('CON-002', 100), ml('CON-009', 80)] },
    { id: 'mmr_02', no: 'MR-26-5100', date: D(-1), at: D(-1) + ' 13:20', reqType: 'Ward', wardId: 'wd_02', deptId: 'dp_03', forWarehouseId: null, fromWarehouseId: 'wh_01', priority: 'Urgent', requestedBy: 'Anjali Menon', status: 'Approved', approvedBy: 'Rajesh Kumar', approvedAt: D(-1) + ' 14:05', note: 'Post-operative dressings.',
      lines: [ml('CON-004', 20, 20), ml('CON-003', 10, 8), ml('CON-010', 15, 15)] },
    { id: 'mmr_03', no: 'MR-26-5099', date: D(-2), at: D(-2) + ' 09:10', reqType: 'Department', wardId: null, deptId: 'dp_06', forWarehouseId: null, fromWarehouseId: 'wh_01', priority: 'Routine', requestedBy: 'Bilal Qureshi', status: 'Issued', approvedBy: 'Rajesh Kumar', approvedAt: D(-2) + ' 10:00', note: 'Sample tubes for phlebotomy.',
      lines: [ml('CON-007', 500, 500, 500), ml('CON-008', 500, 500, 500)] },
    { id: 'mmr_04', no: 'MR-26-5098', date: D(-3), at: D(-3) + ' 07:55', reqType: 'Ward', wardId: 'wd_04', deptId: 'dp_03', forWarehouseId: null, fromWarehouseId: 'wh_01', priority: 'Urgent', requestedBy: 'Grace Fernandes', status: 'Partially issued', approvedBy: 'Rajesh Kumar', approvedAt: D(-3) + ' 08:30', note: '',
      lines: [ml('CON-002', 200, 200, 150), ml('DRG-022', 50, 50, 50)] },
    { id: 'mmr_05', no: 'MR-26-5097', date: D(-4), at: D(-4) + ' 11:00', reqType: 'Department', wardId: null, deptId: 'dp_05', forWarehouseId: null, fromWarehouseId: 'wh_01', priority: 'Routine', requestedBy: 'Layla Hussain', status: 'Rejected', rejectReason: 'Quarterly stationery quota already issued.', approvedBy: 'Rajesh Kumar', approvedAt: D(-4) + ' 12:00', note: '',
      lines: [ml('GEN-001', 200)] },
    { id: 'mmr_06', no: 'MR-26-5102', date: D(0), at: D(0) + ' 09:25', reqType: 'Ward', wardId: 'wd_03', deptId: 'dp_02', forWarehouseId: null, fromWarehouseId: 'wh_01', priority: 'Urgent', requestedBy: 'Hospital Demo', status: 'Pending approval', note: 'Fever clinic surge.',
      lines: [ml('DRG-024', 30), ml('CON-006', 50)] },
    { id: 'mmr_07', no: 'MR-26-5096', date: D(-5), at: D(-5) + ' 10:00', reqType: 'Ward', wardId: 'wd_01', deptId: 'dp_03', forWarehouseId: 'wh_04', fromWarehouseId: 'wh_01', priority: 'Routine', requestedBy: 'Maria Santos', status: 'Cancelled', cancelReason: 'Raised twice by mistake.', note: '',
      lines: [ml('CON-005', 10)] },
  ];

  const tl = (code, qty, wh, recv) => { const b = bt(code, wh); return { itemId: id(code), stockId: b.id, batch: b.batch, expiry: b.expiry, qty, cost: b.cost, recvQty: recv != null ? recv : null }; };
  const materialTransfers = [
    { id: 'mtr_01', no: 'TRF-26-6201', type: 'Transfer', date: D(-1), fromWh: 'wh_01', toWh: 'wh_04', deptId: null, mrId: null, status: 'In transit', note: 'Sub store replenishment.', createdBy: 'Rajesh Kumar', dispatchedBy: 'Rajesh Kumar', dispatchedAt: D(-1) + ' 16:10',
      lines: [tl('CON-001', 300, 'wh_01'), tl('CON-005', 20, 'wh_01')] },
    { id: 'mtr_02', no: 'TRF-26-6200', type: 'Transfer', date: D(-5), fromWh: 'wh_01', toWh: 'wh_02', deptId: null, mrId: null, status: 'Received', note: '', createdBy: 'Rajesh Kumar', dispatchedBy: 'Rajesh Kumar', dispatchedAt: D(-5) + ' 10:00', receivedBy: 'Ahmed Farouk', receivedAt: D(-5) + ' 11:30',
      lines: [tl('DRG-013', 100, 'wh_01', 100), tl('DRG-014', 200, 'wh_01', 200)] },
    { id: 'mtr_03', no: 'TRF-26-6202', type: 'Transfer', date: D(0), fromWh: 'wh_02', toWh: 'wh_03', deptId: null, mrId: null, status: 'Draft', note: 'Balance OPD paracetamol.', createdBy: 'Ahmed Farouk',
      lines: [tl('DRG-007', 500, 'wh_02')] },
    { id: 'mtr_04', no: 'GI-26-7101', type: 'Issue', date: D(-2), fromWh: 'wh_01', toWh: null, deptId: 'dp_06', mrId: 'mmr_03', status: 'Issued', note: '', createdBy: 'Rajesh Kumar', dispatchedBy: 'Rajesh Kumar', dispatchedAt: D(-2) + ' 11:00', receivedBy: 'Bilal Qureshi', receivedAt: D(-2) + ' 11:20',
      lines: [tl('CON-007', 500, 'wh_01'), tl('CON-008', 500, 'wh_01')] },
    { id: 'mtr_05', no: 'GI-26-7100', type: 'Issue', date: D(-3), fromWh: 'wh_01', toWh: null, deptId: 'dp_03', wardId: 'wd_04', mrId: 'mmr_04', status: 'Issued', note: 'Short issue: 50 cannulas back-ordered.', createdBy: 'Rajesh Kumar', dispatchedBy: 'Rajesh Kumar', dispatchedAt: D(-3) + ' 09:00', receivedBy: 'Grace Fernandes', receivedAt: D(-3) + ' 09:40',
      lines: [tl('CON-002', 150, 'wh_01'), tl('DRG-022', 50, 'wh_01')] },
  ];

  /* Stock counts: lines built from the seeded batches of the store. */
  const cl = (filter, wh, vary) => S.stock.filter(s => s.warehouseId === wh && filter(S.items.find(x => x.id === s.itemId))).map((s, i) => ({ stockId: s.id, itemId: s.itemId, batch: s.batch, expiry: s.expiry, system: s.qty, counted: vary ? s.qty + vary(i) : null, cost: s.cost }));
  const c1 = cl(x => x.type === 'Consumable', 'wh_01', (i) => [0, -4, 0, 2, 0, -10, 0, 0, -1, 0][i % 10]).slice(0, 10);
  const c2 = cl(x => /Analgesic|NSAID|Antihistamine/.test(x.category), 'wh_01', (i) => [0, -12, 0, 5, -3, 0][i % 6]);
  const c3 = cl(() => true, 'wh_04', null);
  const materialCounts = [
    { id: 'msc_01', no: 'SC-26-801', warehouseId: 'wh_01', date: D(-25), scope: 'Medical consumables', blind: true, status: 'Posted', createdBy: 'Rajesh Kumar', submittedAt: D(-25) + ' 17:00', approvedBy: 'Sara Al-Mutairi', approvedAt: D(-24) + ' 09:30', reason: 'Month-end cycle count', lines: c1 },
    { id: 'msc_02', no: 'SC-26-802', warehouseId: 'wh_01', date: D(-1), scope: 'Analgesics and antihistamines', blind: true, status: 'Pending approval', createdBy: 'Rajesh Kumar', submittedAt: D(-1) + ' 18:10', reason: 'Cycle count, high-movement items', lines: c2 },
    { id: 'msc_03', no: 'SC-26-803', warehouseId: 'wh_04', date: D(0), scope: 'All items', blind: true, status: 'Counting', createdBy: 'Maria Santos', reason: 'Ward 3 sub store monthly count', lines: c3 },
  ];
  const materialAdjustments = c1.filter(l => l.counted !== l.system).map((l, i) => ({ id: 'mad_' + pad(i + 1), no: 'ADJ-26-' + (901 + i), date: D(-24), countId: 'msc_01', warehouseId: 'wh_01', itemId: l.itemId, batch: l.batch, qty: l.counted - l.system, cost: l.cost, reason: 'Stock count SC-26-801', by: 'Sara Al-Mutairi' }));

  Object.assign(S, { materialSettings, materialCategories, materialUoms, materialReorder, materialReceipts, materialPRs, materialPOs, materialGRNs, materialInvoices, materialReturns, materialRequests, materialTransfers, materialCounts, materialAdjustments });
})();
