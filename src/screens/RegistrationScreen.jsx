import React from 'react';
import { UserPlus, ImageIcon, ArrowRight } from 'lucide-react';

export function RegistrationScreen({
  regStep,
  setRegStep,
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
  imgRef,
  loading,
  handleProceedToCamera,
  handleCheckAndRegister,
  handleFileChange,
  toggleCameraFacing,
}) {
  return (
    <div className="flex flex-col lg:flex-row gap-6 sm:gap-8">
      <div className="lg:w-1/2 space-y-4">
        <div className="flex bg-slate-200 p-1 rounded-lg">
          <button
            onClick={() => setRegMode('live')}
            className={`flex-1 py-2 rounded-md ${regMode === 'live' ? 'bg-white text-red-700 shadow' : 'text-slate-500'}`}
          >
            Live Camera
          </button>
          <button
            onClick={() => setRegMode('upload')}
            className={`flex-1 py-2 rounded-md ${regMode === 'upload' ? 'bg-white text-red-700 shadow' : 'text-slate-500'}`}
          >
            Upload Photo
          </button>
        </div>

        <div className="relative bg-slate-900 rounded-xl overflow-hidden shadow-lg aspect-video border-4 border-slate-200 flex items-center justify-center">
          {regMode === 'live' ? (
            <>
              <video ref={videoRef} autoPlay muted className="w-full h-full object-cover" />
              {regStep === 'details' && (
                <div className="absolute inset-0 bg-slate-100/90 flex flex-col items-center justify-center z-10">
                  <UserPlus className="w-10 h-10 text-slate-400 mb-2" />
                  <p className="text-slate-600 font-semibold">Enter Details First</p>
                </div>
              )}
              {regStep === 'camera' && (
                <button onClick={toggleCameraFacing} className="absolute top-3 right-3 bg-black/40 text-white text-xs px-3 py-1 rounded-full">
                  Switch Camera
                </button>
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-slate-800">
              {uploadedImgSrc ? (
                <img ref={imgRef} src={uploadedImgSrc} className="h-full object-contain" alt="Preview" />
              ) : (
                <label className="cursor-pointer flex flex-col items-center justify-center h-full w-full hover:bg-slate-700 transition-colors">
                  <ImageIcon className="w-10 h-10 mb-2 text-slate-400" />
                  <span className="text-xs text-slate-400 font-semibold">Click to Upload Image</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                </label>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="lg:w-1/2 bg-white p-5 rounded-xl shadow border border-slate-200">
        <h2 className="text-xl font-bold mb-4 flex items-center">
          <UserPlus className="w-5 h-5 mr-2 text-red-700" /> New Registration
        </h2>

        <div className="space-y-3">
          <input type="text" maxLength={20} className="w-full p-3 border rounded-lg uppercase" value={regId} onChange={e => setRegId(e.target.value.toUpperCase())} placeholder="ID (e.g. 21CSE01001)" disabled={regStep === 'camera'} />
          <input type="text" className="w-full p-3 border rounded-lg" value={regName} onChange={e => setRegName(e.target.value)} placeholder="Full Name" disabled={regStep === 'camera'} />
          <div className="grid grid-cols-2 gap-4">
            <select className="w-full p-3 border rounded-lg" value={regBranch} onChange={e => setRegBranch(e.target.value)} disabled={regStep === 'camera'}>
              <option>CSE</option><option>CSM</option><option>CSD</option><option>CSC</option><option>ECE</option><option>EEE</option><option>MECH</option><option>CIVIL</option>
            </select>
            <select className="w-full p-3 border rounded-lg" value={regYear} onChange={e => setRegYear(e.target.value)} disabled={regStep === 'camera'}>
              <option>1st</option><option>2nd</option><option>3rd</option><option>4th</option>
            </select>
          </div>
          <input type="tel" maxLength={10} className="w-full p-3 border rounded-lg" value={regPhone} onChange={e => setRegPhone(e.target.value.replace(/\D/g, ''))} placeholder="Phone Number" disabled={regStep === 'camera'} />
          <input type="email" className="w-full p-3 border rounded-lg" value={regEmail} onChange={e => setRegEmail(e.target.value)} placeholder="Email" disabled={regStep === 'camera'} />

          {regStep === 'details' ? (
            <button onClick={handleProceedToCamera} className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold">Proceed to Camera <ArrowRight className="w-4 h-4 inline-block ml-2" /></button>
          ) : (
            <div className="flex gap-3">
              <button onClick={() => setRegStep('details')} className="flex-1 border py-2 rounded-lg">Edit Details</button>
              <button onClick={() => handleCheckAndRegister()} disabled={loading} className="flex-1 bg-green-600 text-white py-2 rounded-lg">{loading ? 'Saving...' : 'Save Profile'}</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
