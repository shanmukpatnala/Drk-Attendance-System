import React from 'react';
import { User, LogOut } from 'lucide-react';

export function ProfileScreen({
  appUser,
  profileEditMode,
  setProfileEditMode,
  profileEmail,
  setProfileEmail,
  profilePhone,
  setProfilePhone,
  profileDept,
  setProfileDept,
  profilePhotoPreview,
  handleProfilePhotoChange,
  handleSaveProfile,
  handleCancelProfileEdit,
  handleLogout,
  setView,
}) {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-red-900 text-white rounded-3xl p-6 shadow flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">
          {profilePhotoPreview ? <img src={profilePhotoPreview} alt="Profile" className="w-full h-full object-cover rounded-full" /> : <User className="w-6 h-6" />}
        </div>
        <div className="flex-1">
          <h2 className="font-bold text-xl">{appUser.name}</h2>
          <div className="text-sm uppercase">{appUser.role}</div>
        </div>
        <button onClick={handleLogout} className="bg-red-800 px-3 py-2 rounded text-white">Logout</button>
      </div>

      <div className="bg-white p-4 rounded-xl shadow border">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-semibold text-slate-600">Faculty Details</h3>
          {!profileEditMode && <button onClick={() => setProfileEditMode(true)} className="text-blue-600">Edit Profile</button>}
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
          <div className="mt-3">
            <div className="text-xs text-slate-400 mb-1">Profile Photo</div>
            <input type="file" accept="image/*" onChange={handleProfilePhotoChange} />
            <div className="flex gap-3 mt-3">
              <button onClick={handleSaveProfile} className="bg-blue-600 text-white px-4 py-2 rounded">Save Changes</button>
              <button onClick={handleCancelProfileEdit} className="border px-4 py-2 rounded">Cancel</button>
            </div>
          </div>
        )}
      </div>

      {(['admin', 'principal', 'hod'].includes((appUser?.role || '').toLowerCase())) && (
        <div className="bg-white p-4 rounded-xl shadow border">
          <button onClick={() => setView('manage_users')} className="w-full bg-red-700 text-white py-3 rounded">Add Staff</button>
        </div>
      )}
    </div>
  );
}
