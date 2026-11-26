/* Incident Management seed (SOW V4 Module 8). Dummy data only.
 * Loaded after data-core.js. Every key starts with "incident".
 *   incidentCategories, incidentTypes, incidentEscalation, incidentStatuses, incidentTeam   masters and configuration
 *   incidentCases   incident reports with categorization, investigators, enquiries, decisions, actions, closure and history
 * Statuses follow SOW V4: Open -> In Progress -> Hold -> Closed.
 * Anonymous reports never store the reporter: reporterUserId and reporterName stay empty. */
(function () {
  const S = window.SEED;
  const T = S.TODAY;
  let seed = 8820261125;
  const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
  const pick = (a) => a[Math.floor(rnd() * a.length)];
  const int = (a, b) => a + Math.floor(rnd() * (b - a + 1));
  const pad = (n, w) => String(n).padStart(w || 2, '0');
  const addDays = (d, n) => { const x = new Date(d + 'T00:00:00'); x.setDate(x.getDate() + n); return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}`; };
  const at = (d, h, m) => `${d} ${pad(h)}:${pad(m)}`;

  const incidentCategories = [
    ['PS', 'Patient safety', 'Events that reached or could have reached a patient.', 'High'],
    ['MED', 'Medication', 'Prescribing, dispensing and administration errors.', 'High'],
    ['FALL', 'Slips, trips and falls', 'Falls of patients, visitors or staff.', 'Medium'],
    ['EQP', 'Equipment and devices', 'Medical equipment failure or misuse.', 'Medium'],
    ['OHS', 'Occupational health and safety', 'Staff injuries, needle-stick and exposure.', 'Medium'],
    ['SEC', 'Security and behaviour', 'Violence, aggression, theft and unauthorised access.', 'High'],
    ['FAC', 'Facility and environment', 'Fire, water leaks, power and building issues.', 'Low'],
    ['INF', 'Information governance', 'Privacy breaches and record errors.', 'Medium'],
    ['IPC', 'Infection prevention', 'Exposure, outbreaks and hand hygiene lapses.', 'Medium'],
  ].map(([code, name, description, defaultSeverity], i) => ({ id: 'ic_' + pad(i + 1), code, name, description, defaultSeverity, status: 'Active' }));

  const incidentTypes = [
    ['PS-ID', 'Patient identification error', 'PS', 'High'], ['PS-DLY', 'Delay in treatment', 'PS', 'Medium'], ['PS-SPEC', 'Specimen labelling error', 'PS', 'Medium'], ['PS-PRES', 'Pressure injury', 'PS', 'Medium'],
    ['MED-DOSE', 'Wrong dose', 'MED', 'High'], ['MED-PT', 'Wrong patient', 'MED', 'Critical'], ['MED-OMIT', 'Omitted dose', 'MED', 'Medium'], ['MED-ALG', 'Allergy not checked', 'MED', 'High'],
    ['FALL-INJ', 'Fall with injury', 'FALL', 'High'], ['FALL-NI', 'Fall without injury', 'FALL', 'Low'],
    ['EQP-FAIL', 'Equipment failure', 'EQP', 'Medium'], ['EQP-USE', 'Equipment used incorrectly', 'EQP', 'Medium'],
    ['OHS-NSI', 'Needle-stick injury', 'OHS', 'Medium'], ['OHS-INJ', 'Staff injury at work', 'OHS', 'Medium'],
    ['SEC-VIO', 'Verbal or physical aggression', 'SEC', 'High'], ['SEC-THF', 'Theft or loss of property', 'SEC', 'Low'],
    ['FAC-WTR', 'Water leak', 'FAC', 'Low'], ['FAC-FIRE', 'Fire alarm or smoke', 'FAC', 'High'], ['FAC-PWR', 'Power outage', 'FAC', 'Medium'],
    ['INF-PRIV', 'Privacy breach', 'INF', 'High'], ['INF-REC', 'Wrong record filed', 'INF', 'Medium'],
    ['IPC-EXP', 'Body fluid exposure', 'IPC', 'Medium'], ['IPC-HH', 'Hand hygiene lapse', 'IPC', 'Low'],
  ].map(([code, name, categoryCode, defaultSeverity], i) => ({ id: 'it_' + pad(i + 1), code, name, categoryCode, defaultSeverity, status: 'Active' }));

  const incidentStatuses = [
    ['OPEN', 'Open', 1, 'In Progress, Hold, Closed', false, false, 'Received and routed to the Incident Management Team.'],
    ['INPR', 'In Progress', 2, 'Hold, Closed', true, false, 'Investigation under way.'],
    ['HOLD', 'Hold', 3, 'In Progress, Closed', true, false, 'Waiting for information, a third party or a decision.'],
    ['CLSD', 'Closed', 4, 'In Progress', true, true, 'Investigation finished with an outcome. Reopening needs a reason.'],
  ].map(([code, name, seq, allowedNext, reasonRequired, outcomeRequired, description], i) => ({ id: 'is_' + pad(i + 1), code, name, seq, allowedNext, reasonRequired, outcomeRequired, description, status: 'Active' }));

  const incidentEscalation = [
    ['NTF-NEW', 'New incident received', 'On submit', 'All', 'All', 'Incident Management Team', 'In-app and email', 0],
    ['NTF-CRIT', 'Critical or high severity', 'On submit', 'All', 'Critical, High', 'IMT Lead and Medical Director', 'In-app, email and SMS', 0],
    ['NTF-MED', 'Medication incident', 'On submit', 'MED', 'All', 'Pharmacy Head', 'In-app and email', 0],
    ['NTF-ASG', 'Investigator assigned', 'On assignment', 'All', 'All', 'Assigned investigator', 'In-app and email', 0],
    ['ESC-UNA', 'Not assigned within 24 hours', 'Unassigned', 'All', 'All', 'IMT Lead', 'In-app and email', 24],
    ['ESC-OPN', 'Still open after 14 days', 'Open too long', 'All', 'High, Critical', 'Quality Director', 'Email', 336],
    ['NTF-CLS', 'Incident closed', 'On closure', 'All', 'All', 'Reporter (named reports only)', 'In-app', 0],
  ].map(([code, name, trigger, categories, severities, notify, channel, afterHours], i) => ({ id: 'ie_' + pad(i + 1), code, name, trigger, categories, severities, notify, channel, afterHours, status: 'Active' }));

  // Incident Management Team: user roles and access.
  const incidentTeam = [
    ['IMT-01', 'us_17', 'Hospital Demo', 'IMT Lead', 'All categories', true, true, true],
    ['IMT-02', 'us_01', 'Sara Al-Mutairi', 'Quality Officer', 'All categories', true, true, true],
    ['IMT-03', 'us_04', 'Maria Santos', 'Investigator', 'Patient safety, Slips, trips and falls', false, false, false],
    ['IMT-04', 'us_06', 'Ahmed Farouk', 'Investigator', 'Medication', false, false, false],
    ['IMT-05', 'us_05', 'Omar Haddad', 'Investigator', 'Facility and environment, Security and behaviour', false, false, false],
    ['IMT-06', 'us_11', 'Layla Hussain', 'Investigator', 'Information governance', false, false, false],
    ['IMT-07', 'us_02', 'Dr. Khalid Al-Rashidi', 'Clinical Reviewer', 'Patient safety, Medication', false, false, true],
  ].map(([code, userId, name, role, scope, canAssign, canClose, notifyNew], i) => ({ id: 'im_' + pad(i + 1), code, userId, name, role, scope, canAssign, canClose, notifyNew, status: 'Active' }));

  /* ---------- Cases ---------- */
  const locations = [['dp_03', 'Ward 3, Medical'], ['dp_03', 'Ward 4, Surgical'], ['dp_03', 'Intensive Care Unit'], ['dp_02', 'Paediatric Ward'], ['dp_01', 'OPD Cardiology clinic'], ['dp_04', 'Outpatient Pharmacy'], ['dp_06', 'Laboratory, sample reception'], ['dp_10', 'Radiology, CT room'], ['dp_05', 'Main reception'], ['dp_05', 'Car park B1'], ['dp_03', 'Emergency department']];
  const stories = {
    'PS-ID': ['Wristband on the patient showed a different MRN from the chart. Found during the morning medication round before any medicine was given.', 'Checked identity with two identifiers, replaced the wristband and informed the charge nurse.'],
    'PS-DLY': ['Patient with chest pain waited 55 minutes for ECG because the ECG machine was in use in another bay.', 'ECG done on the second machine; doctor informed.'],
    'PS-SPEC': ['Blood sample received in the lab with the label of the patient in the next bed.', 'Sample rejected, new sample collected and the ward informed.'],
    'PS-PRES': ['Grade 2 pressure injury found on the sacrum of a bedridden patient on day 5 of admission.', 'Repositioning chart started, wound care nurse referral made.'],
    'MED-DOSE': ['Enoxaparin 80 mg given instead of the prescribed 40 mg.', 'Doctor informed, patient monitored for bleeding, anti-Xa level requested.'],
    'MED-PT': ['Oral medicines for bed 4 given to the patient in bed 5.', 'Doctor reviewed the patient immediately; vital signs stable; family informed.'],
    'MED-OMIT': ['Evening dose of ceftriaxone missed because the medicine was not delivered from the pharmacy.', 'Dose given 3 hours late after pharmacy delivered it.'],
    'MED-ALG': ['Amoxicillin dispensed to a patient with a recorded penicillin allergy. Stopped at the bedside by the nurse.', 'Medicine not given; prescriber and pharmacist informed.'],
    'FALL-INJ': ['Elderly patient fell while walking to the bathroom at night and cut the forehead.', 'Wound cleaned and sutured, CT head done, fall risk reassessed.'],
    'FALL-NI': ['Visitor slipped on a wet floor near the lift lobby. No injury.', 'Wet floor sign placed and housekeeping called.'],
    'EQP-FAIL': ['Infusion pump alarmed and stopped mid-infusion twice in one hour.', 'Pump replaced and tagged out of service; biomedical engineering called.'],
    'EQP-USE': ['Glucometer used without daily quality control for 3 days.', 'Glucometer removed; QC done before reuse.'],
    'OHS-NSI': ['Staff nurse had a needle-stick injury while recapping a used needle.', 'Wound washed, reported to occupational health, baseline bloods taken.'],
    'OHS-INJ': ['Porter strained his back moving a patient without a slide sheet.', 'Sent to the staff clinic; light duties advised.'],
    'SEC-VIO': ['Relative shouted at and pushed a receptionist after a long wait.', 'Security called; the relative was escorted out; staff member supported.'],
    'SEC-THF': ['Patient reported a missing mobile phone from the bedside locker.', 'Security informed, CCTV review requested.'],
    'FAC-WTR': ['Water leaking from the ceiling above the corridor outside room 312.', 'Area cordoned off, maintenance called.'],
    'FAC-FIRE': ['Smoke from a kettle in the staff pantry set off the fire alarm.', 'Area checked by security; alarm reset; kettle removed.'],
    'FAC-PWR': ['Power dip in the CT room for 4 minutes; scanner restarted.', 'Patients rescheduled; facilities informed.'],
    'INF-PRIV': ['A discharge summary was emailed to the wrong patient.', 'Recipient asked to delete it; IT informed.'],
    'INF-REC': ['Lab report filed in the wrong patient record.', 'Report moved to the correct record; doctor informed.'],
    'IPC-EXP': ['Blood splash to the eye of a technician during sample handling.', 'Eye irrigated; occupational health informed.'],
    'IPC-HH': ['Hand hygiene audit found 58% compliance in Ward 4.', 'Ward manager informed; refresher training planned.'],
  };
  const staffRoles = ['Staff nurse', 'Charge nurse', 'Resident doctor', 'Pharmacist', 'Lab technician', 'Porter', 'Receptionist', 'Security officer'];
  const investigators = incidentTeam.filter(m => m.role !== 'IMT Lead');
  const incidentCases = [];
  const plan = [
    // [typeCode, daysAgo, status, severity, anonymous, assigned(n), demoAssigned]
    ['MED-PT', 1, 'Open', 'Critical', false, 0, false], ['FALL-NI', 0, 'Open', 'Low', true, 0, false], ['PS-SPEC', 0, 'Open', 'Medium', false, 0, false], ['SEC-VIO', 2, 'Open', 'High', false, 1, true],
    ['MED-DOSE', 4, 'In Progress', 'High', false, 2, true], ['FALL-INJ', 6, 'In Progress', 'High', false, 1, false], ['EQP-FAIL', 9, 'In Progress', 'Medium', false, 1, true], ['INF-PRIV', 12, 'In Progress', 'High', true, 2, false],
    ['OHS-NSI', 16, 'In Progress', 'Medium', false, 1, false], ['PS-DLY', 21, 'Hold', 'Medium', true, 1, true], ['FAC-WTR', 25, 'Hold', 'Low', false, 1, false], ['MED-ALG', 33, 'Hold', 'High', false, 2, false],
    ['PS-PRES', 38, 'In Progress', 'Medium', false, 1, false], ['IPC-EXP', 44, 'Closed', 'Medium', false, 1, false], ['SEC-THF', 47, 'Closed', 'Low', false, 1, false], ['MED-OMIT', 52, 'Closed', 'Medium', true, 1, true],
    ['FAC-FIRE', 58, 'Closed', 'High', false, 1, false], ['PS-ID', 63, 'Closed', 'High', false, 2, false], ['OHS-INJ', 70, 'Closed', 'Low', false, 1, false], ['INF-REC', 76, 'Closed', 'Medium', false, 1, false],
    ['IPC-HH', 82, 'Closed', 'Low', true, 1, false], ['FAC-PWR', 88, 'Closed', 'Medium', false, 1, false], ['EQP-USE', 3, 'Open', 'Medium', false, 0, false], ['FALL-NI', 19, 'Closed', 'Low', false, 1, false],
    ['MED-DOSE', 27, 'In Progress', 'Medium', false, 1, false], ['PS-ID', 8, 'Hold', 'High', true, 2, true],
  ];
  const reporters = S.users.filter(u => u.status === 'Active' && u.id !== 'us_17');
  const outcomes = ['Substantiated: system issue', 'Substantiated: individual practice', 'Not substantiated', 'Substantiated: equipment fault', 'Resolved: no harm, learning shared'];
  plan.forEach(([typeCode, ago, status, severity, anonymous, nAssign, demoAssigned], i) => {
    const ty = incidentTypes.find(t => t.code === typeCode);
    const occ = addDays(T, -ago);
    const oh = ago === 0 ? int(6, 9) : int(0, 20), om = int(0, 59), lag = int(15, 170);
    const occAt = at(occ, oh, om);
    const repAt = at(occ, oh + Math.floor((om + lag) / 60), (om + lag) % 60);
    const [dept, loc] = locations[(i * 3) % locations.length];
    const rep = anonymous ? null : reporters[i % reporters.length];
    const st = stories[typeCode];
    const people = [];
    if (/^(PS|MED|FALL-INJ)/.test(typeCode)) { const p = S.patients[(i * 5 + 2) % 60]; people.push({ kind: 'Patient', patientId: p.id, name: p.name, role: 'Patient affected' }); }
    if (/OHS|SEC-VIO|IPC-EXP/.test(typeCode)) people.push({ kind: 'Staff', patientId: '', name: pick(['Grace Fernandes', 'Anjali Menon', 'Hassan Bukhari', 'Rania Khalil', 'Bilal Qureshi']), role: pick(staffRoles) });
    if (/FALL-NI|SEC/.test(typeCode)) people.push({ kind: 'Visitor', patientId: '', name: pick(['Visitor (name not given)', 'Khaled Al-Mutairi', 'Sundus Haddad']), role: 'Visitor' });
    const assigned = [];
    if (demoAssigned) assigned.push('IMT-01');
    while (assigned.length < nAssign) { const m = investigators[(i + assigned.length * 2) % investigators.length].code; if (!assigned.includes(m)) assigned.push(m); else break; }
    const c = {
      id: 'inc_' + pad(i + 1, 3), no: 'INC-26-' + pad(318 + i, 4), reportedAt: repAt, occurredAt: occAt, categoryCode: ty.categoryCode, typeCode, severity,
      reporterCategoryCode: ty.categoryCode, reporterSeverity: severity === 'Critical' ? 'High' : severity,
      deptId: dept, location: loc, branchId: 'br_01', anonymous, reporterUserId: rep ? rep.id : '', reporterName: rep ? rep.displayName : '', reporterContact: rep ? 'Ext. ' + int(2100, 2899) : '',
      people, description: st[0], immediateAction: st[1],
      attachments: i % 3 === 0 ? [{ name: pick(['photo_scene.jpg', 'medication_chart.pdf', 'pump_alarm_log.pdf', 'cctv_request.docx', 'wristband_photo.jpg']), size: (function (k) { return k >= 1024 ? (k / 1024).toFixed(1) + ' MB' : k + ' KB'; })(int(80, 2400)), by: anonymous ? 'Anonymous reporter' : rep.displayName, at: repAt }] : [],
      status, reviewed: status !== 'Open' || nAssign > 0, categorizedBy: status !== 'Open' || nAssign > 0 ? 'Sara Al-Mutairi' : '', categorizedAt: status !== 'Open' || nAssign > 0 ? at(addDays(occ, ago > 0 ? 1 : 0), 9, int(0, 59)) : '',
      assigned, enquiries: [], decisions: [], actions: [], outcome: '', closureSummary: '', closedAt: '', closedBy: '', holdReason: '', history: [],
    };
    const H = (d, by, action, from, to, reason) => c.history.push({ at: d, by, action, from: from || '', to: to || '', reason: reason || '' });
    H(repAt, anonymous ? 'Anonymous reporter' : rep.displayName, anonymous ? 'Reported anonymously' : 'Reported', '', 'Open');
    H(repAt, 'System', 'Routed to Incident Management Team', '', '', 'Notification rule NTF-NEW' + (/Critical|High/.test(severity) ? ' and NTF-CRIT' : ''));
    if (c.reviewed) H(c.categorizedAt, 'Sara Al-Mutairi', 'Reviewed and categorized', '', ty.name + ' · ' + severity);
    assigned.forEach((m, k) => H(at(addDays(occ, Math.min(ago, 1)), 10 + k, 5), 'Sara Al-Mutairi', 'Investigator assigned', '', incidentTeam.find(x => x.code === m).name));
    if (status !== 'Open') {
      const d1 = addDays(occ, Math.min(ago, 2));
      H(at(d1, 11, 20), assigned.includes('IMT-01') ? 'Hospital Demo' : incidentTeam.find(x => x.code === (assigned[0] || 'IMT-02')).name, 'Status changed', 'Open', 'In Progress', 'Investigation started');
      c.enquiries.push({ id: 'eq_' + i + '_1', to: pick(['Ward 3 charge nurse', 'Pharmacy Head', 'Biomedical Engineering', 'Security Supervisor', 'Head of Nursing']), question: 'Please send a written statement with the timeline of events and staff on duty.', askedBy: 'Sara Al-Mutairi', askedAt: at(d1, 12, 0), due: addDays(d1, 3), response: ago > 6 ? 'Statement attached. Two staff on duty; the incident happened during handover.' : '', respondedBy: ago > 6 ? 'Huda Al-Azmi' : '', respondedAt: ago > 6 ? at(addDays(d1, 2), 14, 10) : '', status: ago > 6 ? 'Responded' : 'Awaiting response' });
      if (ago > 10) c.enquiries.push({ id: 'eq_' + i + '_2', to: 'Staff member involved', question: 'Please describe what happened in your own words.', askedBy: incidentTeam.find(x => x.code === (assigned[0] || 'IMT-02')).name, askedAt: at(addDays(d1, 1), 10, 0), due: addDays(d1, 4), response: 'I followed the usual process but the second check was not done because the ward was very busy.', respondedBy: 'Staff member', respondedAt: at(addDays(d1, 3), 9, 30), status: 'Responded' });
      if (ago > 6) c.decisions.push({ id: 'dc_' + i + '_1', at: at(addDays(d1, 4), 15, 0), by: 'Sara Al-Mutairi', text: pick(['Treat as a system issue; no individual disciplinary action.', 'Refer to the Medication Safety Committee for review.', 'Share learning at the monthly nursing forum.', 'Request biomedical engineering report before closing.']) });
      if (ago > 6) c.actions.push({ id: 'ac_' + i + '_1', text: pick(['Refresher training on two-identifier check for Ward 3 staff', 'Add a second check for high-alert medicines', 'Replace the faulty pump and audit similar pumps', 'Put non-slip mats near the lift lobby', 'Update the visitor waiting area signage']), owner: pick(['Huda Al-Azmi', 'Maria Santos', 'Ahmed Farouk', 'Omar Haddad']), due: addDays(d1, 14), status: status === 'Closed' ? 'Done' : 'Open' });
    }
    if (status === 'Hold') { c.holdReason = pick(['Waiting for the biomedical engineering report', 'Waiting for the patient family meeting', 'Waiting for the external lab report']); H(at(addDays(occ, Math.min(ago, 5)), 9, 40), 'Sara Al-Mutairi', 'Status changed', 'In Progress', 'Hold', c.holdReason); }
    if (status === 'Closed') {
      c.outcome = pick(outcomes); c.closureSummary = 'Investigation complete. Root cause recorded, actions assigned and learning shared with the department.';
      c.closedAt = at(addDays(occ, int(6, Math.max(7, ago - 2))), 13, int(0, 59)); c.closedBy = 'Sara Al-Mutairi';
      H(c.closedAt, 'Sara Al-Mutairi', 'Status changed', 'In Progress', 'Closed', 'Outcome: ' + c.outcome);
    }
    incidentCases.push(c);
  });
  incidentCases.sort((a, b) => b.reportedAt.localeCompare(a.reportedAt));
  // Reference numbers follow the reporting order.
  incidentCases.slice().reverse().forEach((c, i) => { c.no = 'INC-26-' + pad(318 + i, 4); });

  Object.assign(S, { incidentCategories, incidentTypes, incidentStatuses, incidentEscalation, incidentTeam, incidentCases });
})();
