import { collection, getDocs, addDoc, query, where } from '../utils/firebase';
import { appId } from './constants';
import emailjs from '@emailjs/browser';

export const handleGenerateReport = async ({ db, students, reportBranch, reportYear, reportDate, setReportData, setStatusMsg }) => {
  const branchFilter = reportBranch === 'All' ? null : reportBranch;
  const yearFilter = reportYear === 'All' ? null : reportYear;
  const classStudents = students.filter(
    s => (branchFilter ? s.branch === branchFilter : true) && (yearFilter ? s.year === yearFilter : true)
  );
  const dateId = reportDate;
  try {
    const dailyCol = collection(db, 'artifacts', appId, 'public', 'data', 'attendance_daily', dateId, 'logs');
    const snap = await getDocs(dailyCol);
    const dailyMap = new Map();
    snap.forEach(d => {
      const ddata = d.data();
      dailyMap.set(d.id, ddata);
    });

    const report = classStudents.map(st => {
      const todayLog = dailyMap.get(st.studentId);
      const presentLog = todayLog && todayLog.status && todayLog.status.includes('Present') ? todayLog : null;
      const timeIn = presentLog ? (presentLog.timeIn || 'N/A') : 'N/A';
      const status = presentLog ? 'Present' : 'Absent';
      return { ...st, status, timeIn, date: dateId };
    });

    setReportData(report);
    setStatusMsg({ type: 'success', text: `Report generated for ${reportBranch}-${reportYear}` });
  } catch (e) {
    console.error('generate report error', e);
    setStatusMsg({ type: 'error', text: 'Failed to generate report' });
  }
};

