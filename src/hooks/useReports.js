import { useState } from 'react';
import { collection, query, where, getDocs, addDoc, doc, serverTimestamp } from '../utils/firebase';
import emailjs from '@emailjs/browser';

export function useReports() {
  const [reportDate, setReportDate] = useState('');
  const [reportBranch, setReportBranch] = useState('');
  const [reportYear, setReportYear] = useState('');
  const [reportData, setReportData] = useState([]);
  const [sendReportResult, setSendReportResult] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);

  // Generate attendance report
  const handleGenerateReport = async (db_ref, date, branch, year) => {
    try {
      setReportLoading(true);
      
      const q = query(
        collection(db_ref, 'attendance_daily', date, 'rows'),
        where('branch', '==', branch),
        where('year', '==', year)
      );

      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => doc.data());
      
      setReportData(data);
      setReportDate(date);
      setReportBranch(branch);
      setReportYear(year);
      
      return data;
    } catch (error) {
      console.error('Error generating report:', error);
      throw error;
    } finally {
      setReportLoading(false);
    }
  };

  // Generate CSV from report data
  const generateCSV = (data) => {
    if (!data.length) return '';

    const headers = ['Name', 'Student ID', 'Email', 'Phone', 'Time In'];
    const rows = data.map(row => [
      row.name,
      row.studentId,
      row.email,
      row.phone,
      row.timeIn
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    return csvContent;
  };

  // Download report as CSV
  const handleDownloadReport = (date, branch, year) => {
    try {
      const csv = generateCSV(reportData);
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `attendance-${date}-${branch}-${year}.csv`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading report:', error);
      throw error;
    }
  };

  // Send report to HODs
  const sendReportToHODs = async (db_ref, date, branch, year, hodsList) => {
    try {
      setReportLoading(true);
      setSendReportResult(null);

      const csv = generateCSV(reportData);
      
      // Save report to Firestore
      const reportDoc = await addDoc(collection(db_ref, 'reports'), {
        date,
        branch,
        year,
        totalPresent: reportData.length,
        csvData: csv,
        sentAt: serverTimestamp(),
        hodCount: hodsList.length
      });

      // Send emails to HODs
      const hodResults = [];
      
      for (const hod of hodsList) {
        try {
          await emailjs.send(
            process.env.REACT_APP_EMAILJS_SERVICE_ID,
            process.env.REACT_APP_EMAILJS_TEMPLATE_ID,
            {
              to_email: hod.email,
              to_name: hod.name,
              subject: `Attendance Report - ${branch} - ${date}`,
              message: `Attached is the attendance report for ${branch} on ${date}. Total present: ${reportData.length}`,
              csv_data: csv
            }
          );

          hodResults.push({
            email: hod.email,
            status: 'sent',
            info: 'Report sent successfully'
          });
        } catch (error) {
          hodResults.push({
            email: hod.email,
            status: 'failed',
            info: error.message || 'Failed to send'
          });
        }
      }

      const result = {
        uploaded: true,
        reportId: reportDoc.id,
        hodResults,
        error: null
      };

      setSendReportResult(result);
      return result;
    } catch (error) {
      console.error('Error sending report:', error);
      setSendReportResult({
        uploaded: false,
        reportId: null,
        hodResults: [],
        error: error.message
      });
      throw error;
    } finally {
      setReportLoading(false);
    }
  };

  return {
    reportDate,
    setReportDate,
    reportBranch,
    setReportBranch,
    reportYear,
    setReportYear,
    reportData,
    setReportData,
    sendReportResult,
    setSendReportResult,
    reportLoading,
    setReportLoading,
    handleGenerateReport,
    handleDownloadReport,
    sendReportToHODs,
    generateCSV
  };
}
