/* Nursing and Wards (SOW V4 Module 4) seed data. Loaded after data-core.js on nursing pages.
 * Every key is prefixed `nursing`. Shared keys (encounters, orders, vitals, beds, stock, invoices) are only read here.
 *
 *   nursingTemplates, nursingDiagnoses, nursingRoutes, nursingFrequencies, nursingPainScales, nursingHandoverTemplates   masters
 *   nursingAssessments    admission assessment and reassessments (Morse, Braden, pain, nutrition) with care plan
 *   nursingNurseOrders    nurse-initiated orders (from the care plan) shown on the order worklist
 *   nursingTaskLog        execution of order tasks (done / not done), keyed by order id and due time
 *   nursingMar            medication administration records (given, held, refused, missed)
 *   nursingIO             fluid intake and output entries
 *   nursingPainLog        pain scores over time
 *   nursingNotes          daily nursing progress notes per shift
 *   nursingHandovers      shift handovers (SBAR per patient)
 *   nursingDischarge      discharge planning checklists
 *   nursingConsumption    patient and departmental item consumption from the ward sub-store
 */
(function () {
  const S = window.SEED;
  const TODAY = S.TODAY;
  let seed = 4042026;
  const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
  const int = (a, b) => a + Math.floor(rnd() * (b - a + 1));
  const pick = (a) => a[Math.floor(rnd() * a.length)];
  const pad = (n, w) => String(n).padStart(w || 2, '0');
  const addDays = (d, n) => { const x = new Date(d + 'T00:00:00'); x.setDate(x.getDate() + n); return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}`; };
  const addMin = (stamp, m) => { const d = new Date(stamp.replace(' ', 'T')); d.setMinutes(d.getMinutes() + m); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`; };
  const CUT = TODAY + ' 07:00';   // seeded activity stops at the start of today's morning shift

  /* ---------- Masters ---------- */
  const nursingTemplates = [
    ['NAT-ADM', 'Adult nursing admission assessment', 'Admission', 'general,morse,pain,braden,nutrition', 'On admission, within 4 hours', 'General ward, ICU, Private'],
    ['NAT-PED', 'Paediatric nursing admission assessment', 'Admission', 'general,pain,braden,nutrition', 'On admission, within 4 hours', 'Paediatric'],
    ['NAT-FALL', 'Fall risk reassessment (Morse)', 'Reassessment', 'morse', 'Every 24 hours and after a fall', 'All wards'],
    ['NAT-SKIN', 'Skin and pressure injury reassessment (Braden)', 'Reassessment', 'braden', 'Every 24 hours; every shift in ICU', 'All wards'],
    ['NAT-PAIN', 'Pain assessment', 'Reassessment', 'pain', 'Every shift and 1 hour after analgesia', 'All wards'],
    ['NAT-NUT', 'Nutrition screening (MST)', 'Screening', 'nutrition', 'On admission and weekly', 'All wards'],
    ['NAT-DAILY', 'Daily nursing reassessment', 'Reassessment', 'general,morse,pain,braden', 'Once daily, morning shift', 'All wards'],
  ].map(([code, name, type, sections, frequency, appliesTo], i) => ({ id: 'nt_' + pad(i + 1), code, name, type, sections, frequency, appliesTo, status: 'Active' }));

  const nursingDiagnoses = [
    ['ND-FALL', 'Risk for falls', 'Safety', 'Morse 45 or more', 'Patient remains free from falls during the stay', 'Bed in low position with brakes on; Call bell within reach; Non-slip footwear; Hourly rounding; Fall risk sign at bedside', 'Every shift'],
    ['ND-SKIN', 'Risk for impaired skin integrity', 'Safety', 'Braden 18 or less', 'Skin remains intact; no new pressure injury', 'Reposition every 2 hours; Pressure-relieving mattress; Keep skin clean and dry; Inspect pressure areas every shift', 'Every 2 hours'],
    ['ND-PAIN', 'Acute pain', 'Comfort', 'Pain score 4 or more', 'Pain score 3 or less within 1 hour of intervention', 'Give analgesia as prescribed; Reassess pain 1 hour after analgesia; Position for comfort; Non-drug measures', 'Every shift'],
    ['ND-INF', 'Risk for infection', 'Safety', 'IV line, catheter or surgical wound', 'No signs of infection at line or wound sites', 'Hand hygiene; Inspect cannula site every shift (VIP score); Aseptic wound care; Monitor temperature', 'Every shift'],
    ['ND-GAS', 'Impaired gas exchange', 'Respiration', 'SpO2 below 94% or oxygen therapy', 'SpO2 94% or more on prescribed oxygen', 'Oxygen as prescribed; Semi-Fowler position; Monitor SpO2 and respiratory rate; Encourage deep breathing', 'Every 4 hours'],
    ['ND-FLUID', 'Deficient fluid volume', 'Nutrition', 'Vomiting, diarrhoea or negative balance', 'Balanced intake and output; urine output 0.5 mL/kg/h or more', 'Strict intake and output; Oral fluids as tolerated; IV fluids as prescribed; Daily weight', 'Every shift'],
    ['ND-GLU', 'Risk for unstable blood glucose', 'Nutrition', 'Diabetes or insulin therapy', 'Blood glucose 4 to 10 mmol/L', 'Glucose before meals and at bedtime; Hypoglycaemia protocol; Diabetic diet; Insulin as prescribed', 'Before meals'],
    ['ND-CARD', 'Decreased cardiac output', 'Circulation', 'Cardiac diagnosis or arrhythmia', 'Stable heart rate and blood pressure within target', 'Cardiac monitoring; Vital signs every 4 hours; Report chest pain at once; Limit exertion', 'Every 4 hours'],
    ['ND-KNOW', 'Deficient knowledge (discharge)', 'Education', 'New diagnosis or new medicines', 'Patient explains medicines and warning signs before discharge', 'Teach-back on medicines; Written leaflet in preferred language; Involve family', 'Once daily'],
    ['ND-ANX', 'Anxiety', 'Psychosocial', 'Patient or family expresses worry', 'Patient states reduced anxiety', 'Explain procedures; Allow questions; Involve family; Refer to social worker if needed', 'Every shift'],
  ].map(([code, name, domain, trigger, goal, interventions, frequency], i) => ({ id: 'ndx_' + pad(i + 1), code, name, domain, trigger, goal, interventions, frequency, status: 'Active' }));

  const nursingRoutes = [
    ['PO', 'Oral', 'By mouth', false], ['IV', 'Intravenous', 'Into a vein (bolus or infusion)', true], ['SC', 'Subcutaneous', 'Under the skin; rotate sites', true], ['IM', 'Intramuscular', 'Into a muscle', true],
    ['INH', 'Inhaled', 'Inhaler or nebuliser', false], ['TOP', 'Topical', 'On the skin', false], ['PR', 'Rectal', 'Per rectum', false], ['SL', 'Sublingual', 'Under the tongue', false], ['NG', 'Nasogastric', 'Through NG tube; flush before and after', false],
  ].map(([code, name, description, site], i) => ({ id: 'nr_' + pad(i + 1), code, name, description, siteRequired: site, status: 'Active' }));

  const nursingFrequencies = [
    ['OD', 'Once daily', '09:00', 1, false], ['BD', 'Twice daily', '09:00,21:00', 2, false], ['TDS', 'Three times daily', '08:00,14:00,22:00', 3, false],
    ['QID', 'Four times daily', '08:00,12:00,16:00,20:00', 4, false], ['Q4H', 'Every 4 hours', '02:00,06:00,10:00,14:00,18:00,22:00', 6, false], ['Q6H', 'Every 6 hours', '00:00,06:00,12:00,18:00', 4, false],
    ['Q8H', 'Every 8 hours', '06:00,14:00,22:00', 3, false], ['Q2H', 'Every 2 hours', '00:00,02:00,04:00,06:00,08:00,10:00,12:00,14:00,16:00,18:00,20:00,22:00', 12, false], ['HS', 'At night', '22:00', 1, false],
    ['INF8', 'Over 8 hours', '06:00,14:00,22:00', 3, false], ['SHIFT', 'Every shift', '08:00,16:00,00:00', 3, false], ['AC', 'Before meals and at bedtime', '07:00,12:00,18:00,22:00', 4, false],
    ['PRN4', 'Every 4 hours as needed', '', 0, true], ['PRN6', 'Every 6 hours as needed', '', 0, true], ['PRN8', 'Every 8 hours as needed', '', 0, true], ['STAT', 'Once only (STAT)', '', 1, false],
  ].map(([code, name, times, perDay, prn], i) => ({ id: 'nf_' + pad(i + 1), code, name, times, perDay, prn, minHours: prn ? +code.replace(/\D/g, '') : '', status: 'Active' }));

  const nursingPainScales = [
    ['NRS', 'Numeric Rating Scale (0-10)', 'Self-report', 'Adults and children 8 years and over', '0-10', 60],
    ['FACES', 'Wong-Baker FACES', 'Self-report', 'Children 3 to 7 years', '0-10', 60],
    ['FLACC', 'FLACC behavioural scale', 'Observational', 'Infants and non-verbal children', '0-10', 60],
    ['CPOT', 'Critical-Care Pain Observation Tool', 'Observational', 'ICU, sedated or ventilated adults', '0-8', 30],
    ['PAINAD', 'Pain Assessment in Advanced Dementia', 'Observational', 'Adults with dementia', '0-10', 60],
  ].map(([code, name, type, population, range, reassessMins], i) => ({ id: 'ps_' + pad(i + 1), code, name, type, population, range, reassessMins, status: 'Active' }));

  const nursingHandoverTemplates = [
    ['HO-SBAR', 'SBAR shift handover (adult wards)', 'SBAR', 'General ward', 'Situation; Background; Assessment; Recommendation', true],
    ['HO-ICU', 'ICU bedside handover', 'SBAR', 'ICU', 'Situation; Background; Assessment (systems, lines, drips); Recommendation; Safety checks', true],
    ['HO-PED', 'Paediatric handover with parent', 'SBAR', 'Paediatric', 'Situation; Background; Assessment; Recommendation; Family concerns', true],
    ['HO-ISBAR', 'I-SBAR transfer handover', 'I-SBAR', 'All wards', 'Identify; Situation; Background; Assessment; Recommendation', false],
  ].map(([code, name, format, wardType, sections, bedside], i) => ({ id: 'ht_' + pad(i + 1), code, name, format, wardType, sections, bedside, status: 'Active' }));

  /* ---------- Working data ---------- */
  const ipd = S.encounters.filter(e => e.type === 'IPD');
  const bedOf = (e) => S.beds.find(b => b.id === e.bedId) || {};
  const wardNurses = (e) => { const w = bedOf(e).wardId; const l = S.nurses.filter(n => n.wardId === w); return l.length ? l : S.nurses; };
  const ptOf = (e) => S.patients.find(p => p.id === e.patientId) || {};
  const ageY = (p) => p.dob ? 2026 - +p.dob.slice(0, 4) : 40;
  const shiftOf = (stamp) => { const h = +stamp.slice(11, 13); return h >= 7 && h < 15 ? 'Morning' : h >= 15 && h < 23 ? 'Evening' : 'Night'; };

  // Assessments (all admitted except the patient admitted today, whose assessment is due)
  const nursingAssessments = [];
  const nursingNurseOrders = [];
  ipd.forEach((e, i) => {
    if (e.start.slice(0, 10) === TODAY) return;
    const p = ptOf(e), w = bedOf(e).wardId, ped = w === 'wd_03';
    const morse = { history: i % 4 === 0 ? 25 : 0, secondary: (p.chronic || []).length ? 15 : 0, aid: [0, 0, 15, 30][i % 4], iv: 20, gait: [0, 10, 20, 10][i % 4], mental: i % 5 === 2 ? 15 : 0 };
    const braden = { sensory: w === 'wd_04' ? 2 : int(3, 4), moisture: int(3, 4), activity: w === 'wd_04' ? 1 : int(2, 4), mobility: w === 'wd_04' ? 2 : int(2, 4), nutrition: int(2, 4), friction: w === 'wd_04' ? 1 : int(2, 3) };
    const mScore = Object.values(morse).reduce((s, v) => s + v, 0), bScore = Object.values(braden).reduce((s, v) => s + v, 0);
    const pain = { scale: ped ? (ageY(p) < 3 ? 'FLACC' : 'FACES') : w === 'wd_04' ? 'CPOT' : 'NRS', score: int(0, 6), location: pick(['Chest', 'Abdomen', 'Surgical site', 'Lower back', 'Right wrist', 'Headache']), character: pick(['Aching', 'Sharp', 'Dull', 'Throbbing', 'Burning']), onset: 'Since admission' };
    const dx = [];
    if (mScore >= 45) dx.push('ndx_01');
    if (bScore <= 18) dx.push('ndx_02');
    if (pain.score >= 4) dx.push('ndx_03');
    dx.push(/I2|I4|I10/.test(e.diagnosis) ? 'ndx_08' : /J18|J45/.test(e.diagnosis) ? 'ndx_05' : /E11/.test(e.diagnosis) ? 'ndx_07' : /A09/.test(e.diagnosis) ? 'ndx_06' : 'ndx_04');
    const at = addMin(e.start, 60 + int(0, 90)), by = pick(wardNurses(e)).name;
    nursingAssessments.push({
      id: 'na_' + pad(nursingAssessments.length + 1, 3), no: 'NA-26-' + (5100 + nursingAssessments.length), templateId: ped ? 'nt_02' : 'nt_01', encounterId: e.id, patientId: e.patientId, at, by, status: 'Completed',
      general: { arrival: e.admissionType === 'Emergency' ? 'Stretcher from ER' : pick(['Wheelchair', 'Walking', 'Stretcher']), accompanied: pick(['Spouse', 'Son', 'Daughter', 'Mother', 'Alone']), orientation: true, idBand: true, allergiesChecked: true, height: ped ? int(90, 140) : int(150, 186), weight: ped ? int(14, 38) : int(52, 104), mobility: pick(['Independent', 'Needs assistance', 'Bed bound']), communication: p.lang || 'Arabic', valuables: pick(['Handed to family', 'None', 'Kept in safe']), isolation: /J18|A09/.test(e.diagnosis) ? 'Droplet precautions' : 'None', notes: '' },
      morse, morseScore: mScore, braden, bradenScore: bScore, pain, nutrition: { weightLoss: int(0, 2), appetite: int(0, 1) },
      carePlan: dx.map(d => ({ diagnosisId: d, goal: nursingDiagnoses.find(x => x.id === d).goal, status: 'Active', evaluation: '', at })),
    });
    // Daily reassessment for long stays
    if (e.start.slice(0, 10) <= addDays(TODAY, -2)) {
      const m2 = Object.assign({}, morse, { iv: 20, history: morse.history });
      nursingAssessments.push({ id: 'na_' + pad(nursingAssessments.length + 1, 3), no: 'NA-26-' + (5100 + nursingAssessments.length), templateId: 'nt_07', encounterId: e.id, patientId: e.patientId, at: addDays(TODAY, -1) + ' 09:' + pad(int(10, 50)), by: pick(wardNurses(e)).name, status: 'Completed',
        general: { mobility: pick(['Independent', 'Needs assistance']), notes: 'Reassessed on morning round.' }, morse: m2, morseScore: Object.values(m2).reduce((s, v) => s + v, 0), braden, bradenScore: bScore, pain: Object.assign({}, pain, { score: Math.max(0, pain.score - 2) }), carePlan: [] });
    }
    if (bScore <= 14) nursingNurseOrders.push({ id: 'nno_' + pad(nursingNurseOrders.length + 1), no: 'NOR-26-' + (800 + nursingNurseOrders.length), encounterId: e.id, patientId: e.patientId, name: 'Turn and reposition, check pressure areas', frequency: 'Every 2 hours', source: 'Care plan: Risk for impaired skin integrity', status: 'Active', at, by });
    if (mScore >= 45) nursingNurseOrders.push({ id: 'nno_' + pad(nursingNurseOrders.length + 1), no: 'NOR-26-' + (800 + nursingNurseOrders.length), encounterId: e.id, patientId: e.patientId, name: 'Fall precautions round (bed low, call bell, footwear)', frequency: 'Every shift', source: 'Care plan: Risk for falls', status: 'Active', at, by });
  });



  // Scheduled times by frequency name
  const timesOf = (name) => { const f = nursingFrequencies.find(x => x.name === name); return f && f.times ? f.times.split(',') : []; };
  const careTimes = (name) => /every 4 hours/i.test(name) ? timesOf('Every 4 hours') : /glucose/i.test(name) ? timesOf('Before meals and at bedtime') : /intake and output/i.test(name) ? ['06:00', '14:00', '22:00'] : timesOf('Every shift');

  // Medication administration history
  const nursingMar = [];
  const reasonsHeld = ['SBP below 100 mmHg, doctor informed', 'Nil by mouth for procedure', 'Heart rate below 55, doctor informed', 'Blood glucose 4.2 mmol/L, insulin held per protocol'];
  const isHigh = (it) => /Opioid|Anticoagulant/.test(it.category) || /insulin/i.test(it.name);
  S.orders.filter(o => o.type === 'med' && o.setting === 'IPD' && o.status === 'Active').forEach((o, oi) => {
    const e = ipd.find(x => x.id === o.encounterId); if (!e) return;
    const it = S.items.find(x => x.id === o.itemId) || {};
    const nurses = wardNurses(e);
    const times = timesOf(o.frequency);
    for (let d = e.start.slice(0, 10); d <= TODAY; d = addDays(d, 1)) {
      if (times.length) times.forEach((t) => {
        const due = d + ' ' + t;
        if (due < e.start || due >= CUT) return;
        const r = rnd(), n = pick(nurses).name;
        let st = 'Given', reason = '';
        if (r < 0.04) { st = 'Held'; reason = pick(reasonsHeld); } else if (r < 0.07) { st = 'Refused'; reason = 'Patient refused, counselled, doctor informed'; } else if (r < 0.09) { st = 'Missed'; reason = pick(['Patient off ward in Radiology', 'Medicine not available on ward', 'IV access lost, re-sited later']); }
        const witness = st === 'Given' && isHigh(it) ? pick(nurses.filter(x => x.name !== n).concat(S.nurses.filter(x => x.name !== n))).name : '';
        nursingMar.push({ id: 'mar_' + pad(nursingMar.length + 1, 4), orderId: o.id, encounterId: o.encounterId, patientId: o.patientId, due, status: st, at: st === 'Missed' ? addMin(due, 120) : addMin(due, int(-10, st === 'Given' ? 50 : 20)), by: n, dose: o.dose, route: o.route, site: /Subcutaneous/.test(o.route) ? pick(['Abdomen left', 'Abdomen right', 'Thigh left']) : /Intravenous/.test(o.route) ? 'IV cannula, left forearm' : '', reason, note: '', witness, prn: false, checks: st === 'Given' ? 5 : 0 });
      });
      else if (/as needed/.test(o.frequency) && d < TODAY && rnd() < 0.7) {
        const due = d + ' ' + pad(int(8, 21)) + ':' + pad(int(0, 59)); const n = pick(nurses).name;
        nursingMar.push({ id: 'mar_' + pad(nursingMar.length + 1, 4), orderId: o.id, encounterId: o.encounterId, patientId: o.patientId, due: '', status: 'Given', at: due, by: n, dose: o.dose, route: o.route, site: 'IV cannula, left forearm', reason: '', note: /Morphine/.test(o.name) ? 'Pain 7/10; reassessed after 1 hour: 3/10' : 'Nausea; settled after 30 minutes', indication: /Morphine/.test(o.name) ? 'Pain 7/10' : 'Nausea', witness: isHigh(it) ? pick(S.nurses.filter(x => x.name !== n)).name : '', prn: true, checks: 5 });
      }
    }
  });

  // Order execution history (care, diet, nurse orders) before the morning shift
  const nursingTaskLog = [];
  ipd.forEach((e) => {
    const nurses = wardNurses(e);
    const tasks = S.orders.filter(o => o.encounterId === e.id && o.status === 'Active' && (o.type === 'care' || o.type === 'diet')).map(o => ({ id: o.id, times: o.type === 'diet' ? (/Nil by mouth/.test(o.name) ? ['22:00'] : ['08:00', '13:00', '19:00']) : careTimes(o.name) }))
      .concat(nursingNurseOrders.filter(n => n.encounterId === e.id).map(n => ({ id: n.id, times: timesOf(n.frequency) })));
    tasks.forEach(t => {
      for (let d = addDays(TODAY, -1); d <= TODAY; d = addDays(d, 1)) t.times.forEach(tm => {
        const due = d + ' ' + tm; if (due < e.start || due >= CUT) return;
        const nd = rnd() < 0.05;
        nursingTaskLog.push({ id: 'ntl_' + pad(nursingTaskLog.length + 1, 4), key: t.id + '|' + due, orderId: t.id, encounterId: e.id, patientId: e.patientId, due, outcome: nd ? 'Not done' : 'Done', at: addMin(due, int(0, 45)), by: pick(nurses).name, note: '', reason: nd ? pick(['Patient asleep, deferred to next round', 'Patient off ward', 'Patient refused']) : '' });
      });
    });
  });

  // Fluid intake and output, pain log
  const nursingIO = [], nursingPainLog = [];
  ipd.forEach((e, i) => {
    const nurses = wardNurses(e), ped = bedOf(e).wardId === 'wd_03';
    const hasIV = S.orders.some(o => o.encounterId === e.id && o.type === 'med' && /Sodium chloride/.test(o.name));
    let t = addMin(e.start, 30);
    const k = ped ? 0.45 : 1;
    const IOCUT = TODAY + ' 11:00';
    while (t < IOCUT) {
      const h = +t.slice(11, 13);
      if (h >= 6 && h <= 22) nursingIO.push({ id: 'io_' + pad(nursingIO.length + 1, 4), encounterId: e.id, patientId: e.patientId, at: t, kind: 'Intake', route: pick(['Oral', 'Oral', 'Oral', 'Feed']), item: pick(['Water', 'Juice', 'Tea', 'Soup', 'Milk']), volume: Math.round(k * int(180, 360) / 10) * 10, by: pick(nurses).name, note: '' });
      if (hasIV || i % 3 === 0) nursingIO.push({ id: 'io_' + pad(nursingIO.length + 1, 4), encounterId: e.id, patientId: e.patientId, at: addMin(t, 10), kind: 'Intake', route: 'IV', item: hasIV ? 'Sodium chloride 0.9%' : 'IV antibiotic infusion', volume: hasIV ? 375 : 100, by: pick(nurses).name, note: '' });
      nursingIO.push({ id: 'io_' + pad(nursingIO.length + 1, 4), encounterId: e.id, patientId: e.patientId, at: addMin(t, 40), kind: 'Output', route: 'Urine', item: e.bedId.includes('ICU') ? 'Foley catheter' : 'Voided', volume: Math.round(k * int(160, 360) / 10) * 10, by: pick(nurses).name, note: '' });
      if (/A09/.test(e.diagnosis) && rnd() < 0.5) nursingIO.push({ id: 'io_' + pad(nursingIO.length + 1, 4), encounterId: e.id, patientId: e.patientId, at: addMin(t, 70), kind: 'Output', route: pick(['Vomit', 'Stool']), item: 'Loose', volume: int(60, 160), by: pick(nurses).name, note: '' });
      if (/K35|K21/.test(e.diagnosis) && rnd() < 0.6) nursingIO.push({ id: 'io_' + pad(nursingIO.length + 1, 4), encounterId: e.id, patientId: e.patientId, at: addMin(t, 80), kind: 'Output', route: 'Drain', item: 'Wound drain', volume: int(20, 80), by: pick(nurses).name, note: 'Serosanguinous' });
      t = addMin(t, int(180, 260));
    }
  });
  const scaleFor = (e) => { const w = bedOf(e).wardId, p = ptOf(e); return w === 'wd_03' ? (ageY(p) < 3 ? 'FLACC' : 'FACES') : w === 'wd_04' ? 'CPOT' : 'NRS'; };
  S.vitals.filter(v => v.at < CUT && ipd.some(e => e.id === v.encounterId)).forEach(v => {
    const e = ipd.find(x => x.id === v.encounterId);
    nursingPainLog.push({ id: 'pl_' + pad(nursingPainLog.length + 1, 4), encounterId: v.encounterId, patientId: v.patientId, at: v.at, scale: scaleFor(e), score: v.pain, location: v.pain ? pick(['Chest', 'Abdomen', 'Surgical site', 'Lower back', 'Head']) : '', intervention: v.pain >= 4 ? pick(['Paracetamol 1 g oral given', 'Repositioned and cold pack applied', 'Morphine 2 mg IV given (PRN)']) : '', reassessed: v.pain >= 4 ? Math.max(0, v.pain - int(2, 4)) : '', by: v.by, source: 'Vitals' });
  });

  // Progress notes
  const noteText = {
    Morning: ['Alert and oriented. Vital signs stable. Tolerating diet. Ambulating to bathroom with assistance. IV site clean, no redness. Plan explained to patient.', 'Seen on doctor round; plan to continue IV antibiotics. Pain controlled with oral analgesia. Encouraged oral fluids.', 'Patient comfortable. Wound dressing dry and intact. Mobilised to chair for 30 minutes. Family visited and updated.'],
    Evening: ['Rested in the afternoon. Meals taken well. Evening medicines given as charted. No complaints of chest pain.', 'Temperature 38.1 at 18:00, paracetamol given, doctor informed; blood culture taken as ordered. Reassessed: 37.4.', 'Stable evening. Fluid balance chart maintained. Patient asked about discharge; information given.'],
    Night: ['Slept well through the night. Turned two-hourly. Observations within normal limits. Call bell within reach.', 'Woke at 02:00 with pain 6/10, PRN analgesia given, reassessed 2/10 after one hour. Settled.', 'Restless around midnight, reoriented, bed in low position. No falls. Morning bloods due.'],
  };
  const nursingNotes = [];
  ipd.forEach((e) => {
    const nurses = wardNurses(e);
    [[addDays(TODAY, -1), 'Morning', '13:40'], [addDays(TODAY, -1), 'Evening', '21:50'], [TODAY, 'Night', '06:30']].forEach(([d, sh, tm], k) => {
      const at = d + ' ' + tm; if (at < e.start) return;
      nursingNotes.push({ id: 'nn_' + pad(nursingNotes.length + 1, 4), encounterId: e.id, patientId: e.patientId, date: sh === 'Night' ? addDays(d, -1) : d, shift: sh, at, by: pick(nurses).name, type: k === 1 && rnd() < 0.3 ? 'Event' : 'Shift progress', data: pick(noteText[sh]), action: '', response: '', status: 'Signed' });
    });
  });

  // Shift handovers
  const nursingHandovers = [];
  const sbarFor = (e) => {
    const p = ptOf(e), b = bedOf(e);
    return { encounterId: e.id, s: `${b.no}: ${e.reason}. Day ${Math.max(1, Math.round((new Date(TODAY) - new Date(e.start.slice(0, 10))) / 864e5) + 1)} of stay.`, b: `Admitted ${e.start.slice(0, 10)} under ${(S.doctors.find(d => d.id === e.doctorId) || {}).name}. Allergies: ${(p.allergies || []).join(', ') || 'none known'}.`, a: 'Observations stable overnight. Pain controlled. Tolerating diet.', r: 'Continue current plan. Morning bloods due. Review on doctor round.' };
  };
  ['wd_01', 'wd_02', 'wd_03', 'wd_04', 'wd_05'].forEach((w, wi) => {
    const list = ipd.filter(e => bedOf(e).wardId === w);
    const ns = S.nurses.filter(n => n.wardId === w);
    const out = (ns[1] || ns[0] || S.nurses[1]).name, inn = (ns[0] || S.nurses[0]).name;
    nursingHandovers.push({ id: 'nh_' + pad(nursingHandovers.length + 1), no: 'HO-26-' + (2200 + nursingHandovers.length), wardId: w, date: addDays(TODAY, -1), fromShift: 'Evening', toShift: 'Night', at: addDays(TODAY, -1) + ' 22:55', by: inn, to: out, status: 'Accepted', acceptedBy: out, acceptedAt: addDays(TODAY, -1) + ' 23:10', templateId: w === 'wd_04' ? 'ht_02' : w === 'wd_03' ? 'ht_03' : 'ht_01', items: list.map(sbarFor) });
    const pending = w === 'wd_01';
    nursingHandovers.push({ id: 'nh_' + pad(nursingHandovers.length + 1), no: 'HO-26-' + (2200 + nursingHandovers.length), wardId: w, date: addDays(TODAY, -1), fromShift: 'Night', toShift: 'Morning', at: TODAY + ' 06:55', by: pending ? 'Grace Fernandes' : out, to: pending ? '' : inn, status: pending ? 'Pending acceptance' : 'Accepted', acceptedBy: pending ? '' : inn, acceptedAt: pending ? '' : TODAY + ' 07:12', templateId: w === 'wd_04' ? 'ht_02' : w === 'wd_03' ? 'ht_03' : 'ht_01', items: list.map(sbarFor) });
  });

  // Discharge planning
  const nursingDischarge = [];
  ipd.filter(e => e.status === 'Discharge planned' || e.expectedDischarge <= addDays(TODAY, 0)).slice(0, 4).forEach((e, i) => {
    const by = pick(wardNurses(e)).name;
    const done = (k) => ({ done: true, by, at: addDays(TODAY, -1) + ' ' + pad(10 + k) + ':15', note: '' });
    nursingDischarge.push({ id: 'nd_' + pad(i + 1), encounterId: e.id, patientId: e.patientId, plannedDate: e.expectedDischarge < TODAY ? TODAY : e.expectedDischarge, status: 'In progress', createdBy: by, createdAt: addDays(TODAY, -1) + ' 09:30',
      items: { education: i === 0 ? Object.assign(done(1), { topics: ['Medicines', 'Diet', 'Warning signs'] }) : { done: false, topics: ['Medicines'] }, medicines: i === 0 ? done(2) : { done: false }, followup: i < 2 ? Object.assign(done(3), { date: addDays(TODAY, 7), doctorId: e.doctorId }) : { done: false }, transport: { done: false, mode: '' }, lines: i === 0 ? done(4) : { done: false }, belongings: { done: false }, summary: { done: false } } });
  });

  // Item consumption from Ward 3 sub-store
  const nursingConsumption = [];
  const ward3 = ipd.filter(e => bedOf(e).wardId === 'wd_01');
  const subStock = S.stock.filter(s => s.warehouseId === 'wh_04');
  const lineOf = (code, qty, billable) => { const it = S.items.find(x => x.code === code); const sk = subStock.find(s => s.itemId === it.id) || {}; return { itemId: it.id, qty, batches: [{ stockId: sk.id, batch: sk.batch, qty }], billable, price: it.price, amount: billable ? +(it.price * qty).toFixed(3) : 0 }; };
  [[0, [['CON-002', 1, true], ['CON-001', 4, true], ['CON-009', 2, true]], -1, '10:20'], [1, [['CON-010', 1, true], ['CON-004', 1, true]], -1, '15:40'], [2, [['CON-001', 6, true]], -1, '21:05'], [3, [['CON-002', 1, true], ['CON-007', 2, false], ['CON-008', 2, false]], 0, '05:40'], [4, [['CON-009', 3, true], ['CON-004', 1, true]], -2, '11:00']].forEach(([pi, lines, dOff, tm], i) => {
    const e = ward3[pi % ward3.length]; const ls = lines.map(l => lineOf(l[0], l[1], l[2]));
    nursingConsumption.push({ id: 'nc_' + pad(i + 1, 3), no: 'NIC-26-' + (4100 + i), kind: 'Patient', encounterId: e.id, patientId: e.patientId, wardId: 'wd_01', warehouseId: 'wh_04', billing: ls.some(l => l.billable), lines: ls, total: +ls.reduce((s, l) => s + l.amount, 0).toFixed(3), at: addDays(TODAY, dOff) + ' ' + tm, by: pick(['Maria Santos', 'Grace Fernandes']), status: 'Posted', note: '' });
  });
  [[['CON-003', 2], ['CON-005', 1]], [['CON-006', 10], ['CON-004', 2]]].forEach((lines, i) => {
    const ls = lines.map(l => lineOf(l[0], l[1], false));
    nursingConsumption.push({ id: 'nc_' + pad(10 + i, 3), no: 'NIC-26-' + (4110 + i), kind: 'Department', encounterId: null, patientId: null, wardId: 'wd_01', warehouseId: 'wh_04', costCentre: 'Nursing, Ward 3', billing: false, lines: ls, total: 0, at: addDays(TODAY, -1 - i) + ' 08:30', by: 'Maria Santos', status: 'Posted', note: i === 0 ? 'Weekly ward use' : 'Specimen and dressing trolley top-up' });
  });

  Object.assign(S, { nursingTemplates, nursingDiagnoses, nursingRoutes, nursingFrequencies, nursingPainScales, nursingHandoverTemplates,
    nursingAssessments, nursingNurseOrders, nursingTaskLog, nursingMar, nursingIO, nursingPainLog, nursingNotes, nursingHandovers, nursingDischarge, nursingConsumption });
})();