export const handleDownloadReport = ({ reportData, reportBranch, reportYear, reportDate }) => {
  if (!reportData) return;
  const header = "Date,Roll No,Name,Branch,Year,Time In,Status\n";
  const csvLines = reportData.map(r =>
    `${r.date},${r.studentId || ''},${(r.name || '').replace(/,/g, ' ')},${r.branch || ''},${r.year || ''},${r.timeIn || 'N/A'},${r.status}`
  ).join("\n");
  const csvContent = "data:text/csv;charset=utf-8," + header + csvLines;
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `Report_${reportBranch}_${reportYear}_${reportDate}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const sendReportToHODs = async ({ db, branch, dateId, reportRows, setLoading, setSendReportResult, setShowSendResultModal, setStatusMsg, EMAILJS_REPORT_TEMPLATE_ID, EMAILJS_PUBLIC_KEY, EMAILJS_SERVICE_ID }) => {
  setLoading(true);
  setSendReportResult(null);
  setShowSendResultModal(false);

  const withTimeout = (p, ms, label = 'operation') => {
    let timer;
    return Promise.race([
      p,
      new Promise((_, rej) => {
        timer = setTimeout(() => rej(new Error(`${label} timed out after ${ms}ms`)), ms);
      })
    ]).finally(() => clearTimeout(timer));
  };

  try {
    if (!branch || !dateId || !reportRows || !reportRows.length) {
      const msg = 'Missing branch/date or no report data.';
      setStatusMsg({ type: 'error', text: msg });
      setLoading(false);
      return { ok: false, error: msg };
    }

    if (!EMAILJS_REPORT_TEMPLATE_ID || EMAILJS_REPORT_TEMPLATE_ID.includes('xxxx')) {
      const msg = 'EMAILJS report template ID not configured.';
      console.error(msg, EMAILJS_REPORT_TEMPLATE_ID);
      setStatusMsg({ type: 'error', text: msg });
      setLoading(false);
      return { ok: false, error: msg };
    }

    const headerArray = ['Date', 'Roll No', 'Name', 'Branch', 'Year', 'Time In', 'Status'];
    const csvRows = reportRows.map(r => [
      r.date || dateId,
      r.studentId || '',
      r.name || '',
      r.branch || '',
      r.year || '',
      r.timeIn || 'N/A',
      r.status || ''
    ]);

    const csvText = headerArray.join(',') + '\n' +
      csvRows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');

    const reportDocRef = await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'reports'), {
      branch,
      date: dateId,
      csv: csvText,
      pdfUrl: '',
      createdAt: new Date()
    });

    // Query HODs
    let hodDocs = [];
    try {
      const qHod = query(collection(db, 'artifacts', appId, 'public', 'data', 'app_users'), where('role', '==', 'hod'));
      const snap = await getDocs(qHod);
      hodDocs = snap.docs;
    } catch (qErr) { console.error('HOD query error (role==hod):', qErr); }

    if (!hodDocs.length) {
      try {
        const qHod2 = query(collection(db, 'artifacts', appId, 'public', 'data', 'app_users'), where('role', '==', 'HOD'));
        const snap2 = await getDocs(qHod2);
        hodDocs = snap2.docs;
      } catch (qErr2) { console.error('HOD fallback query error:', qErr2); }
    }

    const desiredDept = (branch || '').trim().toLowerCase();
    let hodsForBranch = hodDocs.map(d => ({ id: d.id, ...d.data() })).filter(u => {
      const dept = (u.department || '').toString().trim().toLowerCase();
      if (!dept) return false;
      return dept === desiredDept || dept.includes(desiredDept) || desiredDept.includes(dept);
    });

    if (!hodsForBranch.length) hodsForBranch = hodDocs.map(d => ({ id: d.id, ...d.data() }));

    if (!hodsForBranch.length) {
      const msg = `Report processed but no HOD found for ${branch}. Report saved (id: ${reportDocRef.id}).`;
      setStatusMsg({ type: 'warning', text: msg });
      setSendReportResult({ uploaded: false, downloadUrl: '', hodResults: [], error: msg, reportId: reportDocRef.id });
      setShowSendResultModal(true);
      setLoading(false);
      return { ok: false, uploaded: false, downloadUrl: '', error: msg };
    }

    const hodResults = [];
    for (const u of hodsForBranch) {
      if (!u.email) {
        hodResults.push({ email: '(no-email)', status: 'skipped', info: 'HOD record missing email' });
        continue;
      }
      const preview = headerArray.join(',') + '\n' + csvRows.slice(0, 20).map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');

      const messageHtml = `\n          <p>Hello ${u.name || ''},</p>\n          <p>Here is the attendance report preview for <strong>${branch}</strong> on <strong>${dateId}</strong>.</p>\n          <p>Preview (first rows):</p>\n          <pre style="white-space:pre-wrap;font-size:12px;padding:8px;border:1px solid #eee;background:#fafafa;">${(preview || '').replace(/</g, '&lt;')}</pre>\n          <p>The full report is saved in the system. Contact admin to access the full CSV if required.</p>\n          <p>Regards,<br/>DRK Attendance System</p>\n        `;

      const templateParams = {
        to_email: u.email,
        to_name: u.name || u.username || 'HOD',
        branch,
        date: dateId,
        report_preview_csv: preview,
        message_html: messageHtml,
        subject: `Attendance Report - ${branch} ${dateId}`,
        from_name: 'DRK Attendance System'
      };

      try {
        const res = await withTimeout(emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_REPORT_TEMPLATE_ID, templateParams, EMAILJS_PUBLIC_KEY), 20000, 'EmailJS.send');
        hodResults.push({ email: u.email, status: 'sent', info: res && res.status ? `status:${res.status}` : 'ok' });
      } catch (emailErr) {
        console.error('EmailJS send failed for', u.email, emailErr);
        let info = '';
        try { if (emailErr && emailErr.text) info = emailErr.text; else info = typeof emailErr === 'string' ? emailErr : JSON.stringify(emailErr); } catch (e2) { info = String(emailErr); }
        hodResults.push({ email: u.email, status: 'failed', info });
      }
    }

    const sentCount = hodResults.filter(r => r.status === 'sent').length;
    setSendReportResult({ uploaded: false, downloadUrl: '', hodResults, reportId: reportDocRef.id });
    setShowSendResultModal(true);

    if (sentCount > 0) {
      setStatusMsg({ type: 'success', text: `Report preview emailed to ${sentCount} HOD(s).` });
    } else {
      setStatusMsg({ type: 'warning', text: 'Emails to HODs failed. Check results.' });
    }

    setLoading(false);
    return { ok: sentCount > 0, hodResults, reportId: reportDocRef.id };
  } catch (err) {
    console.error('sendReportToHODs unexpected exception', err);
    const errMsg = (err && err.message) ? err.message : String(err);
    setStatusMsg({ type: 'error', text: 'Unexpected error sending report. Check console.' });
    setSendReportResult({ uploaded: false, downloadUrl: '', hodResults: [], error: errMsg });
    setShowSendResultModal(true);
    setLoading(false);
    return { ok: false, error: errMsg };
  }
};