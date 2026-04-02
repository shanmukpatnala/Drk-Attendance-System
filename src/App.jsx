import React, { useState, useEffect, useRef } from 'react';
import { AlertCircle, CheckCircle, RefreshCw, X, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import emailjs from '@emailjs/browser';
import { QRCodeCanvas } from 'qrcode.react';

// Firebase & utilities
import { auth, signInAnonymously, onAuthStateChanged, serverTimestamp, collection, addDoc, db, getDocs, updateDoc, doc, getDoc, query, where, onSnapshot, orderBy, setDoc, deleteDoc } from './utils/firebase';
import { hashPassword, safeData, getTodayDateId, compressImage, formatTime, isValidRollNo, getDateIdsInRange, sanitizeRollNoInput } from './utils/helpers';
import { appId, FACE_API_SCRIPT, MODEL_URL, EMAILJS_SERVICE_ID, EMAILJS_REPORT_TEMPLATE_ID, EMAILJS_PUBLIC_KEY, SHOW_EMAIL_BUTTON, appConfig } from './app/constants';
import { performLogin as performLoginHandler, performStudentLogin as performStudentLoginHandler, handleSendResetLink as handleSendResetLinkHandler, handleChangePassword as handleChangePasswordHandler, verifyResetToken as verifyResetTokenHandler } from './app/authHandlers';

// Screen components
import { DashboardScreen, RegistrationScreen, AttendanceScreen, ReportsScreen, DatabaseScreen, StudentBrowserScreen, HistoryScreen, ProfileScreen, ManageUsersScreen, StudentDashboardScreen, StudentHistoryScreen } from './screens';

// Modal components
import { SendReportModal, IDCardModal, OverwriteModal, UnidentifiedFaceModal, AlreadyPresentModal } from './modals';

// UI components
import { Header, BottomNav, Message } from './components';

const CAMERA_CONSTRAINTS = {
  width: { ideal: 480 },
  height: { ideal: 270 },
  frameRate: { ideal: 24, max: 30 }
};

const ATTENDANCE_MATCH_THRESHOLD = 0.42;
const ATTENDANCE_AMBIGUITY_GAP = 0.035;
const ATTENDANCE_RECHECK_THRESHOLD = 0.5;
const ATTENDANCE_RECHECK_AMBIGUITY_GAP = 0.02;
const UNKNOWN_FACE_CONFIRMATION_COUNT = 3;
const ALREADY_PRESENT_POPUP_COOLDOWN_MS = 8000;
const ATTENDANCE_DETECTOR_OPTIONS = {
  inputSize: 128,
  scoreThreshold: 0.3
};

const ATTENDANCE_PROCESSING_WIDTH = 320;

const UNKNOWN_FACE_SIGNATURE_PRECISION = 1;
const UNKNOWN_FACE_SKIP_COOLDOWN_MS = 5000;
const HISTORY_START_DATE = '2026-03-20';
const BRANCH_DISPLAY_ORDER = ['CSE', 'CSM', 'CSD', 'CSC', 'ECE', 'EEE', 'MECH', 'CIVIL'];




export default function App() {
  // Auth
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [appUser, setAppUser] = useState(null);
  const [studentUser, setStudentUser] = useState(null);
  const [portalMode, setPortalMode] = useState('faculty');

  // Login
  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [studentLoginRollNo, setStudentLoginRollNo] = useState('');
  const [studentRememberMe, setStudentRememberMe] = useState(false);
  const [studentSelfRegisterMode, setStudentSelfRegisterMode] = useState(false);

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
  const [isNavOpen, setIsNavOpen] = useState(false);

  // Students & logs
  const [students, setStudents] = useState([]);
  const [attendanceLogs, setAttendanceLogs] = useState([]);

  // Registration
  const [regStep, setRegStep] = useState('details'); // details | camera
  const [regMode, setRegMode] = useState('none'); // none | live | upload
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
  const [reportDate, setReportDate] = useState(getTodayDateId());
  const [reportBranch, setReportBranch] = useState('All');
  const [reportYear, setReportYear] = useState('All');
  const [reportData, setReportData] = useState(null);
  const [promoteYear, setPromoteYear] = useState('All');

  // Database search & ID card
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [studentHistory, setStudentHistory] = useState([]);
  const [idCardData, setIdCardData] = useState(null);
  const [databaseBrowseYear, setDatabaseBrowseYear] = useState('All');
  const [databaseBrowseBranch, setDatabaseBrowseBranch] = useState('All');
  const [showApprovalQueueOnly, setShowApprovalQueueOnly] = useState(false);
  const [registrationEditStudent, setRegistrationEditStudent] = useState(null);
  const [registrationReturnView, setRegistrationReturnView] = useState('home');

  // Add Staff
  const [newUserFirstName, setNewUserFirstName] = useState('');
  const [newUserLastName, setNewUserLastName] = useState('');
  const [newUserUser, setNewUserUser] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserDept, setNewUserDept] = useState('CSE');
  const [newUserDesignation, setNewUserDesignation] = useState('Faculty');
  const [newUserPass, setNewUserPass] = useState('');
  const [newUserConfirmPass, setNewUserConfirmPass] = useState('');
  const [manageUsersTab, setManageUsersTab] = useState('create');
  const [staffUsers, setStaffUsers] = useState([]);

  // Camera
  const videoRef = useRef(null);
  const imgRef = useRef(null);
  const scanCanvasRef = useRef(null);
  const scanSourceMetaRef = useRef(null);
  const [cameraFacing, setCameraFacing] = useState('user'); // 'user' | 'environment'

  // Profile edit
  const [profileEditMode, setProfileEditMode] = useState(false);
  const [profileEmail, setProfileEmail] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileDept, setProfileDept] = useState('');
  const [profilePhotoPreview, setProfilePhotoPreview] = useState(null);
  const [showProfilePhotoActions, setShowProfilePhotoActions] = useState(false);

  // Attendance sets
  const [markedToday, setMarkedToday] = useState(new Set());
  const localMarkedRef = useRef(new Set());
  const markedTodayRef = useRef(new Set());
  const promptedUnidentifiedRef = useRef(new Set()); // Track which unidentified faces we've already prompted
  const scanInProgressRef = useRef(false);
  const scanTimeoutRef = useRef(null);

  // header DB count for today
  const [todayCount, setTodayCount] = useState(0);

  // Send report result modal state
  const [sendReportResult, setSendReportResult] = useState(null);
  const [showSendResultModal, setShowSendResultModal] = useState(false);

  // history: list of dates + counts
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyRollNo, setHistoryRollNo] = useState('');
  const [historyStudentResult, setHistoryStudentResult] = useState(null);
  const [historyError, setHistoryError] = useState('');
  const [registrationMessage, setRegistrationMessage] = useState(null);
  const [studentPortalSummary, setStudentPortalSummary] = useState(null);
  const [studentPortalLoading, setStudentPortalLoading] = useState(false);

  // Unidentified face modal
  const [unidentifiedFaceModal, setUnidentifiedFaceModal] = useState(null);
  const unidentifiedFaceModalRef = useRef(null);
  const unknownFaceSkipUntilRef = useRef(0);
  const [alreadyPresentModal, setAlreadyPresentModal] = useState(null);
  const alreadyPresentPopupRef = useRef(new Map());

  const browserBranchOptions = BRANCH_DISPLAY_ORDER;

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
      await Promise.all([
        faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
      ]);
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

  useEffect(() => {
    if (!firebaseUser) return;

    const usersQuery = query(
      collection(db, 'artifacts', appId, 'public', 'data', 'app_users')
    );

    const unsubUsers = onSnapshot(usersQuery, (snapshot) => {
      const users = snapshot.docs.map((item) => ({ id: item.id, ...safeData(item.data()) }));
      setStaffUsers(users);
    });

    return () => unsubUsers();
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

  useEffect(() => {
    if (!firebaseUser || appUser || studentUser) return;

    const saved = localStorage.getItem('drkAttendanceStudentRemember');
    if (!saved) return;

    try {
      const { rollNo, remember } = JSON.parse(saved);
      if (remember && rollNo) {
        setPortalMode('student');
        setStudentRememberMe(true);
        setStudentLoginRollNo(rollNo);
        performStudentLoginHandler({
          rollNo,
          setStatusMsg,
          setLoading,
          setStudentUser,
          setStudentView: setView
        }).then((loginSucceeded) => {
          if (!loginSucceeded) {
            localStorage.removeItem('drkAttendanceStudentRemember');
          }
        });
      }
    } catch (error) {
      console.error('Student remember me parse error', error);
    }
  }, [firebaseUser, appUser, studentUser]);

  useEffect(() => {
    markedTodayRef.current = markedToday;
  }, [markedToday]);

  useEffect(() => {
    unidentifiedFaceModalRef.current = unidentifiedFaceModal;
  }, [unidentifiedFaceModal]);

  useEffect(() => {
    if (!appUser) return;
    setProfileEmail(appUser.email || '');
    setProfilePhone(appUser.phone || '');
    setProfileDept(appUser.department || '');
    setProfilePhotoPreview(appUser.photo || null);
    setShowProfilePhotoActions(false);
  }, [appUser]);

  useEffect(() => {
    if (!appUser) return;

    const role = (appUser?.role || '').trim().toLowerCase();
    if (role === 'hod') {
      setNewUserDept((appUser?.department || '').trim().toUpperCase());
      setNewUserDesignation('Faculty');
      return;
    }

    if (role === 'dean') {
      setNewUserDesignation((currentValue) => (
        currentValue === 'Dean' || currentValue === 'Principal' ? 'HOD' : currentValue || 'HOD'
      ));
    }

    if (role === 'admin') {
      setNewUserDesignation((currentValue) => currentValue || 'Dean');
    }
  }, [appUser]);

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
      video: {
        facingMode: cameraFacing,
        ...CAMERA_CONSTRAINTS
      }
    })
      .then(stream => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play?.().catch(() => {});
          };
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
    const registrationAccessAllowed = Boolean(appUser) || studentSelfRegisterMode;

    if (!modelsLoaded || !registrationAccessAllowed) {
      stopVideo();
      return;
    }

    const shouldStartRegisterCamera = view === 'register' && regMode === 'live';
    const shouldStartAttendanceCamera = view === 'attendance' && attStep === 'camera';

    if (shouldStartRegisterCamera || shouldStartAttendanceCamera) {
      startVideo();
    } else {
      stopVideo();
    }
    // eslint-disable-next-line
  }, [view, modelsLoaded, attStep, regMode, appUser, studentSelfRegisterMode, cameraFacing]);

  

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

  const handleStudentLogin = async () => {
    const normalizedRollNo = sanitizeRollNoInput(studentLoginRollNo || '');

    if (!normalizedRollNo) {
      setStatusMsg({ type: 'error', text: 'Enter roll number' });
      return;
    }

    if (!isValidRollNo(normalizedRollNo)) {
      setStatusMsg({ type: 'error', text: 'Invalid Roll No. Use 22N71A6655.' });
      return;
    }

    const existingStudent = students.find(
      student => (student.studentId || '').trim().toUpperCase() === normalizedRollNo
    );

    if (!existingStudent) {
      resetViewState('register');
      setPortalMode('student');
      setStudentSelfRegisterMode(true);
      setRegId(normalizedRollNo);
      setRegistrationMessage({
        type: 'info',
        text: `Roll number ${normalizedRollNo} is not registered yet. Fill your profile to submit it for HOD approval.`
      });
      return;
    }

    const loginSucceeded = await performStudentLoginHandler({
      rollNo: normalizedRollNo,
      setStatusMsg,
      setLoading,
      setStudentUser,
      setStudentView: setView
    });

    if (!loginSucceeded) {
      localStorage.removeItem('drkAttendanceStudentRemember');
      return;
    }

    if (studentRememberMe) {
      localStorage.setItem('drkAttendanceStudentRemember', JSON.stringify({
        rollNo: normalizedRollNo,
        remember: true
      }));
    } else {
      localStorage.removeItem('drkAttendanceStudentRemember');
    }
  };

  const handleLogout = () => {
    setAppUser(null);
    setStudentUser(null);
    setView('home');
    setPortalMode('faculty');
    setLoginUser('');
    setLoginPass('');
    setStudentLoginRollNo('');
    setStudentRememberMe(false);
    setStudentSelfRegisterMode(false);
    setStudentPortalSummary(null);
    localStorage.removeItem('drkAttendanceRemember');
    localStorage.removeItem('drkAttendanceStudentRemember');
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
    reader.onload = () => {
      setUploadedImgSrc(reader.result);
      setRegistrationMessage(null);
    };
    reader.readAsDataURL(file);
  };

  const validateRegistrationDetails = () => {
    if (!regName || !regId || !regPhone || !regEmail) {
      setRegistrationMessage({ type: 'error', text: "Please fill all fields" });
      return false;
    }

    if (!isValidRollNo(regId) || !/^\d{10}$/.test(regPhone)) {
      setRegistrationMessage({
        type: 'error',
        text: "Invalid Roll No or Phone (format: 22N71A6655, positions 3 and 6 must be letters, phone 10 digits)"
      });
      return false;
    }

    return true;
  };

  const formatRegisteredStudentLabel = (student, fallbackId = '') => {
    if (!student) return fallbackId ? `Student (${fallbackId})` : 'Student';

    const name = student.name || 'Student';
    const year = student.year ? ` - ${student.year} Year` : '';
    const studentId = student.studentId || fallbackId;

    return studentId ? `${name}${year} (${studentId})` : `${name}${year}`;
  };

  const buildStudentDocId = (data) => {
    const normalizedStudentId = (data?.studentId || '')
      .trim()
      .replace(/[^A-Za-z0-9]+/g, '')
      .toUpperCase();

    if (!normalizedStudentId) {
      throw new Error('Student roll number is required');
    }

    return normalizedStudentId;
  };

  const performRegistration = async (data, docId = null) => {
    setLoading(true);
    try {
      const targetDocId = docId || buildStudentDocId(data);

      if (docId) {
        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'students', targetDocId), data);
        setRegistrationMessage({ type: 'success', text: `Updated profile for ${data.name}` });
      } else {
        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'students', targetDocId), data);
        setRegistrationMessage({ type: 'success', text: `Student ${data.name} registered successfully` });
      }
      // reset form
      setRegName('');
      setRegId('');
      setRegPhone('');
      setRegEmail('');
      setUploadedImgSrc(null);
      setRegStep('details');
      setOverwriteModal(null);
      return true;
    } catch (err) {
      console.error(err);
      setRegistrationMessage({ type: 'error', text: "Database error" });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const buildUnknownFaceSignature = (descriptor) => {
    if (!descriptor || typeof descriptor.length !== 'number') return null;
    return Array.from(descriptor)
      .slice(0, 12)
      .map(value => Number(value).toFixed(UNKNOWN_FACE_SIGNATURE_PRECISION))
      .join('|');
  };

  const captureFaceFromDetection = (faceDescription) => {
    const video = videoRef.current;
    const box = faceDescription?.detection?.box;
    if (!video || !box) return null;

    const sourceWidth = video.videoWidth;
    const sourceHeight = video.videoHeight;
    if (!sourceWidth || !sourceHeight) return null;

    const meta = scanSourceMetaRef.current;
    const scaleX = meta?.processedWidth ? sourceWidth / meta.processedWidth : 1;
    const scaleY = meta?.processedHeight ? sourceHeight / meta.processedHeight : 1;
    const mappedBox = {
      x: box.x * scaleX,
      y: box.y * scaleY,
      width: box.width * scaleX,
      height: box.height * scaleY
    };

    const padX = mappedBox.width * 0.35;
    const padY = mappedBox.height * 0.45;
    const sx = Math.max(0, Math.floor(mappedBox.x - padX));
    const sy = Math.max(0, Math.floor(mappedBox.y - padY));
    const sw = Math.min(sourceWidth - sx, Math.ceil(mappedBox.width + padX * 2));
    const sh = Math.min(sourceHeight - sy, Math.ceil(mappedBox.height + padY * 2));

    if (sw <= 0 || sh <= 0) return null;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    canvas.width = sw;
    canvas.height = sh;
    ctx.drawImage(video, sx, sy, sw, sh, 0, 0, sw, sh);
    return canvas.toDataURL('image/jpeg', 0.82);
  };

  const promptUnknownFaceRegistration = async (faceDescription) => {
    if (Date.now() < unknownFaceSkipUntilRef.current) return false;

    const signature = buildUnknownFaceSignature(faceDescription?.descriptor);
    if (!signature || promptedUnidentifiedRef.current.has(signature)) return false;

    const seenCount = (unknownFaceCandidateCountsRef.current.get(signature) || 0) + 1;
    unknownFaceCandidateCountsRef.current.set(signature, seenCount);
    if (seenCount < UNKNOWN_FACE_CONFIRMATION_COUNT) return false;

    const recheckedMatch = findBestAttendanceMatch(
      faceDescription?.descriptor,
      ATTENDANCE_RECHECK_THRESHOLD,
      ATTENDANCE_RECHECK_AMBIGUITY_GAP
    );

    if (recheckedMatch?.studentId) {
      const matchedStudent = studentMapRef.current?.get(recheckedMatch.studentId);
      if (matchedStudent && matchedStudent.year !== 'Passed Out') {
        const recheckedPhoto = captureFaceFromDetection(faceDescription);
        unknownFaceCandidateCountsRef.current.delete(signature);

        if (markedTodayRef.current.has(recheckedMatch.studentId) || localMarkedRef.current.has(recheckedMatch.studentId)) {
          openAlreadyPresentModal(matchedStudent, recheckedPhoto);
          return true;
        }

        if (recheckedPhoto) {
          localMarkedRef.current.add(recheckedMatch.studentId);
          setMarkedToday(prev => {
            const next = new Set(prev);
            next.add(matchedStudent.studentId);
            return next;
          });
          logAttendance(matchedStudent, 'Present', recheckedPhoto);
          setStatusMsg({
            type: 'success',
            text: `${matchedStudent.name || matchedStudent.studentId} recognized after re-check`
          });
          return true;
        }
      }
    }

    const facePhoto = captureFaceFromDetection(faceDescription);
    if (!facePhoto) return false;

    promptedUnidentifiedRef.current.add(signature);
    setUnidentifiedFaceModal({
      signature,
      facePhoto,
      onRegister: handleRegisterUnidentifiedFace
    });
    setStatusMsg({
      type: 'warning',
      text: 'New face found. Fill the form to register this student.'
    });
    return true;
  };

  const closeUnidentifiedFaceModal = () => {
    setUnidentifiedFaceModal(null);

    if (view === 'attendance' && attStep === 'camera' && modelsLoaded) {
      scheduleNextScan(200);
    }
  };

  const handleSkipUnknownFace = () => {
    unknownFaceSkipUntilRef.current = Date.now() + UNKNOWN_FACE_SKIP_COOLDOWN_MS;
    if (unidentifiedFaceModalRef.current?.signature) {
      promptedUnidentifiedRef.current.delete(unidentifiedFaceModalRef.current.signature);
    }
    unknownFaceCandidateCountsRef.current.clear();
    closeUnidentifiedFaceModal();
  };

  const openAlreadyPresentModal = (student, facePhoto = '') => {
    if (!student?.studentId) return;

    const now = Date.now();
    const lastShownAt = alreadyPresentPopupRef.current.get(student.studentId) || 0;
    if ((now - lastShownAt) < ALREADY_PRESENT_POPUP_COOLDOWN_MS) return;

    alreadyPresentPopupRef.current.set(student.studentId, now);

    const todayId = getTodayDateId();
    const todayLog = attendanceLogs.find(log =>
      (log.studentId || '') === student.studentId
      && (log.date || '') === todayId
      && (log.status || '') === 'Present'
    );

    setAlreadyPresentModal({
      name: student.name || '',
      studentId: student.studentId || '',
      branch: student.branch || '',
      year: student.year || '',
      facePhoto: facePhoto || todayLog?.facePhoto || student.photo || '',
      timeIn: todayLog?.timeIn || '',
      dateId: todayId
    });
  };

  // check and register: uses face-api only when regMode==='live' and regStep==='camera'
  const handleCheckAndRegister = async (dataDocId = null) => {
    if (!firebaseUser) return;
    if (!validateRegistrationDetails()) return;
    if (regMode !== 'live' && regMode !== 'upload') {
      setRegistrationMessage({ type: 'warning', text: 'Choose Camera or Gallery after filling the details.' });
      return;
    }

    const faceapi = window.faceapi;
    let inputSource;

    if (regMode === 'live') {
      if (!videoRef.current || videoRef.current.readyState < 2) {
        setRegistrationMessage({ type: 'warning', text: "Camera warming up..." });
        return;
      }
      inputSource = videoRef.current;
    } else {
      if (!uploadedImgSrc || !imgRef.current) {
        setRegistrationMessage({ type: 'error', text: "Please upload a photo" });
        return;
      }
      inputSource = imgRef.current;
    }

    setRegistrationMessage(null);
    setLoading(true);

    try {
      const detections = await faceapi
        .detectSingleFace(
          inputSource,
          new faceapi.SsdMobilenetv1Options({ minConfidence: 0.3 })
        )
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detections) {
        setRegistrationMessage({ type: 'error', text: "No face detected. Try again." });
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
        const matcher = new faceapi.FaceMatcher(labeledDescriptors, 0.3);
        const best = matcher.findBestMatch(detections.descriptor);
        // Only reject if distance is very low (close match)
        if (best.label !== 'unknown' && best.distance < 0.5) {
          const existingFaceStudent = students.find(s => s.studentId === best.label);
          setRegistrationMessage({
            type: 'error',
            text: `This face is already registered as ${formatRegisteredStudentLabel(existingFaceStudent, best.label)}. Duplicate faces are not allowed.`
          });
          setLoading(false);
          return;
        }
      }

      const descriptorArray = Array.from(detections.descriptor);
      const photoBase64 = compressImage(inputSource);
      const isStudentSelfRegistration = studentSelfRegisterMode && !appUser;
      const studentData = {
        name: regName,
        studentId: regId.toUpperCase(),
        branch: regBranch,
        year: regYear,
        phone: regPhone,
        email: regEmail,
        photo: photoBase64,
        descriptor: descriptorArray,
        createdAt: serverTimestamp(),
        approved: isStudentSelfRegistration ? false : true,
        approvalStatus: isStudentSelfRegistration ? 'pending' : 'approved',
        approvedBy: isStudentSelfRegistration ? '' : (appUser?.username || 'system'),
        approvedAt: isStudentSelfRegistration ? null : serverTimestamp(),
        selfRegistered: isStudentSelfRegistration
      };

      const existingStudent = students.find(
        s => s.studentId?.toLowerCase() === regId.toLowerCase()
      );
      if (existingStudent && !dataDocId) {
        setRegistrationMessage({
          type: 'error',
          text: `Roll number ${existingStudent.studentId} is already registered for ${formatRegisteredStudentLabel(existingStudent)}.`
        });
        setLoading(false);
        return;
      }

      const saved = await performRegistration(studentData, dataDocId || null);
      if (saved && isStudentSelfRegistration) {
        setStudentSelfRegisterMode(false);
        setPortalMode('student');
        setStatusMsg({
          type: 'success',
          text: 'Profile submitted successfully. You can login after your branch HOD approves it.'
        });
      }
    } catch (err) {
      console.error(err);
      setRegistrationMessage({ type: 'error', text: "Detection failed. Try again." });
      setLoading(false);
    }
  };

  // -------------------------------------------------------------------
  // ATTENDANCE helpers
  // -------------------------------------------------------------------
  const getTodayMarkedSet = async () => {
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

  const logAttendance = async (student, status, facePhoto = '') => {
    try {
      const dateId = getTodayDateId();
      const studentDocId = (student.studentId || student).toString();
      const dailyDateRef = doc(db, 'artifacts', appId, 'public', 'data', 'attendance_daily', dateId);

      // attendance_daily entry
      const dailyRef = doc(db, 'artifacts', appId, 'public', 'data', 'attendance_daily', dateId, 'logs', studentDocId);
      const snap = await getDoc(dailyRef);
      let isNewForToday = false;

      await setDoc(dailyDateRef, {
        dateId,
        sessionEnded: '',
        updatedAt: serverTimestamp()
      }, { merge: true });

      if (!snap.exists()) {
        await setDoc(dailyRef, {
          name: student.name || '',
          studentId: student.studentId || student,
          branch: student.branch || '',
          year: student.year || '',
          status,
          timeIn: formatTime(),
          timestamp: serverTimestamp(),
          facePhoto: facePhoto || ''
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
          timeIn: formatTime(),
          facePhoto: facePhoto || ''
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


  // Ref to cache normalized descriptors between scans.
  const faceMatcherRef = useRef(null);
  const studentMapRef = useRef(null);
  const studentDescriptorSignatureRef = useRef('');
  const runtimeDescriptorMapRef = useRef(new Map());
  const unknownFaceCandidateCountsRef = useRef(new Map());
  const detectionStatsRef = useRef({ checked: 0 });

  const buildStudentDescriptorSignature = (studentList = []) =>
    studentList
      .filter(student => student?.studentId)
      .map(student => {
        const descriptorValues = student?.descriptor && typeof student.descriptor.length === 'number'
          ? Array.from(student.descriptor).slice(0, 6)
          : null;
        const descriptor = descriptorValues
          ? descriptorValues.map(value => Number(value).toFixed(3)).join(',')
          : 'none';
        return `${student.studentId}:${descriptor}`;
      })
      .sort()
      .join('|');

  const getDistanceBetweenDescriptors = (sourceDescriptor, targetDescriptor) => {
    if (!sourceDescriptor || !targetDescriptor || sourceDescriptor.length !== targetDescriptor.length) {
      return Number.POSITIVE_INFINITY;
    }

    let sum = 0;
    for (let index = 0; index < sourceDescriptor.length; index += 1) {
      const diff = sourceDescriptor[index] - targetDescriptor[index];
      sum += diff * diff;
    }

    return Math.sqrt(sum);
  };

  const findBestAttendanceMatch = (
    descriptor,
    threshold = ATTENDANCE_MATCH_THRESHOLD,
    ambiguityGap = ATTENDANCE_AMBIGUITY_GAP
  ) => {
    const registeredDescriptors = faceMatcherRef.current || [];
    if (!registeredDescriptors.length || !descriptor) return null;

    const rankedMatches = registeredDescriptors
      .map(student => ({
        studentId: student.studentId,
        distance: getDistanceBetweenDescriptors(descriptor, student.descriptor)
      }))
      .filter(match => Number.isFinite(match.distance))
      .sort((left, right) => left.distance - right.distance);

    if (!rankedMatches.length) return null;

    const bestMatch = rankedMatches[0];
    const secondBestMatch = rankedMatches[1];
    const isTooFar = bestMatch.distance > threshold;
    const isAmbiguous = secondBestMatch && (secondBestMatch.distance - bestMatch.distance) < ambiguityGap;

    if (isTooFar || isAmbiguous) return null;

    return bestMatch;
  };

  const resolveAttendanceMatch = (descriptor) =>
    findBestAttendanceMatch(descriptor, ATTENDANCE_MATCH_THRESHOLD, ATTENDANCE_AMBIGUITY_GAP);

  const loadDescriptorFromImage = async (imageSrc) => {
    if (!imageSrc || !window.faceapi) return null;

    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.src = imageSrc;

    await new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = reject;
    });

    const detection = await window.faceapi
      .detectSingleFace(image, new window.faceapi.SsdMobilenetv1Options({ minConfidence: 0.3 }))
      .withFaceLandmarks()
      .withFaceDescriptor();

    return detection?.descriptor ? new Float32Array(detection.descriptor) : null;
  };

  useEffect(() => {
    if (!modelsLoaded || !students.length) {
      runtimeDescriptorMapRef.current = new Map();
      studentDescriptorSignatureRef.current = '';
      return undefined;
    }

    let isCancelled = false;

    const hydrateRuntimeDescriptors = async () => {
      const hydratedDescriptors = new Map();

      for (const student of students) {
        if (!student?.studentId) continue;

        let descriptor = Array.isArray(student.descriptor) && student.descriptor.length
          ? new Float32Array(student.descriptor)
          : null;

        if (student.photo) {
          try {
            const photoDescriptor = await loadDescriptorFromImage(student.photo);
            if (photoDescriptor) {
              descriptor = photoDescriptor;
            }
          } catch (error) {
            console.warn(`Descriptor hydration failed for ${student.studentId}`, error);
          }
        }

        if (descriptor) {
          hydratedDescriptors.set(student.studentId, descriptor);
        }
      }

      if (!isCancelled) {
        runtimeDescriptorMapRef.current = hydratedDescriptors;
        faceMatcherRef.current = null;
        studentDescriptorSignatureRef.current = '';
      }
    };

    hydrateRuntimeDescriptors();

    return () => {
      isCancelled = true;
    };
  }, [modelsLoaded, students]);

  const scheduleNextScan = (delay = 650) => {
    if (scanTimeoutRef.current) {
      clearTimeout(scanTimeoutRef.current);
    }

    scanTimeoutRef.current = setTimeout(() => {
      scanTimeoutRef.current = null;
      runScanner();
    }, delay);
  };

  const getAttendanceScanSource = () => {
    const video = videoRef.current;
    if (!video) return null;

    const sourceWidth = video.videoWidth;
    const sourceHeight = video.videoHeight;
    if (!sourceWidth || !sourceHeight) return video;

    if (!scanCanvasRef.current) {
      scanCanvasRef.current = document.createElement('canvas');
    }

    const canvas = scanCanvasRef.current;
    const scale = Math.min(1, ATTENDANCE_PROCESSING_WIDTH / sourceWidth);
    const width = Math.max(160, Math.round(sourceWidth * scale));
    const height = Math.max(120, Math.round(sourceHeight * scale));

    if (canvas.width !== width) canvas.width = width;
    if (canvas.height !== height) canvas.height = height;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return video;

    ctx.drawImage(video, 0, 0, width, height);
    scanSourceMetaRef.current = {
      processedWidth: width,
      processedHeight: height,
      sourceWidth,
      sourceHeight
    };
    return canvas;
  };

  const runScanner = async () => {
    if (scanInProgressRef.current) return;
    if (view !== 'attendance' || attStep !== 'camera' || !modelsLoaded) return;
    if (unidentifiedFaceModalRef.current) return;

    if (!videoRef.current || videoRef.current.readyState < 2) {
      scheduleNextScan(400);
      return;
    }

    const faceapi = window.faceapi;
    if (!faceapi) {
      scheduleNextScan(800);
      return;
    }

    scanInProgressRef.current = true;

    try {
      const descriptorSignature = buildStudentDescriptorSignature(
        students.map(student => ({
          ...student,
          descriptor: runtimeDescriptorMapRef.current.get(student.studentId) || student.descriptor
        }))
      );

      if (!studentMapRef.current || studentMapRef.current.size !== students.length) {
        studentMapRef.current = new Map(students.map(s => [s.studentId, s]));
      }

      if (!faceMatcherRef.current || studentDescriptorSignatureRef.current !== descriptorSignature) {
        faceMatcherRef.current = students
          .map(s => ({
            studentId: s?.studentId,
            descriptor: runtimeDescriptorMapRef.current.get(s?.studentId)
              || (Array.isArray(s?.descriptor) && s.descriptor.length ? new Float32Array(s.descriptor) : null)
          }))
          .filter(s => s?.studentId && s?.descriptor?.length);
        studentDescriptorSignatureRef.current = descriptorSignature;
      }

      const scanSource = getAttendanceScanSource();
      if (!scanSource) {
        scheduleNextScan(150);
        return;
      }

      const detections = await faceapi
        .detectAllFaces(
          scanSource,
          new faceapi.TinyFaceDetectorOptions(ATTENDANCE_DETECTOR_OPTIONS)
        )
        .withFaceLandmarks()
        .withFaceDescriptors();

      if (!detections?.length) {
        scheduleNextScan(120);
        return;
      }

      if (!faceMatcherRef.current) {
        const prompted = await promptUnknownFaceRegistration(detections[0]);
        if (prompted) return;
        scheduleNextScan(150);
        return;
      }

      const recognizedStudents = [];
      let shouldPromptUnknownFace = false;

      for (const det of detections) {
        const best = resolveAttendanceMatch(det.descriptor);
        if (!best) {
          if (!shouldPromptUnknownFace) {
            shouldPromptUnknownFace = await promptUnknownFaceRegistration(det);
          }
          continue;
        }

        const sid = best.studentId;
        const st = studentMapRef.current.get(sid);
        if (!st || st.year === 'Passed Out') continue;

        const facePhoto = captureFaceFromDetection(det);
        if (markedTodayRef.current.has(sid) || localMarkedRef.current.has(sid)) {
          openAlreadyPresentModal(st, facePhoto);
          continue;
        }

        unknownFaceCandidateCountsRef.current.delete(buildUnknownFaceSignature(det.descriptor));
        localMarkedRef.current.add(sid);
        recognizedStudents.push({ student: st, facePhoto });
      }

      if (recognizedStudents.length) {
        setMarkedToday(prev => {
          const next = new Set(prev);
          recognizedStudents.forEach(({ student }) => next.add(student.studentId));
          return next;
        });

        recognizedStudents.forEach(({ student, facePhoto }) => {
          logAttendance(student, 'Present', facePhoto);
        });

        setStatusMsg({
          type: 'success',
          text: `Marked ${recognizedStudents.length} present in under 5 seconds`
        });
      }

      if (shouldPromptUnknownFace) {
        return;
      }

      scheduleNextScan(recognizedStudents.length ? 80 : 120);
    } catch (err) {
      console.error('scan error', err);
      scheduleNextScan(180);
    } finally {
      scanInProgressRef.current = false;
    }
  };

  // scanning loop - ultra fast optimized with better recognition
  useEffect(() => {
    if (view === 'attendance' && attStep === 'camera' && modelsLoaded) {
      (async () => {
        const set = await getTodayMarkedSet();
        setMarkedToday(set);
        markedTodayRef.current = set;
        localMarkedRef.current = new Set();
        detectionStatsRef.current = { checked: 0 };
        faceMatcherRef.current = null;
        studentMapRef.current = null;
        studentDescriptorSignatureRef.current = '';
        unknownFaceCandidateCountsRef.current.clear();
        scanInProgressRef.current = false;
        runScanner();
      })();
      setContinuousScanActive(true);
    } else {
      setContinuousScanActive(false);
      faceMatcherRef.current = null;
      studentMapRef.current = null;
      studentDescriptorSignatureRef.current = '';
      unknownFaceCandidateCountsRef.current.clear();
      scanSourceMetaRef.current = null;
      scanInProgressRef.current = false;
      if (scanTimeoutRef.current) {
        clearTimeout(scanTimeoutRef.current);
        scanTimeoutRef.current = null;
      }
    }

    return () => {
      if (scanTimeoutRef.current) {
        clearTimeout(scanTimeoutRef.current);
        scanTimeoutRef.current = null;
      }
      scanInProgressRef.current = false;
    };
    // eslint-disable-next-line
  }, [view, attStep, modelsLoaded, students]);

  /*
  useEffect(() => {
    let scanInterval = null;
    
    const runScanner = async () => {
      if (!modelsLoaded || !videoRef.current || videoRef.current.readyState < 2) return;
      const faceapi = window.faceapi;
      if (!faceapi) return;

      try {
        // Build student map once
        if (!studentMapRef.current) {
          studentMapRef.current = new Map(students.map(s => [s.studentId, s]));
        }

        // Build matcher once and cache - lower threshold for more generous matching
        if (!faceMatcherRef.current) {
          const labeledDescriptors = students
            .filter(s => Array.isArray(s.descriptor) && s.descriptor.length)
            .map(s => new faceapi.LabeledFaceDescriptors(s.studentId, [new Float32Array(s.descriptor)]));

          if (labeledDescriptors.length === 0) return;

          // Threshold 0.4 = more generous, catches more matches
          faceMatcherRef.current = new faceapi.FaceMatcher(labeledDescriptors, 0.4);
        }

        // Very aggressive detection - catch even partial/angled faces
        const detections = await faceapi
          .detectAllFaces(videoRef.current, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.35 }))
          .withFaceDescriptors();

        if (!detections || !detections.length) {
          return;
        }

        let newlyMarked = 0;

        for (const det of detections) {
          // Get best match
          const best = faceMatcherRef.current.findBestMatch(det.descriptor);
          
          // More generous matching: accept distance up to 0.65
          if (best.label === 'unknown' || best.distance > 0.65) continue;

          const sid = best.label;
          if (markedToday.has(sid) || localMarkedRef.current.has(sid)) continue;
          
          const st = studentMapRef.current.get(sid);
          if (!st) continue;
          
          if (st.year === 'Passed Out') continue;
          
          localMarkedRef.current.add(sid);
          setMarkedToday(prev => new Set(prev).add(sid));
          await logAttendance(st, 'Present');
          newlyMarked++;
        }

        if (newlyMarked > 0) {
          setStatusMsg({ type: 'success', text: `✓ Marked ${newlyMarked} present` });
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
        detectionStatsRef.current = { checked: 0 };
      })();

      runScanner();
      scanInterval = setInterval(runScanner, 1500); // Blazing fast 1.5-second interval
      setContinuousScanActive(true);
    } else {
      setContinuousScanActive(false);
      faceMatcherRef.current = null; // Reset matcher when not scanning
      studentMapRef.current = null;
    }

    return () => {
      if (scanInterval) clearInterval(scanInterval);
    };
    // eslint-disable-next-line
  }, [view, attStep, modelsLoaded, students]);
  */

  // attendance UI handlers
  const handleDashboardStartAttendance = () => {
    // Ensure camera starts immediately when entering attendance mode.
    resetViewState('attendance');
    setAttStep('camera');
    setView('attendance');
    setIsNavOpen(false);
    setStatusMsg({ type: 'info', text: 'Starting camera and scanning for faces...' });
    startVideo();
  };

  const handlePromoteYears = async () => {
    if (!firebaseUser) return;
    const isAdmin = (appUser?.role || '').toLowerCase() === 'admin';
    if (!isAdmin) {
      setStatusMsg({ type: 'error', text: 'Only admins can upgrade student years.' });
      return;
    }
    setLoading(true);
    try {
      const studentCollection = collection(db, 'artifacts', appId, 'public', 'data', 'students');
      const snapshot = await getDocs(studentCollection);
      const updates = [];
      const nextYearByCurrentYear = {
        '1st': '2nd',
        '2nd': '3rd',
        '3rd': '4th',
        '4th': 'Passed Out'
      };

      snapshot.forEach(docItem => {
        const st = safeData(docItem.data());
        const nextYear = nextYearByCurrentYear[st.year];
        if (!nextYear) return;

        if (promoteYear === 'All' || st.year === promoteYear) {
          updates.push(updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'students', docItem.id), { year: nextYear }));
        }
      });
      await Promise.all(updates);
      setStatusMsg({
        type: 'success',
        text: promoteYear === 'All'
          ? `Promoted ${updates.length} students across all active years`
          : `Promoted ${updates.length} ${promoteYear} year students to ${nextYearByCurrentYear[promoteYear]}`
      });
    } catch (error) {
      console.error('Year promotion failed:', error);
      setStatusMsg({ type: 'error', text: 'Failed to promote years' });
    } finally {
      setLoading(false);
    }
  };

  const handleEndSession = () => {
    setAttStep('setup');
    stopVideo();
    promptedUnidentifiedRef.current.clear(); // Reset tracked unidentified faces
    unknownFaceSkipUntilRef.current = 0;
    scanSourceMetaRef.current = null;
    setUnidentifiedFaceModal(null);
    if (scanTimeoutRef.current) {
      clearTimeout(scanTimeoutRef.current);
      scanTimeoutRef.current = null;
    }
    scanInProgressRef.current = false;
    setStatusMsg({ type: 'info', text: 'Attendance session ended.' });
  };

  const resetViewState = (nextView) => {
    const today = getTodayDateId();

    if (view === 'attendance' && nextView !== 'attendance') {
      setAttStep('setup');
      stopVideo();
      promptedUnidentifiedRef.current.clear();
      unknownFaceSkipUntilRef.current = 0;
      scanSourceMetaRef.current = null;
      setUnidentifiedFaceModal(null);
      if (scanTimeoutRef.current) {
        clearTimeout(scanTimeoutRef.current);
        scanTimeoutRef.current = null;
      }
      scanInProgressRef.current = false;
      setContinuousScanActive(false);
    }

    setSearchQuery('');
    setSearchResult(null);
    setStudentHistory([]);
    setIdCardData(null);
    setDatabaseBrowseYear('All');
    setDatabaseBrowseBranch('All');
    setShowApprovalQueueOnly(false);
    setRegistrationEditStudent(null);
    setRegistrationReturnView('home');

    setReportDate(today);
    setReportBranch('All');
    setReportYear('All');
    setReportData(null);

    setHistoryLoading(false);
    setHistoryRollNo('');
    setHistoryStudentResult(null);

    setRegStep('details');
    setRegMode('none');
    setRegName('');
    setRegId('');
    setRegBranch('CSE');
    setRegYear('1st');
    setRegPhone('');
    setRegEmail('');
    setUploadedImgSrc(null);
    setOverwriteModal(null);

    setProfileEditMode(false);
    setProfileEmail(appUser?.email || '');
    setProfilePhone(appUser?.phone || '');
    setProfileDept(appUser?.department || '');
    setProfilePhotoPreview(appUser?.photo || null);
    setShowProfilePhotoActions(false);

    setNewUserFirstName('');
    setNewUserLastName('');
    setNewUserUser('');
    setNewUserEmail('');
    setNewUserDept(currentUserRole === 'hod' ? currentUserDepartment : 'CSE');
    setNewUserDesignation(
      currentUserRole === 'admin' ? 'Dean' : currentUserRole === 'dean' ? 'HOD' : 'Faculty'
    );
    setNewUserPass('');
    setNewUserConfirmPass('');
    setManageUsersTab('create');

    setStatusMsg(null);
    setRegistrationMessage(null);
  };

  const navigateToView = (nextView) => {
    resetViewState(nextView);
    setView(nextView);
    setIsNavOpen(false);
  };

  const handleRegistrationBack = () => {
    setRegistrationEditStudent(null);
    navigateToView(registrationReturnView || 'home');
  };

  const handleStudentRegistrationBack = () => {
    resetViewState('home');
    setStudentSelfRegisterMode(false);
    setPortalMode('student');
    setRegistrationMessage(null);
    setStatusMsg(null);
  };

  const handleStudentSelfEdit = () => {
    if (!studentUser) return;

    resetViewState('register');
    setRegistrationEditStudent(studentUser);
    setRegistrationReturnView('student_home');
    setRegStep('details');
    setRegMode(studentUser.photo ? 'upload' : 'none');
    setRegName(studentUser.name || '');
    setRegId((studentUser.studentId || '').toUpperCase());
    setRegBranch(studentUser.branch || 'CSE');
    setRegYear(studentUser.year || '1st');
    setRegPhone(studentUser.phone || '');
    setRegEmail(studentUser.email || '');
    setUploadedImgSrc(studentUser.photo || null);
    setView('register');
    setStatusMsg(null);
    setRegistrationMessage(null);
  };

  const openStudentEditor = (student, nextView = 'register') => {
    if (!student) return;

    resetViewState(nextView);
    setRegistrationEditStudent(student);
    setRegistrationReturnView('database');
    setRegStep('details');
    setRegMode(student.photo ? 'upload' : 'none');
    setRegName(student.name || '');
    setRegId((student.studentId || '').toUpperCase());
    setRegBranch(student.branch || 'CSE');
    setRegYear(student.year || '1st');
    setRegPhone(student.phone || '');
    setRegEmail(student.email || '');
    setUploadedImgSrc(student.photo || null);
    setSearchQuery(student.studentId || '');
    setSearchResult(student);
    setView(nextView);
    setIsNavOpen(false);
  };

  const handleSaveStudentEdits = async () => {
    if (!registrationEditStudent) return;
    if (!validateRegistrationDetails()) return;

    try {
      const previousStudentId = (registrationEditStudent.studentId || '').trim().toUpperCase();
      const nextStudentId = regId.trim().toUpperCase();
      const studentIdChanged = previousStudentId !== nextStudentId;

      if (studentIdChanged) {
        const existingStudent = students.find(
          s => (s.studentId || '').trim().toUpperCase() === nextStudentId
        );

        if (existingStudent) {
          setRegistrationMessage({
            type: 'error',
            text: `Roll number ${nextStudentId} is already registered for ${formatRegisteredStudentLabel(existingStudent)}.`
          });
          return;
        }
      }

      const updatedStudent = {
        ...registrationEditStudent,
        name: regName,
        studentId: nextStudentId,
        branch: regBranch,
        year: regYear,
        phone: regPhone,
        email: regEmail
      };

      const targetDocId = studentIdChanged ? null : previousStudentId;
      const saved = await performRegistration(updatedStudent, targetDocId);
      if (!saved) return;

      if (studentIdChanged) {
        await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'students', previousStudentId));
      }

      if (registrationReturnView === 'student_home') {
        setStudentUser(prev => prev ? { ...prev, ...updatedStudent } : prev);
        setRegistrationEditStudent(null);
        setRegistrationReturnView('home');
        setView('student_home');
        return;
      }

      setRegistrationEditStudent(null);
      setRegistrationReturnView('home');
      setView('database');
    } catch (err) {
      console.error(err);
      setRegistrationMessage({ type: 'error', text: 'Failed to update student details' });
    }
  };

  const handleOpenBranchStudents = (year, branch) => {
    resetViewState('student_browser');
    setDatabaseBrowseYear(year);
    setDatabaseBrowseBranch(branch);
    setShowApprovalQueueOnly(false);
    setView('student_browser');
    setIsNavOpen(false);
  };

  const handleOpenApprovalQueue = () => {
    resetViewState('student_browser');
    setShowApprovalQueueOnly(true);
    setView('student_browser');
    setIsNavOpen(false);
  };

  const handleRegisterUnidentifiedFace = async (studentData) => {
    try {
      setStatusMsg({ type: 'info', text: 'Registering unidentified person...' });

      const normalizedStudentId = (studentData.studentId || '').trim().toUpperCase();
      const existingStudentById = students.find(
        s => (s.studentId || '').trim().toUpperCase() === normalizedStudentId
      );
      if (existingStudentById) {
        throw new Error(`Roll number ${normalizedStudentId} is already registered for ${formatRegisteredStudentLabel(existingStudentById)}.`);
      }

      // Extract face descriptor from the photo
      const faceapi = window.faceapi;
      const img = new Image();
      img.src = studentData.facePhoto;

      await new Promise((resolve) => {
        img.onload = resolve;
      });

      const detections = await faceapi
        .detectSingleFace(img, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.3 }))
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detections) {
        throw new Error('No face detected in the captured photo');
      }

      const labeledDescriptors = students
        .filter(s => Array.isArray(s.descriptor) && s.descriptor.length && s.studentId)
        .map(
          s => new faceapi.LabeledFaceDescriptors(
            s.studentId,
            [new Float32Array(s.descriptor)]
          )
        );

      if (labeledDescriptors.length > 0) {
        const matcher = new faceapi.FaceMatcher(labeledDescriptors, 0.35);
        const best = matcher.findBestMatch(detections.descriptor);
        if (best.label !== 'unknown' && best.distance < 0.5) {
          const existingFaceStudent = students.find(s => s.studentId === best.label);
          throw new Error(`This face is already registered as ${formatRegisteredStudentLabel(existingFaceStudent, best.label)}. One face cannot be registered for two students.`);
        }
      }

      // Prepare registration data
      const regData = {
        ...studentData,
        studentId: normalizedStudentId,
        descriptor: Array.from(detections.descriptor),
        totalAttendance: 0,
        lastAttendance: null
      };

      // Register the student
      const saved = await performRegistration(regData);
      if (saved) {
        setStatusMsg({ type: 'success', text: `Successfully registered ${studentData.name}` });
        closeUnidentifiedFaceModal();
      }
    } catch (error) {
      console.error('Error registering unidentified face:', error);
      setStatusMsg({ type: 'error', text: 'Failed to register person: ' + error.message });
    }
  };

  // -------------------------------------------------------------------
  // REPORTS: generate report for class and present reportData
  // (supports 'All' for branch/year)
  // -------------------------------------------------------------------
  const handleGenerateReport = async () => {
    // allow "All" selection
    const branchFilter = reportBranch === 'All' ? null : reportBranch;
    const yearFilter = reportYear === 'All' ? null : reportYear;
    const includePassedOut = reportYear === 'Passed Out';

    // get class students (respecting 'All')
    const classStudents = students.filter(
      s =>
        (branchFilter ? s.branch === branchFilter : true) &&
        (yearFilter ? s.year === yearFilter : s.year !== 'Passed Out') &&
        (includePassedOut ? s.year === 'Passed Out' : true)
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
        return { ...st, photo: presentLog ? (presentLog.facePhoto || '') : '', status, timeIn, date: dateId };
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
  // History: fetch complete student attendance history
  // -------------------------------------------------------------------
  const fetchStudentAttendanceSummary = async (rollNo) => {
    const normalizedRollNo = (rollNo || '').trim().toUpperCase();

    if (!normalizedRollNo) {
      return { ok: false, error: 'Enter roll number' };
    }

    if (!isValidRollNo(normalizedRollNo)) {
      return { ok: false, error: 'Invalid Roll No. Use 22N71A6655, with letters in positions 3 and 6.' };
    }

    const student = students.find(
      s => (s.studentId || '').trim().toUpperCase() === normalizedRollNo
    ) || ((studentUser?.studentId || '').trim().toUpperCase() === normalizedRollNo ? studentUser : null);

    if (!student) {
      return { ok: false, error: 'Student not found' };
    }

    const attendanceLogsQuery = query(
      collection(db, 'artifacts', appId, 'public', 'data', 'attendance_logs'),
      where('studentId', '==', normalizedRollNo)
    );
    const attendanceLogsSnap = await getDocs(attendanceLogsQuery);
    const presentRecordsByDate = new Map();
    const attendanceLogRows = attendanceLogsSnap.docs
      .map((logDoc) => safeData(logDoc.data()))
      .sort((a, b) => {
        const dateCompare = (b.date || b.dateId || '').localeCompare(a.date || a.dateId || '');
        if (dateCompare !== 0) return dateCompare;
        return (b.timeIn || '').localeCompare(a.timeIn || '');
      });

    attendanceLogRows.forEach((data) => {
      const dateId = data.date || data.dateId || '';
      if (!dateId || presentRecordsByDate.has(dateId)) return;

      presentRecordsByDate.set(dateId, {
        dateId,
        isPresent: true,
        timeIn: data.timeIn || '-',
        photo: data.facePhoto || '',
        status: data.status || 'Present'
      });
    });

    const rangeDateIds = getDateIdsInRange(HISTORY_START_DATE, getTodayDateId());
    const sortedDateIds = [...new Set([...rangeDateIds, ...presentRecordsByDate.keys()])]
      .sort((a, b) => b.localeCompare(a));

    const recordSnaps = await Promise.all(
      sortedDateIds.map(async (dateId) => {
        const logRef = doc(db, 'artifacts', appId, 'public', 'data', 'attendance_daily', dateId, 'logs', normalizedRollNo);
        const logSnap = await getDoc(logRef);
        return logSnap.exists()
          ? { dateId, data: safeData(logSnap.data()) }
          : null;
      })
    );

    const timeline = sortedDateIds
      .map((dateId) => {
        const matchedRecord = recordSnaps.find((record) => record?.dateId === dateId);
        const fallbackPresentRecord = presentRecordsByDate.get(dateId) || null;
        const data = matchedRecord?.data || fallbackPresentRecord;
        const isPresent = Boolean(data);

        return {
          dateId,
          isPresent,
          timeIn: isPresent ? (data.timeIn || '-') : '-',
          photo: isPresent ? ((data.facePhoto || data.photo || '')) : '',
          status: isPresent ? (data.status || 'Present') : 'Absent'
        };
      })
      .sort((a, b) => {
        const dateCompare = b.dateId.localeCompare(a.dateId);
        if (dateCompare !== 0) return dateCompare;
        return (b.timeIn || '').localeCompare(a.timeIn || '');
      });

    const totalPresent = timeline.filter((record) => record.isPresent).length;
    const totalAbsent = timeline.filter((record) => !record.isPresent).length;
    const totalDays = timeline.length;
    const attendancePercentage = totalDays ? Math.round((totalPresent / totalDays) * 100) : 0;

    return {
      ok: true,
      data: {
        studentId: normalizedRollNo,
        name: student?.name || '',
        branch: student?.branch || '',
        year: student?.year || '',
        latestPresentDate: timeline.find((record) => record.isPresent)?.dateId || '',
        totalPresent,
        totalAbsent,
        totalDays,
        attendancePercentage,
        timeline
      }
    };
  };

  const handleHistoryStudentSearch = async () => {
    const normalizedRollNo = historyRollNo.trim().toUpperCase();

    if (!normalizedRollNo) {
      setHistoryStudentResult(null);
      setHistoryError('Enter roll number');
      return;
    }

    if (!isValidRollNo(normalizedRollNo)) {
      setHistoryStudentResult(null);
      setHistoryError('Invalid Roll No. Use 22N71A6655, with letters in positions 3 and 6.');
      return;
    }

    setHistoryError('');
    setHistoryLoading(true);
    try {
      const result = await fetchStudentAttendanceSummary(normalizedRollNo);
      if (!result.ok) {
        setHistoryStudentResult(null);
        setHistoryError(result.error);
        return;
      }

      setHistoryStudentResult(result.data);
    } catch (error) {
      console.error('handleHistoryStudentSearch error', error);
      setHistoryStudentResult(null);
      setHistoryError('Failed to check student history');
    }
    setHistoryLoading(false);
  };

  useEffect(() => {
    if (!studentUser?.studentId) {
      setStudentPortalSummary(null);
      return;
    }

    let active = true;

    const loadStudentPortalSummary = async () => {
      setStudentPortalLoading(true);
      try {
        const result = await fetchStudentAttendanceSummary(studentUser.studentId);
        if (!active) return;

        if (result.ok) {
          setStudentPortalSummary(result.data);
          const currentStudentRecord = students.find(
            s => (s.studentId || '').trim().toUpperCase() === (studentUser.studentId || '').trim().toUpperCase()
          );
          if (currentStudentRecord) {
            setStudentUser((prev) => prev ? { ...prev, ...currentStudentRecord } : prev);
          }
        } else {
          setStudentPortalSummary(null);
          setStatusMsg({ type: 'error', text: result.error });
        }
      } catch (error) {
        console.error('student portal summary error', error);
        if (active) {
          setStudentPortalSummary(null);
          setStatusMsg({ type: 'error', text: 'Failed to load student attendance summary' });
        }
      } finally {
        if (active) {
          setStudentPortalLoading(false);
        }
      }
    };

    loadStudentPortalSummary();

    return () => {
      active = false;
    };
  }, [studentUser?.studentId, students]);

  // -------------------------------------------------------------------
  // Fetch today's DB count for header (attendance_daily/{today}/logs)
  // -------------------------------------------------------------------
  const fetchTodayCount = async () => {
    try {
      const dateId = getTodayDateId();
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

  const canApproveStudentProfile = (student) => {
    const role = (appUser?.role || '').toLowerCase();
    const branch = (student?.branch || '').trim().toUpperCase();
    const department = (appUser?.department || '').trim().toUpperCase();

    if (role !== 'hod') return false;
    if (!branch || !department) return false;
    return branch === department;
  };

  const handleApproveStudent = async (student) => {
    if (!student?.studentId || !canApproveStudentProfile(student)) return;

    try {
      await updateDoc(
        doc(db, 'artifacts', appId, 'public', 'data', 'students', student.studentId),
        {
          approved: true,
          approvalStatus: 'approved',
          approvedBy: appUser?.username || appUser?.name || 'hod',
          approvedAt: serverTimestamp()
        }
      );
      setStatusMsg({ type: 'success', text: `${student.name || student.studentId} approved successfully.` });
    } catch (error) {
      console.error('approve student error', error);
      setStatusMsg({ type: 'error', text: 'Failed to approve student profile' });
    }
  };

  const handleRejectStudent = async (student) => {
    if (!student?.studentId || !canApproveStudentProfile(student)) return;

    try {
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'students', student.studentId));
      setStatusMsg({ type: 'success', text: `${student.name || student.studentId} rejected and removed.` });
    } catch (error) {
      console.error('reject student error', error);
      setStatusMsg({ type: 'error', text: 'Failed to reject student profile' });
    }
  };

  const databaseBrowseResults = students
    .filter((student) => {
      const isPending = student?.approved === false || (student?.approvalStatus || '').toLowerCase() === 'pending';
      const matchesYear = databaseBrowseYear === 'All' ? true : (student.year || '').trim() === databaseBrowseYear;
      const studentBranch = (student.branch || '').trim().toUpperCase();
      const matchesBranch = databaseBrowseBranch === 'All' ? true : studentBranch === databaseBrowseBranch;
      const matchesApprovalQueue = showApprovalQueueOnly ? isPending : true;
      return matchesYear && matchesBranch && matchesApprovalQueue;
    })
    .sort((left, right) => (left.studentId || '').localeCompare(right.studentId || ''));

  const pendingStudentApprovals = students.filter(student => {
    const isPending = student?.approved === false || (student?.approvalStatus || '').toLowerCase() === 'pending';
    return isPending && canApproveStudentProfile(student);
  });

  const normalizedRegId = (regId || '').trim().toUpperCase();
  const editingStudentId = (registrationEditStudent?.studentId || '').trim().toUpperCase();
  const duplicateRollNoStudent = normalizedRegId
    ? students.find(student => {
        const studentId = (student?.studentId || '').trim().toUpperCase();
        if (!studentId || studentId !== normalizedRegId) return false;
        if (registrationEditStudent && studentId === editingStudentId) return false;
        return true;
      })
    : null;
  const duplicateRollNoMessage = duplicateRollNoStudent
    ? `This roll number is already used by ${duplicateRollNoStudent.name || 'another student'}.`
    : '';

  const currentUserRole = (appUser?.role || '').trim().toLowerCase();
  const currentUserDepartment = (appUser?.department || '').trim().toUpperCase();
  const normalizedNewUserDept = (newUserDept || '').trim().toUpperCase();
  const normalizedNewUserDesignation = (newUserDesignation || '').trim().toLowerCase();

  const baseDesignationOptions = currentUserRole === 'admin'
    ? ['Dean', 'Principal', 'HOD', 'Faculty']
    : ['dean', 'principal'].includes(currentUserRole)
      ? ['HOD', 'Faculty']
      : currentUserRole === 'hod'
        ? ['Faculty']
        : [];

  const deanExists = staffUsers.some(
    (user) => (user?.role || '').trim().toLowerCase() === 'dean'
  );
  const principalExists = staffUsers.some(
    (user) => (user?.role || '').trim().toLowerCase() === 'principal'
  );
  const hodDepartments = new Set(
    staffUsers
      .filter((user) => (user?.role || '').trim().toLowerCase() === 'hod')
      .map((user) => ((user?.department || '').trim().toUpperCase()))
      .filter(Boolean)
  );
  const allDepartmentOptions = ['CSE', 'CSM', 'CSD', 'CSC', 'ECE', 'EEE', 'MECH', 'CIVIL'];
  const availableHodDepartments = allDepartmentOptions.filter((department) => !hodDepartments.has(department));
  const selectedDepartmentHasHod = staffUsers.some((user) => (
    (user?.role || '').trim().toLowerCase() === 'hod'
    && ((user?.department || '').trim().toUpperCase() === normalizedNewUserDept)
  ));

  const allowedDesignationOptions = baseDesignationOptions.filter((designation) => {
    const normalizedDesignation = designation.toLowerCase();

    if (normalizedDesignation === 'dean' && deanExists) return false;
    if (normalizedDesignation === 'principal' && principalExists) return false;
    if (normalizedDesignation === 'hod' && availableHodDepartments.length === 0) return false;

    return true;
  });

  const visibleManagedUsers = staffUsers
    .filter((user) => {
      if (currentUserRole === 'admin' || currentUserRole === 'dean') return true;
      if (currentUserRole === 'hod') {
        return ((user?.department || '').trim().toUpperCase() === currentUserDepartment)
          && (user?.role || '').trim().toLowerCase() === 'faculty';
      }
      return false;
    })
    .sort((left, right) => {
      const roleCompare = (left?.role || '').localeCompare(right?.role || '');
      if (roleCompare !== 0) return roleCompare;
      return (left?.name || '').localeCompare(right?.name || '');
    });

  const availableDepartmentOptions = normalizedNewUserDesignation === 'hod'
    ? ['admin', 'dean', 'principal'].includes(currentUserRole)
      ? availableHodDepartments
      : allDepartmentOptions
    : allDepartmentOptions;

  useEffect(() => {
    if (!allowedDesignationOptions.length) return;
    if (!allowedDesignationOptions.includes(newUserDesignation)) {
      setNewUserDesignation(allowedDesignationOptions[0]);
    }
  }, [allowedDesignationOptions, newUserDesignation]);

  useEffect(() => {
    if (!availableDepartmentOptions.length) return;
    if (!availableDepartmentOptions.includes(newUserDept)) {
      setNewUserDept(availableDepartmentOptions[0]);
    }
  }, [availableDepartmentOptions, newUserDept]);

  // -------------------------------------------------------------------
  // Add staff
  // -------------------------------------------------------------------
  const handleCreateStaff = async () => {
    if (!appUser) {
      setStatusMsg({ type: 'error', text: 'Login required to create users.' });
      return;
    }

    if (!allowedDesignationOptions.includes(newUserDesignation)) {
      setStatusMsg({ type: 'error', text: 'You are not allowed to create this role.' });
      return;
    }

    if (
      !newUserFirstName ||
      !newUserLastName ||
      !newUserUser ||
      !newUserEmail ||
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
      const normalizedUsername = newUserUser.trim().toLowerCase();
      const normalizedEmail = newUserEmail.trim().toLowerCase();
      const designationLabel = newUserDesignation.trim();
      const roleToSave = designationLabel.toLowerCase();
      const needsDepartment = !['dean', 'principal'].includes(roleToSave);
      const departmentToSave = needsDepartment
        ? (currentUserRole === 'hod' ? currentUserDepartment : normalizedNewUserDept)
        : '';

      if (needsDepartment && !departmentToSave) {
        setStatusMsg({ type: 'error', text: 'Select a department.' });
        return;
      }

      if (currentUserRole === 'hod' && departmentToSave !== currentUserDepartment) {
        setStatusMsg({ type: 'error', text: 'HOD can create faculty only for their own branch.' });
        return;
      }

      const existingUsername = staffUsers.find(
        (user) => (user?.username || '').trim().toLowerCase() === normalizedUsername
      );
      if (existingUsername) {
        setStatusMsg({ type: 'error', text: 'This username already exists. Use a different username.' });
        return;
      }

      const existingEmail = staffUsers.find(
        (user) => (user?.email || '').trim().toLowerCase() === normalizedEmail
      );
      if (existingEmail) {
        setStatusMsg({ type: 'error', text: 'This email already exists. Use a different email.' });
        return;
      }

      if (roleToSave === 'principal') {
        const principalExists = staffUsers.some(
          (user) => (user?.role || '').trim().toLowerCase() === 'principal'
        );
        if (principalExists) {
          setStatusMsg({ type: 'error', text: 'Principal account already exists. Cannot create another principal.' });
          return;
        }
      }

      if (roleToSave === 'dean') {
        const deanExists = staffUsers.some(
          (user) => (user?.role || '').trim().toLowerCase() === 'dean'
        );
        if (deanExists) {
          setStatusMsg({ type: 'error', text: 'Dean account already exists. Cannot create another dean.' });
          return;
        }
      }

      if (roleToSave === 'hod') {
        const existingHod = staffUsers.find((user) => (
          (user?.role || '').trim().toLowerCase() === 'hod'
          && ((user?.department || '').trim().toUpperCase() === departmentToSave)
        ));
        if (existingHod) {
          setStatusMsg({ type: 'error', text: `${departmentToSave} HOD already exists. Cannot create another HOD for this branch.` });
          return;
        }
      }

      const hashed = await hashPassword(newUserPass);

      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'app_users'), {
        username: normalizedUsername,
        password: hashed,
        role: roleToSave,
        name: fullName,
        department: departmentToSave,
        designation: designationLabel,
        email: normalizedEmail,
        active: true,
        status: 'active',
        createdBy: appUser?.username,
        createdAt: serverTimestamp()
      });

      setStatusMsg({ type: 'success', text: `${designationLabel} account for ${fullName} created successfully.` });

      setNewUserFirstName('');
      setNewUserLastName('');
      setNewUserUser('');
      setNewUserEmail('');
      setNewUserDept(currentUserRole === 'hod' ? currentUserDepartment : 'CSE');
      setNewUserDesignation(allowedDesignationOptions[0] || 'Faculty');
      setNewUserPass('');
      setNewUserConfirmPass('');
      setManageUsersTab('list');
    } catch (err) {
      console.error(err);
      setStatusMsg({ type: 'error', text: "Failed to create staff" });
    }
  };

  const handleToggleUserStatus = async (user) => {
    if (currentUserRole !== 'admin' || !user?.id) {
      setStatusMsg({ type: 'error', text: 'Only admin can activate or deactivate users.' });
      return;
    }

    if (user.id === appUser?.id) {
      setStatusMsg({ type: 'error', text: 'You cannot deactivate your own account.' });
      return;
    }

    const currentlyActive = user?.active !== false && (user?.status || 'active').toLowerCase() !== 'inactive';
    const nextActive = !currentlyActive;

    try {
      await updateDoc(
        doc(db, 'artifacts', appId, 'public', 'data', 'app_users', user.id),
        {
          active: nextActive,
          status: nextActive ? 'active' : 'inactive',
          updatedAt: serverTimestamp(),
          updatedBy: appUser?.username || 'admin'
        }
      );
      setStatusMsg({
        type: 'success',
        text: `${user.name || user.username} ${nextActive ? 'activated' : 'deactivated'} successfully.`
      });
    } catch (error) {
      console.error('toggle user status error', error);
      setStatusMsg({ type: 'error', text: 'Failed to update user status.' });
    }
  };

  const handleRemoveUser = async (user) => {
    if (currentUserRole !== 'admin' || !user?.id) {
      setStatusMsg({ type: 'error', text: 'Only admin can remove users.' });
      return;
    }

    if (user.id === appUser?.id) {
      setStatusMsg({ type: 'error', text: 'You cannot remove your own account.' });
      return;
    }

    try {
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'app_users', user.id));
      setStatusMsg({ type: 'success', text: `${user.name || user.username} removed successfully.` });
    } catch (error) {
      console.error('remove user error', error);
      setStatusMsg({ type: 'error', text: 'Failed to remove user.' });
    }
  };

  // -------------------------------------------------------------------
  // Profile edit handlers
  // -------------------------------------------------------------------
  const handleProfilePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        const size = Math.min(image.width, image.height);
        const sx = Math.max(0, (image.width - size) / 2);
        const sy = Math.max(0, (image.height - size) / 2);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) return;

        canvas.width = size;
        canvas.height = size;
        ctx.drawImage(image, sx, sy, size, size, 0, 0, size, size);
        setProfilePhotoPreview(canvas.toDataURL('image/jpeg', 0.9));
        setProfileEditMode(true);
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleOpenProfilePhotoActions = () => {
    setProfileEditMode(true);
    setShowProfilePhotoActions(true);
  };

  const handleRemoveProfilePhoto = () => {
    setProfileEditMode(true);
    setProfilePhotoPreview(null);
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
      updateData.photo = profilePhotoPreview || '';

      await updateDoc(userRef, updateData);
      setAppUser(prev => prev ? { ...prev, ...updateData } : prev);
      setStatusMsg({ type: 'success', text: 'Profile updated successfully' });
      setProfileEditMode(false);
      setShowProfilePhotoActions(false);
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
    setShowProfilePhotoActions(false);
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
        <h2 className="text-2xl font-bold">DRKIST</h2>
      </div>
    );
  }

  // If not logged in and not reset flow, show login
  if (!appUser && !studentUser && !forgotPasswordMode) {
    if (portalMode === 'student' && studentSelfRegisterMode) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
          <div className="mx-auto max-w-5xl">
            <div className="mb-6 flex flex-col items-center">
              <img src="/logos/login-logo.png" alt="Login Logo" className="mb-5 h-32 w-56 object-contain sm:h-36 sm:w-64" />
              <h2 className="text-center text-xl font-bold text-slate-800">Student Registration</h2>
              <p className="mt-2 text-sm text-slate-500">Submit your profile. Your branch HOD must approve it before you can login.</p>
            </div>

            <Message statusMsg={statusMsg} setStatusMsg={setStatusMsg} />

            <RegistrationScreen
              regMode={regMode}
              setRegMode={(mode) => {
                setRegMode(mode);
                setRegistrationMessage(null);
              }}
              regName={regName}
              setRegName={(value) => {
                setRegName(value);
                if (registrationMessage) setRegistrationMessage(null);
              }}
              regId={regId}
              setRegId={(value) => {
                setRegId(value);
                if (registrationMessage) setRegistrationMessage(null);
              }}
              regBranch={regBranch}
              setRegBranch={(value) => {
                setRegBranch(value);
                if (registrationMessage) setRegistrationMessage(null);
              }}
              regYear={regYear}
              setRegYear={(value) => {
                setRegYear(value);
                if (registrationMessage) setRegistrationMessage(null);
              }}
              regPhone={regPhone}
              setRegPhone={(value) => {
                setRegPhone(value);
                if (registrationMessage) setRegistrationMessage(null);
              }}
              regEmail={regEmail}
              setRegEmail={(value) => {
                setRegEmail(value);
                if (registrationMessage) setRegistrationMessage(null);
              }}
              uploadedImgSrc={uploadedImgSrc}
              videoRef={videoRef}
              imgRef={imgRef}
              loading={loading}
              handleCheckAndRegister={handleCheckAndRegister}
              handleFileChange={handleFileChange}
              toggleCameraFacing={toggleCameraFacing}
              handleBack={handleStudentRegistrationBack}
              registrationEditStudent={null}
              handleSaveStudentEdits={handleSaveStudentEdits}
              registrationMessage={registrationMessage}
              duplicateRollNoMessage={duplicateRollNoMessage}
              clearRegistrationMessage={() => setRegistrationMessage(null)}
            />
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-start justify-start p-6">
        <div className="w-full max-w-md mx-auto">
          <div className="flex flex-col items-center mb-6">
            <img src="/logos/login-logo.png" alt="Login Logo" className="h-33 w-41 object-contain mb-5" />
            <h2 className="text-center text-xl font-bold text-slate-800">
              {portalMode === 'faculty' ? 'Faculty Portal' : 'Student Portal'}
            </h2>
          </div>

          <Message statusMsg={statusMsg} setStatusMsg={setStatusMsg} />

          <div className="mb-4 grid grid-cols-2 gap-2 rounded-2xl bg-white p-2 shadow-sm">
            <button
              type="button"
              onClick={() => {
                setPortalMode('faculty');
                setStatusMsg(null);
              }}
              className={`rounded-xl px-4 py-3 text-sm font-semibold transition ${
                portalMode === 'faculty' ? 'bg-red-800 text-white' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              Faculty
            </button>
            <button
              type="button"
              onClick={() => {
                setPortalMode('student');
                setStatusMsg(null);
              }}
              className={`rounded-xl px-4 py-3 text-sm font-semibold transition ${
                portalMode === 'student' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              Student
            </button>
          </div>

          <div className="space-y-4">
            {portalMode === 'faculty' ? (
              <div>
                <input
                  type="text"
                  className="w-full p-4 border rounded-xl text-sm"
                  placeholder="Username"
                  value={loginUser}
                  onChange={e => setLoginUser(e.target.value.toLowerCase())}
                />
              </div>
            ) : (
              <div>
                <input
                  type="text"
                  maxLength={10}
                  className="w-full p-4 border rounded-xl text-sm uppercase"
                  placeholder="Roll No"
                  value={studentLoginRollNo}
                  onChange={e => setStudentLoginRollNo(e.target.value.toUpperCase().replace(/[^0-9A-Z]/g, ''))}
                />
              </div>
            )}
            {portalMode === 'faculty' && (
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
            )}

            {portalMode === 'faculty' ? (
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
            ) : (
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-sm text-slate-600">
                  <input
                    type="checkbox"
                    checked={studentRememberMe}
                    onChange={e => setStudentRememberMe(e.target.checked)}
                  />
                  <span>Remember Me</span>
                </label>
                <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
                  If your roll number already exists and is approved, you will login directly. If not, your student registration form will open.
                </div>
              </div>
            )}

            <button
              onClick={portalMode === 'faculty' ? handleLogin : handleStudentLogin}
              disabled={loading}
              className={`w-full py-4 rounded-xl font-bold mt-3 text-white ${portalMode === 'faculty' ? 'bg-red-800' : 'bg-slate-900'}`}
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
          <Message statusMsg={statusMsg} setStatusMsg={setStatusMsg} />

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

  if (studentUser) {
    return (
      <div className="min-h-screen bg-slate-50 pb-10">
        <Message statusMsg={statusMsg} setStatusMsg={setStatusMsg} />
        <IDCardModal idCardData={idCardData} onClose={() => setIdCardData(null)} />

        <main className="mx-auto max-w-6xl p-4 sm:p-6">
          {view === 'register' ? (
            <RegistrationScreen
              regMode={regMode}
              setRegMode={(mode) => {
                setRegMode(mode);
                setRegistrationMessage(null);
              }}
              regName={regName}
              setRegName={(value) => {
                setRegName(value);
                if (registrationMessage) setRegistrationMessage(null);
              }}
              regId={regId}
              setRegId={(value) => {
                setRegId(value);
                if (registrationMessage) setRegistrationMessage(null);
              }}
              regBranch={regBranch}
              setRegBranch={(value) => {
                setRegBranch(value);
                if (registrationMessage) setRegistrationMessage(null);
              }}
              regYear={regYear}
              setRegYear={(value) => {
                setRegYear(value);
                if (registrationMessage) setRegistrationMessage(null);
              }}
              regPhone={regPhone}
              setRegPhone={(value) => {
                setRegPhone(value);
                if (registrationMessage) setRegistrationMessage(null);
              }}
              regEmail={regEmail}
              setRegEmail={(value) => {
                setRegEmail(value);
                if (registrationMessage) setRegistrationMessage(null);
              }}
              uploadedImgSrc={uploadedImgSrc}
              videoRef={videoRef}
              imgRef={imgRef}
              loading={loading}
              handleCheckAndRegister={handleCheckAndRegister}
              handleFileChange={handleFileChange}
              toggleCameraFacing={toggleCameraFacing}
              handleBack={() => setView('student_home')}
              registrationEditStudent={registrationEditStudent}
              handleSaveStudentEdits={handleSaveStudentEdits}
              registrationMessage={registrationMessage}
              duplicateRollNoMessage={duplicateRollNoMessage}
              clearRegistrationMessage={() => setRegistrationMessage(null)}
            />
          ) : view === 'student_history' ? (
            <StudentHistoryScreen
              student={studentUser}
              attendanceSummary={studentPortalSummary}
              loading={studentPortalLoading}
              onBack={() => setView('student_home')}
            />
          ) : (
            <StudentDashboardScreen
              student={studentUser}
              attendanceSummary={studentPortalSummary}
              loading={studentPortalLoading}
              onOpenHistory={() => setView('student_history')}
              onOpenIdCard={() => setIdCardData(studentUser)}
              onEditProfile={handleStudentSelfEdit}
              onLogout={handleLogout}
            />
          )}
        </main>
      </div>
    );
  }

  // ---------- LOGGED-IN VIEW ----------
  return (
    <div className="app-shell min-h-screen bg-slate-50 pb-8">
      {view !== 'history' && view !== 'register' && <Message statusMsg={statusMsg} setStatusMsg={setStatusMsg} />}
      
      {/* MODALS */}
      <SendReportModal showModal={showSendResultModal} result={sendReportResult} onClose={() => setShowSendResultModal(false)} />
      <IDCardModal idCardData={idCardData} onClose={() => setIdCardData(null)} />
      <OverwriteModal showModal={overwriteModal !== null} data={overwriteModal} onConfirm={(d) => { setOverwriteModal(null); performRegistration(d.newData, d.docId); }} onCancel={() => setOverwriteModal(null)} />

      <UnidentifiedFaceModal
        isOpen={unidentifiedFaceModal !== null}
        onClose={handleSkipUnknownFace}
        onEndSession={handleEndSession}
        facePhoto={unidentifiedFaceModal?.facePhoto}
        onRegister={unidentifiedFaceModal?.onRegister}
      />
      <AlreadyPresentModal
        detail={alreadyPresentModal}
        onClose={() => setAlreadyPresentModal(null)}
      />

      {/* HEADER */}
      <Header appUser={appUser} todayCount={todayCount} onMenuClick={() => setIsNavOpen(true)} />

      {/* MAIN */}
      <main className="max-w-6xl mx-auto p-3 sm:p-4">
        {/* HOME / DASHBOARD */}
        {view === 'home' && (
          <DashboardScreen
            appUser={appUser}
            students={students}
            setView={navigateToView}
            handleDashboardStartAttendance={handleDashboardStartAttendance}
            promoteYear={promoteYear}
            setPromoteYear={setPromoteYear}
            handlePromoteYears={handlePromoteYears}
            handleOpenBranchStudents={handleOpenBranchStudents}
            handleOpenApprovalQueue={handleOpenApprovalQueue}
            pendingApprovalCount={pendingStudentApprovals.length}
          />
        )}

        {/* REGISTER */}
        {view === 'register' && (
          <RegistrationScreen
            regMode={regMode}
            setRegMode={(mode) => {
              setRegMode(mode);
              setRegistrationMessage(null);
            }}
            regName={regName}
            setRegName={(value) => {
              setRegName(value);
              if (registrationMessage) setRegistrationMessage(null);
            }}
            regId={regId}
            setRegId={(value) => {
              setRegId(value);
              if (registrationMessage) setRegistrationMessage(null);
            }}
            regBranch={regBranch}
            setRegBranch={(value) => {
              setRegBranch(value);
              if (registrationMessage) setRegistrationMessage(null);
            }}
            regYear={regYear}
            setRegYear={(value) => {
              setRegYear(value);
              if (registrationMessage) setRegistrationMessage(null);
            }}
            regPhone={regPhone}
            setRegPhone={(value) => {
              setRegPhone(value);
              if (registrationMessage) setRegistrationMessage(null);
            }}
            regEmail={regEmail}
            setRegEmail={(value) => {
              setRegEmail(value);
              if (registrationMessage) setRegistrationMessage(null);
            }}
            uploadedImgSrc={uploadedImgSrc}
            videoRef={videoRef}
            imgRef={imgRef}
            loading={loading}
            handleCheckAndRegister={handleCheckAndRegister}
            handleFileChange={handleFileChange}
            toggleCameraFacing={toggleCameraFacing}
            handleBack={handleRegistrationBack}
            registrationEditStudent={registrationEditStudent}
            handleSaveStudentEdits={handleSaveStudentEdits}
            registrationMessage={registrationMessage}
            duplicateRollNoMessage={duplicateRollNoMessage}
            clearRegistrationMessage={() => setRegistrationMessage(null)}
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
            loading={loading}
            handleBack={() => navigateToView('home')}
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
            handleBack={() => navigateToView('home')}
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
            handleBack={() => navigateToView('home')}
          />
        )}

        {view === 'student_browser' && (
          <StudentBrowserScreen
            databaseBrowseYear={databaseBrowseYear}
            setDatabaseBrowseYear={setDatabaseBrowseYear}
            databaseBrowseBranch={databaseBrowseBranch}
            setDatabaseBrowseBranch={setDatabaseBrowseBranch}
            branchOptions={browserBranchOptions}
            databaseBrowseResults={databaseBrowseResults}
            handleRejectStudent={handleRejectStudent}
            handleApproveStudent={handleApproveStudent}
            canApproveStudentProfile={canApproveStudentProfile}
            showApprovalQueueOnly={showApprovalQueueOnly}
            handleBack={() => navigateToView('home')}
          />
        )}

        {/* HISTORY (student attendance by date) */}
        {view === 'history' && (
          <HistoryScreen
            historyLoading={historyLoading}
            historyRollNo={historyRollNo}
            setHistoryRollNo={(value) => {
              setHistoryRollNo(value);
              if (historyError) setHistoryError('');
            }}
            historyStudentResult={historyStudentResult}
            historyError={historyError}
            handleHistoryStudentSearch={handleHistoryStudentSearch}
            setView={navigateToView}
          />
        )}

        {/* PROFILE */}
        {view === 'profile' && (
          <ProfileScreen
            appUser={appUser}
            profileEditMode={profileEditMode}
            profileEmail={profileEmail}
            setProfileEmail={setProfileEmail}
            profilePhone={profilePhone}
            setProfilePhone={setProfilePhone}
            profileDept={profileDept}
            setProfileDept={setProfileDept}
            profilePhotoPreview={profilePhotoPreview}
            handleProfilePhotoChange={handleProfilePhotoChange}
            handleOpenProfilePhotoActions={handleOpenProfilePhotoActions}
            showProfilePhotoActions={showProfilePhotoActions}
            setShowProfilePhotoActions={setShowProfilePhotoActions}
            handleRemoveProfilePhoto={handleRemoveProfilePhoto}
            handleSaveProfile={handleSaveProfile}
            handleCancelProfileEdit={handleCancelProfileEdit}
            handleBack={() => navigateToView('home')}
          />
        )}

        {/* MANAGE USERS */}
        {view === 'manage_users' && (
          <ManageUsersScreen
            appUser={appUser}
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
            manageUsersTab={manageUsersTab}
            setManageUsersTab={setManageUsersTab}
            allowedDesignationOptions={allowedDesignationOptions}
            availableDepartmentOptions={availableDepartmentOptions}
            visibleManagedUsers={visibleManagedUsers}
            handleToggleUserStatus={handleToggleUserStatus}
            handleRemoveUser={handleRemoveUser}
            handleCreateStaff={handleCreateStaff}
            setView={navigateToView}
          />
        )}
      </main>

      <div className="pointer-events-none px-4 pb-4 text-center text-xs text-slate-400 select-none">
        Developed by <span className="font-semibold text-slate-500">Shanmuk Patnala</span> | 22N71A6655 | CSE-AIML
      </div>

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

      <BottomNav
        view={view}
        setView={navigateToView}
        isOpen={isNavOpen}
        setIsOpen={setIsNavOpen}
        canManageUsers={['admin', 'principal', 'dean', 'hod'].includes((appUser?.role || '').toLowerCase())}
        appUser={appUser}
        handleLogout={handleLogout}
      />
    </div>
  );
}
