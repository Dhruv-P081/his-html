/* Clinical EMR (SOW V4 Module 3) seed data. Loaded after data-core.js.
 * Keys (all prefixed emr):
 *   emrComplaints        Chief Complaint Master
 *   emrVitalParams       Vital Sign Parameter Master (normal and critical ranges)
 *   emrTemplates         Clinical Template Master (departmental physical exam and system review)
 *   emrAllergies         Allergy Master with the drug-class map used by the CDSS allergy check
 *   emrReferralReasons   Referral Reason Master
 *   emrNoteTemplates     Doctor's note template master
 *   emrNotes             consultation notes, one per encounter { encounterId, complaint, hpi, exam, ros, diagnoses, soap, plan, status Draft|Signed }
 *   emrReferrals         specialty referral, consultation request and transfer
 *   emrProgressNotes     inpatient round notes
 *   emrHomeMeds          home medicines per patient (for medicine reconciliation)
 *   emrRecon             reconciliation decisions per inpatient encounter
 *   emrDischarges        discharge orders and summaries per inpatient encounter
 *   emrMedReports        generated medical reports
 *   emrDocuments         clinical document attachments
 *   emrResultAcks        result review acknowledgements { orderId, by, at, comment }
 *   emrAlertLog          CDSS alerts shown and overridden
 *   emrSeedOrders        demo orders EMR adds to the shared `orders` list once (restricted orders waiting for approval, a critical troponin)
 */
