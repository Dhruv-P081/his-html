/* Pharmacy helpers shared by the pharmacy pages (window.Pharmacy). Load after kit.js. */
(function () {
  const { db, save, esc, icon, me, nowStamp, audit } = window.UI;
  const K = window.Kit;
  const T = db.TODAY;
  const WH = { OPD: 'wh_03', IPD: 'wh_02' };
  const WH_NAME = { wh_02: 'Inpatient Pharmacy', wh_03: 'Outpatient Pharmacy', wh_01: 'Main Store' };

  /* Right-align table headers over numeric columns (UI.table only sets the class on the cells). */
  (function alignNumHeads() {
    const fix = () => document.querySelectorAll('table.tbl').forEach(t => {
      const row = t.tBodies[0] && [...t.tBodies[0].rows].find(r => r.cells.length > 1); const head = t.tHead && t.tHead.rows[0];
      if (!row || !head || head.cells.length !== row.cells.length) return;
      [...row.cells].forEach((td, i) => { const on = td.classList.contains('num'); if (head.cells[i].classList.contains('num') !== on) head.cells[i].classList.toggle('num', on); });
    });
    new MutationObserver(fix).observe(document.documentElement, { childList: true, subtree: true });
  })();

  /* Generic-equivalent products live in the shared item and stock lists (Pharmacy co-owns them). */
  (function ensure() {
    let changed = false;
    (db.pharmacyExtraItems || []).forEach(it => { if (!db.items.some(x => x.id === it.id)) { db.items.push(JSON.parse(JSON.stringify(it))); changed = true; } });
    (db.pharmacyExtraStock || []).forEach(s => { if (!db.stock.some(x => x.id === s.id)) { db.stock.push(JSON.parse(JSON.stringify(s))); changed = true; } });
    if (changed) save();
  })();

  const pad = (n) => String(n).padStart(2, '0');
  /* Prototype clock: the prototype day with the real time of day. */
  function now() { return T + ' ' + nowStamp().slice(11, 16); }
  function minsBetween(a, b) { if (!a || !b) return 0; return Math.round((new Date(b.replace(' ', 'T')) - new Date(a.replace(' ', 'T'))) / 60000); }
  function waitMins(from) { return Math.max(0, minsBetween(from, now())); }
  function waitLabel(m) { return m < 60 ? m + ' min' : Math.floor(m / 60) + ' h ' + pad(m % 60) + ' min'; }
  function waitCell(m, warnAt) { warnAt = warnAt || 30; const tone = m >= warnAt * 2 ? 'b-err' : m >= warnAt ? 'b-warn' : 'b-ok'; return `<span class="badge ${tone} nodot">${icon('clock')} ${waitLabel(m)}</span>`; }
  const daysTo = (d) => Math.round((new Date(d + 'T00:00:00') - new Date(T + 'T00:00:00')) / 864e5);

  /* ---------- Stock (batch and expiry controlled) ---------- */
  function usableBatches(itemId, wh) {
    return db.stock.filter(s => s.itemId === itemId && s.warehouseId === wh && Number(s.qty) > 0 && s.expiry > T).sort((a, b) => a.expiry.localeCompare(b.expiry));
  }
  function available(itemId, wh) { return usableBatches(itemId, wh).reduce((n, s) => n + Number(s.qty), 0); }
  /* Earliest expiry first, never from an expired batch. */
  function allocate(itemId, wh, qty) {
    let left = Number(qty) || 0; const picks = [];
    usableBatches(itemId, wh).forEach(s => { if (left <= 0) return; const q = Math.min(left, Number(s.qty)); picks.push({ stockId: s.id, batch: s.batch, expiry: s.expiry, qty: q }); left -= q; });
    return { picks, short: Math.max(0, left) };
  }
  function deduct(picks) { picks.forEach(p => { const s = db.stock.find(x => x.id === p.stockId); if (s) s.qty = Math.max(0, Number(s.qty) - p.qty); }); }
  function restock(stockId, qty) { const s = db.stock.find(x => x.id === stockId); if (s) s.qty = Number(s.qty) + Number(qty); return !!s; }
  function batchText(picks) { return picks.map(p => `${p.batch} (exp ${K.day(p.expiry)}) x ${p.qty}`).join(', '); }

  /* ---------- Masters lookups ---------- */
  const item = K.item;
  function category(it) { return (db.pharmacyCategories || []).find(c => c.name === (it || {}).category); }
  function isOtc(it) { const c = category(it); return !!(it && it.type === 'Drug' && !it.schedule && c && c.otc && it.status !== 'Inactive'); }
  function isControlled(it) { return !!(it && it.schedule); }
  function itemByCode(code) { return db.items.find(x => x.code === code); }
  /* Substitutes for an item from the Substitution Mapping master. */
  function substitutes(itemId) {
    const it = item(itemId); if (!it) return [];
    const out = [];
    (db.pharmacySubstitutions || []).filter(m => m.status !== 'Inactive').forEach(m => {
      if (m.fromCode === it.code) { const t = itemByCode(m.toCode); if (t) out.push({ item: t, map: m }); }
      else if (m.twoWay && m.toCode === it.code) { const t = itemByCode(m.fromCode); if (t) out.push({ item: t, map: m }); }
    });
    return out;
  }
  function itemLabel(it) { return it ? `${it.brand ? it.brand + ' · ' : ''}${it.name}` : ''; }

  /* ---------- Clinical checks ---------- */
  const ALLERGY = {
    'Penicillin': { generics: ['Amoxicillin', 'Amoxicillin/Clavulanate'], hard: true, cross: ['Ceftriaxone'] },
    'Cephalosporins': { generics: ['Ceftriaxone'], hard: true },
    'Sulfa drugs': { generics: [], cross: ['Furosemide'] },
    'Aspirin': { generics: ['Aspirin'], hard: true, cross: ['Ibuprofen'] },
    'NSAIDs': { generics: ['Ibuprofen', 'Aspirin'], hard: true },
    'Codeine': { generics: [], cross: ['Morphine sulfate', 'Tramadol'] },
    'Morphine': { generics: ['Morphine sulfate'], hard: true, cross: ['Tramadol'] },
  };
  function allergyAlerts(p, it) {
    const out = [];
    if (!p || !it) return out;
    (p.allergies || []).forEach(a => {
      const r = ALLERGY[a]; if (!r) return;
      if (r.generics.includes(it.generic)) out.push({ level: r.hard ? 'err' : 'warn', text: `${it.generic}: patient is allergic to ${a}.` });
      else if ((r.cross || []).includes(it.generic)) out.push({ level: 'warn', text: `${it.generic}: possible cross-sensitivity with ${a} allergy.` });
    });
    return out;
  }
  /* Same generic supplied in the last 30 days, or another active order for the same generic. */
  function duplicateAlerts(p, it, exceptOrderIds) {
    const out = []; if (!p || !it) return out;
    exceptOrderIds = exceptOrderIds || [];
    (db.pharmacyDispenses || []).filter(d => d.patientId === p.id && d.status !== 'Returned').forEach(d => {
      const ago = -daysTo(d.at.slice(0, 10));
      if (ago < 0 || ago > 30) return;
      d.lines.forEach(l => { const li = item(l.itemId); if (li && li.generic === it.generic && !exceptOrderIds.includes(l.orderId)) out.push({ level: 'warn', text: `${it.generic} was already supplied ${ago === 0 ? 'today' : ago + ' days ago'} (${d.no}, quantity ${l.qty}).` }); });
    });
    db.orders.filter(o => o.type === 'med' && o.patientId === p.id && !exceptOrderIds.includes(o.id) && /Active|Pending verification|Verified/.test(o.status)).forEach(o => {
      const oi = item(o.itemId); if (oi && oi.generic === it.generic) out.push({ level: 'warn', text: `Another open order for ${it.generic} (${o.no}, ${o.status.toLowerCase()}).` });
    });
    return out;
  }
  function alertBox(list) { return list.map(a => `<div class="alert-cdss ${a.level === 'warn' ? 'warn' : ''}">${icon(a.level === 'err' ? 'octagon-alert' : 'triangle-alert')}<span>${esc(a.text)}</span></div>`).join(''); }

  /* ---------- Prescriptions (OPD, grouped by rxNo) ---------- */
  function rxStatus(os) {
    const live = os.filter(o => o.status !== 'Cancelled');
    if (!live.length) return 'Cancelled';
    if (live.every(o => o.status === 'Dispensed')) return 'Dispensed';
    if (live.some(o => o.status === 'On hold')) return 'On hold';
    if (live.some(o => o.status === 'Pending verification')) return 'Pending verification';
    if (live.some(o => o.status === 'Dispensed')) return 'Partially dispensed';
    return 'Verified';
  }
  function prescriptions() {
    const g = K.groupBy(db.orders.filter(o => o.type === 'med' && o.setting === 'OPD' && o.rxNo), o => o.rxNo);
    const list = Object.keys(g).map(rx => {
      const os = g[rx]; const f = os[0];
      const st = rxStatus(os);
      const disp = (db.pharmacyDispenses || []).filter(d => d.rxNo === rx && d.status !== 'Voided');
      const doneAt = disp.length ? disp[disp.length - 1].at : '';
      return { rxNo: rx, orders: os, patientId: f.patientId, encounterId: f.encounterId, doctorId: f.by, orderedAt: f.orderedAt, status: st, dispensedAt: doneAt,
        wait: st === 'Dispensed' || st === 'Cancelled' ? minsBetween(f.orderedAt, doneAt || f.orderedAt) : waitMins(f.orderedAt) };
    }).sort((a, b) => a.orderedAt.localeCompare(b.orderedAt));
    /* Queue tokens and arrival at the pharmacy window: waiting time counts from arrival, not from the clinic order time. */
    const n = now();
    list.forEach((r, i) => { r.token = 'P' + String(i + 1).padStart(3, '0'); r.arrivedAt = r.orderedAt; });
    const open = list.filter(r => r.orderedAt.startsWith(T) && !/Dispensed|Cancelled/.test(r.status)).reverse();
    open.forEach((r, rank) => {
      const arr = new Date(n.replace(' ', 'T')); arr.setMinutes(arr.getMinutes() - (6 + 9 * rank));
      const a = `${arr.getFullYear()}-${pad(arr.getMonth() + 1)}-${pad(arr.getDate())} ${pad(arr.getHours())}:${pad(arr.getMinutes())}`;
      if (a > r.orderedAt) r.arrivedAt = a;
      r.wait = waitMins(r.arrivedAt);
    });
    return list;
  }
  function suppliedToday(orderId) { return (db.pharmacyDispenses || []).some(d => d.setting === 'IPD' && d.status !== 'Voided' && d.at.startsWith(T) && d.lines.some(l => l.orderId === orderId)); }
  function ipdOrders() { return db.orders.filter(o => o.type === 'med' && o.setting === 'IPD'); }
  function ipdState(o) {
    if (o.status === 'Pending verification') return 'To verify';
    if (o.status === 'On hold') return 'On hold';
    if (o.status === 'Cancelled' || o.status === 'Stopped' || o.status === 'Discontinued') return 'Stopped';
    return suppliedToday(o.id) ? 'Supplied today' : 'Due for supply';
  }

  /* ---------- Invoices ---------- */
  /* Cash patients get a pharmacy invoice; insured patients get the co-pay split from the plan. */
  function invoiceFor(p, e, lines, setting) {
    const pl = p && p.planId ? K.plan(p.planId) : null;
    const total = +lines.reduce((s, l) => s + l.qty * l.price, 0).toFixed(3);
    const pat = pl ? Math.min(total * pl.copayPct / 100, pl.maxCopay || total) : total;
    const inv = { id: window.UI.uid('iv'), no: K.nextNo('INV-26-', db.invoices), encounterId: e ? e.id : '', patientId: p.id, date: T, type: setting === 'IPD' ? 'IPD' : 'Pharmacy',
      lines: lines.map(l => ({ code: 'PHM-' + item(l.itemId).code, desc: item(l.itemId).name, qty: l.qty, price: l.price })), total, payerId: pl ? pl.payerId : null, planId: pl ? pl.id : null,
      payerAmount: +(total - pat).toFixed(3), patientAmount: +pat.toFixed(3), paid: 0, status: setting === 'IPD' ? 'Interim' : 'Unpaid', claimStatus: pl ? 'Not submitted' : '', by: (me() || {}).displayName };
    db.invoices.push(inv);
    return inv;
  }

  /* ---------- Controlled drug register ---------- */
  function cdEntries(itemId, wh) {
    let bal = 0;
    return (db.pharmacyCdRegister || []).filter(r => r.itemId === itemId && r.warehouseId === wh).slice().sort((a, b) => a.at.localeCompare(b.at)).map(r => {
      const sign = /Opening|Receipt|Return/.test(r.type) ? 1 : -1; bal += sign * Number(r.qty); return Object.assign({}, r, { sign, balance: bal });
    });
  }
  function cdBalance(itemId, wh) { const e = cdEntries(itemId, wh); return e.length ? e[e.length - 1].balance : 0; }
  function cdAdd(o) { const r = Object.assign({ id: window.UI.uid('cd'), at: nowStamp(), by: (me() || {}).displayName, verifiedBy: '', verifiedAt: '', patientId: '' }, o); db.pharmacyCdRegister.push(r); return r; }

  /* ---------- Labels ---------- */
  function labelHtml(p, it, l, d) {
    return `<div style="border:1.5px dashed #999;border-radius:8px;padding:10px 12px;margin-bottom:10px;page-break-inside:avoid">
      <div style="display:flex;justify-content:space-between;font-size:11px;color:#555"><span>${esc(d.no)} · ${esc(d.rxNo || d.encNo || '')}</span><span>${esc(K.day(d.at))}</span></div>
      <div style="font-size:14px;font-weight:800;margin:4px 0">${esc(p ? p.name : '')} <span style="font-weight:600;font-size:11px">${esc(p ? p.mrn : '')}</span></div>
      <div style="font-size:13px;font-weight:700">${esc(it.name)}${it.brand ? ' (' + esc(it.brand) + ')' : ''}</div>
      <div style="font-size:12.5px;margin:4px 0">${esc(l.dose || '')} · ${esc(l.route || it.route || '')} · <b>${esc(l.frequency || '')}</b>${l.days ? ' for ' + esc(l.days) + ' days' : ''}</div>
      <div style="display:flex;gap:14px;font-size:11px;color:#333;flex-wrap:wrap"><span>Quantity: <b>${esc(l.qty)} ${esc((it.uom || '').toLowerCase())}</b></span><span>Batch: <b>${esc((l.batches || []).map(b => b.batch).join(', '))}</b></span><span>Expiry: <b>${esc((l.batches || []).map(b => K.day(b.expiry)).join(', '))}</b></span><span>Pharmacist: <b>${esc(d.by || '')}</b></span></div>
      ${it.schedule ? `<div style="font-size:11px;margin-top:4px;font-weight:700">Controlled drug (${esc(it.schedule)}). Keep out of reach of children.</div>` : '<div style="font-size:11px;margin-top:4px">Keep out of reach of children. Store below 25 °C.</div>'}
    </div>`;
  }
  function printLabels(d) {
    const p = K.pt(d.patientId);
    const html = d.lines.map(l => { const o = db.orders.find(x => x.id === l.orderId) || {}; return labelHtml(p, item(l.itemId) || {}, Object.assign({}, o, l), d); }).join('');
    K.printDoc({ title: 'Medicine labels', sub: `${d.no} · ${d.lines.length} label${d.lines.length === 1 ? '' : 's'}`, html });
  }

  window.Pharmacy = { WH, WH_NAME, now, minsBetween, waitMins, waitLabel, waitCell, daysTo, usableBatches, available, allocate, deduct, restock, batchText,
    category, isOtc, isControlled, itemByCode, substitutes, itemLabel, allergyAlerts, duplicateAlerts, alertBox, rxStatus, prescriptions, suppliedToday, ipdOrders, ipdState,
    invoiceFor, cdEntries, cdBalance, cdAdd, labelHtml, printLabels };
})();
