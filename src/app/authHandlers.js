import emailjs from '@emailjs/browser';
import { hashPassword } from '../utils/helpers';
import { collection, query, where, getDocs, addDoc, updateDoc, doc, serverTimestamp, db } from '../utils/firebase';
import { appId } from '../utils/firebase';
import { EMAILJS_PUBLIC_KEY, EMAILJS_SERVICE_ID } from './constants';

export const performLogin = async ({ username, password, rememberFlag, setStatusMsg, setLoading, setAppUser, setView, setLoginUser, setLoginPass }) => {
  if (!username || !password) {
    setStatusMsg({ type: 'error', text: "Enter username and password" });
    return;
  }
  setLoading(true);
  try {
    const hashed = await hashPassword(password);

    let qHashed = query(
      collection(db, 'artifacts', appId, 'public', 'data', 'app_users'),
      where('username', '==', username.toLowerCase()),
      where('password', '==', hashed)
    );
    let snap = await getDocs(qHashed);

    if (snap.empty) {
      const qPlain = query(
        collection(db, 'artifacts', appId, 'public', 'data', 'app_users'),
        where('username', '==', username.toLowerCase()),
        where('password', '==', password)
      );
      snap = await getDocs(qPlain);
    }

    if (snap.empty) {
      setStatusMsg({ type: 'error', text: "Invalid credentials" });
    } else {
      const data = snap.docs[0].data();
      setAppUser({ ...data, id: snap.docs[0].id });
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
    console.error(e);
    setStatusMsg({ type: 'error', text: "Login failed" });
  }
  setLoading(false);
};

export const verifyResetToken = async ({ token, setResetTokenStatus, setResetUserDocId, setResetDocId }) => {
  setResetTokenStatus('checking');
  try {
    const qReset = query(
      collection(undefined, "artifacts", appId, "public", "data", "password_resets"),
      where("token", "==", token),
      where("used", "==", false)
    );
    const snap = await getDocs(qReset);
    if (snap.empty) {
      setResetTokenStatus("invalid");
      return;
    }
    const docSnap = snap.docs[0];
    const data = docSnap.data();
    setResetTokenStatus("valid");
    setResetUserDocId(data.userDocId);
    setResetDocId(docSnap.id);
  } catch (error) {
    console.error(error);
    setResetTokenStatus("invalid");
  }
};

export const handleSendResetLink = async ({ fpUser, setStatusMsg, setLoading }) => {
  if (!fpUser) {
    setStatusMsg({ type: "error", text: "Please enter username" });
    return;
  }

  setLoading(true);
  try {
    const qUser = query(
      collection(undefined, "artifacts", appId, "public", "data", "app_users"),
      where("username", "==", fpUser.toLowerCase())
    );
    const snap = await getDocs(qUser);
    if (snap.empty) {
      setStatusMsg({ type: "error", text: "Username not found" });
      setLoading(false);
      return;
    }

    const userDoc = snap.docs[0];
    const userData = userDoc.data();

    if (!userData.email) {
      setStatusMsg({ type: "error", text: "No email stored for this user" });
      setLoading(false);
      return;
    }

    const token = Math.random().toString(36).slice(2) + Date.now().toString(36);
    const resetLink = `${window.location.origin}?reset=${token}`;

    await addDoc(
      collection(undefined, "artifacts", appId, "public", "data", "password_resets"),
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
      "template_4hmf0cp",
      {
        to_email: userData.email,
        to_name: userData.name || userData.username,
        reset_link: resetLink,
      },
      EMAILJS_PUBLIC_KEY
    );

    setStatusMsg({
      type: "success",
      text: `Reset link sent to ${userData.email}. Please check inbox or spam.`
    });
  } catch (error) {
    console.error("EmailJS error:", error);
    setStatusMsg({
      type: "error",
      text: "Failed to send reset link. Check EmailJS config."
    });
  }
  setLoading(false);
};

export const handleChangePassword = async ({ fpNewPass, resetUserDocId, resetDocId, setStatusMsg, setLoading, setForgotPasswordMode, setFpStep, setFpUser, setFpNewPass, setResetTokenStatus }) => {
  if (fpNewPass.length < 8) {
    setStatusMsg({ type: "error", text: "Password must be at least 8 characters." });
    return;
  }
  if (!resetUserDocId || !resetDocId) {
    setStatusMsg({ type: "error", text: "Invalid reset link." });
    return;
  }

  setLoading(true);
  try {
    const hashed = await hashPassword(fpNewPass);

    const userRef = doc(undefined, "artifacts", appId, "public", "data", "app_users", resetUserDocId);
    await updateDoc(userRef, { password: hashed });

    const resetRef = doc(undefined, "artifacts", appId, "public", "data", "password_resets", resetDocId);
    await updateDoc(resetRef, { used: true });

    setStatusMsg({ type: 'success', text: "Password changed successfully! Please login." });

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
    setStatusMsg({ type: "error", text: "Failed to update password." });
  }
  setLoading(false);
};
