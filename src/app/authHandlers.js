import emailjs from '@emailjs/browser';
import { hashPassword, isValidRollNo, sanitizeRollNoInput } from '../utils/helpers';
import { collection, query, where, getDocs, addDoc, updateDoc, doc, getDoc, setDoc, serverTimestamp, db } from '../utils/firebase';
import { appId } from '../utils/firebase';
import { EMAILJS_PUBLIC_KEY, EMAILJS_SERVICE_ID } from './constants';

const DEFAULT_ADMIN_DOC_ID = 'default_admin_account';
const DEFAULT_ADMIN_USERNAME = 'admin';
const DEFAULT_ADMIN_PASSWORD = 'Drk@2004';

const isUserActive = (user) => (
  user?.active !== false && (user?.status || 'active').toLowerCase() !== 'inactive'
);

const isProtectedAdminAccount = (user, username) => {
  const normalizedUsername = (user?.username || username || '').trim().toLowerCase();
  const normalizedRole = (user?.role || '').trim().toLowerCase();
  return normalizedUsername === DEFAULT_ADMIN_USERNAME || normalizedRole === 'admin';
};

const getDefaultAdminPayload = async () => ({
  username: DEFAULT_ADMIN_USERNAME,
  password: await hashPassword(DEFAULT_ADMIN_PASSWORD),
  role: 'admin',
  designation: 'Admin',
  department: '',
  name: 'Admin',
  email: '',
  active: true,
  status: 'active',
  createdBy: 'system-bootstrap',
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
  updatedBy: 'system-bootstrap'
});

export const ensureDefaultAdminAccount = async () => {
  const payload = await getDefaultAdminPayload();
  await setDoc(
    doc(db, 'artifacts', appId, 'public', 'data', 'app_users', DEFAULT_ADMIN_DOC_ID),
    payload,
    { merge: true }
  );

  return {
    id: DEFAULT_ADMIN_DOC_ID,
    ...payload,
    password: DEFAULT_ADMIN_PASSWORD
  };
};

