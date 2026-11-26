/* Appointments and Call Centre seed (SOW V4 Module 2). Dummy data only.
 * Loaded after data-core.js. Every key starts with "appointments".
 *   appointmentsTypes, appointmentsCancelReasons, appointmentsTemplates   masters
 *   appointmentsShifts, appointmentsSlots, appointmentsResources           masters
 *   appointmentsSessions (doctor sessions per weekday), appointmentsResourceCal (resource calendars)
 *   appointmentsOverrides (leave, holiday and session block overrides, maker-checker)
 *   appointmentsChanges (schedule change requests, maker-checker)
 *   appointmentsBookings (appointments), appointmentsMessages (confirmation and reminder log)
 *   appointmentsCalls (call centre log with follow-up tasks)
 * Check-in adds an OPD encounter to the shared "encounters" key (source 'Appointment'). */
(function () {
  const S = window.SEED;
  const T = S.TODAY;
  let seed = 7720261125;
  const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
  const pick = (a) => a[Math.floor(rnd() * a.length)];
  const int = (a, b) => a + Math.floor(rnd() * (b - a + 1));
  const pad = (n, w) => String(n).padStart(w || 2, '0');
  const addDays = (d, n) => { const x = new Date(d + 'T00:00:00'); x.setDate(x.getDate() + n); return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}`; };
  const dow = (d) => new Date(d + 'T00:00:00').getDay();
  const toMin = (t) => +t.slice(0, 2) * 60 + +t.slice(3, 5);
  const toHM = (m) => pad(Math.floor(m / 60)) + ':' + pad(m % 60);

  /* ---------- Masters ---------- */
  const appointmentsTypes = [
    ['CON', 'Consultation', 20, false, 'New consultation with the doctor.'],
    ['PRO', 'Procedure', 40, true, 'Clinic procedure that needs a technician or machine (echo, audiometry, ultrasound).'],
    ['FOL', 'Follow-up', 20, false, 'Review visit after a previous consultation.'],
    ['TEL', 'Teleconsultation', 15, false, 'Video or phone consultation. Video platform depends on the integration scope.'],
    ['HOM', 'Home visit', 60, true, 'Visit at the patient home by the home care team.'],
  ].map(([code, name, duration, needsResource, note], i) => ({ id: 'at_' + pad(i + 1), code, name, duration, needsResource, note, labelStatus: 'To be confirmed', status: 'Active' }));

  const appointmentsCancelReasons = [
    ['CR-PTREQ', 'Patient request', 'Patient', false], ['CR-PTILL', 'Patient unwell or admitted', 'Patient', false], ['CR-TRAVEL', 'Patient travelling', 'Patient', false],
    ['CR-DRUNAV', 'Doctor unavailable', 'Hospital', false], ['CR-DUP', 'Duplicate booking', 'Hospital', false], ['CR-INS', 'Insurance approval not received', 'Hospital', false],
    ['CR-CLOSE', 'Clinic closure or emergency', 'Hospital', true], ['CR-OTHER', 'Other', 'Patient', true],
  ].map(([code, name, initiatedBy, noteRequired], i) => ({ id: 'cr_' + pad(i + 1), code, name, initiatedBy, noteRequired, status: 'Active' }));

  const appointmentsTemplates = [
    ['TPL-CONF-EN', 'Booking confirmation (English)', 'Confirmation', 'SMS', 'English', 'On booking', 'Dear {patient}, your appointment with {doctor} ({clinic}, {branch}) is confirmed for {date} at {time}. Ref {ref}. Please arrive 15 minutes early. To change it call 1880088.'],
    ['TPL-CONF-AR', 'Booking confirmation (Arabic)', 'Confirmation', 'SMS', 'Arabic', 'On booking', 'عزيزي {patient}، تم تأكيد موعدك مع {doctor} في عيادة {clinic} يوم {date} الساعة {time}. رقم المرجع {ref}. يرجى الحضور قبل الموعد بـ 15 دقيقة. للتعديل اتصل 1880088.'],
    ['TPL-CONF-EM', 'Booking confirmation (email)', 'Confirmation', 'Email', 'English', 'On booking', 'Dear {patient},\n\nThank you for booking with Tibbi. Your {type} with {doctor} is confirmed.\n\nDate: {date}\nTime: {time}\nClinic: {clinic}, {branch}\nReference: {ref}\n\nPlease bring your Civil ID and insurance card.'],
    ['TPL-REM-EN', 'Reminder 24 hours before (English)', 'Reminder', 'SMS', 'English', '24 hours before', 'Reminder: {patient}, you have an appointment with {doctor} tomorrow {date} at {time} at {branch}. Ref {ref}. Reply or call 1880088 to cancel.'],
    ['TPL-REM-AR', 'Reminder 24 hours before (Arabic)', 'Reminder', 'SMS', 'Arabic', '24 hours before', 'تذكير: {patient}، لديك موعد مع {doctor} غداً {date} الساعة {time} في {branch}. رقم المرجع {ref}.'],
    ['TPL-RES-EN', 'Rescheduled appointment (English)', 'Reschedule', 'SMS', 'English', 'On reschedule', 'Dear {patient}, your appointment with {doctor} has been moved to {date} at {time}. Ref {ref}. Call 1880088 if this time does not suit you.'],
    ['TPL-CAN-EN', 'Cancellation notice (English)', 'Cancellation', 'SMS', 'English', 'On cancellation', 'Dear {patient}, your appointment {ref} with {doctor} on {date} at {time} has been cancelled. Call 1880088 to book a new time.'],
    ['TPL-CAN-AR', 'Cancellation notice (Arabic)', 'Cancellation', 'SMS', 'Arabic', 'On cancellation', 'عزيزي {patient}، تم إلغاء موعدك {ref} مع {doctor} يوم {date} الساعة {time}. للحجز مجدداً اتصل 1880088.'],
  ].map(([code, name, event, channel, language, sendWhen, body], i) => ({ id: 'tp_' + pad(i + 1), code, name, event, channel, language, sendWhen, body, status: 'Active' }));

  const appointmentsShifts = [
    ['SH-MOR', 'Morning clinic', '08:00', '13:00', ''], ['SH-AFT', 'Afternoon clinic', '13:00', '18:00', ''], ['SH-EVE', 'Evening clinic', '16:00', '21:00', ''],
    ['SH-SAT', 'Saturday morning', '09:00', '13:00', ''], ['SH-FUL', 'Full day (resources)', '08:00', '16:00', '12:00-12:30 break'], ['SH-ONC', 'On-call night', '20:00', '08:00', 'Resource on call only'],
  ].map(([code, name, start, end, note], i) => ({ id: 'sh_' + pad(i + 1), code, name, start, end, note, status: 'Active' }));

  const appointmentsSlots = [
    ['SL-CARD-20', 'Cardiology 20 minute slot', 'cl_01', 20, 1, 30], ['SL-PED-20', 'Paediatrics 20 minute slot', 'cl_02', 20, 1, 30], ['SL-ORTH-20', 'Orthopaedics 20 minute slot', 'cl_03', 20, 1, 45],
    ['SL-DERM-15', 'Dermatology 15 minute slot', 'cl_04', 15, 1, 30], ['SL-IM-20', 'Internal Medicine 20 minute slot', 'cl_05', 20, 1, 30], ['SL-OBG-20', 'Obstetrics 20 minute slot', 'cl_06', 20, 1, 60],
    ['SL-ENT-20', 'ENT 20 minute slot', 'cl_07', 20, 1, 30], ['SL-GS-20', 'General Surgery 20 minute slot', 'cl_08', 20, 1, 45], ['SL-PRO-40', 'Procedure 40 minute slot', 'cl_01', 40, 1, 30],
  ].map(([code, name, clinicId, duration, capacity, bookAhead], i) => ({ id: 'sl_' + pad(i + 1), code, name, clinicId, duration, capacity, bookAhead, status: 'Active' }));

  const appointmentsResources = [
    ['RS-ECHO-01', 'Echocardiography machine (Philips EPIQ 7)', 'Machine', 'cl_01', 'Echocardiography'], ['RS-ECG-01', 'ECG machine (GE MAC 2000)', 'Machine', 'cl_01', 'ECG, 12 lead'],
    ['RS-TMT-01', 'Treadmill stress test system', 'Machine', 'cl_01', 'Exercise stress test'], ['RS-TEC-01', 'Ahmed Salem, cardiac technician', 'Technician', 'cl_01', 'Echo and stress test'],
    ['RS-US-01', 'Ultrasound (Voluson E10)', 'Machine', 'cl_06', 'Obstetric ultrasound'], ['RS-AUD-01', 'Audiometry booth', 'Machine', 'cl_07', 'Pure tone audiometry'],
    ['RS-TEC-02', 'Joseph Mathew, audiology technician', 'Technician', 'cl_07', 'Audiometry and tympanometry'], ['RS-HOM-01', 'Mercy Thomas, home care nurse', 'Technician', 'cl_05', 'Home visits'],
    ['RS-PHY-01', 'Lulwa Al-Hajri, physiotherapy technician', 'Technician', 'cl_03', 'Physiotherapy session'],
  ].map(([code, name, kind, clinicId, service], i) => ({ id: 'rs_' + pad(i + 1), code, name, kind, clinicId, branchId: 'br_01', service, status: 'Active' }));

  /* ---------- Doctor sessions per weekday (0 Sunday ... 6 Saturday) ---------- */
  const slotOf = { cl_01: 'SL-CARD-20', cl_02: 'SL-PED-20', cl_03: 'SL-ORTH-20', cl_04: 'SL-DERM-15', cl_05: 'SL-IM-20', cl_06: 'SL-OBG-20', cl_07: 'SL-ENT-20', cl_08: 'SL-GS-20' };
  const appointmentsSessions = [];
  const addSession = (doctorId, weekday, shiftCode) => {
    const d = S.doctors.find(x => x.id === doctorId);
    appointmentsSessions.push({ id: 'ss_' + pad(appointmentsSessions.length + 1, 3), doctorId, weekday, shiftCode, slotCode: slotOf[d.clinicId], clinicId: d.clinicId, branchId: d.branchId, room: d.room, status: 'Active' });
  };
  ['dr_01', 'dr_02', 'dr_04', 'dr_05', 'dr_06', 'dr_07', 'dr_08'].forEach(id => [0, 1, 2, 3, 4].forEach(w => { addSession(id, w, 'SH-MOR'); addSession(id, w, 'SH-AFT'); }));
  [0, 2, 3].forEach(w => { addSession('dr_03', w, 'SH-MOR'); addSession('dr_03', w, 'SH-AFT'); });
  addSession('dr_01', 6, 'SH-SAT'); addSession('dr_06', 6, 'SH-SAT'); addSession('dr_02', 6, 'SH-SAT');
  [0, 1, 2, 3, 4].forEach(w => addSession('dr_10', w, 'SH-EVE'));

  const appointmentsResourceCal = [];
  appointmentsResources.forEach(r => [0, 1, 2, 3, 4].forEach(w => appointmentsResourceCal.push({ id: 'rc_' + pad(appointmentsResourceCal.length + 1, 3), resourceCode: r.code, weekday: w, shiftCode: r.code === 'RS-HOM-01' ? 'SH-MOR' : 'SH-FUL', status: 'Active' })));
  appointmentsResourceCal.push({ id: 'rc_' + pad(appointmentsResourceCal.length + 1, 3), resourceCode: 'RS-ECG-01', weekday: 6, shiftCode: 'SH-SAT', status: 'Active' });
  appointmentsResourceCal.push({ id: 'rc_' + pad(appointmentsResourceCal.length + 1, 3), resourceCode: 'RS-TEC-01', weekday: 3, shiftCode: 'SH-ONC', status: 'Active' });

  /* ---------- Overrides (leave, holiday closure, session block) ---------- */
  const appointmentsOverrides = [
    { id: 'ov_01', no: 'OVR-26-0071', kind: 'Doctor leave', doctorId: 'dr_05', resourceCode: '', branchId: 'br_01', from: addDays(T, 4), to: addDays(T, 8), start: '', end: '', reason: 'Annual leave', status: 'Approved', requestedBy: 'Layla Hussain', requestedAt: addDays(T, -12) + ' 10:14', decidedBy: 'Sara Al-Mutairi', decidedAt: addDays(T, -11) + ' 09:02', decisionNote: 'Cover arranged with Orthopaedics on-call.' },
    { id: 'ov_02', no: 'OVR-26-0074', kind: 'Doctor leave', doctorId: 'dr_06', resourceCode: '', branchId: 'br_01', from: addDays(T, 6), to: addDays(T, 7), start: '', end: '', reason: 'Gulf Obstetrics Conference, Dubai', status: 'Pending approval', requestedBy: 'Fatima Al-Kandari', requestedAt: addDays(T, -1) + ' 15:40', decidedBy: '', decidedAt: '', decisionNote: '' },
    { id: 'ov_03', no: 'OVR-26-0072', kind: 'Session block', doctorId: 'dr_01', resourceCode: '', branchId: 'br_01', from: addDays(T, 1), to: addDays(T, 1), start: '14:00', end: '18:00', reason: 'Cath lab list', status: 'Approved', requestedBy: 'Layla Hussain', requestedAt: addDays(T, -6) + ' 11:30', decidedBy: 'Sara Al-Mutairi', decidedAt: addDays(T, -6) + ' 13:05', decisionNote: '' },
    { id: 'ov_04', no: 'OVR-26-0060', kind: 'Holiday closure', doctorId: '', resourceCode: '', branchId: '', from: '2027-02-25', to: '2027-02-26', start: '', end: '', reason: 'National Day and Liberation Day', status: 'Approved', requestedBy: 'Omar Haddad', requestedAt: '2026-11-02 09:00', decidedBy: 'Sara Al-Mutairi', decidedAt: '2026-11-03 08:40', decisionNote: 'Per Civil Service Commission circular.' },
    { id: 'ov_05', no: 'OVR-26-0075', kind: 'Resource unavailable', doctorId: '', resourceCode: 'RS-ECHO-01', branchId: 'br_01', from: addDays(T, 5), to: addDays(T, 5), start: '08:00', end: '12:00', reason: 'Preventive maintenance by Philips', status: 'Pending approval', requestedBy: 'Hospital Demo', requestedAt: T + ' 08:20', decidedBy: '', decidedAt: '', decisionNote: '' },
    { id: 'ov_06', no: 'OVR-26-0068', kind: 'Doctor leave', doctorId: 'dr_10', resourceCode: '', branchId: 'br_02', from: addDays(T, 11), to: addDays(T, 15), start: '', end: '', reason: 'Personal leave', status: 'Rejected', requestedBy: 'Omar Haddad', requestedAt: addDays(T, -9) + ' 12:00', decidedBy: 'Sara Al-Mutairi', decidedAt: addDays(T, -8) + ' 10:10', decisionNote: 'No dermatology cover in Hawalli for these dates.' },
  ];
  const blockedSeed = (doctorId, date, time) => appointmentsOverrides.some(o => o.status === 'Approved' && date >= o.from && date <= o.to && (o.kind === 'Holiday closure' || o.doctorId === doctorId) && (!o.start || (time >= o.start && time < o.end)));

  /* ---------- Schedule change requests ---------- */
  const appointmentsChanges = [
    { id: 'sc_01', no: 'SCR-26-0141', kind: 'Add session', doctorId: 'dr_04', resourceCode: '', weekday: 6, fromShift: '', shiftCode: 'SH-SAT', effectiveFrom: addDays(T, 10), summary: 'Add a Saturday morning clinic for Dr. Hanan Al-Sabah', reason: 'Diabetes clinic waiting list above 3 weeks', status: 'Pending approval', requestedBy: 'Layla Hussain', requestedAt: addDays(T, -1) + ' 11:05', decidedBy: '', decidedAt: '', decisionNote: '' },
    { id: 'sc_02', no: 'SCR-26-0142', kind: 'Change shift', doctorId: 'dr_07', resourceCode: '', weekday: 4, fromShift: 'SH-AFT', shiftCode: 'SH-EVE', effectiveFrom: addDays(T, 14), summary: 'Move Dr. Faisal Al-Otaibi Thursday afternoon to the evening clinic', reason: 'Patient demand for evening ENT slots', status: 'Pending approval', requestedBy: 'Hospital Demo', requestedAt: T + ' 09:12', decidedBy: '', decidedAt: '', decisionNote: '' },
    { id: 'sc_03', no: 'SCR-26-0139', kind: 'Remove session', doctorId: 'dr_08', resourceCode: '', weekday: 1, fromShift: 'SH-AFT', shiftCode: '', effectiveFrom: addDays(T, -5), summary: 'Remove Dr. Sameh Youssef Monday afternoon clinic (theatre list)', reason: 'Theatre list moved to Monday afternoon', status: 'Approved', requestedBy: 'Layla Hussain', requestedAt: addDays(T, -9) + ' 10:00', decidedBy: 'Sara Al-Mutairi', decidedAt: addDays(T, -8) + ' 14:22', decisionNote: '' },
    { id: 'sc_04', no: 'SCR-26-0137', kind: 'Add session', doctorId: '', resourceCode: 'RS-TMT-01', weekday: 6, fromShift: '', shiftCode: 'SH-SAT', effectiveFrom: addDays(T, -2), summary: 'Add Saturday morning for the treadmill stress test system', reason: 'Stress test backlog', status: 'Rejected', requestedBy: 'Fatima Al-Kandari', requestedAt: addDays(T, -12) + ' 09:30', decidedBy: 'Sara Al-Mutairi', decidedAt: addDays(T, -11) + ' 16:00', decisionNote: 'No technician available on Saturdays.' },
  ];
  // The approved change above is already applied to the sessions.
  const rm = appointmentsSessions.findIndex(s => s.doctorId === 'dr_08' && s.weekday === 1 && s.shiftCode === 'SH-AFT');
  if (rm >= 0) appointmentsSessions.splice(rm, 1);

  /* ---------- Appointments ---------- */
  const shiftsBy = {}; appointmentsShifts.forEach(s => { shiftsBy[s.code] = s; });
  const slotBy = {}; appointmentsSlots.forEach(s => { slotBy[s.code] = s; });
  const docSlots = (doctorId, date) => {
    const out = [];
    appointmentsSessions.filter(s => s.doctorId === doctorId && s.weekday === dow(date)).forEach(s => {
      const sh = shiftsBy[s.shiftCode], dur = slotBy[s.slotCode].duration;
      for (let m = toMin(sh.start); m + dur <= toMin(sh.end); m += dur) out.push(toHM(m));
    });
    return Array.from(new Set(out)).sort();
  };
  const NOW = '11:00';                 // prototype clock for "today"
  const agents = ['Layla Hussain', 'Fatima Al-Kandari', 'Dana Al-Shammari', 'Hospital Demo'];
  const sources = ['Call centre', 'Call centre', 'Front desk', 'Patient app', 'Call centre', 'Doctor referral'];
  const reasonsBySpec = {
    'Cardiology': ['Chest pain on exertion', 'Palpitations', 'Hypertension review', 'Echo follow-up', 'Breathlessness'], 'Paediatrics': ['Fever and cough', 'Vaccination', 'Well-baby check', 'Ear pain'],
    'Internal Medicine': ['Diabetes review', 'Thyroid follow-up', 'Fatigue', 'Blood pressure check'], 'Orthopaedics': ['Knee pain', 'Back pain', 'Fracture follow-up', 'Shoulder pain'],
    'Obstetrics and Gynaecology': ['Antenatal visit', 'Pelvic ultrasound', 'Menstrual problems', 'Postnatal check'], 'ENT': ['Hearing test', 'Sinusitis', 'Tonsillitis', 'Ear wax'],
    'General Surgery': ['Hernia review', 'Post-operative wound check', 'Gallbladder consult', 'Lump assessment'], 'Dermatology': ['Acne', 'Eczema', 'Mole check', 'Hair loss'],
  };
  const procRes = { dr_01: 'RS-ECHO-01', dr_03: 'RS-ECHO-01', dr_06: 'RS-US-01', dr_07: 'RS-AUD-01' };
  const appointmentsBookings = [];
  const taken = {};
  const keyOf = (d, date, time) => d + '|' + date + '|' + time;
  const pts = S.patients.filter(p => p.status === 'Active' && p.id.startsWith('pt_0'));
  let apNo = 40001;
  const add = (a) => {
    const doc = S.doctors.find(x => x.id === a.doctorId);
    const rec = Object.assign({ id: 'ap_' + pad(appointmentsBookings.length + 1, 4), no: 'APT-26-' + (apNo++), clinicId: doc.clinicId, branchId: doc.branchId, duration: 20, type: 'CON', resourceCode: '', source: pick(sources), reason: pick(reasonsBySpec[doc.specialty] || ['General review']), encounterId: '', rescheduled: 0 }, a);
    if (!rec.createdBy) rec.createdBy = rec.source === 'Patient app' ? 'Patient app' : pick(agents.slice(0, 3));
    if (!rec.createdAt) { const back = rec.date <= T ? int(1, 12) : int(1, 10); const c = addDays(rec.date, -back); rec.createdAt = c >= T ? T + ' ' + pad(int(7, 10)) + ':' + pad(int(0, 59)) : c + ' ' + pad(int(8, 19)) + ':' + pad(int(0, 59)); }
    const ty = appointmentsTypes.find(t => t.code === rec.type); rec.duration = ty ? Math.min(ty.duration, 40) : 20;
    rec.history = [[rec.createdAt, rec.createdBy, 'Booked', rec.source]];
    if (rec.status === 'Confirmed') rec.history.push([rec.createdAt.slice(0, 10) + ' 18:30', 'Call centre', 'Confirmed', 'Patient confirmed by phone']);
    if (rec.status === 'Cancelled') rec.history.push([rec.cancelledAt, rec.cancelledBy, 'Cancelled', rec.cancelNote || '']);
    if (rec.status === 'No-show') rec.history.push([rec.date + ' 17:30', 'Front desk', 'Marked no-show', 'Patient did not attend']);
    appointmentsBookings.push(rec);
    if (rec.status !== 'Cancelled') taken[keyOf(rec.doctorId, rec.date, rec.time)] = true;
    return rec;
  };
  const typeFor = (doctorId, visitType) => {
    if (visitType === 'Follow-up') return 'FOL';
    const r = rnd();
    if (procRes[doctorId] && r < 0.16) return 'PRO';
    if (r < 0.36) return 'FOL';
    if (r < 0.42) return 'TEL';
    if (doctorId === 'dr_04' && r < 0.47) return 'HOM';
    return 'CON';
  };
  const cancelFor = (date) => { const r = pick(appointmentsCancelReasons.slice(0, 7)); return { cancelReasonCode: r.code, cancelNote: r.code === 'CR-CLOSE' ? 'Doctor called to an emergency' : '', cancelledAt: addDays(date, -int(0, 2)) + ' ' + pad(int(8, 18)) + ':' + pad(int(0, 59)), cancelledBy: pick(agents.slice(0, 3)) }; };

  // 1) Today: from the OPD encounters that came from an appointment.
  S.encounters.filter(e => e.type === 'OPD' && e.start.slice(0, 10) === T && e.source === 'Appointment').forEach(e => {
    const status = e.status === 'Completed' ? 'Completed' : e.status === 'Booked' ? 'Confirmed' : 'Arrived';
    const ty = typeFor(e.doctorId, e.visitType);
    add({ patientId: e.patientId, doctorId: e.doctorId, date: T, time: e.start.slice(11, 16), type: ty, resourceCode: ty === 'PRO' ? procRes[e.doctorId] || '' : '', status, reason: e.complaint, encounterId: status === 'Confirmed' ? '' : e.id });
  });
  // Walk-in encounters keep their slot so the grid shows them as taken.
  S.encounters.filter(e => e.type === 'OPD' && e.start.slice(0, 10) === T && e.source !== 'Appointment').forEach(e => { taken[keyOf(e.doctorId, T, e.start.slice(11, 16))] = true; });
  // 2) Past visits from the history encounters.
  S.encounters.filter(e => e.type === 'OPD' && e.start.slice(0, 10) < T && e.source === 'Appointment').forEach(e => {
    add({ patientId: e.patientId, doctorId: e.doctorId, date: e.start.slice(0, 10), time: e.start.slice(11, 16), type: typeFor(e.doctorId), status: 'Completed', encounterId: e.id });
  });
  // 3) Generated bookings: past 28 days, today and the next 14 days.
  const bookDocs = ['dr_01', 'dr_02', 'dr_03', 'dr_04', 'dr_05', 'dr_06', 'dr_07', 'dr_08', 'dr_10'];
  for (let off = -28; off <= 14; off++) {
    const date = addDays(T, off);
    bookDocs.forEach(doctorId => {
      const free = docSlots(doctorId, date).filter(t => !taken[keyOf(doctorId, date, t)] && !blockedSeed(doctorId, date, t));
      if (!free.length) return;
      const n = off < 0 ? int(1, 2) : off === 0 ? int(5, 8) : Math.max(1, int(5, 8) - Math.floor(off / 2));
      for (let k = 0; k < n && free.length; k++) {
        const time = free.splice(int(0, free.length - 1), 1)[0];
        const p = pick(pts);
        const ty = typeFor(doctorId);
        let status;
        const r = rnd();
        if (off < 0) status = r < 0.76 ? 'Completed' : r < 0.88 ? 'No-show' : 'Cancelled';
        else if (off === 0) status = time < NOW ? (r < 0.6 ? 'No-show' : 'Cancelled') : (r < 0.55 ? 'Confirmed' : r < 0.9 ? 'Booked' : 'Cancelled');
        else status = r < 0.1 ? 'Cancelled' : off <= 2 && r < 0.55 ? 'Confirmed' : 'Booked';
        add(Object.assign({ patientId: p.id, doctorId, date, time, type: ty, resourceCode: ty === 'PRO' ? procRes[doctorId] || '' : ty === 'HOM' ? 'RS-HOM-01' : '', status }, status === 'Cancelled' ? cancelFor(date) : {}));
      }
    });
  }
  // Named walkthrough bookings (upcoming).
  const nb = (patientId, doctorId, off, time, type, status, extra) => {
    const date = addDays(T, off);
    if (taken[keyOf(doctorId, date, time)]) return;
    add(Object.assign({ patientId, doctorId, date, time, type, status, source: 'Call centre', createdBy: 'Layla Hussain' }, extra || {}));
  };
  nb('pt_001', 'dr_01', 0, '15:20', 'FOL', 'Confirmed', { reason: 'Hypertension and diabetes review', createdAt: addDays(T, -6) + ' 10:12' });
  nb('pt_002', 'dr_06', 1, '09:00', 'PRO', 'Booked', { reason: 'Antenatal ultrasound, 20 weeks', resourceCode: 'RS-US-01', createdAt: addDays(T, -3) + ' 12:30' });
  nb('pt_003', 'dr_03', 6, '10:20', 'CON', 'Booked', { reason: 'Chest tightness on exertion', rescheduled: 1, createdAt: addDays(T, -4) + ' 16:02' });
  nb('pt_004', 'dr_02', 0, '16:00', 'FOL', 'Booked', { reason: 'Asthma review', createdAt: addDays(T, -2) + ' 09:44' });
  appointmentsBookings.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));

  /* ---------- Messages (confirmation and reminder log) ---------- */
  const appointmentsMessages = [];
  appointmentsBookings.filter(a => a.date >= addDays(T, -2) && a.date <= addDays(T, 2) && a.status !== 'Cancelled').slice(0, 60).forEach((a, i) => {
    const p = S.patients.find(x => x.id === a.patientId) || {};
    const ar = p.lang === 'Arabic';
    appointmentsMessages.push({ id: 'ms_' + pad(appointmentsMessages.length + 1, 4), apptId: a.id, at: a.createdAt, event: 'Confirmation', channel: 'SMS', templateCode: ar ? 'TPL-CONF-AR' : 'TPL-CONF-EN', to: p.mobile || '', status: i % 9 === 4 ? 'Failed' : 'Sent' });
    if (a.date > T && a.date <= addDays(T, 1)) appointmentsMessages.push({ id: 'ms_' + pad(appointmentsMessages.length + 1, 4), apptId: a.id, at: T + ' 09:00', event: 'Reminder', channel: 'SMS', templateCode: ar ? 'TPL-REM-AR' : 'TPL-REM-EN', to: p.mobile || '', status: 'Queued' });
  });

  /* ---------- Call centre log ---------- */
  const purposes = ['Book appointment', 'Reschedule appointment', 'Cancel appointment', 'General enquiry', 'Results enquiry', 'Prescription refill', 'Billing or insurance query', 'Complaint'];
  const appointmentsCalls = [];
  let callNo = 22410;
  const addCall = (c) => {
    const rec = Object.assign({ id: 'cl_' + pad(appointmentsCalls.length + 1, 4), no: 'CALL-26-' + (callNo++), direction: 'Incoming', duration: int(70, 420), notes: '', apptId: '', followUp: null }, c);
    appointmentsCalls.push(rec); return rec;
  };
  // Calls that produced a booking.
  appointmentsBookings.filter(a => a.source === 'Call centre' && a.createdAt.slice(0, 10) >= addDays(T, -7)).slice(-26).forEach(a => {
    const p = S.patients.find(x => x.id === a.patientId);
    addCall({ at: a.createdAt, callerMobile: p.mobile, callerName: p.name, patientId: p.id, purpose: a.rescheduled ? 'Reschedule appointment' : 'Book appointment', outcome: a.rescheduled ? 'Rescheduled' : 'Booked', agent: a.createdBy, apptId: a.id, notes: 'Booked ' + a.no + ' for ' + (function (d) { const M = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec']; return +d.slice(8) + ' ' + M[+d.slice(5, 7) - 1] + ' ' + d.slice(0, 4); })(a.date) + ', ' + a.time + '.' });
  });
  // Other calls.
  const otherNotes = {
    'General enquiry': ['Asked about clinic timings on Saturday.', 'Asked if the cardiology clinic accepts Warba Insurance.', 'Asked for directions to the Hawalli clinic.'],
    'Results enquiry': ['Asked for lab results; advised to view them in the patient app after doctor review.', 'Wants the MRI report; transferred to Radiology.'],
    'Prescription refill': ['Needs a refill of regular medicines; message passed to the clinic nurse.'],
    'Billing or insurance query': ['Asked about co-payment for an echo; quoted from the price list.', 'Insurance rejected the claim; transferred to Insurance desk.'],
    'Complaint': ['Waited 50 minutes past appointment time; complaint logged for Patient Relations.'],
    'Cancel appointment': ['Patient travelling; appointment cancelled.'],
  };
  for (let i = 0; i < 22; i++) {
    const day = addDays(T, -int(0, 7));
    const hr = day === T ? int(7, 10) : int(8, 19);
    const unreg = i % 7 === 3;
    const p = unreg ? null : pick(pts);
    const purpose = pick(['General enquiry', 'General enquiry', 'Results enquiry', 'Prescription refill', 'Billing or insurance query', 'Complaint', 'Cancel appointment']);
    const outcome = purpose === 'Complaint' ? 'Transferred' : purpose === 'Cancel appointment' ? 'Cancelled' : purpose === 'Prescription refill' ? 'Callback needed' : purpose === 'Results enquiry' ? pick(['Information given', 'Transferred', 'Callback needed']) : 'Information given';
    const c = addCall({ at: day + ' ' + pad(hr) + ':' + pad(int(0, 59)), callerMobile: p ? p.mobile : '+965 6' + int(100, 999) + ' ' + int(1000, 9999), callerName: p ? p.name : pick(['Khaled Al-Mutairi', 'Sundus Haddad', 'Arun Nair']), patientId: p ? p.id : '', purpose, outcome, agent: pick(agents), notes: pick(otherNotes[purpose] || ['Information given.']) });
    if (outcome === 'Callback needed' || purpose === 'Complaint' || i % 6 === 0) {
      const due = addDays(day, int(0, 2));
      c.followUp = { task: purpose === 'Complaint' ? 'Patient Relations to call back with outcome' : purpose === 'Prescription refill' ? 'Clinic nurse to confirm the refill with the doctor' : 'Call the patient back with the information', due, assignee: pick(agents.slice(0, 3)), status: due < addDays(T, -1) && i % 2 ? 'Done' : 'Open', doneAt: '' };
    }
  }
  // A missed outgoing reminder call.
  addCall({ at: T + ' 09:40', direction: 'Outgoing', callerMobile: (S.patients[1] || {}).mobile, callerName: (S.patients[1] || {}).name, patientId: 'pt_002', purpose: 'Appointment reminder', outcome: 'No answer', agent: 'Layla Hussain', notes: 'Tried to confirm tomorrow ultrasound.', followUp: { task: 'Call again before 13:00 to confirm the ultrasound', due: T, assignee: 'Hospital Demo', status: 'Open', doneAt: '' } });
  appointmentsCalls.sort((a, b) => b.at.localeCompare(a.at));

  Object.assign(S, { appointmentsTypes, appointmentsCancelReasons, appointmentsTemplates, appointmentsShifts, appointmentsSlots, appointmentsResources, appointmentsSessions, appointmentsResourceCal, appointmentsOverrides, appointmentsChanges, appointmentsBookings, appointmentsMessages, appointmentsCalls });
})();
