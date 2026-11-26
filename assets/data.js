/* Seed (dummy) data for the Tibbi Orbit staff web prototype.
 * Every record has a stable internal id (SCP-01); codes and names are display values only.
 * Data is copied to localStorage on first load so edits persist; "Reset demo data" restores this seed. */
(function () {
  const TODAY = '2026-11-25';

  const companies = [
    { id: 'co_01', code: 'TBH', name: 'Tibbi Health Holding', nameAr: 'تبي القابضة للرعاية الصحية', legalName: 'Tibbi Health Holding K.S.C.C.', regRef: 'CR-458812', status: 'Active', timezone: 'Asia/Kuwait', language: 'English', contactName: 'Fahad Al-Sabah', phone: '+965 2222 1000', email: 'info@tibbihealth.example', website: 'https://tibbihealth.example', address: { line1: 'Salem Al-Mubarak Street', line2: 'Tower 3, Floor 12', city: 'Salmiya', region: 'Hawalli', postal: '22001', country: 'Kuwait' }, social: [{ platform: 'Instagram', url: 'https://instagram.com/tibbihealth' }, { platform: 'X', url: 'https://x.com/tibbihealth' }], logo: true, updatedBy: 'Sara Al-Mutairi', updatedAt: '2026-11-20 10:42', version: 4 },
    { id: 'co_02', code: 'ANM', name: 'Al Noor Medical Company', nameAr: 'شركة النور الطبية', legalName: 'Al Noor Medical Company W.L.L.', regRef: 'CR-301977', status: 'Active', timezone: 'Asia/Kuwait', language: 'Arabic', contactName: 'Mona Al-Ajmi', phone: '+965 2488 5500', email: 'contact@alnoor.example', website: 'https://alnoor.example', address: { line1: 'Block 4, Street 18', line2: '', city: 'Farwaniya', region: 'Farwaniya', postal: '81000', country: 'Kuwait' }, social: [{ platform: 'Instagram', url: 'https://instagram.com/alnoormedical' }], logo: false, updatedBy: 'Sara Al-Mutairi', updatedAt: '2026-11-02 09:15', version: 2 },
    { id: 'co_03', code: 'GLF', name: 'Gulf Care Partners', nameAr: 'شركاء الخليج للرعاية', legalName: 'Gulf Care Partners Co.', regRef: 'CR-119023', status: 'Inactive', timezone: 'Asia/Kuwait', language: 'English', contactName: '', phone: '+965 2200 7788', email: 'admin@gulfcare.example', website: '', address: { line1: 'Shuwaikh Industrial', line2: '', city: 'Shuwaikh', region: 'Capital', postal: '70050', country: 'Kuwait' }, social: [], logo: false, updatedBy: 'System Setup', updatedAt: '2026-08-14 16:20', version: 3, deactivationReason: 'Merged into Tibbi Health Holding', deactivatedAt: '2026-08-14' },
  ];

  const branches = [
    { id: 'br_01', companyId: 'co_01', code: 'SAL', name: 'Tibbi Salmiya Hospital', nameAr: 'مستشفى تبي السالمية', siteType: 'Hospital', status: 'Active', timezone: 'Asia/Kuwait', language: 'English', phone: '+965 2222 1100', email: 'salmiya@tibbihealth.example', website: 'https://tibbihealth.example/salmiya', regRef: 'MOH-H-1182', address: { line1: 'Salem Al-Mubarak Street', line2: 'Block 10', city: 'Salmiya', region: 'Hawalli', postal: '22001', country: 'Kuwait' }, social: [{ platform: 'Instagram', url: 'https://instagram.com/tibbisalmiya' }], overrides: ['idle_timeout'], updatedBy: 'Sara Al-Mutairi', updatedAt: '2026-11-18 12:01', version: 6 },
    { id: 'br_02', companyId: 'co_01', code: 'HAW', name: 'Tibbi Hawalli Clinic', nameAr: 'عيادة تبي حولي', siteType: 'Clinic', status: 'Active', timezone: 'Asia/Kuwait', language: 'English', phone: '+965 2222 1200', email: 'hawalli@tibbihealth.example', website: '', regRef: 'MOH-C-2210', address: { line1: 'Tunis Street', line2: '', city: 'Hawalli', region: 'Hawalli', postal: '32001', country: 'Kuwait' }, social: [], overrides: [], updatedBy: 'Omar Haddad', updatedAt: '2026-10-30 08:47', version: 2 },
    { id: 'br_03', companyId: 'co_01', code: 'JAH', name: 'Tibbi Jahra Day Care', nameAr: 'مركز تبي الجهراء', siteType: 'Day care centre', status: 'Inactive', timezone: 'Asia/Kuwait', language: 'Arabic', phone: '+965 2222 1300', email: 'jahra@tibbihealth.example', website: '', regRef: 'MOH-D-0931', address: { line1: 'Block 2', line2: '', city: 'Jahra', region: 'Jahra', postal: '01000', country: 'Kuwait' }, social: [], overrides: [], updatedBy: 'Sara Al-Mutairi', updatedAt: '2026-09-11 14:30', version: 3, deactivationReason: 'Site closed for renovation', deactivatedAt: '2026-09-11' },
    { id: 'br_04', companyId: 'co_02', code: 'FRW', name: 'Al Noor Farwaniya Hospital', nameAr: 'مستشفى النور الفروانية', siteType: 'Hospital', status: 'Active', timezone: 'Asia/Kuwait', language: 'Arabic', phone: '+965 2488 5501', email: 'farwaniya@alnoor.example', website: 'https://alnoor.example', regRef: 'MOH-H-0877', address: { line1: 'Block 4, Street 18', line2: '', city: 'Farwaniya', region: 'Farwaniya', postal: '81000', country: 'Kuwait' }, social: [{ platform: 'Instagram', url: 'https://instagram.com/alnoorfarwaniya' }, { platform: 'Facebook', url: 'https://facebook.com/alnoorfarwaniya' }], overrides: ['lockout_threshold'], updatedBy: 'Mona Al-Ajmi', updatedAt: '2026-11-10 11:05', version: 3 },
    { id: 'br_05', companyId: 'co_01', code: 'SAL', name: 'Gulf Care Salmiya (legacy)', nameAr: 'الخليج السالمية', siteType: 'Clinic', status: 'Inactive', timezone: 'Asia/Kuwait', language: 'English', phone: '', email: '', website: '', regRef: '', address: { line1: '', line2: '', city: 'Salmiya', region: 'Hawalli', postal: '', country: 'Kuwait' }, social: [], overrides: [], updatedBy: 'System Setup', updatedAt: '2026-08-14 16:20', version: 1, companyIdFix: 'co_03' },
  ];
  // br_05 belongs to Gulf Care (same code SAL allowed in another company: ORG-02)
  branches[4].companyId = 'co_03';
  delete branches[4].companyIdFix;

  const clinics = [
    { id: 'cl_01', code: 'CARD', name: 'Cardiology', status: 'Active' },
    { id: 'cl_02', code: 'PED', name: 'Paediatrics', status: 'Active' },
    { id: 'cl_03', code: 'ORTH', name: 'Orthopaedics', status: 'Active' },
    { id: 'cl_04', code: 'DERM', name: 'Dermatology', status: 'Active' },
    { id: 'cl_05', code: 'IM', name: 'Internal Medicine', status: 'Active' },
    { id: 'cl_06', code: 'OBG', name: 'Obstetrics and Gynaecology', status: 'Active' },
    { id: 'cl_07', code: 'ENT', name: 'ENT', status: 'Active' },
    { id: 'cl_08', code: 'GS', name: 'General Surgery', status: 'Active' },
    { id: 'cl_09', code: 'OPH', name: 'Ophthalmology', status: 'Inactive' },
  ];

  const employees = [
    { id: 'emp_1001', empNo: 'E-1001', name: 'Sara Al-Mutairi', designation: 'IT Systems Manager', branchId: 'br_01', education: 'MSc Information Systems, Kuwait University', hrStatus: 'Active', lastWorkingDate: null, lastSync: '2026-11-25 02:00' },
    { id: 'emp_1002', empNo: 'E-1002', name: 'Dr. Khalid Al-Rashidi', designation: 'Consultant Cardiologist', branchId: 'br_01', education: 'MBBS, MD Cardiology (Cairo University); Fellowship, Royal College of Physicians', hrStatus: 'Active', lastWorkingDate: null, lastSync: '2026-11-25 02:00' },
    { id: 'emp_1003', empNo: 'E-1003', name: 'Dr. Noura Al-Enezi', designation: 'Specialist Paediatrician', branchId: 'br_01', education: 'MBBS (Kuwait University); Arab Board in Paediatrics', hrStatus: 'Active', lastWorkingDate: null, lastSync: '2026-11-25 02:00' },
    { id: 'emp_1004', empNo: 'E-1004', name: 'Maria Santos', designation: 'Charge Nurse', branchId: 'br_01', education: 'BSc Nursing (University of the Philippines)', hrStatus: 'Active', lastWorkingDate: null, lastSync: '2026-11-25 02:00' },
    { id: 'emp_1005', empNo: 'E-1005', name: 'Omar Haddad', designation: 'Branch Administrator', branchId: 'br_02', education: 'BBA, American University of Kuwait', hrStatus: 'Active', lastWorkingDate: null, lastSync: '2026-11-25 02:00' },
    { id: 'emp_1006', empNo: 'E-1006', name: 'Ahmed Farouk', designation: 'Pharmacist', branchId: 'br_01', education: 'BPharm (Alexandria University)', hrStatus: 'Pending separation', lastWorkingDate: '2026-11-30', lastSync: '2026-11-25 02:00' },
    { id: 'emp_1007', empNo: 'E-1007', name: 'Rajesh Kumar', designation: 'Storekeeper', branchId: 'br_01', education: 'BCom (University of Kerala)', hrStatus: 'Active', lastWorkingDate: null, lastSync: '2026-11-25 02:00' },
    { id: 'emp_1008', empNo: 'E-1008', name: 'Fatima Al-Kandari', designation: 'Receptionist', branchId: 'br_02', education: 'Diploma in Office Management', hrStatus: 'Active', lastWorkingDate: null, lastSync: '2026-11-25 02:00' },
    { id: 'emp_1009', empNo: 'E-1009', name: 'Hassan Bukhari', designation: 'Lab Technologist', branchId: 'br_01', education: 'BSc Medical Laboratory Science', hrStatus: 'Separated', lastWorkingDate: '2026-10-31', lastSync: '2026-11-25 02:00' },
    { id: 'emp_1010', empNo: 'E-1010', name: 'Dr. Yousef Al-Shammari', designation: 'Registrar, Orthopaedics', branchId: 'br_04', education: 'MBBS (Jordan University of Science and Technology)', hrStatus: 'Active', lastWorkingDate: null, lastSync: '2026-11-24 02:00' },
    { id: 'emp_1011', empNo: 'E-1011', name: 'Layla Hussain', designation: 'Internal Auditor', branchId: 'br_01', education: 'ACCA, BSc Accounting', hrStatus: 'Active', lastWorkingDate: null, lastSync: '2026-11-25 02:00' },
    { id: 'emp_1012', empNo: 'E-1012', name: 'Mona Al-Ajmi', designation: 'Company Administrator', branchId: 'br_04', education: 'BSc Computer Science', hrStatus: 'Active', lastWorkingDate: null, lastSync: '2026-11-24 02:00' },
    { id: 'emp_1013', empNo: 'E-1013', name: 'Dr. Reem Al-Fadhli', designation: 'Consultant Dermatologist', branchId: 'br_02', education: 'MBBS, MRCP (UK), Diploma in Dermatology', hrStatus: 'Active', lastWorkingDate: null, lastSync: '2026-11-25 02:00' },
    { id: 'emp_1014', empNo: 'E-1014', name: 'Bilal Qureshi', designation: 'Radiographer', branchId: 'br_01', education: 'BSc Radiography', hrStatus: 'Active', lastWorkingDate: null, lastSync: '2026-11-25 02:00' },
  ];

  const accounts = [
    { id: 'ac_4100', companyId: 'co_01', code: '4100', name: 'OPD Consultation Revenue', kind: 'Revenue', posting: true, status: 'Active' },
    { id: 'ac_4110', companyId: 'co_01', code: '4110', name: 'OPD Procedure Revenue', kind: 'Revenue', posting: true, status: 'Active' },
    { id: 'ac_4200', companyId: 'co_01', code: '4200', name: 'IPD Room and Board Revenue', kind: 'Revenue', posting: true, status: 'Active' },
    { id: 'ac_4210', companyId: 'co_01', code: '4210', name: 'IPD Surgical Revenue', kind: 'Revenue', posting: true, status: 'Active' },
    { id: 'ac_4000', companyId: 'co_01', code: '4000', name: 'Operating Revenue (header)', kind: 'Revenue', posting: false, status: 'Active' },
    { id: 'ac_5100', companyId: 'co_01', code: '5100', name: 'OPD Clinical Supplies', kind: 'Expense', posting: true, status: 'Active' },
    { id: 'ac_5110', companyId: 'co_01', code: '5110', name: 'OPD Staff Cost', kind: 'Expense', posting: true, status: 'Active' },
    { id: 'ac_5200', companyId: 'co_01', code: '5200', name: 'IPD Consumables', kind: 'Expense', posting: true, status: 'Active' },
    { id: 'ac_5210', companyId: 'co_01', code: '5210', name: 'IPD Nursing Cost', kind: 'Expense', posting: true, status: 'Active' },
    { id: 'ac_5900', companyId: 'co_01', code: '5900', name: 'Old Clinical Supplies (closed)', kind: 'Expense', posting: true, status: 'Inactive' },
    { id: 'ac_n4100', companyId: 'co_02', code: '41-01', name: 'Outpatient Revenue', kind: 'Revenue', posting: true, status: 'Active' },
    { id: 'ac_n4200', companyId: 'co_02', code: '42-01', name: 'Inpatient Revenue', kind: 'Revenue', posting: true, status: 'Active' },
    { id: 'ac_n5100', companyId: 'co_02', code: '51-01', name: 'Outpatient Expenses', kind: 'Expense', posting: true, status: 'Active' },
    { id: 'ac_n5200', companyId: 'co_02', code: '52-01', name: 'Inpatient Expenses', kind: 'Expense', posting: true, status: 'Active' },
  ];

  const NA = 'NA';
  const departments = [
    { id: 'dp_01', companyId: 'co_01', branchId: 'br_01', code: 'CARD', name: 'Cardiology', type: 'Clinical', settings: ['OPD', 'IPD'], hodEmpId: 'emp_1002', hodSource: 'HR', clinicIds: ['cl_01', 'cl_05'], status: 'Active', description: 'Adult cardiology outpatient clinics and cardiac ward.', acc: { opdRev: 'ac_4100', opdExp: 'ac_5100', ipdRev: 'ac_4200', ipdExp: 'ac_5200' }, flags: { a: true, b: false, c: '' }, updatedBy: 'Sara Al-Mutairi', updatedAt: '2026-11-19 15:22', version: 5 },
    { id: 'dp_02', companyId: 'co_01', branchId: 'br_01', code: 'PED', name: 'Paediatrics', type: 'Clinical', settings: ['OPD', 'IPD', 'Day Case'], hodEmpId: 'emp_1003', hodSource: 'HR', clinicIds: ['cl_02'], status: 'Active', description: '', acc: { opdRev: 'ac_4100', opdExp: 'ac_5100', ipdRev: 'ac_4200', ipdExp: 'ac_5200' }, flags: { a: false, b: false, c: '' }, updatedBy: 'Sara Al-Mutairi', updatedAt: '2026-11-12 09:10', version: 3 },
    { id: 'dp_03', companyId: 'co_01', branchId: 'br_01', code: 'NUR', name: 'Nursing', type: 'Clinical', settings: ['IPD'], hodEmpId: 'emp_1004', hodSource: 'Override', clinicIds: [], status: 'Active', description: 'Ward nursing services.', acc: { opdRev: NA, opdExp: NA, ipdRev: 'ac_4200', ipdExp: 'ac_5210' }, flags: { a: false, b: true, c: '' }, updatedBy: 'Sara Al-Mutairi', updatedAt: '2026-11-01 13:44', version: 2 },
    { id: 'dp_04', companyId: 'co_01', branchId: 'br_01', code: 'PHA', name: 'Pharmacy', type: 'Clinical', settings: ['OPD', 'IPD'], hodEmpId: 'emp_1006', hodSource: 'HR', clinicIds: [], status: 'Active', description: 'Inpatient and outpatient pharmacy.', acc: { opdRev: 'ac_4110', opdExp: 'ac_5100', ipdRev: 'ac_4210', ipdExp: 'ac_5200' }, flags: { a: false, b: false, c: '' }, updatedBy: 'Sara Al-Mutairi', updatedAt: '2026-10-28 10:00', version: 2 },
    { id: 'dp_05', companyId: 'co_01', branchId: 'br_01', code: 'ADM', name: 'Administration', type: 'Admin', settings: [], hodEmpId: 'emp_1001', hodSource: 'HR', clinicIds: [], status: 'Active', description: 'Hospital administration and IT.', acc: { opdRev: NA, opdExp: NA, ipdRev: NA, ipdExp: NA }, flags: { a: false, b: false, c: '' }, updatedBy: 'System Setup', updatedAt: '2026-10-01 08:00', version: 1 },
    { id: 'dp_06', companyId: 'co_01', branchId: 'br_01', code: 'LAB', name: 'Laboratory', type: 'Clinical', settings: ['OPD', 'IPD'], hodEmpId: 'emp_1009', hodSource: 'HR', clinicIds: [], status: 'Active', description: '', acc: { opdRev: 'ac_4110', opdExp: 'ac_5900', ipdRev: 'ac_4210', ipdExp: 'ac_5200' }, flags: { a: false, b: false, c: '' }, updatedBy: 'Sara Al-Mutairi', updatedAt: '2026-10-20 12:30', version: 2 },
    { id: 'dp_07', companyId: 'co_01', branchId: 'br_02', code: 'OPD', name: 'Outpatient Clinics', type: 'Clinical', settings: ['OPD'], hodEmpId: 'emp_1013', hodSource: 'HR', clinicIds: ['cl_04', 'cl_07', 'cl_05'], status: 'Active', description: 'Day clinics at Hawalli.', acc: { opdRev: 'ac_4100', opdExp: 'ac_5110', ipdRev: NA, ipdExp: NA }, flags: { a: true, b: false, c: 'Phase 1 pilot' }, updatedBy: 'Omar Haddad', updatedAt: '2026-11-21 17:05', version: 4 },
    { id: 'dp_08', companyId: 'co_01', branchId: 'br_02', code: 'ADM', name: 'Front Office', type: 'Admin', settings: [], hodEmpId: 'emp_1005', hodSource: 'HR', clinicIds: [], status: 'Active', description: 'Reception and call centre.', acc: { opdRev: NA, opdExp: NA, ipdRev: NA, ipdExp: NA }, flags: { a: false, b: false, c: '' }, updatedBy: 'Omar Haddad', updatedAt: '2026-10-30 08:47', version: 1 },
    { id: 'dp_09', companyId: 'co_02', branchId: 'br_04', code: 'ORTH', name: 'Orthopaedics', type: 'Clinical', settings: ['OPD', 'IPD', 'Day Case'], hodEmpId: 'emp_1010', hodSource: 'Override', clinicIds: ['cl_03', 'cl_08'], status: 'Active', description: '', acc: { opdRev: 'ac_n4100', opdExp: 'ac_n5100', ipdRev: 'ac_n4200', ipdExp: 'ac_n5200' }, flags: { a: false, b: false, c: '' }, updatedBy: 'Mona Al-Ajmi', updatedAt: '2026-11-10 11:05', version: 2 },
    { id: 'dp_10', companyId: 'co_01', branchId: 'br_01', code: 'RAD', name: 'Radiology', type: 'Clinical', settings: ['OPD', 'IPD'], hodEmpId: null, hodSource: 'HR', clinicIds: [], status: 'Inactive', description: 'Moved to outsourced provider.', acc: { opdRev: 'ac_4110', opdExp: 'ac_5100', ipdRev: 'ac_4210', ipdExp: 'ac_5200' }, flags: { a: false, b: false, c: '' }, updatedBy: 'Sara Al-Mutairi', updatedAt: '2026-09-30 16:00', version: 3, deactivationReason: 'Service outsourced from 1 Oct 2026', deactivatedAt: '2026-09-30' },
  ];

  const warehouses = [
    { id: 'wh_01', companyId: 'co_01', branchId: 'br_01', code: 'MAIN', name: 'Main Store Salmiya', type: 'Main Store', category: 'Medical and general', location: 'Basement B1, Room 004', custodianUserId: 'us_07', status: 'Active', description: '', flags: { a: true, b: false, c: '' }, updatedBy: 'Sara Al-Mutairi', updatedAt: '2026-11-03 10:10', version: 2 },
    { id: 'wh_02', companyId: 'co_01', branchId: 'br_01', code: 'PHIP', name: 'Inpatient Pharmacy', type: 'Pharmacy Store', category: 'Medicines', location: 'Ground floor, Wing A', custodianUserId: 'us_06', status: 'Active', description: '', flags: { a: false, b: false, c: '' }, updatedBy: 'Sara Al-Mutairi', updatedAt: '2026-11-03 10:12', version: 1 },
    { id: 'wh_03', companyId: 'co_01', branchId: 'br_01', code: 'PHOP', name: 'Outpatient Pharmacy', type: 'Pharmacy Store', category: 'Medicines', location: 'Ground floor, OPD', custodianUserId: 'us_06', status: 'Active', description: '', flags: { a: false, b: false, c: '' }, updatedBy: 'Sara Al-Mutairi', updatedAt: '2026-11-03 10:13', version: 1 },
    { id: 'wh_04', companyId: 'co_01', branchId: 'br_01', code: 'W3SUB', name: 'Ward 3 Sub Store', type: 'Sub Store', category: 'Consumables', location: 'Floor 3, Nursing station', custodianUserId: 'us_04', status: 'Active', description: '', flags: { a: false, b: true, c: '' }, updatedBy: 'Sara Al-Mutairi', updatedAt: '2026-11-05 09:00', version: 1 },
    { id: 'wh_05', companyId: 'co_01', branchId: 'br_02', code: 'GEN', name: 'Hawalli General Store', type: 'General', category: 'General', location: 'Back office', custodianUserId: null, status: 'Active', description: '', flags: { a: false, b: false, c: '' }, updatedBy: 'Omar Haddad', updatedAt: '2026-10-30 09:00', version: 1 },
    { id: 'wh_06', companyId: 'co_02', branchId: 'br_04', code: 'MAIN', name: 'Al Noor Main Store', type: 'Main Store', category: 'Medical and general', location: 'Annex building', custodianUserId: null, status: 'Active', description: '', flags: { a: false, b: false, c: '' }, updatedBy: 'Mona Al-Ajmi', updatedAt: '2026-11-10 11:00', version: 1 },
    { id: 'wh_07', companyId: 'co_01', branchId: 'br_01', code: 'LABST', name: 'Lab Reagent Store', type: 'Sub Store', category: 'Reagents', location: 'Lab, Floor 1', custodianUserId: null, status: 'Inactive', description: '', flags: { a: false, b: false, c: '' }, updatedBy: 'Sara Al-Mutairi', updatedAt: '2026-10-31 18:00', version: 2, deactivationReason: 'Merged into Main Store', deactivatedAt: '2026-10-31' },
  ];

  /* Module catalog: module > submodule > option (screen). `acts` = supported actions (ROL-08). */
  const A = { add: 'Add', edit: 'Edit', view: 'View', cancel: 'Cancel', print: 'Print', verify: 'Verify', approve: 'Approve', admin: 'Admin Access' };
  const ALL = ['add', 'edit', 'view', 'cancel', 'print', 'verify', 'approve', 'admin'];
  const CRUD = ['add', 'edit', 'view', 'print'];
  /* Helper: option(id, name, page, icon, acts, extra). Pages are relative to docs/html/. */
  const O = (id, name, page, icon, acts, extra) => Object.assign({ id, name, page, icon, acts: acts || ['add', 'edit', 'view', 'cancel', 'print'] }, extra || {});
  const MAST = ['add', 'edit', 'view', 'print', 'admin'];
  const REP = ['view', 'print'];
  const modules = [
    { id: 'reception', name: 'Reception and ADT', icon: 'id-card', tile: 't-sky', home: 'reception/index.html', sow: 'Module 1', desc: 'Registration, OPD, ER, admissions, beds and cashier', subs: [
      { id: 'reception.front', name: 'Front office', opts: [
        O('reception.reg.patient', 'Patient Registration', 'reception/patients.html', 'user-plus', ['add', 'edit', 'view', 'print', 'verify']),
        O('reception.reg.merge', 'Patient Merge', 'reception/merge.html', 'git-merge', ['add', 'view', 'approve']),
        O('reception.visit.opd', 'OPD Visits', 'reception/opd.html', 'clipboard-list'),
        O('reception.er', 'Emergency (ER)', 'reception/er.html', 'siren', ['add', 'edit', 'view', 'cancel', 'print']) ] },
      { id: 'reception.ipd', name: 'Inpatient (ADT)', opts: [
        O('reception.visit.adm', 'Admissions and Discharge', 'reception/admissions.html', 'bed-double', ['add', 'edit', 'view', 'cancel', 'approve', 'print']),
        O('reception.beds', 'Bed Board', 'reception/beds.html', 'layout-grid', ['edit', 'view']) ] },
      { id: 'reception.cash', name: 'Cashier', opts: [
        O('reception.cashier', 'Cashier and Shift', 'reception/cashier.html', 'banknote', ['add', 'view', 'cancel', 'print', 'approve']) ] },
      { id: 'reception.setup', name: 'Setup and reports', opts: [
        O('reception.masters', 'Reception Masters', 'reception/masters.html', 'settings-2', MAST),
        O('reception.reports', 'Reception Reports', 'reception/reports.html', 'chart-column', REP) ] } ] },
    { id: 'appointments', name: 'Appointments and Call Centre', icon: 'calendar-days', tile: 't-mint', home: 'appointments/index.html', sow: 'Module 2', desc: 'Doctor calendars, booking, tracking and calls', subs: [
      { id: 'appointments.book', name: 'Booking', opts: [
        O('appointments.book.slot', 'Appointment Book', 'appointments/book.html', 'calendar-plus'),
        O('appointments.track', 'Appointment Tracking', 'appointments/tracking.html', 'list-checks', ['edit', 'view', 'cancel', 'print']),
        O('appointments.book.cc', 'Call Centre', 'appointments/calls.html', 'headset', ['add', 'view', 'print']) ] },
      { id: 'appointments.sched', name: 'Calendars', opts: [
        O('appointments.sched.roster', 'Calendar Management', 'appointments/calendar.html', 'calendar-range', ['add', 'edit', 'view', 'approve']) ] },
      { id: 'appointments.setup', name: 'Setup and reports', opts: [
        O('appointments.masters', 'Appointment Masters', 'appointments/masters.html', 'settings-2', MAST),
        O('appointments.reports', 'Appointment Reports', 'appointments/reports.html', 'chart-column', REP) ] } ] },
    { id: 'emr', name: 'Clinical EMR', icon: 'stethoscope', tile: 't-lilac', home: 'emr/index.html', sow: 'Module 3', desc: 'Consultation, CPOE, prescriptions and clinical history', subs: [
      { id: 'emr.consult', name: 'Consultation', opts: [
        O('emr.consult.note', 'Consultation Console', 'emr/console.html', 'stethoscope', ['add', 'edit', 'view', 'print', 'verify']),
        O('emr.summary', 'Clinical Summary', 'emr/summary.html', 'file-heart', ['view', 'print']),
        O('emr.consult.orders', 'Orders (CPOE)', 'emr/orders.html', 'list-plus', ['add', 'edit', 'view', 'cancel', 'approve']),
        O('emr.consult.rx', 'e-Prescriptions', 'emr/prescriptions.html', 'pill', ['add', 'edit', 'view', 'cancel', 'print']),
        O('emr.referral', 'Referrals and Transfers', 'emr/referrals.html', 'arrow-right-left', ['add', 'edit', 'view', 'cancel', 'approve']) ] },
      { id: 'emr.ipd', name: 'Inpatient', opts: [
        O('emr.inpatient', 'Rounds and Discharge', 'emr/inpatient.html', 'bed', ['add', 'edit', 'view', 'print', 'verify']) ] },
      { id: 'emr.setup', name: 'Setup and reports', opts: [
        O('emr.masters', 'Clinical Masters', 'emr/masters.html', 'settings-2', MAST),
        O('emr.reports', 'EMR Reports', 'emr/reports.html', 'chart-column', REP) ] } ] },
    { id: 'nursing', name: 'Nursing and Wards', icon: 'heart-pulse', tile: 't-rose', home: 'nursing/index.html', sow: 'Module 4', desc: 'Assessments, charting, MAR, orders and handover', subs: [
      { id: 'nursing.ward', name: 'Ward care', opts: [
        O('nursing.assess', 'Nursing Assessments', 'nursing/assessment.html', 'clipboard-check', ['add', 'edit', 'view', 'print']),
        O('nursing.ward.vitals', 'Vitals and Fluid Balance', 'nursing/charting.html', 'activity', ['add', 'edit', 'view']),
        O('nursing.orders', 'Order Worklist', 'nursing/orders.html', 'list-todo', ['edit', 'view', 'verify']),
        O('nursing.ward.mar', 'Medication Administration', 'nursing/mar.html', 'syringe', ['add', 'view', 'verify']),
        O('nursing.notes', 'Progress Notes', 'nursing/notes.html', 'notebook-pen', ['add', 'edit', 'view', 'print']),
        O('nursing.ward.handover', 'Shift Handover', 'nursing/handover.html', 'repeat', ['add', 'view', 'print']),
        O('nursing.discharge', 'Discharge Planning', 'nursing/discharge.html', 'door-open', ['add', 'edit', 'view', 'verify']),
        O('nursing.consume', 'Item Consumption', 'nursing/consumption.html', 'package', ['add', 'view', 'cancel']) ] },
      { id: 'nursing.setup', name: 'Setup and reports', opts: [
        O('nursing.masters', 'Nursing Masters', 'nursing/masters.html', 'settings-2', MAST),
        O('nursing.reports', 'Nursing Reports', 'nursing/reports.html', 'chart-column', REP) ] } ] },
    { id: 'lab', name: 'Laboratory (LIS)', icon: 'flask-conical', tile: 't-peach', home: 'lab/index.html', sow: 'Module 5', desc: 'Orders, samples, results, validation and critical alerts', subs: [
      { id: 'lab.work', name: 'Work lists', opts: [
        O('lab.orders', 'Lab Orders', 'lab/orders.html', 'clipboard-list', ['edit', 'view', 'cancel', 'verify', 'approve']),
        O('lab.work.sample', 'Sample Collection', 'lab/collection.html', 'test-tube', ['add', 'view', 'cancel', 'print']),
        O('lab.accession', 'Sample Receiving', 'lab/receiving.html', 'scan-barcode', ['add', 'view', 'cancel']),
        O('lab.work.result', 'Result Entry and Validation', 'lab/results.html', 'microscope', ['add', 'edit', 'view', 'verify', 'approve']),
        O('lab.out', 'Report Print and e-Send', 'lab/dispatch.html', 'send', ['view', 'print']),
        O('lab.critical', 'Critical Results', 'lab/critical.html', 'bell-ring', ['add', 'view']) ] },
      { id: 'lab.setup', name: 'Setup and reports', opts: [
        O('lab.masters', 'Lab Masters', 'lab/masters.html', 'settings-2', MAST),
        O('lab.reports', 'Lab Reports', 'lab/reports.html', 'chart-column', REP) ] } ] },
    { id: 'radiology', name: 'Radiology (RIS)', icon: 'scan-line', tile: 't-sky', home: 'radiology/index.html', sow: 'Module 6', desc: 'Exam orders, reporting, approval and critical findings', subs: [
      { id: 'radiology.exam', name: 'Work lists', opts: [
        O('radiology.orders', 'Radiology Orders', 'radiology/orders.html', 'clipboard-list', ['edit', 'view', 'cancel', 'verify', 'approve']),
        O('radiology.exam.report', 'Reporting', 'radiology/reporting.html', 'file-pen-line', ['add', 'edit', 'view', 'print', 'verify', 'approve']),
        O('radiology.out', 'Report Print and e-Send', 'radiology/dispatch.html', 'send', ['view', 'print']),
        O('radiology.critical', 'Critical Findings', 'radiology/critical.html', 'bell-ring', ['add', 'view']) ] },
      { id: 'radiology.setup', name: 'Setup and reports', opts: [
        O('radiology.masters', 'Radiology Masters', 'radiology/masters.html', 'settings-2', MAST),
        O('radiology.reports', 'Radiology Reports', 'radiology/reports.html', 'chart-column', REP) ] } ] },
    { id: 'pharmacy', name: 'Pharmacy', icon: 'pill', tile: 't-mint', home: 'pharmacy/index.html', sow: 'Module 7', desc: 'Prescription queues, dispensing, counter sale and returns', subs: [
      { id: 'pharmacy.disp', name: 'Dispensing', opts: [
        O('pharmacy.disp.op', 'OPD Prescription Queue', 'pharmacy/opd-queue.html', 'list-ordered', ['add', 'view', 'cancel', 'print', 'verify']),
        O('pharmacy.ipd', 'IPD Medication Orders', 'pharmacy/ipd-queue.html', 'bed', ['add', 'view', 'cancel', 'print', 'verify']),
        O('pharmacy.verify', 'Review and Dispense', 'pharmacy/dispense.html', 'badge-check', ['add', 'edit', 'view', 'print', 'verify']),
        O('pharmacy.sale', 'Counter Sale', 'pharmacy/counter.html', 'shopping-cart', ['add', 'view', 'cancel', 'print']),
        O('pharmacy.disp.ret', 'Returns and Refunds', 'pharmacy/returns.html', 'undo-2', ['add', 'view', 'approve']),
        O('pharmacy.cd', 'Controlled Drug Register', 'pharmacy/controlled.html', 'lock-keyhole', ['add', 'view', 'verify', 'print']),
        O('pharmacy.stock', 'Stock and Expiry', 'pharmacy/stock.html', 'boxes', ['view', 'print']) ] },
      { id: 'pharmacy.setup', name: 'Setup and reports', opts: [
        O('pharmacy.masters', 'Pharmacy Masters', 'pharmacy/masters.html', 'settings-2', MAST),
        O('pharmacy.reports', 'Pharmacy Reports', 'pharmacy/reports.html', 'chart-column', REP) ] } ] },
    { id: 'incident', name: 'Incident Management', icon: 'triangle-alert', tile: 't-rose', home: 'incident/index.html', sow: 'Module 8', desc: 'Report, review, investigate and close incidents', subs: [
      { id: 'incident.rep', name: 'Incidents', opts: [
        O('incident.rep.new', 'Report an Incident', 'incident/new.html', 'file-plus', ['add', 'view']),
        O('incident.register', 'Incident Register', 'incident/register.html', 'folder-search', ['edit', 'view', 'approve', 'print']),
        O('incident.case', 'Incident Case', 'incident/case.html', 'file-search', ['edit', 'view', 'approve', 'print'], { nav: false }) ] },
      { id: 'incident.setup', name: 'Setup and reports', opts: [
        O('incident.masters', 'Incident Configuration', 'incident/masters.html', 'settings-2', MAST),
        O('incident.reports', 'Incident Reports', 'incident/reports.html', 'chart-column', REP) ] } ] },
    { id: 'insurance', name: 'Insurance and Claims', icon: 'badge-check', tile: 't-lilac', home: 'insurance/index.html', sow: 'Module 9', desc: 'Payer contracts, pre-authorization, claims and remittance', subs: [
      { id: 'insurance.claims', name: 'Claims cycle', opts: [
        O('insurance.contracts', 'Payer Contracts and Coverage', 'insurance/contracts.html', 'signature', ['add', 'edit', 'view', 'approve']),
        O('insurance.claims.pre', 'Pre-Authorizations', 'insurance/preauth.html', 'shield-question-mark', ['add', 'edit', 'view', 'approve']),
        O('insurance.claims.sub', 'Claim Batches', 'insurance/batches.html', 'layers', ['add', 'view', 'print', 'verify']),
        O('insurance.remit', 'Remittance and Reconciliation', 'insurance/remittance.html', 'receipt', ['add', 'view', 'approve']),
        O('insurance.rejected', 'Rejected Claims', 'insurance/rejections.html', 'rotate-ccw', ['add', 'edit', 'view']) ] },
      { id: 'insurance.setup', name: 'Setup and reports', opts: [
        O('insurance.masters', 'Insurance Masters', 'insurance/masters.html', 'settings-2', MAST),
        O('insurance.reports', 'Insurance Reports', 'insurance/reports.html', 'chart-column', REP) ] } ] },
    { id: 'material', name: 'Material Management', icon: 'boxes', tile: 't-peach', home: 'material/index.html', sow: 'Module 10', desc: 'Procurement, receiving, stores and stock', subs: [
      { id: 'material.proc', name: 'Procurement', opts: [
        O('material.pr', 'Purchase Requisitions', 'material/pr.html', 'file-plus-2', ['add', 'edit', 'view', 'cancel', 'approve']),
        O('material.po', 'Purchase Orders', 'material/po.html', 'shopping-bag', ['add', 'edit', 'view', 'cancel', 'print', 'approve']),
        O('material.grn', 'Goods Receipt (GRN)', 'material/grn.html', 'package-check', ['add', 'view', 'print', 'verify']),
        O('material.match', 'Vendor Invoice Matching', 'material/invoice-match.html', 'scale', ['add', 'view', 'approve']),
        O('material.returns', 'Purchase Returns', 'material/returns.html', 'package-x', ['add', 'view', 'approve', 'print']) ] },
      { id: 'material.stock', name: 'Stores', opts: [
        O('material.stock.req', 'Material Requests', 'material/requests.html', 'hand-helping', ['add', 'edit', 'view', 'cancel', 'approve'], { warehouse: true }),
        O('material.stock.issue', 'Transfers and Issues', 'material/transfers.html', 'arrow-left-right', ['add', 'view', 'print', 'verify'], { warehouse: true }),
        O('material.count', 'Stock Count and Adjustment', 'material/stock-count.html', 'clipboard-pen', ['add', 'view', 'approve'], { warehouse: true }),
        O('material.stock.view', 'Stock and Valuation', 'material/stock.html', 'warehouse', ['view', 'print'], { warehouse: true }) ] },
      { id: 'material.setup', name: 'Setup and reports', opts: [
        O('material.masters', 'Material Masters', 'material/masters.html', 'settings-2', MAST),
        O('material.reports', 'Material Reports', 'material/reports.html', 'chart-column', REP) ] } ] },
    { id: 'finance', name: 'Finance and Accounts', icon: 'wallet', tile: 't-mint', home: 'finance/index.html', sow: 'Module 11', desc: 'Billing, ledgers, payables, receivables and closing', subs: [
      { id: 'finance.bill', name: 'Revenue', opts: [
        O('finance.bill.invoice', 'Patient Billing', 'finance/billing.html', 'receipt-text', ['add', 'edit', 'view', 'cancel', 'print', 'approve']),
        O('finance.bill.receipt', 'Cash Receipts and Payments', 'finance/cash.html', 'banknote', ['add', 'view', 'cancel', 'print']),
        O('finance.ar', 'Accounts Receivable', 'finance/receivables.html', 'hand-coins', ['add', 'view', 'approve', 'print']),
        O('finance.schemes', 'Discount and Markup Schemes', 'finance/schemes.html', 'percent', ['add', 'edit', 'view', 'approve']) ] },
      { id: 'finance.gl', name: 'Ledger', opts: [
        O('finance.journal', 'Journal Vouchers', 'finance/journals.html', 'book-open', ['add', 'edit', 'view', 'cancel', 'print', 'approve']),
        O('finance.posting', 'Auto-posting Monitor', 'finance/auto-posting.html', 'workflow', ['view', 'approve']),
        O('finance.ap', 'Accounts Payable', 'finance/payables.html', 'file-text', ['add', 'view', 'approve', 'print']),
        O('finance.close', 'Period Closing', 'finance/period-close.html', 'calendar-check', ['view', 'approve']),
        O('finance.statements', 'Financial Statements', 'finance/statements.html', 'landmark', ['view', 'print']),
        O('finance.costcenter', 'Cost Center Profitability', 'finance/cost-centers.html', 'chart-pie', ['view', 'print']) ] },
      { id: 'finance.setup', name: 'Setup and reports', opts: [
        O('finance.masters', 'Finance Masters', 'finance/masters.html', 'settings-2', MAST),
        O('finance.reports', 'Finance Reports', 'finance/reports.html', 'chart-column', REP) ] } ] },
    { id: 'hr', name: 'HR and Payroll', icon: 'users', tile: 't-sky', home: 'hr/index.html', sow: 'Module 12', desc: 'Employees, rosters, attendance, leave and payroll', subs: [
      { id: 'hr.emp', name: 'People', opts: [
        O('hr.emp.master', 'Employees', 'hr/employees.html', 'contact', ['add', 'edit', 'view', 'print']),
        O('hr.cred', 'Licences and Credentials', 'hr/credentials.html', 'id-card', ['add', 'edit', 'view']),
        O('hr.roster', 'Duty Roster', 'hr/roster.html', 'calendar-range', ['add', 'edit', 'view', 'approve']),
        O('hr.attendance', 'Attendance', 'hr/attendance.html', 'fingerprint', ['add', 'edit', 'view']),
        O('hr.emp.leave', 'Leave and Overtime', 'hr/leave.html', 'plane', ['add', 'view', 'cancel', 'approve']) ] },
      { id: 'hr.pay', name: 'Payroll', opts: [
        O('hr.payroll', 'Monthly Payroll Run', 'hr/payroll.html', 'calculator', ['add', 'view', 'approve', 'print']),
        O('hr.eosb', 'End of Service Benefits', 'hr/eosb.html', 'hourglass', ['add', 'view', 'approve', 'print']),
        O('hr.loans', 'Loans', 'hr/loans.html', 'hand-coins', ['add', 'edit', 'view', 'approve']),
        O('hr.payslips', 'Payslips and Bank File', 'hr/payslips.html', 'file-spreadsheet', ['view', 'print']) ] },
      { id: 'hr.setup', name: 'Setup and reports', opts: [
        O('hr.masters', 'HR Masters', 'hr/masters.html', 'settings-2', MAST),
        O('hr.reports', 'HR Reports', 'hr/reports.html', 'chart-column', REP) ] } ] },
    { id: 'admin', name: 'Administration', icon: 'shield-check', tile: 't-lilac', home: 'admin.html', sow: 'Module 13', desc: 'Organization, roles, users and access', subs: [
      { id: 'admin.org', name: 'Organization', opts: [
        { id: 'admin.org.company', name: 'Company and Branch Master', acts: CRUD.concat(['admin']), page: 'companies.html', icon: 'building-2' },
        { id: 'admin.org.rules', name: 'Entity Rule Screen', acts: ['add', 'edit', 'view', 'approve'], page: 'entity-rules.html', icon: 'sliders-horizontal' } ] },
      { id: 'admin.masters', name: 'Masters', opts: [
        { id: 'admin.masters.dept', name: 'Department Master', acts: CRUD.concat(['admin']), page: 'departments.html', icon: 'layers' },
        { id: 'admin.masters.wh', name: 'Warehouse Master', acts: CRUD.concat(['admin']), page: 'warehouses.html', icon: 'warehouse' } ] },
      { id: 'admin.security', name: 'Security', opts: [
        { id: 'admin.security.roles', name: 'Role Master', acts: CRUD.concat(['approve', 'admin']), page: 'roles.html', icon: 'shield' },
        { id: 'admin.security.users', name: 'User Master', acts: CRUD.concat(['admin']), page: 'users.html', icon: 'users' },
        { id: 'admin.security.mapping', name: 'Access Mapping', acts: ['add', 'edit', 'view', 'cancel', 'approve'], page: 'access-mapping.html', icon: 'key-round' } ] },
      { id: 'admin.reports', name: 'Reports and audit', opts: [
        { id: 'admin.reports.view', name: 'Administration Reports', acts: ['view', 'print'], page: 'reports.html', icon: 'chart-column' },
        { id: 'admin.reports.audit', name: 'Audit Log', acts: ['view'], page: 'audit.html', icon: 'history' } ] } ] },
  ];

  /* Role permissions: optionId -> list of action keys. */
  const allAdmin = {};
  modules.find(m => m.id === 'admin').subs.forEach(s => s.opts.forEach(o => { allAdmin[o.id] = o.acts.slice(); }));
  const pick = (ids, acts) => ids.reduce((m, id) => (m[id] = acts, m), {});
  const roles = [
    { id: 'ro_sys', code: 'SYS_ADMIN', name: 'System Administrator', scope: 'System', companyId: null, status: 'Active', protected: true, privileged: true, owner: 'Tibbi IT Governance', description: 'Setup and privileged configuration. Protected role.', perms: Object.assign({}, allAdmin), updatedBy: 'System Setup', updatedAt: '2026-10-01 08:00', version: 1 },
    { id: 'ro_coadm', code: 'CO_ADMIN', name: 'Company Administrator', scope: 'Company', companyId: 'co_01', status: 'Active', protected: false, privileged: true, owner: 'Fahad Al-Sabah', description: 'Approved company and branch maintenance.', perms: Object.assign(pick(['admin.org.company', 'admin.masters.dept', 'admin.masters.wh'], ['add', 'edit', 'view', 'print']), pick(['admin.org.rules'], ['view']), pick(['admin.reports.view'], ['view', 'print'])), updatedBy: 'Sara Al-Mutairi', updatedAt: '2026-11-04 10:20', version: 3 },
    { id: 'ro_bradm', code: 'BR_ADMIN', name: 'Branch Administrator', scope: 'Company', companyId: 'co_01', status: 'Active', protected: false, privileged: false, owner: 'Fahad Al-Sabah', description: 'Branch masters for assigned branches.', perms: Object.assign(pick(['admin.masters.dept', 'admin.masters.wh'], ['add', 'edit', 'view']), pick(['admin.org.company'], ['view']), pick(['admin.reports.view'], ['view'])), updatedBy: 'Sara Al-Mutairi', updatedAt: '2026-11-04 10:25', version: 2 },
    { id: 'ro_access', code: 'ACCESS_ADMIN', name: 'Access Administrator', scope: 'System', companyId: null, status: 'Active', protected: false, privileged: true, owner: 'Tibbi IT Governance', description: 'User and access administration.', perms: Object.assign(pick(['admin.security.users'], ['add', 'edit', 'view', 'print', 'admin']), pick(['admin.security.mapping'], ['add', 'edit', 'view', 'cancel']), pick(['admin.security.roles'], ['view']), pick(['admin.reports.view'], ['view', 'print'])), updatedBy: 'Sara Al-Mutairi', updatedAt: '2026-11-06 14:00', version: 4 },
    { id: 'ro_audit', code: 'AUDITOR', name: 'Auditor', scope: 'System', companyId: null, status: 'Active', protected: false, privileged: false, owner: 'Internal Audit', description: 'Read-only audit and permitted reports.', perms: Object.assign(pick(['admin.reports.view'], ['view', 'print']), pick(['admin.reports.audit'], ['view']), pick(['admin.security.roles', 'admin.security.users', 'admin.org.company'], ['view'])), updatedBy: 'Sara Al-Mutairi', updatedAt: '2026-11-06 14:05', version: 1 },
    { id: 'ro_doc', code: 'DOCTOR', name: 'Doctor', scope: 'Company', companyId: 'co_01', status: 'Active', protected: false, privileged: false, owner: 'Medical Director', description: 'Clinical consultation and orders.', perms: Object.assign(pick(['emr.consult.note', 'emr.consult.rx'], ['add', 'edit', 'view', 'print']), pick(['emr.consult.orders'], ['add', 'edit', 'view', 'cancel']), pick(['appointments.book.slot'], ['view']), pick(['lab.work.result', 'radiology.exam.report'], ['view']), pick(['nursing.ward.vitals'], ['view'])), updatedBy: 'Sara Al-Mutairi', updatedAt: '2026-11-08 11:00', version: 2 },
    { id: 'ro_nurse', code: 'NURSE', name: 'Staff Nurse', scope: 'Company', companyId: 'co_01', status: 'Active', protected: false, privileged: false, owner: 'Director of Nursing', description: '', perms: Object.assign(pick(['nursing.ward.vitals', 'nursing.ward.handover'], ['add', 'edit', 'view']), pick(['nursing.ward.mar'], ['add', 'view', 'verify']), pick(['emr.consult.note'], ['view']), pick(['material.stock.req'], ['add', 'view'])), updatedBy: 'Sara Al-Mutairi', updatedAt: '2026-11-08 11:10', version: 1 },
    { id: 'ro_store', code: 'STORE_VIEW', name: 'Store Viewer', scope: 'Company', companyId: 'co_01', status: 'Active', protected: false, privileged: false, owner: 'Supply Chain Manager', description: 'View stock in assigned warehouses.', perms: pick(['material.stock.view', 'material.stock.req'], ['view']), updatedBy: 'Sara Al-Mutairi', updatedAt: '2026-11-08 11:20', version: 1 },
    { id: 'ro_storekeeper', code: 'STOREKEEPER', name: 'Storekeeper', scope: 'Company', companyId: 'co_01', status: 'Active', protected: false, privileged: false, owner: 'Supply Chain Manager', description: '', perms: Object.assign(pick(['material.stock.issue'], ['add', 'view', 'print']), pick(['material.stock.req'], ['view', 'approve']), pick(['material.stock.view'], ['view', 'print'])), updatedBy: 'Sara Al-Mutairi', updatedAt: '2026-11-08 11:22', version: 1 },
    { id: 'ro_recep', code: 'RECEPTION', name: 'Receptionist', scope: 'Company', companyId: 'co_01', status: 'Active', protected: false, privileged: false, owner: 'Patient Services Manager', description: '', perms: Object.assign(pick(['reception.reg.patient'], ['add', 'edit', 'view', 'print']), pick(['reception.visit.opd', 'appointments.book.slot'], ['add', 'edit', 'view', 'cancel', 'print']), pick(['finance.bill.receipt'], ['add', 'view', 'print'])), updatedBy: 'Omar Haddad', updatedAt: '2026-11-09 09:00', version: 1 },
    { id: 'ro_pharm', code: 'PHARMACIST', name: 'Pharmacist', scope: 'Company', companyId: 'co_01', status: 'Active', protected: false, privileged: false, owner: 'Head of Pharmacy', description: '', perms: Object.assign(pick(['pharmacy.disp.op'], ['add', 'view', 'cancel', 'print', 'verify']), pick(['pharmacy.disp.ret'], ['add', 'view']), pick(['emr.consult.rx'], ['view'])), updatedBy: 'Sara Al-Mutairi', updatedAt: '2026-11-08 11:30', version: 1 },
    { id: 'ro_old', code: 'LEGACY_CLERK', name: 'Legacy Clerk', scope: 'Company', companyId: 'co_01', status: 'Inactive', protected: false, privileged: false, owner: '', description: 'Replaced by Receptionist.', perms: pick(['reception.reg.patient'], ['view']), updatedBy: 'Sara Al-Mutairi', updatedAt: '2026-10-15 12:00', version: 2, deactivationReason: 'Replaced by RECEPTION role', deactivatedAt: '2026-10-15' },
  ];

  /* Clinical and operational roles get their module screens (prototype defaults). */
  const optsOf = (modId) => modules.find(m => m.id === modId).subs.reduce((l, sb) => l.concat(sb.opts), []);
  const grant = (roleId, modIds, mapActs) => { const r = roles.find(x => x.id === roleId); modIds.forEach(mid => optsOf(mid).forEach(o => { const acts = mapActs ? mapActs(o) : o.acts.filter(a => a !== 'admin'); if (acts && acts.length) r.perms[o.id] = Array.from(new Set((r.perms[o.id] || []).concat(acts))); })); };
  const noSetup = (o) => /\.masters$/.test(o.id) ? ['view'] : o.acts.filter(a => a !== 'admin');
  grant('ro_doc', ['emr'], noSetup);
  grant('ro_doc', ['appointments', 'lab', 'radiology'], (o) => /book\.slot|sched\.roster|work\.result|exam\.report|critical/.test(o.id) ? ['view'] : null);
  grant('ro_nurse', ['nursing'], noSetup);
  grant('ro_nurse', ['emr'], (o) => /summary|orders/.test(o.id) ? ['view'] : null);
  grant('ro_nurse', ['lab'], (o) => /work\.sample/.test(o.id) ? ['add', 'view', 'print'] : null);
  grant('ro_recep', ['reception', 'appointments'], noSetup);
  grant('ro_pharm', ['pharmacy'], noSetup);
  grant('ro_storekeeper', ['material'], noSetup);
  grant('ro_audit', ['incident', 'finance'], (o) => /reports|register|statements/.test(o.id) ? ['view', 'print'] : null);
  roles.push({ id: 'ro_demo', code: 'DEMO_ALL', name: 'Demo: All Modules', scope: 'System', companyId: null, status: 'Active', protected: true, privileged: true, owner: 'Prototype only', description: 'Prototype walkthrough role with every screen of every module. Not a production role.', perms: {}, updatedBy: 'System Setup', updatedAt: '2026-11-25 09:00', version: 1 });
  modules.forEach(m => grant('ro_demo', [m.id], (o) => o.acts.slice()));

  const languages = ['Arabic', 'English', 'Hindi', 'Urdu', 'Tagalog', 'French', 'Malayalam'];
  const services = ['Consultation', 'ECG', 'Echocardiography', 'Stress test', 'Vaccination', 'Well-baby check', 'Joint injection', 'Fracture care', 'Skin biopsy', 'Laser therapy', 'Home visit'];
  const classifications = ['Consultant', 'Specialist', 'Registrar', 'Senior Registrar', 'Resident', 'Staff Nurse', 'Charge Nurse', 'Technologist', 'Administrator', 'Other'];

  const users = [
    { id: 'us_01', login: 'sara.mutairi', displayName: 'Sara Al-Mutairi', type: 'Employee', empId: 'emp_1001', email: 'sara.mutairi@tibbihealth.example', mobile: '+965 9900 1001', authSource: 'Local', status: 'Active', activeFrom: '2026-10-01', activeTo: '', classification: 'Administrator', isDoctor: false, isNurse: false, isTech: false, admitting: false, mobileDisplay: false, blocked: false, blockReason: '', expiry: '', languages: ['Arabic', 'English'], services: [], details: '', education: '', flags: { a: false, b: false, c: '' }, lastLogin: '2026-11-25 08:02', mfa: true, hasPhoto: false, hasSignature: false, updatedBy: 'System Setup', updatedAt: '2026-10-01 08:00', version: 2, firstLogin: false, demoPassword: 'Orbit@2026!' },
    { id: 'us_02', login: 'khalid.rashidi', displayName: 'Dr. Khalid Al-Rashidi', type: 'Employee', empId: 'emp_1002', email: 'k.rashidi@tibbihealth.example', mobile: '+965 9900 1002', authSource: 'Local', status: 'Active', activeFrom: '2026-10-05', activeTo: '', classification: 'Consultant', isDoctor: true, isNurse: false, isTech: false, admitting: true, mobileDisplay: true, blocked: false, blockReason: '', expiry: '', languages: ['Arabic', 'English'], services: ['Consultation', 'ECG', 'Echocardiography', 'Stress test'], details: '', education: '', flags: { a: true, b: false, c: '' }, lastLogin: '2026-11-25 07:41', mfa: false, hasPhoto: true, hasSignature: true, updatedBy: 'Sara Al-Mutairi', updatedAt: '2026-11-14 12:00', version: 5, firstLogin: false, demoPassword: 'Orbit@2026!' },
    { id: 'us_03', login: 'noura.enezi', displayName: 'Dr. Noura Al-Enezi', type: 'Employee', empId: 'emp_1003', email: 'n.enezi@tibbihealth.example', mobile: '+965 9900 1003', authSource: 'Local', status: 'Active', activeFrom: '2026-10-05', activeTo: '', classification: 'Specialist', isDoctor: true, isNurse: false, isTech: false, admitting: true, mobileDisplay: true, blocked: false, blockReason: '', expiry: '', languages: ['Arabic', 'English', 'French'], services: ['Consultation', 'Vaccination', 'Well-baby check'], details: '', education: '', flags: { a: false, b: false, c: '' }, lastLogin: '2026-11-24 16:20', mfa: false, hasPhoto: true, hasSignature: true, updatedBy: 'Sara Al-Mutairi', updatedAt: '2026-11-14 12:10', version: 3, firstLogin: false, demoPassword: 'Orbit@2026!' },
    { id: 'us_04', login: 'maria.santos', displayName: 'Maria Santos', type: 'Employee', empId: 'emp_1004', email: 'm.santos@tibbihealth.example', mobile: '+965 9900 1004', authSource: 'Local', status: 'Active', activeFrom: '2026-10-05', activeTo: '', classification: 'Charge Nurse', isDoctor: false, isNurse: true, isTech: false, admitting: false, mobileDisplay: false, blocked: false, blockReason: '', expiry: '', languages: ['English', 'Tagalog'], services: [], details: '', education: '', flags: { a: false, b: false, c: '' }, lastLogin: '2026-11-25 06:55', mfa: false, hasPhoto: false, hasSignature: false, updatedBy: 'Sara Al-Mutairi', updatedAt: '2026-11-01 09:00', version: 1, firstLogin: false, demoPassword: 'Orbit@2026!' },
    { id: 'us_05', login: 'omar.haddad', displayName: 'Omar Haddad', type: 'Employee', empId: 'emp_1005', email: 'o.haddad@tibbihealth.example', mobile: '+965 9900 1005', authSource: 'Local', status: 'Active', activeFrom: '2026-10-10', activeTo: '', classification: 'Administrator', isDoctor: false, isNurse: false, isTech: false, admitting: false, mobileDisplay: false, blocked: false, blockReason: '', expiry: '', languages: ['Arabic', 'English'], services: [], details: '', education: '', flags: { a: false, b: false, c: '' }, lastLogin: '2026-11-24 13:12', mfa: true, hasPhoto: false, hasSignature: false, updatedBy: 'Sara Al-Mutairi', updatedAt: '2026-10-10 10:00', version: 1, firstLogin: false, demoPassword: 'Orbit@2026!' },
    { id: 'us_06', login: 'ahmed.farouk', displayName: 'Ahmed Farouk', type: 'Employee', empId: 'emp_1006', email: 'a.farouk@tibbihealth.example', mobile: '+965 9900 1006', authSource: 'Local', status: 'Active', activeFrom: '2026-10-05', activeTo: '', classification: 'Other', isDoctor: false, isNurse: false, isTech: false, admitting: false, mobileDisplay: false, blocked: false, blockReason: '', expiry: '', languages: ['Arabic', 'English'], services: [], details: '', education: '', flags: { a: false, b: false, c: '' }, lastLogin: '2026-11-25 08:30', mfa: false, hasPhoto: false, hasSignature: false, updatedBy: 'HR sync', updatedAt: '2026-11-20 02:00', version: 3, firstLogin: false, demoPassword: 'Orbit@2026!' },
    { id: 'us_07', login: 'rajesh.kumar', displayName: 'Rajesh Kumar', type: 'Employee', empId: 'emp_1007', email: 'r.kumar@tibbihealth.example', mobile: '+965 9900 1007', authSource: 'Local', status: 'Locked', activeFrom: '2026-10-05', activeTo: '', classification: 'Other', isDoctor: false, isNurse: false, isTech: false, admitting: false, mobileDisplay: false, blocked: false, blockReason: '', expiry: '', languages: ['English', 'Malayalam', 'Hindi'], services: [], details: '', education: '', flags: { a: false, b: false, c: '' }, lastLogin: '2026-11-22 10:10', mfa: false, hasPhoto: false, hasSignature: false, updatedBy: 'System', updatedAt: '2026-11-25 07:58', version: 2, firstLogin: false, lockedUntil: '2030-01-01 00:00', demoPassword: 'Orbit@2026!' },
    { id: 'us_08', login: 'fatima.kandari', displayName: 'Fatima Al-Kandari', type: 'Employee', empId: 'emp_1008', email: 'f.kandari@tibbihealth.example', mobile: '+965 9900 1008', authSource: 'Local', status: 'Pending activation', activeFrom: '2026-11-24', activeTo: '', classification: 'Other', isDoctor: false, isNurse: false, isTech: false, admitting: false, mobileDisplay: false, blocked: false, blockReason: '', expiry: '', languages: ['Arabic'], services: [], details: '', education: '', flags: { a: false, b: false, c: '' }, lastLogin: '', mfa: false, hasPhoto: false, hasSignature: false, updatedBy: 'Omar Haddad', updatedAt: '2026-11-24 09:30', version: 1, firstLogin: true, demoPassword: 'Temp#4821' },
    { id: 'us_09', login: 'hassan.bukhari', displayName: 'Hassan Bukhari', type: 'Employee', empId: 'emp_1009', email: 'h.bukhari@tibbihealth.example', mobile: '+965 9900 1009', authSource: 'Local', status: 'Inactive', activeFrom: '2026-10-05', activeTo: '', classification: 'Technologist', isDoctor: false, isNurse: false, isTech: true, admitting: false, mobileDisplay: false, blocked: false, blockReason: '', expiry: '', languages: ['Arabic', 'Urdu'], services: [], details: '', education: '', flags: { a: false, b: false, c: '' }, lastLogin: '2026-10-31 15:00', mfa: false, hasPhoto: false, hasSignature: false, updatedBy: 'HR sync', updatedAt: '2026-11-01 00:00', version: 4, firstLogin: false, inactiveReason: 'HR separation (last working day 31 Oct 2026)', demoPassword: 'Orbit@2026!' },
    { id: 'us_10', login: 'yousef.shammari', displayName: 'Dr. Yousef Al-Shammari', type: 'Employee', empId: 'emp_1010', email: 'y.shammari@alnoor.example', mobile: '+965 9900 1010', authSource: 'Local', status: 'Active', activeFrom: '2026-11-01', activeTo: '', classification: 'Registrar', isDoctor: true, isNurse: false, isTech: false, admitting: false, mobileDisplay: true, blocked: false, blockReason: '', expiry: '', languages: ['Arabic', 'English'], services: ['Consultation', 'Fracture care', 'Joint injection'], details: '', education: '', flags: { a: false, b: false, c: '' }, lastLogin: '2026-11-25 09:05', mfa: false, hasPhoto: true, hasSignature: false, updatedBy: 'Mona Al-Ajmi', updatedAt: '2026-11-10 11:00', version: 2, firstLogin: false, demoPassword: 'Orbit@2026!' },
    { id: 'us_11', login: 'layla.hussain', displayName: 'Layla Hussain', type: 'Employee', empId: 'emp_1011', email: 'l.hussain@tibbihealth.example', mobile: '+965 9900 1011', authSource: 'Local', status: 'Active', activeFrom: '2026-10-15', activeTo: '2027-03-31', classification: 'Other', isDoctor: false, isNurse: false, isTech: false, admitting: false, mobileDisplay: false, blocked: false, blockReason: '', expiry: '2027-03-31', languages: ['Arabic', 'English'], services: [], details: '', education: '', flags: { a: false, b: false, c: '' }, lastLogin: '2026-11-21 11:30', mfa: false, hasPhoto: false, hasSignature: false, updatedBy: 'Sara Al-Mutairi', updatedAt: '2026-10-15 10:00', version: 1, firstLogin: false, demoPassword: 'Orbit@2026!' },
    { id: 'us_12', login: 'mona.ajmi', displayName: 'Mona Al-Ajmi', type: 'Employee', empId: 'emp_1012', email: 'm.ajmi@alnoor.example', mobile: '+965 9900 1012', authSource: 'Local', status: 'Active', activeFrom: '2026-11-01', activeTo: '', classification: 'Administrator', isDoctor: false, isNurse: false, isTech: false, admitting: false, mobileDisplay: false, blocked: false, blockReason: '', expiry: '', languages: ['Arabic', 'English'], services: [], details: '', education: '', flags: { a: false, b: false, c: '' }, lastLogin: '2026-11-24 10:00', mfa: true, hasPhoto: false, hasSignature: false, updatedBy: 'Sara Al-Mutairi', updatedAt: '2026-11-01 09:00', version: 1, firstLogin: false, demoPassword: 'Orbit@2026!' },
    { id: 'us_13', login: 'reem.fadhli', displayName: 'Dr. Reem Al-Fadhli', type: 'Employee', empId: 'emp_1013', email: 'r.fadhli@tibbihealth.example', mobile: '+965 9900 1013', authSource: 'Local', status: 'Blocked', activeFrom: '2026-10-05', activeTo: '', classification: 'Consultant', isDoctor: true, isNurse: false, isTech: false, admitting: false, mobileDisplay: true, blocked: true, blockReason: 'Licence renewal pending with MOH', expiry: '', languages: ['Arabic', 'English'], services: ['Consultation', 'Skin biopsy', 'Laser therapy'], details: '', education: '', flags: { a: false, b: false, c: '' }, lastLogin: '2026-11-18 12:45', mfa: false, hasPhoto: true, hasSignature: true, updatedBy: 'Omar Haddad', updatedAt: '2026-11-19 08:00', version: 6, firstLogin: false, demoPassword: 'Orbit@2026!' },
    { id: 'us_14', login: 'dr.james.miller', displayName: 'Dr. James Miller', type: 'Non Employee', empId: null, email: 'j.miller@visiting.example', mobile: '+44 7700 900123', authSource: 'Local', status: 'Active', activeFrom: '2026-11-15', activeTo: '2026-12-15', classification: 'Consultant', isDoctor: true, isNurse: false, isTech: false, admitting: false, mobileDisplay: true, blocked: false, blockReason: '', expiry: '2026-12-15', languages: ['English'], services: ['Consultation', 'Joint injection'], details: 'Visiting consultant orthopaedic surgeon from London for a one-month programme. Sees complex knee and shoulder cases.', education: 'MBBS (Imperial College London); FRCS (Trauma and Orthopaedics)', flags: { a: false, b: false, c: '' }, lastLogin: '2026-11-24 09:40', mfa: false, hasPhoto: true, hasSignature: false, updatedBy: 'Sara Al-Mutairi', updatedAt: '2026-11-15 08:30', version: 1, firstLogin: false, demoPassword: 'Orbit@2026!' },
    { id: 'us_15', login: 'bilal.qureshi', displayName: 'Bilal Qureshi', type: 'Employee', empId: 'emp_1014', email: 'b.qureshi@tibbihealth.example', mobile: '+965 9900 1014', authSource: 'Local', status: 'Active', activeFrom: '2026-11-20', activeTo: '', classification: 'Technologist', isDoctor: false, isNurse: false, isTech: true, admitting: false, mobileDisplay: false, blocked: false, blockReason: '', expiry: '', languages: ['English', 'Urdu'], services: [], details: '', education: '', flags: { a: false, b: false, c: '' }, lastLogin: '2026-11-24 14:00', mfa: false, hasPhoto: false, hasSignature: false, updatedBy: 'Sara Al-Mutairi', updatedAt: '2026-11-20 09:00', version: 1, firstLogin: false, demoPassword: 'Orbit@2026!' },
    { id: 'us_16', login: 'tibbi.support', displayName: 'Tibbi Support', type: 'Non Employee', empId: null, email: 'support@tibbi.example', mobile: '', authSource: 'Local', status: 'Active', activeFrom: '2026-10-01', activeTo: '2027-09-30', classification: 'Other', isDoctor: false, isNurse: false, isTech: false, admitting: false, mobileDisplay: false, blocked: false, blockReason: '', expiry: '2027-09-30', languages: ['English'], services: [], details: 'Vendor support account. Revocable by the hospital super-admin at any time.', education: '', flags: { a: false, b: false, c: '' }, lastLogin: '2026-11-19 22:10', mfa: true, hasPhoto: false, hasSignature: false, updatedBy: 'System Setup', updatedAt: '2026-10-01 08:00', version: 1, firstLogin: false, demoPassword: 'Orbit@2026!' },
  ];

  /* Access assignments (Section 10): one explicit tuple each. */
  users.push({ id: 'us_17', login: 'demo', displayName: 'Hospital Demo', type: 'Employee', empId: null, email: 'demo@tibbihealth.example', mobile: '+965 9900 1017', authSource: 'Local', status: 'Active', activeFrom: '2026-10-01', activeTo: '', classification: 'Administrator', isDoctor: false, isNurse: false, isTech: false, admitting: false, mobileDisplay: false, blocked: false, blockReason: '', expiry: '', languages: ['Arabic', 'English'], services: [], details: 'Prototype walkthrough account with every module.', education: '', flags: { a: false, b: false, c: '' }, lastLogin: '2026-11-25 08:00', mfa: false, hasPhoto: false, hasSignature: false, updatedBy: 'System Setup', updatedAt: '2026-11-25 09:00', version: 1, firstLogin: false, demoPassword: 'Orbit@2026!' });
  const assignments = [
    { id: 'as_01', userId: 'us_01', companyId: 'co_01', branchId: 'br_01', deptId: 'dp_05', clinicId: null, warehouseId: null, roleId: 'ro_sys', from: '2026-10-01', to: '', status: 'Active', grantor: 'System Setup', reason: 'First administrator at go-live', at: '2026-10-01 08:00', isDefault: true },
    { id: 'as_02', userId: 'us_01', companyId: 'co_01', branchId: 'br_02', deptId: 'dp_08', clinicId: null, warehouseId: null, roleId: 'ro_access', from: '2026-10-10', to: '', status: 'Active', grantor: 'System Setup', reason: 'Covers Hawalli onboarding', at: '2026-10-10 10:00', isDefault: false },
    { id: 'as_03', userId: 'us_01', companyId: 'co_02', branchId: 'br_04', deptId: 'dp_09', clinicId: null, warehouseId: null, roleId: 'ro_auditor_placeholder', from: '2026-11-01', to: '2026-12-31', status: 'Active', grantor: 'Mona Al-Ajmi', reason: 'Go-live support at Al Noor', at: '2026-11-01 09:00', isDefault: false },
    { id: 'as_04', userId: 'us_02', companyId: 'co_01', branchId: 'br_01', deptId: 'dp_01', clinicId: 'cl_01', warehouseId: null, roleId: 'ro_doc', from: '2026-10-05', to: '', status: 'Active', grantor: 'Sara Al-Mutairi', reason: 'New joiner', at: '2026-10-05 09:00', isDefault: true },
    { id: 'as_05', userId: 'us_02', companyId: 'co_01', branchId: 'br_01', deptId: 'dp_01', clinicId: 'cl_05', warehouseId: null, roleId: 'ro_doc', from: '2026-10-05', to: '', status: 'Active', grantor: 'Sara Al-Mutairi', reason: 'Covers internal medicine clinic', at: '2026-10-05 09:01', isDefault: false },
    { id: 'as_06', userId: 'us_03', companyId: 'co_01', branchId: 'br_01', deptId: 'dp_02', clinicId: 'cl_02', warehouseId: null, roleId: 'ro_doc', from: '2026-10-05', to: '', status: 'Active', grantor: 'Sara Al-Mutairi', reason: 'New joiner', at: '2026-10-05 09:10', isDefault: true },
    { id: 'as_07', userId: 'us_04', companyId: 'co_01', branchId: 'br_01', deptId: 'dp_03', clinicId: null, warehouseId: 'wh_04', roleId: 'ro_nurse', from: '2026-10-05', to: '', status: 'Active', grantor: 'Sara Al-Mutairi', reason: 'Ward 3 charge nurse', at: '2026-10-05 09:20', isDefault: true },
    { id: 'as_08', userId: 'us_04', companyId: 'co_01', branchId: 'br_01', deptId: 'dp_03', clinicId: null, warehouseId: 'wh_04', roleId: 'ro_store', from: '2026-10-05', to: '', status: 'Active', grantor: 'Sara Al-Mutairi', reason: 'Checks ward stock', at: '2026-10-05 09:21', isDefault: false },
    { id: 'as_09', userId: 'us_05', companyId: 'co_01', branchId: 'br_02', deptId: 'dp_08', clinicId: null, warehouseId: null, roleId: 'ro_bradm', from: '2026-10-10', to: '', status: 'Active', grantor: 'Sara Al-Mutairi', reason: 'Branch admin Hawalli', at: '2026-10-10 10:05', isDefault: true },
    { id: 'as_10', userId: 'us_05', companyId: 'co_01', branchId: 'br_02', deptId: 'dp_08', clinicId: null, warehouseId: null, roleId: 'ro_recep', from: '2026-10-10', to: '', status: 'Active', grantor: 'Sara Al-Mutairi', reason: 'Covers front desk', at: '2026-10-10 10:06', isDefault: false },
    { id: 'as_11', userId: 'us_06', companyId: 'co_01', branchId: 'br_01', deptId: 'dp_04', clinicId: null, warehouseId: 'wh_03', roleId: 'ro_pharm', from: '2026-10-05', to: '2026-11-30', status: 'Active', grantor: 'Sara Al-Mutairi', reason: 'End date set from HR last working day', at: '2026-11-20 02:00', isDefault: true },
    { id: 'as_12', userId: 'us_07', companyId: 'co_01', branchId: 'br_01', deptId: 'dp_05', clinicId: null, warehouseId: 'wh_01', roleId: 'ro_storekeeper', from: '2026-10-05', to: '', status: 'Active', grantor: 'Sara Al-Mutairi', reason: 'Main store keeper', at: '2026-10-05 09:30', isDefault: true },
    { id: 'as_13', userId: 'us_08', companyId: 'co_01', branchId: 'br_02', deptId: 'dp_08', clinicId: null, warehouseId: null, roleId: 'ro_recep', from: '2026-11-24', to: '', status: 'Active', grantor: 'Omar Haddad', reason: 'New joiner', at: '2026-11-24 09:35', isDefault: true },
    { id: 'as_14', userId: 'us_09', companyId: 'co_01', branchId: 'br_01', deptId: 'dp_06', clinicId: null, warehouseId: null, roleId: 'ro_nurse', from: '2026-10-05', to: '2026-10-31', status: 'Inactive', grantor: 'Sara Al-Mutairi', reason: 'HR separation', at: '2026-11-01 00:00', isDefault: true },
    { id: 'as_15', userId: 'us_10', companyId: 'co_02', branchId: 'br_04', deptId: 'dp_09', clinicId: 'cl_03', warehouseId: null, roleId: 'ro_doc', from: '2026-11-01', to: '', status: 'Active', grantor: 'Mona Al-Ajmi', reason: 'New joiner', at: '2026-11-01 09:30', isDefault: true },
    { id: 'as_16', userId: 'us_11', companyId: 'co_01', branchId: 'br_01', deptId: 'dp_05', clinicId: null, warehouseId: null, roleId: 'ro_audit', from: '2026-10-15', to: '2027-03-31', status: 'Active', grantor: 'Sara Al-Mutairi', reason: 'Annual access review', at: '2026-10-15 10:00', isDefault: true },
    { id: 'as_17', userId: 'us_12', companyId: 'co_02', branchId: 'br_04', deptId: 'dp_09', clinicId: null, warehouseId: null, roleId: 'ro_access', from: '2026-11-01', to: '', status: 'Active', grantor: 'Sara Al-Mutairi', reason: 'Company admin for Al Noor', at: '2026-11-01 09:00', isDefault: true },
    { id: 'as_18', userId: 'us_13', companyId: 'co_01', branchId: 'br_02', deptId: 'dp_07', clinicId: 'cl_04', warehouseId: null, roleId: 'ro_doc', from: '2026-10-05', to: '', status: 'Active', grantor: 'Omar Haddad', reason: 'New joiner', at: '2026-10-05 10:00', isDefault: true },
    { id: 'as_19', userId: 'us_14', companyId: 'co_01', branchId: 'br_01', deptId: 'dp_01', clinicId: 'cl_01', warehouseId: null, roleId: 'ro_doc', from: '2026-11-15', to: '2026-12-15', status: 'Active', grantor: 'Sara Al-Mutairi', reason: 'Visiting consultant programme', at: '2026-11-15 08:35', isDefault: true },
    { id: 'as_20', userId: 'us_15', companyId: 'co_01', branchId: 'br_01', deptId: 'dp_10', clinicId: null, warehouseId: null, roleId: 'ro_doc', from: '2026-12-01', to: '', status: 'Active', grantor: 'Sara Al-Mutairi', reason: 'Starts next month (future assignment)', at: '2026-11-20 09:05', isDefault: true },
    { id: 'as_21', userId: 'us_16', companyId: 'co_01', branchId: 'br_01', deptId: 'dp_05', clinicId: null, warehouseId: null, roleId: 'ro_audit', from: '2026-10-01', to: '2027-09-30', status: 'Active', grantor: 'System Setup', reason: 'Vendor support (read only)', at: '2026-10-01 08:00', isDefault: true },
    { id: 'as_22', userId: 'us_17', companyId: 'co_01', branchId: 'br_01', deptId: 'dp_05', clinicId: null, warehouseId: 'wh_01', roleId: 'ro_demo', from: '2026-10-01', to: '', status: 'Active', grantor: 'System Setup', reason: 'Prototype walkthrough of all modules', at: '2026-11-25 09:00', isDefault: true },
  ];
  assignments.find(a => a.id === 'as_03').roleId = 'ro_audit';

  /* Associated users (MAP-15). */
  const associations = [
    { userId: 'us_04', with: ['us_02', 'us_14'], defaultId: 'us_02' },
    { userId: 'us_08', with: ['us_13', 'us_02'], defaultId: 'us_13' },
  ];

  /* Entity rule catalog (Section 6). */
  const rules = [
    { key: 'branch_language', name: 'Branch language', desc: 'Default interface and print language for the branch.', owner: 'Operations', type: 'enum', options: ['English', 'Arabic'], unit: '', sysDefault: 'English', allow: ['company', 'branch'], security: false, appliesAt: 'next login' },
    { key: 'branch_timezone', name: 'Branch timezone', desc: 'Timezone used for dates, validity and reports.', owner: 'Operations', type: 'enum', options: ['Asia/Kuwait', 'Asia/Riyadh', 'Asia/Dubai'], unit: '', sysDefault: 'Asia/Kuwait', allow: ['company', 'branch'], security: false, appliesAt: 'next request' },
    { key: 'idle_timeout', name: 'Idle-session timeout', desc: 'Minutes of inactivity before the session ends. A warning shows one minute before.', owner: 'Information Security', type: 'number', min: 5, max: 15, unit: 'minutes', sysDefault: 15, allow: ['company', 'branch'], security: true, appliesAt: 'next request' },
    { key: 'lockout_threshold', name: 'Failed-login threshold', desc: 'Consecutive failed sign-ins before a temporary lock.', owner: 'Information Security', type: 'number', min: 3, max: 5, unit: 'attempts', sysDefault: 5, allow: ['company', 'branch'], security: true, appliesAt: 'next request' },
    { key: 'lockout_duration', name: 'Lockout duration', desc: 'Minutes an account stays locked after the threshold.', owner: 'Information Security', type: 'number', min: 15, max: 60, unit: 'minutes', sysDefault: 15, allow: ['company'], security: true, appliesAt: 'next request' },
    { key: 'reset_token_ttl', name: 'Password reset token lifetime', desc: 'Minutes a reset link stays valid. Single use.', owner: 'Information Security', type: 'number', min: 5, max: 15, unit: 'minutes', sysDefault: 15, allow: [], security: true, appliesAt: 'next request' },
    { key: 'mfa_privileged', name: 'Privileged-user MFA required', desc: 'Users with privileged roles must complete MFA.', owner: 'Information Security', type: 'boolean', unit: '', sysDefault: true, allow: [], security: true, appliesAt: 'next login', minimum: true },
    { key: 'concurrent_sessions', name: 'Concurrent-session policy', desc: 'Maximum active sessions per user.', owner: 'Information Security', type: 'number', min: 1, max: 3, unit: 'sessions', sysDefault: 2, allow: ['company'], security: true, appliesAt: 'next login' },
    { key: 'admin_approval', name: 'Administrative change approval', desc: 'Privileged role grants and security rule changes need an independent approver.', owner: 'IT Governance', type: 'boolean', unit: '', sysDefault: false, allow: ['company'], security: true, appliesAt: 'next request' },
  ];
  const ruleVersions = [
    { id: 'rv_01', key: 'idle_timeout', scope: 'branch', scopeId: 'br_01', value: 10, from: '2026-11-01', to: '', status: 'Active', version: 2, reason: 'Shared ward terminals', by: 'Sara Al-Mutairi', approver: '', at: '2026-10-28 11:00' },
    { id: 'rv_00', key: 'idle_timeout', scope: 'branch', scopeId: 'br_01', value: 12, from: '2026-10-01', to: '2026-10-31', status: 'Superseded', version: 1, reason: 'Initial branch setting', by: 'System Setup', approver: '', at: '2026-10-01 08:00' },
    { id: 'rv_02', key: 'lockout_threshold', scope: 'branch', scopeId: 'br_04', value: 3, from: '2026-11-10', to: '', status: 'Active', version: 1, reason: 'Hospital security policy', by: 'Mona Al-Ajmi', approver: '', at: '2026-11-10 11:00' },
    { id: 'rv_03', key: 'branch_language', scope: 'company', scopeId: 'co_02', value: 'Arabic', from: '2026-11-01', to: '', status: 'Active', version: 1, reason: 'Arabic-first company', by: 'Mona Al-Ajmi', approver: '', at: '2026-11-01 09:00' },
    { id: 'rv_04', key: 'concurrent_sessions', scope: 'company', scopeId: 'co_01', value: 1, from: '2026-12-01', to: '', status: 'Scheduled', version: 1, reason: 'Single session for all staff from December', by: 'Sara Al-Mutairi', approver: 'Fahad Al-Sabah', at: '2026-11-22 15:00' },
    { id: 'rv_05', key: 'idle_timeout', scope: 'company', scopeId: 'co_01', value: 15, from: '2026-10-01', to: '', status: 'Active', version: 1, reason: 'Company standard', by: 'System Setup', approver: '', at: '2026-10-01 08:00' },
    { id: 'rv_06', key: 'admin_approval', scope: 'company', scopeId: 'co_01', value: true, from: '2026-11-15', to: '', status: 'Active', version: 1, reason: 'Board decision', by: 'Sara Al-Mutairi', approver: 'Fahad Al-Sabah', at: '2026-11-14 16:00' },
  ];

  /* Audit events (AUD-01, AUD-02). */
  const audit = [
    { id: 'ev_1048', at: '2026-11-25 08:02:11', actor: 'Sara Al-Mutairi', action: 'Login success', entity: 'Session', recordId: 'us_01', record: 'sara.mutairi', scope: 'TBH / SAL', outcome: 'Success', reason: '', source: 'Web 10.20.4.18', changes: [] },
    { id: 'ev_1047', at: '2026-11-25 07:58:40', actor: 'System', action: 'Account locked', entity: 'User', recordId: 'us_07', record: 'rajesh.kumar', scope: 'TBH / SAL', outcome: 'Success', reason: '5 consecutive failures', source: 'Auth', changes: [['Status', 'Active', 'Locked']] },
    { id: 'ev_1046', at: '2026-11-25 07:58:39', actor: 'rajesh.kumar', action: 'Login failure', entity: 'Session', recordId: 'us_07', record: 'rajesh.kumar', scope: '', outcome: 'Failure', reason: 'Invalid credentials', source: 'Web 10.20.7.51', changes: [] },
    { id: 'ev_1045', at: '2026-11-24 09:35:02', actor: 'Omar Haddad', action: 'Assignment granted', entity: 'Access mapping', recordId: 'as_13', record: 'fatima.kandari / HAW / Front Office / RECEPTION', scope: 'TBH / HAW', outcome: 'Success', reason: 'New joiner', source: 'Web 10.20.9.3', changes: [['Role', '', 'Receptionist'], ['Effective from', '', '2026-11-24']] },
    { id: 'ev_1044', at: '2026-11-24 09:30:10', actor: 'Omar Haddad', action: 'User created', entity: 'User', recordId: 'us_08', record: 'fatima.kandari', scope: 'TBH / HAW', outcome: 'Success', reason: '', source: 'Web 10.20.9.3', changes: [['Login', '', 'fatima.kandari'], ['User type', '', 'Employee'], ['Status', '', 'Pending activation']] },
    { id: 'ev_1043', at: '2026-11-22 15:00:44', actor: 'Sara Al-Mutairi', action: 'Rule version scheduled', entity: 'Entity rule', recordId: 'rv_04', record: 'concurrent_sessions (TBH)', scope: 'TBH', outcome: 'Success', reason: 'Single session for all staff from December', source: 'Web 10.20.4.18', changes: [['Value', '2', '1'], ['Effective from', '', '2026-12-01'], ['Status', '', 'Scheduled']] },
    { id: 'ev_1042', at: '2026-11-21 17:05:12', actor: 'Omar Haddad', action: 'Department edited', entity: 'Department', recordId: 'dp_07', record: 'OPD - Outpatient Clinics', scope: 'TBH / HAW', outcome: 'Success', reason: '', source: 'Web 10.20.9.3', changes: [['Clinic links', 'Dermatology, ENT', 'Dermatology, ENT, Internal Medicine'], ['Flag C', '', 'Phase 1 pilot']] },
    { id: 'ev_1041', at: '2026-11-20 10:42:00', actor: 'Sara Al-Mutairi', action: 'Company edited', entity: 'Company', recordId: 'co_01', record: 'TBH - Tibbi Health Holding', scope: 'TBH', outcome: 'Success', reason: '', source: 'Web 10.20.4.18', changes: [['Social links', 'Instagram', 'Instagram, X'], ['Website', 'http://tibbihealth.example', 'https://tibbihealth.example']] },
    { id: 'ev_1040', at: '2026-11-20 02:00:05', actor: 'HR sync', action: 'HR separation received', entity: 'User', recordId: 'us_06', record: 'ahmed.farouk', scope: 'TBH / SAL', outcome: 'Success', reason: 'Last working date 2026-11-30', source: 'HR interface', changes: [['Pending separation', '', '2026-11-30'], ['Assignment end', '', '2026-11-30']] },
    { id: 'ev_1039', at: '2026-11-19 15:22:31', actor: 'Sara Al-Mutairi', action: 'Department accounts changed', entity: 'Department', recordId: 'dp_01', record: 'CARD - Cardiology', scope: 'TBH / SAL', outcome: 'Success', reason: 'New revenue split', source: 'Web 10.20.4.18', changes: [['OPD Revenue Account', '4110 OPD Procedure Revenue', '4100 OPD Consultation Revenue']] },
    { id: 'ev_1038', at: '2026-11-19 08:00:00', actor: 'Omar Haddad', action: 'User blocked', entity: 'User', recordId: 'us_13', record: 'reem.fadhli', scope: 'TBH / HAW', outcome: 'Success', reason: 'Licence renewal pending with MOH', source: 'Web 10.20.9.3', changes: [['Blocked', 'No', 'Yes'], ['Sessions', '1 active', 'Revoked']] },
    { id: 'ev_1037', at: '2026-11-18 12:01:00', actor: 'Sara Al-Mutairi', action: 'Branch edited', entity: 'Branch', recordId: 'br_01', record: 'SAL - Tibbi Salmiya Hospital', scope: 'TBH / SAL', outcome: 'Success', reason: '', source: 'Web 10.20.4.18', changes: [['Phone', '+965 2222 1000', '+965 2222 1100']] },
    { id: 'ev_1036', at: '2026-11-15 08:35:20', actor: 'Sara Al-Mutairi', action: 'Assignment granted', entity: 'Access mapping', recordId: 'as_19', record: 'dr.james.miller / SAL / Cardiology / DOCTOR', scope: 'TBH / SAL', outcome: 'Success', reason: 'Visiting consultant programme', source: 'Web 10.20.4.18', changes: [['Effective to', '', '2026-12-15']] },
    { id: 'ev_1035', at: '2026-11-15 08:30:02', actor: 'Sara Al-Mutairi', action: 'User created', entity: 'User', recordId: 'us_14', record: 'dr.james.miller', scope: 'TBH / SAL', outcome: 'Success', reason: '', source: 'Web 10.20.4.18', changes: [['User type', '', 'Non Employee'], ['Account expiry', '', '2026-12-15']] },
    { id: 'ev_1034', at: '2026-11-14 12:00:00', actor: 'Sara Al-Mutairi', action: 'Profile changed', entity: 'User', recordId: 'us_02', record: 'khalid.rashidi', scope: 'TBH / SAL', outcome: 'Success', reason: '', source: 'Web 10.20.4.18', changes: [['Signature image', 'v1 (sig_02_v1.png)', 'v2 (sig_02_v2.png)'], ['Services', 'Consultation, ECG', 'Consultation, ECG, Echocardiography, Stress test']] },
    { id: 'ev_1033', at: '2026-11-12 10:10:10', actor: 'omar.haddad', action: 'Privileged action denied', entity: 'Role', recordId: 'ro_sys', record: 'SYS_ADMIN', scope: 'TBH / HAW', outcome: 'Denied', reason: 'Grant authority exceeded', source: 'Web 10.20.9.3', changes: [] },
    { id: 'ev_1032', at: '2026-11-10 11:00:00', actor: 'Mona Al-Ajmi', action: 'Rule override created', entity: 'Entity rule', recordId: 'rv_02', record: 'lockout_threshold (FRW)', scope: 'ANM / FRW', outcome: 'Success', reason: 'Hospital security policy', source: 'Web 10.30.1.12', changes: [['Value', '5 (system)', '3']] },
    { id: 'ev_1031', at: '2026-11-08 11:00:00', actor: 'Sara Al-Mutairi', action: 'Role permissions changed', entity: 'Role', recordId: 'ro_doc', record: 'DOCTOR', scope: 'TBH', outcome: 'Success', reason: 'Doctors may cancel their own orders', source: 'Web 10.20.4.18', changes: [['Orders', 'Add, Edit, View', 'Add, Edit, View, Cancel']] },
    { id: 'ev_1030', at: '2026-11-06 14:00:00', actor: 'Sara Al-Mutairi', action: 'Password reset initiated', entity: 'User', recordId: 'us_04', record: 'maria.santos', scope: 'TBH / SAL', outcome: 'Success', reason: 'User forgot password (helpdesk ticket 4471)', source: 'Web 10.20.4.18', changes: [['Delivery', '', 'Email sent']] },
    { id: 'ev_1029', at: '2026-11-01 00:00:02', actor: 'System', action: 'Account deactivated', entity: 'User', recordId: 'us_09', record: 'hassan.bukhari', scope: 'TBH / SAL', outcome: 'Success', reason: 'HR separation cutoff', source: 'Scheduler', changes: [['Status', 'Active', 'Inactive'], ['Sessions', '0', 'Revoked']] },
    { id: 'ev_1028', at: '2026-10-31 18:00:00', actor: 'Sara Al-Mutairi', action: 'Warehouse deactivated', entity: 'Warehouse', recordId: 'wh_07', record: 'LABST - Lab Reagent Store', scope: 'TBH / SAL', outcome: 'Success', reason: 'Merged into Main Store', source: 'Web 10.20.4.18', changes: [['Status', 'Active', 'Inactive']] },
    { id: 'ev_1027', at: '2026-10-15 12:00:00', actor: 'Sara Al-Mutairi', action: 'Role deactivated', entity: 'Role', recordId: 'ro_old', record: 'LEGACY_CLERK', scope: 'TBH', outcome: 'Success', reason: 'Replaced by RECEPTION role', source: 'Web 10.20.4.18', changes: [['Status', 'Active', 'Inactive']] },
    { id: 'ev_1026', at: '2026-10-01 08:00:00', actor: 'System Setup', action: 'First administrator provisioned', entity: 'User', recordId: 'us_01', record: 'sara.mutairi', scope: 'System', outcome: 'Success', reason: 'Controlled setup (SCP-04)', source: 'Setup', changes: [['Role', '', 'SYS_ADMIN']] },
  ];

  const loginEvents = [
    { at: '2026-11-25 09:05', user: 'yousef.shammari', outcome: 'Success', company: 'ANM', branch: 'FRW', session: 'S-88213', source: 'Web, Chrome 131' },
    { at: '2026-11-25 08:30', user: 'ahmed.farouk', outcome: 'Success', company: 'TBH', branch: 'SAL', session: 'S-88212', source: 'Web, Edge 131' },
    { at: '2026-11-25 08:02', user: 'sara.mutairi', outcome: 'Success', company: 'TBH', branch: 'SAL', session: 'S-88211', source: 'Web, Chrome 131' },
    { at: '2026-11-25 07:58', user: 'rajesh.kumar', outcome: 'Locked', company: '', branch: '', session: '', source: 'Web, Chrome 129' },
    { at: '2026-11-25 07:57', user: 'rajesh.kumar', outcome: 'Failure', company: '', branch: '', session: '', source: 'Web, Chrome 129' },
    { at: '2026-11-25 07:56', user: 'rajesh.kumar', outcome: 'Failure', company: '', branch: '', session: '', source: 'Web, Chrome 129' },
    { at: '2026-11-25 07:41', user: 'khalid.rashidi', outcome: 'Success', company: 'TBH', branch: 'SAL', session: 'S-88210', source: 'Tablet, Safari 18' },
    { at: '2026-11-25 06:55', user: 'maria.santos', outcome: 'Success', company: 'TBH', branch: 'SAL', session: 'S-88209', source: 'Web, Chrome 131' },
    { at: '2026-11-24 18:12', user: 'maria.santos', outcome: 'Logout', company: 'TBH', branch: 'SAL', session: 'S-88190', source: 'Web, Chrome 131' },
    { at: '2026-11-24 16:20', user: 'noura.enezi', outcome: 'Success', company: 'TBH', branch: 'SAL', session: 'S-88188', source: 'Web, Chrome 131' },
    { at: '2026-11-24 14:00', user: 'bilal.qureshi', outcome: 'No access', company: '', branch: '', session: '', source: 'Web, Chrome 131' },
    { at: '2026-11-24 13:12', user: 'omar.haddad', outcome: 'Success', company: 'TBH', branch: 'HAW', session: 'S-88180', source: 'Web, Firefox 132' },
    { at: '2026-11-23 10:05', user: 'reem.fadhli', outcome: 'Failure', company: '', branch: '', session: '', source: 'Web, Chrome 131' },
    { at: '2026-11-21 11:30', user: 'layla.hussain', outcome: 'Success', company: 'TBH', branch: 'SAL', session: 'S-88101', source: 'Web, Chrome 131' },
  ];

  const resetTrail = [
    { at: '2026-11-06 14:00', admin: 'Sara Al-Mutairi', target: 'maria.santos', reason: 'User forgot password (ticket 4471)', delivery: 'Email sent', status: 'Completed 14:09' },
    { at: '2026-11-03 09:20', admin: 'Omar Haddad', target: 'fatima.kandari', reason: 'Activation link not received', delivery: 'SMS sent', status: 'Expired (not used in 15 min)' },
    { at: '2026-10-28 16:45', admin: 'Sara Al-Mutairi', target: 'rajesh.kumar', reason: 'Compromise suspected', delivery: 'Email sent', status: 'Completed 16:52, sessions revoked' },
  ];

  const reports = [
    { id: 'RPT-01', name: 'Organization directory', icon: 'building-2', filters: 'Company, branch, status', purpose: 'Company and branch codes, timezone, status, department and warehouse counts; setup completeness.' },
    { id: 'RPT-02', name: 'Department and warehouse directory', icon: 'layers', filters: 'Company, branch, type, status', purpose: 'Codes, names, owners, type and status; operational master inventory.' },
    { id: 'RPT-03', name: 'User access register', icon: 'key-round', filters: 'User, company, branch, department, warehouse, role, status, as-of time', purpose: 'Login, full access tuple, role, validity, grantor and effective status; access certification.' },
    { id: 'RPT-04', name: 'Role permission matrix', icon: 'list-tree', filters: 'Role, module, screen, action, status, as-of time', purpose: 'Role, screen, granted actions, scope restrictions and assigned-user count.' },
    { id: 'RPT-05', name: 'Privileged access review', icon: 'shield', filters: 'Company, branch, permission category, as-of time', purpose: 'User, privileged permission, source role and assignment, validity and last review.' },
    { id: 'RPT-06', name: 'Login activity', icon: 'fingerprint', filters: 'Date range, user, outcome, company or branch', purpose: 'Event time, login outcome, lockout and session reference; account investigation.' },
    { id: 'RPT-07', name: 'Administrative change history', icon: 'history', filters: 'Date range, actor, entity, action, scope', purpose: 'Event ID, before and after values, actor, reason, timestamp and outcome.' },
    { id: 'RPT-08', name: 'Expiring and inactive access', icon: 'clock', filters: 'Expiry horizon, company, branch, account status', purpose: 'User, tuple, role, end date, days remaining and blocking condition.' },
    { id: 'RPT-12', name: 'Employee user lifecycle', icon: 'user-check', filters: 'User type, entity, HR status, expiry horizon', purpose: 'Employee link, account period, block status, HR last working date, cutoff, sync status.' },
    { id: 'RPT-13', name: 'Professional user directory', icon: 'stethoscope', filters: 'Entity, department, clinic, classification, professional flags', purpose: 'Profile flags, admitting and mobile-display flags, languages, services, education.' },
    { id: 'RPT-14', name: 'Department account mapping', icon: 'wallet', filters: 'Entity, department, type, OPD or IPD', purpose: 'Four revenue and expense accounts, HOD and clinic links, missing or invalid mappings.' },
    { id: 'RPT-15', name: 'Default access review', icon: 'user-cog', filters: 'User, entity, department, warehouse, clinic', purpose: 'Default context, multiple roles, associated users and their default; invalid defaults.' },
    { id: 'RPT-16', name: 'Password reset trail', icon: 'lock', filters: 'Date range, administrator, target user, outcome', purpose: 'Request time, reason, administrator, target user and outcome; never credentials or tokens.' },
  ];

  window.SEED = { TODAY, companies, branches, clinics, employees, accounts, departments, warehouses, modules, ACTIONS: A, ACTION_KEYS: ALL, roles, languages, profileServices: services, classifications, users, assignments, associations, rules, ruleVersions, audit, loginEvents, resetTrail, reports, support: { phone: '+965 2222 1999', email: 'it.helpdesk@tibbihealth.example', hours: 'Sunday to Thursday, 7:00 to 19:00. Out of hours: extension 1999.' } };
})();
