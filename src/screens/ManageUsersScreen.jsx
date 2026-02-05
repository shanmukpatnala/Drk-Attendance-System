import React from 'react';
import { UserPlus, AlertTriangle } from 'lucide-react';

export function ManageUsersScreen({
  newUserFirstName,
  setNewUserFirstName,
  newUserLastName,
  setNewUserLastName,
  newUserUser,
  setNewUserUser,
  newUserEmail,
  setNewUserEmail,
  newUserDept,
  setNewUserDept,
  newUserDesignation,
  setNewUserDesignation,
  newUserPass,
  setNewUserPass,
  newUserConfirmPass,
  setNewUserConfirmPass,
  loading,
  handleCreateStaff,
  setView,
}) {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white p-4 rounded-xl shadow border">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold flex items-center"><UserPlus className="w-5 h-5 mr-2 text-blue-700" /> Add Staff Member</h2>
          <button onClick={() => setView('profile')} className="px-3 py-2 border rounded text-sm">Back</button>
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input type="text" className="w-full p-3 border rounded-lg" value={newUserFirstName} onChange={e => setNewUserFirstName(e.target.value)} placeholder="First Name" />
            <input type="text" className="w-full p-3 border rounded-lg" value={newUserLastName} onChange={e => setNewUserLastName(e.target.value)} placeholder="Last Name" />
          </div>

          <input type="text" className="w-full p-3 border rounded-lg" value={newUserUser} onChange={e => setNewUserUser(e.target.value.toLowerCase())} placeholder="Username" />
          <input type="email" className="w-full p-3 border rounded-lg" value={newUserEmail} onChange={e => setNewUserEmail(e.target.value)} placeholder="Email" />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <select className="w-full p-3 border rounded-lg" value={newUserDept} onChange={e => setNewUserDept(e.target.value)}>
              <option value="CSE">CSE</option><option value="CSM">CSM</option><option value="CSD">CSD</option><option value="CSC">CSC</option><option value="ECE">ECE</option><option value="EEE">EEE</option><option value="MECH">MECH</option><option value="CIVIL">CIVIL</option>
            </select>
            <select className="w-full p-3 border rounded-lg" value={newUserDesignation} onChange={e => setNewUserDesignation(e.target.value)}>
              <option value="Faculty">Faculty</option>
              <option value="HOD">HOD</option>
              <option value="Principal">Principal</option>
              <option value="Admin">Admin</option>
            </select>
          </div>

          <input type="password" className="w-full p-3 border rounded-lg" value={newUserPass} onChange={e => setNewUserPass(e.target.value)} placeholder="Password (min 8 chars)" />
          <input type="password" className="w-full p-3 border rounded-lg" value={newUserConfirmPass} onChange={e => setNewUserConfirmPass(e.target.value)} placeholder="Confirm Password" />

          <button onClick={handleCreateStaff} disabled={loading} className="w-full bg-green-600 text-white py-3 rounded-lg font-bold">
            {loading ? 'Creating...' : 'Create Staff Member'}
          </button>
        </div>
      </div>
    </div>
  );
}
