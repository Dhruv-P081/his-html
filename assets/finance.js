/* Finance and Accounts helpers (window.Fin), shared by the docs/html/finance/ pages.
 * Load after kit.js. Reads db.finance* keys (data-finance.js) and the shared invoices, payers, vendors and services. */
(function () {
  const { db, save, esc, icon, $, $$, can, audit, me, nowStamp, uid, fmtDate } = window.UI;
  const T = db.TODAY;

  /* Local workaround: UI.table does not copy a column's 'num' class to its <th>, so numeric headers sit left of their right-aligned values. */
  if (!UI.table.numHead) {
    const baseTable = UI.table;
    UI.table = function (host, o) {
      const res = baseTable.apply(this, arguments);
      try { const ths = host.querySelectorAll('thead th'); (o.columns || []).forEach((c, i) => { if (c.cls && /\bnum\b/.test(c.cls) && ths[i]) ths[i].classList.add('num'); }); } catch (e) { /* header alignment is cosmetic */ }
      return res;
    };
    UI.table.numHead = true;
  }
  const pad = (n, w) => String(n).padStart(w || 2, '0');
  const r3 = (n) => Math.round((+n || 0) * 1000) / 1000;
  const money = (n) => Kit.money(n);
  const amt = (n) => Kit.money(n, false);
  const meName = () => (me() || {}).displayName || '';
  const days = (a, b) => Math.round((new Date((b || T) + 'T00:00:00') - new Date(String(a).slice(0, 10) + 'T00:00:00')) / 864e5);

  /* ---------- Branches ---------- */
  const branches = () => db.branches.filter(b => b.companyId === 'co_01' && b.status === 'Active');
  const brCode = (id) => (UI.L.branch(id) || {}).code || '';
  const brName = (id) => (UI.L.branch(id) || {}).name || 'All branches';
  const brShort = (id) => ({ br_01: 'Salmiya', br_02: 'Hawalli' })[id] || brName(id);
  const brOpts = () => branches().map(b => [b.id, b.name]);
  const ctxBranch = () => { const s = UI.session(); const b = s && s.ctx ? s.ctx.branchId : ''; return branches().some(x => x.id === b) ? b : 'br_01'; };

  /* ---------- Accounts and cost centers ---------- */
  const A = (id) => db.financeAccounts.find(a => a.id === id);
  const AC = (code) => db.financeAccounts.find(a => a.code === code);
  const aLabel = (id) => { const a = A(id); return a ? a.code + ' ' + a.name : 'Unmapped account'; };
  const postingAccts = (branchId) => db.financeAccounts.filter(a => a.posting && a.status === 'Active' && (!branchId || a.branch === 'All' || a.branch === brCode(branchId))).sort((x, y) => x.code.localeCompare(y.code));
  const acctOpts = (branchId) => postingAccts(branchId).map(a => [a.id, a.code + ' ' + a.name]);
  const isPL = (id) => { const a = A(id); return !!a && (a.type === 'Revenue' || a.type === 'Expense'); };
  const CC = (id) => db.financeCostCenters.find(c => c.id === id);
  const CCc = (code) => db.financeCostCenters.find(c => c.code === code);
  const ccName = (id) => (CC(id) || {}).name || '';
  const ccOpts = (branchId) => db.financeCostCenters.filter(c => c.status === 'Active' && (!branchId || c.branchId === branchId)).map(c => [c.id, c.code + ' ' + c.name]);
  function ccForEncounter(e) {
    if (!e) return 'cc_adm';
    if (e.type === 'ER') return 'cc_er';
    if (e.type === 'IPD') return 'cc_ipd';
    const c = db.financeCostCenters.find(x => x.clinicId && x.clinicId === e.clinicId);
    return c ? c.id : (e.branchId === 'br_02' ? 'cc_hopd' : 'cc_adm');
  }

  /* ---------- Periods ---------- */
  const periodOf = (d) => String(d || '').slice(0, 7);
  const P = (code) => db.financePeriods.find(p => p.code === code);
  const pName = (code) => (P(code) || {}).name || code;
  const pShort = (code) => { const p = P(code); return p ? p.name.slice(0, 3) + ' ' + p.code.slice(2, 4) : code; };
  function lockMsg(d) {
    const p = P(periodOf(d));
    if (!p) return 'There is no financial period for this date.';
    if (p.state === 'Closed') return `${p.name} is closed. Posting is locked. Ask Finance to reopen the period (needs approval).`;
    if (p.state === 'Future') return `${p.name} is not open yet.`;
    return '';
  }
  const openPeriods = () => db.financePeriods.filter(p => p.state === 'Open');
  const periodOpts = (all) => db.financePeriods.filter(p => all || p.state !== 'Future').map(p => [p.code, p.name]);

  /* ---------- Numbering ---------- */
  const series = (code) => (db.financeVoucherSeries.find(s => s.code === code) || {}).prefix || code + '-26-';
  function nextNo(code, list, key) {
    const pre = series(code); key = key || 'no';
    let max = 0, w = 4;
    (list || []).forEach(x => { const v = String(x[key] || ''); if (!v.startsWith(pre)) return; const s = v.slice(pre.length).replace(/\D/g, ''); const n = parseInt(s, 10); if (!isNaN(n)) { max = Math.max(max, n); w = Math.max(w, s.length); } });
    return pre + pad(max + 1, w);
  }

  /* ---------- Journals ---------- */
  const jDr = (j) => r3(j.lines.reduce((s, l) => s + (+l.debit || 0), 0));
  const jCr = (j) => r3(j.lines.reduce((s, l) => s + (+l.credit || 0), 0));
  const J = (id) => db.financeJournals.find(j => j.id === id);
  const L = (code, debit, credit, ccId, memo) => { const l = { accountId: (AC(code) || {}).id || 'fa_' + code, debit: r3(debit), credit: r3(credit) }; if (ccId) l.ccId = ccId; if (memo) l.memo = memo; return l; };
  function addJournal(o) {
    const j = Object.assign({ id: uid('jv'), no: '', branchId: ctxBranch(), type: 'Manual', source: 'Manual', narration: '', status: 'Draft', by: meName(), at: nowStamp(), approvedBy: '', approvedAt: '', postedAt: '', attachments: [], batchId: '', templateId: '', currency: 'KWD', rate: 1, ref: '', lines: [] }, o);
    j.no = j.no || nextNo(j.type === 'Auto' ? 'AJ' : 'JV', db.financeJournals);
    j.period = periodOf(j.date);
    if (j.status === 'Posted' && !j.postedAt) j.postedAt = nowStamp();
    db.financeJournals.push(j);
    return j;
  }
  /* System posting from a sub-ledger action (receipt, bill, run, credit note, write-off). */
  function autoJournal(source, date, branchId, narration, lines, ref) {
    const j = addJournal({ type: 'Auto', source, date, branchId: branchId || 'br_01', narration, lines, ref: ref || '', status: 'Posted', by: meName(), approvedBy: 'System rule' });
    return j;
  }
  function posted(f) {
    f = f || {};
    const out = [];
    db.financeJournals.forEach(j => {
      if (j.status !== 'Posted') return;
      if (f.branchId && j.branchId !== f.branchId) return;
      if (f.from && j.date < f.from) return;
      if (f.to && j.date > f.to) return;
      j.lines.forEach(l => out.push(Object.assign({ j }, l)));
    });
    return out;
  }
  function balances(f) {
    const m = {};
    posted(f).forEach(l => { const b = m[l.accountId] || (m[l.accountId] = { dr: 0, cr: 0 }); b.dr += +l.debit || 0; b.cr += +l.credit || 0; });
    return m;
  }
  const netOf = (b) => (b ? r3(b.dr - b.cr) : 0);
  const pEnd = (code) => (P(code) || {}).to || code + '-31';
  const pStart = (code) => (P(code) || {}).from || code + '-01';
  /* Revenue (credit nature) and expense totals for a span. */
  function plTotals(f) {
    const b = balances(f); let rev = 0, exp = 0;
    Object.entries(b).forEach(([id, v]) => { const a = A(id); if (!a) return; if (a.type === 'Revenue') rev += v.cr - v.dr; if (a.type === 'Expense') exp += v.dr - v.cr; });
    return { rev: r3(rev), exp: r3(exp), profit: r3(rev - exp) };
  }
  const CASH_CODES = ['1010', '1011', '1020', '1110', '1120', '1130', '1140'];

  /* ---------- Maker-checker and permission buttons ---------- */
  const ACT = { approve: 'Approve', add: 'Add', edit: 'Edit', cancel: 'Cancel', print: 'Print', verify: 'Verify', view: 'View' };
  function gate(opt, act, rec) {
    if (!can(opt, act)) return { ok: false, why: `Needs ${ACT[act] || act} permission` };
    if (rec && act === 'approve' && rec.by && rec.by === meName()) return { ok: false, why: 'You created this record. Another user must approve it (no self-approval).' };
    return { ok: true, why: '' };
  }
  function btn(o) {
    const g = o.gate || { ok: true };
    const tip = g.ok && !o.disabled ? (o.title ? `title="${esc(o.title)}"` : '') : `disabled title="${esc(g.why || o.why || '')}"`;
    return `<button class="btn ${o.cls || ''}" ${o.attrs || ''} ${tip} ${o.label ? '' : `aria-label="${esc(o.title || o.icon || '')}"`}>${o.icon ? icon(o.icon) : ''}${o.label ? ' ' + esc(o.label) : ''}</button>`;
  }
  const selfNote = (rec) => rec && rec.by === meName() ? `<div class="banner warn" style="margin-top:10px">${icon('user-x')}<span>You raised this request. Another user with Approve permission must approve it (no self-approval).</span></div>` : '';

  /* ---------- Invoices (shared db.invoices) ---------- */
  const OPEN_INV = (v) => !['Draft', 'Cancelled', 'Interim'].includes(v.status);
  function svcCat(line) {
    if (line.category) return line.category;
    if (/^LAB-/.test(line.code)) return 'Laboratory';
    if (/^RAD-/.test(line.code)) return 'Radiology';
    const s = (db.services || []).find(x => x.code === line.code);
    return s ? s.category : '';
  }
  const gross = (inv) => r3((inv.lines || []).reduce((s, l) => s + l.qty * l.price, 0));
  function recalc(inv) {
    const g = gross(inv), d = r3(Math.min(inv.discount || 0, g)), t = r3(g - d), plan = Kit.plan(inv.planId);
    let pat = plan ? Math.min(t * plan.copayPct / 100 + plan.deductible, plan.maxCopay || t) : t;
    pat = r3(Math.max(0, Math.min(pat, t)));
    inv.gross = g; inv.discount = d; inv.total = t; inv.patientAmount = pat; inv.payerAmount = r3(t - pat);
  }
  const apprCn = (f) => db.financeCreditNotes.filter(c => c.status === 'Approved' && f(c)).reduce((s, c) => s + c.amount, 0);
  const apprWo = (f) => db.financeWriteOffs.filter(c => c.status === 'Approved' && f(c)).reduce((s, c) => s + c.amount, 0);
  const invAdj = (inv, party) => r3(apprCn(c => c.invoiceId === inv.id && c.party === party) + apprWo(c => c.invoiceId === inv.id && c.party === party));
  const invPtOut = (inv) => OPEN_INV(inv) ? r3(Math.max(0, inv.patientAmount - inv.paid - invAdj(inv, 'Patient'))) : 0;
  const invPyOut = (inv) => OPEN_INV(inv) && inv.payerId && inv.claimStatus !== 'Paid' ? r3(Math.max(0, inv.payerAmount - invAdj(inv, 'Insurer'))) : 0;
  function invStatus(inv) {
    if (!OPEN_INV(inv) && inv.status !== 'Unpaid') return;
    const out = invPtOut(inv);
    inv.status = out <= 0.0005 ? 'Paid' : inv.paid > 0 ? 'Partially paid' : 'Unpaid';
  }
  function ptCat(p) {
    if (!p) return 'General';
    if (p.vip) return 'VIP';
    const a = UI.ageOf(p.dob || '');
    if (/ y$/.test(a) && parseInt(a, 10) >= 60) return 'Senior citizen';
    if (!p.civilId && p.nationality && p.nationality !== 'Kuwaiti') return 'International';
    return 'General';
  }
  const PT_CATS = ['All', 'General', 'Senior citizen', 'Staff', 'VIP', 'Charity', 'International'];
  const SVC_CATS = ['Consultation', 'Emergency', 'Procedure', 'Room', 'Package', 'Laboratory', 'Radiology'];
  function schemeLive(s, date) { return s.status === 'Active' && (!s.from || s.from <= (date || T)) && (!s.to || s.to >= (date || T)); }
  function markupFor(cat, inv) {
    const p = Kit.pt(inv.patientId);
    return db.financeSchemes.find(s => s.kind === 'Markup' && schemeLive(s, inv.date) && s.categories.includes(cat) && (!s.payerId || s.payerId === inv.payerId) && (s.patientCat === 'All' || s.patientCat === ptCat(p)));
  }

  /* ---------- Receivables ---------- */
  const BUCKETS = ['0-30', '31-60', '61-90', '91-180', '>180'];
  const bucketOf = (d) => d <= 30 ? 0 : d <= 60 ? 1 : d <= 90 ? 2 : d <= 180 ? 3 : 4;
  const partyName = (party, id) => party === 'Insurer' ? ((Kit.payer(id) || {}).name || id) : (Kit.ptName(id) || id);
  function arItems(party) {
    const out = [];
    (db.invoices || []).forEach(v => {
      const o = party === 'Patient' ? invPtOut(v) : invPyOut(v);
      if (o > 0.0005) out.push({ key: 'iv:' + v.id, src: 'Invoice', invoiceId: v.id, openItemId: '', ref: v.no, party, partyId: party === 'Patient' ? v.patientId : v.payerId, date: v.date, amount: party === 'Patient' ? v.patientAmount : v.payerAmount, out: o, desc: v.type + ' invoice' });
    });
    db.financeArOpening.filter(x => x.party === party).forEach(x => {
      const o = r3(x.amount - (x.settled || 0) - apprCn(c => c.openItemId === x.id) - apprWo(c => c.openItemId === x.id));
      if (o > 0.0005) out.push({ key: 'ao:' + x.id, src: 'Opening item', invoiceId: '', openItemId: x.id, ref: x.no, party, partyId: x.partyId, date: x.date, amount: x.amount, out: o, desc: x.desc });
    });
    out.forEach(x => { x.days = Math.max(0, days(x.date)); x.bucket = bucketOf(x.days); x.name = partyName(party, x.partyId); });
    return out.sort((a, b) => b.days - a.days);
  }
  function ageing(party) {
    const m = {};
    arItems(party).forEach(x => { const r = m[x.partyId] || (m[x.partyId] = { partyId: x.partyId, name: x.name, b: [0, 0, 0, 0, 0], total: 0, items: [] }); r.b[x.bucket] = r3(r.b[x.bucket] + x.out); r.total = r3(r.total + x.out); r.items.push(x); });
    return Object.values(m).sort((a, b) => b.total - a.total);
  }
  const recvCode = (party, partyId) => party === 'Patient' ? '1210' : ((Kit.payer(partyId) || {}).type === 'Corporate' ? '1230' : '1220');

  /* ---------- Payables ---------- */
  const AP_BUCKETS = ['Not due', '1-30', '31-60', '61-90', '>90'];
  const billOut = (b) => ['Approved', 'Partially paid'].includes(b.status) ? r3(b.amount - (b.paid || 0)) : 0;
  const apBucket = (b) => { const o = days(b.dueDate); return o <= 0 ? 0 : o <= 30 ? 1 : o <= 60 ? 2 : o <= 90 ? 3 : 4; };

  /* ---------- Posting rules and batches ---------- */
  const mapRec = (kind, key) => db.financeChargeMap.find(m => m.kind === kind && m.key === key && m.status === 'Active');
  const mapAcc = (kind, key) => { const m = mapRec(kind, key); return m && m.account && AC(m.account) ? AC(m.account).id : ''; };
  const mapCc = (kind, key) => { const m = mapRec(kind, key); return m && m.cc && CCc(m.cc) ? CCc(m.cc).id : ''; };
  const keyLabel = (kind, key) => kind === 'Warehouse cost center' ? `${(db.warehouses.find(w => w.code === key && w.companyId === 'co_01') || {}).name || key} (${key})` : key;
  function resolveEntry(e) {
    const accountId = e.accountId || (e.map ? mapAcc(e.map.kind, e.map.key) : '');
    const ccId = e.ccId || (e.ccMap ? mapCc(e.ccMap.kind, e.ccMap.key) : '');
    const errs = [];
    if (!accountId && e.map) errs.push({ need: 'account', kind: e.map.kind, key: e.map.key, msg: `No account is mapped for ${e.map.kind.toLowerCase()} "${keyLabel(e.map.kind, e.map.key)}".` });
    if (!ccId && e.ccMap) errs.push({ need: 'cc', kind: e.ccMap.kind, key: e.ccMap.key, msg: `No cost center is mapped for ${e.ccMap.kind.toLowerCase().replace(' cost center', '')} "${keyLabel(e.ccMap.kind, e.ccMap.key)}".` });
    return { accountId, ccId, errs };
  }
  function batchErrors(b) {
    const seen = {}, out = [];
    (b.entries || []).forEach(e => resolveEntry(e).errs.forEach(x => { const k = x.need + x.kind + x.key; if (!seen[k]) { seen[k] = 1; out.push(x); } }));
    return out;
  }
  /* Build the live billing batch from today's finalized invoices (Salmiya). */
  function buildBilling(b) {
    const inv = (db.invoices || []).filter(v => v.date === b.date && OPEN_INV(v) && !v.postedBatch);
    const agg = {};
    const add = (side, key, e) => { const k = side + '|' + key; agg[k] = agg[k] ? Object.assign(agg[k], { amount: r3(agg[k].amount + e.amount) }) : Object.assign({ side }, e); };
    inv.forEach(v => {
      const ccE = ccForEncounter(Kit.enc(v.encounterId));
      (v.lines || []).forEach(l => {
        const cat = svcCat(l) || 'Uncategorised';
        const ccId = mapCc('Service category', cat) || ccE;
        add('Cr', 'rev|' + cat + '|' + ccId, { map: { kind: 'Service category', key: cat }, ccId, amount: r3(l.qty * l.price), memo: cat + ' revenue' });
      });
      if (v.discount > 0) add('Dr', 'disc|' + ccE, { accountId: AC('4900').id, ccId: ccE, amount: v.discount, memo: 'Discounts allowed' });
      if (v.patientAmount > 0) add('Dr', 'ar|pt', { map: { kind: 'Receivable', key: 'Patient' }, amount: v.patientAmount, memo: 'Patient share' });
      if (v.payerAmount > 0) { const k = (Kit.payer(v.payerId) || {}).type === 'Corporate' ? 'Corporate' : 'Insurer'; add('Dr', 'ar|' + k, { map: { kind: 'Receivable', key: k }, amount: v.payerAmount, memo: k + ' share' }); }
    });
    b.entries = Object.values(agg).sort((x, y) => (x.side === y.side ? 0 : x.side === 'Dr' ? -1 : 1) || String(x.memo).localeCompare(String(y.memo)));
    b.docs = inv.length; b.amount = r3(inv.reduce((s, v) => s + gross(v), 0)); b.invoiceIds = inv.map(v => v.id);
  }
  function runBatch(b) {
    if (b.live) buildBilling(b);
    const errs = batchErrors(b);
    b.runAt = nowStamp(); b.log = b.log || [];
    if (!b.entries.length) { b.log.unshift({ at: b.runAt, text: 'Run by ' + meName() + ': nothing to post' }); return { ok: false, errs: [{ msg: 'There are no finalized documents to post for this day.' }] }; }
    if (errs.length) { b.status = 'Failed'; b.log.unshift({ at: b.runAt, text: `Run by ${meName()} failed: ${errs.length} error${errs.length > 1 ? 's' : ''}` }); return { ok: false, errs }; }
    const lock = lockMsg(b.date); if (lock) { b.status = 'Failed'; b.log.unshift({ at: b.runAt, text: 'Run failed: ' + lock }); return { ok: false, errs: [{ msg: lock }] }; }
    const lines = b.entries.map(e => { const r = resolveEntry(e); const l = { accountId: r.accountId, debit: e.side === 'Dr' ? r3(e.amount) : 0, credit: e.side === 'Cr' ? r3(e.amount) : 0 }; if (r.ccId) l.ccId = r.ccId; if (e.memo) l.memo = e.memo; return l; });
    const dr = lines.reduce((s, l) => s + l.debit, 0), cr = lines.reduce((s, l) => s + l.credit, 0);
    if (Math.abs(dr - cr) > 0.0005) { b.status = 'Failed'; b.log.unshift({ at: b.runAt, text: 'Run failed: batch does not balance' }); return { ok: false, errs: [{ msg: `Batch does not balance (debit ${amt(dr)}, credit ${amt(cr)}).` }] }; }
    const j = addJournal({ type: 'Auto', source: b.source, date: b.date, branchId: b.branchId, narration: `${b.source} auto-posting, ${fmtDate(b.date)} (${b.no})`, lines, status: 'Posted', by: 'Auto-posting service', batchId: b.id, ref: b.no });
    b.status = 'Posted'; b.journalId = j.id; b.log.unshift({ at: b.runAt, text: `Run by ${meName()}: posted ${j.no}` });
    if (b.invoiceIds) b.invoiceIds.forEach(id => { const v = (db.invoices || []).find(x => x.id === id); if (v) v.postedBatch = b.no; });
    return { ok: true, j };
  }

  /* ---------- Printing ---------- */
  const sheetTable = (head, rows, foot) => `<table><thead><tr>${head.map(h => `<th style="text-align:${/Debit|Credit|Amount|Total|Balance|Qty|Price|KWD|Out/.test(h) ? 'end' : 'start'}">${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(c => `<td style="text-align:${typeof c === 'number' ? 'end' : 'start'}">${typeof c === 'number' ? amt(c) : esc(c)}</td>`).join('')}</tr>`).join('')}</tbody>${foot ? `<tfoot><tr>${foot.map(c => `<td style="font-weight:800;text-align:${typeof c === 'number' ? 'end' : 'start'}">${typeof c === 'number' ? amt(c) : esc(c)}</td>`).join('')}</tr></tfoot>` : ''}</table>`;
  const kvSheet = (pairs) => `<table style="margin-bottom:12px">${pairs.map(([k, v]) => `<tr><td style="width:150px;color:#555;border:0;padding:3px 6px">${esc(k)}</td><td style="border:0;padding:3px 6px"><b>${esc(v)}</b></td></tr>`).join('')}</table>`;
  const signBlock = (a, b) => `<div class="doc-sign" style="display:flex;gap:40px;margin-top:36px;font-size:11px;color:#555"><div style="flex:1;border-top:1px solid #999;padding-top:4px">${esc(a)}</div><div style="flex:1;border-top:1px solid #999;padding-top:4px">${esc(b)}</div></div>`;
  function printJournal(j) {
    Kit.printDoc({ title: 'Journal voucher ' + j.no, sub: `${j.source} · ${brName(j.branchId)}`, html: `<h3 style="margin:0 0 8px">Journal voucher ${esc(j.no)}</h3>${kvSheet([['Date', fmtDate(j.date)], ['Period', pName(j.period)], ['Narration', j.narration], ['Status', j.status], ['Currency', j.currency + (j.currency !== 'KWD' ? ' at ' + j.rate : '')], ['Created by', j.by + ' · ' + fmtDate(j.at)], ['Approved by', j.approvedBy || '-']])}
      ${sheetTable(['Account', 'Cost center', 'Memo', 'Debit', 'Credit'], j.lines.map(l => [aLabel(l.accountId), ccName(l.ccId), l.memo || '', +l.debit || 0, +l.credit || 0]), ['Total', '', '', jDr(j), jCr(j)])}${signBlock('Prepared by', 'Approved by')}` });
  }
  function printInvoice(inv) {
    const p = Kit.pt(inv.patientId) || {}, e = Kit.enc(inv.encounterId);
    Kit.printDoc({ title: 'Invoice ' + inv.no, sub: 'Patient invoice', html: `<h3 style="margin:0 0 8px">${inv.status === 'Draft' || inv.status === 'Interim' ? 'Interim bill' : 'Tax invoice'} ${esc(inv.no)}</h3>${kvSheet([['Patient', `${p.name || ''} (${p.mrn || ''})`], ['Civil ID', p.civilId || '-'], ['Visit', e ? `${e.type} ${e.no}` : inv.type], ['Invoice date', fmtDate(inv.date)], ['Payer', Kit.payerLabel(p)], ['Status', inv.status]])}
      ${sheetTable(['Code', 'Description', 'Qty', 'Price', 'Amount'], (inv.lines || []).map(l => [l.code, l.desc + (l.markup ? ` (markup ${l.markup.pct}%)` : ''), String(l.qty), l.price, r3(l.qty * l.price)]))}
      <table style="width:300px;margin:12px 0 0 auto">${[['Gross', gross(inv)], ['Discount', -(inv.discount || 0)], ['Net total', inv.total], ['Payer share', inv.payerAmount], ['Patient share', inv.patientAmount], ['Paid', inv.paid], ['Balance due', invPtOut(inv)]].map(([k, v]) => `<tr><td style="border:0">${k}</td><td style="text-align:end;border:0"><b>${amt(v)}</b></td></tr>`).join('')}</table>
      <p style="font-size:11px;color:#555;margin-top:18px">Amounts in Kuwaiti dinar (KWD). This invoice is computer generated.</p>` });
  }
  function printReceipt(r) {
    const party = r.kind === 'Insurer' ? (Kit.payer(r.payerId) || {}).name : Kit.ptName(r.patientId);
    const inv = r.invoiceId ? (db.invoices || []).find(v => v.id === r.invoiceId) : null;
    Kit.printDoc({ title: 'Receipt ' + r.no, sub: 'Receipt voucher', html: `<h3 style="margin:0 0 8px">Receipt voucher ${esc(r.no)}</h3>${kvSheet([['Received from', party || ''], ['Date', fmtDate(r.date) + ' ' + (r.time || '')], ['Against', r.kind === 'Invoice' && inv ? 'Invoice ' + inv.no : r.kind === 'Advance' ? 'Advance deposit' : 'Claim remittance'], ['Mode', r.mode + (r.ref ? ' · ' + r.ref : '')], ['Amount', money(r.amount)], ['Cashier', r.by], ['Status', r.status]])}${signBlock('Cashier', 'Received with thanks')}` });
  }

  /* ---------- Small UI helpers ---------- */
  const sel = (id, label, options, value, ph) => `<label class="field" style="min-width:160px;margin:0"><span class="xs muted b">${esc(label)}</span><select class="input" id="${id}">${ph !== false ? `<option value="">${esc(ph || 'All')}</option>` : ''}${options.map(([v, t]) => `<option value="${esc(v)}" ${String(v) === String(value) ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select></label>`;
  const statusOrder = ['Draft', 'Pending approval', 'Approved', 'Posted', 'Rejected', 'Cancelled'];
  const ageTag = (d) => d > 90 ? `<span class="badge b-err nodot">${d} d</span>` : d > 30 ? `<span class="badge b-warn nodot">${d} d</span>` : `<span class="badge b-neutral nodot">${d} d</span>`;
  /* Pending approvals across the module (for the overview and badges). */
  function approvals() {
    const out = [];
    db.financeJournals.filter(j => j.status === 'Pending approval').forEach(j => out.push({ type: 'Journal', ref: j.no, desc: j.narration, by: j.by, at: j.at, amount: jDr(j), href: 'finance/journals.html?id=' + j.id, opt: 'finance.journal' }));
    db.financeBills.filter(b => b.status === 'Pending approval').forEach(b => out.push({ type: 'Vendor bill', ref: b.no, desc: (Kit.vendor(b.vendorId) || {}).name, by: b.by, at: b.at, amount: b.amount, href: 'finance/payables.html?bill=' + b.id, opt: 'finance.ap' }));
    db.financePayRuns.filter(b => b.status === 'Pending approval').forEach(b => out.push({ type: 'Payment run', ref: b.no, desc: b.billIds.length + ' bills', by: b.by, at: b.at, amount: b.amount, href: 'finance/payables.html?run=' + b.id, opt: 'finance.ap' }));
    db.financePayments.filter(b => b.status === 'Pending approval').forEach(b => out.push({ type: 'Payment voucher', ref: b.no, desc: b.payee, by: b.by, at: b.date, amount: b.amount, href: 'finance/cash.html?tab=pv&id=' + b.id, opt: 'finance.bill.receipt' }));
    db.financeCreditNotes.filter(b => b.status === 'Pending approval').forEach(b => out.push({ type: 'Credit note', ref: b.no, desc: partyName(b.party, b.partyId), by: b.by, at: b.at, amount: b.amount, href: 'finance/receivables.html?tab=cn', opt: 'finance.ar' }));
    db.financeWriteOffs.filter(b => b.status === 'Pending approval').forEach(b => out.push({ type: 'Write-off', ref: b.no, desc: partyName(b.party, b.partyId), by: b.by, at: b.at, amount: b.amount, href: 'finance/receivables.html?tab=wo', opt: 'finance.ar' }));
    db.financeDiscountReqs.filter(b => b.status === 'Pending approval').forEach(b => { const v = (db.invoices || []).find(x => x.id === b.invoiceId) || {}; out.push({ type: 'Discount', ref: v.no || '', desc: Kit.ptName(v.patientId), by: b.by, at: b.at, amount: b.amount, href: 'finance/billing.html?id=' + b.invoiceId, opt: 'finance.bill.invoice' }); });
    db.financeSchemes.filter(b => b.status === 'Pending approval').forEach(b => out.push({ type: b.kind + ' scheme', ref: b.code, desc: b.name, by: b.by, at: b.at, amount: null, href: 'finance/schemes.html?id=' + b.id, opt: 'finance.schemes' }));
    db.financeCloseRequests.filter(b => b.status === 'Pending approval').forEach(b => out.push({ type: 'Period ' + b.action.toLowerCase(), ref: pName(b.period), desc: b.reason, by: b.by, at: b.at, amount: null, href: 'finance/period-close.html?p=' + b.period, opt: 'finance.close' }));
    return out;
  }
  /* File picker that records attachment names only (prototype). */
  function fileNames(input) { return Array.from(input.files || []).map(f => ({ name: f.name, size: f.size > 1048576 ? (f.size / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(f.size / 1024)) + ' KB' })); }

  window.Fin = { T, r3, money, amt, days, meName, pad, branches, brCode, brName, brShort, brOpts, ctxBranch, A, AC, aLabel, postingAccts, acctOpts, isPL, CC, CCc, ccName, ccOpts, ccForEncounter,
    periodOf, P, pName, pShort, lockMsg, openPeriods, periodOpts, pEnd, pStart, series, nextNo, jDr, jCr, J, L, addJournal, autoJournal, posted, balances, netOf, plTotals, CASH_CODES,
    gate, btn, selfNote, OPEN_INV, svcCat, gross, recalc, invPtOut, invPyOut, invAdj, invStatus, ptCat, PT_CATS, SVC_CATS, schemeLive, markupFor,
    BUCKETS, bucketOf, partyName, arItems, ageing, recvCode, AP_BUCKETS, billOut, apBucket, mapRec, mapAcc, mapCc, keyLabel, resolveEntry, batchErrors, buildBilling, runBatch,
    sheetTable, kvSheet, signBlock, printJournal, printInvoice, printReceipt, sel, statusOrder, ageTag, approvals, fileNames, save, audit };
})();
