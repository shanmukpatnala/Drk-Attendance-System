import { useState, useRef, useEffect } from 'react';
import { collection, query, where, getDocs, addDoc, doc, updateDoc, onSnapshot, orderBy, serverTimestamp } from '../utils/firebase';
import { db } from '../utils/firebase';
import { getTodayDateId, compressImage } from '../utils/helpers';

export function useAttendance() {
  const [markedToday, setMarkedToday] = useState(new Set());
  const [attendanceList, setAttendanceList] = useState([]);
  const [continuousScanActive, setContinuousScanActive] = useState(false);
  const [attStep, setAttStep] = useState(0);
  const [todayCount, setTodayCount] = useState(0);
  const [currentFace, setCurrentFace] = useState(null);
  const videoRef = useRef(null);

  // Fetch today's marked students
  const getTodayMarkedSet = async (db_ref, dateId = null) => {
    try {
      const date = dateId || getTodayDateId();
      const q = query(collection(db_ref, 'attendance_daily', date, 'rows'));
      const snapshot = await getDocs(q);
      
      const marked = new Set();
      snapshot.docs.forEach(doc => {
        marked.add(doc.data().id);
      });
      
      setMarkedToday(marked);
      setTodayCount(marked.size);
      return marked;
    } catch (error) {
      console.error('Error fetching marked students:', error);
      return new Set();
    }
  };

  // Log attendance for a student
  const logAttendance = async (studentData, db_ref, facePhoto = null) => {
    try {
      const dateId = getTodayDateId();
      const docRef = doc(db_ref, 'attendance_daily', dateId);
      
      const attendanceRecord = {
        id: studentData.id,
        name: studentData.name,
        studentId: studentData.studentId,
        branch: studentData.branch,
        year: studentData.year,
        email: studentData.email,
        phone: studentData.phone,
        timeIn: new Date().toLocaleTimeString('en-IN'),
        timestamp: serverTimestamp(),
        facePhoto: facePhoto || ''
      };

      // Add to attendance_daily
      await addDoc(collection(db_ref, 'attendance_daily', dateId, 'rows'), attendanceRecord);

      // Add to attendance_logs
      await addDoc(collection(db_ref, 'attendance_logs'), {
        ...attendanceRecord,
        dateId: dateId
      });

      // Update student record
      const studentRef = doc(db_ref, 'students', studentData.docId);
      await updateDoc(studentRef, {
        lastAttendance: serverTimestamp(),
        totalAttendance: (studentData.totalAttendance || 0) + 1
      });

      setMarkedToday(prev => new Set(prev).add(studentData.id));
      setTodayCount(prev => prev + 1);

      return true;
    } catch (error) {
      console.error('Error logging attendance:', error);
      throw error;
    }
  };

  // Get attendance list with real-time updates
  const subscribeToAttendanceList = (db_ref, dateId = null) => {
    const date = dateId || getTodayDateId();
    const q = query(
      collection(db_ref, 'attendance_daily', date, 'rows'),
      orderBy('timestamp', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
      const list = [];
      snapshot.docs.forEach(doc => {
        list.push({ ...doc.data(), docId: doc.id });
      });
      setAttendanceList(list);
    });
  };

  // End session
  const handleEndSession = async (db_ref, dateId = null) => {
    try {
      const date = dateId || getTodayDateId();
      const docRef = doc(db_ref, 'attendance_daily', date);
      
      await updateDoc(docRef, {
        sessionEnded: serverTimestamp(),
        totalMarked: markedToday.size
      });

      setContinuousScanActive(false);
      setAttStep(0);
      return true;
    } catch (error) {
      console.error('Error ending session:', error);
      throw error;
    }
  };

  // Capture face photo
  const captureFacePhoto = async () => {
    if (!videoRef.current) return null;
    
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      ctx.drawImage(videoRef.current, 0, 0);
      
      return canvas.toDataURL('image/jpeg', 0.7);
    } catch (error) {
      console.error('Error capturing face photo:', error);
      return null;
    }
  };

  return {
    markedToday,
    setMarkedToday,
    attendanceList,
    setAttendanceList,
    continuousScanActive,
    setContinuousScanActive,
    attStep,
    setAttStep,
    todayCount,
    setTodayCount,
    currentFace,
    setCurrentFace,
    videoRef,
    getTodayMarkedSet,
    logAttendance,
    subscribeToAttendanceList,
    handleEndSession,
    captureFacePhoto
  };
}
