/* HR and Payroll helpers shared by the pages in docs/html/hr/ (window.HR). Loaded after kit.js.
 * Staff = admin `employees` (read-only here) + `hrStaff`; HR details live in `hrProfiles[empId]`. */
(function () {
  const { db, save, esc, icon, me, R, can } = window.UI;
  const K = window.Kit;
  const pad = (n, w) => String(n).padStart(w || 2, '0');
  const r3 = (n) => Math.round(Number(n || 0) * 1000) / 1000;
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
  const SET = db.hrSettings || { minRestHours: 11, maxWeeklyHours: 48, payDivisor: 26, hoursPerDay: 8, otRates: { Normal: 1.25, 'Rest day': 1.5, 'Public holiday': 2 } };

  /* ---------- Staff ---------- */
  const isAdminEmp = (id) => (db.employees || []).some(e => e.id === id);
  const base = (id) => (db.employees || []).find(e => e.id === id) || (db.hrStaff || []).find(e => e.id === id);
  const prof = (id) => (db.hrProfiles || {})[id] || {};
  function view(e) { return Object.assign({}, prof(e.id), e, { src: isAdminEmp(e.id) ? 'admin' : 'hr' }); }
  const all = () => (db.employees || []).concat(db.hrStaff || []).map(view);
  const get = (id) => { const e = base(id); return e ? view(e) : null; };
  const active = () => all().filter(v => v.hrStatus !== 'Separated');
  const name = (id) => (base(id) || {}).name || '';
  const userOf = (empId) => (db.users || []).find(u => u.empId === empId) || null;
  const dept = (id) => window.UI.L.dName(id) || '';
  const grade = (code) => (db.hrGrades || []).find(g => g.code === code) || null;
  const comp = (code) => (db.hrPayComponents || []).find(c => c.code === code) || { code, name: code };
  const shift = (code) => (db.hrShifts || []).find(s => s.code === code) || null;
  const leaveType = (code) => (db.hrLeaveTypes || []).find(t => t.code === code) || { code, name: code, days: 0 };
  const loanType = (code) => (db.hrLoanTypes || []).find(t => t.code === code) || { code, name: code };
  const allowTotal = (v) => (v.allowances || []).reduce((s, a) => s + Number(a.amount || 0), 0);
  const gross = (v) => Number(v.basic || 0) + allowTotal(v);
  const daily = (v) => r3(gross(v) / SET.payDivisor);
  const hourly = (v) => r3(gross(v) / SET.payDivisor / SET.hoursPerDay);
  const deptsInUse = () => Array.from(new Set(all().map(v => v.deptId))).map(id => [id, dept(id)]).sort((a, b) => a[1].localeCompare(b[1]));
  const empOpts = (filter) => all().filter(filter || (v => v.hrStatus !== 'Separated')).sort((a, b) => a.name.localeCompare(b.name)).map(v => [v.id, `${v.name} (${v.empNo})`]);

  function empCell(v, sub) {
    if (!v) return '<span class="muted">Unknown employee</span>';
    return `<div class="row" style="gap:10px"><span class="avatar sm ${v.gender === 'Female' ? 'av-f' : 'av-m'}">${window.UI.initials(v.name)}</span><div class="cell-main"><b>${esc(v.name)}</b><span class="mono">${esc(v.empNo)}</span><span> · ${esc(sub != null ? sub : v.designation)}</span></div></div>`;
  }
  const empLink = (id) => { const v = get(id); return v ? `<a href="${R('hr/employees.html?id=' + id)}">${esc(v.name)}</a>` : ''; };

  /* ---------- Dates ---------- */
  const dateDiff = (a, b) => Math.round((new Date(b + 'T00:00:00') - new Date(a + 'T00:00:00')) / 86400000);
  const dow = (d) => new Date(d + 'T00:00:00').getDay();
  const weekStart = (d) => K.addDays(d, -dow(d));
  const dim = (month) => { const [y, m] = month.split('-').map(Number); return new Date(y, m, 0).getDate(); };
  const monthAdd = (month, n) => { const [y, m] = month.split('-').map(Number); const t = y * 12 + m - 1 + n; return Math.floor(t / 12) + '-' + pad(t % 12 + 1); };
  const monthLabel = (month) => { const [y, m] = month.split('-').map(Number); return new Date(y, m - 1, 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }); };
  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  function workDays(from, to, type) {
    if (!from || !to || to < from) return 0;
    const cal = leaveType(type).count === 'Calendar days';
    let n = 0; for (let d = from; d <= to; d = K.addDays(d, 1)) if (cal || dow(d) < 5) n++;
    return n;
  }
  const years = (from, to) => Math.max(0, (dateDiff(from, to) + 1) / 365);
  const serviceText = (from, to) => { const d = dateDiff(from, to || T) + 1; const y = Math.floor(d / 365), m = Math.floor((d % 365) / 30.42); if (!y && !m) return `${d} day${d === 1 ? '' : 's'}`; if (!y) return `${m} mo`; return `${y} yr${y === 1 ? '' : 's'}${m ? ' ' + m + ' mo' : ''}`; };
  const toMin = (t) => t ? +t.slice(0, 2) * 60 + +t.slice(3, 5) : null;

  /* ---------- Credentials ---------- */
  const CRED_TYPES = ['MOH professional licence', 'Nursing registration', 'BLS', 'ACLS', 'PALS', 'Malpractice insurance', 'Radiation safety certificate'];
  const credentials = () => Object.values(db.hrProfiles || {}).reduce((l, p) => l.concat((p.licences || []).map(c => Object.assign(c, { empId: p.empId }))), []).filter(c => { const b = base(c.empId); return b && b.hrStatus !== 'Separated'; });
  function credBand(c) {
    const d = dateDiff(T, c.expiry);
    if (d < 0) return { days: d, band: 'Expired', tone: 'err', label: `Expired ${-d} day${d === -1 ? '' : 's'} ago` };
    if (d <= 30) return { days: d, band: '30 days', tone: 'err', label: `${d} days left` };
    if (d <= 60) return { days: d, band: '60 days', tone: 'warn', label: `${d} days left` };
    if (d <= 90) return { days: d, band: '90 days', tone: 'warn', label: `${d} days left` };
    return { days: d, band: 'Valid', tone: 'ok', label: `${d} days left` };
  }
  const docBand = (d) => { if (!d.expiry) return null; const n = dateDiff(T, d.expiry); return n < 0 ? 'Expired' : n <= 90 ? 'Expiring' : 'Valid'; };

  /* ---------- Attendance ---------- */
  function attStatus(a) {
    if (a.reg) return 'Regularized';
    if (a.source === 'Leave' || a.leave) return 'Leave';
    if (!a.in && !a.out) return a.date === T ? 'Not punched' : 'Absent';
    if (!a.in || !a.out) { if (a.date === T && a.in) { const s = shift(a.shift); return s && toMin(a.in) > toMin(s.start) + Number(s.grace || 10) ? 'Late' : 'On duty'; } return 'Missing punch'; }
    const s = shift(a.shift);
    if (s && s.start && toMin(a.in) > toMin(s.start) + Number(s.grace || 10) && toMin(a.in) < toMin(s.start) + 240) return 'Late';
    return 'Present';
  }
  const lateMins = (a) => { const s = shift(a.shift); if (!s || !a.in) return 0; return Math.max(0, toMin(a.in) - toMin(s.start)); };
  const ATT_TONE = { Present: 'ok', 'On duty': 'info', Late: 'warn', Absent: 'err', 'Missing punch': 'warn', Leave: 'violet', Regularized: 'neutral', 'Not punched': 'neutral' };

  /* ---------- Leave ---------- */
  function leaveBal(empId, code, year) {
    year = year || T.slice(0, 4);
    const t = leaveType(code), p = prof(empId);
    const ent = Number(t.days || 0) + (code === 'AL' ? Number(p.alOpening || 0) : 0);
    const mine = (db.hrLeaves || []).filter(l => l.empId === empId && l.type === code && l.from.slice(0, 4) === year);
    const taken = K.sumBy(mine.filter(l => l.status === 'Approved'), l => l.days);
    const pending = K.sumBy(mine.filter(l => l.status === 'Pending approval'), l => l.days);
    return { ent, taken, pending, balance: ent - taken, available: ent - taken - pending };
  }
  const onLeave = (empId, d) => (db.hrLeaves || []).find(l => l.empId === empId && l.status === 'Approved' && l.from <= d && l.to >= d) || null;

  /* ---------- Maker-checker ---------- */
  function selfBlock(creatorName, empId) {
    const u = me() || {};
    if (creatorName && creatorName === u.displayName) return 'You raised this request. Another approver must decide (no self-approval).';
    if (empId && u.empId === empId) return 'This request is about you. Another approver must decide (no self-approval).';
    return '';
  }
  function btn(opt, act, label, attrs, cls, ic) {
    const ok = can(opt, act);
    const need = { add: 'Add', edit: 'Edit', approve: 'Approve', cancel: 'Cancel', print: 'Print', verify: 'Verify', view: 'View' }[act] || act;
    return `<button class="btn ${cls || ''}" ${attrs || ''} ${ok ? '' : `disabled title="Needs ${need} permission"`}>${ic ? icon(ic) + ' ' : ''}${label}</button>`;
  }

  /* ---------- Payroll ---------- */
  function basicFor(v, month) {
    const h = (v.basicHistory || []).filter(x => x.from > month + '-01').sort((a, b) => a.from.localeCompare(b.from))[0];
    return h ? Number(h.before) : Number(v.basic || 0);
  }
  const loanInst = (l) => r3(l.amount / l.instalments);
  const loanSchedule = (l) => Array.from({ length: l.instalments }, (_, i) => { const m = monthAdd(l.startMonth, i); const amt = i === l.instalments - 1 ? r3(l.amount - loanInst(l) * (l.instalments - 1)) : loanInst(l); return { n: i + 1, month: m, amount: amt, paid: (l.paid || []).includes(m) }; });
  const loanBalance = (l) => l.settled ? 0 : r3(l.amount - K.sumBy(loanSchedule(l).filter(s => s.paid), s => s.amount));
  function calcLine(v, month) {
    const days = dim(month), start = month + '-01', end = month + '-' + pad(days);
    if (!v.joinDate || v.joinDate > end) return null;
    if (v.lastWorkingDate && v.lastWorkingDate < start) return null;
    if (v.hrStatus === 'Separated' && !v.lastWorkingDate) return null;
    const from = v.joinDate > start ? v.joinDate : start, to = v.lastWorkingDate && v.lastWorkingDate < end ? v.lastWorkingDate : end;
    const worked = dateDiff(from, to) + 1, f = worked / days;
    const b = basicFor(v, month);
    const allow = {}; (v.allowances || []).forEach(a => { allow[a.code] = r3(a.amount * f); });
    const basic = r3(b * f), allowSum = r3(K.sumBy(Object.values(allow), x => x));
    const g = b + allowTotal(v), dRate = g / SET.payDivisor, hRate = dRate / SET.hoursPerDay;
    const ots = (db.hrOvertime || []).filter(o => o.empId === v.id && o.payrollMonth === month && (o.status === 'Approved' || o.status === 'Paid'));
    const ot = r3(K.sumBy(ots, o => o.hours * hRate * (SET.otRates[o.type] || 1.25)));
    const absDays = (db.hrAttendance || []).filter(a => a.empId === v.id && a.date.startsWith(month) && a.date < T && attStatus(a) === 'Absent').length;
    const absence = r3(absDays * dRate);
    const unpaidDays = K.sumBy((db.hrLeaves || []).filter(l => l.empId === v.id && l.type === 'UL' && l.status === 'Approved' && l.from.startsWith(month)), l => l.days);
    const unpaid = r3(unpaidDays * dRate);
    const loans = (db.hrLoans || []).filter(l => l.empId === v.id && (l.status === 'Active' || l.status === 'Closed')).map(l => ({ no: l.no, settled: l.settled, s: loanSchedule(l).find(s => s.month === month) })).filter(x => x.s && !(x.settled && !x.s.paid));
    const loan = r3(K.sumBy(loans, x => x.s.amount));
    const pc = comp('PIFSS');
    const pBase = Math.min(basic + K.sumBy((v.allowances || []).filter(a => comp(a.code).pifss), a => allow[a.code]), Number(pc.cap || 2750));
    const pifss = v.nationality === 'Kuwaiti' && pc.status !== 'Inactive' ? r3(pBase * Number(pc.pct || 10.5) / 100) : 0;
    const earnings = r3(basic + allowSum + ot), deductions = r3(absence + unpaid + loan + pifss);
    return { empId: v.id, name: v.name, empNo: v.empNo, deptId: v.deptId, designation: v.designation, nationality: v.nationality, days: worked, monthDays: days,
      basic, allow, allowSum, ot, otHours: K.sumBy(ots, o => o.hours), otIds: ots.map(o => o.id), earnings, absDays, absence, unpaidDays, unpaid, loan, loanNos: loans.map(x => x.no), pifss, deductions,
      net: r3(earnings - deductions), bank: v.bank, iban: v.iban, civilId: v.civilId };
  }
  const calcRun = (month) => all().map(v => calcLine(v, month)).filter(Boolean);
  const runOf = (month) => (db.hrPayrollRuns || []).find(r => r.month === month) || null;
  function prevLine(month, empId) { const r = runOf(monthAdd(month, -1)); return r && r.lines ? r.lines.find(l => l.empId === empId) || null : null; }

  /* ---------- End of service (Kuwait Labour Law 6/2010, private sector) ---------- */
  function rules() { return (db.hrIndemnityRules || []).filter(r => r.status !== 'Inactive'); }
  function eosbCalc(c) {
    const v = get(c.empId); if (!v) return null;
    const rs = rules();
    const div = Number((rs.find(r => r.type === 'Divisor') || {}).value || 26);
    const capM = Number((rs.find(r => r.type === 'Cap') || {}).value || 18);
    const totalDays = dateDiff(v.joinDate, c.lastDay) + 1 - Number(c.unpaidDays || 0);
    const yrs = Math.max(0, totalDays / 365);
    const salary = gross(v), dRate = salary / div;
    const steps = rs.filter(r => r.type === 'Accrual').sort((a, b) => a.from - b.from).map(r => {
      const y = Math.max(0, Math.min(yrs, Number(r.to)) - Number(r.from));
      return { label: r.name, years: y, daysPerYear: Number(r.value), days: y * Number(r.value), amount: r3(y * Number(r.value) * dRate) };
    }).filter(s => s.years > 0);
    const raw = r3(K.sumBy(steps, s => s.amount)), cap = r3(salary * capM), capped = Math.min(raw, cap);
    let share = 100, shareRule = 'Full indemnity (' + c.reason.toLowerCase() + ')';
    if (c.reason === 'Resignation') { const r = rs.filter(x => x.type === 'Resignation share').find(x => yrs >= Number(x.from) && yrs < Number(x.to)); share = r ? Number(r.value) : 100; shareRule = r ? r.name : 'Resignation'; }
    const indemnity = r3(capped * share / 100);
    const lb = leaveBal(v.id, 'AL', c.lastDay.slice(0, 4));
    const leaveDays = Math.max(0, lb.balance), leaveEnc = r3(leaveDays * dRate);
    const loans = (db.hrLoans || []).filter(l => l.empId === v.id && l.status === 'Active');
    const loanBal = r3(K.sumBy(loans, l => loanBalance(l)));
    return { empId: v.id, name: v.name, joinDate: v.joinDate, lastDay: c.lastDay, totalDays, years: yrs, basic: v.basic, allowances: allowTotal(v), salary, divisor: div, daily: r3(dRate), steps, raw, capMonths: capM, cap, capped,
      share, shareRule, indemnity, leaveDays, leaveEnc, loanBal, loanNos: loans.map(l => l.no), net: r3(indemnity + leaveEnc - loanBal), at: window.UI.nowStamp() };
  }

  /* ---------- Roster ---------- */
  const shiftCodes = (cell) => String(cell || '').split('+').filter(Boolean);
  function shiftSpan(code, dayIdx) { const s = shift(code); if (!s || s.type !== 'Work' || !s.start) return null; const st = dayIdx * 1440 + toMin(s.start); let en = dayIdx * 1440 + toMin(s.end); if (en <= st) en += 1440; return { st, en, hours: (en - st) / 60 }; }
  function rosterIssues(r, prevR) {
    const out = [];
    Object.entries(r.cells || {}).forEach(([empId, cells]) => {
      const spans = [];
      const prevCells = prevR && prevR.cells ? prevR.cells[empId] : null;
      if (prevCells) shiftCodes(prevCells[6]).forEach(c => { const s = shiftSpan(c, -1); if (s) spans.push(Object.assign(s, { day: -1, code: c })); });
      let hours = 0;
      cells.forEach((cell, k) => {
        const codes = shiftCodes(cell), work = codes.filter(c => shiftSpan(c, k));
        if (work.length > 1) out.push({ empId, day: k, kind: 'Double shift', msg: `${work.join(' + ')} on the same day` });
        const d = K.addDays(r.weekStart, k), lv = onLeave(empId, d);
        if (lv && work.length) out.push({ empId, day: k, kind: 'On approved leave', msg: `${leaveType(lv.type).name} ${lv.no}` });
        work.forEach(c => { const s = shiftSpan(c, k); hours += s.hours; spans.push(Object.assign(s, { day: k, code: c })); });
      });
      spans.sort((a, b) => a.st - b.st);
      for (let i = 1; i < spans.length; i++) {
        const gap = (spans[i].st - spans[i - 1].en) / 60;
        if (spans[i].day === spans[i - 1].day) continue;   // reported as double shift
        if (gap < SET.minRestHours) out.push({ empId, day: spans[i].day, kind: 'Short rest', msg: `${Math.max(0, gap)} h rest between ${spans[i - 1].code} and ${spans[i].code} (minimum ${SET.minRestHours} h)` });
      }
      if (hours > SET.maxWeeklyHours) out.push({ empId, day: null, kind: 'Weekly hours', msg: `${hours} h this week (maximum ${SET.maxWeeklyHours} h)` });
    });
    return out;
  }
  function weekHours(cells) { return (cells || []).reduce((s, cell, k) => s + shiftCodes(cell).reduce((x, c) => { const sp = shiftSpan(c, k); return x + (sp ? sp.hours : 0); }, 0), 0); }
  const SHIFT_COLOR = { M: '#2F6BC5', E: '#E0670E', N: '#7C4DDB', D: '#0891B2', L: '#0E9F6E', NL: '#D23F6A', OC: '#B98900', O: '#8794A7', AL: '#7C4DDB', ML: '#D23F6A' };
  function shiftChip(code, extra) {
    if (!code) return `<span class="muted xs">-</span>`;
    return shiftCodes(code).map(c => { const col = SHIFT_COLOR[c] || '#8794A7'; const s = shift(c); return `<span class="shift-chip" title="${esc(s ? s.name + (s.start ? ' ' + s.start + '-' + s.end : '') : c)}" style="color:${col};background:color-mix(in srgb, ${col} 15%, transparent);border-color:color-mix(in srgb, ${col} 40%, transparent)${extra || ''}">${esc(c)}</span>`; }).join('');
  }

  /* ---------- One-time completion of seeded snapshots ---------- */
  (function init() {
    let changed = false;
    (db.hrPayrollRuns || []).filter(r => !r.lines && r.status !== 'Draft').sort((a, b) => a.month.localeCompare(b.month)).forEach(r => {
      r.lines = calcRun(r.month); r.lines.forEach(l => { const p = prevLine(r.month, l.empId); l.prevNet = p ? p.net : null; }); changed = true;
    });
    (db.hrEosb || []).filter(c => !c.final && (c.status === 'Approved' || c.status === 'Paid')).forEach(c => { c.final = eosbCalc(c); changed = true; });
    (db.hrBankFiles || []).filter(f => !f.rows).forEach(f => { const r = runOf(f.month); if (r && r.lines) { f.rows = r.lines.length; f.total = r3(K.sumBy(r.lines, l => l.net)); changed = true; } });
    if (changed) save();
  })();

  /* Shared page styles (small additions on top of styles.css, colours from CSS variables only). */
  const st = document.createElement('style');
  st.textContent = `.shift-chip{display:inline-flex;align-items:center;justify-content:center;min-width:30px;padding:2px 6px;border-radius:6px;font-size:11.5px;font-weight:800;border:1px solid;line-height:1.35;margin:1px}
  .ros td.cell{cursor:pointer;text-align:center;min-width:74px}.ros td.cell:hover{background:var(--hover)}.ros td.cell.issue{box-shadow:inset 0 0 0 2px var(--warning, #E0A100)}.ros td.cell.locked{cursor:default}
  .ros th.today, .ros td.today{background:color-mix(in srgb, var(--primary-light) 8%, transparent)}
  .pay-steps{display:flex;gap:0;flex-wrap:wrap}.pay-steps .ps{flex:1;min-width:120px;padding:10px 12px;border-bottom:3px solid var(--line);font-size:12.5px;font-weight:700;color:var(--mute);display:flex;gap:8px;align-items:center}
  .pay-steps .ps.done{color:var(--success);border-color:var(--success)}.pay-steps .ps.on{color:var(--primary-light);border-color:var(--primary-light)}
  .calc-t td{padding:7px 10px;border-bottom:1px solid var(--line);font-size:13px}.calc-t td.num{text-align:end;font-variant-numeric:tabular-nums;white-space:nowrap}.calc-t tr.tot td{font-weight:800;border-top:2px solid var(--line-strong)}
  .tbl .cell-main b{white-space:nowrap}.tbl td.actions{white-space:nowrap}
  .slip td,.slip th{padding:5px 8px;font-size:12px;border-bottom:1px solid #ddd;text-align:start}.slip .r{text-align:end}`;
  document.head.appendChild(st);

  window.HR = { SET, all, get, active, base, prof, isAdminEmp, name, userOf, dept, grade, comp, shift, leaveType, loanType, allowTotal, gross, daily, hourly, deptsInUse, empOpts, empCell, empLink,
    dateDiff, dow, weekStart, dim, monthAdd, monthLabel, DAYS, workDays, years, serviceText, toMin, CRED_TYPES, credentials, credBand, docBand, attStatus, lateMins, ATT_TONE,
    leaveBal, onLeave, selfBlock, btn, basicFor, loanInst, loanSchedule, loanBalance, calcLine, calcRun, runOf, prevLine, eosbCalc, rules, shiftCodes, shiftSpan, rosterIssues, weekHours, shiftChip, SHIFT_COLOR, r3 };
})();
