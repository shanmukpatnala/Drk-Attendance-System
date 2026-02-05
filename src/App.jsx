import React, { useState, useEffect, useRef } from 'react';
import { AlertCircle, CheckCircle, RefreshCw, X, Eye, EyeOff, LayoutDashboard, User, PieChart, Users, AlertTriangle, Printer } from 'lucide-react';
import emailjs from '@emailjs/browser';
import { QRCodeCanvas } from 'qrcode.react';

// Firebase & utilities
import { auth, signInAnonymously, onAuthStateChanged, serverTimestamp, collection, addDoc, db, getDocs, updateDoc, doc, getDoc, query, where, onSnapshot, orderBy, setDoc } from './utils/firebase';
import { hashPassword, safeData, getTodayDateId, compressImage } from './utils/helpers';
import { appId, FACE_API_SCRIPT, MODEL_URL, EMAILJS_SERVICE_ID, EMAILJS_REPORT_TEMPLATE_ID, EMAILJS_PUBLIC_KEY, SHOW_EMAIL_BUTTON, appConfig } from './app/constants';
import { performLogin as performLoginHandler, handleSendResetLink as handleSendResetLinkHandler, handleChangePassword as handleChangePasswordHandler, verifyResetToken as verifyResetTokenHandler } from './app/authHandlers';

// Screen components
import { DashboardScreen, RegistrationScreen, AttendanceScreen, ReportsScreen, DatabaseScreen, HistoryScreen, ProfileScreen, ManageUsersScreen } from './screens';

// Modal components
import { SendReportModal, HistoryDetailModal, IDCardModal, OverwriteModal } from './modals';

// UI components
import { Header, BottomNav, Message } from './components';


