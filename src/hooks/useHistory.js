import { useState } from 'react';
import { collection, query, where, getDocs, onSnapshot, orderBy } from '../utils/firebase';
import { safeData } from '../utils/helpers';

export function useHistory() {
  const [historyList, setHistoryList] = useState([]);
  const [historyDetail, setHistoryDetail] = useState(null);
  const [historyDate, setHistoryDate] = useState('');
  const [historyBranch, setHistoryBranch] = useState('');
  const [historyYear, setHistoryYear] = useState('');
  const [historyLoading, setHistoryLoading] = useState(false);

  // Fetch history list (all attendance dates)
  const fetchHistoryList = async (db_ref) => {
    try {
      setHistoryLoading(true);

      // Get unique attendance_daily documents
      const docRef = collection(db_ref, 'attendance_daily');
      const q = query(docRef, orderBy('sessionEnded', 'desc'));

      return new Promise((resolve) => {
        const unsubscribe = onSnapshot(q, (snapshot) => {
          const list = [];
          snapshot.docs.forEach(doc => {
            const data = safeData(doc.data());
            list.push({
              dateId: doc.id,
              totalMarked: data.totalMarked || 0,
              sessionEnded: data.sessionEnded || '',
              docId: doc.id
            });
          });
          setHistoryList(list);
          setHistoryLoading(false);
          resolve(unsubscribe);
        });
      });
    } catch (error) {
      console.error('Error fetching history list:', error);
      setHistoryLoading(false);
      throw error;
    }
  };

  // Fetch history detail for specific date
  const fetchHistoryByDate = async (db_ref, dateId, branch = '', year = '') => {
    try {
      setHistoryLoading(true);

      const q = query(collection(db_ref, 'attendance_daily', dateId, 'rows'));
      const snapshot = await getDocs(q);

      let rows = snapshot.docs.map(doc => ({
        ...safeData(doc.data()),
        docId: doc.id
      }));

      // Filter by branch and year if provided
      if (branch) rows = rows.filter(r => r.branch === branch);
      if (year) rows = rows.filter(r => r.year === year);

      const detail = {
        dateId,
        rows,
        branch: branch || '',
        year: year || '',
        totalPresent: rows.length
      };

      setHistoryDetail(detail);
      setHistoryDate(dateId);
      setHistoryBranch(branch);
      setHistoryYear(year);

      return detail;
    } catch (error) {
      console.error('Error fetching history detail:', error);
      throw error;
    } finally {
      setHistoryLoading(false);
    }
  };

  // Get attendance logs for a student
  const fetchStudentLogs = async (db_ref, studentId) => {
    try {
      setHistoryLoading(true);

      const q = query(
        collection(db_ref, 'attendance_logs'),
        where('studentId', '==', studentId),
        orderBy('timestamp', 'desc')
      );

      const snapshot = await getDocs(q);
      const logs = snapshot.docs.map(doc => ({
        ...safeData(doc.data()),
        docId: doc.id
      }));

      return logs;
    } catch (error) {
      console.error('Error fetching student logs:', error);
      throw error;
    } finally {
      setHistoryLoading(false);
    }
  };

  // Get attendance statistics
  const getAttendanceStats = async (db_ref, studentId, branch, year) => {
    try {
      const q = query(
        collection(db_ref, 'attendance_logs'),
        where('studentId', '==', studentId),
        where('branch', '==', branch),
        where('year', '==', year)
      );

      const snapshot = await getDocs(q);
      const totalDays = snapshot.size;

      // Count by date to get unique days
      const uniqueDates = new Set();
      snapshot.docs.forEach(doc => {
        uniqueDates.add(doc.data().dateId);
      });

      return {
        totalPresent: uniqueDates.size,
        totalRecords: totalDays,
        percentage: totalDays > 0 ? Math.round((uniqueDates.size / totalDays) * 100) : 0
      };
    } catch (error) {
      console.error('Error getting attendance stats:', error);
      return { totalPresent: 0, totalRecords: 0, percentage: 0 };
    }
  };

  return {
    historyList,
    setHistoryList,
    historyDetail,
    setHistoryDetail,
    historyDate,
    setHistoryDate,
    historyBranch,
    setHistoryBranch,
    historyYear,
    setHistoryYear,
    historyLoading,
    setHistoryLoading,
    fetchHistoryList,
    fetchHistoryByDate,
    fetchStudentLogs,
    getAttendanceStats
  };
}
