import React, { useEffect, useRef, useState } from 'react';
import { UserPlus, ImageIcon, ArrowLeft, AlertCircle, CheckCircle, RefreshCw, AlertTriangle, X, Camera } from 'lucide-react';
import { sanitizeRollNoInput } from '../utils/helpers';

export function RegistrationScreen({
  regMode,
  setRegMode,
  regName,
  setRegName,
  regId,
  setRegId,
  regBranch,
  setRegBranch,
  regYear,
  setRegYear,
  regPhone,
  setRegPhone,
  regEmail,
  setRegEmail,
  uploadedImgSrc,
  videoRef,
  cameraStreamActive,
  imgRef,
  loading,
  handleCheckAndRegister,
  handleFileChange,
  toggleCameraFacing,
  handleBack,
  registrationEditStudent,
  handleSaveStudentEdits,
  registrationMessage,
  duplicateRollNoMessage,
  clearRegistrationMessage,
}) {
  const uploadInputRef = useRef(null);
  const galleryPendingRef = useRef(false);
  const [galleryPickerActive, setGalleryPickerActive] = useState(false);

  const handleRegIdChange = (e) => {
    setRegId(sanitizeRollNoInput(e.target.value));
  };

  const hasRequiredDetails = Boolean(regName && regId && regPhone && regEmail);
  const hasSelectedSource = regMode === 'live' || regMode === 'upload';
  const isUploadMode = regMode === 'upload';
  const canSaveProfile = hasRequiredDetails && hasSelectedSource && (isUploadMode ? Boolean(uploadedImgSrc) : true) && !loading;
  const MessageIcon = registrationMessage ? ({
    error: AlertCircle,
    warning: AlertTriangle,
    success: CheckCircle,
    info: RefreshCw
  }[registrationMessage.type] || AlertCircle) : null;
  const messageClasses = registrationMessage ? ({
    error: 'border-red-200 bg-red-50 text-red-700',
    warning: 'border-yellow-200 bg-yellow-50 text-yellow-700',
    success: 'border-green-200 bg-green-50 text-green-700',
    info: 'border-sky-200 bg-sky-50 text-sky-700'
  }[registrationMessage.type] || 'border-slate-200 bg-slate-50 text-slate-700') : '';

  useEffect(() => {
    if (regMode === 'upload' && !uploadedImgSrc && uploadInputRef.current) {
      galleryPendingRef.current = true;
      setGalleryPickerActive(true);
      uploadInputRef.current.click();
    }
  }, [regMode, uploadedImgSrc]);

  useEffect(() => {
    if (!galleryPickerActive) return undefined;

    const handleWindowFocus = () => {
      window.setTimeout(() => {
        if (!galleryPendingRef.current) return;

        const selectedFileCount = uploadInputRef.current?.files?.length || 0;
        if (selectedFileCount === 0) {
          setRegMode('none');
        }

        galleryPendingRef.current = false;
        setGalleryPickerActive(false);
      }, 250);
    };

    window.addEventListener('focus', handleWindowFocus);
    return () => window.removeEventListener('focus', handleWindowFocus);
  }, [galleryPickerActive, setRegMode]);

  const handleGalleryFileChange = (event) => {
    galleryPendingRef.current = false;
    setGalleryPickerActive(false);
    handleFileChange(event);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 sm:gap-8">
      <div className="lg:w-1/2 space-y-4">
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-red-200 hover:text-red-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <div className="relative bg-slate-900 rounded-xl overflow-hidden shadow-lg aspect-video border-4 border-slate-200 flex items-center justify-center">
          {regMode === 'live' ? (
            <>
              <video ref={videoRef} autoPlay muted className="w-full h-full object-cover" />
              {!cameraStreamActive && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/90 px-6 text-center">
                  <Camera className="mb-3 h-10 w-10 text-slate-300" />
                  <p className="text-lg font-semibold text-white">Camera is off</p>
                  <p className="mt-2 text-sm text-slate-300">Choose camera again when you want to continue.</p>
                </div>
              )}
              <button onClick={toggleCameraFacing} className="absolute top-3 right-3 bg-black/40 text-white text-xs px-3 py-1 rounded-full">
                Switch Camera
              </button>
            </>
          ) : regMode === 'upload' ? (
            <div className="w-full h-full flex items-center justify-center bg-slate-800">
              {uploadedImgSrc ? (
                <img ref={imgRef} src={uploadedImgSrc} className="h-full object-contain" alt="Preview" />
              ) : (
                <div className="flex flex-col items-center justify-center h-full w-full">
                  <ImageIcon className="w-10 h-10 mb-2 text-slate-400" />
                  <span className="text-xs text-slate-400 font-semibold">Opening gallery...</span>
                  <input ref={uploadInputRef} type="file" accept="image/*" className="hidden" onChange={handleGalleryFileChange} />
                </div>
              )}
            </div>
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center bg-slate-50 p-6 text-center">
              {!hasRequiredDetails ? (
                <>
                  <UserPlus className="mb-3 h-12 w-12 text-slate-400" />
                  <p className="text-lg font-semibold text-slate-700">Fill all details first</p>
                  <p className="mt-2 text-sm text-slate-500">After that, choose how you want to add the face photo.</p>
                </>
              ) : (
                <>
                  <p className="text-lg font-semibold text-slate-800">Choose Photo Source</p>
                  <p className="mt-2 text-sm text-slate-500">Select one option to continue registration.</p>
                  <div className="mt-6 grid w-full max-w-sm gap-4 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => setRegMode('live')}
                      className="flex items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 font-semibold text-slate-800 shadow-sm transition hover:border-red-300 hover:text-red-700"
                    >
                      <Camera className="h-5 w-5" />
                      Camera
                    </button>
                    <button
                      type="button"
                      className="flex cursor-pointer items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 font-semibold text-slate-800 shadow-sm transition hover:border-red-300 hover:text-red-700"
                      onClick={() => setRegMode('upload')}
                    >
                      <ImageIcon className="h-5 w-5" />
                      Gallery
                    </button>
                    <input
                      ref={uploadInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleGalleryFileChange}
                    />
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="lg:w-1/2 bg-white p-5 rounded-xl shadow border border-slate-200">
        <h2 className="text-xl font-bold mb-4 flex items-center">
          <UserPlus className="w-5 h-5 mr-2 text-red-700" />
          {registrationEditStudent ? 'Edit Student Details' : 'New Registration'}
        </h2>

        <div className="space-y-3">
          {registrationMessage && (
            <div className={`flex items-start gap-2 rounded-lg border p-3 text-sm ${messageClasses}`}>
              {MessageIcon && <MessageIcon className="mt-0.5 h-4 w-4 flex-shrink-0" />}
              <span className="flex-1">{registrationMessage.text}</span>
              <button type="button" onClick={clearRegistrationMessage} className="flex-shrink-0">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          <div>
            <input
              type="text"
              maxLength={10}
              className={`w-full rounded-lg border p-3 uppercase ${duplicateRollNoMessage ? 'border-red-300 bg-red-50/40' : ''}`}
              value={regId}
              onChange={handleRegIdChange}
              placeholder="22N71A6655"
            />
            {duplicateRollNoMessage && (
              <p className="mt-1 text-sm text-red-600">{duplicateRollNoMessage}</p>
            )}
          </div>
          <input type="text" className="w-full p-3 border rounded-lg" value={regName} onChange={e => setRegName(e.target.value.toUpperCase())} placeholder="Full Name" />
          <div className="grid grid-cols-2 gap-4">
            <select className="w-full p-3 border rounded-lg" value={regBranch} onChange={e => setRegBranch(e.target.value)}>
              <option>CSE</option><option>CSM</option><option>CSD</option><option>CSC</option><option>ECE</option><option>EEE</option><option>MECH</option><option>CIVIL</option>
            </select>
            <select className="w-full p-3 border rounded-lg" value={regYear} onChange={e => setRegYear(e.target.value)}>
              <option>1st</option><option>2nd</option><option>3rd</option><option>4th</option>
            </select>
          </div>
          <input type="tel" maxLength={10} className="w-full p-3 border rounded-lg" value={regPhone} onChange={e => setRegPhone(e.target.value.replace(/\D/g, ''))} placeholder="Phone Number" />
          <input type="email" className="w-full p-3 border rounded-lg" value={regEmail} onChange={e => setRegEmail(e.target.value)} placeholder="Email" />

          {registrationEditStudent ? (
            <div className="flex gap-3">
              <button onClick={handleBack} className="flex-1 border py-3 rounded-lg">Cancel</button>
              <button onClick={handleSaveStudentEdits} disabled={loading} className="flex-1 bg-green-600 text-white py-3 rounded-lg font-bold">
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          ) : (
            <button
              onClick={() => handleCheckAndRegister()}
              disabled={!canSaveProfile}
              className={`w-full py-3 rounded-lg font-bold text-white ${canSaveProfile ? 'bg-green-600' : 'bg-slate-300 cursor-not-allowed'}`}
            >
              {loading ? 'Saving...' : 'Save Profile'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