(function () {
  const S = window.SEED;
  const T = S.TODAY;
  let seed = 3031125;
  const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
  const pick = (a) => a[Math.floor(rnd() * a.length)];
  const pad = (n, w) => String(n).padStart(w || 2, '0');
  const addDays = (d, n) => { const x = new Date(d + 'T00:00:00'); x.setDate(x.getDate() + n); return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}`; };
  const docOf = (id) => S.doctors.find(d => d.id === id) || {};
  const icd = (c) => (S.icd10.find(x => x.code === c) || { code: c, name: c });

  const emrComplaints = [
    ['CC-CHP', 'Chest pain', 'Cardiology', 'R07.9'], ['CC-PAL', 'Palpitations', 'Cardiology', 'I48.91'], ['CC-SOB', 'Shortness of breath', 'Cardiology', ''],
    ['CC-HTN', 'Hypertension follow-up', 'Cardiology', 'I10'], ['CC-FEV', 'Fever', 'Paediatrics', 'R50.9'], ['CC-COU', 'Cough', 'Paediatrics', 'J06.9'],
    ['CC-EAR', 'Ear pain', 'Paediatrics', 'H66.90'], ['CC-RSH', 'Skin rash', 'General', 'L20.9'], ['CC-DMF', 'Diabetes follow-up', 'General', 'E11.9'],
    ['CC-HDA', 'Headache', 'General', 'R51.9'], ['CC-ABD', 'Abdominal pain', 'General', ''], ['CC-DYS', 'Burning urination', 'General', 'N39.0'],
    ['CC-BKP', 'Low back pain', 'General', 'M54.5'], ['CC-SRT', 'Sore throat', 'General', 'J02.9'],
  ].map(([code, name, specialty, icd10], i) => ({ id: 'cc_' + pad(i + 1), code, name, specialty, icd10, status: 'Active' }));

  const emrVitalParams = [
    ['temp', 'Temperature', '°C', 36.1, 37.5, 35, 39.5, 1], ['hr', 'Heart rate', 'bpm', 60, 100, 40, 130, 0], ['sbp', 'Systolic BP', 'mmHg', 90, 140, 80, 180, 0],
    ['dbp', 'Diastolic BP', 'mmHg', 60, 90, 40, 110, 0], ['rr', 'Respiratory rate', '/min', 12, 20, 8, 30, 0], ['spo2', 'SpO2', '%', 95, 100, 88, 100, 0],
    ['pain', 'Pain score', '0-10', 0, 3, 0, 8, 0], ['weight', 'Weight', 'kg', 2, 200, 0, 300, 1], ['height', 'Height', 'cm', 45, 210, 0, 250, 0],
  ].map(([code, name, unit, low, high, critLow, critHigh, dec], i) => ({ id: 'vp_' + pad(i + 1), code, name, unit, low, high, critLow, critHigh, decimals: dec, mandatory: i < 6, status: 'Active' }));

  const sys = (s) => s.split('|');
  const emrTemplates = [
    { code: 'TPL-GEN', name: 'General medicine', specialty: 'General', phase: 'Phase 1', exam: sys('General appearance|Head eyes and ENT|Neck and lymph nodes|Chest and lungs|Heart|Abdomen|Extremities|Skin|Neurological'), ros: sys('Constitutional|Eyes|ENT|Cardiovascular|Respiratory|Gastrointestinal|Genitourinary|Musculoskeletal|Skin|Neurological|Psychiatric|Endocrine') },
    { code: 'TPL-CAR', name: 'Cardiology', specialty: 'Cardiology', phase: 'Phase 1', exam: sys('General appearance|Jugular venous pressure|Carotid pulses|Apex beat|Heart sounds S1 and S2|Murmurs|Peripheral pulses|Peripheral oedema|Lung bases'), ros: sys('Chest pain|Dyspnoea on exertion|Orthopnoea|Paroxysmal nocturnal dyspnoea|Palpitations|Syncope|Leg swelling|Claudication') },
    { code: 'TPL-PED', name: 'Paediatrics', specialty: 'Paediatrics', phase: 'Phase 1', exam: sys('General appearance and activity|Hydration|Growth centiles|Fontanelle (infants)|Ears and throat|Chest|Heart|Abdomen|Skin and rash|Development milestones'), ros: sys('Feeding|Fever|Cough|Vomiting|Diarrhoea|Urine output|Sleep|Rash|Immunisation up to date') },
    { code: 'TPL-OBG', name: 'Obstetrics and gynaecology', specialty: 'Obstetrics and Gynaecology', phase: '2nd phase', exam: sys('Fundal height|Fetal heart rate|Presentation'), ros: sys('Bleeding|Fetal movements') },
    { code: 'TPL-DEN', name: 'Dental', specialty: 'Dental', phase: '2nd phase', exam: sys('Dental chart|Gums|Occlusion'), ros: sys('Tooth pain|Bleeding gums') },
    { code: 'TPL-OPH', name: 'Ophthalmology', specialty: 'Ophthalmology', phase: '2nd phase', exam: sys('Visual acuity|Intraocular pressure|Fundus'), ros: sys('Blurred vision|Eye pain') },
  ].map((t, i) => Object.assign({ id: 'tp_' + pad(i + 1), examText: t.exam.join(', '), rosText: t.ros.join(', '), status: t.phase === 'Phase 1' ? 'Active' : 'Inactive' }, t));

  /* Allergy master. `matches` are drug generics or categories that are a hard stop, `cross` are cross-reactive (warning). */
  const emrAllergies = [
    ['AL-PEN', 'Penicillin', 'Drug', 'Severe', 'Amoxicillin, Amoxicillin/Clavulanate, Ampicillin, Piperacillin, Benzylpenicillin', 'Ceftriaxone, Cefuroxime, Cefalexin'],
    ['AL-CEP', 'Cephalosporins', 'Drug', 'Moderate', 'Ceftriaxone, Cefuroxime, Cefalexin', 'Amoxicillin, Amoxicillin/Clavulanate'],
    ['AL-SUL', 'Sulfa drugs', 'Drug', 'Moderate', 'Sulfamethoxazole, Co-trimoxazole', 'Furosemide'],
    ['AL-ASP', 'Aspirin', 'Drug', 'Moderate', 'Aspirin', 'Ibuprofen'],
    ['AL-NSA', 'NSAIDs', 'Drug', 'Moderate', 'Ibuprofen, Diclofenac, Naproxen, Aspirin', ''],
    ['AL-COD', 'Codeine', 'Drug', 'Moderate', 'Codeine', 'Morphine sulfate, Tramadol'],
    ['AL-MOR', 'Morphine', 'Drug', 'Severe', 'Morphine sulfate', 'Codeine, Tramadol'],
    ['AL-LAT', 'Latex', 'Environmental', 'Severe', '', ''],
    ['AL-IOD', 'Iodine contrast', 'Drug', 'Severe', 'Iodinated contrast', ''],
    ['AL-PNT', 'Peanuts', 'Food', 'Severe', '', ''],
    ['AL-SHF', 'Shellfish', 'Food', 'Moderate', '', ''],
    ['AL-EGG', 'Eggs', 'Food', 'Mild', '', ''],
  ].map(([code, name, type, severity, matches, cross], i) => ({ id: 'al_' + pad(i + 1), code, name, type, severity, matches, cross, status: 'Active' }));

  const emrReferralReasons = [
    ['RR-OPN', 'Specialist opinion', 'Referral'], ['RR-PRC', 'Procedure required', 'Referral'], ['RR-INV', 'Further investigation', 'Referral'], ['RR-ABN', 'Abnormal result review', 'Consultation'],
    ['RR-COM', 'Co-management of inpatient', 'Consultation'], ['RR-PRE', 'Pre-operative assessment', 'Consultation'], ['RR-HLC', 'Higher level of care', 'Transfer'], ['RR-SPC', 'Specialty ward transfer', 'Transfer'],
    ['RR-PAT', 'Patient request', 'Referral'],
  ].map(([code, name, type], i) => ({ id: 'rr_' + pad(i + 1), code, name, type, status: 'Active' }));

  const emrNoteTemplates = [
    ['NT-SOAP', 'Standard SOAP note', 'Consultation', 'All', 'S: \nO: \nA: \nP: '],
    ['NT-HTN', 'Hypertension follow-up', 'Consultation', 'Cardiology', 'Known hypertensive on regular medication. Home BP readings reviewed. No chest pain, headache or visual symptoms. Adherent to medicines and low salt diet.'],
    ['NT-CHP', 'Chest pain assessment', 'Consultation', 'Cardiology', 'Central chest pain, onset ___, character ___, radiation ___, duration ___ minutes. Associated sweating / breathlessness: ___. Risk factors: ___.'],
    ['NT-URI', 'Paediatric URTI', 'Consultation', 'Paediatrics', 'Fever and cough for ___ days. Feeding well, active and playful. No breathing difficulty, no rash. Immunisations up to date.'],
    ['NT-DM', 'Diabetes review', 'Consultation', 'General', 'Type 2 diabetes on ___. Home glucose readings ___. No hypoglycaemia. Diet and exercise discussed. Foot and eye screening status: ___.'],
    ['NT-PRG', 'Daily progress note', 'Progress', 'All', 'Day ___ of admission. Overnight: ___. Vitals stable. Plan for today: ___.'],
    ['NT-DIS', 'Discharge summary', 'Discharge', 'All', 'Admitted with ___. Hospital course: ___. Condition at discharge: stable. Follow-up in clinic in ___ days.'],
    ['NT-MRP', 'Medical report', 'Medical report', 'All', 'This is to certify that the above patient was seen and treated at Tibbi Hospital for ___. The patient is advised ___.'],
    ['NT-SCK', 'Sick leave certificate', 'Medical report', 'All', 'The above patient attended the clinic today and is advised rest for ___ days from ___.'],
  ].map(([code, name, type, specialty, body], i) => ({ id: 'nt_' + pad(i + 1), code, name, type, specialty, body, status: 'Active' }));

  /* ---------- Consultation notes for existing encounters ---------- */
  const emrNotes = [];
  const exNormal = (tpl) => { const o = {}; tpl.exam.forEach((k, i) => { o[k] = { st: 'N', text: '' }; }); return o; };
  const tplFor = (spec) => emrTemplates.find(t => t.specialty === spec && t.phase === 'Phase 1') || emrTemplates[0];
  const dxBySpec = { Cardiology: ['I10', 'R07.9', 'I20.9', 'I48.91'], Paediatrics: ['J06.9', 'H66.90', 'R50.9', 'L20.9'], 'Internal Medicine': ['E11.9', 'N39.0', 'R51.9', 'E78.5'], Orthopaedics: ['M54.5', 'M17.11', 'S52.501A'], 'Obstetrics and Gynaecology': ['Z00.00'], ENT: ['J02.9', 'J06.9'], 'General Surgery': ['K35.80', 'K21.9'], Dermatology: ['L20.9'] };
  const ccDx = { 'Chest tightness on exertion': 'I20.9', 'Palpitations for 2 weeks': 'I48.91', 'Follow-up of hypertension': 'I10', 'Shortness of breath on climbing stairs': 'I20.9', 'Fever and cough for 3 days': 'J06.9', 'Ear pain': 'H66.90', 'Vaccination visit': 'Z00.00', 'Rash on arms': 'L20.9', 'Diabetes follow-up': 'E11.9', 'Fatigue and weight loss': 'E03.9', 'Burning urination': 'N39.0', 'Headache for 1 week': 'R51.9', 'Right knee pain': 'M17.11', 'Low back pain': 'M54.5', 'Wrist injury after fall': 'S52.501A', 'Antenatal visit, 28 weeks': 'Z00.00', 'Irregular cycles': 'Z00.00', 'Sore throat': 'J02.9', 'Blocked nose': 'J06.9', 'Right lower abdominal pain': 'K35.80', 'Inguinal swelling': 'K21.9', 'Itchy rash': 'L20.9', 'Acne review': 'L20.9', 'General review': 'Z00.00' };
  S.encounters.filter(e => e.type === 'OPD' && (e.status === 'Completed' || e.status === 'In consultation')).forEach((e, i) => {
    const d = docOf(e.doctorId), tpl = tplFor(d.specialty);
    const dx = ccDx[e.complaint] || pick(dxBySpec[d.specialty] || ['Z00.00']);
    const signed = e.status === 'Completed';
    const cc = emrComplaints.find(c => c.icd10 === dx) || null;
    emrNotes.push({ id: 'nn_' + pad(i + 1, 4), encounterId: e.id, patientId: e.patientId, doctorId: e.doctorId, complaintCode: cc ? cc.code : '', complaint: e.complaint || (cc ? cc.name : ''),
      hpi: signed ? `${e.complaint}. Symptoms for ${pick(['2 days', '1 week', '3 weeks', '2 months'])}. ${pick(['No red flag symptoms.', 'Settles with rest.', 'Worse at night.', 'No fever or weight loss.'])}` : `${e.complaint}. `,
      templateId: tpl.id, exam: exNormal(tpl), examNote: signed ? 'Examination unremarkable apart from the findings noted.' : '', ros: {}, rosNote: '',
      diagnoses: signed ? [{ code: dx, name: icd(dx).name, primary: true }] : [],
      subjective: '', objective: '', assessment: signed ? icd(dx).name + '.' : '', plan: signed ? pick(['Continue current medicines. Review in 4 weeks.', 'Investigations ordered. Review with results.', 'Symptomatic treatment. Return if worse.', 'Lifestyle advice given. Follow-up in 3 months.']) : '',
      followUpDays: signed ? pick([0, 7, 14, 28, 90]) : '', instructions: '', status: signed ? 'Signed' : 'Draft', createdAt: e.start, updatedAt: e.end || e.start,
      signedAt: signed ? (e.end || e.start) : '', signedBy: signed ? d.name : '' });
  });

  /* ---------- Referrals ---------- */
  const enOf = (pid, type) => S.encounters.find(e => e.patientId === pid && (!type || e.type === type));
  const ipd = S.encounters.filter(e => e.type === 'IPD');
  const opdToday = S.encounters.filter(e => e.type === 'OPD' && e.start.startsWith(T));
  const emrReferrals = [
    ['Consultation', ipd[1], 'dr_04', 'dr_01', 'Cardiology', 'RR-COM', 'Urgent', 'Pending', 'New ECG changes on day 2 of pneumonia admission. Please review for ischaemia.', -0.1],
    ['Referral', opdToday[1], 'dr_02', 'dr_01', 'Cardiology', 'RR-OPN', 'Routine', 'Pending', 'Murmur heard on routine check. Echo and cardiology opinion please.', 0],
    ['Consultation', ipd[4], 'dr_04', 'dr_08', 'General Surgery', 'RR-PRE', 'Urgent', 'Accepted', 'Urosepsis with possible obstructive cause. Surgical opinion.', -1],
    ['Transfer', ipd[11], 'dr_04', 'dr_01', 'Cardiology', 'RR-HLC', 'STAT', 'Accepted', 'Severe pneumonia now with rapid AF. Transfer to CCU under cardiology.', -1],
    ['Referral', opdToday[0], 'dr_01', 'dr_04', 'Internal Medicine', 'RR-INV', 'Routine', 'Pending', 'Raised HbA1c 8.9%. Diabetes optimisation please.', 0],
    ['Referral', enOf('pt_009'), 'dr_01', 'dr_05', 'Orthopaedics', 'RR-PRC', 'Routine', 'Declined', 'Knee pain, possible meniscal tear. Requesting MRI review.', -6],
    ['Consultation', ipd[0], 'dr_01', 'dr_04', 'Internal Medicine', 'RR-COM', 'Urgent', 'Completed', 'Glycaemic control during admission for unstable angina.', -2],
    ['Referral', opdToday[2], 'dr_03', 'dr_07', 'ENT', 'RR-OPN', 'Routine', 'Pending', 'Recurrent sinusitis.', 0],
    ['Transfer', ipd[8], 'dr_02', 'dr_09', 'Emergency Medicine', 'RR-SPC', 'Routine', 'Cancelled', 'Raised in error.', -1],
  ].filter(r => r[1]).map(([type, e, from, to, spec, reason, urgency, status, notes, off], i) => {
    const at = off === 0 ? `${T} ${pad(9 + i)}:${pad(i * 7 % 60)}` : off > -1 ? `${T} 07:${pad(10 + i)}` : `${addDays(T, Math.round(off))} ${pad(10 + i)}:15`;
    return { id: 'rf_' + pad(i + 1, 3), no: 'REF-26-' + (4400 + i), type, patientId: e.patientId, encounterId: e.id, fromDoctorId: from, toDoctorId: to, toSpecialty: spec, reasonCode: reason, urgency, notes, status, createdAt: at, createdBy: docOf(from).name,
      respondedAt: /Accepted|Declined|Completed/.test(status) ? at.slice(0, 10) + ' 16:20' : '', response: status === 'Declined' ? 'Please arrange MRI first and re-refer with the report.' : status === 'Completed' ? 'Seen. Basal-bolus insulin started, diabetes educator informed.' : status === 'Accepted' ? 'Accepted. Will see the patient today.' : '', cancelReason: status === 'Cancelled' ? 'Raised in error' : '' };
  });

  /* ---------- Inpatient progress notes, home medicines ---------- */
  const emrProgressNotes = [];
  ipd.forEach((e, i) => {
    const days = Math.max(1, Math.round((new Date(T) - new Date(e.start.slice(0, 10))) / 864e5));
    for (let k = 0; k < Math.min(days, 3); k++) {
      const day = addDays(T, -k);
      emrProgressNotes.push({ id: 'pn_' + pad(emrProgressNotes.length + 1, 4), encounterId: e.id, patientId: e.patientId, doctorId: e.doctorId, at: `${day} ${pad(8 + (i % 3))}:${pad((i * 11) % 60)}`, type: 'Daily round',
        s: pick(['Slept well, no complaints.', 'Mild pain at night, settled with analgesia.', 'Feels better than yesterday.', 'Still short of breath on walking.']),
        o: pick(['Afebrile, haemodynamically stable.', 'Chest clear. Abdomen soft.', 'Mild bibasal crackles.', 'Wound clean and dry.']),
        a: e.reason + (k === 0 ? ', improving.' : ', stable.'), p: pick(['Continue current treatment.', 'Repeat bloods in the morning.', 'Mobilise with physiotherapy.', 'Plan discharge in 24 to 48 hours.']), status: k === 0 && i % 3 === 0 ? 'Draft' : 'Signed', signedBy: k === 0 && i % 3 === 0 ? '' : docOf(e.doctorId).name });
    }
  });
  const homeMedMap = { Hypertension: [['Amlodipine 5 mg tablet', '5 mg', 'Once daily', 'it_001'], ['Losartan 50 mg tablet', '50 mg', 'Once daily', 'it_025']], 'Type 2 diabetes': [['Metformin 500 mg tablet', '500 mg', 'Twice daily', 'it_002']], Asthma: [['Salbutamol 100 mcg inhaler', '2 puffs', 'As needed', 'it_010']], Hyperlipidaemia: [['Atorvastatin 20 mg tablet', '20 mg', 'At night', 'it_003']], Hypothyroidism: [['Levothyroxine 50 mcg tablet', '50 mcg', 'Once daily before breakfast', 'it_018']], 'Atrial fibrillation': [['Bisoprolol 5 mg tablet', '5 mg', 'Once daily', 'it_019']], 'Chronic kidney disease stage 2': [], Osteoarthritis: [['Paracetamol 500 mg tablet', '1 g', 'Every 6 hours as needed', 'it_007']] };
  const emrHomeMeds = [];
  ipd.forEach((e) => {
    const p = S.patients.find(x => x.id === e.patientId) || {};
    const list = (p.chronic || []).reduce((a, c) => a.concat(homeMedMap[c] || []), []);
    if (!list.length) list.push(['Omeprazole 20 mg capsule', '20 mg', 'Once daily', 'it_009']);
    list.forEach(([name, dose, freq, itemId]) => emrHomeMeds.push({ id: 'hm_' + pad(emrHomeMeds.length + 1, 3), patientId: p.id, itemId, name, dose, frequency: freq, source: pick(['Patient', 'Previous prescription', 'Family']), status: 'Active' }));
  });
  if (ipd[0]) emrHomeMeds.push({ id: 'hm_' + pad(emrHomeMeds.length + 1, 3), patientId: ipd[0].patientId, itemId: 'it_020', name: 'Aspirin 75 mg tablet', dose: '75 mg', frequency: 'Once daily', source: 'Patient', status: 'Active' });

  const emrDischarges = ipd[4] ? [{ id: 'dc_001', encounterId: ipd[4].id, patientId: ipd[4].patientId, doctorId: ipd[4].doctorId, status: 'Draft', plannedDate: T, disposition: 'Home', condition: 'Stable',
    course: 'Admitted with urosepsis. Treated with IV ceftriaxone for 4 days with good response. Afebrile for 48 hours. Urine culture grew E. coli sensitive to ceftriaxone.', procedures: 'None', instructions: 'Complete oral antibiotics. Drink 2 litres of fluid a day. Return if fever or flank pain.', followUpDays: 14, createdAt: `${T} 08:40`, signedAt: '', signedBy: '' }] : [];

  const emrDocuments = [
    ['pt_001', 'ECG report', 'ECG', 'ecg_20261122.pdf', -3, 'Final'], ['pt_001', 'Angiography report (external)', 'External report', 'angio_ext.pdf', -40, 'Final'], ['pt_001', 'Consent for cardiac catheterisation', 'Consent', 'consent_cath.pdf', -2, 'Signed'],
    ['pt_005', 'Echocardiography report', 'Imaging report', 'echo_0525.pdf', -180, 'Final'], ['pt_017', 'Holter monitor summary', 'ECG', 'holter.pdf', -60, 'Final'], ['pt_035', 'Discharge summary, Al-Amiri Hospital', 'External report', 'amiri_dc.pdf', -120, 'Final'],
    ['pt_004', 'Vaccination card', 'Scanned document', 'vacc_card.jpg', -300, 'Final'], ['pt_029', 'Referral letter from clinic', 'Referral letter', 'ref_letter.pdf', 0, 'Pending review'],
  ].map(([pid, title, type, file, off, status], i) => ({ id: 'dm_' + pad(i + 1, 3), patientId: pid, encounterId: '', title, type, file, size: (120 + i * 37) + ' KB', at: `${addDays(T, off)} 10:${pad(i * 6)}`, by: i % 2 ? 'Dr. Khalid Al-Rashidi' : 'Medical Records', status }));

  const emrAlertLog = [
    ['Allergy', 'pt_003', 'Co-trimoxazole vs Sulfa drugs', 'Overridden', 'Patient tolerated before', 'Dr. Hanan Al-Sabah', -4],
    ['Duplicate order', 'pt_007', 'CBC already ordered within 24 hours', 'Overridden', 'Repeat requested by consultant', 'Dr. Hanan Al-Sabah', -2],
    ['Duplicate order', 'pt_011', 'Basic Metabolic Panel still open', 'Order removed', '', 'Dr. Hanan Al-Sabah', -1],
    ['Allergy', 'pt_001', 'Ceftriaxone vs Penicillin (cross-reactivity)', 'Overridden', 'Clinically indicated, benefit outweighs risk', 'Dr. Khalid Al-Rashidi', -2],
    ['Critical value', 'pt_035', 'Potassium 6.4 mmol/L', 'Acknowledged', '', 'Dr. Khalid Al-Rashidi', -1],
    ['Allergy', 'pt_015', 'Ibuprofen vs Aspirin (cross-reactivity)', 'Order removed', '', 'Dr. Tariq Mahmoud', -6],
  ].map(([type, pid, text, outcome, reason, by, off], i) => ({ id: 'ax_' + pad(i + 1, 3), type, patientId: pid, text, outcome, reason, by, at: `${addDays(T, off)} ${pad(9 + i)}:${pad(i * 9)}` }));

  /* Orders EMR adds once to the shared orders list (see EMR.ensure in emr.js). */
  const e0 = ipd[0], e10 = ipd[10], e3 = ipd[3];
  const emrSeedOrders = [];
  if (e0) emrSeedOrders.push({ id: 'or_e001', no: 'ORD-79001', type: 'lab', encounterId: e0.id, patientId: e0.patientId, code: 'TROP', name: 'Troponin I (high sensitivity)', status: 'Verified', priority: 'STAT', orderedAt: `${T} 08:05`, by: e0.doctorId, notes: 'Repeat troponin, 6 hours',
    results: [{ name: 'Troponin I', value: 538, unit: 'ng/L', low: 0, high: 26, flag: 'H', critical: true }], resultedAt: `${T} 09:38`, resultedBy: 'Hassan Bukhari', verifiedBy: 'Dr. Lina Haddad', verifiedAt: `${T} 09:40` });
  if (e10) emrSeedOrders.push({ id: 'or_e002', no: 'ORD-79002', type: 'lab', encounterId: e10.id, patientId: e10.patientId, code: 'K', name: 'Potassium', status: 'Verified', priority: 'Urgent', orderedAt: `${T} 06:10`, by: e10.doctorId, notes: '',
    results: [{ name: 'Potassium', value: 6.4, unit: 'mmol/L', low: 3.5, high: 5.1, flag: 'H', critical: true }], resultedAt: `${T} 07:02`, resultedBy: 'Hassan Bukhari', verifiedBy: 'Dr. Lina Haddad', verifiedAt: `${T} 07:05` });
  if (e0) emrSeedOrders.push({ id: 'or_e003', no: 'ORD-79003', type: 'lab', encounterId: e0.id, patientId: e0.patientId, code: 'LIPID', name: 'Lipid Profile', status: 'Verified', priority: 'Routine', orderedAt: `${addDays(T, -2)} 07:30`, by: e0.doctorId, notes: '',
    results: [{ name: 'Total cholesterol', value: 6.1, unit: 'mmol/L', low: 0, high: 5.2, flag: 'H', critical: false }, { name: 'LDL', value: 4.2, unit: 'mmol/L', low: 0, high: 3.4, flag: 'H', critical: false }, { name: 'HDL', value: 0.9, unit: 'mmol/L', low: 1.0, high: 3.0, flag: 'L', critical: false }, { name: 'Triglycerides', value: 1.6, unit: 'mmol/L', low: 0, high: 1.7, flag: '', critical: false }],
    resultedAt: `${addDays(T, -2)} 11:10`, resultedBy: 'Hassan Bukhari', verifiedBy: 'Dr. Lina Haddad', verifiedAt: `${addDays(T, -2)} 11:30` });
  if (e3) emrSeedOrders.push({ id: 'or_e004', no: 'ORD-79004', type: 'rad', encounterId: e3.id, patientId: e3.patientId, code: 'CT-CA', name: 'CT coronary angiography', status: 'Pending approval', priority: 'Urgent', orderedAt: `${T} 08:50`, by: 'dr_03', createdBy: 'us_14', notes: 'New onset AF, rule out coronary disease', restricted: true, restrictReason: 'High-cost imaging (CT)' });
  if (e10) emrSeedOrders.push({ id: 'or_e005', no: 'ORD-79005', type: 'med', setting: 'IPD', encounterId: e10.id, patientId: e10.patientId, itemId: 'it_015', code: 'DRG-015', name: 'Morphine sulfate 10 mg/mL injection', dose: '2 mg', route: 'Intravenous', frequency: 'Every 4 hours as needed', days: 2, qty: 6, status: 'Pending approval', priority: 'Urgent', orderedAt: `${T} 09:15`, by: 'dr_03', createdBy: 'us_14', notes: 'Chest pain not settling', restricted: true, restrictReason: 'Controlled drug (Schedule II)' });
  if (ipd[6]) emrSeedOrders.push({ id: 'or_e006', no: 'ORD-79006', type: 'rad', encounterId: ipd[6].id, patientId: ipd[6].patientId, code: 'MR-KN', name: 'MRI knee', status: 'Pending approval', priority: 'Routine', orderedAt: `${T} 10:02`, by: 'dr_05', createdBy: 'us_13', notes: 'Laterality: Right. Suspected ligament injury', restricted: true, restrictReason: 'High-cost imaging (MRI)' });

  Object.assign(S, { emrComplaints, emrVitalParams, emrTemplates, emrAllergies, emrReferralReasons, emrNoteTemplates, emrNotes, emrReferrals, emrProgressNotes, emrHomeMeds, emrRecon: [], emrDischarges, emrMedReports: [], emrDocuments, emrResultAcks: [], emrAlertLog, emrSeedOrders });
})();