export const performLogin = async ({ username, password, rememberFlag, setStatusMsg, setLoading, setAppUser, setView, setLoginUser, setLoginPass }) => {
  if (!username || !password) {
    setStatusMsg({ type: 'error', text: 'Enter username and password' });
    return;
  }

  setLoading(true);
  try {
    console.log('[LOGIN] ===== LOGIN ATTEMPT =====');
    console.log(`[LOGIN] Username: ${username}`);
    console.log(`[LOGIN] Device: ${navigator.userAgent}`);
    console.log(`[LOGIN] Online: ${navigator.onLine}`);

    const hashed = await hashPassword(password);
    console.log('[LOGIN] Password hashed');

    let qHashed = query(
      collection(db, 'artifacts', appId, 'public', 'data', 'app_users'),
      where('username', '==', username.toLowerCase()),
      where('password', '==', hashed)
    );
    let snap = await getDocs(qHashed);
    console.log(`[LOGIN] Hashed lookup found ${snap.size} users`);

    if (snap.empty) {
      console.log('[LOGIN] Trying plain text password...');
      const qPlain = query(
        collection(db, 'artifacts', appId, 'public', 'data', 'app_users'),
        where('username', '==', username.toLowerCase()),
        where('password', '==', password)
      );
      snap = await getDocs(qPlain);
      console.log(`[LOGIN] Plain-text lookup found ${snap.size} users`);
    }

    if (snap.empty) {
      const normalizedUsername = username.trim().toLowerCase();
      if (normalizedUsername === DEFAULT_ADMIN_USERNAME && password === DEFAULT_ADMIN_PASSWORD) {
        const defaultAdmin = await ensureDefaultAdminAccount();
        console.warn(`[LOGIN] Bootstrapped default admin account: ${defaultAdmin.id}`);
        setAppUser(defaultAdmin);
        setStatusMsg(null);
        setView('home');

        if (rememberFlag) {
          localStorage.setItem('drkAttendanceRemember', JSON.stringify({
            username: DEFAULT_ADMIN_USERNAME,
            password: DEFAULT_ADMIN_PASSWORD,
            remember: true
          }));
        } else {
          localStorage.removeItem('drkAttendanceRemember');
        }

        setLoading(false);
        return;
      }

      console.warn(`[LOGIN] User not found with username: "${username}"`);
      setStatusMsg({ type: 'error', text: 'Invalid username or password' });
    } else {
      const matchingUsers = snap.docs.map((item) => ({
        id: item.id,
        ...item.data()
      }));
      const selectedUser = matchingUsers.find(isUserActive) || matchingUsers[0];

      if (!isUserActive(selectedUser)) {
        if (isProtectedAdminAccount(selectedUser, username) && selectedUser?.id) {
          await updateDoc(
            doc(db, 'artifacts', appId, 'public', 'data', 'app_users', selectedUser.id),
            {
              active: true,
              status: 'active',
              department: '',
              role: 'admin',
              designation: 'Admin',
              updatedAt: serverTimestamp(),
              updatedBy: 'system-auto-reactivate'
            }
          );
          selectedUser.active = true;
          selectedUser.status = 'active';
          selectedUser.department = '';
          selectedUser.role = 'admin';
          selectedUser.designation = 'Admin';
          console.warn(`[LOGIN] Reactivated protected admin account: ${selectedUser.id}`);
        } else {
          setStatusMsg({ type: 'error', text: 'This account is deactivated. Contact admin.' });
          setLoading(false);
          return;
        }
      }

      console.log(`[LOGIN] LOGIN SUCCESS! User: ${selectedUser.name || username}`);
      if (matchingUsers.length > 1) {
        console.warn(`[LOGIN] Multiple matching user records found for "${username}". Using active record: ${selectedUser.id}`);
      }
      setAppUser(selectedUser);
      setStatusMsg(null);
      setView('home');

      if (rememberFlag) {
        localStorage.setItem('drkAttendanceRemember', JSON.stringify({
          username: username.toLowerCase(),
          password,
          remember: true
        }));
      } else {
        localStorage.removeItem('drkAttendanceRemember');
      }
    }
  } catch (e) {
    console.error('[LOGIN] EXCEPTION', e);

    let errorMsg = 'Login error';
    if (!navigator.onLine) {
      errorMsg = 'No internet - check WiFi';
    } else if (e.code === 'permission-denied') {
      errorMsg = 'Access denied - ask admin to check Firestore rules';
    } else if (e.code === 'unauthenticated') {
      errorMsg = 'Auth failed - refresh page and try again';
    } else if (e.message?.includes('network')) {
      errorMsg = 'Network error - check connection';
    } else {
      errorMsg = e.message || 'Unknown error';
    }

    setStatusMsg({ type: 'error', text: errorMsg });
  }
  setLoading(false);
};

export const performStudentLogin = async ({ rollNo, setStatusMsg, setLoading, setStudentUser, setStudentView }) => {
  const normalizedRollNo = sanitizeRollNoInput(rollNo || '');

  if (!normalizedRollNo) {
    setStatusMsg({ type: 'error', text: 'Enter roll number' });
    return false;
  }

  if (!isValidRollNo(normalizedRollNo)) {
    setStatusMsg({ type: 'error', text: 'Invalid Roll No. Use 22N71A6655.' });
    return false;
  }

  setLoading(true);
  try {
    const studentRef = doc(db, 'artifacts', appId, 'public', 'data', 'students', normalizedRollNo);
    const studentSnap = await getDoc(studentRef);

    if (!studentSnap.exists()) {
      setStatusMsg({ type: 'error', text: 'Student not found' });
      return false;
    }

    const studentData = studentSnap.data();
    if (studentData?.approved === false || (studentData?.approvalStatus || '').toLowerCase() === 'pending') {
      setStatusMsg({ type: 'warning', text: 'Your profile is waiting for branch HOD approval.' });
      return false;
    }

    setStudentUser({
      id: studentSnap.id,
      ...studentData,
      studentId: studentData?.studentId || normalizedRollNo
    });
    setStudentView('student_home');
    setStatusMsg(null);
    return true;
  } catch (error) {
    console.error('[STUDENT LOGIN] error', error);
    setStatusMsg({ type: 'error', text: error?.message || 'Student login failed' });
    return false;
  } finally {
    setLoading(false);
  }
};

