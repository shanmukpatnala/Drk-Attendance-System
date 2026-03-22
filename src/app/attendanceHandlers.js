import { collection, getDocs, doc, getDoc, setDoc, addDoc, serverTimestamp } from '../utils/firebase';
import { appId } from './constants';
import { formatTime, getTodayDateId } from '../utils/helpers';

export const getTodayMarkedSet = async ({ db }) => {
  try {
    const todayId = getTodayDateId();
    const logsCol = collection(db, 'artifacts', appId, 'public', 'data', 'attendance_daily', todayId, 'logs');
    const snap = await getDocs(logsCol);
    const set = new Set();
    snap.forEach(d => set.add(d.id));
    return set;
  } catch (e) {
    console.error('getTodayMarkedSet error', e);
    return new Set();
  }
};

export const logAttendance = async ({ db, student, status, setTodayCount }) => {
  try {
    const dateId = getTodayDateId();
    const studentDocId = (student.studentId || student).toString();

    const dailyRef = doc(db, 'artifacts', appId, 'public', 'data', 'attendance_daily', dateId, 'logs', studentDocId);
    const snap = await getDoc(dailyRef);
    let isNewForToday = false;

    if (!snap.exists()) {
      await setDoc(dailyRef, {
        name: student.name || '',
        studentId: student.studentId || student,
        branch: student.branch || '',
        year: student.year || '',
        status,
        timeIn: formatTime(),
        timestamp: serverTimestamp()
      });
      isNewForToday = true;
    }

    await addDoc(
      collection(db, 'artifacts', appId, 'public', 'data', 'attendance_logs'),
      {
        name: student.name || '',
        studentId: student.studentId || student,
        status,
        subject: '',
        branch: student.branch || '',
        year: student.year || '',
        timestamp: serverTimestamp(),
        date: dateId,
        timeIn: formatTime()
      }
    );

    if (isNewForToday && setTodayCount) {
      setTodayCount(prev => typeof prev === 'number' ? prev + 1 : 1);
    }
  } catch (e) {
    console.error('logAttendance error', e);
  }
};
