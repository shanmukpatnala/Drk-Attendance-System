import { collection, query, onSnapshot, orderBy } from '../utils/firebase';
import { appId } from '../app/constants';
import { safeData } from '../utils/helpers';

export function initFirestoreListeners({ db, setStudents, setAttendanceLogs }) {
  const studentQuery = query(
    collection(db, 'artifacts', appId, 'public', 'data', 'students')
  );
  const unsubStudents = onSnapshot(studentQuery, (snapshot) => {
    const loadedStudents = snapshot.docs.map(d => ({ id: d.id, ...safeData(d.data()) }));
    setStudents(loadedStudents);
  });

  const logsQuery = query(
    collection(db, 'artifacts', appId, 'public', 'data', 'attendance_logs'),
    orderBy('timestamp', 'desc')
  );
  const unsubLogs = onSnapshot(logsQuery, (snapshot) => {
    const logs = snapshot.docs.map(d => ({ id: d.id, ...safeData(d.data()) }));
    setAttendanceLogs(logs);
  });

  return () => {
    try { unsubStudents(); } catch (e) {}
    try { unsubLogs(); } catch (e) {}
  };
}