export const verifyResetToken = async ({ token, setResetTokenStatus, setResetUserDocId, setResetDocId }) => {
  setResetTokenStatus('checking');
  try {
    const qReset = query(
      collection(db, 'artifacts', appId, 'public', 'data', 'password_resets'),
      where('token', '==', token),
      where('used', '==', false)
    );
    const snap = await getDocs(qReset);
    if (snap.empty) {
      setResetTokenStatus('invalid');
      return;
    }
    const docSnap = snap.docs[0];
    const data = docSnap.data();
    setResetTokenStatus('valid');
    setResetUserDocId(data.userDocId);
    setResetDocId(docSnap.id);
  } catch (error) {
    console.error(error);
    setResetTokenStatus('invalid');
  }
};

export const handleSendResetLink = async ({ fpUser, setStatusMsg, setLoading }) => {
  if (!fpUser) {
    setStatusMsg({ type: 'error', text: 'Please enter username' });
    return;
  }

  setLoading(true);
  try {
    const qUser = query(
      collection(db, 'artifacts', appId, 'public', 'data', 'app_users'),
      where('username', '==', fpUser.toLowerCase())
    );
    const snap = await getDocs(qUser);
    if (snap.empty) {
      setStatusMsg({ type: 'error', text: 'Username not found' });
      setLoading(false);
      return;
    }

    const userDoc = snap.docs[0];
    const userData = userDoc.data();

    if (!userData.email) {
      setStatusMsg({ type: 'error', text: 'No email stored for this user' });
      setLoading(false);
      return;
    }

    const token = Math.random().toString(36).slice(2) + Date.now().toString(36);
    const resetLink = `${window.location.origin}?reset=${token}`;

    await addDoc(
      collection(db, 'artifacts', appId, 'public', 'data', 'password_resets'),
      {
        username: userData.username,
        email: userData.email,
        userDocId: userDoc.id,
        token,
        used: false,
        createdAt: serverTimestamp(),
      }
    );

    await emailjs.send(
      EMAILJS_SERVICE_ID,
      'template_4hmf0cp',
      {
        to_email: userData.email,
        to_name: userData.name || userData.username,
        reset_link: resetLink,
      },
      EMAILJS_PUBLIC_KEY
    );

    setStatusMsg({
      type: 'success',
      text: `Reset link sent to ${userData.email}. Please check inbox or spam.`
    });
  } catch (error) {
    console.error('EmailJS error:', error);
    setStatusMsg({
      type: 'error',
      text: 'Failed to send reset link. Check EmailJS config.'
    });
  }
  setLoading(false);
};

export const handleChangePassword = async ({ fpNewPass, resetUserDocId, resetDocId, setStatusMsg, setLoading, setForgotPasswordMode, setFpStep, setFpUser, setFpNewPass, setResetTokenStatus }) => {
  if (fpNewPass.length < 8) {
    setStatusMsg({ type: 'error', text: 'Password must be at least 8 characters.' });
    return;
  }
  if (!resetUserDocId || !resetDocId) {
    setStatusMsg({ type: 'error', text: 'Invalid reset link.' });
    return;
  }

  setLoading(true);
  try {
    const hashed = await hashPassword(fpNewPass);

    const userRef = doc(db, 'artifacts', appId, 'public', 'data', 'app_users', resetUserDocId);
    await updateDoc(userRef, { password: hashed });

    const resetRef = doc(db, 'artifacts', appId, 'public', 'data', 'password_resets', resetDocId);
    await updateDoc(resetRef, { used: true });

    setStatusMsg({ type: 'success', text: 'Password changed successfully! Please login.' });

    window.history.replaceState({}, document.title, window.location.pathname);

    setTimeout(() => {
      setForgotPasswordMode(false);
      setFpStep(1);
      setFpUser('');
      setFpNewPass('');
      setResetTokenStatus('idle');
    }, 1500);
  } catch (error) {
    console.error(error);
    setStatusMsg({ type: 'error', text: 'Failed to update password.' });
  }
  setLoading(false);
};
