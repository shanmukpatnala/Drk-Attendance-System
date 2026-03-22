import { collection, addDoc, setDoc, doc, serverTimestamp } from '../utils/firebase';
import { appId } from './constants';

export const handleFileChange = ({ e, setUploadedImgSrc }) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => setUploadedImgSrc(reader.result);
  reader.readAsDataURL(file);
};

export const handleProceedToCamera = ({ regName, regId, regPhone, regEmail, setStatusMsg, setRegStep }) => {
  if (!regName || !regId || !regPhone || !regEmail) {
    setStatusMsg({ type: 'error', text: "Please fill all fields" });
    return;
  }
  if (!/^\d{2}[A-Z]\d{2}[A-Z]\d{4}$/.test(regId) || !/^\d{10}$/.test(regPhone)) {
    setStatusMsg({ type: 'error', text: "Invalid Roll No or Phone (roll no format: 22N71A6655, phone must be 10 digits)" });
    return;
  }
  setStatusMsg(null);
  setRegStep('camera');
};

export const performRegistration = async ({ data, docId, db, setStatusMsg, setRegName, setRegId, setRegPhone, setRegEmail, setUploadedImgSrc, setRegStep, setOverwriteModal, setLoading }) => {
  setLoading(true);
  try {
    if (docId) {
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'students', docId), data);
      setStatusMsg({ type: 'success', text: `Updated profile for ${data.name}` });
    } else {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'students'), data);
      setStatusMsg({ type: 'success', text: `Student ${data.name} registered successfully` });
    }
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