export default function App() {
  // Auth
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [appUser, setAppUser] = useState(null);

  // Login
  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Forgot Password
  const [forgotPasswordMode, setForgotPasswordMode] = useState(false);
  const [fpStep, setFpStep] = useState(1);
  const [fpUser, setFpUser] = useState('');
  const [fpNewPass, setFpNewPass] = useState('');
  const [resetTokenStatus, setResetTokenStatus] = useState('idle');
  const [resetUserDocId, setResetUserDocId] = useState(null);
  const [resetDocId, setResetDocId] = useState(null);

  // Loading / status
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);

  // Views
  const [view, setView] = useState('home'); // home | attendance | register | reports | database | profile | manage_users | history

  // Students & logs
  const [students, setStudents] = useState([]);
  const [attendanceLogs, setAttendanceLogs] = useState([]);

  // Registration
  const [regStep, setRegStep] = useState('details'); // details | camera
  const [regMode, setRegMode] = useState('live'); // live | upload
  const [regName, setRegName] = useState('');
  const [regId, setRegId] = useState('');
  const [regBranch, setRegBranch] = useState('CSE');
  const [regYear, setRegYear] = useState('1st');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [uploadedImgSrc, setUploadedImgSrc] = useState(null);
  const [overwriteModal, setOverwriteModal] = useState(null);

  // Attendance Session
  const [attStep, setAttStep] = useState('setup'); // setup | camera
  const [continuousScanActive, setContinuousScanActive] = useState(false);

  // Reports
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportBranch, setReportBranch] = useState('CSE');
  const [reportYear, setReportYear] = useState('1st');
  const [reportData, setReportData] = useState(null);

  // Database search & ID card
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [studentHistory, setStudentHistory] = useState([]);
  const [idCardData, setIdCardData] = useState(null);

  // Add Staff
  const [newUserFirstName, setNewUserFirstName] = useState('');
  const [newUserLastName, setNewUserLastName] = useState('');
  const [newUserUser, setNewUserUser] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserDept, setNewUserDept] = useState('CSE');
  const [newUserDesignation, setNewUserDesignation] = useState('Faculty');
  const [newUserPass, setNewUserPass] = useState('');
  const [newUserConfirmPass, setNewUserConfirmPass] = useState('');

  // Camera
  const videoRef = useRef(null);
  const imgRef = useRef(null);
  const [cameraFacing, setCameraFacing] = useState('user'); // 'user' | 'environment'

  // Profile edit
  const [profileEditMode, setProfileEditMode] = useState(false);
  const [profileEmail, setProfileEmail] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileDept, setProfileDept] = useState('');
  const [profilePhotoPreview, setProfilePhotoPreview] = useState(null);

  // Attendance sets
  const [markedToday, setMarkedToday] = useState(new Set());
  const localMarkedRef = useRef(new Set());

  // header DB count for today
  const [todayCount, setTodayCount] = useState(0);

  // Send report result modal state
  const [sendReportResult, setSendReportResult] = useState(null);
  const [showSendResultModal, setShowSendResultModal] = useState(false);

  // history: list of dates + counts
  const [historyList, setHistoryList] = useState([]); // { dateId, count }
  const [historyDetail, setHistoryDetail] = useState([]); // list of student logs for selected date
  const [showHistoryDetailModal, setShowHistoryDetailModal] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyDate, setHistoryDate] = useState(new Date().toISOString().split('T')[0]); // selected date in history view

  // history filters
  const [historyBranch, setHistoryBranch] = useState('');
  const [historyYear, setHistoryYear] = useState('');

  // -------------------------------------------------------------------
  // INIT: Firebase anonymous auth + face-api script
  // -------------------------------------------------------------------
  useEffect(() => {
    const initAuth = async () => {
      try {
        await signInAnonymously(auth);
      } catch (error) {
        console.error("Auth failed:", error);
        setStatusMsg({ type: 'error', text: "Database Connection Error: " + error.message });
      }
    };
    initAuth();

    const unsub = onAuthStateChanged(auth, setFirebaseUser);

    // Load face-api script
    const script = document.createElement('script');
    script.src = FACE_API_SCRIPT;
    script.async = true;
    script.onload = () => loadModels();
    document.body.appendChild(script);

    return () => unsub();
    // eslint-disable-next-line
  }, []);

  const loadModels = async () => {
    try {
      const faceapi = window.faceapi;
      if (!faceapi) throw new Error("Face API not loaded");
      await faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL);
      await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
      await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
      setModelsLoaded(true);
      console.log("Face-api models loaded");
    } catch (err) {
      console.error(err);
      setStatusMsg({ type: 'error', text: "Failed to load AI models" });
    }
  };

  // -------------------------------------------------------------------
  // Firestore listeners for students & attendance logs
  // -------------------------------------------------------------------
  useEffect(() => {
    if (!firebaseUser) return;

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
      unsubStudents();
      unsubLogs();
    };
  }, [firebaseUser]);

  // initialize EmailJS
  useEffect(() => {
    try {
      emailjs.init(EMAILJS_PUBLIC_KEY);
    } catch (e) {
      console.error("EmailJS init error:", e);
    }
  }, []);

  // remember-me auto login
  useEffect(() => {
    const saved = localStorage.getItem('drkAttendanceRemember');
    if (!saved) return;
    try {
      const { username, password, remember } = JSON.parse(saved);
      if (remember && username && password) {
        setLoginUser(username);
        setLoginPass(password);
        performLoginHandler({
          username,
          password,
          rememberFlag: true,
          setStatusMsg,
          setLoading,
          setAppUser,
          setView,
          setLoginUser,
          setLoginPass
        });
      }
    } catch (e) {
      console.error("Remember me parse error", e);
    }
    // eslint-disable-next-line
  }, []);

  // process reset token from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("reset");
    if (token) {
      setForgotPasswordMode(true);
      setFpStep(2);
      verifyResetTokenHandler({ token, setResetTokenStatus, setResetUserDocId, setResetDocId });
    }
    // eslint-disable-next-line
  }, []);

  // -------------------------------------------------------------------
  // Camera handling
  // -------------------------------------------------------------------
  const stopVideo = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  const startVideo = () => {
    stopVideo();
    navigator.mediaDevices.getUserMedia({
      video: { facingMode: cameraFacing, width: { ideal: 1280 }, height: { ideal: 720 } }
    })
      .then(stream => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      })
      .catch(err => {
        console.error("Camera error:", err);
        setStatusMsg({ type: 'error', text: "Cannot access camera: " + err.message });
      });
  };

  const toggleCameraFacing = () => {
    setCameraFacing(prev => prev === 'user' ? 'environment' : 'user');
  };

  useEffect(() => {
    if (!modelsLoaded || !appUser) {
      stopVideo();
      return;
    }

    const shouldStartRegisterCamera = view === 'register' && regStep === 'camera' && regMode === 'live';
    const shouldStartAttendanceCamera = view === 'attendance' && attStep === 'camera';

    if (shouldStartRegisterCamera || shouldStartAttendanceCamera) {
      startVideo();
    } else {
      stopVideo();
    }
    // eslint-disable-next-line
  }, [view, modelsLoaded, attStep, regStep, regMode, appUser, cameraFacing]);

  

  // -------------------------------------------------------------------
  // Authentication: perform login (delegated to handlers)
  // -------------------------------------------------------------------
  const handleLogin = async () => {
    await performLoginHandler({
      username: loginUser,
      password: loginPass,
      rememberFlag: rememberMe,
      setStatusMsg,
      setLoading,
      setAppUser,
      setView,
      setLoginUser,
      setLoginPass
    });
  };

  const handleLogout = () => {
    setAppUser(null);
    setView('home');
    setLoginUser('');
    setLoginPass('');
    localStorage.removeItem('drkAttendanceRemember');
  };

  // -------------------------------------------------------------------
  // Forgot password / reset link
  // -------------------------------------------------------------------
  const handleSendResetLink = async () => {
    await handleSendResetLinkHandler({ fpUser, setStatusMsg, setLoading });
  };

  const handleChangePassword = async () => {
    await handleChangePasswordHandler({
      fpNewPass,
      resetUserDocId,
      resetDocId,
      setStatusMsg,
      setLoading,
      setForgotPasswordMode,
      setFpStep,
      setFpUser,
      setFpNewPass,
      setResetTokenStatus
    });
  };

  // -------------------------------------------------------------------
  // Registration helpers
  // -------------------------------------------------------------------
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setUploadedImgSrc(reader.result);
    reader.readAsDataURL(file);
  };

  const handleProceedToCamera = () => {
    if (!regName || !regId || !regPhone || !regEmail) {
      setStatusMsg({ type: 'error', text: "Please fill all fields" });
      return;
    }
    // simple validation
    if (regId.length < 6 || !/^\d{10}$/.test(regPhone)) {
      setStatusMsg({
        type: 'error',
        text: "Invalid ID or Phone (phone must be 10 digits)"
      });
      return;
    }
    setStatusMsg(null);
    setRegStep('camera');
  };

  const performRegistration = async (data, docId = null) => {
    setLoading(true);
    try {
      if (docId) {
        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'students', docId), data);
        setStatusMsg({ type: 'success', text: `Updated profile for ${data.name}` });
      } else {
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'students'), data);
        setStatusMsg({ type: 'success', text: `Student ${data.name} registered successfully` });
      }
      // reset form
      setRegName('');
      setRegId('');
      setRegPhone('');
      setRegEmail('');
      setUploadedImgSrc(null);
      setRegStep('details');
      setOverwriteModal(null);
    } catch (err) {
      console.error(err);
      setStatusMsg({ type: 'error', text: "Database error" });
    }
    setLoading(false);
  };

  // check and register: uses face-api only when regMode==='live' and regStep==='camera'
  const handleCheckAndRegister = async (dataDocId = null) => {
    if (!firebaseUser) return;

    const faceapi = window.faceapi;
    let inputSource;

    if (regMode === 'live') {
      if (!videoRef.current || videoRef.current.readyState < 2) {
        setStatusMsg({ type: 'warning', text: "Camera warming up..." });
        return;
      }
      inputSource = videoRef.current;
    } else {
      if (!uploadedImgSrc || !imgRef.current) {
        setStatusMsg({ type: 'error', text: "Please upload a photo" });
        return;
      }
      inputSource = imgRef.current;
    }

    setLoading(true);

    try {
      const detections = await faceapi
        .detectSingleFace(
          inputSource,
          new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 })
        )
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detections) {
        setStatusMsg({ type: 'error', text: "No face detected. Try again." });
        setLoading(false);
        return;
      }

      // prevent duplicate face registrations
      const labeledDescriptors = students
        .filter(s =>
          Array.isArray(s.descriptor) &&
          s.studentId &&
          s.studentId.toLowerCase() !== regId.toLowerCase()
        )
        .map(
          s =>
            new faceapi.LabeledFaceDescriptors(
              s.studentId,
              [new Float32Array(s.descriptor)]
            )
        );

      if (labeledDescriptors.length > 0) {
        const matcher = new faceapi.FaceMatcher(labeledDescriptors, 0.45);
        const best = matcher.findBestMatch(detections.descriptor);
        if (best.label !== 'unknown') {
          const existingFaceStudent = students.find(s => s.studentId === best.label);
          setStatusMsg({
            type: 'error',
            text: `This face is already registered as ${existingFaceStudent?.name || ''} (${existingFaceStudent?.studentId || best.label}). Duplicate faces are not allowed.`
          });
          setLoading(false);
          return;
        }
      }

      const descriptorArray = Array.from(detections.descriptor);
      const photoBase64 = compressImage(inputSource);
      const studentData = {
        name: regName,
        studentId: regId.toUpperCase(),
        branch: regBranch,
        year: regYear,
        phone: regPhone,
        email: regEmail,
        photo: photoBase64,
        descriptor: descriptorArray,
        createdAt: serverTimestamp()
      };

      const existingStudent = students.find(
        s => s.studentId?.toLowerCase() === regId.toLowerCase()
      );
      if (existingStudent && !dataDocId) {
        setOverwriteModal({
          docId: existingStudent.id,
          name: existingStudent.name,
          id: existingStudent.studentId,
          newData: studentData
        });
        setLoading(false);
        return;
      }

      await performRegistration(studentData, dataDocId || null);
    } catch (err) {
      console.error(err);
      setStatusMsg({ type: 'error', text: "Detection failed. Try again." });
      setLoading(false);
    }
  };

  // -------------------------------------------------------------------
  // ATTENDANCE helpers
  // -------------------------------------------------------------------
  const getTodayMarkedSet = async () => {
    try {
      const todayId = new Date().toISOString().split('T')[0];
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

  const logAttendance = async (student, status) => {
    try {
      const dateId = new Date().toISOString().split('T')[0];
      const studentDocId = (student.studentId || student).toString();

      // attendance_daily entry
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
          timeIn: new Date().toLocaleTimeString(),
          timestamp: serverTimestamp()
        });
        isNewForToday = true;
      } else {
        // already present; skip
      }

      // also keep raw logs (history)
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
          timeIn: new Date().toLocaleTimeString()
        }
      );

      // If it is a new record for today, increment the local header count instantly
      if (isNewForToday) {
        setTodayCount(prev => typeof prev === 'number' ? prev + 1 : 1);
      }
    } catch (e) {
      console.error('logAttendance error', e);
    }
  };


  // scanning loop
  useEffect(() => {
    let scanInterval = null;
    const runScanner = async () => {
      if (!modelsLoaded || !videoRef.current || videoRef.current.readyState < 2) return;
      const faceapi = window.faceapi;
      if (!faceapi) return;

      try {
        const labeledDescriptors = students
          .filter(s => Array.isArray(s.descriptor) && s.descriptor.length)
          .map(s => new faceapi.LabeledFaceDescriptors(s.studentId, [new Float32Array(s.descriptor)]));

        if (!labeledDescriptors.length) {
          return;
        }

        const faceMatcher = new faceapi.FaceMatcher(labeledDescriptors, 0.6);

        const detections = await faceapi
          .detectAllFaces(videoRef.current, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
          .withFaceLandmarks()
          .withFaceDescriptors();

        if (!detections || !detections.length) {
          return;
        }

        let newlyMarked = 0;
        for (const det of detections) {
          const best = faceMatcher.findBestMatch(det.descriptor);
          if (best.label === 'unknown') continue;
          const sid = best.label;
          if (markedToday.has(sid) || localMarkedRef.current.has(sid)) continue;
          const st = students.find(s => s.studentId === sid);
          if (!st) continue;
          localMarkedRef.current.add(sid);
          setMarkedToday(prev => new Set(prev).add(sid));
          await logAttendance(st, 'Present');
          newlyMarked++;
        }

        if (newlyMarked > 0) {
          setStatusMsg({ type: 'success', text: `Marked ${newlyMarked} new students Present` });
        }
      } catch (err) {
        console.error('scan error', err);
      }
    };

    if (view === 'attendance' && attStep === 'camera' && modelsLoaded) {
      (async () => {
        const set = await getTodayMarkedSet();
        setMarkedToday(set);
        localMarkedRef.current = new Set();
      })();

      runScanner();
      scanInterval = setInterval(runScanner, 2500);
      setContinuousScanActive(true);
    } else {
      setContinuousScanActive(false);
    }

    return () => {
      if (scanInterval) clearInterval(scanInterval);
    };
    // eslint-disable-next-line
  }, [view, attStep, modelsLoaded, students]);

  // attendance UI handlers
  const handleDashboardStartAttendance = () => {
    setView('attendance');
    setAttStep('camera');
    setStatusMsg({ type: 'info', text: 'Starting camera and scanning for faces...' });
  };

  const handleEndSession = () => {
    setAttStep('setup');
    stopVideo();
    setStatusMsg({ type: 'info', text: 'Attendance session ended.' });
  };

  // -------------------------------------------------------------------
  // REPORTS: generate report for class and present reportData
  // (supports 'All' for branch/year)
  // -------------------------------------------------------------------
  const handleGenerateReport = async () => {
    // allow "All" selection
    const branchFilter = reportBranch === 'All' ? null : reportBranch;
    const yearFilter = reportYear === 'All' ? null : reportYear;

    // get class students (respecting 'All')
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
        const safe = safeData(ddata);
        dailyMap.set(d.id, safe);
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

  const handleDownloadReport = () => {
    if (!reportData) return;
    const header = "Date,Roll No,Name,Branch,Year,Time In,Status\n";
    const csvLines = reportData.map(r =>
      `${r.date},${r.studentId || ''},${(r.name || '').replace(/,/g, ' ')},${r.branch || ''},${r.year || ''},${r.timeIn || 'N/A'},${r.status}`
    ).join("\n");
    const csvContent = "data:text/csv;charset=utf-8," + header + csvLines;

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `Report_${reportBranch}_${reportYear}_${reportDate}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // -------------------------------------------------------------------
  // EMAIL: Save CSV to Firestore and email HODs WITHOUT CSV download link.
  // Emails include preview only (no download URL).
  // -------------------------------------------------------------------
  const sendReportToHODs = async (branch, dateId, reportRows) => {
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

      // Build CSV text (quoted)
      const csvText = headerArray.join(',') + '\n' +
        csvRows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');

      // Save report doc (CSV text) to Firestore — we will not include a public download link in email
      const reportDocRef = await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'reports'), {
        branch,
        date: dateId,
        csv: csvText,
        pdfUrl: '',
        createdAt: serverTimestamp(),
      });

      // ------------------- Query HODs -------------------
      let hodDocs = [];
      try {
        const qHod = query(
          collection(db, 'artifacts', appId, 'public', 'data', 'app_users'),
          where('role', '==', 'hod')
        );
        const snap = await getDocs(qHod);
        hodDocs = snap.docs;
      } catch (qErr) {
        console.error('HOD query error (role==hod):', qErr);
      }

      if (!hodDocs.length) {
        try {
          const qHod2 = query(
            collection(db, 'artifacts', appId, 'public', 'data', 'app_users'),
            where('role', '==', 'HOD')
          );
          const snap2 = await getDocs(qHod2);
          hodDocs = snap2.docs;
        } catch (qErr2) {
          console.error('HOD fallback query error:', qErr2);
        }
      }

      const desiredDept = (branch || '').trim().toLowerCase();
      let hodsForBranch = hodDocs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(u => {
          const dept = (u.department || '').toString().trim().toLowerCase();
          if (!dept) return false;
          return dept === desiredDept || dept.includes(desiredDept) || desiredDept.includes(dept);
        });

      // fallback: if none matched department, email all HODs found
      if (!hodsForBranch.length) {
        hodsForBranch = hodDocs.map(d => ({ id: d.id, ...d.data() }));
      }

      if (!hodsForBranch.length) {
        const msg = `Report processed but no HOD found for ${branch}. Report saved (id: ${reportDocRef.id}).`;
        setStatusMsg({ type: 'warning', text: `Report processed but no HOD found for ${branch}.` });
        setSendReportResult({ uploaded: false, downloadUrl: '', hodResults: [], error: msg, reportId: reportDocRef.id });
        setShowSendResultModal(true);
        setLoading(false);
        return { ok: false, uploaded: false, downloadUrl: '', error: msg };
      }

      // ------------------- Send Email to each HOD (NO CSV link) -------------------
      const hodResults = [];
      for (const u of hodsForBranch) {
        if (!u.email) {
          hodResults.push({ email: '(no-email)', status: 'skipped', info: 'HOD record missing email' });
          continue;
        }
        const preview = headerArray.join(',') + '\n' + csvRows.slice(0, 20).map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');

        // Compose message_html explicitly WITHOUT any download link
        const messageHtml = `
          <p>Hello ${u.name || ''},</p>
          <p>Here is the attendance report preview for <strong>${branch}</strong> on <strong>${dateId}</strong>.</p>
          <p>Preview (first rows):</p>
          <pre style="white-space:pre-wrap;font-size:12px;padding:8px;border:1px solid #eee;background:#fafafa;">${(preview || '').replace(/</g, '&lt;')}</pre>
          <p>The full report is saved in the system. Contact admin to access the full CSV if required.</p>
          <p>Regards,<br/>DRK Attendance System</p>
        `;

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
          console.log('Sending EmailJS to', u.email);
          const res = await withTimeout(emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_REPORT_TEMPLATE_ID, templateParams, EMAILJS_PUBLIC_KEY), 20000, 'EmailJS.send');
          console.log('EmailJS sent to', u.email, res);
          hodResults.push({ email: u.email, status: 'sent', info: res && res.status ? `status:${res.status}` : 'ok' });
        } catch (emailErr) {
          console.error('EmailJS send failed for', u.email, emailErr);
          let info = '';
          try {
            if (emailErr && emailErr.text) info = emailErr.text;
            else info = typeof emailErr === 'string' ? emailErr : JSON.stringify(emailErr);
          } catch (e2) {
            info = String(emailErr);
          }
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

  // -------------------------------------------------------------------
  // History: fetch list of dates and counts (student attendance)
  // -------------------------------------------------------------------
  const fetchHistoryList = async () => {
    setHistoryLoading(true);
    try {
      const rootCol = collection(db, 'artifacts', appId, 'public', 'data', 'attendance_daily');
      const snap = await getDocs(rootCol);
      const list = [];
      for (const docSnap of snap.docs) {
        const dateId = docSnap.id;
        // get logs subcollection count
        const logsCol = collection(db, 'artifacts', appId, 'public', 'data', 'attendance_daily', dateId, 'logs');
        const logsSnap = await getDocs(logsCol);
        list.push({ dateId, count: logsSnap.size });
      }
      // sort descending by date (string ISO yyyy-mm-dd sorts naturally)
      list.sort((a, b) => b.dateId.localeCompare(a.dateId));
      setHistoryList(list);
    } catch (e) {
      console.error('fetchHistoryList error', e);
      setHistoryList([]);
    }
    setHistoryLoading(false);
  };

  const fetchHistoryByDate = async (dateId, branch = '', year = '') => {
    setHistoryLoading(true);
    try {
      const logsCol = collection(db, 'artifacts', appId, 'public', 'data', 'attendance_daily', dateId, 'logs');
      const snap = await getDocs(logsCol);
      let rows = snap.docs.map(d => ({ id: d.id, ...safeData(d.data()) }));

      // apply branch/year filters client-side (if provided)
      if (branch) {
        const b = branch.toString().trim().toLowerCase();
        rows = rows.filter(r => (r.branch || '').toString().trim().toLowerCase() === b);
      }
      if (year) {
        const y = year.toString().trim().toLowerCase();
        rows = rows.filter(r => (r.year || '').toString().trim().toLowerCase() === y);
      }

      rows.sort((a, b) => (a.timeIn || '').localeCompare(b.timeIn || ''));
      setHistoryDetail({ dateId, rows, branch, year });
      setShowHistoryDetailModal(true);
    } catch (e) {
      console.error('fetchHistoryByDate error', e);
      setHistoryDetail({ dateId, rows: [], branch, year });
      setShowHistoryDetailModal(true);
    }
    setHistoryLoading(false);
  };

  // -------------------------------------------------------------------
  // Fetch today's DB count for header (attendance_daily/{today}/logs)
  // -------------------------------------------------------------------
  const fetchTodayCount = async () => {
    try {
      const dateId = new Date().toISOString().split('T')[0];
      const logsCol = collection(db, 'artifacts', appId, 'public', 'data', 'attendance_daily', dateId, 'logs');
      const snap = await getDocs(logsCol);
      setTodayCount(snap.size || 0);
    } catch (e) {
      console.error('fetchTodayCount error', e);
      setTodayCount(0);
    }
  };

  useEffect(() => {
    // initial fetch
    fetchTodayCount();
    // refresh every 20 seconds while the app is open (keeps header count updated)
    const iv = setInterval(fetchTodayCount, 20000);
    return () => clearInterval(iv);
    // eslint-disable-next-line
  }, [firebaseUser]);

  // -------------------------------------------------------------------
  // Database search
  // -------------------------------------------------------------------
  const handleSearch = () => {
    const qStr = searchQuery.trim().toLowerCase();
    if (!qStr) return;
    const result = students.find(
      s =>
        s.studentId?.toLowerCase() === qStr ||
        s.name?.toLowerCase().includes(qStr)
    );
    setSearchResult(result || 'not-found');
    if (result) {
      const history = attendanceLogs.filter(
        log => log.studentId?.toLowerCase() === result.studentId.toLowerCase()
      );
      setStudentHistory(history);
    } else {
      setStudentHistory([]);
    }
  };

  const handleGenerateIDCard = (student) => {
    setIdCardData(student);
  };

  // -------------------------------------------------------------------
  // Add staff
  // -------------------------------------------------------------------
  const handleCreateStaff = async () => {
    if (
      !newUserFirstName ||
      !newUserLastName ||
      !newUserUser ||
      !newUserEmail ||
      !newUserDept ||
      !newUserDesignation ||
      !newUserPass ||
      !newUserConfirmPass
    ) {
      setStatusMsg({ type: 'error', text: "Fill all fields" });
      return;
    }
    if (newUserPass.length < 8) {
      setStatusMsg({ type: 'error', text: "Password must be at least 8 characters" });
      return;
    }
    if (newUserPass !== newUserConfirmPass) {
      setStatusMsg({ type: 'error', text: "Password and Confirm Password do not match" });
      return;
    }

    try {
      const fullName = `${newUserFirstName} ${newUserLastName}`.trim();
      let roleToSave = 'faculty';
      if (newUserDesignation.toLowerCase() === 'hod') roleToSave = 'hod';
      if (newUserDesignation.toLowerCase() === 'principal') roleToSave = 'principal';
      if (newUserDesignation.toLowerCase() === 'admin') roleToSave = 'admin';

      const hashed = await hashPassword(newUserPass);

      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'app_users'), {
        username: newUserUser.toLowerCase(),
        password: hashed,
        role: roleToSave,
        name: fullName,
        department: newUserDept,
        designation: newUserDesignation,
        email: newUserEmail,
        createdBy: appUser?.username,
        createdAt: serverTimestamp()
      });

      setStatusMsg({ type: 'success', text: `Staff member ${fullName} created successfully` });

      setNewUserFirstName('');
      setNewUserLastName('');
      setNewUserUser('');
      setNewUserEmail('');
      setNewUserDept('CSE');
      setNewUserDesignation('Faculty');
      setNewUserPass('');
      setNewUserConfirmPass('');
    } catch (err) {
      console.error(err);
      setStatusMsg({ type: 'error', text: "Failed to create staff" });
    }
  };

  // -------------------------------------------------------------------
  // Profile edit handlers
  // -------------------------------------------------------------------
  const handleProfilePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setProfilePhotoPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async () => {
    if (!appUser) return;
    try {
      const userRef = doc(db, 'artifacts', appId, 'public', 'data', 'app_users', appUser.id);
      const updateData = {
        email: profileEmail,
        phone: profilePhone,
        department: profileDept
      };
      if (profilePhotoPreview) updateData.photo = profilePhotoPreview;

      await updateDoc(userRef, updateData);
      setAppUser(prev => prev ? { ...prev, ...updateData } : prev);
      setStatusMsg({ type: 'success', text: 'Profile updated successfully' });
      setProfileEditMode(false);
    } catch (err) {
      console.error(err);
      setStatusMsg({ type: 'error', text: 'Failed to update profile' });
    }
  };

  const handleCancelProfileEdit = () => {
    if (!appUser) return;
    setProfileEditMode(false);
    setProfileEmail(appUser.email || '');
    setProfilePhone(appUser.phone || '');
    setProfileDept(appUser.department || '');
    setProfilePhotoPreview(appUser.photo || null);
  };

  // -------------------------------------------------------------------
  // Small Message component
  // -------------------------------------------------------------------
  const Message = () =>
    statusMsg ? (
      <div
        className={`p-3 mb-4 rounded-lg text-sm flex items-center gap-2 ${
          statusMsg.type === "error"
            ? "bg-red-100 text-red-800"
            : statusMsg.type === "warning"
              ? "bg-yellow-100 text-yellow-800"
              : statusMsg.type === "info"
                ? "bg-sky-100 text-sky-800"
                : "bg-green-100 text-green-800"
          }`}
      >
        {statusMsg.type === "error" && <AlertCircle className="w-4 h-4" />}
        {statusMsg.type === "warning" && <AlertTriangle className="w-4 h-4" />}
        {statusMsg.type === "success" && <CheckCircle className="w-4 h-4" />}
        {statusMsg.type === "info" && <RefreshCw className="w-4 h-4" />}
        <span>{statusMsg.text}</span>
        <button onClick={() => setStatusMsg(null)} className="ml-auto">
          <X className="w-4 h-4" />
        </button>
      </div>
    ) : null;

  // If models not loaded or firebase user not ready, show loading
  if (!modelsLoaded || !firebaseUser) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-red-50 text-red-900">
        <RefreshCw className="w-12 h-12 animate-spin mb-4 text-red-700" />
        <h2 className="text-2xl font-bold">DRK Institute System Loading...</h2>
      </div>
    );
  }

  // If not logged in and not reset flow, show login
  if (!appUser && !forgotPasswordMode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-start justify-start p-6">
        <div className="w-full max-w-md mx-auto">
          <div className="flex flex-col items-center mb-6">
            <img src="/logos/login-logo.png" alt="Login Logo" className="h-33 w-41 object-contain mb-5" />
            <h2 className="text-center text-xl font-bold text-slate-800">Faculty Portal</h2>
          </div>

          <Message />

          <div className="space-y-4">
            <div>
              <input
                type="text"
                className="w-full p-4 border rounded-xl text-sm"
                placeholder="Username"
                value={loginUser}
                onChange={e => setLoginUser(e.target.value.toLowerCase())}
              />
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                className="w-full p-4 border rounded-xl text-sm"
                placeholder="Password"
                value={loginPass}
                onChange={e => setLoginPass(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-3 text-slate-400"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                />
                <span className="text-slate-600">Remember Me</span>
              </label>
              <button
                onClick={() => { setForgotPasswordMode(true); setStatusMsg(null); setFpStep(1); }}
                className="text-red-700 hover:underline"
              >
                Forgot Password?
              </button>
            </div>

            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full bg-red-800 text-white py-4 rounded-xl font-bold mt-3"
            >
              {loading ? 'Verifying...' : 'LOGIN'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Forgot password screen (unchanged)
  if (forgotPasswordMode) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-2xl w-full max-w-md border-t-8 border-blue-600">
          <h2 className="text-2xl font-bold text-center text-slate-800 mb-6">Reset Password</h2>
          <Message />

          {fpStep === 1 && (
            <div className="space-y-4">
              <label className="block text-sm font-bold text-slate-500">Enter Username</label>
              <input
                type="text"
                className="w-full p-3 border rounded-lg"
                placeholder="username"
                value={fpUser}
                onChange={e => setFpUser(e.target.value.toLowerCase())}
              />
              <button
                onClick={handleSendResetLink}
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700"
              >
                {loading ? 'Sending link...' : 'Send Reset Link'}
              </button>
            </div>
          )}

          {fpStep === 2 && (
            <div className="space-y-4">
              {resetTokenStatus === "checking" && (
                <p className="text-sm text-slate-500 mb-4">Verifying reset link...</p>
              )}
              {resetTokenStatus === "invalid" && (
                <p className="text-red-600 font-semibold mb-4">
                  This reset link is invalid or expired.
                </p>
              )}
              {resetTokenStatus === "valid" && (
                <>
                  <label className="block text-sm font-bold text-slate-500">
                    New Password (Min 8 chars)
                  </label>
                  <input
                    type="password"
                    className="w-full p-3 border rounded-lg"
                    placeholder="New Password"
                    value={fpNewPass}
                    onChange={e => setFpNewPass(e.target.value)}
                  />
                  <button
                    onClick={handleChangePassword}
                    disabled={loading}
                    className="w-full bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700"
                  >
                    {loading ? 'Updating...' : 'Change Password'}
                  </button>
                </>
              )}
            </div>
          )}

          <button
            onClick={() => {
              setForgotPasswordMode(false);
              setFpStep(1);
              setFpUser('');
              setFpNewPass('');
              setResetTokenStatus('idle');
            }}
            className="w-full text-center text-sm text-slate-500 mt-4 hover:underline"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  // ---------- LOGGED-IN VIEW ----------
  return (
    <div className="app-shell min-h-screen bg-slate-50 pb-24">
      <Message statusMsg={statusMsg} setStatusMsg={setStatusMsg} />
      
      {/* MODALS */}
      <SendReportModal showModal={showSendResultModal} result={sendReportResult} onClose={() => setShowSendResultModal(false)} />
      <HistoryDetailModal showModal={showHistoryDetailModal} detail={historyDetail} onClose={() => setShowHistoryDetailModal(false)} />
      <IDCardModal idCardData={idCardData} onClose={() => setIdCardData(null)} />
      <OverwriteModal showModal={overwriteModal !== null} data={overwriteModal} onConfirm={(d) => { setOverwriteModal(null); performRegistration(d.newData, d.docId); }} onCancel={() => setOverwriteModal(null)} />

      {/* HEADER */}
      <Header appUser={appUser} todayCount={todayCount} />

      {/* MAIN */}
      <main className="max-w-6xl mx-auto p-3 sm:p-4">
        {/* HOME / DASHBOARD */}
        {view === 'home' && (
          <DashboardScreen
            appUser={appUser}
            students={students}
            setView={setView}
            handleDashboardStartAttendance={handleDashboardStartAttendance}
          />
        )}

        {/* REGISTER */}
        {view === 'register' && (
          <RegistrationScreen
            regStep={regStep}
            setRegStep={setRegStep}
            regMode={regMode}
            setRegMode={setRegMode}
            regName={regName}
            setRegName={setRegName}
            regId={regId}
            setRegId={setRegId}
            regBranch={regBranch}
            setRegBranch={setRegBranch}
            regYear={regYear}
            setRegYear={setRegYear}
            regPhone={regPhone}
            setRegPhone={setRegPhone}
            regEmail={regEmail}
            setRegEmail={setRegEmail}
            uploadedImgSrc={uploadedImgSrc}
            videoRef={videoRef}
            imgRef={imgRef}
            loading={loading}
            handleProceedToCamera={handleProceedToCamera}
            handleCheckAndRegister={handleCheckAndRegister}
            handleFileChange={handleFileChange}
            toggleCameraFacing={toggleCameraFacing}
          />
        )}

        {/* REPORTS */}
        {view === 'reports' && (
          <ReportsScreen
            reportDate={reportDate}
            setReportDate={setReportDate}
            reportBranch={reportBranch}
            setReportBranch={setReportBranch}
            reportYear={reportYear}
            setReportYear={setReportYear}
            reportData={reportData}
            handleGenerateReport={handleGenerateReport}
            handleDownloadReport={handleDownloadReport}
            sendReportToHODs={sendReportToHODs}
            loading={loading}
            SHOW_EMAIL_BUTTON={SHOW_EMAIL_BUTTON}
          />
        )}

        {/* ATTENDANCE */}
        {view === 'attendance' && (
          <AttendanceScreen
            attStep={attStep}
            setAttStep={setAttStep}
            videoRef={videoRef}
            continuousScanActive={continuousScanActive}
            markedToday={markedToday}
            students={students}
            handleEndSession={handleEndSession}
          />
        )}

        {/* DATABASE */}
        {view === 'database' && (
          <DatabaseScreen
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            searchResult={searchResult}
            handleSearch={handleSearch}
            handleGenerateIDCard={handleGenerateIDCard}
          />
        )}

        {/* HISTORY (student attendance by date) */}
        {view === 'history' && (
          <HistoryScreen
            historyDate={historyDate}
            setHistoryDate={setHistoryDate}
            historyBranch={historyBranch}
            setHistoryBranch={setHistoryBranch}
            historyYear={historyYear}
            setHistoryYear={setHistoryYear}
            historyLoading={historyLoading}
            historyList={historyList}
            fetchHistoryByDate={fetchHistoryByDate}
            setView={setView}
            fetchHistoryList={fetchHistoryList}
          />
        )}

        {/* PROFILE */}
        {view === 'profile' && (
          <ProfileScreen
            appUser={appUser}
            profileEditMode={profileEditMode}
            setProfileEditMode={setProfileEditMode}
            profileEmail={profileEmail}
            setProfileEmail={setProfileEmail}
            profilePhone={profilePhone}
            setProfilePhone={setProfilePhone}
            profileDept={profileDept}
            setProfileDept={setProfileDept}
            profilePhotoPreview={profilePhotoPreview}
            handleProfilePhotoChange={handleProfilePhotoChange}
            handleSaveProfile={handleSaveProfile}
            handleCancelProfileEdit={handleCancelProfileEdit}
            handleLogout={handleLogout}
            setView={setView}
          />
        )}

        {/* MANAGE USERS */}
        {view === 'manage_users' && (
          <ManageUsersScreen
            newUserFirstName={newUserFirstName}
            setNewUserFirstName={setNewUserFirstName}
            newUserLastName={newUserLastName}
            setNewUserLastName={setNewUserLastName}
            newUserUser={newUserUser}
            setNewUserUser={setNewUserUser}
            newUserEmail={newUserEmail}
            setNewUserEmail={setNewUserEmail}
            newUserDept={newUserDept}
            setNewUserDept={setNewUserDept}
            newUserDesignation={newUserDesignation}
            setNewUserDesignation={setNewUserDesignation}
            newUserPass={newUserPass}
            setNewUserPass={setNewUserPass}
            newUserConfirmPass={newUserConfirmPass}
            setNewUserConfirmPass={setNewUserConfirmPass}
            loading={loading}
            handleCreateStaff={handleCreateStaff}
            setView={setView}
          />
        )}
      </main>

      {/* MODALS */}
      {/* Send report result modal */}
      {showSendResultModal && sendReportResult && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[160] p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full overflow-auto">
            <div className="p-4 border-b flex items-start gap-3">
              <h3 className="text-lg font-bold">Report send results</h3>
              <button onClick={() => setShowSendResultModal(false)} className="ml-auto text-slate-500">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-3">
              <p className="text-sm text-slate-600">Uploaded: <b>{sendReportResult.uploaded ? 'Yes' : 'No'}</b></p>
              {sendReportResult.reportId && (
                <p className="text-sm">Report ID: <span className="font-mono">{sendReportResult.reportId}</span></p>
              )}
              <div>
                <h4 className="font-semibold">HOD results</h4>
                <div className="mt-2 space-y-2 max-h-60 overflow-auto">
                  {(sendReportResult.hodResults || []).map((r, idx) => (
                    <div key={idx} className="p-2 border rounded">
                      <div className="flex items-center gap-3">
                        <div className="font-mono text-sm">{r.email}</div>
                        <div className={`ml-auto text-xs font-semibold ${r.status === 'sent' ? 'text-green-700' : r.status === 'failed' ? 'text-red-700' : 'text-slate-600'}`}>
                          {r.status.toUpperCase()}
                        </div>
                      </div>
                      {r.info && <div className="text-xs text-slate-500 mt-1 break-all">{typeof r.info === 'string' ? r.info : JSON.stringify(r.info)}</div>}
                    </div>
                  ))}
                  {(!sendReportResult.hodResults || !sendReportResult.hodResults.length) && (
                    <p className="text-xs text-slate-500">No HODs found or no emails attempted.</p>
                  )}
                </div>
              </div>
              {sendReportResult.error && (
                <div className="text-sm text-red-600">
                  Error: {sendReportResult.error}
                </div>
              )}
            </div>
            <div className="p-4 border-t flex justify-end gap-2">
              <button onClick={() => setShowSendResultModal(false)} className="px-4 py-2 rounded border">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* History detail modal (moved to separate component) */}

      {/* BOTTOM NAV */}
      <BottomNav view={view} setView={setView} />
    </div>
  );
}
