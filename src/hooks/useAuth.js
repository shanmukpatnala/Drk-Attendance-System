import { useState } from 'react';
import { auth, signInAnonymously, onAuthStateChanged, collection, query, where, getDocs } from '../utils/firebase';
import { hashPassword } from '../utils/helpers';

export function useAuth() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [forgotPasswordMode, setForgotPasswordMode] = useState(false);
  const [fpStep, setFpStep] = useState(0);
  const [fpEmail, setFpEmail] = useState('');
  const [resetTokenStatus, setResetTokenStatus] = useState('');

  // Initialize auth listener
  const initializeAuth = (onUserChange) => {
    onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      onUserChange?.(user);
    });
  };

  // Anonymous sign-in
  const performAnonymousSignIn = async () => {
    try {
      const result = await signInAnonymously(auth);
      return result.user;
    } catch (error) {
      console.error('Anonymous sign-in error:', error);
      throw error;
    }
  };

  // Verify login credentials
  const performLogin = async (email, password, userCollection) => {
    try {
      const hashedPass = await hashPassword(password);
      const q = query(userCollection, where('email', '==', email), where('password', '==', hashedPass));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        throw new Error('Invalid email or password');
      }

      return snapshot.docs[0].data();
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  // Reset form fields
  const resetLoginForm = () => {
    setLoginUser('');
    setLoginPass('');
    setForgotPasswordMode(false);
    setFpStep(0);
    setFpEmail('');
    setResetTokenStatus('');
  };

  // Handle forgot password
  const handleForgotPassword = async (email, userCollection) => {
    try {
      setFpStep(1);
      const q = query(userCollection, where('email', '==', email));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        setResetTokenStatus('Email not found');
        return false;
      }

      setFpEmail(email);
      setResetTokenStatus('Answer the security question to reset password');
      return snapshot.docs[0].data();
    } catch (error) {
      console.error('Forgot password error:', error);
      setResetTokenStatus('Error: ' + error.message);
      return false;
    }
  };

  return {
    currentUser,
    setCurrentUser,
    loginUser,
    setLoginUser,
    loginPass,
    setLoginPass,
    forgotPasswordMode,
    setForgotPasswordMode,
    fpStep,
    setFpStep,
    fpEmail,
    setFpEmail,
    resetTokenStatus,
    setResetTokenStatus,
    initializeAuth,
    performAnonymousSignIn,
    performLogin,
    handleForgotPassword,
    resetLoginForm
  };
}
