import React, { useEffect, useRef, useState } from 'react';
import { X, User, Camera, Save, AlertCircle, Square } from 'lucide-react';
import { isValidRollNo, sanitizeRollNoInput } from '../utils/helpers';

export function UnidentifiedFaceModal({ isOpen, onClose, onEndSession, facePhoto, onRegister }) {
  const [name, setName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [branch, setBranch] = useState('CSE');
  const [year, setYear] = useState('1st');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const nameInputRef = useRef(null);

  useEffect(() => {
    if (isOpen && nameInputRef.current) {
      setTimeout(() => nameInputRef.current.focus(), 100);
    }
    setErrors({});
  }, [isOpen]);

  const validateForm = () => {
    const newErrors = {};

    if (!name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!studentId.trim()) {
      newErrors.studentId = 'Roll No is required';
    } else if (!isValidRollNo(studentId)) {
      newErrors.studentId = 'Invalid format. Use 22N71A6655, with letters in positions 3 and 6';
    }

    if (!phone.trim()) {
      newErrors.phone = 'Phone is required';
    } else if (!/^\d{10}$/.test(phone)) {
      newErrors.phone = 'Phone must be 10 digits';
    }

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Invalid email format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      await onRegister({
        name: name.trim(),
        studentId: studentId.trim(),
        branch,
        year,
        phone: phone.trim(),
        email: email.trim(),
        facePhoto
      });

      setName('');
      setStudentId('');
      setPhone('');
      setEmail('');
      setBranch('CSE');
      setYear('1st');
      setErrors({});
      onClose();
    } catch (error) {
      console.error('Registration error:', error);
      setErrors({ submit: error.message || 'Failed to register this person.' });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/70 p-3 backdrop-blur-sm sm:p-5">
      <div className="max-h-[92vh] w-full max-w-4xl overflow-hidden rounded-[28px] border border-white/10 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-4 sm:px-6">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-black text-slate-900 sm:text-xl">
              <User className="h-5 w-5" />
              Register Unidentified Person
            </h2>
            <p className="mt-1 text-xs text-slate-500">Quick add the person and continue attendance without leaving the scanner.</p>
          </div>
          <button onClick={onClose} className="rounded-full p-2 transition hover:bg-white" disabled={loading}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[calc(92vh-78px)] overflow-y-auto">
          <div className="grid gap-0 lg:grid-cols-[320px_minmax(0,1fr)]">
            <div className="border-b border-slate-200 bg-slate-900 p-5 text-white lg:border-b-0 lg:border-r">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-100">
                <Camera className="h-4 w-4" />
                Captured Face
              </div>
              <img
                src={facePhoto}
                alt="Captured face"
                className="h-72 w-full rounded-2xl object-cover shadow-lg [transform:scaleX(-1)] lg:h-[22rem]"
              />
              <div className="mt-4 rounded-2xl border border-white/10 bg-white/10 p-3 text-xs text-slate-200">
                Use this only when the face is not found automatically in the database.
              </div>
            </div>

            <div className="p-5 sm:p-6">
              {errors.submit && (
                <div className="mb-4 flex gap-2 rounded-2xl border border-red-200 bg-red-50 p-3">
                  <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
                  <span className="text-sm text-red-700">{errors.submit}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-sm font-medium">Name *</label>
                    <input
                      ref={nameInputRef}
                      type="text"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value.toUpperCase());
                        if (errors.name) setErrors({ ...errors, name: '' });
                      }}
                      className={`w-full rounded-2xl border px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-blue-500 ${
                        errors.name ? 'border-red-500 bg-red-50' : 'border-slate-300'
                      }`}
                      placeholder="Enter full name"
                      disabled={loading}
                    />
                    {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
                  </div>

                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-sm font-medium">Roll No *</label>
                    <input
                      type="text"
                      value={studentId}
                      onChange={(e) => {
                        const val = sanitizeRollNoInput(e.target.value);
                        setStudentId(val);
                        if (errors.studentId) setErrors({ ...errors, studentId: '' });
                      }}
                      className={`w-full rounded-2xl border px-4 py-3 font-mono focus:border-transparent focus:ring-2 focus:ring-blue-500 ${
                        errors.studentId ? 'border-red-500 bg-red-50' : 'border-slate-300'
                      }`}
                      placeholder="22N71A6655"
                      maxLength="10"
                      disabled={loading}
                    />
                    {errors.studentId && <p className="mt-1 text-xs text-red-600">{errors.studentId}</p>}
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium">Branch</label>
                    <select
                      value={branch}
                      onChange={(e) => setBranch(e.target.value)}
                      className="w-full rounded-2xl border border-slate-300 px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                      disabled={loading}
                    >
                      <option value="CSE">CSE</option>
                      <option value="CSM">CSM</option>
                      <option value="CSD">CSD</option>
                      <option value="CSC">CSC</option>
                      <option value="ECE">ECE</option>
                      <option value="EEE">EEE</option>
                      <option value="MECH">MECH</option>
                      <option value="CIVIL">CIVIL</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium">Year</label>
                    <select
                      value={year}
                      onChange={(e) => setYear(e.target.value)}
                      className="w-full rounded-2xl border border-slate-300 px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                      disabled={loading}
                    >
                      <option value="1st">1st Year</option>
                      <option value="2nd">2nd Year</option>
                      <option value="3rd">3rd Year</option>
                      <option value="4th">4th Year</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium">Phone *</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                        setPhone(val);
                        if (errors.phone) setErrors({ ...errors, phone: '' });
                      }}
                      className={`w-full rounded-2xl border px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-blue-500 ${
                        errors.phone ? 'border-red-500 bg-red-50' : 'border-slate-300'
                      }`}
                      placeholder="10-digit mobile number"
                      maxLength="10"
                      disabled={loading}
                    />
                    {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone}</p>}
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium">Email *</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (errors.email) setErrors({ ...errors, email: '' });
                      }}
                      className={`w-full rounded-2xl border px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-blue-500 ${
                        errors.email ? 'border-red-500 bg-red-50' : 'border-slate-300'
                      }`}
                      placeholder="student@example.com"
                      disabled={loading}
                    />
                    {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
                  </div>
                </div>

                <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={loading}
                    className="rounded-2xl border border-slate-300 px-5 py-3 font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Skip For Now
                  </button>
                  <button
                    type="button"
                    onClick={onEndSession}
                    disabled={loading}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-red-300 px-5 py-3 font-medium text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Square className="h-4 w-4" />
                    End Session
                  </button>
                  <button
                    type="submit"
                    disabled={loading || Object.keys(errors).length > 0}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                        Registering...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Register
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
