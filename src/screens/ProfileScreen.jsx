import React, { useRef } from 'react';
import { ArrowLeft, Camera, Image as ImageIcon, Pencil, User, X } from 'lucide-react';

export function ProfileScreen({
  appUser,
  profileEditMode,
  profileEmail,
  setProfileEmail,
  profilePhone,
  setProfilePhone,
  profileDept,
  setProfileDept,
  profilePhotoPreview,
  handleProfilePhotoChange,
  handleOpenProfilePhotoActions,
  showProfilePhotoActions,
  setShowProfilePhotoActions,
  handleRemoveProfilePhoto,
  handleSaveProfile,
  handleCancelProfileEdit,
  handleBack,
}) {
  const galleryInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <button
        type="button"
        onClick={handleBack}
        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-red-200 hover:text-red-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      <div className="bg-red-900 text-white rounded-3xl p-6 shadow flex items-center gap-4">
        <button
          type="button"
          onClick={handleOpenProfilePhotoActions}
          className="relative h-16 w-16 overflow-hidden rounded-full bg-white/20 ring-2 ring-white/20"
          title="Change profile photo"
        >
          {profilePhotoPreview ? (
            <img src={profilePhotoPreview} alt="Profile" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <User className="w-7 h-7" />
            </div>
          )}
          <span className="absolute bottom-0 right-0 rounded-full bg-white p-1 text-red-700 shadow">
            <Pencil className="h-3 w-3" />
          </span>
        </button>
        <div className="flex-1">
          <h2 className="font-bold text-xl">{appUser.name}</h2>
          <div className="text-sm uppercase">{appUser.role}</div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow border">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-semibold text-slate-600">Faculty Details</h3>
          {profileEditMode && (
            <div className="text-xs text-slate-500">Photo is auto-cropped to a square preview.</div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div><div className="text-xs text-slate-400">Name</div><div className="font-medium">{appUser.name}</div></div>
          <div><div className="text-xs text-slate-400">Username</div><div className="font-medium">{appUser.username}</div></div>
          <div><div className="text-xs text-slate-400">Role</div><div className="font-medium">{appUser.role}</div></div>
          <div>
            <div className="text-xs text-slate-400">Department</div>
            {profileEditMode ? (
              <select className="w-full p-2 border rounded" value={profileDept} onChange={e => setProfileDept(e.target.value)}>
                <option value="">Select Department</option>
                <option value="CSE">CSE</option><option value="CSM">CSM</option><option value="CSD">CSD</option><option value="CSC">CSC</option><option value="ECE">ECE</option><option value="EEE">EEE</option><option value="MECH">MECH</option><option value="CIVIL">CIVIL</option>
              </select>
            ) : <div className="font-medium">{appUser.department || 'N/A'}</div>}
          </div>
          <div>
            <div className="text-xs text-slate-400">Email</div>
            {profileEditMode ? <input value={profileEmail} onChange={e => setProfileEmail(e.target.value)} className="w-full p-2 border rounded" /> : <div className="font-medium break-all">{appUser.email || 'Not linked'}</div>}
          </div>
          <div>
            <div className="text-xs text-slate-400">Phone</div>
            {profileEditMode ? <input value={profilePhone} onChange={e => setProfilePhone(e.target.value)} className="w-full p-2 border rounded" /> : <div className="font-medium">{appUser.phone || 'N/A'}</div>}
          </div>
        </div>

        {profileEditMode && (
          <div className="flex gap-3 mt-5">
            <button onClick={handleSaveProfile} className="bg-blue-600 text-white px-4 py-2 rounded">Save Changes</button>
            <button onClick={handleCancelProfileEdit} className="border px-4 py-2 rounded">Cancel</button>
          </div>
        )}
      </div>

      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleProfilePhotoChange}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="user"
        className="hidden"
        onChange={handleProfilePhotoChange}
      />

      {showProfilePhotoActions && (
        <div className="fixed inset-0 z-[180] flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center border-b p-4">
              <h3 className="font-bold text-slate-900">Profile Photo</h3>
              <button onClick={() => setShowProfilePhotoActions(false)} className="ml-auto text-slate-500">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-2 p-4">
              <button
                type="button"
                onClick={() => {
                  setShowProfilePhotoActions(false);
                  cameraInputRef.current?.click();
                }}
                className="flex w-full items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-left text-sm font-medium text-slate-700 transition hover:border-red-200 hover:text-red-700"
              >
                <Camera className="h-5 w-5" />
                Camera
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowProfilePhotoActions(false);
                  galleryInputRef.current?.click();
                }}
                className="flex w-full items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-left text-sm font-medium text-slate-700 transition hover:border-red-200 hover:text-red-700"
              >
                <ImageIcon className="h-5 w-5" />
                Gallery
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowProfilePhotoActions(false);
                  handleRemoveProfilePhoto();
                }}
                className="flex w-full items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-left text-sm font-medium text-slate-700 transition hover:border-red-200 hover:text-red-700"
              >
                <Pencil className="h-5 w-5" />
                Remove Photo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
